// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/* Herramienta local de autoría (solo `astro dev`): persiste el layout del
   mapa semántico en src/data/map-layout.ts vía POST /api/save-layout.
   Se implementa como middleware Node crudo porque en este entorno el dev
   server entrega los Request de Astro sin body/headers/query.
   En build/preview no existe servidor: el cliente cae a clipboard. */
const KNOWN_BRANCHES = ['b-refugio', 'b-channels', 'b-bosque', 'b-ai', 'b-sisa', 'b-parking', 'b-finanzas'];
const KNOWN_LEAVES = [
  'p-proc', 'p-del', 'p-com', 'p-docgcb',
  'p-kiosk', 'p-runner', 'p-agenda',
  'p-bosque', 'p-bosque-adm',
  'p-ai',
  'p-sisa', 'p-sisa-reg',
  'p-est',
  'p-conc', 'p-oc',
];

function sanitizeSection(input, known) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const out = {};
  for (const [id, pos] of Object.entries(input)) {
    if (typeof id !== 'string' || !known.includes(id)) return null;
    if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return null;
    out[id] = {
      x: Math.round(Math.min(1440, Math.max(0, pos.x))),
      y: Math.round(Math.min(940, Math.max(0, pos.y))),
    };
  }
  return out;
}

function renderMapLayout(branches, leaves) {
  const block = (obj) =>
    Object.entries(obj)
      .map(([k, v]) => `  '${k}': { x: ${v.x}, y: ${v.y} },`)
      .join('\n');
  return `/* ── Mapa de coordenadas del mapa semántico ──
   Single source of truth del layout (single source of truth, ver DESIGN.md).
   Flujo: acomodá los nodos a gusto en el tablero y botón "Guardar layout"
   (persiste aquí vía /api/save-layout en dev; en producción cae a clipboard).
   Ese pasa a ser el mapa base para todos. */

export interface NodePosition {
  x: number;
  y: number;
}

/** Centro del lienzo 1440×940 (hub fijo, no arrastrable). */
export const MAP_CENTER: NodePosition = { x: 720, y: 470 };

/** Posición de los 4 pilares. */
export const branchPositions: Record<string, NodePosition> = {
${block(branches)}
};

/** Posición de las 10 hojas (lo único que vive aquí; el contenido viene de projects.ts). */
export const leafPositions: Record<string, NodePosition> = {
${block(leaves)}
};
`;
}

const saveLayoutPlugin = {
  name: 'gcb-save-layout',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/api/save-layout', async (req, res) => {
      const fail = (status, error) => {
        res.statusCode = status;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error }));
      };
      // GET con ?d=<base64url> (el body POST lo consume un middleware previo
      // en este entorno, pero la URL llega intacta).
      if (req.method !== 'GET') {
        fail(405, 'usar GET con ?d=');
        return;
      }
      const query = (req.url || '').split('?')[1] || '';
      const params = new URLSearchParams(query);
      const encoded = params.get('d');
      if (!encoded) {
        fail(400, 'falta parámetro d');
        return;
      }
      let payload;
      try {
        const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
        payload = JSON.parse(Buffer.from(b64 + pad, 'base64').toString('utf8'));
      } catch {
        fail(400, 'payload ilegible');
        return;
      }
      const branches = sanitizeSection(payload?.branches, KNOWN_BRANCHES);
      const leaves = sanitizeSection(payload?.leaves, KNOWN_LEAVES);
      if (
        !branches ||
        !leaves ||
        Object.keys(branches).length !== KNOWN_BRANCHES.length ||
        Object.keys(leaves).length !== KNOWN_LEAVES.length
      ) {
        fail(400, 'payload inválido');
        return;
      }
      try {
        const target = fileURLToPath(
          new URL('./src/data/map-layout.ts', `file://${process.cwd()}/`),
        );
        await writeFile(target, renderMapLayout(branches, leaves), 'utf8');
      } catch {
        fail(409, 'no se pudo escribir');
        return;
      }
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true }));
    });
  },
};

export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss(), saveLayoutPlugin],
  },
});
