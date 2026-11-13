'use client';
import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Code2,Plus,Trash2,ChevronDown,ShieldCheck,CircleCheck,CircleAlert,Eye,Activity,Clock,Search,Copy,FileText,DatabaseBackup,UserX,ExternalLink} from 'lucide-react';
import {request} from './content-tools';
import {TEMPLATES,PLACEMENTS,normalizeScripts,type ScriptsConfig,type Snippet,type Placement} from '@/lib/avault/snippets';

// AVAULT → Custom scripts and AVAULT → Privacy & tracking.
type Notice=(s:string)=>void;
const fullTime=(iso?:string|null)=>iso?new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—';
const TAG:Record<string,string>={ga4:'Analytics',gtm:'Tag manager',meta:'Advertising',clarity:'Heatmaps',custom:'Custom'};

// ── Custom scripts ──────────────────────────────────────────────────────────
export function ScriptsPanel({role,notice}:{role:string;notice:Notice}){
 const [cfg,setCfg]=useState<ScriptsConfig|null>(null),[saved,setSaved]=useState(''),[revision,setRevision]=useState(0),[busy,setBusy]=useState(false),[open,setOpen]=useState<string|null>(null),[adding,setAdding]=useState<string|null>(null),[tplId,setTplId]=useState(''),[checks,setChecks]=useState<Record<string,boolean|null>>({});
 useEffect(()=>{if(role!=='owner')return;request('configuration?key=scripts').then(r=>{const c=normalizeScripts(r.value);setCfg(c);setSaved(JSON.stringify(c));setRevision(r.revision)}).catch(e=>notice(e.message))},[]);// eslint-disable-line react-hooks/exhaustive-deps
 if(role!=='owner')return <div className="vault-card"><p>Only owners can add scripts to the website.</p></div>;
 if(!cfg)return <p className="vault-card av-empty" role="status">Loading scripts…</p>;
 const dirty=JSON.stringify(cfg)!==saved,active=cfg.snippets.filter(s=>s.enabled&&s.code.trim()).length;
 const patch=(id:string,p:Partial<Snippet>)=>setCfg(c=>c&&{...c,snippets:c.snippets.map(s=>s.id===id?{...s,...p}:s)});
 const tpl=TEMPLATES.find(t=>t.key===adding);
 function add(){if(!tpl)return;const id=tplId.trim().toUpperCase().replace(/^G-|^GTM-/,m=>m);const value=tpl.key==='clarity'?tplId.trim().toLowerCase():tpl.key==='meta'?tplId.trim():id;
  if(tpl.key!=='custom'&&!tpl.pattern.test(value))return notice(`That doesn’t look like a ${tpl.name} ${tpl.label.toLowerCase()} (for example ${tpl.example}).`);
  const made=tpl.build(value);setCfg(c=>c&&{...c,enabled:true,snippets:[...c.snippets,...made]});setOpen(made[0].id);setAdding(null);setTplId('')}
 async function save(){if(!cfg)return;setBusy(true);try{const r=await request('configuration',{key:'scripts',value:cfg,revision});setRevision(r.revision);setSaved(JSON.stringify(cfg));setChecks({});notice(cfg.enabled?'Scripts saved. They’re live on the website now.':'Scripts saved. They’re switched off.')}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 // Loads the page each snippet targets and looks for its marker, proving it really is on the site.
 async function verify(){if(!cfg)return;const out:Record<string,boolean|null>={};await Promise.all(cfg.snippets.filter(s=>s.enabled).map(async s=>{const page=(s.pages.find(p=>!p.endsWith('*'))||s.pages[0]?.replace(/\*$/,'')||'/');try{const html=await (await fetch(page,{cache:'no-store'})).text();out[s.id]=html.includes(`avault:snippet:${s.id}`)}catch{out[s.id]=null}}));setChecks(out);const ok=Object.values(out).filter(Boolean).length;notice(`${ok} of ${Object.keys(out).length} script${Object.keys(out).length===1?'':'s'} found on the live site.`)}
 return <div className="av-scripts">
  <div className={'vault-card av-traffic-hero'+(cfg.enabled?' on':'')}>
   <span className="av-backup-icon"><Code2 size={26}/></span>
   <div><h2>{cfg.enabled?`${active} script${active===1?'':'s'} running on the website`:'Custom scripts are off'}</h2><p>Add analytics, ad pixels or chat widgets without touching the code. Paste the snippet exactly as the provider gives it, script tags and all. Turning this off removes every script at once.</p></div>
   <button type="button" role="switch" aria-checked={cfg.enabled} className={'av-switch av-switch-lg'+(cfg.enabled?' on':'')} onClick={()=>setCfg({...cfg,enabled:!cfg.enabled})}><span/>{cfg.enabled?'On':'Off'}</button>
  </div>
  <section className="vault-card av-gallery"><h3>Add a script</h3><div className="av-gallery-grid">{TEMPLATES.map(t=><button key={t.key} type="button" className={'av-gallery-item'+(adding===t.key?' selected':'')} onClick={()=>{setAdding(adding===t.key?null:t.key);setTplId('')}}><strong>{t.name}</strong><small>{t.key==='custom'?'Paste any snippet':t.label}</small></button>)}</div>
   {tpl&&<form className="av-gallery-form" onSubmit={e=>{e.preventDefault();add()}}>{tpl.key==='custom'?<p>Adds an empty snippet. Paste your code into it, then save.</p>:<label>{tpl.name} {tpl.label}<Input autoFocus value={tplId} onChange={e=>setTplId(e.target.value)} placeholder={tpl.example}/></label>}<Button type="submit"><Plus/>Add {tpl.name}</Button></form>}
  </section>
  <section className="vault-card av-table-card">
   <div className="av-table-tools"><h2 className="av-table-title">Your scripts</h2>{cfg.snippets.some(s=>s.enabled)&&!dirty&&<Button variant="outline" size="sm" onClick={verify}><Eye/>Check on live site</Button>}</div>
   {!cfg.snippets.length&&<p className="av-empty">No scripts yet. Pick one above to add it.</p>}
   <ul className="av-snippets">{cfg.snippets.map(s=>{const isOpen=open===s.id,check=checks[s.id];return <li key={s.id} className={(isOpen?'open ':'')+(s.enabled?'':'off')}>
    <div className="av-snippet-head">
     <button type="button" className="av-snippet-title" onClick={()=>setOpen(isOpen?null:s.id)} aria-expanded={isOpen}><ChevronDown size={16} aria-hidden="true"/><span><strong>{s.name}</strong><small>{TAG[s.template]||'Custom'} · {PLACEMENTS[s.placement]} · {s.pages.length?`${s.pages.length} page${s.pages.length===1?'':'s'}`:'all pages'}{s.respectOptOut?' · respects opt-out':''}</small></span></button>
     {check!==undefined&&<span className={'av-pill '+(check?'av-pill-live':'av-pill-spam')}>{check?'Found on site':check===false?'Not found':'Couldn’t check'}</span>}
     <button type="button" role="switch" aria-checked={s.enabled} aria-label={'Run '+s.name} className={'av-switch'+(s.enabled?' on':'')} onClick={()=>patch(s.id,{enabled:!s.enabled})}><span/>{s.enabled?'On':'Off'}</button>
    </div>
    {isOpen&&<div className="av-snippet-body">
     <div className="av-snippet-grid"><label>Name<Input value={s.name} onChange={e=>patch(s.id,{name:e.target.value})}/></label><label>Where it goes<select value={s.placement} onChange={e=>patch(s.id,{placement:e.target.value as Placement})}>{(Object.keys(PLACEMENTS) as Placement[]).map(k=><option key={k} value={k}>{PLACEMENTS[k]}</option>)}</select></label></div>
     <label>Code <small>paste it exactly as given: &lt;script&gt; tags are fine</small><Textarea className="av-code" rows={Math.min(18,Math.max(6,s.code.split('\n').length+1))} spellCheck={false} value={s.code} onChange={e=>patch(s.id,{code:e.target.value})} placeholder={'<script>\n  // your code\n</script>'}/></label>
     <fieldset className="av-choice av-pages"><legend>Which pages?</legend><label className={!s.pages.length?'selected':''}><input type="radio" checked={!s.pages.length} onChange={()=>patch(s.id,{pages:[]})}/><strong>Every page</strong><small>Recommended for analytics and pixels.</small></label><label className={s.pages.length?'selected':''}><input type="radio" checked={!!s.pages.length} onChange={()=>patch(s.id,{pages:s.pages.length?s.pages:['/']})}/><strong>Only some pages</strong><small>One path per line. End with * for a whole section, like /blog/*.</small></label></fieldset>
     {!!s.pages.length&&<Textarea rows={3} value={s.pages.join('\n')} onChange={e=>patch(s.id,{pages:e.target.value.split('\n')})} placeholder={'/contact/\n/blog/*'}/>}
     <label className="inline av-optout"><input type="checkbox" checked={s.respectOptOut} onChange={e=>patch(s.id,{respectOptOut:e.target.checked})}/><span><strong>Respect visitors’ privacy choice</strong><small>Skip this script for visitors who clicked “Don’t track my visits” or whose browser sends Global Privacy Control. Turn on for any tracking or advertising code.</small></span></label>
     <div className="av-snippet-foot"><Button variant="ghost" size="sm" onClick={()=>{if(confirm(`Remove “${s.name}” from the website?`))setCfg({...cfg,snippets:cfg.snippets.filter(x=>x.id!==s.id)})}}><Trash2/>Remove</Button></div>
    </div>}
   </li>})}</ul>
  </section>
  <p className="av-attrib">Scripts that load other code from the internet are allowed automatically. Code inside Google Tag Manager’s “Custom HTML” tags may be blocked by the site’s security policy; prefer built-in tag types there.</p>
  {dirty&&<div className="av-savebar show" role="region" aria-label="Unsaved changes"><span>You have unsaved changes.</span><span className="actions"><Button variant="outline" disabled={busy} onClick={()=>{setCfg(JSON.parse(saved));setChecks({})}}>Discard</Button><Button disabled={busy} onClick={save}>{busy?'Saving…':'Save scripts'}</Button></span></div>}
 </div>;
}

// ── Privacy & tracking ──────────────────────────────────────────────────────
const KEEP=[30,90,180,365,730];
const span=(n:number)=>n>=365?`${n/365} year${n>365?'s':''}`:`${n} days`;
export function PrivacyPanel({role,notice,go}:{role:string;notice:Notice;go:(v:string)=>void}){
 const [cfg,setCfg]=useState<any>(null),[saved,setSaved]=useState(''),[revision,setRevision]=useState(0),[stats,setStats]=useState<any>(null),[busy,setBusy]=useState(false),[q,setQ]=useState(''),[found,setFound]=useState<any>(null),[confirmText,setConfirmText]=useState('');
 const loadStats=()=>request('privacy-stats').then(setStats).catch(()=>{});
 useEffect(()=>{if(role!=='owner')return;request('configuration?key=operations').then(r=>{const v={analytics:true,retentionDays:365,dailyBackup:false,formRetentionDays:0,...r.value};setCfg(v);setSaved(JSON.stringify(v));setRevision(r.revision)}).catch(e=>notice(e.message));loadStats()},[]);// eslint-disable-line react-hooks/exhaustive-deps
 if(role!=='owner')return <div className="vault-card"><p>Only owners can change privacy settings.</p></div>;
 if(!cfg)return <p className="vault-card av-empty" role="status">Loading privacy settings…</p>;
 const dirty=JSON.stringify(cfg)!==saved,set=(k:string,v:any)=>setCfg((c:any)=>({...c,[k]:v}));
 async function save(){setBusy(true);try{const r=await request('configuration',{key:'operations',value:cfg,revision});setRevision(r.revision);setSaved(JSON.stringify(cfg));notice('Privacy settings saved.')}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 async function lookup(){setBusy(true);setFound(null);setConfirmText('');try{setFound(await request('privacy-lookup',{query:q}))}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 async function erase(){setBusy(true);try{const r=await request('privacy-erase',{query:q,confirm:confirmText.trim().toLowerCase()});notice(`Deleted ${r.leads} lead${r.leads===1?'':'s'} and ${r.events} visit record${r.events===1?'':'s'}.`);setFound(null);setQ('');setConfirmText('');loadStats()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 const on=cfg.analytics!==false,days=Number(cfg.retentionDays)||365,leadDays=Number(cfg.formRetentionDays)||0;
 const policy=`${on?`This website records how visitors use it: the pages viewed and time spent on each, links and buttons clicked, forms sent and phone numbers tapped, together with the referring site, browser type and IP address. These records are kept for ${span(days)} and then deleted automatically.`:'This website does not record visitor journeys.'} When you send a request through our form, we keep the details you provide so we can reply${leadDays?`; archived requests are deleted after ${span(leadDays)}`:''}. ${on?'You can stop visit recording at any time with the “Don’t track my visits” link in the footer, and browsers that send the Global Privacy Control signal are never recorded. ':''}To see or delete the information we hold about you, contact us and we will respond promptly.`;
 return <div className="av-privacy">
  <div className={'vault-card av-traffic-hero'+(on?' on':'')}>
   <span className="av-backup-icon"><Activity size={26}/></span>
   <div><h2>{on?'Visit recording is on':'Visit recording is off'}</h2><p>{on?'Every visit is recorded so you can see journeys under Visitors and Calls. Search-engine bots are ignored, and visitors who opt out are never recorded.':'No visits are recorded. Visitors and Calls will stop updating.'}</p></div>
   <button type="button" role="switch" aria-checked={on} className={'av-switch av-switch-lg'+(on?' on':'')} onClick={()=>set('analytics',!on)}><span/>{on?'On':'Off'}</button>
  </div>
  <div className="av-backup-facts">
   <div className="vault-card"><Eye size={18}/><strong>What’s recorded</strong><p>Pages and time on each, clicks, form sends and phone taps, plus referrer, browser and IP address. Never passwords or form contents.</p></div>
   <div className="vault-card"><ShieldCheck size={18}/><strong>Opt-outs are honoured</strong><p>The footer’s “Don’t track my visits” link and the browser Global Privacy Control signal both stop recording for that visitor.</p></div>
   <div className="vault-card"><DatabaseBackup size={18}/><strong>Stored right now</strong><p>{stats?`${stats.events.toLocaleString()} visit records${stats.oldestEvent?` since ${fullTime(stats.oldestEvent)}`:''} · ${stats.leads} leads (${stats.archived} archived, ${stats.spam} spam)`:'Counting…'}</p><button type="button" className="av-link" onClick={()=>go('visitors')}>Open Visitors<ExternalLink size={13}/></button></div>
  </div>
  <section className="vault-card av-privacy-keep"><h3><Clock size={18}/>How long data is kept</h3><p className="muted">Older records are deleted automatically every 10 minutes.</p>
   <div className="av-keep-row"><div><strong>Visit records</strong><small>Visitor journeys, clicks and calls.</small></div><div className="av-seg av-seg-wrap">{KEEP.map(n=><button key={n} type="button" className={days===n?'selected':''} onClick={()=>set('retentionDays',n)}>{span(n)}</button>)}</div></div>
   <div className="av-keep-row"><div><strong>Archived and spam leads</strong><small>Leads you archived, or that were caught as spam. Inbox leads are never deleted automatically.</small></div><div className="av-seg av-seg-wrap">{[0,...KEEP.slice(1)].map(n=><button key={n} type="button" className={leadDays===n?'selected':''} onClick={()=>set('formRetentionDays',n)}>{n?span(n):'Keep forever'}</button>)}</div></div>
   <div className="av-keep-row"><div><strong>Daily backup</strong><small>Backups include leads but not visit records; they’re kept until you delete them under Backups.</small></div><button type="button" role="switch" aria-checked={!!cfg.dailyBackup} className={'av-switch'+(cfg.dailyBackup?' on':'')} onClick={()=>set('dailyBackup',!cfg.dailyBackup)}><span/>{cfg.dailyBackup?'On':'Off'}</button></div>
  </section>
  <section className="vault-card av-privacy-request"><h3><UserX size={18}/>A visitor asked to see or delete their data</h3><p className="muted">Find everything stored about one person by their email address (their leads) or IP address (their visits and leads), then delete it in one step.</p>
   <form className="av-rule-add" onSubmit={e=>{e.preventDefault();if(q.trim())lookup()}}><label className="av-find" style={{maxWidth:'none',flex:1}}><Search size={16} aria-hidden="true"/><Input aria-label="Email or IP address" placeholder="name@company.com or 203.0.113.7" value={q} onChange={e=>{setQ(e.target.value);setFound(null)}}/></label><Button type="submit" variant="outline" disabled={busy||!q.trim()}>Find data</Button></form>
   {found&&<div className="av-found">
    {!found.leads.length&&!found.events?<p className="av-verified"><CircleCheck size={16}/>Nothing is stored for {q}.</p>:<>
     <p><strong>{found.leads.length}</strong> lead{found.leads.length===1?'':'s'} and <strong>{found.events.toLocaleString()}</strong> visit record{found.events===1?'':'s'} (from {found.eventsFrom}).</p>
     {found.leads.length>0&&<ul className="av-use-list compact">{found.leads.map((l:any)=><li key={l.id}><span><span><strong>{l.name||'(no name)'}</strong><small>{l.email} · {fullTime(l.created_at)} · {l.status}</small></span></span></li>)}</ul>}
     <div className="av-erase"><CircleAlert size={16}/><span>To delete all of it permanently, type <code>{q.trim().toLowerCase()}</code></span><Input value={confirmText} onChange={e=>setConfirmText(e.target.value)} aria-label="Type to confirm"/><Button variant="destructive" disabled={busy||confirmText.trim().toLowerCase()!==q.trim().toLowerCase()} onClick={erase}><Trash2/>Delete everything</Button></div>
     <p className="av-attrib">Backups made before today still contain this data until they’re deleted.</p></>}
   </div>}
  </section>
  <section className="vault-card av-privacy-policy"><h3><FileText size={18}/>Wording for your privacy policy</h3><p className="muted">Matches the settings above. Copy it into the privacy policy whenever you change them.</p><blockquote>{policy}</blockquote><div className="actions"><Button variant="outline" onClick={()=>navigator.clipboard?.writeText(policy).then(()=>notice('Wording copied.'),()=>notice('Copy failed. Select the text instead.'))}><Copy/>Copy wording</Button><a className="av-link" href="/avault?view=pages&route=%2Fprivacy-policy%2F">Edit the privacy policy<ExternalLink size={13}/></a></div></section>
  {dirty&&<div className="av-savebar show" role="region" aria-label="Unsaved changes"><span>You have unsaved changes.</span><span className="actions"><Button variant="outline" disabled={busy} onClick={()=>setCfg(JSON.parse(saved))}>Discard</Button><Button disabled={busy} onClick={save}>{busy?'Saving…':'Save settings'}</Button></span></div>}
 </div>;
}
