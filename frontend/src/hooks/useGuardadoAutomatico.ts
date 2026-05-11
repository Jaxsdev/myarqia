import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { usePlanoStore } from '../store/usePlanoStore'
import { useProyectoStore } from '../store/useProyectoStore'

const INTERVALO_MS = 3000 // guardar cada 3 segundos si hay cambios

export function useGuardadoAutomatico() {
    const { proyectoActual } = useProyectoStore()
    const { cargado } = usePlanoStore()
    const ultimoGuardado = useRef<string>('')
    const [guardando, setGuardando] = useState(false)
    const [ultimaVez, setUltimaVez] = useState<Date | null>(null)
    const guardadoEnCurso = useRef(false)

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

    const guardar = useCallback(async () => {
        if (!proyectoActual || !cargado || guardadoEnCurso.current) return

        const state = usePlanoStore.getState()
        const estadoActual = JSON.stringify({ 
            muros: state.muros, puertas: state.puertas, ventanas: state.ventanas, 
            escaleras: state.escaleras, columnas: state.columnas, 
            cotas: state.cotas, textos: state.textos, areas: state.areas, 
            ambientes: state.ambientes, capas: state.capas, historial: state.historial
        })
        if (estadoActual === ultimoGuardado.current) return

        guardadoEnCurso.current = true
        setGuardando(true)
        const { error } = await supabase
            .from('proyectos')
            .update({
                datos: { 
                    muros: state.muros, puertas: state.puertas, ventanas: state.ventanas, 
                    escaleras: state.escaleras, columnas: state.columnas, 
                    cotas: state.cotas, textos: state.textos, areas: state.areas, 
                    ambientes: state.ambientes, capas: state.capas, historial: state.historial,
                    escala: 100, unidad: 'metros' 
                },
            })
            .eq('id', proyectoActual.id)

        if (!error) {
            ultimoGuardado.current = estadoActual
            setUltimaVez(new Date())
            capturarThumbnail(proyectoActual.id)
        }
        setGuardando(false)
        guardadoEnCurso.current = false
    }, [proyectoActual, cargado])

    useEffect(() => {
        const intervalo = setInterval(guardar, INTERVALO_MS)
        return () => clearInterval(intervalo)
    }, [guardar])

    return { guardando, ultimaVez, forzarGuardado: guardar }
}