# MeetMux Control Tower 🗼
### Predictive Supply-Chain Intelligence — from Telemetry to Decision

[![React 18](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript%20%7C%20TailwindCSS-D6588A)](https://react.dev/)
[![Framer Motion](https://img.shields.io/badge/Animation-Framer%20Motion-F8B4C8)](https://www.framer.com/motion/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.13-009688)](https://fastapi.tiangolo.com/)
[![XGBoost](https://img.shields.io/badge/ML-XGBoost%20%7C%20SHAP-FF6600)](https://xgboost.readthedocs.io/)
[![Graph](https://img.shields.io/badge/Graph-Neo4j%20%2B%20NetworkX%20Fallback-018BFF)](https://networkx.org/)

---

## 0. Company Context
- **Company**: **MeetMux Logistics & Fulfilment Network**
- **Domain**: Multi-modal freight, e-commerce fulfilment, and cold-chain distribution across India.
- **Key Metro Hubs**: Mumbai, Delhi NCR, Bengaluru, Chennai, Kolkata, Ahmedabad, Jaipur, Pune, Hyderabad.
- **Core Business Pain**: High cost of transit delays, warehouse staging overload, carrier SLA default penalties, and downstream disruption cascades.
- **Reporting Currency**: Indian Rupee (INR ₹).
- **Compliance Badge**: Persistent **“Demo Data”** badge throughout the UI. All numbers, predictions, and scenario simulations are synthetic and transparently labeled.

---

## 1. Product Vision: The Closed-Loop Decision Engine

MeetMux Control Tower is **not a dashboard** — it is an enterprise decision-intelligence platform answering four mission-critical questions:

1. **What is about to go wrong?** $\rightarrow$ Real-time XGBoost delay & SLA-breach classification ($P(\text{delay})$ & delay hours).
2. **Why?** $\rightarrow$ SHAP feature attribution bars with plain-language operational diagnostics and counterfactual recommendations.
3. **What will it break next?** $\rightarrow$ Graph centrality and multi-hop disruption propagation cascading across connected facilities.
4. **What should we do, and what does it save?** $\rightarrow$ Prioritized alternative routing with quantified INR ₹ savings and ROI projections.

```
TELEMETRY ➔ PREDICTION ➔ EXPLANATION ➔ GRAPH ANALYSIS ➔ BOTTLENECKS ➔ PROPAGATION ➔ RECOMMENDATION ➔ ₹ IMPACT
```

---

## 2. Design System — “Rose Glass”

- **Palette**: Soft blush gradient (`#FFF5F8` → `#FDE8EF` → `#FBD5E2`), baby pink primary (`#F8B4C8`), deep rose accent (`#D6588A`), and dark slate-plum text (`#3B1F2B`).
- **Glassmorphism**: Translucent panels (`rgba(255, 255, 255, 0.50)`), 18px backdrop blur, 1px white border, soft pink drop shadow (`0 8px 32px rgba(214, 88, 138, 0.15)`).
- **Harmonized Risk Encoding**:
  - `LOW`: Sage / Green (`#2E7D32` on `#E8F5E9`)
  - `MEDIUM`: Warm Amber (`#D97706` on `#FEF3C7`)
  - `HIGH`: Coral Orange (`#EA580C` on `#FFEDD5`)
  - `CRITICAL`: Deep Crimson (`#DC2626` on `#FEE2E2` with animated pulsing ring)
- **Framer Motion**: Page transitions (`AnimatePresence`), spring counters, drawer morphs, and disruption ripple waves.

---

## 3. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Mapbox GL JS, Recharts, TanStack React Query, Axios, Zustand, Lucide Icons, cmdk.
- **Backend**: Python 3.13, FastAPI, Pydantic v2, Pandas, NumPy, scikit-learn, XGBoost, SHAP, WebSockets.
- **Graph Engine**: Neo4j Cypher with zero-config in-memory **NetworkX fallback** (runs 100% locally without Docker).

---

## 4. Quick Start (Run Locally)

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+

### Step 1: Start Backend
```bash
# In the project root:
backend\venv\Scripts\activate      # Windows
# or: source backend/venv/bin/activate  # macOS / Linux

uvicorn backend.main:app --reload --port 8000
```
Backend API will be running at `http://localhost:8000`  
Swagger API Docs: `http://localhost:8000/api/docs`

### Step 2: Start Frontend
```bash
cd frontend
npm run dev
```
Frontend will be running at `http://localhost:3000`

---

## 5. The 3-Minute Stakeholder / Hackathon Demo Script

| Timestamp | Screen | Narrative & Actions |
|---|---|---|
| **0:00 – 0:30** | **Overview / Control Tower** | Open `http://localhost:3000`. Point out the **Rose Glass baby-pink theme**, **Demo Data badge**, and the **9 animated KPI cards**. Click **"Load Demo Network"** to watch the animated stepper seed 67 hubs, 164 corridors, and 650 consignments. |
| **0:30 – 1:15** | **Shipments & SHAP XAI** | Navigate to **Shipments**. Click **`SHP-1024`** (Pharma ₹45L batch). Show the drawer morphing in with **81% Delay Risk** and **87% SLA breach probability**. Walk through the **SHAP horizontal contribution bars**: *"Route congestion (+0.28) and Bhiwandi hub load (+0.22) are driving this risk."* Show the dynamic counterfactual hint: *"Optimizing hub load by 15% drops risk to 28%."* |
| **1:15 – 1:55** | **Bottlenecks & Propagation** | Switch to **Bottlenecks**. Point out the **"How is this calculated?"** formula. Click **Bhiwandi Central Mega Hub (Score: 88, 94% load)**. The right-hand drawer triggers the **multi-hop propagation engine**: show Hop 1 (direct neighbors), Hop 2 (secondary DCs), and Hop 3 (urban retail zones) exposing **₹84.5 Lakhs** in downstream exposure. |
| **1:55 – 2:35** | **Scenario Simulator (What-If)** | Jump to **Simulator**. Select **"Hub Failure"** at **Bhiwandi Hub H04** at **80% severity**. Click **"Run Simulation"**. Highlight the **BEFORE ➔ AFTER animated morph**: average network risk surges from 24% to 78%, and 18 SLA breaches are predicted. Point out the clear disclaimer: *"Model scenario — not a real-world forecast."* |
| **2:35 – 3:00** | **Analytics & Business Impact** | Navigate to **Analytics**. Show the **Business Impact Calculator**: tweak the cost per delay hour slider from ₹3,500 to ₹5,000 to demonstrate real-time recalculation of **₹23.55 Lakhs in weekly savings** and **1,570% estimated ROI**. Finish on the **AI Copilot** asking *"Which hubs will fail this week?"* to reveal the grounded structured response cards. |

---

## 6. Project Structure

```
├── backend/
│   ├── app/
│   │   ├── graph/         # GraphEngine with NetworkX fallback & Neo4j driver
│   │   ├── schemas/       # Pydantic v2 schemas
│   │   ├── services/      # Bottleneck, propagation, simulation, copilot, alerts
│   │   └── streaming/     # Live telemetry WebSocket broadcaster
│   ├── tests/             # Automated test suite (6 passing tests)
│   ├── main.py            # FastAPI entrypoint
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # TopNav, DemoLoader, SharedComponents
│   │   ├── hooks/         # useTelemetryStream, useAnimatedCounter
│   │   ├── motion/        # Framer Motion reusable variants & springs
│   │   ├── pages/         # Overview, NetworkMap, Shipments, Bottlenecks, Simulator, Analytics, Alerts, Copilot
│   │   ├── services/      # Axios API client
│   │   ├── store/         # Zustand global state
│   │   └── styles/        # globals.css (Rose Glass design tokens)
│   ├── package.json
│   └── vite.config.ts
├── ml/
│   ├── feature_engineering.py  # 15-feature telemetry extractor
│   ├── train.py                # XGBoost Classifier & Regressor training
│   ├── predict.py              # SHAP inference & counterfactuals
│   ├── evaluation.py           # Model evaluation
│   ├── model.pkl               # Trained XGBoost model artifact
│   └── metrics.json            # Accuracy 83.1%, ROC-AUC 0.917
├── neo4j/
│   ├── schema.cypher           # Constraints & indexes
│   ├── seed.cypher             # Graph seed data
│   └── queries.cypher          # Centrality & propagation Cypher queries
├── data/
│   ├── synthetic_generator.py  # Generates 67 nodes, 164 routes, 650 shipments
│   ├── nodes.json
│   ├── routes.json
│   ├── shipments.json
│   └── training_dataset.csv
└── docs/
    ├── architecture.md
    ├── api.md
    ├── ml-pipeline.md
    ├── neo4j-model.md
    ├── dfd.md
    └── business-impact.md
```

---

## 7. License & Attribution
Designed for **MeetMux** operations teams. Built with React 18, FastAPI, XGBoost, and NetworkX.
