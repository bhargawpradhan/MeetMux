"""
MeetMux Geospatial Intelligence Engine — Generic Similarity Engine
Computes multi-dimensional similarity scores between entities across geographic, behavioral,
historical, and contextual attributes with explainable attribution reasons.
"""

import math
from typing import Dict, Any, List, Optional
from backend.app.signals.signal_service import signal_service

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class SimilarityEngine:
    def compute_similarity(
        self,
        entity_a: Dict[str, Any],
        entity_b: Dict[str, Any],
        weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Calculates normalized similarity between entity A and entity B.
        Returns similarity score (0.0 to 1.0) and explainable reasons.
        """
        w = weights or {
            "location": 0.30,
            "behavior": 0.25,
            "history": 0.25,
            "context": 0.20
        }

        # 1. Geographic proximity similarity
        lat_a = float(entity_a.get("latitude", 0.0))
        lng_a = float(entity_a.get("longitude", 0.0))
        lat_b = float(entity_b.get("latitude", 0.0))
        lng_b = float(entity_b.get("longitude", 0.0))

        dist_km = haversine_km(lat_a, lng_a, lat_b, lng_b)
        # Closer entities get higher score (1.0 at 0km, degrades smoothly up to 1000km)
        loc_sim = max(0.0, 1.0 - (dist_km / 1000.0))

        # 2. Behavioral similarity (speed, stops)
        speed_a = float(entity_a.get("current_speed", entity_a.get("average_speed", 50.0)))
        speed_b = float(entity_b.get("current_speed", entity_b.get("average_speed", 50.0)))
        speed_diff = abs(speed_a - speed_b)
        beh_sim = max(0.05, 1.0 - (speed_diff / 80.0))

        # 3. Historical similarity (delay rates, reliability)
        delay_a = float(entity_a.get("historical_delay_rate", 0.20))
        delay_b = float(entity_b.get("historical_delay_rate", 0.20))
        hist_sim = max(0.1, 1.0 - abs(delay_a - delay_b))

        # 4. Contextual compatibility (category, priority, congestion)
        cat_match = 1.0 if entity_a.get("category") == entity_b.get("category") or entity_a.get("type") == entity_b.get("type") else 0.5
        prio_match = 1.0 if entity_a.get("priority") == entity_b.get("priority") else 0.7
        ctx_sim = (cat_match * 0.6) + (prio_match * 0.4)

        # Weighted combination
        score = round(
            (loc_sim * w.get("location", 0.30)) +
            (beh_sim * w.get("behavior", 0.25)) +
            (hist_sim * w.get("history", 0.25)) +
            (ctx_sim * w.get("context", 0.20)),
            3
        )

        reasons = []
        if dist_km < 150:
            reasons.append(f"High spatial proximity ({round(dist_km, 1)} km corridor separation)")
        elif dist_km < 500:
            reasons.append(f"Regional proximity ({round(dist_km, 1)} km)")

        if abs(speed_diff) < 10:
            reasons.append(f"Matched velocity profile (~{round(speed_a, 1)} km/h transit tempo)")

        if entity_a.get("category") == entity_b.get("category") and entity_a.get("category"):
            reasons.append(f"Identical cargo profile: {entity_a.get('category')}")

        if abs(delay_a - delay_b) < 0.10:
            reasons.append(f"Consistent historical delay baseline (~{int(delay_a * 100)}%)")

        if not reasons:
            reasons.append("Cross-regional baseline operational compatibility")

        return {
            "entity_a_id": entity_a.get("id", "A"),
            "entity_b_id": entity_b.get("id", "B"),
            "similarity_score": score,
            "distance_km": round(dist_km, 1),
            "dimensions": {
                "location_similarity": round(loc_sim, 3),
                "behavior_similarity": round(beh_sim, 3),
                "history_similarity": round(hist_sim, 3),
                "context_compatibility": round(ctx_sim, 3)
            },
            "reasons": reasons,
            "disclaimer": "Model-generated ranking score — not a guaranteed or objective truth."
        }

similarity_engine = SimilarityEngine()
