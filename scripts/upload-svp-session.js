import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import https from 'https';

const TOKEN_FILE = join(process.cwd(), '.svp-token.json');
const STORAGE_FILE = join(process.cwd(), '.svp-storage.json');
const RAILWAY_URL = process.argv[2] || 'https://perfect-learning-production-2a07.up.railway.app';

function uploadSession() {
  const token = existsSync(TOKEN_FILE) ? JSON.parse(readFileSync(TOKEN_FILE, 'utf-8')) : null;
  const storage = existsSync(STORAGE_FILE) ? JSON.parse(readFileSync(STORAGE_FILE, 'utf-8')) : null;

  if (!token && !storage) {
    console.error('No SVP session found locally.');
    console.error('Run "npm run svp-login" first to log in to SVP locally.');
    process.exit(1);
  }

  const payload = JSON.stringify({
    token: token?.token || null,
    storage: storage || {}
  });

  const url = new URL('/api/svp-session', RAILWAY_URL);
  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Response:', data);
      try {
        const json = JSON.parse(data);
        if (json.success) {
          console.log('✅ SVP session uploaded to Railway successfully!');
          console.log('Session ID:', json.data?.id);
        } else {
          console.error('❌ Upload failed:', json.error);
          process.exit(1);
        }
      } catch {
        console.error('❌ Invalid response:', data);
        process.exit(1);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Request failed:', err.message);
    process.exit(1);
  });

  req.write(payload);
  req.end();
}

uploadSession();
