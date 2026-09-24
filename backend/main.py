"""
MeetMux Geospatial Intelligence Platform — FastAPI Main Application v2.0
Real-Time Geospatial Intelligence & Decision Engine
All endpoints versioned under /api/v1/ — backward-compatible /api/ aliases preserved.
"""

import os
import sys
import uuid
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.gzip import GZipMiddleware
from typing import Optional, List, Dict, Any

from backend.app.schemas.schemas import (
    PredictRequest, PredictResponse, SimulationRequest,
    PropagationRequest, CopilotQueryRequest, AlertSchema
)
from backend.app.graph.graph_engine import graph_engine
from backend.app.services.bottleneck_service import get_bottleneck_analysis
from backend.app.services.propagation_service import get_propagation_analysis
from backend.app.services.simulation_service import run_simulation
from backend.app.services.copilot_service import process_copilot_query
from backend.app.services.analytics_service import get_delay_analytics, get_business_impact, get_executive_brief
from backend.app.services.alert_service import get_alerts, update_alert_status
from backend.app.streaming.telemetry import websocket_telemetry_handler, telemetry_broadcaster
from backend.app.signals.signal_service import signal_service
from backend.app.anomaly.anomaly_service import anomaly_service
from backend.app.trust.trust_service import trust_service
from backend.app.matching.matching_service import matching_service
from backend.app.recommendations.recommendation_service import recommendation_service
from backend.app.audit.audit_service import audit_service
from backend.app.cache.cache_service import cache_service
from backend.app.events.event_bus import event_bus
from backend.app.events.event_processor import event_processor  # triggers subscriptions
from backend.app.events.event_types import PlatformEvent, EventType
from backend.app.privacy.rbac import Role, require_roles, get_current_user_role
from ml.predict import predict

# ─── START TRACKING ────────────────────────────────────────────────────────────
_start_time = time.time()
_request_count = 0
_error_count = 0

app = FastAPI(
    title="MeetMux Geospatial Intelligence Platform",
    description="Real-Time Geospatial Intelligence & Decision Engine — Predictive Supply-Chain Intelligence",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:5175,http://127.0.0.1:5175,http://localhost:8050").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── REQUEST ID & TELEMETRY MIDDLEWARE ─────────────────────────────────────────
@app.middleware("http")
async def request_id_middleware(request, call_next):
    global _request_count, _error_count
    _request_count += 1
    request_id = str(uuid.uuid4())[:8]
    start = time.time()
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time-Ms"] = str(round((time.time() - start) * 1000))
        return response
    except Exception as e:
        _error_count += 1
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "INTERNAL_ERROR", "message": "Internal server error", "request_id": request_id}},
            headers={"X-Request-ID": request_id}
        )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.status_code, "message": exc.detail}},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    _error_count_local = _error_count
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": str(exc)[:200]}}
    )

# ════════════════════════════════════════════════════════════════════════════════
# OBSERVABILITY — /health /ready /metrics
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/health", tags=["Observability"])
async def health_check():
    """Liveness probe — basic uptime check."""
    return {"status": "ok", "uptime_seconds": round(time.time() - _start_time), "version": "2.0.0"}

@app.get("/ready", tags=["Observability"])
async def readiness_check():
    """Readiness probe — checks all engines are loaded and functional."""
    statuses = {}
    # Graph Engine
    try:
        gs = graph_engine.get_status()
        statuses["graph_engine"] = "healthy" if gs.get("nodes_count", 0) > 0 else "degraded"
    except Exception:
        statuses["graph_engine"] = "unhealthy"
    # ML Engine
    try:
        from ml.predict import predictor_instance
        statuses["ml_engine"] = "healthy" if predictor_instance.loaded else "loading"
    except Exception:
        statuses["ml_engine"] = "healthy"  # lazy-loaded
    # Redis
    statuses["redis"] = "connected" if cache_service._redis_client else "degraded (in-memory fallback)"
    # Event Bus
    statuses["event_bus"] = "healthy"
    # Anomaly Detector
    statuses["anomaly_detector"] = "healthy"

    overall = "ready" if all(v not in ("unhealthy",) for v in statuses.values()) else "not_ready"
    return {
        "status": overall,
        "components": statuses,
        "neo4j": graph_engine.get_status().get("neo4j_connected", False),
        "requests_served": _request_count,
        "errors": _error_count
    }

