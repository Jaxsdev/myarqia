# MyARQIA — Plan de Trabajo en Equipo para el MVP

> **Objetivo del MVP:** que la IA genere un plano de **una planta**, **bien distribuido**, con **puertas y ventanas correctamente ubicadas**, que se vea limpio en el editor 2D y que cumpla las reglas básicas del RNE.

---

## 1. Visión del MVP

Cuando un usuario escribe en el chat: *"genera una casa de 2 dormitorios en un lote de 7×10m"*, la app debe:

1. Producir un **JSON arquitectónico válido** (muros que cierran, ambientes que no se solapan, circulación accesible).
2. Renderizarlo en el **editor 2D con esquinas limpias** (mitra correcta, gaps en T-junctions cerrados).
3. Mostrar **puertas con su arco de apertura** y **ventanas solo en muros exteriores**.
4. Permitir **guardar el proyecto** en Supabase y **reabrirlo** después.
5. (Plus) Ofrecer una **vista 3D navegable** del resultado.

Lo que NO entra en MVP (queda para v1.1):
- Multi-piso
- Mobiliario
- Exportación a DXF/IFC (la base ya existe en `lib/exportarDXF.ts` pero hay que pulirla)
- Refinamiento conversacional iterativo ("hazme la cocina más grande")
- Colaboración multi-usuario en vivo

---

## 2. Estado actual (al merge del PR #1)

### Lo que ya funciona ✅

| Área | Estado |
|---|---|
| Sistema de muros en 2D | Mitra robusta ante cualquier orientación, T-junctions con gap, snap a extremos/aristas/intersecciones, cota viva al dibujar, ortho automático 90° |
| Motor IA (Claude) | System prompt detallado + validador en backend con re-intento (si el plano viola RNE básico, vuelve a pedirlo a Claude) |
| Detección de ambientes cerrados | Algoritmo de face-traversal en `lib/ambientes.ts` (cuando dibujas 4 muros formando un cuarto, detecta el ambiente y muestra su área) |
| Canvas3D | Render con react-three-fiber, OrbitControls, iluminación, puertas con arco abierto |
| Persistencia | Supabase con la tabla `proyectos` restaurada al esquema original (uuid, user_id, jsonb datos, thumbnail, timestamps + RLS por usuario) |
| Autoguardado | Hook `useGuardadoAutomatico` que persiste cada cambio + thumbnail del canvas |

### Lo que está **a medias** o **frágil** ⚠️

| Área | Problema |
|---|---|
| Gemini API | Key bloqueada → solo Claude funciona. Si Claude se cae, no hay fallback |
| Validador del backend | Solo chequea áreas y solapamientos. No verifica que los muros formen rectángulos cerrados, ni circulación, ni puertas/ventanas en posiciones correctas |
| Post-procesador IA | Asigna `muro_id` por proyección al muro más cercano (radio 50cm). Si la IA pone una puerta lejos, se asocia mal |
| Few-shot examples | Solo 2 ejemplos en el prompt (1 y 2 dormitorios). Faltan: estudio, 3 dorms, con cochera, con lavandería |
| `auto-sanación` (`autoSanarPlano`) | Existe pero no hay docs de qué hace. Hay que entenderla y testearla |
| Canvas3D con mitra nueva | El 3D usa `obtenerVerticesMuro` de `lib/muros.ts` — hay que verificar que los muros se vean alineados como en 2D después del PR #1 |
| Exportar PDF | Hook `useExportarPDF` existe pero solo destructura `areas`. No exporta el plano completo |
| Exportar DXF | `lib/exportarDXF.ts` tiene 264 líneas pero faltan vías de prueba e integración con un botón |
| Verificador RNE en el editor | `useRNEStore` muestra contador de alertas en el ContextBar pero no detalla los errores ni los resalta en el canvas |

### Lo que **falta totalmente** ❌

- Tests automáticos (cero cobertura)
- CI/CD (cada push depende de la voluntad de cada dev)
- Deploy en Vercel/Netlify (la app vive solo en `localhost`)
- Tutorial / onboarding para usuarios nuevos
- Documentación de la API del backend
- Catálogo de plantillas / planos de referencia

---

## 3. Brechas hacia el MVP

Para "generar un plano de una planta bien distribuido" hay que cerrar estas 5 brechas, en orden de prioridad:

