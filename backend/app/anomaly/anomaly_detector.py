"""
MeetMux Geospatial Intelligence Engine — Telemetry Anomaly Detector
Implements Scikit-learn IsolationForest combined with operational boundary diagnostics.
Detects speed drops, corridor deviation, thermal drift, abnormal stops, and facility overload.
"""

import numpy as np
from typing import Dict, Any, List, Tuple
from sklearn.ensemble import IsolationForest

class AnomalyDetector:
    def __init__(self):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.10,
            random_state=42
        )
        self.is_fitted = False
        self._fit_baseline()

    def _fit_baseline(self):
        """
        Fits baseline IsolationForest on typical operational distributions.
        Features: [current_speed, average_speed, temperature, stops, congestion, deviation]
        """
        np.random.seed(42)
        n_samples = 400
        speeds = np.random.normal(52.0, 10.0, n_samples)
        avg_speeds = np.random.normal(50.0, 8.0, n_samples)
        temps = np.random.normal(22.0, 4.0, n_samples)
        stops = np.random.poisson(2, n_samples)
        congestion = np.random.beta(2, 5, n_samples)
        deviations = np.random.exponential(5.0, n_samples)

        X_normal = np.column_stack([speeds, avg_speeds, temps, stops, congestion, deviations])
        self.model.fit(X_normal)
        self.is_fitted = True

    def detect_anomalies(self, entity: Dict[str, Any], deviation_km: float = 0.0) -> Tuple[float, List[str]]:
        """
        Evaluates an entity payload for telemetry anomalies.
        Returns: (anomaly_score: float [0.0 - 1.0], anomaly_reasons: List[str])
        """
        curr_speed = float(entity.get("current_speed", 45.0))
        avg_speed = float(entity.get("average_speed", 50.0))
        temp = float(entity.get("temperature", 24.0))
        stops = int(entity.get("number_of_stops", 2))
        congestion = float(entity.get("route_congestion", 0.35))
        category = str(entity.get("category", "")).upper()
        wh_load = float(entity.get("warehouse_load", 0.65))

        feature_vector = np.array([[curr_speed, avg_speed, temp, stops, congestion, deviation_km]])
        
        # Isolation Forest anomaly score (-0.5 to 0.5 where lower is more anomalous)
        if self.is_fitted:
            raw_score = self.model.decision_function(feature_vector)[0]
            # Normalize to 0.0 (normal) to 1.0 (highly anomalous)
            if_score = float(np.clip(0.5 - raw_score, 0.05, 0.98))
        else:
            if_score = 0.20

        anomalies = []

        # 1. Sudden speed drop check
        if avg_speed > 30.0 and curr_speed < (avg_speed * 0.45):
            anomalies.append(f"Abnormally low transit speed ({curr_speed} km/h vs {avg_speed} km/h baseline)")

        # 2. Unusual route corridor deviation
        if deviation_km > 25.0:
            anomalies.append(f"Unusual route deviation ({round(deviation_km, 1)} km off primary corridor)")

        # 3. Abnormal stop frequency
        if stops >= 5:
            anomalies.append(f"Unusual stop frequency ({stops} checkpoint halts recorded)")

        # 4. Thermal drift for cold-chain / sensitive cargo
        if category == "PHARMA" and temp > 22.0:
            anomalies.append(f"Cold-chain temperature excursion detected ({temp}°C > 22°C threshold)")
        elif temp > 38.0 or temp < 5.0:
            anomalies.append(f"Ambient temperature anomaly ({temp}°C outside standard operating range)")

        # 5. Facility congestion / overload
        if wh_load >= 0.90:
            anomalies.append(f"Abnormal staging hub overload ({int(wh_load * 100)}% dock capacity)")

        # Reconcile heuristic rule signals with IsolationForest score
        heuristic_boost = len(anomalies) * 0.18
        final_anomaly_score = float(np.clip(max(if_score, heuristic_boost), 0.05, 0.99))

        return round(final_anomaly_score, 3), anomalies

anomaly_detector = AnomalyDetector()
