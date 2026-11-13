'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogMedia,AlertDialogTitle} from '@/components/ui/alert-dialog';
import {Monitor,Tablet,Smartphone,MousePointerClick,RotateCcw,ChevronDown,Search} from 'lucide-react';
import {request} from './content-tools';
import {applyForms} from '@/lib/avault/forms';

// Visual editor for the shared header and footer. The canvas is the homepage's real header and footer in
// the site's own CSS; clicking text edits it in place, clicking anything shows its text, link and labels in
// the inspector. Saved values are overrides keyed group|label|original value, applied to every page.
type Field={key:string;value:string;kind:string;label:string;section:string;group?:string};
type Selection={kind:'element';text:string[];attrs:{attr:string;key:string}[];title:string}|{kind:'form'};
const esc=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const okey=(f:Field)=>f.group+'|'+f.label+'|'+f.value;
const DEVICES={desktop:{w:1440,icon:Monitor,label:'Desktop'},tablet:{w:820,icon:Tablet,label:'Tablet'},mobile:{w:390,icon:Smartphone,label:'Mobile'}} as const;
export function friendly(label:string){const attr=label.split(' ')[1];return attr==='href'?'Link destination':attr==='src'?'Image URL':attr==='alt'?'Image description':attr==='aria-label'?'Screen-reader label':attr==='placeholder'?'Placeholder':attr?attr:'Text'}
const pairs=(el:Element)=>(el.getAttribute('data-av-a')||'').split(',').filter(Boolean).map(p=>{const [attr,key]=p.split('=');return {attr,key}});
export const CANVAS_CSS=`
.reveal{opacity:1!important;transform:none!important}
.header-wrap{position:relative!important;top:auto!important}
[data-av-k],[data-av-a]{cursor:pointer}
.av-hover{outline:2px dashed #062744!important;outline-offset:3px;border-radius:3px}
.av-selected{outline:2px solid #d6283b!important;outline-offset:3px;border-radius:3px;background-color:rgba(214,40,59,.06)!important}
[contenteditable="plaintext-only"],[contenteditable="true"]{cursor:text!important;outline:2px solid #d6283b!important;outline-offset:3px;background-color:rgba(214,40,59,.06)!important}
.av-canvas-main{display:grid;place-items:center;min-height:200px;margin:28px auto;width:calc(100% - 64px);max-width:1360px;border:2px dashed #dadce0;border-radius:24px;color:#80868b;font:500 15px/1.6 "Google Sans Flex",Arial,sans-serif;text-align:center;background:repeating-linear-gradient(45deg,#fafbfc 0 14px,#f3f5f8 14px 28px)}
.av-canvas-main strong{display:block;color:#3c4043;font-size:17px}
form.av-form-lock{position:relative;cursor:pointer}
form.av-form-lock *{pointer-events:none}
form.av-form-lock::after{content:"FORM";position:absolute;top:12px;right:12px;padding:7px 10px;border:1px solid #d6283b;border-radius:3px;background:#fff;color:#062744;font:700 11px/1 "Google Sans Flex",Arial,sans-serif;letter-spacing:.12em;opacity:0;transition:opacity .15s}
form.av-form-lock:hover::after,form.av-form-lock.av-selected::after{opacity:1}
`;

