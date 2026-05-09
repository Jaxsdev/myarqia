import { create } from 'zustand'

interface RNEAlert {
    id: string
    tipo: 'error' | 'advertencia'
    mensaje: string
    elementoId?: string
}

interface RNEState {
    alertas: RNEAlert[]
    conteoAlertas: number
    agregarAlerta: (alerta: RNEAlert) => void
    limpiarAlertas: () => void
    removerAlerta: (id: string) => void
}

export const useRNEStore = create<RNEState>((set) => ({
    alertas: [],
    conteoAlertas: 0,
    agregarAlerta: (alerta) => set((state) => {
        const nuevas = [...state.alertas, alerta]
        return { 
            alertas: nuevas, 
            conteoAlertas: nuevas.length 
        }
    }),
    limpiarAlertas: () => set({ alertas: [], conteoAlertas: 0 }),
    removerAlerta: (id) => set((state) => {
        const nuevas = state.alertas.filter(a => a.id !== id)
        return { 
            alertas: nuevas, 
            conteoAlertas: nuevas.length 
        }
    }),
}))
