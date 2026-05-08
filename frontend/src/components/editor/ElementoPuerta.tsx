import { Group, Line, Arc } from 'react-konva'
import type { Puerta } from '../../types'
import { TEMA_CLARO, TEMA_OSCURO } from '../../lib/temas'

interface Props {
    puerta: Puerta
    zoom: number
    panX: number
    panY: number
    seleccionado: boolean
    onClick: (id: string) => void
    modoClaro: boolean
}

const PX = 100

function ws(m: number, pan: number, zoom: number) {
    return m * PX * zoom + pan
}

export default function ElementoPuerta({
    puerta, zoom, panX, panY, seleccionado, onClick, modoClaro
}: Props) {
    const tema = modoClaro ? TEMA_CLARO : TEMA_OSCURO
    const cx = ws(puerta.x, panX, zoom)
    const cy = ws(puerta.y, panY, zoom)
    const anchoPx = puerta.ancho * PX * zoom
    const angGrados = puerta.angulo_apertura * (180 / Math.PI)

    const color = seleccionado ? tema.puertaSeleccionada : tema.puerta

    return (
        <Group
            onClick={() => onClick(puerta.id)}
            rotation={angGrados}
            x={cx} y={cy}
        >
            {/* Hoja de la puerta */}
            <Line
                points={[0, 0, anchoPx, 0]}
                stroke={color}
                strokeWidth={seleccionado ? 2.5 : 2}
                hitStrokeWidth={10}
            />
            {/* Arco de apertura de 90° */}
            <Arc
                x={0} y={0}
                innerRadius={0}
                outerRadius={anchoPx}
                angle={90}
                fill="transparent"
                stroke={color}
                strokeWidth={1}
                dash={[4, 3]}
                opacity={0.7}
            />
        </Group>
    )
}