export function NavigationEditor({role,notice,docs,go}:{role:string;notice:(s:string)=>void;docs:any[];go:(view:string)=>void}){
 const [data,setData]=useState<any>(null),[nav,setNav]=useState<Record<string,string>>({}),[sel,setSel]=useState<Selection|null>(null),[device,setDevice]=useState<keyof typeof DEVICES>('desktop'),[busy,setBusy]=useState(false),[frameKey,setFrameKey]=useState(0),[height,setHeight]=useState(900),[width,setWidth]=useState(1000),[menuOpen,setMenuOpen]=useState(false),[query,setQuery]=useState(''),[showChanges,setShowChanges]=useState(false),[confirmDiscard,setConfirmDiscard]=useState(false);
 const frame=useRef<HTMLIFrameElement>(null),wrap=useRef<HTMLDivElement>(null),bar=useRef<HTMLDivElement>(null),[panelTop,setPanelTop]=useState(96),navRef=useRef(nav);
 useEffect(()=>{navRef.current=nav},[nav]);
 const fields:Field[]=useMemo(()=>data?.fields||[],[data]);
 const byKey=useMemo(()=>new Map(fields.map(f=>[f.key,f])),[fields]);
 const value=(k:string)=>{const f=byKey.get(k);return f?nav[okey(f)]??f.value:''};

 async function load(){try{const d=await request('navigation');setData(d);setNav(d.navigation||{});setSel(null);setFrameKey(k=>k+1)}catch(e){notice((e as Error).message)}}
 useEffect(()=>{load()},[]);// eslint-disable-line react-hooks/exhaustive-deps

 // Built once per load; later edits change the canvas DOM directly so typing never reloads the frame.
 const srcDoc=useMemo(()=>{if(!data?.canvas)return '';const c=data.canvas,start:Record<string,string>=data.navigation||{};
  const fill=(s:string)=>s.replace(/\{\{(f\d+)\}\}/g,(_,k)=>{const f=byKey.get(k);return esc(f?start[okey(f)]??f.value:'')});
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${c.styles.map((h:string)=>`<link rel="stylesheet" href="${esc(h)}">`).join('')}<style>${CANVAS_CSS}</style></head><body${c.bodyAttrs}><div class="concept concept-i is-visible">${fill(c.header)}<main class="av-canvas-main"><div><strong>Page content</strong>Each page shows its own content here. The header above and footer below are shared by every page.</div></main>${applyForms(fill(c.footer),data.forms)}</div></body></html>`;
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[data,frameKey]);

 const doc=()=>frame.current?.contentDocument||null;
 // Writes a value everywhere it appears: every field that shares this override key, text and attributes alike.
 const paint=useCallback((key:string,v:string)=>{const d=doc(),f=byKey.get(key);if(!d||!f)return;const ok=okey(f);
  for(const g of fields.filter(x=>okey(x)===ok)){d.querySelectorAll(`[data-av-k="${g.key}"]`).forEach(el=>{if(el!==d.activeElement)el.textContent=v});d.querySelectorAll('[data-av-a]').forEach(el=>{for(const p of pairs(el))if(p.key===g.key)el.setAttribute(p.attr,v)})}},[byKey,fields]);
 const setValue=useCallback((key:string,v:string,fromCanvas=false)=>{const f=byKey.get(key);if(!f)return;const ok=okey(f);setNav(n=>({...n,[ok]:v}));navRef.current={...navRef.current,[ok]:v};if(!fromCanvas)paint(key,v);else{const d=doc();if(d){for(const g of fields.filter(x=>okey(x)===ok&&x.key!==key))d.querySelectorAll(`[data-av-k="${g.key}"]`).forEach(el=>el.textContent=v)}}},[byKey,fields,paint]);

 function chooseCategory(d:Document,index:number){const cloud=d.querySelector('.cloud-menu');if(!cloud)return;cloud.classList.add('is-enhanced');(cloud as HTMLElement).dataset.category=String(index);cloud.querySelectorAll('.cloud-category').forEach((b,i)=>b.setAttribute('aria-selected',String(i===index)));cloud.querySelectorAll<HTMLElement>('.cloud-panel').forEach((p,i)=>p.hidden=i!==index)}
 const measure=useCallback(()=>{const d=doc();if(!d)return;setHeight(Math.max(d.documentElement.scrollHeight,menuOpen?1000:0,400))},[menuOpen]);

 function onLoad(){const d=doc();if(!d)return;let hover:Element|null=null;
  chooseCategory(d,0);d.querySelectorAll('form').forEach(f=>f.classList.add('av-form-lock'));
  const clear=()=>d.querySelectorAll('.av-selected').forEach(x=>x.classList.remove('av-selected'));
  d.addEventListener('mouseover',e=>{const t=(e.target as Element).closest('form.av-form-lock,[data-av-k],[data-av-a]');if(hover!==t){hover?.classList.remove('av-hover');t?.classList.add('av-hover');hover=t}});
  d.addEventListener('mouseleave',()=>{hover?.classList.remove('av-hover');hover=null});
  d.addEventListener('click',e=>{const t=e.target as Element;if((t as HTMLElement).closest?.('[contenteditable="plaintext-only"]'))return;e.preventDefault();e.stopPropagation();
   const form=t.closest('form');if(form){clear();form.classList.add('av-selected');setSel({kind:'form'});setShowChanges(false);return}
   const summary=t.closest('summary');if(summary){const det=summary.parentElement as HTMLDetailsElement;det.open=!det.open;setMenuOpen(det.open)}
   const cat=t.closest('.cloud-category');if(cat)chooseCategory(d,[...d.querySelectorAll('.cloud-category')].indexOf(cat));
   const toggle=t.closest('.menu-toggle');if(toggle){const n=d.querySelector('.i-nav');const open=!n?.classList.contains('is-open');n?.classList.toggle('is-open',open);d.body.classList.toggle('menu-open',open)}
   const el=t.closest('[data-av-k],[data-av-a]');if(!el)return;clear();
   const link=el.closest('[data-av-a]');const own=el.getAttribute('data-av-k');
   const text=[...new Set([...(own?[own]:[]),...[...(link||el).querySelectorAll('[data-av-k]')].map(x=>x.getAttribute('data-av-k')!)])].slice(0,8);
   const target=link&&link.contains(el)?link:el;target.classList.add('av-selected');
   const name=link?.tagName==='A'?'Link':el.tagName==='IMG'?'Image':el.closest('h1,h2,h3,h4')?'Heading':el.tagName==='BUTTON'||el.closest('button')?'Button':'Text';
   setSel({kind:'element',text,attrs:link?pairs(link):pairs(el),title:name});setShowChanges(false);
   // Text is edited right where it sits.
   if(own&&!el.querySelector('[data-av-k]')){const h=el as HTMLElement;h.contentEditable='plaintext-only';h.focus();const r=d.createRange();r.selectNodeContents(h);r.collapse(false);const s=d.getSelection();s?.removeAllRanges();s?.addRange(r)}
  },true);
  d.addEventListener('input',e=>{const el=(e.target as Element).closest?.('[data-av-k]');if(el)setValue(el.getAttribute('data-av-k')!,el.textContent||'',true)});
  d.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key==='Escape')&&(d.activeElement as HTMLElement)?.isContentEditable){e.preventDefault();(d.activeElement as HTMLElement).blur()}});
  d.addEventListener('focusout',e=>{const el=e.target as HTMLElement;if(el.isContentEditable)el.contentEditable='false'});
  d.addEventListener('submit',e=>e.preventDefault(),true);
  new ResizeObserver(measure).observe(d.body);measure();
 }
 useEffect(()=>{measure()},[menuOpen,measure]);
 const ready=!!data?.canvas;
 // The floating inspector sits just under the toolbar, wherever the toolbar is on screen.
 useEffect(()=>{const place=()=>{const b=bar.current?.getBoundingClientRect();if(b)setPanelTop(Math.max(16,b.bottom+12))};place();const o=new ResizeObserver(place);if(bar.current)o.observe(bar.current);addEventListener('scroll',place,true);addEventListener('resize',place);return()=>{o.disconnect();removeEventListener('scroll',place,true);removeEventListener('resize',place)}},[ready]);
 useEffect(()=>{const el=wrap.current;if(!el)return;setWidth(el.clientWidth);const o=new ResizeObserver(()=>setWidth(el.clientWidth));o.observe(el);return()=>o.disconnect()},[ready]);
 function toggleMenu(){const d=doc();const det=d?.querySelector<HTMLDetailsElement>('.services-menu');if(!det)return;det.open=!det.open;setMenuOpen(det.open)}

 // Unpublished = differs from what is live now; the saved set = every override that differs from the original text.
 const orig=(k:string)=>k.split('|').slice(2).join('|');
 const changes=useMemo(()=>{const live=data?.navigation||{};return [...new Set([...Object.keys(nav),...Object.keys(live)])].filter(k=>(nav[k]??orig(k))!==(live[k]??orig(k))).map(k=>({k,v:nav[k]??orig(k),was:live[k]??orig(k),f:fields.find(f=>okey(f)===k)})).filter(c=>c.f)},[nav,fields,data]);
 async function publish(){setBusy(true);try{await request('navigation',{navigation:Object.fromEntries(Object.entries(nav).filter(([k,v])=>v!==orig(k))),revision:data.revision});notice('Header and footer published. Every page uses the new version.');await load()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 function revert(k:string){const f=fields.find(x=>okey(x)===k);if(!f)return;setValue(f.key,data.navigation?.[k]??f.value)}

 if(!data)return <p role="status">Loading the header and footer…</p>;
 if(!data.canvas)return <div className="vault-card"><p>The homepage could not be loaded, so the shared header and footer are unavailable.</p></div>;
 const D=DEVICES[device],scale=Math.min(1,width/D.w);
 const fieldInput=(key:string,label?:string)=>{const f=byKey.get(key);if(!f)return null;const v=nav[okey(f)]??f.value,changed=v!==f.value;const shared=fields.filter(x=>okey(x)===okey(f)).length;
  return <label key={key} className="av-nav-field"><span>{label||friendly(f.label)}{changed&&<Badge variant="outline">edited</Badge>}</span>{f.kind==='url'?<Input list="av-nav-pages" value={v} onChange={e=>setValue(key,e.target.value)}/>:v.length>90?<Textarea rows={3} value={v} onChange={e=>setValue(key,e.target.value)}/>:<Input value={v} onChange={e=>setValue(key,e.target.value)}/>}{shared>1&&<small>Also used in {shared-1} other spot{shared>2?'s':''}; they change together.</small>}{changed&&<button type="button" className="av-link" onClick={()=>setValue(key,f.value)}><RotateCcw size={13}/>Restore “{f.value.slice(0,40)}”</button>}</label>};

 return <div className="av-nav">
  <datalist id="av-nav-pages">{docs.filter(d=>d.status==='published').map(d=><option key={d.route} value={d.route}>{d.label}</option>)}</datalist>
  <div className="vault-card av-nav-toolbar" ref={bar}>
   <div className="av-seg" role="group" aria-label="Preview size">{(Object.keys(DEVICES) as (keyof typeof DEVICES)[]).map(k=>{const I=DEVICES[k].icon;return <button key={k} type="button" className={device===k?'selected':''} onClick={()=>setDevice(k)} aria-pressed={device===k}><I size={16}/>{DEVICES[k].label}</button>})}</div>
   {device==='desktop'&&<Button variant="outline" onClick={toggleMenu}><ChevronDown/>{menuOpen?'Close':'Open'} services menu</Button>}
   {!changes.length&&<span className="av-nav-hint"><MousePointerClick size={16}/>Click text to edit · click a link to change it</span>}
   <span className="av-nav-actions">{changes.length>0&&<Button variant="outline" onClick={()=>{setShowChanges(!showChanges);setSel(null)}}>{changes.length} unpublished</Button>}{changes.length>0&&<Button variant="outline" disabled={busy} onClick={()=>setConfirmDiscard(true)}><RotateCcw/>Revert all</Button>}<Button disabled={busy||role!=='owner'||!changes.length} onClick={publish}>{changes.length?`Publish ${changes.length} change${changes.length>1?'s':''}`:'No changes yet'}</Button></span>
  </div>
  <div className="av-nav-layout">
   <div className="av-nav-stage" ref={wrap}><div style={{height:height*scale,position:'relative'}}><iframe key={frameKey} ref={frame} title="Header and footer editor" srcDoc={srcDoc} onLoad={onLoad} style={{width:D.w,height,transform:`scale(${scale})`,transformOrigin:'0 0',position:'absolute',left:Math.max(0,(width-D.w*scale)/2)}}/></div></div>
   {(sel||showChanges)&&<aside className="vault-card av-nav-inspector" aria-label="Edit selection" style={{top:panelTop,maxHeight:`calc(100vh - ${panelTop+24}px)`}}><button type="button" className="av-nav-close" aria-label="Close" onClick={()=>{setSel(null);setShowChanges(false);doc()?.querySelectorAll('.av-selected').forEach(x=>x.classList.remove('av-selected'))}}>×</button>
    {sel?.kind==='form'&&<><h2>Contact form</h2><p>The form’s fields, choices and button are edited in <b>Forms</b>, where you can also add new fields.</p><Button onClick={()=>go('site-forms')}>Open Forms</Button></>}
    {sel?.kind==='element'&&<><p className="eyebrow">Selected</p><h2>{sel.title}</h2>{sel.text.map(k=>fieldInput(k,sel.text.length>1?`Text: “${value(k).slice(0,28)}”`:undefined))}{sel.attrs.map(a=>fieldInput(a.key))}{!sel.text.length&&!sel.attrs.length&&<p>Nothing to edit here.</p>}<Button variant="outline" onClick={()=>{setSel(null);doc()?.querySelectorAll('.av-selected').forEach(x=>x.classList.remove('av-selected'))}}>Done</Button></>}
    {!sel&&showChanges&&changes.length>0&&<div className="av-nav-changes"><h3>Unpublished changes ({changes.length})</h3>{changes.map(c=><div key={c.k} className="vault-row"><span><small>{c.f!.group==='footer'?'Footer':'Header'} · {friendly(c.f!.label)}</small><del>{c.was||'(empty)'}</del><strong>{c.v||'(empty)'}</strong></span><button type="button" className="av-link" onClick={()=>revert(c.k)} aria-label="Undo this change"><RotateCcw size={14}/></button></div>)}</div>}
   </aside>}
  </div>
  <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}><AlertDialogContent className="av-editor-confirm"><AlertDialogHeader><AlertDialogMedia><RotateCcw/></AlertDialogMedia><AlertDialogTitle>Revert all header and footer changes?</AlertDialogTitle><AlertDialogDescription>Every unpublished shared-navigation and footer edit will return to the current live version. Published content will not change.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction onClick={()=>{setNav(data.navigation||{});setSel(null);setShowChanges(false);setFrameKey(k=>k+1)}}>Revert unpublished changes</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  <details className="vault-card av-nav-all"><summary>All header and footer text, including hidden labels ({fields.length})</summary><p>Screen-reader labels, the skip link and other text that isn’t visible in the preview.</p><label className="av-search"><Search size={16}/><Input placeholder="Find text or a link…" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="av-nav-grid">{fields.filter(f=>!query||(value(f.key)+' '+f.label).toLowerCase().includes(query.toLowerCase())).filter((f,i,a)=>a.findIndex(x=>okey(x)===okey(f))===i).slice(0,200).map(f=>fieldInput(f.key,`${f.group==='footer'?'Footer':'Header'} · ${friendly(f.label)}`))}</div></details>
 </div>;
}
