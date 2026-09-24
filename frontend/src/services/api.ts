// MeetMux Geospatial Intelligence Platform — API Service v2.0
import axios from 'axios';

const BASE = '/api/v1';
const LEGACY = '/api';

const client = axios.create({
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', 'X-User-Role': 'OPERATIONS_MANAGER' }
});

client.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err?.response?.data?.error?.message || err?.message || 'API error';
    return Promise.reject(new Error(msg));
  }
);

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export const fetchDashboard = () => client.get(`${BASE}/dashboard/summary`).then(r => r.data);

// ─── Network ───────────────────────────────────────────────────────────────────
export const fetchNetwork = (bbox?: string) =>
  client.get(`${BASE}/network`, { params: bbox ? { bbox } : undefined }).then(r => r.data);
export const fetchNodeById = (id: string) => client.get(`${BASE}/nodes/${id}`).then(r => r.data);

// ─── Bottlenecks & Graph ───────────────────────────────────────────────────────
export const fetchBottlenecks = () => client.get(`${BASE}/graph/bottlenecks`).then(r => r.data);
export const fetchGraphImpact = (nodeId: string, severity = 0.85) =>
  client.get(`${BASE}/graph/impact/${nodeId}`, { params: { severity } }).then(r => r.data);
export const fetchAlternativeRoutes = (originId: string, destId?: string) =>
  client.get(`${BASE}/graph/alternative-routes`, { params: { origin_id: originId, destination_id: destId } }).then(r => r.data);

// ─── Shipments ─────────────────────────────────────────────────────────────────
export const fetchShipments = (params?: { status?: string; priority?: string; category?: string; search?: string; page?: number; limit?: number }) =>
  client.get(`${BASE}/shipments`, { params }).then(r => r.data);
export const fetchShipmentById = (id: string) => client.get(`${BASE}/shipments/${id}`).then(r => r.data);

// ─── Signals ──────────────────────────────────────────────────────────────────
export const fetchSignals = (entityId: string) => client.get(`${BASE}/signals/${entityId}`).then(r => r.data);

// ─── ML Predictions ────────────────────────────────────────────────────────────
export const fetchPrediction = (shipmentId: string) => client.get(`${BASE}/predictions/${shipmentId}`).then(r => r.data);
export const postPredict = (payload: Record<string, unknown>) => client.post(`${BASE}/predict/delay`, payload).then(r => r.data);

// ─── Anomaly Detection ─────────────────────────────────────────────────────────
export const fetchAnomalyAnalysis = (entityId: string) => client.get(`${BASE}/anomaly/${entityId}`).then(r => r.data);

// ─── Trust / Reliability ───────────────────────────────────────────────────────
export const fetchCarrierReliability = () => client.get(`${BASE}/trust/carriers`).then(r => r.data);
export const fetchEntityReliability = (entityId: string) => client.get(`${BASE}/trust/${entityId}`).then(r => r.data);

// ─── Matching ──────────────────────────────────────────────────────────────────
export const fetchSimilarShipments = (shipmentId: string, topK = 5) =>
  client.get(`${BASE}/matching/shipments/${shipmentId}`, { params: { top_k: topK } }).then(r => r.data);
export const fetchTwinFacilities = (nodeId: string, topK = 4) =>
  client.get(`${BASE}/matching/facilities/${nodeId}`, { params: { top_k: topK } }).then(r => r.data);

// ─── Simulation ────────────────────────────────────────────────────────────────
export const runSimulation = (scenarioType: string, targetId: string, severity: number) =>
  client.post(`${BASE}/simulation`, { scenario_type: scenarioType, target_node_or_route_id: targetId, severity }).then(r => r.data);

// ─── Recommendations ───────────────────────────────────────────────────────────
export const fetchRecommendations = () => client.get(`${BASE}/recommendations`).then(r => r.data);
export const approveRecommendation = (id: string, operatorId?: string, notes?: string) =>
  client.post(`${BASE}/recommendations/${id}/approve`, null, { params: { operator_id: operatorId || 'OPERATOR_ADMIN', notes: notes || '' } }).then(r => r.data);
export const rejectRecommendation = (id: string, operatorId?: string, reason?: string) =>
  client.post(`${BASE}/recommendations/${id}/reject`, null, { params: { operator_id: operatorId || 'OPERATOR_ADMIN', reason: reason || '' } }).then(r => r.data);

// ─── Alerts ────────────────────────────────────────────────────────────────────
export const fetchAlerts = (params?: { severity?: string; status?: string }) =>
  client.get(`${BASE}/alerts`, { params }).then(r => r.data);
export const patchAlertStatus = (id: string, status: string) =>
  client.patch(`${BASE}/alerts/${id}`, null, { params: { status } }).then(r => r.data);

// ─── Analytics ─────────────────────────────────────────────────────────────────
export const fetchAnalyticsDelays = () => client.get(`${BASE}/analytics/delays`).then(r => r.data);
export const fetchBusinessImpact = (costPerHour: number, penaltyPerBreach: number) =>
  client.get(`${BASE}/analytics/business-impact`, { params: { cost_per_hour: costPerHour, penalty_per_breach: penaltyPerBreach } }).then(r => r.data);

// ─── Copilot ───────────────────────────────────────────────────────────────────
export const postCopilotQuery = (query: string) =>
  client.post(`${BASE}/copilot/query`, { query }).then(r => r.data);

// ─── Audit Logs ────────────────────────────────────────────────────────────────
export const fetchAuditLogs = (limit = 50, action?: string) =>
  client.get(`${BASE}/audit-logs`, { params: { limit, action } }).then(r => r.data);

// ─── Events Feed ───────────────────────────────────────────────────────────────
export const fetchRecentEvents = (limit = 30) =>
  client.get(`${BASE}/events/recent`, { params: { limit } }).then(r => r.data);

// ─── System Health ─────────────────────────────────────────────────────────────
export const fetchSystemHealth = () => client.get(`${BASE}/system/health`).then(r => r.data);

// ─── Search ────────────────────────────────────────────────────────────────────
export const globalSearch = (q: string) => client.get(`${BASE}/search`, { params: { q } }).then(r => r.data);

// ─── Demo Loader ───────────────────────────────────────────────────────────────
export const loadDemoNetwork = () => client.post(`${LEGACY}/demo/load`).then(r => r.data);

// ─── Backward-Compatibility Aliases ──────────────────────────────────────────
export const fetchDashboardSummary = fetchDashboard;
export const fetchAffectedNodes = fetchGraphImpact;
