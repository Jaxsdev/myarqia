// Paleta del editor — Monocromático Editorial.
// Modo oscuro → fondo casi negro, muros y líneas en blanco/gris (estilo blueprint invertido).
// Modo claro → papel técnico, muros negros.
// Sin azul ni morado: puertas/ventanas se diferencian por TONO de gris y patrón de línea,
// como en un plano arquitectónico real. El rojo se reserva solo para cotas.

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
    fondoCanvas: '#fafafa',       // papel técnico, casi blanco
    gridSub: '#e4e4e4',           // subdivisiones muy suaves
    gridMain: '#cccccc',          // metro principal, sutil

    muroRelleno: 'transparent',   // estilo CAD (solo contorno)
    muroBorde: '#0a0a0a',         // muros negros

    puerta: '#404040',            // gris oscuro
    puertaSeleccionada: '#0a0a0a',// negro al seleccionar

    ventana: '#737373',           // gris medio
    ventanaSeleccionada: '#0a0a0a',

    cotaLinea: '#b91c1c',         // rojo técnico (único color funcional)
    cotaTexto: '#b91c1c',
    cotaTextoBg: '#fafafa',
}

export const TEMA_OSCURO: Tema = {
    fondoCanvas: '#0a0a0a',       // negro de app
    gridSub: '#1c1c1c',
    gridMain: '#2e2e2e',

    muroRelleno: 'transparent',   // estilo CAD
    muroBorde: '#f5f5f5',         // muros blancos (blueprint invertido)

    puerta: '#bdbdbd',            // gris claro
    puertaSeleccionada: '#ffffff',// blanco puro al seleccionar

    ventana: '#8c8c8c',           // gris medio
    ventanaSeleccionada: '#ffffff',

    cotaLinea: '#ef5350',         // rojo (único color funcional)
    cotaTexto: '#ef5350',
    cotaTextoBg: '#0a0a0a',
}
