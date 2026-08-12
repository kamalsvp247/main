export const JWT_SECRET = process.env.JWT_SECRET || 't2hub-jwt-secret-change-in-production';
export const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
export const REFRESH_SECRET = process.env.REFRESH_SECRET || 't2hub-refresh-secret-change-in-production';
export const REFRESH_EXPIRES = process.env.REFRESH_EXPIRES || '30d';

export const SVP_BASE = process.env.SVP_BASE || 'https://svp-international.pacc.sa';
export const SVP_API_BASE = process.env.SVP_API_BASE || 'https://svp-international-api.pacc.sa/api/v1';
export const BANGLADESH_ID = Number(process.env.BANGLADESH_ID) || 78;
export const DEFAULT_COUNTRY_ID = Number(process.env.DEFAULT_COUNTRY_ID) || 78;

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@t2hub.app';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me-in-production';
export const MASTER_AGENT_EMAIL = process.env.MASTER_AGENT_EMAIL || 'master@t2hub.app';

export const DAKBOX_API_KEY = process.env.DAKBOX_API_KEY || '';
export const DAKBOX_API_URL = process.env.DAKBOX_API_URL || 'https://dakbox.net/api/v1';

export const PAYMENT_GATEWAY = process.env.PAYMENT_GATEWAY || 'mock';
export const PAYMENT_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'change-me-in-production';

export const QUOTA_UNIT_COST = Number(process.env.QUOTA_UNIT_COST) || 1;
export const QUOTA_DEFAULT_LIMIT = Number(process.env.QUOTA_DEFAULT_LIMIT) || 100;
export const QUOTA_MASTER_LIMIT = Number(process.env.QUOTA_MASTER_LIMIT) || 99999;

export const PORT = Number(process.env.PORT) || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_SERVERLESS = process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production';
export const IS_VERCEL = IS_SERVERLESS;
export const IS_RAILWAY = process.env.RAILWAY_ENVIRONMENT === 'production' || process.env.RAILWAY_PROJECT_ID !== undefined;
export const RAILWAY_BACKEND_URL = process.env.RAILWAY_BACKEND_URL || '';