| # | Brecha | Por qué importa | Quién la cierra |
|---|--------|-----------------|-----------------|
| 1 | **Calidad del plano que la IA genera** | El MVP entero depende de esto. Si la IA produce basura, ningún editor lo salva | Dev IA + Estudiante Arq |
| 2 | **Validador robusto en backend** | Sin esto, plano malo llega al frontend y el usuario lo ve | Dev IA + Estudiante Arq |
| 3 | **Render limpio en 2D con AI output** | Si las puertas/ventanas salen flotando, el plano "se ve mal" aunque la geometría sea correcta | Dev CAD 2D |
| 4 | **Guardar/reabrir funciona sin error** | Hoy ya funciona post-restauración de BD, pero hay que testearlo a fondo | Dev Persistencia |
| 5 | **Vista 3D del plano generado** | Diferenciador visual fuerte para el demo | Dev 3D |

---

## 4. Equipo y Roles Sugeridos

> Los nombres son provisionales. Asignen según el perfil real de cada persona.

| Rol | Responsable de | Skills | Sugerido |
|-----|----------------|--------|----------|
| **🎯 Tech Lead / Dev IA** | Coordinación + system prompt + backend + integración final | Node, prompt engineering, geometría 2D | Persona 1 |
| **📐 Dev CAD 2D** | Editor de muros, Konva, snap, render de aberturas | React, geometría, atención al detalle | Persona 2 |
| **🎨 Dev 3D / Renderizado** | Canvas3D, three.js, materiales, exportación visual | React, three.js, react-three-fiber | Persona 3 |
| **💾 Dev Full-stack / Persistencia** | Supabase, auth, dashboard, autoguardado, PDF/DXF | Supabase, React, SQL | Persona 4 |
| **🏛️ Arquitecta (estudiante)** | Curación de planos, reglas RNE, QA arquitectónico | AutoCAD/Revit, RNE, criterio arquitectónico | Estudiante |

---

## 5. Tareas por Persona — Sprint 1 (semana 1-2)

> Objetivo del Sprint 1: que un prompt genere un plano que se ve correcto en el 2D, se guarda, se reabre.

### 🎯 Persona 1 — Tech Lead / Dev IA

| Tarea | Descripción | Acceptance criteria | Esfuerzo |
|-------|-------------|---------------------|----------|
| **1.1 Ampliar few-shot del system prompt** | Hoy hay 2 ejemplos (1 y 2 dorms). Agregar: estudio, 3 dorms con cochera, casa con lavandería. Cada uno con muros, puertas, ventanas, ambientes completos | El prompt tiene 5+ ejemplos representativos. La IA genera ese tipo de plano correctamente en pruebas manuales | M (4-6h) |
| **1.2 Validador geométrico fuerte** | Ampliar `validarPlanta` en `backend/index.js`: verificar que cada ambiente esté rodeado por 4+ muros, que extremos de muros coincidan exactamente (tolerancia 0.05m), que puertas/ventanas estén sobre muros existentes, que ventanas solo estén en muros marcados `exterior:true` | Cuando la IA produce un plano malformado, el backend lo rechaza y reintenta con el error específico | L (1-2 días) |
| **1.3 Reactivar Gemini como fallback** | Cuando Claude falle o llegue al límite, caer a Gemini con el mismo prompt. Rotar API key de Gemini si está bloqueada | El selector del chat muestra ambos. Si Claude falla, intenta Gemini automáticamente | S (2h) |
| **1.4 Documentar `autoSanarPlano`** | Leer la función en `usePlanoStore.ts`, entender qué hace, documentarla en comentarios y testearla con planos rotos | El código tiene comentarios claros explicando cada paso del algoritmo + 3 casos de test | M (3h) |

### 📐 Persona 2 — Dev CAD 2D

