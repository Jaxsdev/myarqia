import { useState, useRef, useEffect } from 'react'
import { usePlanoStore } from '../../store/usePlanoStore'
import type { MensajeChat } from '../../types'
import { useEditorStore } from '../../store/useEditorStore'

let contadorMsg = 1
const uid = () => `msg-${contadorMsg++}`

type Modelo = 'gemini' | 'claude'

const MODELOS = [
    { id: 'gemini' as Modelo, nombre: 'Gemini 2.0 Flash', gratis: true, color: 'text-blue-400' },
    { id: 'claude' as Modelo, nombre: 'Claude Sonnet', gratis: false, color: 'text-purple-400' },
]

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'


// Sanitiza un valor numérico de la IA, devolviendo el fallback si es NaN/Infinity
function safeNum(v: unknown, fallback: number): number {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
}

// Convierte la respuesta JSON de la IA en muros para el canvas
function procesarRespuestaIA(texto: string) {
    try {
        // Paso 1: limpiar backticks y markdown
        const limpio = texto
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim()

        // Paso 2: extraer solo el JSON entre { }
        const inicio = limpio.indexOf('{')
        const fin = limpio.lastIndexOf('}')
        if (inicio === -1 || fin === -1) return texto

        const soloJSON = limpio.substring(inicio, fin + 1)
        const data = JSON.parse(soloJSON)

        // Paso 3: procesar según la acción
        if (data.accion === 'generar_planta' && data.planta) {
            const plano = data.planta

            // Verificar que tenga muros
            if (!plano.muros || plano.muros.length === 0) {
                // Si no tiene muros, generarlos desde los ambientes
                const murosGenerados: any[] = []
                plano.ambientes?.forEach((amb: any) => {
                    const { x, y, ancho, largo } = amb
                    murosGenerados.push(
                        { x1: x, y1: y, x2: x + ancho, y2: y, espesor: 0.25 },
                        { x1: x + ancho, y1: y, x2: x + ancho, y2: y + largo, espesor: 0.25 },
                        { x1: x + ancho, y1: y + largo, x2: x, y2: y + largo, espesor: 0.25 },
                        { x1: x, y1: y + largo, x2: x, y2: y, espesor: 0.25 }
                    )
                })
                plano.muros = murosGenerados
            }
            
            // 3.5: Vincular PUERTAS y VENTANAS a MUROS
            const murosNuevos = plano.muros.map((m: any, i: number) => ({
                id: `muro-ia-${i}-${Date.now()}`,
                x1: safeNum(m.x1, 0),
                y1: safeNum(m.y1, 0),
                x2: safeNum(m.x2, 0),
                y2: safeNum(m.y2, 0),
                espesor: safeNum(m.espesor, 0.15),
                altura: safeNum(m.altura, 2.40),
                tipo: m.tipo || 'simple',
                material: m.material || 'ladrillo',
                alineacion: m.alineacion || 'centro',
                layer: 'A-WALL' as const,
            }))

            // Helper para encontrar el muro más cercano y proyectar
            const snapAMuro = (px: number, py: number) => {
                let mejorMuroId = ''
                let mejorPunto = { x: px, y: py }
                let mejorAngulo = 0
                let minDist = 0.5 // 50cm de radio máximo para snap automático

                murosNuevos.forEach((m: any) => {
                    const l2 = (m.x2 - m.x1) ** 2 + (m.y2 - m.y1) ** 2
                    if (l2 === 0) return
                    let t = ((px - m.x1) * (m.x2 - m.x1) + (py - m.y1) * (m.y2 - m.y1)) / l2
                    t = Math.max(0, Math.min(1, t))
                    const pX = m.x1 + t * (m.x2 - m.x1)
                    const pY = m.y1 + t * (m.y2 - m.y1)
                    const d = Math.sqrt((px - pX) ** 2 + (py - pY) ** 2)

                    if (d < minDist) {
                        minDist = d
                        mejorMuroId = m.id
                        mejorPunto = { x: pX, y: pY }
                        mejorAngulo = Math.atan2(m.y2 - m.y1, m.x2 - m.x1)
                    }
                })
                return { id: mejorMuroId, ...mejorPunto, angulo: mejorAngulo }
            }

            // Limpiar el plano actual
            usePlanoStore.getState().limpiarTodo()

            // Agregar MUROS
            usePlanoStore.setState({ muros: murosNuevos })

            // Agregar PUERTAS
            plano.puertas?.forEach((p: any, i: number) => {
                const snapped = snapAMuro(safeNum(p.x, 0), safeNum(p.y, 0))
                usePlanoStore.setState((s) => ({
                    puertas: [...s.puertas, {
                        id: `puerta-ia-${i}-${Date.now()}`,
                        muro_id: snapped.id,
                        x: snapped.x,
                        y: snapped.y,
                        rotacion: snapped.id ? snapped.angulo : (safeNum(p.angulo, 0) * Math.PI / 180),
                        ancho: safeNum(p.ancho, 0.90),
                        sentido: p.sentido || 'derecha',
                        angulo: safeNum(p.angulo, 90),
                        tipo: p.tipo || 'simple',
                        layer: 'A-DOOR' as const,
                    }]
                }))
            })

            // Agregar VENTANAS
            plano.ventanas?.forEach((v: any, i: number) => {
                const snapped = snapAMuro(safeNum(v.x, 0), safeNum(v.y, 0))
                usePlanoStore.setState((s) => ({
                    ventanas: [...s.ventanas, {
                        id: `ventana-ia-${i}-${Date.now()}`,
                        muro_id: snapped.id,
                        x: snapped.x,
                        y: snapped.y,
                        rotacion: snapped.id ? snapped.angulo : (safeNum(v.rotacion, 0) * Math.PI / 180),
                        ancho: safeNum(v.ancho, 1.20),
                        alto: safeNum(v.alto, 1.20),
                        alfeizar: safeNum(v.alfeizar, 0.90),
                        tipo: v.tipo || 'corredera',
                        layer: 'A-WIND' as const,
                    }]
                }))
            })

            // Agregar AMBIENTES para etiquetas
            if (plano.ambientes?.length > 0) {
                usePlanoStore.getState().setAmbientes(plano.ambientes)
            }

            // Centrar la vista
            const todosX = plano.muros?.flatMap((m: any) => [m.x1, m.x2]) || []
            const todosY = plano.muros?.flatMap((m: any) => [m.y1, m.y2]) || []
            if (todosX.length > 0) {
                const minX = Math.min(...todosX)
                const maxX = Math.max(...todosX)
                const minY = Math.min(...todosY)
                const maxY = Math.max(...todosY)

                setTimeout(() => {
                    const PX = 100
                    const viewW = window.innerWidth * 0.55
                    const viewH = window.innerHeight * 0.75
                    const anchoPlano = (maxX - minX) * PX
                    const altoPlano = (maxY - minY) * PX
                    const zoomFit = Math.min(
                        viewW / (anchoPlano + 100),
                        viewH / (altoPlano + 100),
                        2.0
                    )
                    const panX = viewW / 2 - ((minX + maxX) / 2) * PX * zoomFit
                    const panY = viewH / 2 - ((minY + maxY) / 2) * PX * zoomFit

                    useEditorStore.getState().setZoom(zoomFit)
                    useEditorStore.getState().setPan(panX, panY)
                }, 100)
            }

            return data.mensaje || '¡Planta generada correctamente!'
        }

        // Si es solo mensaje de texto
        if (data.accion === 'mensaje') {
            return data.mensaje || texto
        }

        // Fallback: cualquier otro JSON devuelve el mensaje si existe
        return data.mensaje || texto

    } catch {
        // Si no es JSON válido, devolver el texto tal cual
        return texto
    }
}

