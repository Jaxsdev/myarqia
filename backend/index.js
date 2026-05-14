const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'] }))
app.use(express.json())

app.get('/health', (_, res) => res.json({ ok: true }))

// ── System prompt arquitectónico compartido ────────────────────────────────
const SYSTEM_PROMPT = `Eres ArqIA, arquitecto experto en vivienda latinoamericana de MyARQIA.
Generas distribuciones de planta REALISTAS y FUNCIONALES como un arquitecto real.

RESPONDE ÚNICAMENTE con JSON válido. Sin texto, sin backticks, sin explicaciones.

ESQUEMA EXACTO:
{
  "accion": "generar_planta",
  "mensaje": "descripción breve de lo generado",
  "planta": {
    "ambientes": [
      { "nombre": "Sala", "x": 0, "y": 0, "ancho": 4.50, "largo": 4.75 }
    ],
    "muros": [
      { "x1": 0, "y1": 0, "x2": 4.50, "y2": 0, "espesor": 0.25 }
    ],
    "puertas": [
      { "x": 1.00, "y": 0, "ancho": 0.90, "angulo": 90 }
    ],
    "ventanas": [
      { "x": 0, "y": 1.00, "ancho": 1.20, "angulo": 0 }
    ]
  }
}

═══════════════════════════════════════════════════
REGLAS DE DISTRIBUCIÓN ESPACIAL — LAS MÁS IMPORTANTES
═══════════════════════════════════════════════════

ZONIFICACIÓN OBLIGATORIA (divide la casa en 3 zonas):

ZONA SOCIAL (frontal, y=0 hacia arriba):
  - Sala, comedor, cocina van JUNTOS en la parte delantera
  - La sala siempre tiene vista a la fachada principal (lado y=0)
  - Cocina SIEMPRE adyacente al comedor (comparten muro)
  - Cocina SIEMPRE con ventana al exterior para ventilación
  - Nunca pongas dormitorios en la zona social

ZONA ÍNTIMA (parte posterior, y más alto):
  - Todos los dormitorios van JUNTOS en la zona posterior
  - El baño SIEMPRE entre los dormitorios (acceso desde pasillo)
  - Dormitorio principal con el mayor área
  - Dormitorios con ventana al exterior (fachada norte o lateral)

ZONA DE SERVICIO (lateral o posterior):
  - Lavandería, depósito, cochera van al costado o al fondo
  - Cochera con acceso directo desde el exterior

CIRCULACIÓN OBLIGATORIA:
  - SIEMPRE debe haber un pasillo que conecte zonas (mín. 0.90m)
  - El pasillo va entre zona social e íntima
  - Nunca hay que cruzar un dormitorio para llegar a otro
  - La entrada principal da directamente a la sala (nunca a un dormitorio)
  - El baño NO da directamente a la sala ni al comedor

ADYACENCIAS CORRECTAS (qué debe estar junto a qué):
  Sala ↔ Comedor (pueden ser integrados o separados con vano)
  Comedor ↔ Cocina (siempre juntos, muro compartido)
  Baño ↔ Dormitorios (acceso desde pasillo íntimo)
  Cocina ↔ Lavandería (si existe, van juntos)
  Dormitorio principal ↔ Baño (idealmente acceso directo o muy cercano)

ADYACENCIAS INCORRECTAS (nunca juntar):
  ✗ Baño con Sala o Comedor (sin pasillo entre ellos)
  ✗ Cocina con Dormitorios
  ✗ Entrada principal dando a dormitorio
  ✗ Dormitorios en fachada principal (zona frontal)

═══════════════════════════════════════════════════
REGLAS GEOMÉTRICAS (para que los muros cierren bien)
═══════════════════════════════════════════════════

CRÍTICO — Los muros deben formar rectángulos cerrados:
1. Cada ambiente es un rectángulo: 4 muros que se conectan exactamente
2. Los muros comparten coordenadas en los extremos (no dejar gaps)
3. Muro exterior: espesor 0.25m | Muro interior: espesor 0.15m
4. El origen (0,0) es la esquina inferior izquierda de la fachada
5. Los ambientes NO se superponen — cada m² pertenece a un solo ambiente

PUERTAS — regla de orientación de arco:
  El arco SIEMPRE se abre hacia el INTERIOR del ambiente.
  
  Puerta en muro SUR del ambiente (muro en y=inicio del ambiente):
    angulo = 90  → el arco gira hacia arriba (interior del cuarto)
    x = posicion en ese muro
    y = y_inicio_del_ambiente (sobre el muro sur)
  
  Puerta en muro NORTE del ambiente (muro en y=fin):
    angulo = 270 → el arco gira hacia abajo (interior del cuarto)
    x = posicion en ese muro
    y = y_fin_del_ambiente
  
  Puerta en muro OESTE del ambiente (muro en x=inicio):
    angulo = 0   → el arco gira hacia la derecha (interior del cuarto)
    x = x_inicio_del_ambiente
    y = posicion en ese muro
  
  Puerta en muro ESTE del ambiente (muro en x=fin):
    angulo = 180 → el arco gira hacia la izquierda (interior del cuarto)
    x = x_fin_del_ambiente
    y = posicion en ese muro

  EJEMPLOS CONCRETOS:
    Dormitorio que empieza en y=5.75: su puerta sur va en y=5.75, angulo=90
    Baño con entrada desde pasillo (muro oeste): angulo=0
    Sala con puerta de ingreso en fachada sur (y=0): angulo=90

PASILLO — construcción correcta:
  El pasillo es un ambiente con sus 4 muros propios.
  Sus muros NO comparten coordenadas con el baño.
  Ancho mínimo: 0.90m (recomendado 1.00m)
  El baño tiene su propio rectángulo separado del pasillo.
  Ejemplo:
    Pasillo: x=4.00, y=5.00, ancho=2.00, largo=1.00
    Baño:    x=6.00, y=5.00, ancho=2.00, largo=2.50
    → Son dos rectángulos distintos que comparten el muro x=6.00

VENTANAS OBLIGATORIAS — una por cada ambiente exterior:
  Sala: ventana en fachada SUR (y=0), ancho=1.40m
  Cocina: ventana en fachada ESTE o SUR, ancho=0.80m  
  Dormitorio 1: ventana en fachada NORTE (y=max), ancho=1.20m
  Dormitorio 2: ventana en fachada NORTE (y=max), ancho=1.20m
  Comedor: ventana en fachada SUR o ESTE, ancho=1.00m
  Baño exterior: ventana pequeña 0.60m si tiene muro exterior

═══════════════════════════════════════════════════
REGLAS RNE — DIMENSIONES MÍNIMAS PERU
═══════════════════════════════════════════════════
Sala: mín 12m², lado mínimo 3.00m
Dormitorio simple: mín 8m², lado mínimo 2.50m
Dormitorio doble (principal): mín 10m², lado mínimo 2.70m
Cocina: mín 5m², con ventana exterior obligatoria
Baño completo: mín 2.50m² (1.80m x 1.40m mínimo)
Pasillo: mín 0.90m de ancho
Comedor: mín 8m²
Cochera: 2.50m x 5.00m por auto

Si el usuario pide algo que viola RNE: ajusta al mínimo y agrega campo
"ajuste_rne": "Dormitorio 2 ajustado de 6m2 a 8m2 por RNE A.010 Art.22"

Para preguntas sin solicitud de plano:
{ "accion": "mensaje", "mensaje": "respuesta aquí" }

RESPONDE SIEMPRE EN ESPAÑOL. NUNCA texto fuera del JSON.`

