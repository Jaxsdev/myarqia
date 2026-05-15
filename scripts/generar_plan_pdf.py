"""
Genera el PDF del Plan de Trabajo MVP del equipo MyARQIA.
Salida: docs/PLAN_MVP_EQUIPO.pdf

Versión 3.0:
- Celdas largas usan Paragraph (texto se ajusta y no se desborda).
- Cada tarea tiene priority badge (P0 critico / P1 importante / P2 deseable).
- Nueva seccion "Prioridades" con matriz MoSCoW y ruta critica.
- Mejor visual hierarchy y page breaks.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether,
)
from datetime import date
from pathlib import Path

# ────────────────────────────────────────────────────────────────────
# Paleta
# ────────────────────────────────────────────────────────────────────
AZUL = colors.HexColor("#1e3a8a")
AZUL_CLARO = colors.HexColor("#3b82f6")
AZUL_BG = colors.HexColor("#dbeafe")
GRIS_TXT = colors.HexColor("#1f2937")
GRIS_MEDIO = colors.HexColor("#6b7280")
GRIS_BG = colors.HexColor("#f3f4f6")
AMARILLO = colors.HexColor("#facc15")
VERDE = colors.HexColor("#16a34a")
VERDE_BG = colors.HexColor("#dcfce7")
ROJO = colors.HexColor("#dc2626")
ROJO_BG = colors.HexColor("#fee2e2")
NARANJA = colors.HexColor("#ea580c")
NARANJA_BG = colors.HexColor("#ffedd5")
MORADO = colors.HexColor("#7c3aed")

# ────────────────────────────────────────────────────────────────────
# Estilos
# ────────────────────────────────────────────────────────────────────
base = getSampleStyleSheet()

styles = {
    "Portada_Titulo": ParagraphStyle(
        "Portada_Titulo", parent=base["Title"],
        fontName="Helvetica-Bold", fontSize=46, leading=52,
        textColor=AZUL, alignment=TA_CENTER, spaceAfter=12,
    ),
    "Portada_Sub": ParagraphStyle(
        "Portada_Sub", parent=base["Normal"],
        fontName="Helvetica", fontSize=17, leading=24,
        textColor=GRIS_MEDIO, alignment=TA_CENTER, spaceAfter=24,
    ),
    "H1": ParagraphStyle(
        "H1", parent=base["Heading1"],
        fontName="Helvetica-Bold", fontSize=22, leading=28,
        textColor=AZUL, spaceBefore=18, spaceAfter=10,
    ),
    "H2": ParagraphStyle(
        "H2", parent=base["Heading2"],
        fontName="Helvetica-Bold", fontSize=15, leading=20,
        textColor=AZUL_CLARO, spaceBefore=14, spaceAfter=6,
    ),
    "H3": ParagraphStyle(
        "H3", parent=base["Heading3"],
        fontName="Helvetica-Bold", fontSize=12, leading=16,
        textColor=GRIS_TXT, spaceBefore=8, spaceAfter=4,
    ),
    "Body": ParagraphStyle(
        "Body", parent=base["Normal"],
        fontName="Helvetica", fontSize=10, leading=14,
        textColor=GRIS_TXT, alignment=TA_JUSTIFY, spaceAfter=6,
    ),
    "Small": ParagraphStyle(
        "Small", parent=base["Normal"],
        fontName="Helvetica", fontSize=9, leading=12,
        textColor=GRIS_TXT, alignment=TA_JUSTIFY, spaceAfter=3,
    ),
    "Cell": ParagraphStyle(
        "Cell", parent=base["Normal"],
        fontName="Helvetica", fontSize=8.5, leading=11,
        textColor=GRIS_TXT, alignment=TA_LEFT, spaceAfter=0,
    ),
    "CellHeader": ParagraphStyle(
        "CellHeader", parent=base["Normal"],
        fontName="Helvetica-Bold", fontSize=9, leading=12,
        textColor=colors.white, alignment=TA_LEFT, spaceAfter=0,
    ),
    "CellHeaderC": ParagraphStyle(
        "CellHeaderC", parent=base["Normal"],
        fontName="Helvetica-Bold", fontSize=9, leading=12,
        textColor=colors.white, alignment=TA_CENTER, spaceAfter=0,
    ),
    "Mono": ParagraphStyle(
        "Mono", parent=base["Normal"],
        fontName="Courier", fontSize=8.5, leading=11,
        textColor=GRIS_TXT, spaceAfter=4, backColor=GRIS_BG,
        leftIndent=8, rightIndent=8, borderPadding=4,
    ),
    "Lead": ParagraphStyle(
        "Lead", parent=base["Normal"],
        fontName="Helvetica-Oblique", fontSize=11, leading=16,
        textColor=GRIS_MEDIO, alignment=TA_JUSTIFY, spaceAfter=10,
    ),
    "Quote": ParagraphStyle(
        "Quote", parent=base["Normal"],
        fontName="Helvetica-Bold", fontSize=10.5, leading=15,
        textColor=AZUL, alignment=TA_LEFT, spaceAfter=8,
        leftIndent=14, rightIndent=14, borderPadding=10,
        backColor=AZUL_BG,
    ),
    "Footer": ParagraphStyle(
        "Footer", parent=base["Normal"],
        fontName="Helvetica", fontSize=8,
        textColor=GRIS_MEDIO, alignment=TA_CENTER,
    ),
    "Badge": ParagraphStyle(
        "Badge", parent=base["Normal"],
        fontName="Helvetica-Bold", fontSize=9, leading=11,
        textColor=colors.white, alignment=TA_CENTER,
    ),
}


# ────────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────────
def P(text, style="Body"):
    return Paragraph(text, styles[style])


def cell(text, header=False, center=False):
    """Convierte un string en Paragraph para celda de tabla."""
    if header:
        return Paragraph(text, styles["CellHeaderC" if center else "CellHeader"])
    return Paragraph(text, styles["Cell"])


def tabla(data, col_widths, header_color=AZUL, alt=True, header_align="left"):
    """Tabla con celdas auto-wrap. data = lista de listas de strings."""
    # Convertir todas las celdas: header → Paragraph blanco, body → Paragraph normal
    wrapped = []
    for row_idx, row in enumerate(data):
        new_row = []
        for c in row:
            if isinstance(c, str):
                new_row.append(cell(c, header=(row_idx == 0),
                                    center=(header_align == "center")))
            else:
                new_row.append(c)
        wrapped.append(new_row)

    t = Table(wrapped, colWidths=col_widths, repeatRows=1)
    cmd = [
        ("BACKGROUND", (0, 0), (-1, 0), header_color),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING", (0, 1), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#d1d5db")),
    ]
    if alt:
        for i in range(1, len(data)):
            if i % 2 == 0:
                cmd.append(("BACKGROUND", (0, i), (-1, i), GRIS_BG))
    t.setStyle(TableStyle(cmd))
    return t


def prio_badge(prio):
    """Devuelve un Table chiquito que actúa como badge: P0 rojo, P1 amarillo, P2 azul."""
    palette = {
        "P0": (ROJO, "P0 · CRÍTICO"),
        "P1": (NARANJA, "P1 · IMPORTANTE"),
        "P2": (AZUL_CLARO, "P2 · DESEABLE"),
    }
    color, label = palette.get(prio, (GRIS_MEDIO, prio))
    t = Table([[Paragraph(f"<b>{label}</b>", styles["Badge"])]],
              colWidths=[3.4 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return t


def card_tarea(numero, titulo, owner, archivos, descripcion, sub_pasos,
               deliverable, esfuerzo, prioridad="P1", dependencias=None,
               color=AZUL_CLARO):
    """Card de tarea con priority badge y layout limpio."""
    # Header del card: número + título a la izquierda, esfuerzo a la derecha
    header_data = [[
        Paragraph(f'<b><font color="white" size="11">{numero} · {titulo}</font></b>',
                  styles["Body"]),
        Paragraph(f'<b><font color="white" size="9">{esfuerzo}</font></b>',
                  styles["Badge"]),
    ]]
    header = Table(header_data, colWidths=[14 * cm, 3 * cm])
    header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))

    # Fila de meta-info (priority + owner)
    meta_row = Table(
        [[prio_badge(prioridad),
          Paragraph(f"<b>Responsable:</b> {owner}", styles["Small"])]],
        colWidths=[3.6 * cm, 13.4 * cm],
    )
    meta_row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (0, 0), 0),
        ("LEFTPADDING", (1, 0), (1, 0), 10),
    ]))

    # Cuerpo
    body = [meta_row]
    if archivos:
        body.append(P(f"<b>Archivos a tocar:</b> "
                      f"<font face='Courier' size='8.5'>{archivos}</font>",
                      "Small"))
    if dependencias:
        body.append(P(f"<b>Dependencias:</b> {dependencias}", "Small"))
    body.append(Spacer(1, 3))
    body.append(P(f"<b>Descripción:</b> {descripcion}", "Small"))
    body.append(Spacer(1, 3))
    body.append(P("<b>Sub-pasos:</b>", "Small"))
    for i, paso in enumerate(sub_pasos, 1):
        body.append(P(f"&nbsp;&nbsp;<b>{i}.</b> {paso}", "Small"))
    body.append(Spacer(1, 3))
    body.append(P(f"<b>✓ Entregable:</b> {deliverable}", "Small"))

    # Caja completa
    card_data = [[header], [body]]
    card = Table(card_data, colWidths=[17 * cm])
    card.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.8, color),
        ("LEFTPADDING", (0, 1), (0, 1), 12),
        ("RIGHTPADDING", (0, 1), (0, 1), 12),
        ("TOPPADDING", (0, 1), (0, 1), 0),
        ("BOTTOMPADDING", (0, 1), (0, 1), 8),
        ("TOPPADDING", (0, 0), (0, 0), 0),
        ("BOTTOMPADDING", (0, 0), (0, 0), 0),
        ("LEFTPADDING", (0, 0), (0, 0), 0),
        ("RIGHTPADDING", (0, 0), (0, 0), 0),
    ]))
    return KeepTogether([card, Spacer(1, 12)])


# Header/footer
def header_footer(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(GRIS_MEDIO)
        canvas.drawString(2 * cm, A4[1] - 1.3 * cm,
                          "MyARQIA · Plan de Trabajo MVP")
        canvas.drawRightString(A4[0] - 2 * cm, A4[1] - 1.3 * cm,
                               f"Versión 3.0 · {date.today().isoformat()}")
        canvas.setStrokeColor(colors.lightgrey)
        canvas.line(2 * cm, A4[1] - 1.5 * cm, A4[0] - 2 * cm, A4[1] - 1.5 * cm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(GRIS_MEDIO)
    canvas.drawCentredString(A4[0] / 2, 1.2 * cm,
                             f"— Página {doc.page} —")
    canvas.restoreState()


# ────────────────────────────────────────────────────────────────────
# CONTENIDO
# ────────────────────────────────────────────────────────────────────
story = []

# ─── Portada ───
story.append(Spacer(1, 5 * cm))
story.append(P("MyARQIA", "Portada_Titulo"))
story.append(P("Plan de Trabajo en Equipo · MVP", "Portada_Sub"))
story.append(Spacer(1, 1.5 * cm))

equipo_data = [
    ["Rol", "Persona"],
    ["🎯 Tech Lead / Dev IA", "Persona 1"],
    ["📐 Dev CAD 2D", "Persona 2"],
    ["🎨 Dev 3D / Renderizado", "Persona 3"],
    ["💾 Dev Full-stack / Persistencia", "Persona 4"],
    ["🏛️ Arquitecta (estudiante)", "Persona 5"],
]
story.append(tabla(equipo_data, col_widths=[10 * cm, 7 * cm]))
story.append(Spacer(1, 1.5 * cm))

# Versión / metadata
meta = [
    ["Versión", "3.0 (con prioridades + ruta crítica)"],
    ["Fecha", date.today().isoformat()],
    ["Repositorio", "github.com/Jaxsdev/myarqia"],
    ["Rama de integración", "feature/modulo-1-topbar"],
]
story.append(tabla(meta, col_widths=[5 * cm, 12 * cm], header_color=GRIS_MEDIO, alt=False))
story.append(PageBreak())

# ─── Sección 1: Visión del MVP ───
story.append(P("1 · Visión del MVP", "H1"))
story.append(P(
    "Cuando un usuario escribe en el chat <i>\"genera una casa de 2 "
    "dormitorios en un lote de 7×10m\"</i>, la app debe responder en menos "
    "de 30 segundos con un plano arquitectónico válido, renderizado "
    "limpiamente en 2D, con vista 3D opcional, que se pueda guardar y "
    "exportar como PDF.", "Body"))

story.append(P("1.1 · Criterios de aceptación del MVP", "H2"))
story.append(P(
    "El MVP se considera entregado cuando, en una demo en vivo de máximo "
    "10 minutos, los 10 criterios siguientes se cumplen sin tropiezos:",
    "Body"))

criterios = [
    ["#", "Criterio"],
    ["1", "El usuario abre la app, se registra, crea un proyecto."],
    ["2", "Escribe en el chat: <i>\"casa de 2 dormitorios con cochera\"</i>."],
    ["3", "En menos de 30 segundos aparece el plano en el editor 2D."],
    ["4", "Las esquinas de los muros se ven limpias (sin gaps)."],
    ["5", "Las puertas tienen su arco de apertura visible y están sobre muros."],
    ["6", "Las ventanas están solo en muros exteriores."],
    ["7", "Los ambientes muestran su área en m²."],
    ["8", "El usuario cambia a vista 3D y puede orbitarlo con OrbitControls."],
    ["9", "Guarda el proyecto, cierra el navegador, vuelve a abrir → todo está."],
    ["10", "Exporta el plano como PDF."],
]
story.append(tabla(criterios, col_widths=[1 * cm, 16 * cm]))

story.append(Spacer(1, 8))
story.append(P(
    "Si los 10 puntos se cumplen → <b>MVP entregado</b>. Si alguno falla → "
    "es la prioridad #1 antes de cualquier nueva feature.", "Quote"))

story.append(P("1.2 · Fuera de alcance del MVP (queda para v1.1+)", "H2"))
fuera = [
    "Multi-piso (departamentos / casas de varias plantas).",
    "Mobiliario (camas, sofás, cocinas — geometría 3D de muebles).",
    "Exportación a DXF / IFC nativo (la base existe pero no integrada).",
    "Refinamiento conversacional (\"hazme la cocina más grande\").",
    "Colaboración multi-usuario en tiempo real.",
    "Texturas fotorealistas con HDRI environment.",
    "Cálculo automático de presupuesto de obra.",
]
for f in fuera:
    story.append(P(f"• {f}", "Body"))

story.append(PageBreak())

# ─── Sección 2: Estado actual ───
story.append(P("2 · Estado actual del prototipo (auditoría)", "H1"))
story.append(P(
    "Auditoría hecha sobre el commit <font face='Courier'>3979508</font> "
    "de la rama <font face='Courier'>feature/modulo-1-topbar</font>, "
    "después del merge del PR #1 a main.", "Lead"))

story.append(P("2.1 · Lo que ya funciona ✅", "H2"))
funciona = [
    ["Área", "Estado actual"],
    ["Editor 2D · Muros",
     "Mitra robusta ante cualquier orientación. Snap a extremos, puntos "
     "medios, aristas e intersecciones. Cota viva al dibujar. Ortho "
     "automático 90° (Shift libera). T-junctions con gap limpio."],
    ["Motor IA (Claude)",
     "System prompt detallado con contrato geométrico cerrado (IDs de "
     "muro, rotación en radianes, flag exterior). Validador en backend "
     "con re-intento automático si el plano viola RNE básico."],
    ["Detección de ambientes",
     "Algoritmo de face-traversal en <font face='Courier'>lib/ambientes."
     "ts</font>. Cuando se dibujan 4+ muros formando un cuarto cerrado, "
     "lo detecta y muestra el área en m²."],
    ["Canvas 3D",
     "Render con react-three-fiber. OrbitControls, iluminación "
     "(direccional + ambiental), ContactShadows, Environment. Componente "
     "Door3D con hoja abierta a 60°."],
    ["Persistencia",
     "Supabase con la tabla <font face='Courier'>proyectos</font> "
     "restaurada al esquema original: uuid PK, FK a auth.users con ON "
     "DELETE CASCADE, jsonb 'datos', thumbnail, timestamps, RLS por "
     "user_id."],
    ["Autoguardado",
     "Hook <font face='Courier'>useGuardadoAutomatico</font> que "
     "persiste cada cambio con deduplicación por hash. Captura "
     "thumbnail del canvas."],
]
story.append(tabla(funciona, col_widths=[4 * cm, 13 * cm]))

story.append(P("2.2 · Lo que está a medias o frágil ⚠️", "H2"))
medias = [
    ["Área", "Problema concreto"],
    ["Gemini API",
     "API key bloqueada (cuota 0). Solo Claude funciona. Sin fallback."],
    ["Validador backend",
     "Solo chequea áreas y solapamientos. No verifica que muros formen "
     "rectángulos cerrados, ni circulación, ni que puertas y ventanas "
     "estén en posiciones válidas."],
    ["Post-procesador IA",
     "Asigna muro_id por proyección al muro más cercano (radio 50 cm). "
     "Si la IA pone una puerta lejos del muro real, se asocia mal."],
    ["Few-shot examples",
     "Solo 2 ejemplos en el prompt (1 y 2 dorms). Faltan: estudio, "
     "3 dorms, con cochera, con lavandería, departamento."],
    ["autoSanarPlano",
     "Función existe en <font face='Courier'>usePlanoStore.ts</font> "
     "pero sin documentación. Hay que entenderla y testearla."],
    ["Canvas3D con mitra nueva",
     "El 3D usa <font face='Courier'>obtenerVerticesMuro</font> de "
     "<font face='Courier'>lib/muros.ts</font>. Hay que verificar que "
     "los muros se vean alineados como en 2D después del PR #1."],
    ["Exportar PDF",
     "Hook <font face='Courier'>useExportarPDF</font> existe pero "
     "incompleto. No produce PDF útil."],
    ["Exportar DXF",
     "<font face='Courier'>lib/exportarDXF.ts</font> existe (264 líneas) "
     "pero sin botón ni tests."],
    ["Verificador RNE visual",
     "<font face='Courier'>useRNEStore</font> cuenta alertas en el "
     "ContextBar pero no detalla los errores ni los resalta en el "
     "canvas."],
]
story.append(tabla(medias, col_widths=[4 * cm, 13 * cm]))

story.append(P("2.3 · Lo que falta totalmente ❌", "H2"))
faltan = [
    ["Área", "Detalle"],
    ["Tests automáticos",
     "Cero cobertura en frontend y backend."],
    ["CI/CD",
     "Cada push depende de la voluntad de cada dev. Sin checks "
     "automáticos."],
    ["Deploy en producción",
     "La app vive solo en localhost. Vercel/Netlify no configurado."],
    ["Onboarding",
     "Sin tutorial ni guía para usuarios nuevos."],
    ["Docs API backend",
     "Endpoints <font face='Courier'>/api/chat</font> y "
     "<font face='Courier'>/api/chat-gemini</font> sin documentar."],
    ["Catálogo de plantillas",
     "No hay planos de referencia accesibles desde la UI."],
    ["Seguridad de keys",
     "API keys del README inicial quedaron expuestas en historial git."],
]
story.append(tabla(faltan, col_widths=[4 * cm, 13 * cm]))

story.append(PageBreak())

# ─── Sección 3: PRIORIDADES (NUEVA) ───
story.append(P("3 · Prioridades y ruta crítica", "H1"))

story.append(P(
    "Para llegar al MVP en 4 semanas con 5 personas trabajando en "
    "paralelo, hay que priorizar despiadadamente. Usamos el modelo "
    "<b>MoSCoW simplificado</b> con tres niveles:", "Body"))

story.append(P("3.1 · Niveles de prioridad", "H2"))
niveles = [
    ["Nivel", "Significado", "Acción si falta tiempo"],
    ["<font color='#dc2626'><b>P0 · CRÍTICO</b></font>",
     "Sin esto NO hay MVP. Bloquea la demo de aceptación.",
     "<b>Imposible cortar.</b> Se entrega o se posterga el MVP."],
    ["<font color='#ea580c'><b>P1 · IMPORTANTE</b></font>",
     "Mejora significativa de calidad o UX, pero la demo funciona sin esto.",
     "Se entrega solo si hay tiempo después de cerrar todas las P0."],
    ["<font color='#3b82f6'><b>P2 · DESEABLE</b></font>",
     "Wow-factor o pulido. Bueno tenerlo, no esencial.",
     "Se corta sin culpa. Pasa al backlog de v1.1."],
]
story.append(tabla(niveles, col_widths=[3.5 * cm, 7 * cm, 6.5 * cm]))

story.append(P("3.2 · Matriz de prioridades del Sprint 1", "H2"))
story.append(P(
    "Cada tarea del Sprint 1 marcada con su prioridad. La regla es: "
    "<b>no se empieza una P1 hasta que todas las P0 de tu rol estén "
    "avanzadas</b>.", "Body"))

matriz = [
    ["Persona", "P0 · Crítico", "P1 · Importante", "P2 · Deseable"],
    ["🎯 P1 — IA",
     "T1.1 Few-shot prompt\nT1.2 Validador fuerte",
     "T1.3 Gemini fallback",
     "T1.4 Doc autoSanarPlano"],
    ["📐 P2 — CAD 2D",
     "T2.1 QA render IA\nT2.3 Etiqueta área dinámica",
     "T2.4 Visualizador RNE",
     "T2.2 Handles edición muros"],
    ["🎨 P3 — 3D",
     "T3.1 Verificar Canvas3D",
     "T3.2 Texturas básicas\nT3.3 Exportar imagen 3D",
     "T3.4 Modo tour 1ª persona"],
    ["💾 P4 — Persistencia",
     "T4.1 Test E2E guardado\nT4.3 Botón Exportar PDF",
     "T4.2 Thumbnails Storage\nT4.4 Dashboard filtros",
     "—"],
    ["🏛️ P5 — Arquitecta",
     "T5.1 Biblioteca golden\nT5.2 Reglas RNE\nT5.4 QA continuo",
     "T5.3 Matriz adyacencias",
     "—"],
]
story.append(tabla(matriz, col_widths=[3.5 * cm, 5 * cm, 4 * cm, 4.5 * cm]))

story.append(P("3.3 · Ruta crítica (dependencias entre tareas)", "H2"))
story.append(P(
    "Estas dependencias determinan el orden de arranque. Los \"→\" indican "
    "<i>desbloquea</i>:", "Body"))

ruta = [
    ["#", "Cadena de dependencias", "Implicación"],
    ["RC1",
     "T5.1 (Arquitecta dibuja planos golden) → T1.1 (Lead inserta como "
     "few-shot) → T5.4 (QA continuo)",
     "<b>Arrancar T5.1 en día 1.</b> Sin planos golden, la IA no mejora "
     "y QA no tiene baseline."],
    ["RC2",
     "T5.2 (Reglas RNE estructuradas) → T1.2 (Validador fuerte) + T2.4 "
     "(Visualizador RNE en canvas)",
     "Sin RNE estructurado, el validador queda débil y el canvas no "
     "puede marcar errores."],
    ["RC3",
     "T5.3 (Matriz adyacencias) → T1.2 (Validador puede chequear "
     "adyacencias prohibidas como baño-sala)",
     "P5 debe entregar la matriz para que el validador chequee \"baño "
     "no toca sala\"."],
    ["RC4",
     "T2.1 (QA render IA) bloquea T2.2, T2.3, T2.4",
     "Antes de pulir features 2D, hay que saber qué falla con el output "
     "real."],
    ["RC5",
     "T3.1 (Verificar Canvas3D) bloquea T3.2 y T3.3",
     "Si el 3D no muestra bien los muros mitrados, las texturas y "
     "exports tampoco se verán bien."],
]
story.append(tabla(ruta, col_widths=[1.2 * cm, 8.8 * cm, 7 * cm]))

story.append(P("3.4 · Plan semanal sugerido", "H2"))
semanas = [
    ["Semana", "Foco principal", "Hitos al final"],
    ["1",
     "Arrancar todas las P0 en paralelo. Arquitecta dibuja planos. "
     "Lead documenta validador. CAD 2D hace QA del output actual.",
     "10 planos golden listos. Validador v1 en backend. Reporte de QA "
     "render del estado actual."],
    ["2",
     "Cerrar P0. Iterar prompt con QA scoring. Verificar 3D. Test "
     "guardado/carga.",
     "<b>Demo interna del MVP:</b> prompt → plano 2D limpio → guardar "
     "→ recargar. Todos los criterios MVP 1-9 deben pasar."],
    ["3",
     "Atacar P1: Gemini fallback, RNE visualizer, texturas 3D, "
     "thumbnails storage, dashboard filtros, exportar PDF.",
     "Demo del MVP completo (criterios 1-10) + nice-to-haves "
     "funcionales."],
    ["4",
     "P2 si hay tiempo. Pulido. Deploy en Vercel. Documentación final. "
     "Tutorial básico.",
     "MVP en producción con URL pública. Documentación entregada."],
]
story.append(tabla(semanas, col_widths=[1.5 * cm, 7 * cm, 8.5 * cm]))

story.append(PageBreak())

# ─── Sección 4: Brechas (resumen) ───
story.append(P("4 · 5 brechas priorizadas hacia el MVP", "H1"))
brechas = [
    ["#", "Brecha", "Por qué importa", "Dueño", "Prioridad"],
    ["1", "Calidad del plano que genera la IA",
     "Todo el MVP depende de esto. Si la IA produce basura, ningún "
     "editor lo salva.",
     "P1 + P5",
     "<font color='#dc2626'><b>P0</b></font>"],
    ["2", "Validador robusto en backend",
     "Sin esto, plano malo llega al frontend y el usuario lo ve.",
     "P1 + P5",
     "<font color='#dc2626'><b>P0</b></font>"],
    ["3", "Render limpio en 2D del output IA",
     "Si las puertas o ventanas salen flotando, el plano se ve mal "
     "aunque la geometría sea correcta.",
     "P2",
     "<font color='#dc2626'><b>P0</b></font>"],
    ["4", "Guardar / reabrir sin errores",
     "Hoy funciona post-restauración de BD, pero hay que testearlo a "
     "fondo con casos reales.",
     "P4",
     "<font color='#dc2626'><b>P0</b></font>"],
    ["5", "Vista 3D del plano generado",
     "Diferenciador visual para el demo. Verificar alineación con la "
     "mitra del 2D.",
     "P3",
     "<font color='#ea580c'><b>P1</b></font>"],
]
story.append(tabla(brechas, col_widths=[0.8 * cm, 4 * cm, 6.5 * cm, 1.7 * cm, 2 * cm]))

story.append(PageBreak())

# ─── Sección 5: Roles ───
story.append(P("5 · Equipo y roles", "H1"))
story.append(P(
    "Los nombres son provisionales. Asigne cada rol según el perfil y "
    "preferencia de cada integrante. La tabla resume responsabilidades, "
    "skills mínimas y archivos principales que tocará cada uno.", "Lead"))

roles = [
    ["Rol", "Responsable de", "Skills", "Archivos principales"],
    ["🎯 P1<br/>Tech Lead<br/>IA + Backend",
     "Coordinación. System prompt. Validador. Integración final entre "
     "backend y frontend.",
     "Node.js, prompt engineering, geometría 2D, criterio de producto.",
     "<font face='Courier'>backend/index.js<br/>"
     "frontend/.../PanelChat.tsx</font>"],
    ["📐 P2<br/>Dev CAD 2D",
     "Editor de muros, snap, mitra, render de aberturas, herramientas "
     "de edición (handles, trim, extend).",
     "React, Konva, geometría 2D, atención al detalle pixel-perfect.",
     "<font face='Courier'>CanvasEditor.tsx<br/>"
     "CapaUniones.tsx<br/>ElementoMuro.tsx<br/>lib/snap.ts</font>"],
    ["🎨 P3<br/>Dev 3D",
     "Renderizado Canvas3D, materiales, iluminación, exportación de "
     "imagen/GLB, modo tour 1ª persona.",
     "React, three.js, react-three-fiber, drei, geometría 3D.",
     "<font face='Courier'>Canvas3D.tsx<br/>lib/muros.ts</font>"],
    ["💾 P4<br/>Dev Full-stack<br/>Persistencia",
     "Supabase, auth, dashboard, autoguardado, exportar PDF, thumbnails, "
     "sharing.",
     "React, Supabase (SQL + Storage + RLS), jsPDF.",
     "<font face='Courier'>useGuardadoAutomatico.ts<br/>"
     "useExportarPDF.ts<br/>Dashboard.tsx</font>"],
    ["🏛️ P5<br/>Arquitecta<br/>(estudiante)",
     "Curación de planos golden, reglas RNE estructuradas, matriz de "
     "adyacencias, QA arquitectónico continuo del output de la IA.",
     "AutoCAD o SketchUp, RNE Perú, criterio arquitectónico, planos a "
     "mano alzada con escala.",
     "<font face='Courier'>docs/planos-referencia/<br/>"
     "docs/reglas-rne.md<br/>docs/matriz-adyacencias.md</font>"],
]
story.append(tabla(roles, col_widths=[2.8 * cm, 4.5 * cm, 4.2 * cm, 5.5 * cm]))

story.append(PageBreak())

# ─── Sección 6: Sprint 1 — P1 (IA Lead) ───
story.append(P("6 · Sprint 1 — Tareas detalladas (semanas 1-2)", "H1"))
story.append(P(
    "Objetivo del Sprint 1: cerrar las brechas P0 (#1, #2, #3, #4). Al "
    "final del sprint un prompt en el chat genera un plano que se ve "
    "correcto en 2D, se guarda y se reabre sin perder nada.", "Lead"))

story.append(P("6.1 · 🎯 Persona 1 — Tech Lead / Dev IA", "H2"))
story.append(P(
    "Coordina con la Arquitecta (P5) para los inputs de cada tarea. Es "
    "el puente entre criterio arquitectónico y código.", "Body"))

story.append(card_tarea(
    "T1.1", "Ampliar few-shot del system prompt",
    "Persona 1 (con apoyo de P5)",
    "backend/index.js (constante SYSTEM_PROMPT)",
    "Hoy hay 2 ejemplos completos (casa 1 dorm y 2 dorms). La IA "
    "tiende a imitar lo que ve en ejemplos; necesitamos cubrir 5+ "
    "tipologías para que generalice bien.",
    [
        "Recibir de P5 los 5 planos golden objetivo (T5.1).",
        "Para cada uno, redactar el JSON completo: ambientes, muros "
        "con IDs (m1, m2, ...), puertas con muro_id + rotacion "
        "(radianes) + sentido, ventanas con muro_id + rotacion.",
        "Validar manualmente que las coordenadas son múltiplos de "
        "0.05 y que los muros forman bucles cerrados.",
        "Insertar los 5 ejemplos en SYSTEM_PROMPT bajo el header "
        "═══ EJEMPLO COMPLETO ═══.",
        "Probar cada tipología con curl al endpoint /api/chat: que "
        "la respuesta sea JSON limpio y la IA respete el formato.",
        "Iterar el prompt si la IA confunde alguna tipología.",
    ],
    "backend/index.js actualizado + carpeta docs/qa/sprint1-prompts/ "
    "con 5 capturas del plano generado (una por tipología).",
    "Esfuerzo: M (4-6h)",
    prioridad="P0",
    dependencias="T5.1 de P5 debe estar lista primero",
    color=AZUL,
))

story.append(card_tarea(
    "T1.2", "Validador geométrico fuerte",
    "Persona 1",
    "backend/index.js (función validarPlanta)",
    "El validador actual solo chequea áreas y solapamientos. Hay que "
    "cubrir las invariantes geométricas que el frontend asume.",
    [
        "Función validarMurosCerrados(muros): cada extremo de cada "
        "muro debe coincidir con extremo de otro o estar en el bbox "
        "del lote, con tolerancia 0.05 m.",
        "Función validarPuertasEnMuros(puertas, muros): cada puerta "
        "debe tener distancia perpendicular &lt; 0.10 m a algún muro.",
        "Función validarVentanasExterior(ventanas, muros): cada "
        "ventana debe estar sobre un muro con exterior:true.",
        "Función validarCirculacion(ambientes, puertas): BFS desde "
        "el primer ambiente \"social\" debe alcanzar todos los demás.",
        "Función validarAdyacenciasProhibidas(ambientes, matriz): "
        "rechaza casos como \"baño pegado a sala\" (usa T5.3).",
        "Integrar las 5 funciones en validarPlanta() existente. Si "
        "falla, devolver mensaje claro al loop de re-intento.",
        "Probar con 10 planos buenos (deben pasar) y 10 malformados "
        "manualmente (deben fallar con mensaje correcto).",
    ],
    "validarPlanta() ampliada + archivo backend/tests/casos-validador."
    "json con los 20 casos documentados.",
    "Esfuerzo: L (1-2 días)",
    prioridad="P0",
    dependencias="T5.2 y T5.3 de P5. Bloquea a T5.4 (QA)",
    color=AZUL,
))

story.append(card_tarea(
    "T1.3", "Reactivar Gemini como fallback",
    "Persona 1",
    ".env (backend) + PanelChat.tsx",
    "Hoy Gemini está bloqueado y solo funciona Claude. Si Claude "
    "falla (rate limit, error 5xx), la app no tiene plan B.",
    [
        "Generar nueva GEMINI_API_KEY en aistudio.google.com.",
        "Actualizar backend/.env con la nueva key.",
        "Probar /api/chat-gemini con un prompt sencillo vía curl.",
        "En PanelChat.tsx, envolver el fetch a /api/chat en "
        "try/catch. Si falla, hacer segundo fetch a /api/chat-gemini.",
        "Mostrar al usuario qué modelo respondió (badge en el mensaje).",
    ],
    "Frontend con fallback automático funcionando. Captura del badge "
    "\"Generado con Gemini (fallback)\".",
    "Esfuerzo: S (2h)",
    prioridad="P1",
    color=AZUL,
))

story.append(card_tarea(
    "T1.4", "Documentar y testear autoSanarPlano",
    "Persona 1",
    "frontend/src/store/usePlanoStore.ts",
    "Existe una función autoSanarPlano() que se llama tras dibujar "
    "un muro, pero no hay docs de qué hace. Hay que entenderla, "
    "documentarla y testearla.",
    [
        "Leer la función completa en usePlanoStore.ts.",
        "Identificar cada operación (mover extremos cercanos, fusionar "
        "colineales, etc.).",
        "Escribir JSDoc completo: @description, @example, @returns.",
        "Crear scripts/tests/auto-sanacion/*.mjs con 3 casos: muros "
        "con extremos a 5 cm, muros colineales solapados, esquina "
        "imperfecta.",
        "Verificar que el output de autoSanarPlano es el esperado.",
    ],
    "usePlanoStore.ts con JSDoc completo + 3 archivos .mjs con tests "
    "ejecutables en Node.",
    "Esfuerzo: M (3h)",
    prioridad="P2",
    color=AZUL,
))

story.append(PageBreak())

# ─── 6.2 · Persona 2 ───
story.append(P("6.2 · 📐 Persona 2 — Dev CAD 2D", "H2"))
story.append(P(
    "Trabajas con el output de la IA en el editor 2D. Tu misión: que "
    "el usuario pueda confiar visualmente en lo que ve y editarlo con "
    "precisión.", "Body"))

story.append(card_tarea(
    "T2.1", "Verificar render del output IA",
    "Persona 2 (coordina con P1 y P5)",
    "(solo lectura)",
    "Sanity check antes de cualquier feature nueva: ¿la IA actual "
    "genera planos que se ven bien?",
    [
        "Recibir de P5 los 10 prompts representativos.",
        "Ejecutar cada uno en la app local.",
        "Por cada plano: capturar screenshot + anotar problemas "
        "(esquinas, posición de puertas, ventanas en muros internos, "
        "ambientes sin label).",
        "Para cada problema, identificar si es (a) bug del render 2D, "
        "(b) bug del post-procesador en PanelChat, (c) calidad del "
        "output de la IA.",
        "Reportar a P1 los puntos (c). Trabajar tú los puntos (a) y (b).",
    ],
    "docs/qa-renders/sprint1.md con 10 screenshots anotados y "
    "clasificación de cada problema.",
    "Esfuerzo: S (3h)",
    prioridad="P0",
    color=AZUL_CLARO,
))

story.append(card_tarea(
    "T2.2", "Handles para editar muros existentes",
    "Persona 2",
    "ElementoMuro.tsx, CanvasEditor.tsx, usePlanoStore.ts",
    "Hoy solo se puede borrar y redibujar un muro. Necesitamos "
    "arrastrar los extremos para ajustar dimensiones.",
    [
        "En ElementoMuro.tsx, cuando seleccionado=true, renderizar "
        "dos círculos pequeños en (x1,y1) y (x2,y2).",
        "Cada círculo con su propio onMouseDown que dispare un modo "
        "\"arrastrando extremo\".",
        "En CanvasEditor, en onMouseMove durante ese modo, llamar a "
        "calcularSnap(cursor, ctx) y obtener el punto snapped.",
        "En onMouseUp, llamar a actualizarMuro(id, {x1:..., y1:...}) "
        "o {x2, y2} según qué extremo se movió.",
        "Si el extremo se acerca a extremo de otro muro (UMBRAL = "
        "0.10 m), snap automático.",
        "Guardar el cambio en historial con saveHistory().",
    ],
    "PR con la feature funcional + GIF de 5 s mostrando el arrastre "
    "con snap a otro muro.",
    "Esfuerzo: L (1-2 días)",
    prioridad="P2",
    color=AZUL_CLARO,
))

story.append(card_tarea(
    "T2.3", "Etiqueta de área dinámica por ambiente",
    "Persona 2",
    "CapaAmbientesDetectados.tsx, lib/ambientes.ts",
    "Verificar que la etiqueta se actualiza al editar muros y queda "
    "en el centroide del polígono (no en bounding box).",
    [
        "Confirmar que CapaAmbientesDetectados se re-renderiza cuando "
        "muros cambian (gracias a Zustand).",
        "Calcular el centroide real del polígono (no el centro del "
        "bbox) — usar la fórmula del centroide de polígono.",
        "Formato del label: \"Sala\" en la primera línea, \"12.50 m²\" "
        "en la segunda, fontSize escalado por zoom.",
        "Si el ambiente es muy pequeño (&lt; 4 m²), reducir fontSize "
        "proporcionalmente para que no se desborde.",
    ],
    "PR con el fix + screenshot de un plano con 6 ambientes "
    "etiquetados correctamente.",
    "Esfuerzo: S (2h)",
    prioridad="P0",
    color=AZUL_CLARO,
))

story.append(card_tarea(
    "T2.4", "Visualizador de errores RNE en canvas",
    "Persona 2 (coordina con P5)",
    "useRNEStore.ts, nuevo componente CapaAlertasRNE.tsx",
    "Hoy hay un contador en el ContextBar pero el usuario no sabe "
    "qué ambiente viola la norma ni por qué.",
    [
        "Recibir de P5 las reglas RNE estructuradas (T5.2).",
        "En useRNEStore, agregar alertasPorAmbiente: "
        "Map&lt;id, {regla, msg}[]&gt;.",
        "Función verificarRNE(ambientes, muros, puertas, ventanas) "
        "que aplica las reglas y popula el Map.",
        "Llamar a verificarRNE cada vez que cambian los muros (con "
        "debounce 500 ms).",
        "Componente CapaAlertasRNE: dibuja círculo rojo punteado "
        "alrededor de cada ambiente con alertas.",
        "Al hacer hover sobre el círculo, mostrar tooltip con la "
        "lista de errores.",
    ],
    "PR con feature + screenshot de un plano que viola 3 reglas RNE.",
    "Esfuerzo: M (4h)",
    prioridad="P1",
    dependencias="T5.2 de P5",
    color=AZUL_CLARO,
))

story.append(PageBreak())

# ─── 6.3 · Persona 3 ───
story.append(P("6.3 · 🎨 Persona 3 — Dev 3D / Renderizado", "H2"))
story.append(P(
    "Eres dueño del Canvas3D y de cómo se ve el plano en tres "
    "dimensiones. Tu trabajo determina cuánto impacto visual tiene el "
    "demo del MVP.", "Body"))

story.append(card_tarea(
    "T3.1", "Verificar Canvas3D con la mitra del merge",
    "Persona 3",
    "Canvas3D.tsx, lib/muros.ts (obtenerVerticesMuro)",
    "El merge del PR #1 cambió la geometría de los muros en 2D. Hay "
    "que verificar que el 3D usa la misma mitra y no muestra "
    "desalineaciones.",
    [
        "Generar 5 planos con la IA en 2D (los mismos de T2.1).",
        "Switchear a vista 3D para cada uno.",
        "Verificar: ¿los muros aparecen? ¿están alineados como en 2D? "
        "¿las puertas tienen su arco abierto? ¿las ventanas son "
        "huecos visibles?",
        "Si hay desalineación, comparar la lógica de "
        "obtenerVerticesMuro (lib/muros.ts) con calcularCarasMuro + "
        "ajustarPoligonoMuro (CapaUniones.tsx).",
        "Idealmente: extraer la lógica de mitra a un módulo común "
        "lib/geometriaMuros.ts y consumirla desde ambas (2D y 3D).",
        "Reportar findings y commitear los fixes.",
    ],
    "docs/qa-renders/3d-sprint1.md con comparativa 2D vs 3D para 5 "
    "planos.",
    "Esfuerzo: S (2-3h)",
    prioridad="P0",
    color=NARANJA,
))

story.append(card_tarea(
    "T3.2", "Texturas básicas para muros y piso",
    "Persona 3",
    "Canvas3D.tsx, nueva carpeta public/textures/",
    "Hoy los muros son blanco plano. Para el demo necesitamos al "
    "menos 3 opciones de material visualmente diferenciadas.",
    [
        "Descargar de polyhaven.com 3 texturas seamless (Diffuse + "
        "Normal + Roughness): muro pintado blanco, ladrillo expuesto, "
        "drywall.",
        "Optimizar a 1024×1024 .jpg (&lt; 200 KB c/u).",
        "Colocar en public/textures/{muro-pintado,ladrillo,drywall}/.",
        "Crear hook useTexturaMuro(material) que devuelva las 3 "
        "texturas vía useTexture de drei.",
        "En Canvas3D, aplicar al meshStandardMaterial de cada muro "
        "según muro.material.",
        "Agregar selector en ContextBar para elegir material.",
    ],
    "PR con feature + 3 screenshots (uno por material).",
    "Esfuerzo: M (4-6h)",
    prioridad="P1",
    color=NARANJA,
))

story.append(card_tarea(
    "T3.3", "Botón \"Exportar imagen 3D\"",
    "Persona 3",
    "Canvas3D.tsx, TopBar.tsx",
    "Para que el usuario comparta el render fotográfico de su plano.",
    [
        "Obtener referencia al renderer de three.js vía useThree.",
        "Función exportarVista3D(): llamar gl.toDataURL('image/png') "
        "con render a tamaño 1920×1080.",
        "Crear Blob desde dataURL y descargar con un link "
        "&lt;a download&gt;.",
        "Botón en TopBar \"Exportar 3D\" que dispara la función.",
    ],
    "PR con feature + PNG de muestra de 1920×1080.",
    "Esfuerzo: S (2h)",
    prioridad="P1",
    color=NARANJA,
))

story.append(card_tarea(
    "T3.4", "Modo tour: cámara primera persona",
    "Persona 3",
    "Canvas3D.tsx",
    "Para que el usuario \"camine\" dentro de su plano (killer demo).",
    [
        "Importar PointerLockControls de @react-three/drei.",
        "Agregar toggle \"Modo tour\" en el TopBar (solo visible en "
        "vista 3D).",
        "Cuando activo: cambiar OrbitControls por "
        "PointerLockControls. Click activa el lock.",
        "Agregar movimiento WASD vía useFrame (incrementa position "
        "según direction del controls).",
        "Velocidad ajustable (default 0.05 unidades/frame).",
        "ESC sale del modo tour y vuelve a OrbitControls.",
        "Mostrar un crosshair al centro de la pantalla mientras está "
        "activo.",
    ],
    "PR con feature + video corto del recorrido por una casa.",
    "Esfuerzo: L (1 día)",
    prioridad="P2",
    color=NARANJA,
))

story.append(PageBreak())

# ─── 6.4 · Persona 4 ───
story.append(P("6.4 · 💾 Persona 4 — Dev Full-stack / Persistencia", "H2"))
story.append(P(
    "Te encargas de que el usuario nunca pierda su trabajo y de que la "
    "experiencia entre dashboard y editor sea fluida.", "Body"))

story.append(card_tarea(
    "T4.1", "Test E2E de guardado y carga",
    "Persona 4",
    "(solo verificación)",
    "Después de la restauración de BD, hay que validar a fondo que "
    "todo el flujo de persistencia funciona.",
    [
        "Documentar 5 escenarios: (a) Crear → dibujar 10 muros → "
        "recargar → verificar todo. (b) Crear → IA genera plano → "
        "guardar → cerrar sesión → reabrir. (c) Editar proyecto "
        "existente → cambiar ambiente → autoguardar. (d) Borrar "
        "proyecto desde Dashboard → confirmar que no aparece. "
        "(e) Verificar thumbnail aparece en dashboard.",
        "Ejecutar cada escenario manualmente.",
        "Para cada uno: capturar pantalla del antes y después + "
        "verificar el row en Supabase Studio.",
        "Reportar bugs encontrados como issues de GitHub.",
    ],
    "docs/tests-e2e/sprint1.md con 5 escenarios documentados.",
    "Esfuerzo: S (3h)",
    prioridad="P0",
    color=VERDE,
))

story.append(card_tarea(
    "T4.2", "Thumbnails en Supabase Storage",
    "Persona 4",
    "useGuardadoAutomatico.ts, lib/supabase.ts",
    "Hoy los thumbnails se guardan como dataURL base64 en la "
    "columna thumbnail. Eso pesa mucho y satura la BD.",
    [
        "Crear bucket \"thumbnails\" en Supabase Studio.",
        "Configurar RLS del bucket: user puede subir/leer/borrar "
        "solo objetos dentro de su carpeta {user_id}/.",
        "En useGuardadoAutomatico.capturarThumbnail: convertir "
        "dataURL a Blob (fetch(dataURL).then(r =&gt; r.blob())), "
        "subir vía supabase.storage.from('thumbnails').upload(...), "
        "path {user.id}/{project.id}.png, obtener URL pública con "
        "getPublicUrl, guardar solo la URL en proyectos.thumbnail.",
        "Migrar thumbnails existentes (los nuevos usuarios no los "
        "tendrán, pero por si acaso).",
        "Actualizar Dashboard para mostrar el "
        "&lt;img src={url}&gt;.",
    ],
    "PR con feature + verificación: tabla proyectos.thumbnail "
    "contiene URLs cortas, no dataURLs.",
    "Esfuerzo: M (4-6h)",
    prioridad="P1",
    color=VERDE,
))

story.append(card_tarea(
    "T4.3", "Botón Exportar PDF funcional",
    "Persona 4",
    "useExportarPDF.ts, TopBar.tsx",
    "El hook existe pero está incompleto. Necesitamos un PDF "
    "presentable. Es el criterio #10 del MVP.",
    [
        "Implementar useExportarPDF completo con jsPDF: hoja A4 "
        "horizontal, membrete (logo MyARQIA + nombre + fecha + "
        "escala 1:50 o 1:100), imagen del canvas 2D vía "
        "canvas.toDataURL → doc.addImage, tabla de ambientes con "
        "áreas, pie con firma del usuario y RUC/CIP si aplica.",
        "Botón \"Exportar PDF\" en TopBar (icono download).",
        "Manejar el loading state (botón deshabilitado mientras "
        "genera).",
        "Probar con 3 proyectos distintos (estudio, casa 2 dorms, "
        "casa con cochera).",
    ],
    "PR con feature + 3 PDFs de muestra adjuntos.",
    "Esfuerzo: L (1 día)",
    prioridad="P0",
    color=VERDE,
))

story.append(card_tarea(
    "T4.4", "Dashboard con filtros y orden",
    "Persona 4",
    "Dashboard.tsx",
    "Hoy el dashboard solo lista todo en orden fijo. Con 50+ "
    "proyectos se vuelve inusable.",
    [
        "Input de búsqueda que filtra por proyecto.nombre (debounce "
        "300 ms).",
        "Selector de orden: \"Más reciente\", \"Más antiguo\", "
        "\"A-Z\", \"Z-A\".",
        "Filtro por mes/año (dropdown).",
        "Vista alternativa: grilla (cards con thumbnail) vs lista "
        "(tabla compacta).",
        "Persistir las preferencias en localStorage.",
    ],
    "PR con feature + screenshot mostrando 30 proyectos filtrados.",
    "Esfuerzo: M (4h)",
    prioridad="P1",
    color=VERDE,
))

story.append(PageBreak())

# ─── 6.5 · Persona 5 — Arquitecta ───
story.append(P("6.5 · 🏛️ Persona 5 — Arquitecta (estudiante)", "H2"))
story.append(P(
    "Tu rol es el más importante del MVP en términos de calidad. La "
    "IA produce JSON, pero TÚ defines qué hace que un plano sea bueno "
    "arquitectónicamente. Sin tu input, la IA generará planos "
    "geométricamente correctos pero mal distribuidos.", "Lead"))

story.append(card_tarea(
    "T5.1", "Biblioteca de planos golden (10-15 planos)",
    "Persona 5",
    "docs/planos-referencia/*.png + .md por plano",
    "Crear referencias visuales y documentadas que sirvan de "
    "entrenamiento few-shot para la IA.",
    [
        "Producir 10-15 planos en formato dibujo a mano alzada con "
        "escala (foto), o en AutoCAD/SketchUp, exportados a PNG.",
        "Tipologías a cubrir (mínimo): (1) Estudio 30 m² lote 5×6m. "
        "(2) Casa 1 dorm lote 6×8m. (3) Casa 2 dorms lote 7×10m. "
        "(4) Casa 3 dorms lote 8×12m. (5) Casa con cochera. "
        "(6) Casa con lavandería. (7) Casa con depósito. "
        "(8) Departamento tipo edificio. (9) Vivienda mínima RNE. "
        "(10) Casa con escalera interior (preview multi-piso).",
        "Para cada plano, crear un .md con: resumen (área techada, "
        "ambientes, orientación), imagen, tabla de ambientes "
        "(posición, dimensiones, área, notas), lista de adyacencias "
        "clave, decisiones de diseño explicadas (1-2 líneas c/u), "
        "cumplimiento RNE (área, lados, ventanas).",
        "Subir todo a docs/planos-referencia/ y crear un INDEX.md.",
    ],
    "Carpeta docs/planos-referencia/ con 10+ planos completos y "
    "documentados.",
    "Esfuerzo: L (3-5 días)",
    prioridad="P0",
    color=ROJO,
))

story.append(card_tarea(
    "T5.2", "Documento de Reglas RNE estructurado",
    "Persona 5",
    "docs/reglas-rne.md",
    "Reescribir las reglas RNE Perú en formato tabla, para que la IA "
    "y el validador del backend las consuman directamente.",
    [
        "Investigar y consultar el RNE (Reglamento Nacional de "
        "Edificaciones del Perú), normas A.010 (vivienda) y A.020 "
        "(habilitaciones).",
        "Tabla en markdown con columnas: Ambiente, Área mín (m²), "
        "Lado mín (m), Ventana exterior obligatoria, Puerta ancho "
        "(m), Altura libre mín (m), Notas RNE (Art./Norma).",
        "Cubrir todos los ambientes habituales: sala, comedor, "
        "cocina, dormitorio simple, dormitorio principal, baño "
        "completo, baño visita, lavandería, pasillo, hall, cochera, "
        "escalera, terraza, depósito.",
        "Agregar sección sobre \"reglas geométricas\" (separación "
        "mínima entre ventanas, anchos mínimos de puerta por tipo, "
        "etc.).",
        "Revisar con el Tech Lead que la tabla es procesable por la "
        "IA.",
    ],
    "docs/reglas-rne.md con tabla completa y citado de artículos.",
    "Esfuerzo: M (1-2 días)",
    prioridad="P0",
    color=ROJO,
))

story.append(card_tarea(
    "T5.3", "Matriz de adyacencias ideales",
    "Persona 5",
    "docs/matriz-adyacencias.md",
    "Tabla 2D que dice qué ambiente debe estar al lado de qué otro. "
    "La IA usará esto para evitar absurdos como \"baño al lado de "
    "sala\".",
    [
        "Lista de ambientes a considerar (mismos de T5.2).",
        "Tabla simétrica donde cada celda tiene un nivel: ✓✓✓ ideal "
        "(deben compartir muro), ✓✓ muy recomendable (deben estar "
        "cerca), ✓ aceptable, ~ indiferente, ✗ evitar.",
        "Documentar el racional debajo de la tabla (ej: \"cocina ↔ "
        "comedor es ideal porque facilita el servicio\").",
        "Casos especiales: el baño NUNCA debe dar directamente a la "
        "sala o al comedor sin pasillo intermedio.",
    ],
    "docs/matriz-adyacencias.md con tabla 12×12 + racional.",
    "Esfuerzo: S (4-6h)",
    prioridad="P1",
    color=ROJO,
))

story.append(card_tarea(
    "T5.4", "QA continuo de salidas de la IA",
    "Persona 5",
    "docs/qa-scoring/sprint1.xlsx o .md",
    "Cada vez que P1 modifica el system prompt, generar 5 planos en "
    "tipologías distintas y calificarlos. Reportar al equipo qué "
    "falla.",
    [
        "Definir 5 prompts de prueba: \"casa 1 dorm 6×8\", \"casa 2 "
        "dorms con cochera\", \"estudio 30 m²\", \"casa 3 dorms\", "
        "\"depto 2 dorms\".",
        "Por cada plano generado, llenar tabla de scoring con 6 "
        "criterios ponderados: Distribución zonal (25%), Adyacencias "
        "(20%), Circulación (20%), Cumple RNE (15%), Ubicación y "
        "sentido de puertas (10%), Ventanas en muros exteriores "
        "(10%).",
        "Cada criterio se califica 1-5. Score total ponderado.",
        "Reportar a P1: \"el plano X falla en circulación porque la "
        "única forma de llegar al baño es por el dormitorio\".",
        "Iterar al menos 3 veces durante el sprint (después de cada "
        "ajuste del prompt).",
    ],
    "docs/qa-scoring/sprint1.* con ≥30 planos calificados (5 × 6 "
    "iteraciones).",
    "Esfuerzo: M (5-8h totales en el sprint)",
    prioridad="P0",
    dependencias="T5.2 y T5.3 listas para definir criterios",
    color=ROJO,
))

story.append(PageBreak())

# ─── Sección 7: Sprint 2 ───
story.append(P("7 · Sprint 2 — Pulido y deploy (semanas 3-4)", "H1"))
story.append(P(
    "Objetivo del Sprint 2: pulir el MVP y desplegarlo en producción "
    "para el demo. Aquí las tareas son más cortas y muchas dependen "
    "del Sprint 1.", "Lead"))

sprint2 = [
    ["Persona", "Tarea", "Esfuerzo", "Prioridad"],
    ["P1", "Endpoint /api/refinar para ajustar plano con prompt "
     "incremental (\"haz la cocina más grande\").",
     "L", "P2"],
    ["P1", "Logging estructurado en backend: prompts entrantes, "
     "respuestas IA, validation errors.",
     "S", "P1"],
    ["P2", "Cotas RNE automáticas: dimensionar cada muro al guardar.",
     "M", "P1"],
    ["P2", "Herramienta trim: cortar un muro al chocar con otro.",
     "M", "P2"],
    ["P3", "Render con HDRI environment (más fotorealista).",
     "M", "P2"],
    ["P3", "Exportar GLB del plano para Blender/Unity.",
     "S", "P2"],
    ["P4", "Compartir proyecto por link público (solo lectura).",
     "M", "P1"],
    ["P4", "Deploy en Vercel + dominio + variables de entorno.",
     "M", "P0"],
    ["P5", "Biblioteca de mobiliario tipo (cama, sofá, mesa, inodoro) "
     "con dimensiones para v1.1.",
     "L", "P2"],
    ["P5", "Glosario arquitectónico para el chat (vano, alféizar, "
     "antepecho — qué significan).",
     "S", "P2"],
]
story.append(tabla(sprint2, col_widths=[1.5 * cm, 10.5 * cm, 2 * cm, 3 * cm]))

story.append(PageBreak())

# ─── Sección 8: Definition of Done ───
story.append(P("8 · Definition of Done", "H1"))
story.append(P(
    "Una tarea está terminada cuando se cumplen los 7 puntos:", "Body"))

dod = [
    ["#", "Criterio"],
    ["1", "<b>Compila limpio</b> — <font face='Courier'>npm run build</font> "
     "y <font face='Courier'>tsc -b</font> exit code 0."],
    ["2", "<b>Probado manualmente</b> — al menos 3 casos de uso "
     "ejercitados."],
    ["3", "<b>Cubre 2D y 3D</b> — si toca el editor, se verificó en ambos."],
    ["4", "<b>Cubre ambas IAs</b> — si toca el backend, se probó con "
     "Claude y Gemini (cuando esté reactivado)."],
    ["5", "<b>Commit claro</b> — en rama "
     "<font face='Courier'>feat/&lt;persona&gt;/&lt;tarea&gt;</font> con "
     "mensaje descriptivo en español."],
    ["6", "<b>Pull Request</b> — abierto contra "
     "<font face='Courier'>feature/modulo-1-topbar</font> con descripción "
     "+ screenshots/GIFs."],
    ["7", "<b>Aprobación</b> — al menos un 👍 de revisión de otro dev."],
]
story.append(tabla(dod, col_widths=[1 * cm, 16 * cm]))

# ─── Sección 9: Git flow ───
story.append(P("9 · Git flow", "H1"))

story.append(P("9.1 · Branches", "H2"))
branches = [
    ["Rama", "Propósito"],
    ["main", "Producción / demo. Solo recibe merges de PR aprobados."],
    ["feature/modulo-1-topbar", "Rama de integración activa. Aquí "
     "mergean los devs sus features."],
    ["feat/&lt;persona&gt;/&lt;tarea&gt;", "Cada tarea su rama. "
     "Ej: feat/sofia/biblioteca-planos."],
]
story.append(tabla(branches, col_widths=[5 * cm, 12 * cm]))

story.append(P("9.2 · Workflow", "H2"))
wf = [
    ["Paso", "Comando o acción"],
    ["1", "<font face='Courier'>git checkout feature/modulo-1-topbar "
     "&amp;&amp; git pull</font>"],
    ["2", "<font face='Courier'>git checkout -b "
     "feat/&lt;tunombre&gt;/&lt;tarea&gt;</font>"],
    ["3", "Trabajar. Commits frecuentes con mensajes claros en español."],
    ["4", "<font face='Courier'>git push -u origin "
     "feat/&lt;tunombre&gt;/&lt;tarea&gt;</font>"],
    ["5", "<font face='Courier'>gh pr create --base "
     "feature/modulo-1-topbar</font> (o desde la web)."],
    ["6", "Esperar revisión de otro dev. Si hay cambios pedidos, "
     "<font face='Courier'>git push</font> los actualiza."],
    ["7", "Merge (squash o merge commit según el contenido) y borrar "
     "la rama."],
]
story.append(tabla(wf, col_widths=[1 * cm, 16 * cm]))

story.append(P("9.3 · Convención de commits", "H2"))
story.append(P(
    "En español, imperativo, conciso. Prefijos: feat:, fix:, docs:, "
    "chore:, refactor:, test:.", "Body"))
commits = [
    ["✅ Buenos", "❌ Malos"],
    ["feat(editor): handles para arrastrar extremos de muros",
     "cambios al editor"],
    ["fix(ia): puerta sin muro_id falla silenciosamente",
     "fix"],
    ["docs: añadir matriz de adyacencias",
     "actualizar archivo"],
    ["refactor(snap): extraer lógica de ortho a función separada",
     "limpieza"],
]
story.append(tabla(commits, col_widths=[10 * cm, 7 * cm]))

story.append(PageBreak())

# ─── Sección 10: Reuniones ───
story.append(P("10 · Reuniones recomendadas", "H1"))
reuniones = [
    ["Reunión", "Frecuencia", "Duración", "Participantes"],
    ["Daily sync", "Diario", "15 min", "Todos"],
    ["Demo de planos generados por la IA",
     "2× por semana", "30 min", "P1 + P5 + quien quiera"],
    ["Revisión visual de render (2D y 3D)",
     "Semanal", "45 min", "P2 + P3 + P5"],
    ["Retrospectiva de sprint",
     "Cada 2 semanas", "1 hora", "Todos"],
]
story.append(tabla(reuniones, col_widths=[6.5 * cm, 3 * cm, 2.5 * cm, 5 * cm]))

# ─── Sección 11: Cheatsheet ───
story.append(P("11 · Cheatsheet de comandos", "H1"))

story.append(P("11.1 · Levantar la app local", "H2"))
story.append(P(
    "<font face='Courier'>"
    "cd backend &amp;&amp; npm install &amp;&amp; npm run dev   # puerto 3001<br/>"
    "cd frontend &amp;&amp; npm install &amp;&amp; npm run dev  # puerto 5173"
    "</font>", "Mono"))

story.append(P("11.2 · Compilar para producción", "H2"))
story.append(P(
    "<font face='Courier'>cd frontend &amp;&amp; npm run build</font>", "Mono"))

story.append(P("11.3 · Crear Pull Request rápido", "H2"))
story.append(P(
    "<font face='Courier'>"
    "gh pr create --base feature/modulo-1-topbar \\<br/>"
    "&nbsp;&nbsp;--title \"feat(...): ...\" \\<br/>"
    "&nbsp;&nbsp;--body \"...\""
    "</font>", "Mono"))

story.append(P("11.4 · Probar la IA por curl", "H2"))
story.append(P(
    "<font face='Courier'>"
    "curl -X POST http://localhost:3001/api/chat \\<br/>"
    "&nbsp;&nbsp;-H \"Content-Type: application/json\" \\<br/>"
    "&nbsp;&nbsp;-d '{\"mensajes\":[{\"role\":\"user\",\"content\":"
    "\"casa 2 dorms\"}]}'"
    "</font>", "Mono"))

# ─── Sección 12: ENV ───
story.append(P("12 · Variables de entorno", "H1"))
story.append(P(
    "<b>⚠️ Importante:</b> las API keys que estaban hardcodeadas en el "
    "README inicial deben rotarse — quedaron expuestas en el historial "
    "git público. Cada dev genera su propio par.", "Quote"))

story.append(P("12.1 · backend/.env", "H2"))
story.append(P(
    "<font face='Courier'>"
    "PORT=3001<br/>"
    "ANTHROPIC_API_KEY=sk-ant-...<br/>"
    "GEMINI_API_KEY=..."
    "</font>", "Mono"))

story.append(P("12.2 · frontend/.env.local", "H2"))
story.append(P(
    "<font face='Courier'>"
    "VITE_SUPABASE_URL=https://cpapnhdtsifblkpbfxwl.supabase.co<br/>"
    "VITE_SUPABASE_ANON_KEY=eyJhbG...<br/>"
    "VITE_BACKEND_URL=http://localhost:3001"
    "</font>", "Mono"))

story.append(PageBreak())

# ─── Sección 13: MVP demo final ───
story.append(P("13 · Demo de aceptación del MVP", "H1"))
story.append(P(
    "El MVP se considera entregado cuando, en una demo en vivo de "
    "máximo 10 minutos, los 10 puntos siguientes se cumplen sin "
    "tropiezos:", "Body"))

for i, c in enumerate(criterios[1:], 1):
    story.append(P(f"<b>{i}.</b> {c[1]}", "Body"))

story.append(Spacer(1, 12))
story.append(P(
    "Si los 10 se cumplen → <b>MVP entregado</b>. Felicitaciones al "
    "equipo y pasamos al backlog de v1.1.", "Quote"))

story.append(Spacer(1, 24))
story.append(P(
    "<i>Este documento es un contrato vivo. Revísenlo cada sprint "
    "planning y ajústenlo según lo aprendido. La meta no es seguirlo "
    "al pie de la letra: es tener claridad de qué hace cada uno y "
    "cómo se mide el éxito.</i>", "Lead"))

story.append(Spacer(1, 16))
story.append(P(
    f"<font color='#6b7280'>Documento generado "
    f"{date.today().isoformat()} · Versión 3.0 · MyARQIA</font>", "Footer"))


# ────────────────────────────────────────────────────────────────────
# Build
# ────────────────────────────────────────────────────────────────────
output_path = Path(__file__).resolve().parent.parent / "docs" / "PLAN_MVP_EQUIPO.pdf"
output_path.parent.mkdir(parents=True, exist_ok=True)

doc = SimpleDocTemplate(
    str(output_path),
    pagesize=A4,
    leftMargin=2 * cm, rightMargin=2 * cm,
    topMargin=1.8 * cm, bottomMargin=1.8 * cm,
    title="Plan de Trabajo MVP — MyARQIA",
    author="Equipo MyARQIA",
    subject="Plan de trabajo en equipo para el MVP de MyARQIA con prioridades",
)

doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
print(f"PDF generado OK: {output_path}")
print(f"Tamano: {output_path.stat().st_size / 1024:.1f} KB")
