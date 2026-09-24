"""
MeetMux Geospatial Intelligence Engine — Event Processor
Handles cross-engine reactions to published events (e.g. Anomaly -> Risk Engine -> Alert Service -> Audit).
"""

import asyncio
from backend.app.events.event_types import EventType, PlatformEvent
from backend.app.events.event_bus import event_bus

class EventProcessor:
    def __init__(self):
        self._setup_handlers()

    def _setup_handlers(self):
        event_bus.subscribe(EventType.ANOMALY_DETECTED, self._handle_anomaly_detected)
        event_bus.subscribe(EventType.RECOMMENDATION_APPROVED, self._handle_recommendation_action)
        event_bus.subscribe(EventType.RECOMMENDATION_REJECTED, self._handle_recommendation_action)
        event_bus.subscribe(EventType.BOTTLENECK_DETECTED, self._handle_bottleneck_detected)

    async def _handle_anomaly_detected(self, event: PlatformEvent):
        # Forward to alert center if severity is elevated
        if event.severity in ["HIGH", "CRITICAL"]:
            from backend.app.services.alert_service import get_alerts, _save_alerts
            alerts = get_alerts()
            new_alert = {
                "id": f"ALT-{event.id[-4:]}",
                "severity": event.severity,
                "timestamp": event.timestamp,
                "entity_id": event.entity_id,
                "entity_name": f"{event.entity_id} (Telemetry Anomaly)",
                "reason": event.payload.get("description", "Telemetry distribution excursion detected"),
                "recommended_investigation": "Inspect vehicle telematics and verify corridor status",
                "financial_exposure_inr": float(event.payload.get("exposure_inr", 2500000.0)),
                "status": "ACTIVE"
            }
            # Prepend alert
            alerts.insert(0, new_alert)
            _save_alerts(alerts)

    async def _handle_recommendation_action(self, event: PlatformEvent):
        # Record in audit logs
        from backend.app.audit.audit_service import audit_service
        audit_service.log_action(
            user=event.actor or "OPERATOR",
            role="OPERATIONS_MANAGER",
            action=event.event_type.value,
            entity_id=event.entity_id,
            details=event.payload,
            result="COMMITTED"
        )

    async def _handle_bottleneck_detected(self, event: PlatformEvent):
        pass

event_processor = EventProcessor()
