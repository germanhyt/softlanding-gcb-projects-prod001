import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

/* ── ÍCONOS SVG CORPORATIVOS ── */
const icons: Record<string, React.ReactNode> = {
  db: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <ellipse cx="12" cy="6" rx="9" ry="3"/><path d="M3 6v4c0 1.66 4 3 9 3s9-1.34 9-3V6"/><path d="M3 10v4c0 1.66 4 3 9 3s9-1.34 9-3v-4"/><path d="M3 14v4c0 1.66 4 3 9 3s9-1.34 9-3v-4"/>
    </svg>
  ),
  refugio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M3 10.5L12 4l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V10.5z"/><path d="M8 21V13h8v8"/>
    </svg>
  ),
  truck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3"/><polygon points="16 3 21 8 21 17 16 17 16 3"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><line x1="9" y1="17" x2="15" y2="17"/>
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="2" y="14" width="4" height="7" rx="1"/><rect x="9" y="9" width="4" height="12" rx="1"/><rect x="16" y="4" width="4" height="17" rx="1"/>
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  park: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 010 6H9"/>
    </svg>
  ),
  screen: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M9.663 17h4.674M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
    </svg>
  ),
  bal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="12" y1="3" x2="12" y2="21"/><path d="M7 5H3l-1 9h6L7 5z"/><path d="M17 5h4l1 9h-6l1-9z"/><line x1="2" y1="21" x2="22" y2="21"/>
    </svg>
  ),
  cal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
};

/* ── 1. NODO CENTRAL: GRUPO CORDILLERA BLANCA S.A. ── */
function CoreNodeComponent({ data }: NodeProps) {
  return (
    <div className="rf-node-core group">
      <Handle type="source" position={Position.Left} id="left" className="rf-handle" />
      <Handle type="source" position={Position.Right} id="right" className="rf-handle" />
      <Handle type="source" position={Position.Top} id="top" className="rf-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="rf-handle" />

      <div className="rf-core-box">
        <div className="rf-core-header">
          <div className="rf-core-badge">GCB</div>
          <span className="rf-core-tag">HOLDING</span>
        </div>
        <div className="rf-core-body">
          <span className="rf-core-kicker">EMPRESA MATRIZ</span>
          <h2 className="rf-core-title">Grupo Cordillera Blanca S.A.</h2>
          <p className="rf-core-desc">Centro Neurálgico de Operaciones & Gobernanza</p>
        </div>
      </div>
    </div>
  );
}

/* ── 2. NODOS DE PILARES (RAMAS ESTRATÉGICAS) ── */
function BranchNodeComponent({ data }: NodeProps) {
  const { title, category, count, accent, targetPos, sourcePos } = data as {
    title: string;
    category: string;
    count: number;
    accent: string;
    targetPos: Position;
    sourcePos: Position;
  };

  return (
    <div className="rf-node-branch">
      <Handle type="target" position={targetPos} id="target" className="rf-handle" />
      <Handle type="source" position={sourcePos} id="source" className="rf-handle" />

      <div className="rf-branch-box" style={{ borderLeft: `3px solid ${accent}` }}>
        <span className="rf-branch-cat">{category}</span>
        <h3 className="rf-branch-title">{title}</h3>
        <span className="rf-branch-meta">{count} aplicaciones conectadas</span>
      </div>
    </div>
  );
}

