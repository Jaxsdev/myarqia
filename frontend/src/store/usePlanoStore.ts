import { create } from 'zustand'
import type { Muro, Puerta, Ventana, Escalera, Columna, Cota, ElementoTexto, ElementoArea, Punto } from '../types'

export interface AmbienteIA {
    nombre: string
    x: number
    y: number
    ancho: number
    largo: number
    color?: string
}

let contador = 1
const uid = (p: string) => `${p}-${contador++}`

type TipoDibujo = 'muro' | 'puerta' | 'ventana' | 'escalera' | 'columna' | 'cota' | 'area'

interface PlanoState {

    ambientes: AmbienteIA[]
    setAmbientes: (a: AmbienteIA[]) => void

    muros: Muro[]
    puertas: Puerta[]
    ventanas: Ventana[]
    escaleras: Escalera[]
    columnas: Columna[]
    cotas: Cota[]
    textos: ElementoTexto[]
    areas: ElementoArea[]


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

    // Acciones — Muro
    iniciarDibujo: (p: Punto, tipo: TipoDibujo) => void
    actualizarDibujo: (p: Punto) => void
    terminarMuro: (espesor?: number, continuar?: boolean) => void
    terminarPuerta: (ancho?: number, sentido?: 'izquierda' | 'derecha', angulo?: number) => void
    terminarVentana: (ancho?: number, alto?: number, alfeizar?: number) => void
    terminarEscalera: (peldaños?: number, paso?: number, contrapaso?: number) => void
    terminarColumna: (ancho?: number, largo?: number, forma?: 'cuadrada' | 'circular', pManual?: Punto) => void
    terminarCota: (p?: Punto) => void
    terminarTexto: (contenido: string, fontSize: number, color: string, pManual?: Punto) => void
    terminarArea: () => void
    cancelarDibujo: () => void

    // Selección y eliminación
    seleccionar: (id: string | null, multi?: boolean) => void
    eliminarSeleccionado: () => void
    moverSeleccion: (dx: number, dy: number) => void
    togglePuertaSentido: (id: string) => void

    // Cargar desde Supabase
    cargarDatos: (muros: Muro[], puertas: Puerta[], ventanas: Ventana[]) => void
    limpiarTodo: () => void

    actualizarMuro: (id: string, cambios: Partial<Muro>) => void
    actualizarPuerta: (id: string, cambios: Partial<Puerta>) => void
    actualizarVentana: (id: string, cambios: Partial<Ventana>) => void
    actualizarColumna: (id: string, cambios: Partial<Columna>) => void
    actualizarCota: (id: string, cambios: Partial<Cota>) => void
    actualizarTexto: (id: string, cambios: Partial<ElementoTexto>) => void
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

    terminarMuro: (espesor = 0.25, continuar = false) => {
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
            espesor,
            altura: 2.80,
            alturaBase: 0,
            material: 'concreto' as const,
            layer: 'A-WALL',
        }

