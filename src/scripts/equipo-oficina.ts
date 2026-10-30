/**
 * Macro office for the "Nuestro equipo" slide: one avatar per real person
 * (67 from `src/data/equipo.ts`), zones sized by headcount, low divider
 * walls, pillar-tinted carpets, floating name labels, corridors + lobby /
 * cafeteria commons, and three avatar states (seated typing, standing
 * chat, corridor walking).
 *
 * Performance contract (see .agents/skills/three-best-practices):
 * - setup-animation-loop: single renderer.setAnimationLoop, delta clamped
 * - draw-call-optimization: ~20 draw calls, one InstancedMesh per part
 * - animation-system: NO AnimationMixer (67 mixers = prohibitive);
 *   procedural code-driven animation (typing oscillation, walk swing,
 *   gesture bob) is cheaper and allocation-free in the loop
 * - geometry-instanced-mesh + geometry-vertex-count: shared low-seg geos
 * - material-reuse: a handful of shared MeshStandardMaterials
 * - lighting-limit-lights: hemi + 1 dir, no shadow maps;
 *   lighting-fake-shadows: blob planes under avatars
 * - render-pixel-ratio + mobile-optimization: DPR clamp 2 / 1.5, no AA mobile
 * - geometry-lod: beyond LOD_FAR only torso/head bob (limbs skip frames)
 * - vitals-lazy-load: boot is IntersectionObserver-deferred by Equipo.astro
 * - memory-*: full recursive dispose() on unmount
 * - prefers-reduced-motion: one static frame, no loop
 * - no postprocessing, no R3F
 */

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

/** Pillar accents from the semantic map (`src/data/branches.ts`). */
const ACCENTS = [0xc9a84c, 0x3cc9a4, 0xff8c42, 0x4a9eff, 0xff6b8e, 0x4a7a5a, 0x9b6dff];

// Warm brand wardrobe: gold, cream, warm grays, charcoal + desaturated accents.
const SHIRTS = [
  0xc9a84c, 0xe8dcc0, 0x8a7f6a, 0x6b6257, 0x4a4238, 0xb98a4c, 0x7a8b6f,
  0x5a7a9e, 0xb97f7f, 0x3f8a76, 0x9b6dff, 0xd9cba8,
];
const PANTS = [0x2b2620, 0x3a3227, 0x4a4238, 0x232323, 0x5a4a38];
const SKINS = [0xf1c9a5, 0xd9a06b, 0xa06a3c, 0x6e4530, 0xe8b48a];

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

interface Avatar {
  person: OficinaPersona;
  areaId: string;
  areaIdx: number;
  mode: AvatarMode;
  // Base position (sit/stand) or current path state (walk).
  x: number;
  z: number;
  yaw: number;
  seatY: number; // hip height: ~0.5 seated, ~0.78 standing/walking
  phase: number;
  scale: number;
  shirt: number;
  pants: number;
  skin: number;
  // Seated typing anchor (desk edge direction).
  faceX: number;
  faceZ: number;
  // Walk state (each avatar owns its loop copy: ping-pong mutates direction).
  path: Array<{ x: number; z: number }>;
  seg: number;
  segT: number;
  dir: 1 | -1;
  speed: number;
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
  const camera = new THREE.PerspectiveCamera(40, 1, 1, 500);
  const TARGET = new THREE.Vector3(0, 0.6, 0);
  const VIEW_DIR = new THREE.Vector3(1, 0.85, 1).normalize();

