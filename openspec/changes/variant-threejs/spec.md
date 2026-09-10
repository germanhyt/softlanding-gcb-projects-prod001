# Spec: Variante Three.js — ruta `/variant`

**Change**: `variant-threejs`
**Mode**: `openspec`
**Date**: 2026-08-11
**Predecessors**: `openspec/changes/variant-threejs/explore.md`, `openspec/changes/variant-threejs/proposal.md`

---

## 1. Overview

Este spec describe los requirements y scenarios para una **variante paralela** del portal corporativo de GCB SA, servida en la nueva ruta `/variant`. Es un **delta spec** (change spec): captura SOLO los requirements NUEVOS y MODIFICADOS del cambio. No reescribe la base del proyecto. La ruta original `/` permanece intocada salvo por dos deltas intencionales y
melísticos: (a) extracción de la data de los 10 proyectos a `src/data/projects.ts` (refactor mecánico sin alterar template/lógica) y (b) un link recíproco discreto a `/variant` agregado al Footer de `Dashboard.astro`. La variante entrega un Hero3D basado en Three.js vanilla (campo de partículas doradas + parallax por mouse) sobre un ProductGrid DOM con 10 ProductCards, dentro de un layout propio (`VariantLayout.astro`) con Tailwind v4 scoped vía `@tailwindcss/vite` y verificación de no-leak a la ruta original.

---

## 2. Requirements

Se usan palabras clave RFC 2119 (MUST, SHALL, SHOULD, MAY, MUST NOT).

### 2.1 Funcionales — Ruta `/variant`

| ID | Requirement |
|---|---|
| **REQ-F01** | La ruta `/variant` MUST servirse como página HTML estática vía Astro 6 (`src/pages/variant.astro`), montada en `VariantLayout.astro`. |
| **REQ-F02** | `/variant` MUST renderizar un Hero section con un `<canvas>` WebGL independiente del DOM de React (no montado ni hidratado en React). |
| **REQ-F03** | `/variant` MUST renderizar un `ProductGrid` DOM con los 10 productos locales, consumidos desde `src/data/projects.ts` (single source of truth compartida con `Dashboard.astro`). |
| **REQ-F04** | `/variant` MUST incluir un `Header` sticky con theme toggle reutilizando el mismo `localStorage` key `gcb-theme` que la ruta original. |
| **REQ-F05** | `/variant` MUST incluir un `Footer` con un link recíproco visible a `/` ("Portal original" o equivalente). |
| **REQ-F06** | `Dashboard.astro` (ruta `/`) SHOULD incluir un link recíproco discreto a `/variant` ("Variante 3D") en su footer, al lado del © year. |
| **REQ-F07** | El Hero de `/variant` MUST contener un título con gradiente lineal (gold → violet → blue) + un tagline + un CTA scroll, todos declarados en markup estático (no dependen de WebGL para primer paint). |
| **REQ-F08** | El `ProductGrid` de `/variant` MUST ser responsive: 1-col mobile, 2-col tablet, 3-col desktop, 4-col wide (Tailwind utility classes). |

### 2.2 Funcionales — Hero3D

| ID | Requirement |
|---|---|
| **REQ-H01** | El Hero MUST inicializar Three.js lazy via `IntersectionObserver` sobre el `<canvas>`: el WebGL context NO MUST crearse en el primer paint del document. |
| **REQ-H02** | El Hero MUST renderizar un campo de partículas doradas con ~3000-5000 puntos usando `BufferGeometry` + `PointsMaterial` (`AdditiveBlending`, `sizeAttenuation: true`, `depthWrite: false`, color base `#C9A84C`). |
| **REQ-H03** | El campo de partículas MUST responder al movimiento del mouse con rotación lerp suave del `Points` object (no salto inmediato — interpolación por frame). |
| **REQ-H04** | El Hero MUST pausar el `requestAnimationFrame` (cancelAnimationFrame) cuando el canvas sale del viewport (via el mismo `IntersectionObserver`), y resumir al re-entrar. |
| **REQ-H05** | El Hero MUST ejecutar `renderer.dispose()` + `geometry.dispose()` + `material.dispose()` en cleanup, disparado por listeners `pagehide` y `visibilitychange`. |
| **REQ-H06** | Si `prefers-reduced-motion: reduce` está activo en el SO del usuario, el Hero MUST NO inicializar WebGL; deberá mostrar un fallback CSS (gradient + blur orbs animados) sin crear el canvas WebGL. |
| **REQ-H07** | Si `canvas.getContext('webgl')` retorna `null` (o `webgl2`), el Hero MUST mostrar el fallback CSS del REQ-H06 sin emitir errores en la consola. |
| **REQ-H08** | El script del Hero (`src/scripts/variant/hero3d.ts`) MUST cargar `three` via import dinámico (`await import('three')`) dentro del scope del client script, no en top-level del módulo. |
| **REQ-H09** | El Hero MAY usar `maath` para helpers de distribución esférica de partículas y easing (dependencia opcional, decidida en apply). |
| **REQ-H10** | El Hero MAY usar `animation-timeline: scroll()` para parallax sutil del hero; si el browser no lo soporta, el Hero queda estático (degradación aceptable, no crítico). |

