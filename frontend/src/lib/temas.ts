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

    muroRelleno: 'transparent',   // Transparente para estilo CAD
    muroBorde: '#1a1a1a',

    puerta: '#f97316',            // naranja
    puertaSeleccionada: '#ea580c',

    ventana: '#fbbf24',           // amarillo
    ventanaSeleccionada: '#f59e0b',

    cotaLinea: '#cc0000',
    cotaTexto: '#cc0000',
    cotaTextoBg: '#f5f0e8',
}

export const TEMA_OSCURO: Tema = {
    fondoCanvas: '#0f172a',       // azul muy oscuro
    gridSub: '#1f2937',
    gridMain: '#374151',

    muroRelleno: 'transparent',   // Transparente para estilo CAD
    muroBorde: '#f1f5f9',         // Blanco/Gris muy claro para líneas CAD

    puerta: '#f97316',            // naranja
    puertaSeleccionada: '#ea580c',

    ventana: '#fbbf24',           // amarillo
    ventanaSeleccionada: '#f59e0b',

    cotaLinea: '#ef4444',
    cotaTexto: '#ef4444',
    cotaTextoBg: '#0d1117',
}
