// Detección automática de ambientes cerrados a partir del grafo de muros.
//
// Estrategia: tratamos los muros como aristas de un grafo planar straight-line,
// agrupamos los extremos por proximidad para obtener nodos, y luego enumeramos
// las caras del grafo (face traversal). Cada cara interior es un ambiente.
//
// El algoritmo de face traversal funciona así:
// 1. Cada muro produce 2 aristas dirigidas (una en cada sentido).
// 2. Empezamos en una arista dirigida no visitada y caminamos al siguiente
//    nodo. Ahí elegimos la arista saliente que forme el ángulo "más cerrado"
//    a la izquierda (giro CCW mínimo respecto a la dirección por la que entramos).
// 3. Cuando regresamos a la arista inicial, hemos cerrado una cara.
// 4. La cara externa siempre tiene orientación CW (área negativa por shoelace),
//    así que la descartamos.

import type { Muro, Punto } from '../types'

export interface AmbienteDetectado {
    id: string
    puntos: Punto[]   // vértices del polígono en orden CCW
    area: number      // metros cuadrados
    centroide: Punto  // punto medio del polígono (para colocar etiqueta)
}

interface Nodo { x: number; y: number }
interface AristaDirigida {
    desde: number       // índice del nodo origen
    hasta: number       // índice del nodo destino
    id: number          // id único de la arista dirigida (para marcar visitadas)
}

// Tolerancia para considerar que dos extremos son "el mismo nodo" (5 cm)
const TOL_NODO = 0.05

// Construye el grafo: nodos (vértices únicos) y aristas (no dirigidas).
//
// Punto clave: SUBDIVIDE los muros en las T-junctions. Si el extremo de un
// muro cae sobre el interior de otro, ese otro muro se parte en dos aristas
// en ese punto. Sin esto, los planos con muros largos que se cruzan (típico
// de la salida de la IA) nunca formarían ciclos cerrados detectables.
function construirGrafo(muros: Muro[]) {
    const nodos: Nodo[] = []

    const obtenerOCrearNodo = (x: number, y: number): number => {
        for (let i = 0; i < nodos.length; i++) {
            const dx = nodos[i].x - x
            const dy = nodos[i].y - y
            if (dx * dx + dy * dy < TOL_NODO * TOL_NODO) {
                nodos[i] = {
                    x: (nodos[i].x + x) / 2,
                    y: (nodos[i].y + y) / 2,
                }
                return i
            }
        }
        nodos.push({ x, y })
        return nodos.length - 1
    }

    // Paso 1: registrar todos los extremos como nodos.
    for (const m of muros) {
        obtenerOCrearNodo(m.x1, m.y1)
        obtenerOCrearNodo(m.x2, m.y2)
    }

    // Snapshot de los nodos "extremo" (los que existen antes de subdividir).
    const nodosExtremo = nodos.map((n) => ({ ...n }))

    // Paso 2: por cada muro, hallar qué nodos-extremo caen sobre su interior
    // y subdividirlo en esos puntos. El resultado son las aristas finales.
    const aristas: { a: number; b: number }[] = []

    for (const m of muros) {
        const len2 = (m.x2 - m.x1) ** 2 + (m.y2 - m.y1) ** 2
        if (len2 < TOL_NODO * TOL_NODO) continue   // muro degenerado

        // Lista de cortes a lo largo del muro: parámetro t ∈ [0,1]
        const cortes: { t: number; x: number; y: number }[] = [
            { t: 0, x: m.x1, y: m.y1 },
            { t: 1, x: m.x2, y: m.y2 },
        ]

        for (const n of nodosExtremo) {
            const t = ((n.x - m.x1) * (m.x2 - m.x1) + (n.y - m.y1) * (m.y2 - m.y1)) / len2
            if (t <= 0.001 || t >= 0.999) continue   // ya cubierto por los extremos
            const px = m.x1 + t * (m.x2 - m.x1)
            const py = m.y1 + t * (m.y2 - m.y1)
            const dPerp = Math.sqrt((n.x - px) ** 2 + (n.y - py) ** 2)
            if (dPerp < TOL_NODO) {
                cortes.push({ t, x: n.x, y: n.y })
            }
        }

        // Ordenar por t y crear una arista entre cada par consecutivo
        cortes.sort((a, b) => a.t - b.t)
        for (let i = 0; i < cortes.length - 1; i++) {
            const a = obtenerOCrearNodo(cortes[i].x, cortes[i].y)
            const b = obtenerOCrearNodo(cortes[i + 1].x, cortes[i + 1].y)
            if (a !== b) aristas.push({ a, b })
        }
    }

    return { nodos, aristas }
}

// Devuelve la lista de aristas dirigidas y, por cada nodo, las salientes
// ordenadas por ángulo CCW (atan2 ascendente).
function aristasDirigidas(nodos: Nodo[], aristas: { a: number; b: number }[]) {
    const dirs: AristaDirigida[] = []
    let idCounter = 0
    for (const e of aristas) {
        dirs.push({ desde: e.a, hasta: e.b, id: idCounter++ })
        dirs.push({ desde: e.b, hasta: e.a, id: idCounter++ })
    }

    const salientesPorNodo = new Map<number, AristaDirigida[]>()
    for (let i = 0; i < nodos.length; i++) salientesPorNodo.set(i, [])
    for (const d of dirs) salientesPorNodo.get(d.desde)!.push(d)

    // Ordenar las salientes de cada nodo por ángulo CCW
    salientesPorNodo.forEach((list) => {
        list.sort((a, b) => {
            const angA = Math.atan2(nodos[a.hasta].y - nodos[a.desde].y, nodos[a.hasta].x - nodos[a.desde].x)
            const angB = Math.atan2(nodos[b.hasta].y - nodos[b.desde].y, nodos[b.hasta].x - nodos[b.desde].x)
            return angA - angB
        })
    })

    return { dirs, salientesPorNodo }
}

