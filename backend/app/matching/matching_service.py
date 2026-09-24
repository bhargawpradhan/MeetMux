"""
MeetMux Geospatial Intelligence Engine — Matching Service
Provides domain-level matching endpoints for alternative carriers, twin facilities, and generic entities.
"""

from typing import Dict, Any, List, Optional
from backend.app.matching.similarity_engine import similarity_engine
from backend.app.matching.ranking_engine import ranking_engine
from backend.app.graph.graph_engine import graph_engine

class MatchingService:
    def match_similar_shipments(self, shipment_id: str, top_k: int = 5) -> Dict[str, Any]:
        shipments = graph_engine.get_all_shipments()
        target = next((s for s in shipments if s["id"] == shipment_id), None)
        if not target:
            target = shipments[0] if shipments else {}

        ranked = ranking_engine.rank_candidates(target, shipments, top_k=top_k)
        return {
            "target_shipment_id": target.get("id"),
            "target_category": target.get("category"),
            "target_priority": target.get("priority"),
            "matches_count": len(ranked),
            "matches": ranked,
            "disclaimer": "Model-generated ranking score — not a guaranteed or objective truth."
        }

    def match_twin_facilities(self, node_id: str, top_k: int = 4) -> Dict[str, Any]:
        nodes = graph_engine.get_all_nodes()
        target = next((n for n in nodes if n["id"] == node_id), None)
        if not target:
            target = nodes[0] if nodes else {}

        # Custom weights emphasizing capacity, city proximity, and type
        candidates = [n for n in nodes if n.get("type") == target.get("type")]
        ranked = ranking_engine.rank_candidates(
            target,
            candidates,
            top_k=top_k,
            weights={"location": 0.40, "behavior": 0.20, "history": 0.20, "context": 0.20}
        )
        return {
            "target_facility_id": target.get("id"),
            "target_facility_name": target.get("name"),
            "facility_type": target.get("type"),
            "twin_matches": ranked,
            "disclaimer": "Model-generated ranking score — not a guaranteed or objective truth."
        }

    def match_platform_entities(self, entity_a: Dict[str, Any], candidate_pool: List[Dict[str, Any]], top_k: int = 5) -> Dict[str, Any]:
        """
        Generic matching for Platform Demo Mode (Person, Activity, Venue, Community).
        """
        ranked = ranking_engine.rank_candidates(entity_a, candidate_pool, top_k=top_k)
        return {
            "target_entity": entity_a,
            "matched_entities": ranked,
            "disclaimer": "Model-generated ranking score — not a guaranteed or objective truth."
        }

matching_service = MatchingService()
