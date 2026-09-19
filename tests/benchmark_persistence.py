import time
import os
import sys
import uuid
import statistics

# Ensure project root is on sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from src.api import app

client = TestClient(app)

NUM_REQUESTS = 20
session_id = f"bench_sess_{uuid.uuid4().hex[:8]}"

print(f"Running Phase 8 Persistence Benchmark ({NUM_REQUESTS} iterations)...")

# 1. Benchmark POST /api/v1/analyze (Inference + DB Write Transaction)
post_latencies = []
analysis_ids = []

for i in range(NUM_REQUESTS):
    payload = {
        "title": f"Software Engineer #{i+1}",
        "company_name": f"Enterprise Tech #{i+1}",
        "description": f"Design high-throughput distributed systems in Python and Go for job posting #{i+1}.",
        "telecommuting": True,
        "has_company_logo": True,
        "has_questions": True,
    }
    t0 = time.perf_counter()
    resp = client.post(
        "/api/v1/analyze",
        json=payload,
        headers={"X-Session-ID": session_id},
    )
    t1 = time.perf_counter()
    assert resp.status_code == 200
    data = resp.json()
    analysis_ids.append(data["analysis_id"])
    post_latencies.append((t1 - t0) * 1000.0)

# 2. Benchmark GET /api/v1/analyses/{id} (DB Read + Snapshot Reconstruction)
get_latencies = []
for aid in analysis_ids:
    t0 = time.perf_counter()
    resp = client.get(
        f"/api/v1/analyses/{aid}",
        headers={"X-Session-ID": session_id},
    )
    t1 = time.perf_counter()
    assert resp.status_code == 200
    get_latencies.append((t1 - t0) * 1000.0)

# 3. Benchmark GET /api/v1/analyses (Paginated List)
list_latencies = []
for _ in range(NUM_REQUESTS):
    t0 = time.perf_counter()
    resp = client.get(
        "/api/v1/analyses?limit=10&offset=0",
        headers={"X-Session-ID": session_id},
    )
    t1 = time.perf_counter()
    assert resp.status_code == 200
    list_latencies.append((t1 - t0) * 1000.0)

print("\n" + "=" * 60)
print("PHASE 8 PERSISTENCE PERFORMANCE BENCHMARK RESULTS")
print("=" * 60)
print(f"1. POST /analyze (Inference + DB Write):")
print(f"   Mean:   {statistics.mean(post_latencies):.2f} ms")
print(f"   Median: {statistics.median(post_latencies):.2f} ms")
print(f"   Min:    {min(post_latencies):.2f} ms")
print(f"   Max:    {max(post_latencies):.2f} ms")

print(f"\n2. GET /analyses/{{id}} (Read Snapshot):")
print(f"   Mean:   {statistics.mean(get_latencies):.2f} ms")
print(f"   Median: {statistics.median(get_latencies):.2f} ms")
print(f"   Min:    {min(get_latencies):.2f} ms")
print(f"   Max:    {max(get_latencies):.2f} ms")

print(f"\n3. GET /analyses (Paginated List):")
print(f"   Mean:   {statistics.mean(list_latencies):.2f} ms")
print(f"   Median: {statistics.median(list_latencies):.2f} ms")
print(f"   Min:    {min(list_latencies):.2f} ms")
print(f"   Max:    {max(list_latencies):.2f} ms")
print("=" * 60)
