/**
 * server.js — Custom Next.js server for the Railway Linux backend.
 *
 * Railway only exposes a single PORT to the public internet (the one it
 * injects), while the virtual-desktop stack (Xvfb + x11vnc + websockify/noVNC)
 * listens internally on :6080. To make the noVNC view reachable from the
 * browser we reverse-proxy it through this server:
 *
 *   /vnc/*        -> http://127.0.0.1:6080/*          (noVNC web UI + assets)
 *   /websockify   -> ws://127.0.0.1:6080/websockify   (VNC WebSocket tunnel)
 *
 * Everything else is handled by Next.js as usual.
 *
 * NOTE: This file is only used on Railway (via start.sh). Vercel ignores it and
 * runs the standard Next.js serverless build.
 */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const PORT = Number(process.env.PORT) || 3000;
const NOVNC_HOST = '127.0.0.1';
const NOVNC_PORT = Number(process.env.NOVNC_PORT) || 6080;
const dev = process.env.NODE_ENV !== 'production';

const app = next({ dev });
const handle = app.getRequestHandler();

/** HTTP reverse proxy to the internal noVNC server. */
function proxyHttpRequest(req, res, targetPath) {
  const options = {
    host: NOVNC_HOST,
    port: NOVNC_PORT,
    path: targetPath,
    method: req.method,
    headers: req.headers,
  };
  const proxy = require('http').request(options, (pres) => {
    res.writeHead(pres.statusCode, pres.headers);
    pres.pipe(res);
  });
  proxy.on('error', (e) => {
    res.writeHead(502, { 'content-type': 'text/plain' });
    res.end('noVNC proxy error: ' + e.message);
  });
  req.pipe(proxy);
}

/**
 * Raw TCP tunnel for WebSocket upgrades. We forward the HTTP upgrade request
 * verbatim to the target and then pipe the two sockets together. This works for
 * the VNC WebSocket because after the handshake it is just opaque bytes.
 */
function tunnelWebSocket(req, clientSocket, head, targetPath) {
  const net = require('net');
  const target = net.connect(NOVNC_PORT, NOVNC_HOST, () => {
    const lines = [`${req.method} ${targetPath} HTTP/${req.httpVersion}`];
    for (const key of Object.keys(req.headers)) {
      if (key.toLowerCase() === 'proxy-connection') continue;
      lines.push(`${key}: ${req.headers[key]}`);
    }
    lines.push('', '');
    target.write(lines.join('\r\n'));
    if (head && head.length) target.write(head);
    target.pipe(clientSocket);
    clientSocket.pipe(target);
  });
  target.on('error', () => {
    try { clientSocket.destroy(); } catch (_) {}
  });
  clientSocket.on('error', () => {
    try { target.destroy(); } catch (_) {}
  });
}

function isNoVncPath(pathname) {
  return pathname === '/websockify' || pathname.startsWith('/websockify') ||
         pathname === '/vnc' || pathname.startsWith('/vnc');
}

function noVncTargetPath(pathname) {
  if (pathname === '/websockify' || pathname.startsWith('/websockify')) {
    return '/websockify';
  }
  // /vnc/... -> strip the /vnc prefix so websockify receives the real path.
  const stripped = pathname.slice('/vnc'.length);
  return stripped === '' ? '/' : stripped;
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsed = parse(req.url, true);
    const pathname = parsed.pathname || '/';

    if (isNoVncPath(pathname)) {
      proxyHttpRequest(req, res, noVncTargetPath(pathname));
      return;
    }

    handle(req, res, parsed);
  });

  server.on('upgrade', (req, clientSocket, head) => {
    const parsed = parse(req.url, true);
    const pathname = parsed.pathname || '/';
    if (!isNoVncPath(pathname)) {
      clientSocket.destroy();
      return;
    }
    tunnelWebSocket(req, clientSocket, head, noVncTargetPath(pathname));
  });

  server.listen(PORT, () => {
    console.log(
      `[server] Next.js + noVNC proxy listening on :${PORT} ` +
      `(noVNC target ${NOVNC_HOST}:${NOVNC_PORT})`
    );
  });
});
