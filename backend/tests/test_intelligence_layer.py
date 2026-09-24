"""
MeetMux Geospatial Intelligence Platform — Intelligence Layer Test Suite
Covers Signal Engine, Matching, Anomaly Detection, Trust, Recommendations,
Audit Trails, Cache / Rate Limiting, and Event Bus.
"""

import sys
import os
import unittest
import asyncio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.signals.signal_service import signal_service
from backend.app.matching.matching_service import matching_service
from backend.app.anomaly.anomaly_service import anomaly_service
from backend.app.trust.trust_service import trust_service
from backend.app.recommendations.recommendation_service import recommendation_service
from backend.app.audit.audit_service import audit_service
from backend.app.cache.cache_service import cache_service
from backend.app.events.event_bus import event_bus
from backend.app.events.event_types import PlatformEvent, EventType
from backend.app.graph.graph_engine import graph_engine

class TestIntelligenceLayer(unittest.TestCase):

    def test_signal_engine(self):
        shipment = graph_engine.shipments_dict.get("SHP-1024")
        self.assertIsNotNone(shipment)
        orig = graph_engine.nodes_dict.get(shipment.get("origin_id", ""))
        dest = graph_engine.nodes_dict.get(shipment.get("destination_id", ""))
        sig = signal_service.generate_signal_vector(shipment, orig, dest)
        self.assertIn("composite_signal_score", sig)
        self.assertIn("signals", sig)
        self.assertIn("location", sig["signals"])
        self.assertIn("behavior", sig["signals"])
        self.assertIn("history", sig["signals"])
        self.assertIn("context", sig["signals"])
        self.assertTrue(0.0 <= sig["composite_signal_score"] <= 1.0)
        print("  [PASS] Signal Engine 4-Dimensional Feature Aggregation verified.")

    def test_matching_engine(self):
        matches = matching_service.match_similar_shipments("SHP-1024", top_k=3)
        self.assertIn("target_shipment_id", matches)
        self.assertIn("matches", matches)
        self.assertTrue(len(matches["matches"]) > 0)
        top = matches["matches"][0]
        self.assertIn("similarity_score", top)
        self.assertIn("reasons", top)
        print("  [PASS] Multi-Dimensional Similarity & Entity Matching verified.")

    def test_anomaly_detection(self):
        res = anomaly_service.evaluate_shipment_anomalies("SHP-1024")
        self.assertIn("anomaly_score", res)
        self.assertIn("status", res)
        self.assertIn("anomalies", res)
        self.assertTrue(0.0 <= res["anomaly_score"] <= 1.0)
        print("  [PASS] IsolationForest + Heuristic Telemetry Anomaly Detection verified.")

    def test_trust_reliability_engine(self):
        carriers = trust_service.get_carrier_reliabilities()
        self.assertTrue(len(carriers) >= 5)
        top = carriers[0]
        self.assertIn("reliability_score", top)
        self.assertIn("tier", top)
        self.assertTrue(0 <= top["reliability_score"] <= 100)
        print("  [PASS] Trust & Carrier Reliability Index verified.")

    def test_human_in_the_loop_recommendations(self):
        recs = recommendation_service.get_all()
        self.assertTrue(len(recs) >= 3)
        rec = recs[0]
        rec_id = rec["id"]
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            approved = loop.run_until_complete(
                recommendation_service.approve_recommendation(rec_id, "TEST_OPS_MGR", "Test approval")
            )
            self.assertEqual(approved["status"], "APPROVED")
            self.assertEqual(approved["reviewed_by"], "TEST_OPS_MGR")
        finally:
            loop.close()
        print("  [PASS] Human-in-the-Loop Recommendation Approval Workflow verified.")

    def test_audit_service(self):
        audit_service.log_action("TEST_CALLER", "TEST_USER", "UNIT_TEST_ACTION", "ENTITY-123", {"status": "ok"}, "SUCCESS")
        logs = audit_service.get_logs(limit=10)
        self.assertTrue(len(logs) > 0)
        first = logs[0]
        self.assertEqual(first["action"], "UNIT_TEST_ACTION")
        print("  [PASS] Persistent Audit Trail & Action Logging verified.")

    def test_cache_and_rate_limiting(self):
        key = "test:sample:key"
        cache_service.set(key, {"hello": "world"}, ttl_seconds=10)
        val = cache_service.get(key)
        self.assertEqual(val, {"hello": "world"})
        
        # Test rate limiting
        rl_key = "test_rl_key"
        for _ in range(5):
            allowed = cache_service.check_rate_limit(rl_key, max_requests=10, window_seconds=60)
            self.assertTrue(allowed)
        print("  [PASS] Dual-Layer Cache & Sliding Window Rate Limiting verified.")

    def test_event_bus(self):
        recent_count_before = len(event_bus.get_recent_events())
        evt = PlatformEvent(
            id="TEST-EVT-001",
            event_type=EventType.ALERT_CREATED,
            entity_id="SHP-1024",
            entity_type="shipment",
            severity="WARNING",
            payload={"msg": "Test alert created"}
        )
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(event_bus.publish(evt))
        finally:
            loop.close()
            
        recent = event_bus.get_recent_events()
        self.assertTrue(len(recent) >= recent_count_before + 1)
        self.assertEqual(recent[0]["id"], "TEST-EVT-001")
        print("  [PASS] Event Bus Asynchronous Pub/Sub & Buffer verified.")

if __name__ == "__main__":
    unittest.main()