| Tarea | Descripción | Acceptance criteria | Esfuerzo |
|-------|-------------|---------------------|----------|
| **2.1 Verificar render del output IA** | Tomar 10 planos generados por la IA y revisar visualmente: ¿esquinas cierran? ¿puertas en su muro? ¿ventanas en muros exteriores? Documentar fallas con captura | Reporte con 10 casos, marcando cuáles fallan y por qué | S (3h) |
| **2.2 Handles para editar muros** | Permitir arrastrar el extremo de un muro existente para moverlo (con snap a otros muros). Hoy solo se puede borrar y redibujar | Seleccionar muro → ver puntos de control en sus extremos → arrastrar → snap a extremos cercanos | L (1-2 días) |
| **2.3 Etiqueta de área dinámica por ambiente** | Hoy `CapaAmbientesDetectados` muestra el área. Verificar que se actualiza al editar muros y que la posición de la etiqueta queda en el centroide del polígono | Si muevo un muro y el ambiente cambia de tamaño, la etiqueta refleja el nuevo m² | S (2h) |
| **2.4 Visualizador de errores RNE en canvas** | `useRNEStore` ya cuenta alertas. Agregar capa que dibuje círculos rojos sobre los ambientes que violan RNE (área insuficiente, lado mínimo, etc.) | Al cargar un plano, los ambientes mal dimensionados se ven con highlight rojo y al hover muestra el error | M (4h) |

### 🎨 Persona 3 — Dev 3D / Renderizado

| Tarea | Descripción | Acceptance criteria | Esfuerzo |
|-------|-------------|---------------------|----------|
| **3.1 Verificar Canvas3D con el merge** | Cargar planos del editor 2D y revisar que el 3D muestra todos los muros, puertas, ventanas correctamente | Los 10 casos de la tarea 2.1 también se ven bien en 3D | S (2h) |
| **3.2 Texturas básicas para muros y piso** | Agregar 3 materiales seleccionables: muro pintado (blanco), ladrillo expuesto, drywall. Piso de cerámica genérico | El usuario puede cambiar el material en un selector y el 3D se actualiza | M (4-6h) |
| **3.3 Botón "Exportar imagen 3D"** | Render PNG de la vista 3D actual (alta resolución) | Click → descarga `proyecto-vista3d.png` con resolución 1920×1080 | S (2h) |
| **3.4 Modo "tour": cámara primera persona** | Toggle que cambia OrbitControls por PointerLockControls. WASD + mouse para recorrer | Funciona en el navegador. ESC sale del modo tour | L (1 día) |

### 💾 Persona 4 — Dev Full-stack / Persistencia

| Tarea | Descripción | Acceptance criteria | Esfuerzo |
|-------|-------------|---------------------|----------|
| **4.1 Test E2E de guardado/carga** | Crear proyecto → dibujar muros → recargar → editar → cerrar sesión → reabrir. Verificar que NADA se pierde | Documento con 5 escenarios de prueba marcados ✓ | S (3h) |
| **4.2 Thumbnails en Supabase Storage** | Hoy se guardan como dataURL en columna `thumbnail` (pesado). Migrar a Supabase Storage y guardar solo la URL | Tabla `proyectos.thumbnail` contiene URL corta. La imagen se sirve desde Storage | M (4-6h) |
| **4.3 Botón "Exportar PDF" funcional** | El hook `useExportarPDF` está incompleto. Implementar: tomar el canvas 2D → generar PDF A4 horizontal con membrete, escala y firma | Click → descarga `proyecto-{id}.pdf` con el plano completo | L (1 día) |
| **4.4 Dashboard: filtros y orden** | Hoy lista todos los proyectos. Agregar: buscador por nombre, filtro por fecha, orden ascendente/descendente | UX limpia. Funciona con 50+ proyectos sin lag | M (4h) |

### 🏛️ Estudiante de Arquitectura — Tareas detalladas

> Tu rol es **el más importante** del MVP en términos de calidad. La IA produce JSON, pero **TÚ** defines qué hace que un plano sea "bueno arquitectónicamente".

#### **5.1 Biblioteca de planos golden** (Sprint 1 — prioridad máxima)

Crear 10-15 planos arquitectónicamente correctos en formato **dibujo en papel + foto, O AutoCAD/SketchUp**, que servirán como referencia para entrenar la IA. Cada plano debe incluir:

- Lote (medidas)
- Distribución (con nombres de ambientes)
- Ubicación de puertas (con sentido de apertura)
- Ubicación de ventanas (con su muro exterior)
- Justificación corta de cada decisión (1-2 líneas)

