import React from 'react'
import { Group, Line, Text } from 'react-konva'
import type { ElementoArea } from '../../types'

interface Props {
    area: ElementoArea
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

export default function ElementoAreaComponent({
    area, zoom, panX, panY, seleccionado, onClick, modoClaro
}: Props) {
    const puntosPx = area.puntos.flatMap(p => [
        ws(p.x, panX, zoom),
        ws(p.y, panY, zoom)
    ])

    // Calcular centroide para el texto
    let cx = 0, cy = 0
    area.puntos.forEach(p => {
        cx += p.x
        cy += p.y
    })
    cx /= area.puntos.length
    cy /= area.puntos.length

    const color = seleccionado ? '#1d4ed8' : '#10b981'

    return (
        <Group onClick={(e) => onClick(area.id, e.evt.shiftKey)}>
            <Line
                points={puntosPx}
                closed={true}
                fill={color}
                opacity={0.2}
                stroke={color}
                strokeWidth={2 * zoom}
            />
            <Text
                x={ws(cx, panX, zoom)}
                y={ws(cy, panY, zoom)}
                text={`${area.area.toFixed(2)} m²`}
                fontSize={14 * zoom}
                fill={modoClaro ? '#065f46' : '#6ee7b7'}
                align="center"
                verticalAlign="middle"
                offsetX={(area.area.toFixed(2).length * 5)} // Ajuste visual simple
            />
        </Group>
    )
}
