import { useRef, useEffect, useState, useCallback, type MouseEvent, type WheelEvent } from 'react'
import { Stage, Layer, Rect, Line } from 'react-konva'
import Cuadricula from './Cuadricula'
import ElementoPuerta from './ElementoPuerta'
import ElementoVentana from './ElementoVentana'
import ElementoEscalera from './ElementoEscalera'
import ElementoColumna from './ElementoColumna'
import ElementoCota from './ElementoCota'
import ElementoTexto from './ElementoTexto'
import ElementoArea from './ElementoArea'
import PreviewMuro from './PreviewMuro'
import PreviewGhost from './PreviewGhost'
import PreviewElemento from './PreviewElemento'
import { 
    IconMagnet, 
    IconPlus, 
    IconMinus, 
    IconArrowsMaximize, 
    IconGrid4x4 
} from '@tabler/icons-react'
import { useEditorStore } from '../../store/useEditorStore'
import { usePlanoStore } from '../../store/usePlanoStore'
import type { Punto } from '../../types'
import CapaUniones from './CapaUniones'
import ElementoMuro, { MuroHitArea } from './ElementoMuro'
import CapaCotas from './CapaCotas'
import { TEMA_CLARO, TEMA_OSCURO } from '../../lib/temas'
import CapaEtiquetas from './CapaEtiquetas'
import ConfigModal from './ConfigModal'

const PX_POR_METRO = 100
const ws = (m: number, pan: number, zoom: number) => m * PX_POR_METRO * zoom + pan
const ZOOM_MIN = 0.2
const ZOOM_MAX = 8

function snapear(v: number, t: number) { return Math.round(v / t) * t }
function screenToWorld(px: number, pan: number, zoom: number) {
    return (px - pan) / (PX_POR_METRO * zoom)
}

