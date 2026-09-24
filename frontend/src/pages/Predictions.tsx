// MeetMux Control Tower — Predictions Page
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Brain, AlertTriangle } from 'lucide-react';
import { fetchShipments, fetchPrediction } from '../services/api';
import { RiskBadge, RiskFactorBar, DemoBadge, Skeleton, ErrorState, EmptyState, GlassCard } from '../components/ui/SharedComponents';
import { pageVariants, staggerContainer, fadeUpItem } from '../motion/variants';
import { formatINR, pct } from '../utils';
import type { Shipment } from '../types';

function ShipmentPredictionCard({ shipment }: { shipment: Shipment }) {
  const { data: pred, isLoading } = useQuery({
    queryKey: ['pred', shipment.id],
    queryFn: () => fetchPrediction(shipment.id),
  });

  if (isLoading) return <Skeleton className="h-28 w-full rounded-2xl" />;
  if (!pred) return null;

  const maxImpact = Math.max(...pred.top_risk_factors.map((f: any) => Math.abs(f.impact)));

  return (
    <motion.div variants={fadeUpItem} className="glass-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="font-mono text-sm font-bold text-rose-900">{shipment.id}</span>
          <p className="text-xs text-rose-600/60">{shipment.category} · {formatINR(shipment.value_inr, true)}</p>
        </div>
        <RiskBadge level={pred.risk_level} />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white/40 rounded-lg p-2 text-center">
          <p className="text-[10px] text-rose-600/60">Delay Prob</p>
          <p className="text-base font-bold text-rose-900">{pct(pred.delay_probability)}</p>
        </div>
        <div className="bg-white/40 rounded-lg p-2 text-center">
          <p className="text-[10px] text-rose-600/60">Delay Hrs</p>
          <p className="text-base font-bold text-rose-900">{pred.predicted_delay_hours}h</p>
        </div>
        <div className="bg-white/40 rounded-lg p-2 text-center">
          <p className="text-[10px] text-rose-600/60">SLA Risk</p>
          <p className="text-base font-bold text-rose-900">{pct(pred.sla_breach_probability)}</p>
        </div>
      </div>

      <p className="text-xs text-rose-700/80 italic mb-3">{pred.explanation_text}</p>

      <div className="space-y-0.5">
        {pred.top_risk_factors.slice(0, 4).map((f: any) => (
          <RiskFactorBar key={f.feature} displayName={f.display_name} impact={f.impact} value={f.value} maxImpact={maxImpact} />
        ))}
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-rose-100/60 text-xs">
        <span className="text-rose-600/60">Est. cost impact</span>
        <span className="font-semibold text-red-600">{formatINR(pred.estimated_cost_impact, true)}</span>
      </div>
    </motion.div>
  );
}

export default function PredictionsPage() {
  const [filterRisk, setFilterRisk] = useState('ALL');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['shipments-predictions'],
    queryFn: () => fetchShipments({ status: undefined, limit: 30 }),
  });

  const risky = (data?.shipments ?? []).filter((s: any) => s.status === 'AT_RISK' || s.status === 'DELAYED');
  const displayed = filterRisk === 'AT_RISK' ? risky : data?.shipments?.slice(0, 20) ?? [];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-6 pb-10"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-rose-600" />
          <h1 className="text-xl font-bold text-rose-900">Predictions</h1>
          <DemoBadge />
        </div>
        <div className="flex gap-1">
          {[{ label: 'All', value: 'ALL' }, { label: 'At Risk', value: 'AT_RISK' }].map(f => (
            <button
              key={f.value}
              onClick={() => setFilterRisk(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterRisk === f.value ? 'bg-rose-600 text-white' : 'glass text-rose-700 hover:bg-rose-100'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Model Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl px-4 py-3 flex items-start gap-3 mb-5"
      >
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-rose-700">
          <strong>XGBoost + SHAP · Accuracy 83.1% · F1 0.80 · ROC-AUC 0.917</strong> — Trained on synthetic demo data only. Labeled as estimates. Not for real-world decisions.
        </p>
      </motion.div>

      {isError ? <ErrorState /> : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {isLoading
            ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)
            : displayed.length === 0
            ? <EmptyState message="No shipments to show." />
            : displayed.map((s: any) => <ShipmentPredictionCard key={s.id} shipment={s} />)
          }
        </motion.div>
      )}
    </motion.div>
  );
}
