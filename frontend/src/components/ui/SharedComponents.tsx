// MeetMux Control Tower — Shared UI Components

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn, getRiskColor, getBottleneckBand, formatINR } from '../../utils';
import { kpiCardVariants, fadeUpItem, criticalPulseVariants, staggerContainer } from '../../motion/variants';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';
import type { RiskLevel } from '../../types';

// ─── Demo Badge ────────────────────────────────────────────────────────────────
export function DemoBadge() {
  return (
    <span className="demo-badge" aria-label="Demo data indicator">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
      Demo Data
    </span>
  );
}

// ─── Live Indicator ────────────────────────────────────────────────────────────
export function LiveIndicator({ connected = true }: { connected?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full', connected ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-gray-500 bg-gray-100 border border-gray-200')}>
      <span className={cn('w-2 h-2 rounded-full', connected ? 'live-dot' : 'bg-gray-400')} />
      {connected ? 'LIVE (simulated)' : 'Connecting…'}
    </span>
  );
}

// ─── Risk Badge ───────────────────────────────────────────────────────────────
interface RiskBadgeProps {
  level: RiskLevel | string;
  className?: string;
}

const RISK_ICONS: Record<string, React.ReactNode> = {
  CRITICAL: <XCircle className="w-3 h-3" aria-hidden="true" />,
  HIGH: <AlertTriangle className="w-3 h-3" aria-hidden="true" />,
  MEDIUM: <Info className="w-3 h-3" aria-hidden="true" />,
  LOW: <CheckCircle2 className="w-3 h-3" aria-hidden="true" />,
};

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const lvl = (level?.toUpperCase() ?? 'LOW') as string;
  const pillClass: Record<string, string> = {
    CRITICAL: 'risk-pill-critical',
    HIGH: 'risk-pill-high',
    MEDIUM: 'risk-pill-medium',
    LOW: 'risk-pill-low',
  };
  const pc = pillClass[lvl] ?? 'risk-pill-low';

  return (
    <motion.span
      className={cn('risk-pill', pc, className)}
      {...(lvl === 'CRITICAL' ? { variants: criticalPulseVariants, animate: 'animate' } : {})}
      aria-label={`Risk level: ${lvl}`}
    >
      {RISK_ICONS[lvl] ?? <Info className="w-3 h-3" />}
      {lvl}
    </motion.span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KPICardProps {
  title: string;
  value: number;
  formatFn?: (v: number) => string;
  delta?: number;
  trend?: number[];
  icon: React.ReactNode;
  accentColor?: string;
  critical?: boolean;
  subtitle?: string;
}

export function KPICard({ title, value, formatFn, delta, icon, accentColor = '#D6588A', critical, subtitle }: KPICardProps) {
  const animated = useAnimatedCounter(value, 900);
  const displayValue = formatFn ? formatFn(animated) : animated.toLocaleString('en-IN');

  return (
    <motion.div
      variants={kpiCardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      className={cn('glass-card p-5 cursor-default select-none relative overflow-hidden', critical && 'critical-pulse')}
    >
      {/* Accent stripe */}
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: accentColor }} />

      <div className="flex items-start justify-between mb-3 pl-2">
        <div className="p-2 rounded-xl" style={{ background: `${accentColor}18` }}>
          <span style={{ color: accentColor }}>{icon}</span>
        </div>
        {delta !== undefined && (
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', delta >= 0 ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50')}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%
          </span>
        )}
      </div>

      <div className="pl-2">
        <p className="text-xs font-medium text-rose-600/70 uppercase tracking-wide mb-1">{title}</p>
        <p className="text-2xl font-bold text-rose-900 tabular-nums">{displayValue}</p>
        {subtitle && <p className="text-xs text-rose-600/60 mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-xl', className)} />;
}

export function KPICardSkeleton() {
  return (
    <div className="glass-card p-5">
      <Skeleton className="w-10 h-10 mb-3 rounded-xl" />
      <Skeleton className="w-24 h-3 mb-2" />
      <Skeleton className="w-32 h-7" />
    </div>
  );
}

// ─── Glass Card ───────────────────────────────────────────────────────────────
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
}

export function GlassCard({ children, className, title, actions }: GlassCardProps) {
  return (
    <motion.div variants={fadeUpItem} className={cn('glass-card p-5', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-sm font-semibold text-rose-800">{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </motion.div>
  );
}

// ─── Bottleneck Score Bar ──────────────────────────────────────────────────────
export function BottleneckBar({ score }: { score: number }) {
  const band = getBottleneckBand(score);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-rose-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: band.color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color: band.color }}>{score.toFixed(0)}</span>
    </div>
  );
}

// ─── SHAP / Risk Factor Bar ───────────────────────────────────────────────────
interface RiskFactorBarProps {
  displayName: string;
  impact: number;
  value: number;
  maxImpact: number;
}

export function RiskFactorBar({ displayName, impact, value, maxImpact }: RiskFactorBarProps) {
  const isPositive = impact >= 0;
  const widthPct = maxImpact > 0 ? Math.abs(impact) / maxImpact * 100 : 0;

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-xs text-rose-700/70 w-36 shrink-0 truncate" title={displayName}>{displayName}</span>
      <div className="flex-1 flex items-center gap-1">
        {/* Negative side */}
        <div className="flex-1 flex justify-end">
          {!isPositive && (
            <motion.div
              className="h-4 rounded-l"
              style={{ width: `${widthPct}%`, background: '#2E7D32' }}
              initial={{ width: 0 }}
              animate={{ width: `${widthPct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          )}
        </div>
        {/* Center line */}
        <div className="w-px h-5 bg-rose-300" />
        {/* Positive side */}
        <div className="flex-1 flex justify-start">
          {isPositive && (
            <motion.div
              className="h-4 rounded-r"
              style={{ width: `${widthPct}%`, background: '#DC2626' }}
              initial={{ width: 0 }}
              animate={{ width: `${widthPct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          )}
        </div>
      </div>
      <span className="text-xs tabular-nums text-rose-700/70 w-14 text-right">{value.toFixed(2)}</span>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-rose-400">
      <div className="text-4xl mb-3">{icon ?? '📭'}</div>
      <p className="text-sm text-center max-w-xs">{message}</p>
    </div>
  );
}

// ─── Error State ───────────────────────────────────────────────────────────────
export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-red-500">
      <AlertTriangle className="w-10 h-10 mb-3" />
      <p className="text-sm">{message ?? 'Something went wrong. Please try again.'}</p>
    </div>
  );
}

// ─── Status Chip ──────────────────────────────────────────────────────────────
export function StatusChip({ status }: { status: string }) {
  const colors: Record<string, string> = {
    IN_TRANSIT: 'bg-blue-50 text-blue-700 border-blue-200',
    AT_RISK: 'bg-orange-50 text-orange-700 border-orange-200',
    DELAYED: 'bg-red-50 text-red-700 border-red-200',
    DELIVERED: 'bg-green-50 text-green-700 border-green-200',
    PENDING: 'bg-gray-50 text-gray-600 border-gray-200',
    NORMAL: 'bg-green-50 text-green-700 border-green-200',
    CONGESTED: 'bg-orange-50 text-orange-700 border-orange-200',
    CRITICAL: 'bg-red-50 text-red-700 border-red-200',
    ACTIVE: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border', colors[status?.toUpperCase()] ?? 'bg-gray-50 text-gray-500 border-gray-200')}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Staggered List Wrapper ───────────────────────────────────────────────────
export function StaggerList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-rose-900">{title}</h2>
        {subtitle && <p className="text-sm text-rose-600/70 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
