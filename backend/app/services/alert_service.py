"""
MeetMux Control Tower — Alert Management Service
Generates, manages, and updates alerts with severity classification and ₹ exposure tracking.
"""

import json
import os
from datetime import datetime, timezone
from typing import List

ALERTS_FILE = "data/alerts.json"

INITIAL_ALERTS = [
    {
        "id": "ALT-001",
        "severity": "CRITICAL",
        "timestamp": "2026-09-24T10:42:00+05:30",
        "entity_id": "NODE-MUM-102",
        "entity_name": "Bhiwandi Central Mega Hub (H04)",
        "reason": "Hub utilization at 94% — Inbound queue overflow imminent. 23 critical SLA pharma shipments blocked.",
        "recommended_investigation": "Trigger emergency capacity allocation. Reroute SHP-1024, SHP-1056, SHP-1088 via NH-48 bypass.",
        "financial_exposure_inr": 8450000.0,
        "status": "ACTIVE"
    },
    {
        "id": "ALT-002",
        "severity": "HIGH",
        "timestamp": "2026-09-24T10:58:00+05:30",
        "entity_id": "SHP-1024",
        "entity_name": "SHP-1024 (Pharma Critical — ₹45L Batch)",
        "reason": "Delay probability at 81%. Cold chain temperature drift detected (24.5°C). SLA breach predicted in 4.2 hours.",
        "recommended_investigation": "Expedite cold storage vehicle dispatch. Contact consignee for SLA extension.",
        "financial_exposure_inr": 4500000.0,
        "status": "ACTIVE"
    },
    {
        "id": "ALT-003",
        "severity": "HIGH",
        "timestamp": "2026-09-24T11:15:00+05:30",
        "entity_id": "ROUTE-501",
        "entity_name": "Mumbai–Delhi NH-48 Trunk Corridor",
        "reason": "SEVERE traffic congestion detected. Average speed dropped from 55 km/h to 18 km/h.",
        "recommended_investigation": "Activate sub-corridor bypass. Notify drivers on 34 in-transit vehicles.",
        "financial_exposure_inr": 2850000.0,
        "status": "ACTIVE"
    },
    {
        "id": "ALT-004",
        "severity": "MEDIUM",
        "timestamp": "2026-09-24T11:22:00+05:30",
        "entity_id": "NODE-DEL-106",
        "entity_name": "Okhla Fulfilment Center (H02)",
        "reason": "89% utilization with 14 unprocessed CRITICAL_SLA electronics shipments. Processing SLA at risk.",
        "recommended_investigation": "Prioritize electronics batch processing. Defer FMCG to night shift.",
        "financial_exposure_inr": 2200000.0,
        "status": "ACTIVE"
    },
    {
        "id": "ALT-005",
        "severity": "MEDIUM",
        "timestamp": "2026-09-24T11:40:00+05:30",
        "entity_id": "SHP-1042",
        "entity_name": "SHP-1042 (Electronics — ₹28L Consumer Goods)",
        "reason": "Delay probability at 74%. Route congestion at 84% on Okhla inbound corridor.",
        "recommended_investigation": "Reroute through Noida secondary entry. Confirm alternate dock slot.",
        "financial_exposure_inr": 2800000.0,
        "status": "ACTIVE"
    },
    {
        "id": "ALT-006",
        "severity": "INFO",
        "timestamp": "2026-09-24T11:55:00+05:30",
        "entity_id": "NODE-PORT-101",
        "entity_name": "JNPT Nhava Sheva Port",
        "reason": "Above-average vessel berthing queue. ETA for next container clearance: +6 hours vs baseline.",
        "recommended_investigation": "Monitor port authority clearance notifications. Pre-schedule truck staging.",
        "financial_exposure_inr": 580000.0,
        "status": "ACTIVE"
    }
]

def _load_alerts():
    if os.path.exists(ALERTS_FILE):
        with open(ALERTS_FILE, "r") as f:
            return json.load(f)
    return INITIAL_ALERTS

def _save_alerts(alerts):
    with open(ALERTS_FILE, "w") as f:
        json.dump(alerts, f, indent=2)

def get_alerts():
    return _load_alerts()

def update_alert_status(alert_id: str, new_status: str):
    alerts = _load_alerts()
    for a in alerts:
        if a["id"] == alert_id:
            a["status"] = new_status
            if new_status == "RESOLVED":
                a["resolved_at"] = datetime.now(timezone.utc).isoformat()
    _save_alerts(alerts)
    return next((a for a in alerts if a["id"] == alert_id), None)
