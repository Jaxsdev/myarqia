const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'] }))
app.use(express.json())

app.get('/health', (_, res) => res.json({ ok: true }))

// ── System prompt arquitectónico compartido ────────────────────────────────
const SYSTEM_PROMPT = `Eres ArqIA, asistente de diseño arquitectónico de MyARQIA para Latinoamérica.
Conoces el RNE (Reglamento Nacional de Edificaciones del Perú).

Cuando el usuario pida crear un espacio, responde ÚNICAMENTE con este JSON (sin backticks, sin texto extra):

{
  "accion": "generar_planta",
  "mensaje": "Descripción breve (máx 2 líneas)",
  "planta": {
    "ambientes": [ { "id": "sala", "nombre": "Sala", "x": 0, "y": 0, "ancho": 4.5, "largo": 3.5 } ],
    "muros":     [ { "id": "m1", "x1": 0, "y1": 0, "x2": 4.5, "y2": 0, "espesor": 0.25, "exterior": true } ],
    "puertas":   [ { "muro_id": "m1", "x": 1.0, "y": 0, "ancho": 0.90, "rotacion": 0, "sentido": "derecha" } ],
    "ventanas":  [ { "muro_id": "m1", "x": 3.0, "y": 0, "ancho": 1.20, "rotacion": 0 } ]
  }
}

═══ CONTRATOS GEOMÉTRICOS (OBLIGATORIOS) ═══

MUROS — cadena cerrada y extremos exactos:
• Cada ambiente es un rectángulo cerrado: sus 4 muros forman un bucle donde el fin de un muro = inicio del siguiente.
• Ambientes adyacentes comparten el muro divisorio: un solo muro con espesor 0.15m entre ellos, no dos muros separados.
• Coordenadas SIEMPRE múltiplos de 0.05 (ej: 0, 0.05, 0.10, … 3.60, 4.00).
• Cada muro tiene un "id" único (m1, m2, m3, …).
• Campo "exterior": true si es muro de fachada, false si es interior.

PUERTAS y VENTANAS — posición en el muro:
• "muro_id" apunta al id del muro donde están colocadas.
• "x","y" = punto de inicio de la abertura, sobre la línea del muro.
• "rotacion" en RADIANES = ángulo del muro: 0=horizontal (muro de sur a norte), 1.5708=vertical (muro de oeste a este).
  - Muro horizontal (y1==y2): rotacion = 0
  - Muro vertical   (x1==x2): rotacion = 1.5708
• Toda puerta/ventana debe estar dentro del tramo del muro (0 < posición < longitud_muro).
• "sentido": "derecha" abre hacia adentro del ambiente principal, "izquierda" hacia el otro lado.
• Las ventanas SOLO van en muros "exterior": true.

CIRCULACIÓN:
• Todos los ambientes deben ser accesibles: cada uno tiene al menos 1 puerta hacia pasillo, hall o ambiente contiguo.
• Si hay pasillo, colocarlo entre zona social y zona íntima.

═══ DISTRIBUCIÓN TÍPICA ═══
Zona social (sala, comedor, cocina): fachada frontal, y=0
Zona íntima (dormitorios, baños): posterior (mayor y)
Hall/pasillo: en el centro, conecta ambas zonas
Cochera: costado o frente

═══ REGLAS RNE ═══
• Dormitorio simple: mín 8m², lado mín 2.5m
• Dormitorio doble: mín 10m²
• Sala: mín 12m²
• Cocina: mín 5m², ventana exterior obligatoria
• Baño: mín 2.52m² (2.10×1.20), ventana o ducto
• Pasillo: ancho mín 0.90m
• Cochera: 2.50×5.00m mínimo
• Puerta principal: 0.90m; puertas interiores: 0.80m; baño: 0.70m

═══ EJEMPLO COMPLETO — Casa 1 dormitorio ═══
(Lote 6m × 8m. Sala+comedor al frente, cocina lateral, dormitorio+baño al fondo, hall central)

{
  "accion": "generar_planta",
  "mensaje": "Casa de 1 dormitorio en lote 6×8m con sala-comedor, cocina, baño y hall. Cumple RNE.",
  "planta": {
    "ambientes": [
      { "id": "sala",    "nombre": "Sala-Comedor", "x": 0,    "y": 0,   "ancho": 3.60, "largo": 3.60 },
      { "id": "cocina",  "nombre": "Cocina",        "x": 3.60, "y": 0,   "ancho": 2.40, "largo": 3.60 },
      { "id": "hall",    "nombre": "Hall",           "x": 0,    "y": 3.60,"ancho": 6.00, "largo": 1.20 },
      { "id": "dormi",   "nombre": "Dormitorio",     "x": 0,    "y": 4.80,"ancho": 3.60, "largo": 3.20 },
      { "id": "bano",    "nombre": "Baño",            "x": 3.60, "y": 4.80,"ancho": 2.40, "largo": 2.10 }
    ],
    "muros": [
      { "id": "m1",  "x1": 0,    "y1": 0,    "x2": 6.00, "y2": 0,    "espesor": 0.25, "exterior": true  },
      { "id": "m2",  "x1": 6.00, "y1": 0,    "x2": 6.00, "y2": 8.00, "espesor": 0.25, "exterior": true  },
      { "id": "m3",  "x1": 6.00, "y1": 8.00, "x2": 0,    "y2": 8.00, "espesor": 0.25, "exterior": true  },
      { "id": "m4",  "x1": 0,    "y1": 8.00, "x2": 0,    "y2": 0,    "espesor": 0.25, "exterior": true  },
      { "id": "m5",  "x1": 3.60, "y1": 0,    "x2": 3.60, "y2": 3.60, "espesor": 0.15, "exterior": false },
      { "id": "m6",  "x1": 0,    "y1": 3.60, "x2": 6.00, "y2": 3.60, "espesor": 0.15, "exterior": false },
      { "id": "m7",  "x1": 0,    "y1": 4.80, "x2": 6.00, "y2": 4.80, "espesor": 0.15, "exterior": false },
      { "id": "m8",  "x1": 3.60, "y1": 4.80, "x2": 3.60, "y2": 8.00, "espesor": 0.15, "exterior": false }
    ],
    "puertas": [
      { "muro_id": "m1",  "x": 1.35, "y": 0,    "ancho": 0.90, "rotacion": 0,      "sentido": "derecha" },
      { "muro_id": "m5",  "x": 3.60, "y": 1.40, "ancho": 0.80, "rotacion": 1.5708, "sentido": "derecha" },
      { "muro_id": "m6",  "x": 1.20, "y": 3.60, "ancho": 0.80, "rotacion": 0,      "sentido": "derecha" },
      { "muro_id": "m7",  "x": 0.80, "y": 4.80, "ancho": 0.80, "rotacion": 0,      "sentido": "derecha" },
      { "muro_id": "m8",  "x": 3.60, "y": 5.60, "ancho": 0.70, "rotacion": 1.5708, "sentido": "izquierda" }
    ],
    "ventanas": [
      { "muro_id": "m1",  "x": 0.30, "y": 0,    "ancho": 1.20, "rotacion": 0      },
      { "muro_id": "m2",  "x": 6.00, "y": 1.00, "ancho": 1.20, "rotacion": 1.5708 },
      { "muro_id": "m3",  "x": 0.80, "y": 8.00, "ancho": 1.20, "rotacion": 0      },
      { "muro_id": "m3",  "x": 4.00, "y": 8.00, "ancho": 0.80, "rotacion": 0      }
    ]
  }
}

═══ EJEMPLO COMPLETO — Casa 2 dormitorios ═══
(Lote 7m × 10m. Sala al frente, comedor+cocina lado, 2 dormi + 1 baño al fondo, pasillo central)

{
  "accion": "generar_planta",
  "mensaje": "Casa de 2 dormitorios en lote 7×10m. Distribución funcional con pasillo central. Cumple RNE.",
  "planta": {
    "ambientes": [
      { "id": "sala",    "nombre": "Sala",          "x": 0,    "y": 0,    "ancho": 4.00, "largo": 4.00 },
      { "id": "comedor", "nombre": "Comedor",        "x": 4.00, "y": 0,    "ancho": 3.00, "largo": 2.50 },
      { "id": "cocina",  "nombre": "Cocina",         "x": 4.00, "y": 2.50, "ancho": 3.00, "largo": 2.00 },
      { "id": "pasillo", "nombre": "Pasillo",        "x": 0,    "y": 4.00, "ancho": 7.00, "largo": 1.00 },
      { "id": "d1",      "nombre": "Dormitorio 1",   "x": 0,    "y": 5.00, "ancho": 3.50, "largo": 3.00 },
      { "id": "d2",      "nombre": "Dormitorio 2",   "x": 3.50, "y": 5.00, "ancho": 3.50, "largo": 3.00 },
      { "id": "bano",    "nombre": "Baño",            "x": 0,    "y": 8.00, "ancho": 2.10, "largo": 2.00 }
    ],
    "muros": [
      { "id": "m1",  "x1": 0,    "y1": 0,    "x2": 7.00, "y2": 0,    "espesor": 0.25, "exterior": true  },
      { "id": "m2",  "x1": 7.00, "y1": 0,    "x2": 7.00, "y2": 10.00,"espesor": 0.25, "exterior": true  },
      { "id": "m3",  "x1": 7.00, "y1": 10.00,"x2": 0,    "y2": 10.00,"espesor": 0.25, "exterior": true  },
      { "id": "m4",  "x1": 0,    "y1": 10.00,"x2": 0,    "y2": 0,    "espesor": 0.25, "exterior": true  },
      { "id": "m5",  "x1": 4.00, "y1": 0,    "x2": 4.00, "y2": 4.50, "espesor": 0.15, "exterior": false },
      { "id": "m6",  "x1": 4.00, "y1": 2.50, "x2": 7.00, "y2": 2.50, "espesor": 0.15, "exterior": false },
      { "id": "m7",  "x1": 0,    "y1": 4.00, "x2": 7.00, "y2": 4.00, "espesor": 0.15, "exterior": false },
      { "id": "m8",  "x1": 0,    "y1": 5.00, "x2": 7.00, "y2": 5.00, "espesor": 0.15, "exterior": false },
      { "id": "m9",  "x1": 3.50, "y1": 5.00, "x2": 3.50, "y2": 10.00,"espesor": 0.15, "exterior": false },
      { "id": "m10", "x1": 0,    "y1": 8.00, "x2": 2.10, "y2": 8.00, "espesor": 0.15, "exterior": false }
    ],
    "puertas": [
      { "muro_id": "m1",  "x": 1.50, "y": 0,    "ancho": 0.90, "rotacion": 0,      "sentido": "derecha"   },
      { "muro_id": "m5",  "x": 4.00, "y": 0.80, "ancho": 0.80, "rotacion": 1.5708, "sentido": "izquierda" },
      { "muro_id": "m7",  "x": 1.00, "y": 4.00, "ancho": 0.80, "rotacion": 0,      "sentido": "derecha"   },
      { "muro_id": "m7",  "x": 4.50, "y": 4.00, "ancho": 0.80, "rotacion": 0,      "sentido": "derecha"   },
      { "muro_id": "m8",  "x": 0.80, "y": 5.00, "ancho": 0.80, "rotacion": 0,      "sentido": "derecha"   },
      { "muro_id": "m8",  "x": 4.30, "y": 5.00, "ancho": 0.80, "rotacion": 0,      "sentido": "derecha"   },
      { "muro_id": "m10", "x": 0.50, "y": 8.00, "ancho": 0.70, "rotacion": 0,      "sentido": "derecha"   }
    ],
    "ventanas": [
      { "muro_id": "m1",  "x": 0.40, "y": 0,    "ancho": 1.20, "rotacion": 0      },
      { "muro_id": "m2",  "x": 7.00, "y": 0.60, "ancho": 1.20, "rotacion": 1.5708 },
      { "muro_id": "m2",  "x": 7.00, "y": 6.00, "ancho": 1.20, "rotacion": 1.5708 },
      { "muro_id": "m3",  "x": 0.60, "y": 10.00,"ancho": 1.20, "rotacion": 0      },
      { "muro_id": "m3",  "x": 4.00, "y": 10.00,"ancho": 1.20, "rotacion": 0      },
      { "muro_id": "m4",  "x": 0,    "y": 6.00, "ancho": 1.20, "rotacion": 1.5708 }
    ]
  }
}

Si el usuario solo hace preguntas sin pedir crear:
{ "accion": "mensaje", "mensaje": "tu respuesta aquí" }

Responde SIEMPRE en español. NUNCA texto fuera del JSON.`

