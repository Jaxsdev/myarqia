import { Line, Group } from 'react-konva'
import type { Muro } from '../../types'

interface Props {
    muro: Muro
    zoom: number
    panX: number
    panY: number
    seleccionado: boolean
    onClick: (id: string) => void
}

const PX = 100
const ws = (m: number, pan: number, z: number) => m * PX * z + pan

export function calcularCarasMuro(muro: Muro, z: number, px: number, py: number) {
    const x1 = ws(muro.x1, px, z); const y1 = ws(muro.y1, py, z)
    const x2 = ws(muro.x2, px, z); const y2 = ws(muro.y2, py, z)
    const ep = (muro.espesor * PX * z) / 2
    const dx = x2 - x1; const dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 0.5) return null
    const nx = (-dy / len) * ep
    const ny = (dx / len) * ep
    // cara izquierda (lado +) y cara derecha (lado -)
    return {
        // 4 vértices base sin ajuste
        p1: { x: x1 + nx, y: y1 + ny },  // inicio lado +
        p2: { x: x2 + nx, y: y2 + ny },  // fin   lado +
        p3: { x: x2 - nx, y: y2 - ny },  // fin   lado -
        p4: { x: x1 - nx, y: y1 - ny },  // inicio lado -
        // ejes de las caras para calcular intersecciones
        cara_pos_a: { x: x1 + nx, y: y1 + ny },
        cara_pos_b: { x: x2 + nx, y: y2 + ny },
        cara_neg_a: { x: x1 - nx, y: y1 - ny },
        cara_neg_b: { x: x2 - nx, y: y2 - ny },
        // datos originales
        sx1: x1, sy1: y1, sx2: x2, sy2: y2, ep,
    }
}

export default function ElementoMuro({
    muro, zoom, panX, panY, seleccionado, onClick
}: Props) {
    const c = calcularCarasMuro(muro, zoom, panX, panY)
    if (!c) return null

    // Solo se muestra cuando está seleccionado (highlight azul)
    // El dibujo real lo hace CapaUniones
    if (!seleccionado) return null

    return (
        <Group onClick={() => onClick(muro.id)}>
            <Line
                points={[c.p1.x, c.p1.y, c.p2.x, c.p2.y, c.p3.x, c.p3.y, c.p4.x, c.p4.y]}
                closed
                fill="#1e3a8a44"
                stroke="#60a5fa"
                strokeWidth={2}
                hitStrokeWidth={16}
                dash={[6, 3]}
                listening={false}
            />
        </Group>
    )
}

// Componente invisible solo para detectar clicks
export function MuroHitArea({
    muro, zoom, panX, panY, onClick
}: Omit<Props, 'seleccionado'>) {
    const c = calcularCarasMuro(muro, zoom, panX, panY)
    if (!c) return null
    return (
        <Line
            points={[c.p1.x, c.p1.y, c.p2.x, c.p2.y, c.p3.x, c.p3.y, c.p4.x, c.p4.y]}
            closed
            fill="transparent"
            stroke="transparent"
            strokeWidth={0}
            hitStrokeWidth={14}
            onClick={() => onClick(muro.id)}
        />
    )
}