        set((s) => ({
            muros: [...s.muros, nuevoMuro],
            dibujando: continuar,
            puntoInicio: continuar ? puntoFin : null,
            puntoFin: continuar ? puntoFin : null,
        }))
    },

    terminarPuerta: (ancho, sentido = 'derecha', angulo = 90, pManual?: Punto) => {
        const { puntoInicio, puntoFin, muros } = get()
        const pIn = pManual || puntoInicio
        const pFi = pManual || puntoFin
        if (!pIn || !pFi) return
        
        const dx = pFi.x - pIn.x
        const dy = pFi.y - pIn.y
        let dist = Math.sqrt(dx * dx + dy * dy)
        let ang = Math.atan2(dy, dx)

        // Buscar muro más cercano para asociar
        let muroCercanoId = ''
        let minDist = 0.5 
        let anguloMuro = 0
        
        muros.forEach(m => {
            const l2 = (m.x2 - m.x1) ** 2 + (m.y2 - m.y1) ** 2
            if (l2 === 0) return
            let t = ((pIn.x - m.x1) * (m.x2 - m.x1) + (pIn.y - m.y1) * (m.y2 - m.y1)) / l2
            t = Math.max(0, Math.min(1, t))
            const px = m.x1 + t * (m.x2 - m.x1)
            const py = m.y1 + t * (m.y2 - m.y1)
            const d = Math.sqrt((pIn.x - px) ** 2 + (pIn.y - py) ** 2)
            
            if (d < minDist) {
                minDist = d
                muroCercanoId = m.id
                anguloMuro = Math.atan2(m.y2 - m.y1, m.x2 - m.x1)
            }
        })

        // Si es inserción por clic (distancia 0), usamos ancho default y ángulo del muro
        if (dist < 0.05) {
            dist = ancho || 0.90
            ang = anguloMuro
        }

        set((s) => ({
            puertas: [...s.puertas, {
                id: uid('puerta'),
                muro_id: muroCercanoId,
                x: pIn.x, y: pIn.y,
                ancho: dist,
                angulo_apertura: ang,
                layer: 'A-DOOR',
            }],
            dibujando: false, puntoInicio: null, puntoFin: null,
        }))
    },

    togglePuertaSentido: (id: string) => {
        set((s) => ({
            puertas: s.puertas.map(p => {
                if (p.id !== id) return p
                // Alternar entre 4 estados: derecha-fuera, derecha-dentro, izquierda-fuera, izquierda-dentro
                // Por ahora algo simple: invertir el ángulo de apertura en 180 grados o espejo
                return { ...p, angulo_apertura: p.angulo_apertura + Math.PI / 2 }
            })
        }))
    },

    terminarVentana: (ancho, alto = 1.20, alfeizar = 0.90, pManual?: Punto) => {
        const { puntoInicio, puntoFin, muros } = get()
        const pIn = pManual || puntoInicio
        const pFi = pManual || puntoFin
        if (!pIn || !pFi) return
        
        const dx = pFi.x - pIn.x
        const dy = pFi.y - pIn.y
        let dist = Math.sqrt(dx * dx + dy * dy)
        let ang = Math.atan2(dy, dx)

        // Buscar muro más cercano para asociar
        let muroCercanoId = ''
        let minDist = 0.5 
        let anguloMuro = 0
        muros.forEach(m => {
            const l2 = (m.x2 - m.x1) ** 2 + (m.y2 - m.y1) ** 2
            if (l2 === 0) return
            let t = ((pIn.x - m.x1) * (m.x2 - m.x1) + (pIn.y - m.y1) * (m.y2 - m.y1)) / l2
            t = Math.max(0, Math.min(1, t))
            const px = m.x1 + t * (m.x2 - m.x1)
            const py = m.y1 + t * (m.y2 - m.y1)
            const d = Math.sqrt((pIn.x - px) ** 2 + (pIn.y - py) ** 2)
            
            if (d < minDist) {
                minDist = d
                muroCercanoId = m.id
                anguloMuro = Math.atan2(m.y2 - m.y1, m.x2 - m.x1)
            }
        })

        if (dist < 0.05) {
            dist = ancho || 1.20
            ang = anguloMuro
        }

        set((s) => ({
            ventanas: [...s.ventanas, {
                id: uid('ventana'),
                muro_id: muroCercanoId,
                x: pIn.x, y: pIn.y,
                ancho: dist,
                angulo: ang,
                layer: 'A-WIND',
            }],
            dibujando: false, puntoInicio: null, puntoFin: null,
        }))
    },

    terminarEscalera: (peldaños = 15, paso = 0.25, contrapaso = 0.175) => {
        const { puntoInicio, puntoFin } = get()
        if (!puntoInicio || !puntoFin) return
        set((s) => ({
            escaleras: [...(s.escaleras || []), {
                id: uid('escalera'),
                x1: puntoInicio.x, y1: puntoInicio.y,
                x2: puntoFin.x, y2: puntoFin.y,
                peldaños, paso, contrapaso,
                layer: 'A-STAIR',
            }],
            dibujando: false, puntoInicio: null, puntoFin: null,
        }))
    },

    terminarColumna: (ancho = 0.30, largo = 0.30, forma = 'cuadrada', pManual?: Punto) => {
        const { puntoInicio } = get()
        const p = pManual || puntoInicio
        if (!p) return
        set((s) => ({
            columnas: [...(s.columnas || []), {
                id: uid('columna'),
                x: p.x, y: p.y,
                ancho, largo, forma,
                layer: 'A-STRUCT',
            }],
            dibujando: false, puntoInicio: null, puntoFin: null,
        }))
    },

    terminarCota: (p) => {
        const { puntoInicio, puntoFin, pasoDibujo } = get()
        if (!puntoInicio || !puntoFin) return

        if (pasoDibujo === 1) {
            // Segundo clic: fijamos el punto final y pasamos a definir offset
            set({ puntoFin: p || puntoFin, pasoDibujo: 2 })
            return
        }

        if (pasoDibujo === 2) {
            // Tercer clic: calculamos el offset y guardamos la cota
            const p3 = p || puntoFin
            
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

            set((s) => ({
                cotas: [...(s.cotas || []), {
                    id: uid('cota'),
                    x1: puntoInicio.x, y1: puntoInicio.y,
                    x2: puntoFin.x, y2: puntoFin.y,
                    offset,
                    layer: 'A-DIM',
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

    cargarDatos: (muros, puertas, ventanas) => set({ muros, puertas, ventanas }),

    actualizarMuro: (id, cambios) =>
        set((s) => ({
            muros: s.muros.map((m) => m.id === id ? { ...m, ...cambios } : m)
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

    terminarTexto: (contenido, fontSize, color, pManual) => {
        const { puntoInicio } = get()
        const p = pManual || puntoInicio
        if (!p) return
        set((s) => ({
            textos: [...s.textos, {
                id: uid('texto'),
                x: p.x, y: p.y,
                contenido, fontSize, color,
                layer: 'A-ANNO-TEXT',
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

        set((s) => ({
            areas: [...s.areas, {
                id: uid('area'),
                puntos: [...puntosPoligono],
                area,
                layer: 'A-AREA',
            }],
            dibujando: false, puntosPoligono: [], puntoInicio: null, puntoFin: null,
        }))
    },

    limpiarTodo: () => set({
        muros: [], puertas: [], ventanas: [], escaleras: [], columnas: [], cotas: [], textos: [], areas: [],
        dibujando: false, puntoInicio: null, puntoFin: null, puntoAux: null, pasoDibujo: 0, puntosPoligono: [],
        idsSeleccionados: [],

        // Agrega esto para limpiar ambientes también
        ambientes: [],
    }),
}))