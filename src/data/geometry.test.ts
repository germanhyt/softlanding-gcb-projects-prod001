import { describe, expect, it } from 'vitest';
import { edgePoint, rectsOverlap, validateLayout } from './geometry';
import type { Rect } from './geometry';

describe('edgePoint', () => {
  it('llega al borde en el eje X positivo', () => {
    expect(edgePoint(0, 0, 100, 50, 1, 0, 0)).toEqual({ x: 100, y: 0 });
  });

  it('llega al borde en el eje Y positivo', () => {
    expect(edgePoint(0, 0, 100, 50, 0, 1, 0)).toEqual({ x: 0, y: 50 });
  });

  it('respeta el gap pedido', () => {
    expect(edgePoint(0, 0, 100, 50, 1, 0, 10)).toEqual({ x: 110, y: 0 });
  });

  it('con dirección cero devuelve el centro sin NaN', () => {
    const p = edgePoint(5, 7, 100, 50, 0, 0, 10);
    expect(p.x).toBe(5);
    expect(p.y).toBe(7);
    expect(Number.isNaN(p.x)).toBe(false);
  });

  it('en diagonal cae sobre la elipse', () => {
    const p = edgePoint(0, 0, 100, 100, 1, 1, 0);
    // círculo r=100: intersección en 100/√2 ≈ 70.71
    expect(p.x).toBeCloseTo(70.71, 1);
    expect(p.y).toBeCloseTo(70.71, 1);
  });
});

describe('rectsOverlap', () => {
  const box = (x: number, y: number, w = 10, h = 10): Rect => ({ x, y, w, h });

  it('detecta solape real', () => {
    expect(rectsOverlap(box(0, 0), box(5, 5))).toBe(true);
  });

  it('no reporta contacto exacto de bordes', () => {
    expect(rectsOverlap(box(0, 0), box(10, 0))).toBe(false);
  });

  it('no reporta cajas separadas', () => {
    expect(rectsOverlap(box(0, 0), box(50, 50))).toBe(false);
  });

  it('el pad amplía la zona de colisión', () => {
    expect(rectsOverlap(box(0, 0), box(10, 0), 1)).toBe(true);
  });
});

describe('validateLayout', () => {
  it('acepta un layout sano', () => {
    const rects = [
      { id: 'a', x: 100, y: 100, w: 100, h: 100 },
      { id: 'b', x: 400, y: 400, w: 100, h: 100 },
    ];
    expect(validateLayout(rects, 2000, 2000, 12)).toEqual([]);
  });

  it('reporta solapes con los ids involucrados', () => {
    const rects = [
      { id: 'a', x: 100, y: 100, w: 100, h: 100 },
      { id: 'b', x: 150, y: 150, w: 100, h: 100 },
    ];
    const errors = validateLayout(rects, 2000, 2000, 12);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('a');
    expect(errors[0]).toContain('b');
  });

  it('reporta nodos fuera del lienzo', () => {
    const rects = [{ id: 'x', x: -50, y: 10, w: 100, h: 100 }];
    const errors = validateLayout(rects, 2000, 2000, 12);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('x');
  });
});
