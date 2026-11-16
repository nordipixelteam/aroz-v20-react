import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

assert.ok(process.env.VERCEL_ENV==='preview'||(!process.env.VERCEL&&process.argv.includes('--local')),'This snapshot build is Preview-only; a production release needs its own reviewed configuration.');
const output=path.resolve('dist-client-preview'),source=path.resolve('client-preview');
assert.equal(path.dirname(output),process.cwd());
// Remove only this script's dedicated build output.
await fs.rm(output,{recursive:true,force:true});await fs.mkdir(output,{recursive:true});
await fs.cp('public',output,{recursive:true});await fs.cp(source,output,{recursive:true});
const manifest=JSON.parse(await fs.readFile(path.join(source,'manifest.json'),'utf8'));
const origin=process.env.VERCEL_URL?'https://'+process.env.VERCEL_URL:'http://127.0.0.1:4310';
for(const page of manifest.pages){const file=path.join(output,page.file);let html=await fs.readFile(file,'utf8');assert.equal(createHash('sha256').update(html).digest('hex'),page.htmlDigest);if(!/rel=["'](?:shortcut )?icon["']/.test(html))html=html.replace('</head>','<link rel="icon" type="image/png" href="/assets/aroz-icon.png"></head>');await fs.writeFile(file,html.replaceAll('__PREVIEW_ORIGIN__',origin));}
await fs.mkdir(path.join(output,'_preview'),{recursive:true});
await fs.writeFile(path.join(output,'_preview/read-only.js'),`document.addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();const form=event.target;let status=form.querySelector('[role="status"]');if(!status){status=document.createElement('p');status.setAttribute('role','status');form.append(status)}status.hidden=false;status.classList.add('show');status.textContent='Read-only preview: no enquiry was sent.';},true);`);
await fs.writeFile(path.join(output,'_preview/read-only.css'),`.client-preview-notice{position:fixed;z-index:10000;left:12px;bottom:12px;padding:8px 12px;border:1px solid #ffffff40;border-radius:999px;background:#191919;color:#f4f2ee;font:12px/1.3 Arial,sans-serif;box-shadow:0 2px 12px #0003}.av-hp{display:none!important}`);
await fs.writeFile(path.join(output,'robots.txt'),'User-agent: *\nDisallow: /\n');
await fs.writeFile(path.join(output,'404.html'),'<!doctype html><html lang="en"><meta name="robots" content="noindex"><title>Read-only preview</title><h1>Read-only client preview</h1><p>The dashboard and server APIs are unavailable here.</p><a href="/">Return to the website</a></html>');
console.log('Built '+manifest.pages.length+' published pages; no server functions or database configuration included.');