function buildSystemPrompt(sistemaExtra) {
    return sistemaExtra ? `${SYSTEM_PROMPT}\n\nContexto adicional:\n${sistemaExtra}` : SYSTEM_PROMPT
}

// ── Validador de Planta ───────────────────────────────────────────────────
function sesolapan(a, b) {
    return !(a.x + (a.ancho || 0) <= b.x || b.x + (b.ancho || 0) <= a.x ||
        a.y + (a.largo || 0) <= b.y || b.y + (b.largo || 0) <= a.y);
}

function validarPlanta(planta) {
    if (!planta || !planta.ambientes) return { valido: true };
    const errores = [];
    const ambientes = planta.ambientes;

    ambientes.forEach((amb, i) => {
        const area = (amb.ancho || 0) * (amb.largo || 0);
        const nombre = amb.nombre.toLowerCase();

        ambientes.forEach((otro, j) => {
            if (i !== j && sesolapan(amb, otro)) {
                errores.push(`${amb.nombre} se solapa con ${otro.nombre}`);
            }
        });

        if ((nombre.includes('dormitorio') || nombre.includes('habitación')) && area < 9) {
            errores.push(`${amb.nombre}: área ${area.toFixed(2)}m² menor al mínimo habitable de 9m²`);
        }
        if (nombre.includes('pasillo') && Math.min(amb.ancho || 0, amb.largo || 0) < 1.2) {
            errores.push(`${amb.nombre}: ancho menor al mínimo de 1.20m`);
        }
        if (nombre.includes('baño') && area < 3.5) {
            errores.push(`${amb.nombre}: área insuficiente (${area.toFixed(2)}m²) para aparatos sanitarios`);
        }
    });

    return { valido: errores.length === 0, errores };
}

