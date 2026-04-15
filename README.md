# Portal — Grupo Cordillera Blanca SA

Portal web corporativo que centraliza el acceso a todos los sistemas y aplicaciones de **Grupo Cordillera Blanca SA**. Presenta los proyectos mediante un sistema orbital animado (desktop) y una vista de tarjetas agrupadas (mobile), con soporte completo de **light mode** (por defecto) y **dark mode** con persistencia de preferencia.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Framework | [Astro 6](https://astro.build) |
| UI components | [React 19](https://react.dev) + TypeScript |
| Estilos | CSS custom properties (light/dark) · PostCSS · Autoprefixer |
| Fuentes | Work Sans (títulos) · Manrope (cuerpo) via `@fontsource` |
| Animaciones | CSS keyframes · `requestAnimationFrame` orbital engine |
| Package manager | Yarn |

---

## Características principales

- **Sistema orbital interactivo** — los proyectos orbitan alrededor del nombre de la empresa en tres anillos concéntricos con velocidades y direcciones independientes. Al hacer hover/focus el planeta se pausa y muestra un tooltip con detalle y enlace directo.
- **Vista mobile responsive** — por debajo de 768 px se activa una vista de tarjetas agrupadas por categoría, totalmente accesible y con animaciones de entrada.
- **Light / Dark mode** — light mode por defecto; botón de toggle luna/sol en el header. La preferencia se persiste en `localStorage`.
- **Branding multicolor** — el nombre de la empresa usa un degradado `dorado → violeta → verde → naranja` tomado de la paleta de colores de los proyectos.
- **Sin imágenes de logo** — identidad visual construida íntegramente con tipografía y color.
- **Accesibilidad** — planetas con `role="button"`, `aria-label`, navegación por teclado (Enter abre enlace) y tooltips con `role="tooltip"`.

---

## Proyectos expuestos

| Órbita | Proyecto | Descripción |
|---|---|---|
| Interna | Módulo Procesamiento | Gestión y análisis de datos operativos |
| Interna | Módulo Delivery | Control y seguimiento de pedidos |
| Interna | Módulo Comercial | Reservas, eventos y CRM |
| Media | Sistema Estacionamiento | Gestión de estacionamiento |
| Media | App Kiosko | App punto de venta (Expo) |
| Media | App Runner | App de despacho (Expo) |
| Externa | Agente AI | Consultas con inteligencia artificial |
| Externa | Conciliación Financiera | Sistema de conciliación financiera |

---

## Estructura del proyecto

```
portal-gcb/
├── public/
│   ├── favicon.svg
│   └── favicon.ico
├── src/
│   ├── assets/
│   │   └── logo.png
│   ├── components/
│   │   └── Dashboard.astro   # Componente principal: cosmos + mobile + script orbital
│   ├── layouts/
│   │   └── Layout.astro      # Shell HTML con meta tags
│   ├── pages/
│   │   └── index.astro       # Punto de entrada
│   └── styles/
│       └── global.css        # Reset, fuentes, scrollbar, tokens body
├── astro.config.mjs
├── package.json
└── DEVELOPMENT.md            # Bitácora de decisiones de diseño
```

---

## Desarrollo local

### Requisitos

- Node.js ≥ 22.12
- Yarn

### Instalación

```bash
yarn install
```

### Comandos

| Comando | Acción |
|---|---|
| `yarn dev` | Servidor de desarrollo en `localhost:4321` |
| `yarn build` | Build de producción en `./dist/` |
| `yarn preview` | Preview del build antes de deploy |
| `yarn astro check` | Verificación de tipos TypeScript |

---

## Arquitectura de temas (light / dark)

Los colores se controlan mediante CSS custom properties definidas en el componente `Dashboard.astro`:

```css
/* Light mode — default */
:root {
  --bg: #F8F5EF;
  --text: #1C1814;
  --gold-text: #8A6318;
  /* ... */
}

/* Dark mode — clase añadida al <html> */
html.dark {
  --bg: #0A0A0A;
  --text: #F5EDD8;
  --gold-text: rgba(201,168,76,0.80);
  /* ... */
}
```

El toggle lee y escribe `localStorage.getItem('gcb-theme')`. Si no existe ningún valor guardado, la interfaz inicia siempre en **light mode**.

---

## Motor orbital

Cada planeta lleva: `orbit` (inner/middle/outer), `phase` inicial en grados, `speed` (grados por ms escalado), y `dir` (+1 horario / -1 antihorario).

```
angle = (angle + dt × speed × dir × 0.06) % 360
x = cos(angle) × radius[orbit]
y = sin(angle) × radius[orbit]
```

Los radios se ajustan dinámicamente al tamaño de ventana y el cosmos se escala con `transform: scale()` para caber en pantallas menores a 920 px.

---

## Paleta de colores

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--bg` | `#F8F5EF` | `#0A0A0A` | Fondo de página |
| `--text` | `#1C1814` | `#F5EDD8` | Texto principal |
| `--gold` | `#C9A84C` | `#C9A84C` | Acento dorado |
| `--purple` | `#9B6DFF` | `#9B6DFF` | Órbita media |
| `--teal` | `#3CC9A4` | `#3CC9A4` | Apps móviles |
| `--orange` | `#FF8C42` | `#FF8C42` | Despacho |
| `--blue` | `#4A9EFF` | `#4A9EFF` | Herramientas AI |
| `--pink` | `#FF6B8E` | `#FF6B8E` | Conciliación |

---

## Licencia

Uso interno — Grupo Cordillera Blanca SA. Todos los derechos reservados.
