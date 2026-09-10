# SDD Explore — variant-threejs

> Exploration phase for the change `variant-threejs` in `portal-gcb` (Grupo Cordillera Blanca SA).
> Persistence mode: `openspec` (engram MCP not available in this environment).
> Date: 2026-08-11.

---

## 1. Contexto / Intent

Generar una **VARIANTE** del portal corporativo de GCB (Grupo Cordillera Blanca SA) implementando una experiencia visual inmersiva con **Three.js vanilla** (sin React Three Fiber, sin hidratar React en la variante — Astro client script + WebGL canvas), servida en una **nueva ruta `/variant`**. La ruta original `/` (sistema orbital existente en `Dashboard.astro`) permanece **intocada** para permitir A/B testing y fallback.

**Dirección de diseño**: Tech/SaaS moderno (Linear/Vercel-like) — dark-first, gradientes sutiles, grid de 12 columnas preciso, hover states finos, micro-detailing, tipografía display + body limpio.

**Restricciones explícitas del usuario**:
- Stack 3D: `three` vanilla (NO `@react-three/fiber`).
- Hidratación: NO React en `/variant` — solo Astro client script.
- Tailwind v4: SCOPEado al variant layout (no global, para no romper el CSS del cosmos original).
- Preservar toggle dark/light existente (localStorage key `'gcb-theme'`).
- Tono institucional AR (SA = Sociedad Anónima).

---

## 2. Decisiones de arquitectura

### 2.1 Estructura de archivos

**Recomendado**:
```
src/
├── pages/
│   └── variant.astro                 ← nueva ruta /variant
├── layouts/
│   └── VariantLayout.astro           ← layout propio (no toca Layout.astro)
├── components/
│   └── variant/
│       ├── Hero3D.astro               ← client island con <script> + <canvas>
│       ├── ProductGrid.astro          ← grid DOM de los 10 productos
│       ├── ProductCard.astro         ← card individual con hover states
│       ├── Header.astro               ← header con theme toggle
│       └── Footer.astro               ← footer minimal
├── scripts/
│   └── variant/
│       └── hero3d.ts                  ← lógica Three.js (import dinámico desde variant.astro)
├── data/
│   └── projects.ts                    ← data de los 10 proyectos extraída del frontmatter de Dashboard.astro
└── styles/
    └── variant.css                    ← Tailwind v4 @import + @theme + tokens de la variante
```

**Justificación**: layout + components aislados previenen fugas CSS/JS. El script Three.js vive en `src/scripts/` como módulo TS — Astro lo bundleará con import dinámico desde el `<script>` del layout, permitiendo code-splitting y lazy mount.

**Contras**: más archivos → más boilerplate. **Mitigación**: cada componente es chico y single-responsibility.

### 2.2 ¿Dónde vive la data de los 10 proyectos?

**Recomendado**: EXTRAER a `src/data/projects.ts` consumida por **ambas** rutas (`/` y `/variant`).

**Pros**:
- Single source of truth → eliminamos drift entre rutas.
- Refactor mínimo: Dashboard.astro solo cambia el frontmatter para importar desde `src/data/projects.ts` en lugar de declarar inline.

**Contras**: toca Dashboard.astro (límite con "no romper el original"). **Mitigación**: el cambio es PURAMENTE de extracción — mismo array, mismas keys. No se altera lógica ni estilos del cosmos. Test: `yarn build` limpio + QA visual de `/` idéntico al anterior.

**Alternativa descartada**: duplicar en `variant.astro` — drift garantizado, contradictorio con showcasing profesional.

### 2.3 CSS — Tailwind v4 SCOPEado

**Recomendado**: Tailwind v4 activado **solo para la variante** via `<style is:global>` en `VariantLayout.astro`.

Patrón (sin tocar `global.css` ni `astro.config.mjs` para no afectar `/`):

```astro
---
// VariantLayout.astro
import '../styles/variant.css';  // <- @import "tailwindcss" + @theme block aquí
---
<style is:global>
  /* Tailwind utilities ya cargadas via variant.css arriba */
</style>
```

