"""
MeetMux Control Tower — Analytics & Business Impact Service
Returns delay distributions, risk breakdowns, cost-of-delay trends, and ROI projections.
"""

from backend.app.graph.graph_engine import graph_engine
from collections import defaultdict

def get_delay_analytics():
    shipments = graph_engine.get_all_shipments()
    routes = graph_engine.get_all_routes()
    nodes = graph_engine.get_all_nodes()

    # Delay probability distribution (0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0)
    delay_buckets = defaultdict(int)
    for s in shipments:
        congestion = s.get("route_congestion", 0.3)
        if congestion < 0.2:
            delay_buckets["0-20%"] += 1
        elif congestion < 0.4:
            delay_buckets["20-40%"] += 1
        elif congestion < 0.6:
            delay_buckets["40-60%"] += 1
        elif congestion < 0.8:
            delay_buckets["60-80%"] += 1
        else:
            delay_buckets["80-100%"] += 1

    # Risk by region
    region_map = {"Mumbai": "WEST", "Ahmedabad": "WEST", "Pune": "WEST",
                  "Delhi NCR": "NORTH", "Jaipur": "NORTH",
                  "Bengaluru": "SOUTH", "Chennai": "SOUTH", "Hyderabad": "SOUTH",
                  "Kolkata": "EAST"}
    region_risk = defaultdict(list)
    for s in shipments:
        city = next((n["city"] for n in nodes if n["id"] == s["origin_id"]), "Mumbai")
        region = region_map.get(city, "WEST")
        region_risk[region].append(s.get("route_congestion", 0.3))

    region_risk_avg = {region: round(sum(vals)/len(vals)*100, 1) if vals else 0 for region, vals in region_risk.items()}

    # Route delay rate top-10
    route_delays = sorted(routes, key=lambda r: r["historical_delay_rate"], reverse=True)[:10]

    # Monthly delay trend (synthetic last 6 months)
    monthly_trend = [
        {"month": "Apr", "avg_delay_hours": 3.4, "shipment_volume": 420, "on_time_rate": 78.5},
        {"month": "May", "avg_delay_hours": 3.1, "shipment_volume": 455, "on_time_rate": 80.2},
        {"month": "Jun", "avg_delay_hours": 4.8, "shipment_volume": 480, "on_time_rate": 71.4},
        {"month": "Jul", "avg_delay_hours": 5.2, "shipment_volume": 510, "on_time_rate": 68.9},
        {"month": "Aug", "avg_delay_hours": 4.5, "shipment_volume": 530, "on_time_rate": 73.1},
        {"month": "Sep", "avg_delay_hours": 4.1, "shipment_volume": 560, "on_time_rate": 75.8},
    ]

    return {
        "disclaimer": "Synthetic demo data — MeetMux India Logistics Network simulation.",
        "delay_probability_distribution": dict(delay_buckets),
        "risk_by_region": region_risk_avg,
        "top_delayed_routes": [
            {
                "route_id": r["id"],
                "origin": r["origin_name"],
                "destination": r["destination_name"],
                "historical_delay_rate": r["historical_delay_rate"],
                "risk_score": r["risk_score"]
            } for r in route_delays
        ],
        "monthly_trend": monthly_trend,
        "total_cost_of_delay_ytd_inr": 45800000,
        "on_time_delivery_rate": 74.2,
        "avg_delay_hours_current": 4.1
    }


