'use client';
import {useEffect,useMemo,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Inbox,Phone,Activity,Radio,FileText,PenLine,FilePen,Stethoscope,TriangleAlert,ArrowRight,ImagePlus,Link as LinkIcon,Search,CalendarClock,Plus,Tags,Folder,Hash,Pencil,Trash2,Mail,HeartPulse,DatabaseBackup,CircleCheck} from 'lucide-react';
import {request} from './content-tools';
import {describe,GENERIC} from './admin-views';

// AVAULT → Overview, Scheduled publishing, and Categories & tags.
type Notice=(s:string)=>void;
function ago(iso?:string|null){if(!iso)return 'never';const s=(Date.now()-new Date(iso).getTime())/1000;if(s<60)return 'just now';if(s<3600)return Math.floor(s/60)+' min ago';if(s<86400)return Math.floor(s/3600)+' h ago';return Math.floor(s/86400)+' d ago'}
const fullTime=(iso?:string|null)=>iso?new Date(iso).toLocaleString('en-US',{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'—';
const parse=(s:string)=>{try{return JSON.parse(s||'{}')}catch{return {}}};

// ── Overview ────────────────────────────────────────────────────────────────
// Each warning from the server points at the screen that fixes it.
const FIX:[RegExp,string,string][]=[[/email/i,'email','Open email settings'],[/scheduled jobs/i,'health','Open system health'],[/backup/i,'backups','Back up now'],[/notification/i,'leads','Open leads']];
export function OverviewPanel({go,email}:{go:(v:string)=>void;email:string}){
 const [d,setD]=useState<any>(null),[error,setError]=useState(''),[leads,setLeads]=useState<any[]>([]),[now]=useState(()=>Date.now());
 useEffect(()=>{request('overview').then(setD).catch(e=>setError(e.message));request('forms?status=new').then(r=>setLeads((r.rows||[]).slice(0,5))).catch(()=>{})},[]);
 if(error)return <p className="vault-card av-empty">{error}</p>;
 if(!d)return <p className="vault-card av-empty" role="status">Loading your overview…</p>;
 const h=new Date().getHours(),hello=h<12?'Good morning':h<18?'Good afternoon':'Good evening',name=email.split('@')[0].split(/[._-]/)[0];
 const summary=[d.newLeads?`${d.newLeads} new lead${d.newLeads===1?'':'s'} waiting`:'No new leads',`${d.visitorsToday} visit${d.visitorsToday===1?'':'s'} today`,d.callsToday?`${d.callsToday} call tap${d.callsToday===1?'':'s'} today`:''].filter(Boolean).join(' · ');
 const kpis:[string,number,string,typeof Inbox,string][]=[['New leads',d.newLeads,'leads',Inbox,'blue'],['Calls today',d.callsToday,'calls',Phone,'green'],['Visits today',d.visitorsToday,'visitors',Activity,'yellow'],['On the site now',d.liveNow,'visitors',Radio,'red']];
 const content:[string,number,string,typeof FileText][]=[['Pages',d.pages,'pages',FileText],['Blog posts',d.posts,'blogs',PenLine],['Drafts',d.drafts,'pages',FilePen],['Pages to fix',d.auditErrors,'seo',Stethoscope]];
 return <div className="av-overview">
  <div className="vault-card av-hello"><div><p className="eyebrow">{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</p><h2>{hello}{name?`, ${name[0].toUpperCase()+name.slice(1)}`:''}.</h2><p>{summary}.</p></div>{d.newLeads>0&&<Button onClick={()=>go('leads')}><Inbox/>Open {d.newLeads} new lead{d.newLeads===1?'':'s'}</Button>}</div>
  {d.warnings.length>0&&<section className="vault-card av-attention"><h3><TriangleAlert size={18}/>Needs attention</h3><ul>{d.warnings.map((w:string)=>{const fix=FIX.find(([rx])=>rx.test(w));return <li key={w}><span>{w}</span>{fix&&<button type="button" className="av-link" onClick={()=>go(fix[1])}>{fix[2]}<ArrowRight size={14}/></button>}</li>})}</ul></section>}
  <div className="av-stat-row av-stat-4">{kpis.map(([l,n,v,I,tone])=><button key={l} type="button" className={'vault-card av-kpi av-kpi-link '+tone} onClick={()=>go(v)}><I size={18}/><strong>{n.toLocaleString()}</strong><span>{l}</span></button>)}</div>
  <div className="av-ov-grid">
   <section className="vault-card av-ov-leads"><div className="av-ov-head"><h3><Inbox size={16}/>Latest new leads</h3><button type="button" className="av-link" onClick={()=>go('leads')}>All leads<ArrowRight size={14}/></button></div>
    {!leads.length?<p className="av-rule-empty">No new leads right now.</p>:<ul className="av-use-list">{leads.map(r=>{const f=parse(r.value);return <li key={r.id}><a href="/avault?view=leads"><span><strong>{f.name||'(no name)'}</strong><small>{f.service||f.request||'Estimate request'}{f.zip?` · ${f.zip}`:''}</small></span><small>{ago(r.created_at)}</small></a></li>})}</ul>}
   </section>
   <section className="vault-card av-ov-activity"><div className="av-ov-head"><h3><Activity size={16}/>Recent changes</h3><button type="button" className="av-link" onClick={()=>go('activity')}>Activity log<ArrowRight size={14}/></button></div>
    {!d.recentActivity.length?<p className="av-rule-empty">Changes will appear here.</p>:<ol className="av-mini-activity">{d.recentActivity.slice(0,6).map((r:any)=>{const [label,tone,I]=describe(r.action,r.entity);return <li key={r.id}><span className={'av-act-icon '+tone}><I size={14}/></span><span><strong>{label}</strong>{r.entity&&r.entity!==r.actor&&!GENERIC.has(r.entity)?<small>{r.entity}</small>:null}</span><time title={fullTime(r.created_at)}>{ago(r.created_at)}</time></li>})}</ol>}
   </section>
  </div>
  <div className="av-ov-grid">
   <section className="vault-card"><h3><FileText size={16}/>Website content</h3><div className="av-ov-tiles">{content.map(([l,n,v,I])=><button key={l} type="button" className={'av-ov-tile'+(l==='Pages to fix'&&n?' warn':'')} onClick={()=>go(v)}><I size={16}/><strong>{n}</strong><span>{l}</span></button>)}</div></section>
   <section className="vault-card"><h3><HeartPulse size={16}/>Health</h3><ul className="av-ov-health">
    <li><Mail size={15}/><span>Lead emails</span><b className={d.emailMode==='save-only'?'warn':'ok'}>{d.emailMode==='save-only'?'Off (saved only)':`On · ${d.emailMode==='smtp'?'SMTP':'Mailgun'}`}</b></li>
    <li><CalendarClock size={15}/><span>Scheduled jobs</span><b className={d.lastMaintenance&&now-Date.parse(d.lastMaintenance)<30*60000?'ok':'warn'}>{d.lastMaintenance?`Ran ${ago(d.lastMaintenance)}`:'Not run yet'}</b></li>
    <li><DatabaseBackup size={15}/><span>Last backup</span><b className={d.lastBackup?'ok':'warn'}>{d.lastBackup?ago(d.lastBackup):'None yet'}</b></li>
    <li><Inbox size={15}/><span>Failed lead emails</span><b className={d.failedDeliveries?'warn':'ok'}>{d.failedDeliveries||'None'}</b></li>
   </ul><button type="button" className="av-link" onClick={()=>go('health')}>System health<ArrowRight size={14}/></button></section>
  </div>
  <section className="vault-card"><h3>Quick actions</h3><div className="av-quick">{([['Edit a page','pages',FileText],['Write a blog post','blogs',PenLine],['Upload media','media',ImagePlus],['Check SEO','seo',Search],['Add a redirect','redirects',LinkIcon],['Schedule a post','schedules',CalendarClock]] as const).map(([l,v,I])=><button key={l} type="button" className="av-quick-item" onClick={()=>go(v)}><I size={18}/><span>{l}</span><ArrowRight size={14}/></button>)}</div></section>
 </div>;
}

// ── Scheduled publishing ────────────────────────────────────────────────────
const STATE:Record<string,[string,string]>={pending:['Waiting','av-pill-scheduled'],published:['Published','av-pill-live'],cancelled:['Cancelled','av-pill-draft'],conflict:['Skipped: page changed','av-pill-warn']};
function countdown(iso:string){const s=(Date.parse(iso)-Date.now())/1000;if(s<=0)return 'due now';if(s<3600)return `in ${Math.ceil(s/60)} min`;if(s<86400)return `in ${Math.round(s/3600)} h`;return `in ${Math.round(s/86400)} days`}
export function SchedulesPanel({docs,notice,open,reloadDocs}:{docs:any[];notice:Notice;open:(route:string)=>void;reloadDocs:()=>void}){
 const [rows,setRows]=useState<any[]|null>(null),[busy,setBusy]=useState(false),[adding,setAdding]=useState(false),[route,setRoute]=useState(''),[when,setWhen]=useState(''),[minLocal]=useState(()=>new Date(Date.now()+5*60000-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16));
 const load=()=>request('schedules?page=0').then(setRows).catch(e=>notice(e.message));
 useEffect(()=>{load()},[]);// eslint-disable-line react-hooks/exhaustive-deps
 async function act(fn:()=>Promise<unknown>,msg:string){setBusy(true);try{await fn();notice(msg);await load();reloadDocs()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 const label=(r:string)=>docs.find(d=>d.route===r)?.label||r;
 const upcoming=(rows||[]).filter(r=>r.state==='pending').sort((a,b)=>a.due.localeCompare(b.due)),past=(rows||[]).filter(r=>r.state!=='pending').sort((a,b)=>b.due.localeCompare(a.due));
 const candidates=docs.filter(d=>(d.status==='draft'||d.unpublishedChanges)&&!upcoming.some(u=>u.route===d.route));
 return <div className="av-schedules">
  <div className="vault-card av-traffic-hero on"><span className="av-backup-icon"><CalendarClock size={26}/></span><div><h2>{upcoming.length?`${upcoming.length} page${upcoming.length===1?'':'s'} waiting to publish`:'Nothing scheduled'}</h2><p>Pick a saved draft and a time. It goes live on its own within 10 minutes of that time, and is skipped if someone edits the page after scheduling, so nothing unreviewed is published.</p></div>{!adding&&<Button onClick={()=>{setAdding(true);setRoute(candidates[0]?.route||'');setWhen('')}}><Plus/>Schedule a page</Button>}</div>
  {adding&&<form className="vault-card av-redirect-form" onSubmit={e=>{e.preventDefault();const d=docs.find(x=>x.route===route);if(!d||!when)return;act(()=>request('schedule',{route,revision:d.revision,due:new Date(when).toISOString()}),`${d.label} will publish ${fullTime(new Date(when).toISOString())}.`).then(()=>setAdding(false))}}>
   <h2>Schedule a page</h2>
   {!candidates.length?<p className="muted">Every page is already live with no unpublished changes. Save a draft in the page editor first, then come back.</p>:<div className="av-route-pair" style={{gridTemplateColumns:'minmax(0,1.4fr) auto minmax(0,1fr)'}}><label>Page or post <small>drafts and pages with unpublished edits</small><select className="av-select" value={route} onChange={e=>setRoute(e.target.value)}>{candidates.map(d=><option key={d.route} value={d.route}>{d.label} ({d.route}){d.status==='draft'?' · draft':' · edits not live'}</option>)}</select></label><ArrowRight className="av-route-arrow" aria-hidden="true"/><label>Publish on<Input type="datetime-local" min={minLocal} value={when} onChange={e=>setWhen(e.target.value)} required/></label></div>}
   {when&&route&&<p className="av-sentence"><strong>{label(route)}</strong> will go live {fullTime(new Date(when).toISOString())} (your local time), exactly as it’s saved now.</p>}
   <div className="av-form-actions"><Button type="button" variant="outline" onClick={()=>setAdding(false)}>Cancel</Button><Button disabled={busy||!candidates.length||!when}>Schedule</Button></div>
  </form>}
  <section className="vault-card av-table-card"><div className="av-table-tools"><h2 className="av-table-title">Coming up</h2></div>
   {!rows&&<p className="av-empty" role="status">Loading…</p>}
   {rows&&!upcoming.length&&<p className="av-empty">Nothing waiting. Schedule a page above, or from the Publishing tab in any page editor.</p>}
   {upcoming.length>0&&<div className="av-table av-sched-table" role="table">{upcoming.map(r=><div key={r.route} className="av-tr" role="row"><span role="cell" className="av-cell-title"><button type="button" onClick={()=>open(r.route)}>{label(r.route)}</button><small>{r.route}{r.actor?` · scheduled by ${r.actor}`:''}</small></span><span role="cell" className="av-cell-title"><strong>{fullTime(r.due)}</strong><small>{countdown(r.due)}</small></span><span role="cell"><span className="av-pill av-pill-scheduled">Waiting</span></span><span role="cell" className="av-actions-cell"><Button variant="outline" size="sm" onClick={()=>open(r.route)}><Pencil/>Review</Button><Button variant="ghost" size="sm" disabled={busy} onClick={()=>{if(confirm(`Cancel the scheduled publish of ${label(r.route)}?`))act(()=>request('schedule-cancel',{route:r.route}),'Schedule cancelled. The draft is kept.')}}>Cancel</Button></span></div>)}</div>}
  </section>
  {past.length>0&&<section className="vault-card av-table-card"><div className="av-table-tools"><h2 className="av-table-title">History</h2></div><div className="av-table av-sched-table" role="table">{past.slice(0,30).map(r=>{const [l,c]=STATE[r.state]||[r.state,'av-pill-draft'];return <div key={r.route+r.due} className="av-tr" role="row"><span role="cell" className="av-cell-title"><button type="button" onClick={()=>open(r.route)}>{label(r.route)}</button><small>{r.route}</small></span><span role="cell" className="av-muted-cell">{fullTime(r.due)}</span><span role="cell"><span className={'av-pill '+c}>{l}</span></span><span role="cell"/></div>})}</div></section>}
 </div>;
}

// ── Categories & tags ───────────────────────────────────────────────────────
const slugify=(s:string)=>s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60);
export function TaxonomyPanel({docs,notice,open}:{docs:any[];notice:Notice;open:(route:string)=>void}){
 const [rows,setRows]=useState<any[]|null>(null),[busy,setBusy]=useState(false),[form,setForm]=useState<{id?:string;type:string;label:string;slug:string;auto:boolean}|null>(null),[showUses,setShowUses]=useState<string|null>(null),[q,setQ]=useState('');
 const load=()=>request('taxonomy?page=0').then(setRows).catch(e=>notice(e.message));
 useEffect(()=>{load()},[]);// eslint-disable-line react-hooks/exhaustive-deps
 const uses=useMemo(()=>{const m=new Map<string,any[]>();for(const d of docs){if(d.category)m.set(d.category,[...(m.get(d.category)||[]),d]);for(const t of d.tags||[])m.set(t,[...(m.get(t)||[]),d])}return m},[docs]);
 async function save(){if(!form)return;setBusy(true);try{await request('taxonomy',{id:form.id,type:form.type,label:form.label.trim(),slug:form.slug});notice(form.id?'Saved.':`${form.type==='category'?'Category':'Tag'} “${form.label}” added.`);setForm(null);await load()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 async function remove(r:any){if(!confirm(`Delete “${r.label}”?`))return;setBusy(true);try{await request('taxonomy-delete',{id:r.id});notice('Deleted.');await load()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 const group=(type:string)=>(rows||[]).filter(r=>r.type===type&&(r.label+' '+r.slug).toLowerCase().includes(q.toLowerCase()));
 const column=(type:string,title:string,icon:React.ReactNode,hint:string)=>{const list=group(type);return <section className="vault-card av-tax-col"><div className="av-ov-head"><h3>{icon}{title}<span className="av-count">{(rows||[]).filter(r=>r.type===type).length}</span></h3><Button variant="outline" size="sm" onClick={()=>setForm({type,label:'',slug:'',auto:true})}><Plus/>Add</Button></div><p className="muted">{hint}</p>
  {!rows?<p className="av-rule-empty">Loading…</p>:!list.length?<p className="av-rule-empty">{q?'Nothing matches.':`No ${title.toLowerCase()} yet.`}</p>:<ul className="av-tax-list">{list.map(r=>{const used=uses.get(r.id)||[];return <li key={r.id}><div className="av-tax-row"><span className="av-cell-title"><strong>{r.label}</strong><small>/{r.slug}/</small></span><button type="button" className="av-tax-uses" disabled={!used.length} onClick={()=>setShowUses(showUses===r.id?null:r.id)}>{used.length?`${used.length} post${used.length===1?'':'s'}`:'Unused'}</button><span className="av-actions-cell"><button type="button" className="av-icon-btn" aria-label={'Rename '+r.label} onClick={()=>setForm({id:r.id,type:r.type,label:r.label,slug:r.slug,auto:false})}><Pencil size={15}/></button><button type="button" className="av-icon-btn" aria-label={'Delete '+r.label} disabled={busy||used.length>0} title={used.length?'Remove it from every post first':'Delete'} onClick={()=>remove(r)}><Trash2 size={15}/></button></span></div>{showUses===r.id&&<ul className="av-tax-posts">{used.map(d=><li key={d.route}><button type="button" onClick={()=>open(d.route)}>{d.label}</button></li>)}</ul>}</li>})}</ul>}
 </section>};
 return <div className="av-taxonomy">
  <div className="vault-card av-traffic-hero on"><span className="av-backup-icon"><Tags size={26}/></span><div><h2>Organise your blog</h2><p>A <strong>category</strong> is the main topic a post belongs to (one per post). <strong>Tags</strong> are extra keywords (any number). Set them for each post in its editor, under Publishing.</p></div><label className="av-find" style={{marginLeft:'auto'}}><Search size={16} aria-hidden="true"/><Input aria-label="Search categories and tags" placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)}/></label></div>
  {form&&<form className="vault-card av-redirect-form" onSubmit={e=>{e.preventDefault();save()}}><h2>{form.id?'Edit':'New'} {form.type==='category'?'category':'tag'}</h2>
   <div className="av-grid-2"><label>Name<Input autoFocus required value={form.label} onChange={e=>setForm({...form,label:e.target.value,slug:form.auto?slugify(e.target.value):form.slug})} placeholder={form.type==='category'?'Local SEO':'google-maps'}/></label><label>Web address <small>lowercase, hyphens only</small><Input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={e=>setForm({...form,slug:slugify(e.target.value),auto:false})}/></label></div>
   {!form.id&&<fieldset className="av-choice"><legend>Type</legend>{([['category','Category','The main topic. Each post has one.'],['tag','Tag','A keyword. Posts can have many.']] as const).map(([v,t,d])=><label key={v} className={form.type===v?'selected':''}><input type="radio" checked={form.type===v} onChange={()=>setForm({...form,type:v})}/><strong>{t}</strong><small>{d}</small></label>)}</fieldset>}
   <div className="av-form-actions"><Button type="button" variant="outline" onClick={()=>setForm(null)}>Cancel</Button><Button disabled={busy||!form.label.trim()||!form.slug}>{form.id?'Save':'Add'}</Button></div>
  </form>}
  <div className="av-tax-grid">{column('category','Categories',<Folder size={16}/>,'Shown on posts and used to group them on the blog.')}{column('tag','Tags',<Hash size={16}/>,'Help related posts find each other.')}</div>
  {rows&&rows.length>0&&<p className="av-attrib"><CircleCheck size={13}/> Categories and tags that are still in use can’t be deleted. Remove them from those posts first.</p>}
 </div>;
}
