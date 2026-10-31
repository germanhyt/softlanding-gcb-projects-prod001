/**
 * Campus macro para el slide `#pres-equipo`: el campus completo, no una oficina.
 * Un avatar por persona real (67 de `src/data/equipo.ts`), distritos por
 * función real del campus:
 *
 * - OFICINA CENTRAL (edificio principal, open plan centralizado, sin muros
 *   internos): un solo espacio abierto con 4 islas de escritorios por
 *   equipo (Admin, Finanzas, Marketing, Sistemas), separadas por
 *   alfombras de su color + divisores bajos; letrero flotante por
 *   equipo. Escritorios + monitores + sillas; la gente teclea.
 *   Kitchenette al sureste (mueble + microondas + cafetera + mesa
 *   alta con taburetes; 2 avatares conversan con café) y Directorio
 *   al suroeste (sala vidriada con mesa grande + pantalla con
 *   gráfico + 6 sillas), integrados al open plan. Plantas,
 *   lámparas de pie y alfombras llenan los vacíos: cero espacio
 *   muerto visible.
 * - CENTRO DE CONTROL (edificio aparte): video wall 3x5 ampliado con
 *   contenido animado tenue (canvas-texture a bajo fps: barras + ondas)
 *   + banner, consolas con teclados y monitores dobles por operador,
 *   un operador de pie que señala el wall, cámaras PTZ en esquinas
 *   (domo + LED rojo parpadeante lento), 3 racks con LEDs en frente
 *   + cables en piso y torre de servidor con luces parpadeantes
 *   (emisivo animado).
 * - ESTACIONAMIENTO (campo abierto): suelo diferenciado + 6 autos low-poly
 *   instanciados + caseta; un avatar patrulla entre los autos.
 * - CONVEXIA (módulos): pabellones/stands + campo de eventos (escenario +
 *   sillas en fila); avatares montando (mueven cajas).
 * - MANTENIMIENTO (taller): estanterías, banco de trabajo, conos; un avatar
 *   suelda (chispa emisiva intermitente), otros cargan cajas.
 * - PARQUE GASTRONÓMICO "Refugio Gastronómico" (zona verde): 3 puestos con
 *   toldo a rayas + mesas; avatares barriendo (vaivén) y regando; mostrador
 *   de caja atendido.
 *
 * Acciones por área con máquina de estados (trabajar / pasear / conversar,
 * transiciones temporizadas 6–12 s, retorno guiado al puesto: sin teleports).
 *
 * Performance contract (see .agents/skills/three-best-practices):
 * - setup-animation-loop: single renderer.setAnimationLoop, delta clamped
 * - draw-call-optimization: todo instanciado (~60 mallas), 1 draw call c/u
 * - geometry-instanced-mesh + geometry-vertex-count: geos compartidas low-seg
 * - material-reuse: puñado de MeshStandardMaterial compartidos
 * - lighting-limit-lights: hemi + 1 dir, sin shadow maps;
 *   lighting-fake-shadows: blob planes bajo avatares
 * - render-pixel-ratio + mobile-optimization: DPR clamp 2 / 1.5, sin AA móvil
 * - render-avoid-allocations: cero allocs en el loop (temps reutilizados)
 * - animation-system: NO AnimationMixer; procedural code-driven
 * - geometry-lod: más allá de LOD_FAR solo torso/cabeza (extremidades cada 3)
 * - vitals-lazy-load: boot con IntersectionObserver desde Equipo.astro
 * - memory-*: dispose() recursivo completo en unmount
 * - prefers-reduced-motion: un frame estático, sin loop
 * - sin postprocessing, sin R3F
 */

import { nombreCorto } from '../data/equipo';

export interface OficinaPersona {
  nombre: string;
  ini: string;
  rol?: string;
}

export interface OficinaArea {
  id: string;
  nombre: string;
  jefatura: string;
  count: number;
  personas?: OficinaPersona[];
}

export interface OficinaStats {
  stations: number;
  figures: number;
  meshes: number;
  drawCalls: number;
}

export interface OficinaHandle {
  /** Highlight stations: `area` selected pill, `match` visible area ids (null = all). */
  setFilter: (area: string, match: Set<string> | null) => void;
  /** Scene counters for automated verification (meshes, figures, draw calls). */
  stats: () => OficinaStats;
  /**
   * Synchronous raycast probe for automated verification: NDC coords
   * (-1..1). Returns the avatar and/or zone under the point.
   */
  pickTest: (nx: number, ny: number) => { avatar: string | null; zone: string | null };
  dispose: () => void;
}

interface Zone {
  area: OficinaArea;
  cx: number;
  cz: number;
  w: number;
  h: number;
  accent: number;
}

/** Pilar accents from the semantic map (`src/data/branches.ts`). */
const ACCENTS = [0xc9a84c, 0x3cc9a4, 0xff8c42, 0x4a9eff, 0xff6b8e, 0x4a7a5a, 0x9b6dff];

// Warm brand wardrobe: gold, cream, warm grays, charcoal + desaturated accents.
const SHIRTS = [
  0xc9a84c, 0xe8dcc0, 0x8a7f6a, 0x6b6257, 0x4a4238, 0xb98a4c, 0x7a8b6f,
  0x5a7a9e, 0xb97f7f, 0x3f8a76, 0x9b6dff, 0xd9cba8,
];
const PANTS = [0x2b2620, 0x3a3227, 0x4a4238, 0x232323, 0x5a4a38];
const SKINS = [0xf1c9a5, 0xd9a06b, 0xa06a3c, 0x6e4530, 0xe8b48a];

/* ── Distritos del campus ─────────────────────────────────────────── */

type Behavior =
  | 'office' // teclea en escritorio
  | 'control' // mira pantallas
  | 'patrol' // patrulla entre autos
  | 'mount' // monta stands, mueve cajas
  | 'taller' // suelda / carga
  | 'clean' // barre (vaivén) / riega
  | 'serve'; // atiende mostrador

interface District {
  id: string;
  nombre: string;
  sub: string;
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  ground: number;
  behavior: Behavior;
}

const DISTRICTS: District[] = [
  { id: 'central', nombre: 'Oficina Central', sub: 'Admin · Finanzas · Marketing · Sistemas', x0: -31, z0: -19, x1: 9, z1: -1, ground: 0x2b241c, behavior: 'office' },
  { id: 'control', nombre: 'Centro de Control', sub: 'Monitoreo 24/7', x0: 11, z0: -19, x1: 31, z1: -1, ground: 0x1e2430, behavior: 'control' },
  { id: 'convexia', nombre: 'Convexia', sub: 'Pabellones · Campo de eventos', x0: -31, z0: 1, x1: -11, z1: 19, ground: 0x2e2a20, behavior: 'mount' },
  { id: 'parque', nombre: 'Refugio Gastronómico', sub: 'Parque gastronómico', x0: -9, z0: 1, x1: 9, z1: 19, ground: 0x24401f, behavior: 'clean' },
  { id: 'parking', nombre: 'Estacionamiento', sub: 'Campo abierto', x0: 11, z0: 1, x1: 31, z1: 10, ground: 0x232326, behavior: 'patrol' },
  { id: 'taller', nombre: 'Mantenimiento', sub: 'Taller', x0: 11, z0: 12, x1: 31, z1: 19, ground: 0x2a2926, behavior: 'taller' },
];

const districtOf: Record<string, string> = {
  administracion: 'central',
  'gerencia-general': 'central',
  rrhh: 'central',
  legal: 'central',
  finanzas: 'central',
  contabilidad: 'central',
  marketing: 'central',
  sistemas: 'central',
  'centro-control': 'control',
  convexia: 'convexia',
  operaciones: 'convexia',
  comercial: 'convexia',
  limpieza: 'parque',
  'operaciones-cavas': 'parque',
  estacionamiento: 'parking',
  mantenimiento: 'taller',
};

interface Ala {
  nombre: string;
  color: number;
}

/** Alas de la Oficina Central: pilar de color + letrero por ala. */
const ALA_OF: Record<string, Ala> = {
  administracion: { nombre: 'Ala Admin', color: 0xc9a84c },
  'gerencia-general': { nombre: 'Ala Admin', color: 0xc9a84c },
  rrhh: { nombre: 'Ala Admin', color: 0xc9a84c },
  legal: { nombre: 'Ala Admin', color: 0xc9a84c },
  finanzas: { nombre: 'Ala Finanzas', color: 0x3cc9a4 },
  contabilidad: { nombre: 'Ala Finanzas', color: 0x3cc9a4 },
  marketing: { nombre: 'Ala Marketing', color: 0xff8c42 },
  sistemas: { nombre: 'Ala Sistemas', color: 0x4a9eff },
};

/**
 * Open plan centralizado: 4 islas por equipo dentro de Central
 * (x -31..9, z -19..-1). Directorio al suroeste y kitchenette al
 * sureste quedan libres como remates del espacio abierto.
 */
const TEAM_ISLANDS: Array<{ team: string; color: number; cx: number; cz: number }> = [
  { team: 'Ala Admin', color: 0xc9a84c, cx: -21.5, cz: -13.6 },
  { team: 'Ala Finanzas', color: 0x3cc9a4, cx: -6.5, cz: -13.6 },
  { team: 'Ala Marketing', color: 0xff8c42, cx: -20.5, cz: -7.6 },
  { team: 'Ala Sistemas', color: 0x4a9eff, cx: -5.5, cz: -8.2 },
];

const teamOfArea = (areaId: string): string => ALA_OF[areaId]?.nombre ?? 'Ala Admin';

function hash(n: number): number {
  let h = (n + 1) * 2654435761;
  h ^= h >>> 15;
  h = (h * 2246822519) >>> 0;
  h ^= h >>> 13;
  return (h >>> 0) / 4294967295;
}

/** Floor units for a zone: proportional to headcount, clamped minimum. */
export function zoneUnitsFor(headcount: number): number {
  return 4 + Math.max(0, headcount) * 2.0;
}

/** Zone rect from units: wider than deep, clamped to the slab. */
export function zoneRectFor(units: number): { w: number; h: number } {
  const w = Math.min(9.5, Math.max(2.4, Math.sqrt(units * 1.35)));
  const h = Math.min(8, Math.max(2.2, units / w));
  return { w, h };
}

function makeLabelTexture(
  THREE: typeof import('three'),
  title: string,
  sub: string,
  empty: boolean,
): THREE.CanvasTexture {
  const w = 512;
  const h = 160;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  ctx.fillStyle = 'rgba(12,12,12,0.86)';
  ctx.strokeStyle = empty ? 'rgba(245,237,216,0.35)' : 'rgba(201,168,76,0.85)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(6, 6, w - 12, h - 12, 44);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = empty ? '#8a8672' : '#C9A84C';
  ctx.beginPath();
  ctx.arc(64, h / 2, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F5EDD8';
  ctx.font = '700 44px Manrope, system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  const maxW = w - 130;
  let title2 = title;
  while (ctx.measureText(title2).width > maxW && title2.length > 4) {
    title2 = title2.slice(0, -2);
  }
  if (title2 !== title) title2 = `${title2.trim()}…`;
  ctx.fillText(title2, 100, h / 2 - 22);
  ctx.fillStyle = 'rgba(245,237,216,0.62)';
  ctx.font = '500 30px Manrope, system-ui, sans-serif';
  ctx.fillText(sub, 100, h / 2 + 30);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeBlobTexture(THREE: typeof import('three')): THREE.CanvasTexture {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  const g = ctx.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.42)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Toldo a rayas para puestos/food-trucks (un color + crema). */
function makeStripeTexture(
  THREE: typeof import('three'),
  color: string,
): THREE.CanvasTexture {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  ctx.fillStyle = '#f5edd8';
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = color;
  for (let x = 0; x < s; x += 32) ctx.fillRect(x, 0, 16, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Video wall: canvas tenue con barras + onda (se redibuja a bajo fps). */
function makeVideoWall(
  THREE: typeof import('three'),
): { tex: THREE.CanvasTexture; redraw: (t: number) => void } {
  const w = 512;
  const h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  const redraw = (t: number) => {
    ctx.fillStyle = '#0d1622';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(120,160,200,0.16)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= w; gx += 64) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }
    for (let gy = 0; gy <= h; gy += 64) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }
    // Barras (teal / dorado apagados, sin blanco).
    for (let i = 0; i < 12; i++) {
      const v = 0.5 + 0.5 * Math.sin(t * 0.9 + i * 1.1);
      const bh = 24 + v * 120;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(160,130,70,0.85)' : 'rgba(70,150,135,0.85)';
      ctx.fillRect(18 + i * 26, h - 20 - bh, 16, bh);
    }
    // Onda (azul tenue).
    ctx.strokeStyle = 'rgba(130,175,220,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 8) {
      const y = 66 + Math.sin(x * 0.03 + t * 1.7) * 22 + Math.sin(x * 0.011 - t) * 10;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };
  redraw(0.8);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, redraw };
}

