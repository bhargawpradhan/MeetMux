// MeetMux — App Router v2.0 — Geospatial Intelligence Platform
import React, { Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import TopNav from './components/layout/TopNav';
import { useTelemetryStream } from './hooks/useTelemetryStream';
import { Skeleton } from './components/ui/SharedComponents';
import IntroSplash from './components/IntroSplash';
import RadialOutwardParticles from './components/3d/RadialOutwardParticles';
import LoginPage, { ROLE_NAV_ACCESS } from './pages/LoginPage';
import { useAppStore } from './store/useAppStore';

// ─── Lazy-loaded Pages ────────────────────────────────────────────────────────
const OverviewPage         = React.lazy(() => import('./pages/Overview'));
const NetworkMapPage       = React.lazy(() => import('./pages/NetworkMap'));
const ShipmentsPage        = React.lazy(() => import('./pages/Shipments'));
const BottlenecksPage      = React.lazy(() => import('./pages/Bottlenecks'));
const PredictionsPage      = React.lazy(() => import('./pages/Predictions'));
const SimulatorPage        = React.lazy(() => import('./pages/Simulator'));
const AnalyticsPage        = React.lazy(() => import('./pages/Analytics'));
const AlertsPage           = React.lazy(() => import('./pages/Alerts'));
const CopilotPage          = React.lazy(() => import('./pages/Copilot'));
const RecommendationsPage  = React.lazy(() => import('./pages/Recommendations'));
const SystemHealthPage     = React.lazy(() => import('./pages/SystemHealth'));
const AuditLogsPage        = React.lazy(() => import('./pages/AuditLogs'));
const LiveEventsPage       = React.lazy(() => import('./pages/LiveEvents'));
const AnomalyDetectionPage = React.lazy(() => import('./pages/AnomalyDetection'));
const TrustScoresPage      = React.lazy(() => import('./pages/TrustScores'));

function PageLoader() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48 rounded-xl" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

// ── Role-gated route wrapper ──────────────────────────────────────────────────
function RoleRoute({ path, element }: { path: string; element: React.ReactNode }) {
  const { role } = useAppStore();
  const allowed = ROLE_NAV_ACCESS[role] ?? [];
  if (!allowed.includes(path)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8"
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-2"
          style={{ background: 'rgba(255,77,90,0.1)', border: '1px solid rgba(255,77,90,0.3)' }}
        >
          🔒
        </div>
        <h2 className="text-xl font-black" style={{ color: '#E6F1F5' }}>Access Restricted</h2>
        <p className="text-sm max-w-sm" style={{ color: '#78909C' }}>
          Your current role (<span style={{ color: '#22D3EE' }}>{role.replace('_', ' ')}</span>) does not have
          permission to access this module. Contact your administrator to request access.
        </p>
        <a
          href="/"
          className="mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)', color: '#22D3EE' }}
        >
          ← Back to Overview
        </a>
      </motion.div>
    );
  }
  return <>{element}</>;
}

function AnimatedRoutes() {
  const location = useLocation();
  const { role } = useAppStore();
  useTelemetryStream();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/"                element={<RoleRoute path="/"                element={<OverviewPage />} />} />
          <Route path="/network"         element={<RoleRoute path="/network"         element={<NetworkMapPage />} />} />
          <Route path="/shipments"       element={<RoleRoute path="/shipments"       element={<ShipmentsPage />} />} />
          <Route path="/bottlenecks"     element={<RoleRoute path="/bottlenecks"     element={<BottlenecksPage />} />} />
          <Route path="/predictions"     element={<RoleRoute path="/predictions"     element={<PredictionsPage />} />} />
          <Route path="/simulator"       element={<RoleRoute path="/simulator"       element={<SimulatorPage />} />} />
          <Route path="/analytics"       element={<RoleRoute path="/analytics"       element={<AnalyticsPage />} />} />
          <Route path="/alerts"          element={<RoleRoute path="/alerts"          element={<AlertsPage />} />} />
          <Route path="/copilot"         element={<RoleRoute path="/copilot"         element={<CopilotPage />} />} />
          <Route path="/recommendations" element={<RoleRoute path="/recommendations" element={<RecommendationsPage />} />} />
          <Route path="/events"          element={<RoleRoute path="/events"          element={<LiveEventsPage />} />} />
          <Route path="/anomaly"         element={<RoleRoute path="/anomaly"         element={<AnomalyDetectionPage />} />} />
          <Route path="/trust"           element={<RoleRoute path="/trust"           element={<TrustScoresPage />} />} />
          <Route path="/system-health"   element={<RoleRoute path="/system-health"   element={<SystemHealthPage />} />} />
          <Route path="/audit"           element={<RoleRoute path="/audit"           element={<AuditLogsPage />} />} />
          <Route path="*"               element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

export default function App() {
  const { isAuthenticated, login } = useAppStore();
  const [showIntro, setShowIntro] = useState(true);
  const [showApp, setShowApp] = useState(false);
  const [startRoute, setStartRoute] = useState('/');

  // After intro completes → show login
  const handleIntroComplete = () => setShowIntro(false);

  // After login → show main app
  const handleLogin = (route: string) => {
    setStartRoute(route);
    setShowApp(true);
  };

  return (
    <BrowserRouter>
      {/* ── Cinematic Intro Splash (shown once) ── */}
      <AnimatePresence>
        {showIntro && <IntroSplash onComplete={handleIntroComplete} />}
      </AnimatePresence>

      {/* ── Login Page (shown after intro if not authenticated) ── */}
      <AnimatePresence>
        {!showIntro && !showApp && (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.45 }}
            className="fixed inset-0 z-50"
          >
            <LoginPage onLogin={handleLogin} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Radial particles (background, always) ── */}
      <RadialOutwardParticles />

      {/* ── Main App ── */}
      <div
        className="relative z-10 min-h-screen flex flex-col"
        style={{
          opacity: showApp ? 1 : 0,
          transform: showApp ? 'scale(1)' : 'scale(0.97)',
          transition: 'opacity 0.55s ease 0.1s, transform 0.55s ease 0.1s',
          pointerEvents: showApp ? 'all' : 'none',
        }}
      >
        <TopNav />
        <main className="flex-1 mt-[58px]">
          <AnimatedRoutes />
        </main>
      </div>
    </BrowserRouter>
  );
}