### 2.3 Funcionales — Theme toggle

| ID | Requirement |
|---|---|
| **REQ-T01** | El theme toggle MUST usar `localStorage` con key `gcb-theme` y valores `'dark'` \| `'light'`. |
| **REQ-T02** | La variante MUST reaccionar al cambio de tema live (sin reload) actualizando CSS custom properties bajo el atributo `[data-theme="light"]`. |
| **REQ-T03** | El tema inicial MUST precargarse en `<head>` (script inline antes del body) para evitar FOUC, siguiendo el mismo patrón que `Dashboard.astro`. |
| **REQ-T04** | El theme toggle MUST ser el único mecanismo de persistencia de tema: NO MUST introducirse un nuevo `localStorage` key distinto. |

### 2.4 No funcionales — Performance

| ID | Requirement |
|---|---|
| **REQ-P01** | El bundle JS total servido a `/variant` (suma de todos los chunks cargados: three chunk + script hero + Astro runtime + cualquier vendor) MUST ser `< 150 KB` gzipped. |
| **REQ-P02** | `three` MUST code-splitearse via import dinámico (`await import('three')`), generando un chunk `three.[hash].js` separado que NO MUST cargarse en el primer paint. |
| **REQ-P03** | Lighthouse `/variant` performance MUST `≥ 85` ( slow 3G mobile preset). |
| **REQ-P04** | En mobile (`window.innerWidth < 768`), el RAF del Hero MUST throttlearse a `30 fps` máx vía frametime clamp. |
| **REQ-P05** | `devicePixelRatio` MUST clampearse a `Math.min(window.devicePixelRatio, 2)` al configurar el renderer. |
| **REQ-P06** | El Hero MUST usar `ResizeObserver` con debounce para manejar resize del canvas (no MUST listenear `window.resize` directamente). |
| **REQ-P07** | La animación del campo de partículas MUST usar un delta clock determinista por frame (no `Math.random()` por frame — el drift debe ser estable para snapshots y testabilidad). |

### 2.5 No funcionales — Accesibilidad

| ID | Requirement |
|---|---|
| **REQ-A01** | El `<canvas>` del Hero MUST tener `aria-hidden="true"` y `role="presentation"` (no bloquea screen readers). |
| **REQ-A02** | Los `ProductCard` MUST ser focusables con `:focus-visible` visible (outline / ring / border) y navegables via teclado (Tab). |
| **REQ-A03** | Los links externos de los `ProductCard` MUST tener `target="_blank"` + `rel="noopener"` (sin `opener` leak). |
| **REQ-A04** | `prefers-reduced-motion: reduce` MUST deshabilitar el canvas WebGL (ver REQ-H06) — el Hero sin canvas es el fallback accesible primario. |

### 2.6 No funcionales — Compatibilidad / No-regresión

| ID | Requirement |
|---|---|
| **REQ-C01** | `yarn build` MUST pasar sin warnings nuevos (comparado con el output pre-cambio). |
| **REQ-C02** | La ruta `/` MUST renderizar identico al estado pre-cambio: el HTML+CSS generado para `/` NO MUST modificarse (no-regresión), salvo el delta intencional del link recíproco en el footer (REQ-F06). |
| **REQ-C03** | Tailwind Preflight NO MUST filtrar a `/`: los computed styles de `body` en `/` NO MUST contener utilidades Tailwind (verificación con `yarn build` + diff). |
| **REQ-C04** | El cambio MAY mantener React + Framer Motion en `package.json` (no se eliminan en este cambio — son zombies no usados en `/variant`). |
| **REQ-C05** | `Dashboard.astro` MUST cambiar SOLO en dos lugares puntuales: (1) frontmatter donde las declaraciones inline de `planetDefs`/`orbitThemes`/`mobileOrbits` se reemplazan por `import` desde `src/data/projects.ts`; (2) footer donde se agrega el link recíproco a `/variant`. El template y la lógica del orbital engine NO MUST modificarse. |
| **REQ-C06** | `src/pages/index.astro`, `src/layouts/Layout.astro`, `src/styles/global.css` y `public/*` NO MUST modificarse. |

