import { create } from 'zustand'

type Herramienta = 'seleccionar' | 'muro' | 'puerta' | 'ventana' | 'texto'

interface EditorState {
    // Viewport
    zoom: number
    panX: number
    panY: number
    setZoom: (z: number) => void
    setPan: (x: number, y: number) => void

    // Herramienta activa
    herramienta: Herramienta
    setHerramienta: (h: Herramienta) => void

    // Cursor en coordenadas del mundo (metros)
    cursorX: number
    cursorY: number
    setCursor: (x: number, y: number) => void

    // Snap a grilla
    snapActivo: boolean
    snapSize: number  // en metros
    toggleSnap: () => void

    cotasVisibles: boolean
    toggleCotas: () => void

    // Modo visual
    modoClaro: boolean
    toggleModoClaro: () => void
}

export const useEditorStore = create<EditorState>((set) => ({
    zoom: 1,
    panX: 0,
    panY: 0,
    setZoom: (zoom) => set({ zoom }),
    setPan: (panX, panY) => set({ panX, panY }),

    herramienta: 'seleccionar',
    setHerramienta: (herramienta) => set({ herramienta }),

    cotasVisibles: true,
    toggleCotas: () => set((s) => ({ cotasVisibles: !s.cotasVisibles })),

    cursorX: 0,
    cursorY: 0,
    setCursor: (cursorX, cursorY) => set({ cursorX, cursorY }),

    snapActivo: true,
    snapSize: 0.25,   // snap cada 25cm
    toggleSnap: () => set((s) => ({ snapActivo: !s.snapActivo })),

    modoClaro: false,
    toggleModoClaro: () => set((s) => ({ modoClaro: !s.modoClaro })),
}))