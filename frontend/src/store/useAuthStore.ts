import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Usuario } from '../types'

interface AuthState {
    usuario: Usuario | null
    cargando: boolean
    setUsuario: (u: Usuario | null) => void
    setCargando: (v: boolean) => void
    cerrarSesion: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
    usuario: null,
    cargando: true,
    setUsuario: (usuario) => set({ usuario }),
    setCargando: (cargando) => set({ cargando }),
    cerrarSesion: async () => {
        await supabase.auth.signOut()
        set({ usuario: null })
    },
}))