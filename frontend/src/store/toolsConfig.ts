export interface Tool {
    id: string;
    key: string;
    label: string;
    cursor: string;
    toggle?: boolean;
    color?: string;
    action?: string;
}

export interface ToolGroup {
    group: string;
    tools: Tool[];
}

export const TOOLS_CONFIG: ToolGroup[] = [
    {
        group: "selection",
        tools: [
            { id: "select", key: "Escape", label: "Seleccionar", cursor: "default" }
        ],
    },
    {
        group: "architectural",
        tools: [
            { id: "wall", key: "w", label: "Muro", cursor: "crosshair" },
            { id: "door", key: "d", label: "Puerta", cursor: "crosshair" },
            { id: "window", key: "v", label: "Ventana", cursor: "crosshair" },
            { id: "stair", key: "e", label: "Escalera", cursor: "crosshair" },
            { id: "column", key: "c", label: "Columna", cursor: "crosshair" },
        ],
    },
    {
        group: "annotation",
        tools: [
            { id: "dim", key: "q", label: "Cota", cursor: "crosshair" },
            { id: "text", key: "t", label: "Texto", cursor: "text" },
            { id: "area", key: "a", label: "Area", cursor: "crosshair" },
        ],
    },
    {
        group: "utility",
        tools: [
            { id: "snap", key: "s", label: "Snap", toggle: true, color: "green", cursor: "default" },
            { id: "ortho", key: "f8", label: "Ortho", toggle: true, color: "blue", cursor: "default" },
            { id: "config", key: "", label: "Config", action: "openConfig", cursor: "default" },
        ],
    },
];
