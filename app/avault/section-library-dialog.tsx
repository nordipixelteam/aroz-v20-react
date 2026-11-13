'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Search,Plus,LayoutPanelTop} from 'lucide-react';
import {request} from './content-tools';

// The “Add section” library: every section already designed on the site, deduplicated, with a live preview.
// Sections from pages with a different page design (e.g. a case study into a service page) are listed
// separately, since the page's styles may not fit them.
type Item={key:string;route:string;section:string;type:string;title:string;page:string;pages:number;context:string;fields:number};
const PREVIEW_CSS=`.site-loader,#site-loader,#page-curtain{display:none!important}
html{background:#fff!important}.is-loading body{overflow:auto!important}.is-loading #app,#app[inert]{opacity:1!important;visibility:visible!important;pointer-events:auto!important}
.reveal,[class*="reveal"]{opacity:1!important;transform:none!important;visibility:visible!important}
html,body{overflow:hidden!important}`;
const PREVIEW_WIDTH=1440;

export function SectionLibrary({open,route,onClose,onPick,busy}:{open:boolean;route:string;onClose:()=>void;onPick:(item:Item)=>void;busy:boolean}){
 const [data,setData]=useState<{context:string;items:Item[]}|null>(null),[error,setError]=useState(''),[query,setQuery]=useState(''),[others,setOthers]=useState(false),[pick,setPick]=useState<Item|null>(null),[html,setHtml]=useState(''),[height,setHeight]=useState(600),[width,setWidth]=useState(600);
 const frame=useRef<HTMLIFrameElement>(null),observer=useRef<ResizeObserver|null>(null);
 // The preview stage mounts and unmounts with the dialog, so it is measured whenever a new one appears.
 const stage=useCallback((el:HTMLDivElement|null)=>{observer.current?.disconnect();observer.current=null;if(!el)return;const fit=()=>{if(el.clientWidth)setWidth(el.clientWidth)};fit();observer.current=new ResizeObserver(fit);observer.current.observe(el)},[]);
 useEffect(()=>{if(!open||data)return;request('section-library?route='+encodeURIComponent(route)).then(setData).catch(e=>setError((e as Error).message))},[open,data,route]);
 useEffect(()=>{if(!pick){setHtml('');return}let live=true;setHtml('');request('section-preview',{route:pick.route,section:pick.section}).then((r:any)=>{if(live)setHtml(r.html.replace('</head>',()=>`<style>${PREVIEW_CSS}</style></head>`))}).catch(e=>{if(live)setError((e as Error).message)});return()=>{live=false}},[pick]);
 const shown=useMemo(()=>{if(!data)return [];const q=query.trim().toLowerCase();return data.items.filter(i=>(others||i.context===data.context)&&(!q||(i.type+' '+i.title+' '+i.page).toLowerCase().includes(q)))},[data,query,others]);
 const groups=useMemo(()=>{const m=new Map<string,Item[]>();for(const i of shown)m.set(i.type,[...(m.get(i.type)||[]),i]);return [...m]},[shown]);
 const otherCount=data?data.items.filter(i=>i.context!==data.context).length:0;
 const scale=Math.min(1,width/PREVIEW_WIDTH);
 // Only the chosen section shows: everything beside it or beside its wrappers (header, footer, other content) is hidden.
 function loaded(){const d=frame.current?.contentDocument;if(!d)return;let el:Element|null=d.querySelector('[data-av-section]');while(el&&el.parentElement&&el.tagName!=='BODY'){for(const c of el.parentElement.children)if(c!==el)(c as HTMLElement).style.display='none';el=el.parentElement}const measure=()=>setHeight(Math.max(200,d.documentElement.scrollHeight));new ResizeObserver(measure).observe(d.body);measure()}

 return <Dialog open={open} onOpenChange={v=>{if(!v)onClose()}}>
  <DialogContent className="av-library sm:max-w-[1180px]">
   <div className="av-library-head"><span className="av-library-mark" aria-hidden="true"><LayoutPanelTop/></span><div><DialogTitle>Add a section</DialogTitle><DialogDescription>Choose a proven section from your website. Its design and starter copy are copied into this page for you to edit.</DialogDescription></div><span className="av-library-total">{data?shown.length:'—'} available</span></div>
   <div className="av-library-body">
    <div className="av-library-list">
     <label className="av-search"><Search size={16}/><Input placeholder="Find a section…" value={query} onChange={e=>setQuery(e.target.value)} aria-label="Find a section"/></label>
     {otherCount>0&&<label className="inline av-library-others"><input type="checkbox" checked={others} onChange={e=>setOthers(e.target.checked)}/>Include {otherCount} sections from other page designs</label>}
     {error&&<p role="alert">{error}</p>}
     {!data&&!error&&<p role="status">Loading sections…</p>}
     {data&&!shown.length&&<p className="av-library-no-results">No sections match “{query}”. Try another search or include other page designs.</p>}
     {groups.map(([type,items])=><div key={type} className="av-library-group"><h3><span>{type}</span><small>{items.length}</small></h3>{items.map(i=><button type="button" key={i.key} className={pick?.key===i.key?'selected':''} onClick={()=>setPick(i)}><strong>{i.title}</strong><span><small>{i.page}</small>{i.pages>1&&<small>Used on {i.pages} pages</small>}{i.context!==data?.context&&<small>Different page design</small>}</span></button>)}</div>)}
    </div>
    <div className="av-library-preview">
     {!pick&&<div className="av-library-empty"><LayoutPanelTop aria-hidden="true"/><strong>Preview a section</strong><p>Select any section on the left to see its real website design here before adding it.</p></div>}
     {pick&&<><div className="av-library-bar"><span><strong>{pick.type}</strong><small>From {pick.page}</small></span><Button disabled={busy} onClick={()=>onPick(pick)}><Plus/>{busy?'Adding…':'Add this section'}</Button></div>
      <div className="av-library-stage" ref={stage}>{html?<div style={{height:height*scale,position:'relative'}}><iframe ref={frame} title="Section preview" srcDoc={html} onLoad={loaded} sandbox="allow-same-origin" style={{width:PREVIEW_WIDTH,height,transform:`scale(${scale})`,transformOrigin:'0 0',position:'absolute',left:0,top:0,border:0,pointerEvents:'none'}}/></div>:<p role="status" style={{padding:24}}>Loading preview…</p>}</div></>}
    </div>
   </div>
  </DialogContent>
 </Dialog>;
}
export type LibraryItem=Item;
