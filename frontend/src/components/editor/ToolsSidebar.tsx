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
        <aside className="w-[40px] bg-gray-900/95 border-r border-gray-800 flex flex-col items-center py-3 gap-1 flex-shrink-0 z-20 backdrop-blur-md">
            {TOOLS_CONFIG.map((group, gIdx) => (
                <div key={group.group} className="flex flex-col items-center w-full gap-1.5">
                    {group.tools.map((tool) => {
                        const Icon = ICON_MAP[tool.id] || IconSettings
                        const active = isToolActive(tool)
                        const isToggle = tool.toggle
                        
                        // Color logic
                        let activeClass = 'bg-blue-600/20 text-blue-400'
                        if (tool.id === 'snap' && active) activeClass = 'bg-green-500/20 text-green-400'
                        if (tool.id === 'ortho' && active) activeClass = 'bg-orange-500/20 text-orange-400'

                        return (
                            <button
                                key={tool.id}
                                onClick={() => handleToolClick(tool)}
                                title={`${tool.label} ${tool.key ? `[${tool.key.toUpperCase()}]` : ''}`}
                                className={`
                                    w-[30px] h-[30px] flex items-center justify-center rounded-lg 
                                    transition-all duration-200 relative cursor-pointer border border-transparent
                                    ${active 
                                        ? `${activeClass} border-current/20 shadow-sm` 
                                        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                                    }
                                `}
                                style={{ cursor: tool.cursor }}
                            >
                                <Icon size={18} stroke={1.5} />
                                
                                {/* Active indicator dot for toggles */}
                                {isToggle && active && (
                                    <span className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${tool.id === 'snap' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                )}

                                {/* Subtle left border for active drawing tool */}
                                {!isToggle && active && tool.id !== 'config' && (
                                    <span className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-500 rounded-r-full"></span>
                                )}
                            </button>
                        )
                    })}

                    {/* Divider */}
                    {gIdx < TOOLS_CONFIG.length - 1 && (
                        <div className="w-[24px] h-px bg-gray-800/50 my-1" />
                    )}
                </div>
            ))}
        </aside>
    )
}
