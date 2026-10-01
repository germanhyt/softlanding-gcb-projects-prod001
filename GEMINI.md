# Directrices de Autonomía y Desarrollo — portal-gcb

## Comportamiento del Asistente

- **Sé proactivo y autónomo:** No pidas confirmación para pasos intermedios, refactorizaciones menores, correcciones de errores, imports o comandos de verificación (`yarn build`, `git status`, etc.).
- **Toma decisiones razonadas:** Si hay detalles técnicos estándar (convenciones de nombres, rutas relativas, estilos visuales afines), decide e impleméntalo directamente.
- **Cuándo preguntar:** Pregunta únicamente si:
  1. Hay una decisión de arquitectura que cambie drásticamente el proyecto.
  2. Existe riesgo de pérdida de datos o sobrescritura destructiva no recuperable.
  3. Hay ambigüedad en los requerimientos de negocio.
- **Acción antes que consulta:** Si el usuario da una instrucción general ("despliega esto", "haz commit", "corrige el build", "sube los cambios"), ejecuta el flujo completo de principio a fin (incluyendo validación y build) antes de devolver la respuesta final.
