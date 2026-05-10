import { useEffect, useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import type { Proyecto } from '../types'

export default function Dashboard() {
    const navigate = useNavigate()
    const { usuario, cerrarSesion } = useAuthStore()
    const [proyectos, setProyectos] = useState<Proyecto[]>([])
    const [cargando, setCargando] = useState(true)
    const [creando, setCreando] = useState(false)

    // Redirigir si no hay sesión
    useEffect(() => {
        if (!usuario) navigate('/')
    }, [usuario])

    // Cargar proyectos
    useEffect(() => {
        const cargar = async () => {
            const { data } = await supabase
                .from('proyectos')
                .select('*')
                .order('actualizado_at', { ascending: false })
            setProyectos(data || [])
            setCargando(false)
        }
        cargar()
    }, [])

    const crearProyecto = async () => {
        setCreando(true)

        // Obtener el usuario actual
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            alert('No hay sesión activa. Vuelve a iniciar sesión.')
            setCreando(false)
            return
        }

        const { data, error } = await supabase
            .from('proyectos')
            .insert({
                user_id: user.id,          // 👈 esto es lo que faltaba
                nombre: 'Proyecto sin título',
                datos: {
                    ambientes: [],
                    muros: [],
                    puertas: [],
                    ventanas: [],
                    escala: 100,
                    unidad: 'metros',
                },
            })
            .select()
            .single()

        if (error) {
            alert(`Error: ${error.message}`)
            console.error(error)
            setCreando(false)
            return
        }

        if (data) navigate(`/editor/${data.id}`)
        setCreando(false)
    }

    const eliminarProyecto = async (id: string, e: MouseEvent) => {
        e.stopPropagation()
        if (!confirm('¿Eliminar este proyecto?')) return
        await supabase.from('proyectos').delete().eq('id', id)
        setProyectos((prev) => prev.filter((p) => p.id !== id))
    }


    return (
        <div className="min-h-screen bg-gray-950 text-white">

            {/* Navbar */}
            <nav className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-blue-500">MyARQIA</span>
                    <span className="text-gray-600 text-sm">/ Mis proyectos</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm">{usuario?.email}</span>
                    <button
                        onClick={cerrarSesion}
                        className="text-gray-500 hover:text-white text-sm transition-colors">
                        Cerrar sesión
                    </button>
                </div>
            </nav>

            {/* Contenido */}
            <main className="max-w-6xl mx-auto px-8 py-10">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold">Mis proyectos</h2>
                        <p className="text-gray-500 text-sm mt-1">
                            {proyectos.length === 0
                                ? 'Aún no tienes proyectos'
                                : `${proyectos.length} proyecto${proyectos.length > 1 ? 's' : ''}`}
                        </p>
                    </div>
                    <button
                        onClick={crearProyecto}
                        disabled={creando}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2">
                        <span className="text-lg leading-none">+</span>
                        {creando ? 'Creando...' : 'Nuevo proyecto'}
                    </button>
                </div>

                {/* Estado de carga */}
                {cargando && (
                    <div className="text-center py-20 text-gray-600">
                        Cargando proyectos...
                    </div>
                )}

                {/* Estado vacío */}
                {!cargando && proyectos.length === 0 && (
                    <div className="text-center py-24 border-2 border-dashed border-gray-800 rounded-2xl">
                        <div className="text-5xl mb-4">🏗️</div>
                        <h3 className="text-xl font-semibold text-gray-300 mb-2">
                            Tu primer proyecto te espera
                        </h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Describe tu proyecto en español y la IA genera el plano
                        </p>
                        <button
                            onClick={crearProyecto}
                            className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl font-semibold text-sm transition-colors">
                            Crear mi primer proyecto
                        </button>
                    </div>
                )}

                {/* Grid de proyectos */}
                {!cargando && proyectos.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {proyectos.map((proyecto) => (
                            <div
                                key={proyecto.id}
                                onClick={() => navigate(`/editor/${proyecto.id}`)}
                                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden cursor-pointer hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-500/5 transition-all group">

                                {/* Thumbnail */}
                                <div className="h-36 bg-gray-950 border-b border-gray-800 relative overflow-hidden flex items-center justify-center">
                                    {proyecto.thumbnail ? (
                                        <img
                                            src={proyecto.thumbnail}
                                            alt={proyecto.nombre}
                                            className="w-full h-full object-contain p-2 opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 opacity-30 group-hover:opacity-50 transition-opacity">
                                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                                <rect x="5" y="5" width="30" height="22" rx="1" stroke="#6b7280" strokeWidth="1.5" />
                                                <rect x="5" y="5" width="14" height="10" rx="0.5" stroke="#6b7280" strokeWidth="1" />
                                                <rect x="21" y="5" width="14" height="10" rx="0.5" stroke="#6b7280" strokeWidth="1" />
                                                <rect x="14" y="20" width="5" height="7" rx="0.5" stroke="#6b7280" strokeWidth="1" />
                                            </svg>
                                            <span className="text-gray-600 text-xs">Sin vista previa</span>
                                        </div>
                                    )}

                                    {/* Badge de fecha */}
                                    <div className="absolute top-2 right-2 bg-gray-900/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                        <span className="text-gray-500 text-xs">
                                            {new Date(proyecto.actualizado_at).toLocaleDateString('es-PE', {
                                                day: '2-digit', month: 'short'
                                            })}
                                        </span>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-white truncate text-sm">
                                                {proyecto.nombre}
                                            </h3>
                                            <p className="text-gray-600 text-xs mt-0.5">
                                                {proyecto.datos?.muros?.length || 0} muros ·{' '}
                                                {proyecto.datos?.puertas?.length || 0} puertas ·{' '}
                                                {proyecto.datos?.ventanas?.length || 0} ventanas
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => eliminarProyecto(proyecto.id, e)}
                                            className="text-gray-700 hover:text-red-400 transition-colors text-xl leading-none flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-red-900/20">
                                            ×
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}