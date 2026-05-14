import { Group, Rect, Line, Circle, Text } from 'react-konva'
import type { SnapInfo } from '../../store/useEditorStore'

interface Props {
    info: SnapInfo
    zoom: number
    panX: number
    panY: number
}

const PX = 100
const ws = (m: number, pan: number, z: number) => m * PX * z + pan

// Componente puramente visual: dibuja un marcador del tipo de snap activo
// en la posición del cursor. Color amarillo intenso para máxima legibilidad
// sobre cualquier fondo (muros o canvas vacío).
export default function SnapIndicator({ info, zoom, panX, panY }: Props) {
    const cx = ws(info.x, panX, zoom)
    const cy = ws(info.y, panY, zoom)
    const COLOR = '#FACC15'  // amarillo
    const SIZE = 8

    return (
        <Group listening={false} x={cx} y={cy}>
            {/* Marcador según tipo */}
            {info.tipo === 'endpoint' && (
                <Rect
                    x={-SIZE} y={-SIZE} width={SIZE * 2} height={SIZE * 2}
                    stroke={COLOR} strokeWidth={2} fill="transparent"
                />
            )}

            {info.tipo === 'midpoint' && (
                <Line
                    points={[0, -SIZE - 1, SIZE + 1, SIZE - 1, -SIZE - 1, SIZE - 1, 0, -SIZE - 1]}
                    stroke={COLOR} strokeWidth={2} fill="transparent" closed
                />
            )}

            {info.tipo === 'edge' && (
                <Line
                    points={[0, -SIZE - 2, SIZE + 2, 0, 0, SIZE + 2, -SIZE - 2, 0, 0, -SIZE - 2]}
                    stroke={COLOR} strokeWidth={2} fill="transparent" closed
                />
            )}

            {info.tipo === 'intersection' && (
                <>
                    <Line points={[-SIZE - 2, -SIZE - 2, SIZE + 2, SIZE + 2]} stroke={COLOR} strokeWidth={2} />
                    <Line points={[SIZE + 2, -SIZE - 2, -SIZE - 2, SIZE + 2]} stroke={COLOR} strokeWidth={2} />
                </>
            )}

            {info.tipo === 'ortho' && (
                <Circle radius={SIZE} stroke={COLOR} strokeWidth={2} fill="transparent" />
            )}

            {/* Etiqueta textual a la derecha del marcador */}
            {info.label && (
                <Group x={SIZE + 6} y={-9}>
                    <Rect
                        width={info.label.length * 7 + 6} height={16}
                        fill="rgba(0,0,0,0.75)" cornerRadius={3}
                    />
                    <Text
                        x={3} y={3} text={info.label}
                        fontSize={10} fontStyle="bold" fill={COLOR}
                    />
                </Group>
            )}
        </Group>
    )
}
