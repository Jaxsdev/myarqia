__MyARQIA__

Editor CAD Arquitectónico con IA

*Especificación Técnica Completa del Mockup — Guía de Implementación para el Equipo*

__Versión__

__Documento__

__Estado__

__Módulos__

__v1\.0__

Especificación UI/UX

__Para implementación__

__8 módulos__

*MyARQIA · Documento Interno del Equipo de Desarrollo · 2025*

__0\. Visión General del Editor__

Este documento especifica al detalle cada módulo, componente, función, estado y comportamiento del editor CAD arquitectónico de MyARQIA\. Está escrito para que el equipo de desarrollo pueda implementar cada parte sin ambigüedad, usando React \+ TypeScript como stack principal\.

El editor está compuesto por 8 módulos principales que se comunican entre sí mediante un estado global centralizado \(Zustand\)\. Cada módulo es un componente React independiente, extensible y reemplazable sin afectar a los demás\.

## __0\.1 — Los 8 Módulos del Editor__

__\#__

__Módulo__

__Componente React__

__Responsabilidad__

__1__

__Barra Superior \(TopBar\)__

<TopBar />

Logo, nombre del proyecto, botones de exportación PDF/DXF, compartir, menú de usuario y estado de guardado automático\.

__2__

__Barra Contextual__

<ContextBar />

Opciones que cambian según la herramienta activa: snap, ortho, escala, tipo de línea, grosor de muro, modo de vista, toggle de cotas y badge del RNE\.

__3__

__Panel Izquierdo__

<LeftPanel />

Árbol de modelo con lista de ambientes/elementos, gestor de capas CAD, historial de operaciones y panel de verificación RNE resumida\. Colapsable\.

__4__

__Barra de Herramientas__

<ToolsSidebar />

Herramientas de dibujo organizadas en grupos: selección, arquitectónicas \(muro, puerta, ventana\), anotación \(cota, texto, área\) y utilidades \(snap, configuración\)\. Extensible por configuración\.

__5__

__Viewport Principal__

<Viewport />

Canvas 2D interactivo \(Konva\.js o canvas nativo\) con grilla métrica, planta arquitectónica, cubo de orientación, rosa de los vientos, barra de escala, mini herramientas de zoom y seguimiento del cursor\.

__6__

__Barra de Estado__

<StatusBar />

Coordenadas X/Y en tiempo real, zoom actual, herramienta activa, conteo de elementos, estado de guardado y modo de snap activo\.

__7__

__Panel Derecho__

<RightPanel />

4 tabs intercambiables: Chat IA \(ArqIA con Claude\), Propiedades del elemento seleccionado, Verificador RNE completo y Biblioteca de componentes\.

__8__

__Sistema de Notificaciones__

<Toast />

Mensajes no intrusivos de confirmación, error o advertencia que aparecen sobre el viewport\. Duración configurable, con cola de mensajes\.

## __0\.2 — Estado Global Centralizado \(Store\)__

*Toda la comunicación entre módulos pasa por un store de Zustand\. Nunca hay comunicación directa entre componentes hermanos\. La arquitectura es la siguiente:*

store/

  useEditorStore\.ts       ← estado del editor \(herramienta activa, zoom, grilla, ortho, snap\)

  useProjectStore\.ts      ← proyecto activo \(nombre, elementos, capas, historial\)

  useSelectionStore\.ts    ← selección actual \(elemento, tipo, propiedades editables\)

  useAIStore\.ts           ← estado del chat \(mensajes, modelo activo, cargando\)

  useRNEStore\.ts          ← verificaciones RNE \(alertas, estado por ambiente\)

  useNotifStore\.ts        ← cola de notificaciones \(toast messages\)

__CONSEJO:  __Cada store tiene su propia suscripción\. Un componente solo se re\-renderiza cuando cambia la porción del store que consume\. Esto es clave para el rendimiento del viewport\.

__1\. Módulo 1 — Barra Superior \(TopBar\)__

La TopBar es el componente fijo superior de 40px de altura\. Contiene la identidad del producto, la navegación de archivos y las acciones principales del proyecto\. Es visible en todo momento y no se desplaza\.

## __1\.1 — Anatomía del TopBar \(de izquierda a derecha\)__

__Elemento__

__Tipo__

__Especificación Completa__

__Logo MyARQIA__

Componente visual

Texto "My" en color \#2D8EFF y "ARQIA" en \#00C8D4\. Font\-size 14px, font\-weight 500\. Al hacer clic redirige al dashboard de proyectos\. Nunca debe truncarse ni cambiar de tamaño\.

__Separador vertical__

Divisor

1px de alto 16px, color \#252B3B\. Se usa como separador visual entre grupos de elementos\.

__Menú de navegación__

Buttons

6 botones de texto: Archivo, Editar, Ver, Insertar, Herramientas, Ayuda\. Cada uno abre un dropdown con sub\-opciones al hacer clic\. Font\-size 11px, color \#8892A0 en reposo, \#E8ECF0 en hover\. Fondo hover: \#252B3B\.

__Nombre del proyecto__

Input editable

Muestra el nombre actual del proyecto\. Al hacer clic se convierte en un input de texto editable\. Enter o blur guardan el nombre\. Tiene ícono de carpeta a la izquierda\. Fondo \#252B3B, borde \#252B3B, border\-radius 4px, padding 3px 8px\.

__Badge de guardado__

Estado visual

