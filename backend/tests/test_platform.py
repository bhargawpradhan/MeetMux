"""
MeetMux Control Tower — Automated Test Suite
Verifies ML pipeline, graph calculations, bottleneck scoring, propagation, and API endpoints.
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from ml.predict import predict
from backend.app.graph.graph_engine import graph_engine
from backend.app.services.bottleneck_service import get_bottleneck_analysis
from backend.app.services.propagation_service import get_propagation_analysis
from backend.app.services.simulation_service import run_simulation
from backend.app.services.recommendation_service import get_recommendations
from backend.app.services.copilot_service import process_copilot_query

class TestMeetMuxPlatform(unittest.TestCase):

    def test_ml_prediction(self):
        sample = {
            "id": "SHP-1024",
            "priority": "CRITICAL_SLA",
            "current_speed": 18.0,
            "average_speed": 42.0,
            "temperature": 24.5,
            "humidity": 78.0,
            "route_congestion": 0.92,
            "historical_delay_rate": 0.55,
            "number_of_stops": 5,
            "warehouse_load": 0.94,
            "vehicle_age": 7,
            "previous_route_delays": 4,
            "time_of_day": 14,
            "day_of_week": 2,
            "weather_severity": 8,
            "value_inr": 4500000.0,
            "shipment_distance": 1420.0
        }
        res = predict(sample)
        self.assertIn("delay_probability", res)
        self.assertIn("risk_level", res)
        self.assertIn("top_risk_factors", res)
        self.assertTrue(res["delay_probability"] > 0.5)
        self.assertEqual(res["risk_level"], "CRITICAL")
        self.assertTrue(len(res["top_risk_factors"]) > 0)
        print("  [PASS] ML Prediction & SHAP Explainability Engine verified.")

    def test_graph_bottlenecks(self):
        b = get_bottleneck_analysis()
        self.assertIn("bottlenecks", b)
        self.assertTrue(len(b["bottlenecks"]) >= 50)
        top = b["bottlenecks"][0]
        self.assertTrue(top["bottleneck_score"] > 60)
        print("  [PASS] Graph Bottleneck Centrality Scoring verified.")

    def test_disruption_propagation(self):
        prop = get_propagation_analysis("NODE-MUM-102", 0.85)
        self.assertIn("hops", prop)
        self.assertEqual(len(prop["hops"]), 3)
        self.assertTrue(prop["total_affected_shipments"] > 0)
        print("  [PASS] Disruption Multi-Hop Propagation verified.")

    def test_scenario_simulation(self):
        sim = run_simulation("warehouse_failure", "NODE-MUM-102", 0.75)
        self.assertIn("avg_delay_risk_before", sim)
        self.assertIn("avg_delay_risk_after", sim)
        self.assertTrue(sim["avg_delay_risk_after"] > sim["avg_delay_risk_before"])
        print("  [PASS] Scenario Simulator (What-If) verified.")

    def test_recommendations(self):
        recs = get_recommendations()
        self.assertIn("recommendations", recs)
        self.assertTrue(len(recs["recommendations"]) >= 3)
        print("  [PASS] Recommendations Engine verified.")

    def test_copilot_intent_router(self):
        resp = process_copilot_query("Why is SHP-1024 late?")
        self.assertEqual(resp["intent"], "SHIPMENT_RISK_INQUIRY")
        self.assertIn("structured_cards", resp)
        print("  [PASS] AI Copilot Intent Routing verified.")

if __name__ == "__main__":
    unittest.main()
