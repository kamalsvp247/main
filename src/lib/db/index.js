import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Vercel serverless functions have read-only filesystem except /tmp
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production';
const DATA_DIR = isVercel ? '/tmp/t2hub' : join(__dirname, '../../data');
const DB_FILE = join(DATA_DIR, 'db.json');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const adapter = new JSONFile(DB_FILE);
const db = new Low(adapter, {
  users: [],
  agents: [],
  quotas: [],
  payments: [],
  auditLogs: [],
  sessions: [],
  otpRequests: [],
  settings: { key: 'app_settings', value: {} }
});

await db.read();
db.data ||= { users: [], agents: [], quotas: [], payments: [], auditLogs: [], sessions: [], otpRequests: [], settings: { key: 'app_settings', value: {} } };

export async function getDb() {
  await db.read();
  return db;
}

export async function initDb() {
  await db.read();
  db.data ||= { users: [], agents: [], quotas: [], payments: [], auditLogs: [], sessions: [], otpRequests: [], settings: { key: 'app_settings', value: {} } };
  await db.write();
  return db;
}

export function getDbPath() {
  return DB_FILE;
}
