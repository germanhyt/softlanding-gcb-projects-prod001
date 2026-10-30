import { describe, expect, it } from 'vitest';
import { equipo, totalAreas, totalPersonas } from '../data/equipo';
import { zoneRectFor, zoneUnitsFor } from './equipo-oficina';

describe('equipo headcount', () => {
  it('tiene 16 áreas y 67 personas (un avatar por persona)', () => {
    expect(totalAreas).toBe(16);
    expect(totalPersonas).toBe(67);
    expect(equipo.reduce((n, a) => n + a.personas.length, 0)).toBe(67);
  });

  it('Operaciones es el área más grande', () => {
    const max = Math.max(...equipo.map((a) => a.personas.length));
    expect(equipo.find((a) => a.id === 'operaciones')?.personas.length).toBe(max);
  });
});

describe('zone sizing proporcional al headcount', () => {
  it('units crece con el headcount', () => {
    expect(zoneUnitsFor(24)).toBeGreaterThan(zoneUnitsFor(8));
    expect(zoneUnitsFor(8)).toBeGreaterThan(zoneUnitsFor(1));
    expect(zoneUnitsFor(0)).toBeGreaterThan(0);
  });

  it('el rect de Operaciones (24) supera al de un área de 1', () => {
    const big = zoneRectFor(zoneUnitsFor(24));
    const small = zoneRectFor(zoneUnitsFor(1));
    expect(big.w * big.h).toBeGreaterThan(small.w * small.h);
  });

  it('rects dentro de la losa (30 x 20)', () => {
    for (const n of [0, 1, 2, 5, 8, 10, 24]) {
      const r = zoneRectFor(zoneUnitsFor(n));
      expect(r.w).toBeLessThanOrEqual(9.5);
      expect(r.h).toBeLessThanOrEqual(8);
    }
  });
});