  // Slab 30 × 20: projected half-extents for azimuth 45° / elevation ~31°.
  const SLAB_W = 30;
  const SLAB_D = 20;
  const SLAB_HALF = Math.max(SLAB_W, SLAB_D) / 2;
  const HALF_W = SLAB_HALF * Math.SQRT2;
  const HALF_H = HALF_W * VIEW_DIR.y + 5.6 * Math.sqrt(1 - VIEW_DIR.y ** 2);
  const fitDistance = (aspect: number): number => {
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dV = HALF_H / tanV;
    const dH = HALF_W / (tanV * Math.max(0.3, aspect));
    return Math.max(dV, dH) * 1.08;
  };
  const placeCamera = (dist: number) => {
    camera.position.copy(TARGET).addScaledVector(VIEW_DIR, dist);
    camera.lookAt(TARGET);
    camera.near = Math.max(0.5, dist / 100);
    camera.far = dist * 6 + 100;
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
  sun.position.set(10, 16, 6);
  scene.add(hemi, sun);

  const rig = new THREE.Group();
  rig.name = 'office-rig';
  scene.add(rig);

  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(v: T): T => {
    disposables.push(v);
    return v;
  };

  // ── Shared materials (matte warm palette, nothing near white) ──
  const slabMat = track(new THREE.MeshStandardMaterial({ color: 0x241c12, roughness: 0.95, metalness: 0 }));
  const corrMat = track(new THREE.MeshStandardMaterial({ color: 0x171208, roughness: 0.95, metalness: 0 }));
  const carpetMat = track(new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0.04 }));
  const wallMat = track(new THREE.MeshStandardMaterial({ color: 0x33291d, roughness: 0.9, metalness: 0 }));
  const trimMat = track(new THREE.MeshStandardMaterial({ color: 0xc9a84c, roughness: 0.45, metalness: 0.65 }));
  const deskTopMat = track(new THREE.MeshStandardMaterial({ color: 0x8a6844, roughness: 0.6, metalness: 0.1 }));
  const deskLegMat = track(new THREE.MeshStandardMaterial({ color: 0x241c14, roughness: 0.65, metalness: 0.15 }));
  const monitorMat = track(new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.5, metalness: 0.4 }));
  const screenMat = track(
    new THREE.MeshStandardMaterial({ color: 0x2b3648, emissive: 0x9db4d4, emissiveIntensity: 0.55, roughness: 0.4, metalness: 0 }),
  );
  const chairMat = track(new THREE.MeshStandardMaterial({ color: 0x26211b, roughness: 0.7, metalness: 0.3 }));
  const torsoMat = track(new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0 }));
  const limbMat = track(new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0 }));
  const pantsMat = track(new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0 }));
  const headMat = track(new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0 }));
  const leafMat = track(new THREE.MeshStandardMaterial({ color: 0x3d6b35, roughness: 0.9, metalness: 0 }));
  const potMat = track(new THREE.MeshStandardMaterial({ color: 0x5a3d24, roughness: 0.8, metalness: 0 }));
  const lampPostMat = track(new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.6, metalness: 0.5 }));
  const lampGlowMat = track(
    new THREE.MeshStandardMaterial({ color: 0x6b5a33, emissive: 0xffd98a, emissiveIntensity: 0.9, roughness: 0.5, metalness: 0 }),
  );
  const tableMat = track(new THREE.MeshStandardMaterial({ color: 0x6e5638, roughness: 0.6, metalness: 0.1 }));
  const stoolMat = track(new THREE.MeshStandardMaterial({ color: 0x3a3227, roughness: 0.75, metalness: 0.1 }));
  const rugMat = track(new THREE.MeshStandardMaterial({ color: 0x4d3f22, roughness: 0.95, metalness: 0 }));
  const blobTex = track(makeBlobTexture(THREE));
  const blobMat = track(new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));

  // ── Shared geometries (low segment counts for mobile) ──
  const slabGeo = track(new THREE.BoxGeometry(SLAB_W, 0.6, SLAB_D));
  const trimGeo = track(new THREE.BoxGeometry(SLAB_W + 0.7, 0.14, SLAB_D + 0.7));
  const unitBoxGeo = track(new THREE.BoxGeometry(1, 1, 1));
  const corrGeoH = track(new THREE.BoxGeometry(SLAB_W - 1, 0.1, 2.4));
  const corrGeoV = track(new THREE.BoxGeometry(2.4, 0.1, SLAB_D - 1));
  const deskTopGeo = track(new THREE.BoxGeometry(1.7, 0.1, 0.85));
  const deskLegGeo = track(new THREE.BoxGeometry(0.1, 0.7, 0.75));
  const monitorGeo = track(new THREE.BoxGeometry(0.8, 0.52, 0.07));
  const screenGeo = track(new THREE.PlaneGeometry(0.7, 0.42));
  const chairSeatGeo = track(new THREE.BoxGeometry(0.48, 0.09, 0.48));
  const chairBackGeo = track(new THREE.BoxGeometry(0.48, 0.5, 0.08));
  const torsoGeo = track(new THREE.CapsuleGeometry(0.19, 0.42, 2, 8));
  const armGeo = track(new THREE.CapsuleGeometry(0.055, 0.4, 2, 6));
  armGeo.translate(0, -0.22, 0); // pivot at the shoulder
  const legGeo = track(new THREE.CapsuleGeometry(0.07, 0.4, 2, 6));
  legGeo.translate(0, -0.22, 0); // pivot at the hip
  const headGeo = track(new THREE.SphereGeometry(0.15, 10, 8));
  const blobGeo = track(new THREE.PlaneGeometry(0.9, 0.9));
  const potGeo = track(new THREE.CylinderGeometry(0.28, 0.22, 0.45, 10));
  const leafGeo = track(new THREE.SphereGeometry(0.42, 10, 8));
  const lampPostGeo = track(new THREE.CylinderGeometry(0.05, 0.07, 1.7, 8));
  const lampGlobeGeo = track(new THREE.SphereGeometry(0.2, 12, 10));
  const rugGeo = track(new THREE.CylinderGeometry(2.0, 2.0, 0.06, 28));
  const tableGeo = track(new THREE.CylinderGeometry(0.75, 0.75, 0.08, 18));
  const tableLegGeo = track(new THREE.CylinderGeometry(0.06, 0.08, 0.68, 8));
  const stoolGeo = track(new THREE.CylinderGeometry(0.26, 0.26, 0.42, 12));

  // ── Zone packing: shelf algorithm, area ∝ headcount ──
  // Blocked: vertical + horizontal corridors, cafeteria commons.
  interface Block { x0: number; z0: number; x1: number; z1: number }
  const HW = SLAB_W / 2;
  const HD = SLAB_D / 2;
  const MX = HW - 1.3; // packing margin keeps a perimeter walkway
  const MZ = HD - 1.3;
  const blocks: Block[] = [
    { x0: -1.2, z0: -HD, x1: 1.2, z1: HD }, // vertical corridor
    { x0: -HW, z0: -1.2, x1: HW, z1: 1.2 }, // horizontal corridor
    { x0: 8.0, z0: 5.6, x1: 13.6, z1: 9.2 }, // cafeteria commons (SE)
  ];
  const hits = (x0: number, z0: number, x1: number, z1: number): Block | null => {
    for (const b of blocks) {
      if (x0 < b.x1 && x1 > b.x0 && z0 < b.z1 && z1 > b.z0) return b;
    }
    return null;
  };

  const GAP = 0.55;
  const sorted = areas.map((a, i) => ({ a, i })).sort((p, q) => q.a.count - p.a.count || p.i - q.i);
  const zones: Zone[] = [];
  let curX = -MX;
  let curZ = -MZ;
  let rowH = 0;
  for (const { a, i } of sorted) {
    const { w, h } = zoneRectFor(zoneUnitsFor(a.count));
    let x0 = curX;
    let z0 = curZ;
    for (let guard = 0; guard < 40; guard++) {
      if (x0 + w > MX) {
        x0 = -MX;
        z0 = curZ + rowH + GAP;
        rowH = 0;
      }
      const b = hits(x0, z0, x0 + w, z0 + h);
      if (!b) break;
      const bw = b.x1 - b.x0;
      const bd = b.z1 - b.z0;
      if (bw > bd) {
        // Horizontal band (corridor / cafeteria): drop to a new row below it.
        x0 = -MX;
        z0 = Math.max(z0 + 0.1, b.z1 + GAP);
        rowH = 0;
      } else {
        x0 = b.x1 + GAP; // vertical corridor: slide right, same row
      }
    }
    zones.push({ area: a, cx: x0 + w / 2, cz: z0 + h / 2, w, h, accent: ACCENTS[i % ACCENTS.length] });
    curX = x0 + w + GAP;
    rowH = Math.max(rowH, h);
    curZ = z0;
  }
  // Restore original area order for stable pill mapping.
  zones.sort((p, q) => areas.indexOf(p.area) - areas.indexOf(q.area));

  // ── People → avatars (one per real person, 67 total) ──
  interface FlatPerson { p: OficinaPersona; zone: Zone; zoneIdx: number; gi: number }
  const flat: FlatPerson[] = [];
  {
    let gi = 0;
    zones.forEach((z, zi) => {
      for (const p of z.area.personas ?? []) flat.push({ p, zone: z, zoneIdx: zi, gi: gi++ });
    });
  }

  // Walkers: every 6th person (≈11), spread across zones.
  const walkerSet = new Set<number>();
  flat.forEach((f) => {
    if (f.gi % 6 === 5) walkerSet.add(f.gi);
  });

  // Standers: up to ~25% per zone (even pairs) for conversation groups.
  const standCount = new Map<number, number>();
  zones.forEach((z, zi) => {
    const inZone = flat.filter((f) => f.zoneIdx === zi && !walkerSet.has(f.gi));
    const n = Math.min(inZone.length, Math.max(0, Math.floor(z.area.count * 0.25 / 2) * 2));
    standCount.set(zi, n);
  });

  // Corridor waypoint loops (centerlines + perimeter walkway, all clear).
  const ringLoop = [
    { x: -14, z: -9 }, { x: 14, z: -9 }, { x: 14, z: 9 }, { x: -14, z: 9 },
  ];
  const hLoop = [
    { x: -13.5, z: 0 }, { x: 13.5, z: 0 },
  ];
  const vLoop = [
    { x: 0, z: -8.5 }, { x: 0, z: 8.5 },
  ];

  const avatars: Avatar[] = [];
  const desksByZone = new Map<number, Array<{ x: number; z: number; rot: number }>>();
  const standSpots = new Map<number, Array<{ x: number; z: number }>>();

  // Desk grids per zone (one desk per seated avatar).
  zones.forEach((z, zi) => {
    const inZone = flat.filter((f) => f.zoneIdx === zi && !walkerSet.has(f.gi));
    const nStand = standCount.get(zi) ?? 0;
    const n = z.area.count === 0 ? 1 : Math.max(0, inZone.length - nStand);
    const desks: Array<{ x: number; z: number; rot: number }> = [];
    if (n > 0) {
      const ix = 0.75;
      const aw = Math.max(1, z.w - ix * 2);
      const ah = Math.max(1, z.h - ix * 2);
      const cols = Math.max(1, Math.ceil(Math.sqrt((n * aw) / Math.max(0.6, ah))));
      const rows = Math.max(1, Math.ceil(n / cols));
      const rot = zi % 2 === 0 ? 0 : Math.PI / 2;
      for (let d = 0; d < n; d++) {
        const c = d % cols;
        const r = Math.floor(d / cols);
        const dx = cols > 1 ? (c / (cols - 1) - 0.5) * aw : 0;
        const dz = rows > 1 ? (r / (rows - 1) - 0.5) * ah : 0;
        desks.push({ x: z.cx + dx, z: z.cz + dz, rot });
      }
    }
    desksByZone.set(zi, desks);
    // Conversation spot: zone corner pulled toward the building center.
    const sx = z.cx + (z.cx > 0 ? -1 : 1) * Math.max(0, z.w / 2 - 0.95);
    const sz = z.cz + (z.cz > 0 ? -1 : 1) * Math.max(0, z.h / 2 - 0.95);
    const spots: Array<{ x: number; z: number }> = [];
    for (let s = 0; s < (standCount.get(zi) ?? 0); s++) {
      const a = (s / Math.max(1, nStand)) * Math.PI * 2;
      spots.push({ x: sx + Math.cos(a) * 0.55, z: sz + Math.sin(a) * 0.55 });
    }
    standSpots.set(zi, spots);
  });

  const deskCursor = new Map<number, number>();
  zones.forEach((_, zi) => deskCursor.set(zi, 0));
  flat.forEach((f) => {
    const gi = f.gi;
    const zi = f.zoneIdx;
    const z = f.zone;
    const sc = 0.93 + hash(gi) * 0.14;
    const base: Avatar = {
      person: f.p,
      areaId: z.area.id,
      areaIdx: zi,
      mode: 'sit',
      x: z.cx, z: z.cz, yaw: hash(gi + 99) * Math.PI * 2,
      seatY: 0.5, phase: hash(gi * 3 + 1) * Math.PI * 2, scale: sc,
      shirt: SHIRTS[(gi * 5 + zi) % SHIRTS.length],
      pants: PANTS[(gi * 3 + zi) % PANTS.length],
      skin: SKINS[gi % SKINS.length],
      faceX: 0, faceZ: 0,
      path: [], seg: 0, segT: hash(gi + 7), speed: 1.1 + hash(gi + 13) * 0.7,
    };
    if (walkerSet.has(gi)) {
      base.mode = 'walk';
      base.seatY = 0.78;
      const kind = gi % 3;
      base.path = [...(kind === 0 ? ringLoop : kind === 1 ? hLoop : vLoop)];
      base.seg = gi % base.path.length;
      base.dir = base.seg >= base.path.length - 1 ? -1 : 1;
      base.segT = hash(gi + 7);
      const a0 = base.path[Math.min(base.seg, base.path.length - 1)];
      const b0 = base.path[Math.min(base.seg + 1, base.path.length - 1)];
      base.x = a0.x + (b0.x - a0.x) * base.segT;
      base.z = a0.z + (b0.z - a0.z) * base.segT;
      base.yaw = Math.atan2(b0.x - a0.x, b0.z - a0.z);
    } else {
      const taken = deskCursor.get(zi) ?? 0;
      const desks = desksByZone.get(zi) ?? [];
      const nStand = standCount.get(zi) ?? 0;
      // Zone order: first (len - nStand) sit, last nStand converse.
      const zoneList = flat.filter((x) => x.zoneIdx === zi && !walkerSet.has(x.gi));
      const idxInZone = zoneList.findIndex((x) => x.gi === gi);
      if (idxInZone >= zoneList.length - nStand && nStand > 0) {
        base.mode = 'stand';
        base.seatY = 0.78;
        const spots = standSpots.get(zi) ?? [{ x: z.cx, z: z.cz }];
        const sp = spots[idxInZone - (zoneList.length - nStand)] ?? spots[0];
        base.x = sp.x;
        base.z = sp.z;
        // Face the group center.
        const gx = z.cx + (z.cx > 0 ? -1 : 1) * Math.max(0, z.w / 2 - 0.95);
        const gz = z.cz + (z.cz > 0 ? -1 : 1) * Math.max(0, z.h / 2 - 0.95);
        base.yaw = Math.atan2(gx - sp.x, gz - sp.z);
      } else {
        base.mode = 'sit';
        const d = desks[taken];
        if (d) {
          const off = d.rot === 0 ? { x: 0.15, z: 0.95 } : { x: 0.95, z: 0.15 };
          base.x = d.x + off.x;
          base.z = d.z + off.z;
          base.yaw = Math.atan2(d.x - base.x, d.z - base.z);
          base.faceX = d.x;
          base.faceZ = d.z;
          deskCursor.set(zi, taken + 1);
        }
      }
    }
    avatars.push(base);
  });

  const NF = avatars.length;
  const N = zones.length;

  // ── Instanced meshes (one draw call each) ──
  const dummy = new THREE.Object3D();
  const rig_add: THREE.Object3D[] = [];

  const slab = new THREE.Mesh(slabGeo, slabMat);
  slab.position.y = -0.42;
  slab.name = 'slab';
  rig.add(slab);
  const trim = new THREE.Mesh(trimGeo, trimMat);
  trim.position.y = -0.62;
  rig.add(trim);
  rig_add.push(slab, trim);

  const corrH = new THREE.Mesh(corrGeoH, corrMat);
  corrH.position.y = -0.06;
  const corrV = new THREE.Mesh(corrGeoV, corrMat);
  corrV.position.y = -0.06;
  rig.add(corrH, corrV);
  rig_add.push(corrH, corrV);

  const zoneCount = N;
  const carpets = new THREE.InstancedMesh(unitBoxGeo, carpetMat, zoneCount);
  carpets.name = 'carpets';

  // Furniture counts.
  let deskTotal = 0;
  desksByZone.forEach((d) => { deskTotal += d.length; });
  const seatedTotal = avatars.filter((a) => a.mode === 'sit').length;
  const ND = Math.max(1, deskTotal);
  const deskTops = new THREE.InstancedMesh(deskTopGeo, deskTopMat, ND);
  const deskLegs = new THREE.InstancedMesh(deskLegGeo, deskLegMat, ND * 2);
  const monitors = new THREE.InstancedMesh(monitorGeo, monitorMat, ND);
  const screens = new THREE.InstancedMesh(screenGeo, screenMat, ND);
  const chairs = new THREE.InstancedMesh(chairSeatGeo, chairMat, Math.max(1, seatedTotal));
  const chairBacks = new THREE.InstancedMesh(chairBackGeo, chairMat, Math.max(1, seatedTotal));

  // Avatar parts: 6 InstancedMeshes, one per body part (67 each).
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
  // Forgiving hover targets: invisible fat cylinders per avatar (colorWrite
  // off = zero visual cost, 1 extra draw call, ~2x wider than a torso).
  const proxyGeo = track(new THREE.CylinderGeometry(0.42, 0.42, 1.7, 6));
  const proxyMat = track(new THREE.MeshBasicMaterial({
    transparent: true, opacity: 0, depthWrite: false,
  }));
  proxyMat.colorWrite = false;
  const proxies = new THREE.InstancedMesh(proxyGeo, proxyMat, NAv);
  proxies.name = 'avatar-proxies';
  for (const m of [torsos, heads, armL, armR, legL, legR, blobs, proxies]) {
    m.frustumCulled = false; // spread instances: per-mesh culling would pop
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }

  // Walls: perimeter (5, entrance gap on +X) + 2 low dividers per zone + gold rails.
  const wallSegs: Array<[number, number, number, number, number, number]> = [];
  const PERI_X = HW - 0.4;
  const PERI_Z = HD - 0.4;
  wallSegs.push(
    [0, 0.55, -PERI_Z, PERI_X * 2, 1.1, 0.3],
    [-PERI_X, 0.55, 0, 0.3, 1.1, PERI_Z * 2],
    [PERI_X, 0.55, -2, 0.3, 1.1, PERI_Z - 4],
    [PERI_X, 0.55, 6.5, 0.3, 1.1, PERI_Z - 5],
    [-PERI_X / 2 - 1.5, 0.55, PERI_Z, PERI_X - 3, 1.1, 0.3],
    [PERI_X / 2 + 1.5, 0.55, PERI_Z, PERI_X - 3, 1.1, 0.3],
  );
  const railSegs: Array<[number, number, number, number, number, number]> = [];
  zones.forEach((z) => {
    const t = 0.16;
    const hgt = 0.55;
    // North + west low dividers with gold top rails.
    wallSegs.push([z.cx, hgt / 2, z.cz - z.h / 2, z.w, hgt, t]);
    wallSegs.push([z.cx - z.w / 2, hgt / 2, z.cz, t, hgt, z.h]);
    railSegs.push([z.cx, hgt + 0.03, z.cz - z.h / 2, z.w, 0.05, t + 0.04]);
    railSegs.push([z.cx - z.w / 2, hgt + 0.03, z.cz, t + 0.04, 0.05, z.h]);
  });
  const walls = new THREE.InstancedMesh(unitBoxGeo, wallMat, wallSegs.length);
  walls.name = 'walls';
  const rails = new THREE.InstancedMesh(unitBoxGeo, trimMat, railSegs.length);

  // Commons: lobby rug + cafeteria tables/stools; corners: plants + lamps.
  const rug = new THREE.Mesh(rugGeo, rugMat);
  rug.position.set(0, 0.02, 0);
  rig.add(rug);
  rig_add.push(rug);
  const cafeTables = new THREE.InstancedMesh(tableGeo, tableMat, 2);
  const cafeLegs = new THREE.InstancedMesh(tableLegGeo, deskLegMat, 2);
  const stools = new THREE.InstancedMesh(stoolGeo, stoolMat, 8);
  const pots = new THREE.InstancedMesh(potGeo, potMat, 4);
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, 4);
  const lampPosts = new THREE.InstancedMesh(lampPostGeo, lampPostMat, 4);
  const lampGlobes = new THREE.InstancedMesh(lampGlobeGeo, lampGlowMat, 4);

  rig.add(
    carpets, deskTops, deskLegs, monitors, screens, chairs, chairBacks,
    torsos, heads, armL, armR, legL, legR, blobs, proxies,
    walls, rails, cafeTables, cafeLegs, stools, pots, leaves, lampPosts, lampGlobes,
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

  // Desks + monitors + screens.
  {
    let di = 0;
    desksByZone.forEach((desks) => {
      for (const d of desks) {
        dummy.position.set(d.x, 0.5, d.z);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, d.rot, 0);
        dummy.updateMatrix();
        deskTops.setMatrixAt(di, dummy.matrix);
        for (let l = 0; l < 2; l++) {
          const off = l === 0 ? -0.7 : 0.7;
          dummy.position.set(d.rot === 0 ? d.x + off : d.x, 0.15, d.rot === 0 ? d.z : d.z + off);
          dummy.rotation.set(0, d.rot, 0);
          dummy.updateMatrix();
          deskLegs.setMatrixAt(di * 2 + l, dummy.matrix);
        }
        const mx = d.rot === 0 ? d.x : d.x - 0.45;
        const mz = d.rot === 0 ? d.z - 0.28 : d.z;
        dummy.position.set(mx, 0.95, mz);
        dummy.rotation.set(0, d.rot, 0);
        dummy.updateMatrix();
        monitors.setMatrixAt(di, dummy.matrix);
        dummy.position.set(d.rot === 0 ? mx : mx + 0.045, 0.95, d.rot === 0 ? mz + 0.045 : mz);
        dummy.rotation.set(0, d.rot === 0 ? 0 : Math.PI / 2, 0);
        dummy.updateMatrix();
        screens.setMatrixAt(di, dummy.matrix);
        di++;
      }
    });
    if (deskTotal === 0) {
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
  railSegs.forEach((w, i) => {
    dummy.position.set(w[0], w[1], w[2]);
    dummy.scale.set(w[3], w[4], w[5]);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    rails.setMatrixAt(i, dummy.matrix);
  });

  // Cafeteria: 2 tables + 8 stools.
  const cafeCx = 10.8;
  const cafeCz = 7.4;
  for (let t = 0; t < 2; t++) {
    const tx = cafeCx - 1.6 + t * 3.2;
    dummy.position.set(tx, 0.72, cafeCz);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    cafeTables.setMatrixAt(t, dummy.matrix);
    dummy.position.set(tx, 0.36, cafeCz);
    dummy.updateMatrix();
    cafeLegs.setMatrixAt(t, dummy.matrix);
    for (let s = 0; s < 4; s++) {
      const a = (s / 4) * Math.PI * 2 + t * 0.4;
      dummy.position.set(tx + Math.cos(a) * 1.25, 0.21, cafeCz + Math.sin(a) * 1.25);
      dummy.updateMatrix();
      stools.setMatrixAt(t * 4 + s, dummy.matrix);
    }
  }

  // Corner dressing.
  const corners: Array<[number, number]> = [
    [-PERI_X + 0.8, -PERI_Z + 0.8],
    [PERI_X - 0.8, -PERI_Z + 0.8],
    [-PERI_X + 0.8, PERI_Z - 0.8],
    [PERI_X - 0.8, PERI_Z - 0.8],
  ];
  corners.forEach(([cx, cz], i) => {
    const isPlant = i < 2;
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    if (isPlant) {
      dummy.position.set(cx, 0.22, cz);
      dummy.updateMatrix();
      pots.setMatrixAt(i, dummy.matrix);
      dummy.position.set(cx, 0.85, cz);
      dummy.scale.set(1, 1.15, 1);
      dummy.updateMatrix();
      leaves.setMatrixAt(i, dummy.matrix);
      dummy.position.set(0, -100, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      lampPosts.setMatrixAt(i, dummy.matrix);
      lampGlobes.setMatrixAt(i, dummy.matrix);
    } else {
      dummy.position.set(cx, 0.85, cz);
      dummy.updateMatrix();
      lampPosts.setMatrixAt(i, dummy.matrix);
      dummy.position.set(cx, 1.8, cz);
      dummy.updateMatrix();
      lampGlobes.setMatrixAt(i, dummy.matrix);
      dummy.position.set(0, -100, 0);
      dummy.updateMatrix();
      pots.setMatrixAt(i, dummy.matrix);
      leaves.setMatrixAt(i, dummy.matrix);
    }
  });

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

  const syncInstances = () => {
    for (const m of [carpets, deskTops, deskLegs, monitors, screens, chairs, chairBacks, torsos, heads, armL, armR, legL, legR, blobs, proxies, walls, rails, cafeTables, cafeLegs, stools, pots, leaves, lampPosts, lampGlobes]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  };

  // ── Floating labels: one per zone + lobby / cafeteria commons ──
  const labelMats: THREE.SpriteMaterial[] = [];
  zones.forEach((z, i) => {
    const sub = z.area.count === 0
      ? 'Sin personas asignadas'
      : `${z.area.count} ${z.area.count === 1 ? 'persona' : 'personas'}`;
    const tex = track(makeLabelTexture(THREE, z.area.nombre, sub, z.area.count === 0));
    const mat = track(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    labelMats.push(mat);
    const spr = new THREE.Sprite(mat);
    spr.position.set(z.cx, 3.4 + (i % 2) * 0.8, z.cz);
    spr.scale.set(4.0, 1.25, 1);
    spr.name = `label-${z.area.id}`;
    rig.add(spr);
  });
  const commons: Array<[string, string, number, number]> = [
    ['Lobby', 'Espacio común', 0, 0],
    ['Cafetería', 'Espacio común', cafeCx, cafeCz],
  ];
  const commonMats: THREE.SpriteMaterial[] = [];
  for (const [title, sub, lx, lz] of commons) {
    const tex = track(makeLabelTexture(THREE, title, sub, false));
    const mat = track(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.95 }));
    commonMats.push(mat);
    const spr = new THREE.Sprite(mat);
    spr.position.set(lx, 2.9, lz);
    spr.scale.set(3.2, 1.0, 1);
    spr.name = `label-common-${title}`;
    rig.add(spr);
  }

  // ── Perimeter GCB logo plate (north wall, inner face) ──
  {
    const tex = track(makeLogoTexture(THREE));
    const mat = track(new THREE.MeshBasicMaterial({ map: tex }));
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.1), mat);
    track(plate.geometry);
    plate.position.set(0, 1.0, -PERI_Z + 0.16);
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
      name.textContent = a.person.nombre;
      const meta = document.createElement('span');
      const rol = a.person.rol ? ` · ${a.person.rol}` : '';
      meta.textContent = `${zones[a.areaIdx].area.nombre}${rol}`;
      tip.append(name, document.createElement('br'), meta);
    } else if (hoverZone != null && zones[hoverZone]) {
      const z = zones[hoverZone];
      const name = document.createElement('strong');
      name.textContent = z.area.nombre;
      const meta = document.createElement('span');
      meta.textContent = `Jefatura: ${z.area.jefatura} · ${z.area.count} ${z.area.count === 1 ? 'persona' : 'personas'}`;
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
        ? avatars[hitA.instanceId].person.nombre
        : null;
      const hit = raycaster.intersectObject(carpets, false)[0];
      const zone = hit && typeof hit.instanceId === 'number' && zones[hit.instanceId]
        ? zones[hit.instanceId].area.nombre
        : null;
      return { avatar, zone };
    },
    dispose: () => {},
  };

  // ── Procedural animation (no mixers): typing / chat / walk ──
  const clock = new THREE.Clock();
  let visible = true;
  let frame = 0;
  const tmpA = new THREE.Object3D();
  const tmpB = new THREE.Object3D();
  const LOD_FAR = camera.position.distanceTo(TARGET) * 1.1;
  const HIP_SIT = 0.5;
  const HIP_STAND = 0.78;

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

  const renderFrame = (t: number, dt: number) => {
    frame++;
    const far = camera.position.distanceTo(TARGET) > LOD_FAR;
    for (let k = 0; k < avatars.length; k++) {
      const a = avatars[k];
      const s = a.scale;
      let x = a.x;
      let z = a.z;
      let yaw = a.yaw;
      let hipY = a.seatY * s + 0.1;
      let bob = 0;
      let swing = 0;

      if (a.mode === 'walk' && !reducedMotion) {
        // Advance along the corridor loop (ping-pong: reverse at the ends).
        const pts = a.path;
        if (pts.length >= 2) {
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
          x = q0.x + (q1.x - q0.x) * Math.min(1, a.segT);
          z = q0.z + (q1.z - q0.z) * Math.min(1, a.segT);
          const targetYaw = Math.atan2(q1.x - q0.x, q1.z - q0.z);
          a.yaw = lerpAngle(a.yaw, targetYaw, dt * 6);
          yaw = a.yaw;
          a.x = x;
          a.z = z;
        }
        const w = t * 7 + a.phase;
        bob = Math.abs(Math.sin(w)) * 0.05;
        swing = Math.sin(w) * 0.55;
        hipY = HIP_STAND * s + 0.1 + bob;
      } else if (a.mode === 'sit') {
        // Seated typing: torso upright at the desk, forearms oscillating.
        hipY = HIP_SIT * s + 0.1;
        if (!reducedMotion) {
          bob = Math.sin(t * 1.4 + a.phase) * 0.012;
          swing = Math.sin(t * 7 + a.phase) * 0.28; // keystroke oscillation
        }
      } else {
        // Standing chat: gentle sway + gesture on one arm.
        hipY = HIP_STAND * s + 0.1;
        if (!reducedMotion) {
          bob = Math.sin(t * 1.8 + a.phase) * 0.02;
          swing = Math.sin(t * 2.2 + a.phase) * 0.3;
        }
      }

      // Torso + head (always updated, even in far LOD).
      tmpA.position.set(x, hipY + 0.32 * s + bob, z);
      tmpA.rotation.set(a.mode === 'sit' ? 0.08 : 0, yaw, 0);
      tmpA.scale.set(s, s, s);
      tmpA.updateMatrix();
      torsos.setMatrixAt(k, tmpA.matrix);
      tmpA.position.set(
        x + Math.sin(yaw) * 0.05,
        hipY + (a.mode === 'sit' ? 0.82 : 0.86) * s + bob * 1.4 + (a.mode === 'sit' ? -0.02 : Math.sin(t * 1.1 + a.phase) * (reducedMotion ? 0 : 0.015)),
        z + Math.cos(yaw) * 0.05,
      );
      tmpA.rotation.set(a.mode === 'sit' ? 0.22 : 0, yaw, 0);
      tmpA.updateMatrix();
      heads.setMatrixAt(k, tmpA.matrix);

      // Limbs: skipped on alternate frames when far (LOD).
      const updateLimbs = !far || ((frame + k) % 3 === 0);
      if (updateLimbs) {
        const shX = x;
        const shY = hipY + 0.52 * s + bob;
        const shZ = z;
        if (a.mode === 'sit') {
          // Arms forward onto the desk, typing; legs bent (thigh forward).
          const fx = Math.sin(yaw);
          const fz = Math.cos(yaw);
          placeLimb(armL, k, shX - fz * 0.24 * s, shY, shZ + fx * 0.24 * s, -1.15 + swing, yaw, s);
          placeLimb(armR, k, shX + fz * 0.24 * s, shY, shZ - fx * 0.24 * s, -1.15 - swing, yaw, s);
          placeLimb(legL, k, shX - 0.11 * s, hipY + 0.05, shZ, -1.35, yaw, s);
          placeLimb(legR, k, shX + 0.11 * s, hipY + 0.05, shZ, -1.35, yaw, s);
        } else if (a.mode === 'stand') {
          // One arm gestures, the other rests; subtle weight shift.
          placeLimb(armL, k, shX - Math.cos(yaw) * 0.24 * s, shY, shZ + Math.sin(yaw) * 0.24 * s, -0.25 + swing, yaw, s);
          placeLimb(armR, k, shX + Math.cos(yaw) * 0.24 * s, shY, shZ - Math.sin(yaw) * 0.24 * s, -0.15 - swing * 0.4, yaw, s);
          placeLimb(legL, k, shX - 0.11 * s, hipY + 0.02, shZ, 0.06, yaw, s);
          placeLimb(legR, k, shX + 0.11 * s, hipY + 0.02, shZ, -0.06, yaw, s);
        } else {
          // Walk: arms + legs counter-swing.
          placeLimb(armL, k, shX - Math.cos(yaw) * 0.24 * s, shY, shZ + Math.sin(yaw) * 0.24 * s, swing, yaw, s);
          placeLimb(armR, k, shX + Math.cos(yaw) * 0.24 * s, shY, shZ - Math.sin(yaw) * 0.24 * s, -swing, yaw, s);
          placeLimb(legL, k, shX - 0.11 * s, hipY + 0.02, shZ, -swing * 0.9, yaw, s);
          placeLimb(legR, k, shX + 0.11 * s, hipY + 0.02, shZ, swing * 0.9, yaw, s);
        }
      }
      // Blob shadow follows the base; proxy cylinder centers on the figure.
      tmpB.position.set(x, 0.1, z);
      tmpB.rotation.set(-Math.PI / 2, 0, 0);
      tmpB.scale.set(s, s, s);
      tmpB.updateMatrix();
      blobs.setMatrixAt(k, tmpB.matrix);
      tmpB.position.set(x, hipY + 0.1, z);
      tmpB.rotation.set(0, 0, 0);
      tmpB.scale.set(s, s, s);
      tmpB.updateMatrix();
      proxies.setMatrixAt(k, tmpB.matrix);
    }
    torsos.instanceMatrix.needsUpdate = true;
    heads.instanceMatrix.needsUpdate = true;
    armL.instanceMatrix.needsUpdate = true;
    armR.instanceMatrix.needsUpdate = true;
    legL.instanceMatrix.needsUpdate = true;
    legR.instanceMatrix.needsUpdate = true;
    blobs.instanceMatrix.needsUpdate = true;
    proxies.instanceMatrix.needsUpdate = true;
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
          syncInstances();
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

  syncInstances();
  renderFrame(0.8, 0.016);
  renderer.render(scene, camera);
  if (reducedMotion) {
    renderer.setAnimationLoop(null);
  }

  return api;
}
