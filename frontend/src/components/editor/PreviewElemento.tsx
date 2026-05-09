import { Line } from 'react-konva'
import type { Punto } from '../../types'

interface Props {
    inicio: Punto
    fin: Punto
    aux: Punto | null
    tipo: 'puerta' | 'ventana' | 'escalera' | 'columna' | 'cota'
    zoom: number
    panX: number
    panY: number
    paso?: number
}

const PX = 100
const ws = (m: number, pan: number, zoom: number) => m * PX * zoom + pan

export default function PreviewElemento({
    inicio, fin, aux, tipo, zoom, panX, panY, paso = 1
}: Props) {
    const color = {
        puerta: '#fbbf24',
        ventana: '#06b6d4',
        escalera: '#a855f7',
        columna: '#94a3b8',
        cota: '#3b82f6'
    }[tipo]

    // Si es una cota en el paso 2, dibujamos la línea con offset
    if (tipo === 'cota' && paso === 2 && aux) {
        const dx = fin.x - inicio.x
        const dy = fin.y - inicio.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist > 0.01) {
            const nx = -dy / dist
            const ny = dx / dist
            
            const v3x = aux.x - inicio.x
            const v3y = aux.y - inicio.y
            const offset = v3x * nx + v3y * ny

            const ox1 = ws(inicio.x + nx * offset, panX, zoom)
            const oy1 = ws(inicio.y + ny * offset, panY, zoom)
            const ox2 = ws(fin.x + nx * offset, panX, zoom)
            const oy2 = ws(fin.y + ny * offset, panY, zoom)
            
            return (
                <>
                    <Line points={[ws(inicio.x, panX, zoom), ws(inicio.y, panY, zoom), ox1, oy1]} stroke={color} strokeWidth={1} dash={[4, 4]} opacity={0.5} />
                    <Line points={[ws(fin.x, panX, zoom), ws(fin.y, panY, zoom), ox2, oy2]} stroke={color} strokeWidth={1} dash={[4, 4]} opacity={0.5} />
                    <Line points={[ox1, oy1, ox2, oy2]} stroke={color} strokeWidth={2} dash={[6, 3]} />
                </>
            )
        }
    }

    const x1 = ws(inicio.x, panX, zoom)
    const y1 = ws(inicio.y, panY, zoom)
    const x2 = ws(fin.x, panX, zoom)
    const y2 = ws(fin.y, panY, zoom)

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