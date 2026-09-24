// MeetMux Control Tower — WebSocket Telemetry Hook
import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { TelemetryBatch } from '../types';

const getWsUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // If running via dev server on 5175, Vite proxies /ws to backend
  return `${protocol}//${window.location.host}/ws/telemetry`;
};

export function useTelemetryStream() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setIsStreaming, upsertTelemetry, setNetworkStats } = useAppStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setIsStreaming(true);
    };

    ws.onmessage = (evt) => {
      try {
        const data: TelemetryBatch = JSON.parse(evt.data);
        if (data.type === 'TELEMETRY_BATCH') {
          data.events.forEach(upsertTelemetry);
          setNetworkStats(data.network_stats);
        }
      } catch (_) {}
    };

    ws.onclose = () => {
      setIsStreaming(false);
      wsRef.current = null;
      // Auto-reconnect after 5s
      reconnectRef.current = setTimeout(connect, 5000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [setIsStreaming, upsertTelemetry, setNetworkStats]);

  const disconnect = useCallback(() => {
    if (reconnectRef.current) clearTimeout(reconnectRef.current);
    wsRef.current?.close();
    wsRef.current = null;
    setIsStreaming(false);
  }, [setIsStreaming]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { connect, disconnect };
}
