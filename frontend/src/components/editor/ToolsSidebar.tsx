import { useEditorStore } from '../../store/useEditorStore'
import { usePlanoStore } from '../../store/usePlanoStore'
import { TOOLS_CONFIG, type Tool } from '../../store/toolsConfig'
import {
    IconPointer,
    IconWall,
    IconDoor,
    IconWindow,
    IconStairs,
    IconSquare,
    IconRulerMeasure,
    IconTextSize,
    IconVectorTriangle,
    IconMagnet,
    IconAngle,
    IconSettings,
} from '@tabler/icons-react'

// Mapping of IDs to Tabler Icons components
const ICON_MAP: Record<string, any> = {
    select: IconPointer,
    wall: IconWall,
    door: IconDoor,
    window: IconWindow,
    stair: IconStairs,
    column: IconSquare,
    dim: IconRulerMeasure,
    text: IconTextSize,
    area: IconVectorTriangle,
    snap: IconMagnet,
    ortho: IconAngle,
    config: IconSettings,
}

export default function ToolsSidebar() {
    const { 
        herramienta, 
        setHerramienta, 
        snapActivo, 
        toggleSnap,
        orthoActivo,
        toggleOrtho,
        setModalConfigAbierto
    } = useEditorStore()

    const { setCapaActiva } = usePlanoStore()

    const handleToolClick = (tool: Tool) => {
        if (tool.id === 'snap') {
            toggleSnap()
            return
        }
        if (tool.id === 'ortho') {
            toggleOrtho()
            return
        }
        
        if (tool.action === 'openConfig') {
            setModalConfigAbierto(true)
            return
        }

        setHerramienta(tool.id as any)

        // Auto-switch layer based on tool
        const LAYER_MAP: Record<string, string> = {
            'wall': 'A-WALL',
            'door': 'A-DOOR',
            'window': 'A-WIND',
            'stair': 'A-STAIR',
            'column': 'A-STRUCT',
            'dim': 'A-DIM',
            'text': 'A-ANNO-TEXT',
            'area': 'A-AREA',
        }
        if (LAYER_MAP[tool.id]) {
            setCapaActiva(LAYER_MAP[tool.id])
        }
    }

    const isToolActive = (tool: Tool) => {
        if (tool.id === 'snap') return snapActivo
        if (tool.id === 'ortho') return orthoActivo
        return herramienta === tool.id
    }

    return (
        <aside className="w-[42px] bg-[var(--bg1)] border-r border-[var(--bdr)] flex flex-col items-center py-3 gap-1 flex-shrink-0 z-20">
            {TOOLS_CONFIG.map((group, gIdx) => (
                <div key={group.group} className="flex flex-col items-center w-full gap-1">
                    {group.tools.map((tool) => {
                        const Icon = ICON_MAP[tool.id] || IconSettings
                        const active = isToolActive(tool)
                        const isToggle = tool.toggle

                        return (
                            <button
                                key={tool.id}
                                onClick={() => handleToolClick(tool)}
                                title={`${tool.label} ${tool.key ? `[${tool.key.toUpperCase()}]` : ''}`}
                                className={`
                                    w-[30px] h-[30px] flex items-center justify-center rounded-none
                                    transition-colors duration-150 relative cursor-pointer border
                                    ${active
                                        ? 'bg-white text-black border-white'
                                        : 'text-[var(--mut)] border-transparent hover:text-white hover:bg-[var(--bg3)]'
                                    }
                                `}
                                style={{ cursor: tool.cursor }}
                            >
                                <Icon size={17} stroke={1.75} />

                                {/* Indicador de toggle activo — punto blanco */}
                                {isToggle && active && (
                                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-black"></span>
                                )}

                                {/* Barra izquierda para herramienta de dibujo activa */}
                                {!isToggle && active && tool.id !== 'config' && (
                                    <span className="absolute left-[-3px] top-1/2 -translate-y-1/2 w-[3px] h-4 bg-white"></span>
                                )}
                            </button>
                        )
                    })}

                    {/* Divisor */}
                    {gIdx < TOOLS_CONFIG.length - 1 && (
                        <div className="w-[22px] h-px bg-[var(--bdr)] my-1.5" />
                    )}
                </div>
            ))}
        </aside>
    )
}
