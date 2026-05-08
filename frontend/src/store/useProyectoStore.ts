import { create } from 'zustand'
import type { Proyecto, DatosPlano } from '../types'

const datosIniciales: DatosPlano = {
    ambientes: [],
    muros: [],
    puertas: [],
    ventanas: [],
    escala: 100,
    unidad: 'metros',
}

interface ProyectoState {
    proyectoActual: Proyecto | null
    setProyectoActual: (p: Proyecto | null) => void
    actualizarDatos: (datos: Partial<DatosPlano>) => void
}

export const useProyectoStore = create<ProyectoState>((set) => ({
    proyectoActual: null,
    setProyectoActual: (proyectoActual) => set({ proyectoActual }),
    actualizarDatos: (nuevosDatos) =>
        set((state) => ({
            proyectoActual: state.proyectoActual
                ? {
                    ...state.proyectoActual,
                    datos: { ...state.proyectoActual.datos, ...nuevosDatos },
                }
                : null,
        })),
}))