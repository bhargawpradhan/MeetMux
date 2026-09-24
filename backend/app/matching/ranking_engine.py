"""
MeetMux Geospatial Intelligence Engine — Entity Ranking Engine
Ranks candidate sets based on similarity, reliability, and contextual fit.
"""

from typing import Dict, Any, List, Optional
from backend.app.matching.similarity_engine import similarity_engine

class RankingEngine:
    def rank_candidates(
        self,
        target_entity: Dict[str, Any],
        candidates: List[Dict[str, Any]],
        top_k: int = 5,
        weights: Optional[Dict[str, float]] = None
    ) -> List[Dict[str, Any]]:
        """
        Ranks a list of candidate entities against a target entity.
        Returns top_k matches sorted by similarity score descending.
        """
        ranked = []
        for candidate in candidates:
            if candidate.get("id") == target_entity.get("id"):
                continue
            sim = similarity_engine.compute_similarity(target_entity, candidate, weights)
            ranked.append({
                "candidate_id": candidate.get("id"),
                "candidate_name": candidate.get("name", candidate.get("id")),
                "candidate_type": candidate.get("type", candidate.get("category", "Entity")),
                "similarity_score": sim["similarity_score"],
                "distance_km": sim["distance_km"],
                "dimensions": sim["dimensions"],
                "reasons": sim["reasons"],
                "metadata": {
                    "city": candidate.get("city"),
                    "status": candidate.get("status", candidate.get("operating_status")),
                    "carrier": candidate.get("carrier_name")
                }
            })

        ranked.sort(key=lambda x: x["similarity_score"], reverse=True)
        for rank, item in enumerate(ranked[:top_k], 1):
            item["rank"] = rank

        return ranked[:top_k]

ranking_engine = RankingEngine()
