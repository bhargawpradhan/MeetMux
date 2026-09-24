// MeetMux Control Tower — Alerts Page
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle2, Clock, X, AlertTriangle, Info, XCircle } from 'lucide-react';
import { fetchAlerts, patchAlertStatus } from '../services/api';
import { DemoBadge, ErrorState, EmptyState } from '../components/ui/SharedComponents';
import { pageVariants, staggerContainer, fadeUpItem, toastVariants } from '../motion/variants';
import { formatINR, formatTimestamp, timeAgo, cn } from '../utils';
import type { Alert, AlertSeverity } from '../types';

const SEVERITY_STYLES: Record<AlertSeverity, { bg: string; border: string; color: string; icon: React.ReactNode }> = {
  CRITICAL: {
    bg: 'bg-red-50/70', border: 'border-red-200', color: 'text-red-700',
    icon: <XCircle className="w-4 h-4 text-red-600" />
  },
  HIGH: {
    bg: 'bg-orange-50/70', border: 'border-orange-200', color: 'text-orange-700',
    icon: <AlertTriangle className="w-4 h-4 text-orange-600" />
  },
  MEDIUM: {
    bg: 'bg-amber-50/70', border: 'border-amber-200', color: 'text-amber-700',
    icon: <AlertTriangle className="w-4 h-4 text-amber-500" />
  },
  INFO: {
    bg: 'bg-blue-50/70', border: 'border-blue-200', color: 'text-blue-700',
    icon: <Info className="w-4 h-4 text-blue-500" />
  },
};

export default function AlertsPage() {
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => fetchAlerts(),
    refetchInterval: 15_000,
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => patchAlertStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const filtered = (data?.alerts ?? []).filter((a: any) => {
    const sevOk = severityFilter === 'ALL' || a.severity === severityFilter;
    const statOk = statusFilter === 'ALL' || a.status === statusFilter;
    return sevOk && statOk;
  });

  const criticalActive = (data?.alerts ?? []).filter((a: any) => a.severity === 'CRITICAL' && a.status === 'ACTIVE');

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
          <Bell className="w-5 h-5 text-rose-600" />
          <h1 className="text-xl font-bold text-rose-900">Alert Center</h1>
          {criticalActive.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {criticalActive.length}
            </motion.span>
          )}
          <DemoBadge />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex gap-1">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'INFO'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={cn('px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors', severityFilter === sev ? 'bg-rose-600 text-white' : 'glass text-rose-700 hover:bg-rose-100')}
            >
              {sev}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {['ACTIVE', 'ACKNOWLEDGED', 'ALL'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn('px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors', statusFilter === st ? 'bg-rose-500 text-white' : 'glass text-rose-700 hover:bg-rose-100')}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {isError ? <ErrorState /> : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
          {isLoading ? [...Array(4)].map((_, i) => (
            <div key={i} className="h-28 shimmer rounded-2xl" />
          )) : filtered.length === 0 ? (
            <EmptyState message="No alerts match your filters." icon={<Bell className="w-8 h-8" />} />
          ) : (
            filtered.map((alert: any) => {
              const sty = SEVERITY_STYLES[alert.severity as keyof typeof SEVERITY_STYLES] ?? SEVERITY_STYLES.INFO;
              return (
                <motion.div
                  key={alert.id}
                  layout
                  variants={fadeUpItem}
                  className={cn('glass-card p-4 border', sty.border, alert.status === 'RESOLVED' && 'opacity-50')}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('p-2 rounded-lg shrink-0 mt-0.5', sty.bg)}>
                      {sty.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn('text-xs font-bold uppercase tracking-wide', sty.color)}>{alert.severity}</span>
                        <span className="text-xs text-rose-600/50">·</span>
                        <span className="text-xs text-rose-600/60 truncate">{alert.entity_name}</span>
                        <span className="ml-auto text-xs text-rose-400/70 shrink-0">{timeAgo(alert.timestamp)}</span>
                      </div>
                      <p className="text-sm text-rose-800 leading-snug mb-2">{alert.reason}</p>
                      <p className="text-xs text-rose-600/70 italic mb-2">
                        <strong>Recommended:</strong> {alert.recommended_investigation}
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-semibold text-red-600">₹ Exposure: {formatINR(alert.financial_exposure_inr, true)}</span>
                        <div className="ml-auto flex gap-1.5">
                          {alert.status === 'ACTIVE' && (
                            <>
                              <button
                                onClick={() => updateStatus({ id: alert.id, status: 'ACKNOWLEDGED' })}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                              >
                                <Clock className="w-3 h-3" /> Acknowledge
                              </button>
                              <button
                                onClick={() => updateStatus({ id: alert.id, status: 'RESOLVED' })}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Resolve
                              </button>
                            </>
                          )}
                          {alert.status === 'ACKNOWLEDGED' && (
                            <button
                              onClick={() => updateStatus({ id: alert.id, status: 'RESOLVED' })}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Resolve
                            </button>
                          )}
                          {alert.status === 'RESOLVED' && (
                            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Resolved
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
