import {MongoClient} from 'mongodb';
import {loadDevelopmentEnv} from './dev-env.mjs';

loadDevelopmentEnv();
const origin=String(process.env.NEXT_PUBLIC_SITE_URL||'').replace(/\/$/,'');
if(!/^https:\/\//.test(origin))throw new Error('NEXT_PUBLIC_SITE_URL must be a full https origin.');

const markdownLinks=value=>[...String(value||'').matchAll(/\[[^\]\n]+\]\(([^\s)]+)/g)].map(match=>match[1]);
function internalRoutes(document){
 const fields=new Map((document.fields||[]).map(field=>[field.key,String(field.value||'')]));
 const html=String(document.template||'').replace(/\{\{(f\d+)\}\}/g,(_match,key)=>fields.get(key)||'')+'\n'+String(document.body||'');
 const links=[...html.matchAll(/\bhref=["']([^"']+)["']/gi)].map(match=>match[1]);
 for(const field of document.fields||[])if(field.label==='a href'||field.kind==='url')links.push(field.value);
 for(const block of document.blocks||[]){if(block.type==='cta'&&block.url)links.push(block.url);links.push(...markdownLinks(block.text));for(const item of block.items||[])links.push(...markdownLinks(item));}
 const routes=[];for(const href of links)try{const url=new URL(String(href),origin+document.route);if(url.origin===origin&&!/^(?:\/assets\/|\/media\/|\/api\/|\/avault\/)/.test(url.pathname))routes.push(url.pathname.endsWith('/')||url.pathname==='/'?url.pathname:url.pathname+'/')}catch{}
 return [...new Set(routes)];
}

const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});await client.connect();
try{
 const db=client.db(process.env.MONGODB_DB||undefined),records=await db.collection('documents').find({published:{$ne:null}},{projection:{_id:0,route:1,published:1}}).sort({route:1}).toArray();
 const docs=records.map(record=>JSON.parse(String(record.published))),routes=new Set(docs.map(document=>document.route)),incoming=new Map([...routes].map(route=>[route,0]));
 let storedSchema=0,invalidSchema=0;
 for(const document of docs){
  const raw=String(document.seo?.schema||'').trim();if(raw){storedSchema++;try{JSON.parse(raw)}catch{invalidSchema++;}}
  document._internal=internalRoutes(document).filter(route=>routes.has(route)&&route!==document.route);for(const route of document._internal)incoming.set(route,(incoming.get(route)||0)+1);
 }
 console.log(`Published pages: ${docs.length}; stored page schema: ${storedSchema}; invalid schema: ${invalidSchema}.`);
 for(const document of docs)console.log(`${document.route} outgoing=${document._internal.length} incoming=${incoming.get(document.route)||0} schema=${document.seo?.schema?'stored':'generated-only'}`);
 const orphans=docs.filter(document=>document.route!=='/'&&!document.seo?.noindex&&!(incoming.get(document.route)||0));
 const deadEnds=docs.filter(document=>!document.seo?.noindex&&!document._internal.length);
 if(orphans.length)console.log('ORPHANS '+orphans.map(document=>document.route).join(', '));
 if(deadEnds.length)console.log('DEAD ENDS '+deadEnds.map(document=>document.route).join(', '));
 if(invalidSchema||orphans.length||deadEnds.length)process.exitCode=1;
}finally{await client.close()}
