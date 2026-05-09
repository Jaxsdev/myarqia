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
import TopBar from '../components/editor/TopBar'
import ContextBar from '../components/editor/ContextBar'

export default function Editor() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { setProyectoActual, proyectoActual } = useProyectoStore()
    const { cargarDatos } = usePlanoStore()
    const [cargando, setCargando] = useState(true)

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
            <TopBar />
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