// Dado que llegamos al nodo `currTo` viniendo de `currFrom`, encuentra la
// siguiente arista dirigida tomando "el giro más cerrado a la derecha"
// (CW mínimo respecto al ángulo inverso) — esto traza caras CCW.
function siguienteEnCara(
    nodos: Nodo[],
    salientes: AristaDirigida[],
    currFrom: number,
    currTo: number,
): AristaDirigida | null {
    if (salientes.length === 0) return null
    // Ángulo inverso (de currTo de regreso a currFrom)
    const angInverso = Math.atan2(nodos[currFrom].y - nodos[currTo].y, nodos[currFrom].x - nodos[currTo].x)

    let mejor: AristaDirigida | null = null
    let mejorDiff = Infinity
    for (const s of salientes) {
        // Saltar la arista inversa: no queremos retroceder por la misma arista
        if (s.hasta === currFrom) continue
        const ang = Math.atan2(nodos[s.hasta].y - nodos[s.desde].y, nodos[s.hasta].x - nodos[s.desde].x)
        // Diferencia angular CW desde angInverso hacia ang en rango (0, 2π]
        let diff = angInverso - ang
        while (diff <= 0) diff += 2 * Math.PI
        while (diff > 2 * Math.PI) diff -= 2 * Math.PI
        if (diff < mejorDiff) {
            mejorDiff = diff
            mejor = s
        }
    }
    if (!mejor) {
        // Sin alternativa válida: regresamos por donde vinimos (dead-end branch)
        // Esto solo pasa si el nodo tiene grado 1, lo que no produce ambientes.
        return salientes.find((s) => s.hasta === currFrom) ?? null
    }
    return mejor
}

// Calcula el área con signo (shoelace). > 0 = orientación CCW, < 0 = CW.
function areaConSigno(puntos: Punto[]): number {
    let a = 0
    for (let i = 0; i < puntos.length; i++) {
        const j = (i + 1) % puntos.length
        a += puntos[i].x * puntos[j].y - puntos[j].x * puntos[i].y
    }
    return a / 2
}

function centroidePoligono(puntos: Punto[]): Punto {
    if (puntos.length === 0) return { x: 0, y: 0 }
    // Centroide simple (promedio de vértices). Suficiente para etiquetas.
    let cx = 0, cy = 0
    for (const p of puntos) { cx += p.x; cy += p.y }
    return { x: cx / puntos.length, y: cy / puntos.length }
}

export function detectarAmbientes(muros: Muro[]): AmbienteDetectado[] {
    if (muros.length < 3) return []

    const { nodos, aristas } = construirGrafo(muros)
    if (aristas.length < 3) return []

    const { dirs, salientesPorNodo } = aristasDirigidas(nodos, aristas)

    const visitadas = new Set<number>()
    const caras: number[][] = []   // cada cara = secuencia de índices de nodo

    for (const inicio of dirs) {
        if (visitadas.has(inicio.id)) continue

        const cara: number[] = []
        let curr: AristaDirigida | null = inicio
        let safety = 0
        const MAX_PASOS = 1000

        while (curr && !visitadas.has(curr.id) && safety < MAX_PASOS) {
            visitadas.add(curr.id)
            cara.push(curr.desde)

            const sigs = salientesPorNodo.get(curr.hasta) || []
            const siguiente = siguienteEnCara(nodos, sigs, curr.desde, curr.hasta)
            if (!siguiente) break
            if (siguiente.id === inicio.id) {
                // Cara cerrada
                cara.push(curr.hasta)
                break
            }
            curr = siguiente
            safety++
        }

        if (cara.length >= 3) caras.push(cara)
    }

    // Convertir caras a ambientes y descartar la externa (CW = área negativa)
    const ambientes: AmbienteDetectado[] = []
    let idCounter = 0
    for (const cara of caras) {
        // Deduplicar primer/último nodo si coinciden
        const idxs = cara[0] === cara[cara.length - 1] ? cara.slice(0, -1) : cara
        if (idxs.length < 3) continue

        const puntos: Punto[] = idxs.map((i) => ({ x: nodos[i].x, y: nodos[i].y }))
        const area = areaConSigno(puntos)
        // Área positiva = orientación CCW = cara interior (ambiente).
        // En coordenadas de pantalla Konva (y hacia abajo) la orientación se invierte,
        // pero internamente trabajamos en coordenadas del mundo donde y crece hacia
        // arriba — entonces caras CCW siguen siendo positivas con shoelace estándar.
        // Como nuestro mundo usa y creciente hacia abajo (Konva-style), el signo se
        // invierte; aceptamos ambos signos y normalizamos.
        if (Math.abs(area) < 0.5) continue  // descartar caras minúsculas (ruido)

        ambientes.push({
            id: `auto-${idCounter++}`,
            puntos,
            area: Math.abs(area),
            centroide: centroidePoligono(puntos),
        })
    }

    // Descartar la cara externa: es la de mayor área que contiene a las demás.
    // Heurística simple: si alguna área es >= suma de las demás * 0.95, es la externa.
    if (ambientes.length > 1) {
        ambientes.sort((a, b) => b.area - a.area)
        const mayor = ambientes[0]
        const sumaResto = ambientes.slice(1).reduce((s, a) => s + a.area, 0)
        if (mayor.area >= sumaResto * 0.95) {
            return ambientes.slice(1)
        }
    }

    return ambientes
}
