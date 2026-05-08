import { useEditorStore } from '../../store/useEditorStore'

export default function HUD() {
    const { cursorX, cursorY, zoom, snapActivo, snapSize } = useEditorStore()

    const pct = Math.round(zoom * 100)

    return (
        <div className="h-8 bg-gray-900 border-t border-gray-800 flex items-center px-4 gap-6 text-xs font-mono">

            {/* Coordenadas */}
            <span className="text-gray-500">
                X: <span className="text-cyan-400">{cursorX.toFixed(2)}m</span>
            </span>
            <span className="text-gray-500">
                Y: <span className="text-cyan-400">{cursorY.toFixed(2)}m</span>
            </span>

            {/* Separador */}
            <span className="text-gray-700">|</span>

            {/* Zoom */}
            <span className="text-gray-500">
                Zoom: <span className="text-gray-300">{pct}%</span>
            </span>

            {/* Snap */}
            <span className="text-gray-500">
                Snap:{' '}
                <span className={snapActivo ? 'text-cyan-400' : 'text-gray-600'}>
                    {snapActivo ? `${snapSize * 100}cm` : 'OFF'}
                </span>
            </span>

            {/* Escala */}
            <span className="text-gray-500">
                Escala: <span className="text-gray-300">1:100</span>
            </span>

            {/* Unidad */}
            <span className="text-gray-700 ml-auto">Metros (m)</span>
        </div>
    )
}