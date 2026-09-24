// MeetMux Control Tower — Trust & Carrier Reliability Engine
import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Award, ShieldCheck, AlertTriangle, TrendingUp, Truck, CheckCircle2, ChevronRight, BarChart2 } from 'lucide-react';
import { fetchCarrierReliability } from '../services/api';
import { DemoBadge, Skeleton } from '../components/ui/SharedComponents';
import TiltCard from '../components/3d/TiltCard';
import { pageVariants, staggerContainer, fadeUpItem } from '../motion/variants';
import { pct, cn } from '../utils';

const TIER_STYLES: Record<string, { label: string; badge: string; border: string; glow: string }> = {
  TIER_1_PREFERRED: {
    label: 'Tier 1 · Preferred Partner',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    border: 'border-l-emerald-500',
    glow: 'rgba(16, 185, 129, 0.25)',
  },
  TIER_2_STANDARD: {
    label: 'Tier 2 · Standard Provider',
    badge: 'bg-amber-50 text-amber-700 border-amber-300',
    border: 'border-l-amber-500',
    glow: 'rgba(245, 158, 11, 0.25)',
  },
  TIER_3_ELEVATED_RISK: {
    label: 'Tier 3 · Elevated Risk Provider',
    badge: 'bg-red-50 text-red-700 border-red-300',
    border: 'border-l-red-500',
    glow: 'rgba(239, 68, 68, 0.25)',
  },
};

export default function TrustScoresPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['carrier-trust'],
    queryFn: fetchCarrierReliability,
    refetchInterval: 30_000,
  });

  const carriers = data?.carriers ?? [];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-rose-900 tracking-tight">Carrier Trust & Reliability Index</h1>
            <p className="text-xs text-rose-600/70">Continuous algorithmic scoring of national logistics providers based on live telemetry · <DemoBadge /></p>
          </div>
        </div>
      </div>

      {/* Overview Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <TiltCard>
          <div className="glass-card p-4 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600/70 uppercase">Fleet SLA Integrity</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-rose-900 mt-1">91.4%</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">▲ +2.1% across Tier-1 carriers</p>
          </div>
        </TiltCard>

        <TiltCard>
          <div className="glass-card p-4 border-l-4 border-l-rose-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600/70 uppercase">Active Carriers Monitored</span>
              <Truck className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-rose-900 mt-1">6 National Fleets</p>
            <p className="text-[10px] text-rose-600/60 font-semibold mt-0.5">Covering 164 interstate corridors</p>
          </div>
        </TiltCard>

        <TiltCard>
          <div className="glass-card p-4 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600/70 uppercase">Dispute & Delay Factor</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-rose-900 mt-1">4.2%</p>
            <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Incident mitigation enabled</p>
          </div>
        </TiltCard>
      </div>

      {/* Carrier List in 3D Cards */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
        ) : (
          carriers.map((carrier: any) => {
            const style = TIER_STYLES[carrier.tier] || TIER_STYLES.TIER_2_STANDARD;
            return (
              <TiltCard key={carrier.carrier_id} glowColor={style.glow}>
                <div className={cn('glass-card p-5 border-l-4', style.border)}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center text-rose-700 font-black text-sm border border-rose-200">
                        {carrier.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-rose-900 leading-tight">{carrier.name}</h3>
                        <p className="text-xs text-rose-600/70 font-mono mt-0.5">Carrier ID: {carrier.carrier_id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', style.badge)}>
                        {style.label}
                      </span>
                      <div className="text-right pl-3 border-l border-rose-200/50">
                        <p className="text-[10px] text-rose-600/60 uppercase font-medium">Reliability Score</p>
                        <p className="text-xl font-black font-mono text-rose-900 leading-none mt-0.5">{carrier.reliability_score}/100</p>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/40 backdrop-blur-sm rounded-xl p-3 border border-white/60 text-xs">
                    <div>
                      <p className="text-[10px] text-rose-600/70">On-Time Performance</p>
                      <p className="font-bold text-rose-900 font-mono mt-0.5">{pct(carrier.factors?.on_time_ratio ?? 0.88)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-rose-600/70">Cold-Chain Compliance</p>
                      <p className="font-bold text-emerald-700 font-mono mt-0.5">{pct(carrier.factors?.temp_compliance ?? 0.94)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-rose-600/70">Avg Corridor Velocity</p>
                      <p className="font-bold text-rose-900 font-mono mt-0.5">{carrier.factors?.avg_velocity_kmh ?? 48} km/h</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-rose-600/70">Incident Frequency</p>
                      <p className="font-bold text-rose-900 font-mono mt-0.5">{carrier.factors?.incident_rate ?? '0.04'}</p>
                    </div>
                  </div>
                </div>
              </TiltCard>
            );
          })
        )}
      </motion.div>
    </motion.div>
  );
}
