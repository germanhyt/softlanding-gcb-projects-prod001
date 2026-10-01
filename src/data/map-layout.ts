/* ── Mapa de coordenadas del mapa semántico ──
   Single source of truth del layout (single source of truth, ver DESIGN.md).
   Flujo: acomodá los nodos a gusto en el tablero, botón "Copiar layout",
   pegá el JSON aquí y commiteá. Ese pasa a ser el mapa base para todos. */

export interface NodePosition {
  x: number;
  y: number;
}

/** Centro del lienzo 1440×940 (hub fijo, no arrastrable). */
export const MAP_CENTER: NodePosition = { x: 720, y: 470 };

/** Posición de los 4 pilares. */
export const branchPositions: Record<string, NodePosition> = {
  'b-refugio': { x: 450, y: 470 },
  'b-channels': { x: 990, y: 470 },
  'b-ai': { x: 720, y: 250 },
  'b-infra': { x: 720, y: 640 },
};

/** Posición de las 10 hojas (lo único que vive aquí; el contenido viene de projects.ts). */
export const leafPositions: Record<string, NodePosition> = {
  'p-proc': { x: 170, y: 130 },
  'p-del': { x: 190, y: 350 },
  'p-com': { x: 190, y: 570 },
  'p-docgcb': { x: 170, y: 790 },
  'p-kiosk': { x: 1260, y: 250 },
  'p-runner': { x: 1240, y: 470 },
  'p-agenda': { x: 1260, y: 690 },
  'p-ai': { x: 950, y: 170 },
  'p-est': { x: 580, y: 815 },
  'p-conc': { x: 860, y: 815 },
};
