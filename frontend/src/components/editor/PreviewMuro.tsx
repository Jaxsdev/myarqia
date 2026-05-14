import { Line, Group, Text, Rect } from 'react-konva'
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

// Preview en vivo del muro que se está dibujando.
// Dibuja el contorno semitransparente + una etiqueta flotante con la
// longitud en metros y el ángulo en grados.
export default function PreviewMuro({ inicio, fin, espesor, zoom, panX, panY }: Props) {
    const x1s = ws(inicio.x, panX, zoom)
    const y1s = ws(inicio.y, panY, zoom)
    const x2s = ws(fin.x, panX, zoom)
    const y2s = ws(fin.y, panY, zoom)

    const espesorPx = espesor * PX * zoom

    const dx = x2s - x1s
    const dy = y2s - y1s
    const longitudPx = Math.sqrt(dx * dx + dy * dy)
    if (longitudPx < 1) return null

    // Longitud real (metros) y ángulo (grados)
    const longitudM = Math.sqrt(
        (fin.x - inicio.x) ** 2 + (fin.y - inicio.y) ** 2
    )
    // Ángulo en pantalla (y crece hacia abajo, así que el ángulo visual = atan2 mundo)
    let anguloDeg = Math.atan2(fin.y - inicio.y, fin.x - inicio.x) * 180 / Math.PI
    // Normalizar a [0, 360)
    if (anguloDeg < 0) anguloDeg += 360

    const nx = (-dy / longitudPx) * (espesorPx / 2)
    const ny = (dx / longitudPx) * (espesorPx / 2)

    const p1 = { x: x1s + nx, y: y1s + ny }
    const p2 = { x: x2s + nx, y: y2s + ny }
    const p3 = { x: x2s - nx, y: y2s - ny }
    const p4 = { x: x1s - nx, y: y1s - ny }

    // Posición de la etiqueta: punto medio del muro, desplazada perpendicularmente
    const midX = (x1s + x2s) / 2
    const midY = (y1s + y2s) / 2
    // Offset perpendicular (lado opuesto al normal usado arriba para no taparse con el grosor)
    const offsetMag = espesorPx / 2 + 20
    const offX = (-dy / longitudPx) * offsetMag
    const offY = (dx / longitudPx) * offsetMag
    const labelX = midX + offX
    const labelY = midY + offY

    const labelTexto = `${longitudM.toFixed(2)} m  ·  ${anguloDeg.toFixed(0)}°`
    // Estimación rápida del ancho del texto (aprox 6 px por carácter a fontSize 12)
    const labelW = labelTexto.length * 6.5 + 12
    const labelH = 18

    return (
        <>
            {/* Polígono del muro semitransparente */}
            <Line
                points={[p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y]}
                closed
                fill="#1e40af"
                stroke="#3b82f6"
                strokeWidth={1.5}
                opacity={0.7}
                dash={[6, 3]}
                listening={false}
            />
            {/* Eje central */}
            <Line
                points={[x1s, y1s, x2s, y2s]}
                stroke="#60a5fa"
                strokeWidth={1}
                dash={[4, 4]}
                opacity={0.5}
                listening={false}
            />

            {/* Etiqueta flotante con longitud y ángulo */}
            <Group x={labelX - labelW / 2} y={labelY - labelH / 2} listening={false}>
                <Rect
                    width={labelW} height={labelH}
                    fill="rgba(15, 23, 42, 0.92)"
                    stroke="#3b82f6"
                    strokeWidth={1}
                    cornerRadius={4}
                />
                <Text
                    x={6} y={3}
                    text={labelTexto}
                    fontSize={12}
                    fontStyle="bold"
                    fill="#E0F2FE"
                />
            </Group>
        </>
    )
}
