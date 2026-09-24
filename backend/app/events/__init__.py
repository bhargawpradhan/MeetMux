"""Event-Driven Architecture package"""
from backend.app.events.event_types import EventType, PlatformEvent
from backend.app.events.event_bus import event_bus, EventBus
from backend.app.events.event_processor import event_processor, EventProcessor