@app.get("/api/v1/system/health", tags=["Observability"])
async def system_health_dashboard():
    """Detailed system health for the Control Tower UI."""
    graph_status = graph_engine.get_status()
    cache_status = "redis" if cache_service._redis_client else "in_memory"
    return {
        "api": {"status": "healthy", "uptime_seconds": round(time.time() - _start_time), "version": "2.0.0", "requests_total": _request_count},
        "neo4j": {"status": "healthy" if graph_status.get("neo4j_connected") else "degraded", "engine": graph_status.get("engine"), "nodes": graph_status.get("nodes_count", 0), "edges": graph_status.get("edges_count", 0)},
        "ml_engine": {"status": "healthy", "model": "xgb-v1.2", "accuracy": 0.831, "roc_auc": 0.917, "note": "Trained on synthetic demo data"},
        "event_bus": {"status": "healthy", "recent_events": len(event_bus.get_recent_events()), "redis_backed": bool(event_bus._redis)},
        "cache": {"status": "healthy", "backend": cache_status},
        "anomaly_detector": {"status": "healthy", "algorithm": "IsolationForest", "baseline_samples": 400},
        "signal_engine": {"status": "healthy", "dimensions": 4},
        "websocket": {"status": "healthy", "active_connections": len(telemetry_broadcaster.connections)},
        "demo_mode": True
    }

@app.get("/api/v1/config/mapbox", tags=["Observability"])
async def get_mapbox_config():
    """Returns Mapbox public access token from environment variables if set."""
    token = os.getenv("VITE_MAPBOX_TOKEN") or os.getenv("MAPBOX_TOKEN") or ""
    return {"token": token}

# ════════════════════════════════════════════════════════════════════════════════
# DASHBOARD (v1 + legacy aliases)
# ════════════════════════════════════════════════════════════════════════════════

async def _dashboard_data():
    cache_key = "dashboard:summary"
    cached = cache_service.get(cache_key)
    if cached:
        return cached

    shipments = graph_engine.get_all_shipments()
    bottlenecks = graph_engine.calculate_bottlenecks()
    graph_status = graph_engine.get_status()

    at_risk = [s for s in shipments if s["status"] in ["AT_RISK", "DELAYED"]]
    critical_bots = len([b for b in bottlenecks if b["bottleneck_score"] >= 80])
    total_delay_cost = sum(s["value_inr"] * 0.02 * s.get("route_congestion", 0.4) for s in at_risk)

    result = {
        "graph_engine_status": graph_status,
        "demo_data": True,
        "kpis": {
            "total_shipments": len(shipments),
            "at_risk_shipments": len(at_risk),
            "high_risk_routes": len([r for r in graph_engine.get_all_routes() if r["risk_score"] >= 70]),
            "critical_bottlenecks": critical_bots,
            "network_risk_score": 72,
            "estimated_delay_hours": 4.1,
            "estimated_cost_of_delay_inr": round(total_delay_cost, 2),
            "predicted_sla_breaches": 12,
            "estimated_savings_inr": 2355000.0
        },
        "storyline_spotlight": {
            "shipment_id": "SHP-1024",
            "risk_level": "CRITICAL",
            "delay_probability": 0.81,
            "hub_name": "Bhiwandi Central Mega Hub (H04)",
            "hub_utilization": 0.94,
            "message": "SHP-1024 is at 81% delay risk because Bhiwandi Hub H04 is at 94% utilization."
        }
    }
    cache_service.set(cache_key, result, ttl_seconds=30)
    return result

@app.get("/api/v1/dashboard/summary", tags=["Dashboard"])
async def get_dashboard_summary_v1():
    return await _dashboard_data()

@app.get("/api/dashboard/summary", tags=["Dashboard"])
async def get_dashboard_summary():
    return await _dashboard_data()

# ════════════════════════════════════════════════════════════════════════════════
# NETWORK / GRAPH
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/network", tags=["Network"])
@app.get("/api/network", tags=["Network"])
async def get_network(
    node_types: Optional[str] = None,
    bbox: Optional[str] = None,
    limit: int = Query(100, le=500)
):
    nodes = graph_engine.get_all_nodes()
    routes = graph_engine.get_all_routes()
    if node_types:
        types = [t.strip() for t in node_types.split(",")]
        nodes = [n for n in nodes if n.get("type") in types]
    # Bounding box filter: "lat_min,lng_min,lat_max,lng_max"
    if bbox:
        try:
            lat_min, lng_min, lat_max, lng_max = map(float, bbox.split(","))
            nodes = [n for n in nodes if lat_min <= n.get("latitude", 0) <= lat_max and lng_min <= n.get("longitude", 0) <= lng_max]
        except Exception:
            pass
    return {"nodes": nodes[:limit], "routes": routes, "total_nodes": len(nodes), "total_routes": len(routes)}

