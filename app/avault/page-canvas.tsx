'use client';
import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogMedia,AlertDialogTitle} from '@/components/ui/alert-dialog';
import {Monitor,Tablet,Smartphone,MousePointerClick,RefreshCw,RotateCcw,Upload,PanelsTopLeft,ArrowUp,ArrowDown,Copy,Eye,EyeOff,Trash2,Plus} from 'lucide-react';
import {SectionLibrary,type LibraryItem} from './section-library-dialog';
import {request} from './content-tools';
import {adminFetch} from './session';
import {CANVAS_CSS,friendly} from './navigation-editor';
import type {Doc} from '@/lib/avault/store';

// Live editor for a page's own content. The canvas is the unsaved draft rendered by the server with every
// {{fN}} spot tagged (data-av-k for text, data-av-a for attributes). Text is typed right on the page; links,
// images and labels open in the inspector. Edits go straight into the draft, so Undo, Save and Publish work
// as on every other tab. Shared site chrome is omitted here because it has its own editor.
// Sections (data-av-section) get a toolbar on hover: move and hide change the draft like any edit; adding a
// prebuilt section, duplicating and removing change the page's structure, so the server builds those and
// saves the draft straight away.
type Hover={id:string;label:string;top:number;left:number;width:number;height:number;hidden:boolean;h1:boolean};
type Selection={kind:'element';text:string[];attrs:{attr:string;key:string}[];title:string}|{kind:'form';keys:string[]}|{kind:'shared'};
type Confirmation={title:string;description:string;action:string;destructive?:boolean;run:()=>void|Promise<void>};
const DEVICES={desktop:{w:1440,icon:Monitor,label:'Desktop'},tablet:{w:820,icon:Tablet,label:'Tablet'},mobile:{w:390,icon:Smartphone,label:'Mobile'}} as const;
const pairs=(el:Element)=>(el.getAttribute('data-av-a')||'').split(',').filter(Boolean).map(p=>{const [attr,key]=p.split('=');return {attr,key}});
const PAGE_CSS=`
.site-loader,#page-curtain,.topbar,.header-wrap,.site-header,.site-footer,.back-to-top,body>header,body>footer{display:none!important}
.reveal,[class*="reveal"]{opacity:1!important;transform:none!important;visibility:visible!important}
[data-av-section].av-section-hover{outline:2px solid rgba(26,115,232,.45)!important;outline-offset:-2px}
[data-av-hidden]{opacity:.35;filter:grayscale(.6)}
`;
const isShared=(group?:string)=>group==='navigation'||group==='footer';
const structureKey=(d:Doc)=>JSON.stringify([d.sectionOrder,d.hiddenSections,d.blocks,d.template]);

