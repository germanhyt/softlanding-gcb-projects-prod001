/* ── Pilares del mapa semántico: definición + resolución contra la data ── */
import { planetDefs } from './projects';
import type { PlanetDef } from './projects';
import { branchPositions, leafPositions } from './map-layout';

export interface BranchDef {
  id: string;
  title: string;
  desc: string;
  category: string;
  accent: string;
  leafIds: string[];
}

export interface MapLeaf {
  id: string;
  name: string;
  sub: string;
  desc: string;
  href: string;
  domain: string;
  icon: string;
  tag: string;
  badge: string;
  x: number;
  y: number;
}

export interface ResolvedBranch extends BranchDef {
  x: number;
  y: number;
  leaves: MapLeaf[];
}

export type MapBranch = ResolvedBranch;

export const BRANCHES: BranchDef[] = [
  {
    id: 'b-refugio',
    title: 'Refugio Data',
    desc: 'Operaciones & Gestión Core',
    category: 'Analítica Operativa',
    accent: '#C9A84C',
    leafIds: ['p-proc', 'p-del', 'p-com', 'p-docgcb'],
  },
  {
    id: 'b-channels',
    title: 'Canales de Venta',
    desc: 'Punto de Venta & Despacho',
    category: 'Canales',
    accent: '#3CC9A4',
    leafIds: ['p-kiosk', 'p-runner', 'p-agenda'],
  },
  {
    id: 'b-bosque',
    title: 'Bosque Mágico',
    desc: 'Fiestas & Administración',
    category: 'Negocio',
    accent: '#FF8C42',
    leafIds: ['p-bosque', 'p-bosque-adm'],
  },
  {
    id: 'b-ai',
    title: 'Inteligencia de Datos',
    desc: 'Modelos de Lenguaje & Análisis',
    category: 'Analítica Avanzada',
    accent: '#4A9EFF',
    leafIds: ['p-ai', 'p-n8n'],
  },
  {
    id: 'b-sisa',
    title: 'SISA Reservas',
    desc: 'Reservas & Registro',
    category: 'Reservas',
    accent: '#FF6B8E',
    leafIds: ['p-sisa', 'p-sisa-reg'],
  },
  {
    id: 'b-parking',
    title: 'Parking',
    desc: 'Control de acceso & Aforo',
    category: 'Operaciones',
    accent: '#4A7A5A',
    leafIds: ['p-est'],
  },
  {
    id: 'b-finanzas',
    title: 'Finanzas',
    desc: 'Conciliación & Auditoría',
    category: 'Finanzas',
    accent: '#9B6DFF',
    leafIds: ['p-conc', 'p-oc'],
  },
];

export function leafFromProject(id: string): MapLeaf {
  const p = planetDefs.find((d) => d.id === id)!;
  const pos = leafPositions[id]!;
  return {
    id: p.id,
    name: p.label,
    sub: p.full,
    desc: p.desc,
    href: p.href,
    domain: p.domain ?? '',
    icon: p.icon,
    tag: p.tag ?? '',
    badge: p.badge ?? '',
    x: pos.x,
    y: pos.y,
  };
}

export function resolveBranches(): ResolvedBranch[] {
  return BRANCHES.map((b) => ({
    ...b,
    ...branchPositions[b.id]!,
    leaves: b.leafIds.map(leafFromProject),
  }));
}
