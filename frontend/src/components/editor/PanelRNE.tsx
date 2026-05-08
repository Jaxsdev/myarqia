import { useMemo, useState } from 'react'
import { usePlanoStore } from '../../store/usePlanoStore'
import { verificarRNE, type ObservacionRNE } from '../../lib/verificadorRNE'

export default function PanelRNE() {
    const { muros, puertas, ventanas } = usePlanoStore()
    const [abierto, setAbierto] = useState(false)

    const resultado = useMemo(
        () => verificarRNE(muros, puertas, ventanas),
        [muros, puertas, ventanas]
    )

    const colorBadge =
        resultado.errores > 0 ? 'bg-red-500' :
            resultado.advertencias > 0 ? 'bg-yellow-500' : 'bg-green-500'

    const totalProblemas = resultado.errores + resultado.advertencias

    return (
        <>
            {/* Botón flotante */}
            <button
                onClick={() => setAbierto(!abierto)}
                className={`
          fixed bottom-12 right-4 z-50
          flex items-center gap-2 px-3 py-2 rounded-xl
          border transition-all shadow-lg text-sm font-medium
          ${abierto
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500'}
        `}>
                <span className="text-base">📋</span>
                <span>RNE</span>
                {totalProblemas > 0 ? (
                    <span className={`${colorBadge} text-white text-xs px-1.5 py-0.5 rounded-full font-bold`}>
                        {totalProblemas}
                    </span>
                ) : (
                    <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">✓</span>
                )}
            </button>

            {/* Panel desplegable */}
            {abierto && (
                <div className="fixed bottom-20 right-4 z-50 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">

                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                        <div>
                            <h3 className="text-white text-sm font-bold">
                                Verificación RNE
                            </h3>
                            <p className="text-gray-500 text-xs mt-0.5">
                                Reglamento Nacional de Edificaciones · Perú
                            </p>
                        </div>
                        <div className={`
              px-2.5 py-1 rounded-lg text-xs font-bold
              ${resultado.aprobado
                                ? 'bg-green-900/40 text-green-400 border border-green-700/40'
                                : 'bg-red-900/40 text-red-400 border border-red-700/40'}
            `}>
                            {resultado.aprobado ? '✓ APROBADO' : '✗ OBSERVADO'}
                        </div>
                    </div>

                    {/* Resumen */}
                    <div className="px-4 py-2 border-b border-gray-800 flex gap-3">
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-gray-400">{resultado.errores} error(es)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="w-2 h-2 rounded-full bg-yellow-500" />
                            <span className="text-gray-400">{resultado.advertencias} advertencia(s)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-gray-400">
                                {resultado.observaciones.filter(o => o.tipo === 'ok').length} ok
                            </span>
                        </div>
                    </div>

                    {/* Lista de observaciones */}
                    <div className="max-h-72 overflow-y-auto">
                        {resultado.observaciones.length === 0 ? (
                            <div className="p-6 text-center text-gray-600 text-sm">
                                Dibuja elementos en el plano para verificar
                            </div>
                        ) : (
                            resultado.observaciones.map((obs) => (
                                <ObservacionItem key={obs.id} obs={obs} />
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 border-t border-gray-800">
                        <p className="text-gray-700 text-xs text-center">
                            La verificación es orientativa · Consultar con arquitecto colegiado
                        </p>
                    </div>
                </div>
            )}
        </>
    )
}

function ObservacionItem({ obs }: { obs: ObservacionRNE }) {
    const config = {
        error: { bg: 'bg-red-900/20', border: 'border-red-800/40', icon: '✗', color: 'text-red-400' },
        advertencia: { bg: 'bg-yellow-900/20', border: 'border-yellow-800/40', icon: '⚠', color: 'text-yellow-400' },
        ok: { bg: 'bg-green-900/10', border: 'border-green-800/30', icon: '✓', color: 'text-green-400' },
    }[obs.tipo]

    return (
        <div className={`mx-3 my-2 p-3 rounded-xl border ${config.bg} ${config.border}`}>
            <div className="flex items-start gap-2">
                <span className={`text-sm flex-shrink-0 mt-0.5 ${config.color}`}>
                    {config.icon}
                </span>
                <div className="min-w-0">
                    <p className="text-gray-300 text-xs leading-relaxed">
                        {obs.descripcion}
                    </p>
                    {obs.valor_actual && (
                        <div className="flex gap-3 mt-1.5">
                            <span className="text-gray-600 text-xs">
                                Actual: <span className="text-gray-400 font-mono">{obs.valor_actual}</span>
                            </span>
                            {obs.valor_minimo && (
                                <span className="text-gray-600 text-xs">
                                    Mín: <span className="text-gray-400 font-mono">{obs.valor_minimo}</span>
                                </span>
                            )}
                        </div>
                    )}
                    <p className={`text-xs mt-1 font-mono ${config.color} opacity-70`}>
                        {obs.articulo}
                    </p>
                </div>
            </div>
        </div>
    )
}