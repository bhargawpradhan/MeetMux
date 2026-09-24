"""
MeetMux Control Tower — AI Copilot Service
Grounded natural-language operations assistant with intent routing & structured response cards.
"""

from backend.app.graph.graph_engine import graph_engine
from backend.app.services.simulation_service import run_simulation
from ml.predict import predict

def process_copilot_query(query: str):
    q_lower = query.lower()
    shipments = graph_engine.get_all_shipments()
    nodes = graph_engine.get_all_nodes()
    bottlenecks = graph_engine.calculate_bottlenecks()

    # Intent 1: Specific Shipment Risk Query (e.g., "Why is SHP-1024 late?" / "Tell me about SHP-1042")
    if "shp-" in q_lower or "shipment" in q_lower:
        shp_match = None
        for s in shipments:
            if s["id"].lower() in q_lower:
                shp_match = s
                break
        if not shp_match:
            shp_match = next((s for s in shipments if s["id"] == "SHP-1024"), shipments[0])

        pred = predict(shp_match)
        return {
            "query": query,
            "intent": "SHIPMENT_RISK_INQUIRY",
            "answer_text": f"Shipment **{shp_match['id']}** ({shp_match['category']} from {shp_match['origin_name']} to {shp_match['destination_name']}) is currently at **{pred['risk_level']} RISK** with a predicted delay of **{pred['predicted_delay_hours']} hours** and **{int(pred['sla_breach_probability']*100)}% SLA breach probability**.",
            "structured_cards": [
                {
                    "card_type": "SHIPMENT_DETAIL",
                    "title": f"Shipment {shp_match['id']} Risk Diagnostic",
                    "status": shp_match["status"],
                    "priority": shp_match["priority"],
                    "value_inr": f"₹{shp_match['value_inr']:,.2f}",
                    "delay_probability": f"{int(pred['delay_probability']*100)}%",
                    "predicted_delay_hours": f"{pred['predicted_delay_hours']} hrs",
                    "sla_breach_probability": f"{int(pred['sla_breach_probability']*100)}%",
                    "estimated_cost_impact": f"₹{pred['estimated_cost_impact']:,.2f}",
                    "explanation": pred["explanation_text"],
                    "counterfactual_hint": pred["counterfactual_hint"]
                }
            ],
            "suggested_actions": [
                f"Inspect SHP-{shp_match['id']} telemetry",
                "Find alternative bypass routes",
                "Simulate rerouting around current hub"
            ]
        }

    # Intent 2: Hub Failure / Bottlenecks Query (e.g., "Which hubs will fail this week?")
    elif "hub" in q_lower or "fail" in q_lower or "bottleneck" in q_lower or "node" in q_lower:
        top_b = bottlenecks[:3]
        hub_list_text = ", ".join([f"**{b['node_name']}** (Score: {b['bottleneck_score']})" for b in top_b])
        
        return {
            "query": query,
            "intent": "BOTTLENECK_IDENTIFICATION",
            "answer_text": f"Based on graph centrality and current utilization, the highest-risk facilities are {hub_list_text}. **{top_b[0]['node_name']}** is severely overloaded at **{int(top_b[0]['utilization']*100)}% capacity**.",
            "structured_cards": [
                {
                    "card_type": "BOTTLENECK_LIST",
                    "title": "Critical Infrastructure Vulnerabilities",
                    "items": [
                        {
                            "node_id": b["node_id"],
                            "node_name": b["node_name"],
                            "score": b["bottleneck_score"],
                            "utilization": f"{int(b['utilization']*100)}%",
                            "affected_shipments": b["affected_shipments_count"],
                            "financial_exposure": f"₹{b['estimated_inr_exposure']:,.2f}"
                        } for b in top_b
                    ]
                }
            ],
            "suggested_actions": [
                f"Simulate closure of {top_b[0]['node_name']}",
                "Traverse disruption propagation",
                "Apply dynamic load balance recommendation"
            ]
        }

    # Intent 3: What-if / Simulation Query (e.g., "What happens if Mumbai Hub closes?")
    elif "what happens" in q_lower or "close" in q_lower or "simulate" in q_lower or "surge" in q_lower or "mumbai" in q_lower:
        sim = run_simulation("warehouse_failure", "NODE-MUM-102", 0.85)
        return {
            "query": query,
            "intent": "SIMULATION_QUERY",
            "answer_text": f"Simulating **{sim['scenario_name']}** indicates network risk would spike from **{int(sim['avg_delay_risk_before']*100)}%** to **{int(sim['avg_delay_risk_after']*100)}%**, putting **{sim['affected_shipments_count']} shipments** and **{sim['predicted_sla_breaches_after']} SLA commitments** at risk.",
            "structured_cards": [
                {
                    "card_type": "SIMULATION_IMPACT",
                    "title": sim["scenario_name"],
                    "disclaimer": sim["disclaimer"],
                    "affected_shipments": sim["affected_shipments_count"],
                    "critical_bottlenecks_delta": f"{sim['critical_bottlenecks_before']} ➔ {sim['critical_bottlenecks_after']}",
                    "sla_breaches_delta": f"{sim['predicted_sla_breaches_before']} ➔ {sim['predicted_sla_breaches_after']}",
                    "financial_cost_impact": f"₹{sim['financial_cost_impact_inr']:,.2f}"
                }
            ],
            "suggested_actions": [
                "Compare 3 side-by-side scenarios",
                "View disruption propagation ripples on map",
                "Export executive simulation report"
            ]
        }

    # Intent 4: General Supply Chain Overview / Default Response
    else:
        crit_count = len([b for b in bottlenecks if b["bottleneck_score"] >= 80])
        total_val = sum(s["value_inr"] for s in shipments if s["status"] in ["AT_RISK", "DELAYED"])
        
        return {
            "query": query,
            "intent": "GENERAL_EXECUTIVE_SUMMARY",
            "answer_text": f"MeetMux Control Tower is currently tracking **{len(shipments)} active shipments** across India. **{crit_count} hubs** are at CRITICAL bottleneck status, with **₹{total_val:,.2f}** in high-risk inventory.",
            "structured_cards": [
                {
                    "card_type": "NETWORK_SUMMARY",
                    "title": "MeetMux India Operational Snapshot",
                    "active_shipments": len(shipments),
                    "critical_hubs": crit_count,
                    "at_risk_value": f"₹{total_val:,.2f}",
                    "network_health_score": "74 / 100"
                }
            ],
            "suggested_actions": [
                "Which hubs will fail this week?",
                "Why is SHP-1024 late?",
                "What happens if Mumbai Hub closes?"
            ]
        }
