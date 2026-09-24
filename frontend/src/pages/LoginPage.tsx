// MeetMux Control Tower — Role-Based Login Page
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, BarChart3, Eye, Settings2, ArrowRight,
  Globe2, Lock, CheckCircle2, Zap, Activity, Package,
  Map, Brain, AlertTriangle, Lightbulb, Bell, Radio,
  HeartPulse, FileText, Users
} from 'lucide-react';
import { useAppStore, type UserRole, type AuthUser } from '../store/useAppStore';

// ── Role definitions ──────────────────────────────────────────────────────────
const ROLES: {
  id: UserRole;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
  borderColor: string;
  badge: string;
  description: string;
  permissions: string[];
  restrictedFrom: string[];
  defaultRoute: string;
}[] = [
  {
    id: 'ADMIN',
    title: 'Administrator',
    subtitle: 'Full system access',
    icon: <Settings2 className="w-7 h-7" />,
    color: '#FF4D5A',
    glowColor: 'rgba(255,77,90,0.3)',
    borderColor: 'rgba(255,77,90,0.4)',
    badge: 'SUPER ADMIN',
    description: 'Complete platform control — user management, system config, audit, all modules.',
    permissions: [
      'Full network & map control',
      'System Health & Audit Logs',
      'User role management',
      'All analytics & reports',
      'Simulator & AI tools',
      'Alert configuration',
      'Data export & backups',
    ],
    restrictedFrom: [],
    defaultRoute: '/system-health',
  },
  {
    id: 'OPERATIONS_MANAGER',
    title: 'Ops Manager',
    subtitle: 'Operations & logistics',
    icon: <Globe2 className="w-7 h-7" />,
    color: '#22D3EE',
    glowColor: 'rgba(34,211,238,0.3)',
    borderColor: 'rgba(34,211,238,0.4)',
    badge: 'OPS',
    description: 'End-to-end operational visibility — shipments, alerts, recommendations & live network.',
    permissions: [
      'Live Network map & tracking',
      'Shipments management',
      'Bottleneck analysis',
      'Alert management',
      'Recommendations & approvals',
      'Scenario Simulator',
      'AI Copilot queries',
    ],
    restrictedFrom: ['Audit Logs', 'System Health', 'User Management'],
    defaultRoute: '/',
  },
  {
    id: 'ANALYST',
    title: 'Analyst',
    subtitle: 'Data & intelligence',
    icon: <BarChart3 className="w-7 h-7" />,
    color: '#14B8A6',
    glowColor: 'rgba(20,184,166,0.3)',
    borderColor: 'rgba(20,184,166,0.4)',
    badge: 'ANALYST',
    description: 'Deep-dive into predictions, analytics, anomalies and trust scores to drive insights.',
    permissions: [
      'ML Predictions & SHAP',
      'Delay Analytics & KPIs',
      'Anomaly Detection engine',
      'Carrier Trust scores',
      'Live Events feed',
      'AI Copilot (read)',
      'Network map (read-only)',
    ],
    restrictedFrom: ['Simulator', 'Alert Config', 'User Management'],
    defaultRoute: '/analytics',
  },
  {
    id: 'VIEWER',
    title: 'Viewer',
    subtitle: 'Read-only dashboard',
    icon: <Eye className="w-7 h-7" />,
    color: '#FBBF24',
    glowColor: 'rgba(251,191,36,0.3)',
    borderColor: 'rgba(251,191,36,0.4)',
    badge: 'VIEW ONLY',
    description: 'Executive read-only dashboard — overview KPIs, network status and live alerts.',
    permissions: [
      'Overview dashboard (read)',
      'Network map (view only)',
      'Live alerts (view only)',
      'Shipment status (view)',
      'KPI metrics',
    ],
    restrictedFrom: ['Simulator', 'Recommendations', 'Audit Logs', 'System Health', 'Analytics', 'AI Copilot'],
    defaultRoute: '/',
  },
];

// ── Nav access map per role ───────────────────────────────────────────────────
export const ROLE_NAV_ACCESS: Record<UserRole, string[]> = {
  ADMIN: [
    '/', '/network', '/shipments', '/bottlenecks', '/predictions',
    '/recommendations', '/simulator', '/analytics', '/alerts',
    '/copilot', '/anomaly', '/trust', '/events', '/audit', '/system-health',
  ],
  OPERATIONS_MANAGER: [
    '/', '/network', '/shipments', '/bottlenecks', '/predictions',
    '/recommendations', '/simulator', '/alerts', '/copilot', '/events',
  ],
  ANALYST: [
    '/', '/network', '/predictions', '/analytics', '/anomaly',
    '/trust', '/events', '/copilot',
  ],
  VIEWER: ['/', '/network', '/alerts'],
};

