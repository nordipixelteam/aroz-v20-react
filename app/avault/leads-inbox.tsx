'use client';
import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Search,Mail,Archive,ShieldAlert,ShieldCheck,Trash2,RotateCcw,Download,X,ExternalLink,MailCheck,MailX,Clock,Inbox} from 'lucide-react';
import {request} from './content-tools';
import {describeAgent} from '@/lib/avault/agent';

// AVAULT → Leads: an inbox list with status tabs, and a detail panel with everything known about a lead.
type Notice=(s:string)=>void;
const parse=(s:string)=>{try{return JSON.parse(s||'{}')}catch{return {}}};
function ago(iso?:string){if(!iso)return '—';const d=new Date(iso),s=(Date.now()-d.getTime())/1000;if(s<60)return 'Just now';if(s<3600)return Math.floor(s/60)+' min ago';if(s<86400)return Math.floor(s/3600)+' h ago';if(s<86400*7)return Math.floor(s/86400)+' d ago';return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:d.getFullYear()===new Date().getFullYear()?undefined:'numeric'})}
const full=(iso?:string)=>iso?new Date(iso).toLocaleString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):'—';
const secs=(n?:number)=>!n?'':n<60?`${n} sec`:n<3600?`${Math.floor(n/60)} min ${n%60} sec`:'Over an hour';
const STATUS:Record<string,[string,string]>={new:['New','av-pill-scheduled'],read:['Read','av-pill-draft'],archived:['Archived','av-pill-draft'],spam:['Spam','av-pill-spam']};
const DELIVERY:Record<string,[string,typeof Mail,string]>={sent:['Emailed',MailCheck,'ok'],failed:['Email failed',MailX,'bad'],pending:['Sending',Clock,''],sending:['Sending',Clock,''],'not-configured':['Saved only',Inbox,''],blocked:['Not emailed',ShieldAlert,'']};