Donde `src/styles/variant.css`:
```css
@import "tailwindcss";

@theme {
  --color-variant-bg: #0A0A0A;
  --color-variant-surface: #141414;
  --color-variant-surface-elevated: #1C1C1C;
  --color-variant-border: rgba(201, 168, 76, 0.18);
  --color-variant-text: #F5EDD8;
  --color-variant-text-muted: rgba(245, 237, 216, 0.6);
  --color-variant-gold: #C9A84C;
  --color-variant-gold-dark: #A8834A;
  --color-variant-violet: #9B6DFF;
  --color-variant-blue: #4A9EFF;
  --font-display: 'Work Sans', sans-serif;
  --font-body: 'Manrope', sans-serif;
}
```

**Riesgo - Preflight**: Tailwind v4 incluye Preflight (reset basado en modern-normalize). Si `variant.css` carga solo en `/variant`, Preflight NO afecta `/` (que sigue usando `global.css` con reset propio). **PERO** hay un edge case: si Astro hace hoisting del `@import "tailwindcss"` al bundle CSS global compartido, podría estilar la original.

**Mitigación crítica**:
1. **NO registrar `@tailwindcss/vite` en `astro.config.mjs`** (eso activaría Tailwind en todo el proyecto).
2. En su lugar, dejar que `variant.css` se procese via PostCSS **solo** cuando se importa desde `VariantLayout.astro`. Astro 6 + Vite bundleará este CSS module como scoped a la ruta `/variant` gracias a la dependencia estática del import.
3. **Test de verificación**: después del wiring, cargar `/` y `/variant` en pestañas separadas. Inspeccionar computed styles de `body` en `/` — NO debe tener clases Tailwind ni reset distinto al original.

**Alternativa si lo anterior falla** (Preflight filtra): embeber todo el CSS de la variante con custom properties ASTRALES (sin Tailwind), replicando Linear-like styles a mano. Más trabajo, pero 100% safe. Es el plan B.

### 2.4 Fugas CSS entre rutas

Astro 6 con `output: static` genera HTML estático por ruta. Cada página embebe `<link rel="stylesheet">` solo a los CSS modules que importa su árbol de componentes. Por diseño, `/` linkea `global.css` + el scoped style de `Dashboard.astro`. `/variant` linkeará `variant.css` (con Tailwind) + scoped styles de los componentes. **No debería haber fugas si respetamos las dependencias estáticas (imports en frontmatter).**

---

## 3. Diseño 3D / escena Three.js

### 3.1 Dirección recomendada

**Hero 3D con campo de partículas + geometría animada** (no orbital en WebGL, no cards 3D).

**Por qué**:
- El orbital ya existe y vive perfecto en DOM (`Dashboard.astro`). Replicarlo en WebGL suma coste sin valor nuevo.
- Un **hero 3D abstracto** (campo de partículas doradas, con leve morph/flow con el mouse) sitúa a la variante como alternativa de tono, no como mutación del sistema orbital.
- La data de los 10 productos vive en el **ProductGrid DOM** (debajo del hero), con hover states finos y transiciones vía CSS (no Framer Motion — la original no lo usa y mantener paridad conversacional).

**Estructura visual**:
1. **Header** (sticky, blur backdrop): nombre con gradiente + theme toggle.
2. **Hero3D** (100vh): canvas WebGL full-width con partículas + título "Grupo Cordillera Blanca SA" en gradient + tagline.
3. **ProductGrid** (10 cards en grid 3-4 cols): showcase portfolio con accent color por grupo (Refugio Data / Sistema / Descarga / Herramienta).
4. **Footer** minimal con © year y url de la variante original.

### 3.2 Representación de los 10 productos

**Grid DOM, NO cards 3D**. Razones:
- Los 10 proyectos son concretes (con URLs externas) — necesitan ser **clickables, accesibles, indexables** (SEO de showcase).
- Hacerlos 3D en WebGL los haría no-accesibles (canvas es black box para screen readers) y no-seleccionables.
- El showcase portfolio es más useful como grid DOM con estados hover con micro-detailing (glow, translateY, border-gradient).
- El 3D queda reservado para el hero (impacto visual sin deuda funcional).

### 3.3 Performance Three.js

