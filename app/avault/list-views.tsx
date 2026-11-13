'use client';
import {useEffect,useMemo,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {ArrowUpRight,ChevronRight,Search,ArrowRight,Pencil,Trash2,Plus,ShieldCheck,FileCode2,Stethoscope,CircleAlert,TriangleAlert,CircleCheck,Home} from 'lucide-react';
import {request} from './content-tools';
import {OperationsPanel} from './operations-panel';

// Table-style lists for AVAULT: pages and blogs, the SEO health check, and redirects.
type Notice=(s:string)=>void;
const KIND:Record<string,string>={page:'Page',service:'Service',post:'Blog post','case-study':'Case study'};
function ago(iso?:string){if(!iso)return '—';const d=new Date(iso),s=(Date.now()-d.getTime())/1000;if(isNaN(s))return '—';if(s<60)return 'Just now';if(s<3600)return Math.floor(s/60)+' min ago';if(s<86400)return Math.floor(s/3600)+' h ago';if(s<86400*7)return Math.floor(s/86400)+' d ago';return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:d.getFullYear()===new Date().getFullYear()?undefined:'numeric'})}
const Seg=({value,set,items}:{value:string;set:(v:string)=>void;items:[string,string,number?][]})=><div className="av-seg av-seg-wrap" role="tablist">{items.map(([k,l,n])=><button key={k} type="button" role="tab" aria-selected={value===k} className={value===k?'selected':''} onClick={()=>set(k)}>{l}{n!==undefined&&<span className="av-count">{n}</span>}</button>)}</div>;
const Find=({value,set,placeholder}:{value:string;set:(v:string)=>void;placeholder:string})=><label className="av-find"><Search size={16} aria-hidden="true"/><Input aria-label={placeholder} placeholder={placeholder} value={value} onChange={e=>set(e.target.value)}/></label>;