// ── Ruta Claude con Re-intento ─────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
    const { mensajes, sistemaExtra } = req.body
    let historialIntento = [...mensajes]
    let intentos = 0
    const MAX_INTENTOS = 2

    while (intentos <= MAX_INTENTOS) {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model: 'claude-haiku-4-5',
                    max_tokens: 4096,
                    system: buildSystemPrompt(sistemaExtra),
                    messages: historialIntento,
                }),
            })

            const data = await response.json()
            if (!response.ok) return res.status(500).json({ error: data.error?.message || 'Error Claude' })

            const textoRespuesta = data.content[0]?.text || ''

            try {
                const jsonRespuesta = JSON.parse(textoRespuesta)
                if (jsonRespuesta.accion === 'generar_planta') {
                    const validacion = validarPlanta(jsonRespuesta.planta)
                    if (!validacion.valido) {
                        console.log(`Intento ${intentos + 1} fallido:`, validacion.errores)
                        historialIntento.push({ role: 'assistant', content: textoRespuesta })
                        historialIntento.push({
                            role: 'user',
                            content: `ERROR DE DISEÑO DETECTADO. Por favor corrige los siguientes puntos y vuelve a generar el JSON:\n- ${validacion.errores.join('\n- ')}`
                        })
                        intentos++
                        continue
                    }
                }
                return res.json({ respuesta: textoRespuesta })
            } catch (e) {
                return res.json({ respuesta: textoRespuesta })
            }
        } catch (err) {
            console.error(err)
            return res.status(500).json({ error: 'Error interno' })
        }
    }
    res.status(500).json({ error: 'No se pudo generar un plano válido tras varios intentos' })
})

// ── Ruta Gemini con Re-intento ─────────────────────────────────────────────
app.post('/api/chat-gemini', async (req, res) => {
    const { mensajes, sistemaExtra } = req.body
    const GEMINI_KEY = process.env.GEMINI_API_KEY
    let historialIntento = [...mensajes]
    let intentos = 0
    const MAX_INTENTOS = 2

    while (intentos <= MAX_INTENTOS) {
        const contents = historialIntento.map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }))

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        system_instruction: { parts: [{ text: buildSystemPrompt(sistemaExtra) }] },
                        contents,
                        generationConfig: { maxOutputTokens: 4096, temperature: 0.7 }
                    }),
                }
            )

            const data = await response.json()
            if (!response.ok) return res.status(500).json({ error: data.error?.message || 'Error Gemini' })

            const textoRespuesta = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

            try {
                const jsonRespuesta = JSON.parse(textoRespuesta)
                if (jsonRespuesta.accion === 'generar_planta') {
                    const validacion = validarPlanta(jsonRespuesta.planta)
                    if (!validacion.valido) {
                        console.log(`Gemini Intento ${intentos + 1} fallido:`, validacion.errores)
                        historialIntento.push({ role: 'assistant', content: textoRespuesta })
                        historialIntento.push({
                            role: 'user',
                            content: `ERROR: El plano tiene fallos técnicos:\n${validacion.errores.join('\n')}\nCorrige y reenvía el JSON.`
                        })
                        intentos++
                        continue
                    }
                }
                return res.json({ respuesta: textoRespuesta })
            } catch (e) {
                return res.json({ respuesta: textoRespuesta })
            }
        } catch (err) {
            console.error(err)
            return res.status(500).json({ error: 'Error interno' })
        }
    }
    res.status(500).json({ error: 'Gemini no pudo generar un plano válido' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Backend MyARQIA corriendo en puerto ${PORT}`))