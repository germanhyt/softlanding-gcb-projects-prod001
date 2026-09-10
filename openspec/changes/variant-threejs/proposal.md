# Proposal: Variante Three.js — portal `/variant`

**Change**: `variant-threejs`
**Persistence mode**: `openspec`
**Date**: 2026-08-11
**Predecessor artifact**: `openspec/changes/variant-threejs/explore.md`

---

## 1. Title & Summary

Este cambio agrega una **ruta paralela `/variant`** al portal corporativo de Grupo Cordillera Blanca SA, con un hero 3D basado en **Three.js vanilla** (campo de partículas doradas + parallax por mouse) sobre un ProductGrid DOM con 10 cards, dentro de un layout propio (`VariantLayout.astro`) con Tailwind v4 scoped y dirección de diseño Tech/SaaS moderno (Linear/Vercel-like). La ruta original `/` —el cosmos orbital existente en `Dashboard.astro`— se mantiene intocada en-template y permite A/B testing y fallback. Se entrega: nueva ruta, layout y componentes aislados, wiring de Tailwind v4 vía `@tailwindcss/vite` (Plan A con verificación de no-leak), extracción mecánica de la data de los 10 proyectos a `src/data/projects.ts` compartida por ambas rutas, links recíprocos discretos y lazy mount + fallback DNS de WebGL para performance.

---

## 2. Intent & Motivation

**Por qué generar la variante:**

- **Showcase visual premium**: el portal actual es funcional pero no wow. Una variante con WebGL abstracto posiciona a GCB como referente técnico-institucional.
- **A/B testing de tono**: el cosmos orbital (clásico, cálido, orbital) vs un hero 3D moderno (partículas, parallax, grid Tech/SaaS) son dos lecturas válidas de la misma marca. Mantener ambas rutas permite comparar con stakeholders y usuarios sin comprometer la original.
- **Diferenciación**: `/` sigue siendo la cara institucional estable; `/variant` es la cara demo/portfolio. Mismo contenido, distintos lenguajes.
- **Elemento wow**: activo para portfolio, captación de clientes y conversaciones técnicas (charlas, networking). Justifica el stack Three.js en un SA (Sociedad Anónima) que invierte en su imagen digital.
- **No-deuda**: la variante es aditiva y aislada. No tocar el cosmos original significa riesgo de regresión ≈ 0 en la ruta principal.

---

## 3. Scope

### In Scope

- Nueva ruta `/variant` (`src/pages/variant.astro`).
- Layout propio `src/layouts/VariantLayout.astro` (no toca `Layout.astro`).
- Componentes variant en `src/components/variant/`: `Header.astro`, `Hero3D.astro`, `ProductGrid.astro`, `ProductCard.astro`, `Footer.astro`.
- Script Three.js en `src/scripts/variant/hero3d.ts` (import dinámico, lazy mount, fallback reduced-motion).
- Extracción de `planetDefs`, `orbitThemes`, `mobileOrbits` (y opcionalmente `stars`) del frontmatter de `Dashboard.astro` a `src/data/projects.ts`. `Dashboard.astro` importa desde ahí (refactor PURAMENTE mecánico).
- Tailwind v4 via `src/styles/variant.css` + `@theme` block, registrando `@tailwindcss/vite` en `astro.config.mjs` (Plan A: verificar no-leak con `yarn build` + diff).
- `tsconfig.json`: agregar aliases `@/*`, `@components/*`, `@layouts/*`, `@data/*`, `@scripts/*`, `@styles/*`.
- `package.json`: agregar `three` y `maath` como dependencias.
- Links recíprocos: link discreto en Footer de `/` (Dashboard) → `/variant`; link en Header de `/variant` → `/`.
- Paleta dark-first reusando gold/violet/blue existentes + neutros surface Linear-like, con soporte light mode vía mismo `localStorage` key (`gcb-theme`).
- Scroll-driven CSS: parallax del hero con `animation-timeline: scroll()` (fallback estático).
- Micro-detailing CSS: hover translateY, glow, backdrop-blur header, cubic-bezier(0.16, 1, 0.3, 1).

### Out of Scope

