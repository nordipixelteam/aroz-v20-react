'use client';
import {useEffect,useMemo,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Search,Download,DatabaseBackup,ShieldCheck,RotateCcw,X,Plus,Globe,Ban,CircleCheck,Info,Lock,FileText,Mail,Image as ImageIcon,Settings,Users,Link as LinkIcon,KeyRound,Inbox,CalendarClock,Tags,LogIn,Trash2} from 'lucide-react';
import {request} from './content-tools';
import {isIpRange,matchesIP,parseIp} from '@/lib/avault/ip';

// Redesigned AVAULT admin screens: Activity log, Backups and Traffic access.
type Notice=(s:string)=>void;
const fullTime=(iso?:string)=>iso?new Date(iso).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):'—';
const clock=(iso:string)=>new Date(iso).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
function dayLabel(iso:string){const d=new Date(iso),t=new Date();const k=(x:Date)=>x.toDateString();const y=new Date(t);y.setDate(t.getDate()-1);return k(d)===k(t)?'Today':k(d)===k(y)?'Yesterday':d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:d.getFullYear()===t.getFullYear()?undefined:'numeric'})}
function ago(iso?:string){if(!iso)return '—';const s=(Date.now()-new Date(iso).getTime())/1000;if(s<60)return 'just now';if(s<3600)return Math.floor(s/60)+' min ago';if(s<86400)return Math.floor(s/3600)+' h ago';return Math.floor(s/86400)+' d ago'}
const Find=({value,set,placeholder}:{value:string;set:(v:string)=>void;placeholder:string})=><label className="av-find"><Search size={16} aria-hidden="true"/><Input aria-label={placeholder} placeholder={placeholder} value={value} onChange={e=>set(e.target.value)}/></label>;

// ── Activity log ────────────────────────────────────────────────────────────
// Plain-language names and a colour family for each recorded action.
const ACTIONS:Record<string,[string,string,typeof FileText]>={
 publish:['Published','green',FileText],save:['Saved a draft','blue',FileText],unpublish:['Unpublished','red',FileText],'scheduled-publish':['Published on schedule','green',CalendarClock],schedule:['Scheduled','blue',CalendarClock],'cancel-schedule':['Cancelled a schedule','red',CalendarClock],'delete-draft':['Deleted a draft','red',Trash2],rename:['Renamed a page','blue',FileText],create:['Created a draft','blue',FileText],
 upload:['Uploaded media','blue',ImageIcon],'media-metadata':['Edited media details','blue',ImageIcon],'archive-media':['Archived media','red',ImageIcon],'media-alt':['Updated image descriptions','blue',ImageIcon],'media-replace':['Replaced an image','blue',ImageIcon],
 redirect:['Saved a redirect','blue',LinkIcon],'redirect-update':['Edited a redirect','blue',LinkIcon],'redirect-delete':['Deleted a redirect','red',LinkIcon],
 'section-insert':['Added a section','blue',FileText],'section-duplicate':['Duplicated a section','blue',FileText],'section-remove':['Removed a section','red',FileText],'revision-restore':['Restored a revision','yellow',RotateCcw],'create-family':['Created a page family','blue',FileText],
 'form-status':['Updated a lead','blue',Inbox],'form-bulk':['Updated leads','blue',Inbox],'delete-submission':['Deleted a lead','red',Inbox],'export-leads':['Exported leads','blue',Download],'email-retry':['Retried a lead email','blue',Mail],'email-test':['Sent a test email','blue',Mail],
 taxonomy:['Saved a category or tag','blue',Tags],'delete-taxonomy':['Deleted a category or tag','red',Tags],
 backup:['Created a backup','green',DatabaseBackup],'backup-delete':['Deleted a backup','red',DatabaseBackup],'restore-page':['Restored a page from backup','yellow',RotateCcw],'backup-restore':['Restored a page from backup','yellow',RotateCcw],'privacy-erase':['Erased a person’s data','red',ShieldCheck],
 settings:['Changed site settings','yellow',Settings],navigation:['Changed the header or footer','yellow',Settings],configuration:['Changed a setting','yellow',Settings],access:['Changed a user','yellow',Users],
 users:['Changed a user','yellow',Users],'delete-user':['Removed a user','red',Users],password:['Changed a password','yellow',KeyRound],'sign-in':['Signed in','gray',LogIn],
};
// Every settings save is logged as "settings" with the settings key as entity; name the area that changed.
const SETTINGS:Record<string,string>={global:'site settings',email:'email settings',forms:'the forms',scripts:'custom scripts',traffic:'traffic access',operations:'privacy & tracking',verification:'search-engine verification',files:'discovery files',menus:'extra menu links'};
export const describe=(a:string,entity?:string):[string,string,typeof FileText]=>a==='settings'&&entity&&SETTINGS[entity]?['Changed '+SETTINGS[entity],'yellow',Settings]:ACTIONS[a]||[a.replace(/[-_]/g,' ').replace(/^./,c=>c.toUpperCase()),'gray',Settings];
// Entries whose entity is a page that can be opened in the editor, and entities that add nothing to the line.
const PAGE_ACTIONS=new Set(['publish','save','unpublish','scheduled-publish','schedule','cancel-schedule','rename','create','restore-page']);
export const GENERIC=new Set(['global','email','backup','settings','navigation','configuration','traffic','operations','scripts','menus','files','verification','forms']);
const initials=(e:string)=>(e.split('@')[0].split(/[._-]/).filter(Boolean).slice(0,2).map(x=>x[0]).join('')||e[0]||'?').toUpperCase();

