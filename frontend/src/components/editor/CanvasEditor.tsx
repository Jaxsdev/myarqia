import { useRef, useEffect, useState, useCallback } from 'react'
import { Stage, Layer } from 'react-konva'
import Cuadricula from './Cuadricula'
import ElementoPuerta from './ElementoPuerta'
import ElementoVentana from './ElementoVentana'
import PreviewMuro from './PreviewMuro'
import PreviewElemento from './PreviewElemento'
import { useEditorStore } from '../../store/useEditorStore'
import { usePlanoStore } from '../../store/usePlanoStore'
import type { Punto } from '../../types'
import CapaUniones from './CapaUniones'
import ElementoMuro, { MuroHitArea } from './ElementoMuro'
import CapaCotas from './CapaCotas'
import { TEMA_CLARO, TEMA_OSCURO } from '../../lib/temas'
import CapaEtiquetas from './CapaEtiquetas'



const PX_POR_METRO = 100
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
    const ultimaPosicion = useRef({ x: 0, y: 0 })

    const { zoom, setZoom, panX, panY, setPan,
        setCursor, herramienta, snapActivo, snapSize,
        cotasVisibles, modoClaro } = useEditorStore()

    const { muros, puertas, ventanas, ambientes,
        dibujando, tipoDibujo, puntoInicio, puntoFin,
        idSeleccionado, iniciarDibujo, actualizarDibujo,
        terminarMuro, terminarPuerta, terminarVentana,
        cancelarDibujo, seleccionar, eliminarSeleccionado } = usePlanoStore()

    const { setHerramienta } = useEditorStore()

    const tema = modoClaro ? TEMA_CLARO : TEMA_OSCURO

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

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // No interferir con inputs de texto
            if (e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement) return

            switch (e.key.toLowerCase()) {
                case 'escape': cancelarDibujo(); break
                case 'w': setHerramienta('muro'); break
                case 'd': setHerramienta('puerta'); break
                case 'v': setHerramienta('ventana'); break
                case 's': setHerramienta('seleccionar'); break
                case 'delete':
                case 'backspace':
                    eliminarSeleccionado(); break
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [])
    const getPunto = useCallback((e: React.MouseEvent): Punto => {
        const rect = contenedorRef.current!.getBoundingClientRect()
        const mx = screenToWorld(e.clientX - rect.left, panX, zoom)
        const my = screenToWorld(e.clientY - rect.top, panY, zoom)
        return {
            x: snapActivo ? snapear(mx, snapSize) : mx,
            y: snapActivo ? snapear(my, snapSize) : my,
        }
    }, [panX, panY, zoom, snapActivo, snapSize])

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault()
        const factor = e.deltaY > 0 ? 0.92 : 1.08
        const nz = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom * factor))
        const rect = contenedorRef.current!.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        setZoom(nz)
        setPan(mx - (mx - panX) * (nz / zoom), my - (my - panY) * (nz / zoom))
    }, [zoom, panX, panY])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 1) {
            arrastrando.current = true
            ultimaPosicion.current = { x: e.clientX, y: e.clientY }
            return
        }
        if (e.button === 0) {
            const p = getPunto(e)
            if (herramienta === 'muro') {
                if (!dibujando) iniciarDibujo(p, 'muro')
                else terminarMuro(0.25, true)
            }
            if (herramienta === 'puerta') {
                if (!dibujando) iniciarDibujo(p, 'puerta')
                else terminarPuerta()
            }
            if (herramienta === 'ventana') {
                if (!dibujando) iniciarDibujo(p, 'ventana')
                else terminarVentana()
            }
            if (herramienta === 'seleccionar') seleccionar(null)
        }
    }, [herramienta, dibujando, getPunto])

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        if (dibujando) {
            cancelarDibujo()
        }
    }, [dibujando, cancelarDibujo])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const p = getPunto(e)
        setCursor(p.x, p.y)
        if (dibujando) actualizarDibujo(p)
        if (arrastrando.current) {
            const dx = e.clientX - ultimaPosicion.current.x
            const dy = e.clientY - ultimaPosicion.current.y
            setPan(panX + dx, panY + dy)
            ultimaPosicion.current = { x: e.clientX, y: e.clientY }
        }
    }, [panX, panY, zoom, dibujando, getPunto])

    const cursorStyle =
        herramienta === 'seleccionar' ? 'default' : 'crosshair'

    return (
        <div
            ref={contenedorRef}
            className="w-full h-full overflow-hidden transition-colors duration-300"
            style={{ cursor: cursorStyle, backgroundColor: tema.fondoCanvas }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onContextMenu={handleContextMenu}
            onMouseUp={(e) => { if (e.button === 1) arrastrando.current = false }}
            onMouseLeave={() => { arrastrando.current = false }}
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
                        zoom={zoom} panX={panX} panY={panY}
                        modoClaro={modoClaro}
                    />

                    {/* Highlight del muro seleccionado */}
                    {muros.map((m) => (
                        <ElementoMuro
                            key={m.id} muro={m}
                            zoom={zoom} panX={panX} panY={panY}
                            seleccionado={m.id === idSeleccionado}
                            onClick={seleccionar}
                        />
                    ))}

                    {/* Áreas invisibles de detección de clicks */}
                    {muros.map((m) => (
                        <MuroHitArea
                            key={`hit-${m.id}`} muro={m}
                            zoom={zoom} panX={panX} panY={panY}
                            onClick={seleccionar}
                        />
                    ))}

                    {/* Muros */}
                    {muros.map((m) => (
                        <ElementoMuro key={m.id} muro={m}
                            zoom={zoom} panX={panX} panY={panY}
                            seleccionado={m.id === idSeleccionado}
                            onClick={seleccionar} />
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
                            seleccionado={p.id === idSeleccionado}
                            onClick={seleccionar}
                            modoClaro={modoClaro} />
                    ))}

                    {/* Ventanas */}
                    {ventanas.map((v) => (
                        <ElementoVentana key={v.id} ventana={v}
                            zoom={zoom} panX={panX} panY={panY}
                            seleccionado={v.id === idSeleccionado}
                            onClick={seleccionar}
                            modoClaro={modoClaro} />
                    ))}

                    {/* Preview muro */}
                    {dibujando && tipoDibujo === 'muro' && puntoInicio && puntoFin && (
                        <PreviewMuro inicio={puntoInicio} fin={puntoFin}
                            espesor={0.25} zoom={zoom} panX={panX} panY={panY} />
                    )}

                    {/* Preview puerta/ventana */}
                    {dibujando && tipoDibujo !== 'muro' && puntoInicio && puntoFin && (
                        <PreviewElemento inicio={puntoInicio} fin={puntoFin}
                            tipo={tipoDibujo as 'puerta' | 'ventana'}
                            zoom={zoom} panX={panX} panY={panY} />
                    )}
                </Layer>
            </Stage>
        </div>
    )
}