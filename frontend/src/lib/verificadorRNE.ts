import type { Muro, Puerta, Ventana } from '../types'

export interface ObservacionRNE {
    id: string
    tipo: 'error' | 'advertencia' | 'ok'
    articulo: string
    descripcion: string
    valor_actual?: string
    valor_minimo?: string
}

export interface ResultadoVerificacion {
    observaciones: ObservacionRNE[]
    errores: number
    advertencias: number
    aprobado: boolean
}

// Calcula el área encerrada por los muros (aproximada)
function calcularAreaAprox(muros: Muro[]): number {
    if (muros.length < 3) return 0
    // Usar los puntos únicos para calcular área con Shoelace
    const puntos: { x: number; y: number }[] = []
    muros.forEach((m) => {
        puntos.push({ x: m.x1, y: m.y1 })
        puntos.push({ x: m.x2, y: m.y2 })
    })
    // Área aproximada del bounding box por ahora
    const xs = puntos.map((p) => p.x)
    const ys = puntos.map((p) => p.y)
    const w = Math.max(...xs) - Math.min(...xs)
    const h = Math.max(...ys) - Math.min(...ys)
    return w * h
}

// Calcula la longitud de un muro
function longitudMuro(m: Muro): number {
    return Math.sqrt((m.x2 - m.x1) ** 2 + (m.y2 - m.y1) ** 2)
}

// Detecta si un muro es horizontal o vertical
function orientacionMuro(m: Muro): 'horizontal' | 'vertical' | 'diagonal' {
    const dx = Math.abs(m.x2 - m.x1)
    const dy = Math.abs(m.y2 - m.y1)
    if (dy < 0.1) return 'horizontal'
    if (dx < 0.1) return 'vertical'
    return 'diagonal'
}

