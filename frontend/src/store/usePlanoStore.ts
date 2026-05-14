import { create } from 'zustand'
import type { Muro, Puerta, Ventana, Escalera, Columna, Cota, ElementoTexto, ElementoArea, Punto, Ambiente } from '../types'

const uid = (p: string) => `${p}-${crypto.randomUUID().slice(0, 8)}`

type TipoDibujo = 'muro' | 'puerta' | 'ventana' | 'escalera' | 'columna' | 'cota' | 'area'

export interface Capa {
    id: string
    name: string
    color: string
    thickness: string
    desc: string
    visible: boolean
    locked: boolean
}

export interface EntradaHistorial {
    id: string
    tipo: 'creacion' | 'edicion' | 'borrado' | 'ia' | 'sistema' | 'ajuste'
    descripcion: string
    timestamp: string
    estado: any
}

interface PlanoState {

    ambientes: Ambiente[]
    setAmbientes: (a: Ambiente[]) => void

    muros: Muro[]
    puertas: Puerta[]
    ventanas: Ventana[]
    escaleras: Escalera[]
    columnas: Columna[]
    cotas: Cota[]
    textos: ElementoTexto[]
    areas: ElementoArea[]

    // Capas
    capas: Capa[]
    capaActiva: string
    toggleCapaVisible: (id: string) => void
    toggleCapaBloqueada: (id: string) => void
    setCapaActiva: (id: string) => void
    agregarCapa: (id: string, color: string) => void


    // Dibujo en progreso
    dibujando: boolean
    tipoDibujo: TipoDibujo
    puntoInicio: Punto | null
    puntoFin: Punto | null
    puntoAux: Punto | null
    puntosPoligono: Punto[]
    pasoDibujo: number

    // Selección
    idsSeleccionados: string[]
    cargado: boolean

    // Historial
    historial: EntradaHistorial[]
    futureHistorial: EntradaHistorial[]

    // Acciones — Muro
    iniciarDibujo: (p: Punto, tipo: TipoDibujo) => void
    actualizarDibujo: (p: Punto) => void
    terminarMuro: (propiedades: { espesor: number, altura: number, tipo: any, material: string, alineacion: any }, continuar?: boolean) => void
    terminarPuerta: (propiedades: { ancho: number, sentido: any, angulo: number, tipo: any }, pManual?: Punto) => void
    terminarVentana: (propiedades: { ancho: number, alto: number, alfeizar: number, tipo: any }, pManual?: Punto) => void
    terminarEscalera: (propiedades: { ancho: number, peldaños: number, paso: number, contrapaso: number, direccion: any }) => void
    terminarColumna: (propiedades: { dimension: number, forma: any, material: any }, pManual?: Punto) => void
    terminarCota: (propiedades: { tipo: any, mostrarUnidades: boolean, decimales: any, estilo: any }, pManual?: Punto) => void
    terminarTexto: (contenido: string, propiedades: { fontSize: number, estilo: any, capa: string }, pManual?: Punto) => void
    terminarArea: () => void
    cancelarDibujo: () => void

    // Selección y eliminación
    seleccionar: (id: string | null, multi?: boolean) => void
    eliminarSeleccionado: () => void
    moverSeleccion: (dx: number, dy: number) => void
    togglePuertaSentido: (id: string) => void

    // Historial
    saveHistory: (descripcion?: string, tipo?: EntradaHistorial['tipo']) => void
    undo: () => void
    redo: () => void
    irAEstado: (id: string) => void

    // Cargar desde Supabase
    cargarDatos: (muros: Muro[], puertas: Puerta[], ventanas: Ventana[], escaleras?: Escalera[], columnas?: Columna[], cotas?: Cota[], textos?: ElementoTexto[], areas?: ElementoArea[], ambientes?: Ambiente[], capas?: Capa[], historial?: EntradaHistorial[]) => void
    limpiarTodo: () => void

