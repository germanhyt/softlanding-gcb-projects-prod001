/* ── Mapa de coordenadas del mapa semántico ──
   Single source of truth del layout (single source of truth, ver DESIGN.md).
   Flujo: acomodá los nodos a gusto en el tablero y botón "Guardar layout"
   (persiste aquí vía /api/save-layout en dev; en producción cae a clipboard).
   Ese pasa a ser el mapa base para todos. */

export interface NodePosition {
  x: number;
  y: number;
}

/** Centro del lienzo 1600×1000 (hub fijo, no arrastrable). */
export const MAP_CENTER: NodePosition = { x: 800, y: 500 };

/** Posición de los 6 pilares. */
export const branchPositions: Record<string, NodePosition> = {
  'b-refugio': { x: 430, y: 500 },
  'b-channels': { x: 1170, y: 500 },
  'b-entretenimiento': { x: 730, y: 285 },
  'b-ai': { x: 1010, y: 285 },
  'b-reservas': { x: 730, y: 705 },
  'b-finanzas': { x: 1300, y: 700 },
};

/** Posición de las 14 hojas (lo único que vive aquí; el contenido viene de projects.ts). */
export const leafPositions: Record<string, NodePosition> = {
  'p-proc': { x: 150, y: 130 },
  'p-del': { x: 150, y: 330 },
  'p-com': { x: 150, y: 530 },
  'p-docgcb': { x: 150, y: 730 },
  'p-kiosk': { x: 1440, y: 315 },
  'p-runner': { x: 1440, y: 525 },
  'p-bosque': { x: 440, y: 112 },
  'p-bosque-adm': { x: 730, y: 112 },
  'p-agenda': { x: 1010, y: 112 },
  'p-ai': { x: 1300, y: 112 },
  'p-est': { x: 450, y: 890 },
  'p-sisa': { x: 730, y: 890 },
  'p-sisa-reg': { x: 1010, y: 890 },
  'p-conc': { x: 1300, y: 880 },
};