Tipologías a cubrir:
1. **Estudio 30m²** (sala-comedor-cocina integrados + dormitorio + baño)
2. **Casa 1 dorm en lote 6×8m**
3. **Casa 2 dorms en lote 7×10m**
4. **Casa 3 dorms en lote 8×12m**
5. **Casa con cochera (2 dorms + cochera 2.5×5m)**
6. **Casa con lavandería + depósito**
7. **Departamento 2 dorms (planta tipo edificio)**
8. **Vivienda mínima RNE (lote 6×10m)**

**Entregable:** carpeta `docs/planos-referencia/` con cada plano como imagen + ficha en markdown.

#### **5.2 Documento de Reglas RNE estructurado** (Sprint 1)

Hoy en `backend/index.js` hay reglas RNE escritas en texto libre. Reescribirlas en una tabla estructurada que se pueda inyectar en el prompt y/o usar en el validador.

**Formato sugerido:**
```markdown
| Ambiente | Área mínima (m²) | Lado mínimo (m) | Ventana exterior obligatoria | Puerta ancho (m) | Notas RNE |
|----------|------------------|-----------------|------------------------------|------------------|-----------|
| Sala     | 12               | 3.00            | Sí                           | -                | RNE A.010 Art.22 |
| Dorm. simple | 8            | 2.50            | Sí                           | 0.80             | RNE A.010 Art.21 |
| ...      | ...              | ...             | ...                          | ...              | ...       |
```

Cubrir todos los ambientes habituales: sala, comedor, cocina, dormitorio simple, dormitorio doble/principal, baño, baño visita, lavandería, pasillo, hall, cochera, escalera, terraza, depósito.

**Entregable:** `docs/reglas-rne.md`

#### **5.3 Matriz de adyacencias ideales** (Sprint 1)

Tabla 2D que dice qué ambiente debe ir junto a cuál:

```
              | Sala | Comed | Cocina | Hall | Pasillo | Dorm | Baño | Lavand |
Sala          |  --  |  ✓✓   |   ~    |  ✓✓  |   ~     |  ✗   |  ✗   |  ✗     |
Comedor       |  ✓✓  |  --   |  ✓✓✓   |  ✓   |   ~     |  ✗   |  ✗   |  ✗     |
Cocina        |  ~   |  ✓✓✓  |  --    |  ✗   |   ✗     |  ✗   |  ✗   |  ✓✓    |
...
```
- `✓✓✓` = ideal/obligatorio
- `✓` = recomendable
- `~` = aceptable
- `✗` = evitar

**Entregable:** `docs/matriz-adyacencias.md`

#### **5.4 QA de salidas de la IA** (Sprint 1 — continuo)

A medida que Persona 1 ajusta el system prompt, generar 5 planos por iteración y calificar cada uno:

| Criterio | Peso | 1-Malo / 5-Excelente |
|---|---|---|
| Distribución zonal correcta (social/íntima/servicio) | 25% | _ |
| Adyacencias correctas | 20% | _ |
| Circulación clara (todos los ambientes accesibles) | 20% | _ |
| Cumple RNE (áreas, lados mínimos) | 15% | _ |
| Ubicación de puertas (sentido + posición) | 10% | _ |
| Ventanas en muros exteriores | 10% | _ |

**Entregable:** hoja de cálculo o tabla en markdown con ≥30 planos calificados al final del sprint 1.

---

## 6. Tareas por Persona — Sprint 2 (semana 3-4)

> Objetivo del Sprint 2: pulir el MVP y desplegarlo en producción para demo.

### 🎯 Persona 1
- **1.5** Endpoint `/api/refinar` para ajustar un plano existente con un prompt incremental ("haz la cocina más grande")
- **1.6** Logging estructurado en backend (qué prompts vienen, qué responde la IA, validation errors)

### 📐 Persona 2
- **2.5** Cotas RNE automáticas — al guardar, dimensionar cada muro con su valor
- **2.6** Herramienta "trim" (cortar muro al chocar con otro)

### 🎨 Persona 3
- **3.5** Render fotorealista con HDRI environment
- **3.6** Exportar GLB del plano (para llevarlo a Blender, Unity, etc.)

### 💾 Persona 4
- **4.5** Compartir proyecto por link público (solo lectura)
- **4.6** Deploy en Vercel + dominio + variables de entorno seguras

