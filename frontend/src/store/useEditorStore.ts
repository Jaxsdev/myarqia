import { create } from 'zustand'

export type Herramienta = 'select' | 'wall' | 'door' | 'window' | 'stair' | 'column' | 'dim' | 'text' | 'area' | 'snap' | 'config'
export type Vista = '2d' | '3d' | 'planos'

interface ToolProperties {
    muro: {
        grosor: number
        material: string
        altura: number
        alineacion: 'izquierda' | 'centro' | 'derecha'
    }
    puerta: {
        ancho: number
        sentido: 'izquierda' | 'derecha'
        angulo: number
    }
    ventana: {
        ancho: number
        alto: number
        alfeizar: number
    }
    escalera: {
        peldaños: number
        paso: number
        contrapaso: number
    }
    columna: {
        ancho: number
        largo: number
        forma: 'cuadrada' | 'circular'
    }
    texto: {
        fontSize: number
        color: string
        bold: boolean
    }
}

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

    // Snap y Ortho
    snapActivo: boolean
    snapSize: number  // en metros
    toggleSnap: () => void
    setSnapSize: (size: number) => void
    
    orthoActivo: boolean
    toggleOrtho: () => void

    // Visualización
    vista: Vista
    setVista: (v: Vista) => void
    escala: string
    setEscala: (e: string) => void
    modalConfigAbierto: boolean
    setModalConfigAbierto: (open: boolean) => void
    cotasVisibles: boolean
    toggleCotas: () => void
    nomenclaturaVisible: boolean
    toggleNomenclatura: () => void
    grillaVisible: boolean
    toggleGrilla: () => void

    // Propiedades de herramientas
    propiedades: ToolProperties
    setPropiedadMuro: (p: Partial<ToolProperties['muro']>) => void
    setPropiedadPuerta: (p: Partial<ToolProperties['puerta']>) => void
    setPropiedadVentana: (p: Partial<ToolProperties['ventana']>) => void
    setPropiedadEscalera: (p: Partial<ToolProperties['escalera']>) => void
    setPropiedadColumna: (p: Partial<ToolProperties['columna']>) => void
    setPropiedadTexto: (p: Partial<ToolProperties['texto']>) => void

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

    herramienta: 'select',
    setHerramienta: (herramienta) => set({ herramienta }),

    cursorX: 0,
    cursorY: 0,
    setCursor: (cursorX, cursorY) => set({ cursorX, cursorY }),

    snapActivo: true,
    snapSize: 0.25,
    toggleSnap: () => set((s) => ({ snapActivo: !s.snapActivo })),
    setSnapSize: (snapSize) => set({ snapSize }),

    orthoActivo: false,
    toggleOrtho: () => set((s) => ({ orthoActivo: !s.orthoActivo })),

    vista: '2d',
    setVista: (vista) => set({ vista }),
    escala: '1:100',
    setEscala: (escala) => set({ escala }),
    modalConfigAbierto: false,
    cotasVisibles: true,
    nomenclaturaVisible: true,
    grillaVisible: true,
    setModalConfigAbierto: (open) => set({ modalConfigAbierto: open }),
    toggleCotas: () => set((state) => ({ cotasVisibles: !state.cotasVisibles })),
    toggleNomenclatura: () => set((state) => ({ nomenclaturaVisible: !state.nomenclaturaVisible })),
    toggleGrilla: () => set((state) => ({ grillaVisible: !state.grillaVisible })),

    propiedades: {
        muro: {
            grosor: 0.15,
            material: 'ladrillo',
            altura: 2.40,
            alineacion: 'centro'
        },
        puerta: {
            ancho: 0.90,
            sentido: 'derecha',
            angulo: 90
        },
        ventana: {
            ancho: 1.20,
            alto: 1.20,
            alfeizar: 0.90
        },
        escalera: {
            peldaños: 15,
            paso: 0.25,
            contrapaso: 0.175
        },
        columna: {
            ancho: 0.30,
            largo: 0.30,
            forma: 'cuadrada'
        },
        texto: {
            fontSize: 0.18, // 18cm en metros
            color: '#1a1a1a',
            bold: false
        }
    },
    setPropiedadMuro: (p) => set((s) => ({ 
        propiedades: { ...s.propiedades, muro: { ...s.propiedades.muro, ...p } } 
    })),
    setPropiedadPuerta: (p) => set((s) => ({ 
        propiedades: { ...s.propiedades, puerta: { ...s.propiedades.puerta, ...p } } 
    })),
    setPropiedadVentana: (p) => set((s) => ({ 
        propiedades: { ...s.propiedades, ventana: { ...s.propiedades.ventana, ...p } } 
    })),
    setPropiedadEscalera: (p) => set((s) => ({ 
        propiedades: { ...s.propiedades, escalera: { ...s.propiedades.escalera, ...p } } 
    })),
    setPropiedadColumna: (p) => set((s) => ({ 
        propiedades: { ...s.propiedades, columna: { ...s.propiedades.columna, ...p } } 
    })),
    setPropiedadTexto: (p) => set((s) => ({ 
        propiedades: { ...s.propiedades, texto: { ...s.propiedades.texto, ...p } } 
    })),

    modoClaro: false,
    toggleModoClaro: () => set((s) => ({ modoClaro: !s.modoClaro })),
}))