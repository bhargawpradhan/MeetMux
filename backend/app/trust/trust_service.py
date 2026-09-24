"""
MeetMux Geospatial Intelligence Engine — Trust Service
Provides reliability scoring across carriers, facilities, corridors, and generic network agents.
"""

from typing import Dict, Any, List
from backend.app.trust.reliability_engine import reliability_engine
from backend.app.graph.graph_engine import graph_engine

CARRIER_DIRECTORY = [
    {"id": "CAR-01", "name": "MeetMux Express", "historical_delay_rate": 0.08, "previous_route_delays": 1, "risk_score": 15, "verification_status": "Complete"},
    {"id": "CAR-02", "name": "BlueDart Logistics", "historical_delay_rate": 0.12, "previous_route_delays": 2, "risk_score": 25, "verification_status": "Complete"},
    {"id": "CAR-03", "name": "Delhivery Prime", "historical_delay_rate": 0.14, "previous_route_delays": 2, "risk_score": 28, "verification_status": "Complete"},
    {"id": "CAR-04", "name": "Safexpress", "historical_delay_rate": 0.18, "previous_route_delays": 3, "risk_score": 38, "verification_status": "Complete"},
    {"id": "CAR-05", "name": "Gati KWE", "historical_delay_rate": 0.22, "previous_route_delays": 4, "risk_score": 45, "verification_status": "Complete"},
    {"id": "CAR-06", "name": "TCI Freight", "historical_delay_rate": 0.26, "previous_route_delays": 5, "risk_score": 52, "verification_status": "Pending"}
]

class TrustService:
    def get_carrier_reliabilities(self) -> List[Dict[str, Any]]:
        return [reliability_engine.compute_reliability(c, "carrier") for c in CARRIER_DIRECTORY]

    def get_entity_reliability(self, entity_id: str) -> Dict[str, Any]:
        # Check carriers first
        carrier = next((c for c in CARRIER_DIRECTORY if c["id"] == entity_id or c["name"].lower() == entity_id.lower()), None)
        if carrier:
            return reliability_engine.compute_reliability(carrier, "carrier")

        # Check nodes
        node = graph_engine.nodes_dict.get(entity_id)
        if node:
            return reliability_engine.compute_reliability({
                "id": node["id"],
                "name": node["name"],
                "historical_delay_rate": 1.0 - node.get("utilization", 0.7),
                "previous_route_delays": 2,
                "risk_score": node.get("risk_score", 30),
                "verification_status": "Complete"
            }, "facility")

        # Check routes
        route = graph_engine.routes_dict.get(entity_id)
        if route:
            return reliability_engine.compute_reliability(route, "route")

        # Default fallback
        return reliability_engine.compute_reliability({"id": entity_id, "name": entity_id}, "generic_agent")

trust_service = TrustService()