// ── Pages & blogs ───────────────────────────────────────────────────────────
export function DocTable({docs,posts,open,loading}:{docs:any[];posts:boolean;open:(route:string)=>void;loading?:boolean}){
 const [filter,setFilter]=useState('all'),[q,setQ]=useState(''),[sort,setSort]=useState('updated');
 const all=docs.filter(d=>posts?d.kind==='post':d.kind!=='post');
 const match=(d:any,f:string)=>f==='all'||(f==='live'?d.status==='published':f==='draft'?d.status==='draft':f==='scheduled'?d.status==='scheduled':d.unpublishedChanges);
 const rows=all.filter(d=>match(d,filter)&&(d.label+' '+d.route+' '+(d.author||'')).toLowerCase().includes(q.toLowerCase()))
  .sort((a,b)=>sort==='title'?a.label.localeCompare(b.label):sort==='url'?a.route.localeCompare(b.route):String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
 const count=(f:string)=>all.filter(d=>match(d,f)).length;
 const filters:[string,string,number][]=[['all','All',all.length],['live','Live',count('live')],['draft','Drafts',count('draft')],...(count('scheduled')?[['scheduled','Scheduled',count('scheduled')] as [string,string,number]]:[]),['edits','Edits not live',count('edits')]];
 return <div className="vault-card av-table-card">
  <div className="av-table-tools"><Seg value={filter} set={setFilter} items={filters}/><Find value={q} set={setQ} placeholder={posts?'Search posts…':'Search pages…'}/><label className="av-sort">Sort<select value={sort} onChange={e=>setSort(e.target.value)}><option value="updated">Recently updated</option><option value="title">Title A–Z</option><option value="url">URL</option></select></label></div>
  <div className={'av-table '+(posts?'av-docs-posts':'av-docs')} role="table" aria-label={posts?'Blog posts':'Pages'}>
   <div className="av-tr av-th" role="row"><span role="columnheader">{posts?'Post':'Page'}</span><span role="columnheader">{posts?'Author':'Type'}</span><span role="columnheader">Status</span><span role="columnheader">Search</span><span role="columnheader">Updated</span><span role="columnheader"><span className="sr-only">Actions</span></span></div>
   {rows.map(d=><div className={'av-tr av-row-link'+(d.route==='/'?' av-home-row':'')} role="row" key={d.route} onClick={()=>open(d.route)}>
    <span role="cell" className="av-cell-title"><button type="button" onClick={e=>{e.stopPropagation();open(d.route)}}>{d.label}</button><small>{d.route}{d.route==='/'&&<span className="av-home-label"><Home size={11}/>Homepage</span>}</small></span>
    <span role="cell" className="av-muted-cell">{posts?d.author||'—':KIND[d.kind]||d.kind}</span>
    <span role="cell" className="av-status-cell"><span className={'av-pill av-pill-'+(d.status==='published'?'live':d.status)}>{d.status==='published'?'Live':d.status==='scheduled'?'Scheduled':'Draft'}</span>{d.status==='scheduled'&&d.scheduledFor&&<small>{new Date(d.scheduledFor).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</small>}{d.unpublishedChanges&&<small className="av-edits">Edits not live</small>}</span>
    <span role="cell"><span className={'av-dot-label '+(d.noindex?'off':'on')}>{d.noindex?'Hidden':'Indexed'}</span></span>
    <span role="cell" className="av-muted-cell" title={d.updatedAt?new Date(d.updatedAt).toLocaleString():''}>{ago(d.updatedAt)}</span>
    <span role="cell" className="av-actions-cell">{d.status==='published'&&<a href={d.route} target="_blank" rel="noreferrer" aria-label={'View '+d.label+' on the website'} title="View on the website" onClick={e=>e.stopPropagation()}><ArrowUpRight size={17}/></a>}<ChevronRight size={18} aria-hidden="true"/></span>
   </div>)}
   {!rows.length&&<p className="av-empty" role="status">{loading&&!all.length?'Loading…':all.length?'Nothing matches this filter.':posts?'No blog posts yet.':'No pages yet.'}</p>}
  </div>
  <p className="av-table-foot">Showing {rows.length} of {all.length}</p>
 </div>;
}

// ── SEO & discovery ─────────────────────────────────────────────────────────
export function SeoPanel({role,notice,docs,open}:{role:string;notice:Notice;docs:any[];open:(route:string)=>void}){
 const [tab,setTab]=useState('health'),[rows,setRows]=useState<any[]|null>(null),[filter,setFilter]=useState('errors'),[q,setQ]=useState('');
 useEffect(()=>{request('audit').then(r=>{setRows(r);if(!r.some((x:any)=>x.errors.length))setFilter(r.some((x:any)=>x.warnings.length)?'warnings':'all')}).catch(e=>notice(e.message))},[]);// eslint-disable-line react-hooks/exhaustive-deps
 const stats=useMemo(()=>{const r=rows||[];return {total:r.length,errors:r.filter(x=>x.errors.length).length,warnings:r.filter(x=>!x.errors.length&&x.warnings.length).length,passed:r.filter(x=>!x.errors.length&&!x.warnings.length).length}},[rows]);
 const match=(x:any)=>filter==='all'||(filter==='errors'?x.errors.length:filter==='warnings'?!x.errors.length&&x.warnings.length:!x.errors.length&&!x.warnings.length);
 const shown=(rows||[]).filter(x=>match(x)&&((x.label||'')+' '+x.route).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>b.errors.length-a.errors.length||b.warnings.length-a.warnings.length||a.route.localeCompare(b.route));
 const steps:[string,string,string,typeof Stethoscope][]=[['health','Fix page issues','Each page is checked for titles, descriptions, headings, images and links.',Stethoscope],['verification','Connect search engines','Prove you own the site to Google Search Console and Bing.',ShieldCheck],['files','Check discovery files','Sitemaps, robots.txt and llms.txt tell crawlers what to read.',FileCode2]];
 return <div className="av-seo">
  <div className="av-steps" role="tablist" aria-label="SEO tasks">{steps.map(([k,t,d,I],i)=><button key={k} type="button" role="tab" aria-selected={tab===k} className={'vault-card av-step'+(tab===k?' selected':'')} onClick={()=>setTab(k)}><span className="av-step-num">{i+1}</span><I size={20} aria-hidden="true"/><strong>{t}</strong><small>{d}</small></button>)}</div>
  {tab==='health'&&<>
   <div className="av-stats">{([['errors','Need attention',stats.errors,CircleAlert],['warnings','Suggestions',stats.warnings,TriangleAlert],['passed','Passed',stats.passed,CircleCheck]] as const).map(([k,l,n,I])=><button key={k} type="button" className={'vault-card av-stat av-stat-'+k+(filter===k?' selected':'')} onClick={()=>setFilter(k)}><I size={20} aria-hidden="true"/><strong>{rows?n:'–'}</strong><span>{l}</span></button>)}<button type="button" className={'vault-card av-stat'+(filter==='all'?' selected':'')} onClick={()=>setFilter('all')}><Stethoscope size={20} aria-hidden="true"/><strong>{rows?stats.total:'–'}</strong><span>Pages checked</span></button></div>
   <div className="vault-card av-table-card">
    <div className="av-table-tools"><p className="av-legend"><span className="av-legend-err">Needs attention</span> blocks a page from being found or shared well. <span className="av-legend-warn">Suggestion</span> is worth improving.</p><Find value={q} set={setQ} placeholder="Search pages…"/></div>
    {!rows&&<p className="av-empty" role="status">Checking every page…</p>}
    {rows&&<div className="av-table av-seo-table" role="table" aria-label="Page health">
     <div className="av-tr av-th" role="row"><span role="columnheader">Page</span><span role="columnheader">What to fix</span><span role="columnheader">Links in</span><span role="columnheader"><span className="sr-only">Actions</span></span></div>
     {shown.map(x=><div className="av-tr" role="row" key={x.route}>
      <span role="cell" className="av-cell-title"><button type="button" onClick={()=>open(x.route)}>{x.label||x.route}</button><small>{x.route}{x.kind?' · '+(KIND[x.kind]||x.kind):''}</small></span>
      <span role="cell">{!x.errors.length&&!x.warnings.length?<span className="av-pill av-pill-live">All checks passed</span>:<ul className="av-issues">{x.errors.map((e:string)=><li key={e} className="err">{e}</li>)}{x.warnings.map((e:string)=><li key={e} className="warn">{e}</li>)}</ul>}</span>
      <span role="cell" className="av-muted-cell" title="Other pages on the site that link here">{x.incoming}</span>
      <span role="cell" className="av-actions-cell"><Button asChild variant="ghost" size="icon-sm"><a href={x.route} target="_blank" rel="noreferrer" aria-label={'View '+(x.label||x.route)+' on the live website'} title="View live page"><ArrowUpRight/></a></Button><Button variant="outline" size="sm" onClick={()=>open(x.route)}>{x.errors.length||x.warnings.length?'Fix':'Open'}</Button></span>
     </div>)}
     {!shown.length&&<p className="av-empty">{filter==='errors'?'No page needs attention. Nice work.':'Nothing matches.'}</p>}
    </div>}
   </div>
  </>}
  {tab==='verification'&&<OperationsPanel only="verification" role={role} notice={notice} docs={docs}/>}
  {tab==='files'&&<><div className="vault-card"><h2>Your discovery files</h2><p className="muted">Generated automatically from your published pages. Open one to see exactly what search engines and AI crawlers read.</p><div className="av-filelinks">{([['sitemap.xml','Sitemap index'],['sm-pages.xml','Pages sitemap'],['sm-posts.xml','Blog sitemap'],['sm-images.xml','Image sitemap'],['robots.txt','Crawler rules'],['llms.txt','AI summary']] as const).map(([f,l])=><a key={f} href={'/'+f} target="_blank" rel="noreferrer"><strong>{l}</strong><small>/{f}</small><ArrowUpRight size={15}/></a>)}</div></div><OperationsPanel only="files" role={role} notice={notice} docs={docs}/></>}
 </div>;
}

// ── Redirects ───────────────────────────────────────────────────────────────
const blank={source:'',destination:'',status:308,enabled:true,note:'',originalSource:''};
export function RedirectsPanel({docs,notice}:{docs:any[];notice:Notice}){
 const [rows,setRows]=useState<any[]|null>(null),[form,setForm]=useState<any>(null),[q,setQ]=useState(''),[filter,setFilter]=useState('all'),[busy,setBusy]=useState(false);
 const load=()=>request('redirects').then(setRows);useEffect(()=>{load().catch(e=>notice(e.message))},[]);// eslint-disable-line react-hooks/exhaustive-deps
 async function act(fn:()=>Promise<unknown>){setBusy(true);try{await fn()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 const list=rows||[];const match=(r:any)=>filter==='all'||(filter==='off'?r.enabled===false:filter==='unused'?!r.hits:r.enabled!==false);
 const shown=list.filter(r=>match(r)&&(r.source+' '+r.destination+' '+(r.note||'')).toLowerCase().includes(q.toLowerCase()));
 const hits=list.reduce((n,r)=>n+(r.hits||0),0);
 const save=()=>act(async()=>{const r=await request('redirect-save',form);notice(form.originalSource?'Redirect updated.':'Redirect added.'+(r.flattened?` ${r.flattened} older redirect(s) now point straight to the new destination.`:''));setForm(null);await load()});
 const toggle=(r:any)=>act(async()=>{await request('redirect-save',{source:r.source,destination:r.destination,status:r.status===307?307:308,enabled:r.enabled===false,note:r.note||'',originalSource:r.source});notice(r.enabled===false?'Redirect turned on.':'Redirect turned off.');await load()});
 return <div className="av-redirects">
  <div className="vault-card av-intro"><div><h2>Send an old link to a new page</h2><p>When a page moves or is removed, a redirect sends visitors and search engines from the old URL to the right place, so links and rankings aren’t lost. Renaming a page in AVAULT adds one for you.</p></div>{!form&&<Button onClick={()=>setForm({...blank})}><Plus/>Add a redirect</Button>}</div>
  {form&&<form className="vault-card av-redirect-form" onSubmit={e=>{e.preventDefault();save()}}>
   <h2>{form.originalSource?'Edit redirect':'New redirect'}</h2>
   <div className="av-route-pair"><label>Old URL <small>the path people or search engines still visit</small><Input value={form.source} onChange={e=>setForm({...form,source:e.target.value})} placeholder="/previous-page/" required autoFocus/></label><ArrowRight className="av-route-arrow" aria-hidden="true"/><label>Send them to <small>a published page, or a full https:// address</small><Input list="redirect-destinations" value={form.destination} onChange={e=>setForm({...form,destination:e.target.value})} placeholder="/local-seo/" required/></label></div>
   <datalist id="redirect-destinations">{docs.filter(d=>d.status==='published').map(d=><option key={d.route} value={d.route}>{d.label}</option>)}</datalist>
   <fieldset className="av-choice"><legend>Is this move permanent?</legend>{([[308,'Yes, permanent','The page has moved for good. Search engines move its ranking to the new page. Use this in almost every case.'],[307,'No, temporary','The old page is coming back soon, for example during a short promotion.']] as const).map(([v,t,d])=><label key={v} className={form.status===v?'selected':''}><input type="radio" name="status" checked={form.status===v} onChange={()=>setForm({...form,status:v})}/><strong>{t}</strong><small>{d}</small></label>)}</fieldset>
   <div className="av-redirect-extra"><label>Note <small>optional, only you see it</small><Input value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Why this redirect exists"/></label><label className="inline"><input type="checkbox" checked={form.enabled} onChange={e=>setForm({...form,enabled:e.target.checked})}/>Turned on</label></div>
   {form.source&&form.destination&&<p className="av-sentence">Anyone who opens <code>{form.source}</code> will land on <code>{form.destination}</code>{form.enabled?'':' (once you turn it on)'}.</p>}
   <div className="av-form-actions"><Button type="button" variant="outline" onClick={()=>setForm(null)}>Cancel</Button><Button disabled={busy}>{form.originalSource?'Save changes':'Add redirect'}</Button></div>
  </form>}
  <div className="vault-card av-table-card">
   <div className="av-table-tools"><Seg value={filter} set={setFilter} items={[['all','All',list.length],['on','On',list.filter(r=>r.enabled!==false).length],['off','Off',list.filter(r=>r.enabled===false).length],['unused','Never used',list.filter(r=>!r.hits).length]]}/><Find value={q} set={setQ} placeholder="Search redirects…"/><span className="av-table-meta">{hits.toLocaleString()} visit{hits===1?'':'s'} redirected in total</span></div>
   {!rows&&<p className="av-empty" role="status">Loading redirects…</p>}
   {rows&&<div className="av-table av-redirect-table" role="table" aria-label="Redirects">
    <div className="av-tr av-th" role="row"><span role="columnheader">From</span><span role="columnheader"><span className="sr-only">to</span></span><span role="columnheader">To</span><span role="columnheader">Type</span><span role="columnheader">Used</span><span role="columnheader">Status</span><span role="columnheader"><span className="sr-only">Actions</span></span></div>
    {shown.map(r=><div className={'av-tr'+(r.enabled===false?' av-row-off':'')} role="row" key={r.source}>
     <span role="cell" className="av-cell-title"><code>{r.source}</code>{r.note&&<small>{r.note}</small>}</span>
     <span role="cell" className="av-arrow-cell" aria-hidden="true"><ArrowRight size={16}/></span>
     <span role="cell" className="av-cell-title"><code>{r.destination}</code>{docs.find(d=>d.route===r.destination)&&<small>{docs.find(d=>d.route===r.destination).label}</small>}</span>
     <span role="cell" className="av-muted-cell">{r.status===307?'Temporary':'Permanent'}</span>
     <span role="cell" className="av-muted-cell" title={r.last_hit_at?'Last used '+new Date(r.last_hit_at).toLocaleString():'Not used yet'}>{(r.hits||0).toLocaleString()}<small>{r.last_hit_at?ago(r.last_hit_at):'never'}</small></span>
     <span role="cell"><button type="button" role="switch" aria-checked={r.enabled!==false} className={'av-switch'+(r.enabled!==false?' on':'')} disabled={busy} onClick={()=>toggle(r)}><span/>{r.enabled!==false?'On':'Off'}</button></span>
     <span role="cell" className="av-actions-cell"><Button variant="ghost" size="icon" aria-label={'Edit redirect from '+r.source} onClick={()=>{setForm({source:r.source,destination:r.destination,status:r.status===307?307:308,enabled:r.enabled!==false,note:r.note||'',originalSource:r.source});scrollTo({top:0,behavior:'smooth'})}}><Pencil/></Button><Button variant="ghost" size="icon" aria-label={'Delete redirect from '+r.source} disabled={busy} onClick={()=>act(async()=>{if(!confirm('Delete the redirect from '+r.source+'? Visitors to that old URL will see "page not found".'))return;await request('redirect-delete',{source:r.source});notice('Redirect deleted.');await load()})}><Trash2/></Button></span>
    </div>)}
    {!shown.length&&<p className="av-empty">{list.length?'Nothing matches.':'No redirects yet.'}</p>}
   </div>}
  </div>
 </div>;
}
