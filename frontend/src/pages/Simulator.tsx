// MeetMux Control Tower — Scenario Simulator Page
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Zap, TrendingUp, TrendingDown, AlertTriangle, ChevronRight, RefreshCw } from 'lucide-react';
import { runSimulation } from '../services/api';
import { DemoBadge, ErrorState } from '../components/ui/SharedComponents';
import { pageVariants, fadeUpItem, staggerContainer } from '../motion/variants';
import { formatINR, pct } from '../utils';
import type { ScenarioResult } from '../types';

const SCENARIO_TYPES = [
  { value: 'warehouse_failure', label: 'Hub Failure', icon: '🏭', description: 'Complete/partial shutdown of a key fulfilment hub' },
  { value: 'port_closure', label: 'Port Closure', icon: '⚓', description: 'Import gridlock at maritime gateways' },
  { value: 'route_congestion', label: 'Route Congestion', icon: '🚛', description: 'Severe monsoon/blockade highway congestion' },
  { value: 'weather_event', label: 'Weather Event', icon: '🌧️', description: 'Cyclone/torrential rain halting transit' },
  { value: 'demand_surge', label: 'Demand Surge', icon: '📦', description: 'Festive season +40% volume spike' },
];

const TARGETS = [
  { value: 'NODE-MUM-102', label: 'Bhiwandi Mega Hub H04 (Mumbai)' },
  { value: 'NODE-DEL-106', label: 'Okhla FC H02 (Delhi NCR)' },
  { value: 'NODE-PORT-101', label: 'JNPT Nhava Sheva Port' },
  { value: 'NODE-PORT-102', label: 'Chennai Port Trust' },
  { value: 'ROUTE-501', label: 'Mumbai–Delhi NH-48 Corridor' },
];

function DeltaBadge({ before, after, reverse = false }: { before: number; after: number; reverse?: boolean }) {
  const diff = after - before;
  const isWorse = reverse ? diff < 0 : diff > 0;
  return (
    <div className="flex items-center gap-3 justify-between text-sm">
      <span className="tabular-nums text-rose-700">{typeof before === 'number' && before < 2 ? pct(before) : before.toFixed(0)}</span>
      <ChevronRight className="w-4 h-4 text-rose-400" />
      <span className={`tabular-nums font-bold ${isWorse ? 'text-red-700' : 'text-emerald-700'}`}>
        {typeof after === 'number' && after < 2 ? pct(after) : after.toFixed(0)}
      </span>
      <span className={`text-xs ${isWorse ? 'text-red-500' : 'text-emerald-500'}`}>
        {diff >= 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(diff < 2 ? 3 : 0)}
      </span>
    </div>
  );
}

