"""
MeetMux Geospatial Intelligence Engine — Location Signals
Extracts spatial positioning, route corridor alignment, proximity, and regional metadata.
"""

import math
from typing import Dict, Any, Optional

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def extract_location_signals(entity: Dict[str, Any], origin_node: Optional[Dict[str, Any]] = None, dest_node: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    lat = float(entity.get("latitude", 19.0760))
    lng = float(entity.get("longitude", 72.8777))
    total_dist = float(entity.get("shipment_distance", 500.0))

    # Region classification based on coordinates
    if lat > 25.0:
        region = "NORTH"
    elif lat < 15.0:
        region = "SOUTH"
    elif lng > 84.0:
        region = "EAST"
    else:
        region = "WEST"

    # Route deviation estimation
    deviation_km = 0.0
    if origin_node and dest_node:
        orig_lat = float(origin_node.get("latitude", lat))
        orig_lng = float(origin_node.get("longitude", lng))
        dest_lat = float(dest_node.get("latitude", lat))
        dest_lng = float(dest_node.get("longitude", lng))

        # Expected position on line segment
        dist_from_orig = haversine_km(orig_lat, orig_lng, lat, lng)
        dist_to_dest = haversine_km(lat, lng, dest_lat, dest_lng)
        total_corridor_dist = haversine_km(orig_lat, orig_lng, dest_lat, dest_lng)

        # Deviation from ideal corridor line
        if total_corridor_dist > 0:
            excess_dist = (dist_from_orig + dist_to_dest) - total_corridor_dist
            deviation_km = max(0.0, excess_dist)

    # Location alignment score (1.0 = on perfect corridor, drops with excessive deviation or long leg)
    normalized_deviation = min(1.0, deviation_km / 80.0)
    location_score = round(max(0.05, 1.0 - (normalized_deviation * 0.7)), 3)

    return {
        "latitude": lat,
        "longitude": lng,
        "region": region,
        "deviation_km": round(deviation_km, 2),
        "total_distance_km": round(total_dist, 1),
        "location_score": location_score
    }
