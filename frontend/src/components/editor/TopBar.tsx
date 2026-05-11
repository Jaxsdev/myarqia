import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    IconFile,
    IconEdit,
    IconEye,
    IconSquarePlus,
    IconTools,
    IconHelp,
    IconDeviceFloppy,
    IconFileText,
    IconShare,
    IconDownload,
    IconFolder,
    IconX,
    IconArrowBackUp,
    IconArrowForwardUp,
    IconScissors,
    IconCopy,
    IconClipboard,
    IconTrash,
    IconSearch,
    IconSelect,
    IconChevronDown,
    IconBox,
    IconLayout,
    IconClipboardText,
    IconRuler2,
    IconAbc,
    IconGridDots,
    IconMaximize,
    IconSun,
    IconMoon
} from '@tabler/icons-react'
import { useProyectoStore } from '../../store/useProyectoStore'
import { usePlanoStore } from '../../store/usePlanoStore'
import { useGuardadoAutomatico } from '../../hooks/useGuardadoAutomatico'
import { useExportarPDF } from '../../hooks/useExportarPDF'
import { descargarDXF } from '../../lib/exportarDXF'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { useEditorStore } from '../../store/useEditorStore'

export default function TopBar() {
    const navigate = useNavigate()
    const { proyectoActual, setProyectoActual } = useProyectoStore()
    const {
        muros, puertas, ventanas, limpiarTodo,
        eliminarSeleccionado, seleccionarTodo, duplicarSeleccion
    } = usePlanoStore()
    const { guardando, forzarGuardado } = useGuardadoAutomatico()
    const { exportar } = useExportarPDF()
    const { usuario } = useAuthStore()
    const {
        vista, setVista,
        cotasVisibles, toggleCotas,
        nomenclaturaVisible, toggleNomenclatura,
        grillaVisible, toggleGrilla,
        modoClaro, toggleModoClaro
    } = useEditorStore()

    const [editandoNombre, setEditandoNombre] = useState(false)
    const [nombre, setNombre] = useState(proyectoActual?.nombre || 'Proyecto sin título')
    const [menuAbierto, setMenuAbierto] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const dxfInputRef = useRef<HTMLInputElement>(null)
    const imgInputRef = useRef<HTMLInputElement>(null)

    // Atajos de teclado
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault()
                        forzarGuardado()
                        break
                    case 'n':
                        e.preventDefault()
                        handleNuevo()
                        break
                    case 'o':
                        e.preventDefault()
                        navigate('/dashboard')
                        break
                    case 'z':
                        e.preventDefault()
                        alert('Deshacer en desarrollo')
                        break
                    case 'y':
                        e.preventDefault()
                        alert('Rehacer en desarrollo')
                        break
                    case 'd':
                        e.preventDefault()
                        duplicarSeleccion()
                        break
                    case 'a':
                        e.preventDefault()
                        seleccionarTodo()
                        break
                    case 'f':
                        e.preventDefault()
                        alert('Buscador en desarrollo')
                        break
                }
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                // Solo si no estamos editando un input
                if (document.activeElement?.tagName !== 'INPUT') {
                    eliminarSeleccionado()
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [forzarGuardado])

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setMenuAbierto(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleNuevo = async () => {
        if (!usuario) return
        if (confirm('¿Deseas crear un nuevo proyecto? Los cambios no guardados podrían perderse.')) {
            const { data, error } = await supabase
                .from('proyectos')
                .insert([{
                    user_id: usuario.id,
                    nombre: 'Nuevo Proyecto',
                    datos: { muros: [], puertas: [], ventanas: [], escala: 100, unidad: 'metros' }
                }])
                .select()
                .single()

            if (data && !error) {
                limpiarTodo() // Función correcta para resetear el plano
                setProyectoActual(data)
                navigate(`/editor/${data.id}`)
            }
        }
    }

    const handleGuardarComo = async () => {
        if (!usuario || !proyectoActual) return
        const nuevoNombre = prompt('Nombre para la copia:', `${proyectoActual.nombre} (Copia)`)
        if (nuevoNombre) {
            const { data, error } = await supabase
                .from('proyectos')
                .insert([{
                    user_id: usuario.id,
                    nombre: nuevoNombre,
                    datos: { muros, puertas, ventanas, escala: 100, unidad: 'metros' }
                }])
                .select()
                .single()

            if (data && !error) {
                setProyectoActual(data)
                navigate(`/editor/${data.id}`)
                alert('Proyecto copiado con éxito')
            }
        }
    }

    const archivoItems = [
        { label: 'Nuevo proyecto', icon: <IconSquarePlus size={14} />, shortcut: 'Ctrl+N', action: handleNuevo },
        { label: 'Abrir proyecto', icon: <IconFolder size={14} />, shortcut: 'Ctrl+O', action: () => navigate('/dashboard') },
        { label: 'Guardar', icon: <IconDeviceFloppy size={14} />, shortcut: 'Ctrl+S', action: forzarGuardado },
        { label: 'Guardar como...', icon: <IconDeviceFloppy size={14} />, action: handleGuardarComo },
        { label: 'Historial de versiones', icon: <IconFileText size={14} />, action: () => alert('Panel de historial en desarrollo') },
        { label: 'Importar DXF/DWG', icon: <IconDownload size={14} />, action: () => dxfInputRef.current?.click() },
        { label: 'Importar imagen', icon: <IconDownload size={14} />, action: () => imgInputRef.current?.click() },
        { label: 'Cerrar proyecto', icon: <IconX size={14} />, action: () => navigate('/dashboard') },
    ]

    const editarItems = [
        { label: 'Deshacer', icon: <IconArrowBackUp size={14} />, shortcut: 'Ctrl+Z', action: () => alert('Deshacer en desarrollo') },
        { label: 'Rehacer', icon: <IconArrowForwardUp size={14} />, shortcut: 'Ctrl+Y', action: () => alert('Rehacer en desarrollo') },
        { label: 'Cortar', icon: <IconScissors size={14} />, shortcut: 'Ctrl+X', action: () => alert('Cortar en desarrollo') },
        { label: 'Copiar', icon: <IconCopy size={14} />, shortcut: 'Ctrl+C', action: () => alert('Copiar en desarrollo') },
        { label: 'Pegar', icon: <IconClipboard size={14} />, shortcut: 'Ctrl+V', action: () => alert('Pegar en desarrollo') },
        { label: 'Duplicar', icon: <IconCopy size={14} />, shortcut: 'Ctrl+D', action: duplicarSeleccion },
        { label: 'Eliminar', icon: <IconTrash size={14} />, shortcut: 'Del', action: eliminarSeleccionado },
        { label: 'Seleccionar todo', icon: <IconSelect size={14} />, shortcut: 'Ctrl+A', action: seleccionarTodo },
        { label: 'Buscar elemento', icon: <IconSearch size={14} />, shortcut: 'Ctrl+F', action: () => alert('Buscador en desarrollo') },
    ]

    const handleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen()
            }
        }
    }

    const verItems = [
        { label: 'Planta 2D', icon: <IconLayout size={14} />, action: () => setVista('2d'), active: vista === '2d' },
        { label: 'Vista 3D', icon: <IconBox size={14} />, action: () => setVista('3d'), active: vista === '3d' },
        { label: 'Planos técnicos', icon: <IconClipboardText size={14} />, action: () => setVista('planos'), active: vista === 'planos' },
        { type: 'separator' },
        { label: 'Panel de cotas', icon: <IconRuler2 size={14} />, action: toggleCotas, active: cotasVisibles },
        { label: 'Panel de nomenclatura', icon: <IconAbc size={14} />, action: toggleNomenclatura, active: nomenclaturaVisible },
        { label: 'Grilla', icon: <IconGridDots size={14} />, action: toggleGrilla, active: grillaVisible },
        { label: modoClaro ? 'Modo Oscuro' : 'Modo Claro', icon: modoClaro ? <IconMoon size={14} /> : <IconSun size={14} />, action: toggleModoClaro, active: modoClaro },
        { type: 'separator' },
        { label: 'Pantalla completa', icon: <IconMaximize size={14} />, shortcut: 'F11', action: handleFullScreen },
    ]

    const menuItems = [
        { label: 'Archivo', items: archivoItems },
        { label: 'Editar', items: editarItems },
        { label: 'Ver', items: verItems },
        { label: 'Insertar' },
        { label: 'Herramientas' },
        { label: 'Ayuda' },
    ]

    return (
        <header className="topbar h-10 bg-[#141720] border-b border-[#252B3B] flex items-center px-2.5 gap-1.5 flex-shrink-0 z-10">
            {/* Logo */}
            <div
                onClick={() => navigate('/dashboard')}
                className="logo flex items-center cursor-pointer select-none mr-2"
            >
                <span className="text-[14px] font-medium text-[#2D8EFF] tracking-tight">
                    My<b className="text-[#00C8D4]">ARQIA</b>
                </span>
            </div>

            <div className="w-[0.5px] h-4 bg-[#252B3B] mx-1" />

            {/* Menús de Navegación */}
            <nav className="flex items-center relative" ref={dropdownRef}>
                {menuItems.map((item) => (
                    <div key={item.label} className="relative">
                        <button
                            onClick={() => setMenuAbierto(menuAbierto === item.label ? null : item.label)}
                            className={`tb-menu text-[11px] px-2 py-1 rounded-md transition-all border-none bg-transparent cursor-pointer flex items-center gap-1 mx-0.5 ${menuAbierto === item.label ? 'bg-[#252B3B] text-[#E8ECF0]' : 'text-[#8892A0] hover:bg-[#252B3B] hover:text-[#E8ECF0]'
                                }`}
                        >
                            {item.label}
                        </button>

                        {menuAbierto === item.label && item.items && (
                            <div className="absolute top-full left-0 mt-1 w-56 bg-[#1C2030] border border-[#252B3B] rounded-lg shadow-2xl py-1.5 z-50">
                                {item.items.map((subItem, idx) => {
                                    if (subItem.type === 'separator') {
                                        return <div key={idx} className="h-[1px] bg-[#252B3B] my-1 mx-2" />
                                    }
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                subItem.action?.()
                                                setMenuAbierto(null)
                                            }}
                                            className={`w-full flex items-center justify-between px-3 py-1.5 text-[11px] hover:bg-[#2D8EFF20] transition-colors group ${subItem.active ? 'bg-[#2D8EFF15] text-[#2D8EFF]' : 'text-[#C8D0DC] hover:text-[#E8ECF0]'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`${subItem.active ? 'text-[#2D8EFF]' : 'text-[#8892A0] group-hover:text-[#2D8EFF]'}`}>
                                                    {subItem.icon}
                                                </span>
                                                {subItem.label}
                                            </div>
                                            {subItem.shortcut && (
                                                <span className="text-[9px] text-[#565F6E]">{subItem.shortcut}</span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            <div className="w-[0.5px] h-4 bg-[#252B3B] mx-1" />

            {/* Nombre del Proyecto y Estado */}
            <div className="flex items-center gap-1.5 ml-1">
                <div
                    className="file-name flex items-center gap-1.5 text-[11px] text-[#E8ECF0] bg-[#252B3B] border border-[#252B3B] rounded-md px-2 py-0.75 cursor-pointer hover:border-[#8892A0] transition-colors"
                    onClick={() => setEditandoNombre(true)}
                >
                    <IconFolder size={12} className="text-[#8892A0]" />
                    {editandoNombre ? (
                        <input
                            autoFocus
                            className="bg-transparent border-none outline-none text-[11px] w-32"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            onBlur={() => setEditandoNombre(false)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditandoNombre(false)}
                        />
                    ) : (
                        <div className="flex items-center gap-1">
                            <span>{proyectoActual?.nombre || 'Proyecto sin título'}</span>
                            <IconChevronDown size={10} className="text-[#8892A0]" />
                        </div>
                    )}
                </div>

                {/* Badge de Guardado */}
                <div className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border ${guardando
                        ? 'text-[#F39C12] bg-[#F39C1210] border-[#F39C1233]'
                        : 'text-[#2ECC71] bg-[#2ECC7110] border-[#2ECC7133]'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${guardando ? 'bg-[#F39C12] animate-pulse' : 'bg-[#2ECC71]'}`} />
                    {guardando ? 'Guardando...' : 'Guardado'}
                </div>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
                {/* Inputs ocultos para importación */}
                <input type="file" ref={dxfInputRef} className="hidden" accept=".dxf" onChange={(e) => console.log('Importar DXF:', e.target.files?.[0])} />
                <input type="file" ref={imgInputRef} className="hidden" accept="image/*" onChange={(e) => console.log('Importar Imagen:', e.target.files?.[0])} />

                <button
                    onClick={exportar}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md border border-[#2D8EFF44] bg-[#2D8EFF18] text-[#2D8EFF] hover:bg-[#2D8EFF30] transition-all cursor-pointer"
                >
                    <IconFileText size={14} />
                    <span>PDF</span>
                </button>

                <button
                    onClick={() => descargarDXF(muros, puertas, ventanas, proyectoActual?.nombre || 'proyecto')}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md border border-[#00C8D444] bg-[#00C8D418] text-[#00C8D4] hover:bg-[#00C8D430] transition-all cursor-pointer"
                >
                    <IconDownload size={14} />
                    <span>DXF</span>
                </button>

                <button className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-[#2D8EFF] text-white border border-[#2D8EFF] hover:opacity-90 transition-all cursor-pointer">
                    <IconShare size={14} />
                    <span>Compartir</span>
                </button>

                <div className="w-6.5 h-6.5 rounded-full bg-[#2D8EFF30] border border-[#2D8EFF] flex items-center justify-center text-[10px] font-medium text-[#2D8EFF] cursor-pointer hover:bg-[#2D8EFF40] transition-all ml-1">
                    JD
                </div>
            </div>
        </header>
    )
}
