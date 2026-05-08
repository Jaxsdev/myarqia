import { Line } from 'react-konva'
import type { Punto } from '../../types'

interface Props {
    inicio: Punto
    fin: Punto
    espesor: number
    zoom: number
    panX: number
    panY: number
}

const PX = 100

function ws(metros: number, pan: number, zoom: number) {
    return metros * PX * zoom + pan
}

export default function PreviewMuro({ inicio, fin, espesor, zoom, panX, panY }: Props) {
    const x1s = ws(inicio.x, panX, zoom)
    const y1s = ws(inicio.y, panY, zoom)
    const x2s = ws(fin.x, panX, zoom)
    const y2s = ws(fin.y, panY, zoom)

    const espesorPx = espesor * PX * zoom

    const dx = x2s - x1s
    const dy = y2s - y1s
    const longitud = Math.sqrt(dx * dx + dy * dy)
    if (longitud < 1) return null

    const nx = (-dy / longitud) * (espesorPx / 2)
    const ny = (dx / longitud) * (espesorPx / 2)

    const p1 = { x: x1s + nx, y: y1s + ny }
    const p2 = { x: x2s + nx, y: y2s + ny }
    const p3 = { x: x2s - nx, y: y2s - ny }
    const p4 = { x: x1s - nx, y: y1s - ny }

    // Longitud en metros para mostrar
    const longitudMetros = Math.sqrt(
        (fin.x - inicio.x) ** 2 + (fin.y - inicio.y) ** 2
    ).toFixed(2)

    return (
        <>
            {/* Muro preview semitransparente */}
            <Line
                points={[p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y]}
                closed
                fill="#1e40af"
                stroke="#3b82f6"
                strokeWidth={1.5}
                opacity={0.7}
                dash={[6, 3]}
            />
            {/* Línea central de referencia */}
            <Line
                points={[x1s, y1s, x2s, y2s]}
                stroke="#60a5fa"
                strokeWidth={1}
                dash={[4, 4]}
                opacity={0.5}
            />
        </>
    )
}