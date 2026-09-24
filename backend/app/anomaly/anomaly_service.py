"""
MeetMux Geospatial Intelligence Engine — Anomaly Service
Wraps telemetry anomaly detection for shipments, routes, and facility telemetry streams.
"""

from typing import Dict, Any, List
from backend.app.anomaly.anomaly_detector import anomaly_detector
from backend.app.signals.location_signals import extract_location_signals
from backend.app.graph.graph_engine import graph_engine

class AnomalyService:
    def evaluate_shipment_anomalies(self, shipment_id: str) -> Dict[str, Any]:
        shipment = graph_engine.shipments_dict.get(shipment_id)
        if not shipment:
            shipments = graph_engine.get_all_shipments()
            shipment = shipments[0] if shipments else {}

        orig = graph_engine.nodes_dict.get(shipment.get("origin_id", ""))
        dest = graph_engine.nodes_dict.get(shipment.get("destination_id", ""))

        loc_sig = extract_location_signals(shipment, orig, dest)
        deviation = loc_sig.get("deviation_km", 0.0)

        score, anomalies = anomaly_detector.detect_anomalies(shipment, deviation_km=deviation)
        status = "ANOMALOUS" if score >= 0.65 or len(anomalies) > 0 else "NORMAL"

        return {
            "entity_id": shipment.get("id"),
            "tracking_number": shipment.get("tracking_number"),
            "anomaly_score": score,
            "status": status,
            "anomalies_detected_count": len(anomalies),
            "anomalies": anomalies if anomalies else ["Telemetry conforms to baseline operational distribution"],
            "telemetry_snapshot": {
                "speed_kmh": shipment.get("current_speed"),
                "temperature_c": shipment.get("temperature"),
                "deviation_km": deviation,
                "stops": shipment.get("number_of_stops"),
                "warehouse_load": shipment.get("warehouse_load")
            },
            "disclaimer": "Experimental anomaly detection model — evaluate operational context."
        }

    def evaluate_live_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        deviation = float(payload.get("deviation_km", 0.0))
        score, anomalies = anomaly_detector.detect_anomalies(payload, deviation_km=deviation)
        status = "ANOMALOUS" if score >= 0.65 or len(anomalies) > 0 else "NORMAL"

        return {
            "entity_id": payload.get("id", payload.get("shipment_id", "UNKNOWN")),
            "anomaly_score": score,
            "status": status,
            "anomalies": anomalies,
            "disclaimer": "Experimental anomaly detection model — evaluate operational context."
        }

anomaly_service = AnomalyService()
