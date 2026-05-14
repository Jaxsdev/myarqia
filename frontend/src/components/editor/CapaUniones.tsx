import { Shape } from 'react-konva'
import type { Muro, Puerta, Ventana } from '../../types'
import Konva from 'konva'
import { calcularCarasMuro } from './ElementoMuro'
import { TEMA_CLARO, TEMA_OSCURO } from '../../lib/temas'

interface Props {
    muros: Muro[]
    puertas: Puerta[]
    ventanas: Ventana[]
    zoom: number
    panX: number
    panY: number
    modoClaro: boolean
}

interface Vec2 { x: number; y: number }

const PX = 100
const ws = (m: number, pan: number, z: number) => m * PX * z + pan

function dist(a: Vec2, b: Vec2) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function intersLineas(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): Vec2 | null {
    const dax = a2.x - a1.x, day = a2.y - a1.y
    const dbx = b2.x - b1.x, dby = b2.y - b1.y
    const den = dax * dby - day * dbx
    if (Math.abs(den) < 0.01) return null
    const t = ((b1.x - a1.x) * dby - (b1.y - a1.y) * dbx) / den
    return { x: a1.x + t * dax, y: a1.y + t * day }
}

// ¿El punto p cae sobre el INTERIOR (no extremos) del segmento a-b dentro de tol?
// Devuelve true si la proyección está entre [margen, 1-margen] del segmento y la
// distancia perpendicular es menor que tol. Excluir los extremos evita conflicto
// con la lógica de mitra para esquinas (que ya cubre extremo-con-extremo).
function puntoEnSegmentoInterior(p: Vec2, a: Vec2, b: Vec2, tol: number): boolean {
    const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
    if (l2 < 1) return false
    const t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2
    if (t < 0.05 || t > 0.95) return false
    const px = a.x + t * (b.x - a.x)
    const py = a.y + t * (b.y - a.y)
    return Math.sqrt((p.x - px) ** 2 + (p.y - py) ** 2) < tol
}

// Umbral en píxeles de pantalla para detección de uniones — se recalcula en cada render
// como 0.10m * PX * zoom para mantenerse constante en el espacio del mundo
function umbralPx(zoom: number) { return 0.10 * PX * zoom }

// Proyecta el punto p sobre el segmento a-b y devuelve el parámetro t (sin clamp).
function proyectarT(p: Vec2, a: Vec2, b: Vec2): number {
    const dx = b.x - a.x, dy = b.y - a.y
    const l2 = dx * dx + dy * dy
    if (l2 < 1e-6) return 0
    return ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2
}

