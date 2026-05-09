export interface Tool {
    id: string;
    key: string;
    label: string;
    cursor?: string;
    icon?: string;
    toggle?: boolean;
    color?: string;
    action?: string;
}

export interface ToolGroup {
    group: string;
    tools: Tool[];
}

export const TOOLS_CONFIG: ToolGroup[] = [
  { group: "selection", tools: [
    { id: "select", icon: "ti-pointer", key: "Escape", label: "Seleccionar", cursor: "default" },
  ]},
  { group: "architectural", tools: [
    { id: "wall",   icon: "ti-border-sides", key: "w", label: "Muro",    cursor: "crosshair" },
    { id: "door",   icon: "ti-door",         key: "d", label: "Puerta",  cursor: "crosshair" },
    { id: "window", icon: "ti-browser",      key: "v", label: "Ventana", cursor: "crosshair" },
    { id: "stair",  icon: "ti-stairs",       key: "e", label: "Escalera",cursor: "crosshair" },
    { id: "column", icon: "ti-square",       key: "c", label: "Columna", cursor: "crosshair" },
  ]},
  { group: "annotation", tools: [
    { id: "dim",    icon: "ti-ruler-measure", key: "q", label: "Cota",  cursor: "crosshair" },
    { id: "text",   icon: "ti-cursor-text",   key: "t", label: "Texto", cursor: "text" },
    { id: "area",   icon: "ti-vector-triangle",key:"a", label: "Área",  cursor: "crosshair" },
  ]},
  { group: "utility", tools: [
    { id: "snap",   icon: "ti-magnet",    key: "s", label: "Snap",   toggle: true, color: "green" },
    { id: "config", icon: "ti-settings",  key: "",  label: "Config", action: "openConfig" },
  ]},
];
