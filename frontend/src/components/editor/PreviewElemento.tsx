import { Line, Group, Arc, Rect } from 'react-konva'
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
        puerta: '#f97316',
        ventana: '#fbbf24',
        escalera: '#a855f7',
        columna: '#94a3b8',
        cota: '#3b82f6'
    }[tipo]

    // Visualización específica para puertas y ventanas durante el dibujo
    if (tipo === 'puerta' || tipo === 'ventana') {
        const dx = fin.x - inicio.x
        const dy = fin.y - inicio.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const ang = Math.atan2(dy, dx)
        const mx = ws((inicio.x + fin.x) / 2, panX, zoom)
        const my = ws((inicio.y + fin.y) / 2, panY, zoom)
        const distPx = dist * PX * zoom

        return (
            <Group x={mx} y={my} rotation={ang * (180 / Math.PI)}>
                {tipo === 'puerta' ? (
                    <>
                        <Line points={[-distPx / 2, 0, -distPx / 2, -distPx]} stroke={color} strokeWidth={2} dash={[4, 2]} />
                        <Arc
                            x={-distPx / 2} y={0}
                            innerRadius={distPx} outerRadius={distPx}
                            angle={90} rotation={-90}
                            stroke={color} strokeWidth={1} dash={[4, 4]}
                        />
                        <Line points={[-distPx / 2, 0, distPx / 2, 0]} stroke={color} strokeWidth={3} />
                    </>
                ) : (
                    <>
                        <Rect x={-distPx / 2} y={-5 * zoom} width={distPx} height={10 * zoom} stroke={color} strokeWidth={2} dash={[4, 2]} />
                        <Line points={[-distPx / 2, 0, distPx / 2, 0]} stroke={color} strokeWidth={1} />
                    </>
                )}
            </Group>
        )
    }

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