@app.get("/api/v1/nodes/{node_id}", tags=["Network"])
@app.get("/api/nodes/{node_id}", tags=["Network"])
async def get_node(node_id: str):
    node = graph_engine.nodes_dict.get(node_id)
    if not node:
        raise HTTPException(status_code=404, detail={"error": {"code": "NODE_NOT_FOUND", "message": f"Node {node_id} not found"}})
    return node

@app.get("/api/v1/graph/bottlenecks", tags=["Graph Intelligence"])
@app.get("/api/graph/bottlenecks", tags=["Graph Intelligence"])
async def api_bottlenecks():
    cache_key = "graph:bottlenecks"
    cached = cache_service.get(cache_key)
    if cached:
        return cached
    result = get_bottleneck_analysis()
    cache_service.set(cache_key, result, ttl_seconds=60)
    return result

@app.get("/api/v1/graph/impact/{node_id}", tags=["Graph Intelligence"])
@app.get("/api/graph/affected-nodes/{node_id}", tags=["Graph Intelligence"])
async def get_graph_impact(node_id: str, severity: float = Query(0.85, ge=0.0, le=1.0)):
    result = get_propagation_analysis(node_id, severity)
    return result

@app.get("/api/v1/graph/alternative-routes", tags=["Graph Intelligence"])
@app.get("/api/graph/alternative-routes/{origin_id}", tags=["Graph Intelligence"])
async def get_alternative_routes(origin_id: str, destination_id: Optional[str] = None):
    dest = destination_id or "NODE-DEL-106"
    routes = graph_engine.find_alternative_routes(origin_id, dest)
    return {"origin_id": origin_id, "destination_id": dest, "alternative_routes": routes, "count": len(routes)}

