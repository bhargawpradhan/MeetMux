// MeetMux — Audit Logs Page
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Shield, Search, User, CheckCircle2, XCircle, Brain, Zap, BarChart3 } from 'lucide-react';
import { fetchAuditLogs } from '../services/api';
import { DemoBadge, Skeleton, EmptyState } from '../components/ui/SharedComponents';
import { pageVariants, staggerContainer, fadeUpItem } from '../motion/variants';
import { cn } from '../utils';

const ACTION_STYLES: Record<string, { color: string; icon: React.ReactNode }> = {
  PREDICTION_REQUEST: { color: 'text-purple-700 bg-purple-50 border-purple-200', icon: <Brain className="w-3 h-3" /> },
  SIMULATION_STARTED: { color: 'text-blue-700 bg-blue-50 border-blue-200', icon: <Zap className="w-3 h-3" /> },
  RECOMMENDATION_APPROVED: { color: 'text-green-700 bg-green-50 border-green-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  RECOMMENDATION_REJECTED: { color: 'text-red-700 bg-red-50 border-red-200', icon: <XCircle className="w-3 h-3" /> },
  ROUTE_ANALYZED: { color: 'text-amber-700 bg-amber-50 border-amber-200', icon: <BarChart3 className="w-3 h-3" /> },
  ALERT_RESOLVED: { color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  DECISION_RECORDED: { color: 'text-rose-700 bg-rose-50 border-rose-200', icon: <Shield className="w-3 h-3" /> },
};

const ROLE_COLOR: Record<string, string> = {
  ADMIN: 'text-red-700 bg-red-50',
  OPERATIONS_MANAGER: 'text-orange-700 bg-orange-50',
  ANALYST: 'text-blue-700 bg-blue-50',
  VIEWER: 'text-gray-700 bg-gray-50',
  SYSTEM: 'text-slate-600 bg-slate-100',
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', actionFilter],
    queryFn: () => fetchAuditLogs(100, actionFilter || undefined),
    refetchInterval: 20_000,
  });

  const logs = (data?.audit_logs ?? []).filter((l: Record<string, any>) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.user?.toLowerCase().includes(q) || l.entity_id?.toLowerCase().includes(q) || l.action?.toLowerCase().includes(q);
  });

  const ACTION_TYPES = ['PREDICTION_REQUEST', 'SIMULATION_STARTED', 'RECOMMENDATION_APPROVED', 'RECOMMENDATION_REJECTED', 'ALERT_RESOLVED', 'DECISION_RECORDED'];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 pb-10">
      <div className="flex items-center gap-3 mb-5">
        <Shield className="w-5 h-5 text-rose-600" />
        <div>
          <h1 className="text-xl font-bold text-rose-900">Audit Logs</h1>
          <p className="text-xs text-rose-600/60">Immutable decision trail · Predictions · Simulations · Approvals · <DemoBadge /></p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl flex-1 min-w-48">
          <Search className="w-4 h-4 text-rose-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, entity, or action…"
            className="bg-transparent text-xs text-rose-900 placeholder-rose-400 focus:outline-none flex-1"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setActionFilter('')} className={cn('px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors', !actionFilter ? 'bg-rose-600 text-white' : 'glass text-rose-700 hover:bg-rose-100')}>All</button>
          {ACTION_TYPES.map(a => (
            <button
              key={a}
              onClick={() => setActionFilter(a === actionFilter ? '' : a)}
              className={cn('px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors', actionFilter === a ? 'bg-rose-600 text-white' : 'glass text-rose-700 hover:bg-rose-100')}
            >
              {a.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Log Table */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate">
        {isLoading ? (
          [...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl mb-2" />)
        ) : logs.length === 0 ? (
          <EmptyState message="No audit entries match your filters." icon={<Shield className="w-8 h-8" />} />
        ) : (
          <div className="space-y-2">
            {logs.map((log: Record<string, any>, i: number) => {
              const style = ACTION_STYLES[log.action] || ACTION_STYLES.DECISION_RECORDED;
              return (
                <motion.div key={log.id + i} variants={fadeUpItem} className="glass-card px-4 py-3 flex items-center gap-3">
                  <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-semibold shrink-0', style.color)}>
                    {style.icon}
                    {log.action?.replace(/_/g, ' ')}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <User className="w-3 h-3 text-rose-400" />
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', ROLE_COLOR[log.role] || 'text-slate-600 bg-slate-100')}>
                      {log.user} ({log.role})
                    </span>
                  </div>
                  <span className="text-xs text-rose-700 font-mono shrink-0">{log.entity_id}</span>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <span className="text-[10px] text-rose-600/60 truncate hidden md:block">
                      {Object.entries(log.details).slice(0, 2).map(([k, v]) => `${k}: ${String(v).slice(0, 30)}`).join(' · ')}
                    </span>
                  )}
                  <span className={cn('ml-auto shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium',
                    log.result === 'SUCCESS' || log.result === 'PROCESSED' || log.result === 'COMPLETED' || log.result === 'COMMITTED'
                      ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                  )}>{log.result}</span>
                  <span className="text-[10px] text-rose-400/60 shrink-0 font-mono">
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('en-IN') : '—'}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
