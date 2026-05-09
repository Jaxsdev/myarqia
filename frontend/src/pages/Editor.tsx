import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CanvasEditor from '../components/editor/CanvasEditor'
import ToolsSidebar from '../components/editor/ToolsSidebar'
import HUD from '../components/editor/HUD'
import PanelPropiedades from '../components/editor/PanelPropiedades'
import { useProyectoStore } from '../store/useProyectoStore'
import { usePlanoStore } from '../store/usePlanoStore'
import { useGuardadoAutomatico } from '../hooks/useGuardadoAutomatico'
import type { Proyecto } from '../types'
import PanelChat from '../components/chat/PanelChat'
import { useExportarPDF } from '../hooks/useExportarPDF'
import PanelRNE from '../components/editor/PanelRNE'
import { descargarDXF } from '../lib/exportarDXF'
import ContextBar from '../components/editor/ContextBar'

export default function Editor() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { setProyectoActual, proyectoActual } = useProyectoStore()
    const { cargarDatos } = usePlanoStore()
    const [cargando, setCargando] = useState(true)
    const { exportar } = useExportarPDF()
    const { muros, puertas, ventanas } = usePlanoStore()

    // Autosave activo
    const { guardando, ultimaVez } = useGuardadoAutomatico()

    useEffect(() => {
        const cargar = async () => {
            if (!id) return
            const { data, error } = await supabase
                .from('proyectos').select('*').eq('id', id).single()
            if (error || !data) { navigate('/dashboard'); return }

            setProyectoActual(data as Proyecto)

            // Cargar datos del plano si existen
            const datos = data.datos
            if (datos) {
                cargarDatos(
                    datos.muros || [],
                    datos.puertas || [],
                    datos.ventanas || [],
                )
            }
            setCargando(false)
        }
        cargar()
    }, [id])

    if (cargando) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <p className="text-blue-400 text-sm animate-pulse">Cargando proyecto...</p>
            </div>
        )
    }

    return (
        <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">

            {/* Navbar */}
            <nav className="h-11 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-4 flex-shrink-0">
                <button onClick={() => navigate('/dashboard')}
                    className="text-gray-500 hover:text-white text-sm transition-colors">
                    ← Proyectos
                </button>
                <span className="text-gray-700">|</span>
                <span className="text-white text-sm font-medium">
                    {proyectoActual?.nombre}
                </span>

                <button
                    onClick={exportar}
                    className="bg-blue-600 hover:bg-blue-500 border border-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Exportar PDF
                </button>

                <button
                    onClick={() => descargarDXF(
                        muros, puertas, ventanas,
                        proyectoActual?.nombre || 'proyecto'
                    )}
                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                    </svg>
                    Exportar DXF
                </button>

                {/* Indicador de guardado */}
                <div className="ml-auto flex items-center gap-3">
                    {guardando ? (
                        <span className="text-xs text-yellow-500 animate-pulse">
                            Guardando...
                        </span>
                    ) : ultimaVez ? (
                        <span className="text-xs text-green-600">
                            ✓ Guardado {ultimaVez.toLocaleTimeString('es-PE')}
                        </span>
                    ) : (
                        <span className="text-xs text-gray-600">Sin cambios</span>
                    )}
                </div>
            </nav>
            <ContextBar />

            {/* Área principal */}
            <div className="flex flex-1 overflow-hidden">
                <ToolsSidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-hidden">
                        <CanvasEditor />
                    </div>
                    <HUD />
                </div>
                <PanelPropiedades />
                <PanelChat />
                <PanelRNE />
            </div>
        </div>
    )
}