// MeetMux Control Tower — Live Network Map Page
// Real-time network visualization with canvas fallback when Mapbox token unavailable
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Layers, X, MapPin, AlertTriangle, Package, Activity, ChevronRight, Globe, Zap } from 'lucide-react';
import { fetchNetwork, fetchNodeById, fetchBottlenecks } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { drawerVariants, pageVariants, fadeUpItem } from '../motion/variants';
import { RiskBadge, StatusChip, BottleneckBar, DemoBadge, Skeleton } from '../components/ui/SharedComponents';
import { formatINR, cn } from '../utils';
import type { Node, Route } from '../types';

const MAPBOX_TOKEN = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_MAPBOX_TOKEN || '';

const NODE_COLORS: Record<string, string> = {
  Port: '#14B8A6',           // Secondary teal
  Warehouse: '#22D3EE',      // Bright cyan
  DistributionCenter: '#00B8D9', // Primary blue
  Supplier: '#2DD4BF',       // Success teal
  Customer: '#78909C',       // Muted slate
};

// ─── Canvas Network Visualization (Dark Navy + Cyan/Teal) ──────────────────────
function CanvasNetworkViz({
  nodes,
  routes,
  bottleneckMap,
  selectedNodeId,
  onSelectNode,
}: {
  nodes: Node[];
  routes: Route[];
  bottleneckMap: Map<string, any>;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodePositions = useRef<Map<string, { x: number; y: number; node: Node }>>(new Map());
  const [hovered, setHovered] = useState<string | null>(null);

  // Convert lat/lng to canvas x/y
  const toCanvas = useCallback((lat: number, lng: number, W: number, H: number) => {
    // India bounds: lat 8-37, lng 68-98
    const x = ((lng - 68) / (98 - 68)) * (W - 80) + 40;
    const y = ((37 - lat) / (37 - 8)) * (H - 80) + 40;
    return { x, y };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !nodes.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const packetStates = new Map<string, number>();
    routes.forEach(r => packetStates.set(r.id, Math.random()));

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      frame++;

      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Subtle Dark Navy Grid
      ctx.save();
      ctx.strokeStyle = 'rgba(27, 52, 72, 0.45)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      }
      for (let gy = 0; gy < H; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }
      ctx.restore();

      // Build node positions
      const posMap = new Map<string, { x: number; y: number; node: Node }>();
      nodes.forEach(node => {
        if (node.latitude && node.longitude) {
          const pos = toCanvas(node.latitude, node.longitude, W, H);
          posMap.set(node.id, { ...pos, node });
        }
      });
      nodePositions.current = posMap;

      // Draw routes: Normal (muted blue/teal), Selected (bright cyan), AI-predicted (teal)
      routes.forEach(route => {
        const from = posMap.get(route.origin_id);
        const to = posMap.get(route.destination_id);
        if (!from || !to) return;

        const isSelected = selectedNodeId && (route.origin_id === selectedNodeId || route.destination_id === selectedNodeId);
        const isDisrupted = (route.risk_score ?? 0) >= 75;
        const isPredicted = route.status === 'PREDICTED' || (route.risk_score ?? 0) < 35;

        // Color coding based on user specification
        let strokeColor = 'rgba(20, 184, 166, 0.35)'; // Normal network -> muted blue/teal
        let lineWidth = 1.0;

        if (isSelected) {
          strokeColor = '#22D3EE'; // Selected route -> bright cyan #22D3EE
          lineWidth = 2.4;
        } else if (isDisrupted) {
          strokeColor = 'rgba(255, 77, 90, 0.7)'; // Disrupted route -> red with subtle glow
          lineWidth = 1.8;
        } else if (isPredicted) {
          strokeColor = 'rgba(20, 184, 166, 0.65)'; // AI-predicted route -> teal #14B8A6
          lineWidth = 1.4;
        }

        // Quadratic Bezier curve
        const cx = (from.x + to.x) / 2 + (to.y - from.y) * 0.18;
        const cy = (from.y + to.y) / 2 - (to.x - from.x) * 0.18;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(cx, cy, to.x, to.y);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        if (isSelected) {
          ctx.shadowColor = '#22D3EE';
          ctx.shadowBlur = 10;
        }
        ctx.stroke();

        // Supply-chain flow: animated bright cyan particles moving along routes
        const prog = ((packetStates.get(route.id) ?? 0) + frame * 0.0035) % 1;
        packetStates.set(route.id, prog);

        const t = prog;
        const px = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * cx + t * t * to.x;
        const py = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * cy + t * t * to.y;

        ctx.beginPath();
        ctx.arc(px, py, isSelected ? 3.0 : 2.0, 0, Math.PI * 2);
        // Supply-chain flow -> animated cyan particles
        ctx.fillStyle = '#22D3EE';
        ctx.shadowColor = '#22D3EE';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      });

      // Draw nodes: Risk (yellow/orange #FBBF24), Disrupted (red #FF4D5A with subtle glow), Normal (teal/cyan)
      nodes.forEach(node => {
        const pos = posMap.get(node.id);
        if (!pos) return;

        const bot = bottleneckMap.get(node.id);
        const score = bot?.bottleneck_score ?? node.risk_score ?? 0;
        const isDisrupted = score >= 75 || node.operating_status === 'DISRUPTED';
        const isRisk = !isDisrupted && (score >= 45 || (node.risk_score ?? 0) >= 50);

        let nodeColor = NODE_COLORS[node.type] ?? '#14B8A6';
        if (isDisrupted) nodeColor = '#FF4D5A';      // Disrupted node -> red #FF4D5A
        else if (isRisk) nodeColor = '#FBBF24';     // Risk node -> yellow/orange #FBBF24

        const isSelected = node.id === selectedNodeId;
        const isHovered = node.id === hovered;
        const radius = node.type === 'Port' ? 7.5 : node.type === 'Warehouse' ? 6.5 : 5;

        // Disrupted node -> red with a subtle glow & pulsing ring
        if (isDisrupted) {
          const pulseR = radius + ((frame * 1.2) % 18);
          const pulseAlpha = Math.max(0, 1 - (pulseR - radius) / 18);
          ctx.save();
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, pulseR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 77, 90, ${pulseAlpha * 0.7})`;
          ctx.lineWidth = 1.5;
          ctx.shadowColor = '#FF4D5A';
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.restore();
        }

        // Risk node -> amber pulse ring
        if (isRisk) {
          const pulseR = radius + ((frame * 1.0) % 14);
          const pulseAlpha = Math.max(0, 1 - (pulseR - radius) / 14);
          ctx.save();
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, pulseR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(251, 191, 36, ${pulseAlpha * 0.5})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        }

        // Selected ring -> bright cyan #22D3EE
        if (isSelected) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radius + 5, 0, Math.PI * 2);
          ctx.strokeStyle = '#22D3EE';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#22D3EE';
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.restore();
        }

        // Node body
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, isHovered ? radius + 2 : radius, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.shadowColor = nodeColor;
        ctx.shadowBlur = isDisrupted ? 14 : isHovered ? 12 : 6;
        ctx.fill();
        ctx.strokeStyle = '#07111F';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // Node label for hubs
        if (node.type !== 'Customer' || isHovered || isSelected) {
          ctx.save();
          ctx.font = `${isSelected || isHovered ? 'bold ' : ''}10px monospace`;
          ctx.fillStyle = '#E6F1F5';
          ctx.shadowColor = '#07111F';
          ctx.shadowBlur = 6;
          const label = node.name.length > 20 ? node.name.slice(0, 18) + '…' : node.name;
          ctx.fillText(label, pos.x + radius + 4, pos.y + 3.5);
          ctx.restore();
        }
      });
    };

    draw();

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let found: string | null = null;
      nodePositions.current.forEach((pos, id) => {
        const dist = Math.hypot(mx - pos.x, my - pos.y);
        if (dist < 14) found = id;
      });
      setHovered(found);
      canvas.style.cursor = found ? 'pointer' : 'default';
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let found: string | null = null;
      nodePositions.current.forEach((pos, id) => {
        const dist = Math.hypot(mx - pos.x, my - pos.y);
        if (dist < 14) found = id;
      });
      onSelectNode(found);
    };

    const onResize = () => {
      canvas.width = canvas.parentElement?.clientWidth ?? window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight ?? window.innerHeight;
    };
    onResize();
    window.addEventListener('resize', onResize);

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onClick);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
    };
  }, [nodes, routes, bottleneckMap, selectedNodeId, hovered, toCanvas]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: 'transparent' }}
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NetworkMapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown | null>(null);
  const markersRef = useRef<unknown[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [layerFilters, setLayerFilters] = useState({ warehouses: true, ports: true, customers: true, routes: true, suppliers: true });
  const [showLayers, setShowLayers] = useState(false);
  const [viewMode, setViewMode] = useState<'mapbox' | 'canvas'>(!MAPBOX_TOKEN || MAPBOX_TOKEN.includes('your-token-here') ? 'canvas' : 'mapbox');

  const { selectedNodeId, setSelectedNode, telemetryEvents } = useAppStore();

  const { data: network, isLoading: netLoading } = useQuery({ queryKey: ['network'], queryFn: () => fetchNetwork(), refetchInterval: 60_000 });
  const { data: bottlenecks } = useQuery({ queryKey: ['bottlenecks'], queryFn: fetchBottlenecks });
  const { data: selectedNode, isLoading: nodeLoading } = useQuery({
    queryKey: ['node', selectedNodeId],
    queryFn: () => fetchNodeById(selectedNodeId!),
    enabled: !!selectedNodeId,
  });

  const bottleneckMap: Map<string, any> = new Map(bottlenecks?.bottlenecks?.map((b: any) => [b.node_id as string, b]) ?? []);

  // Initialize Mapbox map (only if token is available and mode is mapbox)
  useEffect(() => {
    if (viewMode !== 'mapbox') return;
    if (!mapContainerRef.current) return;
    if (!MAPBOX_TOKEN || MAPBOX_TOKEN.includes('your-token-here')) {
      setMapError('No Mapbox token');
      setViewMode('canvas');
      return;
    }

    import('mapbox-gl').then(mb => {
      const mapboxgl = (mb.default || mb) as unknown as {
        accessToken: string;
        Map: new (opts: Record<string, unknown>) => {
          on: (event: string, cb: () => void) => void;
          flyTo: (opts: Record<string, unknown>) => void;
          remove?: () => void;
        };
      };
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [78.9629, 20.5937],
        zoom: 4.5,
        pitch: 20,
        antialias: true,
      });

      mapRef.current = map;
      map.on('load', () => setMapReady(true));
    }).catch(() => {
      setMapError('Failed to load Mapbox GL JS.');
      setViewMode('canvas');
    });

    return () => {
      (mapRef.current as { remove?: () => void })?.remove?.();
      mapRef.current = null;
    };
  }, [viewMode]);

  // Add node markers when map & data are ready (Mapbox mode)
  useEffect(() => {
    if (viewMode !== 'mapbox' || !mapReady || !network || !mapRef.current) return;

    import('mapbox-gl').then(mb => {
      const mapboxgl = (mb.default || mb) as any;
      const map = mapRef.current as any;

      (markersRef.current as Array<{ remove?: () => void }>).forEach(m => m?.remove?.());
      markersRef.current = [];

      network.nodes.forEach((node: Node) => {
        const typeKey = node.type.toLowerCase() + 's';
        if (!layerFilters[typeKey as keyof typeof layerFilters] && !layerFilters[node.type.toLowerCase() as keyof typeof layerFilters]) return;

        const bot = bottleneckMap.get(node.id) as any;
        const score = bot?.bottleneck_score ?? node.risk_score ?? 0;
        const isDisrupted = score >= 75 || node.operating_status === 'DISRUPTED';
        const isRisk = !isDisrupted && (score >= 45 || (node.risk_score ?? 0) >= 50);

        let markerColor = NODE_COLORS[node.type] ?? '#14B8A6';
        if (isDisrupted) markerColor = '#FF4D5A';  // Disrupted node -> red with subtle glow
        else if (isRisk) markerColor = '#FBBF24'; // Risk node -> yellow/orange

        const el = document.createElement('div');
        el.className = 'mapbox-marker';
        el.style.cssText = `
          width: ${isDisrupted ? 18 : isRisk ? 15 : 12}px;
          height: ${isDisrupted ? 18 : isRisk ? 15 : 12}px;
          background: ${markerColor};
          border: 2px solid #07111F;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 ${isDisrupted ? 14 : 8}px ${markerColor}99;
          ${isDisrupted ? `animation: pulse-ring 2s ease-in-out infinite;` : ''}
        `;

        el.addEventListener('click', () => {
          setSelectedNode(node.id);
          (map as any).flyTo({ center: [node.longitude, node.latitude], zoom: 10, duration: 800 });
        });

        const marker = new mapboxgl.Marker(el)
          .setLngLat([node.longitude, node.latitude])
          .addTo(map);
        markersRef.current.push(marker);
      });
    });
  }, [mapReady, network, layerFilters, bottleneckMap, setSelectedNode, viewMode]);

  const nodes: Node[] = network?.nodes ?? [];
  const routes: Route[] = network?.routes ?? [];
  const filteredNodes = nodes.filter(n => {
    const key = n.type.toLowerCase() + 's';
    return layerFilters[key as keyof typeof layerFilters] !== false;
  });

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative h-[calc(100vh-58px)] overflow-hidden"
    >
      {/* View Mode Toggle */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-black/40 backdrop-blur-md rounded-xl p-1 border border-white/10">
        <button
          onClick={() => setViewMode('canvas')}
          className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            viewMode === 'canvas' ? 'bg-rose-500/30 text-rose-200' : 'text-white/50 hover:text-white')}
        >
          <Zap className="w-3.5 h-3.5" />
          Live Canvas
        </button>
        <button
          onClick={() => setViewMode('mapbox')}
          className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            viewMode === 'mapbox' ? 'bg-rose-500/30 text-rose-200' : 'text-white/50 hover:text-white')}
          title={!MAPBOX_TOKEN ? 'Requires VITE_MAPBOX_TOKEN in .env' : undefined}
        >
          <Globe className="w-3.5 h-3.5" />
          Mapbox
          {!MAPBOX_TOKEN && <span className="text-[9px] text-amber-400 ml-1">no token</span>}
        </button>
      </div>

      {/* Canvas Network Visualization (always rendered for canvas mode) */}
      {viewMode === 'canvas' && (
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, #0D1B2A 0%, #07111F 100%)' }}>
          {netLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-cyan-400 font-mono text-sm animate-pulse">Loading network topology…</div>
            </div>
          ) : (
            <CanvasNetworkViz
              nodes={filteredNodes}
              routes={routes}
              bottleneckMap={bottleneckMap}
              selectedNodeId={selectedNodeId}
              onSelectNode={(id) => setSelectedNode(id)}
            />
          )}

          {/* Canvas HUD Header */}
          <div className="absolute top-4 left-4 flex items-center gap-2.5 bg-navy-card/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-navy-border pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-cyan-bright animate-ping" />
            <span className="text-apptext-main text-xs font-bold uppercase tracking-widest">Live Network Map</span>
            <span className="text-apptext-muted text-[10px] font-mono">· India Logistics Mesh</span>
          </div>
        </div>
      )}

      {/* Mapbox Map Container */}
      {viewMode === 'mapbox' && (
        <div ref={mapContainerRef} className="absolute inset-0" />
      )}

      {/* Map Unavailable State (Mapbox mode, no token) */}
      {viewMode === 'mapbox' && mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
          <div className="glass-panel max-w-md text-center">
            <MapPin className="w-12 h-12 text-rose-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-rose-200 mb-2">Mapbox Unavailable</h3>
            <p className="text-sm text-rose-400/80 leading-relaxed">Add <code className="bg-rose-900/40 px-1 rounded">VITE_MAPBOX_TOKEN=pk.ey...</code> to <code className="bg-rose-900/40 px-1 rounded">frontend/.env</code> and restart.</p>
            <button onClick={() => setViewMode('canvas')} className="mt-4 px-4 py-2 bg-rose-600/30 border border-rose-500/40 rounded-xl text-rose-200 text-sm hover:bg-rose-600/50 transition-colors">
              Switch to Live Canvas View
            </button>
          </div>
        </div>
      )}

      {/* Top-left: Layer Controls */}
      <div className="absolute top-4 left-36 z-10">
        <button
          onClick={() => setShowLayers(!showLayers)}
          className="flex items-center gap-2 px-3 py-2 glass rounded-xl text-sm font-medium text-rose-200 shadow-pink-glass"
          aria-expanded={showLayers}
        >
          <Layers className="w-4 h-4" />
          Layers
        </button>

        <AnimatePresence>
          {showLayers && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-2 glass rounded-xl p-3 w-44 space-y-2"
            >
              {Object.entries(layerFilters).map(([key, val]) => (
                <label key={key} className="flex items-center gap-2 text-xs text-rose-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={e => setLayerFilters(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="accent-rose-500 rounded"
                  />
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Stats Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="glass rounded-xl px-4 py-2 flex items-center gap-4 text-xs text-rose-200 overflow-x-auto">
          <DemoBadge />
          <span>{nodes.length} nodes</span>
          <span>{routes.length} routes</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Engine: Neo4j Graph
          </span>
          <span className="ml-auto text-rose-400/50">Click a node to inspect</span>
        </div>
      </div>

      {/* Right Drawer: Node Detail */}
      <AnimatePresence>
        {selectedNodeId && (
          <motion.div
            variants={drawerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute top-0 right-0 h-full w-80 glass border-l border-white/10 z-20 overflow-y-auto"
            role="complementary"
            aria-label="Node detail panel"
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-rose-200">Node Detail</h3>
                <button onClick={() => setSelectedNode(null)} className="p-1 rounded-lg hover:bg-rose-900/30 text-rose-400" aria-label="Close panel">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {nodeLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : selectedNode ? (
                <NodeDetailPanel node={selectedNode} />
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-16 right-4 z-10 glass rounded-xl p-3 text-xs text-rose-200 space-y-1.5">
        <p className="font-semibold mb-1 text-rose-300">Node Types</p>
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border border-white/40" style={{ background: color }} />
            {type}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function NodeDetailPanel({ node }: { node: Node & { connected_routes?: Route[]; active_shipments?: unknown[] } }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div>
        <h4 className="font-bold text-rose-100 text-base leading-tight">{node.name}</h4>
        <p className="text-xs text-rose-400/70 mt-0.5">{node.city}, {node.state}</p>
        <div className="flex items-center gap-2 mt-2">
          <StatusChip status={node.operating_status} />
          <span className="text-xs text-rose-400/70">{node.type}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Utilization', value: `${(node.utilization * 100).toFixed(0)}%` },
          { label: 'Risk Score', value: node.risk_score },
          { label: 'Capacity', value: node.capacity.toLocaleString() },
          { label: 'Current Load', value: node.current_load.toLocaleString() },
          { label: 'Cost/hr delay', value: formatINR(node.cost_per_hour_delay, true) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white/5 rounded-xl p-2.5">
            <p className="text-[10px] text-rose-400/60 uppercase tracking-wide">{label}</p>
            <p className="text-sm font-bold text-rose-100 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Utilization Bar */}
      <div>
        <p className="text-xs font-medium text-rose-300 mb-1.5">Hub Utilization</p>
        <div className="h-3 bg-rose-900/40 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: node.utilization >= 0.85 ? '#DC2626' : node.utilization >= 0.70 ? '#EA580C' : '#D6588A' }}
            initial={{ width: 0 }}
            animate={{ width: `${node.utilization * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-rose-400/60 mt-0.5">
          <span>0%</span>
          <span>{(node.utilization * 100).toFixed(0)}%</span>
          <span>100%</span>
        </div>
      </div>

      {node.active_shipments && (
        <div>
          <p className="text-xs font-medium text-rose-300 mb-1.5">Active Shipments ({node.active_shipments.length})</p>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {node.active_shipments.slice(0, 5).map((s: unknown) => {
              const shp = s as { id: string; status: string; priority: string };
              return (
                <div key={shp.id} className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-2.5 py-1.5">
                  <span className="font-mono text-rose-300">{shp.id}</span>
                  <StatusChip status={shp.status} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
