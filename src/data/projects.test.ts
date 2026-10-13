import { describe, expect, it } from 'vitest';
import { planetDefs } from './projects';
import { icons } from './icons';

const ORBITS = ['inner', 'middle', 'outer'];
const GROUPS = [
  'Refugio Data',
  'Sistema',
  'Descarga',
  'Herramienta',
  'Bosque Mágico',
  'SISA',
  'Parking',
];

describe('projects', () => {
  it('tiene ids únicos', () => {
    const ids = planetDefs.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todos los campos de texto y URL están completos y son válidos', () => {
    for (const p of planetDefs) {
      expect(p.label.trim().length).toBeGreaterThan(0);
      expect(p.full.trim().length).toBeGreaterThan(0);
      expect(p.desc.trim().length).toBeGreaterThan(0);
      expect(p.href.startsWith('https://')).toBe(true);
      expect(ORBITS).toContain(p.orbit);
      expect(GROUPS).toContain(p.group);
      expect(Number.isFinite(p.phase)).toBe(true);
      expect([1, -1]).toContain(p.dir);
      expect(p.badge?.trim().length).toBeGreaterThan(0);
      expect(p.tag?.trim().length).toBeGreaterThan(0);
      expect(p.domain?.trim().length).toBeGreaterThan(0);
    }
  });

  it('cada icono existe en el mapa compartido', () => {
    for (const p of planetDefs) {
      expect(icons[p.icon], `icono faltante: ${p.icon}`).toBeDefined();
    }
  });

  it('cubre al menos 15 sistemas', () => {
    expect(planetDefs.length).toBeGreaterThanOrEqual(15);
  });
});