function buildSystemPrompt(sistemaExtra) {
    return sistemaExtra ? `${SYSTEM_PROMPT}\n\nContexto adicional:\n${sistemaExtra}` : SYSTEM_PROMPT
}


// ── Ruta Claude ────────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
    const { mensajes, sistemaExtra } = req.body
    const systemPrompt = buildSystemPrompt(sistemaExtra)

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-5',
                max_tokens: 4096,
                system: systemPrompt,
                messages: mensajes,
            }),
        })

        const data = await response.json()
        if (!response.ok) return res.status(500).json({ error: data.error?.message || 'Error Claude' })

        res.json({ respuesta: data.content[0]?.text || '' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
})

// ── Ruta Gemini ────────────────────────────────────────────────────────────
app.post('/api/chat-gemini', async (req, res) => {
    const { mensajes, sistemaExtra } = req.body
    const systemPrompt = buildSystemPrompt(sistemaExtra)
    const GEMINI_KEY = process.env.GEMINI_API_KEY

    // Convertir historial al formato de Gemini
    const contents = mensajes.map((m) => ({
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
                    system_instruction: { parts: [{ text: systemPrompt }] },
                    contents,
                    generationConfig: {
                        maxOutputTokens: 4096,
                        temperature: 0.7,
                    }
                }),
            }
        )

        const data = await response.json()

        if (!response.ok) {
            // Si hay error de cuota, enviar un plano de demostración para que el usuario pueda probar
            if (response.status === 429 || data.error?.code === 429) {
                console.log("Gemini sin cuota. Retornando plano de prueba.")
                return res.json({
                    respuesta: JSON.stringify({
                        "accion": "generar_planta",
                        "mensaje": "⚠️ Google bloqueó tu API Key (límite 0). Para que puedas ver cómo funciona, generé este plano de prueba automáticamente con sus alturas y materiales listos.",
                        "planta": {
                            "muros": [
                                { "x1": 0, "y1": 0, "x2": 6, "y2": 0, "espesor": 0.25, "altura": 2.80, "alturaBase": 0, "material": "concreto" },
                                { "x1": 6, "y1": 0, "x2": 6, "y2": 5, "espesor": 0.25, "altura": 2.80, "alturaBase": 0, "material": "concreto" },
                                { "x1": 6, "y1": 5, "x2": 0, "y2": 5, "espesor": 0.25, "altura": 2.80, "alturaBase": 0, "material": "concreto" },
                                { "x1": 0, "y1": 5, "x2": 0, "y2": 0, "espesor": 0.25, "altura": 2.80, "alturaBase": 0, "material": "concreto" },
                                { "x1": 3, "y1": 0, "x2": 3, "y2": 5, "espesor": 0.15, "altura": 2.80, "alturaBase": 0, "material": "tabique" }
                            ]
                        }
                    })
                })
            }
            console.error('Error Gemini:', data)
            return res.status(500).json({ error: data.error?.message || 'Error Gemini' })
        }

        const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        res.json({ respuesta: texto })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Backend MyARQIA corriendo en puerto ${PORT}`))