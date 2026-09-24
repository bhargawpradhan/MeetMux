"""
MeetMux Control Tower — Live Telemetry Stream Simulator
WebSocket-based real-time shipment position, speed, temperature, and congestion broadcaster.
"""

import asyncio
import json
import random
import math
from datetime import datetime, timezone
from typing import Set
from fastapi import WebSocket, WebSocketDisconnect

from backend.app.graph.graph_engine import graph_engine

connected_clients: Set[WebSocket] = set()
streaming_active = True


def _simulate_telemetry_tick():
    """
    Generates a single telemetry frame for a random subset of active shipments.
    Mutates position along route path with slight noise.
    """
    shipments = graph_engine.get_all_shipments()
    active = [s for s in shipments if s["status"] in ["IN_TRANSIT", "AT_RISK", "DELAYED"]]
    sampled = random.sample(active, min(8, len(active)))

    events = []
    for s in sampled:
        # Drift lat/lng toward destination
        origin = graph_engine.nodes_dict.get(s["origin_id"], {"latitude": 19.0760, "longitude": 72.8777})
        dest = graph_engine.nodes_dict.get(s["destination_id"], {"latitude": 28.6139, "longitude": 77.2090})

        # New randomized position delta
        lat_noise = (random.random() - 0.5) * 0.012
        lng_noise = (random.random() - 0.5) * 0.012
        new_lat = round(s["latitude"] + (dest["latitude"] - s["latitude"]) * 0.01 + lat_noise, 4)
        new_lng = round(s["longitude"] + (dest["longitude"] - s["longitude"]) * 0.01 + lng_noise, 4)

        # Randomly fluctuate speed and temperature
        new_speed = round(max(5.0, s["current_speed"] + (random.random() - 0.5) * 4.0), 1)
        new_temp = round(s["temperature"] + (random.random() - 0.5) * 0.5, 1)
        new_congestion = round(min(0.99, max(0.05, s["route_congestion"] + (random.random() - 0.5) * 0.04)), 2)

        # Escalate risk for SHP-1024 over time
        delay_prob = s.get("delay_probability", 0.45)
        if s["id"] == "SHP-1024":
            delay_prob = min(0.97, delay_prob + random.uniform(0.001, 0.005))

        events.append({
            "shipment_id": s["id"],
            "latitude": new_lat,
            "longitude": new_lng,
            "current_speed": new_speed,
            "temperature": new_temp,
            "route_congestion": new_congestion,
            "status": s["status"],
            "delay_probability": round(delay_prob, 3),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

        # Update in-memory store
        s["latitude"] = new_lat
        s["longitude"] = new_lng
        s["current_speed"] = new_speed
        s["temperature"] = new_temp
        s["route_congestion"] = new_congestion

    return {
        "type": "TELEMETRY_BATCH",
        "events": events,
        "network_stats": {
            "active_shipments": len(active),
            "avg_congestion": round(sum(s["route_congestion"] for s in active) / max(len(active), 1), 3),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    }


async def websocket_telemetry_handler(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    try:
        while True:
            payload = _simulate_telemetry_tick()
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(3)  # Stream every 3 seconds
    except WebSocketDisconnect:
        connected_clients.discard(websocket)
    except Exception as e:
        connected_clients.discard(websocket)


class _TelemetryBroadcaster:
    """Thin wrapper so health endpoint can inspect WS connection count."""
    @property
    def connections(self):
        return connected_clients

telemetry_broadcaster = _TelemetryBroadcaster()