export default function CanvasEditor() {
    const contenedorRef = useRef<HTMLDivElement>(null)
    const [tamano, setTamano] = useState({ width: 800, height: 600 })
    const arrastrando = useRef(false)
    const moviendo = useRef(false)
    const rotando = useRef(false)
    const cuadroSeleccion = useRef(false)
    const ultimaPosicion = useRef({ x: 0, y: 0 })
    const posInicioMover = useRef<Punto | null>(null)

    // --- Store: editor ---
    const {
        zoom, setZoom, panX, panY, setPan,
        setCursor, herramienta, setHerramienta,
        snapActivo, toggleSnap, snapSize,
        orthoActivo, toggleOrtho,
        cotasVisibles, nomenclaturaVisible, grillaVisible, toggleGrilla,
        modoClaro, modalConfigAbierto,
        propiedades,
        cursorX, cursorY,
        rotation, setRotation
    } = useEditorStore()

    // --- Store: plano ---
    const {
        muros, puertas, ventanas, escaleras, columnas, cotas, textos, areas, ambientes,
        dibujando, tipoDibujo, puntoInicio, puntoFin, puntoAux, puntosPoligono,
        idsSeleccionados, iniciarDibujo, actualizarDibujo,
        terminarMuro, terminarPuerta, terminarVentana,
        terminarEscalera, terminarColumna, terminarCota, terminarTexto, terminarArea,
        cancelarDibujo, seleccionar, eliminarSeleccionado,
        moverSeleccion, pasoDibujo,
        undo, redo, saveHistory, capas, capaActiva
    } = usePlanoStore()

    const tema = modoClaro ? TEMA_CLARO : TEMA_OSCURO

    // Filtros de Capas
    const capasVisibles = capas.reduce((acc, c) => ({ ...acc, [c.id]: c.visible }), {} as Record<string, boolean>)
    const capasBloqueadas = capas.reduce((acc, c) => ({ ...acc, [c.id]: c.locked }), {} as Record<string, boolean>)

    const murosV = muros.filter(m => capasVisibles[m.layer] !== false)
    const puertasV = puertas.filter(p => capasVisibles[p.layer] !== false)
    const ventanasV = ventanas.filter(v => capasVisibles[v.layer] !== false)
    const escalerasV = escaleras.filter(e => capasVisibles[e.layer] !== false)
    const columnasV = columnas.filter(c => capasVisibles[c.layer] !== false)
    const cotasV = cotas.filter(c => capasVisibles[c.layer] !== false)
    const textosV = textos.filter(t => capasVisibles[t.layer] !== false)
    const areasV = areas.filter(a => capasVisibles[a.layer] !== false)

    const isSelectable = (layer?: string) => layer ? !capasBloqueadas[layer] : true

    // --- Resize observer ---
    useEffect(() => {
        const act = () => {
            if (contenedorRef.current)
                setTamano({
                    width: contenedorRef.current.offsetWidth,
                    height: contenedorRef.current.offsetHeight,
                })
        }
        act()
        window.addEventListener('resize', act)
        return () => window.removeEventListener('resize', act)
    }, [])

    // --- Teclado ---
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // No interferir con inputs de texto
            if (e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement) return

            // Undo / Redo
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                if (e.shiftKey) {
                    e.preventDefault()
                    redo()
                } else {
                    e.preventDefault()
                    undo()
                }
                return
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault()
                redo()
                return
            }

            switch (e.key.toLowerCase()) {
                case 'escape':
                    if (dibujando) {
                        cancelarDibujo()
                    } else {
                        setHerramienta('select')
                    }
                    break
                case 'w': setHerramienta('wall'); break
                case 'd': setHerramienta('door'); break
                case 'v': setHerramienta('window'); break
                case 'e': setHerramienta('stair'); break
                case 'c': setHerramienta('column'); break
                case 'q': setHerramienta('dim'); break
                case 't': setHerramienta('text'); break
                case 'a': setHerramienta('area'); break
                case 's': toggleSnap(); break
                case 'f8':  // e.key === 'F8' → toLowerCase → 'f8'
                    e.preventDefault()
                    toggleOrtho()
                    break
                case 'delete':
                case 'backspace':
                    eliminarSeleccionado()
                    break
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [cancelarDibujo, setHerramienta, toggleOrtho, toggleSnap, eliminarSeleccionado, undo, redo])

    const getPunto = useCallback((e: MouseEvent | { clientX: number, clientY: number }): Punto => {
        if (!contenedorRef.current) return { x: 0, y: 0 }
        const rect = contenedorRef.current!.getBoundingClientRect()
        let x = e.clientX - rect.left
        let y = e.clientY - rect.top

        // Ajuste por rotación (rotar el punto del mouse inversamente respecto al centro)
        if (rotation !== 0) {
            const cx = tamano.width / 2
            const cy = tamano.height / 2
            const rad = (-rotation * Math.PI) / 180
            const cos = Math.cos(rad)
            const sin = Math.sin(rad)
            const dx = x - cx
            const dy = y - cy
            x = cx + (dx * cos - dy * sin)
            y = cy + (dx * sin + dy * cos)
        }

        let mx = screenToWorld(x, panX, zoom)
        let my = screenToWorld(y, panY, zoom)

        // --- Lógica de Snap (Atracción) ---
        // Radio de snap dinámico (aprox 15px en pantalla para puntos, 30px para muros)
        const snapRadius = 15 / (PX_POR_METRO * zoom)
        const wallSnapRadius = 30 / (PX_POR_METRO * zoom)
        let snapped = false

        // 1. Snap Obligatorio/Magnético a Muros para Puertas y Ventanas
        // (Incluso si snapActivo es false, porque estos elementos deben ir en muros)
        if (herramienta === 'door' || herramienta === 'window') {
            for (const m of murosV) {
                const l2 = (m.x2 - m.x1) ** 2 + (m.y2 - m.y1) ** 2
                if (l2 === 0) continue
                let t = ((mx - m.x1) * (m.x2 - m.x1) + (my - m.y1) * (m.y2 - m.y1)) / l2
                t = Math.max(0, Math.min(1, t))
                const px = m.x1 + t * (m.x2 - m.x1)
                const py = m.y1 + t * (m.y2 - m.y1)
                const d = Math.sqrt((mx - px) ** 2 + (my - py) ** 2)
                
                if (d < wallSnapRadius) {
                    mx = px; my = py; snapped = true; break
                }
            }
        }

        if (snapActivo && !snapped) {
            // 2. Snap a Extremos de Muros
            for (const m of muros) {
                const d1 = Math.sqrt((mx - m.x1) ** 2 + (my - m.y1) ** 2)
                const d2 = Math.sqrt((mx - m.x2) ** 2 + (my - m.y2) ** 2)
                if (d1 < snapRadius) {
                    mx = m.x1; my = m.y1; snapped = true; break
                }
                if (d2 < snapRadius) {
                    mx = m.x2; my = m.y2; snapped = true; break
                }
                
                // 3. Snap a Puntos Medios de Muros
                const midX = (m.x1 + m.x2) / 2
                const midY = (m.y1 + m.y2) / 2
                const dm = Math.sqrt((mx - midX) ** 2 + (my - midY) ** 2)
                if (dm < snapRadius) {
                    mx = midX; my = midY; snapped = true; break
                }
            }

            // 4. Snap a Centros de Elementos (Columnas, Escaleras)
            if (!snapped) {
                for (const c of columnas) {
                    const d = Math.sqrt((mx - c.x) ** 2 + (my - c.y) ** 2)
                    if (d < snapRadius) { mx = c.x; my = c.y; snapped = true; break }
                }
                for (const e of escaleras) {
                    const midX = (e.x1 + e.x2) / 2
                    const midY = (e.y1 + e.y2) / 2
                    const d = Math.sqrt((mx - midX) ** 2 + (my - midY) ** 2)
                    if (d < snapRadius) { mx = midX; my = midY; snapped = true; break }
                }
            }

            // 5. Si no hubo snap a nada, snap a rejilla (grilla)
            if (!snapped) {
                mx = Math.round(mx / snapSize) * snapSize
                my = Math.round(my / snapSize) * snapSize
            }
        }

        // Lógica Ortho: restringe a 0°, 45°, 90°, 135°, 180°, etc.
        if (orthoActivo && puntoInicio) {
            const dx = mx - puntoInicio.x
            const dy = my - puntoInicio.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist > 0) {
                const angle = Math.atan2(dy, dx) * 180 / Math.PI
                const normalizedAngle = Math.round(angle / 45) * 45
                const rad = normalizedAngle * Math.PI / 180

                mx = puntoInicio.x + Math.cos(rad) * dist
                my = puntoInicio.y + Math.sin(rad) * dist

                // Re-snap después de aplicar Ortho
                if (snapActivo) {
                    mx = snapear(mx, snapSize)
                    my = snapear(my, snapSize)
                }
            }
        }

        return { x: mx, y: my }
    }, [panX, panY, zoom, rotation, tamano.width, tamano.height, snapActivo, snapSize, orthoActivo, puntoInicio, muros, herramienta])

    // --- Wheel: zoom centrado en el cursor ---
    const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
        e.preventDefault()
        const factor = e.deltaY > 0 ? 0.92 : 1.08
        const nz = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom * factor))
        const rect = contenedorRef.current!.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        setZoom(nz)
        setPan(mx - (mx - panX) * (nz / zoom), my - (my - panY) * (nz / zoom))
    }, [zoom, panX, panY, setZoom, setPan])

    // --- MouseDown: inicia o termina dibujo ---
    const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
        const p = getPunto(e)
        ultimaPosicion.current = { x: e.clientX, y: e.clientY }

        // Pan con botón central (o Alt + Izquierdo)
        if (e.button === 1 && !e.altKey) {
            arrastrando.current = true
            return
        }

        // Rotar con Alt + Botón Central
        if (e.button === 1 && e.altKey) {
            rotando.current = true
            return
        }

        // Rotar con Alt + Botón Central
        if (e.button === 1 && e.altKey) {
            rotando.current = true
            return
        }

        if (e.button === 0) {
            if (herramienta === 'select') {
                // Verificar si se hizo clic en un elemento (esto se maneja en los componentes hijos vía onClick)
                // Pero aquí manejamos el clic en el vacío
                if (e.target === e.currentTarget || (e.target as any).nodeType === 'Stage') {
                    seleccionar(null)
                    cuadroSeleccion.current = true
                    iniciarDibujo(p, 'cota') // Usamos cota temporalmente para el cuadro o simplemente guardamos puntos
                    // En realidad, para el cuadro de selección necesitamos una lógica aparte o usar puntoInicio/puntoFin
                }
                return
            }

            if (herramienta === 'wall') {
                if (!dibujando) iniciarDibujo(p, 'muro')
                else terminarMuro(propiedades.muro, true)
            }
            if (herramienta === 'door') {
                if (!dibujando) iniciarDibujo(p, 'puerta')
                else terminarPuerta(propiedades.puerta)
                return
            }
            if (herramienta === 'window') {
                if (!dibujando) iniciarDibujo(p, 'ventana')
                else terminarVentana(propiedades.ventana)
                return
            }
            if (herramienta === 'stair') {
                if (!dibujando) iniciarDibujo(p, 'escalera')
                else terminarEscalera(propiedades.escalera)
            }
            if (herramienta === 'column') {
                terminarColumna(propiedades.columna, p)
                return
            }
            if (herramienta === 'dim') {
                if (!dibujando) iniciarDibujo(p, 'cota')
                else terminarCota(propiedades.dim, p)
                return
            }
            if (herramienta === 'text') {
                const contenido = prompt("Ingresa el texto:")
                if (contenido !== null && contenido !== "") {
                    terminarTexto(contenido, propiedades.texto, p)
                }
                return
            }
            if (herramienta === 'area') {
                if (!dibujando) {
                    iniciarDibujo(p, 'area')
                } else {
                    const dx = p.x - puntosPoligono[0].x
                    const dy = p.y - puntosPoligono[0].y
                    if (Math.sqrt(dx*dx + dy*dy) < 0.2) {
                        terminarArea()
                    } else {
                        usePlanoStore.setState((s) => ({
                            puntosPoligono: [...s.puntosPoligono, p]
                        }))
                    }
                }
                return
            }
        }
    }, [
        herramienta, dibujando, getPunto,
        iniciarDibujo, terminarMuro, terminarPuerta, terminarVentana,
        terminarEscalera, terminarColumna, terminarCota, terminarTexto, terminarArea, seleccionar,
        propiedades, puntosPoligono,
    ])

    // --- ContextMenu: cancela dibujo con clic derecho ---
    const handleContextMenu = useCallback((e: MouseEvent<HTMLDivElement>) => {
        e.preventDefault()
        if (dibujando) cancelarDibujo()
    }, [dibujando, cancelarDibujo])

    // --- MouseMove: actualiza cursor y preview ---
    const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
        const p = getPunto(e)
        setCursor(p.x, p.y)

        if (arrastrando.current) {
            const dx = e.clientX - ultimaPosicion.current.x
            const dy = e.clientY - ultimaPosicion.current.y
            setPan(panX + dx, panY + dy)
            ultimaPosicion.current = { x: e.clientX, y: e.clientY }
            return
        }

        if (moviendo.current && posInicioMover.current) {
            const dx = p.x - posInicioMover.current.x
            const dy = p.y - posInicioMover.current.y
            moverSeleccion(dx, dy)
            posInicioMover.current = p
            return
        }

        if (rotando.current) {
            const dx = e.clientX - ultimaPosicion.current.x
            setRotation(rotation + dx * 0.5)
            ultimaPosicion.current = { x: e.clientX, y: e.clientY }
            return
        }

        if (dibujando) {
            actualizarDibujo(p)
        }
    }, [getPunto, setCursor, arrastrando, rotando, moviendo, dibujando, actualizarDibujo, panX, panY, rotation, setPan, setRotation, moverSeleccion, tamano.width])

    const cursorStyle = herramienta === 'select' ? 'default' : 'crosshair'

    return (
        <div
            ref={contenedorRef}
            className="w-full h-full overflow-hidden transition-colors duration-300"
            style={{ cursor: cursorStyle, backgroundColor: tema.fondoCanvas }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onContextMenu={handleContextMenu}
            onDoubleClick={() => {
                if (herramienta === 'wall' && dibujando) {
                    terminarMuro(propiedades.muro, false)
                }
                if (herramienta === 'area' && dibujando) {
                    terminarArea()
                }
            }}
            onMouseUp={(e) => {
                if (e.button === 1) {
                    arrastrando.current = false
                    rotando.current = false
                }
                if (e.button === 0) {
                    if (cuadroSeleccion.current && puntoInicio && puntoFin) {
                        // Lógica para seleccionar elementos dentro del cuadro
                        const x1 = Math.min(puntoInicio.x, puntoFin.x)
                        const y1 = Math.min(puntoInicio.y, puntoFin.y)
                        const x2 = Math.max(puntoInicio.x, puntoFin.x)
                        const y2 = Math.max(puntoInicio.y, puntoFin.y)

                        const nuevosIds: string[] = []

                        murosV.forEach(m => {
                            if (!isSelectable(m.layer)) return
                            const in1 = m.x1 >= x1 && m.x1 <= x2 && m.y1 >= y1 && m.y1 <= y2
                            const in2 = m.x2 >= x1 && m.x2 <= x2 && m.y2 >= y1 && m.y2 <= y2
                            if (in1 || in2) nuevosIds.push(m.id)
                        })
                        puertasV.forEach(p => {
                            if (!isSelectable(p.layer)) return
                            if (p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2) nuevosIds.push(p.id)
                        })
                        ventanasV.forEach(v => {
                            if (!isSelectable(v.layer)) return
                            if (v.x >= x1 && v.x <= x2 && v.y >= y1 && v.y <= y2) nuevosIds.push(v.id)
                        })
                        escalerasV.forEach(e => {
                            if (!isSelectable(e.layer)) return
                            if (e.x1 >= x1 && e.x1 <= x2 && e.y1 >= y1 && e.y1 <= y2) nuevosIds.push(e.id)
                        })
                        columnasV.forEach(c => {
                            if (!isSelectable(c.layer)) return
                            if (c.x >= x1 && c.x <= x2 && c.y >= y1 && c.y <= y2) nuevosIds.push(c.id)
                        })
                        cotasV.forEach(co => {
                            if (!isSelectable(co.layer)) return
                            if (co.x1 >= x1 && co.x1 <= x2 && co.y1 >= y1 && co.y1 <= y2) nuevosIds.push(co.id)
                        })
                        textosV.forEach(t => {
                            if (!isSelectable(t.layer)) return
                            if (t.x >= x1 && t.x <= x2 && t.y >= y1 && t.y <= y2) nuevosIds.push(t.id)
                        })
                        areasV.forEach(a => {
                            if (!isSelectable(a.layer)) return
                            if (a.puntos.some(p => p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2)) nuevosIds.push(a.id)
                        })

                        nuevosIds.forEach(id => seleccionar(id, true))

                        cancelarDibujo()
                        cuadroSeleccion.current = false
                    }
                    moviendo.current = false
                    posInicioMover.current = null
                }
            }}
            onMouseLeave={() => {
                arrastrando.current = false
                moviendo.current = false
                cuadroSeleccion.current = false
            }}
        >
            <Stage width={tamano.width} height={tamano.height}>
                <Layer listening={false}>
                    {grillaVisible && (
                        <Cuadricula zoom={zoom} panX={panX} panY={panY}
                            width={tamano.width} height={tamano.height}
                            modoClaro={modoClaro} />
                    )}
                </Layer>

                {/* Capa principal con rotación */}
                <Layer 
                    rotation={rotation} 
                    offsetX={tamano.width / 2} 
                    offsetY={tamano.height / 2}
                    x={tamano.width / 2}
                    y={tamano.height / 2}
                >

                    {/* Capa de uniones — dibuja todos los muros unidos */}
                    <CapaUniones
                        muros={murosV}
                        puertas={puertasV}
                        ventanas={ventanasV}
                        zoom={zoom} panX={panX} panY={panY}
                        modoClaro={modoClaro}
                    />

                    {/* Áreas invisibles de detección de clicks */}
                    {murosV.map((m) => (
                        <MuroHitArea
                            key={`hit-${m.id}`} muro={m}
                            zoom={zoom} panX={panX} panY={panY}
                            onClick={(id, multi) => {
                                if (!isSelectable(m.layer)) return;
                                if (herramienta === 'select') {
                                    saveHistory()
                                    seleccionar(id, multi)
                                    moviendo.current = true
                                    posInicioMover.current = getPunto({ clientX: ultimaPosicion.current.x, clientY: ultimaPosicion.current.y } as any)
                                }
                            }}
                        />
                    ))}

                    {/* Muros */}
                    {muros.map((m) => (
                        <ElementoMuro key={m.id} muro={m}
                            zoom={zoom} panX={panX} panY={panY}
                            seleccionado={idsSeleccionados.includes(m.id)}
                            onClick={(id, multi) => {
                                if (herramienta === 'select') {
                                    saveHistory()
                                    seleccionar(id, multi)
                                    moviendo.current = true
                                    posInicioMover.current = getPunto({ clientX: ultimaPosicion.current.x, clientY: ultimaPosicion.current.y } as any)
                                }
                            }} />
                    ))}

                    <CapaCotas
                        muros={muros}
                        zoom={zoom} panX={panX} panY={panY}
                        visible={cotasVisibles}
                        modoClaro={modoClaro}
                    />

                    <CapaEtiquetas
                        ambientes={ambientes}
                        zoom={zoom} panX={panX} panY={panY}
                        visible={nomenclaturaVisible}
                    />

                    {/* Puertas */}
                    {puertasV.map((p) => (
                        <ElementoPuerta key={p.id} puerta={p}
                            zoom={zoom} panX={panX} panY={panY}
                            seleccionado={idsSeleccionados.includes(p.id)}
                            onClick={(id, multi) => {
                                if (!isSelectable(p.layer)) return;
                                if (herramienta === 'select') {
                                    saveHistory()
                                    seleccionar(id, multi)
                                    moviendo.current = true
                                    posInicioMover.current = getPunto({ clientX: ultimaPosicion.current.x, clientY: ultimaPosicion.current.y } as any)
                                }
                            }}
                            modoClaro={modoClaro} />
                    ))}

                    {/* Áreas */}
                    {areasV.map((a) => (
                        <ElementoArea key={a.id} area={a}
                            zoom={zoom} panX={panX} panY={panY}
                            seleccionado={idsSeleccionados.includes(a.id)}
                            onClick={(id, multi) => {
                                if (!isSelectable(a.layer)) return;
                                if (herramienta === 'select') {
                                    saveHistory()
                                    seleccionar(id, multi)
                                    moviendo.current = true
                                    posInicioMover.current = getPunto({ clientX: ultimaPosicion.current.x, clientY: ultimaPosicion.current.y } as any)
                                }
                            }}
                            modoClaro={modoClaro} />
                    ))}

                    {/* Textos */}
                    {textosV.map((t) => (
                        <ElementoTexto key={t.id} texto={t}
                            zoom={zoom} panX={panX} panY={panY}
                            seleccionado={idsSeleccionados.includes(t.id)}
                            onClick={(id, multi) => {
                                if (!isSelectable(t.layer)) return;
                                if (herramienta === 'select') {
                                    saveHistory()
                                    seleccionar(id, multi)
                                    moviendo.current = true
                                    posInicioMover.current = getPunto({ clientX: ultimaPosicion.current.x, clientY: ultimaPosicion.current.y } as any)
                                }
                            }}
                            modoClaro={modoClaro} />
                    ))}

                    {/* Cotas */}
                    {cotasV.map((co) => (
                        <ElementoCota key={co.id} cota={co}
                            zoom={zoom} panX={panX} panY={panY}
                            seleccionado={idsSeleccionados.includes(co.id)}
                            onClick={(id, multi) => {
                                if (!isSelectable(co.layer)) return;
                                if (herramienta === 'select') {
                                    saveHistory()
                                    seleccionar(id, multi)
                                    moviendo.current = true
                                    posInicioMover.current = getPunto({ clientX: ultimaPosicion.current.x, clientY: ultimaPosicion.current.y } as any)
                                }
                            }}
                            modoClaro={modoClaro} />
                    ))}

                    {/* Columnas */}
                    {columnasV.map((c) => (
                        <ElementoColumna key={c.id} columna={c}
                            zoom={zoom} panX={panX} panY={panY}
                            seleccionado={idsSeleccionados.includes(c.id)}
                            onClick={(id, multi) => {
                                if (!isSelectable(c.layer)) return;
                                if (herramienta === 'select') {
                                    saveHistory()
                                    seleccionar(id, multi)
                                    moviendo.current = true
                                    posInicioMover.current = getPunto({ clientX: ultimaPosicion.current.x, clientY: ultimaPosicion.current.y } as any)
                                }
                            }}
                            modoClaro={modoClaro} />
                    ))}

                    {/* Escaleras */}
                    {escalerasV.map((e) => (
                        <ElementoEscalera key={e.id} escalera={e}
                            zoom={zoom} panX={panX} panY={panY}
                            seleccionado={idsSeleccionados.includes(e.id)}
                            onClick={(id, multi) => {
                                if (!isSelectable(e.layer)) return;
                                if (herramienta === 'select') {
                                    saveHistory()
                                    seleccionar(id, multi)
                                    moviendo.current = true
                                    posInicioMover.current = getPunto({ clientX: ultimaPosicion.current.x, clientY: ultimaPosicion.current.y } as any)
                                }
                            }}
                            modoClaro={modoClaro} />
                    ))}

                    {/* Ventanas */}
                    {ventanasV.map((v) => (
                        <ElementoVentana key={v.id} ventana={v}
                            zoom={zoom} panX={panX} panY={panY}
                            seleccionado={idsSeleccionados.includes(v.id)}
                            onClick={(id, multi) => {
                                if (!isSelectable(v.layer)) return;
                                if (herramienta === 'select') {
                                    saveHistory()
                                    seleccionar(id, multi)
                                    moviendo.current = true
                                    posInicioMover.current = getPunto({ clientX: ultimaPosicion.current.x, clientY: ultimaPosicion.current.y } as any)
                                }
                            }}
                            modoClaro={modoClaro} />
                    ))}

                    {/* Preview puerta/ventana/columna (un solo clic) */}
                    {!dibujando && (herramienta === 'door' || herramienta === 'window' || herramienta === 'column') && (
                        <PreviewGhost
                            x={cursorX} y={cursorY}
                            tipo={herramienta as any}
                            ancho={(herramienta === 'door' ? propiedades.puerta.ancho : propiedades.ventana.ancho)}
                            dimension={herramienta === 'column' ? propiedades.columna.dimension : undefined}
                            forma={herramienta === 'column' ? propiedades.columna.forma : undefined}
                            muros={muros}
                            zoom={zoom} panX={panX} panY={panY}
                        />
                    )}

                    {/* Preview muro */}
                    {dibujando && tipoDibujo === 'muro' && puntoInicio && puntoFin && (
                        <PreviewMuro inicio={puntoInicio} fin={puntoFin}
                            espesor={propiedades.muro.espesor} zoom={zoom} panX={panX} panY={panY} />
                    )}

                    {/* Preview Polígono de Área */}
                    {dibujando && tipoDibujo === 'area' && puntosPoligono.length > 0 && (
                        <Line
                            points={[
                                ...puntosPoligono.flatMap(p => [ws(p.x, panX, zoom), ws(p.y, panY, zoom)]),
                                ws(cursorX, panX, zoom), ws(cursorY, panY, zoom)
                            ]}
                            stroke="#10b981"
                            strokeWidth={2 * zoom}
                            dash={[5, 5]}
                        />
                    )}

                    {/* Preview para herramientas de clics (cotas, escaleras, etc.) */}
                    {dibujando && tipoDibujo !== 'muro' && puntoInicio && puntoFin && !cuadroSeleccion.current && (
                        <PreviewElemento 
                            inicio={puntoInicio} 
                            fin={puntoFin}
                            aux={puntoAux}
                            tipo={tipoDibujo as any}
                            zoom={zoom} panX={panX} panY={panY}
                            paso={pasoDibujo}
                        />
                    )}

                    {/* Cuadro de selección */}
                    {cuadroSeleccion.current && puntoInicio && puntoFin && (
                        <Rect
                            x={Math.min(puntoInicio.x, puntoFin.x) * PX_POR_METRO * zoom + panX}
                            y={Math.min(puntoInicio.y, puntoFin.y) * PX_POR_METRO * zoom + panY}
                            width={Math.abs(puntoFin.x - puntoInicio.x) * PX_POR_METRO * zoom}
                            height={Math.abs(puntoFin.y - puntoInicio.y) * PX_POR_METRO * zoom}
                            fill="rgba(30, 58, 138, 0.2)"
                            stroke="#3b82f6"
                            strokeWidth={1 / zoom}
                            dash={[5, 2]}
                        />
                    )}
                </Layer>
            </Stage>

            {/* --- SOBRE EL CANVAS (Overlays Visuales) --- */}

            {/* Snap Banner */}
            <div className="snap-banner">
                <IconMagnet size={12} />
                <span>
                    Snap {Math.round(snapSize * 100)}cm · 
                    Capa activa: <span className="font-bold">{capaActiva}</span> · 
                    Ortho {orthoActivo ? 'ON' : 'OFF'}
                </span>
            </div>

            {/* ViewCube interactivo */}
            <div className="viewcube-container">
                <svg viewBox="0 0 54 54" className="w-full h-full drop-shadow-lg overflow-visible">
                    {/* Fondo del cubo (Reset) */}
                    <rect 
                        x="15" y="15" width="24" height="24" rx="3" 
                        fill="#1C2030" stroke="#252B3B" strokeWidth="0.5"
                        className="cursor-pointer hover:fill-[#252B3B] transition-colors"
                        onClick={() => setRotation(0)}
                    />
                    
                    {/* Polígonos decorativos que rotan con la vista */}
                    <g style={{ transform: `rotate(${-rotation}deg)`, transformOrigin: '27px 27px', transition: 'transform 0.3s ease' }}>
                        <polygon points="15,15 27,5 39,15" fill="#252B3B" />
                        <polygon points="39,15 49,27 39,39" fill="#141720" />
                        <text x="27" y="31" textAnchor="middle" fontSize="7" fill="#E8ECF0" fontFamily="sans-serif" pointerEvents="none">PLANTA</text>
                    </g>

                    {/* Botones de Orientación (Estáticos) */}
                    <text 
                        x="27" y="9" textAnchor="middle" fontSize="8" 
                        className="cursor-pointer font-bold hover:fill-[#2D8EFF] fill-[#8892A0] transition-colors"
                        onClick={() => setRotation(0)}
                    >N</text>
                    <text 
                        x="48" y="30" textAnchor="middle" fontSize="8" 
                        className="cursor-pointer font-bold hover:fill-[#2D8EFF] fill-[#8892A0] transition-colors"
                        onClick={() => setRotation(270)}
                    >E</text>
                    <text 
                        x="27" y="50" textAnchor="middle" fontSize="8" 
                        className="cursor-pointer font-bold hover:fill-[#2D8EFF] fill-[#8892A0] transition-colors"
                        onClick={() => setRotation(180)}
                    >S</text>
                    <text 
                        x="6" y="30" textAnchor="middle" fontSize="8" 
                        className="cursor-pointer font-bold hover:fill-[#2D8EFF] fill-[#8892A0] transition-colors"
                        onClick={() => setRotation(90)}
                    >O</text>
                </svg>
            </div>

            {/* Rosa de los vientos - Siempre apunta al Norte real */}
            <div className="north-rose" style={{ transform: `rotate(${-rotation}deg)`, transition: 'transform 0.3s ease' }}>
                <svg width="20" height="24" viewBox="0 0 20 24">
                    <polygon points="10,2 13,14 10,12 7,14" fill="#2D8EFF"/>
                    <polygon points="10,22 13,10 10,12 7,10" fill="#252B3B" stroke="#2D8EFF" strokeWidth="0.5"/>
                    <text x="10" y="20" textAnchor="middle" fontSize="7" fill="#2D8EFF" fontFamily="sans-serif" dy="6">N</text>
                </svg>
            </div>

            {/* Barra de Escala */}
            <div className="scale-indicator">
                <div className="scale-bar-line"></div>
                <span className="scale-text">5m · 1:100</span>
            </div>

            {/* Mini Herramientas Flotantes */}
            <div className="mini-tools">
                <button 
                    className="mini-btn" 
                    title="Zoom In" 
                    onClick={() => {
                        const nz = Math.min(ZOOM_MAX, zoom * 1.2)
                        setZoom(nz)
                    }}
                >
                    <IconPlus size={16} />
                </button>
                <button 
                    className="mini-btn" 
                    title="Zoom Out"
                    onClick={() => {
                        const nz = Math.max(ZOOM_MIN, zoom / 1.2)
                        setZoom(nz)
                    }}
                >
                    <IconMinus size={16} />
                </button>
                <button 
                    className="mini-btn" 
                    title="Fit View"
                    onClick={() => {
                        // Lógica básica de fit view (centrar en 0,0 con zoom 1)
                        setPan(tamano.width / 2, tamano.height / 2)
                        setZoom(1)
                    }}
                >
                    <IconArrowsMaximize size={16} />
                </button>
                <button 
                    className={`mini-btn ${grillaVisible ? 'text-cyan-400 border-cyan-400/30' : ''}`} 
                    title="Toggle Grid"
                    onClick={toggleGrilla}
                >
                    <IconGrid4x4 size={16} />
                </button>
            </div>

            {/* Modal de Configuración */}
            {modalConfigAbierto && <ConfigModal />}
        </div>
    )
}