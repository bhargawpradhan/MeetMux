// MeetMux Control Tower — Analytics Page
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { fetchAnalyticsDelays, fetchBusinessImpact } from '../services/api';
import { DemoBadge, GlassCard, Skeleton, ErrorState } from '../components/ui/SharedComponents';
import { pageVariants, staggerContainer, fadeUpItem } from '../motion/variants';
import { formatINR } from '../utils';

const CHART_COLORS = ['#D6588A', '#F8B4C8', '#EA580C', '#D97706', '#2E7D32', '#2563EB', '#7C3AED'];

export default function AnalyticsPage() {
  const [costPerHour, setCostPerHour] = useState(3500);
  const [penaltyPerBreach, setPenaltyPerBreach] = useState(25000);

  const { data: delays, isLoading, isError } = useQuery({
    queryKey: ['analytics-delays'],
    queryFn: fetchAnalyticsDelays,
  });

  const { data: impact, isLoading: impactLoading } = useQuery({
    queryKey: ['business-impact', costPerHour, penaltyPerBreach],
    queryFn: () => fetchBusinessImpact(costPerHour, penaltyPerBreach),
  });

  const distributionData = delays?.delay_probability_distribution
    ? Object.entries(delays.delay_probability_distribution).map(([k, v]) => ({ name: k, value: v }))
    : [];

  const regionData = delays?.risk_by_region
    ? Object.entries(delays.risk_by_region).map(([region, risk]) => ({ region, risk }))
    : [];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-6 pb-10"
    >
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-5 h-5 text-rose-600" />
        <div>
          <h1 className="text-xl font-bold text-rose-900">Analytics & Business Impact</h1>
          <p className="text-xs text-rose-600/60"><DemoBadge /> All charts based on synthetic India network data</p>
        </div>
      </div>

      {isError ? <ErrorState /> : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">

          {/* Business Impact KPIs */}
          <motion.div variants={fadeUpItem} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {impactLoading ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />) : impact && ([
              { label: 'Cost of Delay (Est.)', value: formatINR(impact.estimated_delay_cost_inr, true), color: '#DC2626', icon: <DollarSign className="w-4 h-4" /> },
              { label: 'SLA Penalties Avoided', value: formatINR(impact.sla_penalties_avoided_inr, true), color: '#2E7D32', icon: <TrendingUp className="w-4 h-4" /> },
              { label: 'Savings if Recs Applied', value: formatINR(impact.savings_if_recommendations_applied_inr, true), color: '#2E7D32', icon: <TrendingUp className="w-4 h-4" /> },
              { label: 'Est. ROI', value: `${impact.estimated_roi_pct}%`, color: '#D6588A', icon: <BarChart3 className="w-4 h-4" /> },
            ].map(kpi => (
              <div key={kpi.label} className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2" style={{ color: kpi.color }}>{kpi.icon}</div>
                <p className="text-xs text-rose-600/60 mb-1">{kpi.label}</p>
                <p className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
              </div>
            )))}
          </motion.div>

          {/* Adjustable Assumptions */}
          <motion.div variants={fadeUpItem} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-rose-900">Editable Assumptions</h3>
              <span className="text-xs text-rose-500 italic">(estimates only — based on demo data)</span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-medium text-rose-700 block mb-1">Cost per Delay Hour (₹)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={500} max={15000} step={500}
                    value={costPerHour}
                    onChange={e => setCostPerHour(+e.target.value)}
                    className="flex-1 accent-rose-500"
                    aria-label="Cost per delay hour"
                  />
                  <span className="text-sm font-bold text-rose-900 w-20 text-right">{formatINR(costPerHour, true)}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-rose-700 block mb-1">Penalty per SLA Breach (₹)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={5000} max={100000} step={5000}
                    value={penaltyPerBreach}
                    onChange={e => setPenaltyPerBreach(+e.target.value)}
                    className="flex-1 accent-rose-500"
                    aria-label="Penalty per SLA breach"
                  />
                  <span className="text-sm font-bold text-rose-900 w-20 text-right">{formatINR(penaltyPerBreach, true)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Charts Row */}
          <motion.div variants={fadeUpItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Monthly Delay Trend */}
            <GlassCard title="Monthly Delay Trend (Avg Hours)" className="md:col-span-2">
              {isLoading ? <Skeleton className="h-48 w-full" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={delays?.monthly_trend ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(214,88,138,0.1)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#D6588A' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#D6588A' }} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.7)', borderRadius: 10 }}
                      labelStyle={{ color: '#3B1F2B', fontWeight: 600 }}
                    />
                    <Line type="monotone" dataKey="avg_delay_hours" stroke="#D6588A" strokeWidth={2.5} dot={{ fill: '#D6588A', r: 4 }} name="Avg Delay (hrs)" />
                    <Line type="monotone" dataKey="on_time_rate" stroke="#2E7D32" strokeWidth={2} strokeDasharray="4 2" dot={{ fill: '#2E7D32', r: 3 }} name="On-Time %" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </GlassCard>

            {/* Delay Distribution */}
            <GlassCard title="Delay Risk Distribution">
              {isLoading ? <Skeleton className="h-48 w-full" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={distributionData} cx="50%" cy="50%" outerRadius={75} dataKey="value" nameKey="name" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {distributionData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </GlassCard>

            {/* Risk by Region */}
            <GlassCard title="Risk Score by Region">
              {isLoading ? <Skeleton className="h-48 w-full" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={regionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(214,88,138,0.1)" />
                    <XAxis dataKey="region" tick={{ fontSize: 11, fill: '#D6588A' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#D6588A' }} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.7)', borderRadius: 10 }}
                    />
                    <Bar dataKey="risk" name="Risk Score" radius={[6, 6, 0, 0]}>
                      {regionData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </GlassCard>

            {/* Top Delayed Routes */}
            <GlassCard title="Top Delayed Routes" className="lg:col-span-2">
              {isLoading ? <Skeleton className="h-48 w-full" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={(delays?.top_delayed_routes ?? []).slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(214,88,138,0.1)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#D6588A' }} domain={[0, 1]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                    <YAxis type="category" dataKey="origin" tick={{ fontSize: 9, fill: '#D6588A' }} width={80} />
                    <Tooltip
                      formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, 'Delay Rate']}
                      contentStyle={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: 10 }}
                    />
                    <Bar dataKey="historical_delay_rate" name="Delay Rate" fill="#D6588A" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
