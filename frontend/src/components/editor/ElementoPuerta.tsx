import { Group, Line, Arc } from 'react-konva'
import type { Puerta } from '../../types'
import { TEMA_CLARO, TEMA_OSCURO } from '../../lib/temas'
import { usePlanoStore } from '../../store/usePlanoStore'

interface Props {
    puerta: Puerta
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

export default function ElementoPuerta({
    puerta, zoom, panX, panY, seleccionado, onClick, modoClaro
}: Props) {
    const { togglePuertaSentido } = usePlanoStore()
    const tema = modoClaro ? TEMA_CLARO : TEMA_OSCURO
    const cx = ws(puerta.x, panX, zoom)
    const cy = ws(puerta.y, panY, zoom)
    const anchoPx = puerta.ancho * PX * zoom
    const rotGrados = puerta.rotacion * (180 / Math.PI)
    const openingAngle = puerta.angulo // opening angle from store (45, 90, 135)

    const color = seleccionado ? tema.puertaSeleccionada : tema.puerta

    const handleClick = (e: any) => {
        if (seleccionado) {
            e.cancelBubble = true
            togglePuertaSentido(puerta.id)
        } else {
            onClick(puerta.id, e.evt.shiftKey)
        }
    }

    return (
        <Group
            onClick={handleClick}
            rotation={rotGrados}
            x={cx} y={cy}
        >
            {/* Marco de la puerta (opcional, para realismo) */}
            <Line
                points={[0, -2, 0, 2]}
                stroke={color}
                strokeWidth={2}
            />

            {/* Hoja de la puerta */}
            <Line
                points={[0, 0, 0, puerta.sentido === 'izquierda' ? anchoPx : -anchoPx]}
                rotation={puerta.sentido === 'izquierda' ? -openingAngle : openingAngle}
                stroke={color}
                strokeWidth={seleccionado ? 2.5 : 2}
                hitStrokeWidth={10}
            />

            {/* Arco de apertura */}
            <Arc
                x={0} y={0}
                innerRadius={anchoPx}
                outerRadius={anchoPx}
                angle={openingAngle}
                rotation={puerta.sentido === 'izquierda' ? -90 - openingAngle : -90}
                fill="transparent"
                stroke={color}
                strokeWidth={1}
                dash={[4, 4]}
                opacity={0.8}
            />
        </Group>
    )
}