import fs from 'node:fs';
import { randomBytes } from 'node:crypto';

const file = '.env.development.local';
if (!fs.existsSync(file)) throw new Error('Create .env.development.local first.');

const lines = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
const values = new Map();
for (const line of lines) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match) values.set(match[1], match[2].replace(/^['"]|['"]$/g, ''));
}
if (values.get('MONGODB_DB') !== 'avault_dev') throw new Error('Refusing to prepare secrets outside avault_dev.');
if (!values.get('MONGODB_URI') || values.get('MONGODB_URI').startsWith('<')) {
  throw new Error('Add the separate avault_dev MongoDB URI locally first.');
}

const generated = [];
for (const name of ['AVAULT_ENCRYPTION_KEY', 'AVAULT_JOBS_SECRET']) {
  const current = values.get(name) || '';
  if (name === 'AVAULT_ENCRYPTION_KEY' && /^[a-f0-9]{64}$/.test(current)) continue;
  if (name === 'AVAULT_JOBS_SECRET' && /^[a-f0-9]{64}$/.test(current)) continue;
  const value = randomBytes(32).toString('hex');
  const index = lines.findIndex(line => line.startsWith(`${name}=`));
  if (index >= 0) lines[index] = `${name}=${value}`;
  else lines.push(`${name}=${value}`);
  generated.push(name);
}

fs.writeFileSync(file, lines.join('\n').replace(/\n*$/, '\n'), 'utf8');
console.log(generated.length ? `Generated local development secrets: ${generated.join(', ')}. Values were not printed.` : 'Development secrets are already configured; no changes made.');