- No se borra ni refactoriza el template/lógica de `Dashboard.astro` (solo frontmatter: import en lugar de inline declaration).
- No se modifican tokens de la original (`global.css`, `--fd`, `--fb`, colores del cosmos).
- No se hidrata React en `/variant` — elección explícita (three vanilla + Astro client script).
- No se instala `@react-three/fiber`, `@react-three/drei`, `gsap`, `lenis`, `postprocessing`.
- No se agregan tests ni lint en este cambio (no existen hoy; deuda separada).
- No se toca `public/` ni assets existentes.
- No se cambia `src/pages/index.astro` (solo monta Dashboard).
- No se hace SEO avanzado en `/variant` (deuda abierta para un cambio futuro).

---

## 4. Proposed Approach

### 4.1 Estructura de archivos

(Estructura heredada de explore.md §2.1)

```
src/
├── pages/
│   └── variant.astro                 ← nueva ruta /variant
├── layouts/
│   └── VariantLayout.astro           ← layout propio
├── components/variant/
│   ├── Header.astro                  ← sticky + blur backdrop + theme toggle + link a /
│   ├── Hero3D.astro                  ← <canvas> + título hero + tagline + CTA scroll
│   ├── ProductGrid.astro             ← grid responsive de 10 ProductCard
│   ├── ProductCard.astro             ← card individual con accent color por grupo
│   └── Footer.astro                  ← © year + link recíproco /variant
├── scripts/variant/
│   └── hero3d.ts                     ← lógica Three.js (import dinámico desde variant.astro / Hero3D.astro)
├── data/
│   └── projects.ts                   ← planetDefs + orbitThemes + mobileOrbits (+stars opcional)
└── styles/
    └── variant.css                   ← @import "tailwindcss" + @theme block (tokens de la variante)
```

### 4.2 Hero3D — Gold Dust Field

- **Escena**: `BufferGeometry` con ~3000-5000 partículas gold dust distribuidas en sphere/shell con helpers de `maath` (`maath/random` y `maath/easing`).
- **Material**: `PointsMaterial` con `AdditiveBlending`, color `#C9A84C`, `sizeAttenuation: true`, `depthWrite: false`.
- **Parallax por mouse**: rotación del `Points` object mapeada a `mousemove` con lerp suave.
- **Animación**: `requestAnimationFrame` con delta clock (no `Math.random` por frame — drift estable y determinista para snapshots).
- **Lazy mount**: `IntersectionObserver` sobre el `<canvas>` — no inicializa WebGL context hasta que el hero está en viewport.
- **Pausa si no visible**: el mismo `IntersectionObserver` pausar el RAF al salir; resume al entrar.
- **`prefers-reduced-motion`**: si activo → no crear scene, el hero queda como gradient CSS animado (sin canvas).
- **WebGL no disponible**: si `canvas.getContext('webgl')` retorna null → mostrar fallback CSS (gradient + blur orbs).
- **`devicePixelRatio` clamp**: `Math.min(window.devicePixelRatio, 2)`.
- **Mobile throttle**: limitar a 30fps en mobile via frametime clamp (detectar `window.innerWidth < 768`).
- **Cleanup**: `dispose()` de geometries/materials + `renderer.dispose()` en `pagehide`/`visibilitychange`.

### 4.3 ProductGrid — DOM con accent color por grupo

- Grid responsive: 1-col mobile, 2-col tablet, 3-col desktop, 4-col wide (Tailwind classes).
- 10 `ProductCard` con `label`, `desc`, `grupo` (Refugio Data / Sistema / Descarga / Herramienta → accent color), `url` externa.
- Hover: `translateY(-2px)`, `box-shadow`, `border-color` gold 0.5, cubic-bezier(0.16, 1, 0.3, 1) 200ms.
- Focus-visible para accesibilidad. `target="_blank"` + `rel="noopener"` en links externos.

### 4.4 Tailwind v4 scoped — Plan A

- `src/styles/variant.css`: `@import "tailwindcss"` + `@theme` block con tokens de la variante (ver explore §4.1).
- `astro.config.mjs`: registrar `@tailwindcss/vite` en el array `vite.plugins`.
- **Verificación de no-leak (MANDATORY)**: `yarn build` + diff del HTML/CSS bundle de `/` antes/después del cambio. Los computed styles de `body` en `/` no deben cambiar.
- **Fallback Plan B (si leak detectado en implementación)**: revertir `astro.config.mjs`, escribir las utility classes a mano en `variant.css`. No Filtra nada porque Tailwind no procesa nada.

### 4.5 Scroll-driven CSS

