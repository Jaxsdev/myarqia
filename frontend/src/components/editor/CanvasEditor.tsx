import React, { useRef, useEffect, useState, useCallback } from 'react'
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
    const cuadroSeleccion = useRef(false)
    const ultimaPosicion = useRef({ x: 0, y: 0 })
    const posInicioMover = useRef<Punto | null>(null)

    // --- Store: editor ---
    const {
        zoom, setZoom, panX, panY, setPan,
        setCursor, herramienta, setHerramienta,
        snapActivo, toggleSnap, snapSize,
        orthoActivo, toggleOrtho,
        cotasVisibles, modoClaro,
        modalConfigAbierto,
        propiedades,
        cursorX, cursorY,
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
    } = usePlanoStore()

    const tema = modoClaro ? TEMA_CLARO : TEMA_OSCURO

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
                case 'f8':
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
    }, [cancelarDibujo, setHerramienta, toggleOrtho, toggleSnap, eliminarSeleccionado])

    const getPunto = useCallback((e: React.MouseEvent): Punto => {
        const rect = contenedorRef.current!.getBoundingClientRect()
        let mx = screenToWorld(e.clientX - rect.left, panX, zoom)
        let my = screenToWorld(e.clientY - rect.top, panY, zoom)

        if (snapActivo) {
            // Radio de snap dinámico (aprox 15px en pantalla)
            const snapRadius = 15 / (PX_POR_METRO * zoom)
            let snapped = false

            // 1. Snap a Extremos de Muros (Prioridad Máxima)
            for (const m of muros) {
                const d1 = Math.sqrt((mx - m.x1) ** 2 + (my - m.y1) ** 2)
                const d2 = Math.sqrt((mx - m.x2) ** 2 + (my - m.y2) ** 2)
                if (d1 < snapRadius) {
                    mx = m.x1; my = m.y1; snapped = true; break
                }
                if (d2 < snapRadius) {
                    mx = m.x2; my = m.y2; snapped = true; break
                }
                
                // 2. Snap a Puntos Medios de Muros
                const midX = (m.x1 + m.x2) / 2
                const midY = (m.y1 + m.y2) / 2
                const dm = Math.sqrt((mx - midX) ** 2 + (my - midY) ** 2)
                if (dm < snapRadius) {
                    mx = midX; my = midY; snapped = true; break
                }
            }

            // 3. Snap a Centros de Elementos (Columnas, Escaleras)
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

            // 4. Snap a bordes de muros (para inserción de puertas/ventanas)
            if (!snapped && (herramienta === 'door' || herramienta === 'window')) {
                for (const m of muros) {
                    const l2 = (m.x2 - m.x1) ** 2 + (m.y2 - m.y1) ** 2
                    if (l2 === 0) continue
                    let t = ((mx - m.x1) * (m.x2 - m.x1) + (my - m.y1) * (m.y2 - m.y1)) / l2
                    t = Math.max(0, Math.min(1, t))
                    const px = m.x1 + t * (m.x2 - m.x1)
                    const py = m.y1 + t * (m.y2 - m.y1)
                    const d = Math.sqrt((mx - px) ** 2 + (my - py) ** 2)
                    if (d < snapRadius) {
                        mx = px; my = py; snapped = true; break
                    }
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
    }, [panX, panY, zoom, snapActivo, snapSize, orthoActivo, puntoInicio, muros, herramienta])

    // --- Wheel: zoom centrado en el cursor ---
    const handleWheel = useCallback((e: React.WheelEvent) => {
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
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
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
                else terminarMuro(propiedades.muro.grosor, true)
            }
            if (herramienta === 'door') {
                terminarPuerta(propiedades.puerta.ancho, propiedades.puerta.sentido, propiedades.puerta.angulo, p)
                return
            }
            if (herramienta === 'window') {
                terminarVentana(propiedades.ventana.ancho, propiedades.ventana.alto, propiedades.ventana.alfeizar, p)
                return
            }
            if (herramienta === 'stair') {
                if (!dibujando) iniciarDibujo(p, 'escalera')
                else terminarEscalera(propiedades.escalera.peldaños, propiedades.escalera.paso, propiedades.escalera.contrapaso)
            }
            if (herramienta === 'column') {
                terminarColumna(propiedades.columna.ancho, propiedades.columna.largo, propiedades.columna.forma as 'cuadrada' | 'circular', p)
                return
            }
            if (herramienta === 'dim') {
                if (!dibujando) iniciarDibujo(p, 'cota')
                else terminarCota(p)
                return
            }
            if (herramienta === 'text') {
                const contenido = prompt("Ingresa el texto:")
                if (contenido !== null && contenido !== "") {
                    terminarTexto(contenido, propiedades.texto.fontSize, propiedades.texto.color, p)
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
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        if (dibujando) cancelarDibujo()
    }, [dibujando, cancelarDibujo])

    // --- MouseMove: actualiza cursor y preview ---
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
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
                    terminarMuro(propiedades.muro.grosor, false)
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

                        muros.forEach(m => {
                            const in1 = m.x1 >= x1 && m.x1 <= x2 && m.y1 >= y1 && m.y1 <= y2
                            const in2 = m.x2 >= x1 && m.x2 <= x2 && m.y2 >= y1 && m.y2 <= y2
                            if (in1 || in2) nuevosIds.push(m.id)
                        })
                        puertas.forEach(p => {
                            if (p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2) nuevosIds.push(p.id)
                        })
                        ventanas.forEach(v => {
                            if (v.x >= x1 && v.x <= x2 && v.y >= y1 && v.y <= y2) nuevosIds.push(v.id)
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
                    <Cuadricula zoom={zoom} panX={panX} panY={panY}
                        width={tamano.width} height={tamano.height}
                        modoClaro={modoClaro} />
                </Layer>

                <Layer>

                    {/* Capa de uniones — dibuja todos los muros unidos */}
                    <CapaUniones
                        muros={muros}
                        puertas={puertas}
                        ventanas={ventanas}
                        zoom={zoom} panX={panX} panY={panY}
                        modoClaro={modoClaro}
                    />

                    {/* Áreas invisibles de detección de clicks */}
                    {muros.map((m) => (
                        <MuroHitArea
                            key={`hit-${m.id}`} muro={m}
                            zoom={zoom} panX={panX} panY={panY}
                            onClick={(id, multi) => {
                                if (herramienta === 'select') {
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
                        visible={true}
                    />

                    {/* Puertas */}
                    {puertas.map((p) => (
                        <ElementoPuerta key={p.id} puerta={p}
                            zoom={zoom} panX={panX} panY={panY}
                            seleccionado={idsSeleccionados.includes(p.id)}
                            onClick={(id, multi) => {
                                if (herramienta === 'select') {
                                    seleccionar(id, multi)
                                    moviendo.current = true
                                    posInicioMover.current = getPunto({ clientX: ultimaPosicion.current.x, clientY: ultimaPosicion.current.y } as any)
                                }
                            }}
                            modoClaro={modoClaro} />
                    ))}

                    {/* Áreas */}
                    {areas.map((a) => (
                        <ElementoArea key={a.id} area={a}
                            zoom={zoom} panX={panX} panY={panY}
                            seleccionado={idsSeleccionados.includes(a.id)}
                            onClick={(id, multi) => {
                                if (herramienta === 'select') {
                                    seleccionar(id, multi)
                                    moviendo.current = true
                                    posInicioMover.current = getPunto({ clientX: ultimaPosicion.current.x, clientY: ultimaPosicion.current.y } as any)
                                }
                            }}
                            modoClaro={modoClaro} />
                    ))}

                    {/* Textos */}
                    {textos.map((t) => (
                        <ElementoTexto key={t.id} texto={t}
                            zoom={zoom} panX={panX} panY={panY}
                            seleccionado={idsSeleccionados.includes(t.id)}
                            onClick={(id, multi) => {
                                if (herramienta === 'select') {
                                    seleccionar(id, multi)
                                    moviendo.current = true
                                    posInicioMover.current = getPunto({ clientX: ultimaPosicion.current.x, clientY: ultimaPosicion.current.y } as any)
                                }
                            }}
                            modoClaro={modoClaro} />
                    ))}

                    {/* Cotas */}
                    {cotas.map((co) => (
                        <ElementoCota key={co.id} cota={co}
                            zoom={zoom} panX={panX} panY={panY}
                            seleccionado={idsSeleccionados.includes(co.id)}
                            onClick={(id, multi) => {
                                if (herramienta === 'select') {
                                    seleccionar(id, multi)
                                    moviendo.current = true
                                    posInicioMover.current = getPunto({ clientX: ultimaPosicion.current.x, clientY: ultimaPosicion.current.y } as any)
                                }
                            }}
                            modoClaro={modoClaro} />
                    ))}

                    {/* Columnas */}
                    {columnas.map((c) => (
                        <ElementoColumna key={c.id} columna={c}
                            zoom={zoom} panX={panX} panY={panY}
                            seleccionado={idsSeleccionados.includes(c.id)}
                            onClick={(id, multi) => {
                                if (herramienta === 'select') {
                                    seleccionar(id, multi)
                                    moviendo.current = true
                                    posInicioMover.current = getPunto({ clientX: ultimaPosicion.current.x, clientY: ultimaPosicion.current.y } as any)
                                }
                            }}
                            modoClaro={modoClaro} />
                    ))}

                    {/* Escaleras */}
                    {escaleras.map((e) => (
                        <ElementoEscalera key={e.id} escalera={e}
                            zoom={zoom} panX={panX} panY={panY}
                            seleccionado={idsSeleccionados.includes(e.id)}
                            onClick={(id, multi) => {
                                if (herramienta === 'select') {
                                    seleccionar(id, multi)
                                    moviendo.current = true
                                    posInicioMover.current = getPunto({ clientX: ultimaPosicion.current.x, clientY: ultimaPosicion.current.y } as any)
                                }
                            }}
                            modoClaro={modoClaro} />
                    ))}

                    {/* Ventanas */}
                    {ventanas.map((v) => (
                        <ElementoVentana key={v.id} ventana={v}
                            zoom={zoom} panX={panX} panY={panY}
                            seleccionado={idsSeleccionados.includes(v.id)}
                            onClick={(id, multi) => {
                                if (herramienta === 'select') {
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
                            ancho={herramienta === 'column' ? propiedades.columna.ancho : (herramienta === 'door' ? propiedades.puerta.ancho : propiedades.ventana.ancho)}
                            largo={herramienta === 'column' ? propiedades.columna.largo : undefined}
                            forma={herramienta === 'column' ? propiedades.columna.forma : undefined}
                            muros={muros}
                            zoom={zoom} panX={panX} panY={panY}
                        />
                    )}

                    {/* Preview muro */}
                    {dibujando && tipoDibujo === 'muro' && puntoInicio && puntoFin && (
                        <PreviewMuro inicio={puntoInicio} fin={puntoFin}
                            espesor={propiedades.muro.grosor} zoom={zoom} panX={panX} panY={panY} />
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

            {/* Modal de Configuración */}
            {modalConfigAbierto && <ConfigModal />}
        </div>
    )
}