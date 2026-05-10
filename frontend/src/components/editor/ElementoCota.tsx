import React from 'react'
import { Group, Line, Text } from 'react-konva'
import type { Cota } from '../../types'
import { TEMA_CLARO, TEMA_OSCURO } from '../../lib/temas'

interface Props {
    cota: Cota
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

export default function ElementoCota({
    cota, zoom, panX, panY, seleccionado, onClick, modoClaro
}: Props) {
    const tema = modoClaro ? TEMA_CLARO : TEMA_OSCURO
    
    // Puntos originales
    const x1 = cota.x1, y1 = cota.y1
    const x2 = cota.x2, y2 = cota.y2
    
    // Dirección de la línea
    const dx = x2 - x1
    const dy = y2 - y1
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    if (dist < 0.01) return null

    // Vector normal (perpendicular)
    const nx = -dy / dist
    const ny = dx / dist

    // Puntos desplazados por el offset
    const ox1 = x1 + nx * cota.offset
    const oy1 = y1 + ny * cota.offset
    const ox2 = x2 + nx * cota.offset
    const oy2 = y2 + ny * cota.offset

    // Conversión a pantalla
    const sx1 = ws(ox1, panX, zoom)
    const sy1 = ws(oy1, panY, zoom)
    const sx2 = ws(ox2, panX, zoom)
    const sy2 = ws(oy2, panY, zoom)

    // Puntos de referencia originales (pantalla)
    const rx1 = ws(x1, panX, zoom)
    const ry1 = ws(y1, panY, zoom)
    const rx2 = ws(x2, panX, zoom)
    const ry2 = ws(y2, panY, zoom)

    const color = seleccionado ? '#1d4ed8' : (modoClaro ? '#475569' : '#94a3b8')
    const ang = Math.atan2(sy2 - sy1, sx2 - sx1)
    const angGrados = ang * (180 / Math.PI)

    const valorStr = cota.valorManual !== undefined 
        ? cota.valorManual.toFixed(2) 
        : dist.toFixed(2)

    return (
        <Group onClick={(e) => onClick(cota.id, e.evt.shiftKey)}>
            {/* Líneas de extensión (desde los puntos de referencia hasta la línea de cota) */}
            <Line
                points={[rx1, ry1, sx1, sy1]}
                stroke={color}
                strokeWidth={0.5}
                dash={[4, 4]}
                opacity={0.6}
            />
            <Line
                points={[rx2, ry2, sx2, sy2]}
                stroke={color}
                strokeWidth={0.5}
                dash={[4, 4]}
                opacity={0.6}
            />

            {/* Hit area invisible para fácil selección */}
            <Line
                points={[sx1, sy1, sx2, sy2]}
                stroke="transparent"
                strokeWidth={20}
            />

            {/* Línea de cota principal */}
            <Line
                points={[sx1, sy1, sx2, sy2]}
                stroke={color}
                strokeWidth={1}
            />

            {/* Ticks (extremos inclinados 45°) */}
            <Group x={sx1} y={sy1} rotation={angGrados + 45}>
                <Line points={[-5, 0, 5, 0]} stroke={color} strokeWidth={1.5} />
            </Group>
            <Group x={sx2} y={sy2} rotation={angGrados + 45}>
                <Line points={[-5, 0, 5, 0]} stroke={color} strokeWidth={1.5} />
            </Group>

            {/* Texto de la cota */}
            <Text
                x={(sx1 + sx2) / 2}
                y={(sy1 + sy2) / 2}
                text={`${valorStr} m`}
                fontSize={12 * zoom}
                fill={color}
                align="center"
                verticalAlign="bottom"
                offsetY={15 * zoom}
                rotation={angGrados > 90 || angGrados < -90 ? angGrados + 180 : angGrados}
                listening={true}
                onDblClick={() => {
                    const nuevo = prompt("Nuevo valor (m):", valorStr)
                    if (nuevo) {
                        // Aquí iría la lógica paramétrica si se implementa
                    }
                }}
            />
        </Group>
    )
}