export function ActivityLog({notice}:{notice:Notice}){
 const [f,setF]=useState({q:'',actor:'',action:'',from:'',to:''}),[page,setPage]=useState(0),[data,setData]=useState<any>(null);
 useEffect(()=>{const t=setTimeout(()=>request('activity?'+new URLSearchParams({...f,page:String(page)})).then(setData).catch(e=>notice(e.message)),f.q?300:0);return()=>clearTimeout(t)},[f,page]);// eslint-disable-line react-hooks/exhaustive-deps
 const set=(k:string,v:string)=>{setF({...f,[k]:v});setPage(0)};
 const rows:any[]=data?.rows||[];
 const groups=useMemo(()=>{const g:[string,any[]][]=[];for(const r of rows){const d=dayLabel(r.created_at);const last=g[g.length-1];if(last&&last[0]===d)last[1].push(r);else g.push([d,[r]])}return g},[rows]);
 const filtered=!!(f.q||f.actor||f.action||f.from||f.to);
 return <div className="vault-card av-table-card av-activity">
  <div className="av-table-tools">
   <Find value={f.q} set={v=>set('q',v)} placeholder="Search pages, actions or people…"/>
   <label className="av-sort">Person<select value={f.actor} onChange={e=>set('actor',e.target.value)}><option value="">Anyone</option>{data?.actors?.map((a:string)=><option key={a} value={a}>{a}</option>)}</select></label>
   <label className="av-sort">Action<select value={f.action} onChange={e=>set('action',e.target.value)}><option value="">Any action</option>{[...(data?.actions||[])].sort((a:string,b:string)=>describe(a)[0].localeCompare(describe(b)[0])).map((a:string)=><option key={a} value={a}>{describe(a)[0]}</option>)}</select></label>
   <span className="av-daterange"><Input type="date" aria-label="From date" value={f.from} onChange={e=>set('from',e.target.value)}/><span>to</span><Input type="date" aria-label="To date" value={f.to} onChange={e=>set('to',e.target.value)}/></span>
   {filtered&&<button type="button" className="av-link" onClick={()=>{setF({q:'',actor:'',action:'',from:'',to:''});setPage(0)}}><X size={14}/>Clear filters</button>}
  </div>
  {!data&&<p className="av-empty" role="status">Loading activity…</p>}
  {data&&!rows.length&&<p className="av-empty">{filtered?'No activity matches these filters.':'Nothing recorded yet.'}</p>}
  {groups.map(([day,list])=><section key={day} className="av-day"><h3>{day}<span>{list.length} event{list.length===1?'':'s'}</span></h3><ol>{list.map(r=>{const [label,tone,I]=describe(r.action,r.entity);const entity=String(r.entity||''),hidden=!entity||entity===r.actor||GENERIC.has(entity),isPage=PAGE_ACTIONS.has(r.action)&&entity.startsWith('/');return <li key={r.id}>
   <span className={'av-act-icon '+tone}><I size={16} aria-hidden="true"/></span>
   <div className="av-act-main"><p><strong>{label}</strong>{!hidden&&<> · {isPage?<a href={'/avault?view=pages&route='+encodeURIComponent(entity)}>{entity}</a>:<span className="av-act-entity">{entity}</span>}</>}</p><small><span className="av-avatar" aria-hidden="true">{initials(String(r.actor||''))}</span>{r.actor||'System'}</small></div>
   <time dateTime={r.created_at} title={fullTime(r.created_at)}>{clock(r.created_at)}</time>
  </li>})}</ol></section>)}
  {data&&(page>0||rows.length>=50)&&<div className="av-table-foot av-pager"><span>Page {page+1}</span><span className="actions"><Button variant="outline" size="sm" disabled={!page} onClick={()=>setPage(page-1)}>Newer</Button><Button variant="outline" size="sm" disabled={rows.length<50} onClick={()=>setPage(page+1)}>Older</Button></span></div>}
 </div>;
}

