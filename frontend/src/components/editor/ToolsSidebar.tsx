import { useEditorStore } from '../../store/useEditorStore'
import { TOOLS_CONFIG, type Tool } from '../../store/toolsConfig'

export default function ToolsSidebar() {
    const { 
        herramienta, 
        setHerramienta, 
        snapActivo, 
        toggleSnap 
    } = useEditorStore()

    const handleToolClick = (tool: Tool) => {
        if (tool.toggle && tool.id === 'snap') {
            toggleSnap()
            return
        }
        
        if (tool.action === 'openConfig') {
            // Logic for opening config would go here
            console.log('Open config panel')
            return
        }

        setHerramienta(tool.id as any)
    }

    const isToolActive = (tool: Tool) => {
        if (tool.toggle && tool.id === 'snap') {
            return snapActivo
        }
        return herramienta === tool.id
    }

    return (
        <aside className="w-[36px] bg-[#141720] border-r border-[#252B3B] flex flex-col items-center py-2 gap-1 flex-shrink-0 z-20">
            {TOOLS_CONFIG.map((group, gIdx) => (
                <div key={group.group} className="flex flex-col items-center w-full gap-1">
                    {/* Tool Group */}
                    {group.tools.map((tool) => {
                        const active = isToolActive(tool)
                        const isGreen = tool.color === 'green' && active

                        return (
                            <button
                                key={tool.id}
                                onClick={() => handleToolClick(tool)}
                                title={`${tool.label} ${tool.key ? `[${tool.key.toUpperCase()}]` : ''}`}
                                className={`
                                    w-[26px] h-[26px] flex items-center justify-center rounded-[4px] 
                                    transition-all duration-150 relative cursor-pointer border-none
                                    ${active 
                                        ? isGreen 
                                            ? 'bg-[#2ECC7120] text-[#2ECC71]' 
                                            : 'bg-[#2D8EFF20] text-[#2D8EFF]' 
                                        : 'text-[#8892A0] hover:bg-[#252B3B] hover:text-[#E8ECF0]'
                                    }
                                `}
                                style={{ cursor: tool.cursor }}
                            >
                                <i className={`ti ${tool.icon} text-[14px]`}></i>
                                {tool.toggle && active && (
                                    <span className="absolute bottom-[1px] right-[1px] w-[5px] h-[5px] rounded-full bg-[#2D8EFF]"></span>
                                )}
                            </button>
                        )
                    })}

                    {/* Group Separator (only if not the last group) */}
                    {gIdx < TOOLS_CONFIG.length - 1 && (
                        <div className="w-[20px] h-[0.5px] bg-[#252B3B] my-[3px]" />
                    )}
                </div>
            ))}
        </aside>
    )
}
