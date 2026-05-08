import { create } from 'zustand'
import type { Muro, Puerta, Ventana, Punto } from '../types'

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

type TipoDibujo = 'muro' | 'puerta' | 'ventana'

interface PlanoState {

    ambientes: AmbienteIA[]
    setAmbientes: (a: AmbienteIA[]) => void

    muros: Muro[]
    puertas: Puerta[]
    ventanas: Ventana[]


    // Dibujo en progreso
    dibujando: boolean
    tipoDibujo: TipoDibujo
    puntoInicio: Punto | null
    puntoFin: Punto | null

    // Selección
    idSeleccionado: string | null

    // Acciones — Muro
    iniciarDibujo: (p: Punto, tipo: TipoDibujo) => void
    actualizarDibujo: (p: Punto) => void
    terminarMuro: (espesor?: number) => void
    terminarPuerta: () => void
    terminarVentana: () => void
    cancelarDibujo: () => void

    // Selección y eliminación
    seleccionar: (id: string | null) => void
    eliminarSeleccionado: () => void

    // Cargar desde Supabase
    cargarDatos: (muros: Muro[], puertas: Puerta[], ventanas: Ventana[]) => void
    limpiarTodo: () => void

    actualizarMuro: (id: string, cambios: Partial<Muro>) => void
    actualizarPuerta: (id: string, cambios: Partial<Puerta>) => void
    actualizarVentana: (id: string, cambios: Partial<Ventana>) => void
}

export const usePlanoStore = create<PlanoState>((set, get) => ({

    muros: [],
    puertas: [],
    ventanas: [],
    dibujando: false,
    tipoDibujo: 'muro',
    puntoInicio: null,
    puntoFin: null,
    idSeleccionado: null,

    iniciarDibujo: (p, tipo) => set({
        dibujando: true, tipoDibujo: tipo,
        puntoInicio: p, puntoFin: p,
    }),

    actualizarDibujo: (p) => {
        if (get().dibujando) set({ puntoFin: p })
    },

    ambientes: [],
    setAmbientes: (ambientes) => set({ ambientes }),

    terminarMuro: (espesor = 0.25) => {
        const { puntoInicio, puntoFin } = get()
        if (!puntoInicio || !puntoFin) return
        const dx = puntoFin.x - puntoInicio.x
        const dy = puntoFin.y - puntoInicio.y
        if (Math.sqrt(dx * dx + dy * dy) < 0.05) {
            set({ dibujando: false, puntoInicio: null, puntoFin: null })
            return
        }
        set((s) => ({
            muros: [...s.muros, {
                id: uid('muro'),
                x1: puntoInicio.x, y1: puntoInicio.y,
                x2: puntoFin.x, y2: puntoFin.y,
                espesor,
                altura: 2.80,
                alturaBase: 0,
                material: 'concreto' as const,
                layer: 'A-WALL',
            }],
            dibujando: false, puntoInicio: null, puntoFin: null,
        }))
    },

    terminarPuerta: () => {
        const { puntoInicio, puntoFin } = get()
        if (!puntoInicio || !puntoFin) return
        const dx = puntoFin.x - puntoInicio.x
        const dy = puntoFin.y - puntoInicio.y
        if (Math.sqrt(dx * dx + dy * dy) < 0.05) {
            set({ dibujando: false, puntoInicio: null, puntoFin: null })
            return
        }
        set((s) => ({
            puertas: [...s.puertas, {
                id: uid('puerta'),
                muro_id: '',
                x: puntoInicio.x, y: puntoInicio.y,
                ancho: Math.sqrt(dx * dx + dy * dy),
                angulo_apertura: Math.atan2(dy, dx),
                layer: 'A-DOOR',
            }],
            dibujando: false, puntoInicio: null, puntoFin: null,
        }))
    },

    terminarVentana: () => {
        const { puntoInicio, puntoFin } = get()
        if (!puntoInicio || !puntoFin) return
        const dx = puntoFin.x - puntoInicio.x
        const dy = puntoFin.y - puntoInicio.y
        if (Math.sqrt(dx * dx + dy * dy) < 0.05) {
            set({ dibujando: false, puntoInicio: null, puntoFin: null })
            return
        }
        set((s) => ({
            ventanas: [...s.ventanas, {
                id: uid('ventana'),
                muro_id: '',
                x: puntoInicio.x, y: puntoInicio.y,
                ancho: Math.sqrt(dx * dx + dy * dy),
                angulo: Math.atan2(dy, dx),
                layer: 'A-WIND',
            }],
            dibujando: false, puntoInicio: null, puntoFin: null,
        }))
    },

    cancelarDibujo: () => set({
        dibujando: false, puntoInicio: null, puntoFin: null,
    }),

    seleccionar: (id) => set({ idSeleccionado: id }),

    eliminarSeleccionado: () => {
        const { idSeleccionado } = get()
        if (!idSeleccionado) return
        set((s) => ({
            muros: s.muros.filter((m) => m.id !== idSeleccionado),
            puertas: s.puertas.filter((p) => p.id !== idSeleccionado),
            ventanas: s.ventanas.filter((v) => v.id !== idSeleccionado),
            idSeleccionado: null,
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

    actualizarVentana: (id, cambios) =>
        set((s) => ({
            ventanas: s.ventanas.map((v) => v.id === id ? { ...v, ...cambios } : v)
        })),

    limpiarTodo: () => set({
        muros: [], puertas: [], ventanas: [],
        dibujando: false, puntoInicio: null, puntoFin: null,
        idSeleccionado: null,
    }),
}))