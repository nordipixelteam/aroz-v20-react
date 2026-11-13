import fs from 'node:fs';
import path from 'node:path';
import { getMongoClient } from '../db/connection.js';

const apply = process.argv.includes('--apply');
const sourceDir = path.resolve('src/content');
const files = fs.readdirSync(sourceDir).filter(file => file.endsWith('.json')).sort();
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const decode = value => String(value || '')
  .replace(/&nbsp;/g, '\u00a0').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
  .replace(/&#x([\da-f]+);/gi, (_, number) => String.fromCodePoint(parseInt(number, 16)))
  .replace(/&amp;/g, '&');
const plain = value => decode(String(value || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
const attributes = ['href', 'src', 'alt', 'aria-label', 'placeholder', 'title'];
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const origin = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

function routeFor(sourcePath) {
  const value = String(sourcePath || '').replace(/^\/+/, '');
  if (!value || value === 'index.html') return '/';
  if (value.endsWith('/index.html')) return `/${value.slice(0, -'index.html'.length)}`;
  return `/${value}`;
}

function normalizeUrl(value, route) {
  const input = String(value || '').trim();
  if (!input || /^(?:#|mailto:|tel:|data:|javascript:|https?:|\/\/)/i.test(input)) return input;
  const asset = input.replace(/^(?:\.\.\/)+/, '').replace(/^\//, '');
  if (/^(?:assets|media)\//i.test(asset)) return `/${asset}`;
  let url;
  try { url = new URL(input, new URL(route.slice(1), 'https://aroz.invalid/')); }
  catch { return input; }
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/index.html') pathname = '/';
  else if (pathname.endsWith('/index.html')) pathname = pathname.slice(0, -'index.html'.length);
  else if (!path.posix.extname(pathname) && !pathname.endsWith('/')) pathname += '/';
  return pathname + url.search + url.hash;
}

function prepareContent(html, route) {
  let result = String(html || '').replace(/\b(href|src|poster|data-src)="([^"]*)"/gi, (_match, attr, value) => {
    return `${attr}="${escape(normalizeUrl(value, route))}"`;
  });
  result = result.replace(/url\((['"]?)(?:\.\.\/)*assets\//gi, 'url($1/assets/');
  result = result.replace(/<form\b[^>]*>/gi, opening => {
    if (!/\bclass="[^"]*\bv9-contact-form\b|\bid="contactForm"/i.test(opening)) return opening;
    const formKey = route === '/' ? 'homepage-contact' : 'contact';
    const classes = opening.match(/\bclass="([^"]*)"/i);
    if (classes) {
      const next = [...new Set(`${classes[1]} audit-form`.split(/\s+/).filter(Boolean))].join(' ');
      opening = opening.replace(classes[0], `class="${next}"`);
    } else opening = opening.replace('<form', '<form class="audit-form"');
    return /\bdata-avault-form=/.test(opening) ? opening : opening.replace('<form', `<form data-avault-form="${formKey}"`);
  });
  result = result.replace(/<p class="v9-preview">[\s\S]*?<\/p>/i,
    '<p class="v9-preview">Ihre Angaben werden verschlüsselt übermittelt und in der AROZ-Anfragenverwaltung gespeichert.</p>');
  result = result.replace(/<div aria-live="polite" class="form-success" role="status" tabindex="-1">[\s\S]*?<\/div>/i,
    '<div aria-live="polite" class="form-success" role="status" tabindex="-1"></div>');
  return result;
}

function shell(page, route) {
  const links = (page.links || []).map(href => `<link rel="stylesheet" href="${escape(normalizeUrl(href, route))}">`).join('');
  const styles = (page.styles || []).map(css => `<style>${String(css).replace(/<\/style/gi, '<\\/style')}</style>`).join('');
  const headScripts = (page.headScripts || []).filter(script => script.type === 'application/ld+json')
    .map(script => `<script type="application/ld+json">${String(script.code || '').replace(/</g, '\\u003c')}</script>`).join('');
  const scripts = (page.scripts || []).map(script => {
    if (typeof script === 'string') return `<script defer src="${escape(normalizeUrl(script, route))}"></script>`;
    if (script.src) return `<script${script.type ? ` type="${escape(script.type)}"` : ' defer'} src="${escape(normalizeUrl(script.src, route))}"></script>`;
    return script.code ? `<script${script.type ? ` type="${escape(script.type)}"` : ''}>${String(script.code).replace(/<\/script/gi, '<\\/script')}</script>` : '';
  }).join('');
  const bodyAttrs = Object.entries(page.bodyAttributes || {}).map(([key, value]) => ` ${key}="${escape(value)}"`).join('');
  const classAttr = page.bodyClass ? ` class="${escape(page.bodyClass)}"` : '';
  const lang = escape(page.lang || 'de');
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0c0c0e">${links}${styles}${headScripts}{{SEO}}</head><body${classAttr}${bodyAttrs}>${prepareContent(page.html, route)}${scripts}</body></html>`;
}

function convert(page) {
  const route = routeFor(page.path);
  const template = shell(page, route);
  const fields = [];
  let index = 0;
  let group = 'navigation';
  let section = 'Navigation';
  let skip = 0;
  const stack = [];
  const parts = template.split(/(<!--[\s\S]*?-->|<[^>]+>)/);
  const add = (value, kind, label) => {
    const key = `f${index++}`;
    fields.push({ key, value, kind, label, section, group });
    return `{{${key}}}`;
  };

  for (let cursor = 0; cursor < parts.length; cursor++) {
    const part = parts[cursor];
    if (!part || part.startsWith('<!--')) continue;
    if (part.startsWith('<')) {
      const closing = part.startsWith('</');
      const name = (part.match(/^<\/?([a-zA-Z0-9-]+)/)?.[1] || '').toLowerCase();
      if (['head', 'script', 'style', 'svg', 'noscript', 'template'].includes(name)) {
        skip += closing ? -1 : (part.endsWith('/>') ? 0 : 1);
        continue;
      }
      if (name === 'main') group = closing ? 'footer' : 'content';
      if (closing) {
        const at = stack.lastIndexOf(name);
        if (at >= 0) stack.length = at;
        continue;
      }
      if (skip || name.startsWith('!')) continue;
      let tag = part;
      for (const attr of attributes) {
        if (attr === 'href' && name !== 'a') continue;
        if (attr === 'src' && name !== 'img') continue;
        tag = tag.replace(new RegExp(`(\\s${attr}=")([^"]+)(")`, 'i'), (_match, before, value, after) => {
          return `${before}${add(decode(value), attr === 'href' || attr === 'src' ? 'url' : 'text', `${name} ${attr}`)}${after}`;
        });
      }
      parts[cursor] = tag;
      if (!voidTags.has(name) && !part.endsWith('/>')) stack.push(name);
      continue;
    }
    if (skip || !part.trim()) continue;
    const parent = stack.at(-1) || 'span';
    const leading = part.match(/^\s*/)[0];
    const trailing = part.match(/\s*$/)[0];
    const value = decode(part.trim());
    if (parent === 'h1' || parent === 'h2') section = plain(value).slice(0, 90);
    parts[cursor] = leading + add(value, 'text', parent) + trailing;
  }

  const imageFields = fields.filter(field => field.label === 'img src').map(field => {
    const position = fields.indexOf(field);
    return { src: field.value, alt: fields[position + 1]?.label === 'img alt' ? fields[position + 1].value : '' };
  });
  const h1 = plain(String(page.html || '').match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]);
  const label = h1 || String(page.title || route).split('|')[0].trim();
  const kind = /^\/(?:projekte|projects)\/.+/.test(route) ? 'case-study'
    : /^\/(?:webdesign|seo|ki-seo|copywriting)\//.test(route) || route === '/agentur/' ? 'service' : 'page';
  const noindex = /noindex/i.test(String(page.robots || ''));
  const updatedAt = new Date().toISOString();
  return {
    route, label, kind, template: parts.join(''), fields,
    seo: {
      title: String(page.title || label),
      description: String(page.description || ''),
      image: imageFields.find(image => image.src && !/logo/i.test(image.src))?.src || '/assets/hero-red-chair-hq.webp',
      imageAlt: imageFields.find(image => image.src && !/logo/i.test(image.src))?.alt || '',
      noindex, nofollow: /nofollow/i.test(String(page.robots || '')), noarchive: false, sitemap: !noindex,
      canonical: origin + route, twitterCard: 'summary_large_image',
    },
    ids: [...template.matchAll(/\sid="([^"{}]+)"/g)].map(match => match[1]),
    images: imageFields, links: fields.filter(field => field.label === 'a href').map(field => field.value),
    updatedAt, revision: 0,
  };
}

const pages = files.map(file => JSON.parse(fs.readFileSync(path.join(sourceDir, file), 'utf8')));
const documents = pages.map(convert);
const duplicates = documents.filter((document, index) => documents.findIndex(item => item.route === document.route) !== index);
if (duplicates.length) throw new Error('Duplicate source routes found; migration stopped.');

for (const document of documents) {
  console.log(`${document.route.padEnd(48)} ${document.kind.padEnd(12)} ${String(document.fields.length).padStart(4)} fields`);
}
console.log(`\nPrepared ${documents.length} pages from ${sourceDir}.`);

if (!apply) {
  console.log('Dry run only. No database connection or writes were made. To write, use an isolated avault_dev database and rerun with --apply.');
  process.exit(0);
}

function loadDevelopmentEnv() {
  const file = '.env.development.local';
  if (!fs.existsSync(file)) throw new Error('Create .env.development.local with the isolated development database URI first.');
  delete process.env.MONGODB_URI;
  delete process.env.MONGODB_DB;
  for (const line of fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.startsWith('<')) throw new Error('Set the development MONGODB_URI in .env.development.local.');
  if (process.env.MONGODB_DB !== 'avault_dev') throw new Error('Refusing to apply migration unless MONGODB_DB is exactly avault_dev.');
}

loadDevelopmentEnv();
const client = await getMongoClient();
try {
  const db = client.db('avault_dev');
  const counts = await Promise.all(['documents', 'settings', 'users'].map(async name => [name, await db.collection(name).countDocuments()]));
  const existing = Object.fromEntries(counts);
  if (Object.values(existing).some(count => count > 0)) {
    throw new Error('Refusing to migrate over existing avault_dev documents, settings, or users. Use a fresh isolated database.');
  }

  const stamp = new Date().toISOString();
  const global = {
    name: 'AROZ Webdesign Agentur', legalName: '', tagline: 'Webdesign, SEO, KI-Sichtbarkeit und Copywriting.',
    businessType: 'Organization', email: '', phone: '', image: '/assets/hero-red-chair-hq.webp', logo: '/assets/aroz-full-logo.png',
    address: { street: '', city: '', region: '', postalCode: '', country: 'DE' }, geo: { lat: '', lng: '' },
    hours: [], mapUrl: '', socials: {}, priceRange: '', areaServed: 'Schwelm, Nordrhein-Westfalen',
    titleTemplate: '%s | AROZ Webdesign Agentur',
    defaultDescription: 'AROZ gestaltet Websites und unterstützt Unternehmen mit SEO, KI-Sichtbarkeit und überzeugenden Texten.',
    navigation: {},
  };
  const field = (name, label, type, required, width = 'full', placeholder = '') => ({ name, label, type, placeholder, required, options: [], width });
  const settings = [
    { id: 'global', value: global },
    { id: 'forms', value: { contact: {
      enabled: false, request: 'AROZ Projektanfrage', button: 'Anfrage senden', note: 'Ihre Angaben werden vertraulich behandelt.',
      fields: [field('name', 'Name', 'text', true, 'half', 'Ihr Name / Unternehmen'), field('email', 'E-Mail', 'email', true, 'half', 'name@unternehmen.de'), field('service', 'Thema', 'text', false, 'full', 'Website, SEO, KI-SEO oder Copywriting'), field('website', 'Website', 'url', false, 'full', 'www.ihre-website.de'), field('project', 'Projekt', 'textarea', false, 'full', 'Beschreiben Sie Ihr Projekt'), field('message', 'Nachricht', 'textarea', false, 'full', 'Ihre Nachricht')],
    }, hero: { enabled: false, label: '', placeholder: '', button: '' }, custom: [] } },
    { id: 'scripts', value: { enabled: false, snippets: [] } },
    { id: 'menus', value: { header: [], mobile: [], footer: [], utility: [] } },
    { id: 'traffic', value: { enabled: false, allow: [], deny: [], countries: [] } },
    { id: 'operations', value: { analytics: false, retentionDays: 365, dailyBackup: false, formRetentionDays: 0 } },
    { id: 'verification', value: { google: '', bing: '' } },
    { id: 'files', value: { robots: '', llms: '', sitemaps: { exclude: [], custom: { 'sm_pages.xml': [], 'sm_posts.xml': [] } } } },
  ].map(item => ({ ...item, revision: 0 }));

  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      await db.collection('documents').insertMany(documents.map(document => ({
        id: document.route, route: document.route, draft: JSON.stringify(document),
        published: JSON.stringify(document), revision: 0, updated_at: stamp,
      })), { session });
      await db.collection('settings').insertMany(settings.map(setting => ({ ...setting, value: JSON.stringify(setting.value) })), { session });
    });
  } finally {
    await session.endSession();
  }
  console.log(`Migrated ${documents.length} AROZ pages and ${settings.length} development settings to avault_dev.`);
  console.log('No owner account was created; create it interactively with npm run admin:create.');
} finally {
  await client.close();
}