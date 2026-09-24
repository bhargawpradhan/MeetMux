"""
MeetMux Geospatial Intelligence Engine — Human-in-the-Loop Recommendation Service
Manages operational review, approvals, rejections, and execution triggers with event publishing.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from backend.app.recommendations.decision_engine import decision_engine
from backend.app.events.event_bus import event_bus
from backend.app.events.event_types import PlatformEvent, EventType

class RecommendationService:
    def __init__(self):
        self._recommendations: Dict[str, Dict[str, Any]] = {}
        self._refresh_recommendations()

    def _refresh_recommendations(self):
        recs = decision_engine.evaluate_operational_recommendations()
        for r in recs:
            if r["id"] not in self._recommendations:
                self._recommendations[r["id"]] = r

    def get_all(self) -> List[Dict[str, Any]]:
        self._refresh_recommendations()
        return list(self._recommendations.values())

    def get_by_id(self, rec_id: str) -> Optional[Dict[str, Any]]:
        self._refresh_recommendations()
        return self._recommendations.get(rec_id)

    async def approve_recommendation(self, rec_id: str, operator_id: str = "OPERATOR_ADMIN", notes: str = "") -> Optional[Dict[str, Any]]:
        rec = self.get_by_id(rec_id)
        if not rec:
            return None

        rec["status"] = "APPROVED"
        rec["reviewed_by"] = operator_id
        rec["reviewed_at"] = datetime.now(timezone.utc).isoformat()
        rec["operator_notes"] = notes

        # Publish event
        await event_bus.publish(PlatformEvent(
            id=f"EVT-REC-APP-{rec_id}",
            event_type=EventType.RECOMMENDATION_APPROVED,
            entity_id=rec_id,
            entity_type="recommendation",
            severity="INFO",
            actor=operator_id,
            payload={
                "title": rec["title"],
                "target_entity": rec["target_entity_name"],
                "expected_savings_inr": rec["expected_savings_inr"],
                "notes": notes
            }
        ))
        return rec

    async def reject_recommendation(self, rec_id: str, operator_id: str = "OPERATOR_ADMIN", reason: str = "") -> Optional[Dict[str, Any]]:
        rec = self.get_by_id(rec_id)
        if not rec:
            return None

        rec["status"] = "REJECTED"
        rec["reviewed_by"] = operator_id
        rec["reviewed_at"] = datetime.now(timezone.utc).isoformat()
        rec["rejection_reason"] = reason

        # Publish event
        await event_bus.publish(PlatformEvent(
            id=f"EVT-REC-REJ-{rec_id}",
            event_type=EventType.RECOMMENDATION_REJECTED,
            entity_id=rec_id,
            entity_type="recommendation",
            severity="INFO",
            actor=operator_id,
            payload={
                "title": rec["title"],
                "target_entity": rec["target_entity_name"],
                "reason": reason
            }
        ))
        return rec

recommendation_service = RecommendationService()
