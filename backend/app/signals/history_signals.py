"""
MeetMux Geospatial Intelligence Engine — Historical Signals
Extracts historical incident frequency, historical delay performance, and asset lifecycle signals.
"""

from typing import Dict, Any

def extract_history_signals(entity: Dict[str, Any]) -> Dict[str, Any]:
    hist_delay_rate = float(entity.get("historical_delay_rate", 0.15))
    prev_delays = int(entity.get("previous_route_delays", 1))
    veh_age = int(entity.get("vehicle_age", 4))
    wh_load = float(entity.get("warehouse_load", 0.65))

    # Reliability factor derived from historical performance
    delay_health = max(0.05, 1.0 - hist_delay_rate)
    incident_factor = max(0.1, 1.0 - (prev_delays * 0.15))
    asset_health = max(0.2, 1.0 - (veh_age / 18.0))

    # Weighted historical score (1.0 = flawless historical record)
    history_score = round((delay_health * 0.45) + (incident_factor * 0.35) + (asset_health * 0.20), 3)

    return {
        "historical_delay_rate": hist_delay_rate,
        "previous_route_delays": prev_delays,
        "vehicle_age_years": veh_age,
        "historical_warehouse_load": wh_load,
        "history_score": history_score
    }
