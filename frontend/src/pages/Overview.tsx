// MeetMux Control Tower — Overview / Control Tower Page v2.0
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Package, AlertTriangle, Route, ShieldAlert, Activity,
  Clock, DollarSign, Target, TrendingUp, Rocket, Brain,
  Globe2, Truck, Database
} from 'lucide-react';
import { fetchDashboard, fetchBottlenecks } from '../services/api';
import {
  KPICard, KPICardSkeleton, ErrorState, DemoBadge, GlassCard,
  SectionHeader, RiskBadge, BottleneckBar, StaggerList, StatusChip
} from '../components/ui/SharedComponents';
import { pageVariants, staggerContainer, fadeUpItem } from '../motion/variants';
import { formatINR, formatNum } from '../utils';
import DemoLoader from '../components/DemoLoader';
import DigitalTwinGlobe from '../components/3d/DigitalTwinGlobe';
import TiltCard from '../components/3d/TiltCard';
import { MovingCorridorTicker, AnimatedFreightHighway } from '../components/3d/MovingLogisticsElements';

export default function OverviewPage() {
  const [showDemoLoader, setShowDemoLoader] = useState(false);
  const [visualMode, setVisualMode] = useState<'3D_GLOBE' | 'HIGHWAY_SIM'>('3D_GLOBE');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: fetchDashboard,
    refetchInterval: 30_000,
  });

  const { data: bottlenecksData } = useQuery({
    queryKey: ['bottlenecks'],
    queryFn: fetchBottlenecks,
    refetchInterval: 60_000,
  });

  const kpis = (data as any)?.kpis;
  const graphStatus = (data as any)?.graph_engine_status;

  const KPI_DEFS = kpis ? [
    { title: 'Total Shipments', value: kpis.total_shipments, icon: <Package className="w-5 h-5" />, accentColor: '#D6588A', delta: 5 },
    { title: 'At-Risk Shipments', value: kpis.at_risk_shipments, icon: <AlertTriangle className="w-5 h-5" />, accentColor: '#EA580C', critical: kpis.at_risk_shipments > 50, delta: 12 },
    { title: 'High-Risk Routes', value: kpis.high_risk_routes, icon: <Route className="w-5 h-5" />, accentColor: '#D97706', delta: 8 },
    { title: 'Critical Bottlenecks', value: kpis.critical_bottlenecks, icon: <ShieldAlert className="w-5 h-5" />, accentColor: '#DC2626', critical: kpis.critical_bottlenecks > 3, delta: 25 },
    { title: 'Network Risk Score', value: kpis.network_risk_score, icon: <Activity className="w-5 h-5" />, accentColor: '#D6588A', delta: 4 },
    { title: 'Est. Delay Hours', value: parseFloat(kpis.estimated_delay_hours.toFixed(1)), icon: <Clock className="w-5 h-5" />, accentColor: '#7C3AED', delta: -8 },
    { title: 'Estimated Delay Cost', value: Math.round(kpis.estimated_cost_of_delay_inr), icon: <DollarSign className="w-5 h-5" />, accentColor: '#DC2626', formatFn: (v: number) => formatINR(v, true), delta: 15 },
    { title: 'Predicted SLA Breaches', value: kpis.predicted_sla_breaches, icon: <Target className="w-5 h-5" />, accentColor: '#DC2626', critical: kpis.predicted_sla_breaches > 5, delta: 20 },
    { title: 'Savings if Recs Applied', value: Math.round(kpis.estimated_savings_inr), icon: <TrendingUp className="w-5 h-5" />, accentColor: '#2E7D32', formatFn: (v: number) => formatINR(v, true), delta: -18 },
  ] : [];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-6 pb-12 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-black text-rose-900 tracking-tight">MeetMux Control Tower</h1>
          <p className="text-xs text-rose-600/70 mt-0.5">Predictive Geospatial Intelligence — India Telemetry to Autonomous Decision</p>
        </div>
        <div className="flex items-center gap-3">
          <DemoBadge />
          <button
            onClick={() => setShowDemoLoader(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white text-xs font-semibold shadow-pink-glass hover:shadow-pink-glass-lg transition-all"
          >
            <Rocket className="w-4 h-4" />
            Load Demo Network
          </button>
        </div>
      </div>

      {/* Moving Telemetry Corridor Ticker */}
      <MovingCorridorTicker />

      {/* Graph Engine Status Banner */}
      {graphStatus && graphStatus.neo4j_connected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-5"
          style={{
            background: 'rgba(0,184,217,0.08)',
            border: '1px solid rgba(0,184,217,0.25)',
            color: '#22D3EE'
          }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" style={{ boxShadow: '0 0 8px #2DD4BF' }} />
          <Database className="w-4 h-4 shrink-0" style={{ color: '#2DD4BF' }} />
          <span className="text-xs">
            <strong style={{ color: '#2DD4BF' }}>Neo4j Graph Database Connected</strong>
            <span style={{ color: '#78909C' }}> — {graphStatus.engine || 'Neo4j Cypher Graph Engine (Active)'} &nbsp;·&nbsp; {graphStatus.nodes_count ?? 0} nodes &nbsp;·&nbsp; {graphStatus.edges_count ?? 0} corridors &nbsp;</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'rgba(45,212,191,0.15)', color: '#2DD4BF' }}>CYPHER OK</span>
          </span>
        </motion.div>
      )}
      {graphStatus && !graphStatus.neo4j_connected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs mb-5"
        >
          <Brain className="w-4 h-4 shrink-0" />
          <span><strong>Graph Engine active</strong> — Neo4j Cypher Bridge initializing. Full analytics enabled.</span>
        </motion.div>
      )}

      {/* KPI Grid with 3D Tilt Cards */}
      {isError ? (
        <ErrorState message="Failed to load dashboard. Ensure the backend is running on port 8000." />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-9 gap-3 mb-6"
        >
          {isLoading
            ? Array.from({ length: 9 }).map((_, i) => <KPICardSkeleton key={i} />)
            : KPI_DEFS.map((kpi) => (
                <motion.div key={kpi.title} variants={fadeUpItem}>
                  <TiltCard maxTilt={8} scale={1.03}>
                    <KPICard {...kpi} />
                  </TiltCard>
                </motion.div>
              ))
          }
        </motion.div>
      )}

      {/* 3D Digital Twin Visualizer Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-rose-600" />
            <h2 className="text-xs font-bold text-rose-900 uppercase tracking-wide">3D Real-Time Geospatial Visualizer</h2>
          </div>
          <div className="flex items-center gap-1 glass p-1 rounded-xl text-[10px] font-semibold">
            <button
              onClick={() => setVisualMode('3D_GLOBE')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                visualMode === '3D_GLOBE' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <Globe2 className="w-3 h-3" /> 3D Digital Twin Globe
            </button>
            <button
              onClick={() => setVisualMode('HIGHWAY_SIM')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                visualMode === 'HIGHWAY_SIM' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <Truck className="w-3 h-3" /> Highway Corridor Simulation
            </button>
          </div>
        </div>

        {visualMode === '3D_GLOBE' ? (
          <DigitalTwinGlobe height={460} />
        ) : (
          <AnimatedFreightHighway />
        )}
      </div>

      {/* Bottom Section: Bottlenecks + Storyline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top Bottlenecks */}
        <div className="lg:col-span-2">
          <GlassCard title="Critical Bottleneck Hubs" actions={<span className="text-xs text-rose-600/60 font-mono">Top 5 by risk centrality</span>}>
            {bottlenecksData ? (
              <StaggerList className="space-y-3">
                {bottlenecksData.bottlenecks.slice(0, 5).map((b: any) => (
                  <motion.div
                    key={b.node_id}
                    variants={fadeUpItem}
                    className="p-3.5 rounded-xl bg-white/40 border border-white/60 flex items-center gap-3 hover:bg-white/60 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-rose-900 truncate">{b.node_name}</span>
                        <StatusChip status={b.operating_status} />
                      </div>
                      <BottleneckBar score={b.bottleneck_score} />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-rose-600/70 font-mono">{formatNum(b.affected_shipments_count)} shipments</p>
                      <p className="text-xs font-bold text-red-600 font-mono">{formatINR(b.estimated_inr_exposure, true)} at risk</p>
                    </div>
                  </motion.div>
                ))}
              </StaggerList>
            ) : (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 shimmer rounded-xl" />
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Storyline Spotlight with 3D Tilt */}
        <TiltCard maxTilt={10}>
          <GlassCard className="border-rose-300/50 h-full">
            <SectionHeader title="Live Storyline" subtitle="SHP-1024 Critical Incident" />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3 text-xs"
            >
              <div className="flex items-start gap-2.5 p-3 bg-red-50/70 border border-red-200/60 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0 animate-bounce" />
                <div>
                  <p className="font-bold text-red-800">SHP-1024 — Pharma ₹45L Cold Batch</p>
                  <p className="text-[11px] text-red-700/80 mt-0.5">81% delay risk · Bhiwandi Hub at 94% capacity · Cold chain thermal excursion imminent</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 bg-orange-50/70 border border-orange-200/60 rounded-xl">
                <ShieldAlert className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-orange-800">Bhiwandi Central Mega Hub (H04)</p>
                  <p className="text-[11px] text-orange-700/80 mt-0.5">Bottleneck Score: 88 · 23 Critical SLA shipments blocked</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl">
                <Activity className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-amber-800">NH-48 Western Freight Corridor</p>
                  <p className="text-[11px] text-amber-700/80 mt-0.5">Velocity: 18 km/h (baseline 55 km/h) · +4.1h predicted delay</p>
                </div>
              </div>

              <div className="text-[10px] text-rose-500/70 text-center pt-2 font-mono">
                Persistent Demo Mode Active · Real-time simulation stream
              </div>
            </motion.div>
          </GlassCard>
        </TiltCard>
      </div>

      {/* Demo Loader Modal */}
      <AnimatePresence>
        {showDemoLoader && (
          <DemoLoader onClose={() => { setShowDemoLoader(false); refetch(); }} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
