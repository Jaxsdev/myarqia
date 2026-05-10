import { Group, Line, Arrow, Rect } from 'react-konva'
import type { Escalera } from '../../types'

interface Props {
    escalera: Escalera
    zoom: number
    panX: number
    panY: number
    seleccionado: boolean
    onClick: (id: string, multi?: boolean) => void
    modoClaro: boolean
}

const PX = 100

function ws(m: number, pan: number, zoom: number) {
    return m * PX * zoom + pan
}

export default function ElementoEscalera({
    escalera, zoom, panX, panY, seleccionado, onClick
}: Props) {

    
    const x1 = ws(escalera.x1, panX, zoom)
    const y1 = ws(escalera.y1, panY, zoom)
    const x2 = ws(escalera.x2, panX, zoom)
    const y2 = ws(escalera.y2, panY, zoom)

    const dx = x2 - x1
    const dy = y2 - y1
    const dist = Math.sqrt(dx * dx + dy * dy)
    const ang = Math.atan2(dy, dx)
    const angGrados = ang * (180 / Math.PI)

    const color = seleccionado ? '#1d4ed8' : '#a855f7' // Morado para escaleras
    
    // El ancho de la escalera (perpendicular al largo)
    // Por ahora asumimos que el arrastre define el largo. 
    // El ancho podría ser una propiedad o definido por el arrastre lateral.
    // Para simplificar, usaremos un ancho default de 1 metro si no se especifica.
    const anchoPx = (escalera.anchoMuro || 1.0) * PX * zoom

    // Dibujar los peldaños
    const lineas = []
    for (let i = 0; i <= escalera.peldaños; i++) {
        const ratio = i / escalera.peldaños
        const px = ratio * dist
        lineas.push(
            <Line
                key={i}
                points={[px, -anchoPx / 2, px, anchoPx / 2]}
                stroke={color}
                strokeWidth={1}
            />
        )
    }

    return (
        <Group
            x={x1} y={y1}
            rotation={angGrados}
            onClick={(e) => onClick(escalera.id, e.evt.shiftKey)}
        >
            {/* Contorno */}
            <Rect
                x={0} y={-anchoPx / 2}
                width={dist} height={anchoPx}
                stroke={color}
                strokeWidth={seleccionado ? 2 : 1}
                hitStrokeWidth={10}
            />

            {/* Peldaños */}
            {lineas}

            {/* Flecha de subida */}
            <Arrow
                points={[dist * 0.1, 0, dist * 0.9, 0]}
                pointerLength={10 * zoom}
                pointerWidth={8 * zoom}
                fill={color}
                stroke={color}
                strokeWidth={1.5}
            />
        </Group>
    )
}
