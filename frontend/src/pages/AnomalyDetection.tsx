// MeetMux Control Tower — Anomaly Detection & Telemetry Outlier Scanner
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Brain, ShieldAlert, Cpu, Activity, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';
import { fetchAnomalyAnalysis, fetchShipments } from '../services/api';
import { DemoBadge, Skeleton, EmptyState } from '../components/ui/SharedComponents';
import TiltCard from '../components/3d/TiltCard';
import { pageVariants, staggerContainer, fadeUpItem } from '../motion/variants';
import { pct, cn } from '../utils';

export default function AnomalyDetectionPage() {
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('SHP-1024');

  const { data: shipmentsData, isLoading: shipsLoading } = useQuery({
    queryKey: ['shipments-list'],
    queryFn: () => fetchShipments({ limit: 40 }),
  });

  const { data: anomalyData, isLoading: anomalyLoading, refetch } = useQuery({
    queryKey: ['anomaly', selectedShipmentId],
    queryFn: () => fetchAnomalyAnalysis(selectedShipmentId),
    enabled: !!selectedShipmentId,
  });

  const shipments = shipmentsData?.shipments ?? [];
  const isAnomalous = anomalyData?.status === 'ANOMALOUS';

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-pink-glass">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black text-rose-900 tracking-tight">Telemetry Anomaly Engine</h1>
            <p className="text-xs text-rose-600/70">Unsupervised IsolationForest (400 baseline telemetry frames) + Domain Heuristics · <DemoBadge /></p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-xl text-xs font-semibold text-rose-800 hover:bg-rose-100/70 transition-all border border-rose-200/60"
        >
          <RefreshCw className="w-3.5 h-3.5 text-rose-600" /> Re-scan
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Shipment Selector */}
        <div className="glass-card p-5">
          <h2 className="text-xs font-bold text-rose-900 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-600" /> Monitored Shipments
          </h2>
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto no-scrollbar">
            {shipsLoading ? (
              [...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
            ) : (
              shipments.map((s: any) => {
                const isSelected = s.id === selectedShipmentId;
                const isCritical = s.status === 'AT_RISK' || s.status === 'DELAYED';
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedShipmentId(s.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl transition-all border text-xs flex items-center justify-between',
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                        : isCritical
                        ? 'bg-red-50/70 border-red-200 text-rose-950 hover:bg-red-100/60'
                        : 'bg-white/50 border-rose-100/80 text-rose-900 hover:bg-rose-50'
                    )}
                  >
                    <div>
                      <p className="font-mono font-bold leading-tight">{s.id}</p>
                      <p className={cn('text-[10px] mt-0.5', isSelected ? 'text-rose-100' : 'text-rose-600/70')}>
                        {s.category} · {s.current_speed} km/h
                      </p>
                    </div>
                    <span className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase',
                      isSelected ? 'bg-white/20 text-white' : isCritical ? 'bg-red-500 text-white' : 'bg-emerald-100 text-emerald-800'
                    )}>
                      {s.status}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Anomaly Evaluation & 3D Interactive Cards */}
        <div className="lg:col-span-2 space-y-5">
          {anomalyLoading ? (
            <Skeleton className="h-64 rounded-2xl" />
          ) : anomalyData ? (
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
              {/* 3D Main Score Card */}
              <TiltCard>
                <div className={cn(
                  'p-6 rounded-2xl border backdrop-blur-xl',
                  isAnomalous
                    ? 'bg-gradient-to-br from-red-950/20 via-rose-900/15 to-slate-900/40 border-red-500/40 text-red-900'
                    : 'bg-gradient-to-br from-emerald-950/15 via-teal-900/10 to-slate-900/30 border-emerald-500/40 text-emerald-950'
                )}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Shipment Outlier Score</span>
                      <h2 className="text-2xl font-black font-mono mt-0.5">{anomalyData.entity_id}</h2>
                      <p className="text-xs text-rose-700/80 mt-1">Tracking: {anomalyData.tracking_number || 'N/A'}</p>
                    </div>
                    <div className={cn(
                      'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm',
                      isAnomalous
                        ? 'bg-red-500 text-white border-red-400 animate-pulse'
                        : 'bg-emerald-600 text-white border-emerald-500'
                    )}>
                      {isAnomalous ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {anomalyData.status}
                    </div>
                  </div>

                  {/* Anomaly Gauge */}
                  <div className="mt-5">
                    <div className="flex justify-between text-xs mb-1 font-bold">
                      <span>Anomaly Probability</span>
                      <span className="font-mono text-base">{pct(anomalyData.anomaly_score)}</span>
                    </div>
                    <div className="h-3 w-full bg-black/10 rounded-full overflow-hidden p-0.5">
                      <motion.div
                        className={cn('h-full rounded-full', isAnomalous ? 'bg-gradient-to-r from-amber-500 to-red-600' : 'bg-gradient-to-r from-teal-400 to-emerald-500')}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(anomalyData.anomaly_score * 100, 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  {/* Telemetry Snapshot Grid */}
                  {anomalyData.telemetry_snapshot && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-rose-200/50">
                      {[
                        { label: 'Current Velocity', value: `${anomalyData.telemetry_snapshot.speed_kmh} km/h` },
                        { label: 'Reefer Temp', value: `${anomalyData.telemetry_snapshot.temperature_c}°C` },
                        { label: 'Corridor Deviation', value: `${anomalyData.telemetry_snapshot.deviation_km} km` },
                        { label: 'Unplanned Stops', value: anomalyData.telemetry_snapshot.stops },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-white/50 backdrop-blur-md rounded-xl p-2.5 text-center border border-white/60">
                          <p className="text-[10px] text-rose-600/70 font-medium">{label}</p>
                          <p className="text-sm font-bold font-mono text-rose-900 mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TiltCard>

              {/* Detected Anomalies Breakdown */}
              <div className="glass-card p-5">
                <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-500" /> Detected Telemetry Deviations ({anomalyData.anomalies_detected_count || 0})
                </h3>
                <div className="space-y-2">
                  {(anomalyData.anomalies || []).map((anomalyText: string, i: number) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-start gap-2.5 p-3 rounded-xl text-xs border',
                        isAnomalous
                          ? 'bg-red-50/60 border-red-200/80 text-red-900'
                          : 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900'
                      )}
                    >
                      <Zap className={cn('w-4 h-4 shrink-0 mt-0.5', isAnomalous ? 'text-red-500' : 'text-emerald-500')} />
                      <div>
                        <p className="font-semibold">{anomalyText}</p>
                        <p className="text-[10px] text-rose-600/60 mt-0.5">Evaluation Source: Multi-feature IsolationForest + Rule Heuristics</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <EmptyState message="Select a shipment to analyze telemetry outliers." />
          )}
        </div>
      </div>
    </motion.div>
  );
}
