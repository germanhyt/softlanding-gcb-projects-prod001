import { describe, expect, it } from 'vitest';
import { equipo, nombreCorto, totalPersonas } from './equipo';

describe('nombreCorto (1 nombre + 1 apellido)', () => {
  it('dos tokens se devuelven tal cual', () => {
    expect(nombreCorto('Katherine Tafur')).toBe('Katherine Tafur');
    expect(nombreCorto('Jackeline Coral')).toBe('Jackeline Coral');
    expect(nombreCorto('Lorena Castro')).toBe('Lorena Castro');
  });

  it('tres tokens: primero + segundo (apellido paterno)', () => {
    expect(nombreCorto('Nataly Salazar Chuquihuanca')).toBe('Nataly Salazar');
    expect(nombreCorto('Cecilia Gutierrez Pomahuacre')).toBe('Cecilia Gutierrez');
  });

  it('cuatro tokens: primero + penúltimo (salta segundo nombre y materno)', () => {
    expect(nombreCorto('Roberto Carlos Ponce Canchihuaman')).toBe('Roberto Ponce');
    expect(nombreCorto('Jose Antonio Millares Garcia')).toBe('Jose Millares');
    expect(nombreCorto('Luis Alberto Castro Ricra')).toBe('Luis Castro');
    expect(nombreCorto('Bill Nike Maguiña Mendoza')).toBe('Bill Maguiña');
  });

  it('un token y espacios extra no rompen', () => {
    expect(nombreCorto('Katherine')).toBe('Katherine');
    expect(nombreCorto('  Ana   María  Tataje   Con  ')).toBe('Ana Tataje');
  });

  it('jefaturas en mayúsculas se normalizan al mismo criterio', () => {
    expect(nombreCorto('JOSÉ BENITO SOTIL BINDELS')).toBe('José Sotil');
    expect(nombreCorto('Mike Klaus Fuchs Lopez')).toBe('Mike Fuchs');
    expect(nombreCorto('César Dionisio Deza Silva')).toBe('César Deza');
  });

  it('todo el equipo se acorta a exactamente 2 tokens', () => {
    for (const a of equipo) {
      for (const p of a.personas) {
        expect(nombreCorto(p.nombre).split(' ')).toHaveLength(2);
      }
    }
    expect(totalPersonas).toBe(67);
  });
});