| Estrategia | Implementación |
|---|---|
| **Lazy mount** | `IntersectionObserver` en el hero: si no está en viewport, no inicializa el WebGL context. |
| **Import dinámico** | `const THREE = await import('three')` dentro del script, no en top-level. |
| **Pausa si no visible** | `IntersectionObserver` con `disconnect()` en el renderer + pausa del `requestAnimationFrame`. |
| **`prefers-reduced-motion`** | Si activo → fallback: hero sin canvas, solo gradiente CSS animado. |
| **`devicePixelRatio` clamp** | `Math.min(window.devicePixelRatio, 2)` para evitar overhead en retina 3x. |
| **Fallback WebGL no disponible** | Si `canvas.getContext('webgl')` retorna null → mostrar hero solo con CSS (gradient + blur orbs) sin canvas. |
| **Page exit** | `visibilitychange` + `pagehide` listeners para pausar loop. |
| **Resize** | Single `ResizeObserver` con debounce. |
| **Cleanup** | `dispose()` de geometries/materials/textures + `renderer.dispose()` al unmount. No crítico en static SPA, pero correcto. |

---

## 4. UX/UI — dirección Tech/SaaS moderno

### 4.1 Paleta dark-first propuesta

Reusamos la identidad gold del original (coherencia con marca) pero añadimos neutros fríos Linear-like para soportar el dark-first.

| Token | Valor | Uso |
|---|---|---|
| `--color-variant-bg` | `#0A0A0A` | Fondo principal (igual al dark existente) |
| `--color-variant-surface` | `#141414` | Cards, header |
| `--color-variant-surface-elevated` | `#1C1C1C` | Cards hover, modals |
| `--color-variant-border` | `rgba(201, 168, 76, 0.18)` | Borders sutiles gold (mismo que tailwind.config.mjs original) |
| `--color-variant-text` | `#F5EDD8` | Texto principal (igual al dark existente cream) |
| `--color-variant-text-muted` | `rgba(245, 237, 216, 0.6)` | Subtexto |
| `--color-variant-gold` | `#C9A84C` | Accent primario (brand) |
| `--color-variant-gold-dark` | `#A8834A` | Accent hover |
| `--color-variant-violet` | `#9B6DFF` | Accent secundario (mismo middle orbit) |
| `--color-variant-blue` | `#4A9EFF` | Accent terciario (mismo outer orbit) |

**Light mode** (preservado via toggle `gcb-theme=light`): invertimos a `#F8F5EF` (cream bg) + `#1C1814` (brown text) + superficies white opacas con border gold 0.18. Mismos accents.

### 4.2 Gradientes sutiles (Linear-like)

- **Background**: `radial-gradient(ellipse at top, rgba(201, 168, 76, 0.08), transparent 60%)` encima del bg base.
- **Hero title**: `linear-gradient(135deg, #C9A84C 0%, #9B6DFF 50%, #3CC9A4 100%)` — idem al gradiente del Dashboard original.
- **Card hover**: `linear-gradient(135deg, rgba(201, 168, 76, 0.12), transparent)` overlay.

### 4.3 Tipografía — confirmada

- **Display**: Work Sans (700 para hero title, 600 para section titles) — via Fontsource ya importado en `global.css`.
- **Body**: Manrope (400/500/600) — idem via Fontsource.
- Usamos las mismas variables CSS `--fd` y `--fb` del original.

### 4.4 Componentes sugeridos

| Componente | Responsabilidad | Estados |
|---|---|---|
| Header.astro | Brand + theme toggle + posible link a `/` (volver al original) | sticky, blur backdrop al scroll |
| Hero3D.astro | Canvas WebGL + título hero + tagline + CTA scroll | parallax mouse, reduced-motion fallback |
| ProductGrid.astro | Renderiza 10 ProductCard en grid responsive | layout 1-col mobile, 2-col tablet, 3-col desktop, 4-col wide |
| ProductCard.astro | Card individual con `label`, `desc`, `grupo` (accent color), `url` externa | hover glow, focus-visible, target=_blank rel=noopener |
| Footer.astro | © year GCB SA + link a variante original `/` | sutil |

### 4.5 Micro-detailing

- **Hover card**: `transform: translateY(-2px)`, `box-shadow: 0 12px 32px rgba(0,0,0,0.6)`, `border-color: rgba(201, 168, 76, 0.5)`, transición `cubic-bezier(0.16, 1, 0.3, 1)` 200ms.
- **CTA primario**: gradient gold→violet, glow `0 0 28px rgba(201,168,76,0.18)` (mismo --shadow-gold del original).
- **Backdrop blur header**: `backdrop-filter: blur(12px)` con `background: rgba(10, 10, 10, 0.7)`.
- **Scroll-snap**: opcional entre hero y grid (`scroll-snap-type: y proximity`).

### 4.6 Scroll-driven animations

