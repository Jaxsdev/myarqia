import { Shape } from 'react-konva'
import Konva from 'konva'

interface Ambiente {
    nombre: string
    x: number
    y: number
    ancho: number
    largo: number
}

interface Props {
    ambientes: Ambiente[]
    zoom: number
    panX: number
    panY: number
    visible: boolean
}

const PX = 100
const ws = (m: number, pan: number, z: number) => m * PX * z + pan

export default function CapaEtiquetas({ ambientes, zoom, panX, panY, visible }: Props) {
    if (!visible || ambientes.length === 0) return null

    return (
        <Shape
            listening={false}
            sceneFunc={(_ctx: Konva.Context, shape: Konva.Shape) => {
                const layer = shape.getLayer()
                const raw = (layer?.getCanvas()._canvas as HTMLCanvasElement)
                    ?.getContext('2d')
                if (!raw) return

                raw.save()

                ambientes.forEach((amb) => {
                    // Centro del ambiente en pantalla
                    const cx = ws(amb.x + amb.ancho / 2, panX, zoom)
                    const cy = ws(amb.y + amb.largo / 2, panY, zoom)
                    const area = (amb.ancho * amb.largo).toFixed(1)

                    // Solo mostrar si hay suficiente zoom
                    const anchoPx = amb.ancho * PX * zoom
                    if (anchoPx < 40) return

                    // Nombre del ambiente
                    const fontSize = Math.max(10, Math.min(16, anchoPx / 6))
                    raw.font = `bold ${fontSize}px Arial`
                    raw.textAlign = 'center'
                    raw.textBaseline = 'middle'

                    // Sombra para legibilidad
                    raw.shadowColor = '#0d1117'
                    raw.shadowBlur = 4

                    raw.fillStyle = '#e5e7eb'
                    raw.fillText(amb.nombre.toUpperCase(), cx, cy - fontSize * 0.7)

                    // Área
                    raw.font = `${fontSize * 0.8}px monospace`
                    raw.fillStyle = '#9ca3af'
                    raw.fillText(`${area}m²`, cx, cy + fontSize * 0.7)

                    raw.shadowBlur = 0
                })

                raw.restore()
                layer?.batchDraw()
            }}
        />
    )
}