import type { Muro, Puerta, Ventana, Escalera, Columna, Cota, ElementoTexto, ElementoArea, Ambiente } from '../types'
import { obtenerVerticesMuro } from './muros'

// Genera un archivo DXF válido para AutoCAD (formato R12 / AC1009)
// AC1009 es el más compatible — funciona en todas las versiones de AutoCAD
export function generarDXF(
    muros: Muro[],
    puertas: Puerta[],
    ventanas: Ventana[],
    escaleras: Escalera[] = [],
    columnas: Columna[] = [],
    cotas: Cota[] = [],
    textos: ElementoTexto[] = [],
    _areas: ElementoArea[] = [],
    ambientes: Ambiente[] = [],
    _nombreProyecto: string = 'Proyecto'
): string {
    const L: string[] = []
    const push = (...args: (string | number)[]) => args.forEach(a => L.push(String(a)))

    // Calcular extensiones para EXTMIN/EXTMAX
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    const actualizarBounds = (x: number, y: number) => {
        if (x < minX) minX = x; if (y < minY) minY = y
        if (x > maxX) maxX = x; if (y > maxY) maxY = y
    }

    muros.forEach(m => { actualizarBounds(m.x1, m.y1); actualizarBounds(m.x2, m.y2) })
    puertas.forEach(p => actualizarBounds(p.x, p.y))
    ventanas.forEach(v => actualizarBounds(v.x, v.y))
    escaleras.forEach(e => { actualizarBounds(e.x1, e.y1); actualizarBounds(e.x2, e.y2) })
    columnas.forEach(c => actualizarBounds(c.x, c.y))
    cotas.forEach(co => { actualizarBounds(co.x1, co.y1); actualizarBounds(co.x2, co.y2) })
    textos.forEach(t => actualizarBounds(t.x, t.y))
    ambientes.forEach(a => actualizarBounds(a.x, a.y))

    if (!isFinite(minX)) { minX = -10; minY = -10; maxX = 10; maxY = 10 }

    // ── HEADER ────────────────────────────────────────────────────────
    push('0', 'SECTION')
    push('2', 'HEADER')

    push('9', '$ACADVER', '1', 'AC1009')
    push('9', '$INSUNITS', '70', '6')       // 6 = Metros
    push('9', '$MEASUREMENT', '70', '1')    // 1 = Métrico
    push('9', '$LIMMIN', '10', '0.0', '20', '0.0')
    push('9', '$LIMMAX', '10', maxX.toFixed(3), '20', maxY.toFixed(3))
    push('9', '$EXTMIN', '10', minX.toFixed(3), '20', minY.toFixed(3), '30', '0.0')
    push('9', '$EXTMAX', '10', maxX.toFixed(3), '20', maxY.toFixed(3), '30', '0.0')
    push('9', '$LTSCALE', '40', '1.0')
    push('9', '$LUNITS', '70', '2')         // Unidades decimales
    push('9', '$LUPREC', '70', '2')

    push('0', 'ENDSEC')

    // ── TABLES ────────────────────────────────────────────────────────
    push('0', 'SECTION')
    push('2', 'TABLES')

    // LTYPE table
    push('0', 'TABLE', '2', 'LTYPE', '70', '2')
    push('0', 'LTYPE', '2', 'CONTINUOUS', '70', '0', '3', 'Solid line', '72', '65', '73', '0', '40', '0.0')
    push('0', 'LTYPE', '2', 'DASHED',     '70', '0', '3', 'Dashed',     '72', '65', '73', '2', '40', '0.5', '49', '0.25', '49', '-0.25')
    push('0', 'ENDTAB')

    // LAYER table - Colores estándar AutoCAD
    push('0', 'TABLE', '2', 'LAYER', '70', '10')
    const layers = [
        { nombre: 'A-WALL',      color: 7, ltype: 'CONTINUOUS' }, // Blanco/Negro
        { nombre: 'A-DOOR',      color: 2, ltype: 'CONTINUOUS' }, // Amarillo
        { nombre: 'A-WIND',      color: 4, ltype: 'CONTINUOUS' }, // Cian
        { nombre: 'A-STAIR',     color: 6, ltype: 'CONTINUOUS' }, // Magenta
        { nombre: 'A-STRUCT',    color: 1, ltype: 'CONTINUOUS' }, // Rojo (Columnas)
        { nombre: 'A-DIM',       color: 1, ltype: 'CONTINUOUS' }, // Rojo (Cotas)
        { nombre: 'A-TEXT',      color: 3, ltype: 'CONTINUOUS' }, // Verde (Nomenclatura)
        { nombre: 'A-AREA',      color: 8, ltype: 'DASHED' },     // Gris (Líneas de área)
        { nombre: 'A-ANNO-TEXT', color: 3, ltype: 'CONTINUOUS' }, // Verde
    ]
    layers.forEach(({ nombre, color, ltype }) => {
        push('0', 'LAYER', '2', nombre, '70', '0', '62', color, '6', ltype)
    })
    push('0', 'ENDTAB')

    push('0', 'ENDSEC')

    // ── ENTITIES ──────────────────────────────────────────────────────
    push('0', 'SECTION')
    push('2', 'ENTITIES')

    // Muros con Vanos (Huecos para puertas y ventanas)
    muros.forEach((muro) => {
        const hMuro = muro.altura || 2.40
        const dx = muro.x2 - muro.x1
        const dy = muro.y2 - muro.y1
        const largoTotal = Math.sqrt(dx * dx + dy * dy)
        const anguloMuro = Math.atan2(dy, dx)
        const cos = Math.cos(anguloMuro)
        const sin = Math.sin(anguloMuro)

        // Encontrar todas las aperturas en este muro
        const aperturas: { start: number, end: number, hMin: number, hMax: number, tipo: string }[] = []
        
        puertas.filter(p => p.muro_id === muro.id).forEach(p => {
            const d = Math.sqrt((p.x - muro.x1) ** 2 + (p.y - muro.y1) ** 2)
            const w = p.ancho
            aperturas.push({ 
                start: Math.max(0, d - w/2), 
                end: Math.min(largoTotal, d + w/2), 
                hMin: 2.10, // Dintel estándar
                hMax: hMuro,
                tipo: 'puerta' 
            })
        })

        ventanas.filter(v => v.muro_id === muro.id).forEach(v => {
            const d = Math.sqrt((v.x - muro.x1) ** 2 + (v.y - muro.y1) ** 2)
            const w = v.ancho
            const hAlf = v.alfeizar || 1.0
            const hVent = v.alto || 1.2
            
            // Parte inferior (alfeizar)
            aperturas.push({ 
                start: Math.max(0, d - w/2), 
                end: Math.min(largoTotal, d + w/2), 
                hMin: 0, 
                hMax: hAlf,
                tipo: 'ventana-inf'
            })
            // Parte superior (dintel)
            if (hAlf + hVent < hMuro) {
                aperturas.push({ 
                    start: Math.max(0, d - w/2), 
                    end: Math.min(largoTotal, d + w/2), 
                    hMin: hAlf + hVent, 
                    hMax: hMuro,
                    tipo: 'ventana-sup'
                })
            }
        })

        // Dividir el muro en segmentos basados en las aperturas
        const puntosCorte = new Set([0, largoTotal])
        aperturas.forEach(a => { puntosCorte.add(a.start); puntosCorte.add(a.end) })
        const cortesSorted = Array.from(puntosCorte).sort((a, b) => a - b)

        for (let i = 0; i < cortesSorted.length - 1; i++) {
            const sStart = cortesSorted[i]
            const sEnd = cortesSorted[i+1]
            if (sEnd - sStart < 0.001) continue

            const mid = (sStart + sEnd) / 2
            const enApertura = aperturas.filter(a => mid >= a.start && mid <= a.end)

            /**
             * Dibuja un segmento de muro (tramo sólido) en el DXF.
             * @param hMin Elevación base (Z)
             * @param hMax Altura superior (Z)
             * @param layer Capa de AutoCAD
             */
            const dibujarTramo = (hMin: number, hMax: number, layer: string) => {
                // Coordenadas globales de inicio y fin del segmento
                const x1 = muro.x1 + cos * sStart; const y1 = muro.y1 + sin * sStart
                const x2 = muro.x1 + cos * sEnd;   const y2 = muro.y1 + sin * sEnd
                
                // Creamos un muro temporal para calcular los 4 vértices del grosor
                const segmentMuro = { ...muro, x1, y1, x2, y2 }
                const { p1, p2, p3, p4 } = obtenerVerticesMuro(segmentMuro, muros)
                const pts = [p1, p2, p3, p4]

                // Representación como SOLID (relleno 3D compatible con AutoCAD)
                // Usamos códigos 10-13 para X, 20-23 para Y, 30-33 para Z (elevación)
                push('0', 'SOLID', '8', layer)
                push('10', pts[0].x.toFixed(4), '20', pts[0].y.toFixed(4), '30', hMin.toFixed(4))
                push('11', pts[1].x.toFixed(4), '21', pts[1].y.toFixed(4), '31', hMin.toFixed(4))
                push('12', pts[3].x.toFixed(4), '22', pts[3].y.toFixed(4), '32', hMin.toFixed(4))
                push('13', pts[2].x.toFixed(4), '23', pts[2].y.toFixed(4), '33', hMin.toFixed(4))
                push('39', (hMax - hMin).toFixed(4)) // Código 39: Grosor/Altura (Thickness)
                
                // Representación como POLYLINE (contorno para visualización alámbrica)
                push('0', 'POLYLINE', '8', layer, '66', '1', '70', '1', '39', (hMax - hMin).toFixed(4))
                push('10', '0.0', '20', '0.0', '30', hMin.toFixed(4))
                pts.forEach(p => {
                    // Cada vértice de la polilínea con su elevación correspondiente
                    push('0', 'VERTEX', '8', layer, '10', p.x.toFixed(4), '20', p.y.toFixed(4), '30', hMin.toFixed(4))
                })
                push('0', 'SEQEND', '8', layer)
            }

            if (enApertura.length === 0) {
                // Tramo de muro completo
                dibujarTramo(0, hMuro, 'A-WALL')
            } else {
                // Tramos parciales (dinteles y alfeizares)
                enApertura.forEach(a => dibujarTramo(a.hMin, a.hMax, 'A-WALL'))
            }
        }
    })

    // Columnas
    columnas.forEach((col) => {
        const altura = 2.40
        const d = col.dimension / 2
        const pts = col.forma === 'cuadrada' 
            ? [ {x: col.x-d, y: col.y-d}, {x: col.x+d, y: col.y-d}, {x: col.x+d, y: col.y+d}, {x: col.x-d, y: col.y+d} ]
            : null

        if (pts) {
            push('0', 'SOLID', '8', 'A-STRUCT')
            push('39', altura.toFixed(4))
            push('10', pts[0].x.toFixed(4), '20', pts[0].y.toFixed(4), '30', '0.0')
            push('11', pts[1].x.toFixed(4), '21', pts[1].y.toFixed(4), '31', '0.0')
            push('12', pts[3].x.toFixed(4), '22', pts[3].y.toFixed(4), '32', '0.0')
            push('13', pts[2].x.toFixed(4), '23', pts[2].y.toFixed(4), '33', '0.0')
        } else {
            push('0', 'CIRCLE', '8', 'A-STRUCT', '39', altura.toFixed(4))
            push('10', col.x.toFixed(4), '20', col.y.toFixed(4), '30', '0.0')
            push('40', d.toFixed(4))
        }
    })

    // Puertas (Simbología)
    puertas.forEach((puerta) => {
        const ang = puerta.rotacion; const ancho = puerta.ancho
        push('0', 'LINE', '8', 'A-DOOR')
        push('10', puerta.x.toFixed(4), '20', puerta.y.toFixed(4), '30', '0.0')
        push('11', (puerta.x + Math.cos(ang) * ancho).toFixed(4))
        push('21', (puerta.y + Math.sin(ang) * ancho).toFixed(4), '31', '0.0')
        push('0', 'ARC', '8', 'A-DOOR')
        push('10', puerta.x.toFixed(4), '20', puerta.y.toFixed(4), '30', '0.0')
        push('40', ancho.toFixed(4))
        push('50', (ang * 180 / Math.PI).toFixed(2))
        push('51', (ang * 180 / Math.PI + 90).toFixed(2))
    })

    // Ventanas (Marco y Vidrio)
    ventanas.forEach((v) => {
        const cos = Math.cos(v.rotacion); const sin = Math.sin(v.rotacion)
        const w = v.ancho; const g = 0.05
        const nx = -sin * g; const ny = cos * g
        const h = v.alto || 1.20; const alf = v.alfeizar || 1.00

        // Marco y vidrio con elevación Z (usamos tuplas explícitas para evitar errores de inferencia en el IDE)
        const marcoConfig: [number, string][] = [
            [-1, 'A-WIND'], // Línea exterior
            [1, 'A-WIND'],  // Línea interior
            [0, 'A-WIND']   // Eje central (vidrio)
        ];
        
        marcoConfig.forEach(([m, layer]) => {
            push('0', 'LINE', '8', layer)
            // Código 30 y 31: Elevación base de la ventana (Alféizar)
            push('10', (v.x + nx * m).toFixed(4), '20', (v.y + ny * m).toFixed(4), '30', alf.toFixed(4))
            push('11', (v.x + cos * w + nx * m).toFixed(4), '21', (v.y + sin * w + ny * m).toFixed(4), '31', alf.toFixed(4))
            // Código 39: Altura de la ventana (Thickness)
            push('39', h.toFixed(4))
        })
    })

    // Escaleras
    escaleras.forEach((esc) => {
        const dx = esc.x2 - esc.x1
        const dy = esc.y2 - esc.y1
        const ang = Math.atan2(dy, dx)
        const cos = Math.cos(ang); const sin = Math.sin(ang)
        const nx = -sin * (esc.ancho / 2); const ny = cos * (esc.ancho / 2)

        // Laterales
        for (let i of [-1, 1]) {
            push('0', 'LINE', '8', 'A-STAIR')
            push('10', (esc.x1 + nx * i).toFixed(4), '20', (esc.y1 + ny * i).toFixed(4), '30', '0.0')
            push('11', (esc.x2 + nx * i).toFixed(4), '21', (esc.y2 + ny * i).toFixed(4), '31', '0.0')
        }

        // Peldaños
        const numPeldanos = esc.peldaños || 10
        for (let i = 0; i <= numPeldanos; i++) {
            const f = i / numPeldanos
            const px = esc.x1 + dx * f
            const py = esc.y1 + dy * f
            push('0', 'LINE', '8', 'A-STAIR')
            push('10', (px - nx).toFixed(4), '20', (py - ny).toFixed(4), '30', '0.0')
            push('11', (px + nx).toFixed(4), '21', (py + ny).toFixed(4), '31', '0.0')
        }
    })

    // Cotas (Simplificadas como líneas y texto para máxima compatibilidad)
    cotas.forEach((cota) => {
        const dx = cota.x2 - cota.x1
        const dy = cota.y2 - cota.y1
        const dist = Math.sqrt(dx * dx + dy * dy)
        const ang = Math.atan2(dy, dx)
        const nx = -Math.sin(ang); const ny = Math.cos(ang)

        const cx1 = cota.x1 + nx * cota.offset
        const cy1 = cota.y1 + ny * cota.offset
        const cx2 = cota.x2 + nx * cota.offset
        const cy2 = cota.y2 + ny * cota.offset

        // Línea principal
        push('0', 'LINE', '8', 'A-DIM')
        push('10', cx1.toFixed(4), '20', cy1.toFixed(4), '30', '0.0')
        push('11', cx2.toFixed(4), '21', cy2.toFixed(4), '31', '0.0')

        // Líneas de extensión
        push('0', 'LINE', '8', 'A-DIM')
        push('10', cota.x1.toFixed(4), '20', cota.y1.toFixed(4), '30', '0.0')
        push('11', cx1.toFixed(4), '21', cy1.toFixed(4), '31', '0.0')
        push('0', 'LINE', '8', 'A-DIM')
        push('10', cota.x2.toFixed(4), '20', cota.y2.toFixed(4), '30', '0.0')
        push('11', cx2.toFixed(4), '21', cy2.toFixed(4), '31', '0.0')

        // Texto de la cota
        const tx = (cx1 + cx2) / 2 + nx * 0.1
        const ty = (cy1 + cy2) / 2 + ny * 0.1
        push('0', 'TEXT', '8', 'A-DIM')
        push('10', tx.toFixed(4), '20', ty.toFixed(4), '30', '0.0')
        push('40', '0.15') // altura texto
        push('1', dist.toFixed(2))
        push('50', (ang * 180 / Math.PI).toFixed(2))
    })

    // Textos libres
    textos.forEach((txt) => {
        push('0', 'TEXT', '8', 'A-ANNO-TEXT')
        push('10', txt.x.toFixed(4), '20', txt.y.toFixed(4), '30', '0.0')
        push('40', ((txt.fontSize || 12) / 100).toFixed(4))
        push('1', txt.contenido)
    })

    // Ambientes (Nomenclatura y áreas)
    ambientes.forEach((amb) => {
        push('0', 'TEXT', '8', 'A-TEXT')
        push('10', amb.x.toFixed(4), '20', amb.y.toFixed(4), '30', '0.0')
        push('40', '0.20')
        push('1', amb.nombre.toUpperCase())
        
        const area = amb.ancho * amb.largo
        push('0', 'TEXT', '8', 'A-TEXT')
        push('10', amb.x.toFixed(4), '20', (amb.y - 0.25).toFixed(4), '30', '0.0')
        push('40', '0.12')
        push('1', `A: ${area.toFixed(2)} m2`)
    })

    push('0', 'ENDSEC')
    push('0', 'EOF')

    return L.join('\n')
}

// Descarga el archivo DXF
export function descargarDXF(
    muros: Muro[],
    puertas: Puerta[],
    ventanas: Ventana[],
    escaleras: Escalera[],
    columnas: Columna[],
    cotas: Cota[],
    textos: ElementoTexto[],
    areas: ElementoArea[],
    ambientes: Ambiente[],
    nombre: string
) {
    const contenido = generarDXF(muros, puertas, ventanas, escaleras, columnas, cotas, textos, areas, ambientes, nombre)
    const blob = new Blob([contenido], { type: 'application/dxf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${nombre.replace(/\s+/g, '_')}.dxf`
    a.click()
    URL.revokeObjectURL(url)
}