import { Line } from 'react-konva'
import type { Punto } from '../../types'

interface Props {
    inicio: Punto
    fin: Punto
    tipo: 'puerta' | 'ventana'
    zoom: number
    panX: number
    panY: number
}

const PX = 100
const ws = (m: number, pan: number, zoom: number) => m * PX * zoom + pan

export default function PreviewElemento({
    inicio, fin, tipo, zoom, panX, panY
}: Props) {
    const x1 = ws(inicio.x, panX, zoom)
    const y1 = ws(inicio.y, panY, zoom)
    const x2 = ws(fin.x, panX, zoom)
    const y2 = ws(fin.y, panY, zoom)

    const color = tipo === 'puerta' ? '#fbbf24' : '#06b6d4'

    return (
        <Line
            points={[x1, y1, x2, y2]}
            stroke={color}
            strokeWidth={2}
            dash={[6, 3]}
            opacity={0.8}
        />
    )
}