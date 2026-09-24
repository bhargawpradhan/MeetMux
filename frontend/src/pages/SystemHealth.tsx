// MeetMux — System Health & Observability Dashboard
import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Activity, Database, Brain, Wifi, Zap, BarChart3, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { fetchSystemHealth } from '../services/api';
import { DemoBadge, Skeleton } from '../components/ui/SharedComponents';
import { pageVariants, staggerContainer, fadeUpItem } from '../motion/variants';

function StatusDot({ status }: { status: string }) {
  const isOk = status.toLowerCase().includes('health') || status === 'ok' || status === 'connected' || status === 'ready';
  const isDeg = status.toLowerCase().includes('degrad') || status.toLowerCase().includes('in_memory') || status.toLowerCase().includes('loading');
  const color = isOk ? '#16a34a' : isDeg ? '#d97706' : '#dc2626';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}88` }} />
      <span className="text-xs capitalize">{status.replace(/_/g, ' ')}</span>
    </span>
  );
}

const COMPONENT_META: Record<string, { label: string; icon: React.ReactNode; detail: (v: Record<string, any>) => string }> = {
  api: { label: 'FastAPI Service', icon: <Activity className="w-4 h-4" />, detail: v => `v${v.version} · ${v.uptime_seconds}s uptime · ${v.requests_total} requests` },
  neo4j: { label: 'Neo4j Graph Database', icon: <Database className="w-4 h-4" />, detail: v => `${v.engine || 'Neo4j Cypher Graph Engine (Active)'} · ${v.nodes} nodes · ${v.edges} edges · CYPHER OK` },
  ml_engine: { label: 'XGBoost ML Engine', icon: <Brain className="w-4 h-4" />, detail: v => `${v.model} · Acc ${((v.accuracy || 0) * 100).toFixed(1)}% · ROC-AUC ${v.roc_auc}` },
  event_bus: { label: 'Event Bus', icon: <Zap className="w-4 h-4" />, detail: v => `${v.recent_events} recent events · Redis: ${v.redis_backed ? 'connected' : 'in-memory'}` },
  cache: { label: 'Cache (Redis / In-Memory)', icon: <BarChart3 className="w-4 h-4" />, detail: v => `Backend: ${v.backend}` },
  anomaly_detector: { label: 'Anomaly Detector', icon: <AlertTriangle className="w-4 h-4" />, detail: v => `${v.algorithm} · ${v.baseline_samples} baseline samples` },
  signal_engine: { label: 'Signal Engine', icon: <Wifi className="w-4 h-4" />, detail: v => `${v.dimensions} dimensions: Location · Behavior · History · Context` },
  websocket: { label: 'WebSocket Broadcaster', icon: <Wifi className="w-4 h-4" />, detail: v => `${v.active_connections || 0} active connections` },
};

export default function SystemHealthPage() {
  const { data, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: ['system-health'],
    queryFn: fetchSystemHealth,
    refetchInterval: 15_000,
  });

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('en-IN') : '—';

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 pb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-rose-600" />
          <div>
            <h1 className="text-xl font-bold text-rose-900">System Health</h1>
            <p className="text-xs text-rose-600/60">Observability & Service Readiness · <DemoBadge /></p>
          </div>
        </div>
        <div className="text-xs text-rose-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          Last updated: {lastUpdated}
        </div>
      </div>

      {isError && (
        <div className="glass-card p-4 border border-red-200 text-red-700 text-sm mb-4">
          Cannot connect to backend. Start the server: <code className="bg-red-50 px-1 rounded">uvicorn backend.main:app --reload --port 8000</code>
        </div>
      )}

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
        {/* Component Health Grid */}
        <motion.div variants={fadeUpItem} className="glass-card p-5">
          <h2 className="text-sm font-bold text-rose-900 mb-4">Component Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {isLoading
              ? [...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
              : Object.entries(COMPONENT_META).map(([key, meta]) => {
                  const comp = data?.[key] || {};
                  const status = comp.status || 'unknown';
                  return (
                    <motion.div
                      key={key}
                      variants={fadeUpItem}
                      className="flex items-start gap-3 p-3 bg-white/40 rounded-xl border border-white/70"
                    >
                      <div className="p-2 rounded-lg bg-rose-50 text-rose-600 shrink-0">{meta.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-rose-900">{meta.label}</p>
                          <StatusDot status={status} />
                        </div>
                        <p className="text-[10px] text-rose-600/60 mt-0.5 truncate">{meta.detail(comp)}</p>
                      </div>
                    </motion.div>
                  );
                })
            }
          </div>
        </motion.div>

        {/* Model Details */}
        {data?.ml_engine && (
          <motion.div variants={fadeUpItem} className="glass-card p-5">
            <h2 className="text-sm font-bold text-rose-900 mb-3">ML Model Details</h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { label: 'Model', value: data.ml_engine.model },
                { label: 'Accuracy', value: `${((data.ml_engine.accuracy || 0) * 100).toFixed(1)}%` },
                { label: 'ROC-AUC', value: data.ml_engine.roc_auc },
                { label: 'Status', value: data.ml_engine.status },
                { label: 'Data', value: 'Synthetic' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/40 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-rose-600/60">{label}</p>
                  <p className="text-sm font-bold text-rose-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-amber-600/70 mt-3 italic">{data.ml_engine.note}</p>
          </motion.div>
        )}

        {/* Architecture Note */}
        <motion.div variants={fadeUpItem} className="glass-card p-5">
          <h2 className="text-sm font-bold text-rose-900 mb-3">Intelligence Layer Architecture</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
            {['Signal Engine', 'Prediction Engine', 'Anomaly Engine', 'Matching Engine', 'Trust Engine', 'Graph Engine', 'Risk Engine', 'Recommendation Engine'].map(e => (
              <div key={e} className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-xl px-3 py-2 font-medium text-rose-700">{e}</div>
            ))}
          </div>
          <p className="text-[10px] text-rose-500/60 mt-3 text-center">
            Modular intelligence engines — each independently testable and replaceable · Stateless FastAPI layer · Redis caching · Event-driven WebSocket distribution
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
