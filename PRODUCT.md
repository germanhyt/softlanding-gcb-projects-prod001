# PRODUCT.md — portal-gcb

> Registro vivo del producto (impeccable `init`). Actualizar cuando cambien audiencia, tarea o constraints.

## Producto

Portal central de sistemas de **Grupo Cordillera Blanca SA** (GCB): launcher corporativo + showcase de portfolio.

## Audiencia

1. **Empleados y clientes B2B**: entran a diario a los 10 sistemas sin recordar URLs.
2. **Stakeholders / potenciales clientes**: evalúan el portfolio de GCB.

## Tarea principal

Encontrar un sistema y abrirlo en ≤ 2 clics, en desktop y en móvil.

## Constraints (no negociables)

- Las URLs de los sistemas son **reales y productivas**: no inventar disponibilidad ni estados.
- Data de productos: single source of truth en `src/data/projects.ts`.
- Layout del mapa: `src/data/map-layout.ts` es el mapa base. El drag persiste por navegador en `localStorage` (`gcb-map-layout-v1`); el botón "Copiar layout" exporta el JSON listo para pegar y commitear como nuevo base.
- Tono institucional AR (`lang="es"`, "SA", sin emoji).
- Rutas: `/` (portal estable) y `/variant` (showcase A/B con Three.js). `/` nunca se rompe por cambios en `/variant`.
- Ruta `/presentacion`: portada (logo + nombre + scroll cue animado) y sección de mapa semántico radial con transiciones GSAP (ScrollTrigger, code-split solo en esta ruta).
- Tema dark/light persiste en `localStorage` key `gcb-theme` (`dark` por defecto).
