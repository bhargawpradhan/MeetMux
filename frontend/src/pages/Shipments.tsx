// MeetMux Control Tower — Shipments Page
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, X, ChevronRight, Package } from 'lucide-react';
import { fetchShipments, fetchPrediction } from '../services/api';
import {
  RiskBadge, StatusChip, Skeleton, ErrorState, EmptyState, DemoBadge, StaggerList
} from '../components/ui/SharedComponents';
import { drawerVariants, pageVariants, fadeUpItem, staggerContainerFast } from '../motion/variants';
import { formatINR, formatTimestamp, pct, cn } from '../utils';
import { RiskFactorBar } from '../components/ui/SharedComponents';
import type { Shipment } from '../types';

const STATUSES = ['ALL', 'IN_TRANSIT', 'AT_RISK', 'DELAYED', 'DELIVERED'];
const CATEGORIES = ['ALL', 'PHARMA', 'ELECTRONICS', 'FMCG', 'AUTOMOTIVE', 'TEXTILES', 'INDUSTRIAL_EQUIPMENT'];

export default function ShipmentsPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['shipments', statusFilter, categoryFilter],
    queryFn: () => fetchShipments({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      category: categoryFilter === 'ALL' ? undefined : categoryFilter,
      limit: 200
    }),
    refetchInterval: 30_000,
  });

  const { data: prediction } = useQuery({
    queryKey: ['prediction', selectedShipment?.id],
    queryFn: () => fetchPrediction(selectedShipment!.id),
    enabled: !!selectedShipment,
  });

  const filtered = data?.shipments?.filter((s: any) =>
    search === '' ||
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    s.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
    s.origin_name.toLowerCase().includes(search.toLowerCase()) ||
    s.destination_name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex h-[calc(100vh-58px)] overflow-hidden"
    >
      {/* Main Panel */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-rose-900">Shipments</h1>
            <p className="text-xs text-rose-600/60 mt-0.5">{data?.total ?? '—'} total · <DemoBadge /></p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rose-400" />
            <input
              type="text"
              placeholder="Search shipment ID, origin, destination…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-xl glass text-sm text-rose-900 placeholder-rose-400/60 w-72 focus:outline-none focus:ring-2 focus:ring-rose-400"
              aria-label="Search shipments"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-1 flex-wrap">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn('px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  statusFilter === s ? 'bg-rose-600 text-white' : 'glass text-rose-700 hover:bg-rose-100')}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="glass text-xs text-rose-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-400"
            aria-label="Filter by category"
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Table */}
        {isError ? <ErrorState /> : (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm" role="table" aria-label="Shipments table">
              <thead>
                <tr className="border-b border-rose-100/60">
                  {['ID', 'Status', 'Priority', 'Category', 'Origin → Destination', 'Value', 'SLA Risk', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-rose-600/70 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b border-rose-50/80">
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8}><EmptyState message="No shipments match your filters." icon={<Package className="w-8 h-8" />} /></td></tr>
                ) : (
                  filtered.map((shipment: any) => (
                    <motion.tr
                      key={shipment.id}
                      layout
                      variants={fadeUpItem}
                      onClick={() => setSelectedShipment(shipment)}
                      className={cn(
                        'border-b border-rose-50/80 cursor-pointer transition-colors',
                        selectedShipment?.id === shipment.id ? 'bg-rose-50/60' : 'hover:bg-white/40'
                      )}
                      role="row"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-rose-800">{shipment.id}</td>
                      <td className="px-4 py-3"><StatusChip status={shipment.status} /></td>
                      <td className="px-4 py-3 text-xs text-rose-700">{shipment.priority.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 text-xs text-rose-700">{shipment.category}</td>
                      <td className="px-4 py-3 text-xs text-rose-700 max-w-xs truncate">
                        <span className="truncate">{shipment.origin_name.split('(')[0].trim()}</span>
                        <span className="text-rose-400 mx-1">→</span>
                        <span className="truncate">{shipment.destination_name.split('(')[0].trim()}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-rose-900">{formatINR(shipment.value_inr, true)}</td>
                      <td className="px-4 py-3">
                        <div className="w-16 h-1.5 bg-rose-100 rounded-full">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.round(shipment.route_congestion * 100)}%`,
                              background: shipment.route_congestion > 0.7 ? '#DC2626' : shipment.route_congestion > 0.45 ? '#EA580C' : '#D6588A'
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-rose-400">
                        <ChevronRight className="w-4 h-4" />
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Right Drawer: Shipment Detail */}
      <AnimatePresence>
        {selectedShipment && (
          <motion.aside
            variants={drawerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-96 glass border-l border-white/60 overflow-y-auto"
            role="complementary"
            aria-label="Shipment detail"
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-rose-900">{selectedShipment.id}</h3>
                  <p className="text-xs font-mono text-rose-600/60">{selectedShipment.tracking_number}</p>
                </div>
                <button onClick={() => setSelectedShipment(null)} className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <StatusChip status={selectedShipment.status} />
                <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-medium">{selectedShipment.priority.replace(/_/g, ' ')}</span>
              </div>

              {/* Route */}
              <div className="glass-card p-4 mb-4">
                <p className="text-xs font-semibold text-rose-700 mb-2">Route</p>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex-1">
                    <p className="font-medium text-rose-900">{selectedShipment.origin_name}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-400 shrink-0" />
                  <div className="flex-1 text-right">
                    <p className="font-medium text-rose-900">{selectedShipment.destination_name}</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-rose-600/60 mt-2">
                  <span>{selectedShipment.shipment_distance.toFixed(0)} km</span>
                  <span>{selectedShipment.category}</span>
                  <span>{formatINR(selectedShipment.value_inr, true)}</span>
                </div>
              </div>

              {/* Prediction */}
              {prediction && (
                <div className="glass-card p-4 mb-4 border border-rose-200/50">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-rose-700">AI Risk Prediction</p>
                    <RiskBadge level={prediction.risk_level} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-white/40 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-rose-600/60">Delay Prob.</p>
                      <p className="text-lg font-bold text-rose-900">{pct(prediction.delay_probability)}</p>
                    </div>
                    <div className="bg-white/40 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-rose-600/60">Predicted Delay</p>
                      <p className="text-lg font-bold text-rose-900">{prediction.predicted_delay_hours}h</p>
                    </div>
                    <div className="bg-white/40 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-rose-600/60">SLA Breach Risk</p>
                      <p className="text-lg font-bold text-rose-900">{pct(prediction.sla_breach_probability)}</p>
                    </div>
                    <div className="bg-white/40 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-rose-600/60">Est. Cost Impact</p>
                      <p className="text-sm font-bold text-red-700">{formatINR(prediction.estimated_cost_impact, true)}</p>
                    </div>
                  </div>

                  {/* SHAP Explanation */}
                  <p className="text-xs font-semibold text-rose-700 mb-2">Why this risk?</p>
                  <p className="text-xs text-rose-700/80 italic mb-3 leading-relaxed">{prediction.explanation_text}</p>
                  <div className="space-y-0.5">
                    {prediction.top_risk_factors.slice(0, 5).map((f: any) => (
                      <RiskFactorBar
                        key={f.feature}
                        displayName={f.display_name}
                        impact={f.impact}
                        value={f.value}
                        maxImpact={Math.max(...prediction.top_risk_factors.map((rf: any) => Math.abs(rf.impact)))}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-rose-500/70 mt-3 italic">{prediction.counterfactual_hint}</p>
                  <p className="text-[9px] text-rose-400/60 mt-1">XGBoost + SHAP · Synthetic demo data</p>
                </div>
              )}

              {/* Telemetry */}
              <div className="glass-card p-4">
                <p className="text-xs font-semibold text-rose-700 mb-2">Live Telemetry</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Speed', value: `${selectedShipment.current_speed} km/h` },
                    { label: 'Temperature', value: `${selectedShipment.temperature}°C` },
                    { label: 'Humidity', value: `${selectedShipment.humidity}%` },
                    { label: 'Congestion', value: pct(selectedShipment.route_congestion) },
                    { label: 'Vehicle Age', value: `${selectedShipment.vehicle_age} yrs` },
                    { label: 'Stops', value: selectedShipment.number_of_stops },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/40 rounded-lg p-2">
                      <p className="text-[10px] text-rose-600/60">{label}</p>
                      <p className="text-sm font-semibold text-rose-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
