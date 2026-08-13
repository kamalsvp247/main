#!/usr/bin/env node
import { readFileSync } from 'fs';
import { spawnSync } from 'child_process';

const target = process.argv[2];
const file = process.argv[3] || (target === 'railway' ? '.env.railway' : '.env.vercel');

if (!['railway', 'vercel'].includes(target)) {
  console.error('Usage: node scripts/sync-env.mjs <railway|vercel> [env-file]');
  process.exit(1);
}

function parseEnv(path) {
  const values = [];
  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (!value || value.startsWith('replace-with') || value.includes('your-project-ref') || value.includes('your-railway-app')) {
      console.warn(`[skip] ${key}: placeholder or empty value`);
      continue;
    }
    values.push([key, value]);
  }
  return values;
}

function run(command, args, input, { allowFailure = false } = {}) {
  const result = spawnSync(command, args, {
    input,
    stdio: input === undefined ? 'inherit' : ['pipe', 'inherit', 'inherit'],
    encoding: 'utf8',
  });
  if (result.error) {
    console.error(`Could not run ${command}. Install/login to the ${target} CLI first.`);
    process.exit(1);
  }
  if (result.status !== 0 && !allowFailure) process.exit(result.status || 1);
  return result;
}

const values = parseEnv(file);
if (!values.length) {
  console.error(`No usable values found in ${file}. Copy the matching example file and fill real secrets first.`);
  process.exit(1);
}

if (target === 'railway') {
  for (const [key, value] of values) {
    run('railway', ['variables', '--set', `${key}=${value}`]);
  }
} else {
  for (const environment of ['production', 'preview']) {
    for (const [key, value] of values) {
      run('vercel', ['env', 'rm', key, environment, '--yes'], undefined, { allowFailure: true });
      run('vercel', ['env', 'add', key, environment], value);
    }
  }
  console.log(`Synced ${values.length} variables to Vercel production and preview.`);
}
