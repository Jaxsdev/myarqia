import type { Muro, Punto } from '../types'

interface Vec2 { x: number; y: number }

function dist(a: Vec2, b: Vec2) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function intersLineas(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): Vec2 | null {
    const dax = a2.x - a1.x, day = a2.y - a1.y
    const dbx = b2.x - b1.x, dby = b2.y - b1.y
    const den = dax * dby - day * dbx
    if (Math.abs(den) < 0.0001) return null
    const t = ((b1.x - a1.x) * dby - (b1.y - a1.y) * dbx) / den
    return { x: a1.x + t * dax, y: a1.y + t * day }
}

export function obtenerVerticesMuro(muro: Muro, todosLosMuros: Muro[]) {
    const { x1, y1, x2, y2, espesor } = muro
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy)
    
    // Protección contra muros sin longitud o extremadamente cortos (evita errores de división por cero y NaN)
    if (len < 0.001) {
        return {
            p1: { x: x1, y: y1 }, p2: { x: x1, y: y1 },
            p3: { x: x1, y: y1 }, p4: { x: x1, y: y1 }
        }
    }

    // Normales para el espesor del muro (perpendicular a la dirección del muro)
    const nx = (-dy / len) * (espesor / 2)
    const ny = (dx / len) * (espesor / 2)

    // Puntos base de las dos caras del muro (cara positiva y cara negativa)
    const cara_pos_a = { x: x1 + nx, y: y1 + ny }
    const cara_pos_b = { x: x2 + nx, y: y2 + ny }
    const cara_neg_a = { x: x1 - nx, y: y1 - ny }
    const cara_neg_b = { x: x2 - nx, y: y2 - ny }

    let p1 = { ...cara_pos_a }
    let p2 = { ...cara_pos_b }
    let p3 = { ...cara_neg_b }
    let p4 = { ...cara_neg_a }

    const UMBRAL = 0.12 // 12cm

    todosLosMuros.forEach(m => {
        if (m.id === muro.id) return
        
        const mdx = m.x2 - m.x1
        const mdy = m.y2 - m.y1
        const mlen = Math.sqrt(mdx * mdx + mdy * mdy)
        const mnx = (-mdy / mlen) * (m.espesor / 2)
        const mny = (mdx / mlen) * (m.espesor / 2)

        const m_pos_a = { x: m.x1 + mnx, y: m.y1 + mny }
        const m_pos_b = { x: m.x2 + mnx, y: m.y2 + mny }
        const m_neg_a = { x: m.x1 - mnx, y: m.y1 - mny }
        const m_neg_b = { x: m.x2 - mnx, y: m.y2 - mny }

        // Conexión en INICIO de muro actual
        if (dist({x: x1, y: y1}, {x: m.x1, y: m.y1}) < UMBRAL || dist({x: x1, y: y1}, {x: m.x2, y: m.y2}) < UMBRAL) {
            const np = intersLineas(cara_pos_a, cara_pos_b, m_pos_a, m_pos_b) || intersLineas(cara_pos_a, cara_pos_b, m_neg_a, m_neg_b)
            const nn = intersLineas(cara_neg_a, cara_neg_b, m_neg_a, m_neg_b) || intersLineas(cara_neg_a, cara_neg_b, m_pos_a, m_pos_b)
            if (np && dist(np, {x: x1, y: y1}) < espesor * 3) p1 = np
            if (nn && dist(nn, {x: x1, y: y1}) < espesor * 3) p4 = nn
        }

        // Conexión en FIN de muro actual
        if (dist({x: x2, y: y2}, {x: m.x1, y: m.y1}) < UMBRAL || dist({x: x2, y: y2}, {x: m.x2, y: m.y2}) < UMBRAL) {
            const np = intersLineas(cara_pos_a, cara_pos_b, m_pos_a, m_pos_b) || intersLineas(cara_pos_a, cara_pos_b, m_neg_a, m_neg_b)
            const nn = intersLineas(cara_neg_a, cara_neg_b, m_neg_a, m_neg_b) || intersLineas(cara_neg_a, cara_neg_b, m_pos_a, m_pos_b)
            if (np && dist(np, {x: x2, y: y2}) < espesor * 3) p2 = np
            if (nn && dist(nn, {x: x2, y: y2}) < espesor * 3) p3 = nn
        }
    })

    return { p1, p2, p3, p4 }
}
