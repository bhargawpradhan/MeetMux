"""
MeetMux Geospatial Intelligence Engine — Event Bus
Asynchronous in-memory event bus with optional Redis pub/sub support and WebSocket distribution.
"""

import asyncio
import json
import os
from typing import Dict, Any, List, Callable, Coroutine
from collections import deque
from backend.app.events.event_types import PlatformEvent, EventType

try:
    import redis.asyncio as aioredis
    HAS_REDIS = True
except ImportError:
    HAS_REDIS = False

class EventBus:
    def __init__(self):
        self._subscribers: Dict[EventType, List[Callable[[PlatformEvent], Coroutine[Any, Any, None]]]] = {}
        self._recent_events: deque = deque(maxlen=200)
        self._ws_broadcasters: List[Callable[[Dict[str, Any]], Coroutine[Any, Any, None]]] = []
        self._redis = None
        self._init_redis()

    def _init_redis(self):
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        if HAS_REDIS and redis_url:
            try:
                self._redis = aioredis.from_url(redis_url, decode_responses=True)
            except Exception:
                self._redis = None

    def subscribe(self, event_type: EventType, handler: Callable[[PlatformEvent], Coroutine[Any, Any, None]]):
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(handler)

    def register_ws_broadcaster(self, broadcaster: Callable[[Dict[str, Any]], Coroutine[Any, Any, None]]):
        self._ws_broadcasters.append(broadcaster)

    def unregister_ws_broadcaster(self, broadcaster: Callable[[Dict[str, Any]], Coroutine[Any, Any, None]]):
        if broadcaster in self._ws_broadcasters:
            self._ws_broadcasters.remove(broadcaster)

    async def publish(self, event: PlatformEvent):
        """
        Publishes event to registered async subscribers, stores in event buffer,
        and broadcasts to all active WebSocket clients.
        """
        self._recent_events.appendleft(event.model_dump())

        # Notify type-specific subscribers
        handlers = self._subscribers.get(event.event_type, [])
        for handler in handlers:
            try:
                asyncio.create_task(handler(event))
            except Exception as e:
                print(f"[EventBus] Handler error for {event.event_type}: {e}")

        # Broadcast to active WebSockets
        event_dict = event.model_dump()
        for broadcaster in list(self._ws_broadcasters):
            try:
                await broadcaster(event_dict)
            except Exception:
                pass

        # Optional Redis stream publication
        if self._redis:
            try:
                await self._redis.publish("meetmux_events", json.dumps(event_dict))
            except Exception:
                pass

    def get_recent_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        return list(self._recent_events)[:limit]

event_bus = EventBus()
