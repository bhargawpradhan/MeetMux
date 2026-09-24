// MeetMux — Live Events Feed Page
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Radio, Zap, AlertTriangle, Brain, BarChart3, CheckCircle2, XCircle, Info } from 'lucide-react';
import { fetchRecentEvents } from '../services/api';
import { DemoBadge } from '../components/ui/SharedComponents';
import { pageVariants, fadeUpItem } from '../motion/variants';
import { timeAgo, cn } from '../utils';

const EVENT_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  SHIPMENT_DELAYED:        { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-red-600 bg-red-50 border-red-200', label: 'Delay' },
  SHIPMENT_UPDATED:        { icon: <Zap className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Update' },
  SHIPMENT_STARTED:        { icon: <Zap className="w-3.5 h-3.5" />, color: 'text-green-600 bg-green-50 border-green-200', label: 'Started' },
  ROUTE_CONGESTED:         { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-orange-600 bg-orange-50 border-orange-200', label: 'Congestion' },
  WAREHOUSE_OVERLOADED:    { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-red-700 bg-red-50 border-red-200', label: 'Overload' },
  BOTTLENECK_DETECTED:     { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'Bottleneck' },
  ANOMALY_DETECTED:        { icon: <Brain className="w-3.5 h-3.5" />, color: 'text-purple-600 bg-purple-50 border-purple-200', label: 'Anomaly' },
  RISK_CHANGED:            { icon: <BarChart3 className="w-3.5 h-3.5" />, color: 'text-rose-600 bg-rose-50 border-rose-200', label: 'Risk' },
  SIMULATION_STARTED:      { icon: <Zap className="w-3.5 h-3.5" />, color: 'text-indigo-600 bg-indigo-50 border-indigo-200', label: 'Simulation' },
  ALERT_CREATED:           { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-red-600 bg-red-50 border-red-200', label: 'Alert' },
  RECOMMENDATION_APPROVED: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-green-600 bg-green-50 border-green-200', label: 'Approved' },
  RECOMMENDATION_REJECTED: { icon: <XCircle className="w-3.5 h-3.5" />, color: 'text-red-600 bg-red-50 border-red-200', label: 'Rejected' },
  DECISION_RECORDED:       { icon: <Info className="w-3.5 h-3.5" />, color: 'text-slate-600 bg-slate-50 border-slate-200', label: 'Decision' },
};

const DEFAULT_META = { icon: <Info className="w-3.5 h-3.5" />, color: 'text-rose-600 bg-rose-50 border-rose-200', label: 'Event' };

function EventRow({ event }: { event: Record<string, any> }) {
  const meta = EVENT_META[event.event_type] ?? DEFAULT_META;
  const isCritical = event.severity === 'CRITICAL';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={cn('flex items-start gap-3 px-4 py-3 border-b border-rose-50 hover:bg-white/40 transition-colors', isCritical && 'bg-red-50/40')}
    >
      {/* Timestamp */}
      <span className="text-[10px] font-mono text-rose-400/70 shrink-0 w-16 pt-0.5">
        {event.timestamp ? new Date(event.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '—'}
      </span>

      {/* Badge */}
      <span className={cn('flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0', meta.color)}>
        {meta.icon} {meta.label}
      </span>

      {/* Entity */}
      <span className="text-xs font-mono text-rose-800 shrink-0">{event.entity_id}</span>

      {/* Description */}
      <span className="text-xs text-rose-700/80 flex-1 truncate">
        {event.payload?.description ||
          (event.payload?.scenario_type ? `Scenario: ${event.payload.scenario_type}` : '') ||
          (event.payload?.title ? event.payload.title : '') ||
          event.event_type.replace(/_/g, ' ')}
      </span>

      {/* Time ago */}
      <span className="text-[10px] text-rose-400/60 shrink-0">{event.timestamp ? timeAgo(event.timestamp) : ''}</span>
    </motion.div>
  );
}

export default function LiveEventsPage() {
  const [wsEvents, setWsEvents] = useState<Record<string, any>[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'live' | 'disconnected'>('connecting');

  // Poll REST for recent events
  const { data } = useQuery({
    queryKey: ['recent-events'],
    queryFn: () => fetchRecentEvents(50),
    refetchInterval: 5000,
  });

  // WebSocket real-time events
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/events`);
    wsRef.current = ws;

    ws.onopen = () => setWsStatus('live');
    ws.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data);
        setWsEvents(prev => [event, ...prev].slice(0, 100));
      } catch {}
    };
    ws.onclose = () => setWsStatus('disconnected');
    ws.onerror = () => setWsStatus('disconnected');

    return () => ws.close();
  }, []);

  // Merge WS events with REST events (deduplicated by id)
  const restEvents: Record<string, any>[] = data?.events ?? [];
  const allEventsMap = new Map<string, Record<string, any>>();
  [...wsEvents, ...restEvents].forEach(e => {
    if (!allEventsMap.has(e.id ?? e.timestamp)) allEventsMap.set(e.id ?? e.timestamp, e);
  });
  const merged = Array.from(allEventsMap.values()).slice(0, 80);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Radio className="w-5 h-5 text-rose-600" />
          <div>
            <h1 className="text-xl font-bold text-rose-900">Live Events</h1>
            <p className="text-xs text-rose-600/60">Real-time operational event stream · <DemoBadge /></p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={cn('w-2 h-2 rounded-full', wsStatus === 'live' ? 'bg-green-500 animate-pulse' : wsStatus === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-red-400')} />
          <span className="text-rose-600/70 capitalize">WebSocket: {wsStatus}</span>
          <span className="text-rose-400/60 ml-2">{merged.length} events</span>
        </div>
      </div>

      {/* Event type legend */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {Object.entries(EVENT_META).slice(0, 8).map(([type, meta]) => (
          <span key={type} className={cn('flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border', meta.color)}>
            {meta.icon} {meta.label}
          </span>
        ))}
      </div>

      {/* Events feed */}
      <div className="glass-card overflow-hidden">
        {/* Column headers */}
        <div className="flex items-center gap-3 px-4 py-2 bg-rose-50/60 border-b border-rose-100 text-[10px] font-semibold text-rose-500 uppercase tracking-wider">
          <span className="w-16 shrink-0">Time</span>
          <span className="w-20 shrink-0">Type</span>
          <span className="w-28 shrink-0">Entity</span>
          <span className="flex-1">Description</span>
          <span className="w-14 shrink-0 text-right">Age</span>
        </div>

        <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
          <AnimatePresence initial={false}>
            {merged.length === 0 ? (
              <div className="text-center py-16 text-rose-400/60">
                <Radio className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Waiting for live events…</p>
                <p className="text-xs mt-1">Trigger actions (simulations, predictions) to see events appear here.</p>
              </div>
            ) : (
              merged.map((e) => <EventRow key={e.id ?? e.timestamp} event={e} />)
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
