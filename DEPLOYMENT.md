# AuthentiHire - Production Deployment Guide

This guide details the fastest reliable deployment paths for **AuthentiHire** without altering any machine learning logic, heuristic risk rules, or security mechanisms.

---

## Architecture Overview

| Component | Technology | Production Configuration |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript + Vite | Static build deployed to Vercel, Netlify, or Render Static Site |
| **Backend** | FastAPI + Uvicorn (Python 3.11+) | Containerized or Native Python Web Service (Render / Railway / Fly.io) |
| **Database** | PostgreSQL 15+ | Managed PostgreSQL (Render, Supabase, Neon, AWS RDS) |
| **Migrations** | Alembic | Runs automatically on deployment or via CLI (`alembic upgrade head`) |
| **Authentication** | Argon2id + Signed JWT | HttpOnly cookies + `Authorization: Bearer` fallback for cross-domain |

---

## 1. Recommended Fastest Deployment Path

### **Path A: Render Blueprint (1-Click Full Stack Deployment — FASTEST)**
The repository includes a ready-to-use [`render.yaml`](file:///Users/reethika/Desktop/AuthentiHire/render.yaml) blueprint that automatically provisions:
1. **Managed PostgreSQL Database** (`authentihire-db`)
2. **FastAPI Backend Web Service** (`authentihire-api`)
3. **React/Vite Static Site** (`authentihire-web`)

#### Steps on Render:
1. Push this repository to GitHub or GitLab.
2. Log into [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Blueprint**.
4. Select your AuthentiHire repository.
5. Render detects [`render.yaml`](file:///Users/reethika/Desktop/AuthentiHire/render.yaml).
6. Set the two sync variables when prompted:
   - In `authentihire-api`: Set `ALLOWED_ORIGINS` to `https://<your-authentihire-web>.onrender.com`
   - In `authentihire-web`: Set `VITE_API_BASE_URL` to `https://<your-authentihire-api>.onrender.com`
7. Click **Apply**.
8. Render builds the database, executes `alembic upgrade head`, starts the FastAPI server, builds the Vite frontend, and publishes the public demo.

---

### **Path B: Vercel (Frontend) + Render / Railway (Backend & Database)**

If you prefer deploying the frontend to Vercel and backend to Render:

#### 1. Deploy PostgreSQL (Render / Supabase / Neon)
Create a PostgreSQL instance on Render or Supabase and copy the connection string:
```
postgresql://user:password@host:port/dbname?sslmode=require
```

#### 2. Deploy Backend (Render Web Service)
- **Runtime**: Python 3
- **Build Command**:
  ```bash
  pip install -r requirements.txt && alembic upgrade head
  ```
- **Start Command**:
  ```bash
  uvicorn src.api:app --host 0.0.0.0 --port $PORT
  ```
- **Health Check Path**: `/api/v1/health`
- **Environment Variables**:
  - `ENVIRONMENT=production`
  - `DATABASE_URL=postgresql://user:password@host:port/dbname?sslmode=require`
  - `AUTH_SECRET_KEY=<generate via: openssl rand -hex 32>`
  - `AUTH_ACCESS_TOKEN_EXPIRE_MINUTES=1440`
  - `COOKIE_SECURE=true`
  - `ENABLE_HSTS=true`
  - `ALLOWED_ORIGINS=https://<your-vercel-frontend-domain>.vercel.app`
  - `LOG_LEVEL=INFO`

#### 3. Deploy Frontend (Vercel)
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE_URL=https://<your-backend-service>.onrender.com`
- *Note*: Single Page Application routing is pre-configured via [`frontend/vercel.json`](file:///Users/reethika/Desktop/AuthentiHire/frontend/vercel.json) and [`frontend/public/_redirects`](file:///Users/reethika/Desktop/AuthentiHire/frontend/public/_redirects).

---

## 2. Docker & Docker Compose (Self-Hosted / VPS)

To deploy both the backend and PostgreSQL using Docker:

### 1. Build and Run via Docker Compose
```bash
docker compose -f docker-compose.prod.yml up --build -d
```
This automatically starts:
- PostgreSQL 15 on port `5432` with persistent volumes
- Runs Alembic migrations (`alembic upgrade head`)
- FastAPI server on port `8000`

### 2. Standalone Docker Container
```bash
# Build backend image
docker build -t authentihire-backend:latest .

# Run container with external PostgreSQL
docker run -d \
  -p 8000:8000 \
  -e ENVIRONMENT=production \
  -e DATABASE_URL="postgresql://user:password@host:5432/authentihire?sslmode=require" \
  -e AUTH_SECRET_KEY="$(openssl rand -hex 32)" \
  -e ALLOWED_ORIGINS="https://your-frontend-domain.com" \
  --name authentihire-api \
  authentihire-backend:latest
```

---

## 3. Environment Variables Reference

### Backend Variables
| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | SQLAlchemy connection string | `postgresql://user:pass@host:5432/authentihire` |
| `AUTH_SECRET_KEY` | **Yes** | 256-bit cryptographic secret for JWTs | Output of `openssl rand -hex 32` |
| `ALLOWED_ORIGINS` | **Yes** | Comma-separated allowed frontend origins | `https://authentihire.vercel.app` |
| `ENVIRONMENT` | Recommended | Mode (`production`, `staging`, `development`) | `production` |
| `PORT` | Auto | Port injected by host platform | `10000` (Render), `8080` (Railway) |
| `AUTH_ACCESS_TOKEN_EXPIRE_MINUTES` | Optional | Session lifetime (default: 1440 = 24h) | `1440` |
| `COOKIE_SECURE` | Optional | Enforce HTTPS Secure flag on cookies | `true` |
| `ENABLE_HSTS` | Optional | Enables Strict-Transport-Security header | `true` |
| `LOG_LEVEL` | Optional | Backend logging level | `INFO` |

### Frontend Variables
| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes** | URL of your deployed backend service | `https://authentihire-api.onrender.com` |

---

## 4. Database Migrations

### Running Migrations Manually
To apply Alembic migrations against any target PostgreSQL instance:
```bash
DATABASE_URL="postgresql://user:password@host:5432/authentihire?sslmode=require" alembic upgrade head
```

### Checking Current Migration Version
```bash
DATABASE_URL="postgresql://user:password@host:5432/authentihire?sslmode=require" alembic current
```

---

## 5. Verification & Health Check Endpoints

Once deployed, verify operational readiness using the following endpoints:

1. **System Health & Readiness**:
   ```bash
   curl -s https://<backend-host>/api/v1/health | jq .
   ```
   *Expected Response:*
   ```json
   {
     "status": "healthy",
     "version": "1.0.0",
     "model_loaded": true,
     "timestamp": "2026-10-04T10:35:00.000000+00:00"
   }
   ```

2. **Model Metadata & Scoring Weights**:
   ```bash
   curl -s https://<backend-host>/api/v1/model-info | jq .
   ```

3. **Interactive API Documentation**:
   - Swagger UI: `https://<backend-host>/docs`
   - ReDoc: `https://<backend-host>/redoc`

4. **Public Frontend**:
   - Visit `https://<frontend-host>/` in browser.
   - Test analyzing a sample posting at `/analyzer`.
   - Test user registration and authentication at `/register` and `/login`.
