import { Group, Arc, Rect } from 'react-konva'
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
    const { togglePuertaSentido, muros } = usePlanoStore()
    const tema = modoClaro ? TEMA_CLARO : TEMA_OSCURO
    const cx = ws(puerta.x, panX, zoom)
    const cy = ws(puerta.y, panY, zoom)
    const anchoPx = puerta.ancho * PX * zoom
    const rotGrados = puerta.rotacion * (180 / Math.PI)
    const openingAngle = puerta.angulo // opening angle from store (45, 90, 135)

    const muroAsociado = muros.find(m => m.id === puerta.muro_id)
    const espesorMuro = muroAsociado ? muroAsociado.espesor : 0.15

    const color = seleccionado ? tema.puertaSeleccionada : tema.puerta
    const frameWidth = 0.05 * PX * zoom // Ancho del marco (5cm)
    const frameDepth = espesorMuro * PX * zoom // Profundidad igual al muro
    const leafThickness = 0.03 * PX * zoom // Hoja de 3cm

    const handleClick = (e: any) => {
        if (seleccionado) {
            e.cancelBubble = true
            togglePuertaSentido(puerta.id)
        } else {
            onClick(puerta.id, e.evt.shiftKey)
        }
    }

    // La puerta se dibuja centrada en (cx, cy)
    // El vano mide 'anchoPx' en total.
    // La hoja debe medir el ancho del vano menos el espacio de los marcos.
    const effectiveWidth = anchoPx - frameWidth * 2

    return (
        <Group
            onClick={handleClick}
            rotation={rotGrados}
            x={cx} y={cy}
        >
            {/* Marcos de la puerta (Jambas CAD detalladas) */}
            {/* Marco Izquierdo */}
            <Rect 
                x={-anchoPx / 2} 
                y={-frameDepth / 2} 
                width={frameWidth} 
                height={frameDepth} 
                stroke={color} 
                strokeWidth={1} 
                fill={tema.fondoCanvas} 
            />
            {/* Marco Derecho */}
            <Rect 
                x={anchoPx / 2 - frameWidth} 
                y={-frameDepth / 2} 
                width={frameWidth} 
                height={frameDepth} 
                stroke={color} 
                strokeWidth={1} 
                fill={tema.fondoCanvas} 
            />

            {/* Punto de Pivote (Hinge) - Situado en el borde interior del marco izquierdo */}
            <Group x={-anchoPx / 2 + frameWidth} y={0}>
                {/* Hoja de la puerta - Ahora nace paralela al muro y rota hacia afuera */}
                <Group rotation={puerta.sentido === 'izquierda' ? -openingAngle : openingAngle}>
                    <Rect 
                        x={0} 
                        y={-leafThickness / 2} 
                        width={effectiveWidth} 
                        height={leafThickness} 
                        fill={color}
                        stroke={color}
                        strokeWidth={1}
                    />
                </Group>

                {/* Arco de apertura */}
                <Arc
                    x={0} y={0}
                    innerRadius={effectiveWidth}
                    outerRadius={effectiveWidth}
                    angle={openingAngle}
                    rotation={puerta.sentido === 'izquierda' ? -openingAngle : 0}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={1}
                    dash={[4, 4]}
                    opacity={0.6}
                />
            </Group>
        </Group>
    )
}