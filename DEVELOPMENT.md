
============================

Core Framework
✅ Astro 
✅ React 18 + React DOM
✅ TypeScript
Estilos
✅ Tailwind CSS 3 (versión estable)
✅ @tailwindcss/typography
✅ PostCSS
✅ Autoprefixer
Fuentes
✅ @fontsource/work-sans (Títulos)
✅ @fontsource/manrope (Texto)
Librerías de UI
✅ Framer Motion (Animaciones)
✅ Swiper (Carousels)
✅ SweetAlert2 (Alertas)


============================

Refactorización
- Aplicamos una variante de los estilos para que sea más vivo el proyecto considerando los diferentes colores del logo
- Además colocamos los diferentes proyecto alrededor del títulos "Grupo Cordillera Blanca SA - Proyectos", similara un sistema planetaario pero que sea profesional, aplicando diferentes animaciones y estilos para que sea más atractivo


============================

Light mode por defecto + toggle dark mode
- Se eliminó el logo en header, centro del cosmos y sección móvil; solo aparece el nombre "Grupo Cordillera Blanca SA"
- El nombre de la empresa en header y centro del cosmos usa un degradado multicolor (dorado → violeta → verde → naranja), tomado de los colores de los planetas del logo
- Light mode activado por defecto; botón luna/sol en el header permite alternar a dark mode (preferencia guardada en localStorage)
- Variables CSS --bg, --text, --muted, --dim, --border, --hdr-bg, --tip-bg, --card-bg, --body-bg, etc. controlan todos los colores en ambos modos
- global.css actualizado para reflejar el fondo claro en el body por defecto