export function verificarRNE(
    muros: Muro[],
    puertas: Puerta[],
    ventanas: Ventana[]
): ResultadoVerificacion {
    const obs: ObservacionRNE[] = []
    let idCounter = 1
    const newId = () => `rne-${idCounter++}`

    // ── 1. Verificar espesor de muros ─────────────────────
    const murosDelgados = muros.filter((m) => m.espesor < 0.15)
    if (murosDelgados.length > 0) {
        obs.push({
            id: newId(),
            tipo: 'error',
            articulo: 'RNE A.010 Art.26',
            descripcion: `${murosDelgados.length} muro(s) con espesor menor al mínimo`,
            valor_actual: `${(Math.min(...murosDelgados.map(m => m.espesor)) * 100).toFixed(0)}cm`,
            valor_minimo: '15cm',
        })
    } else {
        obs.push({
            id: newId(),
            tipo: 'ok',
            articulo: 'RNE A.010 Art.26',
            descripcion: 'Espesores de muros correctos',
        })
    }

    // ── 2. Verificar área mínima del espacio ──────────────
    if (muros.length >= 4) {
        const area = calcularAreaAprox(muros)
        if (area < 8) {
            obs.push({
                id: newId(),
                tipo: 'error',
                articulo: 'RNE A.010 Art.22',
                descripcion: 'Área del espacio menor al mínimo para dormitorio',
                valor_actual: `${area.toFixed(1)}m²`,
                valor_minimo: '8.00m²',
            })
        } else if (area < 12) {
            obs.push({
                id: newId(),
                tipo: 'advertencia',
                articulo: 'RNE A.010 Art.22',
                descripcion: 'Área adecuada para dormitorio pero insuficiente para sala',
                valor_actual: `${area.toFixed(1)}m²`,
                valor_minimo: '12.00m² (sala)',
            })
        } else {
            obs.push({
                id: newId(),
                tipo: 'ok',
                articulo: 'RNE A.010 Art.22',
                descripcion: `Área del espacio correcta (${area.toFixed(1)}m²)`,
            })
        }
    }

    // ── 3. Verificar ancho de puertas ─────────────────────
    if (puertas.length > 0) {
        const puertasEstrechas = puertas.filter((p) => p.ancho < 0.70)
        const puertasPrincipal = puertas.filter((p) => p.ancho < 0.90)

        if (puertasEstrechas.length > 0) {
            obs.push({
                id: newId(),
                tipo: 'error',
                articulo: 'RNE A.010 Art.25',
                descripcion: `${puertasEstrechas.length} puerta(s) con ancho menor al mínimo absoluto`,
                valor_actual: `${(Math.min(...puertasEstrechas.map(p => p.ancho)) * 100).toFixed(0)}cm`,
                valor_minimo: '70cm',
            })
        } else if (puertasPrincipal.length > 0) {
            obs.push({
                id: newId(),
                tipo: 'advertencia',
                articulo: 'RNE A.010 Art.25',
                descripcion: `${puertasPrincipal.length} puerta(s) menores a 90cm (recomendado para ingreso principal)`,
                valor_actual: `${(Math.min(...puertasPrincipal.map(p => p.ancho)) * 100).toFixed(0)}cm`,
                valor_minimo: '90cm recomendado',
            })
        } else {
            obs.push({
                id: newId(),
                tipo: 'ok',
                articulo: 'RNE A.010 Art.25',
                descripcion: `${puertas.length} puerta(s) con ancho correcto`,
            })
        }
    }

    // ── 4. Verificar ventilación e iluminación ────────────
    if (muros.length >= 4 && ventanas.length === 0) {
        obs.push({
            id: newId(),
            tipo: 'advertencia',
            articulo: 'RNE A.010 Art.30',
            descripcion: 'El espacio no tiene ventanas — se requiere ventilación natural',
            valor_minimo: 'Mínimo 1 ventana al exterior',
        })
    } else if (ventanas.length > 0) {
        const areaVentanas = ventanas.reduce((sum, v) => sum + v.ancho * 1.2, 0)
        const areaEspacio = calcularAreaAprox(muros)
        const porcentaje = areaEspacio > 0 ? (areaVentanas / areaEspacio) * 100 : 0

        if (porcentaje < 10 && areaEspacio > 0) {
            obs.push({
                id: newId(),
                tipo: 'advertencia',
                articulo: 'RNE A.010 Art.30',
                descripcion: 'Área de ventanas posiblemente insuficiente',
                valor_actual: `~${porcentaje.toFixed(0)}% del área`,
                valor_minimo: '≥ 10% del área del ambiente',
            })
        } else {
            obs.push({
                id: newId(),
                tipo: 'ok',
                articulo: 'RNE A.010 Art.30',
                descripcion: `Ventilación e iluminación correctas (${ventanas.length} ventana/s)`,
            })
        }
    }

    // ── 5. Verificar muros sin conectar ───────────────────
    const murosCortos = muros.filter((m) => longitudMuro(m) < 0.50)
    if (murosCortos.length > 0) {
        obs.push({
            id: newId(),
            tipo: 'advertencia',
            articulo: 'Buenas prácticas CAD',
            descripcion: `${murosCortos.length} muro(s) muy cortos (< 50cm) — revisar si son correctos`,
            valor_actual: `${(Math.min(...murosCortos.map(longitudMuro)) * 100).toFixed(0)}cm`,
            valor_minimo: '50cm mínimo recomendado',
        })
    }

    // ── 6. Verificar ancho de ventanas ────────────────────
    if (ventanas.length > 0) {
        const ventanasEstrechas = ventanas.filter((v) => v.ancho < 0.60)
        if (ventanasEstrechas.length > 0) {
            obs.push({
                id: newId(),
                tipo: 'advertencia',
                articulo: 'RNE A.010 Art.30',
                descripcion: `${ventanasEstrechas.length} ventana(s) con ancho menor al recomendado`,
                valor_actual: `${(Math.min(...ventanasEstrechas.map(v => v.ancho)) * 100).toFixed(0)}cm`,
                valor_minimo: '60cm recomendado',
            })
        }
    }

    const errores = obs.filter((o) => o.tipo === 'error').length
    const advertencias = obs.filter((o) => o.tipo === 'advertencia').length

    return {
        observaciones: obs,
        errores,
        advertencias,
        aprobado: errores === 0,
    }
}