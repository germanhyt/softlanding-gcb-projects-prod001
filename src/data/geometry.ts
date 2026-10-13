/* ── Geometría del mapa semántico: matemática pura, sin DOM ── */

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type LabeledRect = Rect & { id: string };

/** Punto sobre el borde de una elipse (cx,cy,hw,hh) en la dirección (dx,dy). */
export function edgePoint(
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  dx: number,
  dy: number,
  gap = 10,
): Point {
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const t = 1 / Math.sqrt((ux / hw) ** 2 + (uy / hh) ** 2) + gap;
  return { x: cx + ux * t, y: cy + uy * t };
}

/** ¿Se tocan dos rectángulos? `pad` expande la zona de colisión. */
export function rectsOverlap(a: Rect, b: Rect, pad = 0): boolean {
  return (
    a.x - pad < b.x + b.w + pad &&
    a.x + a.w + pad > b.x - pad &&
    a.y - pad < b.y + b.h + pad &&
    a.y + a.h + pad > b.y - pad
  );
}

/** Valida un layout: devuelve la lista de problemas (vacía = sano). */
export function validateLayout(
  rects: LabeledRect[],
  w: number,
  h: number,
  pad = 0,
): string[] {
  const errors: string[] = [];
  for (const r of rects) {
    if (
      r.x - pad < 8 ||
      r.x + r.w + pad > w - 8 ||
      r.y - pad < 8 ||
      r.y + r.h + pad > h - 8
    ) {
      errors.push(`FUERA: ${r.id}`);
    }
  }
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      if (rectsOverlap(rects[i], rects[j], pad)) {
        errors.push(`SOLAPE: ${rects[i].id} <-> ${rects[j].id}`);
      }
    }
  }
  return errors;
}
