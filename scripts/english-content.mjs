import fs from 'node:fs';
import ts from 'typescript';
import {decodeHTML} from 'entities';

const read=name=>JSON.parse(fs.readFileSync(new URL(`./translations/${name}`,import.meta.url),'utf8'));
export const translations=new Map(Object.entries({...read('en.json'),...read('runtime-en.json')}).map(([a,b])=>[decodeHTML(a),decodeHTML(b)]));
const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export function translateText(value){
 if(typeof value!=='string')return value;
 const key=decodeHTML(value);
 return translations.get(key)??value;
}

export function translateCss(css){return css.replace(/(content\s*:\s*)(["'])([^"']*)\2/g,(_,before,quote,value)=>before+quote+translateText(value).replaceAll(quote,'\\'+quote)+quote)}

// Only string literals are translated: selectors, URLs and executable logic
// remain intact. HTML template literals are handled by their owning modules.
export function translateScript(code){
 const ast=ts.createSourceFile('content.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),edits=[];
 function visit(node){
  if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)){
   const next=translateText(node.text);
   if(next!==node.text)edits.push([node.getStart(ast),node.end,JSON.stringify(next).replace(/</g,'\\u003c')]);
  }
  ts.forEachChild(node,visit);
 }
 visit(ast);
 for(const [start,end,value] of edits.sort((a,b)=>b[0]-a[0]))code=code.slice(0,start)+value+code.slice(end);
 return code.replaceAll("'de-DE'","'en-GB'").replaceAll('"de-DE"','"en-GB"');
}

export function translateHtml(html){
 // Keep code/style/graphics out of the text-node parser.
 const protectedParts=[];
 html=html.replace(/<(script|style|svg|noscript|template)\b[^>]*>[\s\S]*?<\/\1>/gi,(part,tag)=>{
  if(tag.toLowerCase()==='script'&&!/application\/ld\+json/.test(part))part=part.replace(/(>)([\s\S]*)(<\/script>)/i,(_,a,code,b)=>a+translateScript(code)+b);
  if(tag.toLowerCase()==='script'&&/application\/ld\+json/.test(part))part=part.replace(/(>)([\s\S]*)(<\/script>)/i,(_,a,code,b)=>{try{return a+JSON.stringify(translateSchema(JSON.parse(code))).replace(/</g,'\\u003c')+b}catch{return a+code+b}});
  if(tag.toLowerCase()==='style')part=translateCss(part);
  return `\u0000${protectedParts.push(part)-1}\u0000`;
 });
 html=html.split(/(<[^>]+>)/).map(part=>{
  if(part.startsWith('<'))return part.replace(/\b(alt|placeholder|aria-label|title|value|data-value|data-service|data-request)="([^"]*)"/g,(_,name,value)=>`${name}="${escape(translateText(decodeHTML(value)))}"`).replace(/(<html\b[^>]*\blang=")[^"]*/i,'$1en');
  return part.replace(/\S(?:[\s\S]*\S)?/,value=>{
   const next=translateText(value);return next===value?value:escape(next);
  });
 }).join('');
 return html.replace(/\u0000(\d+)\u0000/g,(_,i)=>protectedParts[Number(i)]);
}

function translateSchema(value,key=''){
 if(Array.isArray(value))return value.map(v=>translateSchema(v,key));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,translateSchema(v,k)]));
 if(typeof value==='string')return key==='inLanguage'?'en-GB':['name','description','headline','text','caption','alternateName'].includes(key)?translateText(value):value;
 return value;
}

