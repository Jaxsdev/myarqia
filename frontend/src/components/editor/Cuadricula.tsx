import { Line } from 'react-konva'
import { TEMA_CLARO, TEMA_OSCURO } from '../../lib/temas'

interface Props {
    zoom: number
    panX: number
    panY: number
    width: number
    height: number
    modoClaro: boolean
}

// Cuántos píxeles representa 1 metro a zoom=1
const PX_POR_METRO = 100

export default function Cuadricula({ zoom, panX, panY, width, height, modoClaro }: Props) {
    const tema = modoClaro ? TEMA_CLARO : TEMA_OSCURO
    const lineas: React.ReactElement[] = []

    const paso1m = PX_POR_METRO * zoom        // línea cada 1 metro
    const paso25cm = PX_POR_METRO * zoom * 0.25 // línea cada 25cm

    // Calcular origen de la grilla según el pan
    const offsetX = ((panX % paso1m) + paso1m) % paso1m
    const offsetY = ((panY % paso1m) + paso1m) % paso1m

    const offsetX25 = ((panX % paso25cm) + paso25cm) % paso25cm
    const offsetY25 = ((panY % paso25cm) + paso25cm) % paso25cm

    // Solo mostrar subdivisiones si hay suficiente zoom
    const mostrarSubdivisiones = paso25cm > 8

    // Líneas verticales de subdivisión (25cm)
    if (mostrarSubdivisiones) {
        for (let x = offsetX25; x < width; x += paso25cm) {
            lineas.push(
                <Line
                    key={`sv-${x}`}
                    points={[x, 0, x, height]}
                    stroke={tema.gridSub}
                    strokeWidth={0.5}
                    listening={false}
                />
            )
        }
        // Líneas horizontales de subdivisión
        for (let y = offsetY25; y < height; y += paso25cm) {
            lineas.push(
                <Line
                    key={`sh-${y}`}
                    points={[0, y, width, y]}
                    stroke={tema.gridSub}
                    strokeWidth={0.5}
                    listening={false}
                />
            )
        }
    }

    // Líneas verticales principales (1 metro)
    for (let x = offsetX; x < width; x += paso1m) {
        lineas.push(
            <Line
                key={`mv-${x}`}
                points={[x, 0, x, height]}
                stroke={tema.gridMain}
                strokeWidth={1}
                listening={false}
            />
        )
    }

    // Líneas horizontales principales (1 metro)
    for (let y = offsetY; y < height; y += paso1m) {
        lineas.push(
            <Line
                key={`mh-${y}`}
                points={[0, y, width, y]}
                stroke={tema.gridMain}
                strokeWidth={1}
                listening={false}
            />
        )
    }

    return <>{lineas}</>
}