### 2.7 No funcionales — DX

| ID | Requirement |
|---|---|
| **REQ-D01** | `tsconfig.json` MUST extender `astro/tsconfigs/strict` y agregar `baseUrl` + `paths` aliases: `@/*`, `@components/*`, `@layouts/*`, `@data/*`, `@scripts/*`, `@styles/*`. |
| **REQ-D02** | `src/data/projects.ts` MUST tener tipado TypeScript estricto (interfaces para `planetDefs`, `orbitThemes`, `mobileOrbits`, `stars`). |

---

## 3. Scenarios

Formato Given/When/Then. Cada escenario es testeable (automatizable o por QA con devtools).

### S01 — Visita desktop con WebGL
- **Given**: Usuario en Chrome desktop con WebGL disponible y `prefers-reduced-motion` no activo.
- **When**: Navega a `/variant`.
- **Then**: Hero carga con partículas doradas visibles en el `<canvas>`.
- **And**: El campo de partículas rota suavemente siguiendo el cursor (parallax lerp).

### S02 — Navegación lazy mount
- **Given**: Usuario en cualquier dispositivo con WebGL disponible.
- **When**: Carga `/variant` por primera vez (primer paint).
- **Then**: El DOM del Hero (título, tagline, CTA, `<canvas>` placeholder) se renderiza.
- **And**: El WebGL context NO está inicializado todavía (sin chunk `three.[hash].js` en network).
- **And**: Al intersectar el `<canvas>` via `IntersectionObserver`, el script del hero ejecuta `await import('three')` y monta la escena.

### S03 — WebGL no disponible
- **Given**: Dispositivo sin WebGL (o emulado vía devtools — WebGL disabled).
- **When**: Carga `/variant`.
- **Then**: Hero muestra el fallback CSS (gradient black/gold + blur orbs animados), NO hay `<canvas>` activo.
- **And**: NO hay errores en la consola (try/catch silencia el fallo de `getContext('webgl')`).

### S04 — Reduced motion
- **Given**: Usuario con `prefers-reduced-motion: reduce` activado en SO.
- **When**: Carga `/variant`.
- **Then**: Hero se renderiza sin canvas WebGL (solo gradient CSS animado black/gold).
- **And**: El chunk `three.[hash].js` NO MUST cargarse (script del hero detecta reduced-motion antes de importar three).

### S05 — Theme toggle live
- **Given**: Usuario en `/variant` con tema dark inicial (`gcb-theme=dark` o no seteado → default dark).
- **When**: Click en el theme toggle del Header.
- **Then**: Theme cambia a light live (sin reload).
- **And**: `localStorage['gcb-theme']` ahora es `'light'`.
- **And**: Las CSS custom properties de la variante se actualizan (bg cream, texto brown, surfaces white opacas).

### S06 — Cross-route theme sync
- **Given**: Usuario en `/variant` con `gcb-theme=light` guardado en localStorage.
- **When**: Navega a `/` (Dashboard original).
- **Then**: Dashboard original carga en light (mismo `localStorage` key respetado por el script de theme existente).
- **And**: No hay flash of unstyled content (FOUC) en ninguna de las dos rutas.

### S07 — Mobile throttle
- **Given**: Usuario en móvil con `window.innerWidth < 768` y WebGL disponible.
- **When**: El Hero WebGL inicializa tras IntersectionObserver.
- **Then**: El RAF se throttlerede a `30 fps` máx (frametime clamp).
- **And**: `devicePixelRatio` está clampeado a `Math.min(window.devicePixelRatio, 2)`.
- **And**: Hero visible sin heat excesivo (devtools perf report).

### S08 — Cleanup on page hide
- **Given**: Usuario en `/variant` con WebGL activo (RAF corriendo).
- **When**: La tab pasa a hidden (`visibilitychange` → `document.hidden === true`) o se dispara `pagehide`.
- **Then**: RAF cancelado (`cancelAnimationFrame`).
- **And**: `renderer.dispose()`, `geometry.dispose()`, `material.dispose()` invocados.
- **And**: No hay memory leak (verificable via devtools Memory snapshot antes/después).

### S09 — ProductCard click externo
- **Given**: Usuario en `/variant` ProductGrid.
- **When**: Click en un `ProductCard`.
- **Then**: Abre la URL externa del producto en una nueva pestaña con `rel="noopener"`.
- **And**: La nueva pestaña NO tiene referencia `window.opener` a `/variant` (no opener leak).

