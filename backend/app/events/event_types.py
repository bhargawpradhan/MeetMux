"""
MeetMux Geospatial Intelligence Engine — Event Types & Models
Defines all operational event types across telemetry, graph, risk, and user actions.
"""

from enum import Enum
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime, timezone

class EventType(str, Enum):
    SHIPMENT_STARTED = "SHIPMENT_STARTED"
    SHIPMENT_UPDATED = "SHIPMENT_UPDATED"
    SHIPMENT_DELAYED = "SHIPMENT_DELAYED"
    ROUTE_CONGESTED = "ROUTE_CONGESTED"
    WAREHOUSE_OVERLOADED = "WAREHOUSE_OVERLOADED"
    BOTTLENECK_DETECTED = "BOTTLENECK_DETECTED"
    ANOMALY_DETECTED = "ANOMALY_DETECTED"
    RISK_CHANGED = "RISK_CHANGED"
    SIMULATION_STARTED = "SIMULATION_STARTED"
    ALERT_CREATED = "ALERT_CREATED"
    RECOMMENDATION_APPROVED = "RECOMMENDATION_APPROVED"
    RECOMMENDATION_REJECTED = "RECOMMENDATION_REJECTED"
    DECISION_RECORDED = "DECISION_RECORDED"

class PlatformEvent(BaseModel):
    id: str
    event_type: EventType
    entity_id: str
    entity_type: str  # shipment, facility, route, simulation, user
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    payload: Dict[str, Any] = Field(default_factory=dict)
    severity: str = "INFO"  # INFO, MEDIUM, HIGH, CRITICAL
    actor: Optional[str] = "SYSTEM"
