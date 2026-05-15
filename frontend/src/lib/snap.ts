// Lógica de snap del editor CAD.
// Función pura: dado un punto crudo del cursor + contexto, devuelve el
// punto ajustado y (opcionalmente) qué tipo de snap se activó.

import type { Muro, Punto, Columna, Escalera } from '../types'
import type { Herramienta, SnapInfo } from '../store/useEditorStore'

const PX_POR_METRO = 100

export interface SnapContexto {
    muros: Muro[]
    columnas: Columna[]
    escaleras: Escalera[]
    herramienta: Herramienta
    zoom: number
    snapSize: number
    snapActivo: boolean
    orthoActivo: boolean
    puntoInicio: Punto | null      // si está dibujando, el primer punto
    shiftActivo?: boolean          // Shift presionado: libera el ortho automático
    dibujando?: boolean            // hay un dibujo en progreso (puntoInicio fijado)
}

export interface SnapResultado {
    punto: Punto
    info: SnapInfo | null
}

// Radio de snap en metros (el equivalente a ~15 px en pantalla al zoom actual)
function radioSnap(zoom: number): number {
    return 15 / (PX_POR_METRO * zoom)
}

// Distancia 2D
function dist(ax: number, ay: number, bx: number, by: number): number {
    return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}

// Proyección de un punto sobre el segmento de un muro. Devuelve null si la
// proyección cae fuera del segmento.
function proyectarEnMuro(
    px: number, py: number, m: Muro,
): { x: number; y: number; t: number } | null {
    const l2 = (m.x2 - m.x1) ** 2 + (m.y2 - m.y1) ** 2
    if (l2 === 0) return null
    let t = ((px - m.x1) * (m.x2 - m.x1) + (py - m.y1) * (m.y2 - m.y1)) / l2
    t = Math.max(0, Math.min(1, t))
    return {
        x: m.x1 + t * (m.x2 - m.x1),
        y: m.y1 + t * (m.y2 - m.y1),
        t,
    }
}

// Intersección de dos segmentos. Devuelve el punto si las prolongaciones se
// cortan dentro de los dos tramos (no exteriores).
function interseccionSegmentos(
    a: Muro, b: Muro,
): { x: number; y: number } | null {
    const ax = a.x2 - a.x1, ay = a.y2 - a.y1
    const bx = b.x2 - b.x1, by = b.y2 - b.y1
    const den = ax * by - ay * bx
    if (Math.abs(den) < 1e-9) return null  // paralelos
    const t = ((b.x1 - a.x1) * by - (b.y1 - a.y1) * bx) / den
    const u = ((b.x1 - a.x1) * ay - (b.y1 - a.y1) * ax) / den
    if (t < 0 || t > 1 || u < 0 || u > 1) return null
    return { x: a.x1 + t * ax, y: a.y1 + t * ay }
}

