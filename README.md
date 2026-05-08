# MyARQIA 🏗️

MyARQIA es una plataforma innovadora de diseño arquitectónico web asistido por Inteligencia Artificial, diseñada específicamente para profesionales en Latinoamérica. Integra un potente motor de IA adaptado al **Reglamento Nacional de Edificaciones (RNE) del Perú** y normativas similares, permitiendo generar y editar planos arquitectónicos de forma rápida y eficiente.

##  Características Principales

*   **Asistente ArqIA**: Motor de Inteligencia Artificial (impulsado por Claude y Gemini) especializado en arquitectura, capaz de generar plantas completas a partir de descripciones de texto y garantizando el cumplimiento de normas básicas de diseño.
*   **Editor CAD Web Avanzado**: Herramienta de dibujo 2D interactiva (usando React y Konva) con capacidades tipo CAD:
    *   Trazado y edición de **muros** con espesores definidos (exteriores 0.25m, interiores 0.15m).
    *   Inserción paramétrica de **puertas** y **ventanas**.
    *   Sistema automatizado de **Cotas** para medir distancias precisas.
*   **Gestión de Proyectos**: Panel de control (Dashboard) intuitivo para crear, organizar y visualizar los proyectos, con persistencia en tiempo real.
*   **Autenticación**: Sistema seguro de login y registro de usuarios mediante Supabase.
*   **Exportación**: Generación de planos en formato PDF listos para imprimir o compartir.

##  Stack Tecnológico

El proyecto está dividido en dos aplicaciones principales: Frontend y Backend.

### Frontend
*   **Core**: React 19, TypeScript, Vite.
*   **Estilos**: Tailwind CSS v4 para una interfaz moderna, oscura y dinámica.
*   **Estado Global**: Zustand.
*   **Renderizado 2D/CAD**: Konva y react-konva.
*   **Rutas**: React Router DOM.
*   **Exportación**: jsPDF.
*   **BaaS**: Supabase (Autenticación y Base de Datos).

### Backend
*   **Core**: Node.js, Express.js.
*   **Integraciones IA**: 
    *   Anthropic API (Claude 3.5 Sonnet) para procesamiento complejo.
    *   Google Gemini API (Gemini 2.0 Flash) como motor alternativo/rápido de IA generativa.
*   **Herramientas**: CORS, dotenv.

## ⚙️ Requisitos Previos

*   [Node.js](https://nodejs.org/) (v18+)
*   [Git](https://git-scm.com/)
*   Cuenta en [Supabase](https://supabase.com/)
*   Claves de API de [Anthropic](https://console.anthropic.com/) y [Google Gemini](https://aistudio.google.com/)

## 🔧 Instalación y Configuración

Sigue estos pasos para ejecutar el proyecto en tu entorno local.

### 1. Clonar el repositorio

```bash
git clone https://github.com/jaxsdev/myarqia.git
cd myarqia
```

### 2. Configurar el Frontend

1.  Navega al directorio frontend:
    ```bash
    cd frontend
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Crea un archivo `.env.local` en la raíz de la carpeta `frontend` y añade las credenciales de Supabase del equipo:
    ```env
    VITE_SUPABASE_URL=https://cpapnhdtsifblkpbfxwl.supabase.co
    VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwYXBuaGR0c2lmYmxrcGJmeHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNjYwNjcsImV4cCI6MjA5MzY0MjA2N30.nfOP378hF0Q1y9HPpS3Bcug0wpP5Mv5pzVaHi4kSiEU
    ```

### 🔐 Cuenta de Prueba (Equipo)
Si no deseas crear una cuenta nueva durante el desarrollo, puedes usar la siguiente cuenta de prueba (reemplazar con los datos reales):
*   **Email:** `[Tu correo de prueba]`
*   **Contraseña:** `[Tu contraseña]`
4.  Inicia el servidor de desarrollo:
    ```bash
    npm run dev
    ```

### 3. Configurar el Backend

1.  Desde la raíz del proyecto, navega al directorio backend:
    ```bash
    cd backend
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Crea un archivo `.env` en la raíz de la carpeta `backend` con las siguientes variables:
    ```env
    PORT=3001
    ANTHROPIC_API_KEY=tu_api_key_de_claude
    GEMINI_API_KEY=tu_api_key_de_gemini
    ```
4.  Inicia el servidor (en modo desarrollo con nodemon):
    ```bash
    npm run dev
    ```

##  Estructura del Proyecto

```
myarqia/
├── backend/                  # Servidor Express.js
│   ├── index.js              # Lógica principal y endpoints de IA
│   ├── package.json
│   └── .env                  # Variables de entorno (Backend)
│
├── frontend/                 # Aplicación React (Vite)
│   ├── src/
│   │   ├── components/       # Componentes reutilizables (Editor, Interfaz)
│   │   ├── hooks/            # Custom hooks de React
│   │   ├── lib/              # Configuración de servicios (Supabase)
│   │   ├── pages/            # Vistas principales (Login, Dashboard, Editor)
│   │   ├── store/            # Estado global (Zustand - auth, editor)
│   │   ├── types/            # Definiciones de TypeScript
│   │   ├── App.tsx           # Enrutamiento principal
│   │   └── main.tsx          # Punto de entrada de React
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js    # (si aplica o config en Vite)
│   └── .env.local            # Variables de entorno (Frontend)
│
└── README.md                 # Documentación del proyecto
```

##  Uso

1.  Levanta tanto el frontend como el backend.
2.  Accede a la aplicación a través de la URL que provee Vite (generalmente `http://localhost:5173`).
3.  Inicia sesión o regístrate mediante Supabase.
4.  Crea un nuevo proyecto en el Dashboard.
5.  Interactúa con la IA en la barra lateral o dibuja tus propios muros usando la barra de herramientas del CAD.
