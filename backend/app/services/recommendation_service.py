"""
MeetMux Control Tower — Alternative Routes & Recommendations Engine
Outputs prioritized actionable mitigations with delay reduction, ₹ financial savings, and confidence scores.
"""

from backend.app.graph.graph_engine import graph_engine

def get_recommendations():
    bottlenecks = graph_engine.calculate_bottlenecks()
    critical_hub = bottlenecks[0] if bottlenecks else {"node_id": "NODE-MUM-102", "node_name": "Bhiwandi Central Mega Hub (H04)"}
    second_hub = bottlenecks[1] if len(bottlenecks) > 1 else {"node_id": "NODE-DEL-106", "node_name": "Okhla Fulfilment Center (H02)"}

    # Fetch alternative route for top corridor
    alt_routes = graph_engine.find_alternative_routes("NODE-MUM-102", "NODE-DEL-106")
    alt_option = alt_routes[1] if len(alt_routes) > 1 else alt_routes[0]

    recs = [
        {
            "id": "REC-101",
            "title": f"Dynamic Load Rerouting around {critical_hub['node_name']}",
            "action_type": "REROUTE_SHIPMENTS",
            "target_entity_id": critical_hub["node_id"],
            "target_entity_name": critical_hub["node_name"],
            "reason": f"{critical_hub['node_name']} is operating at {int(critical_hub['utilization']*100)}% utilization with severe arterial bottlenecking.",
            "expected_delay_reduction_hours": 6.5,
            "expected_savings_inr": 845000.0,
            "confidence_score": 0.92,
            "effort_level": "LOW",
            "alternative_route": alt_option
        },
        {
            "id": "REC-102",
            "title": f"Pre-clearing High-Priority Pharma Batches at {second_hub['node_name']}",
            "action_type": "PRIORITY_DISPATCH",
            "target_entity_id": second_hub["node_id"],
            "target_entity_name": second_hub["node_name"],
            "reason": f"14 critical SLA shipments queued behind lower-priority FMCG cargo.",
            "expected_delay_reduction_hours": 4.2,
            "expected_savings_inr": 620000.0,
            "confidence_score": 0.88,
            "effort_level": "MEDIUM",
            "alternative_route": None
        },
        {
            "id": "REC-103",
            "title": "Activate Sub-corridor Bypass Route NH-48 Express",
            "action_type": "BYPASS_HIGHWAY",
            "target_entity_id": "ROUTE-501",
            "target_entity_name": "Mumbai - Delhi Trunk Corridor",
            "reason": "Primary highway experiencing monsoon storm congestion (+45% travel duration).",
            "expected_delay_reduction_hours": 5.8,
            "expected_savings_inr": 510000.0,
            "confidence_score": 0.85,
            "effort_level": "LOW",
            "alternative_route": alt_option
        },
        {
            "id": "REC-104",
            "title": "Staggered Shift Expansion at Pune Chakan DC",
            "action_type": "CAPACITY_EXPANSION",
            "target_entity_id": "NODE-PUN-108",
            "target_entity_name": "Pune Chakan Distribution Center",
            "reason": "Inbound volume surge from JNPT Port overtopping dock staging areas.",
            "expected_delay_reduction_hours": 3.4,
            "expected_savings_inr": 380000.0,
            "confidence_score": 0.81,
            "effort_level": "HIGH",
            "alternative_route": None
        }
    ]

    return {
        "disclaimer": "System-generated recommendations — evaluate operational feasibility prior to execution.",
        "total_potential_savings_inr": sum(r["expected_savings_inr"] for r in recs),
        "total_delay_reduction_hours": sum(r["expected_delay_reduction_hours"] for r in recs),
        "recommendations": recs
    }
