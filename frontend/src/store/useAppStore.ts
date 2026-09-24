// MeetMux Control Tower — Zustand Global Store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Alert, TelemetryEvent, GraphEngineStatus } from '../types';

export type UserRole = 'OPERATIONS_MANAGER' | 'ADMIN' | 'ANALYST' | 'VIEWER';

export interface AuthUser {
  role: UserRole;
  name: string;
  avatar: string; // initials
  loginTime: string;
}

interface AppStore {
  // Auth
  authUser: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;

  // Role (legacy alias — kept for backward compat)
  role: UserRole;
  setRole: (role: UserRole) => void;

  // Live Telemetry
  isStreaming: boolean;
  telemetryEvents: Map<string, TelemetryEvent>;
  setIsStreaming: (v: boolean) => void;
  upsertTelemetry: (event: TelemetryEvent) => void;
  networkStats: { active_shipments: number; avg_congestion: number } | null;
  setNetworkStats: (s: { active_shipments: number; avg_congestion: number }) => void;

  // Alerts
  activeAlerts: Alert[];
  setActiveAlerts: (alerts: Alert[]) => void;
  dismissAlert: (id: string) => void;

  // Selected Entity (Map)
  selectedNodeId: string | null;
  selectedShipmentId: string | null;
  setSelectedNode: (id: string | null) => void;
  setSelectedShipment: (id: string | null) => void;

  // Graph engine status
  graphEngineStatus: GraphEngineStatus | null;
  setGraphEngineStatus: (s: GraphEngineStatus) => void;

  // Demo loading
  isDemoLoading: boolean;
  setIsDemoLoading: (v: boolean) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Auth
      authUser: null,
      isAuthenticated: false,
      login: (user) => set({ authUser: user, isAuthenticated: true, role: user.role }),
      logout: () => set({ authUser: null, isAuthenticated: false, role: 'VIEWER' }),

      // Role
      role: 'OPERATIONS_MANAGER',
      setRole: (role) => set({ role }),

      isStreaming: false,
      telemetryEvents: new Map(),
      setIsStreaming: (isStreaming) => set({ isStreaming }),
      upsertTelemetry: (event) =>
        set((state) => {
          const newMap = new Map(state.telemetryEvents);
          newMap.set(event.shipment_id, event);
          return { telemetryEvents: newMap };
        }),
      networkStats: null,
      setNetworkStats: (networkStats) => set({ networkStats }),

      activeAlerts: [],
      setActiveAlerts: (activeAlerts) => set({ activeAlerts }),
      dismissAlert: (id) =>
        set((state) => ({
          activeAlerts: state.activeAlerts.filter((a) => a.id !== id),
        })),

      selectedNodeId: null,
      selectedShipmentId: null,
      setSelectedNode: (selectedNodeId) => set({ selectedNodeId }),
      setSelectedShipment: (selectedShipmentId) => set({ selectedShipmentId }),

      graphEngineStatus: null,
      setGraphEngineStatus: (graphEngineStatus) => set({ graphEngineStatus }),

      isDemoLoading: false,
      setIsDemoLoading: (isDemoLoading) => set({ isDemoLoading }),
    }),
    {
      name: 'meetmux-auth',
      partialize: (state) => ({
        authUser: state.authUser,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
    }
  )
);
