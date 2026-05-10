export interface Proyecto {
    id: string
    user_id: string
    nombre: string
    descripcion: string
    datos: DatosPlano
    thumbnail: string
    creado_at: string
    actualizado_at: string
}

export interface DatosPlano {
    ambientes: Ambiente[]
    muros: Muro[]
    puertas: Puerta[]
    ventanas: Ventana[]
    escala: number
    unidad: 'metros'
}

export interface Ambiente {
    id: string
    nombre: string
    x: number
    y: number
    ancho: number
    largo: number
    color?: string
}

export interface Muro {
    id: string
    x1: number
    y1: number
    x2: number
    y2: number
    espesor: number
    // Propiedades arquitectónicas (igual que AutoCAD Architecture)
    altura: number          // altura libre del muro en metros (default 2.80)
    alturaBase: number      // offset desde el piso en metros (default 0)
    material: 'concreto' | 'ladrillo' | 'tabique' | 'drywall'
    layer: string
}

export interface Puerta {
    id: string
    muro_id: string
    x: number
    y: number
    ancho: number
    angulo_apertura: number
    layer: string
}

export interface Ventana {
    id: string
    muro_id: string
    x: number
    y: number
    ancho: number
    angulo: number
    layer: string
}

export interface Escalera {
    id: string
    x1: number
    y1: number
    x2: number
    y2: number
    anchoMuro?: number // ancho de la escalera
    peldaños: number
    paso: number
    contrapaso: number
    layer: string
}

export interface Columna {
    id: string
    x: number
    y: number
    ancho: number
    largo: number
    forma: 'cuadrada' | 'circular'
    radio?: number
    layer: string
}

export interface Cota {
    id: string
    x1: number
    y1: number
    x2: number
    y2: number
    offset: number // Distancia de la línea de cota respecto a los puntos
    valorManual?: number
    layer: string
}

export interface ElementoTexto {
    id: string
    x: number
    y: number
    contenido: string
    fontSize: number
    color: string
    bold?: boolean
    italic?: boolean
    layer: string
}

export interface ElementoArea {
    id: string
    nombre?: string
    puntos: Punto[]
    area: number
    layer: string
}

export interface MensajeChat {
    id: string
    rol: 'usuario' | 'ia'
    contenido: string
    timestamp: Date
}

export interface Usuario {
    id: string
    email: string
    nombre?: string
}
// Punto en el mundo (metros)
export interface Punto {
    x: number
    y: number
}

// Estado del dibujo en progreso
export interface DibujoEnProgreso {
    tipo: 'muro'
    inicio: Punto
    fin: Punto
}
