"""
MeetMux Control Tower — Disruption Propagation Service
Traverses graph hop-by-hop from a target node failure to project multi-tier supply chain impacts.
"""

from backend.app.graph.graph_engine import graph_engine

def get_propagation_analysis(node_id: str, severity: float = 0.85):
    return graph_engine.traverse_disruption(node_id, severity)
