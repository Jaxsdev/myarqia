import { Line, Group } from 'react-konva'
import type { Muro } from '../../types'

interface Props {
    muro: Muro
    zoom: number
    panX: number
    panY: number
    seleccionado: boolean
    onClick: (id: string, multi?: boolean) => void
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

    // Normal unitaria (lado +)
    const ux = -dy / len
    const uy = dx / len

    // Offset del eje del muro según la alineación.
    // La línea que dibujó el usuario (x1,y1)-(x2,y2) es:
    //  - 'centro'    → el eje central; caras a ±ep
    //  - 'izquierda' → la cara del lado + ; el muro crece hacia el lado -
    //  - 'derecha'   → la cara del lado - ; el muro crece hacia el lado +
    const c =
        muro.alineacion === 'izquierda' ? -ep :
        muro.alineacion === 'derecha' ? ep :
        0

    // Desplazamientos de cada cara respecto a la línea dibujada
    const posD = c + ep   // cara lado +
    const negD = c - ep   // cara lado -

    const pPosX1 = x1 + ux * posD, pPosY1 = y1 + uy * posD
    const pPosX2 = x2 + ux * posD, pPosY2 = y2 + uy * posD
    const pNegX1 = x1 + ux * negD, pNegY1 = y1 + uy * negD
    const pNegX2 = x2 + ux * negD, pNegY2 = y2 + uy * negD

    return {
        // 4 vértices del polígono del muro
        p1: { x: pPosX1, y: pPosY1 },  // inicio lado +
        p2: { x: pPosX2, y: pPosY2 },  // fin   lado +
        p3: { x: pNegX2, y: pNegY2 },  // fin   lado -
        p4: { x: pNegX1, y: pNegY1 },  // inicio lado -
        // ejes de las caras para calcular intersecciones (mitra)
        cara_pos_a: { x: pPosX1, y: pPosY1 },
        cara_pos_b: { x: pPosX2, y: pPosY2 },
        cara_neg_a: { x: pNegX1, y: pNegY1 },
        cara_neg_b: { x: pNegX2, y: pNegY2 },
        // línea original dibujada por el usuario — usada para detectar uniones
        // (dos muros conectan en su eje dibujado, sin importar su alineación)
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
        <Group onClick={(e) => onClick(muro.id, e.evt.shiftKey)}>
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
            onClick={(e) => onClick(muro.id, e.evt.shiftKey)}
        />
    )
}