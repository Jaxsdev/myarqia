import { Group, Line, Text, Rect } from 'react-konva'
import type { AmbienteDetectado } from '../../lib/ambientes'

interface Props {
    ambientes: AmbienteDetectado[]
    zoom: number
    panX: number
    panY: number
    visible: boolean
}

const PX = 100
const ws = (m: number, pan: number, z: number) => m * PX * z + pan

// Capa que pinta los ambientes detectados automáticamente a partir del grafo
// de muros. Cada polígono se rellena con un color sutil + etiqueta con área.
export default function CapaAmbientesDetectados({ ambientes, zoom, panX, panY, visible }: Props) {
    if (!visible || ambientes.length === 0) return null

    return (
        <Group listening={false}>
            {ambientes.map((amb) => {
                const points = amb.puntos.flatMap((p) => [ws(p.x, panX, zoom), ws(p.y, panY, zoom)])
                const cx = ws(amb.centroide.x, panX, zoom)
                const cy = ws(amb.centroide.y, panY, zoom)

                const label = `${amb.area.toFixed(2)} m²`
                const labelW = label.length * 7 + 16
                const labelH = 20

                return (
                    <Group key={amb.id}>
                        {/* Relleno semitransparente del ambiente */}
                        <Line
                            points={points}
                            closed
                            fill="rgba(96, 165, 250, 0.08)"   // azul muy sutil
                            stroke="rgba(96, 165, 250, 0.25)"
                            strokeWidth={1}
                            dash={[3, 4]}
                        />

                        {/* Etiqueta con el área */}
                        <Group x={cx - labelW / 2} y={cy - labelH / 2}>
                            <Rect
                                width={labelW} height={labelH}
                                fill="rgba(30, 41, 59, 0.85)"
                                stroke="#60a5fa"
                                strokeWidth={1}
                                cornerRadius={4}
                            />
                            <Text
                                x={8} y={4}
                                text={label}
                                fontSize={12}
                                fontStyle="bold"
                                fill="#BFDBFE"
                            />
                        </Group>
                    </Group>
                )
            })}
        </Group>
    )
}
