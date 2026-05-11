import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

interface Props {
    children: ReactNode
}

export default function RutaProtegida({ children }: Props) {
    const { usuario, cargando } = useAuthStore()
    const navigate = useNavigate()

    useEffect(() => {
        if (!cargando && !usuario) navigate('/')
    }, [usuario, cargando])

    if (cargando) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-blue-400 text-sm animate-pulse">Cargando MyARQIA...</div>
            </div>
        )
    }

    if (!usuario) return null

    return <>{children}</>
}