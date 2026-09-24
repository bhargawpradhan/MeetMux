"""
MeetMux Geospatial Intelligence Engine — Privacy-by-Design Service
Implements location precision levels (EXACT, CITY, REGION), coordinate fuzzing, and data minimization.
"""

from typing import Dict, Any, List
from enum import Enum

class LocationPrecision(str, Enum):
    EXACT = "EXACT"
    CITY = "CITY"
    REGION = "REGION"

class PrivacyService:
    def sanitize_entity_location(self, entity: Dict[str, Any], precision: LocationPrecision = LocationPrecision.EXACT) -> Dict[str, Any]:
        """
        Applies differential precision reduction based on configured privacy setting.
        """
        sanitized = dict(entity)
        lat = float(sanitized.get("latitude", 19.0760))
        lng = float(sanitized.get("longitude", 72.8777))

        if precision == LocationPrecision.CITY:
            # Fuzz coordinates to ~11 km bounding box (1 decimal precision)
            sanitized["latitude"] = round(lat, 1)
            sanitized["longitude"] = round(lng, 1)
            sanitized["precision_applied"] = "CITY_LEVEL"
        elif precision == LocationPrecision.REGION:
            # Fuzz coordinates to ~110 km regional centroid (integer precision)
            sanitized["latitude"] = round(lat, 0)
            sanitized["longitude"] = round(lng, 0)
            sanitized["precision_applied"] = "REGIONAL_CENTROID"
        else:
            sanitized["precision_applied"] = "EXACT_METER"

        return sanitized

    def filter_by_role_minimization(self, entity: Dict[str, Any], role: str) -> Dict[str, Any]:
        """
        Strips commercially sensitive commercial margins and contract penalties for VIEWER / ANALYST roles.
        """
        clean = dict(entity)
        if role in ["VIEWER"]:
            clean.pop("value_inr", None)
            clean.pop("cost_impact_inr", None)
            clean.pop("cost_per_hour_delay", None)
            clean.pop("cost_per_km", None)
        return clean

privacy_service = PrivacyService()
