# Proposal: mejora UI/UX del portal GCB — `gcb-ui-ux`

**Change**: `gcb-ui-ux`
**Mode**: `openspec`
**Date**: 2026-10-01
**Branch**: `master` (base: `e4d5202`, working tree limpio)
**Predecessors**: `variant-threejs` (explore, proposal, spec — implementado y pusheado)

---

## 1. Title & Summary

Propuesta de mejora de UI/UX del portal de Grupo Cordillera Blanca SA aplicando dos fuentes de criterio explícitas: los skills de [emilkowalski/skills](https://github.com/emilkowalski/skills) (gusto en motion y diseño: easings, duraciones, sombras vs bordes, `mobile-native`) y el workflow de [impeccable.style/designing](https://impeccable.style/designing/) (critique → generate → polish → audit/harden, con registro en `PRODUCT.md` / `DESIGN.md`). Incluye integrar el logo real del proyecto (`public/logo-gcb.jpg`, hoy sin usar) al header en lugar del badge de texto actual. No se implementa nada en este change: solo se acuerda el plan y los criterios de aceptación.

## 2. Intent & Motivation

El portal creció rápido y acumuló tres vistas del mismo contenido (`/` cosmos orbital, mapa semántico primario, `/variant` hero 3D) más dos componentes sin montar. Sin una pasada de criterio explícito, cada vista diverge en motion, tokens y datos. Esta propuesta fija **un solo set de reglas de gusto** (emilkowalski) y **un solo workflow de diseño** (impeccable) antes de tocar más UI, para que `/`, `/variant` y futuras vistas compartan lenguaje.

## 3. Design foundations (fuentes de criterio)

### 3.1 emilkowalski/skills — reglas de gusto vinculantes

- **Easings correctos por intención**: entrada `ease-out`, salida `ease-in`, según `emil-design-eng`. Auditar cada `transition`/`animation` del portal contra esta regla.
- **Duraciones**: micro-interacciones 150–250 ms; nada de 500 ms+ en hovers de cards.
- **Sombras > bordes sólidos**: preferir sombras semitransparentes para elevación en lugar de bordes sólidos (aplica a `ProductCard`, `mob-card`, `sem-leaf`).
- **Motion con propósito** (`find-animation-opportunities`): animar solo lo que comunica (view-switch, theme toggle, scroll-cue). No animar decoración por defecto.
- **`mobile-native`**: sticky hover states, tap-highlight, bug `100vh` (usar `svh`/`dvh`), inputs que hacen zoom, safe-areas, taps con lag. Pasar la checklist completa en `/` y `/variant`.
- **`review-animations`**: revisión estricta final de todas las animaciones contra estas reglas antes de cerrar el change.

### 3.2 impeccable.style/designing — workflow

- **Critique primero** (§4 de esta propuesta es el seed): diagnosticar qué frena el diseño antes de generar variantes.
- **Mejora focalizada, no redesign**: mantener la identidad (gold `#C9A84C`, Work Sans + Manrope, type-driven) salvo decisión explícita.
- **Check pre-release**: `audit` (a11y, performance, responsive, theming, anti-patterns) + `clarify` (labels, estados vacíos, errores) + `polish` (jerarquía, spacing, consistencia).
- **Maintain**: registrar decisiones en `PRODUCT.md` (audiencia, tarea, constraints) y `DESIGN.md` (paleta, tipo, layout, componentes) para que el próximo cambio no re-deriva el sistema.

## 4. Critique seed (hallazgos verificados en el árbol actual)

| # | Hallazgo | Evidencia | Skill que lo ataca |
|---|---|---|---|
| C1 | Mapa de iconos SVG **triplicado** (mismo set `db/refugio/truck/chart/doc/park/screen/play/ai/bal/cal` en 3 archivos) | `Dashboard.astro` frontmatter, `SemanticMap.astro:30-42`, `CorporateHub.astro:5-40` | impeccable `extract` |
| C2 | **Data drift**: `SemanticMap` hardcodea ramas/hojas con nombres, descripciones y coordenadas propias que ya divergen de `projects.ts` (que sumó `badge/tag/domain` en `e4d5202`) | `SemanticMap.astro:48-77` vs `src/data/projects.ts` | impeccable `extract` + single source |
| C3 | **Código muerto**: `CorporateHub.astro` (783 líneas, 22 KB) sin ningún import en `src/`; `SemanticFlow.tsx` + dependencia `@xyflow/react` sin montar en ninguna ruta | grep `CorporateHub\|SemanticFlow` en `src/` → 0 consumers | impeccable `audit` (anti-patterns) |
| C4 | **Logo sin usar**: `public/logo-gcb.jpg` (monograma GCB negro sobre blanco, 8,5 KB) no referenciado; el header usa badge de texto `GCB` | `Dashboard.astro` header `.hd-logo-badge`; `git log` muestra el jpg recién agregado sin consumer | propuesta §6.1 |
| C5 | **Doble tratamiento de marca**: badge texto en `/` vs gradiente texto en `/variant`; sin `DESIGN.md` que fije cuál es canónico | `Dashboard.astro` vs `variant/Header.astro` | impeccable `document` |
| C6 | View-switch mapa↔cosmos sin transición declarada visible en el diff (cambio brusco `display:none`) — viola regla ease/duration | `Dashboard.astro` `#view-map` / `#view-cosmos` | `emil-design-eng`, `animate` |
| C7 | Sin `PRODUCT.md`: audiencia/tarea/constraints del portal solo existen en memoria de sesión | raíz del proyecto | impeccable `init` |
| C8 | Chunk `three` 717 KB sin comprimir dispara warning de Vite en build (solo afecta `/variant`, cargado lazy, pero sobrepasa el budget REQ-P01 de 150 KB gz si el gzip no lo baja lo suficiente) | `dist/_astro/three.module.*.js`, output `yarn build` | impeccable `audit` (performance) |

## 5. Scope

### In scope

- `PRODUCT.md` + `DESIGN.md` (registros vivos del producto y del sistema visual).
- Integración del logo `logo-gcb.jpg` al header (con tratamiento dark/light, §6.1).
- Unificación de iconos SVG en un solo módulo compartido.
- Unificación de datos del mapa semántico sobre `projects.ts` (eliminar hardcode divergente).
- Decisión + ejecución sobre código muerto (conectar o eliminar `CorporateHub` / `SemanticFlow` + `@xyflow/react`).
- Motion pass completo según §3.1 (easings, duraciones, sombras, view-switch, theme toggle).
- `mobile-native` pass en `/` y `/variant`.
- Cierre con `review-animations` + `audit` + `polish`.

### Out of scope

- Rediseño de la identidad (paleta, tipografías y tono type-driven se mantienen).
- Tocar la escena Three.js de `/variant` (solo motion/DOM perimetral si el audit lo pide).
- SEO avanzado, tests, lint (deudas separadas ya registradas).
- Eliminar `Welcome.astro` / assets boilerplate (limpieza separada).

## 6. Proposed approach (fases, en orden impeccable)

1. **Critique**: formalizar §4 contra la UI corriendo (`http://localhost:4321/` + `/variant`), elegir por dónde empezar.
2. **Logo (§6.1)**: integrar `logo-gcb.jpg` al header con tratamiento para dark/light + `alt` + tamaños. Si el contraste falla, pedir SVG antes de forzar el JPG.
3. **Registros**: escribir `PRODUCT.md` (audiencia: empleados/clientes B2B + stakeholders; tarea: entrar a 10 sistemas sin recordar URLs; constraints: URLs reales, sin inventar disponibilidad) y `DESIGN.md` (tokens, tipo, header/footer, cards, motion).
4. **Extract**: unificar iconos (`src/data/icons.ts` o módulo compartido) y datos del mapa sobre `projects.ts`; los 3 consumers importan, ninguno declara.
5. **Dead-code decision** (requiere decisión humana, §9.1): conectar `CorporateHub`/`SemanticFlow` a una ruta o eliminarlos + quitar `@xyflow/react` si queda sin uso.
6. **Motion pass** (emilkowalski): easings/duraciones/sombras en cards, view-switch con transición `ease-out` 200 ms, theme toggle, scroll-cue. Prototipar variantes con `prototype` si hay divergencia de gusto.
7. **Mobile-native pass**: checklist `mobile-native` en ambas rutas (sticky hover, tap highlight, `svh`, safe-area, zoom de inputs).
8. **Check**: `review-animations` + `audit` + `clarify` + `polish`; `yarn build` limpio; QA visual `/` sin regresión.

### 6.1 Logo — tratamiento propuesto

`logo-gcb.jpg` es monograma negro sobre fondo blanco: en dark mode un `<img>` directo rompe. Opciones en orden de preferencia: (a) conseguir el SVG/marca en vector y usar `currentColor`; (b) máscara CSS con `filter: invert()` solo en dark + esquinas redondeadas sutiles; (c) badge contenedor claro permanente. Decisión en fase 2 con prueba visual en ambos temas. El header de `/variant` adopta el mismo tratamiento para consistencia (hoy usa solo texto en gradiente).

## 7. Files affected (estimado)

- NUEVOS: `PRODUCT.md`, `DESIGN.md`, `src/data/icons.ts` (o equivalente).
- MODIFICADOS: `Dashboard.astro` (header logo + view-switch motion), `SemanticMap.astro` (datos vía `projects.ts`, iconos vía módulo), `CorporateHub.astro` o eliminado, `src/components/react/SemanticFlow.tsx` o eliminado, `variant/Header.astro` (logo), `src/styles/*` (tokens/motion), `package.json` (quitar `@xyflow/react` solo si §9.1 lo aprueba).
- NO TOCAR: escena `hero3d.ts`, `Layout.astro`, `global.css` salvo que el audit lo exija con justificación.

## 8. Rollback plan

Cada fase es un commit separado sobre `master`: revert por fase con `git revert`. El logo y el motion son los únicos cambios visuales en `/`; si hay regresión visual, revert del commit de esa fase deja el resto intacto. La decisión de código muerto (§9.1) se ejecuta en commit aislado para revert limpio.

## 9. Open questions

1. **Código muerto**: ~~¿eliminamos o montamos?~~ **RESUELTO (2026-10-01)**: eliminar — "si no es necesario y no se usan en el proyecto, lo quitamos". Se borran `CorporateHub.astro`, `src/components/react/SemanticFlow.tsx` (+ directorio si queda vacío) y `src/styles/semantic-flow.css` si no tiene consumers, y se quita `@xyflow/react` de `package.json`, todo en commit aislado.
2. **Logo**: ¿existe el logo en SVG/vector? El JPG negro-sobre-blanco limita el tratamiento en dark mode.
3. **Vista canónica**: ¿el mapa semántico queda como vista primaria de `/` (estado actual) o vuelve el cosmos orbital? Define qué vista recibe el motion pass prioritario.
4. **Vista `/variant`**: ¿entra al motion pass de este change o queda congelada como experimento A/B?

## 10. Acceptance criteria

- [ ] `PRODUCT.md` y `DESIGN.md` existen y reflejan lo implementado.
- [ ] Logo visible en header de `/` en dark y light sin ruptura de contraste; `/variant` consistente.
- [ ] Un solo módulo de iconos importado por los 3 consumers (grep: 1 definición).
- [ ] `SemanticMap` consume `projects.ts` (cero datos de productos hardcodeados divergentes).
- [ ] Decisión §9.1 ejecutada (cero código muerto o ruta que lo monte, con `yarn build` limpio).
- [ ] Motion audit: toda transición con easing/duración según §3.1; view-switch animado; `review-animations` sin BLOCKERs.
- [ ] `mobile-native` checklist pasada en `/` y `/variant` (dispositivo real o emulación documentada).
- [ ] `yarn build` sin warnings nuevos; `/` sin regresión visual salvo deltas aprobados.
- [ ] Commit(s) en `master` + push (convencional, sin atribución AI).

## 11. Risks

| Riesgo | Mitigación |
|---|---|
| JPG en dark mode se ve mal | Decisión §9.2 primero; fallback a badge actual si no hay vector |
| Unificar datos rompe el mapa (coords hardcodeadas) | Las coords x/y se quedan en el mapa como layout; solo nombres/desc/URLs vienen de `projects.ts` |
| Eliminar código que alguien usa en rama local | Pregunta §9.1 explícita antes de borrar; commit aislado |
| Scope creep (rediseño total) | Regla impeccable: mejora focalizada; redesign solo con decisión explícita |
