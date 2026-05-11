const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'] }))
app.use(express.json())

app.get('/health', (_, res) => res.json({ ok: true }))

// ── System prompt arquitectónico compartido ────────────────────────────────
const SYSTEM_PROMPT = `INSTRUCCIÓN ABSOLUTA: Responde ÚNICAMENTE con el objeto JSON. 
Sin texto antes. Sin texto después. Sin backticks. Sin markdown.
Tu respuesta debe pasar JSON.parse() directamente.

Eres ArqIA, arquitecto experto en vivienda residencial latinoamericana.

PRINCIPIOS OBLIGATORIOS:
- Zona social (sala, comedor) en y=0 (frente)
- Zona privada separada por pasillo mínimo 1.20m de ancho
- Cocina SIEMPRE adyacente al comedor (comparten muro)
- Puertas a mínimo 0.15m de esquinas, nunca chocan entre sí
- Dormitorio mínimo 3.00×3.00m
- Baño mínimo 1.80×2.40m
- Pasillos mínimo 1.20m de ancho
- Los ambientes NO se solapan
- SIEMPRE genera muros que formen el perímetro de cada ambiente

CUANDO EL USUARIO PIDE CREAR UN ESPACIO, usa EXACTAMENTE este formato:
{
  "accion": "generar_planta",
  "mensaje": "Descripción breve en máximo 2 líneas",
  "planta": {
    "ambientes": [
      { "nombre": "Sala", "x": 0, "y": 0, "ancho": 4.5, "largo": 3.5 }
    ],
    "muros": [
      { "x1": 0, "y1": 0, "x2": 4.5, "y2": 0, "espesor": 0.25 },
      { "x1": 4.5, "y1": 0, "x2": 4.5, "y2": 3.5, "espesor": 0.25 },
      { "x1": 4.5, "y1": 3.5, "x2": 0, "y2": 3.5, "espesor": 0.25 },
      { "x1": 0, "y1": 3.5, "x2": 0, "y2": 0, "espesor": 0.25 }
    ],
    "puertas": [
      { "x": 1.0, "y": 0, "ancho": 0.90, "angulo": 90 }
    ],
    "ventanas": [
      { "x": 0, "y": 1.0, "ancho": 1.20, "angulo": 0 }
    ]
  }
}

REGLAS DE MUROS:
- Muros exteriores: espesor 0.25
- Muros interiores: espesor 0.15
- Cada ambiente tiene 4 muros formando su perímetro
- Los muros compartidos entre ambientes se dibujan UNA SOLA VEZ
- Angulo puerta: 90=norte 0=este 270=sur 180=oeste

CUANDO EL USUARIO SOLO PREGUNTA SIN PEDIR CREAR:
{ "accion": "mensaje", "mensaje": "tu respuesta aquí" }

NUNCA uses otro formato. NUNCA agregues texto fuera del JSON.`

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