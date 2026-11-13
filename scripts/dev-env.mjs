import fs from 'node:fs';

export function loadDevelopmentEnv() {
  const file = '.env.development.local';
  if (!fs.existsSync(file)) throw new Error('Create .env.development.local for the isolated development database first.');

  delete process.env.MONGODB_URI;
  delete process.env.MONGODB_DB;
  for (const line of fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }

  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.startsWith('<')) {
    throw new Error('Set the development MONGODB_URI in .env.development.local.');
  }
  if (process.env.MONGODB_DB !== 'avault_dev') {
    throw new Error('Refusing database utility access unless MONGODB_DB is exactly avault_dev.');
  }
}