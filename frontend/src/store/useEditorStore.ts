import { create } from 'zustand'

export type Herramienta = 'select' | 'wall' | 'door' | 'window' | 'stair' | 'column' | 'dim' | 'text' | 'area' | 'snap' | 'config'
export type Vista = '2d' | '3d' | 'planos'

interface ToolProperties {
    muro: {
        espesor: number
        tipo: 'simple' | 'doble' | 'con-aislamiento'
        material: string
        altura: number
        alineacion: 'izquierda' | 'centro' | 'derecha'
    }
    puerta: {
        ancho: number
        sentido: 'izquierda' | 'derecha'
        angulo: number
        tipo: 'simple' | 'doble' | 'corredera' | 'vaivén'
    }
    ventana: {
        ancho: number
        alto: number
        alfeizar: number
        tipo: 'fija' | 'batiente' | 'corredera' | 'vidrio-piso-techo'
    }
    escalera: {
        ancho: number
        peldaños: number
        paso: number
        contrapaso: number
        direccion: 'sube' | 'baja'
    }
    columna: {
        forma: 'cuadrada' | 'circular'
        dimension: number
        material: 'concreto' | 'acero' | 'madera'
    }
    dim: {
        tipo: 'lineal' | 'angular' | 'radial' | 'libre'
        offset: number
        mostrarUnidades: boolean
        decimales: 0 | 1 | 2
        estilo: 'RNE' | 'ISO' | 'libre'
    }
    texto: {
        fontSize: number
        estilo: 'normal' | 'título' | 'nota'
        capa: string
    }
    select: {
        modo: 'individual' | 'caja' | 'lazo'
        filtro: 'todos' | 'muros' | 'puertas' | 'ventanas' | 'cotas' | 'texto'
    }
}

interface EditorState {
    // Viewport
    zoom: number
    panX: number
    panY: number
    rotation: number
    setZoom: (z: number) => void
    setPan: (x: number, y: number) => void
    setRotation: (r: number) => void

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
    setPropiedadDim: (p: Partial<ToolProperties['dim']>) => void
    setPropiedadTexto: (p: Partial<ToolProperties['texto']>) => void
    setPropiedadSelect: (p: Partial<ToolProperties['select']>) => void

    // Modo visual
    modoClaro: boolean
    toggleModoClaro: () => void
}

export const useEditorStore = create<EditorState>((set) => ({
    zoom: 1,
    panX: 0,
    panY: 0,
    rotation: 0,
    setZoom: (zoom) => set({ zoom }),
    setPan: (panX, panY) => set({ panX, panY }),
    setRotation: (rotation) => set({ rotation }),

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
            espesor: 0.15,
            tipo: 'simple',
            material: 'ladrillo',
            altura: 2.40,
            alineacion: 'centro'
        },
        puerta: {
            ancho: 0.90,
            sentido: 'derecha',
            angulo: 90,
            tipo: 'simple'
        },
        ventana: {
            ancho: 1.20,
            alto: 1.20,
            alfeizar: 0.90,
            tipo: 'corredera'
        },
        escalera: {
            ancho: 1.00,
            peldaños: 15,
            paso: 0.25,
            contrapaso: 0.175,
            direccion: 'sube'
        },
        columna: {
            forma: 'cuadrada',
            dimension: 0.30,
            material: 'concreto'
        },
        dim: {
            tipo: 'lineal',
            offset: 0.50,
            mostrarUnidades: true,
            decimales: 2,
            estilo: 'RNE'
        },
        texto: {
            fontSize: 0.18,
            estilo: 'normal',
            capa: 'A-ANNO-TEXT'
        },
        select: {
            modo: 'individual',
            filtro: 'todos'
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
    setPropiedadDim: (p) => set((s) => ({ 
        propiedades: { ...s.propiedades, dim: { ...s.propiedades.dim, ...p } } 
    })),
    setPropiedadTexto: (p) => set((s) => ({ 
        propiedades: { ...s.propiedades, texto: { ...s.propiedades.texto, ...p } } 
    })),
    setPropiedadSelect: (p) => set((s) => ({ 
        propiedades: { ...s.propiedades, select: { ...s.propiedades.select, ...p } } 
    })),

    modoClaro: false,
    toggleModoClaro: () => set((s) => ({ modoClaro: !s.modoClaro })),
}))