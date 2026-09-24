"""
MeetMux Geospatial Intelligence Engine — Behavioral Signals
Evaluates movement dynamics, operational consistency, checkpoint interactions, and velocity cadence.
"""

from typing import Dict, Any

def extract_behavior_signals(entity: Dict[str, Any]) -> Dict[str, Any]:
    curr_speed = float(entity.get("current_speed", 45.0))
    avg_speed = float(entity.get("average_speed", 50.0))
    stops = int(entity.get("number_of_stops", 2))
    carrier = entity.get("carrier_name", "MeetMux Express")

    # Speed consistency ratio
    speed_ratio = (curr_speed / avg_speed) if avg_speed > 0 else 1.0
    speed_consistency = min(1.0, max(0.1, speed_ratio if speed_ratio <= 1.0 else (2.0 - speed_ratio)))

    # Stop efficiency (penalize excessive stops)
    stop_efficiency = max(0.2, 1.0 - (stops * 0.12))

    # Overall behavioral score (0.0 to 1.0)
    behavior_score = round((speed_consistency * 0.6) + (stop_efficiency * 0.4), 3)

    return {
        "current_speed_kmh": curr_speed,
        "average_speed_kmh": avg_speed,
        "speed_consistency_ratio": round(speed_consistency, 3),
        "number_of_stops": stops,
        "carrier_identifier": carrier,
        "behavior_score": behavior_score
    }