/** Directorio: gráfico de barras estático en tonos tenues. */
function makeBoardTexture(THREE: typeof import('three')): THREE.CanvasTexture {
  const w = 512;
  const h = 224;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  ctx.fillStyle = '#101a26';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(201,168,76,0.9)';
  ctx.font = '700 34px Manrope, system-ui, sans-serif';
  ctx.fillText('Directorio · Avance', 28, 48);
  const vals = [0.55, 0.8, 0.45, 0.95, 0.65, 0.75];
  vals.forEach((v, i) => {
    const bh = v * 110;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(70,150,135,0.9)' : 'rgba(160,130,70,0.9)';
    ctx.fillRect(34 + i * 74, h - 24 - bh, 48, bh);
  });
  ctx.strokeStyle = 'rgba(130,175,220,0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, w - 8, h - 8);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Perimeter logo plate: GCB wordmark on dark bronze, no white burn. */
function makeLogoTexture(THREE: typeof import('three')): THREE.CanvasTexture {
  const w = 1024;
  const h = 128;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  ctx.fillStyle = '#241c12';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#C9A84C';
  ctx.font = '700 64px Manrope, system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('GCB', 48, h / 2 + 2);
  ctx.fillStyle = 'rgba(245,237,216,0.78)';
  ctx.font = '500 40px Manrope, system-ui, sans-serif';
  ctx.fillText('· GRUPO CORDILLERA BLANCA', 220, h / 2 + 2);
  ctx.strokeStyle = 'rgba(201,168,76,0.5)';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, w - 8, h - 8);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

type AvatarMode = 'sit' | 'stand' | 'walk';
type AvatarState = 'work' | 'stroll' | 'chat';

interface Avatar {
  person: OficinaPersona;
  short: string;
  areaId: string;
  areaIdx: number;
  behavior: Behavior;
  mode: AvatarMode;
  state: AvatarState;
  stateT: number; // seconds left in this state
  // Anchor post (desk / spot). Stroll/chat steer away and back: no teleports.
  ax: number;
  az: number;
  x: number;
  z: number;
  yaw: number;
  faceYaw: number; // fixed facing for watch/serve poses
  seatY: number;
  phase: number;
  scale: number;
  shirt: number;
  pants: number;
  skin: number;
  // Walk loop waypoints (district loop, ping-pong).
  path: Array<{ x: number; z: number }>;
  seg: number;
  segT: number;
  dir: 1 | -1;
  speed: number;
  chatX: number;
  chatZ: number;
  carriesBox: boolean;
  isWelder: boolean;
  /** Control: operador de pie que señala el video wall. */
  isPointer: boolean;
  /** Central: avatar conversando en la kitchenette (con café). */
  isKitchen: boolean;
}

const lerpAngle = (a: number, b: number, t: number): number => {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * Math.min(1, t);
};

export async function initOficina(
  canvas: HTMLCanvasElement,
  areas: OficinaArea[],
  opts: { tooltip: HTMLElement | null; onSelect?: (areaId: string) => void } = {
    tooltip: null,
  },
): Promise<OficinaHandle> {
  const THREE = await import('three');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.setSize(canvas.clientWidth || 1, canvas.clientHeight || 1, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 1, 600);
  const TARGET = new THREE.Vector3(0, 0.6, 0);
  const VIEW_DIR = new THREE.Vector3(1, 0.85, 1).normalize();

  // Slab 64 × 40: projected half-extents for azimuth 45° / elevation ~31°.
  const SLAB_W = 64;
  const SLAB_D = 40;
  const SLAB_HALF = Math.max(SLAB_W, SLAB_D) / 2;
  const HALF_W = SLAB_HALF * Math.SQRT2;
  const HALF_H = HALF_W * VIEW_DIR.y + 11 * Math.sqrt(1 - VIEW_DIR.y ** 2);
  const fitDistance = (aspect: number): number => {
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dV = HALF_H / tanV;
    const dH = HALF_W / (tanV * Math.max(0.3, aspect));
    return Math.max(dV, dH) * 1.06;
  };
  const placeCamera = (dist: number) => {
    camera.position.copy(TARGET).addScaledVector(VIEW_DIR, dist);
    camera.lookAt(TARGET);
    camera.near = Math.max(0.5, dist / 100);
    camera.far = dist * 6 + 200;
    camera.updateProjectionMatrix();
  };
  placeCamera(fitDistance(canvas.clientWidth / Math.max(1, canvas.clientHeight)));

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(TARGET);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minPolarAngle = 0.5;
  controls.maxPolarAngle = 1.38;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 0.55;
  const syncZoomLimits = (fit: number) => {
    controls.minDistance = fit * 0.35;
    controls.maxDistance = fit * 1.7;
  };
  syncZoomLimits(camera.position.distanceTo(TARGET));
  let userZoomed = false;
  controls.addEventListener('start', () => {
    userZoomed = true;
    controls.autoRotate = false;
  });

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.3;

  const hemi = new THREE.HemisphereLight(0xf5edd8, 0x1a1408, 0.35);
  const sun = new THREE.DirectionalLight(0xfff2d0, 1.0);
  sun.position.set(20, 26, 12);
  scene.add(hemi, sun);

  const rig = new THREE.Group();
  rig.name = 'campus-rig';
  scene.add(rig);

  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(v: T): T => {
    disposables.push(v);
    return v;
  };

  // ── Shared materials ──
  const slabMat = track(new THREE.MeshStandardMaterial({ color: 0x241c12, roughness: 0.95, metalness: 0 }));
  const trimMat = track(new THREE.MeshStandardMaterial({ color: 0xc9a84c, roughness: 0.45, metalness: 0.65 }));
  const groundMat = track(new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0.02 }));
  const carpetMat = track(new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0.04 }));
  const wallMat = track(new THREE.MeshStandardMaterial({ color: 0x33291d, roughness: 0.9, metalness: 0 }));
  const pillarMat = track(new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.2 }));
  const deskTopMat = track(new THREE.MeshStandardMaterial({ color: 0x8a6844, roughness: 0.6, metalness: 0.1 }));
  const deskLegMat = track(new THREE.MeshStandardMaterial({ color: 0x241c14, roughness: 0.65, metalness: 0.15 }));
  const monitorMat = track(new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.5, metalness: 0.4 }));
  const screenMat = track(
    new THREE.MeshStandardMaterial({ color: 0x2b3648, emissive: 0x9db4d4, emissiveIntensity: 0.55, roughness: 0.4, metalness: 0 }),
  );
  const videoWall = makeVideoWall(THREE);
  track(videoWall.tex);
  const videoMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xcfd8e2, map: videoWall.tex, emissive: 0x9fc4ff,
      emissiveMap: videoWall.tex, emissiveIntensity: 0.55,
      roughness: 0.35, metalness: 0,
    }),
  );
  const heroScreenMat = track(
    new THREE.MeshStandardMaterial({ color: 0x0d1420, emissive: 0x8fd0a8, emissiveIntensity: 1.0, roughness: 0.35, metalness: 0 }),
  );
  const serverMat = track(new THREE.MeshStandardMaterial({ color: 0x1a1d24, roughness: 0.5, metalness: 0.6 }));
  const ledMat = track(
    new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffffff, emissiveIntensity: 1.6, roughness: 0.4, metalness: 0 }),
  );
  const chairMat = track(new THREE.MeshStandardMaterial({ color: 0x26211b, roughness: 0.7, metalness: 0.3 }));
  const torsoMat = track(new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0 }));
  const limbMat = track(new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0 }));
  const pantsMat = track(new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0 }));
  const headMat = track(new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0 }));
  const leafMat = track(new THREE.MeshStandardMaterial({ color: 0x3d6b35, roughness: 0.9, metalness: 0 }));
  const trunkMat = track(new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.9, metalness: 0 }));
  const tableMat = track(new THREE.MeshStandardMaterial({ color: 0x6e5638, roughness: 0.6, metalness: 0.1 }));
  const stoolMat = track(new THREE.MeshStandardMaterial({ color: 0x3a3227, roughness: 0.75, metalness: 0.1 }));
  const carPaintMat = track(new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.5 }));
  const carGlassMat = track(new THREE.MeshStandardMaterial({ color: 0x1c2836, roughness: 0.2, metalness: 0.7 }));
  const tireMat = track(new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9, metalness: 0 }));
  const hutMat = track(new THREE.MeshStandardMaterial({ color: 0x4a4238, roughness: 0.8, metalness: 0.05 }));
  const hutRoofMat = track(new THREE.MeshStandardMaterial({ color: 0xc9a84c, roughness: 0.6, metalness: 0.2 }));
  const standMat = track(new THREE.MeshStandardMaterial({ color: 0xd8cba6, roughness: 0.8, metalness: 0 }));
  const stageMat = track(new THREE.MeshStandardMaterial({ color: 0x3a3227, roughness: 0.7, metalness: 0.1 }));
  const backdropMat = track(new THREE.MeshStandardMaterial({ color: 0x241c12, roughness: 0.85, metalness: 0 }));
  const shelfMat = track(new THREE.MeshStandardMaterial({ color: 0x5a5148, roughness: 0.6, metalness: 0.4 }));
  const benchMat = track(new THREE.MeshStandardMaterial({ color: 0x6e5638, roughness: 0.6, metalness: 0.1 }));
  const coneMat = track(new THREE.MeshStandardMaterial({ color: 0xd8622a, roughness: 0.7, metalness: 0 }));
  const boxMat = track(new THREE.MeshStandardMaterial({ color: 0x9a7648, roughness: 0.85, metalness: 0 }));
  const counterMat = track(new THREE.MeshStandardMaterial({ color: 0x8a6844, roughness: 0.6, metalness: 0.1 }));
  const sparkMat = track(
    new THREE.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.95 }),
  );
  const glassMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x9fc4d8, roughness: 0.15, metalness: 0.1,
      transparent: true, opacity: 0.22, depthWrite: false,
    }),
  );
  const lampShadeMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x8a6f45, emissive: 0xffc98a, emissiveIntensity: 0.45,
      roughness: 0.7, metalness: 0,
    }),
  );
  const redLedMat = track(
    new THREE.MeshStandardMaterial({ color: 0x220a0a, emissive: 0xff2a2a, emissiveIntensity: 1.2, roughness: 0.4, metalness: 0 }),
  );
  const blobTex = track(makeBlobTexture(THREE));
  const blobMat = track(new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));

  // ── Shared geometries (low segment counts for mobile) ──
  const slabGeo = track(new THREE.BoxGeometry(SLAB_W, 0.6, SLAB_D));
  const trimGeo = track(new THREE.BoxGeometry(SLAB_W + 0.7, 0.14, SLAB_D + 0.7));
  const unitBoxGeo = track(new THREE.BoxGeometry(1, 1, 1));
  const deskTopGeo = track(new THREE.BoxGeometry(1.7, 0.1, 0.85));
  const deskLegGeo = track(new THREE.BoxGeometry(0.1, 0.7, 0.75));
  const monitorGeo = track(new THREE.BoxGeometry(0.8, 0.52, 0.07));
  const screenGeo = track(new THREE.PlaneGeometry(0.7, 0.42));
  const chairSeatGeo = track(new THREE.BoxGeometry(0.48, 0.09, 0.48));
  const chairBackGeo = track(new THREE.BoxGeometry(0.48, 0.5, 0.08));
  const torsoGeo = track(new THREE.CapsuleGeometry(0.19, 0.42, 2, 8));
  const armGeo = track(new THREE.CapsuleGeometry(0.055, 0.4, 2, 6));
  armGeo.translate(0, -0.22, 0);
  const legGeo = track(new THREE.CapsuleGeometry(0.07, 0.4, 2, 6));
  legGeo.translate(0, -0.22, 0);
  const headGeo = track(new THREE.SphereGeometry(0.15, 10, 8));
  const blobGeo = track(new THREE.PlaneGeometry(0.9, 0.9));
  const pillarGeo = track(new THREE.BoxGeometry(0.34, 2.6, 0.34));
  const ledGeo = track(new THREE.BoxGeometry(0.14, 0.1, 0.04));
  const videoGeo = track(new THREE.PlaneGeometry(2.4, 1.4));
  const heroGeo = track(new THREE.PlaneGeometry(3.4, 1.8));
  const carBodyGeo = track(new THREE.BoxGeometry(1.7, 0.55, 3.6));
  const carCabinGeo = track(new THREE.BoxGeometry(1.45, 0.5, 1.8));
  const wheelGeo = track(new THREE.CylinderGeometry(0.32, 0.32, 0.24, 10));
  wheelGeo.rotateZ(Math.PI / 2);
  const awningGeo = track(new THREE.PlaneGeometry(2.6, 1.2));
  const eventChairGeo = track(new THREE.BoxGeometry(0.45, 0.45, 0.45));
  const eventBackGeo = track(new THREE.BoxGeometry(0.45, 0.55, 0.08));
  const coneGeo = track(new THREE.ConeGeometry(0.22, 0.55, 10));
  const shelfGeo = track(new THREE.BoxGeometry(2.4, 1.8, 0.6));
  const trunkGeo = track(new THREE.CylinderGeometry(0.12, 0.16, 1.2, 7));
  const crownGeo = track(new THREE.SphereGeometry(0.75, 10, 8));
  const tableGeo = track(new THREE.CylinderGeometry(0.75, 0.75, 0.08, 18));
  const tableLegGeo = track(new THREE.CylinderGeometry(0.06, 0.08, 0.68, 8));
  const stoolGeo = track(new THREE.CylinderGeometry(0.26, 0.26, 0.42, 12));
  const cupGeo = track(new THREE.CylinderGeometry(0.05, 0.04, 0.1, 8));
  const sparkGeo = track(new THREE.SphereGeometry(0.09, 8, 6));

  // ── Zone packing: shelf per district, area ∝ headcount ──
  const byId = new Map(areas.map((a) => [a.id, a]));
  const zones: Zone[] = [];
  const GAP = 0.6;
  DISTRICTS.forEach((d, di) => {
    const list = areas.filter((a) => districtOf[a.id] === d.id);
    list.sort((p, q) => q.personas!.length - p.personas!.length || p.id.localeCompare(q.id));
    let curX = d.x0 + 0.9;
    let curZ = d.z0 + 0.9;
    let rowH = 0;
    for (const a of list) {
      const { w, h } = zoneRectFor(zoneUnitsFor(a.count));
      if (curX + w > d.x1 - 0.6) {
        curX = d.x0 + 0.9;
        curZ += rowH + GAP;
        rowH = 0;
      }
      // Clamp inside the district (huge zones like Operaciones fill the row).
      const cw = Math.min(w, d.x1 - d.x0 - 1.8);
      const ch = Math.min(h, d.z1 - d.z0 - 1.8);
      const cx = Math.min(curX + cw / 2, d.x1 - 0.9 - cw / 2);
      const cz = Math.min(curZ + ch / 2, d.z1 - 0.9 - ch / 2);
      // Open plan: en Central el acento es el color del equipo (isla),
      // no un índice rotativo; así cada alfombra marca a su equipo.
      const ala = ALA_OF[a.id];
      const accent = ala && d.id === 'central'
        ? ala.color
        : ACCENTS[(areas.indexOf(a) + di) % ACCENTS.length];
      zones.push({ area: a, cx, cz, w: cw, h: ch, accent });
      curX += cw + GAP;
      rowH = Math.max(rowH, ch);
    }
  });
  zones.sort((p, q) => areas.indexOf(p.area) - areas.indexOf(q.area));
  void byId;

  // ── People → avatars (one per real person) ──
  interface FlatPerson { p: OficinaPersona; zone: Zone; zoneIdx: number; gi: number }
  const flat: FlatPerson[] = [];
  {
    let gi = 0;
    zones.forEach((z, zi) => {
      for (const p of z.area.personas ?? []) flat.push({ p, zone: z, zoneIdx: zi, gi: gi++ });
    });
  }

  const behaviorOf = (areaId: string): Behavior => {
    if (areaId === 'operaciones-cavas') return 'serve'; // atiende mostrador
    return DISTRICTS.find((d) => d.id === districtOf[areaId])?.behavior ?? 'office';
  };

  // District stroll loops (rectangles inset in each district).
  const loops = new Map<string, Array<{ x: number; z: number }>>();
  for (const d of DISTRICTS) {
    const ix = Math.min(3, (d.x1 - d.x0) / 2 - 1.2);
    const iz = Math.min(3, (d.z1 - d.z0) / 2 - 1.2);
    const cx = (d.x0 + d.x1) / 2;
    const cz = (d.z0 + d.z1) / 2;
    loops.set(d.id, [
      { x: cx - ix, z: cz - iz },
      { x: cx + ix, z: cz - iz },
      { x: cx + ix, z: cz + iz },
      { x: cx - ix, z: cz + iz },
    ]);
  }
  // Parking patrol: slalom between the two car rows.
  loops.set('parking', [
    { x: 13.5, z: 3.2 }, { x: 28.5, z: 3.2 }, { x: 28.5, z: 6.8 }, { x: 13.5, z: 6.8 },
  ]);

  const avatars: Avatar[] = [];
  const desksByZone = new Map<number, Array<{ x: number; z: number; rot: number }>>();
  const standSpots = new Map<number, Array<{ x: number; z: number }>>();

  zones.forEach((z, zi) => {
    const beh = behaviorOf(z.area.id);
    const inZone = flat.filter((f) => f.zoneIdx === zi);
    const desks: Array<{ x: number; z: number; rot: number }> = [];
    if (beh === 'office' && inZone.length > 0) {
      // Open plan: isla del equipo; rejilla compacta de pares enfrentados
      // (rot alterna 0/PI por fila) alrededor del centro de la isla.
      // El offset por zona evita que áreas del mismo equipo se apilen.
      const isl = TEAM_ISLANDS.find((t) => t.team === teamOfArea(z.area.id)) ?? TEAM_ISLANDS[0];
      const zoneOff = (zi % 5) * 0.35;
      const cols = Math.max(1, Math.ceil(Math.sqrt(inZone.length * 1.4)));
      const rows = Math.max(1, Math.ceil(inZone.length / cols));
      inZone.forEach((_, d) => {
        const c = d % cols;
        const r = Math.floor(d / cols);
        const dx = cols > 1 ? (c / (cols - 1) - 0.5) * 4.6 : 0;
        const dz = rows > 1 ? (r / (rows - 1) - 0.5) * 3.0 : 0;
        const rot = r % 2 === 0 ? 0 : Math.PI;
        desks.push({ x: isl.cx + dx + zoneOff, z: isl.cz + dz, rot });
      });
    }
    if (beh === 'control' && inZone.length > 0) {
      // Consolas en rejilla mirando al video wall (norte, rot 0).
      const cols = 4;
      const rows = Math.max(1, Math.ceil(inZone.length / cols));
      const aw = Math.max(1.5, z.w - 1.6);
      const ah = Math.max(1.5, z.h - 1.6);
      inZone.forEach((_, d) => {
        const c = d % cols;
        const r = Math.floor(d / cols);
        const dx = cols > 1 ? (c / (cols - 1) - 0.5) * aw : 0;
        const dz = rows > 1 ? (r / (rows - 1) - 0.5) * ah : 0;
        desks.push({ x: z.cx + dx, z: z.cz + dz, rot: 0 });
      });
    }
    desksByZone.set(zi, desks);
    // Conversation cluster: zone corner pulled toward the district center.
    const d = DISTRICTS.find((dd) => dd.id === districtOf[z.area.id])!;
    const gcX = (d.x0 + d.x1) / 2;
    const gcZ = (d.z0 + d.z1) / 2;
    const sx = z.cx + Math.sign(gcX - z.cx || 1) * Math.max(0, z.w / 2 - 0.95);
    const sz = z.cz + Math.sign(gcZ - z.cz || 1) * Math.max(0, z.h / 2 - 0.95);
    const spots: Array<{ x: number; z: number }> = [];
    const nChat = Math.min(inZone.length, 4);
    for (let s = 0; s < nChat; s++) {
      const a = (s / Math.max(1, nChat)) * Math.PI * 2;
      spots.push({ x: sx + Math.cos(a) * 0.55, z: sz + Math.sin(a) * 0.55 });
    }
    standSpots.set(zi, spots);
  });

  // Welder: first mantenimiento avatar. Carriers: some mount/taller avatars.
  const welderGi = flat.find((f) => f.zone.area.id === 'mantenimiento')?.gi ?? -1;
  let carrierBudget = 10;

  flat.forEach((f) => {
    const beh = behaviorOf(f.zone.area.id);
    const z = f.zone;
    const zi = f.zoneIdx;
    const gi = f.gi;
    const sc = 0.93 + hash(gi) * 0.14;
    const desks = desksByZone.get(zi) ?? [];
    const idxInZone = flat.filter((x) => x.zoneIdx === zi).findIndex((x) => x.gi === gi);
    const a: Avatar = {
      person: f.p,
      short: nombreCorto(f.p.nombre),
      areaId: z.area.id,
      areaIdx: zi,
      behavior: beh,
      mode: beh === 'office' || beh === 'control' ? 'sit' : 'stand',
      state: beh === 'patrol' ? 'stroll' : 'work',
      stateT: 5 + hash(gi + 40) * 6,
      ax: z.cx, az: z.cz,
      x: z.cx, z: z.cz,
      yaw: hash(gi + 99) * Math.PI * 2,
      faceYaw: 0,
      seatY: 0.5, phase: hash(gi * 3 + 1) * Math.PI * 2, scale: sc,
      shirt: SHIRTS[(gi * 5 + zi) % SHIRTS.length],
      pants: PANTS[(gi * 3 + zi) % PANTS.length],
      skin: SKINS[gi % SKINS.length],
      path: [...(loops.get(districtOf[z.area.id]) ?? [])],
      seg: gi % 4,
      segT: hash(gi + 7),
      dir: 1,
      speed: beh === 'patrol' ? 1.6 : 1.1 + hash(gi + 13) * 0.7,
      chatX: z.cx, chatZ: z.cz,
      carriesBox: false,
      isWelder: gi === welderGi,
      isPointer: false,
      isKitchen: false,
    };
    if ((beh === 'office' || beh === 'control') && desks.length > 0) {
      const dk = desks[idxInZone % desks.length];
      if (dk) {
        const off = dk.rot === 0
          ? { x: 0, z: 0.95 }
          : dk.rot === Math.PI
            ? { x: 0, z: -0.95 }
            : { x: 0.95, z: 0 };
        a.ax = dk.x + off.x;
        a.az = dk.z + off.z;
        a.x = a.ax;
        a.z = a.az;
        a.yaw = Math.atan2(dk.x - a.x, dk.z - a.z);
        a.faceYaw = a.yaw;
        a.seatY = 0.5;
      }
    } else if (beh === 'serve') {
      // Detrás del mostrador (parque, lado este), mirando al parque.
      a.ax = 8.0;
      a.az = 12 + (idxInZone - 1.5) * 1.1;
      a.x = a.ax;
      a.z = a.az;
      a.faceYaw = -Math.PI / 2;
      a.yaw = a.faceYaw;
      a.seatY = 0.78;
    } else {
      const spots = standSpots.get(zi) ?? [{ x: z.cx, z: z.cz }];
      const sp = spots.length > 0 ? spots[idxInZone % spots.length] : { x: z.cx, z: z.cz };
      a.ax = sp.x;
      a.az = sp.z;
      a.x = a.ax;
      a.z = a.az;
      a.seatY = 0.78;
      a.dir = a.seg >= a.path.length - 1 ? -1 : 1;
      if ((beh === 'mount' || beh === 'taller') && !a.isWelder && carrierBudget > 0 && gi % 2 === 0) {
        a.carriesBox = true;
        carrierBudget--;
      }
    }
    const spots = standSpots.get(zi) ?? [{ x: z.cx, z: z.cz }];
    a.chatX = spots[0]?.x ?? z.cx;
    a.chatZ = spots[0]?.z ?? z.cz;
    a.seg = a.path.length > 0 ? gi % a.path.length : 0;
    avatars.push(a);
  });

  // Roles fijos: 1 operador de pie que señala el wall + 2 con café en la kitchenette.
  const KX = 5.5;
  const KZ = -3.4;
  {
    const firstControl = avatars.find((a) => a.behavior === 'control');
    if (firstControl) {
      firstControl.isPointer = true;
      firstControl.mode = 'stand';
      firstControl.seatY = 0.78;
      firstControl.state = 'work';
    }
    const officePool = avatars.filter((a) => a.behavior === 'office');
    const k1 = officePool[0];
    const k2 = officePool[1];
    if (k1 && k2) {
      const spots = [
        { x: KX - 0.9, z: KZ + 0.8 },
        { x: KX + 0.9, z: KZ - 0.8 },
      ];
      [k1, k2].forEach((k, i) => {
        k.isKitchen = true;
        k.mode = 'stand';
        k.seatY = 0.78;
        k.state = 'work';
        k.ax = spots[i].x;
        k.az = spots[i].z;
        k.x = k.ax;
        k.z = k.az;
        const o = spots[1 - i];
        k.faceYaw = Math.atan2(o.x - k.x, o.z - k.z);
        k.yaw = k.faceYaw;
      });
    }
  }

  const NF = avatars.length;
  const N = zones.length;

  // ── Instanced meshes (one draw call each) ──
  const dummy = new THREE.Object3D();

  const slab = new THREE.Mesh(slabGeo, slabMat);
  slab.position.y = -0.42;
  slab.name = 'slab';
  rig.add(slab);
  const trim = new THREE.Mesh(trimGeo, trimMat);
  trim.position.y = -0.62;
  rig.add(trim);

  const grounds = new THREE.InstancedMesh(unitBoxGeo, groundMat, DISTRICTS.length);
  grounds.name = 'grounds';
  DISTRICTS.forEach((dd, i) => {
    dummy.position.set((dd.x0 + dd.x1) / 2, -0.06, (dd.z0 + dd.z1) / 2);
    dummy.scale.set(dd.x1 - dd.x0, 0.16, dd.z1 - dd.z0);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    grounds.setMatrixAt(i, dummy.matrix);
    grounds.setColorAt(i, new THREE.Color(dd.ground));
  });

  const carpets = new THREE.InstancedMesh(unitBoxGeo, carpetMat, Math.max(1, N));
  carpets.name = 'carpets';

  // Desks: office (1 monitor c/u) + consolas de control (doble monitor).
  let officeDesks = 0;
  let controlDesks = 0;
  zones.forEach((z, zi) => {
    const n = (desksByZone.get(zi) ?? []).length;
    if (behaviorOf(z.area.id) === 'control') controlDesks += n;
    else officeDesks += n;
  });
  const ND = Math.max(1, officeDesks + controlDesks);
  const NMON = Math.max(1, officeDesks + controlDesks * 2);
  const deskTops = new THREE.InstancedMesh(deskTopGeo, deskTopMat, ND);
  const deskLegs = new THREE.InstancedMesh(deskLegGeo, deskLegMat, ND * 2);
  const monitors = new THREE.InstancedMesh(monitorGeo, monitorMat, NMON);
  const screens = new THREE.InstancedMesh(screenGeo, screenMat, NMON);
  const seatedTotal = avatars.filter((a) => a.mode === 'sit').length;
  const chairs = new THREE.InstancedMesh(chairSeatGeo, chairMat, Math.max(1, seatedTotal));
  const chairBacks = new THREE.InstancedMesh(chairBackGeo, chairMat, Math.max(1, seatedTotal));

  // Avatar parts: 6 InstancedMeshes, one per body part.
  const NAv = Math.max(1, NF);
  const torsos = new THREE.InstancedMesh(torsoGeo, torsoMat, NAv);
  torsos.name = 'avatars-torso';
  const heads = new THREE.InstancedMesh(headGeo, headMat, NAv);
  const armL = new THREE.InstancedMesh(armGeo, limbMat, NAv);
  const armR = new THREE.InstancedMesh(armGeo, limbMat, NAv);
  const legL = new THREE.InstancedMesh(legGeo, pantsMat, NAv);
  const legR = new THREE.InstancedMesh(legGeo, pantsMat, NAv);
  const blobs = new THREE.InstancedMesh(blobGeo, blobMat, NAv);
  blobs.renderOrder = 1;
  const proxyGeo = track(new THREE.CylinderGeometry(0.42, 0.42, 1.7, 6));
  const proxyMat = track(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  proxyMat.colorWrite = false;
  const proxies = new THREE.InstancedMesh(proxyGeo, proxyMat, NAv);
  proxies.name = 'avatar-proxies';
  for (const m of [torsos, heads, armL, armR, legL, legR, blobs, proxies]) {
    m.frustumCulled = false;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }

  // Walls: district perimeters (gap on one side = entrance) + central dividers.
  const wallSegs: Array<[number, number, number, number, number, number]> = [];
  const pushRectWalls = (x0: number, z0: number, x1: number, z1: number, gapSide: 'N' | 'S' | 'E' | 'W') => {
    const cx = (x0 + x1) / 2;
    const cz = (z0 + z1) / 2;
    const w = x1 - x0;
    const dd = z1 - z0;
    if (gapSide !== 'N') wallSegs.push([cx, 0.55, z0, w, 1.1, 0.3]);
    else {
      wallSegs.push([(x0 + cx) / 2 - 1.2, 0.55, z0, w / 2 - 2.4, 1.1, 0.3]);
      wallSegs.push([(cx + x1) / 2 + 1.2, 0.55, z0, w / 2 - 2.4, 1.1, 0.3]);
    }
    if (gapSide !== 'S') wallSegs.push([cx, 0.55, z1, w, 1.1, 0.3]);
    else {
      wallSegs.push([(x0 + cx) / 2 - 1.2, 0.55, z1, w / 2 - 2.4, 1.1, 0.3]);
      wallSegs.push([(cx + x1) / 2 + 1.2, 0.55, z1, w / 2 - 2.4, 1.1, 0.3]);
    }
    if (gapSide !== 'W') wallSegs.push([x0, 0.55, cz, 0.3, 1.1, dd]);
    else {
      wallSegs.push([x0, 0.55, (z0 + cz) / 2 - 1.2, 0.3, 1.1, dd / 2 - 2.4]);
      wallSegs.push([x0, 0.55, (cz + z1) / 2 + 1.2, 0.3, 1.1, dd / 2 - 2.4]);
    }
    if (gapSide !== 'E') wallSegs.push([x1, 0.55, cz, 0.3, 1.1, dd]);
    else {
      wallSegs.push([x1, 0.55, (z0 + cz) / 2 - 1.2, 0.3, 1.1, dd / 2 - 2.4]);
      wallSegs.push([x1, 0.55, (cz + z1) / 2 + 1.2, 0.3, 1.1, dd / 2 - 2.4]);
    }
  };
  const central = DISTRICTS[0];
  const control = DISTRICTS[1];
  pushRectWalls(central.x0, central.z0, central.x1, central.z1, 'S');
  pushRectWalls(control.x0, control.z0, control.x1, control.z1, 'S');
  // Open plan: SIN muros entre islas. Solo divisores bajos (0.55) que
  // marcan la cruz de circulación entre las 4 islas + remates hacia
  // Directorio (oeste) y kitchenette (este), sin cerrar el espacio.
  wallSegs.push([-14.2, 0.28, -10.8, 0.16, 0.55, 8.6]);
  wallSegs.push([-13.5, 0.28, -10.8, 5.6, 0.55, 0.16]);
  wallSegs.push([-24.5, 0.28, -7.0, 3.4, 0.55, 0.16]);
  wallSegs.push([0.5, 0.28, -8.0, 3.2, 0.55, 0.16]);
  const walls = new THREE.InstancedMesh(unitBoxGeo, wallMat, wallSegs.length);
  walls.name = 'walls';

  // Marcadores de isla: 4 pilares bajos por equipo en las esquinas
  // de cada isla (color del equipo), no por zona.
  const pillarSpots: Array<{ x: number; z: number; color: number }> = [];
  TEAM_ISLANDS.forEach((t) => {
    pillarSpots.push(
      { x: t.cx - 2.6, z: t.cz - 1.8, color: t.color },
      { x: t.cx + 2.6, z: t.cz - 1.8, color: t.color },
      { x: t.cx - 2.6, z: t.cz + 1.8, color: t.color },
      { x: t.cx + 2.6, z: t.cz + 1.8, color: t.color },
    );
  });
  const pillars = new THREE.InstancedMesh(pillarGeo, pillarMat, Math.max(1, pillarSpots.length));

  // ── Centro de control: video wall + torre de servidor ──
  const videoWallX = (control.x0 + control.x1) / 2;
  const videoWallZ = control.z0 + 0.4;
  const videos = new THREE.InstancedMesh(videoGeo, videoMat, 15);
  const hero = new THREE.Mesh(heroGeo, heroScreenMat);
  hero.position.set(videoWallX, 5.9, videoWallZ + 0.02);
  hero.rotation.y = 0;
  hero.scale.set(1.5, 1, 1);
  hero.name = 'control-banner';
  rig.add(hero);
  const serverX = control.x1 - 2.2;
  const serverZ = (control.z0 + control.z1) / 2;
  const server = new THREE.Mesh(unitBoxGeo, serverMat);
  server.scale.set(1.4, 2.4, 1.2);
  server.position.set(serverX, 1.2, serverZ);
  server.name = 'server-tower';
  rig.add(server);
  // Racks extra junto a la torre (mismo material, 1 draw call c/u).
  const rack2 = new THREE.Mesh(unitBoxGeo, serverMat);
  rack2.scale.set(1.4, 2.2, 1.2);
  rack2.position.set(serverX, 1.1, serverZ + 2.6);
  rack2.name = 'server-rack-2';
  rig.add(rack2);
  const rack3 = new THREE.Mesh(unitBoxGeo, serverMat);
  rack3.scale.set(1.4, 2.0, 1.2);
  rack3.position.set(serverX, 1.0, serverZ - 2.6);
  rack3.name = 'server-rack-3';
  rig.add(rack3);
  const LED_ROWS = 5;
  const LED_COLS = 2;
  const LED_RACKS = 3;
  const leds = new THREE.InstancedMesh(ledGeo, ledMat, LED_ROWS * LED_COLS * LED_RACKS);
  leds.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  // ── Estacionamiento: 6 autos + caseta ──
  const CAR_N = 6;
  const carBodies = new THREE.InstancedMesh(carBodyGeo, carPaintMat, CAR_N);
  const carCabins = new THREE.InstancedMesh(carCabinGeo, carGlassMat, CAR_N);
  const carWheels = new THREE.InstancedMesh(wheelGeo, tireMat, CAR_N * 4);
  const CAR_COLORS = [0xb0b4b8, 0x7a2e2e, 0x2e4a7a, 0xc9a84c, 0x3f8a76, 0x8a8f94];
  const parking = DISTRICTS[4];
  const carSpots: Array<{ x: number; z: number }> = [];
  for (let i = 0; i < CAR_N; i++) {
    const row = i < 3 ? 0 : 1;
    const col = i % 3;
    carSpots.push({ x: 15 + col * 6, z: row === 0 ? 2.8 : 8.2 });
  }
  const hut = new THREE.Mesh(unitBoxGeo, hutMat);
  hut.scale.set(1.8, 2.0, 1.8);
  hut.position.set(parking.x1 - 1.6, 1.0, (parking.z0 + parking.z1) / 2);
  rig.add(hut);
  const hutRoof = new THREE.Mesh(unitBoxGeo, hutRoofMat);
  hutRoof.scale.set(2.2, 0.18, 2.2);
  hutRoof.position.set(parking.x1 - 1.6, 2.1, (parking.z0 + parking.z1) / 2);
  rig.add(hutRoof);

  // ── Convexia: stands + escenario + sillas ──
  const stands = new THREE.InstancedMesh(unitBoxGeo, standMat, 4);
  const awnTexA = track(makeStripeTexture(THREE, '#c9a84c'));
  const awnMatA = track(new THREE.MeshStandardMaterial({ map: awnTexA, roughness: 0.8, metalness: 0 }));
  const awnings = new THREE.InstancedMesh(awningGeo, awnMatA, 4);
  const convexia = DISTRICTS[2];
  const stage = new THREE.Mesh(unitBoxGeo, stageMat);
  stage.scale.set(7, 0.6, 4);
  stage.position.set((convexia.x0 + convexia.x1) / 2, 0.3, convexia.z1 - 2.6);
  rig.add(stage);
  const backdrop = new THREE.Mesh(unitBoxGeo, backdropMat);
  backdrop.scale.set(7, 2.6, 0.3);
  backdrop.position.set((convexia.x0 + convexia.x1) / 2, 1.6, convexia.z1 - 0.9);
  rig.add(backdrop);
  const EVENT_ROWS = 3;
  const EVENT_COLS = 6;
  const DIR_CHAIRS = 6;
  const eventChairs = new THREE.InstancedMesh(eventChairGeo, stoolMat, EVENT_ROWS * EVENT_COLS + DIR_CHAIRS);
  const eventBacks = new THREE.InstancedMesh(eventBackGeo, chairMat, EVENT_ROWS * EVENT_COLS + DIR_CHAIRS);

  // ── Parque: 3 puestos + mesas + arboleda + mostrador ──
  const trucks = new THREE.InstancedMesh(unitBoxGeo, standMat, 3);
  const awnTexB = track(makeStripeTexture(THREE, '#b0503c'));
  const awnMatB = track(new THREE.MeshStandardMaterial({ map: awnTexB, roughness: 0.8, metalness: 0 }));
  const truckAwnings = new THREE.InstancedMesh(awningGeo, awnMatB, 3);
  const cafeTables = new THREE.InstancedMesh(tableGeo, tableMat, 4);
  const cafeLegs = new THREE.InstancedMesh(tableLegGeo, deskLegMat, 4);
  const stools = new THREE.InstancedMesh(stoolGeo, stoolMat, 20);
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, 14);
  const crowns = new THREE.InstancedMesh(crownGeo, leafMat, 14);
  const counter = new THREE.Mesh(unitBoxGeo, counterMat);
  counter.scale.set(1.0, 1.0, 3.4);
  counter.position.set(7.2, 0.5, 12);
  counter.name = 'mostrador-caja';
  rig.add(counter);

  // ── Taller: estanterías + banco + conos + cajas ──
  const shelves = new THREE.InstancedMesh(shelfGeo, shelfMat, 3);
  const bench = new THREE.Mesh(unitBoxGeo, benchMat);
  const taller = DISTRICTS[5];
  bench.scale.set(3.2, 0.9, 1.2);
  bench.position.set((taller.x0 + taller.x1) / 2, 0.45, taller.z1 - 2.2);
  rig.add(bench);
  const cones = new THREE.InstancedMesh(coneGeo, coneMat, 6);
  const NBOX = 14;
  const boxes = new THREE.InstancedMesh(unitBoxGeo, boxMat, NBOX);
  const spark = new THREE.Mesh(sparkGeo, sparkMat);
  spark.visible = false;
  rig.add(spark);

  // ── Interiores nuevos (1 draw call c/u, geos/mats compartidos) ──
  // Kitchenette: mueble + microondas + cafetera + mesa alta (counters 6).
  // Directorio: mesa grande + patas (dirTables 5) + sala vidriada (glass 5).
  // Control: teclados + frentes (kbMesh), domos PTZ + LED rojo, cables.
  const counters = new THREE.InstancedMesh(unitBoxGeo, counterMat, 6);
  const kbMesh = new THREE.InstancedMesh(unitBoxGeo, monitorMat, Math.max(1, controlDesks + 3));
  const dirTables = new THREE.InstancedMesh(unitBoxGeo, benchMat, 5);
  const glassPanels = new THREE.InstancedMesh(unitBoxGeo, glassMat, 5);
  const lampPoles = new THREE.InstancedMesh(tableLegGeo, deskLegMat, 6);
  const lampShades = new THREE.InstancedMesh(crownGeo, lampShadeMat, 6);
  const rugs = new THREE.InstancedMesh(unitBoxGeo, carpetMat, 5);
  const ptzDomes = new THREE.InstancedMesh(headGeo, monitorMat, 4);
  const ptzLeds = new THREE.InstancedMesh(ledGeo, redLedMat, 4);
  ptzLeds.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const cables = new THREE.InstancedMesh(unitBoxGeo, tireMat, 9);
  const cups = new THREE.InstancedMesh(cupGeo, counterMat, 2);
  cups.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  cups.frustumCulled = false;
  const boardTex = track(makeBoardTexture(THREE));
  const boardMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xcfd8e2, map: boardTex, emissive: 0xbfd4e6,
      emissiveMap: boardTex, emissiveIntensity: 0.5, roughness: 0.4, metalness: 0,
    }),
  );
  const boardScreen = new THREE.Mesh(track(new THREE.PlaneGeometry(3.2, 1.4)), boardMat);
  boardScreen.position.set(-25.5, 1.6, -5.85);
  boardScreen.name = 'directorio-screen';
  rig.add(boardScreen);

  rig.add(
    grounds, carpets, deskTops, deskLegs, monitors, screens, chairs, chairBacks,
    torsos, heads, armL, armR, legL, legR, blobs, proxies,
    walls, pillars, videos, leds,
    carBodies, carCabins, carWheels,
    stands, awnings, eventChairs, eventBacks,
    trucks, truckAwnings, cafeTables, cafeLegs, stools,
    trunks, crowns, shelves, cones, boxes,
    counters, kbMesh, dirTables, glassPanels, lampPoles, lampShades,
    rugs, ptzDomes, ptzLeds, cables, cups,
  );

  const tmpColor = new THREE.Color();
  const baseCarpet = new THREE.Color(0x2e2620);

  zones.forEach((z, i) => {
    dummy.position.set(z.cx, -0.02, z.cz);
    dummy.scale.set(z.w, 0.16, z.h);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    carpets.setMatrixAt(i, dummy.matrix);
    tmpColor.copy(baseCarpet).lerp(new THREE.Color(z.accent), 0.26);
    carpets.setColorAt(i, tmpColor);
  });

  // Desks + monitors + screens (office 1x; control: consola + doble monitor + teclado).
  {
    let di = 0;
    let mi = 0;
    let ki = 0;
    const putLegs = (x: number, z: number, rot: number) => {
      dummy.scale.set(1, 1, 1);
      // Open plan: rot 0/PI (pares enfrentados); patas siempre en X.
      const alongX = rot !== Math.PI / 2;
      for (let l = 0; l < 2; l++) {
        const off = l === 0 ? -0.7 : 0.7;
        dummy.position.set(alongX ? x + off : x, 0.15, alongX ? z : z + off);
        dummy.rotation.set(0, rot, 0);
        dummy.updateMatrix();
        deskLegs.setMatrixAt(di * 2 + l, dummy.matrix);
      }
    };
    const putMonitor = (x: number, z: number, rot: number) => {
      dummy.scale.set(1, 1, 1);
      dummy.position.set(x, 0.95, z);
      dummy.rotation.set(0, rot, 0);
      dummy.updateMatrix();
      monitors.setMatrixAt(mi, dummy.matrix);
      const facing = rot === Math.PI ? Math.PI : rot === Math.PI / 2 ? Math.PI / 2 : 0;
      dummy.position.set(
        facing === Math.PI / 2 ? x + 0.045 : x,
        0.95,
        facing === 0 ? z + 0.045 : facing === Math.PI ? z - 0.045 : z,
      );
      dummy.rotation.set(0, facing, 0);
      dummy.updateMatrix();
      screens.setMatrixAt(mi, dummy.matrix);
      mi++;
    };
    zones.forEach((z, zi) => {
      if (behaviorOf(z.area.id) === 'control') return;
      for (const dd of desksByZone.get(zi) ?? []) {
        dummy.position.set(dd.x, 0.5, dd.z);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, dd.rot, 0);
        dummy.updateMatrix();
        deskTops.setMatrixAt(di, dummy.matrix);
        putLegs(dd.x, dd.z, dd.rot);
        const mx = dd.rot === Math.PI / 2 ? dd.x - 0.45 : dd.x;
        const mz = dd.rot === 0 ? dd.z - 0.28 : dd.rot === Math.PI ? dd.z + 0.28 : dd.z;
        putMonitor(mx, mz, dd.rot);
        di++;
      }
    });
    zones.forEach((z, zi) => {
      if (behaviorOf(z.area.id) !== 'control') return;
      for (const dd of desksByZone.get(zi) ?? []) {
        dummy.position.set(dd.x, 0.5, dd.z);
        dummy.scale.set(0.72, 1, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        deskTops.setMatrixAt(di, dummy.matrix);
        putLegs(dd.x, dd.z, 0);
        putMonitor(dd.x - 0.36, dd.z - 0.28, 0);
        putMonitor(dd.x + 0.36, dd.z - 0.28, 0);
        // Teclado frente al operador.
        dummy.position.set(dd.x, 0.57, dd.z + 0.18);
        dummy.scale.set(0.55, 0.05, 0.22);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        kbMesh.setMatrixAt(ki++, dummy.matrix);
        di++;
      }
    });
    if (officeDesks + controlDesks === 0) {
      dummy.position.set(0, -100, 0);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      deskTops.setMatrixAt(0, dummy.matrix);
      monitors.setMatrixAt(0, dummy.matrix);
      screens.setMatrixAt(0, dummy.matrix);
      deskLegs.setMatrixAt(0, dummy.matrix);
      deskLegs.setMatrixAt(1, dummy.matrix);
    }
  }

  // Chairs at seated avatar spots.
  {
    let ci = 0;
    avatars.forEach((a) => {
      if (a.mode !== 'sit') return;
      dummy.position.set(a.x, 0.32, a.z);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, a.yaw, 0);
      dummy.updateMatrix();
      chairs.setMatrixAt(ci, dummy.matrix);
      dummy.position.set(a.x - Math.sin(a.yaw) * -0.26, 0.6, a.z - Math.cos(a.yaw) * -0.26);
      dummy.rotation.set(0, a.yaw, 0);
      dummy.updateMatrix();
      chairBacks.setMatrixAt(ci, dummy.matrix);
      ci++;
    });
    if (seatedTotal === 0) {
      dummy.position.set(0, -100, 0);
      dummy.updateMatrix();
      chairs.setMatrixAt(0, dummy.matrix);
      chairBacks.setMatrixAt(0, dummy.matrix);
    }
  }

  wallSegs.forEach((w, i) => {
    dummy.position.set(w[0], w[1], w[2]);
    dummy.scale.set(w[3], w[4], w[5]);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    walls.setMatrixAt(i, dummy.matrix);
  });

  pillarSpots.forEach((p, i) => {
    dummy.position.set(p.x, 1.3, p.z);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    pillars.setMatrixAt(i, dummy.matrix);
    pillars.setColorAt(i, new THREE.Color(p.color));
  });
  if (pillarSpots.length === 0) {
    dummy.position.set(0, -100, 0);
    dummy.updateMatrix();
    pillars.setMatrixAt(0, dummy.matrix);
  }

  // Video wall ampliado: 3 filas x 5 (15 paneles) + banner superior.
  {
    let vi = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        dummy.position.set(videoWallX + (c - 2) * 2.55, 1.35 + r * 1.6, videoWallZ);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        videos.setMatrixAt(vi++, dummy.matrix);
      }
    }
  }
  // Server LEDs: frente de las tres torres (colores animados en el loop).
  const ledBase: Array<{ x: number; y: number; z: number }> = [];
  const rackZ = [serverZ, serverZ + 2.6, serverZ - 2.6];
  for (const rz of rackZ) {
    for (let r = 0; r < LED_ROWS; r++) {
      for (let c = 0; c < LED_COLS; c++) {
        ledBase.push({ x: serverX - 0.35 + c * 0.7, y: 0.6 + r * 0.36, z: rz + 0.62 });
      }
    }
  }

  // Cars + wheels.
  carSpots.forEach((s, i) => {
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.position.set(s.x, 0.45, s.z);
    dummy.updateMatrix();
    carBodies.setMatrixAt(i, dummy.matrix);
    carBodies.setColorAt(i, new THREE.Color(CAR_COLORS[i % CAR_COLORS.length]));
    dummy.position.set(s.x, 0.95, s.z - 0.2);
    dummy.updateMatrix();
    carCabins.setMatrixAt(i, dummy.matrix);
    for (let w = 0; w < 4; w++) {
      const wx = s.x + (w % 2 === 0 ? -0.85 : 0.85);
      const wz = s.z + (w < 2 ? -1.15 : 1.15);
      dummy.position.set(wx, 0.32, wz);
      dummy.updateMatrix();
      carWheels.setMatrixAt(i * 4 + w, dummy.matrix);
    }
  });

  // Convexia stands (north edge) + awnings.
  for (let i = 0; i < 4; i++) {
    const sx = convexia.x0 + 3 + i * 4.2;
    const sz = convexia.z0 + 2.2;
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(2.6, 2.0, 2.0);
    dummy.position.set(sx, 1.0, sz);
    dummy.updateMatrix();
    stands.setMatrixAt(i, dummy.matrix);
    dummy.position.set(sx, 2.35, sz + 0.9);
    dummy.rotation.set(-0.5, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    awnings.setMatrixAt(i, dummy.matrix);
  }
  // Event chairs: rows facing the stage (-z faces +z stage).
  {
    let ei = 0;
    const stgX = (convexia.x0 + convexia.x1) / 2;
    for (let r = 0; r < EVENT_ROWS; r++) {
      for (let c = 0; c < EVENT_COLS; c++) {
        const ex = stgX - 3.75 + c * 1.5;
        const ez = convexia.z1 - 5.4 - r * 1.4;
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.position.set(ex, 0.22, ez);
        dummy.updateMatrix();
        eventChairs.setMatrixAt(ei, dummy.matrix);
        dummy.position.set(ex, 0.62, ez - 0.26);
        dummy.updateMatrix();
        eventBacks.setMatrixAt(ei, dummy.matrix);
        ei++;
      }
    }
  }

  // Parque: 3 puestos con toldo + mesas + arboleda.
  const parque = DISTRICTS[3];
  const truckColors = ['#b0503c', '#3f8a76', '#c9a84c'];
  void truckColors;
  for (let i = 0; i < 3; i++) {
    const tx = parque.x0 + 3 + i * 5.4;
    const tz = parque.z0 + 2.4;
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(3.0, 1.9, 1.8);
    dummy.position.set(tx, 0.95, tz);
    dummy.updateMatrix();
    trucks.setMatrixAt(i, dummy.matrix);
    trucks.setColorAt(i, new THREE.Color([0xd8cba6, 0xc4b498, 0xe2d6b8][i]));
    dummy.position.set(tx, 2.2, tz + 1.1);
    dummy.rotation.set(-0.5, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    truckAwnings.setMatrixAt(i, dummy.matrix);
  }
  const tableSpots = [
    { x: -4, z: 10 }, { x: 0, z: 10 }, { x: 4, z: 10 }, { x: 0, z: 14 },
  ];
  tableSpots.forEach((t, i) => {
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.position.set(t.x, 0.72, t.z);
    dummy.updateMatrix();
    cafeTables.setMatrixAt(i, dummy.matrix);
    dummy.position.set(t.x, 0.36, t.z);
    dummy.updateMatrix();
    cafeLegs.setMatrixAt(i, dummy.matrix);
    for (let s = 0; s < 4; s++) {
      const an = (s / 4) * Math.PI * 2 + i * 0.4;
      dummy.position.set(t.x + Math.cos(an) * 1.25, 0.21, t.z + Math.sin(an) * 1.25);
      dummy.updateMatrix();
      stools.setMatrixAt(i * 4 + s, dummy.matrix);
    }
  });
  const treeSpots = [
    { x: -7.5, z: 4 }, { x: 7.5, z: 4 }, { x: -7.5, z: 17 }, { x: 7.5, z: 17 },
    { x: -4, z: 17.2 }, { x: 4, z: 4 }, { x: 0, z: 17.4 },
  ];
  treeSpots.forEach((t, i) => {
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1 + hash(i) * 0.4, 1);
    dummy.position.set(t.x, 0.6, t.z);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    dummy.position.set(t.x, 1.7 + hash(i + 9) * 0.3, t.z);
    dummy.scale.set(1, 1.15, 1);
    dummy.updateMatrix();
    crowns.setMatrixAt(i, dummy.matrix);
  });

  // Taller: estanterías + conos + cajas (depósito).
  for (let i = 0; i < 3; i++) {
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.position.set(taller.x0 + 2.4 + i * 3.4, 0.9, taller.z0 + 1.2);
    dummy.updateMatrix();
    shelves.setMatrixAt(i, dummy.matrix);
  }
  const coneSpots = [
    { x: 14, z: 15 }, { x: 16, z: 16.4 }, { x: 24, z: 15 }, { x: 26, z: 16.4 },
    { x: 18, z: 13.4 }, { x: 22, z: 13.4 },
  ];
  coneSpots.forEach((c, i) => {
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.position.set(c.x, 0.28, c.z);
    dummy.updateMatrix();
    cones.setMatrixAt(i, dummy.matrix);
  });
  // Box depot near Convexia stands + taller bench (carried boxes follow hands).
  const carriers = avatars.filter((a) => a.carriesBox);
  const depotSpots: Array<{ x: number; z: number; y: number }> = [];
  for (let i = 0; i < NBOX; i++) {
    const nearConvexia = i < NBOX / 2;
    const bx = nearConvexia
      ? convexia.x0 + 2 + (i % 4) * 1.1
      : (taller.x0 + taller.x1) / 2 - 2 + (i % 4) * 1.1;
    const bz = nearConvexia ? convexia.z1 - 4.4 : taller.z1 - 3.4;
    depotSpots.push({ x: bx, z: bz, y: 0.25 + Math.floor(i / 8) * 0.5 });
  }
  void carriers;

  // ── Kitchenette (sureste de Central) ──
  const KB = controlDesks; // slots extra en kbMesh: micro / cafetera / marco
  void carriers;
  {
    dummy.rotation.set(0, 0, 0);
    // Mueble contra el muro este.
    dummy.scale.set(0.7, 0.9, 3.0);
    dummy.position.set(8.4, 0.45, KZ);
    dummy.updateMatrix();
    counters.setMatrixAt(0, dummy.matrix);
    // Microondas sobre el mueble.
    dummy.scale.set(0.55, 0.35, 0.6);
    dummy.position.set(8.4, 1.08, KZ - 0.8);
    dummy.updateMatrix();
    counters.setMatrixAt(1, dummy.matrix);
    // Cafetera sobre el mueble.
    dummy.scale.set(0.4, 0.35, 0.4);
    dummy.position.set(8.4, 1.08, KZ + 0.8);
    dummy.updateMatrix();
    counters.setMatrixAt(2, dummy.matrix);
    // Mesa alta + 2 patas panel.
    dummy.scale.set(2.0, 0.08, 0.9);
    dummy.position.set(KX, 1.0, KZ);
    dummy.updateMatrix();
    counters.setMatrixAt(3, dummy.matrix);
    for (let l = 0; l < 2; l++) {
      dummy.scale.set(0.08, 1.0, 0.8);
      dummy.position.set(KX + (l === 0 ? -0.85 : 0.85), 0.5, KZ);
      dummy.updateMatrix();
      counters.setMatrixAt(4 + l, dummy.matrix);
    }
    // Frentes oscuros: puerta del micro, frente de cafetera, marco de pantalla.
    dummy.scale.set(0.05, 0.24, 0.45);
    dummy.position.set(8.11, 1.08, KZ - 0.8);
    dummy.updateMatrix();
    kbMesh.setMatrixAt(KB, dummy.matrix);
    dummy.scale.set(0.05, 0.24, 0.3);
    dummy.position.set(8.19, 1.0, KZ + 0.8);
    dummy.updateMatrix();
    kbMesh.setMatrixAt(KB + 1, dummy.matrix);
    dummy.scale.set(3.5, 1.7, 0.08);
    dummy.position.set(-25.5, 1.6, -5.95);
    dummy.updateMatrix();
    kbMesh.setMatrixAt(KB + 2, dummy.matrix);
    // Taburetes altos alrededor de la mesa (stools 16-19).
    for (let s = 0; s < 4; s++) {
      const an = 0.3 + (s / 4) * Math.PI * 2;
      dummy.scale.set(1, 1.5, 1);
      dummy.position.set(KX + Math.cos(an) * 1.35, 0.315, KZ + Math.sin(an) * 1.35);
      dummy.updateMatrix();
      stools.setMatrixAt(16 + s, dummy.matrix);
    }
  }

  // ── Directorio (suroeste de Central, sala vidriada) ──
  const DX = -25.5;
  const DZ = -4;
  {
    dummy.rotation.set(0, 0, 0);
    // Mesa grande + 4 patas.
    dummy.scale.set(3.4, 0.1, 1.4);
    dummy.position.set(DX, 0.74, DZ);
    dummy.updateMatrix();
    dirTables.setMatrixAt(0, dummy.matrix);
    const legXZ: Array<[number, number]> = [[-1.5, -0.55], [1.5, -0.55], [-1.5, 0.55], [1.5, 0.55]];
    legXZ.forEach(([lx, lz], i) => {
      dummy.scale.set(0.12, 0.7, 0.12);
      dummy.position.set(DX + lx, 0.35, DZ + lz);
      dummy.updateMatrix();
      dirTables.setMatrixAt(1 + i, dummy.matrix);
    });
    // Sala vidriada: N + S partida (acceso) + W + E.
    const glass: Array<{ x: number; z: number; sx: number; sz: number }> = [
      { x: DX, z: -6, sx: 6, sz: 0.1 },
      { x: -27.4, z: -2, sx: 2.2, sz: 0.1 },
      { x: -23.6, z: -2, sx: 2.2, sz: 0.1 },
      { x: DX - 3, z: DZ, sx: 0.1, sz: 4 },
      { x: DX + 3, z: DZ, sx: 0.1, sz: 4 },
    ];
    glass.forEach((g, i) => {
      dummy.scale.set(g.sx, 1.8, g.sz);
      dummy.position.set(g.x, 0.9, g.z);
      dummy.updateMatrix();
      glassPanels.setMatrixAt(i, dummy.matrix);
    });
    // 6 sillas alrededor (eventChairs 18-23): norte mira al sur y viceversa.
    for (let s = 0; s < 6; s++) {
      const north = s < 3;
      const ex = DX - 1.4 + (s % 3) * 1.4;
      const ez = north ? DZ - 0.95 : DZ + 0.95;
      const yaw = north ? 0 : Math.PI;
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(1, 1, 1);
      dummy.position.set(ex, 0.22, ez);
      dummy.updateMatrix();
      eventChairs.setMatrixAt(18 + s, dummy.matrix);
      dummy.position.set(ex - Math.sin(yaw) * 0.26, 0.62, ez - Math.cos(yaw) * 0.26);
      dummy.updateMatrix();
      eventBacks.setMatrixAt(18 + s, dummy.matrix);
    }
  }

  // ── Relleno de vacíos: plantas extra, lámparas de pie, alfombras ──
  // Open plan: el espacio entre islas, Directorio y kitchenette queda
  // vestido para que no haya rincones muertos visibles.
  {
    dummy.rotation.set(0, 0, 0);
    const extraTrees = [
      { x: -20, z: -2.5 }, { x: -5, z: -17.5 }, { x: 2, z: -17.5 },
      { x: -28, z: -17.5 }, { x: -22.9, z: -6.9 },
      { x: 2.5, z: -11.5 }, { x: -13.5, z: -3.2 },
    ];
    extraTrees.forEach((t, i) => {
      const k = 7 + i;
      dummy.scale.set(1, 1 + hash(i + 21) * 0.4, 1);
      dummy.position.set(t.x, 0.6, t.z);
      dummy.updateMatrix();
      trunks.setMatrixAt(k, dummy.matrix);
      dummy.position.set(t.x, 1.7 + hash(i + 31) * 0.3, t.z);
      dummy.scale.set(1, 1.15, 1);
      dummy.updateMatrix();
      crowns.setMatrixAt(k, dummy.matrix);
    });
    const lampSpots = [
      { x: 3.2, z: -2.2 }, { x: -22.9, z: -2.9 },
      { x: -11, z: -2.5 }, { x: 12.5, z: -2.5 },
      { x: -14.2, z: -16.8 }, { x: 2.5, z: -5.2 },
    ];
    lampSpots.forEach((lp, i) => {
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 2.3, 1);
      dummy.position.set(lp.x, 0.78, lp.z);
      dummy.updateMatrix();
      lampPoles.setMatrixAt(i, dummy.matrix);
      dummy.scale.set(0.45, 0.55, 0.45);
      dummy.position.set(lp.x, 1.62, lp.z);
      dummy.updateMatrix();
      lampShades.setMatrixAt(i, dummy.matrix);
    });
    const controlZone = zones.find((z) => z.area.id === 'centro-control');
    const rugDefs = [
      { x: KX, z: KZ, w: 4.2, d: 3.0 },
      { x: DX, z: DZ, w: 5.2, d: 3.6 },
      {
        x: controlZone ? controlZone.cx : 21, z: controlZone ? controlZone.cz : -10,
        w: controlZone ? Math.min(9, controlZone.w + 2) : 9,
        d: controlZone ? Math.min(6, controlZone.h + 2) : 6,
      },
      // Alfombras de equipo bajo las islas norte (colores vía carpets).
      { x: -21.5, z: -13.6, w: 7.6, d: 4.4 },
      { x: -6.5, z: -13.6, w: 7.6, d: 4.4 },
    ];
    rugDefs.forEach((r, i) => {
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(r.w, 0.05, r.d);
      dummy.position.set(r.x, 0.075, r.z);
      dummy.updateMatrix();
      rugs.setMatrixAt(i, dummy.matrix);
    });
  }

  // ── Control: cámaras PTZ en esquinas + cables en piso ──
  const ptzSpots = [
    { x: 11.4, z: -18.6 }, { x: 30.6, z: -18.6 },
    { x: 11.4, z: -1.4 }, { x: 30.6, z: -1.4 },
  ];
  ptzSpots.forEach((p, i) => {
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1.15, 1.15, 1.15);
    dummy.position.set(p.x, 1.42, p.z);
    dummy.updateMatrix();
    ptzDomes.setMatrixAt(i, dummy.matrix);
    dummy.scale.set(1, 1, 1);
    dummy.position.set(p.x, 1.18, p.z);
    dummy.updateMatrix();
    ptzLeds.setMatrixAt(i, dummy.matrix);
  });
  {
    const cableRuns: Array<{ x: number; z: number; len: number }> = [
      { x: 27.6, z: -8.5, len: 1.6 }, { x: 27.6, z: -6.0, len: 1.6 },
      { x: 26.0, z: -9.5, len: 2.2 }, { x: 24.0, z: -12.5, len: 2.6 },
      { x: 18.0, z: -13.0, len: 2.6 }, { x: 14.0, z: -12.0, len: 2.0 },
      { x: 27.6, z: -14.5, len: 2.2 }, { x: 22.0, z: -6.5, len: 2.0 },
      { x: 16.0, z: -6.0, len: 2.4 },
    ];
    cableRuns.forEach((cb, i) => {
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(cb.len, 0.05, 0.14);
      dummy.position.set(cb.x, 0.03, cb.z);
      dummy.updateMatrix();
      cables.setMatrixAt(i, dummy.matrix);
    });
  }

  // Avatar base colors.
  const accentByZone = zones.map((z) => new THREE.Color(z.accent));
  const shirtBase: THREE.Color[] = [];
  avatars.forEach((a, k) => {
    const c = new THREE.Color(a.shirt).lerp(accentByZone[a.areaIdx], 0.25);
    shirtBase.push(c);
    torsos.setColorAt(k, c);
    tmpColor.copy(c).multiplyScalar(0.85);
    armL.setColorAt(k, tmpColor);
    armR.setColorAt(k, tmpColor);
    const pc = new THREE.Color(a.pants);
    legL.setColorAt(k, pc);
    legR.setColorAt(k, pc);
    heads.setColorAt(k, new THREE.Color(a.skin));
  });
  if (NF === 0) {
    dummy.position.set(0, -100, 0);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    for (const m of [torsos, heads, armL, armR, legL, legR, blobs, proxies]) m.setMatrixAt(0, dummy.matrix);
  }

  const staticMeshes = [grounds, carpets, deskTops, deskLegs, monitors, screens, chairs, chairBacks, walls, pillars, videos, carBodies, carCabins, carWheels, stands, awnings, eventChairs, eventBacks, trucks, truckAwnings, cafeTables, cafeLegs, stools, trunks, crowns, shelves, cones, counters, kbMesh, dirTables, glassPanels, lampPoles, lampShades, rugs, ptzDomes, ptzLeds, cables];
  const syncStatic = () => {
    for (const m of staticMeshes) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  };

  // ── Floating labels: one per area + district + ala ──
  const labelMats: THREE.SpriteMaterial[] = [];
  zones.forEach((z, i) => {
    const sub = z.area.count === 0
      ? 'Sin personas asignadas'
      : `${z.area.count} ${z.area.count === 1 ? 'persona' : 'personas'}`;
    const tex = track(makeLabelTexture(THREE, z.area.nombre, sub, z.area.count === 0));
    const mat = track(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    labelMats.push(mat);
    const spr = new THREE.Sprite(mat);
    spr.position.set(z.cx, 3.2 + (i % 2) * 0.7, z.cz);
    spr.scale.set(4.0, 1.25, 1);
    spr.name = `label-${z.area.id}`;
    rig.add(spr);
  });
  DISTRICTS.forEach((dd) => {
    const tex = track(makeLabelTexture(THREE, dd.nombre, dd.sub, false));
    const mat = track(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.95 }));
    labelMats.push(mat);
    const spr = new THREE.Sprite(mat);
    spr.position.set((dd.x0 + dd.x1) / 2, 5.6, (dd.z0 + dd.z1) / 2);
    spr.scale.set(5.2, 1.62, 1);
    spr.name = `label-district-${dd.id}`;
    rig.add(spr);
  });
  // Letreros flotantes por equipo sobre cada isla del open plan.
  {
    for (const isl of TEAM_ISLANDS) {
      const tex = track(makeLabelTexture(THREE, isl.team, 'Oficina Central', false));
      const mat = track(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.95 }));
      labelMats.push(mat);
      const spr = new THREE.Sprite(mat);
      spr.position.set(isl.cx, 4.2, isl.cz);
      spr.scale.set(3.4, 1.06, 1);
      spr.name = `label-ala-${isl.team}`;
      rig.add(spr);
    }
  }

  // ── GCB logo plate on the Central north wall ──
  {
    const tex = track(makeLogoTexture(THREE));
    const mat = track(new THREE.MeshBasicMaterial({ map: tex }));
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.1), mat);
    track(plate.geometry);
    plate.position.set((central.x0 + central.x1) / 2, 1.0, central.z0 + 0.2);
    plate.name = 'gcb-logo';
    rig.add(plate);
  }

  // ── Hover ring (single mesh, reused) ──
  const ringGeo = track(new THREE.TorusGeometry(1, 0.055, 10, 48));
  const ringMat = track(new THREE.MeshBasicMaterial({ color: 0xc9a84c, transparent: true, opacity: 0.95 }));
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  ring.renderOrder = 2;
  rig.add(ring);
  let ringBase = 0;

  // ── Picking: avatars (torso instances → person) + carpets (→ zone) ──
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hoverAvatar: number | null = null;
  let hoverZone: number | null = null;
  let selected = 'all';

  const setPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  };

  const zoneOf = (areaId: string): number => zones.findIndex((z) => z.area.id === areaId);

  const updateTooltip = (e: PointerEvent) => {
    const tip = opts.tooltip;
    if (!tip) return;
    tip.innerHTML = '';
    if (hoverAvatar != null && avatars[hoverAvatar]) {
      const a = avatars[hoverAvatar];
      const name = document.createElement('strong');
      name.textContent = a.short;
      const meta = document.createElement('span');
      const rol = a.person.rol ? ` · ${a.person.rol}` : '';
      meta.textContent = `${zones[a.areaIdx].area.nombre}${rol}`;
      tip.append(name, document.createElement('br'), meta);
    } else if (hoverZone != null && zones[hoverZone]) {
      const z = zones[hoverZone];
      const name = document.createElement('strong');
      name.textContent = z.area.nombre;
      const meta = document.createElement('span');
      meta.textContent = `Jefatura: ${nombreCorto(z.area.jefatura)} · ${z.area.count} ${z.area.count === 1 ? 'persona' : 'personas'}`;
      tip.append(name, document.createElement('br'), meta);
    } else {
      tip.hidden = true;
      return;
    }
    const r = canvas.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - r.left + 14, 8), Math.max(8, r.width - 220));
    const y = Math.max(e.clientY - r.top - 10, 8);
    tip.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px)`;
    tip.hidden = false;
  };

  const hideTooltip = () => {
    if (opts.tooltip) opts.tooltip.hidden = true;
  };

  const applyRing = () => {
    const zi = hoverZone ?? (selected !== 'all' ? zoneOf(selected) : -1);
    if (hoverAvatar != null && avatars[hoverAvatar]) {
      const a = avatars[hoverAvatar];
      ring.visible = true;
      ringBase = 0.55;
      ring.position.set(a.x, 0.1, a.z);
      ring.scale.set(ringBase, ringBase, 1);
      return;
    }
    if (zi == null || zi < 0 || !zones[zi]) {
      ring.visible = false;
      ringBase = 0;
      return;
    }
    const z = zones[zi];
    ring.visible = true;
    ringBase = Math.max(z.w, z.h) * 0.62;
    ring.position.set(z.cx, 0.12, z.cz);
    ring.scale.set(ringBase, ringBase, 1);
  };

  let pickQueued: PointerEvent | null = null;
  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    pickQueued = e;
  };
  const onPointerLeave = () => {
    hoverAvatar = null;
    hoverZone = null;
    pickQueued = null;
    hideTooltip();
    canvas.style.cursor = '';
    applyRing();
  };
  const onClick = (e: PointerEvent) => {
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hitA = raycaster.intersectObject(proxies, false)[0];
    if (hitA && typeof hitA.instanceId === 'number' && avatars[hitA.instanceId]) {
      opts.onSelect?.(avatars[hitA.instanceId].areaId);
      return;
    }
    const hit = raycaster.intersectObject(carpets, false)[0];
    if (hit && typeof hit.instanceId === 'number') {
      opts.onSelect?.(zones[hit.instanceId].area.id);
    }
  };
  canvas.addEventListener('pointermove', onPointerMove, { passive: true });
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('click', onClick);

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const fit = fitDistance(camera.aspect);
    syncZoomLimits(fit);
    if (!userZoomed) {
      placeCamera(fit);
      controls.target.copy(TARGET);
    } else {
      camera.updateProjectionMatrix();
    }
  };
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  const ro = new ResizeObserver(() => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  });
  ro.observe(canvas);
  resize();

  // ── Filter from the DOM (pills + search) ──
  const dimCarpet = new THREE.Color(0x141414);
  const selCarpet = new THREE.Color(0x6b5322);
  const dimFigure = new THREE.Color(0x3a3a3a);
  const api: OficinaHandle = {
    setFilter: (area: string, match: Set<string> | null) => {
      selected = area;
      zones.forEach((z, i) => {
        const isSel = area !== 'all' && z.area.id === area;
        const visible = match === null || match.has(z.area.id);
        if (isSel) carpets.setColorAt(i, selCarpet);
        else if (visible) {
          tmpColor.copy(baseCarpet).lerp(new THREE.Color(z.accent), 0.26);
          carpets.setColorAt(i, tmpColor);
        } else carpets.setColorAt(i, dimCarpet);
        labelMats[i].opacity = visible ? 1 : 0.15;
      });
      avatars.forEach((a, k) => {
        const isSel = area !== 'all' && a.areaId === area;
        const visible = match === null || match.has(a.areaId);
        if (!visible) {
          torsos.setColorAt(k, dimFigure);
        } else if (isSel) {
          torsos.setColorAt(k, tmpColor.copy(shirtBase[k]).lerp(new THREE.Color(0xc9a84c), 0.45));
        } else torsos.setColorAt(k, shirtBase[k]);
      });
      if (carpets.instanceColor) carpets.instanceColor.needsUpdate = true;
      if (torsos.instanceColor) torsos.instanceColor.needsUpdate = true;
      applyRing();
    },
    stats: () => ({
      stations: zones.length,
      figures: avatars.length,
      meshes: rig.children.length,
      drawCalls: renderer.info.render.calls,
    }),
    pickTest: (nx: number, ny: number) => {
      pointer.set(nx, ny);
      raycaster.setFromCamera(pointer, camera);
      const hitA = raycaster.intersectObject(proxies, false)[0];
      const avatar = hitA && typeof hitA.instanceId === 'number' && avatars[hitA.instanceId]
        ? avatars[hitA.instanceId].short
        : null;
      const hit = raycaster.intersectObject(carpets, false)[0];
      const zone = hit && typeof hit.instanceId === 'number' && zones[hit.instanceId]
        ? zones[hit.instanceId].area.nombre
        : null;
      return { avatar, zone };
    },
    dispose: () => {},
  };

  // ── State machine: work / stroll / chat per behavior ──
  const nextState = (a: Avatar): void => {
    const r = hash(a.phase * 1000 + performance.now() * 0.0001 + a.x);
    const pick = (ww: number, ss: number): AvatarState => {
      if (r < ww) return 'work';
      if (r < ww + ss) return 'stroll';
      return 'chat';
    };
    switch (a.behavior) {
      case 'office': a.state = pick(0.68, 0.16); break;
      case 'control': a.state = pick(0.72, 0.12); break;
      case 'patrol': a.state = pick(0.12, 0.76); break;
      case 'mount': a.state = pick(0.5, 0.3); break;
      case 'taller': a.state = a.isWelder ? 'work' : pick(0.45, 0.35); break;
      case 'clean': a.state = pick(0.62, 0.2); break;
      case 'serve': a.state = pick(0.8, 0.08); break;
      default: a.state = pick(0.6, 0.2);
    }
    a.stateT = 6 + hash(a.x * 31 + a.z * 17 + performance.now() * 0.001) * 6;
  };

  // ── Procedural animation (no mixers): poses per behavior + FSM ──
  const clock = new THREE.Clock();
  let visible = true;
  let frame = 0;
  const tmpA = new THREE.Object3D();
  const tmpB = new THREE.Object3D();
  const LOD_FAR = camera.position.distanceTo(TARGET) * 1.1;
  const HIP_SIT = 0.5;
  const HIP_STAND = 0.78;
  const ledColors = [new THREE.Color(0x39d353), new THREE.Color(0xffb020), new THREE.Color(0x4a9eff), new THREE.Color(0xff4444)];
  let ledT = 0;
  let vidT = 0;
  let ptzT = 0;

  const placeLimb = (
    mesh: THREE.InstancedMesh, k: number,
    x: number, y: number, z: number,
    rx: number, yaw: number, s: number,
  ) => {
    tmpB.position.set(x, y, z);
    tmpB.rotation.set(rx, yaw, 0);
    tmpB.scale.set(s, s, s);
    tmpB.updateMatrix();
    mesh.setMatrixAt(k, tmpB.matrix);
  };

  /** Steer toward a target at walk speed; true when arrived. */
  const steer = (a: Avatar, tx: number, tz: number, dt: number): boolean => {
    const dx = tx - a.x;
    const dz = tz - a.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < 0.25) return true;
    const step = Math.min(d, a.speed * dt);
    a.x += (dx / d) * step;
    a.z += (dz / d) * step;
    a.yaw = lerpAngle(a.yaw, Math.atan2(dx, dz), dt * 6);
    return false;
  };

  const advanceLoop = (a: Avatar, dt: number): void => {
    const pts = a.path;
    if (pts.length < 2) return;
    let remaining = a.speed * dt;
    for (let step = 0; step < 4 && remaining > 0; step++) {
      let nxt = a.seg + a.dir;
      if (nxt < 0 || nxt >= pts.length) {
        a.dir = a.dir > 0 ? -1 : 1;
        nxt = a.seg + a.dir;
        if (nxt < 0 || nxt >= pts.length) break;
      }
      const p0 = pts[a.seg];
      const p1 = pts[nxt];
      const dx = p1.x - p0.x;
      const dz = p1.z - p0.z;
      const len = Math.hypot(dx, dz) || 1;
      const segLen = len * (1 - a.segT);
      if (remaining < segLen) {
        a.segT += remaining / len;
        remaining = 0;
      } else {
        remaining -= segLen;
        a.seg = nxt;
        a.segT = 0;
      }
    }
    const q0 = pts[a.seg];
    const q1 = pts[Math.min(pts.length - 1, Math.max(0, a.seg + a.dir))];
    a.x = q0.x + (q1.x - q0.x) * Math.min(1, a.segT);
    a.z = q0.z + (q1.z - q0.z) * Math.min(1, a.segT);
    a.yaw = lerpAngle(a.yaw, Math.atan2(q1.x - q0.x, q1.z - q0.z), dt * 6);
  };

  const renderFrame = (t: number, dt: number) => {
    frame++;
    const far = camera.position.distanceTo(TARGET) > LOD_FAR;
    // Server LEDs parpadean (~5 Hz, barato: 10 instancias).
    ledT += dt;
    let ledsDirty = false;
    if (!reducedMotion && ledT > 0.2) {
      ledT = 0;
      for (let i = 0; i < ledBase.length; i++) {
        const on = hash(i * 7 + Math.floor(t * 5)) > 0.35;
        leds.setColorAt(i, on ? ledColors[(i + Math.floor(t * 5)) % ledColors.length] : tmpColor.set(0x1a1a1a));
      }
      ledsDirty = true;
    }
    for (let k = 0; k < avatars.length; k++) {
      const a = avatars[k];
      const s = a.scale;
      if (!reducedMotion) {
        a.stateT -= dt;
        if (a.stateT <= 0) nextState(a);
      }
      let walking = false;
      let bob = 0;
      let swing = 0;
      if (!reducedMotion && a.state === 'stroll') {
        advanceLoop(a, dt);
        walking = true;
        const w = t * 7 + a.phase;
        bob = Math.abs(Math.sin(w)) * 0.05;
        swing = Math.sin(w) * 0.55;
        a.mode = 'walk';
      } else if (!reducedMotion && a.state === 'chat') {
        walking = !steer(a, a.chatX, a.chatZ, dt);
        if (!walking) {
          const gx = zones[a.areaIdx].cx;
          const gz = zones[a.areaIdx].cz;
          a.yaw = lerpAngle(a.yaw, Math.atan2(gx - a.x, gz - a.z), dt * 4);
          bob = Math.sin(t * 1.8 + a.phase) * 0.02;
          swing = Math.sin(t * 2.2 + a.phase) * 0.3;
        } else {
          const w = t * 7 + a.phase;
          bob = Math.abs(Math.sin(w)) * 0.05;
          swing = Math.sin(w) * 0.55;
        }
        a.mode = walking ? 'walk' : 'stand';
      } else {
        // work: volver al puesto y ejercer el oficio del área.
        walking = !steer(a, a.ax, a.az, dt);
        if (!walking) {
          if (a.behavior === 'control' || a.behavior === 'serve') a.yaw = a.faceYaw;
          if (a.isKitchen || a.isPointer) a.yaw = a.faceYaw;
          if (a.isPointer) {
            // De pie señalando el wall: casi quieto.
            bob = Math.sin(t * 1.8 + a.phase) * 0.015;
            swing = 0;
          } else if (a.isKitchen) {
            // Conversa con café: vaivén leve.
            bob = Math.sin(t * 1.6 + a.phase) * 0.02;
            swing = Math.sin(t * 2.0 + a.phase) * 0.18;
          } else if (a.behavior === 'clean') {
            // Barrer: vaivén lateral; regar: brazo al frente abajo.
            bob = Math.sin(t * 2.4 + a.phase) * 0.03;
            swing = Math.sin(t * 2.4 + a.phase) * 0.5;
          } else if (a.behavior === 'office') {
            bob = Math.sin(t * 1.4 + a.phase) * 0.012;
            swing = Math.sin(t * 7 + a.phase) * 0.28;
          } else if (a.behavior === 'taller' && a.isWelder) {
            bob = Math.sin(t * 9 + a.phase) * 0.008;
            swing = 0;
          } else {
            bob = Math.sin(t * 1.8 + a.phase) * 0.02;
            swing = Math.sin(t * 2.2 + a.phase) * 0.3;
          }
        } else {
          const w = t * 7 + a.phase;
          bob = Math.abs(Math.sin(w)) * 0.05;
          swing = Math.sin(w) * 0.55;
        }
        a.mode = walking ? 'walk' : a.isKitchen || a.isPointer ? 'stand' : a.behavior === 'office' || a.behavior === 'control' ? 'sit' : 'stand';
      }

      const hipY = (a.mode === 'sit' ? HIP_SIT : HIP_STAND) * s + 0.1 + bob;
      // Torso + head (always updated, even in far LOD).
      tmpA.position.set(a.x, hipY + 0.32 * s + (walking ? bob : 0), a.z);
      tmpA.rotation.set(a.mode === 'sit' ? 0.08 : a.behavior === 'clean' && !walking ? 0.18 : 0, a.yaw, 0);
      tmpA.scale.set(s, s, s);
      tmpA.updateMatrix();
      torsos.setMatrixAt(k, tmpA.matrix);
      tmpA.position.set(
        a.x + Math.sin(a.yaw) * 0.05,
        hipY + (a.mode === 'sit' ? 0.82 : 0.86) * s + bob * 1.2,
        a.z + Math.cos(a.yaw) * 0.05,
      );
      tmpA.rotation.set(a.mode === 'sit' ? 0.22 : 0, a.yaw, 0);
      tmpA.updateMatrix();
      heads.setMatrixAt(k, tmpA.matrix);

      // Limbs: skipped on alternate frames when far (LOD).
      const updateLimbs = !far || ((frame + k) % 3 === 0);
      if (updateLimbs) {
        const shX = a.x;
        const shY = hipY + 0.52 * s + bob;
        const shZ = a.z;
        if (a.mode === 'sit') {
          const fx = Math.sin(a.yaw);
          const fz = Math.cos(a.yaw);
          placeLimb(armL, k, shX - fz * 0.24 * s, shY, shZ + fx * 0.24 * s, -1.15 + swing, a.yaw, s);
          placeLimb(armR, k, shX + fz * 0.24 * s, shY, shZ - fx * 0.24 * s, -1.15 - swing, a.yaw, s);
          placeLimb(legL, k, shX - 0.11 * s, hipY + 0.05, shZ, -1.35, a.yaw, s);
          placeLimb(legR, k, shX + 0.11 * s, hipY + 0.05, shZ, -1.35, a.yaw, s);
        } else if (walking || a.mode === 'walk') {
          placeLimb(armL, k, shX - Math.cos(a.yaw) * 0.24 * s, shY, shZ + Math.sin(a.yaw) * 0.24 * s, swing, a.yaw, s);
          placeLimb(armR, k, shX + Math.cos(a.yaw) * 0.24 * s, shY, shZ - Math.sin(a.yaw) * 0.24 * s, -swing, a.yaw, s);
          placeLimb(legL, k, shX - 0.11 * s, hipY + 0.02, shZ, -swing * 0.9, a.yaw, s);
          placeLimb(legR, k, shX + 0.11 * s, hipY + 0.02, shZ, swing * 0.9, a.yaw, s);
        } else if (a.behavior === 'clean') {
          // Escoba: ambos brazos al frente con vaivén.
          placeLimb(armL, k, shX - 0.2 * s, shY - 0.1 * s, shZ + 0.2 * s, -0.9 + swing, a.yaw, s);
          placeLimb(armR, k, shX + 0.2 * s, shY - 0.1 * s, shZ + 0.2 * s, -0.9 + swing, a.yaw, s);
          placeLimb(legL, k, shX - 0.11 * s, hipY + 0.02, shZ, 0.06, a.yaw, s);
          placeLimb(legR, k, shX + 0.11 * s, hipY + 0.02, shZ, -0.06, a.yaw, s);
        } else if (a.behavior === 'taller' && a.isWelder) {
          // Suelda: brazos al frente abajo, quietos.
          placeLimb(armL, k, shX - 0.18 * s, shY - 0.12 * s, shZ + 0.22 * s, -0.8, a.yaw, s);
          placeLimb(armR, k, shX + 0.18 * s, shY - 0.12 * s, shZ + 0.22 * s, -0.85, a.yaw, s);
          placeLimb(legL, k, shX - 0.11 * s, hipY + 0.02, shZ, 0.06, a.yaw, s);
          placeLimb(legR, k, shX + 0.11 * s, hipY + 0.02, shZ, -0.06, a.yaw, s);
        } else if (a.isPointer) {
          // Señala el wall: brazo derecho levantado al frente, izquierdo quieto.
          placeLimb(armL, k, shX - 0.18 * s, shY - 0.05 * s, shZ + 0.1 * s, -0.2, a.yaw, s);
          placeLimb(armR, k, shX + 0.18 * s, shY, shZ + 0.24 * s, -2.0, a.yaw, s);
          placeLimb(legL, k, shX - 0.11 * s, hipY + 0.02, shZ, 0.06, a.yaw, s);
          placeLimb(legR, k, shX + 0.11 * s, hipY + 0.02, shZ, -0.06, a.yaw, s);
        } else if (a.isKitchen) {
          // Sostiene el café: ambos brazos al frente a la altura del pecho.
          placeLimb(armL, k, shX - 0.18 * s, shY - 0.12 * s, shZ + 0.22 * s, -0.7 + swing * 0.3, a.yaw, s);
          placeLimb(armR, k, shX + 0.18 * s, shY - 0.12 * s, shZ + 0.22 * s, -0.7 - swing * 0.3, a.yaw, s);
          placeLimb(legL, k, shX - 0.11 * s, hipY + 0.02, shZ, 0.06, a.yaw, s);
          placeLimb(legR, k, shX + 0.11 * s, hipY + 0.02, shZ, -0.06, a.yaw, s);
        } else {
          placeLimb(armL, k, shX - Math.cos(a.yaw) * 0.24 * s, shY, shZ + Math.sin(a.yaw) * 0.24 * s, -0.25 + swing, a.yaw, s);
          placeLimb(armR, k, shX + Math.cos(a.yaw) * 0.24 * s, shY, shZ - Math.sin(a.yaw) * 0.24 * s, -0.15 - swing * 0.4, a.yaw, s);
          placeLimb(legL, k, shX - 0.11 * s, hipY + 0.02, shZ, 0.06, a.yaw, s);
          placeLimb(legR, k, shX + 0.11 * s, hipY + 0.02, shZ, -0.06, a.yaw, s);
        }
      }
      tmpB.position.set(a.x, 0.1, a.z);
      tmpB.rotation.set(-Math.PI / 2, 0, 0);
      tmpB.scale.set(s, s, s);
      tmpB.updateMatrix();
      blobs.setMatrixAt(k, tmpB.matrix);
      tmpB.position.set(a.x, hipY + 0.1, a.z);
      tmpB.rotation.set(0, 0, 0);
      tmpB.scale.set(s, s, s);
      tmpB.updateMatrix();
      proxies.setMatrixAt(k, tmpB.matrix);
    }

    // Cajas: los cargadores la llevan en manos; el resto apiladas en depósito.
    {
      let bi = 0;
      const putBox = (x: number, y: number, z: number, yaw: number, sc: number) => {
        if (bi >= NBOX) return;
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.set(0.5 * sc, 0.5 * sc, 0.5 * sc);
        dummy.updateMatrix();
        boxes.setMatrixAt(bi++, dummy.matrix);
      };
      for (const a of avatars) {
        if (bi >= NBOX) break;
        if (!a.carriesBox) continue;
        if (a.state === 'stroll' || a.mode === 'walk') {
          putBox(a.x + Math.sin(a.yaw) * 0.42, 0.75 * a.scale, a.z + Math.cos(a.yaw) * 0.42, a.yaw, a.scale);
        } else {
          putBox(a.ax + 0.55, 0.25, a.az + 0.3, a.yaw, 1);
        }
      }
      for (const dpt of depotSpots) {
        if (bi >= NBOX) break;
        putBox(dpt.x, dpt.y, dpt.z, 0.3, 1);
      }
      // Oculta el resto bajo la losa.
      while (bi < NBOX) {
        dummy.position.set(0, -100, 0);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        boxes.setMatrixAt(bi++, dummy.matrix);
      }
      boxes.instanceMatrix.needsUpdate = true;
    }

    // Chispa del soldador: intermitente (visible ~40% del ciclo con flicker).
    if (welderGi >= 0 && avatars[welderGi]) {
      const w = avatars[welderGi];
      const on = !reducedMotion && w.state === 'work' && w.mode === 'stand' && (t % 1.4) < 0.55 && Math.sin(t * 47) > -0.2;
      spark.visible = on || reducedMotion;
      if (spark.visible) {
        spark.position.set(
          w.x + Math.sin(w.yaw) * 0.45,
          0.75 * w.scale + (reducedMotion ? 0 : Math.sin(t * 61) * 0.03),
          w.z + Math.cos(w.yaw) * 0.45,
        );
        const p = reducedMotion ? 1 : 0.7 + Math.abs(Math.sin(t * 53)) * 0.6;
        spark.scale.set(p, p, p);
      }
    }
    // Tazas: en la mano de cada avatar en la kitchenette.
    {
      let ci = 0;
      for (const a of avatars) {
        if (!a.isKitchen) continue;
        if (ci >= 2) break;
        dummy.position.set(
          a.x + Math.sin(a.yaw) * 0.32,
          0.95 * a.scale,
          a.z + Math.cos(a.yaw) * 0.32,
        );
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        cups.setMatrixAt(ci++, dummy.matrix);
      }
      while (ci < 2) {
        dummy.position.set(0, -100, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        cups.setMatrixAt(ci++, dummy.matrix);
      }
      cups.instanceMatrix.needsUpdate = true;
    }

    // Video wall: redibuja el canvas a ~4 fps (barras + onda tenues).
    vidT += dt;
    if (!reducedMotion && vidT > 0.25) {
      vidT = 0;
      videoWall.redraw(t);
      videoWall.tex.needsUpdate = true;
    }
    // PTZ: LED rojo parpadeante lento (escala on/off, 4 instancias).
    ptzT += dt;
    if (!reducedMotion && ptzT > 0.4) {
      ptzT = 0;
      for (let i = 0; i < ptzSpots.length; i++) {
        const on = ((t * 0.45 + i * 0.27) % 1) < 0.62;
        const s = on ? 1 : 0.001;
        dummy.position.set(ptzSpots[i].x, 1.18, ptzSpots[i].z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        ptzLeds.setMatrixAt(i, dummy.matrix);
      }
      ptzLeds.instanceMatrix.needsUpdate = true;
    }
    // Hero screen: respiración sutil.
    if (!reducedMotion) heroScreenMat.emissiveIntensity = 1.0 + Math.sin(t * 1.3) * 0.18;

    torsos.instanceMatrix.needsUpdate = true;
    heads.instanceMatrix.needsUpdate = true;
    armL.instanceMatrix.needsUpdate = true;
    armR.instanceMatrix.needsUpdate = true;
    legL.instanceMatrix.needsUpdate = true;
    legR.instanceMatrix.needsUpdate = true;
    blobs.instanceMatrix.needsUpdate = true;
    proxies.instanceMatrix.needsUpdate = true;
    if (ledsDirty && leds.instanceColor) leds.instanceColor.needsUpdate = true;
    if (ledsDirty) leds.instanceMatrix.needsUpdate = true;
    if (ring.visible && ringBase > 0) {
      const p = 1 + Math.sin(t * 3) * 0.02;
      ring.scale.set(ringBase * p, ringBase * p, 1);
    }
    if (pickQueued) {
      const e = pickQueued;
      pickQueued = null;
      setPointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hitA = raycaster.intersectObject(proxies, false)[0];
      if (hitA && typeof hitA.instanceId === 'number' && avatars[hitA.instanceId]) {
        hoverAvatar = hitA.instanceId;
        hoverZone = null;
      } else {
        hoverAvatar = null;
        const hit = raycaster.intersectObject(carpets, false)[0];
        hoverZone = hit && typeof hit.instanceId === 'number' ? hit.instanceId : null;
      }
      if (hoverAvatar != null || hoverZone != null) {
        canvas.style.cursor = 'pointer';
        updateTooltip(e);
      } else {
        canvas.style.cursor = '';
        hideTooltip();
      }
      applyRing();
    }
    controls.update();
    renderer.render(scene, camera);
  };

  const disposeAll = () => {
    renderer.setAnimationLoop(null);
    io.disconnect();
    ro.disconnect();
    controls.dispose();
    if (resizeTimer) clearTimeout(resizeTimer);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerleave', onPointerLeave);
    canvas.removeEventListener('click', onClick);
    document.removeEventListener('visibilitychange', onVis);
    for (const d of disposables) d.dispose();
    envTex.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
  api.dispose = disposeAll;

  const onVis = () => {
    if (document.hidden) {
      renderer.setAnimationLoop(null);
    } else if (visible && !reducedMotion) {
      clock.getDelta();
      renderer.setAnimationLoop(loop);
    }
  };
  document.addEventListener('visibilitychange', onVis);

  const loop = () => {
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    renderFrame(clock.elapsedTime, dt);
  };

  const io = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry) return;
      visible = entry.isIntersecting;
      if (reducedMotion) {
        if (visible) {
          renderFrame(0.8, 0.016);
          syncStatic();
          renderer.render(scene, camera);
        }
        return;
      }
      if (visible) {
        clock.getDelta();
        renderer.setAnimationLoop(loop);
      } else {
        renderer.setAnimationLoop(null);
      }
    },
    { threshold: 0.02 },
  );
  io.observe(canvas);

  syncStatic();
  // Static LED colors for the first frame (so pickTest/SSR probes see them lit).
  for (let i = 0; i < ledBase.length; i++) {
    const b = ledBase[i];
    dummy.position.set(b.x, b.y, b.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    leds.setMatrixAt(i, dummy.matrix);
    leds.setColorAt(i, ledColors[i % ledColors.length]);
  }
  leds.instanceMatrix.needsUpdate = true;
  if (leds.instanceColor) leds.instanceColor.needsUpdate = true;
  renderFrame(0.8, 0.016);
  renderer.render(scene, camera);
  if (reducedMotion) {
    renderer.setAnimationLoop(null);
  }

  return api;
}
