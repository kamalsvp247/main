#!/bin/bash
# ─────────────────────────────────────────────────────────────
# start.sh — T2Hub container entrypoint
# Boots a virtual screen (Xvfb) + window manager + VNC + noVNC so the
# headful Playwright/Puppeteer browser renders onto a fake display that
# can be viewed & controlled from a remote browser via WebSocket.
# The noVNC endpoint is exposed on 0.0.0.0:6080 so Railway can route a
# public domain to it.
# ─────────────────────────────────────────────────────────────
set -e

export DISPLAY=:99

echo "[start] Initializing virtual display environment..."

# 1) Virtual framebuffer (fake screen)
echo "[start] Starting Xvfb on :99..."
Xvfb :99 -screen 0 1280x800x24 >/var/log/xvfb.log 2>&1 &
sleep 2

# 2) Lightweight window manager (gives the headful browser a desktop)
echo "[start] Starting fluxbox..."
fluxbox >/var/log/fluxbox.log 2>&1 &
sleep 1

# 3) VNC server on the virtual screen — no password, shared, bind 0.0.0.0
echo "[start] Starting x11vnc on :99 (port 5900)..."
x11vnc -display :99 -forever -nopw -shared -rfbport 5900 -listen 0.0.0.0 >/var/log/x11vnc.log 2>&1 &
sleep 2

# 4) Wrap VNC over WebSocket so it is reachable from a browser (noVNC, port 6080)
echo "[start] Starting websockify + noVNC on 0.0.0.0:6080..."
websockify --web=/usr/share/novnc 0.0.0.0:6080 localhost:5900 >/var/log/websockify.log 2>&1 &
sleep 2

echo "[start] Virtual display ready. noVNC will be available on port 6080 once a domain is assigned."

# 5) Start the Next.js application (foreground)
echo "[start] Starting Next.js..."
exec npm run start

