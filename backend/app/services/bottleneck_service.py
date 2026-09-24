"""
MeetMux Control Tower — Bottleneck Intelligence Service
Wraps graph engine centrality & transparent bottleneck scoring calculation.
"""

from backend.app.graph.graph_engine import graph_engine

def get_bottleneck_analysis():
    bottlenecks = graph_engine.calculate_bottlenecks()
    critical_count = len([b for b in bottlenecks if b["bottleneck_score"] >= 80])
    high_count = len([b for b in bottlenecks if 60 <= b["bottleneck_score"] < 80])
    
    total_exposure = sum(b["estimated_inr_exposure"] for b in bottlenecks[:5])

    return {
        "formula_documentation": "Bottleneck Score = 35% * Utilization + 25% * Risk Score + 25% * Network Betweenness + 15% * Degree Centrality",
        "total_nodes_analyzed": len(bottlenecks),
        "critical_bottlenecks_count": critical_count,
        "high_risk_hubs_count": high_count,
        "top_5_financial_exposure_inr": round(total_exposure, 2),
        "bottlenecks": bottlenecks
    }
