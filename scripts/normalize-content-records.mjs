import {MongoClient} from 'mongodb';
import {loadDevelopmentEnv} from './dev-env.mjs';

loadDevelopmentEnv();

const rootAsset=value=>/^(?:assets|media)\//i.test(String(value||'').trim())?'/'+String(value).trim():String(value||'');
const rootHtml=html=>String(html||'').replace(/\b(src|href|poster|data-src)="((?:assets|media)\/[^"<>]*)"/gi,(_m,attr,value)=>`${attr}="/${value}"`);
const concise=(value,max)=>{const text=String(value||'').trim();if(text.length<=max)return text;const cut=text.slice(0,max+1);return cut.slice(0,Math.max(cut.lastIndexOf(' '),Math.floor(max*.72))).replace(/[\s,;:.-]+$/,'')};
function normalize(document){
 const next=structuredClone(document),changedFields=new Set();let seen=0;
 next.template=rootHtml(next.template).replace(/<h1(\b[^>]*)>([\s\S]*?)<\/h1>/gi,(tag,attrs,inner)=>{if(++seen===1)return tag;for(const m of inner.matchAll(/\{\{(f\d+)\}\}/g))changedFields.add(m[1]);return `<h2${attrs}>${inner}</h2>`});
 next.fields=(next.fields||[]).map(field=>({...field,value:field.kind==='url'?rootAsset(field.value):field.value,label:changedFields.has(field.key)&&field.label==='h1'?'h2':field.label}));
 next.body=rootHtml(next.body||'');next.featuredImage=rootAsset(next.featuredImage||'');
 next.images=(next.images||[]).map(image=>({...image,src:rootAsset(image.src)}));
 next.blocks=(next.blocks||[]).map(block=>({...block,...(typeof block.url==='string'?{url:rootAsset(block.url)}:{})}));
 next.seo={...(next.seo||{}),title:concise(next.seo?.title,65),description:concise(next.seo?.description,170),image:rootAsset(next.seo?.image||'')};
 return next;
}

const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});await client.connect();
try{
 const db=client.db(process.env.MONGODB_DB||undefined),documents=db.collection('documents'),stamp=new Date().toISOString(),migrationId='normalize-content-'+stamp;
 const records=await documents.find({},{projection:{route:1,draft:1,published:1,revision:1,updated_at:1}}).toArray();let updated=0;
 for(const record of records){const patch={};for(const state of ['draft','published'])if(record[state]){const before=JSON.parse(String(record[state])),after=normalize(before);if(JSON.stringify(before)!==JSON.stringify(after))patch[state]=JSON.stringify({...after,revision:Number(record.revision||0)+1,updatedAt:stamp})}
  if(!Object.keys(patch).length)continue;
  await db.collection('migration_backups').insertOne({migrationId,route:record.route,record,created_at:stamp});
  const result=await documents.updateOne({_id:record._id,revision:record.revision},{$set:{...patch,revision:Number(record.revision||0)+1,updated_at:stamp}});if(result.modifiedCount)updated++;
 }
 const field=(name,label,type,required,width='full',placeholder='')=>({name,label,type,placeholder,required,options:[],width});
 const seeds={
  forms:{contact:{enabled:false,request:'AROZ Projektanfrage',button:'Anfrage senden',note:'Ihre Angaben werden vertraulich behandelt.',fields:[field('name','Name / Unternehmen','text',true,'half','Ihr Name / Unternehmen'),field('email','E-Mail','email',true,'half','name@unternehmen.de'),field('service','Thema','text',false,'full','Webdesign, SEO, KI-SEO oder Copywriting'),field('website','Website','url',false,'full','www.ihre-website.de'),field('project','Projekt','textarea',false,'full','Beschreiben Sie Ihr Vorhaben'),field('message','Nachricht','textarea',false,'full','Ihre Nachricht')]},hero:{enabled:false,label:'',placeholder:'',button:''},custom:[]},
  scripts:{enabled:false,snippets:[]},menus:{header:[],mobile:[],footer:[],utility:[]},
  traffic:{enabled:false,allow:[],deny:[],countries:[]},
  operations:{analytics:false,retentionDays:365,dailyBackup:false,formRetentionDays:0},
  verification:{google:'',bing:''},files:{robots:'',llms:'',sitemaps:{exclude:[],custom:{'sm_pages.xml':[],'sm_posts.xml':[]}}},
 };
 for(const [setting,value] of Object.entries(seeds))await db.collection('settings').updateOne({id:setting},{$setOnInsert:{id:setting,value:JSON.stringify(value),revision:0}},{upsert:true});
 const forms=await db.collection('settings').findOne({id:'forms'});if(forms){const value=JSON.parse(String(forms.value||'{}')),hasQuickZip=records.some(record=>['draft','published'].some(state=>record[state]&&/\bhero-proposal\b/.test(JSON.parse(String(record[state])).template||'')));let changed=false;if(!Array.isArray(value.custom)){value.custom=[];changed=true}if(!hasQuickZip&&value.hero){delete value.hero;changed=true}if(changed){await db.collection('migration_backups').insertOne({migrationId,route:'@forms',record:forms,created_at:stamp});await db.collection('settings').updateOne({_id:forms._id,revision:forms.revision},{$set:{value:JSON.stringify(value)},$inc:{revision:1}})}}
 console.log(`Normalized ${updated} of ${records.length} MongoDB document record(s). Backup id: ${migrationId}`);
}finally{await client.close()}
