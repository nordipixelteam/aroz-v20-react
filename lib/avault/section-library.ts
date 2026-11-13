import {sections} from './blocks';
import {HttpError,esc} from './store';
import type {Doc,Field} from './store';

// Prebuilt sections: every top-level <section> already designed on some page can be copied into another page.
// The copy is made here, from the stored template, so section markup never comes from the browser. Its
// placeholders get fresh field keys (the text starts as the source page's copy) and clashing element ids are
// renamed. The new section goes into the template after the last section, so existing section ids
// (section-N, by position) keep their meaning; sectionOrder then places it where it was asked for.
const PLACE=/\{\{(f\d+)\}\}/g;
const COLORS=/^(?:sc-)?(?:blue|green|red|yellow)$|^case-(?:blue|green|red|yellow)$/;
const NAMES:Record<string,string>={'faq-section':'FAQ','sc-hero':'Hero','sc-problem':'Problem','sc-decisions':'Decisions','sc-scope':'Scope','sc-delivery':'Delivery','sc-measure':'Measurement','sc-proof':'Proof','sc-example':'Example','sc-signature':'Signature visual','sc-chapter':'Chapter','service-insight-panel':'Insight panel','service-website-entry':'Website check form','scroll-cta':'Call to action','video-testimonials':'Video testimonials','cs-channel-section':'Channel results','cs-work-chapter':'Work chapter','cs-graph-section':'Results graph','i-roi':'ROI','seo-story':'SEO story','shell-wide':'Section','journal-index-group':'Blog list','i-problems':'Problems','cs-hub-collection':'Case study collection'};
const clean=(s:string)=>s.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();

export function sectionType(html:string){
 const list=(html.match(/^<section\b[^>]*\bclass="([^"]*)"/)?.[1]||'').split(/\s+/).filter(c=>c&&!COLORS.test(c)&&!/^sc-route-\d+$/.test(c));
 const main=list[0]==='sc-section'&&list[1]?list[1]:list[0];if(!main)return 'Section';
 return NAMES[main]||(main.replace(/^(?:sc|cs|i|gpt|claude)-/,'').replace(/-/g,' ').replace(/^./,c=>c.toUpperCase()));
}
export function sectionTitle(html:string,fields:Map<string,string>){
 const fill=(s:string)=>clean(s.replace(PLACE,(_,k)=>fields.get(k)||''));
 const h=html.match(/<h[2-4]\b[^>]*>([\s\S]*?)<\/h[2-4]>/)?.[1]||html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/)?.[1]||'';
 return fill(h).slice(0,90)||sectionType(html);
}
// The classes of the elements a section sits inside within <main>, e.g. "service-canvas". Page CSS styles
// sections through these, so a copied section looks right only where they match.
export function contextOf(template:string,start:number){
 const main=template.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1]||'';const stack:string[]=[];
 for(const m of main.slice(0,start).matchAll(/<(\/?)(div|article|section)\b([^>]*)>/g)){if(m[1])stack.pop();else stack.push(m[3].match(/\bclass="([^"\s]*)/)?.[1]||'')}
 return stack.filter(Boolean).join('>');
}
export function pageContext(template:string){const s=sections(template).items[0];return s?contextOf(template,s.start):''}

export type LibraryItem={key:string;route:string;section:string;type:string;title:string;page:string;pages:number;context:string;fields:number};
export function library(docs:{route:string;doc:Doc}[]){
 const seen=new Map<string,LibraryItem>();
 for(const {route,doc} of docs){if(!doc.template||doc.template.includes('{{BODY}}'))continue;const values=new Map(doc.fields.map(f=>[f.key,f.value]));
  for(const s of sections(doc.template).items){if(/<h1\b/.test(s.html))continue;
   const shape=s.html.replace(PLACE,'{{}}');const found=seen.get(shape);if(found){found.pages++;continue}
   seen.set(shape,{key:route+'#'+s.id,route,section:s.id,type:sectionType(s.html),title:sectionTitle(s.html,values),page:doc.label,pages:1,context:contextOf(doc.template,s.start),fields:new Set([...s.html.matchAll(PLACE)].map(m=>m[1])).size});
  }}
 return [...seen.values()].sort((a,b)=>a.type.localeCompare(b.type)||b.pages-a.pages||a.title.localeCompare(b.title));
}