export function LeadsInbox({role,notice}:{role:string;notice:Notice}){
 const [q,setQ]=useState(''),[tab,setTab]=useState(''),[delivery,setDelivery]=useState(''),[page,setPage]=useState(0),[data,setData]=useState<any>(null),[openId,setOpenId]=useState<string|null>(null),[selected,setSelected]=useState<string[]>([]),[busy,setBusy]=useState(false);
 async function load(){const p=new URLSearchParams({q,status:tab,delivery,page:String(page)});setData(await request('forms?'+p));setSelected([])}
 useEffect(()=>{const t=setTimeout(()=>{load().catch(e=>notice(e.message))},q?300:0);return()=>clearTimeout(t)},[q,tab,delivery,page]);// eslint-disable-line react-hooks/exhaustive-deps
 async function act(fn:()=>Promise<unknown>){setBusy(true);try{await fn()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 const setStatus=(ids:string[],s:string,msg?:string)=>act(async()=>{if(ids.length===1)await request('form-status',{id:ids[0],status:s});else await request('form-bulk',{ids,status:s});if(msg)notice(msg);await load()});
 const rows:any[]=data?.rows||[],c=data?.counts||{};
 const lead=rows.find(r=>r.id===openId);
 // Opening a new lead marks it read, like an email inbox.
 function openLead(r:any){setOpenId(r.id);if(r.status==='new')request('form-status',{id:r.id,status:'read'}).then(()=>setData((d:any)=>d&&{...d,rows:d.rows.map((x:any)=>x.id===r.id?{...x,status:'read'}:x),counts:{...d.counts,new:Math.max(0,(d.counts?.new||1)-1),read:(d.counts?.read||0)+1}})).catch(()=>{})}
 const tabs:[string,string,number][]=[['','Inbox',(c.new||0)+(c.read||0)],['new','New',c.new||0],['spam','Spam',c.spam||0],['archived','Archived',c.archived||0],['all','All',Object.values(c).reduce((a:number,b:any)=>a+Number(b),0)]];
 return <div className={'av-leads'+(lead?' has-detail':'')}>
  <div className="vault-card av-table-card">
   <div className="av-table-tools">
    <div className="av-seg av-seg-wrap" role="tablist" aria-label="Lead folders">{tabs.map(([k,l,n])=><button key={k||'inbox'} type="button" role="tab" aria-selected={tab===k} className={tab===k?'selected':''} onClick={()=>{setTab(k);setPage(0);setOpenId(null)}}>{l}<span className={'av-count'+(k==='new'&&n?' hot':'')}>{n}</span></button>)}</div>
    <label className="av-find"><Search size={16} aria-hidden="true"/><Input aria-label="Search leads" placeholder="Search name, phone, email, ZIP or IP…" value={q} onChange={e=>{setQ(e.target.value);setPage(0)}}/></label>
    <label className="av-sort">Email<select value={delivery} onChange={e=>{setDelivery(e.target.value);setPage(0)}}><option value="">Any</option><option value="sent">Emailed</option><option value="failed">Failed</option><option value="pending">Sending</option><option value="not-configured">Saved only</option><option value="blocked">Not emailed (spam)</option></select></label>
    <a className="av-export" href="/api/admin/forms-export" download><Download size={15}/>Export CSV</a>
   </div>
   {selected.length>0&&<div className="av-bulk"><span>{selected.length} selected</span><Button variant="outline" size="sm" disabled={busy} onClick={()=>setStatus(selected,'read')}>Mark read</Button><Button variant="outline" size="sm" disabled={busy} onClick={()=>setStatus(selected,'archived','Archived.')}><Archive/>Archive</Button>{tab==='spam'?<Button variant="outline" size="sm" disabled={busy} onClick={()=>setStatus(selected,'new','Moved to the inbox.')}><ShieldCheck/>Not spam</Button>:<Button variant="outline" size="sm" disabled={busy} onClick={()=>setStatus(selected,'spam','Moved to spam.')}><ShieldAlert/>Mark spam</Button>}<button type="button" className="av-link" onClick={()=>setSelected([])}>Clear</button></div>}
   <div className="av-table av-leads-table" role="table" aria-label="Leads">
    <div className="av-tr av-th" role="row"><span role="columnheader"><input type="checkbox" aria-label="Select all on this page" checked={!!rows.length&&selected.length===rows.length} onChange={e=>setSelected(e.target.checked?rows.map(r=>r.id):[])}/></span><span role="columnheader">Contact</span><span role="columnheader">ZIP</span><span role="columnheader">Service</span><span role="columnheader">Delivery</span><span role="columnheader">Received</span></div>
    {rows.map(r=>{const f=parse(r.value),[dl,DI,dc]=DELIVERY[r.delivery]||[r.delivery||'—',Mail,''];return <div key={r.id} role="row" className={'av-tr av-row-link'+(r.id===openId?' active':'')+(r.status==='new'?' unread':'')} onClick={()=>openLead(r)}>
     <span role="cell" onClick={e=>e.stopPropagation()}><input type="checkbox" aria-label={'Select '+f.name} checked={selected.includes(r.id)} onChange={e=>setSelected(e.target.checked?[...selected,r.id]:selected.filter(x=>x!==r.id))}/></span>
     <span role="cell" className="av-cell-title"><button type="button">{r.status==='new'&&<i className="av-unread-dot" aria-label="New"/>}{f.name||'(no name)'}</button><small>{f.phone||f.email}</small></span>
     <span role="cell" className="av-muted-cell av-ellipsis">{f.zip||'—'}</span>
     <span role="cell" className="av-muted-cell"><span className="av-ellipsis">{f.service||f.request||'—'}</span>{f.details&&<small className="av-ellipsis">{f.details}</small>}</span>
     <span role="cell"><span className={'av-delivery '+dc} title={r.delivery_message||''}><DI size={15} aria-hidden="true"/>{dl}</span>{r.status==='spam'&&<span className="av-pill av-pill-spam">Spam</span>}</span>
     <span role="cell" className="av-muted-cell" title={full(r.created_at)}>{ago(r.created_at)}</span>
    </div>})}
    {data&&!rows.length&&<p className="av-empty">{tab==='spam'?'No spam. Caught submissions land here without emailing you.':q?'No leads match your search.':'No leads here yet.'}</p>}
    {!data&&<p className="av-empty" role="status">Loading leads…</p>}
   </div>
   {data&&<div className="av-table-foot av-pager"><span>{data.total} lead{data.total===1?'':'s'}{data.total>50?` · page ${page+1}`:''}</span>{data.total>50&&<span className="actions"><Button variant="outline" size="sm" disabled={!page} onClick={()=>setPage(page-1)}>Previous</Button><Button variant="outline" size="sm" disabled={(page+1)*50>=data.total} onClick={()=>setPage(page+1)}>Next</Button></span>}</div>}
  </div>
  {lead&&<LeadDetail r={lead} role={role} busy={busy} close={()=>setOpenId(null)} setStatus={setStatus} act={act} reload={load} notice={notice}/>}
 </div>;
}

// One titled group of details; empty rows are left out.
function Section({title,rows}:{title:string;rows:[string,React.ReactNode][]}){const shown=rows.filter(([,v])=>v!==''&&v!==undefined&&v!==null);return shown.length?<section><h3>{title}</h3><dl>{shown.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></section>:null}

function LeadDetail({r,role,busy,close,setStatus,act,reload,notice}:{r:any;role:string;busy:boolean;close:()=>void;setStatus:(ids:string[],s:string,msg?:string)=>void;act:(fn:()=>Promise<unknown>)=>void;reload:()=>Promise<void>;notice:Notice}){
 const f=parse(r.value),[sl,sc]=STATUS[r.status]||[r.status,'av-pill-draft'],[dl,DI,dc]=DELIVERY[r.delivery]||[r.delivery||'—',Mail,''];
 const utm=[f.utm_source,f.utm_medium,f.utm_campaign,f.utm_term,f.utm_content].filter(Boolean).join(' / ');
 const spam=String(r.spam||''),flagged=spam.startsWith('flagged');
 const link=(u:string)=>u?<a href={u} target="_blank" rel="noreferrer">{u}<ExternalLink size={12}/></a>:'';
 return <aside className="vault-card av-lead-detail" aria-label={'Lead from '+f.name}>
  <div className="av-lead-head"><div><span className={'av-pill '+sc}>{sl}</span><h2>{f.name||'(no name)'}</h2>{f.phone&&<p><a href={'tel:'+String(f.phone).replace(/[^+\d]/g,'')}>{f.phone}</a></p>}{f.email&&<p><a href={'mailto:'+f.email}>{f.email}</a></p>}<small title={full(r.created_at)}>Received {full(r.created_at)}</small></div><button type="button" className="av-nav-close" aria-label="Close" onClick={close}><X size={18}/></button></div>
  <div className="av-lead-actions">
    {f.email&&<a className="av-btn-primary" href={`mailto:${f.email}?subject=${encodeURIComponent('Ihre Anfrage an AROZ')}`}><Mail size={15}/>Antworten</a>}
   {r.status==='spam'?<Button variant="outline" size="sm" disabled={busy} onClick={()=>setStatus([r.id],'new','Moved to the inbox.')}><ShieldCheck/>Not spam</Button>:<Button variant="outline" size="sm" disabled={busy} onClick={()=>setStatus([r.id],'spam','Moved to spam.')}><ShieldAlert/>Spam</Button>}
   {r.status==='archived'?<Button variant="outline" size="sm" disabled={busy} onClick={()=>setStatus([r.id],'read','Restored to the inbox.')}><RotateCcw/>Restore</Button>:<Button variant="outline" size="sm" disabled={busy} onClick={()=>setStatus([r.id],'archived','Archived.')}><Archive/>Archive</Button>}
   {r.status!=='new'&&r.status!=='spam'&&<Button variant="ghost" size="sm" disabled={busy} onClick={()=>setStatus([r.id],'new')}>Mark unread</Button>}
  </div>
  <div className="av-lead-body">
   <Section title="Request" rows={[['Phone',f.phone],['Email',f.email],['Website',f.zip],['Service',f.service],['Details',f.details],['Request',f.request],...Object.entries(f.extra||{}).map(([k,v])=>[k,String(v)] as [string,string])]}/>
   <Section title="Visit" rows={[['Sent from',f.page?link(f.page):''],['Came from',f.referrer?link(f.referrer):'Direct / none'],['Campaign (UTM)',utm],['Time on page',secs(r.fill_seconds)]]}/>
   <Section title="Sender" rows={[['IP address',r.ip],['Country',r.country],['Device',r.user_agent?describeAgent(r.user_agent):''],['Language',String(r.language||'').split(',')[0]],['Browser details',r.user_agent?<span className="av-small">{r.user_agent}</span>:'']]}/>
   <section><h3>Spam protection</h3><p className={'av-spam-check '+(flagged?'bad':'ok')}>{flagged?<ShieldAlert size={16}/>:<ShieldCheck size={16}/>}<span>{flagged?'Flagged: '+spam.replace(/^flagged:\s*/,''):spam?'Passed every check':'Not checked (sent before protection was added)'}</span></p></section>
   <section><h3>Email notification</h3><p className={'av-delivery '+dc}><DI size={15}/>{dl}{r.attempts?` · ${r.attempts} attempt${r.attempts===1?'':'s'}`:''}{r.delivered_at?` · ${full(r.delivered_at)}`:''}</p>{r.delivery_message&&<p className="av-small">{r.delivery_message}</p>}{r.delivery!=='sent'&&<Button variant="outline" size="sm" disabled={busy} onClick={()=>act(async()=>{await request('email-retry',{id:r.id});notice('Retried. The result is shown here.');await reload()})}>{r.delivery==='blocked'?'Send the email anyway':'Retry email'}</Button>}</section>
  </div>
  {role==='owner'&&<div className="av-lead-danger"><Button variant="ghost" size="sm" disabled={busy} onClick={()=>act(async()=>{if(!confirm('Permanently delete this lead? This cannot be undone.'))return;await request('form-delete',{id:r.id});notice('Lead deleted.');close();await reload()})}><Trash2/>Delete permanently</Button></div>}
 </aside>;
}
