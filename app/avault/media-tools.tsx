'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Copy,MapPin,Pencil,ChevronDown,PanelsTopLeft,ArrowUpRight,FileText} from 'lucide-react';
import {request} from './content-tools';

// One image in AVAULT → Media: preview, where it's used (one line per page), and its maintenance tools.
type Use={route:string;label?:string;state:'published'|'draft';section:string;group?:string};
function summarize(list:Use[]){
 // A shared header/footer image appears on every page; that's one fact, not a page list.
 const shared=list.filter(u=>u.group==='navigation'||u.group==='footer'||u.route==='@global');
 const sharedPages=new Set(shared.filter(u=>u.route!=='@global').map(u=>u.route));
 const pages=new Map<string,{route:string;label:string;live:boolean;draft:boolean;places:Set<string>}>();
 for(const u of list){if(u.route==='@global'||u.group==='navigation'||u.group==='footer')continue;
  const p=pages.get(u.route)||{route:u.route,label:u.label||u.route,live:false,draft:false,places:new Set<string>()};
  if(u.state==='published')p.live=true;else p.draft=true;
  if(['Social image','Content block','Article body'].includes(u.section))p.places.add(u.section);
  pages.set(u.route,p)}
 return {shared:shared.length>0,sharedCount:sharedPages.size,pages:[...pages.values()].sort((a,b)=>a.label.localeCompare(b.label))};
}