export function translatePage(page){
 let html=translateHtml(page.html);
 // These imported headings share a fragment, but have different line sequences.
 // Also recognise the first English preview so a follow-up remains idempotent.
 if(page.path==='index.html')html=html.replace('Then design.<br/>Then <span','Understand first.<br/>Then <span');
 if(page.path==='agentur/index.html')html=html.replace('Understand first.<br/>Then design.',"Don't start with design.<br/>Understand first.");
 return {...page,lang:'en',title:translateText(page.title),description:translateText(page.description),html,styles:(page.styles||[]).map(translateCss),
  scripts:page.scripts.map(s=>typeof s==='string'?s:{...s,code:s.code?translateScript(s.code):s.code}),
  headScripts:(page.headScripts||[]).map(s=>{if(s.type!=='application/ld+json')return {...s,code:translateScript(s.code||'')};try{return {...s,code:JSON.stringify(translateSchema(JSON.parse(s.code)))}}catch{return s}})};
}

const sections=new Map([...translations].map(([a,b])=>[a.slice(0,90),b.slice(0,90)]));
export function translateDocument(doc,titles){
 const next=structuredClone(doc);
 next.label=titles[doc.route]||translateText(doc.label);
 next.template=translateHtml(doc.template);
 next.fields=doc.fields.map(f=>({...f,value:f.kind==='url'?f.value:translateText(f.value),section:sections.get(f.section)||translateText(f.section)}));
 if(doc.route==='/')next.fields=next.fields.map(f=>({...f,...(f.key==='f259'&&f.value==='Then design.'?{value:'Understand first.'}:{}),...(f.section==='Then design.'?{section:'Understand first.'}:{})}));
 if(doc.route==='/agentur/'&&doc.fields.find(f=>f.key==='f130')?.value==='Understand first.'&&doc.fields.find(f=>f.key==='f131')?.value==='Then design.')next.fields=next.fields.map(f=>({...f,...(f.key==='f130'?{value:"Don't start with design."}:f.key==='f131'?{value:'Understand first.'}:{}),...(f.section==='Understand first.'?{section:"Don't start with design."}:f.section==='Then design.'?{section:'Understand first.'}:{})}));
 next.seo={...doc.seo};
 for(const k of ['title','description','imageAlt','ogTitle','ogDescription'])if(typeof next.seo[k]==='string')next.seo[k]=translateText(next.seo[k]);
 if(next.seo.schema){try{next.seo.schema=JSON.stringify(translateSchema(JSON.parse(next.seo.schema)))}catch{throw Error('Invalid schema on '+doc.route)}}
 next.images=(doc.images||[]).map(i=>({...i,alt:translateText(i.alt)}));
 if(doc.body)next.body=translateHtml(doc.body);
 for(const k of ['excerpt','featuredAlt'])if(doc[k])next[k]=translateText(doc[k]);
 if(doc.blocks)next.blocks=doc.blocks.map(b=>({...b,...Object.fromEntries(['text','alt','caption'].filter(k=>typeof b[k]==='string').map(k=>[k,translateText(b[k])])),...(b.items?{items:b.items.map(translateText)}:{}),...(b.rows?{rows:b.rows.map(row=>row.map(translateText))}:{})}));
 return next;
}

export function translateSettings(id,value){
 const next=structuredClone(value);
 if(id==='global'){
  for(const key of ['tagline','defaultDescription'])if(next[key])next[key]=translateText(next[key]);
  // Preserve override keys until every corresponding field value is translated.
  next.navigation=Object.fromEntries(Object.entries(next.navigation||{}).map(([key,value])=>{const [group,label,...parts]=key.split('|');return [[group,label,translateText(parts.join('|'))].join('|'),translateText(value)]}));
 }
 if(id==='forms'){
  for(const form of [next.contact,next.hero,...(next.custom||[])].filter(Boolean)){
   for(const key of ['title','request','button','note','label','placeholder'])if(form[key])form[key]=translateText(form[key]);
   if(form.fields)form.fields=form.fields.map(f=>({...f,label:translateText(f.label),placeholder:translateText(f.placeholder),options:(f.options||[]).map(translateText)}));
  }
 }
 if(id==='menus')for(const key of ['header','mobile','footer','utility'])if(next[key])next[key]=next[key].map(i=>({...i,label:translateText(i.label)}));
 return next;
}