    actualizarMuro: (id: string, cambios: Partial<Muro>) => void
    actualizarArea: (id: string, cambios: Partial<ElementoArea>) => void
    actualizarPuerta: (id: string, cambios: Partial<Puerta>) => void
    actualizarVentana: (id: string, cambios: Partial<Ventana>) => void
    actualizarColumna: (id: string, cambios: Partial<Columna>) => void
    actualizarCota: (id: string, cambios: Partial<Cota>) => void
    actualizarTexto: (id: string, cambios: Partial<ElementoTexto>) => void
    seleccionarTodo: () => void
    duplicarSeleccion: () => void
    autoSanarPlano: () => void
}

export const usePlanoStore = create<PlanoState>((set, get) => ({

    muros: [],
    puertas: [],
    ventanas: [],
    escaleras: [],
    columnas: [],
    cotas: [],
    textos: [],
    areas: [],
    dibujando: false,
    tipoDibujo: 'muro',
    puntoInicio: null,
    puntoFin: null,
    puntoAux: null,
    puntosPoligono: [],
    pasoDibujo: 0,
    idsSeleccionados: [],
    cargado: false,

    past: [],
    future: [],

    capas: [
        { id: 'A-WALL', name: 'A-WALL', color: '#E8ECF0', thickness: '0.5mm', desc: 'Muros, tabiques y divisiones', visible: true, locked: false },
        { id: 'A-DOOR', name: 'A-DOOR', color: '#F39C12', thickness: '0.35mm', desc: 'Puertas con arco de apertura', visible: true, locked: false },
        { id: 'A-WIND', name: 'A-WIND', color: '#00C8D4', thickness: '0.35mm', desc: 'Ventanas con línea triple', visible: true, locked: false },
        { id: 'A-STAIR', name: 'A-STAIR', color: '#9B59B6', thickness: '0.18mm', desc: 'Escaleras y rampas', visible: true, locked: false },
        { id: 'A-AREA', name: 'A-AREA', color: '#9B59B6', thickness: '0.18mm', desc: 'Etiquetas de ambientes y área', visible: true, locked: false },
        { id: 'A-DIM', name: 'A-DIM', color: '#2D8EFF', thickness: '0.18mm', desc: 'Líneas de cota, flechas y valores', visible: true, locked: false },
        { id: 'A-ANNO-TEXT', name: 'A-ANNO-TEXT', color: '#2ECC71', thickness: '0.18mm', desc: 'Notas técnicas y texto libre', visible: true, locked: false },
        { id: 'A-STRUCT', name: 'A-STRUCT', color: '#E74C3C', thickness: '0.7mm', desc: 'Columnas, vigas y elementos estructurales', visible: true, locked: false },
        { id: 'A-EQPM', name: 'A-EQPM', color: '#8892A0', thickness: '0.25mm', desc: 'Mobiliario y equipamiento', visible: true, locked: false },
        { id: 'A-GRID', name: 'A-GRID', color: '#2A3045', thickness: '0.13mm', desc: 'Ejes de referencia', visible: true, locked: false },
        { id: 'A-SITE', name: 'A-SITE', color: '#795548', thickness: '0.5mm', desc: 'Linderos, límite de propiedad', visible: true, locked: false },
    ],
    capaActiva: 'A-WALL',

    historial: [],
    futureHistorial: [],

    toggleCapaVisible: (id) => set((s) => ({
        capas: s.capas.map(c => c.id === id ? { ...c, visible: !c.visible } : c)
    })),
    toggleCapaBloqueada: (id) => set((s) => ({
        capas: s.capas.map(c => c.id === id ? { ...c, locked: !c.locked } : c)
    })),
    setCapaActiva: (id) => set({ capaActiva: id }),
    agregarCapa: (id, color) => set((s) => {
        if (s.capas.find(c => c.id === id)) return s
        return {
            capas: [...s.capas, { id, name: id, color, thickness: '0.25mm', desc: 'Capa personalizada', visible: true, locked: false }],
            capaActiva: id
        }
    }),

    saveHistory: (descripcion = 'Operación', tipo = 'edicion') => {
        const s = get()
        const snapshot = {
            muros: [...s.muros], puertas: [...s.puertas], ventanas: [...s.ventanas],
            escaleras: [...s.escaleras], columnas: [...s.columnas], cotas: [...s.cotas],
            textos: [...s.textos], areas: [...s.areas], ambientes: [...s.ambientes],
        }
        const entrada: EntradaHistorial = {
            id: uid('hist'),
            tipo,
            descripcion,
            timestamp: new Date().toISOString(),
            estado: snapshot
        }
        set({ historial: [...s.historial.slice(-49), entrada], futureHistorial: [] })
    },

    undo: () => {
        const { historial, futureHistorial } = get()
        if (historial.length <= 1) return
        const last = historial[historial.length - 1]
        const previous = historial[historial.length - 2]
        
        set({ 
            ...previous.estado, 
            historial: historial.slice(0, -1), 
            futureHistorial: [last, ...futureHistorial],
            idsSeleccionados: [] 
        })
    },

    redo: () => {
        const { historial, futureHistorial } = get()
        if (futureHistorial.length === 0) return
        const next = futureHistorial[0]
        set({ 
            ...next.estado, 
            historial: [...historial, next], 
            futureHistorial: futureHistorial.slice(1),
            idsSeleccionados: [] 
        })
    },

    irAEstado: (id) => {
        const { historial } = get()
        const index = historial.findIndex(h => h.id === id)
        if (index === -1) return
        const entrada = historial[index]
        set({ 
            ...entrada.estado, 
            historial: historial.slice(0, index + 1),
            futureHistorial: [],
            idsSeleccionados: []
        })
    },

    iniciarDibujo: (p, tipo) => set({
        dibujando: true, tipoDibujo: tipo,
        puntoInicio: p, puntoFin: p, puntoAux: null,
        puntosPoligono: tipo === 'area' ? [p] : [],
        pasoDibujo: 1,
    }),

    actualizarDibujo: (p) => {
        const { dibujando, tipoDibujo, pasoDibujo } = get()
        if (dibujando) {
            if (tipoDibujo === 'cota' && pasoDibujo === 2) {
                set({ puntoAux: p })
            } else {
                set({ puntoFin: p })
            }
        }
    },

    ambientes: [],
    setAmbientes: (ambientes) => set({ ambientes }),

    terminarMuro: (props, continuar = false) => {
        const { puntoInicio, puntoFin } = get()
        if (!puntoInicio || !puntoFin) return
        const dx = puntoFin.x - puntoInicio.x
        const dy = puntoFin.y - puntoInicio.y
        if (Math.sqrt(dx * dx + dy * dy) < 0.05) {
            set({ dibujando: false, puntoInicio: null, puntoFin: null })
            return
        }

        const nuevoMuro: Muro = {
            id: uid('muro'),
            x1: puntoInicio.x, y1: puntoInicio.y,
            x2: puntoFin.x, y2: puntoFin.y,
            espesor: props.espesor,
            altura: props.altura,
            tipo: props.tipo,
            material: props.material,
            alineacion: props.alineacion,
            layer: get().capaActiva,
        }

        const longitud = Math.sqrt(dx * dx + dy * dy)
        get().saveHistory(`Muro dibujado (${longitud.toFixed(2)}m)`, 'creacion')

        set((s) => ({
            muros: [...s.muros, nuevoMuro],
            dibujando: continuar,
            puntoInicio: continuar ? puntoFin : null,
            puntoFin: continuar ? puntoFin : null,
        }))

        // Ejecutar auto-sanación después de añadir un muro
        get().autoSanarPlano()
    },

    terminarPuerta: (props, pManual?: Punto) => {
        const { puntoInicio, puntoFin, muros } = get()
        const pIn = pManual || puntoInicio
        const pFi = pManual || puntoFin
        if (!pIn || !pFi) return
        
        const dx = pFi.x - pIn.x
        const dy = pFi.y - pIn.y
        let dist = Math.sqrt(dx * dx + dy * dy)
        let ang = Math.atan2(dy, dx)

        // Buscar muro más cercano para asociar (usamos el punto medio para mayor precisión)
        const pMid = { x: (pIn.x + pFi.x) / 2, y: (pIn.y + pFi.y) / 2 }
        
        let muroCercanoId = ''
        let minDist = 0.5 
        let anguloMuro = 0
        let posCentrada = pMid
        
        muros.forEach(m => {
            const l2 = (m.x2 - m.x1) ** 2 + (m.y2 - m.y1) ** 2
            if (l2 === 0) return
            let t = ((pMid.x - m.x1) * (m.x2 - m.x1) + (pMid.y - m.y1) * (m.y2 - m.y1)) / l2
            t = Math.max(0, Math.min(1, t))
            const px = m.x1 + t * (m.x2 - m.x1)
            const py = m.y1 + t * (m.y2 - m.y1)
            const d = Math.sqrt((pMid.x - px) ** 2 + (pMid.y - py) ** 2)
            
            if (d < minDist) {
                minDist = d
                muroCercanoId = m.id
                anguloMuro = Math.atan2(m.y2 - m.y1, m.x2 - m.x1)
                posCentrada = { x: px, y: py }
            }
        })

        // Si es inserción por clic (distancia 0), usamos ancho de las propiedades
        if (dist < 0.05) {
            dist = props.ancho || 0.90
            ang = anguloMuro
        }

        get().saveHistory(`Puerta insertada (${dist.toFixed(2)}m)`, 'creacion')

        set((s) => ({
            puertas: [...s.puertas, {
                id: uid('puerta'),
                muro_id: muroCercanoId,
                x: posCentrada.x, y: posCentrada.y,
                rotacion: ang,
                ancho: dist,
                sentido: props.sentido,
                angulo: props.angulo,
                tipo: props.tipo,
                layer: get().capaActiva,
            }],
            dibujando: false, puntoInicio: null, puntoFin: null,
        }))
    },

    togglePuertaSentido: (id: string) => {
        get().saveHistory(`Sentido de puerta cambiado`, 'edicion')
        set((s) => ({
            puertas: s.puertas.map(p => {
                if (p.id !== id) return p
                // Alternar entre 4 estados: derecha-fuera, derecha-dentro, izquierda-fuera, izquierda-dentro
                // Alternar entre 4 estados (simplificado: invertir rotación por ahora)
                return { ...p, rotacion: p.rotacion + Math.PI / 2 }
            })
        }))
    },

    terminarVentana: (props, pManual?: Punto) => {
        const { puntoInicio, puntoFin, muros } = get()
        const pIn = pManual || puntoInicio
        const pFi = pManual || puntoFin
        if (!pIn || !pFi) return
        
        const dx = pFi.x - pIn.x
        const dy = pFi.y - pIn.y
        let dist = Math.sqrt(dx * dx + dy * dy)
        let ang = Math.atan2(dy, dx)

        // Buscar muro más cercano (punto medio)
        const pMid = { x: (pIn.x + pFi.x) / 2, y: (pIn.y + pFi.y) / 2 }
        
        let muroCercanoId = ''
        let minDist = 0.5 
        let anguloMuro = 0
        let posCentrada = pMid
        muros.forEach(m => {
            const l2 = (m.x2 - m.x1) ** 2 + (m.y2 - m.y1) ** 2
            if (l2 === 0) return
            let t = ((pMid.x - m.x1) * (m.x2 - m.x1) + (pMid.y - m.y1) * (m.y2 - m.y1)) / l2
            t = Math.max(0, Math.min(1, t))
            const px = m.x1 + t * (m.x2 - m.x1)
            const py = m.y1 + t * (m.y2 - m.y1)
            const d = Math.sqrt((pMid.x - px) ** 2 + (pMid.y - py) ** 2)
            
            if (d < minDist) {
                minDist = d
                muroCercanoId = m.id
                anguloMuro = Math.atan2(m.y2 - m.y1, m.x2 - m.x1)
                posCentrada = { x: px, y: py }
            }
        })

        if (dist < 0.05) {
            dist = props.ancho || 1.20
            ang = anguloMuro
        }

        get().saveHistory(`Ventana insertada (${dist.toFixed(2)}m)`, 'creacion')

        set((s) => ({
            ventanas: [...s.ventanas, {
                id: uid('ventana'),
                muro_id: muroCercanoId,
                x: posCentrada.x, y: posCentrada.y,
                rotacion: ang,
                ancho: dist,
                alto: props.alto,
                alfeizar: props.alfeizar,
                tipo: props.tipo,
                layer: get().capaActiva,
            }],
            dibujando: false, puntoInicio: null, puntoFin: null,
        }))
    },

    terminarEscalera: (props) => {
        const { puntoInicio, puntoFin } = get()
        if (!puntoInicio || !puntoFin) return
        get().saveHistory(`Escalera creada (${props.peldaños} escalones)`, 'creacion')
        set((s) => ({
            escaleras: [...(s.escaleras || []), {
                id: uid('escalera'),
                x1: puntoInicio.x, y1: puntoInicio.y,
                x2: puntoFin.x, y2: puntoFin.y,
                ancho: props.ancho,
                peldaños: props.peldaños, 
                paso: props.paso, 
                contrapaso: props.contrapaso,
                direccion: props.direccion,
                layer: get().capaActiva,
            }],
            dibujando: false, puntoInicio: null, puntoFin: null,
        }))
    },

    terminarColumna: (props, pManual?: Punto) => {
        const { puntoInicio } = get()
        const p = pManual || puntoInicio
        if (!p) return
        get().saveHistory(`Columna insertada (${props.dimension}m)`, 'creacion')
        set((s) => ({
            columnas: [...(s.columnas || []), {
                id: uid('columna'),
                x: p.x, y: p.y,
                forma: props.forma,
                dimension: props.dimension,
                material: props.material,
                layer: get().capaActiva,
            }],
            dibujando: false, puntoInicio: null, puntoFin: null,
        }))
    },

    terminarCota: (props: { tipo: any, mostrarUnidades: boolean, decimales: any, estilo: any }, pManual?: Punto) => {
        const { puntoInicio, puntoFin, pasoDibujo } = get()
        if (!puntoInicio || !puntoFin) return

        if (pasoDibujo === 1) {
            // Segundo clic: fijamos el punto final y pasamos a definir offset
            set({ puntoFin: pManual || puntoFin, pasoDibujo: 2 })
            return
        }

        if (pasoDibujo === 2) {
            // Tercer clic: calculamos el offset y guardamos la cota
            const p3 = pManual || puntoFin
            
            // Proyección del tercer punto sobre la perpendicular a la línea de cota
            const dx = puntoFin.x - puntoInicio.x
            const dy = puntoFin.y - puntoInicio.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 0.01) {
                set({ dibujando: false, puntoInicio: null, puntoFin: null, pasoDibujo: 0 })
                return
            }

            // Vector perpendicular normalizado
            const nx = -dy / dist
            const ny = dx / dist

            // Offset es la distancia proyectada del punto 3 sobre la normal
            const v3x = p3.x - puntoInicio.x
            const v3y = p3.y - puntoInicio.y
            const offset = v3x * nx + v3y * ny

            get().saveHistory(`Cota agregada (${dist.toFixed(2)}m)`, 'creacion')

            set((s) => ({
                cotas: [...(s.cotas || []), {
                    id: uid('cota'),
                    x1: puntoInicio.x, y1: puntoInicio.y,
                    x2: puntoFin.x, y2: puntoFin.y,
                    offset,
                    tipo: props.tipo,
                    mostrarUnidades: props.mostrarUnidades,
                    decimales: props.decimales,
                    estilo: props.estilo,
                    layer: get().capaActiva,
                }],
                dibujando: false, puntoInicio: null, puntoFin: null, puntoAux: null, pasoDibujo: 0
            }))
        }
    },

    cancelarDibujo: () => set({
        dibujando: false, puntoInicio: null, puntoFin: null, puntoAux: null, pasoDibujo: 0,
    }),

    seleccionar: (id, multi = false) => {
        if (!id) {
            set({ idsSeleccionados: [] })
            return
        }
        set((s) => {
            if (multi) {
                const existe = s.idsSeleccionados.includes(id)
                return {
                    idsSeleccionados: existe 
                        ? s.idsSeleccionados.filter(i => i !== id)
                        : [...s.idsSeleccionados, id]
                }
            }
            return { idsSeleccionados: [id] }
        })
    },

    eliminarSeleccionado: () => {
        const { idsSeleccionados } = get()
        if (idsSeleccionados.length === 0) return
        
        if (!window.confirm(`¿Eliminar ${idsSeleccionados.length} elemento(s)?`)) return

        get().saveHistory(`Eliminado (${idsSeleccionados.length} elementos)`, 'borrado')

        set((s) => ({
            muros: s.muros.filter((m) => !idsSeleccionados.includes(m.id)),
            puertas: s.puertas.filter((p) => !idsSeleccionados.includes(p.id)),
            ventanas: s.ventanas.filter((v) => !idsSeleccionados.includes(v.id)),
            escaleras: s.escaleras.filter((e) => !idsSeleccionados.includes(e.id)),
            columnas: s.columnas.filter((c) => !idsSeleccionados.includes(c.id)),
            cotas: s.cotas.filter((co) => !idsSeleccionados.includes(co.id)),
            textos: s.textos.filter((t) => !idsSeleccionados.includes(t.id)),
            areas: s.areas.filter((a) => !idsSeleccionados.includes(a.id)),
            idsSeleccionados: [],
        }))
    },

    moverSeleccion: (dx, dy) => {
        set((s) => ({
            muros: s.muros.map(m => s.idsSeleccionados.includes(m.id) 
                ? { ...m, x1: m.x1 + dx, y1: m.y1 + dy, x2: m.x2 + dx, y2: m.y2 + dy } 
                : m),
            puertas: s.puertas.map(p => s.idsSeleccionados.includes(p.id) 
                ? { ...p, x: p.x + dx, y: p.y + dy } 
                : p),
            ventanas: s.ventanas.map(v => s.idsSeleccionados.includes(v.id) 
                ? { ...v, x: v.x + dx, y: v.y + dy } 
                : v),
            escaleras: s.escaleras.map(e => s.idsSeleccionados.includes(e.id) 
                ? { ...e, x1: e.x1 + dx, y1: e.y1 + dy, x2: e.x2 + dx, y2: e.y2 + dy } 
                : e),
            columnas: s.columnas.map(c => s.idsSeleccionados.includes(c.id) 
                ? { ...c, x: c.x + dx, y: c.y + dy } 
                : c),
            cotas: s.cotas.map(co => s.idsSeleccionados.includes(co.id) 
                ? { ...co, x1: co.x1 + dx, y1: co.y1 + dy, x2: co.x2 + dx, y2: co.y2 + dy } 
                : co),
            textos: s.textos.map(t => s.idsSeleccionados.includes(t.id) 
                ? { ...t, x: t.x + dx, y: t.y + dy } 
                : t),
            areas: s.areas.map(a => s.idsSeleccionados.includes(a.id) 
                ? { ...a, puntos: a.puntos.map(p => ({ x: p.x + dx, y: p.y + dy })) } 
                : a),
        }))
    },

    cargarDatos: (muros, puertas, ventanas, escaleras = [], columnas = [], cotas = [], textos = [], areas = [], ambientes = [], capas = [], historial = []) => set((state) => ({ 
        muros, 
        puertas, 
        ventanas, 
        escaleras, 
        columnas, 
        cotas, 
        textos, 
        areas, 
        ambientes, 
        capas: capas.length > 0 ? capas : state.capas,
        historial: historial.length > 0 ? historial : (state.historial.length > 0 ? state.historial : []),
        cargado: true
    })),

    actualizarMuro: (id, cambios) =>
        set((s) => ({
            muros: s.muros.map((m) => m.id === id ? { ...m, ...cambios } : m)
        })),

    actualizarArea: (id, cambios) =>
        set((s) => ({
            areas: s.areas.map((a) => (a.id === id ? { ...a, ...cambios } : a)),
        })),
    actualizarPuerta: (id, cambios) =>
        set((s) => ({
            puertas: s.puertas.map((p) => p.id === id ? { ...p, ...cambios } : p)
        })),

    actualizarVentana: (id, cambios) => set((s) => ({
        ventanas: s.ventanas.map((v) => v.id === id ? { ...v, ...cambios } : v)
    })),

    actualizarColumna: (id, cambios) => set((s) => ({
        columnas: s.columnas.map((c) => c.id === id ? { ...c, ...cambios } : c)
    })),

    actualizarCota: (id, cambios) => set((s) => ({
        cotas: s.cotas.map((co) => co.id === id ? { ...co, ...cambios } : co)
    })),

    actualizarTexto: (id, cambios) => set((s) => ({
        textos: s.textos.map((t) => t.id === id ? { ...t, ...cambios } : t)
    })),

    seleccionarTodo: () => set((s) => ({
        idsSeleccionados: [
            ...s.muros.map(m => m.id),
            ...s.puertas.map(p => p.id),
            ...s.ventanas.map(v => v.id),
            ...s.escaleras.map(e => e.id),
            ...s.columnas.map(c => c.id),
            ...s.cotas.map(co => co.id),
            ...s.textos.map(t => t.id),
            ...s.areas.map(a => a.id),
        ]
    })),

    duplicarSeleccion: () => {
        const { idsSeleccionados, muros, puertas, ventanas, escaleras, columnas, cotas, textos, areas } = get()
        if (idsSeleccionados.length === 0) return

        const offset = 0.25
        const nuevosMuros: Muro[] = []
        const nuevasPuertas: Puerta[] = []
        const nuevasVentanas: Ventana[] = []
        const nuevasEscaleras: Escalera[] = []
        const nuevasColumnas: Columna[] = []
        const nuevasCotas: Cota[] = []
        const nuevosTextos: ElementoTexto[] = []
        const nuevasAreas: ElementoArea[] = []

        const mappingIds: Record<string, string> = {}

        // Muros (y mapeo de IDs para dependientes)
        muros.filter(m => idsSeleccionados.includes(m.id)).forEach(m => {
            const newId = uid('muro')
            mappingIds[m.id] = newId
            nuevosMuros.push({ ...m, id: newId, x1: m.x1 + offset, y1: m.y1 + offset, x2: m.x2 + offset, y2: m.y2 + offset })
        })

        // Puertas
        puertas.filter(p => idsSeleccionados.includes(p.id)).forEach(p => {
            nuevasPuertas.push({ ...p, id: uid('puerta'), x: p.x + offset, y: p.y + offset, muro_id: mappingIds[p.muro_id] || p.muro_id })
        })

        // Ventanas
        ventanas.filter(v => idsSeleccionados.includes(v.id)).forEach(v => {
            nuevasVentanas.push({ ...v, id: uid('ventana'), x: v.x + offset, y: v.y + offset, muro_id: mappingIds[v.muro_id] || v.muro_id })
        })

        // Escaleras
        escaleras.filter(e => idsSeleccionados.includes(e.id)).forEach(e => {
            nuevasEscaleras.push({ ...e, id: uid('escalera'), x1: e.x1 + offset, y1: e.y1 + offset, x2: e.x2 + offset, y2: e.y2 + offset })
        })

        // Columnas
        columnas.filter(c => idsSeleccionados.includes(c.id)).forEach(c => {
            nuevasColumnas.push({ ...c, id: uid('columna'), x: c.x + offset, y: c.y + offset })
        })

        // Cotas
        cotas.filter(co => idsSeleccionados.includes(co.id)).forEach(co => {
            nuevasCotas.push({ ...co, id: uid('cota'), x1: co.x1 + offset, y1: co.y1 + offset, x2: co.x2 + offset, y2: co.y2 + offset })
        })

        // Textos
        textos.filter(t => idsSeleccionados.includes(t.id)).forEach(t => {
            nuevosTextos.push({ ...t, id: uid('texto'), x: t.x + offset, y: t.y + offset })
        })

        // Areas
        areas.filter(a => idsSeleccionados.includes(a.id)).forEach(a => {
            nuevasAreas.push({ ...a, id: uid('area'), puntos: a.puntos.map(p => ({ x: p.x + offset, y: p.y + offset })) })
        })

        set((s) => ({
            muros: [...s.muros, ...nuevosMuros],
            puertas: [...s.puertas, ...nuevasPuertas],
            ventanas: [...s.ventanas, ...nuevasVentanas],
            escaleras: [...s.escaleras, ...nuevasEscaleras],
            columnas: [...s.columnas, ...nuevasColumnas],
            cotas: [...s.cotas, ...nuevasCotas],
            textos: [...s.textos, ...nuevosTextos],
            areas: [...s.areas, ...nuevasAreas],
            idsSeleccionados: [
                ...nuevosMuros.map(m => m.id),
                ...nuevasPuertas.map(p => p.id),
                ...nuevasVentanas.map(v => v.id),
                ...nuevasEscaleras.map(e => e.id),
                ...nuevasColumnas.map(c => c.id),
                ...nuevasCotas.map(co => co.id),
                ...nuevosTextos.map(t => t.id),
                ...nuevasAreas.map(a => a.id),
            ]
        }))
    },

    terminarTexto: (contenido, props, pManual) => {
        const { puntoInicio } = get()
        const p = pManual || puntoInicio
        if (!p) return
        get().saveHistory(`Texto: "${contenido}"`, 'creacion')
        set((s) => ({
            textos: [...s.textos, {
                id: uid('texto'),
                x: p.x, y: p.y,
                contenido,
                fontSize: props.fontSize,
                color: '#E8ECF0',
                estilo: props.estilo,
                layer: props.capa || get().capaActiva,
            }],
            dibujando: false, puntoInicio: null, puntoFin: null,
        }))
    },

    terminarArea: () => {
        const { puntosPoligono } = get()
        if (puntosPoligono.length < 3) {
            set({ dibujando: false, puntosPoligono: [], puntoInicio: null, puntoFin: null })
            return
        }

        // Calcular área con fórmula Shoelace
        let area = 0
        for (let i = 0; i < puntosPoligono.length; i++) {
            const j = (i + 1) % puntosPoligono.length
            area += puntosPoligono[i].x * puntosPoligono[j].y
            area -= puntosPoligono[j].x * puntosPoligono[i].y
        }
        area = Math.abs(area) / 2

        get().saveHistory(`Área definida (${area.toFixed(2)}m²)`, 'creacion')

        set((s) => ({
            areas: [...s.areas, {
                id: uid('area'),
                puntos: [...puntosPoligono],
                area,
                layer: get().capaActiva,
            }],
            dibujando: false, puntosPoligono: [], puntoInicio: null, puntoFin: null,
        }))
    },

    autoSanarPlano: () => {
        const { muros } = get()
        if (muros.length === 0) return

        const THRESHOLD = 0.15 // 15cm de radio de atracción
        let huboCambios = false
        const nuevosMuros = [...muros]

        for (let i = 0; i < nuevosMuros.length; i++) {
            const m1 = nuevosMuros[i]
            const puntos1 = [
                { id: 'x1y1', x: m1.x1, y: m1.y1 },
                { id: 'x2y2', x: m1.x2, y: m1.y2 }
            ]

            puntos1.forEach(p1 => {
                // Buscar otros muros para snap
                for (let j = 0; j < nuevosMuros.length; j++) {
                    if (i === j) continue
                    const m2 = nuevosMuros[j]
                    
                    // Distancia a inicio de m2
                    const d1 = Math.sqrt((p1.x - m2.x1) ** 2 + (p1.y - m2.y1) ** 2)
                    if (d1 > 0 && d1 < THRESHOLD) {
                        if (p1.id === 'x1y1') { m1.x1 = m2.x1; m1.y1 = m2.y1 }
                        else { m1.x2 = m2.x1; m1.y2 = m2.y1 }
                        huboCambios = true
                    }

                    // Distancia a fin de m2
                    const d2 = Math.sqrt((p1.x - m2.x2) ** 2 + (p1.y - m2.y2) ** 2)
                    if (d2 > 0 && d2 < THRESHOLD) {
                        if (p1.id === 'x1y1') { m1.x1 = m2.x2; m1.y1 = m2.y2 }
                        else { m1.x2 = m2.x2; m1.y2 = m2.y2 }
                        huboCambios = true
                    }
                }
            })
        }

        if (huboCambios) {
            set({ muros: nuevosMuros })
        }
    },

    limpiarTodo: () => set({
        muros: [], puertas: [], ventanas: [], escaleras: [], columnas: [], cotas: [], textos: [], areas: [],
        dibujando: false, puntoInicio: null, puntoFin: null, puntoAux: null, pasoDibujo: 0, puntosPoligono: [],
        idsSeleccionados: [],
        ambientes: [],
    }),
}))