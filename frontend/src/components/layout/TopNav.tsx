// MeetMux Geospatial Intelligence Platform — Top Navigation Bar v2.0
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Map, Package, AlertTriangle, Brain, BarChart3, Zap,
  Bell, MessageSquare, Search, ShieldAlert, Lightbulb,
  Radio, Shield, HeartPulse, ChevronDown, X, Award, LogOut
} from 'lucide-react';
import { cn } from '../../utils';
import { useAppStore } from '../../store/useAppStore';
import { LiveIndicator } from '../ui/SharedComponents';
import { fetchAlerts, globalSearch } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '../../hooks/useDebounce';
import { ROLE_META } from '../../pages/LoginPage';

// Primary nav (always visible)
const PRIMARY_NAV = [
  { path: '/', label: 'Overview', icon: Activity },
  { path: '/network', label: 'Live Network', icon: Map },
  { path: '/shipments', label: 'Shipments', icon: Package },
  { path: '/bottlenecks', label: 'Bottlenecks', icon: ShieldAlert },
  { path: '/predictions', label: 'Predictions', icon: Brain },
  { path: '/recommendations', label: 'Recommendations', icon: Lightbulb },
  { path: '/simulator', label: 'Simulator', icon: Zap },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/alerts', label: 'Alerts', icon: Bell },
];

// Secondary nav (in "More" dropdown)
const SECONDARY_NAV = [
  { path: '/anomaly', label: 'Anomaly Engine', icon: Brain },
  { path: '/trust', label: 'Carrier Trust', icon: Award },
  { path: '/copilot', label: 'AI Copilot', icon: MessageSquare },
  { path: '/events', label: 'Live Events', icon: Radio },
  { path: '/audit', label: 'Audit Logs', icon: Shield },
  { path: '/system-health', label: 'System Health', icon: HeartPulse },
];

const ROLES = [
  { value: 'OPERATIONS_MANAGER', label: 'Ops Manager' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'ANALYST', label: 'Analyst' },
  { value: 'VIEWER', label: 'Viewer' },
] as const;

export default function TopNav() {
  const { isStreaming, role, setRole, authUser, logout } = useAppStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: alertsData } = useQuery({
    queryKey: ['alerts-count'],
    queryFn: () => fetchAlerts(),
    refetchInterval: 15_000,
  });
  const criticalCount = alertsData?.alerts?.filter((a: Record<string, string>) => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length ?? 0;

  const { data: searchResults } = useQuery({
    queryKey: ['search', debouncedSearch],
    queryFn: () => globalSearch(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  const handleSearchSelect = useCallback((result: Record<string, string>) => {
    navigate(result.route);
    setSearchOpen(false);
    setSearchQuery('');
  }, [navigate]);

  return (
    <motion.nav
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/60"
      style={{ height: 58 }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center h-full px-4 gap-2">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 shrink-0 mr-3">
          <img
            src="/logo.png"
            alt="MeetMux Logo"
            className="h-9 w-9 rounded-xl object-contain"
            style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.5))' }}
          />
          <div className="hidden sm:block">
            <p className="text-xs font-black leading-none" style={{ color: '#22D3EE' }}>MeetMux</p>
            <p className="text-[9px] leading-none font-medium" style={{ color: '#78909C' }}>Intelligence Platform</p>
          </div>
        </NavLink>

        {/* Primary Nav Links */}
        <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar flex-1">
          {PRIMARY_NAV.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) => cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 relative',
                isActive
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-700 hover:bg-rose-100/70'
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden lg:inline">{label}</span>
                  {label === 'Alerts' && criticalCount > 0 && (
                    <span className={cn(
                      'absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center',
                      isActive ? 'bg-white text-rose-600' : 'bg-red-500 text-white'
                    )}>
                      {criticalCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* More dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => { setMoreOpen(o => !o); setRoleOpen(false); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-700 hover:bg-rose-100/70 transition-all"
            >
              More <ChevronDown className={cn('w-3 h-3 transition-transform', moreOpen && 'rotate-180')} />
            </button>
            <AnimatePresence>
              {moreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  className="absolute top-full mt-1 left-0 glass rounded-xl shadow-lg border border-white/70 py-1 min-w-40 z-10"
                  onMouseLeave={() => setMoreOpen(false)}
                >
                  {SECONDARY_NAV.map(({ path, label, icon: Icon }) => (
                    <NavLink
                      key={path}
                      to={path}
                      onClick={() => setMoreOpen(false)}
                      className={({ isActive }) => cn(
                        'flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors',
                        isActive ? 'bg-rose-100 text-rose-800' : 'text-rose-700 hover:bg-rose-50'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" /> {label}
                    </NavLink>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {/* Live Indicator */}
          {isStreaming && <LiveIndicator />}

          {/* Global Search */}
          <div className="relative">
            <button
              onClick={() => setSearchOpen(o => !o)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: '#78909C' }}
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {searchOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 w-72 rounded-xl shadow-lg overflow-hidden z-20"
                  style={{ background: 'rgba(13,27,42,0.97)', border: '1px solid #1B3448' }}
                >
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1B3448]">
                    <Search className="w-3.5 h-3.5 shrink-0" style={{ color: '#78909C' }} />
                    <input
                      ref={searchRef}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search shipments, facilities, routes…"
                      className="bg-transparent text-xs focus:outline-none flex-1"
                      style={{ color: '#E6F1F5' }}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} style={{ color: '#78909C' }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {searchResults?.results?.length > 0 && (
                    <div className="max-h-64 overflow-y-auto">
                      {searchResults.results.map((r: Record<string, string>) => (
                        <button
                          key={r.id}
                          onClick={() => handleSearchSelect(r)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors"
                          style={{ color: '#E6F1F5' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,211,238,0.07)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span className="text-[9px] font-bold uppercase px-1 py-0.5 rounded" style={{ color: '#22D3EE', background: 'rgba(34,211,238,0.12)' }}>{r.type}</span>
                          <span className="text-xs truncate" style={{ color: '#8FA8B8' }}>{r.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {debouncedSearch.length >= 2 && searchResults?.results?.length === 0 && (
                    <p className="px-3 py-3 text-xs text-center" style={{ color: '#78909C' }}>No results for "{debouncedSearch}"</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Role Badge */}
          {authUser && (
            <div
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl"
              style={{ background: 'rgba(13,27,42,0.8)', border: `1px solid ${ROLE_META[role].color}33` }}
            >
              {/* Avatar */}
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black"
                style={{
                  background: `${ROLE_META[role].color}22`,
                  color: ROLE_META[role].color,
                  border: `1px solid ${ROLE_META[role].color}44`,
                }}
              >
                {authUser.avatar}
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-[10px] font-bold" style={{ color: ROLE_META[role].color }}>
                  {ROLE_META[role].badge}
                </span>
                <span className="text-[9px]" style={{ color: '#78909C' }}>
                  {authUser.name}
                </span>
              </div>
            </div>
          )}

          {/* Logout Button */}
          {authUser && (
            <button
              onClick={() => {
                logout();
                window.location.reload();
              }}
              className="p-1.5 rounded-lg transition-all text-xs font-semibold flex items-center gap-1"
              style={{ color: '#78909C', border: '1px solid rgba(27,52,72,0.6)', background: 'rgba(13,27,42,0.6)' }}
              title="Logout"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#FF4D5A'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,77,90,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#78909C'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(27,52,72,0.6)'; }}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
