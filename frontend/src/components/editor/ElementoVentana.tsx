import { Group, Line } from 'react-konva'
import type { Ventana } from '../../types'
import { TEMA_CLARO, TEMA_OSCURO } from '../../lib/temas'

interface Props {
    ventana: Ventana
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

export default function ElementoVentana({
    ventana, zoom, panX, panY, seleccionado, onClick, modoClaro
}: Props) {
    const tema = modoClaro ? TEMA_CLARO : TEMA_OSCURO
    const cx = ws(ventana.x, panX, zoom)
    const cy = ws(ventana.y, panY, zoom)
    const anchoPx = ventana.ancho * PX * zoom
    const rotGrados = ventana.rotacion * (180 / Math.PI)

    // Grosor visual de la ventana (10cm)
    const grosorPx = 0.10 * PX * zoom
    const color = seleccionado ? tema.ventanaSeleccionada : tema.ventana

    return (
        <Group
            onClick={(e) => onClick(ventana.id, e.evt.shiftKey)}
            rotation={rotGrados}
            x={cx} y={cy}
        >
            {/* Línea exterior (marco) */}
            <Line
                points={[-anchoPx / 2, -grosorPx, anchoPx / 2, -grosorPx]}
                stroke={color}
                strokeWidth={seleccionado ? 2.5 : 2}
                hitStrokeWidth={10}
            />
            {/* Línea del vidrio (centro) */}
            <Line
                points={[-anchoPx / 2, 0, anchoPx / 2, 0]}
                stroke={color}
                strokeWidth={1}
                opacity={0.5}
            />
            {/* Línea interior (marco) */}
            <Line
                points={[-anchoPx / 2, grosorPx, anchoPx / 2, grosorPx]}
                stroke={color}
                strokeWidth={seleccionado ? 2.5 : 2}
            />
            {/* Tapas laterales */}
            <Line points={[-anchoPx / 2, -grosorPx, -anchoPx / 2, grosorPx]}
                stroke={color} strokeWidth={1.5} />
            <Line points={[anchoPx / 2, -grosorPx, anchoPx / 2, grosorPx]}
                stroke={color} strokeWidth={1.5} />
        </Group>
    )
}