def get_business_impact(cost_per_hour: float = 3500.0, penalty_per_sla_breach: float = 25000.0):
    shipments = graph_engine.get_all_shipments()
    bottlenecks = graph_engine.calculate_bottlenecks()

    at_risk = [s for s in shipments if s["status"] in ["AT_RISK", "DELAYED"]]
    critical_sla = [s for s in at_risk if s["priority"] == "CRITICAL_SLA"]
    total_value_at_risk = sum(s["value_inr"] for s in at_risk)

    avg_delay = 4.1
    estimated_delay_cost = round(len(at_risk) * avg_delay * cost_per_hour, 2)
    sla_penalty_avoided = round(len(critical_sla) * penalty_per_sla_breach * 0.72, 2)
    savings_if_recommendations = 2355000.0

    return {
        "disclaimer": "Business impact estimates are based on synthetic demo data. Assumptions are editable.",
        "assumptions": {
            "cost_per_hour_delay_inr": cost_per_hour,
            "penalty_per_sla_breach_inr": penalty_per_sla_breach
        },
        "at_risk_shipments_count": len(at_risk),
        "critical_sla_count": len(critical_sla),
        "total_value_at_risk_inr": round(total_value_at_risk, 2),
        "estimated_delay_cost_inr": estimated_delay_cost,
        "sla_penalties_avoided_inr": sla_penalty_avoided,
        "on_time_delivery_improvement_pct": 12.4,
        "hub_utilization_balance_improvement_pct": 18.7,
        "savings_if_recommendations_applied_inr": savings_if_recommendations,
        "estimated_roi_pct": round((savings_if_recommendations / (estimated_delay_cost + 150000)) * 100, 1),
        "critical_bottlenecks_count": len([b for b in bottlenecks if b["bottleneck_score"] >= 80]),
        "cost_of_delay_trend_inr": [4200000, 3800000, 5100000, 5600000, 4900000, 4580000]
    }


def get_executive_brief():
    shipments = graph_engine.get_all_shipments()
    bottlenecks = graph_engine.calculate_bottlenecks()
    nodes = graph_engine.get_all_nodes()
    routes = graph_engine.get_all_routes()

    at_risk = [s for s in shipments if s["status"] in ["AT_RISK", "DELAYED"]]
    critical = [s for s in shipments if s["status"] in ["AT_RISK", "DELAYED"] and s["priority"] == "CRITICAL_SLA"]
    critical_hubs = [b for b in bottlenecks if b["bottleneck_score"] >= 80]

    return {
        "generated_at": "2026-09-24T12:00:00+05:30",
        "period": "Weekly Executive Brief — W39, September 2026",
        "disclaimer": "All figures derived from synthetic MeetMux demo data.",
        "executive_summary": f"MeetMux India network is processing {len(shipments)} active shipments across 9 major metros. {len(at_risk)} shipments ({round(len(at_risk)/len(shipments)*100, 1)}%) are at elevated risk. {len(critical_hubs)} critical bottleneck hubs require immediate capacity intervention.",
        "key_kpis": {
            "total_shipments": len(shipments),
            "at_risk_count": len(at_risk),
            "critical_sla_breaches_at_risk": len(critical),
            "critical_bottleneck_hubs": len(critical_hubs),
            "network_risk_score": 72,
            "on_time_rate_pct": 74.2,
            "cost_of_delay_mtd_inr": 4580000
        },
        "top_risks": [
            {"rank": 1, "risk": "Bhiwandi Central Mega Hub at 94% utilization — 81% delay risk on all outbound SHP-1024 (Pharma)"},
            {"rank": 2, "risk": "Mumbai-Delhi trunk corridor experiencing monsoon-driven SEVERE congestion (+48% travel time)"},
            {"rank": 3, "risk": "Okhla Fulfilment Center backlog — 14 SLA-critical electronics batches pending slot clearance"}
        ],
        "top_3_recommendations": [
            {"action": "Reroute 34 at-risk shipments via NH-48 Bypass Corridor", "savings_inr": 845000, "confidence": "92%"},
            {"action": "Pre-clear critical SLA queues at Okhla DC — dispatch pharma first", "savings_inr": 620000, "confidence": "88%"},
            {"action": "Activate overflow capacity at Bhiwandi Tier-2 facility", "savings_inr": 510000, "confidence": "85%"}
        ],
        "projected_savings_inr": 2355000
    }
