# ==============================================================================
# MeetMux Geospatial Intelligence Platform — Multi-Stage Production Dockerfile
# Stage 1: Build Frontend (Vite + React + Tailwind)
# Stage 2: Python 3.11 Runtime + FastAPI + Graph Engine + ML Model + Full Data
# ==============================================================================

# ── Stage 1: Frontend Builder ─────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

ARG VITE_MAPBOX_TOKEN=""
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ── Stage 2: Production Python Runtime ─────────────────────────────────────────
FROM python:3.11-slim AS runner

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend, data, and ML models
COPY backend/ ./backend/
COPY data/ ./data/
COPY ml/ ./ml/
COPY neo4j/ ./neo4j/
COPY docs/ ./docs/

# Copy built frontend assets from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set default environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=8050 \
    HOST=0.0.0.0

EXPOSE 8050

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

# Launch FastAPI with Uvicorn
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]
