// Idempotent, section-scoped upgrade; preserves custom field values and unrelated drafts.
const legacy=/\n const arch=document\.querySelector\('\.architecture'\)[\s\S]*?(?=\n\}\)\(\);)/;
export function removeLegacyStructureScript(template){return template.replace(legacy,'')}
export function upgradeSeoStructure(doc){
 if(doc.route!=='/seo/')throw Error('Only /seo/ can receive this section upgrade.');
 let template=removeLegacyStructureScript(doc.template);
 if(!template.includes('src="/assets/seo-structure.js"'))template=template.replace('</body>','<script defer src="/assets/seo-structure.js"></script></body>');
 const names=['Page Structure','Content','Internal Linking','Technical Foundation'];
 const previous=['01 · Structure','02 · Content','03 · Internal linking','04 · Technology'];
 const panels=['01 / Page structure','02 / Content','03 / Linking','04 / Technology'];
 const changes=new Map();
 for(const match of template.matchAll(/<strong[^>]*data-seo-status="(\d)"[^>]*>\{\{(f\d+)\}\}<\/strong>/g)){
  const i=Number(match[1]);changes.set(match[2],{old:previous[i],value:`0${i+1} · ${names[i]}`,section:`Website Structure / 0${i+1}: ${names[i]}`});
 }
 for(const match of template.matchAll(/<article[^>]*data-arch-copy="(\d)"[^>]*>([\s\S]*?)<\/article>/g)){
  const i=Number(match[1]),keys=[...match[2].matchAll(/\{\{(f\d+)\}\}/g)].map(m=>m[1]);
  keys.forEach((key,index)=>changes.set(key,{...(index===0?{old:panels[i],value:`0${i+1} / ${names[i]}`}:{ }),section:`Website Structure / 0${i+1}: ${names[i]}`}));
 }
 return {...doc,template,fields:doc.fields.map(f=>{const change=changes.get(f.key);return change?{...f,section:change.section,...(f.value===change.old?{value:change.value}:{})}:f})};
}