- Parallax del hero: `animation-timeline: scroll()` sobre un keyframe `transform: translateY()`.
- Fallback: si `animation-timeline` no soportado → hero estático (aceptable, no crítico para el wow).
- 0 bytes JS, 0 dependencias.

### 4.6 Links recíprocos

- Footer de `/` (Dashboard): `<a href="/variant">Variante 3D</a>` sutil junto al © year.
- Header de `/variant`: link "Portal original" → `/` con icono opcional.

### 4.7 Theme toggle

- Reusar el mismo mecanismo de `Dashboard.astro` (localStorage key `'gcb-theme'`, valores `'dark'` | `'light'`).
- CSS del VariantLayout usa custom properties que se redefinen bajo `[data-theme="light"]`. Cambios live sin reload.

---

## 5. Modules / Files Affected

| Archivo | Estado | Cambio |
|---|---|---|
| `src/pages/variant.astro` | **NUEVO** | Página nueva, monta VariantLayout. |
| `src/layouts/VariantLayout.astro` | **NUEVO** | Layout propio: imports `variant.css`, declara `<style is:global>` restringido a la variante, render slot. |
| `src/components/variant/Header.astro` | **NUEVO** | Header sticky + blur backdrop + theme toggle + link `/`. |
| `src/components/variant/Hero3D.astro` | **NUEVO** | `<canvas>` + título hero + tagline + CTA scroll. |
| `src/components/variant/ProductGrid.astro` | **NUEVO** | Grid responsive de 10 ProductCard. |
| `src/components/variant/ProductCard.astro` | **NUEVO** | Card individual con accent color por grupo. |
| `src/components/variant/Footer.astro` | **NUEVO** | Footer minimal con © year. |
| `src/scripts/variant/hero3d.ts` | **NUEVO** | Lógica Three.js — import dinámico, lazy mount, fallback, cleanup. |
| `src/data/projects.ts` | **NUEVO** | `planetDefs`, `orbitThemes`, `mobileOrbits` (y opcional `stars`) extraídos del frontmatter de Dashboard.astro. |
| `src/styles/variant.css` | **NUEVO** | `@import "tailwindcss"` + `@theme` block con tokens de la variante. |
| `src/components/Dashboard.astro` | **MODIFICADO** | Frontmatter solo: declaraciones de `planetDefs`/`orbitThemes`/`mobileOrbits` reemplazadas por import desde `src/data/projects.ts`. Template y lógica del orbital engine intactos. |
| `src/components/Dashboard.astro` (footer) | **MODIFICADO** | Link recíproco a `/variant` agregado al lado del © year. |
| `astro.config.mjs` | **MODIFICADO** | Registrar `@tailwindcss/vite` en `vite.plugins` (Plan A — con verificación no-leak). |
| `tsconfig.json` | **MODIFICADO** | Agregar `baseUrl` y `paths` aliases para DX. |
| `package.json` | **MODIFICADO** | Agregar deps `three` y `maath`. |
| `src/pages/index.astro` | **NO AFECTADO** | Sigue montando Dashboard sin cambios. |
| `src/styles/global.css` | **NO AFECTADO** | Intacto. |
| `src/layouts/Layout.astro` | **NO AFECTADO** | Intacto. |
| `public/*` | **NO AFECTADO** | Intacto. |

---

## 6. Rollback Plan

Filosofía: **`/` SIEMPRE sigue servida. `/variant` puede destruirse por completo si algo rompe.** Diseño de bajo riesgo.

**Variables de rollback (independientes):**

1. **Si Tailwind filtra a `/` (Preflight leak detectado en QA)**:
   - Revertir `astro.config.mjs` (sacar `@tailwindcss/vite`).
   - Borrar `src/styles/variant.css` (o reducirlo a CSS manual sin Tailwind — Plan B).
   - `/` queda 100% intacta. `/variant` pierde Tailwind pero puede seguir vivo si reescribimos utility classes a mano.

2. **Si `three` falla en runtime** (WebGL crash, memory leak, bajo FPS en desktop):
   - `hero3d.ts` ya tiene try/catch con fallback CSS (gradient + blur orbs) — el usuario ve el hero sin canvas, sin error visible.
   - Si el error es sistémico: comentar el `<script>` que mounta el canvas en `Hero3D.astro`. El hero queda estático pero la ruta sigue funcional.

