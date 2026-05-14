import { Group, Line, Arc, Circle, Rect } from 'react-konva'
import type { Muro } from '../../types'

interface Props {
    x: number
    y: number
    ancho: number
    tipo: 'door' | 'window' | 'column'
    dimension?: number // Para columnas
    forma?: 'cuadrada' | 'circular' // Para columnas
    muros: Muro[]
    zoom: number
    panX: number
    panY: number
}

const PX = 100
const ws = (m: number, pan: number, z: number) => m * PX * z + pan

export default function PreviewGhost({ x, y, ancho, tipo, muros, zoom, panX, panY, dimension, forma }: Props) {
    const cx = ws(x, panX, zoom)
    const cy = ws(y, panY, zoom)
    const anchoPx = ancho * PX * zoom
    const dimPx = (dimension || 0.30) * PX * zoom
    
    // Calcular ángulo del muro más cercano
    let anguloMuro = 0
    let minDist = 0.5
    muros.forEach(m => {
        const l2 = (m.x2 - m.x1) ** 2 + (m.y2 - m.y1) ** 2
        if (l2 === 0) return
        let t = ((x - m.x1) * (m.x2 - m.x1) + (y - m.y1) * (m.y2 - m.y1)) / l2
        t = Math.max(0, Math.min(1, t))
        const px = m.x1 + t * (m.x2 - m.x1)
        const py = m.y1 + t * (m.y2 - m.y1)
        const d = Math.sqrt((x - px) ** 2 + (y - py) ** 2)
        if (d < minDist) {
            minDist = d
            anguloMuro = Math.atan2(m.y2 - m.y1, m.x2 - m.x1)
        }
    })

    const angGrados = anguloMuro * (180 / Math.PI)
    const color = {
        door: '#f97316',   // Naranja CAD
        window: '#fbbf24', // Amarillo CAD
        column: '#94a3b8'
    }[tipo]

    return (
        <Group x={cx} y={cy} rotation={tipo === 'column' ? 0 : angGrados} opacity={0.5}>
            {tipo === 'door' && (
                <>
                    <Line points={[0, 0, 0, -anchoPx]} stroke={color} strokeWidth={2} dash={[4, 2]} />
                    <Arc
                        x={0} y={0}
                        innerRadius={anchoPx} outerRadius={anchoPx}
                        angle={90} rotation={-90}
                        stroke={color} strokeWidth={1} dash={[4, 4]}
                    />
                </>
            )}
            {tipo === 'window' && (
                <>
                    <Line points={[-anchoPx / 2, -5, anchoPx / 2, -5]} stroke={color} strokeWidth={2} dash={[4, 2]} />
                    <Line points={[-anchoPx / 2, 0, anchoPx / 2, 0]} stroke={color} strokeWidth={1} dash={[4, 2]} />
                    <Line points={[-anchoPx / 2, 5, anchoPx / 2, 5]} stroke={color} strokeWidth={2} dash={[4, 2]} />
                </>
            )}
            {tipo === 'column' && (
                forma === 'circular' ? (
                    <Circle radius={dimPx / 2} stroke={color} strokeWidth={1} dash={[4, 2]} />
                ) : (
                    <Rect x={-dimPx / 2} y={-dimPx / 2} width={dimPx} height={dimPx} stroke={color} strokeWidth={1} dash={[4, 2]} />
                )
            )}
        </Group>
    )
}