**Recomendado**: NO gsap. Usar:
- **CSS Scroll-Driven Animations** (`animation-timeline: scroll()`) para parallax sutil del hero — soporte moderno, 0 bytes.
- **`requestAnimationFrame` interno del script Three.js** para animar partículas (frame-by-frame con delta clock).
- Fallback: si `animation-timeline` no soportado → no parallax, hero estático (aceptable).

**Lenis** (smooth scroll): **NO** — añade 4kb para beneficio sutil en sitio estático. Linear usa scroll nativo moderno.

---

## 5. Stack final recomendado

### Dependencias a instalar

| Paquete | Bytes (gz) | Justificación |
|---|---|---|
| `three` | ~150kb (tree-shaken a ~80kb con imports selectivos) | OBLIGATORIO — el stack 3D elegido. |
| `maath` | ~5kb | Opcional. Helpers para partículas/splines. Usarlo solo si la implementación lo justifica. **Postponer** hasta apply. |

**NO instalar**:
- ~~`@react-three/fiber`~~ — el usuario eligió three vanilla.
- ~~`@react-three/drei`~~ — idem.
- ~~`gsap`~~ — CSS scroll-timeline + RAF interno es suficiente.
- ~~`lenis`~~ — overhead innecesario para sitio estático de 1 scroll.
- ~~`postprocessing`~~ (bloom/DOF) — añade 40-60kb y setup complejo. Hero premium sin postpro; las partículas con color + additive blending ya dan el wow factor.

**Justificación de budget**: total JS de la variante ~80-90kb gz (three + script). Comparison: Framer Motion sola es 30kb, y gsap es 60kb. La apuesta three vanilla en single route es razonable para un showcase premium.

### Chunking

- `three` se importa **dinámico** dentro del `<script>` del hero (`await import('three')`). Astro/Vite lo separa en un chunk `three.[hash].js` cargado on-demand.
- Script del hero carga **lazy** (IntersectionObserver). Result: primer paint de `/variant` no bloquea por three.

---

## 6. Plan de wiring / migración

### 6.1 `astro.config.mjs`

**Decisión**: Registrar `@tailwindcss/vite` en `astro.config.mjs`.

**Riesgo**: si registramos `@tailwindcss/vite` globalmente, podría afectar a `/` y romper el cosmos. Tailwind v4 plugin solo transforma CSS que contiene `@import "tailwindcss"` o directivas Tailwind. Como `global.css` y `Dashboard.astro` NO las tienen, deberían quedar intactos. **PERO** hay que verificar.

**Opción A (preferida)**: Registrar `@tailwindcss/vite` en `astro.config.mjs`. Vite plugin se aplica globalmente pero NO transforma CSS que no tenga `@import "tailwindcss"`. Como `global.css` y `Dashboard.astro` NO tienen ese import, quedan intactos. Riesgo bajo. **VERIFICAR** con `yarn build` y diff de `/` antes/después.

**Opción B (safe)**: NO tocar `astro.config.mjs`. Escribir Tailwind utility classes a mano (emular las que usaríamos) en `variant.css`. Más verbose, 0 riesgo de leak. Plan B si Opción A filtra.

**Recomendado**: Opción A con verificación de no-leak via `yarn build` + diff de index.html/estilos entre `/` antes y después.

### 6.2 `tsconfig.json`

Agregar aliases para DX:
```json
"compilerOptions": {
  "baseUrl": ".",
  "paths": {
    "@/*": ["src/*"],
    "@components/*": ["src/components/*"],
    "@layouts/*": ["src/layouts/*"],
    "@data/*": ["src/data/*"],
    "@scripts/*": ["src/scripts/*"],
    "@styles/*": ["src/styles/*"]
  }
}
```
No rompe imports existentes (relativos siguen funcionando).

### 6.3 `src/styles/variant.css`

Archivo nuevo con `@import "tailwindcss"` + `@theme` block (ver sección 2.3 y 4.1).

### 6.4 Acceso a la variante

**Recomendado**: link recíproco discreto.
- En Footer de `/` (Dashboard original): agregar un `<a href="/variant">Variante 3D</a>` sutil al lado del © year.
- En Header de `/variant`: link "Volver al portal" → `/`.

Así el A/B es navegable, no requiere difusión externa.

---

