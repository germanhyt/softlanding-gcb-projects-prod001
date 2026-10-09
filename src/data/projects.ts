export type OrbitKey = 'inner' | 'middle' | 'outer';
export type ProjectGroup = 'Refugio Data' | 'Sistema' | 'Descarga' | 'Herramienta' | 'Bosque Mágico' | 'SISA' | 'Parking';

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
  badge?: string;
  tag?: string;
  domain?: string;
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
  { id: 'p-proc',   label: 'Refugio Data',          full: 'Refugio Data',                desc: 'Plataforma central de gestión, conciliación y análisis de datos operativos', href: 'https://datarefugio.gcbprojects.site/legacy',         group: 'Refugio Data', orbit: 'inner',  phase: 270, speed: 0.30, dir:  1, icon: 'refugio', badge: 'BI & Analítica', tag: 'Producción', domain: 'datarefugio.gcbprojects.site' },
  { id: 'p-del',    label: 'Delivery',              full: 'Módulo Delivery',             desc: 'Control y seguimiento en vivo de pedidos, tiempos de despacho y trazabilidad', href: 'https://datarefugio.gcbprojects.site/delivery',      group: 'Refugio Data', orbit: 'inner',  phase: 30,  speed: 0.30, dir:  1, icon: 'truck',   badge: 'Logística', tag: 'En línea', domain: 'datarefugio.gcbprojects.site' },
  { id: 'p-com',    label: 'Comercial',             full: 'Módulo Comercial',            desc: 'Gestión integral de reservas, cotización de eventos corporativos y CRM',        href: 'https://datarefugio.gcbprojects.site/comercial',     group: 'Refugio Data', orbit: 'inner',  phase: 150, speed: 0.30, dir:  1, icon: 'chart',   badge: 'Comercial', tag: 'CRM', domain: 'datarefugio.gcbprojects.site' },
  { id: 'p-docgcb', label: 'Documentación GCB',     full: 'Documentación GCB',           desc: 'Repositorio corporativo de políticas, procesos y consultas internas',          href: 'https://datarefugio.gcbprojects.site/documentos-gcb', group: 'Refugio Data', orbit: 'inner',  phase: 210, speed: 0.30, dir:  1, icon: 'doc',     badge: 'Gestión', tag: 'Interno', domain: 'datarefugio.gcbprojects.site' },
  { id: 'p-est',    label: 'Estacionam.',           full: 'Sistema Estacionamiento',     desc: 'Control de accesos vehiculares, aforo en tiempo real y facturación operativa',  href: 'https://estacionamiento.gcbprojects.site/',         group: 'Parking',      orbit: 'middle', phase: 90,  speed: 0.20, dir: -1, icon: 'park',    badge: 'Parking', tag: 'Acceso', domain: 'estacionamiento.gcbprojects.site' },
  { id: 'p-kiosk',  label: 'Web Kiosko',            full: 'Web Kiosko',                  desc: 'Terminal web de autoservicio para pedidos y punto de venta ágil en salón',      href: 'https://kiosk.datarefugio.gcbprojects.site/',        group: 'Descarga',     orbit: 'middle', phase: 330, speed: 0.20, dir: -1, icon: 'screen',  badge: 'Punto de Venta', tag: 'Web App', domain: 'kiosk.datarefugio.gcbprojects.site' },
  { id: 'p-runner', label: 'App Runner',            full: 'App Runner',                  desc: 'Aplicación móvil de última milla y despacho rápido para operarios de campo',   href: 'https://expo.dev/accounts/refugdata/projects/runner/builds/a6e38cfb-6bf2-4353-a639-e92daeac7836', group: 'Descarga', orbit: 'middle', phase: 210, speed: 0.20, dir: -1, icon: 'play', badge: 'Mobile', tag: 'Android APK', domain: 'expo.dev' },
  { id: 'p-agenda', label: 'Agenda deportiva',      full: 'Agenda Deportiva · Refugio',  desc: 'Calendario oficial de eventos, activaciones y transmisiones deportivas',        href: 'https://softlanding-calendario-deportivo-gc-xi.vercel.app/', group: 'Descarga',     orbit: 'middle', phase: 270, speed: 0.20, dir: -1, icon: 'cal',   badge: 'Eventos', tag: 'Vercel', domain: 'vercel.app' },
  { id: 'p-ai',     label: 'Consultas GCB con AI',  full: 'Consultas Agente AI',         desc: 'Asistente corporativo de inteligencia artificial para análisis y soporte',      href: 'https://consultas.gcbprojects.site/',                group: 'Herramienta',  orbit: 'outer',  phase: 45,  speed: 0.13, dir:  1, icon: 'ai',      badge: 'Inteligencia Artificial', tag: 'AI Engine', domain: 'consultas.gcbprojects.site' },
  { id: 'p-conc',   label: 'Conciliación',          full: 'Conciliación Financiera',     desc: 'Auditoría automática, conciliación bancaria y liquidación de transacciones',   href: 'https://conciliacion.gcbprojects.site/',             group: 'Sistema',      orbit: 'outer',  phase: 225, speed: 0.13, dir:  1, icon: 'bal',     badge: 'Finanzas', tag: 'Fintech', domain: 'conciliacion.gcbprojects.site' },
  { id: 'p-bosque', label: 'Bosque Mágico',         full: 'Bosque Mágico · Landing',    desc: 'Fiestas infantiles en Refugio: landing de eventos y celebraciones',               href: 'https://bosquemagico.gcbprojects.site/',              group: 'Bosque Mágico', orbit: 'middle', phase: 120, speed: 0.20, dir: -1, icon: 'play', badge: 'Eventos', tag: 'Landing', domain: 'bosquemagico.gcbprojects.site' },
  { id: 'p-bosque-adm', label: 'Bosque Admin',      full: 'Bosque Mágico · Admin',       desc: 'Administración de reservas y eventos de Bosque Mágico',                          href: 'https://admin.bosquemagico.gcbprojects.site/',        group: 'Bosque Mágico', orbit: 'middle', phase: 300, speed: 0.20, dir: -1, icon: 'db',   badge: 'Gestión', tag: 'Admin', domain: 'bosquemagico.gcbprojects.site' },
  { id: 'p-sisa',   label: 'SISA Reservas',         full: 'SISA · Plataforma',           desc: 'Plataforma de reservas SISA',                                                   href: 'https://sisa.reservaspe.com/',                          group: 'SISA',         orbit: 'outer',  phase: 135, speed: 0.13, dir:  1, icon: 'cal',    badge: 'Reservas', tag: 'Plataforma', domain: 'sisa.reservaspe.com' },
  { id: 'p-sisa-reg', label: 'Registro SISA',       full: 'SISA · Registro',             desc: 'Formulario de registro SISA',                                                   href: 'https://sisa.reservaspe.com/registro',                group: 'SISA',         orbit: 'outer',  phase: 315, speed: 0.13, dir:  1, icon: 'doc',    badge: 'Registro', tag: 'Formulario', domain: 'sisa.reservaspe.com' },
  { id: 'p-oc',     label: 'Órdenes de Compra',     full: 'Gestión GCB · Órdenes de Compra', desc: 'Órdenes de compra, centros de costo y trazabilidad administrativa',             href: 'https://sandbox.oc.gcbprojects.site/',                 group: 'Sistema',      orbit: 'outer',  phase: 300, speed: 0.13, dir:  1, icon: 'doc',    badge: 'Compras', tag: 'Sandbox', domain: 'sandbox.oc.gcbprojects.site' },
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