export default function PanelChat() {
    const [modelo, setModelo] = useState<Modelo>('gemini')
    const [mostrarSelector, setMostrarSelector] = useState(false)
    const [mensajes, setMensajes] = useState<MensajeChat[]>([
        {
            id: uid(),
            rol: 'ia',
            contenido: '¡Hola! Soy ArqIA 👋 Descríbeme tu proyecto y genero el plano. Ejemplo: "Quiero una casa con sala, cocina, 2 cuartos y 1 baño"',
            timestamp: new Date(),
        }
    ])
    const [input, setInput] = useState('')
    const [cargando, setCargando] = useState(false)
    const endRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [mensajes])

    const modeloActual = MODELOS.find(m => m.id === modelo)!

    const enviar = async () => {
        if (!input.trim() || cargando) return

        const textoUsuario = input.trim()
        setInput('')

        const msgUsuario: MensajeChat = {
            id: uid(), rol: 'usuario',
            contenido: textoUsuario, timestamp: new Date(),
        }
        setMensajes((prev) => [...prev, msgUsuario])
        setCargando(true)

        const historial = [...mensajes, msgUsuario]
            .slice(1)  // Excluir mensaje de bienvenida (primer mensaje IA)
            .map((m) => ({
                role: m.rol === 'usuario' ? 'user' : 'assistant',
                content: m.contenido,
            }))

        const endpoint = modelo === 'gemini' ? '/api/chat-gemini' : '/api/chat'

        try {
            const res = await fetch(`${BACKEND_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mensajes: historial }),
            })

            const data = await res.json()
            if (data.error) throw new Error(data.error)

            const textoIA = procesarRespuestaIA(data.respuesta)

            setMensajes((prev) => [...prev, {
                id: uid(), rol: 'ia',
                contenido: textoIA, timestamp: new Date(),
            }])
        } catch (err: any) {
            setMensajes((prev) => [...prev, {
                id: uid(), rol: 'ia',
                contenido: `Error: ${err.message}`,
                timestamp: new Date(),
            }])
        }

        setCargando(false)
    }

    return (
        <div className="h-full flex flex-col bg-gray-900">

            {/* Header con selector de modelo */}
            <div className="px-4 py-3 border-b border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-white text-sm font-semibold">ArqIA</span>
                </div>

                {/* Selector de modelo */}
                <div className="relative">
                    <button
                        onClick={() => setMostrarSelector(!mostrarSelector)}
                        className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${modeloActual.color}`}>
                                {modeloActual.nombre}
                            </span>
                            {modeloActual.gratis && (
                                <span className="text-xs bg-green-900/40 text-green-400 border border-green-700/40 px-1.5 py-0.5 rounded-full">
                                    gratis
                                </span>
                            )}
                        </div>
                        <span className="text-gray-500 text-xs">{mostrarSelector ? '▲' : '▼'}</span>
                    </button>

                    {mostrarSelector && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden z-10 shadow-xl">
                            {MODELOS.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => { setModelo(m.id); setMostrarSelector(false) }}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-700 transition-colors ${modelo === m.id ? 'bg-gray-700' : ''}`}
                                >
                                    <div>
                                        <span className={`text-xs font-medium block ${m.color}`}>{m.nombre}</span>
                                        <span className="text-gray-500 text-xs">
                                            {m.id === 'gemini' ? 'Google · Rápido y gratuito' : 'Anthropic · Más preciso'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {m.gratis && (
                                            <span className="text-xs bg-green-900/40 text-green-400 border border-green-700/40 px-1.5 py-0.5 rounded-full">
                                                gratis
                                            </span>
                                        )}
                                        {modelo === m.id && <span className="text-blue-400 text-xs">✓</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {mensajes.map((m) => (
                    <div key={m.id}
                        className={`flex ${m.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
              max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed
              ${m.rol === 'usuario'
                                ? 'bg-blue-600 text-white rounded-br-sm'
                                : 'bg-gray-800 text-gray-200 rounded-bl-sm'}
            `}>
                            {m.rol === 'ia' && (
                                <span className={`text-xs font-bold block mb-1 ${modeloActual.color}`}>
                                    ArqIA · {modeloActual.nombre}
                                </span>
                            )}
                            {m.contenido}
                        </div>
                    </div>
                ))}

                {cargando && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
                            <div className="flex gap-1 items-center">
                                <span className={`text-xs font-bold mr-2 ${modeloActual.color}`}>ArqIA</span>
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-800">
                <div className="flex gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                enviar()
                            }
                        }}
                        placeholder="Describe tu proyecto..."
                        rows={2}
                        className="flex-1 bg-gray-800 text-white text-sm px-3 py-2 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none resize-none placeholder-gray-600"
                    />
                    <button
                        onClick={enviar}
                        disabled={cargando || !input.trim()}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-600 text-white px-3 rounded-xl transition-colors self-end pb-2">
                        ↑
                    </button>
                </div>
                <p className="text-gray-700 text-xs mt-1.5 text-center">
                    Enter enviar · Shift+Enter nueva línea
                </p>
            </div>
        </div>
    )
}