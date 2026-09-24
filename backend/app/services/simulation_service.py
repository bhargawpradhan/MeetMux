"""
MeetMux Control Tower — Scenario Simulator (What-If Analysis Engine)
Simulates supply chain disruptions (warehouse failure, port closure, congestion, weather, demand surge)
and provides side-by-side BEFORE vs AFTER metric comparisons.
"""

from backend.app.graph.graph_engine import graph_engine
from ml.predict import predict

SCENARIO_TEMPLATES = {
    "warehouse_failure": {
        "title": "Major Hub Closure / Outage",
        "description": "Simulates complete or partial shutdown of a key central fulfilment hub.",
        "risk_multiplier": 1.45,
        "cost_base": 1250000.0
    },
    "port_closure": {
        "title": "Port Customs / Import Vessel Delay",
        "description": "Simulates container import gridlock at primary maritime gateways.",
        "risk_multiplier": 1.35,
        "cost_base": 1850000.0
    },
    "route_congestion": {
        "title": "Arterial Highway Blockade / Heavy Monsoon Congestion",
        "description": "Simulates severe traffic slowdown across major inter-state freight corridors.",
        "risk_multiplier": 1.25,
        "cost_base": 750000.0
    },
    "weather_event": {
        "title": "Severe Cyclone / Torrential Rainfall Alert",
        "description": "Simulates extreme weather disruption halting transit speed by 40%.",
        "risk_multiplier": 1.30,
        "cost_base": 920000.0
    },
    "demand_surge": {
        "title": "Festive Season Flash Demand Surge (+40% Volume)",
        "description": "Simulates sudden order influx exceeding facility sorting capacities.",
        "risk_multiplier": 1.20,
        "cost_base": 600000.0
    }
}

def run_simulation(scenario_type: str, target_id: str, severity: float = 0.75):
    template = SCENARIO_TEMPLATES.get(scenario_type, SCENARIO_TEMPLATES["warehouse_failure"])
    
    shipments = graph_engine.get_all_shipments()
    nodes = graph_engine.get_all_nodes()
    bottlenecks = graph_engine.calculate_bottlenecks()

    target_name = target_id
    node_match = next((n for n in nodes if n["id"] == target_id or target_id.lower() in n["name"].lower()), None)
    if node_match:
        target_name = node_match["name"]

    # Calculate BEFORE metrics
    total_shps = len(shipments)
    at_risk_before = len([s for s in shipments if s["status"] in ["AT_RISK", "DELAYED"]])
    avg_risk_before = round(at_risk_before / total_shps, 3) if total_shps > 0 else 0.25
    critical_bot_before = len([b for b in bottlenecks if b["bottleneck_score"] >= 80])
    sla_breaches_before = len([s for s in shipments if s["priority"] == "CRITICAL_SLA" and s["status"] in ["AT_RISK", "DELAYED"]])

    # Calculate AFTER metrics based on scenario parameters
    mult = 1.0 + (severity * template["risk_multiplier"])
    avg_risk_after = round(min(0.95, avg_risk_before * mult), 3)
    critical_bot_after = int(critical_bot_before + round(3 * severity * template["risk_multiplier"]))
    sla_breaches_after = int(sla_breaches_before + round(14 * severity * template["risk_multiplier"]))
    
    aff_shps = int(total_shps * min(0.65, 0.25 * severity * template["risk_multiplier"]))
    aff_routes = int(len(graph_engine.get_all_routes()) * min(0.50, 0.20 * severity))
    aff_nodes = int(len(nodes) * min(0.40, 0.15 * severity))

    financial_impact = round(template["cost_base"] * severity * (aff_shps / 40.0), 2)

    return {
        "disclaimer": "Model scenario — not a real-world forecast.",
        "scenario_name": f"{template['title']}: {target_name}",
        "scenario_type": scenario_type,
        "target_entity_id": target_id,
        "target_entity_name": target_name,
        "severity": severity,
        "affected_shipments_count": aff_shps,
        "affected_routes_count": aff_routes,
        "affected_nodes_count": aff_nodes,
        "avg_delay_risk_before": avg_risk_before,
        "avg_delay_risk_after": avg_risk_after,
        "critical_bottlenecks_before": critical_bot_before,
        "critical_bottlenecks_after": critical_bot_after,
        "predicted_sla_breaches_before": sla_breaches_before,
        "predicted_sla_breaches_after": sla_breaches_after,
        "financial_cost_impact_inr": financial_impact
    }
