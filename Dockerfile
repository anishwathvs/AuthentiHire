# ==============================================================================
# AuthentiHire - Production Backend Dockerfile
# ==============================================================================
FROM python:3.11-slim

# Set environment defaults
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    ENVIRONMENT=production

WORKDIR /app

# Install system dependencies needed for compiling native packages if required
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend application, configurations, and trained models
COPY alembic.ini .
COPY alembic/ ./alembic/
COPY models/ ./models/
COPY src/ ./src/

# Expose HTTP port
EXPOSE 8000

# Health check against liveness endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/api/v1/health || exit 1

# Apply migrations and launch FastAPI with Uvicorn
CMD ["sh", "-c", "alembic upgrade head && uvicorn src.api:app --host 0.0.0.0 --port ${PORT:-8000}"]
