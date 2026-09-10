export type OrbitKey = 'inner' | 'middle' | 'outer';
export type ProjectGroup = 'Refugio Data' | 'Sistema' | 'Descarga' | 'Herramienta';

export interface OrbitTheme {
  color: string;
  bg: string;
  glow: string;
}

export interface PlanetDef {
  id: string;
  label: string;
  full: string;
  desc: string;
  href: string;
  group: ProjectGroup;
  orbit: OrbitKey;
  phase: number;
  speed: number;
  dir: 1 | -1;
  icon: string;
}

export interface MobileOrbit {
  orbit: OrbitKey;
  label: string;
  sub: string;
}

export interface Star {
  id: number;
  x: number;
  y: number;
  r: number;
  o: number;
  pulse: boolean;
}

export const orbitThemes: Record<OrbitKey, OrbitTheme> = {
  inner:  { color: '#C9A84C', bg: 'rgba(201,168,76,0.13)',  glow: 'rgba(201,168,76,0.55)' },
  middle: { color: '#9B6DFF', bg: 'rgba(155,109,255,0.13)', glow: 'rgba(155,109,255,0.55)' },
  outer:  { color: '#4A9EFF', bg: 'rgba(74,158,255,0.13)',  glow: 'rgba(74,158,255,0.55)' },
};

export const planetDefs: PlanetDef[] = [
  { id: 'p-proc',   label: 'Refugio Data',          full: 'Refugio Data',                desc: 'Plataforma de gestión y análisis de datos operativos', href: 'https://datarefugio.gcbprojects.site/legacy',         group: 'Refugio Data', orbit: 'inner',  phase: 270, speed: 0.30, dir:  1, icon: 'refugio' },
  { id: 'p-del',    label: 'Delivery',              full: 'Módulo Delivery',             desc: 'Control y seguimiento de pedidos',                     href: 'https://datarefugio.gcbprojects.site/delivery',      group: 'Refugio Data', orbit: 'inner',  phase: 30,  speed: 0.30, dir:  1, icon: 'truck'   },
  { id: 'p-com',    label: 'Comercial',             full: 'Módulo Comercial',            desc: 'Reservas, eventos y CRM',                              href: 'https://datarefugio.gcbprojects.site/comercial',     group: 'Refugio Data', orbit: 'inner',  phase: 150, speed: 0.30, dir:  1, icon: 'chart'   },
  { id: 'p-docgcb', label: 'Documentación GCB',     full: 'Documentación GCB',           desc: 'Documentos y consultas GCB',                           href: 'https://datarefugio.gcbprojects.site/documentos-gcb', group: 'Refugio Data', orbit: 'inner',  phase: 210, speed: 0.30, dir:  1, icon: 'doc'     },
  { id: 'p-est',    label: 'Estacionam.',           full: 'Sistema Estacionamiento',     desc: 'Gestión de estacionamiento',                           href: 'https://estacionamiento.gcbprojects.site/',         group: 'Sistema',      orbit: 'middle', phase: 90,  speed: 0.20, dir: -1, icon: 'park'    },
  { id: 'p-kiosk',  label: 'Web Kiosko',            full: 'Web Kiosko',                  desc: 'Punto de venta en navegador',                         href: 'https://kiosk.datarefugio.gcbprojects.site/',        group: 'Descarga',     orbit: 'middle', phase: 330, speed: 0.20, dir: -1, icon: 'screen'  },
  { id: 'p-runner', label: 'App Runner',            full: 'App Runner',                  desc: 'Descarga · App de despacho',                           href: 'https://expo.dev/accounts/refugdata/projects/runner/builds/a6e38cfb-6bf2-4353-a639-e92daeac7836', group: 'Descarga', orbit: 'middle', phase: 210, speed: 0.20, dir: -1, icon: 'play' },
  { id: 'p-agenda', label: 'Agenda deportiva',      full: 'Agenda Deportiva · Refugio',  desc: 'Partidos destacados y eventos deportivos',            href: 'https://softlanding-calendario-deportivo-gc-xi.vercel.app/', group: 'Descarga',     orbit: 'middle', phase: 270, speed: 0.20, dir: -1, icon: 'cal'  },
  { id: 'p-ai',     label: 'Consultas GCB con AI',  full: 'Consultas Agente AI',         desc: 'Consultas con inteligencia artificial',               href: 'https://consultas.gcbprojects.site/',                group: 'Herramienta',  orbit: 'outer',  phase: 45,  speed: 0.13, dir:  1, icon: 'ai'      },
  { id: 'p-conc',   label: 'Conciliación',          full: 'Conciliación Financiera',     desc: 'Sistema de conciliación financiera',                   href: 'https://conciliacion.gcbprojects.site/',             group: 'Sistema',      orbit: 'outer',  phase: 225, speed: 0.13, dir:  1, icon: 'bal'     },
];

export const mobileOrbits: MobileOrbit[] = [
  { orbit: 'inner',  label: 'Refugio Data',    sub: 'datarefugio.gcbprojects.site' },
  { orbit: 'middle', label: 'Sistemas & Apps', sub: 'Sistemas y aplicaciones' },
  { orbit: 'outer',  label: 'Herramientas',    sub: 'Herramientas avanzadas' },
];

export const stars: Star[] = Array.from({ length: 110 }, (_, i) => ({
  id: i,
  x: +((i * 137.508) % 100).toFixed(1),
  y: +((i * 97.314 + i * 1.7) % 100).toFixed(1),
  r: 1 + (i % 3),
  o: +(0.05 + (i % 9) * 0.035).toFixed(2),
  pulse: i % 6 === 0,
}));

export const planets = planetDefs.map((p) => ({ ...p, ...orbitThemes[p.orbit] }));