// ── Backups ─────────────────────────────────────────────────────────────────
const TABLES:Record<string,string>={documents:'Pages & posts',settings:'Settings',redirects:'Redirects',media:'Media records',users:'Users',forms:'Leads',activity:'Activity entries',taxonomy:'Categories & tags',schedules:'Schedules',revisions:'Revisions',events:'Visit events'};
const size=(b:number)=>b<1024*1024?`${Math.max(1,Math.round(b/1024))} KB`:`${(b/1024/1024).toFixed(1)} MB`;

export function BackupsPanel({role,notice}:{role:string;notice:Notice}){
 const [rows,setRows]=useState<any[]|null>(null),[busy,setBusy]=useState(false),[open,setOpen]=useState<string|null>(null),[inspection,setInspection]=useState<any>(null),[target,setTarget]=useState(''),[ops,setOps]=useState<{value:any;revision:number}|null>(null),[q,setQ]=useState('');
 const load=()=>request('backups?page=0').then(setRows).catch(e=>notice(e.message));
 useEffect(()=>{if(role!=='owner')return;load();request('configuration?key=operations').then(setOps).catch(()=>{})},[]);// eslint-disable-line react-hooks/exhaustive-deps
 async function act(fn:()=>Promise<unknown>){setBusy(true);try{await fn()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 if(role!=='owner')return <div className="vault-card"><p>Only owners can create, download or restore backups.</p></div>;
 const latest=rows?.[0],daily=!!ops?.value?.dailyBackup;
 const inspect=(id:string)=>{if(open===id){setOpen(null);return}act(async()=>{setInspection(null);setTarget('');setOpen(id);setInspection(await request('backup-inspect',{id}))})};
 return <div className="av-backups">
  <div className="vault-card av-backup-hero">
   <span className="av-backup-icon"><DatabaseBackup size={26}/></span>
   <div><h2>{latest?`Last backup ${ago(latest.created_at)}`:'No backups yet'}</h2><p>{latest?`${fullTime(latest.created_at)} · ${size(latest.bytes)} · ${rows!.length} kept`:'Create one before making big changes.'}</p></div>
   <div className="av-backup-actions"><Button disabled={busy} onClick={()=>act(async()=>{await request('backup',{});notice('Backup created and encrypted.');await load()})}><Plus/>{busy?'Working…':'Back up now'}</Button></div>
  </div>
  <div className="av-backup-facts">
   <div className="vault-card"><Lock size={18}/><strong>Encrypted</strong><p>Each snapshot is sealed with your encryption key and checked (SHA-256) every time it’s read.</p></div>
   <div className="vault-card"><FileText size={18}/><strong>What’s included</strong><p>Pages and posts with revisions, settings, redirects, media records and a copy of every uploaded file, users, leads and the activity log. Visit records are not included.</p></div>
   <div className="vault-card av-daily"><CalendarClock size={18}/><strong>Daily backup</strong><p>{daily?'On: a new snapshot is made once a day.':'Off: backups are only made when you click “Back up now”.'}</p>{ops&&<button type="button" role="switch" aria-checked={daily} className={'av-switch'+(daily?' on':'')} disabled={busy} onClick={()=>act(async()=>{const r=await request('configuration',{key:'operations',value:{...ops.value,dailyBackup:!daily},revision:ops.revision});setOps({value:{...ops.value,dailyBackup:!daily},revision:r.revision});notice(daily?'Daily backups turned off.':'Daily backups turned on.')})}><span/>{daily?'On':'Off'}</button>}</div>
  </div>
  <div className="vault-card av-table-card">
   <div className="av-table-tools"><h2 className="av-table-title">Saved backups</h2><span className="av-table-meta">Downloads stay encrypted. Open one with <code>npm run backup:decrypt</code> and this site’s encryption key.</span></div>
   {!rows&&<p className="av-empty" role="status">Loading backups…</p>}
   {rows&&!rows.length&&<p className="av-empty">No backups yet. Click “Back up now” to create the first one.</p>}
   {rows&&rows.length>0&&<div className="av-table av-backup-table" role="table" aria-label="Backups">
    <div className="av-tr av-th" role="row"><span role="columnheader">Created</span><span role="columnheader">Size</span><span role="columnheader">Integrity</span><span role="columnheader"><span className="sr-only">Actions</span></span></div>
    {rows.map((r,i)=><div key={r.id} className={'av-backup-row'+(open===r.id?' open':'')}>
     <div className="av-tr" role="row"><span role="cell" className="av-cell-title"><strong>{fullTime(r.created_at)}</strong><small>{ago(r.created_at)}{i===0?' · latest':''}</small></span><span role="cell" className="av-muted-cell">{size(r.bytes)}</span><span role="cell"><span className="av-pill av-pill-live"><ShieldCheck size={12}/>Encrypted</span></span><span role="cell" className="av-actions-cell"><Button variant={open===r.id?'default':'outline'} size="sm" disabled={busy} onClick={()=>inspect(r.id)}>{open===r.id?'Close':'Inspect & restore'}</Button><a className="av-icon-btn" href={'/api/admin/backup-download?id='+r.id} download aria-label={'Download encrypted backup from '+fullTime(r.created_at)} title="Download (encrypted)"><Download size={16}/></a>{i>0&&<button type="button" className="av-icon-btn" disabled={busy} aria-label={'Delete backup from '+fullTime(r.created_at)} title="Delete" onClick={()=>{if(!confirm(`Delete the backup from ${fullTime(r.created_at)}? Its encrypted snapshot and file copies are removed for good.`))return;act(async()=>{await request('backup-delete',{id:r.id});if(open===r.id)setOpen(null);notice('Backup deleted.');await load()})}}><Trash2 size={16}/></button>}</span></div>
     {open===r.id&&<div className="av-backup-detail">{!inspection?<p className="muted" role="status">Decrypting and checking this backup…</p>:<>
      <p className="av-verified"><CircleCheck size={16}/>Verified · taken {fullTime(inspection.date)}{inspection.origin?` from ${String(inspection.origin).replace(/^https?:\/\//,'')}`:''}</p>
      <div className="av-backup-counts">{Object.entries(inspection.counts).filter(([,v])=>Number(v)>0).map(([k,v])=><div key={k}><strong>{String(v)}</strong><span>{TABLES[k]||k}</span></div>)}</div>
      <div className="av-restore"><h3>Restore one page</h3><p>Brings back that page’s draft and published version from this backup as a new revision. A fresh backup is made first, so nothing is lost.</p>
       <Find value={q} set={setQ} placeholder="Find a page…"/>
       <div className="av-restore-list" role="listbox" aria-label="Pages in this backup">{inspection.documents.filter((d:any)=>d.route.includes(q.toLowerCase())).slice(0,80).map((d:any)=><button key={d.route} type="button" role="option" aria-selected={target===d.route} className={target===d.route?'selected':''} onClick={()=>setTarget(d.route)}><span>{d.route}</span><small>revision {d.revision}</small></button>)}</div>
       <Button disabled={!target||busy} onClick={()=>act(async()=>{const current=await request('document?route='+encodeURIComponent(target));if(!confirm(`Restore ${target} from the backup taken ${fullTime(inspection.date)}? A fresh backup is created first.`))return;await request('backup-restore-page',{id:r.id,route:target,expectedRevision:current.revision});notice(`${target} restored as a new revision.`);await load()})}><RotateCcw/>{target?`Restore ${target}`:'Choose a page to restore'}</Button>
      </div></>}</div>}
    </div>)}
   </div>}
  </div>
 </div>;
}

// ── Traffic access ──────────────────────────────────────────────────────────
const regionName=(c:string)=>{try{return new Intl.DisplayNames(['en'],{type:'region'}).of(c)||c}catch{return c}};
const COUNTRIES='AF AL DZ AR AM AU AT AZ BD BY BE BR BG KH CA CL CN CO HR CU CZ DK EG EE ET FI FR GE DE GH GR HK HU IN ID IR IQ IE IL IT JP JO KZ KE KP KR KW LV LB LT MY MX MD MA MM NL NZ NG NO PK PH PL PT QA RO RU SA RS SG SK ZA ES LK SE CH SY TW TH TR UA AE GB US UZ VE VN YE'.split(' ');

function RuleList({title,hint,icon,tone,items,setItems,kind,placeholder,suggest}:{title:string;hint:string;icon:React.ReactNode;tone:string;items:string[];setItems:(v:string[])=>void;kind:'ip'|'country';placeholder:string;suggest?:React.ReactNode}){
 const [draft,setDraft]=useState(''),[err,setErr]=useState('');
 function add(raw=draft){const v=kind==='country'?raw.trim().toUpperCase():raw.trim();if(!v)return;
  if(kind==='ip'&&!isIpRange(v))return setErr('Use an address like 203.0.113.7 or 2001:db8::1, or a range like 203.0.113.0/24.');
  if(kind==='country'&&!/^[A-Z]{2}$/.test(v))return setErr('Pick a country from the list (two-letter code).');
  if(items.includes(v))return setErr('Already in the list.');
  setItems([...items,v]);setDraft('');setErr('')}
 return <section className={'vault-card av-rule '+tone}>
  <header><span className="av-rule-icon">{icon}</span><div><h3>{title}</h3><p>{hint}</p></div><span className="av-count">{items.length}</span></header>
  <form className="av-rule-add" onSubmit={e=>{e.preventDefault();add()}}>
   {kind==='country'?<select className="av-select av-country-select" value={draft} onChange={e=>{setDraft(e.target.value);setErr('')}} aria-label={'Add to '+title}><option value="">Choose a country…</option>{COUNTRIES.filter(c=>!items.includes(c)).map(c=><option key={c} value={c}>{regionName(c)} ({c})</option>)}</select>:<Input value={draft} onChange={e=>{setDraft(e.target.value);setErr('')}} placeholder={placeholder} aria-label={'Add to '+title}/>}
   <Button type="submit" variant="outline" size="sm"><Plus/>Add</Button>
  </form>
  {err&&<p className="av-rule-err" role="alert">{err}</p>}
  {suggest}
  {items.length?<ul className="av-chips-list">{items.map(v=><li key={v}><span>{kind==='country'?`${regionName(v)} (${v})`:v}</span><button type="button" aria-label={'Remove '+v} onClick={()=>setItems(items.filter(x=>x!==v))}><X size={13}/></button></li>)}</ul>:<p className="av-rule-empty">None yet.</p>}
 </section>;
}

export function TrafficPanel({role,notice}:{role:string;notice:Notice}){
 const [cfg,setCfg]=useState<any>(null),[saved,setSaved]=useState<any>(null),[revision,setRevision]=useState(0),[busy,setBusy]=useState(false),[ip,setIp]=useState(''),[myCountry,setMyCountry]=useState('');
 useEffect(()=>{if(role!=='owner')return;request('configuration?key=traffic').then(r=>{const v={enabled:false,allow:[],deny:[],countries:[],...r.value};setCfg(v);setSaved(v);setRevision(r.revision)}).catch(e=>notice(e.message));request('whoami').then(r=>{setIp(r.ip||'');setMyCountry(r.country||'')}).catch(()=>{})},[]);// eslint-disable-line react-hooks/exhaustive-deps
 if(role!=='owner')return <div className="vault-card"><p>Only owners can change traffic access rules.</p></div>;
 if(!cfg)return <p className="vault-card av-empty" role="status">Loading rules…</p>;
 const dirty=JSON.stringify(cfg)!==JSON.stringify(saved);
 const set=(k:string,v:any)=>setCfg((c:any)=>({...c,[k]:v}));
 async function save(next=cfg){setBusy(true);try{const r=await request('configuration',{key:'traffic',value:next,revision});setRevision(r.revision);setSaved(next);setCfg(next);notice(next.enabled?'Traffic rules saved and active.':'Traffic rules saved. They are off.')}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 const myIpBlocked=!!ip&&!cfg.allow.some((r:string)=>matchesIP(ip,r))&&(cfg.deny.some((r:string)=>matchesIP(ip,r))||(!!myCountry&&cfg.countries.includes(myCountry)));
 const total=cfg.allow.length+cfg.deny.length+cfg.countries.length;
 return <div className="av-traffic">
  <div className={'vault-card av-traffic-hero'+(cfg.enabled?' on':'')}>
   <span className="av-backup-icon"><ShieldCheck size={26}/></span>
   <div><h2>{cfg.enabled?'Rules are active':'Rules are off'}</h2><p>{cfg.enabled?`${total} rule${total===1?'':'s'} checked on every public page request.`:'Every visitor can open the website. Turn rules on to block IPs or countries.'} AVAULT always stays reachable, so you can’t lock yourself out of the admin.</p></div>
   <button type="button" role="switch" aria-checked={cfg.enabled} className={'av-switch av-switch-lg'+(cfg.enabled?' on':'')} disabled={busy} onClick={()=>set('enabled',!cfg.enabled)}><span/>{cfg.enabled?'On':'Off'}</button>
  </div>
  {myIpBlocked&&<p className="av-traffic-warn" role="alert"><Info size={16}/>These rules block you ({ip}{myCountry?`, ${regionName(myCountry)}`:''}). You’ll still reach AVAULT, but not the public website. Add your IP to “Always allow” to keep access.</p>}
  <div className="av-rules">
   <RuleList title="Always allow" hint="These IPs are never blocked, even if another rule matches." icon={<CircleCheck size={18}/>} tone="allow" kind="ip" placeholder="203.0.113.7, 203.0.113.0/24 or 2001:db8::/32" items={cfg.allow} setItems={v=>set('allow',v)} suggest={ip&&parseIp(ip)&&!cfg.allow.some((r:string)=>matchesIP(ip,r))?<button type="button" className="av-link" onClick={()=>set('allow',[...cfg.allow,ip])}><Plus size={13}/>Add my IP ({ip})</button>:undefined}/>
   <RuleList title="Block IPs" hint="Visitors from these addresses see “Access unavailable”." icon={<Ban size={18}/>} tone="deny" kind="ip" placeholder="198.51.100.23" items={cfg.deny} setItems={v=>set('deny',v)}/>
   <RuleList title="Block countries" hint={`Each visitor’s country comes from their IP address, looked up on this server.${myCountry?` You appear to be in ${regionName(myCountry)}.`:''}`} icon={<Globe size={18}/>} tone="country" kind="country" placeholder="Type a country code, e.g. RU" items={cfg.countries} setItems={v=>set('countries',v)}/>
  </div>
  <div className="vault-card av-traffic-order"><h3>How a visit is checked</h3><ol><li><b>1</b><span>On the <em>Always allow</em> list? The page opens.</span></li><li><b>2</b><span>On <em>Block IPs</em>? The visitor sees “Access unavailable”.</span></li><li><b>3</b><span>From a <em>blocked country</em>? “Access unavailable”.</span></li><li><b>4</b><span>Anyone else: the page opens as normal.</span></li></ol><p className="av-attrib">Country data: <a href="https://github.com/sapics/ip-location-db" target="_blank" rel="noreferrer">ip-location-db</a> (CC0), including statistics from <a href="https://www.nro.net/" target="_blank" rel="noreferrer">nro.net</a> (CC BY 4.0). Updated with each site update.</p></div>
  {dirty&&<div className="av-savebar show" role="region" aria-label="Unsaved changes"><span>You have unsaved changes.</span><span className="actions"><Button variant="outline" disabled={busy} onClick={()=>setCfg(saved)}>Discard</Button><Button disabled={busy} onClick={()=>save()}>{busy?'Saving…':'Save rules'}</Button></span></div>}
 </div>;
}
