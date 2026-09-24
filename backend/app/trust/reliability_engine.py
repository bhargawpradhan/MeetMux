"""
MeetMux Geospatial Intelligence Engine — Trust & Reliability Engine
Computes multi-attribute Reliability Scores (0-100) for carriers, facilities, routes, and agents.
"""

from typing import Dict, Any, List

class ReliabilityEngine:
    def compute_reliability(self, entity: Dict[str, Any], entity_type: str = "carrier") -> Dict[str, Any]:
        """
        Calculates normalized Reliability Score (0-100) and factors.
        """
        # Extract underlying metrics from entity or provide realistic calculated baselines
        hist_delay = float(entity.get("historical_delay_rate", 0.15))
        prev_incidents = int(entity.get("previous_route_delays", 1))
        risk_score = float(entity.get("risk_score", 30.0))
        verification_status = entity.get("verification_status", "Complete")

        # 1. On-time delivery rate (0-100%)
        ontime_rate = round(max(50.0, (1.0 - hist_delay) * 100.0), 1)

        # 2. Incident frequency penalty
        incident_rate = round(min(25.0, prev_incidents * 3.5), 1)

        # 3. Route / Operational consistency (0-100%)
        consistency = round(max(40.0, 100.0 - (risk_score * 0.5) - (incident_rate * 1.2)), 1)

        # 4. Verification modifier
        verif_score = 100.0 if verification_status == "Complete" else 75.0

        # Weighted composite score (0-100)
        overall_score = round(
            (ontime_rate * 0.40) +
            ((100.0 - incident_rate * 3.0) * 0.25) +
            (consistency * 0.25) +
            (verif_score * 0.10),
            1
        )
        overall_score = min(99.0, max(25.0, overall_score))

        tier = "TIER_1_PREFERRED" if overall_score >= 85 else ("TIER_2_STANDARD" if overall_score >= 70 else "TIER_3_ELEVATED_RISK")

        return {
            "entity_id": entity.get("id", entity.get("name", "ENTITY")),
            "entity_name": entity.get("name", entity.get("carrier_name", entity.get("id"))),
            "entity_type": entity_type,
            "reliability_score": overall_score,
            "tier": tier,
            "factors": {
                "ontime_delivery_rate_pct": ontime_rate,
                "incident_rate_pct": incident_rate,
                "route_consistency_pct": consistency,
                "verification_status": verification_status
            },
            "confidence": 0.94,
            "disclaimer": "Model-computed operational reliability index — derived from demo activity telemetry."
        }

reliability_engine = ReliabilityEngine()
