import type { Muro, Puerta, Ventana } from '../types'

// Genera un archivo DXF válido para AutoCAD (formato R12 / AC1009)
// AC1009 es el más compatible — funciona en todas las versiones de AutoCAD
export function generarDXF(
    muros: Muro[],
    puertas: Puerta[],
    ventanas: Ventana[],
    _nombreProyecto: string
): string {
    const L: string[] = []
    const push = (...args: (string | number)[]) => args.forEach(a => L.push(String(a)))

    // Calcular extensiones para EXTMIN/EXTMAX
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    const M2MM = 1000

    const actualizarBounds = (x: number, y: number) => {
        const xmm = x * M2MM; const ymm = y * M2MM
        if (xmm < minX) minX = xmm; if (ymm < minY) minY = ymm
        if (xmm > maxX) maxX = xmm; if (ymm > maxY) maxY = ymm
    }

    muros.forEach(m => {
        actualizarBounds(m.x1, m.y1)
        actualizarBounds(m.x2, m.y2)
    })
    puertas.forEach(p => actualizarBounds(p.x, p.y))
    ventanas.forEach(v => actualizarBounds(v.x, v.y))

    if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 10000; maxY = 10000 }

    // ── HEADER ────────────────────────────────────────────────────────
    push('0', 'SECTION')
    push('2', 'HEADER')

    push('9', '$ACADVER', '1', 'AC1009')
    push('9', '$INSUNITS', '70', '4')       // 4 = milímetros
    push('9', '$MEASUREMENT', '70', '1')    // 1 = métrico
    push('9', '$LIMMIN', '10', '0.0', '20', '0.0')
    push('9', '$LIMMAX', '10', maxX.toFixed(2), '20', maxY.toFixed(2))
    push('9', '$EXTMIN', '10', minX.toFixed(2), '20', minY.toFixed(2), '30', '0.0')
    push('9', '$EXTMAX', '10', maxX.toFixed(2), '20', maxY.toFixed(2), '30', '0.0')
    push('9', '$LTSCALE', '40', '1.0')
    push('9', '$LUNITS', '70', '2')         // unidades decimales
    push('9', '$LUPREC', '70', '2')

    push('0', 'ENDSEC')

    // ── TABLES ────────────────────────────────────────────────────────
    push('0', 'SECTION')
    push('2', 'TABLES')

    // LTYPE table
    push('0', 'TABLE', '2', 'LTYPE', '70', '2')
    push('0', 'LTYPE', '2', 'CONTINUOUS', '70', '0', '3', 'Solid line', '72', '65', '73', '0', '40', '0.0')
    push('0', 'LTYPE', '2', 'DASHED',     '70', '0', '3', 'Dashed',     '72', '65', '73', '2', '40', '0.75', '49', '0.5', '49', '-0.25')
    push('0', 'ENDTAB')

    // LAYER table
    push('0', 'TABLE', '2', 'LAYER', '70', '4')
    const layers = [
        { nombre: 'A-WALL',      color: 7,  ltype: 'CONTINUOUS' },  // blanco
        { nombre: 'A-DOOR',      color: 2,  ltype: 'CONTINUOUS' },  // amarillo
        { nombre: 'A-WIND',      color: 4,  ltype: 'CONTINUOUS' },  // cian
        { nombre: 'A-ANNO-DIMS', color: 1,  ltype: 'CONTINUOUS' },  // rojo
    ]
    layers.forEach(({ nombre, color, ltype }) => {
        push('0', 'LAYER', '2', nombre, '70', '0', '62', color, '6', ltype)
    })
    push('0', 'ENDTAB')

    push('0', 'ENDSEC')

    // ── ENTITIES ──────────────────────────────────────────────────────
    push('0', 'SECTION')
    push('2', 'ENTITIES')

    // Muros → SOLID 3D + POLYLINE cerrada en layer A-WALL
    muros.forEach((muro) => {
        const ep = muro.espesor / 2
        const dx = muro.x2 - muro.x1
        const dy = muro.y2 - muro.y1
        const len = Math.sqrt(dx * dx + dy * dy)
        if (len < 0.01) return

        const nx = (-dy / len) * ep
        const ny = (dx / len) * ep

        const alturaBase = (muro.alturaBase || 0) * M2MM
        const altura = (muro.altura || 2.80) * M2MM

        const pts = [
            { x: (muro.x1 + nx) * M2MM, y: (muro.y1 + ny) * M2MM },
            { x: (muro.x2 + nx) * M2MM, y: (muro.y2 + ny) * M2MM },
            { x: (muro.x2 - nx) * M2MM, y: (muro.y2 - ny) * M2MM },
            { x: (muro.x1 - nx) * M2MM, y: (muro.y1 - ny) * M2MM },
        ]

        // SOLID con altura 3D (base inferior)
        push('0', 'SOLID', '8', 'A-WALL')
        push('38', alturaBase.toFixed(2))   // elevación base
        push('39', altura.toFixed(2))       // extrusión (height)
        push('10', pts[0].x.toFixed(2), '20', pts[0].y.toFixed(2), '30', '0.0')
        push('11', pts[1].x.toFixed(2), '21', pts[1].y.toFixed(2), '31', '0.0')
        push('12', pts[3].x.toFixed(2), '22', pts[3].y.toFixed(2), '32', '0.0')
        push('13', pts[2].x.toFixed(2), '23', pts[2].y.toFixed(2), '33', '0.0')

        // Contorno como POLYLINE cerrada (con altura)
        push('0', 'POLYLINE', '8', 'A-WALL', '66', '1', '70', '1')
        push('38', alturaBase.toFixed(2))
        pts.forEach(p => {
            push('0', 'VERTEX', '8', 'A-WALL', '10', p.x.toFixed(2), '20', p.y.toFixed(2), '30', '0.0')
        })
        push('0', 'SEQEND', '8', 'A-WALL')
    })

    // Puertas → LINE + ARC en layer A-DOOR
    puertas.forEach((puerta) => {
        const ang = puerta.angulo_apertura
        const ancho = puerta.ancho * M2MM
        const cx = puerta.x * M2MM
        const cy = puerta.y * M2MM

        // Hoja de la puerta (LINE)
        push('0', 'LINE', '8', 'A-DOOR')
        push('10', cx.toFixed(2), '20', cy.toFixed(2), '30', '0.0')
        push('11', (cx + Math.cos(ang) * ancho).toFixed(2))
        push('21', (cy + Math.sin(ang) * ancho).toFixed(2), '31', '0.0')

        // Arco de apertura 90° (ARC)
        const angGrados = ang * (180 / Math.PI)
        push('0', 'ARC', '8', 'A-DOOR')
        push('10', cx.toFixed(2), '20', cy.toFixed(2), '30', '0.0')
        push('40', ancho.toFixed(2))
        push('50', angGrados.toFixed(2))
        push('51', (angGrados + 90).toFixed(2))
    })

    // Ventanas → 3 LINEs en layer A-WIND
    ventanas.forEach((ventana) => {
        const ang = ventana.angulo
        const ancho = ventana.ancho * M2MM
        const cx = ventana.x * M2MM
        const cy = ventana.y * M2MM
        const grosor = 0.10 * M2MM

        const cos = Math.cos(ang); const sin = Math.sin(ang)
        const nx = -sin * grosor;  const ny = cos * grosor

        const lineasV = [
            // Exterior
            [cx - nx, cy - ny, cx + cos * ancho - nx, cy + sin * ancho - ny],
            // Centro (vidrio)
            [cx, cy, cx + cos * ancho, cy + sin * ancho],
            // Interior
            [cx + nx, cy + ny, cx + cos * ancho + nx, cy + sin * ancho + ny],
        ]

        lineasV.forEach(([x1, y1, x2, y2]) => {
            push('0', 'LINE', '8', 'A-WIND')
            push('10', x1.toFixed(2), '20', y1.toFixed(2), '30', '0.0')
            push('11', x2.toFixed(2), '21', y2.toFixed(2), '31', '0.0')
        })
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
    nombre: string
) {
    const contenido = generarDXF(muros, puertas, ventanas, nombre)
    const blob = new Blob([contenido], { type: 'application/dxf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${nombre.replace(/\s+/g, '_')}.dxf`
    a.click()
    URL.revokeObjectURL(url)
}