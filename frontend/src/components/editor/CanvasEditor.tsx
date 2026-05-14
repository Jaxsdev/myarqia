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
import { useEditorStore } from '../../store/useEditorStore'
import { usePlanoStore } from '../../store/usePlanoStore'
import type { Punto } from '../../types'
import CapaUniones from './CapaUniones'
import ElementoMuro, { MuroHitArea } from './ElementoMuro'
import CapaCotas from './CapaCotas'
import { TEMA_CLARO, TEMA_OSCURO } from '../../lib/temas'
import CapaEtiquetas from './CapaEtiquetas'
import ConfigModal from './ConfigModal'
import SnapIndicator from './SnapIndicator'
import { calcularSnap } from '../../lib/snap'

const PX_POR_METRO = 100
const ws = (m: number, pan: number, zoom: number) => m * PX_POR_METRO * zoom + pan
const ZOOM_MIN = 0.2
const ZOOM_MAX = 8

function screenToWorld(px: number, pan: number, zoom: number) {
    return (px - pan) / (PX_POR_METRO * zoom)
}

export default function CanvasEditor() {
    const contenedorRef = useRef<HTMLDivElement>(null)
    const [tamano, setTamano] = useState({ width: 800, height: 600 })
    const arrastrando = useRef(false)
    const moviendo = useRef(false)
    const cuadroSeleccion = useRef(false)
    const ultimaPosicion = useRef({ x: 0, y: 0 })
    const posInicioMover = useRef<Punto | null>(null)
    // Última posición del cursor en coordenadas de pantalla. Se usa para resnap
    // al pulsar/soltar Shift sin mover el mouse.
    const lastScreenPos = useRef<{ x: number; y: number } | null>(null)

    // --- Store: editor ---
    const {
        zoom, setZoom, panX, panY, setPan,
        setCursor, herramienta, setHerramienta,
        snapActivo, toggleSnap, snapSize,
        orthoActivo, toggleOrtho,
        cotasVisibles, nomenclaturaVisible, grillaVisible,
        modoClaro, modalConfigAbierto,
        propiedades,
        cursorX, cursorY,
        snapInfo, setSnapInfo,
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
        undo, redo, saveHistory, capas
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

    // --- Shift: re-snap inmediato al pulsar/soltar sin mover el mouse ---
    // Mientras se está dibujando un muro, pulsar Shift debe liberar el ortho
    // automático en tiempo real, aunque el cursor esté quieto.
    useEffect(() => {
        const onShift = (e: KeyboardEvent) => {
            if (e.key !== 'Shift') return
            if (!dibujando || !lastScreenPos.current || !contenedorRef.current) return

            const rect = contenedorRef.current.getBoundingClientRect()
            const raw = {
                x: screenToWorld(lastScreenPos.current.x - rect.left, panX, zoom),
                y: screenToWorld(lastScreenPos.current.y - rect.top, panY, zoom),
            }
            const res = calcularSnap(raw, {
                muros, columnas, escaleras,
                herramienta, zoom, snapSize, snapActivo, orthoActivo,
                puntoInicio,
                shiftActivo: e.type === 'keydown',
                dibujando,
            })
            setSnapInfo(res.info)
            actualizarDibujo(res.punto)
        }
        window.addEventListener('keydown', onShift)
        window.addEventListener('keyup', onShift)
        return () => {
            window.removeEventListener('keydown', onShift)
            window.removeEventListener('keyup', onShift)
        }
    }, [dibujando, panX, panY, zoom, muros, columnas, escaleras, herramienta, snapSize, snapActivo, orthoActivo, puntoInicio, setSnapInfo, actualizarDibujo])

    const getPunto = useCallback((e: MouseEvent<HTMLDivElement>): Punto => {
        const rect = contenedorRef.current!.getBoundingClientRect()
        const raw = {
            x: screenToWorld(e.clientX - rect.left, panX, zoom),
            y: screenToWorld(e.clientY - rect.top, panY, zoom),
        }

        const res = calcularSnap(raw, {
            muros, columnas, escaleras,
            herramienta, zoom, snapSize, snapActivo, orthoActivo,
            puntoInicio,
            shiftActivo: e.shiftKey,
            dibujando,
        })

        // Sincronizar feedback visual del snap. Se actualiza desde un evento
        // de mouse, así que el render es síncrono al frame.
        setSnapInfo(res.info)

        return res.punto
    }, [panX, panY, zoom, snapActivo, snapSize, orthoActivo, puntoInicio, muros, columnas, escaleras, herramienta, dibujando, setSnapInfo])

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

        if (e.button === 1) {
            arrastrando.current = true
            ultimaPosicion.current = { x: e.clientX, y: e.clientY }
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
                terminarPuerta(propiedades.puerta, p)
                return
            }
            if (herramienta === 'window') {
                terminarVentana(propiedades.ventana, p)
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
        lastScreenPos.current = { x: e.clientX, y: e.clientY }
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

        if (dibujando) {
            actualizarDibujo(p)
        }
    }, [getPunto, setCursor, arrastrando, moviendo, dibujando, actualizarDibujo, panX, panY, setPan, moverSeleccion])

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
                if (e.button === 1) arrastrando.current = false
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
                setSnapInfo(null)
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

                <Layer>

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

                    {/* Indicador visual del snap activo */}
                    {snapInfo && herramienta !== 'select' && (
                        <SnapIndicator info={snapInfo} zoom={zoom} panX={panX} panY={panY} />
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

            {/* Modal de Configuración */}
            {modalConfigAbierto && <ConfigModal />}
        </div>
    )
}