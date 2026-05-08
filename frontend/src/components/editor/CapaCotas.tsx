import { Shape, Text } from 'react-konva'
import type { Muro } from '../../types'
import Konva from 'konva'
import { TEMA_CLARO, TEMA_OSCURO } from '../../lib/temas'

interface Props {
    muros: Muro[]
    zoom: number
    panX: number
    panY: number
    visible: boolean
    modoClaro: boolean
}

const PX = 100
const ws = (m: number, pan: number, z: number) => m * PX * z + pan

const OFFSET_COTA = 30   // px desde el borde del muro
const TICK_SIZE = 6    // tamaño del tick diagonal
const FONT_SIZE = 11

interface Cota {
    x1: number; y1: number
    x2: number; y2: number
    valor: string
    mx: number; my: number   // punto medio (para el texto)
    ox: number; oy: number   // offset perpendicular
}

function calcularCotas(muros: Muro[], zoom: number, panX: number, panY: number): Cota[] {
    const cotas: Cota[] = []

    muros.forEach((muro) => {
        const x1s = ws(muro.x1, panX, zoom)
        const y1s = ws(muro.y1, panY, zoom)
        const x2s = ws(muro.x2, panX, zoom)
        const y2s = ws(muro.y2, panY, zoom)

        const dx = x2s - x1s
        const dy = y2s - y1s
        const len = Math.sqrt(dx * dx + dy * dy)
        if (len < 20) return  // no mostrar cotas de muros muy cortos en pantalla

        // Longitud real en metros
        const longMetros = Math.sqrt(
            (muro.x2 - muro.x1) ** 2 + (muro.y2 - muro.y1) ** 2
        )
        const texto = `${longMetros.toFixed(2)}m`

        // Vector perpendicular normalizado
        const nx = -dy / len
        const ny = dx / len

        // Desplazar la cota hacia afuera del muro
        const ep = (muro.espesor * PX * zoom) / 2
        const off = ep + OFFSET_COTA

        cotas.push({
            x1: x1s + nx * off,
            y1: y1s + ny * off,
            x2: x2s + nx * off,
            y2: y2s + ny * off,
            valor: texto,
            mx: (x1s + x2s) / 2 + nx * off,
            my: (y1s + y2s) / 2 + ny * off,
            ox: nx, oy: ny,
        })
    })

    return cotas
}

export default function CapaCotas({ muros, zoom, panX, panY, visible, modoClaro }: Props) {
    if (!visible || muros.length === 0) return null

    const tema = modoClaro ? TEMA_CLARO : TEMA_OSCURO
    const cotas = calcularCotas(muros, zoom, panX, panY)

    return (
        <>
            <Shape
                listening={false}
                sceneFunc={(_ctx: Konva.Context, _shape: Konva.Shape) => {
                    // Usar _ctx._context para funcionar en pantalla Y en exportación PDF
                    const raw = (_ctx as unknown as { _context: CanvasRenderingContext2D })._context
                    if (!raw) return

                    raw.save()
                    raw.strokeStyle = tema.cotaLinea
                    raw.fillStyle = tema.cotaLinea
                    raw.lineWidth = 1
                    raw.font = `${FONT_SIZE}px monospace`
                    raw.textAlign = 'center'
                    raw.textBaseline = 'middle'

                    cotas.forEach((c) => {
                        const dx = c.x2 - c.x1
                        const dy = c.y2 - c.y1
                        const len = Math.sqrt(dx * dx + dy * dy)
                        if (len < 1) return

                        const ux = dx / len
                        const uy = dy / len

                        // Línea de cota principal
                        raw.beginPath()
                        raw.moveTo(c.x1, c.y1)
                        raw.lineTo(c.x2, c.y2)
                        raw.stroke()

                        // Líneas de extensión (desde el muro hasta la cota)
                        const ext = 8
                        raw.beginPath()
                        raw.moveTo(c.x1 - c.ox * (OFFSET_COTA - ext), c.y1 - c.oy * (OFFSET_COTA - ext))
                        raw.lineTo(c.x1 + c.ox * ext, c.y1 + c.oy * ext)
                        raw.stroke()

                        raw.beginPath()
                        raw.moveTo(c.x2 - c.ox * (OFFSET_COTA - ext), c.y2 - c.oy * (OFFSET_COTA - ext))
                        raw.lineTo(c.x2 + c.ox * ext, c.y2 + c.oy * ext)
                        raw.stroke()

                        // Ticks diagonales en los extremos (estilo arquitectónico)
                        const tickAngle = Math.PI / 4
                        const cos45 = Math.cos(tickAngle)
                        const sin45 = Math.sin(tickAngle)

                            ;[c.x1, c.x2].forEach((tx, idx) => {
                                const ty = idx === 0 ? c.y1 : c.y2
                                raw.beginPath()
                                raw.lineWidth = 1.5
                                raw.moveTo(
                                    tx - ux * TICK_SIZE * cos45 - uy * TICK_SIZE * sin45,
                                    ty - uy * TICK_SIZE * cos45 + ux * TICK_SIZE * sin45
                                )
                                raw.lineTo(
                                    tx + ux * TICK_SIZE * cos45 + uy * TICK_SIZE * sin45,
                                    ty + uy * TICK_SIZE * cos45 - ux * TICK_SIZE * sin45
                                )
                                raw.stroke()
                                raw.lineWidth = 1
                            })

                        // Fondo para el texto
                        const tw = raw.measureText(c.valor).width + 6
                        raw.fillStyle = tema.cotaTextoBg
                        raw.fillRect(c.mx - tw / 2, c.my - 7, tw, 14)

                        // Texto de la cota
                        raw.fillStyle = tema.cotaTexto
                        raw.fillText(c.valor, c.mx, c.my)
                    })

                    raw.restore()
                }}
            />
        </>
    )
}