import { describe, expect, it } from 'vitest';
import { BRANCHES, resolveBranches } from './branches';
import { planetDefs } from './projects';
import { branchPositions, leafPositions, MAP_CENTER } from './map-layout';
import { validateLayout } from './geometry';

const HEX = /^#[0-9A-Fa-f]{6}$/;

// Semitamaños = los del verificador de layout que pasa en CI visual
// (medidos en navegador + margen). Cambiarlos exige re-verificar con captura.
const HUB = { hw: 175, hh: 95 };
const BRANCH = { hw: 115, hh: 55 };
const LEAF = { hw: 127, hh: 88 };
const W = 1840;
const H = 1120;
const PAD = 12;

describe('branches', () => {
  it('toda hoja de projects vive en exactamente un pilar', () => {
    const seen = new Map<string, number>();
    for (const b of BRANCHES) {
      for (const id of b.leafIds) seen.set(id, (seen.get(id) ?? 0) + 1);
    }
    for (const p of planetDefs) {
      expect(seen.get(p.id), `hoja sin pilar: ${p.id}`).toBe(1);
    }
    expect(seen.size).toBe(planetDefs.length);
  });

  it('accents únicos y hexadecimales válidos', () => {
    const accents = BRANCHES.map((b) => b.accent);
    for (const a of accents) expect(a).toMatch(HEX);
    expect(new Set(accents).size).toBe(accents.length);
  });

  it('cada pilar tiene posición y cada posición tiene pilar', () => {
    const posIds = new Set(Object.keys(branchPositions));
    for (const b of BRANCHES) {
      expect(posIds.has(b.id), `sin posición: ${b.id}`).toBe(true);
    }
    for (const id of posIds) {
      expect(
        BRANCHES.some((b) => b.id === id),
        `posición huérfana: ${id}`,
      ).toBe(true);
    }
  });

  it('todas las hojas tienen coordenadas', () => {
    for (const p of planetDefs) {
      expect(leafPositions[p.id], `sin coordenadas: ${p.id}`).toBeDefined();
    }
  });

  it('el layout real no tiene solapes ni salidas del lienzo', () => {
    const resolved = resolveBranches();
    const rects = [
      {
        id: 'hub',
        x: MAP_CENTER.x - HUB.hw,
        y: MAP_CENTER.y - HUB.hh,
        w: HUB.hw * 2,
        h: HUB.hh * 2,
      },
    ];
    for (const b of resolved) {
      rects.push({
        id: b.id,
        x: b.x - BRANCH.hw,
        y: b.y - BRANCH.hh,
        w: BRANCH.hw * 2,
        h: BRANCH.hh * 2,
      });
      for (const l of b.leaves) {
        rects.push({
          id: l.id,
          x: l.x - LEAF.hw,
          y: l.y - LEAF.hh,
          w: LEAF.hw * 2,
          h: LEAF.hh * 2,
        });
      }
    }
    expect(validateLayout(rects, W, H, PAD)).toEqual([]);
  });
});