// Dibuja el segmento a-b en el contexto, omitiendo los rangos [t1,t2] indicados
// en `gaps`. Se usa para "abrir" la cara de un muro donde llega otro en T.
function trazarCaraConGaps(
    raw: CanvasRenderingContext2D,
    a: Vec2, b: Vec2,
    gaps: [number, number][],
) {
    const pt = (t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
    if (gaps.length === 0) {
        raw.moveTo(a.x, a.y)
        raw.lineTo(b.x, b.y)
        return
    }
    // Fusionar gaps solapados
    const ord = [...gaps].map((g) => [Math.max(0, g[0]), Math.min(1, g[1])] as [number, number])
        .filter((g) => g[1] > g[0])
        .sort((x, y) => x[0] - y[0])
    const fusion: [number, number][] = []
    for (const g of ord) {
        const ultimo = fusion[fusion.length - 1]
        if (ultimo && g[0] <= ultimo[1]) {
            ultimo[1] = Math.max(ultimo[1], g[1])
        } else {
            fusion.push([...g])
        }
    }
    let cursor = 0
    for (const [t1, t2] of fusion) {
        if (t1 > cursor) {
            const s = pt(cursor), e = pt(t1)
            raw.moveTo(s.x, s.y)
            raw.lineTo(e.x, e.y)
        }
        cursor = Math.max(cursor, t2)
    }
    if (cursor < 1) {
        const s = pt(cursor)
        raw.moveTo(s.x, s.y)
        raw.lineTo(b.x, b.y)
    }
}

export default function CapaUniones({ muros, puertas, ventanas, zoom, panX, panY, modoClaro }: Props) {
    if (muros.length === 0) return null
    const tema = modoClaro ? TEMA_CLARO : TEMA_OSCURO

    return (
        <Shape
            listening={false}
            sceneFunc={(_ctx: Konva.Context, _shape: Konva.Shape) => {
                // Usar _ctx._context para que funcione tanto en pantalla como en exportación PDF
                // NO usar shape.getLayer().getCanvas() — ese solo dibuja en el canvas en vivo
                const raw = (_ctx as unknown as { _context: CanvasRenderingContext2D })._context
                if (!raw) return

                const caras = muros.map((m) => calcularCarasMuro(m, zoom, panX, panY))
                const UMBRAL = umbralPx(zoom)

                // Calcular polígonos ajustados con intersecciones en mitra
                const polys = muros.map((_muro, i) => {
                    const c = caras[i]
                    if (!c) return null

                    let p1 = { ...c.p1 }
                    let p2 = { ...c.p2 }
                    let p3 = { ...c.p3 }
                    let p4 = { ...c.p4 }

                    const ini = { x: c.sx1, y: c.sy1 }
                    const fin = { x: c.sx2, y: c.sy2 }

                    muros.forEach((_, j) => {
                        if (i === j) return
                        const co = caras[j]
                        if (!co) return

                        const oIni = { x: co.sx1, y: co.sy1 }
                        const oFin = { x: co.sx2, y: co.sy2 }

                        // Trigger de unión: extremo-con-extremo (L) o extremo-sobre-interior (T).
                        // El segundo caso es la T-junction — el extremo de "i" cae sobre la
                        // línea media de "j" y debemos extender las caras de i hasta tocar
                        // las caras de j.
                        const iniConectaJ =
                            dist(ini, oIni) < UMBRAL || dist(ini, oFin) < UMBRAL ||
                            puntoEnSegmentoInterior(ini, oIni, oFin, UMBRAL)
                        const finConectaJ =
                            dist(fin, oIni) < UMBRAL || dist(fin, oFin) < UMBRAL ||
                            puntoEnSegmentoInterior(fin, oIni, oFin, UMBRAL)

                        if (iniConectaJ) {
                            const np = intersLineas(
                                c.cara_pos_a, c.cara_pos_b,
                                co.cara_pos_a, co.cara_pos_b
                            ) || intersLineas(
                                c.cara_pos_a, c.cara_pos_b,
                                co.cara_neg_a, co.cara_neg_b
                            )
                            const nn = intersLineas(
                                c.cara_neg_a, c.cara_neg_b,
                                co.cara_neg_a, co.cara_neg_b
                            ) || intersLineas(
                                c.cara_neg_a, c.cara_neg_b,
                                co.cara_pos_a, co.cara_pos_b
                            )
                            if (np && dist(np, ini) < c.ep * 6) p1 = np
                            if (nn && dist(nn, ini) < c.ep * 6) p4 = nn
                        }

                        if (finConectaJ) {
                            const np = intersLineas(
                                c.cara_pos_a, c.cara_pos_b,
                                co.cara_pos_a, co.cara_pos_b
                            ) || intersLineas(
                                c.cara_pos_a, c.cara_pos_b,
                                co.cara_neg_a, co.cara_neg_b
                            )
                            const nn = intersLineas(
                                c.cara_neg_a, c.cara_neg_b,
                                co.cara_neg_a, co.cara_neg_b
                            ) || intersLineas(
                                c.cara_neg_a, c.cara_neg_b,
                                co.cara_pos_a, co.cara_pos_b
                            )
                            if (np && dist(np, fin) < c.ep * 6) p2 = np
                            if (nn && dist(nn, fin) < c.ep * 6) p3 = nn
                        }
                    })

                    return { p1, p2, p3, p4 }
                })

                raw.save()
                raw.lineCap = 'square'
                raw.lineJoin = 'miter'

                // 1 — Rellenos
                polys.forEach((poly, i) => {
                    if (!poly) return
                    
                    // Si el muro tiene una puerta, no rellenamos el hueco (simplificado para MVP)
                    // En una versión más avanzada segmentaríamos el relleno también
                    
                    raw.beginPath()
                    raw.moveTo(poly.p1.x, poly.p1.y)
                    raw.lineTo(poly.p2.x, poly.p2.y)
                    raw.lineTo(poly.p3.x, poly.p3.y)
                    raw.lineTo(poly.p4.x, poly.p4.y)
                    raw.closePath()
                    raw.fillStyle = tema.muroRelleno
                    raw.fill()
                    
                    // Si hay puertas/ventanas, "limpiamos" el hueco
                    const aberturasMuro = [
                        ...puertas.filter(p => p.muro_id === muros[i].id).map(p => ({ x: p.x, y: p.y, ancho: p.ancho })),
                        ...ventanas.filter(v => v.muro_id === muros[i].id).map(v => ({ x: v.x, y: v.y, ancho: v.ancho }))
                    ]

                    aberturasMuro.forEach(ab => {
                        const m = muros[i]
                        const ang = Math.atan2(m.y2 - m.y1, m.x2 - m.x1)
                        const ax = ws(ab.x, panX, zoom)
                        const ay = ws(ab.y, panY, zoom)
                        const wPx = ab.ancho * PX * zoom
                        const hPx = (m.espesor + 0.1) * PX * zoom // Un poco más ancho que el muro para asegurar el corte
                        
                        raw.save()
                        raw.globalCompositeOperation = 'destination-out'
                        raw.translate(ax, ay)
                        raw.rotate(ang)
                        raw.beginPath()
                        raw.rect(-wPx / 2, -hPx / 2, wPx, hPx)
                        raw.fill()
                        raw.restore()
                    })
                })

                // 2 — Contornos encima de todo
                polys.forEach((poly, i) => {
                    if (!poly) return
                    const c = caras[i]!
                    const ini = { x: c.sx1, y: c.sy1 }
                    const fin = { x: c.sx2, y: c.sy2 }

                    // Dirección del eje de i (línea original dibujada)
                    const iDx = fin.x - ini.x
                    const iDy = fin.y - ini.y

                    let iniConectado = false
                    let finConectado = false

                    // Aberturas en cada cara larga producidas por muros que llegan
                    // en T contra el interior de i. Rangos [t1,t2] en parámetro 0..1.
                    const gapsPos: [number, number][] = []
                    const gapsNeg: [number, number][] = []

                    muros.forEach((_, j) => {
                        if (i === j) return
                        const co = caras[j]
                        if (!co) return
                        const oIni = { x: co.sx1, y: co.sy1 }
                        const oFin = { x: co.sx2, y: co.sy2 }

                        // Conexión en esquina (L) o T-junction (extremo de i sobre interior de j)
                        if (
                            dist(ini, oIni) < UMBRAL || dist(ini, oFin) < UMBRAL ||
                            puntoEnSegmentoInterior(ini, oIni, oFin, UMBRAL)
                        ) iniConectado = true
                        if (
                            dist(fin, oIni) < UMBRAL || dist(fin, oFin) < UMBRAL ||
                            puntoEnSegmentoInterior(fin, oIni, oFin, UMBRAL)
                        ) finConectado = true

                        // T-junction inversa: ¿el extremo de j cae sobre el INTERIOR de i?
                        // Si sí, j llega en T contra i y debemos abrir un gap en la cara
                        // de i por la que j se aproxima.
                        let bLejano: Vec2 | null = null
                        if (puntoEnSegmentoInterior(oIni, ini, fin, UMBRAL)) {
                            bLejano = oFin
                        } else if (puntoEnSegmentoInterior(oFin, ini, fin, UMBRAL)) {
                            bLejano = oIni
                        }
                        if (bLejano) {
                            // Lado de i por el que llega j: signo del producto cruz
                            // entre el eje de i y el vector hacia el extremo lejano de j.
                            const cross = iDx * (bLejano.y - ini.y) - iDy * (bLejano.x - ini.x)
                            const caraA = cross > 0 ? poly.p1 : poly.p4
                            const caraB = cross > 0 ? poly.p2 : poly.p3
                            // Proyectar las 4 esquinas de j sobre esa cara de i
                            let tMin = Infinity, tMax = -Infinity
                            for (const e of [co.p1, co.p2, co.p3, co.p4]) {
                                const t = proyectarT(e, caraA, caraB)
                                if (t < tMin) tMin = t
                                if (t > tMax) tMax = t
                            }
                            const gap: [number, number] = [
                                Math.max(0, tMin),
                                Math.min(1, tMax),
                            ]
                            if (gap[1] > gap[0]) {
                                (cross > 0 ? gapsPos : gapsNeg).push(gap)
                            }
                        }
                    })

                    raw.beginPath()

                    // Cara lado + (p1 -> p2) con aberturas T
                    trazarCaraConGaps(raw, poly.p1, poly.p2, gapsPos)

                    // Tapa de FIN (p2 -> p3)
                    if (!finConectado) {
                        raw.moveTo(poly.p2.x, poly.p2.y)
                        raw.lineTo(poly.p3.x, poly.p3.y)
                    }

                    // Cara lado - (p4 -> p3) con aberturas T
                    trazarCaraConGaps(raw, poly.p4, poly.p3, gapsNeg)

                    // Tapa de INICIO (p4 -> p1)
                    if (!iniConectado) {
                        raw.moveTo(poly.p4.x, poly.p4.y)
                        raw.lineTo(poly.p1.x, poly.p1.y)
                    }

                    raw.strokeStyle = tema.muroBorde
                    raw.lineWidth = 1
                    raw.stroke()
                })

                raw.restore()
            }}
        />
    )
}