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
  'b-refugio': { x: 420, y: 500 },
  'b-channels': { x: 1180, y: 500 },
  'b-bosque': { x: 580, y: 275 },
  'b-ai': { x: 1030, y: 275 },
  'b-sisa': { x: 1030, y: 705 },
  'b-infra': { x: 580, y: 705 },
};

/** Posición de las 14 hojas (lo único que vive aquí; el contenido viene de projects.ts). */
export const leafPositions: Record<string, NodePosition> = {
  'p-proc': { x: 160, y: 130 },
  'p-del': { x: 160, y: 330 },
  'p-com': { x: 160, y: 530 },
  'p-docgcb': { x: 160, y: 730 },
  'p-kiosk': { x: 1450, y: 150 },
  'p-runner': { x: 1450, y: 390 },
  'p-agenda': { x: 1450, y: 630 },
  'p-bosque': { x: 430, y: 110 },
  'p-bosque-adm': { x: 730, y: 110 },
  'p-ai': { x: 1030, y: 110 },
  'p-sisa': { x: 960, y: 890 },
  'p-sisa-reg': { x: 1230, y: 890 },
  'p-est': { x: 420, y: 890 },
  'p-conc': { x: 690, y: 890 },
};
