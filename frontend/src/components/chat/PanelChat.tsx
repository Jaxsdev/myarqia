import { useState, useRef, useEffect } from 'react'
import { usePlanoStore } from '../../store/usePlanoStore'
import type { MensajeChat } from '../../types'

let contadorMsg = 1
const uid = () => `msg-${contadorMsg++}`

type Modelo = 'gemini' | 'claude'

const MODELOS = [
    { id: 'gemini' as Modelo, nombre: 'Gemini 2.0 Flash', gratis: true, color: 'text-blue-400' },
    { id: 'claude' as Modelo, nombre: 'Claude Sonnet', gratis: false, color: 'text-purple-400' },
]

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'


// Convierte la respuesta JSON de la IA en muros para el canvas
function procesarRespuestaIA(texto: string) {
    try {
        const limpio = texto.replace(/```json/g, '').replace(/```/g, '').trim()
        const data = JSON.parse(limpio)

        if (data.accion === 'generar_planta' && data.planta?.muros) {
            usePlanoStore.getState().limpiarTodo()

            // Agregar muros
            data.planta.muros.forEach((m: any) => {
                usePlanoStore.setState((s) => ({
                    muros: [...s.muros, {
                        id: `muro-ia-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        x1: Number(m.x1), y1: Number(m.y1),
                        x2: Number(m.x2), y2: Number(m.y2),
                        espesor: Number(m.espesor) || 0.25,
                        altura: Number(m.altura) || 2.80,
                        alturaBase: Number(m.alturaBase) || 0,
                        material: m.material || 'concreto',
                        layer: 'A-WALL' as const,
                    }]
                }))
            })

            // Guardar ambientes si la IA los incluye
            if (data.planta.ambientes?.length > 0) {
                usePlanoStore.getState().setAmbientes(data.planta.ambientes)
            }

            return data.mensaje || '¡Planta generada! Puedes editarla en el canvas.'
        }

        return data.mensaje || texto
    } catch {
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
            .filter((m) => m.rol !== 'ia' || mensajes.indexOf(m) > 0)
            .map((m) => ({
                role: m.rol === 'usuario' ? 'user' : 'assistant',
                content: m.contenido,
            }))

        const endpoint = modelo === 'gemini' ? '/api/chat-gemini' : '/api/chat'

        try {
            const res = await fetch(`${BACKEND_URL}/api/chat`, {
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
        <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col">

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