3. **Si la extracción de data rompe `Dashboard.astro`** (typo, missing export, runtime error en el orbital engine):
   - `git checkout src/components/Dashboard.astro` → restaurar el frontmatter inline.
   - `src/data/projects.ts` queda sin consumer (puede borrarse o quedarse para reintento).

4. **Si `yarn build` falla completamente** (wiring roto, import cycle, tipo error):
   - Borrar `src/pages/variant.astro` + `src/components/variant/*` + `src/scripts/variant/*` + `src/layouts/VariantLayout.astro`.
   - Revertir `astro.config.mjs`, `tsconfig.json`, `package.json` (o mantener `three`/`maath` instalados sin usar — no rompen nada).
   - `/` sigue servida sin cambios.

5. **Si el link recíproco en Dashboard rompe el footer visual**:
   - `git checkout src/components/Dashboard.astro` (solo el footer) → sacar el link a `/variant`.
   - `/variant` queda accesible solo via URL directa (subóptimo pero no bloquea).

**Compromiso**: el cambio es **destruir-`/variant`-para-salvar-`/`**. No hay escenario donde `/` deje de servirse por culpa de este cambio.

---

## 7. Acceptance Criteria

- [ ] `yarn build` limpio sin warnings nuevos.
- [ ] `/` renderiza identico al estado pre-cambio (QA visual + diff de estilos computados en `body` y elementos del cosmos).
- [ ] `/variant` carga con hero 3D (partículas doradas visibles en desktop Chrome/Firefox/Edge).
- [ ] `/variant` parallax por mouse activo (rotación suave del campo de partículas siguiendo cursor).
- [ ] `/variant` en móvil: lazy-mount + throttle 30fps + no heat excesivo (devtools perf ≤ 40°C reported).
- [ ] `prefers-reduced-motion: reduce`: hero sin WebGL, solo gradient CSS animado.
- [ ] WebGL no disponible (devtools emulación): hero muestra fallback CSS sin errores en consola.
- [ ] Theme toggle funciona en `/variant` con mismo localStorage key (`gcb-theme`); cambia colores live sin reload.
- [ ] Links recíprocos presentes: Footer de `/` linkea `/variant`; Header de `/variant` linkea `/`.
- [ ] Lighthouse `/variant` performance ≥ 85 (slow 3G mobile preset).
- [ ] Bundle JS de `/variant` < 150 KB gzipped total (three chunk separado + script hero + Astro runtime).
- [ ] Cards focusables con `focus-visible` y links externos tienen `target="_blank" rel="noopener"`.
- [ ] Canvas del hero tiene `aria-hidden="true"` (no bloquea screen readers).
- [ ] Sin regressión visual en `Dashboard.astro` tras la extracción de data.

---

## 8. Risks

Heredados de `explore.md`:

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| 1 | WebGL no disponible en dispositivo | Baja (95%+ soporte) | Medio | Fallback DOM con gradient CSS en hero. Script detecta `canvas.getContext('webgl')` null. |
| 2 | Data drift entre `/` y `/variant` | Nula (extracción aplica) | N/A | `src/data/projects.ts` como single source of truth. Misma data compartida. |
| 3 | Tailwind Preflight filtra a `/` | Media | Alto | Verificación con `yarn build` + diff. Si filtra → Plan B (manual CSS, revertir `astro.config.mjs`). |
| 4 | `requestAnimationFrame` cleanup leak | Baja (1 ruta) | Bajo | `pagehide` + `visibilitychange` + `cancelAnimationFrame` en cleanup. Preventivo. |
| 5 | Bundle Three.js (~80 KB gz) | Cierta | Medio | Import dinámico + lazy mount con IntersectionObserver. No bloquea primer paint. |
| 6 | Heat en mobile con WebGL | Media | Medio | `prefers-reduced-motion` + lazy mount + frametime clamp a 30fps en mobile. |
| 7 | `animation-timeline: scroll()` no soportado | Media (old browsers) | Bajo | Fallback estático. No crítico para el wow. |
| 8 | React + Framer Motion zombies en `package.json` | Cierta | Nulo | No se usan en `/variant`. Deuda separada. |

**Riesgo nuevo (agregado):**

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| 9 | El equipo/stakeholders confunden `/variant` como sustitución de `/` | Media | Medio | Footer link discreto (no CTA agresivo). Comentario en `README.md` de la variante aclarando que es showcase/A-B, no reemplazo. README debe listar las dos rutas con su intención. |

---

## 9. Dependencies to install