Muestra "✓ Guardado" en verde \(\#2ECC71\) cuando el proyecto está sincronizado, o "● Guardando\.\.\." animado cuando hay cambios pendientes\. Fondo \#2ECC7120, borde \#2ECC7133\. Actualización automática cada 30 segundos o tras cada acción\.

__Botón Exportar PDF__

Action button

Ícono de PDF \+ texto "PDF"\. Fondo \#2D8EFF18, borde \#2D8EFF44, color \#2D8EFF\. Al hacer clic abre el diálogo de exportación PDF con opciones de escala, orientación y capas a incluir\.

__Botón Exportar DXF__

Action button

Ícono de código \+ texto "DXF"\. Fondo \#00C8D418, borde \#00C8D444, color \#00C8D4\. Al hacer clic exporta el DXF directamente con las capas activas en el estándar AutoCAD 2018\.

__Botón Compartir__

Primary button

Fondo \#2D8EFF, color blanco\. Genera un enlace único de solo lectura o colaborativo\. Abre un modal con opciones de permisos: "Solo ver", "Comentar", "Editar"\.

__Avatar de usuario__

Dropdown

Círculo de 26px con las iniciales del usuario\. Al hacer clic abre menú: Mi cuenta, Plan actual, Cerrar sesión\.

## __1\.2 — Menús Desplegables del TopBar__

### __Menú Archivo__

- Nuevo proyecto \(Ctrl\+N\) — Abre wizard de nuevo proyecto con selector de plantilla
- Abrir proyecto \(Ctrl\+O\) — Navega al dashboard de proyectos
- Guardar \(Ctrl\+S\) — Fuerza guardado inmediato en la nube
- Guardar como\.\.\. — Crea una copia con nuevo nombre
- Historial de versiones — Panel lateral con snapshots del proyecto
- Importar DXF/DWG — Abre selector de archivo para importar desde AutoCAD
- Importar imagen de referencia — Imagen de fondo trazable sobre el canvas
- Cerrar proyecto — Regresa al dashboard

### __Menú Editar__

- Deshacer \(Ctrl\+Z\) — Retrocede 1 operación en el historial
- Rehacer \(Ctrl\+Y\) — Avanza 1 operación en el historial
- Cortar / Copiar / Pegar — Operaciones estándar sobre elementos seleccionados
- Duplicar \(Ctrl\+D\) — Copia el elemento seleccionado con offset de 0\.25m
- Eliminar \(Delete\) — Elimina el elemento seleccionado con confirmación si es un muro con dependientes
- Seleccionar todo \(Ctrl\+A\) — Selecciona todos los elementos de la capa activa
- Buscar elemento \(Ctrl\+F\) — Input de búsqueda por nombre de ambiente o tipo

### __Menú Ver__

- Planta 2D — Vista superior del plano \(modo predeterminado\)
- Vista 3D — Extrusión 3D de muros en Three\.js
- Planos técnicos — Genera vistas normalizadas para documentación
- Panel de cotas — Toggle de visibilidad de todas las cotas
- Panel de nomenclatura — Toggle de etiquetas de ambientes
- Grilla — Toggle de la grilla de fondo
- Pantalla completa \(F11\) — Modo inmersivo

__2\. Módulo 2 — Barra Contextual \(ContextBar\)__

La barra contextual de 34px de altura cambia su contenido según la herramienta activa en el sidebar\. Es la barra de opciones de la herramienta en uso\. Su contenido es completamente dinámico y controlado por el store de la herramienta activa\.

## __2\.1 — Estado Universal \(siempre visible\)__

*Estos controles aparecen en todas las herramientas sin excepción:*

__Control__

__Tipo__

__Comportamiento__

__Snap__

Toggle \+ Select

Activa/desactiva el snap magnético\. Cuando está ON, el cursor se "pega" al punto de grilla más cercano\. El select al lado define la resolución: 5cm, 10cm, 25cm \(defecto\), 50cm, 1m\. Color verde cuando activo \(\#2ECC71\)\.

__Ortho__

Toggle

Cuando está ON, el cursor solo se mueve en ángulos de 0°, 45° o 90°\. Esencial para dibujar muros rectos\. Tecla rápida: F8\.

__Vista__

3 botones

Planta 2D \(ícono de cuadro\), Vista 3D \(ícono de cubo\), Planos Técnicos \(ícono de documento\)\. Solo uno activo a la vez\. El botón activo tiene fondo \#2D8EFF20 y color \#2D8EFF\.

__Escala__

Select

Cambia la escala de trabajo: 1:200, 1:100 \(defecto\), 1:75, 1:50, 1:25, 1:20, 1:10\. No afecta el modelo — solo la visualización e impresión\.

__Toggle Cotas \(D\)__

Toggle

Oculta o muestra todas las cotas del plano\. Las cotas siguen siendo funcionales cuando están ocultas\.

__Badge RNE__

Botón de estado

Muestra el número de alertas RNE pendientes\. Color naranja si hay alertas, verde si todo está OK\. Al hacer clic abre el tab RNE en el panel derecho\.

## __2\.2 — Estado por Herramienta Activa__

__Herramienta__

__Opciones adicionales en ContextBar__

__Muro__

Grosor \(select: 10cm, 15cm, 20cm, 25cm, 30cm\), Tipo \(simple/doble/con aislamiento\), Material \(ladrillo/drywall/concreto\), Altura por defecto \(input numérico en metros\), Alineación del muro \(izquierda/centro/derecha respecto a la línea de dibujo\)\.

__Puerta__

Ancho \(select: 70cm, 80cm, 90cm, 1\.00m, 1\.20m, personalizado\), Sentido de apertura \(izquierda/derecha\), Ángulo de apertura \(45°, 90°, 135°\), Tipo \(simple/doble/corredera/vaivén\)\.

__Ventana__

Ancho \(select: 60cm, 90cm, 1\.20m, 1\.50m, 1\.80m, 2\.40m, personalizado\), Alto \(input numérico\), Alféizar \(altura desde piso, input numérico, defecto 0\.90m\), Tipo \(fija/batiente/corredera/vidrio piso\-techo\)\.

__Escalera__

Ancho de escalera, Número de peldaños \(input\), Ancho del peldaño \(input, RNE mínimo 0\.25m\), Alto del contrapaso \(input, RNE máx 0\.18m\), Dirección de subida \(flecha toggle\)\.

__Columna__

Tipo \(cuadrada/circular\), Dimensión \(input, en cm\), Material \(concreto/acero/madera\)\.

__Cota__

Tipo \(lineal/angular/radial/libre\), Offset de línea de cota \(input\), Mostrar unidades \(toggle\), Decimales \(0/1/2\), Estilo \(RNE/ISO/libre\)\.

__Texto__

Tamaño de fuente, Estilo \(normal/título/nota técnica\), Capa de anotación\.

__Seleccionar__

Modo \(individual/caja/lazo\), Filtro de tipo \(todos/muros/puertas/ventanas/cotas/texto\)\.

__3\. Módulo 3 — Panel Izquierdo \(LeftPanel\)__

El panel izquierdo de 200px de ancho es el gestor del modelo arquitectónico\. Tiene 3 tabs principales: Árbol de Modelo, Gestor de Capas e Historial de Operaciones\. Además incluye un panel fijo inferior de verificación RNE\. Es colapsable a 40px mediante un botón de toggle\.

## __3\.1 — Tab 1: Árbol de Modelo__

*El árbol muestra la jerarquía completa del proyecto\. Permite navegar, seleccionar, ocultar y organizar todos los elementos del plano\.*

### __Estructura del árbol__

- Nivel 0 — Proyecto: nombre del archivo con ícono de casa
- Nivel 1 — Niveles: "Planta Baja", "Planta Alta 1", "Planta Alta 2", "Planta de Techos" \(se agregan dinámicamente\)
- Nivel 2 — Grupos: "Ambientes" \(rooms\), "Elementos estructurales", "Puertas y ventanas", "Cotas", "Texto y anotaciones"
- Nivel 3 — Elementos individuales: cada muro, puerta, ventana, cota, etc\.

### __Interacciones del árbol__

- Clic en elemento → lo selecciona en el canvas y abre sus propiedades en el panel derecho
- Clic en ojo \(hover\) → toggle de visibilidad del elemento o grupo
- Doble clic en nombre → edita el nombre del ambiente o elemento
- Drag & drop → reordena elementos o mueve entre grupos
- Clic derecho → menú contextual: Renombrar, Duplicar, Eliminar, Mover a capa, Agrupar con…
- Clic en "\+" al pie → agrega nuevo nivel al proyecto
- Elemento seleccionado se resalta con fondo \#2D8EFF15 y borde izquierdo de 2px en \#2D8EFF

## __3\.2 — Tab 2: Gestor de Capas CAD__

*MyARQIA implementa el sistema de capas estándar de la arquitectura según el National CAD Standard \(NCS\)\.*

__Capa__

__Color__

__Grosor__

__Contenido__

__A\-WALL__

\#E8ECF0 \(blanco\)

0\.5mm

Muros, tabiques y divisiones

__A\-DOOR__

\#F39C12 \(naranja\)

0\.35mm

Puertas con arco de apertura

__A\-WIND__

\#00C8D4 \(cian\)

0\.35mm

Ventanas con línea triple

__A\-ROOM__

\#9B59B6 \(púrpura\)

0\.18mm

Etiquetas de ambientes y área

__A\-ANNO\-DIMS__

\#2D8EFF \(azul\)

0\.18mm

Líneas de cota, flechas y valores

__A\-ANNO\-TEXT__

\#2ECC71 \(verde\)

0\.18mm

Notas técnicas y texto libre

__A\-STRUCT__

\#E74C3C \(rojo\)

0\.7mm

Columnas, vigas y elementos estructurales

__A\-EQPM__

\#8892A0 \(gris\)

0\.25mm

Mobiliario y equipamiento de referencia

__A\-GRID__

\#2A3045 \(azul oscuro\)

0\.13mm

Ejes de referencia y grilla de construcción

__A\-SITE__

\#795548 \(marrón\)

0\.5mm

Linderos, límite de propiedad, nivel de terreno

### __Controles de cada capa__

- Ojo → toggle de visibilidad \(la capa sigue existiendo, solo se oculta en pantalla\)
- Candado → toggle de bloqueo \(los elementos no pueden ser seleccionados ni editados\)
- Punto de color → abre selector de color para personalizar
- Clic en nombre → activa la capa \(los elementos nuevos se crean en esta capa\)
- Capa activa → resaltada con fondo \#2D8EFF12 y borde izquierdo azul
- Botón "\+" al pie → crea nueva capa personalizada con nombre editable

## __3\.3 — Tab 3: Historial de Operaciones__

*Lista cronológica de todas las acciones realizadas en el proyecto\. Permite deshacer/rehacer visualmente\.*

- Cada operación muestra: ícono del tipo, descripción corta, timestamp y usuario \(en modo colaborativo\)
- Clic en una operación la selecciona y resalta los elementos afectados en el canvas
- Botón "Volver a este estado" restaura el proyecto al momento de esa operación
- Snapshots \(marcadores\) manuales: botón de bandera que crea un checkpoint nombrado
- El historial se persiste en la base de datos y sobrevive al reload del navegador

## __3\.4 — Panel Fijo Inferior: Verificación RNE__

*Siempre visible independiente del tab activo\. Muestra un resumen rápido del cumplimiento normativo\.*

- Título "Verificación RNE" \+ badge con conteo de alertas
- Lista de máximo 4 ítems: primero las alertas \(naranja ⚠\), luego los OK \(verde ✓\)
- Al hacer clic en una alerta, selecciona el elemento afectado en el canvas
- "Ver todo" abre el tab RNE completo en el panel derecho

__4\. Módulo 4 — Barra de Herramientas \(ToolsSidebar\)__

La barra de herramientas vertical de 36px de ancho contiene todas las herramientas de dibujo y edición\. Está organizada en grupos separados por divisores\. Cada herramienta es un botón de 26x26px\. La herramienta activa tiene fondo \#2D8EFF20 y color \#2D8EFF \(o verde si es de estado\)\.

__IMPORTANTE:  __La barra de herramientas debe ser implementada como un array de configuración \(TOOLS\_CONFIG\)\. Agregar una nueva herramienta = agregar un objeto al array\. NUNCA hardcodear los botones directamente en el JSX\.

## __4\.1 — Especificación de Cada Herramienta__

__\#__

__Nombre__

__Tecla__

__Ícono Tabler__

__Comportamiento Completo__

__1__

__Seleccionar__

Esc

ti\-pointer

Clic en elemento: lo selecciona, resalta en canvas, abre propiedades en panel derecho\. Clic en vacío: deselecciona\. Clic \+ Shift: selección múltiple\. Arrastrar en vacío: caja de selección rectangular\. Arrastrar elemento seleccionado: lo mueve con snap\. Tecla Delete sobre selección: elimina con confirmación\.

__2__

__Muro__

W

ti\-border\-sides

Clic para colocar el punto de inicio del muro\. Mover el cursor muestra una preview del muro con el grosor configurado en la ContextBar\. Segundo clic coloca el extremo\. Se pueden encadenar muros en modo polilínea\. Doble clic o Esc termina la secuencia\. El muro se dibuja con doble línea \(cara exterior e interior\)\. Se une automáticamente a muros existentes dentro del radio de snap\.

__3__

__Puerta__

D

ti\-door

Clic sobre un muro existente: inserta una apertura en ese punto\. Se muestra el arco de apertura en línea discontinua \(tipo arquitectónico estándar\)\. La dirección y sentido se configuran desde la ContextBar o haciendo clic en el arco para alternarlo\. La puerta crea automáticamente una apertura en el muro \(hueco con las dimensiones configuradas\)\.

__4__

__Ventana__

V

ti\-browser

Clic sobre un muro existente: inserta una ventana centrada en ese punto\. Se dibuja con 3 líneas paralelas \(marco exterior, vidrio, marco interior\) en capa A\-WIND, color cian\. El ancho y el alféizar se configuran en la ContextBar\. Si el muro es exterior, se puede marcar como ventana de fachada para la vista 3D\.

__5__

__Escalera__

E

ti\-stairs

Clic y arrastre para definir el rectángulo de la escalera\. La ContextBar permite configurar número de peldaños, ancho de paso y contrapaso\. Se dibujan las líneas de peldaños automáticamente con la flecha de dirección de subida\. El sistema verifica automáticamente que paso y contrapaso cumplan el RNE A\.010\.

__6__

__Columna__

C

ti\-square

Clic para insertar una columna en el punto exacto\. Si snap está activo, se pega a la intersección de muros más cercana\. La forma \(cuadrada/circular\) y dimensión se configuran en ContextBar\. Se dibuja como elemento sólido en capa A\-STRUCT\.

__7__

__Cota lineal__

Q

ti\-ruler\-measure

Clic en el primer punto de referencia, clic en el segundo punto, clic para posicionar la línea de cota\. El valor se calcula automáticamente en metros\. El texto se muestra sobre la línea\. Al hacer clic en el valor de una cota existente se puede editar y el modelo se actualiza paramétricamente \(si está vinculado a un elemento\)\.

__8__

__Texto__

T

ti\-cursor\-text

Clic en el canvas abre un input de texto inline\. El texto se coloca en la capa A\-ANNO\-TEXT\. Se puede configurar el tamaño y estilo desde ContextBar\. Útil para notas técnicas, nombres de ambientes personalizados y referencias\.

__9__

__Área__

A

ti\-vector\-triangle

Clic en múltiples puntos para dibujar un polígono de área\. Doble clic o clic en el punto inicial cierra el polígono y muestra el área calculada en m² en el centro\. Útil para medir áreas irregulares no definidas como ambientes\.

__10__

__Snap__

S

ti\-magnet

Toggle de estado global del snap\. Cuando está activo \(verde\), el cursor se pega a puntos de grilla, extremos de muros, puntos medios, intersecciones y centros de elementos\. El radio de snap se calcula automáticamente según el zoom actual\.

__11__

__Configuración__

—

ti\-settings

Abre el panel de configuración del editor: unidades, tema, atajos de teclado personalizados, configuración de RNE, opciones de exportación por defecto\.

## __4\.2 — Estructura de Configuración \(TOOLS\_CONFIG\)__

*Implementación recomendada para que el sidebar sea extensible:*

const TOOLS\_CONFIG = \[

  \{ group: "selection", tools: \[

    \{ id: "select", icon: "ti\-pointer", key: "Escape", label: "Seleccionar", cursor: "default" \},

  \]\},

  \{ group: "architectural", tools: \[

    \{ id: "wall",   icon: "ti\-border\-sides", key: "w", label: "Muro",    cursor: "crosshair" \},

    \{ id: "door",   icon: "ti\-door",         key: "d", label: "Puerta",  cursor: "crosshair" \},

    \{ id: "window", icon: "ti\-browser",      key: "v", label: "Ventana", cursor: "crosshair" \},

    \{ id: "stair",  icon: "ti\-stairs",       key: "e", label: "Escalera",cursor: "crosshair" \},

    \{ id: "column", icon: "ti\-square",       key: "c", label: "Columna", cursor: "crosshair" \},

  \]\},

  \{ group: "annotation", tools: \[

    \{ id: "dim",    icon: "ti\-ruler\-measure", key: "q", label: "Cota",  cursor: "crosshair" \},

    \{ id: "text",   icon: "ti\-cursor\-text",   key: "t", label: "Texto", cursor: "text" \},

    \{ id: "area",   icon: "ti\-vector\-triangle",key:"a", label: "Área",  cursor: "crosshair" \},

  \]\},

  \{ group: "utility", tools: \[

    \{ id: "snap",   icon: "ti\-magnet",    key: "s", label: "Snap",   toggle: true, color: "green" \},

    \{ id: "config", icon: "ti\-settings",  key: "",  label: "Config", action: "openConfig" \},

  \]\},

\];

__CONSEJO:  __Para agregar una nueva herramienta al equipo, solo agregar un objeto al array TOOLS\_CONFIG con su id, icono, tecla, label y comportamiento\. No tocar el componente ToolsSidebar\.

__5\. Módulo 5 — Viewport Principal__

El viewport es el corazón del editor\. Es un canvas 2D interactivo que muestra la planta arquitectónica en tiempo real\. Soporta navegación \(pan, zoom, rotate\), selección de elementos, edición directa y preview de herramientas\. Es el componente más crítico en cuanto a rendimiento\.

## __5\.1 — Tecnología Recomendada__

- Motor principal: Konva\.js \(wrapper de canvas HTML5 con soporte de eventos, transformaciones y capas\)
- Alternativa: canvas nativo con requestAnimationFrame para máximo rendimiento en planos grandes
- Para la vista 3D: Three\.js con extrusión de muros a partir del JSON del plano 2D
- Coordenadas: siempre en metros con 2 decimales\. La escala de pantalla es una transformación de visualización, no del modelo

## __5\.2 — Sistema de Coordenadas__

- Origen \(0,0\): esquina inferior izquierda del plano \(convención arquitectónica\)
- Eje X: crece hacia la derecha \(Este\)
- Eje Y: crece hacia arriba \(Norte\)
- Unidades: metros\. La grilla base es de 0\.25m \(25cm\)\. La grilla gruesa cada 1m\.
- La conversión pixel\-metro depende del zoom actual: px = metros × scale × zoom

## __5\.3 — Navegación del Viewport__

__Acción del usuario__

__Comportamiento del viewport__

__Scroll de rueda__

Zoom hacia el punto donde está el cursor\. Rango: 10% a 500%\. Factor por tick: 1\.15\. Con Ctrl: zoom más lento \(factor 1\.05\)\.

__Clic medio \+ arrastrar__

Pan \(desplazamiento\) del viewport sin cambiar zoom\. El modelo se mueve con el cursor\.

__Espacio \+ arrastrar__

Pan alternativo para usuarios sin botón central \(ratones simples, trackpad\)\.

__Doble clic en vacío__

Ajusta la vista para mostrar todo el modelo centrado en pantalla \(fit to view\)\.

__Tecla F__

Igual que doble clic en vacío \(fit to view\)\.

__Tecla 1__

Vista frontal \(planta 2D desde arriba, orientación norte arriba\)\.

__Ctrl \+ 0__

Reset zoom a 100%\.

__Botones \+ / \- del mini\-panel__

Zoom in/out en incrementos del 10%\.

__Botón de maximizar del mini\-panel__

Fit to view: ajusta el zoom para mostrar todo el proyecto\.

__Botón de grilla del mini\-panel__

Toggle de visibilidad de la grilla de fondo\.

## __5\.4 — Elementos Superpuestos del Viewport__

### __Snap Banner \(barra superior centrada\)__

- Aparece siempre que snap está activo
- Muestra: estado de snap, tamaño, capa activa, estado de ortho
- Fondo: \#2D8EFF18, borde: \#2D8EFF44, border\-radius: 4px
- Es un elemento de solo lectura, no interactivo

### __ViewCube \(esquina superior derecha\)__

- Cubo SVG 54x54px con las 6 caras etiquetadas: PLANTA, FRENTE, LATERAL, POSTERIOR, SUPERIOR, INFERIOR
- La cara activa \(PLANTA en 2D\) se resalta con fondo diferente
- Clic en cada cara cambia la vista del viewport a esa perspectiva
- En modo 3D, el cubo rota para mostrar la orientación actual de la cámara

### __Rosa de los Vientos \(debajo del ViewCube\)__

- SVG de 20x24px con flecha N en color \#2D8EFF
- Indica el Norte del proyecto\. Se puede configurar la orientación del norte en Herramientas → Configuración del proyecto

### __Barra de Escala \(esquina inferior derecha\)__

- Línea horizontal de 60px con marcas en los extremos
- El valor representado cambia dinámicamente con el zoom: puede ser "1m", "5m", "10m", "50m" etc\.
- Texto debajo: "Xm · 1:100" \(distancia real representada y escala activa\)

### __Mini Herramientas \(esquina inferior izquierda\)__

- 4 botones de 24x24px: Zoom\+, Zoom\-, Fit View, Toggle Grilla
- Fondo: \#1C2030, borde: \#252B3B, border\-radius: 4px
- Hover: \#252B3B

## __5\.5 — Renderizado de Elementos Arquitectónicos__

### __Muros__

- Se dibujan como par de líneas paralelas separadas por el grosor del muro
- Color: \#E8ECF0 \(blanco arquitectónico\) sobre fondo oscuro
- Grosor de línea: 1\.5px en pantalla \(independiente del zoom\)
- Las uniones de muros se calculan geométricamente \(inglete automático en esquinas\)
- Muro seleccionado: resaltado con halo azul \(\#2D8EFF44\) de 4px de grosor

### __Puertas__

- Línea que marca el ancho de la apertura sobre el muro
- Arco de apertura en línea discontinua \(dash: 3px, gap: 3px\) en color \#F39C12
- El arco indica hacia dónde abre la puerta \(sentido y ángulo\)
- La apertura en el muro \(hueco\) se representa como un corte en las dos líneas del muro

### __Ventanas__

- 3 líneas paralelas sobre el muro: marco exterior, vidrio \(línea central más delgada\), marco interior
- Color: \#00C8D4 \(cian\)\. Grosor de línea exterior: 2\.5px\. Línea central: 1px\.
- El alféizar se indica con una línea de puntos debajo de la ventana \(en alzado\)

### __Cotas__

- Línea de cota paralela al elemento medido, a la distancia de offset configurada
- Líneas de referencia perpendiculares desde el elemento hasta la línea de cota
- Flechas o slashes en los extremos \(configurables en Herramientas\)
- Valor numérico centrado sobre la línea de cota en font\-size proporcional al zoom
- Color: \#2D8EFF\. Capa: A\-ANNO\-DIMS\.

### __Etiquetas de ambientes__

- Texto centrado en el polígono del ambiente: nombre en mayúsculas \+ área en m² debajo
- Color del texto: igual al color de la capa A\-ROOM del ambiente
- Se ocultan automáticamente si el ambiente es demasiado pequeño para el zoom actual

__6\. Módulo 6 — Panel Derecho \(RightPanel\)__

El panel derecho de 260px contiene 4 tabs independientes: Chat IA, Propiedades, RNE y Biblioteca\. Cada tab es un componente React separado que se monta/desmonta al cambiar de tab para evitar render innecesario\.

## __6\.1 — Tab IA: Chat con ArqIA__

### __Header del chat__

- Indicador de estado \(punto verde = conectado, gris = desconectado, naranja = procesando\)
- Nombre "ArqIA" \+ badge del modelo activo \(ej: "Claude Sonnet 4"\)
- Botón chevron\-down para cambiar el modelo de IA: Claude Sonnet 4, Claude Haiku 4, Gemini Flash, GPT\-4o
- El modelo se guarda en el perfil del usuario como preferencia

### __Área de mensajes__

- Scroll automático al mensaje más reciente al recibir una respuesta
- Mensajes del usuario: alineados a la derecha, fondo \#2D8EFF, texto blanco
- Mensajes de ArqIA: alineados a la izquierda, fondo \#252B3B, texto \#C8D0DC
- Cada mensaje de IA tiene su label "ArqIA · \[Modelo\]" en color \#00C8D4, font\-size 8px
- Los mensajes con acciones ejecutadas muestran un badge de confirmación \(verde OK o naranja advertencia\)
- Markdown básico en mensajes de IA: negrita, código inline, saltos de línea

### __Acciones que ArqIA puede ejecutar sobre el canvas__

- Generar planta: crea elementos en el canvas a partir de la descripción en texto
- Modificar elemento: cambia propiedades de un elemento seleccionado o nombrado
- Verificar RNE: ejecuta la verificación y muestra resultados en el chat y el panel RNE
- Calcular áreas: suma los m² de los ambientes y muestra el breakdown
- Generar variantes: crea 2\-3 distribuciones alternativas del mismo programa
- Exportar plano: configura y ejecuta la exportación PDF o DXF
- Presupuesto referencial: estima el costo de construcción por m² según material seleccionado

### __Input y acciones rápidas__

- Textarea de 2 filas que crece automáticamente hasta 6 filas\. Enter envía, Shift\+Enter nueva línea\.
- Botón de envío \(ícono de avión\) a la derecha del textarea
- Fila de pills de acciones rápidas: "3 variantes", "Verificar RNE", "Calcular áreas", "Presupuesto"
- Cada pill envía un mensaje predefinido al chat para activar esa función

## __6\.2 — Tab Propiedades__

*Muestra las propiedades editables del elemento seleccionado en el canvas\. Si no hay nada seleccionado, muestra un mensaje instructivo\.*

### __Sección Dimensiones__

- Área calculada \(solo lectura, verde si cumple RNE, rojo si no\)
- Ancho y Largo: inputs editables\. Al cambiar y presionar Enter, el elemento se actualiza en el canvas\.
- Altura: altura del muro o ambiente \(relevante para vista 3D y RNE\)
- Perímetro: solo lectura, calculado automáticamente

### __Sección Material y Capa__

- Select de material con opciones predefinidas \(Ladrillo 25cm, Drywall 9cm, Concreto 20cm, etc\.\)
- Select de capa CAD \(A\-WALL, A\-DOOR, etc\.\) — cambiar la capa reubica el elemento en el gestor
- Selector de color personalizado \(para elementos con color libre\)

### __Sección Normativa RNE__

- Muestra solo las verificaciones relevantes para ese tipo de elemento
- Área mínima \(para ambientes según tipo\): verde ✓ o rojo ✗ con el artículo del RNE
- Ventilación: ¿tiene al menos 1 ventana? \(para dormitorios y cocinas\)
- Iluminación: ¿el área de ventana es ≥ 10% del área del ambiente?
- Dimensiones mínimas para puertas \(0\.80m\) y pasillos \(0\.90m\)

### __Sección Posición__

- Origen X, Origen Y: coordenadas del punto de referencia del elemento en metros, editables
- Rotación: ángulo en grados, editable\. 0° = horizontal\.

## __6\.3 — Tab RNE: Verificador Completo__

*Panel de cumplimiento normativo completo del proyecto según el Reglamento Nacional de Edificaciones del Perú \(y NSR Colombia / NEC Ecuador en fases futuras\)\.*

### __Estructura del panel RNE__

- Header con badge del reglamento activo \(ej: "RNE Perú"\) y botón de cambio de norma
- Resumen: X/Y verificaciones cumplidas con barra de progreso visual
- Alertas activas: cada alerta con fondo naranja, artículo de referencia, descripción, diferencia medida vs mínimo y botón "Corregir automáticamente"
- Verificaciones OK: lista colapsable con todas las normas cumplidas en verde

### __Verificaciones implementadas \(RNE A\.010\)__

__Verificación__

__Artículo RNE__

__Regla__

__Dormitorio simple__

A\.010 Art\.22

Área mínima: 8m²\. Dimensión mínima: 2\.4m en cualquier dirección\.

__Dormitorio doble__

A\.010 Art\.22

Área mínima: 10m²\. Dimensión mínima: 2\.4m en cualquier dirección\.

__Sala / Estar__

A\.010 Art\.22

Área mínima: 14m² para vivienda hasta 3 dormitorios\.

__Comedor__

A\.010 Art\.22

Área mínima: 8m² \(puede integrarse con sala\)\.

__Cocina__

A\.010 Art\.22

Área mínima: 5m²\. Requiere ventilación directa al exterior\.

__Baño completo__

A\.010 Art\.22

Área mínima: 2\.5m²\. Debe contener: inodoro, lavabo, ducha\.

__Pasillo interior__

A\.010 Art\.25

Ancho mínimo: 0\.90m libres entre muros terminados\.

__Escalera interior__

A\.010 Art\.26

Paso mínimo: 0\.25m\. Contrapaso máximo: 0\.18m\. Ancho mínimo: 0\.90m\.

__Puerta principal__

A\.010 Art\.25

Ancho mínimo: 0\.90m\. Alto mínimo: 2\.10m\.

__Puertas interiores__

A\.010 Art\.25

Ancho mínimo: 0\.75m\. Alto mínimo: 2\.10m\.

__Altura libre__

A\.010 Art\.21

Altura mínima libre de piso a cielo: 2\.40m en vivienda\.

__Ventilación dormitorios__

A\.010 Art\.24

El área de ventana debe ser ≥ 10% del área del ambiente\.

__Iluminación natural__

A\.010 Art\.23

Todos los ambientes habitables requieren ventana al exterior o a patio\.

## __6\.4 — Tab Biblioteca de Componentes__

*Panel de componentes reutilizables que el usuario puede insertar en el plano con un clic o arrastrando\.*

### __Organización por categorías__

- Mobiliario: sofá, cama 1\.5px, cama 2pz, mesa de comedor 4\-6\-8 personas, escritorio, armario, clóset
- Sanitarios: inodoro, lavabo, ducha, bañera, urinario
- Cocina: mesada, cocina 4 hornillas, refrigerador, lavadero
- Estructura: columna cuadrada/circular, viga, losa, zapata
- Escaleras: prefabricadas rectas, L, U \(con parámetros editables\)
- Vegetación: árbol \(planta\), arbusto, jardín \(para planta de techos y sitio\)

### __Interacción__

- Input de búsqueda filtra en tiempo real por nombre o categoría
- Cada ítem muestra ícono \+ nombre en grid de 2 columnas
- Clic en ítem: activa la herramienta de inserción con ese componente
- El cursor cambia a un preview del componente\. Clic en el canvas lo inserta con snap activo
- Los componentes estructurales se insertan en capa A\-STRUCT, el mobiliario en A\-EQPM

__7\. Módulos 7 y 8 — StatusBar y Notificaciones__

## __7\.1 — Barra de Estado \(StatusBar\)__

*Barra fija de 22px de altura en la parte inferior del editor\. Muestra información de contexto en tiempo real\. Todos los valores son de solo lectura\.*

__Campo__

__Actualización__

__Descripción__

__Indicador de conexión__

En tiempo real

Punto verde \+ "Conectado" cuando hay sync con el servidor\. Punto naranja \+ "Guardando\.\.\." durante la sincronización\. Punto rojo \+ "Sin conexión" si se pierde la red\.

__Coordenadas X/Y__

mousemove \(60fps\)

Posición del cursor en el sistema de coordenadas del modelo en metros con 2 decimales\. Formato: "X: 4\.25 m  Y: 7\.50 m"

__Zoom actual__

Al cambiar zoom

Porcentaje de zoom actual\. Rango: 10% a 500%\.

__Herramienta activa__

Al cambiar tool

Nombre legible de la herramienta activa\. Ej: "Seleccionar", "Muro", "Cota"\.

__Conteo de elementos__

Al agregar/eliminar

"Elementos: 47" — total de elementos en el plano activo\.

__Estado de guardado__

Cada acción

"Guardado: 17:29" o "● Cambios sin guardar"

## __7\.2 — Sistema de Notificaciones \(Toast\)__

*Las notificaciones aparecen sobre el viewport en la esquina superior derecha, sobre el ViewCube\. Son no\-intrusivas y desaparecen automáticamente\.*

### __Tipos de notificación__

- Info \(borde izquierdo azul\): confirmaciones de acciones normales\. Duración: 2\.2 segundos\.
- Éxito \(borde izquierdo verde\): operación completada exitosamente\. Duración: 2\.5 segundos\.
- Advertencia \(borde izquierdo naranja\): alerta de RNE, acción con consecuencias\. Duración: 4 segundos con botón de acción\.
- Error \(borde izquierdo rojo\): operación fallida, error de red\. Duración: 6 segundos con botón "Reintentar"\.

### __Comportamiento de la cola__

- Máximo 3 notificaciones visibles simultáneamente
- Las notificaciones nuevas aparecen sobre las anteriores \(apilado vertical\)
- Clic en cualquier notificación la descarta inmediatamente
- Hover sobre una notificación pausa su timer de auto\-dismiss

__8\. Referencia Completa de Atajos de Teclado__

__Atajo__

__Acción__

__Atajo__

__Acción__

__Esc__

Herramienta seleccionar / cancelar acción

__W__

Activar herramienta Muro

__Ctrl\+Z__

Deshacer

__D__

Activar herramienta Puerta

__Ctrl\+Y__

Rehacer

__V__

Activar herramienta Ventana

__Ctrl\+S__

Guardar

__E__

Activar herramienta Escalera

__Ctrl\+N__

Nuevo proyecto

__C__

Activar herramienta Columna

__Ctrl\+O__

Abrir proyecto

__Q__

Activar herramienta Cota

__Ctrl\+D__

Duplicar selección

__T__

Activar herramienta Texto

__Delete__

Eliminar selección

__A__

Activar herramienta Área

__Ctrl\+A__

Seleccionar todo

__S__

Toggle Snap global

__Ctrl\+F__

Buscar elemento

__F8__

Toggle Ortho

__F__

Fit to view \(ajustar\)

__F11__

Pantalla completa

__Ctrl\+G__

Agrupar selección

__Tab__

Siguiente herramienta

__Shift\+clic__

Añadir a selección

__F7__

Toggle grilla

__Alt\+clic__

Sustraer de selección

__1__

Vista Planta 2D

__Espacio\+arrastrar__

Pan del viewport

__3__

Vista 3D

__Ctrl\+scroll__

Zoom fino

__P__

Vista Planos Técnicos

__Ctrl\+1__

Zoom 100%

__?__

Panel de ayuda y atajos

__Ctrl\+P__

Exportar PDF

__Ctrl\+E__

Exportar DXF

__9\. Guía de Implementación para el Equipo__

## __9\.1 — Orden de Implementación Recomendado__

*El equipo debe seguir este orden estricto\. Cada sprint entrega algo funcional y visible\.*

__Sprint__

__Módulo\(s\)__

__Duración__

__Entregable Verificable__

__S1__

__TopBar \+ StatusBar__

1 semana

Logo, nombre editable, botones de exportación \(sin funcionalidad real aún\), barra de estado con coordenadas\.

__S2__

__ToolsSidebar \+ ContextBar base__

1 semana

Sidebar con todos los botones \(sin lógica\), barra contextual con snap/ortho/escala, cambio de herramienta activa actualiza el cursor y la statusbar\.

__S3__

__Viewport — Canvas \+ Grilla__

1 semana

Canvas que renderiza grilla métrica, pan y zoom funcionando, ViewCube estático, coordenadas en statusbar\.

__S4__

__Viewport — Herramienta Muro__

2 semanas

Dibujar muros con doble línea, snap a grilla, ortho ON/OFF, undo/redo de muros, muros aparecen en árbol del panel izquierdo\.

__S5__

__Panel Izquierdo — Árbol__

1 semana

Árbol de modelo con elementos del plano, toggle de visibilidad, selección de elemento desde el árbol resalta en canvas\.

__S6__

__Viewport — Puerta y Ventana__

2 semanas

Insertar puerta sobre muro con apertura y arco, insertar ventana con triple línea cian, ambas aparecen en árbol\.

__S7__

__Panel Derecho — Propiedades__

1 semana

Al seleccionar un elemento, el panel muestra sus propiedades\. Editar Ancho/Largo actualiza el elemento en canvas\.

__S8__

__Panel Derecho — Chat IA__

2 semanas

Chat con Claude API, generar planta desde texto, parser JSON\-to\-canvas, mensajes de confirmación en el chat\.

__S9__

__Sistema RNE__

1 semana

Verificaciones automáticas según tabla de normas, badge en ContextBar, panel RNE en LeftPanel y RightPanel\.

__S10__

__Capas \+ Historial \+ Notificaciones__

1 semana

Gestor de capas completo, historial de operaciones, sistema de toast notifications\.

__S11__

__Exportar PDF y DXF__

2 semanas

PDF con cajetín normalizado escala 1:100, DXF con capas CAD estándar compatible con AutoCAD 2018\.

__S12__

__Biblioteca \+ Herramientas avanzadas__

2 semanas

Biblioteca de componentes, cota, texto, área, escalera, columna\.

__S13__

__Vista 3D__

2 semanas

Extrusión de muros en Three\.js, toggle 2D/3D, materiales básicos por tipo de muro\.

__S14__

__Pulido y QA__

2 semanas

Tests E2E de todos los flujos, optimización de rendimiento, accesibilidad, responsive para tablet\.

## __9\.2 — Principios de Arquitectura del Código__

### __1\. Separación de responsabilidades estricta__

- El componente React NUNCA contiene lógica de negocio\. Solo lee del store y despacha acciones\.
- La lógica de negocio \(cálculos de RNE, generación de planta, exportación\) vive en hooks o servicios\.
- El canvas/Konva NUNCA modifica el store directamente\. Emite eventos que el store procesa\.

### __2\. Extensibilidad por configuración__

- Herramientas: TOOLS\_CONFIG array\. Agregar herramienta = agregar objeto al array\.
- Capas CAD: LAYERS\_CONFIG array\. Agregar capa = agregar objeto al array\.
- Verificaciones RNE: RNE\_RULES array\. Agregar norma = agregar objeto con función validadora\.
- Modelos de IA: AI\_MODELS array\. Agregar modelo = agregar objeto con su API config\.

### __3\. Performance del viewport__

- El canvas se re\-renderiza SOLO cuando cambia la porción del store que afecta al viewport\.
- useCallback y useMemo en todos los handlers del canvas\.
- requestAnimationFrame para animaciones y preview de herramientas\.
- Elementos fuera del viewport actual no se renderizan \(culling por bounding box\)\.

### __4\. Persistencia__

- Auto\-guardado cada 30 segundos O tras cada operación significativa \(muro, puerta, etc\.\)\.
- El historial de operaciones se serializa junto al modelo en formato JSON\.
- IndexedDB para caché offline\. Sync con el servidor cuando haya conexión\.

## __9\.3 — Estructura de Carpetas del Proyecto__

src/

  components/

    editor/

      TopBar/          ← TopBar\.tsx \+ TopBar\.module\.css \+ MenuDropdown\.tsx

      ContextBar/      ← ContextBar\.tsx \+ herramienta\-específicos/

      LeftPanel/       ← LeftPanel\.tsx \+ TreeView/ \+ LayersPanel/ \+ HistoryPanel/

      ToolsSidebar/    ← ToolsSidebar\.tsx \+ tools\.config\.ts

      Viewport/        ← Viewport\.tsx \+ canvas/ \+ overlays/ \+ hooks/

      RightPanel/      ← RightPanel\.tsx \+ ChatTab/ \+ PropsTab/ \+ RNETab/ \+ LibraryTab/

      StatusBar/       ← StatusBar\.tsx

      Toast/           ← Toast\.tsx \+ toastQueue\.ts

  store/              ← Zustand stores \(editor, project, selection, AI, RNE, notif\)

  services/           ← API calls \(claude\.ts, export\.ts, rne\.ts, project\.ts\)

  hooks/              ← useCanvas\.ts, useSnap\.ts, useHistory\.ts, useRNE\.ts

  config/             ← tools\.config\.ts, layers\.config\.ts, rne\.rules\.ts, ai\.models\.ts

  types/              ← Wall\.ts, Door\.ts, Window\.ts, Project\.ts, Layer\.ts, etc\.

  utils/              ← geometry\.ts, units\.ts, export\-pdf\.ts, export\-dxf\.ts

## __9\.4 — Flujo de Datos: Ejemplo Completo__

*Ejemplo: el usuario hace clic en el canvas con la herramienta "Muro" activa:*

1. El evento click del canvas llama a handleCanvasClick\(event\) en el hook useCanvas\.
2. useCanvas lee activeTool del useEditorStore → es "wall"\.
3. Llama a wallToolHandler\.handleClick\(worldCoords\) en el servicio de herramienta de muro\.
4. Si es el primer clic: guarda el punto de inicio en el estado local de la herramienta\.
5. Si es el segundo clic: calcula la geometría del muro \(2 líneas paralelas con grosor\), crea un objeto Wall\.
6. Llama a useProjectStore\.addElement\(wall\) → actualiza el store\.
7. useProjectStore añade la operación al historial de undo/redo\.
8. El Viewport se re\-renderiza porque está suscrito a projectStore\.elements\.
9. El LeftPanel \(árbol\) se re\-renderiza porque está suscrito a projectStore\.elements\.
10. El RNE service detecta el nuevo muro y ejecuta verificaciones relacionadas\.
11. useRNEStore actualiza las alertas → badge de RNE en ContextBar se actualiza\.
12. Auto\-save se dispara 2 segundos después de la última acción\.

__CONSEJO:  __Este flujo unidireccional garantiza que el estado siempre sea la única fuente de verdad\. Nunca hay datos en el DOM que no estén en el store\.

*— Fin del Documento —*

MyARQIA  ·  Especificación Técnica del Editor  ·  v1\.0  ·  2025  ·  Documento Interno