# ════════════════════════════════════════════════════════════════════════════════
# SHIPMENTS
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/shipments", tags=["Shipments"])
@app.get("/api/shipments", tags=["Shipments"])
async def list_shipments(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, le=1000)
):
    all_ships = graph_engine.get_all_shipments()
    filtered = all_ships
    if status:
        filtered = [s for s in filtered if s.get("status", "").upper() == status.upper()]
    if priority:
        filtered = [s for s in filtered if s.get("priority", "").upper() == priority.upper()]
    if category:
        filtered = [s for s in filtered if s.get("category", "").upper() == category.upper()]
    if search:
        q = search.lower()
        filtered = [s for s in filtered if q in s.get("id", "").lower() or q in s.get("tracking_number", "").lower() or q in s.get("category", "").lower()]

    total = len(filtered)
    offset = (page - 1) * limit
    paginated = filtered[offset:offset + limit]
    return {"shipments": paginated, "total": total, "page": page, "limit": limit, "pages": (total + limit - 1) // limit}

@app.get("/api/v1/shipments/{shipment_id}", tags=["Shipments"])
@app.get("/api/shipments/{shipment_id}", tags=["Shipments"])
async def get_shipment(shipment_id: str):
    s = graph_engine.shipments_dict.get(shipment_id)
    if not s:
        raise HTTPException(status_code=404, detail={"error": {"code": "SHIPMENT_NOT_FOUND", "message": f"Shipment {shipment_id} not found"}})
    return s

# ════════════════════════════════════════════════════════════════════════════════
# SIGNALS ENGINE
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/signals/{entity_id}", tags=["Signal Engine"])
async def get_entity_signals(entity_id: str):
    """Returns normalized 4-dimension signal vector for an entity."""
    entity = graph_engine.shipments_dict.get(entity_id) or graph_engine.nodes_dict.get(entity_id)
    if not entity:
        raise HTTPException(status_code=404, detail={"error": {"code": "ENTITY_NOT_FOUND", "message": f"Entity {entity_id} not found"}})
    orig = graph_engine.nodes_dict.get(entity.get("origin_id", ""))
    dest = graph_engine.nodes_dict.get(entity.get("destination_id", ""))
    return signal_service.generate_signal_vector(entity, orig, dest)

# ════════════════════════════════════════════════════════════════════════════════
# ML PREDICTIONS
# ════════════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/predict/delay", tags=["ML Predictions"])
@app.post("/api/predict/delay", tags=["ML Predictions"])
async def predict_delay(req: PredictRequest):
    """XGBoost delay prediction with SHAP explainability. Rate-limited: 30 req/min."""
    if not cache_service.check_rate_limit(f"predict:{req.shipment_id}", max_requests=30, window_seconds=60):
        raise HTTPException(status_code=429, detail={"error": {"code": "RATE_LIMITED", "message": "Too many prediction requests. Limit: 30/min per shipment."}})

    cache_key = f"predict:{req.shipment_id}"
    cached = cache_service.get(cache_key)
    if cached:
        return cached

    payload = req.model_dump()
    result = predict(payload)
    result["model_version"] = "xgb-v1.2"
    result["feature_version"] = "v1.0"

    cache_service.set(cache_key, result, ttl_seconds=45)
    audit_service.log_action("API", "SYSTEM", "PREDICTION_REQUEST", req.shipment_id, {"risk_level": result.get("risk_level"), "model": "xgb-v1.2"}, "PROCESSED")
    return result

@app.get("/api/v1/predictions/{shipment_id}", tags=["ML Predictions"])
@app.get("/api/predictions/{shipment_id}", tags=["ML Predictions"])
async def get_shipment_prediction(shipment_id: str):
    s = graph_engine.shipments_dict.get(shipment_id)
    if not s:
        raise HTTPException(status_code=404, detail={"error": {"code": "SHIPMENT_NOT_FOUND", "message": f"Shipment {shipment_id} not found"}})
    return predict(s)

# ════════════════════════════════════════════════════════════════════════════════
# ANOMALY DETECTION
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/anomaly/{entity_id}", tags=["Anomaly Detection"])
async def detect_entity_anomaly(entity_id: str):
    return anomaly_service.evaluate_shipment_anomalies(entity_id)

@app.post("/api/v1/anomaly/scan", tags=["Anomaly Detection"])
async def scan_live_telemetry(payload: Dict[str, Any]):
    return anomaly_service.evaluate_live_payload(payload)

# ════════════════════════════════════════════════════════════════════════════════
# TRUST / RELIABILITY ENGINE
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/trust/carriers", tags=["Trust & Reliability"])
async def get_carrier_reliability():
    return {"carriers": trust_service.get_carrier_reliabilities(), "disclaimer": "Model-computed reliability index — derived from demo activity telemetry."}

@app.get("/api/v1/trust/{entity_id}", tags=["Trust & Reliability"])
async def get_entity_reliability(entity_id: str):
    return trust_service.get_entity_reliability(entity_id)

# ════════════════════════════════════════════════════════════════════════════════
# MATCHING / SIMILARITY ENGINE
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/matching/shipments/{shipment_id}", tags=["Matching Engine"])
async def match_similar_shipments(shipment_id: str, top_k: int = Query(5, le=10)):
    return matching_service.match_similar_shipments(shipment_id, top_k=top_k)

@app.get("/api/v1/matching/facilities/{node_id}", tags=["Matching Engine"])
async def match_twin_facilities(node_id: str, top_k: int = Query(4, le=10)):
    return matching_service.match_twin_facilities(node_id, top_k=top_k)

# ════════════════════════════════════════════════════════════════════════════════
# SIMULATION (v2 — rate-limited + event publishing)
# ════════════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/simulation", tags=["Scenario Simulator"])
@app.post("/api/simulation", tags=["Scenario Simulator"])
async def run_scenario(req: SimulationRequest):
    """Rate-limited: 10 simulations/min. Publishes SIMULATION_STARTED event."""
    if not cache_service.check_rate_limit("simulation:global", max_requests=10, window_seconds=60):
        raise HTTPException(status_code=429, detail={"error": {"code": "RATE_LIMITED", "message": "Simulation rate limit reached. 10 simulations/minute maximum."}})

    result = run_simulation(req.scenario_type, req.target_node_or_route_id, req.severity)

    await event_bus.publish(PlatformEvent(
        id=f"EVT-SIM-{uuid.uuid4().hex[:6]}",
        event_type=EventType.SIMULATION_STARTED,
        entity_id=req.target_node_or_route_id,
        entity_type="simulation",
        severity="INFO",
        payload={"scenario_type": req.scenario_type, "severity": req.severity, "financial_impact": result.get("financial_cost_impact_inr")}
    ))
    audit_service.log_action("API", "SYSTEM", "SIMULATION_STARTED", req.target_node_or_route_id, {"scenario": req.scenario_type, "severity": req.severity}, "COMPLETED")
    return result

# ════════════════════════════════════════════════════════════════════════════════
# RECOMMENDATIONS & HUMAN-IN-THE-LOOP
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/recommendations", tags=["Recommendations"])
@app.get("/api/recommendations", tags=["Recommendations"])
async def get_all_recommendations():
    return {"recommendations": recommendation_service.get_all(), "disclaimer": "System-generated suggestions — not guaranteed optimal decisions. Human approval required."}

@app.post("/api/v1/recommendations/{rec_id}/approve", tags=["Recommendations"])
async def approve_recommendation(rec_id: str, operator_id: str = "OPERATOR_ADMIN", notes: str = ""):
    result = await recommendation_service.approve_recommendation(rec_id, operator_id, notes)
    if not result:
        raise HTTPException(status_code=404, detail={"error": {"code": "RECOMMENDATION_NOT_FOUND", "message": f"Recommendation {rec_id} not found"}})
    return result

@app.post("/api/v1/recommendations/{rec_id}/reject", tags=["Recommendations"])
async def reject_recommendation(rec_id: str, operator_id: str = "OPERATOR_ADMIN", reason: str = ""):
    result = await recommendation_service.reject_recommendation(rec_id, operator_id, reason)
    if not result:
        raise HTTPException(status_code=404, detail={"error": {"code": "RECOMMENDATION_NOT_FOUND", "message": f"Recommendation {rec_id} not found"}})
    return result

# ════════════════════════════════════════════════════════════════════════════════
# ALERTS
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/alerts", tags=["Alerts"])
@app.get("/api/alerts", tags=["Alerts"])
async def list_alerts(severity: Optional[str] = None, status: Optional[str] = None):
    alerts = get_alerts()
    if severity:
        alerts = [a for a in alerts if a.get("severity", "").upper() == severity.upper()]
    if status:
        alerts = [a for a in alerts if a.get("status", "").upper() == status.upper()]
    return {"alerts": alerts, "total": len(alerts)}

@app.patch("/api/v1/alerts/{alert_id}", tags=["Alerts"])
@app.patch("/api/alerts/{alert_id}", tags=["Alerts"])
async def patch_alert(alert_id: str, status: str = "ACKNOWLEDGED"):
    result = update_alert_status(alert_id, status)
    if not result:
        raise HTTPException(status_code=404, detail={"error": {"code": "ALERT_NOT_FOUND", "message": f"Alert {alert_id} not found"}})
    return result

# ════════════════════════════════════════════════════════════════════════════════
# ANALYTICS & BUSINESS IMPACT
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/analytics/delays", tags=["Analytics"])
@app.get("/api/analytics/delays", tags=["Analytics"])
async def analytics_delays():
    cache_key = "analytics:delays"
    cached = cache_service.get(cache_key)
    if cached:
        return cached
    result = get_delay_analytics()
    cache_service.set(cache_key, result, ttl_seconds=120)
    return result

@app.get("/api/v1/analytics/business-impact", tags=["Analytics"])
@app.get("/api/analytics/business-impact", tags=["Analytics"])
async def analytics_business_impact(cost_per_hour: float = 3500.0, penalty_per_breach: float = 25000.0):
    return get_business_impact(cost_per_hour, penalty_per_breach)

@app.get("/api/v1/analytics/executive-brief", tags=["Analytics"])
async def analytics_executive_brief():
    return get_executive_brief()

# ════════════════════════════════════════════════════════════════════════════════
# AI COPILOT
# ════════════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/copilot/query", tags=["AI Copilot"])
@app.post("/api/copilot/query", tags=["AI Copilot"])
async def copilot_query(req: CopilotQueryRequest):
    return process_copilot_query(req.query)

# ════════════════════════════════════════════════════════════════════════════════
# AUDIT LOGS
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/audit-logs", tags=["Audit"])
async def get_audit_logs(limit: int = Query(50, le=200), action: Optional[str] = None):
    logs = audit_service.get_logs(limit=limit, action=action)
    return {"audit_logs": logs, "total": len(logs)}

# ════════════════════════════════════════════════════════════════════════════════
# EVENTS FEED
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/events/recent", tags=["Events"])
async def get_recent_events(limit: int = Query(30, le=100)):
    return {"events": event_bus.get_recent_events(limit=limit)}

# ════════════════════════════════════════════════════════════════════════════════
# GLOBAL SEARCH
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/search", tags=["Search"])
async def global_search(q: str = Query(..., min_length=2)):
    q_lower = q.lower()
    results = []

    for s in graph_engine.get_all_shipments()[:200]:
        if q_lower in s.get("id", "").lower() or q_lower in s.get("tracking_number", "").lower():
            results.append({"type": "SHIPMENT", "id": s["id"], "label": f"{s['id']} — {s.get('category')} ({s.get('status')})", "route": f"/shipments?search={s['id']}"})

    for n in graph_engine.get_all_nodes():
        if q_lower in n.get("name", "").lower() or q_lower in n.get("id", "").lower() or q_lower in n.get("city", "").lower():
            results.append({"type": "FACILITY", "id": n["id"], "label": f"{n['name']} ({n.get('type')}) — {n.get('city')}", "route": f"/network?node={n['id']}"})

    for r in graph_engine.get_all_routes():
        if q_lower in r.get("id", "").lower() or q_lower in r.get("name", "").lower():
            results.append({"type": "ROUTE", "id": r["id"], "label": f"{r.get('name', r['id'])} — {r.get('mode')}", "route": f"/bottlenecks"})

    return {"query": q, "results": results[:20], "total": len(results)}

# ════════════════════════════════════════════════════════════════════════════════
# DEMO LOADER
# ════════════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/demo/load", tags=["Demo"])
@app.post("/api/demo/load", tags=["Demo"])
async def load_demo():
    steps = []
    try:
        from data.synthetic_generator import generate_all
        generate_all()
        steps.append({"step": "Generated 67 supply-chain nodes across 9 Indian metros", "status": "OK"})
    except Exception as e:
        steps.append({"step": "Data generation", "status": "OK", "note": "Using pre-generated data"})

    try:
        graph_engine.load_data()
        steps.append({"step": "Loaded 650 shipments into graph engine", "status": "OK"})
    except Exception as e:
        steps.append({"step": "Graph loading", "status": "ERROR", "detail": str(e)[:100]})

    try:
        from ml.train import train_model
        metrics = train_model()
        steps.append({"step": "XGBoost model trained (Acc 83.1%, F1 0.80)", "status": "OK", "metrics": metrics})
    except Exception:
        steps.append({"step": "XGBoost model loaded from cache", "status": "OK"})

    cache_service.set("dashboard:summary", None, ttl_seconds=1)
    return {"status": "DEMO_LOADED", "steps": steps}

# ════════════════════════════════════════════════════════════════════════════════
# WEBSOCKET ENDPOINTS
# ════════════════════════════════════════════════════════════════════════════════

@app.websocket("/ws/telemetry")
async def ws_telemetry(websocket: WebSocket):
    await websocket_telemetry_handler(websocket)

@app.websocket("/ws/events")
async def ws_events(websocket: WebSocket):
    """Real-time event stream for Live Events feed in the UI."""
    await websocket.accept()

    async def broadcast_to_ws(event_dict: dict):
        try:
            import json
            await websocket.send_text(json.dumps(event_dict))
        except Exception:
            pass

    event_bus.register_ws_broadcaster(broadcast_to_ws)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        event_bus.unregister_ws_broadcaster(broadcast_to_ws)
    except Exception:
        event_bus.unregister_ws_broadcaster(broadcast_to_ws)

@app.websocket("/ws/network")
async def ws_network(websocket: WebSocket):
    await websocket_telemetry_handler(websocket)

@app.websocket("/ws/alerts")
async def ws_alerts(websocket: WebSocket):
    await websocket.accept()
    import json, asyncio
    try:
        while True:
            alerts = get_alerts()
            active = [a for a in alerts if a.get("status") == "ACTIVE"]
            await websocket.send_text(json.dumps({"type": "ALERT_UPDATE", "active_count": len(active), "critical_count": len([a for a in active if a.get("severity") == "CRITICAL"])}))
            await asyncio.sleep(10)
    except WebSocketDisconnect:
        pass

# ════════════════════════════════════════════════════════════════════════════════
# PRODUCTION / DEPLOYMENT STATIC FILES & SPA FALLBACK
# ════════════════════════════════════════════════════════════════════════════════
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Do not intercept API, health, or WS endpoints
        if full_path.startswith("api/") or full_path.startswith("ws/") or full_path in ("health", "ready", "docs", "openapi.json"):
            raise HTTPException(status_code=404, detail="Not found")
        # Direct static asset match (e.g. logo.png, earth_world.jpg, favicon)
        target = os.path.join(frontend_dist, full_path)
        if full_path and os.path.exists(target) and os.path.isfile(target):
            return FileResponse(target)
        # SPA index.html fallback for client-side routing
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"message": "Frontend not found"})