### S10 — Reciprocal link original
- **Given**: Usuario en `/` (Dashboard original).
- **When**: Inspecciona el footer.
- **Then**: Encuentra un link visible a `/variant` con texto "Variante 3D" (o equivalente discreto) al lado del © year.
- **And**: El link navega a `/variant` sin recargar el servidor (es un link `<a href="/variant">` estático).

### S11 — No-regresión del original
- **Given**: Build pre-cambio y post-cambio generan `dist/`.
- **When**: Diff de los HTML+CSS de `/` entre las dos versiones.
- **Then**: Idénticos salvo el link nuevo en el footer (delta intencional REQ-F06).
- **And**: El orbital engine del cosmos funciona idéntico (mismas animaciones, misma data; solo cambia el origen de la data: inline → import, mismo valor).

### S12 — Tailwind no-leak a la ruta original
- **Given**: Registro de `@tailwindcss/vite` en `astro.config.mjs` (Plan A).
- **When**: Build genera CSS de `/`.
- **Then**: Los computed styles de `body` en `/` NO contienen utilidades Tailwind (Preflight no filtra).
- **And**: El CSS de `global.css` y `Dashboard.astro` scoped style queda byte-identical al pre-cambio (diff vacío).

### S13 — Data drift eliminado
- **Given**: Extracción de `planetDefs`, `orbitThemes`, `mobileOrbits` a `src/data/projects.ts` aplicada.
- **When**: Se modifica un item en `src/data/projects.ts` (ej: cambio de `desc` en un producto).
- **Then**: El cambio se refleja en `/` (Dashboard) Y en `/variant` (ProductGrid).
- **And**: No hay dos copias de la data a mantener — single source of truth.

### S14 — Canvas pause fuera del viewport
- **Given**: Usuario en `/variant` con Hero WebGL inicializado y scroll hacia abajo (Hero sale del viewport).
- **When**: Hero sale completamente del viewport (`IntersectionObserver` no intersecta).
- **Then**: RAF se pausa (`isIntersecting === false`).
- **And**: Al volver a scrollear arriba, RAF resumes sin reinicializar WebGL context (reusa renderer existente).

### S15 — Build sin warnings nuevos
- **Given**: Output de `yarn build` pre-cambio (línea base).
- **When**: Run `yarn build` post-cambio.
- **Then**: Comando termina con exit code 0.
- **And**: No aparecen warnings nuevos comparado con la línea base (mismo set, ningún warning adicional).

---

## 4. Data Requirements

`src/data/projects.ts` MUST exportar:

| Export | Tipo | Cardinalidad | Descripción |
|---|---|---|---|
| `planetDefs` | `PlanetDef[]` | 10 items | Data de los 10 productos/proyectos mostrados en ambas rutas. |
| `orbitThemes` | `Record<'inner' \| 'middle' \| 'outer', OrbitTheme>` | 3 keys | Configuración de tema por orbit (usada por Dashboard original). |
| `mobileOrbits` | `MobileOrbit[]` | 3 items | Configuración de órbitas para mobile (usada por Dashboard original). |
| `stars` | `Star[]` (opcional) | variable | Array de estrellas de fondo del cosmos original. MAY exportarse si existe en el frontmatter actual. |

### `PlanetDef` (TypeScript interface)
```typescript
interface PlanetDef {
  id: string;
  label: string;
  desc: string;
  url: string;
  orbit: 'inner' | 'middle' | 'outer';
  group: 'Refugio Data' | 'Sistema' | 'Descarga' | 'Herramienta';
  icon: string; // key string para icono (mapeado a SVG o componente en cada ruta)
}
```

### Tipado estricto
- `src/data/projects.ts` MUST tener tipado TypeScript estricto siguiendo `astro/tsconfigs/strict`.
- Las interfaces (`PlanetDef`, `OrbitTheme`, `MobileOrbit`, `Star`) MUST exportarse desde el mismo archivo para tipar consumers.
- Valor de cada item MUST preservar exactitud semántica con el frontmatter actual de `Dashboard.astro` (extracción mecánica — sin renombrar keys, sin alterar valores).

---

## 5. Architecture Constraints

