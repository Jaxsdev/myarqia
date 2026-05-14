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

    const frameSize = 0.05 * PX * zoom // Marco de 5cm

    return (
        <Group
            onClick={(e) => onClick(ventana.id, e.evt.shiftKey)}
            rotation={rotGrados}
            x={cx} y={cy}
        >
            {/* Marcos laterales de la ventana (Jambas CAD) */}
            <Line
                points={[-anchoPx / 2, -grosorPx, -anchoPx / 2, grosorPx, -anchoPx / 2 + frameSize, grosorPx, -anchoPx / 2 + frameSize, -grosorPx]}
                closed
                fill={color}
                stroke={color}
                strokeWidth={1}
            />
            <Line
                points={[anchoPx / 2 - frameSize, -grosorPx, anchoPx / 2 - frameSize, grosorPx, anchoPx / 2, grosorPx, anchoPx / 2, -grosorPx]}
                closed
                fill={color}
                stroke={color}
                strokeWidth={1}
            />

            {/* Líneas paralelas del vidrio y marco interior */}
            <Line
                points={[-anchoPx / 2 + frameSize, -grosorPx, anchoPx / 2 - frameSize, -grosorPx]}
                stroke={color}
                strokeWidth={seleccionado ? 3 : 2}
            />
            <Line
                points={[-anchoPx / 2 + frameSize, 0, anchoPx / 2 - frameSize, 0]}
                stroke={color}
                strokeWidth={1}
                opacity={0.6}
            />
            <Line
                points={[-anchoPx / 2 + frameSize, grosorPx, anchoPx / 2 - frameSize, grosorPx]}
                stroke={color}
                strokeWidth={seleccionado ? 3 : 2}
            />
        </Group>
    )
}