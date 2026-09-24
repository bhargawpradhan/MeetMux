"""
MeetMux Control Tower — Pydantic Schemas
Defines request and response schemas with strict Pydantic v2 validation.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class NodeSchema(BaseModel):
    id: str
    name: str
    type: str  # Supplier, Warehouse, DistributionCenter, Port, Customer
    city: str
    state: str
    latitude: float
    longitude: float
    capacity: int
    current_load: int
    utilization: float
    risk_score: int
    cost_per_hour_delay: float
    operating_status: str

class RouteSchema(BaseModel):
    id: str
    origin_id: str
    destination_id: str
    origin_name: str
    destination_name: str
    distance_km: float
    expected_time_hours: float
    actual_time_hours: float
    capacity_vehicles: int
    traffic_level: str
    historical_delay_rate: float
    risk_score: int
    cost_per_km: float
    status: str

class ShipmentSchema(BaseModel):
    id: str
    tracking_number: str
    origin_id: str
    destination_id: str
    origin_name: str
    destination_name: str
    route_id: str
    current_node_id: str
    status: str
    priority: str
    category: str
    carrier_name: str
    shipment_distance: float
    current_speed: float
    average_speed: float
    temperature: float
    humidity: float
    route_congestion: float
    historical_delay_rate: float
    number_of_stops: int
    warehouse_load: float
    vehicle_age: int
    previous_route_delays: int
    time_of_day: int
    day_of_week: int
    weather_severity: int
    value_inr: float
    latitude: float
    longitude: float
    dispatch_timestamp: str
    promised_delivery_timestamp: str
    estimated_delivery_timestamp: str

class PredictRequest(BaseModel):
    shipment_id: Optional[str] = "SHP-CUSTOM"
    shipment_distance: float = 450.0
    current_speed: float = 35.0
    average_speed: float = 50.0
    temperature: float = 24.0
    humidity: float = 65.0
    route_congestion: float = 0.65
    historical_delay_rate: float = 0.25
    number_of_stops: int = 3
    warehouse_load: float = 0.85
    vehicle_age: int = 4
    previous_route_delays: int = 2
    time_of_day: int = 14
    day_of_week: int = 2
    weather_severity: int = 5
    priority: str = "EXPRESS"
    value_inr: float = 1200000.0

class RiskFactorSchema(BaseModel):
    feature: str
    display_name: str
    value: float
    impact: float
    direction: str

class PredictResponse(BaseModel):
    shipment_id: str
    delay_probability: float
    risk_level: str
    predicted_delay_hours: float
    sla_breach_probability: float
    estimated_cost_impact: float
    explanation_text: str
    counterfactual_hint: str
    top_risk_factors: List[RiskFactorSchema]

class BottleneckItemSchema(BaseModel):
    node_id: str
    node_name: str
    node_type: str
    city: str
    latitude: float
    longitude: float
    bottleneck_score: float
    utilization: float
    risk_score: int
    operating_status: str
    affected_routes_count: int
    affected_shipments_count: int
    downstream_customers_count: int
    estimated_inr_exposure: float
    centrality_rank: int

class PropagationRequest(BaseModel):
    node_id: str
    failure_severity: float = 0.85  # 0 to 1 scale

class HopImpactSchema(BaseModel):
    hop_level: int
    nodes: List[Dict[str, Any]]
    affected_shipments_count: int
    affected_customers_count: int
    estimated_time_to_impact_hours: float
    estimated_financial_loss_inr: float

class PropagationResponse(BaseModel):
    failed_node_id: str
    failed_node_name: str
    total_affected_nodes: int
    total_affected_shipments: int
    total_affected_customers: int
    total_inr_exposure: float
    hops: List[HopImpactSchema]

class SimulationRequest(BaseModel):
    scenario_type: str  # warehouse_failure, port_closure, route_congestion, weather_event, demand_surge
    target_node_or_route_id: str
    severity: float = 0.75

class ScenarioResultSchema(BaseModel):
    scenario_name: str
    scenario_type: str
    affected_shipments_count: int
    affected_routes_count: int
    affected_nodes_count: int
    avg_delay_risk_before: float
    avg_delay_risk_after: float
    critical_bottlenecks_before: int
    critical_bottlenecks_after: int
    predicted_sla_breaches_before: int
    predicted_sla_breaches_after: int
    financial_cost_impact_inr: float

class RecommendationSchema(BaseModel):
    id: str
    title: str
    action_type: str
    target_entity_id: str
    target_entity_name: str
    reason: str
    expected_delay_reduction_hours: float
    expected_savings_inr: float
    confidence_score: float
    effort_level: str  # LOW, MEDIUM, HIGH
    alternative_route: Optional[Dict[str, Any]] = None

class CopilotQueryRequest(BaseModel):
    query: str

class CopilotQueryResponse(BaseModel):
    query: str
    intent: str
    answer_text: str
    structured_cards: Optional[List[Dict[str, Any]]] = None
    suggested_actions: Optional[List[str]] = None

class AlertSchema(BaseModel):
    id: str
    severity: str  # CRITICAL, HIGH, MEDIUM, INFO
    timestamp: str
    entity_id: str
    entity_name: str
    reason: str
    recommended_investigation: str
    financial_exposure_inr: float
    status: str  # ACTIVE, ACKNOWLEDGED, RESOLVED, SNOOZED