// Role icon map for nav badge
export const ROLE_META: Record<UserRole, { label: string; color: string; badge: string }> = {
  ADMIN: { label: 'Administrator', color: '#FF4D5A', badge: 'ADMIN' },
  OPERATIONS_MANAGER: { label: 'Ops Manager', color: '#22D3EE', badge: 'OPS' },
  ANALYST: { label: 'Analyst', color: '#14B8A6', badge: 'ANALYST' },
  VIEWER: { label: 'Viewer', color: '#FBBF24', badge: 'VIEWER' },
};

// ── Login Page Component ───────────────────────────────────────────────────────
export default function LoginPage({ onLogin }: { onLogin: (route: string) => void }) {
  const { login } = useAppStore();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [hoveredRole, setHoveredRole] = useState<UserRole | null>(null);
  const [logging, setLogging] = useState(false);
  const [step, setStep] = useState<'select' | 'confirm'>('select');

  const chosen = ROLES.find(r => r.id === selectedRole);

  const handleSelect = (roleId: UserRole) => {
    setSelectedRole(roleId);
    setStep('confirm');
  };

  const handleLogin = () => {
    if (!selectedRole || !chosen) return;
    setLogging(true);

    const user: AuthUser = {
      role: selectedRole,
      name: chosen.title,
      avatar: chosen.title.slice(0, 2).toUpperCase(),
      loginTime: new Date().toISOString(),
    };

    setTimeout(() => {
      login(user);
      onLogin(chosen.defaultRoute);
    }, 900);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: '#050B14' }}
    >
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(34,211,238,0.06) 0%, transparent 70%)',
        }}
      />
      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(34,211,238,1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(34,211,238,1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center mb-10 z-10"
      >
        <div className="flex items-center gap-3 mb-4">
          <img
            src="/logo.png"
            alt="MeetMux"
            style={{
              width: 52, height: 52, objectFit: 'contain',
              filter: 'drop-shadow(0 0 14px rgba(34,211,238,0.7))',
              borderRadius: 12,
            }}
          />
          <div>
            <h1 className="text-3xl font-black tracking-widest uppercase" style={{ color: '#22D3EE', letterSpacing: '0.22em' }}>
              MeetMux
            </h1>
            <p className="text-[11px] font-mono tracking-[0.2em] uppercase" style={{ color: '#78909C' }}>
              Control Tower · Supply Chain Intelligence
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'select' ? (
            <motion.p
              key="select-hint"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-sm" style={{ color: '#8FA8B8' }}
            >
              Select your role to access your portal
            </motion.p>
          ) : (
            <motion.p
              key="confirm-hint"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-sm" style={{ color: '#8FA8B8' }}
            >
              Review your access level and launch your portal
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Role Selection ── */}
        {step === 'select' && (
          <motion.div
            key="role-select"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45 }}
            className="z-10 w-full max-w-5xl px-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ROLES.map((role, idx) => (
                <motion.button
                  key={role.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => handleSelect(role.id)}
                  onMouseEnter={() => setHoveredRole(role.id)}
                  onMouseLeave={() => setHoveredRole(null)}
                  className="relative flex flex-col items-start text-left rounded-2xl p-5 cursor-pointer transition-all duration-300"
                  style={{
                    background: hoveredRole === role.id ? 'rgba(13,27,42,0.95)' : 'rgba(13,27,42,0.7)',
                    border: `1px solid ${hoveredRole === role.id ? role.borderColor : 'rgba(27,52,72,0.8)'}`,
                    boxShadow: hoveredRole === role.id ? `0 0 30px ${role.glowColor}, 0 8px 32px rgba(0,0,0,0.5)` : '0 4px 20px rgba(0,0,0,0.4)',
                    transform: hoveredRole === role.id ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                  }}
                >
                  {/* Role badge */}
                  <span
                    className="absolute top-3 right-3 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${role.color}22`, color: role.color, border: `1px solid ${role.color}44` }}
                  >
                    {role.badge}
                  </span>

                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      background: `${role.color}18`,
                      border: `1px solid ${role.color}33`,
                      color: role.color,
                      boxShadow: `0 0 16px ${role.glowColor}`,
                    }}
                  >
                    {role.icon}
                  </div>

                  <h3 className="text-base font-black mb-0.5" style={{ color: '#E6F1F5' }}>{role.title}</h3>
                  <p className="text-[11px] mb-3" style={{ color: role.color }}>{role.subtitle}</p>
                  <p className="text-[11px] leading-relaxed mb-4" style={{ color: '#78909C' }}>{role.description}</p>

                  {/* Permissions */}
                  <ul className="space-y-1.5 w-full">
                    {role.permissions.slice(0, 4).map((perm) => (
                      <li key={perm} className="flex items-center gap-2 text-[11px]" style={{ color: '#8FA8B8' }}>
                        <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: role.color }} />
                        {perm}
                      </li>
                    ))}
                    {role.permissions.length > 4 && (
                      <li className="text-[11px]" style={{ color: role.color }}>
                        +{role.permissions.length - 4} more...
                      </li>
                    )}
                  </ul>

                  {/* Enter arrow */}
                  <div
                    className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold self-end transition-all"
                    style={{
                      color: role.color,
                      opacity: hoveredRole === role.id ? 1 : 0.5,
                    }}
                  >
                    Enter Portal <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Confirm & Launch ── */}
        {step === 'confirm' && chosen && (
          <motion.div
            key="role-confirm"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="z-10 w-full max-w-2xl px-4"
          >
            <div
              className="rounded-2xl p-8"
              style={{
                background: 'rgba(13,27,42,0.92)',
                border: `1px solid ${chosen.borderColor}`,
                boxShadow: `0 0 40px ${chosen.glowColor}, 0 20px 60px rgba(0,0,0,0.6)`,
                backdropFilter: 'blur(24px)',
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `${chosen.color}18`,
                    border: `1px solid ${chosen.color}44`,
                    color: chosen.color,
                    boxShadow: `0 0 24px ${chosen.glowColor}`,
                  }}
                >
                  {chosen.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-black" style={{ color: '#E6F1F5' }}>{chosen.title}</h2>
                    <span
                      className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${chosen.color}22`, color: chosen.color, border: `1px solid ${chosen.color}44` }}
                    >
                      {chosen.badge}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: '#8FA8B8' }}>{chosen.description}</p>
                </div>
              </div>

              {/* Access summary */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(7,17,31,0.6)', border: '1px solid rgba(27,52,72,0.8)' }}
                >
                  <p className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color: '#78909C' }}>
                    <CheckCircle2 className="w-3 h-3 inline mr-1" style={{ color: chosen.color }} />
                    Portal Access
                  </p>
                  <ul className="space-y-1.5">
                    {chosen.permissions.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-[11px]" style={{ color: '#8FA8B8' }}>
                        <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: chosen.color }} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(7,17,31,0.6)', border: '1px solid rgba(27,52,72,0.8)' }}
                >
                  <p className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color: '#78909C' }}>
                    <Lock className="w-3 h-3 inline mr-1 text-rose-400" />
                    Restricted From
                  </p>
                  {chosen.restrictedFrom.length > 0 ? (
                    <ul className="space-y-1.5">
                      {chosen.restrictedFrom.map((r) => (
                        <li key={r} className="flex items-start gap-2 text-[11px]" style={{ color: '#78909C' }}>
                          <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: '#FF4D5A' }} />
                          {r}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px]" style={{ color: '#2DD4BF' }}>✓ No restrictions — full access</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setStep('select'); setSelectedRole(null); }}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: 'rgba(27,52,72,0.5)',
                    border: '1px solid rgba(27,52,72,0.8)',
                    color: '#78909C',
                  }}
                >
                  ← Change Role
                </button>

                <button
                  onClick={handleLogin}
                  disabled={logging}
                  className="flex-[2] py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: logging
                      ? `${chosen.color}44`
                      : `linear-gradient(135deg, ${chosen.color}, ${chosen.color}bb)`,
                    border: `1px solid ${chosen.color}66`,
                    color: '#07111F',
                    boxShadow: logging ? 'none' : `0 0 20px ${chosen.glowColor}`,
                  }}
                >
                  {logging ? (
                    <>
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Launching Portal...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Launch {chosen.title} Portal
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        className="absolute bottom-5 left-0 right-0 flex justify-center z-10"
      >
        <p className="text-[10px] font-mono" style={{ color: '#1B3448' }}>
          MeetMux Control Tower · AI-Powered Supply Chain Intelligence · v2.0
        </p>
      </motion.div>
    </div>
  );
}
