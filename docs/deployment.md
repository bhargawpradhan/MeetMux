# 🚀 MeetMux Control Tower — Deployment Guide

MeetMux is packaged as a **unified containerized full-stack application**. 
The Python FastAPI backend serves:
- The compiled React + Vite + Tailwind frontend (`/`)
- All REST APIs (`/api/v1/...`)
- Real-time WebSockets (`/ws/telemetry`, `/ws/events`)
- Embedded Neo4j Cypher Bridge & NetworkX graph engine
- The full synthetic Indian metro supply-chain dataset (`data/`)
- Pre-trained XGBoost delay prediction models (`ml/model.pkl`)

---

## Option 1: 1-Click Deploy on Render.com (Recommended & Free/Low-Cost)

1. Go to **[render.com](https://render.com)** and sign in with your GitHub account.
2. Click **New +** → **Web Service**.
3. Connect your repository: **`bhargawpradhan/MeetMux`**.
4. Render will automatically detect the **`Dockerfile`** (or `render.yaml`).
5. Settings:
   - **Environment:** Docker
   - **Region:** Oregon (US West) or Frankfurt
   - **Branch:** `main`
   - **Health Check Path:** `/health`
6. Click **Deploy Web Service**!
7. Render will build the React frontend and Python runtime, and provide you with a live HTTPS URL (e.g. `https://meetmux.onrender.com`).

---

## Option 2: Deploy on Railway.app (Zero-Config)

1. Go to **[railway.app](https://railway.app)** and log in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select **`bhargawpradhan/MeetMux`**.
4. Railway will automatically detect the `Dockerfile` and build both frontend and backend.
5. In **Settings** → **Networking**, click **Generate Domain**.
6. Your live app is instantly accessible with full WebSockets and dataset!

---

## Option 3: Deploy with Docker / Docker Compose (Any VPS, Cloud, or Local)

### Using Docker directly:
```bash
# 1. Build the production image
docker build -t meetmux:latest .

# 2. Run the container
docker run -d -p 8050:8050 --name meetmux meetmux:latest

# Access at http://localhost:8050
```

### Using Docker Compose (includes live Neo4j database service):
```bash
docker compose up --build -d
```
- **MeetMux App:** `http://localhost:8050`
- **Neo4j Browser:** `http://localhost:7474` (User: `neo4j`, Password: `meetmux_secret`)

---

## Option 4: Deploying on Ubuntu VPS / AWS EC2 / DigitalOcean Droplet

```bash
# 1. Clone your repo
git clone https://github.com/bhargawpradhan/MeetMux.git
cd MeetMux

# 2. Install Docker & Compose if not present
sudo apt update && sudo apt install -y docker.io docker-compose-v2

# 3. Launch with Docker Compose
sudo docker compose up -d --build

# 4. (Optional) Point your custom domain with Nginx / Certbot for HTTPS
```

---

## Environment Variables (Optional)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8050` | Port uvicorn listens on |
| `HOST` | `0.0.0.0` | Host binding interface |
| `NEO4J_URI` | `bolt://localhost:7687` | Remote Neo4j URI (bridge activates if unreachable) |
| `NEO4J_USER` | `neo4j` | Neo4j username |
| `NEO4J_PASSWORD` | `password` | Neo4j password |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |
