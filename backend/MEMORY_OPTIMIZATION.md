# Memory Monitoring & Render Simulation

## Problem
Production crashes on Render free tier during report download. Render kills the process — initially suspected as OOM (512MB RAM limit), later confirmed as health-check timeout due to 0.1 vCPU throttling the event loop.

## Tools Created

### 1. `memory_monitor.py` — Continuous RSS Tracker
- Thread-safe concurrent label tracking: shows which functions are running in real time
- 10ms sampling interval — captures every RSS change
- Post-exit dwell labels (1s suffix `~`) — attributes post-exit RSS peaks to the correct function (not `[idle]`)
- Auto-detects sync/async — single `@monitor()` decorator for both
- Final report with `>>> CONCURRENT PEAK RSS <<<` banner + top-10 ranking of periods by peak RSS
- OOM simulation via `MEMORY_LIMIT_MB` env var (warns/criticals near limit)

### 2. `cpu_throttle.py` — CPU Burner (Native Windows)
Busy-loop threads with sleep intervals to consume N% of CPU, leaving ~10% for the app. Run alongside uvicorn:

```powershell
# Terminal 1: throttle
python cpu_throttle.py 90

# Terminal 2: app
cd backend
python -u -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Alternatives: BES GUI (https://mion.yosei.fi/BES/) — set uvicorn to 10%.

### 3. Docker Simulation (Most Accurate)
Hardware-enforced 0.1 vCPU and 512MB via Docker cgroups:

```powershell
docker run --rm --cpus=0.1 --memory=512m `
  -v "C:\Users\harsh\canit pulse\Canit_pulse\backend:/app" `
  -w /app -p 8000:8000 python:3.12-slim `
  bash -c "pip install -r requirements.txt && uvicorn main:app --host 0.0.0.0 --port 8000"
```

The WSL equivalent with cpulimit:
```bash
MEMORY_LIMIT_MB=512 cpulimit --limit=10 -- python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## Key Changes to Production Code

| Change | File | Why |
|--------|------|-----|
| Download: `FileResponse` → `StreamingResponse` (64KB chunks) | `routes_v3.py:650` | Prevents `sendfile` from blocking the event loop; health checks run between chunks |
| `@monitor()` on all 77 route handlers + 24 service functions | All route & service files | Full coverage — no blind spots in memory tracking |
| Cleaned per-step RSS logging (`[STEP-RSS]` prints) | `routes_v3.py` | Redundant with continuous monitor |

## Simulation Results

### Docker with 0.1 vCPU + 512MB

| Metric | Value |
|--------|-------|
| Total runtime | 281s (vs ~30s local) |
| Peak RSS | 514 MB (at limit but survived) |
| First page load | ~124s (cold start) |
| Download time | ~7s (StreamingResponse) |
| Primary memory driver | `get_brand_intelligence` (+200MB, called 7-10x per session) |

### Conclusions
1. **Not OOM** — Peak RSS 514MB is close to 512MB but the app survives. The production crash was **health-check timeout** from `FileResponse` blocking the event loop.
2. **StreamingResponse fixes the crash** — download completes in ~7s on 0.1 vCPU because the response starts streaming immediately.
3. **0.1 vCPU is the real constraint** — first page load takes ~2 minutes, which is the actual UX problem.
4. **Python never returns freed memory** — RSS stays at 250-330MB permanently after first page load.

## How to Reproduce

```powershell
# 1. Start Docker container with Render-like limits
docker run --rm --cpus=0.1 --memory=512m `
  -v "C:\Users\harsh\canit pulse\Canit_pulse\backend:/app" `
  -w /app -p 8000:8000 python:3.12-slim `
  bash -c "pip install -r requirements.txt && uvicorn main:app --host 0.0.0.0 --port 8000"

# 2. Open http://localhost:8000 in browser
# 3. Log in, navigate to a client, load reports
# 4. Click download — observe behavior
# 5. Check container logs for memory monitor final report
```

## Future Optimizations (if needed)

1. **Cache `get_brand_intelligence`** — dominates memory (+200MB) and is called 7-10x per session. A simple TTL cache would cut peak RSS by ~40%.
2. **Pre-generate reports** — generate HTML at report-creation time instead of on-demand during download.
3. **Frontend loading UX** — show progress/loading state during the 2-minute first page load.
