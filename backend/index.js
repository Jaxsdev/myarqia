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

Cuando el usuario pida crear un espacio, responde ÚNICAMENTE con este JSON exacto sin texto adicional ni backticks:

{
  "accion": "generar_planta",
  "mensaje": "Descripción breve de lo generado (máx 2 líneas)",
  "planta": {
    "ambientes": [
      { "nombre": "Sala", "x": 0, "y": 0, "ancho": 4.5, "largo": 3.5 }
    ],
    "muros": [
      { "x1": 0, "y1": 0, "x2": 4.5, "y2": 0, "espesor": 0.25 }
    ],
    "puertas": [
      { "x": 1.0, "y": 0, "ancho": 0.90, "angulo": 90 }
    ],
    "ventanas": [
      { "x": 0, "y": 1.0, "ancho": 1.20, "angulo": 0 }
    ]
  }
}

REGLAS CRÍTICAS de geometría:
1. Coordenadas desde origen (0,0) esquina inferior izquierda
2. Los ambientes NO se superponen
3. Muros exteriores: espesor 0.25m | Muros interiores: espesor 0.15m
4. Las puertas van en los muros: angulo 90=norte, 0=este, 270=sur, 180=oeste
5. Las ventanas van en muros exteriores con el mismo ángulo del muro
6. SIEMPRE incluir puertas y ventanas en la respuesta

DISTRIBUCIÓN para casas típicas:
- Zona social (sala, comedor, cocina): parte frontal y=0
- Zona íntima (dormitorios, baños): parte posterior
- Cochera: costado o frente

REGLAS RNE obligatorias:
- Dormitorio simple: mín 8m², lado mín 2.5m
- Dormitorio doble: mín 10m²
- Sala: mín 12m²
- Cocina: mín 5m², ventana al exterior obligatoria
- Baño: mín 2.10m x 1.20m
- Pasillo: mín 0.90m ancho
- Cochera: 2.50m x 5.00m mínimo

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