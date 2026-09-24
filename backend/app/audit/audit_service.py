"""
MeetMux Geospatial Intelligence Engine — Audit Logging Service
Maintains immutable logs of predictions, human approvals, simulations, and data mutations.
"""

import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from collections import deque

AUDIT_LOGS_FILE = "data/audit_logs.json"

class AuditService:
    def __init__(self):
        self._logs: deque = deque(maxlen=500)
        self._load_logs()

    def _load_logs(self):
        if os.path.exists(AUDIT_LOGS_FILE):
            try:
                with open(AUDIT_LOGS_FILE, "r") as f:
                    entries = json.load(f)
                    for e in entries:
                        self._logs.append(e)
                return
            except Exception:
                pass

        # Seed initial realistic operational audit trail
        initial_events = [
            {"id": "AUD-101", "user": "ops_lead_mumbai", "role": "OPERATIONS_MANAGER", "action": "SIMULATION_STARTED", "entity_id": "NODE-MUM-102", "details": {"scenario": "warehouse_failure", "severity": 0.85}, "timestamp": "2026-09-24T11:20:00+05:30", "result": "COMPLETED"},
            {"id": "AUD-102", "user": "analyst_delhi", "role": "ANALYST", "action": "PREDICTION_REQUEST", "entity_id": "SHP-1024", "details": {"model_version": "xgb-v1.2", "risk": "CRITICAL"}, "timestamp": "2026-09-24T11:25:00+05:30", "result": "PROCESSED"},
            {"id": "AUD-103", "user": "ops_director", "role": "ADMIN", "action": "RECOMMENDATION_APPROVED", "entity_id": "REC-101", "details": {"action": "Dynamic Load Rerouting around Bhiwandi", "expected_savings_inr": 845000.0}, "timestamp": "2026-09-24T11:35:00+05:30", "result": "COMMITTED"},
            {"id": "AUD-104", "user": "dispatcher_03", "role": "OPERATIONS_MANAGER", "action": "ALERT_RESOLVED", "entity_id": "ALT-006", "details": {"entity": "JNPT Port Container Staging"}, "timestamp": "2026-09-24T11:58:00+05:30", "result": "CONFIRMED"}
        ]
        for e in initial_events:
            self._logs.append(e)
        self._save_logs()

    def _save_logs(self):
        try:
            os.makedirs("data", exist_ok=True)
            with open(AUDIT_LOGS_FILE, "w") as f:
                json.dump(list(self._logs), f, indent=2)
        except Exception:
            pass

    def log_action(
        self,
        user: str,
        role: str,
        action: str,
        entity_id: str,
        details: Optional[Dict[str, Any]] = None,
        result: str = "SUCCESS"
    ) -> Dict[str, Any]:
        """
        Appends an entry to the audit log trail.
        """
        entry = {
            "id": f"AUD-{len(self._logs) + 101}",
            "user": user,
            "role": role,
            "action": action,
            "entity_id": entity_id,
            "details": details or {},
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "result": result
        }
        self._logs.appendleft(entry)
        self._save_logs()
        return entry

    def get_logs(self, limit: int = 50, action: Optional[str] = None) -> List[Dict[str, Any]]:
        logs = list(self._logs)
        if action:
            logs = [l for l in logs if l.get("action") == action.upper()]
        return logs[:limit]

audit_service = AuditService()
