"""
MeetMux Geospatial Intelligence Engine — Unified Signal Service
Aggregates Location, Behavior, History, and Contextual signals into a normalized feature vector.
"""

from typing import Dict, Any, Optional
from backend.app.signals.location_signals import extract_location_signals
from backend.app.signals.behavior_signals import extract_behavior_signals
from backend.app.signals.history_signals import extract_history_signals
from backend.app.signals.context_signals import extract_context_signals

class SignalService:
    def generate_signal_vector(
        self,
        entity: Dict[str, Any],
        origin_node: Optional[Dict[str, Any]] = None,
        dest_node: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Computes normalized signal vector from live and historical telemetry.
        """
        loc = extract_location_signals(entity, origin_node, dest_node)
        beh = extract_behavior_signals(entity)
        hist = extract_history_signals(entity)
        ctx = extract_context_signals(entity)

        # Composite signal health score (0.0 - 1.0, where 1.0 is optimal operational state)
        composite = round(
            (loc["location_score"] * 0.25) +
            (beh["behavior_score"] * 0.25) +
            (hist["history_score"] * 0.25) +
            (ctx["context_score"] * 0.25),
            3
        )

        return {
            "entity_id": entity.get("id", "UNKNOWN"),
            "location_score": loc["location_score"],
            "behavior_score": beh["behavior_score"],
            "history_score": hist["history_score"],
            "context_score": ctx["context_score"],
            "composite_signal_score": composite,
            "signals": {
                "location": loc,
                "behavior": beh,
                "history": hist,
                "context": ctx
            }
        }

signal_service = SignalService()