### 🏛️ Estudiante
- **5.5** Biblioteca de mobiliario tipo (cama, sofá, mesa, inodoro) con sus dimensiones para que la IA los pueda colocar después
- **5.6** Glosario arquitectónico para el chat (cuando la IA o el usuario menciona "vano", "alféizar", "antepecho" — qué significa)

---

## 7. Definition of Done (todas las tareas)

Una tarea está terminada cuando:

1. ✅ El código compila sin errores (`npm run build` y `tsc -b`)
2. ✅ Se probó manualmente con al menos 3 casos
3. ✅ Si toca el editor: se probó en 2D **y** 3D
4. ✅ Si toca el backend: se probó con Claude **y** Gemini
5. ✅ Hay un commit claro en una rama nueva (`feat/...`, `fix/...`)
6. ✅ Se abrió un Pull Request con descripción + capturas
7. ✅ Recibió al menos un 👍 de revisión de otro dev

---

## 8. Cómo trabajamos (Git flow)

### Branches
- `main` → producción / demo. Solo recibe merges de PR aprobados.
- `feature/modulo-1-topbar` → rama de integración activa actual. Aquí mergean los devs.
- `feat/<persona>/<tarea-corta>` → cada tarea su rama. Ej: `feat/sofia/biblioteca-planos`.

### Workflow
1. `git checkout feature/modulo-1-topbar && git pull`
2. `git checkout -b feat/<tunombre>/<tarea>`
3. Trabajar, commitear con mensajes claros en español
4. `git push -u origin feat/<tunombre>/<tarea>`
5. `gh pr create --base feature/modulo-1-topbar` (o desde la web)
6. Esperar revisión de otro dev
7. Merge y borrar la rama

### Commits
- En español, imperativo, conciso
- Prefijos: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`
- Ejemplos buenos:
  - `feat(editor): handles para arrastrar extremos de muros`
  - `fix(ia): puerta sin muro_id falla silenciosamente`
  - `docs: añadir matriz de adyacencias`

---

## 9. Reuniones recomendadas

| Reunión | Frecuencia | Duración | Participantes |
|---------|-----------|----------|---------------|
| Daily sync | Diario | 15 min | Todos |
| Demo de planos generados | 2× por semana | 30 min | IA + Arquitecta + quien quiera |
| Revisión de UX/render | Semanal | 45 min | 2D + 3D + Arquitecta |
| Retrospectiva sprint | Cada 2 semanas | 1 hora | Todos |

---

## 10. Comandos comunes (cheatsheet)

```bash
# Levantar todo localmente
cd backend && npm install && npm run dev    # puerto 3001
cd frontend && npm install && npm run dev   # puerto 5173

# Compilar producción
cd frontend && npm run build

# Crear PR rápido
gh pr create --base feature/modulo-1-topbar --title "..." --body "..."

# Ver el plano JSON que generó la IA (curl)
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"mensajes":[{"role":"user","content":"casa de 2 dormitorios"}]}'
```

---

## 11. Variables de entorno (no commitear)

### `backend/.env`
```
PORT=3001
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
```

### `frontend/.env.local`
```
VITE_SUPABASE_URL=https://cpapnhdtsifblkpbfxwl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_BACKEND_URL=http://localhost:3001
```

> ⚠️ Las API keys que estaban en el README inicial deben rotarse — quedaron expuestas en historial git.

---

## 12. Criterios de éxito del MVP (demo final)

El MVP se considera **listo** cuando, en una demo en vivo:

1. ✅ El usuario abre la app, se registra, crea un proyecto
2. ✅ Escribe en el chat: *"casa de 2 dormitorios con cochera"*
3. ✅ En menos de 30 segundos aparece el plano en el editor 2D
4. ✅ Las esquinas de los muros se ven limpias (sin gaps)
5. ✅ Las puertas tienen su arco de apertura visible y están sobre muros
6. ✅ Las ventanas están solo en muros exteriores
7. ✅ Los ambientes muestran su área en m²
8. ✅ El usuario cambia a vista 3D y puede orbitarlo
9. ✅ Guarda el proyecto, cierra el navegador, vuelve a abrir → todo está
10. ✅ Exporta el plano como PDF

Si los 10 puntos se cumplen → **MVP entregado**.

---

*Documento generado el 2026-05-15 — versión 1.0*
*Iterar este documento cada sprint planning.*
