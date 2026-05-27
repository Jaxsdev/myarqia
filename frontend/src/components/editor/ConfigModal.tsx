import { useEditorStore } from '../../store/useEditorStore'
import { IconX, IconSettings, IconPalette, IconRuler, IconKeyboard } from '@tabler/icons-react'

export default function ConfigModal() {
    const { 
        modalConfigAbierto, setModalConfigAbierto,
        modoClaro, toggleModoClaro,
        escala, setEscala
    } = useEditorStore()

    if (!modalConfigAbierto) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400">
                            <IconSettings size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Configuración del Editor</h2>
                            <p className="text-xs text-slate-400">Personaliza tu entorno de trabajo</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setModalConfigAbierto(false)}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                    >
                        <IconX size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* General Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-300 font-medium">
                            <IconPalette size={18} className="text-blue-500" />
                            <h3>Apariencia y Tema</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => !modoClaro && toggleModoClaro()}
                                className={`p-4 rounded-xl border transition-all ${modoClaro ? 'bg-blue-600/10 border-blue-500/50 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                            >
                                <span className="block text-sm font-semibold">Modo Claro</span>
                                <span className="text-xs opacity-60">Interfaz blanca de alto contraste</span>
                            </button>
                            <button 
                                onClick={() => modoClaro && toggleModoClaro()}
                                className={`p-4 rounded-xl border transition-all ${!modoClaro ? 'bg-blue-600/10 border-blue-500/50 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                            >
                                <span className="block text-sm font-semibold">Modo Oscuro</span>
                                <span className="text-xs opacity-60">Ideal para largas sesiones</span>
                            </button>
                        </div>
                    </section>

                    {/* Architectural Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-300 font-medium">
                            <IconRuler size={18} className="text-green-500" />
                            <h3>Unidades y Escala</h3>
                        </div>
                        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm text-slate-300 block">Escala de Dibujo</span>
                                    <span className="text-xs text-slate-500">Afecta la visualización de cotas y textos</span>
                                </div>
                                <select 
                                    value={escala}
                                    onChange={(e) => setEscala(e.target.value)}
                                    className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="1:50">1:50</option>
                                    <option value="1:100">1:100</option>
                                    <option value="1:200">1:200</option>
                                    <option value="1:500">1:500</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Shortcuts Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-300 font-medium">
                            <IconKeyboard size={18} className="text-orange-500" />
                            <h3>Atajos de Teclado</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-800/50">
                                <span className="text-slate-500">Muro / Pared</span>
                                <kbd className="bg-slate-800 px-1.5 rounded text-slate-300 font-mono">W</kbd>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-800/50">
                                <span className="text-slate-500">Puerta</span>
                                <kbd className="bg-slate-800 px-1.5 rounded text-slate-300 font-mono">D</kbd>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-800/50">
                                <span className="text-slate-500">Snap (Magnetismo)</span>
                                <kbd className="bg-slate-800 px-1.5 rounded text-slate-300 font-mono">S</kbd>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-800/50">
                                <span className="text-slate-500">Medir Área</span>
                                <kbd className="bg-slate-800 px-1.5 rounded text-slate-300 font-mono">A</kbd>
                            </div>
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end">
                    <button 
                        onClick={() => setModalConfigAbierto(false)}
                        className="px-6 py-2 bg-white hover:bg-[var(--acc-soft)] text-black text-sm font-semibold rounded-none transition-colors active:scale-95"
                    >
                        Guardar Cambios
                    </button>
                </div>

            </div>
        </div>
    )
}
