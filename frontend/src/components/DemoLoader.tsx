// MeetMux Control Tower — Demo Loader Dialog
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, XCircle, Rocket } from 'lucide-react';
import { loadDemoNetwork } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../utils';

const DEMO_STEPS = [
  'Generating 67 supply-chain nodes across 9 Indian metros...',
  'Building 164 multi-modal route corridors...',
  'Seeding 650+ shipments with realistic telemetry...',
  'Loading NetworkX graph engine...',
  'Training XGBoost delay prediction model...',
  'Computing SHAP feature explanations...',
  'Running bottleneck centrality analysis...',
  'Populating live telemetry stream...',
  'Dashboard ready. Welcome to MeetMux Control Tower.',
];

export default function DemoLoader({ onClose }: { onClose?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<Array<{ step: string; status: string; metrics?: { f1_score: number; roc_auc: number; [key: string]: unknown } }>>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setIsDemoLoading } = useAppStore();

  const handleLoad = async () => {
    setLoading(true);
    setDone(false);
    setError(null);
    setIsDemoLoading(true);
    setSteps([]);

    // Animate through steps while calling API
    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < DEMO_STEPS.length - 1) {
        stepIdx++;
        setSteps(prev => [...prev, { step: DEMO_STEPS[stepIdx - 1], status: 'OK' }]);
      }
    }, 600);

    try {
      const result = await loadDemoNetwork();
      clearInterval(interval);
      setSteps(result.steps);
      setDone(true);
    } catch (e: unknown) {
      clearInterval(interval);
      setError('Failed to load demo network. Ensure the backend is running on port 8000.');
    } finally {
      setLoading(false);
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.90, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.90 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="glass-panel w-full max-w-md"
        role="dialog"
        aria-labelledby="demo-dialog-title"
        aria-modal="true"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-pink-glass">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 id="demo-dialog-title" className="text-lg font-bold text-rose-900">Load Demo Network</h2>
            <p className="text-xs text-rose-600/70">Seeds the MeetMux India supply-chain simulation</p>
          </div>
        </div>

        {!loading && !done && !error && (
          <div className="mb-5 text-sm text-rose-700/80 leading-relaxed">
            This will generate <strong>67 nodes</strong>, <strong>164 routes</strong>, and <strong>650+ shipments</strong> across 9 Indian metros, train the XGBoost prediction model, and start the live telemetry stream.
            <p className="mt-2 text-xs text-rose-500 italic">All data is synthetic. Labeled "Demo Data" throughout the app.</p>
          </div>
        )}

        {/* Steps list */}
        <AnimatePresence>
          {steps.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {steps.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-2 text-xs"
                >
                  {s.status === 'OK' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  ) : s.status === 'ERROR' ? (
                    <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                  ) : (
                    <Loader2 className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0 animate-spin" />
                  )}
                  <span className={cn('text-rose-700', s.status === 'ERROR' && 'text-red-600')}>
                    {s.step}
                    {s.status === 'OK' && s.metrics && (
                      <span className="ml-1 text-emerald-600">
                        (F1: {s.metrics.f1_score}, AUC: {s.metrics.roc_auc})
                      </span>
                    )}
                  </span>
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-xs text-rose-500"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Processing…
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4"
          >
            <CheckCircle2 className="w-4 h-4" />
            Demo network loaded! The storyline is live.
          </motion.div>
        )}

        <div className="flex items-center gap-2 mt-2">
          {!done && (
            <button
              onClick={handleLoad}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-semibold shadow-pink-glass hover:shadow-pink-glass-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              {loading ? 'Loading…' : 'Load Demo Network'}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
          >
            {done ? 'Continue' : 'Cancel'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