export default function SimulatorPage() {
  const [scenarioType, setScenarioType] = useState('warehouse_failure');
  const [target, setTarget] = useState('NODE-MUM-102');
  const [severity, setSeverity] = useState(0.75);
  const [results, setResults] = useState<ScenarioResult[]>([]);

  const { mutate, isPending, isError } = useMutation({
    mutationFn: () => runSimulation(scenarioType, target, severity),
    onSuccess: (data) => {
      setResults(prev => [data, ...prev].slice(0, 3)); // Max 3 side-by-side
    }
  });

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-6 pb-10"
    >
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-5 h-5 text-rose-600" />
        <div>
          <h1 className="text-xl font-bold text-rose-900">Scenario Simulator</h1>
          <p className="text-xs text-rose-600/60">What-if disruption analysis · <DemoBadge /></p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-amber-700 bg-amber-50/40 border border-amber-200/50 mb-5"
      >
        <AlertTriangle className="w-4 h-4 shrink-0" />
        Model scenario — not a real-world forecast. All figures derived from synthetic MeetMux demo data.
      </motion.div>

      {/* Controls */}
      <div className="glass-card p-5 mb-6">
        <h2 className="text-sm font-bold text-rose-900 mb-4">Configure Scenario</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Scenario type */}
          <div>
            <label className="text-xs font-medium text-rose-700 mb-2 block">Scenario Type</label>
            <div className="space-y-1.5">
              {SCENARIO_TYPES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setScenarioType(s.value)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all ${scenarioType === s.value ? 'bg-rose-600 text-white shadow-pink-glass' : 'glass text-rose-700 hover:bg-rose-100'}`}
                >
                  <span>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target */}
          <div>
            <label className="text-xs font-medium text-rose-700 mb-2 block">Target Entity</label>
            <div className="space-y-1.5">
              {TARGETS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTarget(t.value)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all ${target === t.value ? 'bg-rose-600 text-white' : 'glass text-rose-700 hover:bg-rose-100'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="text-xs font-medium text-rose-700 mb-2 block">
              Severity: <span className="text-rose-900 font-bold">{pct(severity)}</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={severity}
              onChange={e => setSeverity(parseFloat(e.target.value))}
              className="w-full accent-rose-500"
              aria-label="Scenario severity"
            />
            <div className="flex justify-between text-[10px] text-rose-600/50 mt-0.5">
              <span>10% Minor</span>
              <span>100% Total Failure</span>
            </div>

            <button
              onClick={() => mutate()}
              disabled={isPending}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold shadow-pink-glass hover:shadow-pink-glass-lg transition-all disabled:opacity-50 text-sm"
            >
              {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {isPending ? 'Running Simulation…' : 'Run Simulation'}
            </button>
            {isError && <p className="text-xs text-red-500 text-center mt-2">Simulation failed. Check backend connection.</p>}
          </div>
        </div>
      </div>

      {/* Results — up to 3 side-by-side */}
      <AnimatePresence mode="popLayout">
        {results.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className={`grid grid-cols-1 ${results.length >= 2 ? 'md:grid-cols-2' : ''} ${results.length >= 3 ? 'xl:grid-cols-3' : ''} gap-4`}
          >
            {results.map((result, idx) => (
              <motion.div
                key={`${result.scenario_name}-${idx}`}
                layout
                variants={fadeUpItem}
                className="glass-card p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <h3 className="text-sm font-bold text-rose-900 truncate">{result.scenario_name}</h3>
                </div>
                <p className="text-xs text-rose-600/60 mb-4">Severity: {pct(result.severity)}</p>

                <div className="space-y-3">
                  {[
                    { label: 'Avg Delay Risk', before: result.avg_delay_risk_before, after: result.avg_delay_risk_after },
                    { label: 'Critical Bottlenecks', before: result.critical_bottlenecks_before, after: result.critical_bottlenecks_after },
                    { label: 'SLA Breaches', before: result.predicted_sla_breaches_before, after: result.predicted_sla_breaches_after },
                  ].map(({ label, before, after }) => (
                    <div key={label}>
                      <p className="text-xs text-rose-600/70 mb-1">{label}</p>
                      <DeltaBadge before={before} after={after} />
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-red-50/60 border border-red-100 rounded-xl">
                  <p className="text-xs text-red-600/70 mb-1">Financial Impact</p>
                  <p className="text-xl font-bold text-red-700">{formatINR(result.financial_cost_impact_inr, true)}</p>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
                  <div className="bg-white/40 rounded-lg p-2">
                    <p className="text-rose-600/60">Shipments</p>
                    <p className="font-bold">{result.affected_shipments_count}</p>
                  </div>
                  <div className="bg-white/40 rounded-lg p-2">
                    <p className="text-rose-600/60">Routes</p>
                    <p className="font-bold">{result.affected_routes_count}</p>
                  </div>
                  <div className="bg-white/40 rounded-lg p-2">
                    <p className="text-rose-600/60">Nodes</p>
                    <p className="font-bold">{result.affected_nodes_count}</p>
                  </div>
                </div>

                <p className="text-[9px] text-rose-400 mt-3 text-center italic">{result.disclaimer}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {results.length === 0 && !isPending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 text-rose-400"
        >
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Configure and run a scenario to see BEFORE → AFTER impact analysis</p>
          <p className="text-xs mt-1 opacity-60">Compare up to 3 scenarios side-by-side</p>
        </motion.div>
      )}
    </motion.div>
  );
}