export function MediaCard({media,uploads,role,notice,reload}:{media:any;uploads:any[];role:string;notice:(s:string)=>void;reload:()=>void}){
 const [usage,setUsage]=useState<ReturnType<typeof summarize>|null>(null),[showUsage,setShowUsage]=useState(false),[all,setAll]=useState(false),[alt,setAlt]=useState(media.alt||''),[altImpact,setAltImpact]=useState<any>(null),[editing,setEditing]=useState(false),[value,setValue]=useState({...media,...JSON.parse(media.metadata||'{}')}),[to,setTo]=useState(''),[impact,setImpact]=useState<any>(null),[busy,setBusy]=useState(false);
 const url=media.src||'/media/'+media.key,name=url.split('/').pop(),isImage=!media.mime||String(media.mime).startsWith('image/');
 async function act(fn:()=>Promise<any>){setBusy(true);try{await fn()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 const toggleUsage=()=>{if(showUsage)return setShowUsage(false);act(async()=>{setUsage(summarize(await request('media-usage?url='+encodeURIComponent(url))));setShowUsage(true)})};
 const copy=()=>navigator.clipboard?.writeText(url).then(()=>notice('File address copied.'),()=>notice('Copy failed. Select the address and copy it instead.'));
 const visible=usage?(all?usage.pages:usage.pages.slice(0,6)):[];
 return <article className="vault-card av-media-card">
  <div className={'av-media-thumb'+(isImage?'':' av-file-thumb')}>{isImage?<img src={url} alt={media.alt||''} loading="lazy" decoding="async"/>:<><FileText size={46}/><span>{String(media.mime||'file').split('/').pop()}</span></>}</div>
  <div className="av-media-body">
   <strong className="av-media-name" title={name}>{media.name||name}</strong>
   <p className={media.alt?'av-media-alt':'av-media-alt none'}>{media.alt||(isImage?'No description (fine only for decorative images)':'No accessible file description')}</p>
   <div className="av-chips"><span className={'av-pill '+(media.uses?'av-pill-live':'av-pill-draft')}>{media.uses?`On ${media.uses} page${media.uses===1?'':'s'}`:'Not used'}</span>{media.missingAlt&&<span className="av-pill av-pill-warn">Missing a description somewhere</span>}</div>
   <div className="av-media-url"><code title={url}>{url}</code><Button variant="ghost" size="icon" aria-label="Copy file address" onClick={copy}><Copy/></Button></div>
   <div className="av-media-actions"><Button variant={showUsage?'default':'outline'} size="sm" disabled={busy} onClick={toggleUsage} aria-expanded={showUsage}><MapPin/>Where used</Button>{media.id&&<Button variant={editing?'default':'outline'} size="sm" onClick={()=>setEditing(!editing)} aria-expanded={editing}><Pencil/>Edit details</Button>}</div>
  </div>
  {showUsage&&usage&&<div className="av-media-panel">
   {!usage.shared&&!usage.pages.length&&<p className="muted">Not used on any page.</p>}
   {usage.shared&&<a className="av-use-row" href="/avault?view=navigation"><PanelsTopLeft size={16} aria-hidden="true"/><span><strong>Header &amp; footer</strong><small>Shown on every page{usage.sharedCount?` (${usage.sharedCount})`:''}</small></span><ArrowUpRight size={15} aria-hidden="true"/></a>}
   {usage.pages.length>0&&<><p className="av-use-head">{usage.pages.length} page{usage.pages.length===1?'':'s'}{usage.shared?' also use it in their content':''}</p>
    <ul className="av-use-list">{visible.map(p=><li key={p.route}><a href={'/avault?view=pages&route='+encodeURIComponent(p.route)}><span><strong>{p.label}</strong><small>{p.route}{p.places.size?' · '+[...p.places].join(', '):''}</small></span>{p.live?<span className="av-pill av-pill-live">Live</span>:<span className="av-pill av-pill-draft">Draft only</span>}</a></li>)}</ul>
    {usage.pages.length>6&&<button type="button" className="av-link" onClick={()=>setAll(!all)}>{all?'Show fewer':`Show all ${usage.pages.length}`}</button>}</>}
  </div>}
  {editing&&<div className="av-media-panel av-media-form">{(['name','alt','caption','credit'] as const).map(k=><label key={k}>{({name:'Name',alt:'Description',caption:'Caption',credit:'Credit'})[k]}<Input value={value[k]||''} onChange={e=>setValue({...value,[k]:e.target.value})}/></label>)}{value.width&&<p className="muted">{value.width} × {value.height}px</p>}<Button size="sm" disabled={busy} onClick={()=>act(async()=>{await request('media-update',{id:media.id,...value,expectedUpdatedAt:JSON.parse(media.metadata||'{}').updatedAt});notice('Media details saved. Existing page descriptions are preserved.');setEditing(false);reload()})}>Save details</Button></div>}
  <details className="av-media-more"><summary><ChevronDown size={15} aria-hidden="true"/>Set the description everywhere</summary><p>Updates this image’s description on every page that shows it, drafts and live pages. Leave it empty only for purely decorative images.</p><label>Description<Input value={alt} onChange={e=>{setAlt(e.target.value);setAltImpact(null)}}/></label><Button variant="outline" size="sm" disabled={busy} onClick={()=>act(async()=>setAltImpact(await request('media-alt',{url,alt,dryRun:true})))}>Review affected pages</Button>{altImpact&&<>{!altImpact.affected.length?<p>Every use already has this description.</p>:<><ul className="av-use-list compact">{altImpact.affected.map((a:any)=><li key={a.route}><span><strong>{a.route}</strong><small>{a.locations.length} spot{a.locations.length===1?'':'s'}</small></span></li>)}</ul><Button size="sm" disabled={busy} onClick={()=>act(async()=>{const r=await request('media-alt',{url,alt,expected:altImpact.affected.map((a:any)=>({route:a.route,revision:a.revision}))});notice(`Description updated on ${r.updated} page(s).`);setAltImpact(null);reload()})}>Apply to {altImpact.affected.length} page{altImpact.affected.length===1?'':'s'}</Button></>}</>}</details>
  {role==='owner'&&<details className="av-media-more"><summary><ChevronDown size={15} aria-hidden="true"/>Replace or archive</summary><label>Swap every use for an uploaded image<select value={to} onChange={e=>{setTo(e.target.value);setImpact(null)}}><option value="">Choose image</option>{uploads.filter(m=>'/media/'+m.key!==url).map(m=><option key={m.id} value={'/media/'+m.key}>{m.name}</option>)}</select></label><Button variant="outline" size="sm" disabled={!to||busy} onClick={()=>act(async()=>setImpact(await request('media-replace',{from:url,to,dryRun:true})))}>Review replacement</Button>{impact&&<><p>{impact.affected.length} page record{impact.affected.length===1?'':'s'} affected.</p><Button size="sm" disabled={busy} onClick={()=>act(async()=>{await request('media-replace',{from:url,to,expected:impact.affected});notice('Image references updated.');setImpact(null);reload()})}>Apply replacement</Button></>}{media.id&&<Button variant="outline" size="sm" disabled={busy} onClick={()=>act(async()=>{if(!confirm('Archive this unused image? A backup is created first, and in-use images cannot be archived.'))return;await request('media-delete',{id:media.id});notice('Image archived.');reload()})}>Archive unused upload</Button>}</details>}
 </article>;
}
