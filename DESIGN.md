# DESIGN.md — portal-gcb

> Sistema visual registrado (impeccable `document`). La implementación sigue este archivo; cambiar el diseño intencionalmente = actualizarlo.

## Marca

- Type-driven (sin logo vectorial; monograma JPG en `public/logo-gcb.jpg` usado con tratamiento §Header).
- Nombre en gradiente firma: `linear-gradient(135deg, #C9A84C 0%, #9B6DFF 50%, #3CC9A4 100%)`.
- Tono: sobrio, institucional, financiero. Sin emoji, sin coloquialismos.

## Paleta

Tokens compartidos en `src/styles/tokens.css` (importado por ambos layouts;
claro por defecto, oscuro vía `html.dark` o `html[data-theme='dark']`).
No duplicar tokens en componentes.

| Token | Valor | Uso |
|---|---|---|
| `--gold` | `#C9A84C` | Accent primario, órbita inner / Refugio Data |
| `--gold-dark` | `#A8834A` | Hover states del accent |
| violet | `#9B6DFF` | Órbita middle / Sistemas & Apps |
| blue | `#4A9EFF` | Órbita outer / Herramientas |
| green | `#3CC9A4` | Canales & Despacho |
| bg light | `#F8F5EF` | Fondo claro |
| text light | `#1C1814` | Texto en claro |
| bg dark | `#0A0A0A` | Fondo oscuro |
| text dark | `#F5EDD8` | Texto en oscuro |

La variante `/variant` reusa estos accents con superficies propias (`src/styles/variant.css`, `@theme`).

## Tipografía

- Display: **Work Sans** 400/600/700 (`--fd`). Títulos y brand.
- Body: **Manrope** 400/500/600 (`--fb`). Texto denso y UI.
- Servidas vía `@fontsource` (self-hosted, sin preconnect externo).

## Layout

- Header sticky: brand (logo + nombre + sub) + switch de vista (mapa/órbita) + estado + theme toggle.
- Vista primaria `/`: mapa semántico (árbol corporativo); vista secundaria: cosmos orbital.
- Footer: © + link recíproco discreto a `/variant`.
- Grid `/variant`: 1-col mobile → 2 tablet → 3 desktop → 4 wide (Tailwind).

## Componentes

- Cards (`mob-card`, `variant-card`, `sem-leaf`): superficie + borde sutil; hover = `translateY(-2px)` + glow del accent + borde fuerte. Focus-visible siempre visible.
- Links externos: `target="_blank"` + `rel="noopener"`.
- Canvas decorativos: `aria-hidden="true"`, nunca bloquean screen readers.

## Motion (emilkowalski)

- Entrada `ease-out`, salida `ease-in`. Nunca `ease-in` para aparecer.
- Micro-interacciones 150–250 ms. View-switch 200 ms `ease-out`.
- Elevación con sombras semitransparentes, no bordes sólidos.
- Solo se anima lo que comunica (switch, toggle, scroll-cue). Decoración estática por defecto.
- `prefers-reduced-motion: reduce` deshabilita WebGL y animaciones decorativas.

## Mobile-native

- Sin sticky hovers (solo `:hover` donde hay puntero fino); tap-highlight transparente.
- Alturas con `svh`/`dvh`, nunca `100vh` crudo.
- Safe-areas respetadas; sin zoom forzado en inputs (`font-size ≥ 16px`).
