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

// Intersecta la recta a1-a2 contra varias rectas candidatas y devuelve la
// intersección MÁS CERCANA al punto de referencia `ref`, dentro de `maxDist`.
function mejorInterseccion(
    a1: Vec2, a2: Vec2,
    candidatos: [Vec2, Vec2][],
    ref: Vec2,
    maxDist: number,
): Vec2 | null {
    let best: Vec2 | null = null
    let bestD = maxDist
    for (const [b1, b2] of candidatos) {
        const p = intersLineas(a1, a2, b1, b2)
        if (!p) continue
        const d = dist(p, ref)
        if (d < bestD) { bestD = d; best = p }
    }
    return best
}

// Estructura mínima de las caras de un muro (subset de calcularCarasMuro).
export interface CarasMuro {
    cara_pos_a: Vec2; cara_pos_b: Vec2
    cara_neg_a: Vec2; cara_neg_b: Vec2
    sx1: number; sy1: number; sx2: number; sy2: number
    ep: number
}

// Ajusta los 4 vértices de un muro `c` por las uniones con los demás muros.
// Devuelve { p1, p2, p3, p4 } ya mitrados.
//
// Maneja L-junctions y T-junctions y es robusto frente a la orientación con
// que se dibujó cada muro:
//   - L-corner: empareja las caras según su "inner-ness" — si la normal de
//     la cara apunta hacia el cuerpo del otro muro. Así pos↔pos vs pos↔neg
//     se decide por geometría real, no por la etiqueta del lado.
//   - T-junction: ambas caras del muro que llega terminan en la MISMA cara
//     (la cercana) del muro atravesado.
export function ajustarPoligonoMuro(
    c: CarasMuro,
    otras: (CarasMuro | null)[],
    UMBRAL: number,
): { p1: Vec2; p2: Vec2; p3: Vec2; p4: Vec2 } {
    let p1 = { x: c.cara_pos_a.x, y: c.cara_pos_a.y }
    let p2 = { x: c.cara_pos_b.x, y: c.cara_pos_b.y }
    let p3 = { x: c.cara_neg_b.x, y: c.cara_neg_b.y }
    let p4 = { x: c.cara_neg_a.x, y: c.cara_neg_a.y }

    const ini = { x: c.sx1, y: c.sy1 }
    const fin = { x: c.sx2, y: c.sy2 }
    const iMid = { x: (c.sx1 + c.sx2) / 2, y: (c.sy1 + c.sy2) / 2 }
    const iPos: [Vec2, Vec2] = [c.cara_pos_a, c.cara_pos_b]
    const iNeg: [Vec2, Vec2] = [c.cara_neg_a, c.cara_neg_b]
    // Normal + de i (sin normalizar): perpendicular al eje
    const iNx = -(c.sy2 - c.sy1)
    const iNy = (c.sx2 - c.sx1)
    const limite = c.ep * 6

    const procesar = (extremo: Vec2, esIni: boolean) => {
        const lejano = esIni ? fin : ini

        for (const co of otras) {
            if (!co) continue
            const oIni = { x: co.sx1, y: co.sy1 }
            const oFin = { x: co.sx2, y: co.sy2 }
            const jPos: [Vec2, Vec2] = [co.cara_pos_a, co.cara_pos_b]
            const jNeg: [Vec2, Vec2] = [co.cara_neg_a, co.cara_neg_b]

            const esquina =
                dist(extremo, oIni) < UMBRAL || dist(extremo, oFin) < UMBRAL
            const esT = !esquina && puntoEnSegmentoInterior(extremo, oIni, oFin, UMBRAL)
            if (!esquina && !esT) continue

            let caraParaPos: [Vec2, Vec2]
            let caraParaNeg: [Vec2, Vec2]

            if (esT) {
                // T-junction: ambas caras de i terminan en la cara CERCANA de j.
                // El extremo lejano de i indica de qué lado del eje de j está
                // el cuerpo de i; esa es la cara cercana.
                const jdx = oFin.x - oIni.x
                const jdy = oFin.y - oIni.y
                // cross > 0 ⇒ lejano del lado +normal de j ⇒ cara cercana = jPos
                const cross = jdx * (lejano.y - oIni.y) - jdy * (lejano.x - oIni.x)
                caraParaPos = cross > 0 ? jPos : jNeg
                caraParaNeg = caraParaPos
            } else {
                // L-corner: emparejar por inner-ness.
                // i.cara_pos es "inner" si la normal+ de i apunta hacia el
                // cuerpo de j (su punto medio).
                const jMid = { x: (oIni.x + oFin.x) / 2, y: (oIni.y + oFin.y) / 2 }
                const dirIaJ = { x: jMid.x - extremo.x, y: jMid.y - extremo.y }
                const iPosInner = iNx * dirIaJ.x + iNy * dirIaJ.y > 0

                // j.cara_pos es "inner" si la normal+ de j apunta hacia el
                // cuerpo de i.
                const jNx = -(co.sy2 - co.sy1)
                const jNy = (co.sx2 - co.sx1)
                const dirJaI = { x: iMid.x - extremo.x, y: iMid.y - extremo.y }
                const jPosInner = jNx * dirJaI.x + jNy * dirJaI.y > 0

                const posVaConPos = iPosInner === jPosInner
                caraParaPos = posVaConPos ? jPos : jNeg
                caraParaNeg = posVaConPos ? jNeg : jPos
            }

            const nuevoPos = mejorInterseccion(iPos[0], iPos[1], [caraParaPos], extremo, limite)
            const nuevoNeg = mejorInterseccion(iNeg[0], iNeg[1], [caraParaNeg], extremo, limite)

            if (esIni) {
                if (nuevoPos) p1 = nuevoPos
                if (nuevoNeg) p4 = nuevoNeg
            } else {
                if (nuevoPos) p2 = nuevoPos
                if (nuevoNeg) p3 = nuevoNeg
            }
        }
    }

    procesar(ini, true)
    procesar(fin, false)

    return { p1, p2, p3, p4 }
}

// ¿El punto p cae sobre el INTERIOR de un segmento a-b, formando una T real?
//
// Para distinguir una T-junction genuina de una esquina imprecisa, NO basta
// con excluir un porcentaje del largo (t < 0.05): en muros cortos ese margen
// es minúsculo y una esquina mal dibujada cae dentro. La distinción correcta
// es por distancia absoluta a los extremos: si p está cerca de un extremo de
// a-b, es una esquina (otra lógica la maneja), no una T.
function puntoEnSegmentoInterior(p: Vec2, a: Vec2, b: Vec2, tol: number): boolean {
    const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
    if (l2 < 1) return false
    const t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2
    if (t <= 0 || t >= 1) return false   // proyección fuera del segmento
    const px = a.x + t * (b.x - a.x)
    const py = a.y + t * (b.y - a.y)
    // Distancia perpendicular: el muro debe tocar realmente la línea.
    if (Math.sqrt((p.x - px) ** 2 + (p.y - py) ** 2) >= tol) return false
    // Rechazo por cercanía a los extremos: una T real está claramente
    // separada de los vértices del muro que atraviesa.
    const margen = tol * 2
    if (dist(p, a) < margen || dist(p, b) < margen) return false
    return true
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

                // Calcular polígonos ajustados con intersecciones en mitra.
                // La lógica de unión (L y T) vive en ajustarPoligonoMuro.
                const polys = muros.map((_muro, i) => {
                    const c = caras[i]
                    if (!c) return null
                    const otras = caras.filter((_, j) => j !== i)
                    return ajustarPoligonoMuro(c, otras, UMBRAL)
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