## 7. Riesgos / trade-offs

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| WebGL no disponible en dispositivo | Baja (95%+ soporte) | Medio | Fallback DOM con gradient CSS en el hero. Script detecta `canvas.getContext('webgl')` null. |
| Data drift entre `/` y `/variant` si duplicamos planetDefs | Nula (extraemos a `src/data/projects.ts`) | N/A | Extracción aplica. Misma data compartida. |
| Tailwind Preflight filtra a `/` | Media | Alto | Verificación con `yarn build` + diff. Si filtra → Plan B (manual CSS, Opción B) o NO registrar el plugin y emular utilities. |
| `requestAnimationFrame` cleanup | Baja (1 ruta) | Bajo | `pagehide` + `visibilitychange` listeners, `cancelAnimationFrame` en cleanup. Preventivo. |
| Bundle size Three.js (~80kb gz) | Cierta | Medio | Import dinámico + lazy mount con IntersectionObserver. No carga en primer paint. |
| Heat en mobil con WebGL | Media | Medio | `prefers-reduced-motion` + lazy mount + limitar render a 30fps en mobil via `frameratelimit` manual. |
| `animation-timeline: scroll()` no soportado | Media (Firefox 121+ sí, Safari 17+ sí, older no) | Bajo | Fallback estático, hero sin parallax. No crítico. |
| React + Framer Motion zombies en package.json | Cierta | Nulo | No los usamos en `/variant`. Podríamos revivirlos en otro cambio futuro. |

---

## 8. Scope explícito — lo que NO se hace

1. **No se borra ni modifica `Dashboard.astro`** (salvo extracción de data a `src/data/projects.ts` — cambio puramente mecánico).
2. **No se activa Tailwind v4 globalmente** para no romper estilos del cosmos original.
3. **No se refactorizan tokens de la original** (gold, cream, surface siguen donde están).
4. **No se hidrata React en `/variant`** — elección explícita del usuario (three vanilla).
5. **No se agrega Framer Motion en la variante** — micro-detailing via CSS + cubic-bezier.
6. **No se instalan** `gsap`, `lenis`, `@react-three/fiber`, `@react-three/drei`, `postprocessing`.
7. **No se toca `astro.config.mjs`** como cambio core de styling del original (verificación necesaria — ver sección 6.1).
8. **No se agregan tests ni lint** en este cambio (no existen hoy; deuda separada).

---

## 9. Open questions (requieren decisión humana antes de propose)

1. **Plan B Tailwind**: si la activación de `@tailwindcss/vite` filtra Preflight a `/`, ¿preferís Plan B (emular utilities manualmente, 0 riesgo) o Plan A con verificación de no-leak (riesgo controlado)?
2. **Extracción de data**: ¿aprobaron tocar el frontmatter de `Dashboard.astro` para que importe desde `src/data/projects.ts`? (Alternativa: duplicar data, con drift aceptado.)
3. **Acceso recíproco**: ¿agregamos links recíprocos en ambos Footers/Header, o `/variant` solo accesible via URL directa?
4. **Hero 3D**: ¿confirmamos **partículas doradas + morph por mouse**? Alternativas: constelación de estrellas (referencia al "stars" array del original), geometría wireframe animada, gradient shader fluido.
5. **Scroll-driven CSS**: ¿apostamos a `animation-timeline: scroll()` (modern-only, 0 bytes) o lo evitamos por compatibilidad?
6. **maath**: ¿sí o no? (5kb opcional, helpers para partículas hermosas).

---

## 10. Recomendación final

**Avanzar al stage `sdd-propose` bajo el siguiente approach**: variante `/variant` con Hero3D (Three.js vanilla, partículas doradas + parallax por mouse, fallback CSS si no WebGL) + ProductGrid DOM con 10 cards hover-finas + Header/Footer mínimos. Extracción de la data a `src/data/projects.ts` compartida con Dashboard. Tailwind v4 via `variant.css` + `@theme` block, verificando no-leak a la ruta original con `yarn build` + diff. Paleta dark-first reusando gold/violet/blue existentes + neutros surface. Tipografía Work Sans + Manrope confirmada. Scroll-driven CSS, sin gsap/lenis/fiber/postprocessing. Import dinámico de `three` con lazy mount por IntersectionObserver, `prefers-reduced-motion` respetado. Reposición de accesibilidad: cards focusables, hero canvas aria-hidden, header con toggle theme linkado al mismo `localStorage` key.

**Proxima fase**: `sdd-propose` — redactar el formal proposal con intención, scope, rollback plan, módulos afectados, criterios de aceptación.
