import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/useAuthStore'

// Escuchar cambios de sesión globalmente
supabase.auth.onAuthStateChange((event, session) => {
  const { setUsuario, setCargando } = useAuthStore.getState()
  if (session?.user) {
    setUsuario({
      id: session.user.id,
      email: session.user.email ?? '',
      nombre: session.user.user_metadata?.full_name,
    })
  } else {
    setUsuario(null)
  }
  setCargando(false)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)