export function PageCanvas({doc,setField,change,replace,revert,docs,go,notice,original}:{doc:Doc;setField:(key:string,value:string)=>void;change:(d:Doc)=>void;replace:(d:Doc)=>void;revert:()=>void;docs:any[];go:(view:string)=>void;notice:(s:string)=>void;original:Doc|null}){
 const [html,setHtml]=useState(''),[loading,setLoading]=useState(false),[sel,setSel]=useState<Selection|null>(null),[device,setDevice]=useState<keyof typeof DEVICES>('desktop'),[height,setHeight]=useState(1200),[width,setWidth]=useState(1000),[panelTop,setPanelTop]=useState(96),[media,setMedia]=useState<{src:string;alt:string}[]|null>(null),[uploading,setUploading]=useState(false),[hover,setHover]=useState<Hover|null>(null),[library,setLibrary]=useState<{after:string|null}|null>(null),[working,setWorking]=useState(false),[domOrder,setDomOrder]=useState<string[]>([]),[confirmation,setConfirmation]=useState<Confirmation|null>(null);
 const frame=useRef<HTMLIFrameElement>(null),wrap=useRef<HTMLDivElement>(null),bar=useRef<HTMLDivElement>(null),upload=useRef<HTMLInputElement>(null);
 // What the canvas DOM currently shows for each field, so only real changes (undo, inspector) are repainted.
 const painted=useRef(new Map<string,string>()),hoverEl=useRef<Element|null>(null),skipStructure=useRef('');
 const fieldRef=useRef(setField),docRef=useRef(doc);
 const byKey=useMemo(()=>new Map(doc.fields.map(f=>[f.key,f])),[doc.fields]);
 const byKeyRef=useRef(byKey);
 // The canvas's own listeners are attached once per load, so they read the latest values through refs.
 useLayoutEffect(()=>{fieldRef.current=setField;docRef.current=doc;byKeyRef.current=byKey});
 const startValue=useMemo(()=>new Map((original?.fields||[]).map(f=>[f.key,f.value])),[original]);
 const pageChanged=useMemo(()=>!!original&&JSON.stringify(doc)!==JSON.stringify(original),[doc,original]);

 const load=useCallback(async()=>{const d=docRef.current;setLoading(true);try{const r=await request('canvas',{document:d});painted.current=new Map(d.fields.map(f=>[f.key,f.value]));setSel(null);setHover(null);hoverEl.current=null;setHtml(r.html)}catch(e){notice((e as Error).message)}finally{setLoading(false)}},[notice]);
 // Sections, blocks and the order they appear in change the page's markup, so those reload the canvas.
 const structure=structureKey(doc);
 useEffect(()=>{if(skipStructure.current===structure){skipStructure.current='';return}const t=setTimeout(load,html?500:0);return()=>clearTimeout(t)},[structure]);// eslint-disable-line react-hooks/exhaustive-deps

 const frameDoc=()=>frame.current?.contentDocument||null;
 // Field changes made anywhere else (inspector, Undo/Redo, the All fields tab) are written into the canvas DOM.
 useEffect(()=>{const d=frameDoc();if(!d)return;for(const f of doc.fields){if(painted.current.get(f.key)===f.value)continue;painted.current.set(f.key,f.value);
  d.querySelectorAll(`[data-av-k="${f.key}"]`).forEach(el=>{if(el!==d.activeElement)el.textContent=f.value});
  d.querySelectorAll('[data-av-a]').forEach(el=>{for(const p of pairs(el))if(p.key===f.key)el.setAttribute(p.attr,f.value)})}
 },[doc.fields]);

 const place=useCallback((el:Element|null)=>{if(!el){setHover(null);return}const r=el.getBoundingClientRect();setHover({id:el.getAttribute('data-av-section')!,label:el.getAttribute('data-av-label')||'Section',top:r.top,left:r.left,width:r.width,height:r.height,hidden:el.hasAttribute('data-av-hidden'),h1:el.hasAttribute('data-av-h1')})},[]);
 const measure=useCallback(()=>{const d=frameDoc();if(d)setHeight(Math.max(d.documentElement.scrollHeight,400));place(hoverEl.current)},[place]);
 const clear=(d:Document)=>d.querySelectorAll('.av-selected').forEach(x=>x.classList.remove('av-selected'));
 const commit=(key:string,value:string)=>{painted.current.set(key,value);fieldRef.current(key,value)};

 const keysOf=(el:Element)=>[el.getAttribute('data-av-k'),...pairs(el).map(p=>p.key)].filter(Boolean) as string[];
 function decorateCanvas(d:Document){
  d.querySelectorAll('[data-av-k],[data-av-a]').forEach(el=>{const keys=keysOf(el);if(keys.length&&keys.every(k=>isShared(byKeyRef.current.get(k)?.group)))el.classList.add('av-shared')});
  d.querySelectorAll('form').forEach(f=>f.classList.add('av-form-lock'));
  setDomOrder([...d.querySelectorAll('[data-av-section]')].map(s=>s.getAttribute('data-av-section')!));
  const cloud=d.querySelector('.cloud-menu');if(cloud){cloud.classList.add('is-enhanced');cloud.querySelectorAll<HTMLElement>('.cloud-panel').forEach((p,i)=>p.hidden=i!==0)}
 }
 function onLoad(){const d=frameDoc();if(!d)return;let hover:Element|null=null,before='';
  decorateCanvas(d);
  d.addEventListener('mouseover',e=>{const t=(e.target as Element).closest('form.av-form-lock,[data-av-k],[data-av-a]');if(hover!==t){hover?.classList.remove('av-hover');t?.classList.add('av-hover');hover=t}
   const sec=(e.target as Element).closest('[data-av-section]');if(sec&&sec!==hoverEl.current){hoverEl.current?.classList.remove('av-section-hover');sec.classList.add('av-section-hover');hoverEl.current=sec;place(sec)}});
  d.addEventListener('mouseleave',()=>{hover?.classList.remove('av-hover');hover=null});
  d.addEventListener('click',e=>{const t=e.target as Element;if((t as HTMLElement).closest?.('[contenteditable="plaintext-only"]'))return;e.preventDefault();e.stopPropagation();
   const form=t.closest('form');if(form){clear(d);form.classList.add('av-selected');setSel({kind:'form',keys:[...new Set([...form.querySelectorAll('[data-av-k],[data-av-a]')].flatMap(keysOf))].filter(k=>byKeyRef.current.has(k))});return}
   const summary=t.closest('summary');if(summary&&!summary.classList.contains('av-selected')&&!summary.querySelector('.av-selected')){const det=summary.parentElement as HTMLDetailsElement;det.open=!det.open}
   const el=t.closest('[data-av-k],[data-av-a]');if(!el){clear(d);setSel(null);return}
   const shared=el.closest('.av-shared');if(shared){clear(d);shared.classList.add('av-selected');setSel({kind:'shared'});return}
   clear(d);
   const link=el.closest('a[data-av-a],button[data-av-a]'),own=el.getAttribute('data-av-k');
   const text=[...new Set([...(own?[own]:[]),...[...(link||el).querySelectorAll('[data-av-k]')].map(x=>x.getAttribute('data-av-k')!)])].filter(k=>byKeyRef.current.has(k)).slice(0,8);
   const attrs=[...pairs(el),...(link&&link!==el?pairs(link):[])].filter(a=>byKeyRef.current.has(a.key));
   (link&&link!==el&&el.tagName!=='IMG'?link:el).classList.add('av-selected');
   const name=el.tagName==='IMG'?'Image':link?.tagName==='A'?'Link':el.closest('h1,h2,h3,h4')?'Heading':el.closest('button')?'Button':el.closest('summary')?'Question':'Text';
   setSel({kind:'element',text,attrs,title:name});
   // Text is edited right where it sits.
   if(own&&!el.querySelector('[data-av-k]')&&byKeyRef.current.has(own)){const h=el as HTMLElement;before=byKeyRef.current.get(own)!.value;if(h.textContent!==before)h.textContent=before;h.contentEditable='plaintext-only';h.focus();const r=d.createRange();r.selectNodeContents(h);r.collapse(false);const s=d.getSelection();s?.removeAllRanges();s?.addRange(r)}
  },true);
  d.addEventListener('input',e=>{const el=(e.target as Element).closest?.('[data-av-k]');if(!el)return;const key=el.getAttribute('data-av-k')!;const f=byKeyRef.current.get(key);if(!f)return;let v=el.textContent||'';if(!before.includes('\u00a0'))v=v.replace(/\u00a0/g,' ');commit(key,v)});
  d.addEventListener('keydown',e=>{const a=d.activeElement as HTMLElement|null;if(!a?.isContentEditable)return;
   if(e.key==='Escape'){e.preventDefault();const key=a.getAttribute('data-av-k');if(key){a.textContent=before;commit(key,before)}a.blur()}
   else if(e.key==='Enter'&&!e.isComposing){e.preventDefault();a.blur()}
   // A space inside a question would otherwise open or close its answer.
   else if(e.key===' '&&a.closest('summary')){e.preventDefault();d.execCommand('insertText',false,' ')}
  });
  d.addEventListener('focusout',e=>{const el=e.target as HTMLElement;if(el.isContentEditable)el.contentEditable='false'});
  d.addEventListener('submit',e=>e.preventDefault(),true);
  new ResizeObserver(measure).observe(d.body);measure();
 }

 // The floating inspector sits just under the toolbar, wherever the toolbar is on screen.
 useEffect(()=>{const place=()=>{const b=bar.current?.getBoundingClientRect();if(b)setPanelTop(Math.max(16,b.bottom+12))};place();const o=new ResizeObserver(place);if(bar.current)o.observe(bar.current);addEventListener('scroll',place,true);addEventListener('resize',place);return()=>{o.disconnect();removeEventListener('scroll',place,true);removeEventListener('resize',place)}},[]);
 useEffect(()=>{const el=wrap.current;if(!el)return;setWidth(el.clientWidth);const o=new ResizeObserver(()=>setWidth(el.clientWidth));o.observe(el);return()=>o.disconnect()},[]);
 useEffect(()=>{if(sel?.kind==='element'&&sel.attrs.some(a=>a.attr==='src')&&!media)request('media').then((r:any)=>{const seen=new Set<string>();setMedia([...(r.uploaded||[]).map((m:any)=>({src:'/media/'+m.key,alt:m.alt||''})),...(r.existing||[])].filter(m=>m.src&&!seen.has(m.src)&&seen.add(m.src)))}).catch(()=>setMedia([]))},[sel,media]);

 async function uploadImage(file:File,srcKey:string){setUploading(true);try{const f=new FormData();f.set('file',file);f.set('alt','');const r=await adminFetch('media/',{method:'POST',body:f});const v:any=await r.json();if(!r.ok)throw new Error(v.error||'Upload failed');setField(srcKey,v.url);setMedia(m=>m&&[{src:v.url,alt:''},...m.filter(x=>x.src!==v.url)]);notice('Image uploaded. Add a description for people who can’t see it.')}catch(e){notice((e as Error).message)}finally{setUploading(false)}}
 function close(){setSel(null);const d=frameDoc();if(d)clear(d)}

 // Section order covers every section, hidden ones included (the canvas shows those faded).
 const order=()=>doc.sectionOrder||domOrder;
 async function paintStructure(next:Doc){const r=await request('canvas',{document:next}),parsed=new DOMParser().parseFromString(r.html,'text/html'),current=frameDoc(),from=parsed.querySelector('main'),to=current?.querySelector('main');if(!current||!from||!to){setHtml(r.html);return}const scroll=current.defaultView?.scrollY||0;to.innerHTML=from.innerHTML;painted.current=new Map(next.fields.map(f=>[f.key,f.value]));setSel(null);setHover(null);hoverEl.current=null;decorateCanvas(current);requestAnimationFrame(()=>{measure();current.defaultView?.scrollTo({top:scroll})})}
 async function updateStructure(next:Doc){setWorking(true);try{await paintStructure(next);skipStructure.current=structureKey(next);change(next)}catch(e){notice((e as Error).message)}finally{setWorking(false)}}
 function move(id:string,by:number){const o=[...order()],i=o.indexOf(id),j=i+by;if(i<0||j<0||j>=o.length)return;[o[i],o[j]]=[o[j],o[i]];void updateStructure({...doc,sectionOrder:o})}
 function toggleHidden(id:string){const h=doc.hiddenSections||[];void updateStructure({...doc,sectionOrder:order(),hiddenSections:h.includes(id)?h.filter(x=>x!==id):[...h,id]})}
 async function restructure(op:'insert'|'duplicate'|'remove',extra:Record<string,unknown>,done:string){setWorking(true);try{const next=await request('section-edit',{document:docRef.current,expectedRevision:docRef.current.revision,op,...extra});await paintStructure(next);skipStructure.current=structureKey(next);replace(next);setLibrary(null);notice(done)}catch(e){notice((e as Error).message)}finally{setWorking(false)}}
 const addFrom=(item:LibraryItem)=>restructure('insert',{source:{route:item.route,section:item.section},after:library?.after??null},`${item.type} section added and the draft saved. Click its text to make it yours.`);
 const remove=(id:string,label:string)=>setConfirmation({title:`Remove ${label.toLowerCase()} section?`,description:'The section and its text will be removed and the draft will save immediately. You can restore it later from Revisions.',action:'Remove section',destructive:true,run:()=>void restructure('remove',{section:id},'Section removed and the draft saved.')});
 async function revertPage(){if(!original)return;setWorking(true);try{await paintStructure(original);skipStructure.current=structureKey(original);revert();notice('All unsaved page changes were reverted to the last saved draft.')}catch(e){notice((e as Error).message)}finally{setWorking(false)}}

 // The editor's outlines and hover states go into the page alongside its own stylesheets.
 const srcDoc=useMemo(()=>html.replace(/\s+inert(?=[\s>])/g,'').replace('</head>',()=>`<style>${CANVAS_CSS}${PAGE_CSS}</style></head>`),[html]);
 const D=DEVICES[device],scale=Math.min(1,width/D.w),offset=Math.max(0,(width-D.w*scale)/2);
 const fieldInput=(key:string,label?:string)=>{const f=byKey.get(key);if(!f)return null;const was=startValue.get(key),changed=was!==undefined&&f.value!==was;
  return <label key={key} className="av-nav-field"><span>{label||friendly(f.label)}{changed&&<Badge variant="outline">edited</Badge>}</span>{f.kind==='url'?<Input list="av-page-destinations" value={f.value} onChange={e=>setField(key,e.target.value)}/>:f.value.length>90?<Textarea rows={4} value={f.value} onChange={e=>setField(key,e.target.value)}/>:<Input value={f.value} onChange={e=>setField(key,e.target.value)}/>}{changed&&<button type="button" className="av-link" onClick={()=>setField(key,was!)}><RotateCcw size={13}/>Restore “{was!.slice(0,40)}”</button>}</label>};
 const imageTools=(srcKey:string)=>{const src=byKey.get(srcKey)?.value||'';return <div className="av-canvas-image" key={'img-'+srcKey}>
  {src&&<img src={src} alt=""/>}
  <input ref={upload} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml" hidden onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)uploadImage(file,srcKey)}}/>
  <Button variant="outline" disabled={uploading} onClick={()=>upload.current?.click()}><Upload/>{uploading?'Uploading…':'Upload a new image'}</Button>
  {media&&media.length>0&&<label className="av-nav-field"><span>Or choose from the media library</span><select value="" onChange={e=>{if(e.target.value)setField(srcKey,e.target.value)}}><option value="">Choose an image…</option>{media.map(m=><option key={m.src} value={m.src}>{m.alt||m.src.split('/').pop()}</option>)}</select></label>}
 </div>};

 return <div className="av-nav av-page-canvas">
  <datalist id="av-page-destinations">{docs.filter(d=>d.status==='published').map(d=><option key={d.route} value={d.route}>{d.label}</option>)}</datalist>
  <div className="vault-card av-nav-toolbar" ref={bar}>
   <div className="av-seg" role="group" aria-label="Preview size">{(Object.keys(DEVICES) as (keyof typeof DEVICES)[]).map(k=>{const I=DEVICES[k].icon;return <button key={k} type="button" className={device===k?'selected':''} onClick={()=>setDevice(k)} aria-pressed={device===k}><I size={16}/>{DEVICES[k].label}</button>})}</div>
   <span className="av-nav-hint"><MousePointerClick size={16}/>Click text to type over it · hover a section to move, hide or add one</span>
   <span className="av-nav-actions"><Button variant="outline" onClick={()=>{const o=order();setLibrary({after:o[o.length-1]||null})}} disabled={working||!html}><Plus/>Add section</Button><Button variant="outline" onClick={()=>setConfirmation({title:'Revert the whole page?',description:'Every unsaved text, image, SEO, section order, visibility and content-block change on this page will return to the last saved draft.',action:'Revert unsaved changes',run:revertPage})} disabled={working||!pageChanged}><RotateCcw/>Revert page</Button><Button variant="outline" onClick={load} disabled={loading||working}><RefreshCw/>{loading?'Loading…':'Refresh'}</Button></span>
  </div>
  <div className="av-nav-layout">
   <div className="av-nav-stage" ref={wrap} onMouseLeave={()=>{hoverEl.current?.classList.remove('av-section-hover');hoverEl.current=null;setHover(null)}}>{html?<div style={{height:height*scale,position:'relative'}}><iframe ref={frame} title="Live page editor" srcDoc={srcDoc} onLoad={onLoad} style={{width:D.w,height,transform:`scale(${scale})`,transformOrigin:'0 0',position:'absolute',left:offset}}/>
    {hover&&<SectionTools hover={hover} order={order()} scale={scale} offset={offset} working={working} move={move} toggleHidden={toggleHidden} duplicate={id=>restructure('duplicate',{section:id,after:id},'Section duplicated and the draft saved.')} remove={remove} add={id=>setLibrary({after:id})}/>}
   </div>:<p role="status" style={{padding:24}}>Loading the page…</p>}</div>
   {sel&&<aside className="vault-card av-nav-inspector" aria-label="Edit selection" style={{top:panelTop,maxHeight:`calc(100vh - ${panelTop+24}px)`}}><button type="button" className="av-nav-close" aria-label="Close" onClick={close}>×</button>
    {sel.kind==='shared'&&<><p className="eyebrow">Shared on every page</p><h2>Header & footer</h2><p>This part of the page is the same on every page, so it’s edited in one place.</p><Button onClick={()=>go('navigation')}><PanelsTopLeft/>Edit header & footer</Button></>}
    {sel.kind==='form'&&<><p className="eyebrow">Selected</p><h2>Form</h2><p>Fields, choices and where requests go are set in <b>Forms</b>.</p>{sel.keys.filter(k=>!isShared(byKey.get(k)?.group)).map(k=>fieldInput(k,`${friendly(byKey.get(k)!.label)}: “${byKey.get(k)!.value.slice(0,28)}”`))}<Button variant="outline" onClick={()=>go('site-forms')}>Open Forms</Button></>}
    {sel.kind==='element'&&<><p className="eyebrow">Selected</p><h2>{sel.title}</h2>
     {sel.attrs.filter(a=>a.attr==='src').map(a=>imageTools(a.key))}
     {sel.text.map(k=>fieldInput(k,sel.text.length>1?`Text: “${(byKey.get(k)?.value||'').slice(0,28)}”`:undefined))}
     {sel.attrs.map(a=>fieldInput(a.key))}
     {!sel.text.length&&!sel.attrs.length&&<p>Nothing to edit here.</p>}
     <Button variant="outline" onClick={close}>Done</Button></>}
   </aside>}
  </div>
  <SectionLibrary open={!!library} route={doc.route} busy={working} onClose={()=>setLibrary(null)} onPick={addFrom}/>
  <AlertDialog open={!!confirmation} onOpenChange={open=>{if(!open)setConfirmation(null)}}><AlertDialogContent className="av-editor-confirm"><AlertDialogHeader><AlertDialogMedia className={confirmation?.destructive?'danger':''}>{confirmation?.destructive?<Trash2/>:<RotateCcw/>}</AlertDialogMedia><AlertDialogTitle>{confirmation?.title}</AlertDialogTitle><AlertDialogDescription>{confirmation?.description}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction variant={confirmation?.destructive?'destructive':'default'} onClick={()=>{const action=confirmation?.run;setConfirmation(null);void action?.()}}>{confirmation?.action}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
 </div>;
}

