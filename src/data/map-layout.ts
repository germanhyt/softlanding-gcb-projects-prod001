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

/** Posición de los 7 pilares (unidades de negocio). */
export const branchPositions: Record<string, NodePosition> = {
  'b-refugio': { x: 420, y: 500 },
  'b-channels': { x: 1170, y: 500 },
  'b-bosque': { x: 580, y: 280 },
  'b-ai': { x: 1010, y: 290 },
  'b-sisa': { x: 590, y: 705 },
  'b-parking': { x: 1040, y: 705 },
  'b-finanzas': { x: 1300, y: 700 },
};

/** Posición de las 15 hojas (lo único que vive aquí; el contenido viene de projects.ts). */
export const leafPositions: Record<string, NodePosition> = {
  'p-proc': { x: 160, y: 130 },
  'p-del': { x: 160, y: 330 },
  'p-com': { x: 160, y: 530 },
  'p-docgcb': { x: 160, y: 730 },
  'p-kiosk': { x: 1440, y: 310 },
  'p-runner': { x: 1440, y: 510 },
  'p-bosque': { x: 435, y: 108 },
  'p-bosque-adm': { x: 735, y: 108 },
  'p-agenda': { x: 1035, y: 108 },
  'p-ai': { x: 1335, y: 108 },
  'p-sisa': { x: 450, y: 890 },
  'p-sisa-reg': { x: 730, y: 890 },
  'p-est': { x: 1030, y: 890 },
  'p-conc': { x: 1330, y: 880 },
  'p-oc': { x: 1620, y: 950 },
};
