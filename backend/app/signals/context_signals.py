"""
MeetMux Geospatial Intelligence Engine — Contextual & Environmental Signals
Encodes ambient environmental conditions, corridor congestion, time-of-day variance, and priority tiers.
"""

from typing import Dict, Any

def extract_context_signals(entity: Dict[str, Any]) -> Dict[str, Any]:
    congestion = float(entity.get("route_congestion", 0.40))
    weather = float(entity.get("weather_severity", 3.0))
    temp = float(entity.get("temperature", 25.0))
    humidity = float(entity.get("humidity", 60.0))
    time_of_day = int(entity.get("time_of_day", 14))
    priority = str(entity.get("priority", "STANDARD")).upper()

    # Peak hour pressure (traffic peaks around 8-11 AM and 5-9 PM)
    is_peak = 1.0 if (8 <= time_of_day <= 11 or 17 <= time_of_day <= 21) else 0.3

    # Congestion & environmental stability
    traffic_factor = max(0.05, 1.0 - congestion)
    weather_factor = max(0.1, 1.0 - (weather / 10.0))
    temp_stability = 1.0 if (15.0 <= temp <= 28.0) else max(0.2, 1.0 - abs(temp - 24.0) / 30.0)

    # Context score (1.0 = optimal operational environment)
    context_score = round(
        (traffic_factor * 0.40) +
        (weather_factor * 0.30) +
        (temp_stability * 0.20) +
        ((1.0 - is_peak * 0.3) * 0.10),
        3
    )

    return {
        "route_congestion": congestion,
        "weather_severity_index": weather,
        "temperature_celsius": temp,
        "humidity_percent": humidity,
        "time_of_day_hour": time_of_day,
        "is_peak_hour": bool(is_peak == 1.0),
        "priority_tier": priority,
        "context_score": context_score
    }