// The hovered section's outline toolbar and “Add section” button, drawn over the scaled canvas.
function SectionTools({hover,order,scale,offset,working,move,toggleHidden,duplicate,remove,add}:{hover:Hover;order:string[];scale:number;offset:number;working:boolean;move:(id:string,by:number)=>void;toggleHidden:(id:string)=>void;duplicate:(id:string)=>void;remove:(id:string,label:string)=>void;add:(after:string)=>void}){
 const i=order.indexOf(hover.id);
 return <div className="av-section-frame" style={{top:hover.top*scale,left:offset+hover.left*scale,width:hover.width*scale,height:hover.height*scale}}>
  <div className="av-section-tools" role="toolbar" aria-label={`${hover.label} section`}><span>{hover.label}{hover.hidden&&<em>Hidden</em>}</span>
   <button type="button" title="Move this section up" aria-label="Move section up" disabled={working||i<=0} onClick={()=>move(hover.id,-1)}><ArrowUp size={15}/><small>Up</small></button>
   <button type="button" title="Move this section down" aria-label="Move section down" disabled={working||i<0||i>=order.length-1} onClick={()=>move(hover.id,1)}><ArrowDown size={15}/><small>Down</small></button>
   <button type="button" title="Duplicate" aria-label="Duplicate section" disabled={working||hover.h1} onClick={()=>duplicate(hover.id)}><Copy size={15}/></button>
   <button type="button" title={hover.hidden?'Show on the page':'Hide from the page'} aria-label={hover.hidden?'Show section':'Hide section'} disabled={working||hover.h1} onClick={()=>toggleHidden(hover.id)}>{hover.hidden?<Eye size={15}/>:<EyeOff size={15}/>}</button>
   <button type="button" title="Remove" aria-label="Remove section" disabled={working||hover.h1} onClick={()=>remove(hover.id,hover.label)}><Trash2 size={15}/></button>
  </div>
  <button type="button" className="av-section-add" disabled={working} onClick={()=>add(hover.id)}><Plus size={14}/>Add section</button>
 </div>;
}
