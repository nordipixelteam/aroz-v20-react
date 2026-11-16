import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {translatePage,translateDocument,translateSettings} from './english-content.mjs';

const dir='.avault-kit/english-review';
const snapshotFile=process.argv.find(v=>v.startsWith('--snapshot='))?.slice(11)||`${dir}/database-before.json`;
const snapshot=JSON.parse(fs.readFileSync(snapshotFile,'utf8'));
const titles=JSON.parse(fs.readFileSync('scripts/translations/page-titles.json','utf8'));
const files=fs.readdirSync('src/content').filter(f=>f.endsWith('.json')).sort();
assert.equal(files.length,37);
const sources=files.map(file=>{const before=JSON.parse(fs.readFileSync(`src/content/${file}`,'utf8'));return {file,before,after:translatePage(before)}});
const documents=snapshot.documents.map(row=>{
 const draft=translateDocument(JSON.parse(row.draft),titles),published=row.published?translateDocument(JSON.parse(row.published),titles):null;
 for(const [before,after] of [[JSON.parse(row.draft),draft],...(published?[[JSON.parse(row.published),published]]:[])]){
  assert.equal(after.route,before.route);assert.deepEqual(after.ids,before.ids);assert.deepEqual(after.links,before.links);
  assert.deepEqual(after.fields.filter(f=>f.kind==='url'),before.fields.filter(f=>f.kind==='url').map(f=>({...f,section:after.fields.find(x=>x.key===f.key).section})));
  assert.deepEqual(after.fields.map(f=>f.key),before.fields.map(f=>f.key));
 }
 return {route:row.route,before:{draft:row.draft,published:row.published,revision:row.revision},after:{draft:JSON.stringify(draft),published:published?JSON.stringify(published):null}};
});
const settings=snapshot.settings.map(row=>({id:row.id,before:{value:row.value,revision:row.revision},after:JSON.stringify(translateSettings(row.id,JSON.parse(row.value)))})).filter(s=>s.before.value!==s.after);
const plan={version:1,database:'avault_dev',sources,documents,settings};
fs.writeFileSync(`${dir}/plan.json`,JSON.stringify(plan,null,2));
fs.mkdirSync(`${dir}/preview`,{recursive:true});
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const summary=[];
for(const item of documents){
 const doc=JSON.parse(item.after.published||item.after.draft);const original=JSON.parse(item.before.draft);
 const html=doc.template.replace(/\{\{(f\d+)\}\}/g,(_,key)=>esc(doc.fields.find(f=>f.key===key)?.value||'')).replace('{{SEO}}',`<title>${esc(doc.seo.title)}</title><meta name="description" content="${esc(doc.seo.description)}">`);
 const name=doc.route==='/'?'index.html':doc.route.slice(1).replace(/\/$/,'')+'/index.html';
 const previewPath=path.join(dir,'preview',name);fs.mkdirSync(path.dirname(previewPath),{recursive:true});fs.writeFileSync(previewPath,html);
 summary.push({route:doc.route,title:doc.label,seoTitle:doc.seo.title,heading:(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||'').replace(/<br\s*\/?\s*>/gi,' ').replace(/<[^>]+>/g,' '),changedFields:doc.fields.filter((f,i)=>f.value!==original.fields[i]?.value).length,unpublishedEdits:item.before.draft!==item.before.published});
}
fs.writeFileSync(`${dir}/summary.json`,JSON.stringify(summary,null,2));
console.log(JSON.stringify({preview:`${dir}/preview`,pages:summary.length,changedFields:summary.reduce((n,d)=>n+d.changedFields,0),settings:settings.map(s=>s.id),unpublishedEdits:summary.filter(s=>s.unpublishedEdits).length}));
console.log(summary.map(s=>`${s.route} | ${s.title} | ${s.heading}`).join('\n'));
if(process.argv.includes('--write-source')){
 for(const {file,before,after} of sources){assert.deepEqual(JSON.parse(fs.readFileSync(`src/content/${file}`,'utf8')),before);fs.writeFileSync(`src/content/${file}`,JSON.stringify(after)+'\n')}
 console.log('Wrote the previewed English source. Database unchanged.');
}