const idsIn=(html:string)=>[...html.matchAll(/\sid="([^"{}]+)"/g)].map(m=>m[1]);
function nextKey(d:Doc){return Math.max(0,...d.fields.map(f=>Number(f.key.slice(1))||0),...[...d.template.matchAll(PLACE)].map(m=>Number(m[1].slice(1))))+1}

// Copies section `sectionId` of `source` into `target`, placed right after `after` (null = at the top).
export function insertSection(target:Doc,source:Doc,sectionId:string,after:string|null):Doc{
 const src=sections(source.template).items.find(s=>s.id===sectionId);if(!src)throw new HttpError(404,'That section no longer exists.');
 if(/<h1\b/.test(src.html))throw new HttpError(422,'A page has one main heading, so its opening section can’t be copied.');
 const t=sections(target.template);if(!t.items.length)throw new HttpError(422,'This page has no sections to add to.');if(t.items.length>=60)throw new HttpError(422,'A page can hold up to 60 sections.');
 const order=target.sectionOrder||t.items.map(s=>s.id);if(after&&!order.includes(after))throw new HttpError(422,'Choose where the section goes.');
 // Fresh field keys, in the order they appear.
 let n=nextKey(target);const keys=new Map<string,string>();for(const m of src.html.matchAll(PLACE))if(!keys.has(m[1]))keys.set(m[1],'f'+n++);
 let html=src.html.replace(PLACE,(_,k)=>`{{${keys.get(k)}}}`);
 // Element ids already on the page get a suffix, along with the links and labels inside the copy that use them.
 const taken=new Set(idsIn(target.template));
 for(const id of new Set(idsIn(html))){if(!taken.has(id))continue;let i=2;while(taken.has(`${id}-${i}`))i++;const to=`${id}-${i}`;taken.add(to);
  const q=id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');html=html.replace(new RegExp(`(\\s(?:id|for|aria-controls|aria-labelledby|aria-describedby)=")${q}"`,'g'),`$1${to}"`).replace(new RegExp(`(href=")#${q}"`,'g'),`$1#${to}"`)}
 const byKey=new Map(source.fields.map(f=>[f.key,f]));
 const added:Field[]=[...keys].map(([from,to])=>{const f=byKey.get(from);return f?{...f,key:to}:{key:to,value:'',kind:'text',label:'span',section:sectionType(src.html),group:'content'}});
 const at=t.items[t.items.length-1].end;const main=t.main.slice(0,at)+html+t.main.slice(at);
 const template=target.template.replace(t.main,()=>main);const id='section-'+t.items.length;
 const nextOrder=[...order];nextOrder.splice(after?nextOrder.indexOf(after)+1:0,0,id);
 return {...target,template,fields:[...target.fields,...added],sectionOrder:nextOrder,ids:idsIn(template)};
}

// Removes a section and its fields for good. Ids after it shift down by one, as they are positional.
export function removeSection(target:Doc,sectionId:string):Doc{
 const t=sections(target.template);const index=t.items.findIndex(s=>s.id===sectionId);if(index<0)throw new HttpError(404,'That section no longer exists.');
 const s=t.items[index];if(/<h1\b/.test(s.html))throw new HttpError(422,'The section with the page’s main heading can’t be removed.');
 const main=t.main.slice(0,s.start)+t.main.slice(s.end);const template=target.template.replace(t.main,()=>main);
 const gone=new Set([...s.html.matchAll(PLACE)].map(m=>m[1]).filter(k=>!template.includes(`{{${k}}}`)));
 const shift=(ids:string[])=>ids.filter(i=>i!==sectionId).map(i=>{const k=Number(i.slice(8));return k>index?'section-'+(k-1):i});
 return {...target,template,fields:target.fields.filter(f=>!gone.has(f.key)),sectionOrder:shift(target.sectionOrder||t.items.map(i=>i.id)),hiddenSections:shift(target.hiddenSections||[]),ids:idsIn(template)};
}

// For the editor canvas: marks each top-level section with its id, and hidden ones so they can be shown faded.
export function markSections(template:string,hidden:string[]=[]){
 const t=sections(template);let main=t.main;
 for(let i=t.items.length-1;i>=0;i--){const s=t.items[i];const open=s.html.match(/^<section\b[^>]*?(\/?)>/)![0];
  main=main.slice(0,s.start)+open.replace(/>$/,` data-av-section="${s.id}" data-av-label="${esc(sectionType(s.html))}"${/<h1/.test(s.html)?' data-av-h1':''}${hidden.includes(s.id)?' data-av-hidden':''}>`)+main.slice(s.start+open.length)}
 return template.replace(t.main,()=>main);
}
