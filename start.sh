#!/bin/bash
set -e

echo "[start] Initializing virtual display environment..."

# Start Xvfb
echo "[start] Starting Xvfb on :99..."
Xvfb :99 -screen 0 1280x800x24 &
sleep 2

# Start fluxbox window manager
echo "[start] Starting fluxbox..."
fluxbox &
sleep 2

# Start x11vnc server
echo "[start] Starting x11vnc on port 5900..."
x11vnc -display :99 -forever -nopw -listen localhost -xkb &
sleep 2

# Start noVNC websocket proxy
echo "[start] Starting noVNC on port 6080..."
websockify --web=/usr/share/novnc 6080 localhost:5900 &
sleep 2

echo "[start] Virtual display ready. noVNC: http://localhost:6080/vnc.html"

# Start the Next.js application
echo "[start] Starting Next.js..."
exec npm run start
