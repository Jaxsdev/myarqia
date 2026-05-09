import { useEditorStore } from '../../store/useEditorStore'
import { useRNEStore } from '../../store/useRNEStore'
import {
    IconMagnet,
    IconAngle,
    IconBox,
    IconFileText,
    IconRulerMeasure,
    IconAlertTriangle,
    IconCheck,
    IconViewportWide,
    IconDimensions,
    IconRotate,
} from '@tabler/icons-react'

export default function ContextBar() {
    const {
        herramienta,
        snapActivo, toggleSnap, snapSize, setSnapSize,
        orthoActivo, toggleOrtho,
        vista, setVista,
        escala, setEscala,
        cotasVisibles, toggleCotas,
        propiedades,
        setPropiedadMuro,
        setPropiedadPuerta,
        setPropiedadVentana,
    } = useEditorStore()

    const { conteoAlertas } = useRNEStore()

    const renderToolOptions = () => {
        switch (herramienta) {
            case 'muro':
                return (
                    <>
                        <div className="h-4 w-px bg-gray-800 mx-1 flex-shrink-0" />
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-gray-500">Grosor:</span>
                            <select
                                value={propiedades.muro.grosor}
                                onChange={(e) => setPropiedadMuro({ grosor: parseFloat(e.target.value) })}
                                className="bg-gray-800 border border-gray-700 rounded px-1 h-6 text-[11px] outline-none focus:border-blue-500 cursor-pointer"
                            >
                                <option value={0.10}>10cm</option>
                                <option value={0.15}>15cm</option>
                                <option value={0.20}>20cm</option>
                                <option value={0.25}>25cm</option>
                                <option value={0.30}>30cm</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-gray-500">Material:</span>
                            <select
                                value={propiedades.muro.material}
                                onChange={(e) => setPropiedadMuro({ material: e.target.value })}
                                className="bg-gray-800 border border-gray-700 rounded px-1 h-6 text-[11px] outline-none focus:border-blue-500 cursor-pointer"
                            >
                                <option value="ladrillo">Ladrillo</option>
                                <option value="drywall">Drywall</option>
                                <option value="concreto">Concreto</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-gray-500">Alineación:</span>
                            <div className="flex bg-gray-800 rounded p-0.5 border border-gray-700">
                                {(['izquierda', 'centro', 'derecha'] as const).map((a) => (
                                    <button
                                        key={a}
                                        onClick={() => setPropiedadMuro({ alineacion: a })}
                                        className={`px-2 py-0.5 rounded text-[10px] transition-colors ${propiedades.muro.alineacion === a ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-500'}`}
                                    >
                                        {a.charAt(0).toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )
            case 'puerta':
                return (
                    <>
                        <div className="h-4 w-px bg-gray-800 mx-1 flex-shrink-0" />
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-gray-500">Ancho:</span>
                            <select
                                value={propiedades.puerta.ancho}
                                onChange={(e) => setPropiedadPuerta({ ancho: parseFloat(e.target.value) })}
                                className="bg-gray-800 border border-gray-700 rounded px-1 h-6 text-[11px] outline-none focus:border-blue-500 cursor-pointer"
                            >
                                <option value={0.70}>70cm</option>
                                <option value={0.80}>80cm</option>
                                <option value={0.90}>90cm</option>
                                <option value={1.00}>1.00m</option>
                                <option value={1.20}>1.20m</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-gray-500">Sentido:</span>
                            <button
                                onClick={() => setPropiedadPuerta({ sentido: propiedades.puerta.sentido === 'izquierda' ? 'derecha' : 'izquierda' })}
                                className="bg-gray-800 border border-gray-700 rounded px-2 h-6 flex items-center gap-1 hover:border-blue-500 transition-colors text-[11px]"
                            >
                                <IconRotate
                                    size={12}
                                    style={{ transform: propiedades.puerta.sentido === 'izquierda' ? 'scaleX(-1)' : 'scaleX(1)' }}
                                />
                                {propiedades.puerta.sentido === 'izquierda' ? 'IZQ' : 'DER'}
                            </button>
                        </div>
                    </>
                )
            case 'ventana':
                return (
                    <>
                        <div className="h-4 w-px bg-gray-800 mx-1 flex-shrink-0" />
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-gray-500">Ancho:</span>
                            <input
                                type="number"
                                step={0.05}
                                min={0.30}
                                max={3.00}
                                value={propiedades.ventana.ancho}
                                onChange={(e) => setPropiedadVentana({ ancho: parseFloat(e.target.value) })}
                                className="w-14 bg-gray-800 border border-gray-700 rounded px-1 h-6 text-[11px] outline-none focus:border-blue-500"
                            />
                            <span className="text-gray-600">m</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-gray-500">Alféizar:</span>
                            <input
                                type="number"
                                step={0.05}
                                min={0}
                                max={2.00}
                                value={propiedades.ventana.alfeizar}
                                onChange={(e) => setPropiedadVentana({ alfeizar: parseFloat(e.target.value) })}
                                className="w-14 bg-gray-800 border border-gray-700 rounded px-1 h-6 text-[11px] outline-none focus:border-blue-500"
                            />
                            <span className="text-gray-600">m</span>
                        </div>
                    </>
                )
            default:
                return null
        }
    }

    return (
        <div className="h-[34px] bg-gray-950/95 border-b border-gray-800 flex items-center px-3 gap-3 text-[11px] text-gray-300 select-none flex-shrink-0 overflow-x-auto overflow-y-hidden" style={{ scrollbarWidth: 'none' }}>

            {/* Snap Toggle + Resolución */}
            <div className="flex items-center gap-1 bg-gray-900/60 rounded-md px-0.5 border border-gray-800 flex-shrink-0">
                <button
                    onClick={toggleSnap}
                    title="Snap Magnético (S)"
                    className={`p-1 rounded transition-colors ${snapActivo ? 'text-green-400' : 'text-gray-600 hover:text-gray-400'}`}
                >
                    <IconMagnet size={14} />
                </button>
                <select
                    value={snapSize}
                    onChange={(e) => setSnapSize(parseFloat(e.target.value))}
                    className="bg-transparent outline-none text-[10px] pr-1 border-none cursor-pointer text-gray-500 hover:text-gray-300"
                >
                    <option value={0.05}>5cm</option>
                    <option value={0.10}>10cm</option>
                    <option value={0.25}>25cm</option>
                    <option value={0.50}>50cm</option>
                    <option value={1.00}>1m</option>
                </select>
            </div>

            {/* Ortho Toggle (F8) */}
            <button
                onClick={toggleOrtho}
                title="Modo Ortho (F8)"
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors border flex-shrink-0 ${orthoActivo ? 'bg-blue-600/20 text-blue-400 border-blue-600/50' : 'text-gray-500 border-transparent hover:bg-gray-800'}`}
            >
                <IconAngle size={14} />
                <span className="font-medium">ORTHO</span>
            </button>

            <div className="h-4 w-px bg-gray-800 flex-shrink-0" />

            {/* Vista */}
            <div className="flex bg-gray-900/60 rounded-md p-0.5 border border-gray-800 flex-shrink-0">
                <button
                    onClick={() => setVista('2d')}
                    title="Planta 2D"
                    className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${vista === '2d' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-600 hover:text-gray-400'}`}
                >
                    <IconBox size={13} />
                    <span>2D</span>
                </button>
                <button
                    onClick={() => setVista('3d')}
                    title="Vista 3D"
                    className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${vista === '3d' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-600 hover:text-gray-400'}`}
                >
                    <IconViewportWide size={13} />
                    <span>3D</span>
                </button>
                <button
                    onClick={() => setVista('planos')}
                    title="Planos técnicos"
                    className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${vista === 'planos' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-600 hover:text-gray-400'}`}
                >
                    <IconFileText size={13} />
                    <span>Planos</span>
                </button>
            </div>

            {/* Escala */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
                <IconRulerMeasure size={13} className="text-gray-500" />
                <select
                    value={escala}
                    onChange={(e) => setEscala(e.target.value)}
                    className="bg-gray-900 border border-gray-800 rounded px-1.5 h-6 text-[11px] outline-none focus:border-blue-500 text-gray-400 cursor-pointer"
                >
                    <option value="1:200">1:200</option>
                    <option value="1:100">1:100</option>
                    <option value="1:75">1:75</option>
                    <option value="1:50">1:50</option>
                    <option value="1:25">1:25</option>
                    <option value="1:20">1:20</option>
                    <option value="1:10">1:10</option>
                </select>
            </div>

            {/* Toggle Cotas */}
            <button
                onClick={toggleCotas}
                title="Mostrar/ocultar cotas (D)"
                className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors flex-shrink-0 ${cotasVisibles ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-400'}`}
            >
                <IconDimensions size={13} />
                <span>COTAS</span>
            </button>

            {/* Opciones dinámicas de la herramienta activa */}
            {renderToolOptions()}

            {/* Badge RNE — empuja a la derecha */}
            <div className="ml-auto flex-shrink-0">
                <button
                    title="Ver verificación RNE"
                    className={`flex items-center gap-1.5 px-3 h-6 rounded-full transition-colors font-semibold text-[10px] ${conteoAlertas > 0 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50 hover:bg-orange-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30'}`}
                >
                    {conteoAlertas > 0 ? <IconAlertTriangle size={12} /> : <IconCheck size={12} />}
                    <span>RNE {conteoAlertas > 0 ? `(${conteoAlertas})` : 'OK'}</span>
                </button>
            </div>
        </div>
    )
}