export function calcularSnap(
    raw: Punto,
    ctx: SnapContexto,
): SnapResultado {
    let mx = raw.x, my = raw.y

    if (!ctx.snapActivo) {
        return aplicarOrtho({ x: mx, y: my }, null, ctx)
    }

    const R = radioSnap(ctx.zoom)
    let mejorInfo: SnapInfo | null = null
    let mejorDist = Infinity

    // 1. ENDPOINTS de muros (prioridad máxima — incluye el "snap a esquina")
    for (const m of ctx.muros) {
        const d1 = dist(mx, my, m.x1, m.y1)
        if (d1 < R && d1 < mejorDist) {
            mejorDist = d1
            mejorInfo = { x: m.x1, y: m.y1, tipo: 'endpoint', label: 'EXT' }
        }
        const d2 = dist(mx, my, m.x2, m.y2)
        if (d2 < R && d2 < mejorDist) {
            mejorDist = d2
            mejorInfo = { x: m.x2, y: m.y2, tipo: 'endpoint', label: 'EXT' }
        }
    }

    // 2. INTERSECCIONES de muros (cruces detectados)
    for (let i = 0; i < ctx.muros.length; i++) {
        for (let j = i + 1; j < ctx.muros.length; j++) {
            const inter = interseccionSegmentos(ctx.muros[i], ctx.muros[j])
            if (!inter) continue
            const d = dist(mx, my, inter.x, inter.y)
            if (d < R && d < mejorDist) {
                mejorDist = d
                mejorInfo = { x: inter.x, y: inter.y, tipo: 'intersection', label: 'INT' }
            }
        }
    }

    // 3. PUNTOS MEDIOS de muros (sólo si no encontramos endpoint/intersección más cerca)
    if (mejorInfo === null || mejorInfo.tipo === 'edge') {
        for (const m of ctx.muros) {
            const midX = (m.x1 + m.x2) / 2
            const midY = (m.y1 + m.y2) / 2
            const d = dist(mx, my, midX, midY)
            if (d < R && d < mejorDist) {
                mejorDist = d
                mejorInfo = { x: midX, y: midY, tipo: 'midpoint', label: 'MED' }
            }
        }
    }

    // 4. CENTROS de columnas / escaleras
    if (mejorInfo === null) {
        for (const c of ctx.columnas) {
            const d = dist(mx, my, c.x, c.y)
            if (d < R && d < mejorDist) {
                mejorDist = d
                mejorInfo = { x: c.x, y: c.y, tipo: 'endpoint', label: 'COL' }
            }
        }
        for (const e of ctx.escaleras) {
            const midX = (e.x1 + e.x2) / 2
            const midY = (e.y1 + e.y2) / 2
            const d = dist(mx, my, midX, midY)
            if (d < R && d < mejorDist) {
                mejorDist = d
                mejorInfo = { x: midX, y: midY, tipo: 'midpoint', label: 'ESC' }
            }
        }
    }

    // 5. ARISTA de muros (proyección perpendicular). Aplica para muro, puerta y ventana
    //    — para muro permite encadenar nuevas paredes sobre una existente, para
    //    puerta/ventana permite insertarlas exactamente sobre el eje del muro.
    if (mejorInfo === null && (ctx.herramienta === 'wall' || ctx.herramienta === 'door' || ctx.herramienta === 'window')) {
        for (const m of ctx.muros) {
            const proj = proyectarEnMuro(mx, my, m)
            if (!proj) continue
            // Ignorar si la proyección cae casi en un extremo (ya cubierto arriba)
            if (proj.t < 0.02 || proj.t > 0.98) continue
            const d = dist(mx, my, proj.x, proj.y)
            if (d < R && d < mejorDist) {
                mejorDist = d
                mejorInfo = { x: proj.x, y: proj.y, tipo: 'edge', label: 'PROY' }
            }
        }
    }

    // 6. GRILLA: si no hubo snap a entidad, redondeamos a la rejilla
    if (mejorInfo) {
        mx = mejorInfo.x
        my = mejorInfo.y
    } else {
        mx = Math.round(mx / ctx.snapSize) * ctx.snapSize
        my = Math.round(my / ctx.snapSize) * ctx.snapSize
        // No emitimos snapInfo para grilla — sería ruido visual constante
    }

    return aplicarOrtho({ x: mx, y: my }, mejorInfo, ctx)
}

// Aplica restricción ortogonal si corresponde.
//
// Reglas:
// • Si Shift está presionado → SIEMPRE se libera el ortho (modo libre temporal).
// • Si la herramienta es "wall" y hay un dibujo en progreso → ortho automático
//   forzando solo 0° / 90° (muros estrictamente horizontales o verticales).
// • Si orthoActivo (F8 manual) → ortho a múltiplos de 45° (cualquier herramienta).
// • Sino → sin restricción.
function aplicarOrtho(
    p: Punto,
    info: SnapInfo | null,
    ctx: SnapContexto,
): SnapResultado {
    if (!ctx.puntoInicio) return { punto: p, info }
    if (ctx.shiftActivo) return { punto: p, info }

    const muroAuto = ctx.herramienta === 'wall' && ctx.dibujando === true
    if (!ctx.orthoActivo && !muroAuto) return { punto: p, info }

    // Granularidad de ángulos
    const step = muroAuto ? 90 : 45

    const dx = p.x - ctx.puntoInicio.x
    const dy = p.y - ctx.puntoInicio.y
    const d = Math.sqrt(dx * dx + dy * dy)
    if (d === 0) return { punto: p, info }

    const angle = Math.atan2(dy, dx) * 180 / Math.PI
    const snapped = Math.round(angle / step) * step
    const rad = snapped * Math.PI / 180

    let mx = ctx.puntoInicio.x + Math.cos(rad) * d
    let my = ctx.puntoInicio.y + Math.sin(rad) * d

    if (ctx.snapActivo) {
        mx = Math.round(mx / ctx.snapSize) * ctx.snapSize
        my = Math.round(my / ctx.snapSize) * ctx.snapSize
    }

    // Mostrar etiqueta del ortho a menos que ya tengamos info de snap a entidad
    const orthoLabel = muroAuto ? `ORTHO ${((snapped % 360 + 360) % 360)}°` : `${snapped}°`
    return {
        punto: { x: mx, y: my },
        info: info ?? { x: mx, y: my, tipo: 'ortho', label: orthoLabel },
    }
}
