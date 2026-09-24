// MeetMux Control Tower — Type Definitions

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ShipmentStatus = 'IN_TRANSIT' | 'AT_RISK' | 'DELAYED' | 'DELIVERED' | 'PENDING';
export type NodeType = 'Supplier' | 'Warehouse' | 'DistributionCenter' | 'Port' | 'Customer';
export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'SNOOZED';

export interface Node {
  id: string;
  name: string;
  type: NodeType;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  capacity: number;
  current_load: number;
  utilization: number;
  risk_score: number;
  cost_per_hour_delay: number;
  operating_status: string;
}

export interface Route {
  id: string;
  origin_id: string;
  destination_id: string;
  origin_name: string;
  destination_name: string;
  distance_km: number;
  expected_time_hours: number;
  actual_time_hours: number;
  capacity_vehicles: number;
  traffic_level: string;
  historical_delay_rate: number;
  risk_score: number;
  cost_per_km: number;
  status: string;
}

export interface Shipment {
  id: string;
  tracking_number: string;
  origin_id: string;
  destination_id: string;
  origin_name: string;
  destination_name: string;
  route_id: string;
  current_node_id: string;
  status: ShipmentStatus;
  priority: string;
  category: string;
  carrier_name: string;
  shipment_distance: number;
  current_speed: number;
  average_speed: number;
  temperature: number;
  humidity: number;
  route_congestion: number;
  historical_delay_rate: number;
  number_of_stops: number;
  warehouse_load: number;
  vehicle_age: number;
  previous_route_delays: number;
  time_of_day: number;
  day_of_week: number;
  weather_severity: number;
  value_inr: number;
  latitude: number;
  longitude: number;
  dispatch_timestamp: string;
  promised_delivery_timestamp: string;
  estimated_delivery_timestamp: string;
}

export interface RiskFactor {
  feature: string;
  display_name: string;
  value: number;
  impact: number;
  direction: 'INCREASES_RISK' | 'REDUCES_RISK';
}

export interface Prediction {
  shipment_id: string;
  delay_probability: number;
  risk_level: RiskLevel;
  predicted_delay_hours: number;
  sla_breach_probability: number;
  estimated_cost_impact: number;
  explanation_text: string;
  counterfactual_hint: string;
  top_risk_factors: RiskFactor[];
}

export interface Bottleneck {
  node_id: string;
  node_name: string;
  node_type: string;
  city: string;
  latitude: number;
  longitude: number;
  bottleneck_score: number;
  utilization: number;
  risk_score: number;
  operating_status: string;
  affected_routes_count: number;
  affected_shipments_count: number;
  downstream_customers_count: number;
  estimated_inr_exposure: number;
  centrality_rank: number;
}

export interface HopImpact {
  hop_level: number;
  nodes: Node[];
  affected_shipments_count: number;
  affected_customers_count: number;
  estimated_time_to_impact_hours: number;
  estimated_financial_loss_inr: number;
}

export interface PropagationResult {
  failed_node_id: string;
  failed_node_name: string;
  total_affected_nodes: number;
  total_affected_shipments: number;
  total_affected_customers: number;
  total_inr_exposure: number;
  hops: HopImpact[];
}

export interface ScenarioResult {
  disclaimer: string;
  scenario_name: string;
  scenario_type: string;
  target_entity_id: string;
  target_entity_name: string;
  severity: number;
  affected_shipments_count: number;
  affected_routes_count: number;
  affected_nodes_count: number;
  avg_delay_risk_before: number;
  avg_delay_risk_after: number;
  critical_bottlenecks_before: number;
  critical_bottlenecks_after: number;
  predicted_sla_breaches_before: number;
  predicted_sla_breaches_after: number;
  financial_cost_impact_inr: number;
}

export interface Recommendation {
  id: string;
  title: string;
  action_type: string;
  target_entity_id: string;
  target_entity_name: string;
  reason: string;
  expected_delay_reduction_hours: number;
  expected_savings_inr: number;
  confidence_score: number;
  effort_level: 'LOW' | 'MEDIUM' | 'HIGH';
  alternative_route?: Record<string, unknown> | null;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  timestamp: string;
  entity_id: string;
  entity_name: string;
  reason: string;
  recommended_investigation: string;
  financial_exposure_inr: number;
  status: AlertStatus;
}

export interface CopilotCard {
  card_type: string;
  title: string;
  [key: string]: unknown;
}

export interface CopilotResponse {
  query: string;
  intent: string;
  answer_text: string;
  structured_cards?: CopilotCard[];
  suggested_actions?: string[];
}

export interface DashboardKPIs {
  total_shipments: number;
  at_risk_shipments: number;
  high_risk_routes: number;
  critical_bottlenecks: number;
  network_risk_score: number;
  estimated_delay_hours: number;
  estimated_cost_of_delay_inr: number;
  predicted_sla_breaches: number;
  estimated_savings_inr: number;
}

export interface GraphEngineStatus {
  neo4j_connected: boolean;
  engine: string;
  nodes_count: number;
  edges_count: number;
  shipments_count: number;
}

export interface TelemetryEvent {
  shipment_id: string;
  latitude: number;
  longitude: number;
  current_speed: number;
  temperature: number;
  route_congestion: number;
  status: ShipmentStatus;
  delay_probability: number;
  timestamp: string;
}

export interface TelemetryBatch {
  type: 'TELEMETRY_BATCH';
  events: TelemetryEvent[];
  network_stats: {
    active_shipments: number;
    avg_congestion: number;
    timestamp: string;
  };
}
