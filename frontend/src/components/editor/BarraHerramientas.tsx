import { useEditorStore } from '../../store/useEditorStore'

const herramientas = [
    { id: 'seleccionar', icono: '↖', label: 'Seleccionar', atajo: 'S' },
    { id: 'muro', icono: '▭', label: 'Muro', atajo: 'W' },
    { id: 'puerta', icono: '⌒', label: 'Puerta', atajo: 'D' },
    { id: 'ventana', icono: '⊟', label: 'Ventana', atajo: 'V' },
    { id: 'texto', icono: 'T', label: 'Texto', atajo: 'T' },
] as const

export default function BarraHerramientas() {
    const { herramienta, setHerramienta, snapActivo, toggleSnap } = useEditorStore()
    const { cotasVisibles, toggleCotas, modoClaro, toggleModoClaro } = useEditorStore()


    return (
        <div className="w-14 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-3 gap-1">

            {/* Herramientas */}
            {herramientas.map((h) => (
                <button
                    key={h.id}
                    onClick={() => setHerramienta(h.id)}
                    title={`${h.label} (${h.atajo})`}
                    className={`
            w-10 h-10 rounded-lg text-lg flex items-center justify-center
            transition-colors font-mono
            ${herramienta === h.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 hover:text-white hover:bg-gray-800'}
          `}>
                    {h.icono}
                </button>
            ))}

            {/* Separador */}
            <div className="w-8 border-t border-gray-800 my-2" />

            {/* Snap toggle */}
            <button
                onClick={toggleSnap}
                title={`Ajuste de rejilla (S)`}
                className={`
          w-10 h-10 rounded-lg text-xs flex items-center justify-center font-bold
          transition-colors
          ${snapActivo
                        ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-600/50'
                        : 'text-gray-600 hover:text-white hover:bg-gray-800'}
        `}>
                SNAP
            </button>

            {/* Cotas toggle */}
            <button
                onClick={toggleCotas}
                title="Mostrar/ocultar cotas"
                className={`
          w-10 h-10 rounded-lg text-xs flex items-center justify-center
          font-bold transition-colors
          ${cotasVisibles
                        ? 'bg-red-600/20 text-red-400 border border-red-600/50'
                        : 'text-gray-600 hover:text-white hover:bg-gray-800'}
        `}>
                ⌀
            </button>

            {/* Separador */}
            <div className="w-8 border-t border-gray-800 my-2" />

            {/* Modo claro/oscuro toggle */}
            <button
                onClick={toggleModoClaro}
                title={modoClaro ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
                className={`
          w-10 h-10 rounded-lg text-lg flex items-center justify-center
          transition-all duration-200
          ${modoClaro
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30'
                        : 'bg-slate-700/40 text-slate-400 border border-slate-600/50 hover:bg-slate-700/60'}
        `}>
                {modoClaro ? '☀️' : '🌑'}
            </button>

        </div>
    )
}