Verificado via Context7 (`/mrdoob/three.js`, `/pmndrs/maath`):

| Paquete | Versión recomendada | Justificación | Compatibilidad |
|---|---|---|---|
| `three` | `^0.169.0` (o latest estable al momento de apply) | Stack 3D core. Import dinámico + tree-shaking selectivo → ~80 KB gz en el chunk dedicado. | ESM. Compatible con Node v24 + Astro 6.1 + Vite. Sin peer deps runtime. |
| `maath` | `latest` (peer dep `three >= 0.134.0` — satisfecho) | Helpers para partículas (`maath/random` sphere distribution) y easing. ~5 KB gz. | Peer: `three@>=0.134.0` + `@types/three` correspondiente. |

**NO se instalan**:
- `@react-three/fiber`, `@react-three/drei` — el usuario eligió three vanilla.
- `gsap`, `lenis` — CSS scroll-timeline + RAF interno suficientes.
- `postprocessing` — añade 40-60 KB y setup complejo. Partículas con additive blending dan el wow.

**`@types/three`**: incluir como devDependency para TS strict (el proyecto usa TS strict). Verificar compatibilidad con la versión de `three` elegida (versiones alineadas).

**Acción durante apply**: previo a `yarn add`, confirmar la última release publicada de `three` (`npm view three version`) y la última de `maath` (`npm view maath version`), y pin en `package.json` con caret. Si aparecen versiones major nuevas entre este proposal y apply, auditar changelog por breaking changes (sobre todo `three` rXX → r(X+1)XX suele renombrar APIs internas).

---

## 10. Estimated effort / phases

| Fase | Sesiones | Entrega |
|---|---|---|
| `sdd-spec` | 1 | Spec formal con requirements + escenarios (delta spec). |
| `sdd-design` | 1 | Diseño técnico: arquitectura hero3d.ts, data flow, decisions records. |
| `sdd-tasks` | 1 | Task breakdown checklist para apply. |
| `sdd-apply` | 2-3 | Wiring (astro.config, tsconfig, tailwind) + componentes (Header/Footer/Grid/Card) + Hero3D + grid + polish + verificación no-leak. |
| `sdd-verify` | 1 | Validación vs spec + design + tasks. |
| **Total** | **~6-8 sesiones** | Variante `/variant` completa y `/` intacta. |

---

## 11. Open Questions — Resolved

Las 6 open questions del `explore.md` (§9) se resuelven así (decisiones del usuario, override cualquier ambigüedad):

| # | Question en explore.md | Decisión del usuario |
|---|---|---|
| 1 | Plan B Tailwind: si `@tailwindcss/vite` filtra Preflight, ¿Plan B o Plan A con verificación? | **Plan A** — registrar `@tailwindcss/vite` en `astro.config.mjs`, verificar no-leak a `/` con `yarn build` + diff. Si leak detectado durante implementación → caer a Plan B (manual CSS sin Tailwind en la variante). |
| 2 | Extracción de data: ¿aprobaron tocar el frontmatter de `Dashboard.astro`? | **SÍ** — extraer `planetDefs`, `orbitThemes`, `mobileOrbits` (y opcionalmente `stars`) del frontmatter de `Dashboard.astro` a `src/data/projects.ts`. `Dashboard.astro` importa desde ahí. Refactor MÍNIMO y mecánico (mismo array, mismas keys, sin alterar lógica ni template). |
| 3 | Acceso recíproco: ¿links recíprocos o solo URL directa? | **SÍ, recíprocos** — link en Footer de `/` (Dashboard) → `/variant`; link en Header de `/variant` → `/`. |
| 4 | Hero 3D: confirmar ¿partículas doradas + morph por mouse? | **SÍ, partículas doradas + parallax por mouse** (gold dust field). Abstracto, no-representacional. NO orbital, NO cards 3D, NO wireframe. |
| 5 | Scroll-driven CSS: `animation-timeline: scroll()` o evitarlo por compatibilidad? | **SÍ, `animation-timeline: scroll()`** con fallback estático (graceful degradation). 0 bytes JS. |
| 6 | `maath`: ¿sí o no? | **SÍ** — incluir `maath` para helpers de partículas. |

---

## 12. Próxima fase

Ready for **`sdd-spec`** — redactar el delta spec con requirements (funcionales + no funcionales) y escenarios (WebGL disponible, WebGL no disponible, reduced-motion, mobile, theme toggle, navegación recíproca).
