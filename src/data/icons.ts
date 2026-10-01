/* ── SVG icon paths (24×24, stroke-based) — single source of truth ──
   Consumido vía `set:html` por Dashboard.astro y SemanticMap.astro.
   No duplicar este mapa en componentes: importar desde aquí. */
export const icons: Record<string, string> = {
  db: `<ellipse cx="12" cy="6" rx="9" ry="3"/>
          <path d="M3 6v4c0 1.66 4 3 9 3s9-1.34 9-3V6"/>
          <path d="M3 10v4c0 1.66 4 3 9 3s9-1.34 9-3v-4"/>
          <path d="M3 14v4c0 1.66 4 3 9 3s9-1.34 9-3v-4"/>`,
  refugio: `<path d="M3 10.5L12 4l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V10.5z"/>
          <path d="M8 21V13h8v8"/>`,
  truck: `<path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3"/>
          <polygon points="16 3 21 8 21 17 16 17 16 3"/>
          <circle cx="7" cy="17" r="2"/>
          <circle cx="17" cy="17" r="2"/>
          <line x1="9" y1="17" x2="15" y2="17"/>`,
  chart: `<rect x="2"  y="14" width="4" height="7" rx="1"/>
          <rect x="9"  y="9"  width="4" height="12" rx="1"/>
          <rect x="16" y="4"  width="4" height="17" rx="1"/>`,
  doc: `<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>`,
  park: `<rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M9 17V7h4a3 3 0 010 6H9"/>`,
  screen: `<rect x="2" y="3" width="20" height="14" rx="2"/>
          <line x1="8"  y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>`,
  play: `<circle cx="12" cy="12" r="10"/>
          <polygon points="10 8 16 12 10 16 10 8"/>`,
  ai: `<path d="M9.663 17h4.674M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>`,
  bal: `<line x1="12" y1="3" x2="12" y2="21"/>
          <path d="M7 5H3l-1 9h6L7 5z"/>
          <path d="M17 5h4l1 9h-6l1-9z"/>
          <line x1="2" y1="21" x2="22" y2="21"/>`,
  cal: `<rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>`,
};
