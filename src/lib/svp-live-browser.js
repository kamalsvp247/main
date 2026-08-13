/**
 * svp-live-browser.js
 *
 * Manages a single HEADFUL Playwright Chromium that renders onto the
 * container's virtual screen (DISPLAY=:99, provided by Xvfb). Because it is
 * headful and the display is shared via VNC/noVNC, an operator can open the
 * T2Hub login page, click "Open Live Browser", and type the SVP
 * email / password / OTP directly inside the remote browser.
 *
 * After logging in, call getLiveBrowserStorage() (exposed via
 * /api/svp-capture-session) to persist the session for the rest of the app.
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { IS_RAILWAY } from './config.js';

const SVP_LOGIN_URL = 'https://svp-international.pacc.sa/auth/login?role=labor';
const STORAGE_FILE = join(process.cwd(), '.svp-storage.json');
const TOKEN_FILE = join(process.cwd(), '.svp-token.json');

let browser = null;
let page = null;
let ready = false;

export function isLiveBrowserSupported() {
  return !!IS_RAILWAY;
}

export function isLiveBrowserOpen() {
  return ready && !!page;
}

export async function openLiveBrowser() {
  if (!IS_RAILWAY) {
    return {
      success: false,
      error: 'Live browser is only available on the Railway Linux backend (Xvfb virtual screen).'
    };
  }
  if (ready && page) {
    try {
      await page.bringToFront();
      return { success: true, message: 'Live browser already open on the virtual screen.' };
    } catch {
      ready = false;
      browser = null;
      page = null;
    }
  }
  try {
    const pw = await import('playwright');
    browser = await pw.chromium.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('close', () => { ready = false; });
    await page
      .goto(SVP_LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
      .catch(() => {});
    ready = true;
    console.log(`[live-browser] Opened headful browser on DISPLAY=${process.env.DISPLAY}`);
    return { success: true, message: 'Live browser opened. Use the noVNC view to log in to SVP.' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function getLiveBrowserStorage() {
  if (!ready || !page) return null;
  try {
    return await page.context().storageState();
  } catch {
    return null;
  }
}

export async function closeLiveBrowser() {
  ready = false;
  if (browser) {
    try { await browser.close(); } catch {}
    browser = null;
    page = null;
  }
}

// Persist the captured storage + token so the rest of the app (managed
// automation browser, svp-auth token loader, Supabase) can reuse it.
export function persistLiveBrowserSession(storage) {
  if (storage) {
    writeFileSync(STORAGE_FILE, JSON.stringify(storage), 'utf-8');
  }
  const token = extractToken(storage);
  if (token) {
    writeFileSync(TOKEN_FILE, JSON.stringify({ token, expiry: null }), 'utf-8');
  }
  return token;
}

function extractToken(storage) {
  const cookies = storage?.cookies || [];
  for (const c of cookies) {
    if (['auth_token', 'token', 'access_token', 'svp_token'].includes(c.name) && c.value) {
      if (c.value.split('.').length === 3) return c.value;
    }
  }
  const origins = storage?.origins || [];
  for (const o of origins) {
    const entries = Array.isArray(o.localStorage) ? o.localStorage : [];
    for (const item of entries) {
      const value = String(item?.value || '').replace(/^Bearer\s+/i, '');
      if (['auth_token', 'auth_token_default', 'token', 'access_token', 'vue-auth.token', 'svp_token'].includes(item?.name) && value.split('.').length === 3) {
        return value;
      }
    }
  }
  return null;
}