/* ── 3. NODOS HOJA (PLATAFORMAS Y SISTEMAS) ── */
function LeafNodeComponent({ data }: NodeProps) {
  const { name, desc, domain, href, icon, badge, targetPos } = data as {
    name: string;
    desc: string;
    domain: string;
    href: string;
    icon: string;
    badge: string;
    targetPos: Position;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="rf-node-leaf" onClick={handleClick} title={`Abrir ${name} (${domain})`}>
      <Handle type="target" position={targetPos} id="target" className="rf-handle" />

      <div className="rf-leaf-box">
        <div className="rf-leaf-header">
          <div className="rf-leaf-icon">{icons[icon] || icons.db}</div>
          <span className="rf-leaf-badge">{badge}</span>
        </div>

        <div className="rf-leaf-content">
          <div className="rf-leaf-name-row">
            <h4 className="rf-leaf-title">{name}</h4>
            <span className="rf-leaf-arrow">↗</span>
          </div>
          <p className="rf-leaf-desc">{desc}</p>
        </div>

        <div className="rf-leaf-footer">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span className="rf-leaf-domain">{domain}</span>
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  coreNode: CoreNodeComponent,
  branchNode: BranchNodeComponent,
  leafNode: LeafNodeComponent,
};

/* ── COMPONENTE PRINCIPAL DEL FLUJO ── */
function FlowContent() {
  const { fitView } = useReactFlow();
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  /* Atajo de teclado '/' para búsqueda */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* Definición de Nodos de React Flow con Geometría Balanceada */
  const initialNodes: Node[] = useMemo(() => [
    /* ── NODO MATRIZ (CENTRO NEURÁLGICO) ── */
    {
      id: 'core',
      type: 'coreNode',
      position: { x: -160, y: -70 },
      data: {},
    },

    /* ── PILAR 1: REFUGIO DATA (OESTE / IZQUIERDA) ── */
    {
      id: 'b-refugio',
      type: 'branchNode',
      position: { x: -530, y: -45 },
      data: {
        title: 'Refugio Data',
        category: 'Analítica Operativa',
        count: 4,
        accent: '#C9A84C',
        targetPos: Position.Right,
        sourcePos: Position.Left,
      },
    },
    /* Hojas Refugio Data */
    {
      id: 'p-proc',
      type: 'leafNode',
      position: { x: -950, y: -260 },
      data: {
        name: 'Refugio Data',
        desc: 'Procesamiento, conciliación y BI de ventas',
        domain: 'datarefugio.gcbprojects.site',
        href: 'https://datarefugio.gcbprojects.site/legacy',
        icon: 'refugio',
        badge: 'CORE BI',
        targetPos: Position.Right,
        branch: 'b-refugio',
      },
    },
    {
      id: 'p-del',
      type: 'leafNode',
      position: { x: -970, y: -90 },
      data: {
        name: 'Módulo Delivery',
        desc: 'Control y seguimiento de pedidos en tiempo real',
        domain: 'datarefugio.gcbprojects.site',
        href: 'https://datarefugio.gcbprojects.site/delivery',
        icon: 'truck',
        badge: 'ENVÍOS',
        targetPos: Position.Right,
        branch: 'b-refugio',
      },
    },
    {
      id: 'p-com',
      type: 'leafNode',
      position: { x: -970, y: 80 },
      data: {
        name: 'Módulo Comercial',
        desc: 'Gestión de reservas, CRM y cotización de eventos',
        domain: 'datarefugio.gcbprojects.site',
        href: 'https://datarefugio.gcbprojects.site/comercial',
        icon: 'chart',
        badge: 'CRM',
        targetPos: Position.Right,
        branch: 'b-refugio',
      },
    },
    {
      id: 'p-docgcb',
      type: 'leafNode',
      position: { x: -950, y: 250 },
      data: {
        name: 'Documentación GCB',
        desc: 'Repositorio oficial de normas y procedimientos',
        domain: 'datarefugio.gcbprojects.site',
        href: 'https://datarefugio.gcbprojects.site/documentos-gcb',
        icon: 'doc',
        badge: 'GESTIÓN',
        targetPos: Position.Right,
        branch: 'b-refugio',
      },
    },

    /* ── PILAR 2: CANALES & DESPACHO (ESTE / DERECHA) ── */
    {
      id: 'b-channels',
      type: 'branchNode',
      position: { x: 310, y: -45 },
      data: {
        title: 'Canales & Despacho',
        category: 'Puntos de Venta',
        count: 3,
        accent: '#3CC9A4',
        targetPos: Position.Left,
        sourcePos: Position.Right,
      },
    },
    /* Hojas Canales & Despacho */
    {
      id: 'p-kiosk',
      type: 'leafNode',
      position: { x: 690, y: -180 },
      data: {
        name: 'Web Kiosko',
        desc: 'Terminal web de autoservicio y punto de venta',
        domain: 'kiosk.datarefugio.gcbprojects.site',
        href: 'https://kiosk.datarefugio.gcbprojects.site/',
        icon: 'screen',
        badge: 'POS WEB',
        targetPos: Position.Left,
        branch: 'b-channels',
      },
    },
    {
      id: 'p-runner',
      type: 'leafNode',
      position: { x: 710, y: 0 },
      data: {
        name: 'App Runner',
        desc: 'Aplicación Android para despacho y última milla',
        domain: 'expo.dev',
        href: 'https://expo.dev/accounts/refugdata/projects/runner/builds/a6e38cfb-6bf2-4353-a639-e92daeac7836',
        icon: 'play',
        badge: 'APK',
        targetPos: Position.Left,
        branch: 'b-channels',
      },
    },
    {
      id: 'p-agenda',
      type: 'leafNode',
      position: { x: 690, y: 180 },
      data: {
        name: 'Agenda Deportiva',
        desc: 'Cartelera de eventos, partidos y transmisiones',
        domain: 'vercel.app',
        href: 'https://softlanding-calendario-deportivo-gc-xi.vercel.app/',
        icon: 'cal',
        badge: 'EVENTOS',
        targetPos: Position.Left,
        branch: 'b-channels',
      },
    },

    /* ── PILAR 3: INTELIGENCIA AI (NORTE / ARRIBA) ── */
    {
      id: 'b-ai',
      type: 'branchNode',
      position: { x: -110, y: -300 },
      data: {
        title: 'Inteligencia de Datos',
        category: 'Analítica Avanzada',
        count: 1,
        accent: '#4A9EFF',
        targetPos: Position.Bottom,
        sourcePos: Position.Top,
      },
    },
    {
      id: 'p-ai',
      type: 'leafNode',
      position: { x: -130, y: -480 },
      data: {
        name: 'Consultas GCB con AI',
        desc: 'Asistente corporativo para consultas operativas en lenguaje natural',
        domain: 'consultas.gcbprojects.site',
        href: 'https://consultas.gcbprojects.site/',
        icon: 'ai',
        badge: 'AI ENGINE',
        targetPos: Position.Bottom,
        branch: 'b-ai',
      },
    },

    /* ── PILAR 4: INFRAESTRUCTURA & FINANZAS (SUR / ABAJO) ── */
    {
      id: 'b-infra',
      type: 'branchNode',
      position: { x: -110, y: 220 },
      data: {
        title: 'Infraestructura & Finanzas',
        category: 'Sistemas Soporte',
        count: 2,
        accent: '#9B6DFF',
        targetPos: Position.Top,
        sourcePos: Position.Bottom,
      },
    },
    {
      id: 'p-est',
      type: 'leafNode',
      position: { x: -280, y: 380 },
      data: {
        name: 'Estacionamiento',
        desc: 'Control de aforo vehicular y facturación en tiempo real',
        domain: 'estacionamiento.gcbprojects.site',
        href: 'https://estacionamiento.gcbprojects.site/',
        icon: 'park',
        badge: 'ACCESOS',
        targetPos: Position.Top,
        branch: 'b-infra',
      },
    },
    {
      id: 'p-conc',
      type: 'leafNode',
      position: { x: 80, y: 380 },
      data: {
        name: 'Conciliación',
        desc: 'Auditoría automática bancaria y liquidación de ventas',
        domain: 'conciliacion.gcbprojects.site',
        href: 'https://conciliacion.gcbprojects.site/',
        icon: 'bal',
        badge: 'FINTECH',
        targetPos: Position.Top,
        branch: 'b-infra',
      },
    },
  ], []);

  /* Conexiones / Aristas con estilo profesional y trazo Bézier */
  const initialEdges: Edge[] = useMemo(() => [
    /* Centro Matriz -> Pilares */
    { id: 'e-core-refugio', source: 'core', sourceHandle: 'left', target: 'b-refugio', targetHandle: 'target', animated: true, style: { stroke: '#C9A84C', strokeWidth: 2 } },
    { id: 'e-core-channels', source: 'core', sourceHandle: 'right', target: 'b-channels', targetHandle: 'target', animated: true, style: { stroke: '#3CC9A4', strokeWidth: 2 } },
    { id: 'e-core-ai', source: 'core', sourceHandle: 'top', target: 'b-ai', targetHandle: 'target', animated: true, style: { stroke: '#4A9EFF', strokeWidth: 2 } },
    { id: 'e-core-infra', source: 'core', sourceHandle: 'bottom', target: 'b-infra', targetHandle: 'target', animated: true, style: { stroke: '#9B6DFF', strokeWidth: 2 } },

    /* Refugio Data -> Hojas */
    { id: 'e-refugio-proc', source: 'b-refugio', sourceHandle: 'source', target: 'p-proc', targetHandle: 'target', style: { stroke: 'var(--border)', strokeWidth: 1.5 } },
    { id: 'e-refugio-del', source: 'b-refugio', sourceHandle: 'source', target: 'p-del', targetHandle: 'target', style: { stroke: 'var(--border)', strokeWidth: 1.5 } },
    { id: 'e-refugio-com', source: 'b-refugio', sourceHandle: 'source', target: 'p-com', targetHandle: 'target', style: { stroke: 'var(--border)', strokeWidth: 1.5 } },
    { id: 'e-refugio-docgcb', source: 'b-refugio', sourceHandle: 'source', target: 'p-docgcb', targetHandle: 'target', style: { stroke: 'var(--border)', strokeWidth: 1.5 } },

    /* Canales -> Hojas */
    { id: 'e-channels-kiosk', source: 'b-channels', sourceHandle: 'source', target: 'p-kiosk', targetHandle: 'target', style: { stroke: 'var(--border)', strokeWidth: 1.5 } },
    { id: 'e-channels-runner', source: 'b-channels', sourceHandle: 'source', target: 'p-runner', targetHandle: 'target', style: { stroke: 'var(--border)', strokeWidth: 1.5 } },
    { id: 'e-channels-agenda', source: 'b-channels', sourceHandle: 'source', target: 'p-agenda', targetHandle: 'target', style: { stroke: 'var(--border)', strokeWidth: 1.5 } },

    /* AI -> Hoja */
    { id: 'e-ai-proc', source: 'b-ai', sourceHandle: 'source', target: 'p-ai', targetHandle: 'target', style: { stroke: 'var(--border)', strokeWidth: 1.5 } },

    /* Infraestructura -> Hojas */
    { id: 'e-infra-est', source: 'b-infra', sourceHandle: 'source', target: 'p-est', targetHandle: 'target', style: { stroke: 'var(--border)', strokeWidth: 1.5 } },
    { id: 'e-infra-conc', source: 'b-infra', sourceHandle: 'source', target: 'p-conc', targetHandle: 'target', style: { stroke: 'var(--border)', strokeWidth: 1.5 } },
  ], []);

  /* Filtrado reactivo y resaltado interactivo por hover */
  const { filteredNodes, filteredEdges, visibleCount } = useMemo(() => {
    const q = search.trim().toLowerCase();
    let count = 0;

    const nodes = initialNodes.map(node => {
      let isVisible = true;

      if (node.type === 'leafNode') {
        const d = node.data as { name: string; desc: string; domain: string; branch: string; badge: string };
        const matchBranch = selectedBranch === 'all' || d.branch === selectedBranch;
        const matchSearch = !q || d.name.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q) || d.domain.toLowerCase().includes(q) || d.badge.toLowerCase().includes(q);
        isVisible = matchBranch && matchSearch;
        if (isVisible) count++;
      } else if (node.type === 'branchNode') {
        isVisible = selectedBranch === 'all' || node.id === selectedBranch;
      }

      return {
        ...node,
        style: {
          ...node.style,
          opacity: isVisible ? 1 : 0.15,
          pointerEvents: isVisible ? ('all' as const) : ('none' as const),
          transition: 'opacity 0.2s ease',
        },
      };
    });

    const edges = initialEdges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      const isVisible = (sourceNode?.style?.opacity ?? 1) > 0.5 && (targetNode?.style?.opacity ?? 1) > 0.5;

      // Resaltado dinámico si el nodo está en hover
      let isHighlighted = false;
      if (hoveredNodeId) {
        if (hoveredNodeId === 'core') {
          isHighlighted = edge.source === 'core';
        } else if (hoveredNodeId.startsWith('b-')) {
          isHighlighted = edge.target === hoveredNodeId || edge.source === hoveredNodeId;
        } else if (hoveredNodeId.startsWith('p-')) {
          if (edge.target === hoveredNodeId) {
            isHighlighted = true;
          } else {
            const leaf = initialNodes.find(n => n.id === hoveredNodeId);
            const branchId = (leaf?.data as { branch?: string })?.branch;
            if (branchId && edge.source === 'core' && edge.target === branchId) {
              isHighlighted = true;
            }
          }
        }
      }

      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: isHighlighted ? '#C9A84C' : edge.style?.stroke,
          strokeWidth: isHighlighted ? 2.8 : edge.style?.strokeWidth,
          opacity: isVisible ? 1 : 0.06,
          transition: 'stroke 0.2s ease, stroke-width 0.2s ease, opacity 0.2s ease',
        },
      };
    });

    return { filteredNodes: nodes, filteredEdges: edges, visibleCount: count };
  }, [initialNodes, initialEdges, search, selectedBranch, hoveredNodeId]);

  const handleReset = useCallback(() => {
    setSearch('');
    setSelectedBranch('all');
    fitView({ padding: 0.22, duration: 450 });
  }, [fitView]);

  return (
    <div className="rf-container">
      {/* ── Barra de Control Superior ── */}
      <div className="rf-toolbar">
        {/* Buscador integrado con atajo '/' */}
        <div className="rf-search-bar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="rf-search-icon">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            className="rf-search-input"
            placeholder="Filtrar sistemas o presiona '/'..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search ? (
            <button className="rf-clear-btn" onClick={() => setSearch('')} aria-label="Limpiar">✕</button>
          ) : (
            <kbd className="rf-kbd">/</kbd>
          )}
        </div>

        {/* Filtro por ramas / pilares */}
        <div className="rf-pills">
          <button className={`rf-pill ${selectedBranch === 'all' ? 'active' : ''}`} onClick={() => setSelectedBranch('all')}>
            Todas ({visibleCount})
          </button>
          <button className={`rf-pill ${selectedBranch === 'b-refugio' ? 'active' : ''}`} onClick={() => setSelectedBranch('b-refugio')}>
            Refugio Data
          </button>
          <button className={`rf-pill ${selectedBranch === 'b-channels' ? 'active' : ''}`} onClick={() => setSelectedBranch('b-channels')}>
            Canales & POS
          </button>
          <button className={`rf-pill ${selectedBranch === 'b-ai' ? 'active' : ''}`} onClick={() => setSelectedBranch('b-ai')}>
            Inteligencia AI
          </button>
          <button className={`rf-pill ${selectedBranch === 'b-infra' ? 'active' : ''}`} onClick={() => setSelectedBranch('b-infra')}>
            Infraestructura
          </button>
        </div>

        {/* Acciones del diagrama */}
        <div className="rf-toolbar-right">
          <span className="rf-status-pill">
            <span className="rf-dot-live"></span>
            <span>{visibleCount} / 10 Conectados</span>
          </span>
          <button className="rf-fit-btn" onClick={handleReset} title="Restablecer y centrar diagrama">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            <span>Centrar</span>
          </button>
        </div>
      </div>

      {/* ── Lienzo Interactivo React Flow ── */}
      <div className="rf-canvas-wrapper">
        <ReactFlow
          nodes={filteredNodes}
          edges={filteredEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.22 }}
          minZoom={0.35}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
          onNodeMouseLeave={() => setHoveredNodeId(null)}
        >
          <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="var(--border)" className="opacity-45" />
          <Controls showInteractive={false} position="bottom-right" className="rf-controls-box" />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function SemanticFlow() {
  return (
    <ReactFlowProvider>
      <FlowContent />
    </ReactFlowProvider>
  );
}
