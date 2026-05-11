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
    // Propiedades arquitectónicas
    altura: number
    tipo: 'simple' | 'doble' | 'con-aislamiento'
    material: string
    alineacion: 'izquierda' | 'centro' | 'derecha'
    layer: string
}

export interface Puerta {
    id: string
    muro_id: string
    x: number
    y: number
    rotacion: number
    ancho: number
    sentido: 'izquierda' | 'derecha'
    angulo: number
    tipo: 'simple' | 'doble' | 'corredera' | 'vaivén'
    layer: string
}

export interface Ventana {
    id: string
    muro_id: string
    x: number
    y: number
    rotacion: number
    ancho: number
    alto: number
    alfeizar: number
    tipo: 'fija' | 'batiente' | 'corredera' | 'vidrio-piso-techo'
    layer: string
}

export interface Escalera {
    id: string
    x1: number
    y1: number
    x2: number
    y2: number
    ancho: number
    peldaños: number
    paso: number
    contrapaso: number
    direccion: 'sube' | 'baja'
    layer: string
}

export interface Columna {
    id: string
    x: number
    y: number
    forma: 'cuadrada' | 'circular'
    dimension: number
    material: 'concreto' | 'acero' | 'madera'
    layer: string
}

export interface Cota {
    id: string
    x1: number
    y1: number
    x2: number
    y2: number
    offset: number
    valorManual?: number
    tipo: 'lineal' | 'angular' | 'radial' | 'libre'
    mostrarUnidades: boolean
    decimales: 0 | 1 | 2
    estilo: 'RNE' | 'ISO' | 'libre'
    layer: string
}

export interface ElementoTexto {
    id: string
    x: number
    y: number
    contenido: string
    fontSize: number
    color: string
    estilo: 'normal' | 'título' | 'nota'
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