- **NO React hydration en `/variant`**: la ruta `/variant` MUST NO hidratar componentes React. Toda interactividad via Astro client scripts (`<script>` tags) y TS modules en `src/scripts/variant/`.
- **Three.js via import dinámico**: `three` MUST cargarse con `await import('three')` dentro del scope del client script del hero, no en top-level de ningún módulo. El bundler (Vite) lo separará en chunk `three.[hash].js`.
- **CSS: Tailwind v4 scoped**: vía `src/styles/variant.css` con `@import "tailwindcss"` + `@theme` block con tokens de la variante. Scopeado al `VariantLayout.astro` por dependencia estática de import. Plan A con verificación de no-leak (REQ-C03, scenario S12). Fallback Plan B (manual CSS sin Tailwind) si leak detectado.
- **Layout aislado**: `VariantLayout.astro` MUST NO importar ni extender `Layout.astro`. Son layouts hermanos, no dependientes.
- **Componentes variant aislados**: `src/components/variant/*` MUST NO importar componentes de `src/components/` no-variant (salvo via `src/data/projects.ts` compartido). Headers/Footers son dedicados a la variante.
- **No hidratación frameworks JS**: la variante MUST NO usar React, Framer Motion, ni ningún framework de cliente. Solo Astro + TS modules + Three.js vanilla.

---

## 6. Out of Scope

Heredado de `proposal.md` §3 "Out of Scope":

1. **NO se borra ni refactoriza el template/lógica de `Dashboard.astro`** — solo dos deltas intencionales: frontmatter import (REQ-C05.1) y footer link (REQ-F06).
2. **NO se modifican tokens de la original** (`global.css`, `--fd`, `--fb`, colores del cosmos) — intactos.
3. **NO se hidrata React en `/variant`** — elección explícita (three vanilla + Astro client script).
4. **NO se instalan** `@react-three/fiber`, `@react-three/drei`, `gsap`, `lenis`, `postprocessing`.
5. **NO se agregan tests ni lint** en este cambio (no existen hoy en el proyecto; deuda separada).
6. **NO se toca `public/`** ni assets existentes.
7. **NO se cambia `src/pages/index.astro`** (solo monta `Dashboard.astro`).
8. **NO se hace SEO avanzado en `/variant`** (meta tags dynamiques, schema.org, sitemap) — deuda abierta para un cambio futuro.
9. **NO se eliminan de `package.json`** React, Framer Motion u otras deps zombies (REQ-C04) — separadas a este cambio.
10. **NO se hacen cards 3D en WebGL** — los 10 productos viven en el ProductGrid DOM (REQ-F03) por accesibilidad y SEO.

---

## 7. Open Questions — Resolved

Todas las open questions del `explore.md` §9 y `proposal.md` §11 están resueltas. No hay nuevas open questions para este spec. Las decisiones heredadas son vinculantes para downstream phases (`sdd-design`, `sdd-tasks`):

| # | Decision |
|---|---|
| 1 | Plan A Tailwind con verificación de no-leak (REQ-C03, S12). Plan B como fallback si leak. |
| 2 | Extracción de data a `src/data/projects.ts` compartida ( REQ-F03, REQ-C05). |
| 3 | Links recíprocos en ambos sentidos (REQ-F05, REQ-F06). |
| 4 | Hero 3D con partículas doradas + parallax por mouse (REQ-H02, REQ-H03). Abstracto, no representacional. |
| 5 | `animation-timeline: scroll()` con fallback estático (REQ-H10, graceful degradation). |
| 6 | `maath` incluido (REQ-H09, opcional según justificación en apply). |

---

## Envelope

- **status**: success
- **executive_summary**: Delta spec escrito para la variante Three.js en `/variant`, cubriendo 30+ requirements funcionales y no funcionales + 15 escenarios Given/When/Then. La ruta original `/` queda protegida por 4 requirements de no-regresión (REQ-C02, REQ-C03, REQ-C05, REQ-C06) y 2 escenarios dedicados (S11, S12).
- **artifacts**: [`openspec/changes/variant-threejs/spec.md`]
- **next_recommended**: `sdd-design` — producir el design técnico con arquitectura del `hero3d.ts` (sequence del lazy mount + intersection observer + cleanup), data flow de `src/data/projects.ts` a ambas rutas, y decision records para Plan A vs Plan B Tailwind.
- **risks**:
  - R1 (Medio): El scenario S12 (no-leak Tailwind a `/`) es el más difícil de automatizar — requiere diff de CSS computado antes/después. Mitigación: procedimiento manual documentado en `sdd-verify` si no hay tooling de diff de CSS.
  - R2 (Bajo): El scenario S07 (mobile throttle 30fps) requiere validación manual en mobile real. Mitigación: usar devtools device emulation como baseline, validar en device físico si hay hotspot reportado.
  - R3 (Bajo): El scenario S08 (cleanup sin memory leak) requiere Memory snapshot de devtools — no es automatizable sin tooling externo. Mitigación: validación manual + code review del cleanup en `sdd-verify`.
  - R4 (Bajo): El spec introduce REQ-P07 (delta clock determinista) — no estaba en el proposal pero es implícito. Si el usuario no lo quiere, se MAY eliminar en `sdd-design`. Es under-budget de palabras: no rompe scope.
