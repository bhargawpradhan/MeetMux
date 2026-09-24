// MeetMux — Recommendations & Human-in-the-Loop Page
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lightbulb, CheckCircle2, XCircle, ChevronRight, AlertTriangle, Zap, TrendingDown } from 'lucide-react';
import { fetchRecommendations, approveRecommendation, rejectRecommendation } from '../services/api';
import { DemoBadge, ErrorState, Skeleton, EmptyState } from '../components/ui/SharedComponents';
import { pageVariants, staggerContainer, fadeUpItem } from '../motion/variants';
import { formatINR, pct, cn } from '../utils';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  REROUTE_SHIPMENTS: <ChevronRight className="w-4 h-4" />,
  PRIORITY_DISPATCH: <Zap className="w-4 h-4" />,
  BYPASS_HIGHWAY: <ChevronRight className="w-4 h-4" />,
  CAPACITY_EXPANSION: <TrendingDown className="w-4 h-4" />,
};

const STATUS_STYLES: Record<string, string> = {
  PENDING_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

const EFFORT_COLOR: Record<string, string> = {
  LOW: 'text-green-600',
  MEDIUM: 'text-amber-600',
  HIGH: 'text-red-600',
};

function RecommendationCard({ rec, onApprove, onReject, isPending }: {
  rec: Record<string, any>;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isPending: boolean;
}) {
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');

  return (
    <motion.div variants={fadeUpItem} layout className={cn(
      'glass-card p-5 border-l-4',
      rec.status === 'APPROVED' ? 'border-l-green-500' :
      rec.status === 'REJECTED' ? 'border-l-red-400' : 'border-l-rose-400'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
            {ACTION_ICONS[rec.action_type] || <Lightbulb className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-900 leading-tight">{rec.title}</h3>
            <p className="text-xs text-rose-600/60">{rec.target_entity_name} · {rec.action_type.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', STATUS_STYLES[rec.status] || STATUS_STYLES.PENDING_REVIEW)}>
          {rec.status.replace('_', ' ')}
        </span>
      </div>

      {/* Reasons */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase text-rose-500 mb-1.5 tracking-wide">Why this recommendation?</p>
        <ul className="space-y-1">
          {(rec.reasons || []).map((r: string, i: number) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-rose-700">
              <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
              {r}
            </li>
          ))}
        </ul>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white/40 rounded-xl p-2 text-center">
          <p className="text-[10px] text-rose-600/60">Confidence</p>
          <p className="text-base font-bold text-rose-900">{pct(rec.confidence_score || 0)}</p>
        </div>
        <div className="bg-white/40 rounded-xl p-2 text-center">
          <p className="text-[10px] text-rose-600/60">Delay Reduction</p>
          <p className="text-base font-bold text-emerald-700">{rec.expected_delay_reduction_hours}h</p>
        </div>
        <div className="bg-white/40 rounded-xl p-2 text-center">
          <p className="text-[10px] text-rose-600/60">Est. Savings</p>
          <p className="text-base font-bold text-emerald-700">{formatINR(rec.expected_savings_inr, true)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4 text-xs text-rose-600/60">
        <span>Effort: <span className={cn('font-semibold', EFFORT_COLOR[rec.effort_level])}>{rec.effort_level}</span></span>
      </div>

      {/* Human-in-the-Loop Approve / Reject */}
      {rec.status === 'PENDING_REVIEW' && (
        <AnimatePresence mode="wait">
          {!confirmAction ? (
            <motion.div key="buttons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 border-t border-rose-100/60 pt-3">
              <p className="text-[10px] text-rose-500/70 flex-1 italic">AI-generated suggestion — requires human approval before execution.</p>
              <button
                onClick={() => setConfirmAction('approve')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={() => setConfirmAction('reject')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </motion.div>
          ) : (
            <motion.div key="confirm" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="border-t border-rose-100/60 pt-3">
              <p className="text-xs font-semibold text-rose-800 mb-1">
                {confirmAction === 'approve' ? 'Add approval notes (optional):' : 'Rejection reason (optional):'}
              </p>
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full glass px-3 py-1.5 rounded-lg text-xs text-rose-900 placeholder-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400 mb-2"
                placeholder={confirmAction === 'approve' ? 'e.g. Approved after ops review meeting' : 'e.g. Awaiting carrier confirmation first'}
              />
              <div className="flex gap-2">
                <button onClick={() => setConfirmAction(null)} className="px-3 py-1.5 rounded-lg text-xs glass text-rose-700 hover:bg-rose-100">Cancel</button>
                <button
                  onClick={() => { confirmAction === 'approve' ? onApprove(rec.id) : onReject(rec.id); setConfirmAction(null); }}
                  disabled={isPending}
                  className={cn('flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                    confirmAction === 'approve'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  )}
                >
                  Confirm {confirmAction === 'approve' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {rec.status !== 'PENDING_REVIEW' && (
        <div className="border-t border-rose-100/60 pt-3 text-xs text-rose-600/60">
          {rec.status === 'APPROVED'
            ? `Approved by ${rec.reviewed_by || 'Operator'} at ${rec.reviewed_at ? new Date(rec.reviewed_at).toLocaleTimeString('en-IN') : '—'}`
            : `Rejected: ${rec.rejection_reason || '—'}`}
        </div>
      )}
    </motion.div>
  );
}

export default function RecommendationsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['recommendations'], queryFn: fetchRecommendations, refetchInterval: 30_000 });

  const { mutate: approve, isPending: approvePending } = useMutation({
    mutationFn: (id: string) => approveRecommendation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendations'] }),
  });
  const { mutate: reject, isPending: rejectPending } = useMutation({
    mutationFn: (id: string) => rejectRecommendation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendations'] }),
  });

  const recs = data?.recommendations ?? [];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 pb-10">
      <div className="flex items-center gap-3 mb-5">
        <Lightbulb className="w-5 h-5 text-rose-600" />
        <h1 className="text-xl font-bold text-rose-900">Recommendations</h1>
        <DemoBadge />
        <span className="ml-auto text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
          Human approval required — AI suggestions only
        </span>
      </div>

      <motion.div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-rose-700 mb-5">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
        System-generated operational recommendations. Review carefully before approving. Never auto-execute critical decisions.
      </motion.div>

      {isError ? <ErrorState /> : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
          {isLoading
            ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)
            : recs.length === 0
              ? <EmptyState message="No recommendations generated yet. Load demo network to seed recommendations." />
              : recs.map((rec: Record<string, any>) => (
                  <RecommendationCard
                    key={rec.id}
                    rec={rec}
                    onApprove={approve}
                    onReject={reject}
                    isPending={approvePending || rejectPending}
                  />
                ))
          }
        </motion.div>
      )}
    </motion.div>
  );
}
