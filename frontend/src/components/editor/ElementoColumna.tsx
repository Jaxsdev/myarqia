import { Group, Rect, Circle } from 'react-konva'
import type { Columna } from '../../types'

interface Props {
    columna: Columna
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

export default function ElementoColumna({
    columna, zoom, panX, panY, seleccionado, onClick, modoClaro
}: Props) {

    const cx = ws(columna.x, panX, zoom)
    const cy = ws(columna.y, panY, zoom)
    const dimPx = columna.dimension * PX * zoom

    const color = seleccionado ? '#1d4ed8' : (modoClaro ? '#1a1a1a' : '#94a3b8')

    return (
        <Group
            x={cx} y={cy}
            onClick={(e) => onClick(columna.id, e.evt.shiftKey)}
        >
            {columna.forma === 'cuadrada' ? (
                <Rect
                    x={-dimPx / 2} y={-dimPx / 2}
                    width={dimPx} height={dimPx}
                    fill={color}
                    stroke={seleccionado ? '#3b82f6' : 'transparent'}
                    strokeWidth={2}
                />
            ) : (
                <Circle
                    radius={dimPx / 2}
                    fill={color}
                    stroke={seleccionado ? '#3b82f6' : 'transparent'}
                    strokeWidth={2}
                />
            )}
        </Group>
    )
}
