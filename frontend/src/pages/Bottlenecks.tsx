// MeetMux Control Tower — Bottlenecks Page
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, X, Activity, Info } from 'lucide-react';
import { fetchBottlenecks, fetchGraphImpact } from '../services/api';
import {
  BottleneckBar, StatusChip, ErrorState, EmptyState, DemoBadge, Skeleton, GlassCard
} from '../components/ui/SharedComponents';
import { drawerVariants, pageVariants, fadeUpItem, staggerContainer } from '../motion/variants';
import { formatINR, getBottleneckBand, formatNum } from '../utils';
import type { Bottleneck } from '../types';

export default function BottlenecksPage() {
  const [selected, setSelected] = useState<Bottleneck | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'utilization' | 'exposure'>('score');
  const [filterBand, setFilterBand] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['bottlenecks'],
    queryFn: fetchBottlenecks,
    refetchInterval: 60_000,
  });

  const { data: propagation, isLoading: propLoading } = useQuery({
    queryKey: ['propagation', selected?.node_id],
    queryFn: () => fetchGraphImpact(selected!.node_id, 0.85),
    enabled: !!selected,
  });

  const sorted = [...(data?.bottlenecks ?? [])].sort((a, b) => {
    if (sortBy === 'score') return b.bottleneck_score - a.bottleneck_score;
    if (sortBy === 'utilization') return b.utilization - a.utilization;
    return b.estimated_inr_exposure - a.estimated_inr_exposure;
  }).filter(b => {
    if (filterBand === 'ALL') return true;
    const band = getBottleneckBand(b.bottleneck_score);
    return band.label === filterBand;
  });

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex h-[calc(100vh-58px)] overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-rose-900">Bottleneck Intelligence</h1>
            <p className="text-xs text-rose-600/60 mt-0.5">
              {data?.critical_bottlenecks_count ?? '—'} critical · {data?.total_nodes_analyzed ?? '—'} nodes analyzed · <DemoBadge />
            </p>
          </div>
        </div>

        {/* Formula Info */}
        {data?.formula_documentation && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 glass rounded-xl px-4 py-2.5 text-xs text-rose-700 mb-5"
          >
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span><strong>How is this calculated?</strong> {data.formula_documentation}</span>
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="flex gap-1">
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(band => (
              <button
                key={band}
                onClick={() => setFilterBand(band)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterBand === band ? 'bg-rose-600 text-white' : 'glass text-rose-700 hover:bg-rose-100'}`}
              >
                {band}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="glass text-xs text-rose-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-400"
            aria-label="Sort by"
          >
            <option value="score">Sort: Score</option>
            <option value="utilization">Sort: Utilization</option>
            <option value="exposure">Sort: ₹ Exposure</option>
          </select>
        </div>

        {/* Top Exposure Banner */}
        {data && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-4 glass rounded-xl px-4 py-3 mb-5 text-sm"
          >
            <div className="flex-1">
              <span className="text-xs text-rose-600/60">Top 5 Nodes Financial Exposure</span>
              <p className="text-lg font-bold text-red-700">{formatINR(data.top_5_financial_exposure_inr)}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-rose-600/60">Critical Hubs</span>
              <p className="text-lg font-bold text-rose-900">{data.critical_bottlenecks_count}</p>
            </div>
          </motion.div>
        )}

        {/* Bottleneck List */}
        {isError ? <ErrorState /> : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-3"
          >
            {isLoading
              ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
              : sorted.length === 0
              ? <EmptyState message="No bottlenecks match your filter." icon={<ShieldAlert className="w-8 h-8" />} />
              : sorted.map(b => {
                  const band = getBottleneckBand(b.bottleneck_score);
                  return (
                    <motion.div
                      key={b.node_id}
                      variants={fadeUpItem}
                      layout
                      onClick={() => setSelected(b)}
                      className={`glass-card p-4 cursor-pointer hover:shadow-pink-glass-lg transition-all ${selected?.node_id === b.node_id ? 'ring-2 ring-rose-400' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-rose-900 truncate">{b.node_name}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: band.bg, color: band.color }}>
                              {band.label}
                            </span>
                          </div>
                          <p className="text-xs text-rose-600/60 mb-2">{b.city} · {b.node_type} · Rank #{b.centrality_rank}</p>
                          <BottleneckBar score={b.bottleneck_score} />
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <p className="text-xs text-rose-600/60">Utilization</p>
                          <p className="text-sm font-bold text-rose-900">{(b.utilization * 100).toFixed(0)}%</p>
                          <p className="text-xs font-semibold text-red-600">{formatINR(b.estimated_inr_exposure, true)}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-3 text-xs text-rose-600/60 border-t border-rose-100/60 pt-2">
                        <span>{b.affected_routes_count} routes</span>
                        <span>{b.affected_shipments_count} shipments</span>
                        <span>{b.downstream_customers_count} customers</span>
                      </div>
                    </motion.div>
                  );
                })
            }
          </motion.div>
        )}
      </div>

      {/* Right Drawer: Propagation Impact */}
      <AnimatePresence>
        {selected && (
          <motion.aside
            variants={drawerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-96 glass border-l border-white/60 overflow-y-auto"
            role="complementary"
            aria-label="Disruption propagation panel"
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-rose-900">Disruption Propagation</h3>
                  <p className="text-xs text-rose-600/60">If {selected.node_name.split('(')[0].trim()} fails</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {propLoading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
              ) : propagation ? (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { label: 'Affected Nodes', value: propagation.total_affected_nodes },
                      { label: 'Affected Shipments', value: propagation.total_affected_shipments },
                      { label: 'Affected Customers', value: propagation.total_affected_customers },
                      { label: '₹ Exposure', value: formatINR(propagation.total_inr_exposure, true) },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-red-50/60 border border-red-100 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-red-600/70">{label}</p>
                        <p className="text-base font-bold text-red-700">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Hop Timeline */}
                  <p className="text-xs font-semibold text-rose-700 mb-3">Propagation by Hop</p>
                  <div className="space-y-3">
                    {propagation?.hops?.map((hop: any) => (
                      <motion.div
                        key={hop.hop_level}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: hop.hop_level * 0.15 }}
                        className="glass-card p-3"
                        style={{ borderLeft: `3px solid ${hop.hop_level === 1 ? '#DC2626' : hop.hop_level === 2 ? '#EA580C' : '#D97706'}` }}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-rose-900">Hop {hop.hop_level} — {hop.estimated_time_to_impact_hours}h to impact</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-rose-600/60">Shipments</p>
                            <p className="font-semibold">{hop.affected_shipments_count}</p>
                          </div>
                          <div>
                            <p className="text-rose-600/60">Customers</p>
                            <p className="font-semibold">{hop.affected_customers_count}</p>
                          </div>
                          <div>
                            <p className="text-rose-600/60">₹ Loss</p>
                            <p className="font-semibold text-red-600">{formatINR(hop.estimated_financial_loss_inr, true)}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {hop.nodes.slice(0, 3).map((n: any) => (
                            <span key={n.id} className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 rounded-md px-1.5 py-0.5 truncate max-w-[110px]">
                              {n.name?.split('(')[0].trim()}
                            </span>
                          ))}
                          {hop.nodes.length > 3 && <span className="text-[10px] text-rose-400">+{hop.nodes.length - 3} more</span>}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-[10px] text-rose-400 mt-3 text-center">NetworkX graph traversal · Synthetic demo data</p>
                </>
              ) : null}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
