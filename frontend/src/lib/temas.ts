// Paleta de colores para el editor según el modo visual
// Modo claro → estilo plano arquitectónico profesional (fondo crema, muros negros)
// Modo oscuro → fondo azul oscuro, muros claros, puertas/ventanas con color

export interface Tema {
    // Canvas
    fondoCanvas: string

    // Grilla
    gridSub: string       // líneas de 25cm
    gridMain: string      // líneas de 1m

    // Muros
    muroRelleno: string
    muroBorde: string

    // Puertas
    puerta: string
    puertaSeleccionada: string

    // Ventanas
    ventana: string
    ventanaSeleccionada: string

    // Cotas
    cotaLinea: string
    cotaTexto: string
    cotaTextoBg: string
}

export const TEMA_CLARO: Tema = {
    fondoCanvas: '#f5f0e8',       // crema arquitectónico
    gridSub: '#d4cabb',           // subdivisiones muy suaves
    gridMain: '#b8aa97',          // metro principal, sutil

    muroRelleno: '#1a1a1a',       // negro sólido
    muroBorde: '#1a1a1a',

    puerta: '#2d2d2d',
    puertaSeleccionada: '#1d4ed8',

    ventana: '#2d2d2d',
    ventanaSeleccionada: '#1d4ed8',

    cotaLinea: '#cc0000',
    cotaTexto: '#cc0000',
    cotaTextoBg: '#f5f0e8',
}

export const TEMA_OSCURO: Tema = {
    fondoCanvas: '#0f172a',       // azul muy oscuro
    gridSub: '#1f2937',
    gridMain: '#374151',

    muroRelleno: '#e2e8f0',       // gris claro para contraste
    muroBorde: '#94a3b8',

    puerta: '#fbbf24',            // amarillo
    puertaSeleccionada: '#f59e0b',

    ventana: '#06b6d4',           // cian
    ventanaSeleccionada: '#22d3ee',

    cotaLinea: '#ef4444',
    cotaTexto: '#ef4444',
    cotaTextoBg: '#0d1117',
}
