#!/bin/bash
# ─────────────────────────────────────────────────────────────
# start.sh — T2Hub container entrypoint (Railway production)
# Boots a virtual screen (Xvfb) + window manager + VNC + noVNC so the
# headful Playwright/Puppeteer browser renders onto a fake display that
# can be viewed & controlled from a remote browser via WebSocket.
# The noVNC endpoint is exposed on 0.0.0.0:6080 so Railway can route a
# public domain to it.
#
# Live-logs: every step is timestamped to stdout (Railway captures this),
# and a Node-based health heartbeat pings /api/health every 30s so the
# Railway log stream shows continuous activity and confirms the app is up.
# ─────────────────────────────────────────────────────────────
set -e

export DISPLAY=:99
ts() { date '+%Y-%m-%d %H:%M:%S'; }

echo "[$(ts)] [start] Initializing virtual display environment (DISPLAY=${DISPLAY})..."

# 1) Virtual framebuffer (fake screen)
echo "[$(ts)] [start] Starting Xvfb on :99..."
Xvfb :99 -screen 0 1280x800x24 >/var/log/xvfb.log 2>&1 &
sleep 2

# 2) Lightweight window manager (gives the headful browser a desktop)
echo "[$(ts)] [start] Starting fluxbox..."
fluxbox >/var/log/fluxbox.log 2>&1 &
sleep 1

# 3) VNC server on the virtual screen — no password, shared, bind 0.0.0.0
echo "[$(ts)] [start] Starting x11vnc on :99 (port 5900)..."
x11vnc -display :99 -forever -nopw -shared -rfbport 5900 -listen 0.0.0.0 >/var/log/x11vnc.log 2>&1 &
sleep 2

# 4) Wrap VNC over WebSocket so it is reachable from a browser (noVNC, port 6080)
echo "[$(ts)] [start] Starting websockify + noVNC on 0.0.0.0:6080..."
websockify --web=/usr/share/novnc 0.0.0.0:6080 localhost:5900 >/var/log/websockify.log 2>&1 &
sleep 2

echo "[$(ts)] [start] Virtual display ready. noVNC will be available on port 6080 once a domain is assigned."
echo "[$(ts)] [start] noVNC: http://0.0.0.0:6080/vnc.html   |   VNC: 0.0.0.0:5900"

# 5) Health heartbeat → keeps Railway "live logs" active and proves the app is alive.
# Railway injects PORT (often 8080), which `next start` honors. The heartbeat must
# hit that same port, not a hardcoded 3000, or it fails with "ERR fetch failed".
HEALTH_PORT="${PORT:-3000}"
echo "[$(ts)] [start] Starting health heartbeat (every 30s) on port ${HEALTH_PORT}..."
(
  while true; do
    node -e "fetch('http://localhost:${HEALTH_PORT}/api/health').then(r=>r.json()).then(d=>console.log('[$(ts)] [health] OK', JSON.stringify(d))).catch(e=>console.log('[$(ts)] [health] ERR', e.message))" 2>&1
    sleep 30
  done
) &

# 6) Start the Next.js application (foreground) THROUGH the custom server
#    (server.js) so the internal noVNC stack (websockify on :6080) is reachable
#    via /vnc/* and /websockify on Railway's single exposed PORT. The custom
#    server still serves the whole Next.js app; this is Railway-only (Vercel
#    ignores server.js and runs the standard serverless build).
echo "[$(ts)] [start] Starting custom Next.js + noVNC proxy server on port ${HEALTH_PORT}..."
exec node server.js

