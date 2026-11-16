// Export only anonymous, published public responses. Never export database rows or drafts.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {MongoClient} from 'mongodb';
import {loadDevelopmentEnv} from './dev-env.mjs';

loadDevelopmentEnv();
const origin=process.argv.find(x=>x.startsWith('--origin='))?.slice(9)||'http://localhost:3000';
assert.match(origin,/^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/,'Only a local server is permitted.');
const root=path.resolve('client-preview'),client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});
await fs.mkdir(root,{recursive:true});
const digest=x=>createHash('sha256').update(x).digest('hex');
const safePath=route=>{assert.ok(route.startsWith('/')&&!route.includes('..')&&!/[?#\\]/.test(route));const target=path.resolve(root,'.'+route);assert.ok(target===root||target.startsWith(root+path.sep));return target;};
try{
 await client.connect();const rows=await client.db('avault_dev').collection('documents').find({published:{$nin:[null,'']}}).project({route:1,published:1}).toArray();
 const pages=[],media=new Set();
 for(const row of rows.sort((a,b)=>a.route.localeCompare(b.route))){
  const route=row.route;if(!route||route.startsWith('/avault')||route.startsWith('/api/')||['/not-found/','/access-denied/'].includes(route))continue;
  const response=await fetch(origin+route,{redirect:'manual'});if(response.status>=300&&response.status<400)continue;
  assert.equal(response.status,200,'Public page unavailable: '+route);
  let html=await response.text();assert.ok(!html.includes('avault-admin-bar'),'Authenticated response must never be exported.');
  const canonical=html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
  const siteOrigin=canonical?new URL(canonical).origin:origin;
  html=html.replaceAll(siteOrigin,'__PREVIEW_ORIGIN__').replaceAll(origin,'__PREVIEW_ORIGIN__');
  html=html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi,(tag,attrs,code)=>{
   attrs=attrs.replace(/\snonce="[^"]*"/g,'');
   if(/src="[^"]*(?:avault-forms\.js|avault-analytics\.js|v7-booking\.js)/.test(attrs))return '';
   if(/\bsrc=/.test(attrs)||/type="application\/ld\+json"/.test(attrs))return '<script'+attrs+'>'+code+'</script>';
   if(!code.trim())return '';
   const name=digest(code)+'.js';media.add('script:'+name+'\n'+code);
   return '<script'+attrs+' src="/_preview/scripts/'+name+'"></script>';
  });
  html=html.replace(/\snonce="[^"]*"/g,'').replace(/<meta[^>]*name="robots"[^>]*>/gi,'');
  html=html.replace('</head>','<meta name="robots" content="noindex,nofollow,noarchive"><script src="/_preview/read-only.js"></script><link rel="stylesheet" href="/_preview/read-only.css"></head>');
  html=html.replace('</body>','<aside class="client-preview-notice" role="note">Read-only client preview</aside></body>');
  for(const match of html.matchAll(/(?:src|href)="(\/media\/[^"?#]+)|url\(['"]?(\/media\/[^)'"?#]+)/g))media.add(match[1]||match[2]);
  const file=route.endsWith('.html')?safePath(route):path.join(safePath(route),'index.html');await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,html);
  pages.push({route,file:path.relative(root,file).replaceAll('\\','/'),publishedDigest:digest(row.published),htmlDigest:digest(html)});
 }
 for(const item of media){
  if(item.startsWith('script:')){const split=item.indexOf('\n'),file=path.join(root,'_preview/scripts',item.slice(7,split));await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,item.slice(split+1));continue;}
  const response=await fetch(origin+item);assert.equal(response.status,200,'Referenced published media unavailable.');const file=safePath(item);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,Buffer.from(await response.arrayBuffer()));
 }
 assert.ok(pages.length>=37,'Expected all imported published pages.');
 await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify({format:1,mode:'published-public-pages-only',pages},null,2)+'\n');
 console.log(JSON.stringify({exportedPublicPages:pages.length,referencedMedia:[...media].filter(x=>!x.startsWith('script:')).length,draftsExported:0,privateRecordsExported:0}));
}finally{await client.close()}
