# MeetMux Control Tower — API Reference

All endpoints return JSON and validate requests via Pydantic v2. Interactive Swagger documentation is available at `http://localhost:8000/api/docs`.

---

## 1. Dashboard & Operations Summary

### `GET /api/dashboard/summary`
Returns high-level KPI cards and graph engine status.
- **Response**:
```json
{
  "graph_engine_status": {
    "neo4j_connected": false,
    "engine": "NetworkX In-Memory Graph Engine",
    "nodes_count": 67,
    "edges_count": 164,
    "shipments_count": 650
  },
  "demo_data": true,
  "kpis": {
    "total_shipments": 650,
    "at_risk_shipments": 84,
    "high_risk_routes": 18,
    "critical_bottlenecks": 4,
    "network_risk_score": 72,
    "estimated_delay_hours": 4.1,
    "estimated_cost_of_delay_inr": 4580000.0,
    "predicted_sla_breaches": 12,
    "estimated_savings_inr": 2355000.0
  }
}
```

---

## 2. Machine Learning Predictions & Explainability

### `POST /api/predict/delay`
Runs XGBoost inference and SHAP explainability on a shipment payload.
- **Request Body**:
```json
{
  "shipment_id": "SHP-1024",
  "shipment_distance": 1420.0,
  "current_speed": 18.0,
  "average_speed": 42.0,
  "temperature": 24.5,
  "humidity": 78.0,
  "route_congestion": 0.92,
  "historical_delay_rate": 0.55,
  "number_of_stops": 5,
  "warehouse_load": 0.94,
  "vehicle_age": 7,
  "previous_route_delays": 4,
  "time_of_day": 14,
  "day_of_week": 2,
  "weather_severity": 8,
  "priority": "CRITICAL_SLA",
  "value_inr": 4500000.0
}
```
- **Response**:
```json
{
  "shipment_id": "SHP-1024",
  "delay_probability": 0.8124,
  "risk_level": "CRITICAL",
  "predicted_delay_hours": 6.8,
  "sla_breach_probability": 0.87,
  "estimated_cost_impact": 185000.0,
  "explanation_text": "Risk driven primarily by Route Congestion, Warehouse Load. Current warehouse load and route congestion are contributing heavily to predicted delay.",
  "counterfactual_hint": "Optimizing hub load by 15% and rerouting via secondary arterial corridor lowers predicted delay risk to ~28%.",
  "top_risk_factors": [
    {"feature": "route_congestion", "display_name": "Route Congestion", "value": 0.92, "impact": 0.28, "direction": "INCREASES_RISK"},
    {"feature": "warehouse_load", "display_name": "Warehouse Load", "value": 0.94, "impact": 0.22, "direction": "INCREASES_RISK"}
  ]
}
```

### `GET /api/predictions/{shipment_id}`
Returns cached or real-time inference for a specific shipment.

---

## 3. Graph Intelligence & Bottlenecks

### `GET /api/graph/bottlenecks`
Returns 0–100 bottleneck scoring, betweenness centrality, and ₹ financial exposure across all facilities.

### `GET /api/graph/affected-nodes/{node_id}?severity=0.85`
Traverses the network graph hop-by-hop from a failed or congested node to predict cascading disruptions.

### `GET /api/graph/alternative-routes/{origin_id}?destination_id={dest_id}`
Calculates k-shortest risk-weighted bypass corridors between two supply-chain points.

---

## 4. Scenario Simulator (What-If)

### `POST /api/simulation`
Simulates facility closures, port gridlocks, route blockades, weather crises, and demand spikes.
- **Request Body**:
```json
{
  "scenario_type": "warehouse_failure",
  "target_node_or_route_id": "NODE-MUM-102",
  "severity": 0.85
}
```
- **Response**:
Returns BEFORE vs AFTER metrics for network risk, bottleneck count, SLA breaches, and financial loss in INR ₹.

---

## 5. Live Telemetry WebSocket

### `WS /ws/telemetry`
Streams real-time updates for shipments every 3 seconds:
```json
{
  "type": "TELEMETRY_BATCH",
  "events": [
    {
      "shipment_id": "SHP-1024",
      "latitude": 19.3451,
      "longitude": 73.1205,
      "current_speed": 18.2,
      "temperature": 24.6,
      "route_congestion": 0.93,
      "status": "AT_RISK",
      "delay_probability": 0.82
    }
  ]
}
```
