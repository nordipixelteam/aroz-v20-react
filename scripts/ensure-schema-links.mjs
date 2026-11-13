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
const words=value=>new Set(String(value||'').toLowerCase().split(/[^a-z0-9]+/).filter(word=>word.length>3&&!['webdesign','agentur','copywriting','seite','seiten','page'].includes(word)));
function related(document,registry){
 const available=internalRoutes(document).filter(route=>registry.has(route)&&route!==document.route),sourceWords=words(document.label);
 return available.map((route,index)=>{const target=registry.get(route),targetWords=words(target.label);let score=document.kind===target.kind?20:0;if(document.kind==='post'&&route==='/blogs/')score+=30;if(document.route==='/blogs/'&&target.kind==='post')score+=30;if(route==='/contact-us/')score+=3;for(const word of sourceWords)if(targetWords.has(word))score+=8;return {route,target,index,score}})
  .sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,8);
}
function withSchema(document,registry){
 const links=related(document,registry);if(!links.length)throw new Error(`${document.route} has no published internal links to describe.`);
 let nodes=[];const raw=String(document.seo?.schema||'').trim();if(raw){const parsed=JSON.parse(raw);nodes=Array.isArray(parsed)?parsed:[parsed]}
 const itemList={'@type':'ItemList',name:'Related pages',itemListElement:links.map(({route,target},index)=>({'@type':'ListItem',position:index+1,name:target.label,url:origin+route}))};
 const existing=nodes.findIndex(node=>node?.['@type']==='ItemList'&&node?.name==='Related pages');if(existing>=0)nodes[existing]=itemList;else nodes.push(itemList);
 if(nodes.length>10)throw new Error(`${document.route} would exceed the 10-node custom schema limit.`);
 return {...document,seo:{...(document.seo||{}),schema:JSON.stringify(nodes.length===1?nodes[0]:nodes)}};
}

const apply=process.argv.includes('--apply'),client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});await client.connect();
try{
 const db=client.db(process.env.MONGODB_DB||undefined),documents=db.collection('documents'),records=await documents.find({},{projection:{route:1,draft:1,published:1,revision:1,updated_at:1}}).sort({route:1}).toArray();
 const registries={};for(const state of ['draft','published'])registries[state]=new Map(records.filter(record=>record[state]).map(record=>{const document=JSON.parse(String(record[state]));return [document.route,document]}));
 const stamp=new Date().toISOString(),migrationId='ensure-schema-links-'+stamp;let changed=0;
 for(const record of records){const patch={};for(const state of ['draft','published'])if(record[state]){const before=JSON.parse(String(record[state])),after=withSchema(before,registries[state]);if(JSON.stringify(before)!==JSON.stringify(after))patch[state]=JSON.stringify({...after,revision:Number(record.revision||0)+1,updatedAt:stamp})}
  if(!Object.keys(patch).length)continue;changed++;if(!apply)continue;
  await db.collection('migration_backups').insertOne({migrationId,route:record.route,record,created_at:stamp});
  const result=await documents.updateOne({_id:record._id,revision:record.revision},{$set:{...patch,revision:Number(record.revision||0)+1,updated_at:stamp}});if(!result.modifiedCount)throw new Error(`${record.route} changed during migration; rerun the command.`);
 }
 console.log(`${apply?'Persisted':'Would persist'} related-page ItemList schema for ${changed} of ${records.length} MongoDB document record(s).${apply?' Backup id: '+migrationId:' Run again with --apply to write changes.'}`);
}finally{await client.close()}
