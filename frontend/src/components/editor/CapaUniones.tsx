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

const UMBRAL = 12

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

                        // Conexión en INICIO
                        if (dist(ini, oIni) < UMBRAL || dist(ini, oFin) < UMBRAL) {
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

                        // Conexión en FIN
                        if (dist(fin, oIni) < UMBRAL || dist(fin, oFin) < UMBRAL) {
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

                    let iniConectado = false
                    let finConectado = false

                    muros.forEach((_, j) => {
                        if (i === j) return
                        const co = caras[j]
                        if (!co) return
                        const oIni = { x: co.sx1, y: co.sy1 }
                        const oFin = { x: co.sx2, y: co.sy2 }
                        if (dist(ini, oIni) < UMBRAL || dist(ini, oFin) < UMBRAL) iniConectado = true
                        if (dist(fin, oIni) < UMBRAL || dist(fin, oFin) < UMBRAL) finConectado = true
                    })

                    raw.beginPath()
                    // Lado exterior/interior 1 (p1 -> p2)
                    raw.moveTo(poly.p1.x, poly.p1.y)
                    raw.lineTo(poly.p2.x, poly.p2.y)

                    // Tapa de FIN (p2 -> p3)
                    if (!finConectado) {
                        raw.lineTo(poly.p3.x, poly.p3.y)
                    } else {
                        raw.moveTo(poly.p3.x, poly.p3.y)
                    }

                    // Lado exterior/interior 2 (p3 -> p4)
                    raw.lineTo(poly.p4.x, poly.p4.y)

                    // Tapa de INICIO (p4 -> p1)
                    if (!iniConectado) {
                        raw.lineTo(poly.p1.x, poly.p1.y)
                    }

                    raw.strokeStyle = tema.muroBorde
                    raw.lineWidth = 1 // Un poco más grueso para que se vea bien
                    raw.stroke()
                })

                raw.restore()
            }}
        />
    )
}