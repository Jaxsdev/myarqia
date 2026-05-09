import { useEditorStore } from '../../store/useEditorStore'
import type { Herramienta } from '../../store/useEditorStore'
import {
    IconPointer,
    IconWall,
    IconDoor,
    IconWindow,
    IconTextSize,
    IconMagnet,
    IconDimensions,
    IconSun,
    IconMoon,
} from '@tabler/icons-react'

// Tipado explícito para que el array sea compatible con el tipo Herramienta del store
const herramientas: { id: Herramienta; label: string; atajo: string; icono: React.ReactNode }[] = [
    { id: 'seleccionar', icono: <IconPointer size={20} />, label: 'Seleccionar', atajo: 'S' },
    { id: 'muro',        icono: <IconWall size={20} />,    label: 'Muro',        atajo: 'W' },
    { id: 'puerta',      icono: <IconDoor size={20} />,    label: 'Puerta',      atajo: 'D' },
    { id: 'ventana',     icono: <IconWindow size={20} />,  label: 'Ventana',     atajo: 'V' },
    { id: 'texto',       icono: <IconTextSize size={20} />,label: 'Texto',       atajo: 'T' },
]

export default function BarraHerramientas() {
    const {
        herramienta, setHerramienta,
        snapActivo, toggleSnap,
        cotasVisibles, toggleCotas,
        modoClaro, toggleModoClaro,
    } = useEditorStore()

    return (
        <div className="w-14 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-3 gap-1 z-50 flex-shrink-0">

            {/* Herramientas */}
            {herramientas.map((h) => (
                <button
                    key={h.id}
                    onClick={() => setHerramienta(h.id)}
                    title={`${h.label} (${h.atajo})`}
                    className={`
                        w-10 h-10 rounded-lg flex items-center justify-center
                        transition-all duration-200
                        ${herramienta === h.id
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}
                    `}
                >
                    {h.icono}
                </button>
            ))}

            {/* Separador */}
            <div className="w-8 border-t border-gray-800 my-2" />

            {/* Snap toggle */}
            <button
                onClick={toggleSnap}
                title="Ajuste de rejilla (S)"
                className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    transition-all duration-200
                    ${snapActivo
                        ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-600/50'
                        : 'text-gray-600 hover:text-gray-400 hover:bg-gray-800'}
                `}
            >
                <IconMagnet size={18} />
            </button>

            {/* Cotas toggle */}
            <button
                onClick={toggleCotas}
                title="Mostrar/ocultar cotas"
                className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    transition-all duration-200
                    ${cotasVisibles
                        ? 'bg-red-600/20 text-red-400 border border-red-600/50'
                        : 'text-gray-600 hover:text-gray-400 hover:bg-gray-800'}
                `}
            >
                <IconDimensions size={18} />
            </button>

            {/* Separador */}
            <div className="w-8 border-t border-gray-800 my-2" />

            {/* Modo claro/oscuro toggle */}
            <button
                onClick={toggleModoClaro}
                title={modoClaro ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
                className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    transition-all duration-200
                    ${modoClaro
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30'
                        : 'bg-slate-700/40 text-slate-400 border border-slate-600/50 hover:bg-slate-700/60'}
                `}
            >
                {modoClaro ? <IconSun size={20} /> : <IconMoon size={20} />}
            </button>

        </div>
    )
}