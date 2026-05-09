import React from 'react'
import { Group, Text } from 'react-konva'
import type { ElementoTexto } from '../../types'
import { TEMA_CLARO, TEMA_OSCURO } from '../../lib/temas'
import { usePlanoStore } from '../../store/usePlanoStore'

interface Props {
    texto: ElementoTexto
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

export default function ElementoTextoComponent({
    texto, zoom, panX, panY, seleccionado, onClick, modoClaro
}: Props) {
    const tema = modoClaro ? TEMA_CLARO : TEMA_OSCURO
    const actualizarTexto = usePlanoStore(s => s.actualizarTexto)
    
    const x = ws(texto.x, panX, zoom)
    const y = ws(texto.y, panY, zoom)
    const fontSize = texto.fontSize * PX * zoom

    const color = seleccionado ? '#1d4ed8' : (modoClaro ? texto.color : '#cbd5e1')

    return (
        <Group
            x={x} y={y}
            onClick={(e) => onClick(texto.id, e.evt.shiftKey)}
        >
            <Text
                text={texto.contenido}
                fontSize={fontSize}
                fontStyle={texto.bold ? 'bold' : 'normal'}
                fill={color}
                align="left"
                verticalAlign="middle"
                draggable={false}
                onDblClick={() => {
                    const nuevo = prompt("Editar texto:", texto.contenido)
                    if (nuevo !== null && nuevo !== texto.contenido) {
                        actualizarTexto(texto.id, { contenido: nuevo })
                    }
                }}
            />
        </Group>
    )
}
