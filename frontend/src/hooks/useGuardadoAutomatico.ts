import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { usePlanoStore } from '../store/usePlanoStore'
import { useProyectoStore } from '../store/useProyectoStore'

const INTERVALO_MS = 3000 // guardar cada 3 segundos si hay cambios

export function useGuardadoAutomatico() {
    const { proyectoActual } = useProyectoStore()
    const { muros, puertas, ventanas } = usePlanoStore()
    const ultimoGuardado = useRef<string>('')
    const [guardando, setGuardando] = useState(false)
    const [ultimaVez, setUltimaVez] = useState<Date | null>(null)

    const capturarThumbnail = async (proyectoId: string) => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement
        if (!canvas) return
        try {
            const thumbnail = canvas.toDataURL('image/png', 0.4)
            await supabase.from('proyectos')
                .update({ thumbnail })
                .eq('id', proyectoId)
        } catch { }
    }

    useEffect(() => {
        const intervalo = setInterval(async () => {
            if (!proyectoActual) return

            const estadoActual = JSON.stringify({ muros, puertas, ventanas })

            // Solo guardar si hubo cambios
            if (estadoActual === ultimoGuardado.current) return

            setGuardando(true)
            const { error } = await supabase
                .from('proyectos')
                .update({
                    datos: { muros, puertas, ventanas, escala: 100, unidad: 'metros' },
                })
                .eq('id', proyectoActual.id)

            if (!error) {
                ultimoGuardado.current = estadoActual
                setUltimaVez(new Date())
                // Guardar thumbnail cada 5 guardados
                if (Math.random() < 0.2) capturarThumbnail(proyectoActual.id)
            }
            setGuardando(false)
        }, INTERVALO_MS)

        return () => clearInterval(intervalo)
    }, [proyectoActual, muros, puertas, ventanas])

    return { guardando, ultimaVez }
}