'use client';
import {useEffect,useMemo,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Users,UserPlus,KeyRound,Eye,EyeOff,Mail,Send,CircleCheck,X,Building2,Phone,MapPin,Clock,Share2,Search,Activity,MousePointerClick,Globe,FileText,Inbox,ChevronDown,RefreshCw,Wand2} from 'lucide-react';
import {request} from './content-tools';
import {adminFetch} from './session';

// AVAULT → Users, Email, Site settings, Visitors and Calls.
type Notice=(s:string)=>void;
const fullTime=(iso?:string|null)=>iso?new Date(iso).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):'—';
function ago(iso?:string|null){if(!iso)return 'never';const s=(Date.now()-new Date(iso).getTime())/1000;if(s<60)return 'just now';if(s<3600)return Math.floor(s/60)+' min ago';if(s<86400)return Math.floor(s/3600)+' h ago';if(s<86400*30)return Math.floor(s/86400)+' d ago';return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
const regionName=(c:string)=>{if(!/^[A-Z]{2}$/.test(c||''))return 'Unknown';try{return new Intl.DisplayNames(['en'],{type:'region'}).of(c)||c}catch{return c}};
const initials=(e:string)=>(e.split('@')[0].split(/[._-]/).filter(Boolean).slice(0,2).map(x=>x[0]).join('')||'?').toUpperCase();
const Switch=({on,set,label,large,disabled}:{on:boolean;set:(v:boolean)=>void;label?:string;large?:boolean;disabled?:boolean})=><button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} className={'av-switch'+(large?' av-switch-lg':'')+(on?' on':'')} onClick={()=>set(!on)}><span/>{on?'On':'Off'}</button>;
const SaveBar=({dirty,busy,discard,save,label='Save changes'}:{dirty:boolean;busy:boolean;discard:()=>void;save:()=>void;label?:string})=>dirty?<div className="av-savebar show" role="region" aria-label="Unsaved changes"><span>You have unsaved changes.</span><span className="actions"><Button variant="outline" disabled={busy} onClick={discard}>Discard</Button><Button disabled={busy} onClick={save}>{busy?'Saving…':label}</Button></span></div>:null;
function Password({value,set,placeholder,autoComplete='new-password',label}:{value:string;set:(v:string)=>void;placeholder?:string;autoComplete?:string;label:string}){const [show,setShow]=useState(false);return <div className="av-password"><Input type={show?'text':'password'} aria-label={label} value={value} onChange={e=>set(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} spellCheck={false}/><button type="button" className="av-password-toggle" aria-label={show?'Hide':'Show'} aria-pressed={show} onClick={()=>setShow(!show)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div>}
const strongPassword=()=>{const a='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';const b=new Uint32Array(18);crypto.getRandomValues(b);return [...b].map(n=>a[n%a.length]).join('')};
const Bars=({rows,label,onPick,picked}:{rows:{key:string;n:number}[];label:(k:string)=>string;onPick?:(k:string)=>void;picked?:string})=>{const max=Math.max(1,...rows.map(r=>r.n));return rows.length?<ul className="av-bars">{rows.map(r=><li key={r.key}><button type="button" disabled={!onPick} className={picked===r.key?'picked':''} onClick={()=>onPick?.(picked===r.key?'':r.key)} title={onPick?(picked===r.key?'Show all':'Filter by this'):undefined}><span className="av-bar-label">{label(r.key)}</span><span className="av-bar-n">{r.n.toLocaleString()}</span><span className="av-bar" style={{width:`${Math.max(4,r.n/max*100)}%`}}/></button></li>)}</ul>:<p className="av-rule-empty">Nothing yet.</p>};
const RANGES:[string,string][]=[['1','Today'],['7','7 days'],['30','30 days'],['90','90 days'],['0','All time']];

// ── Users ───────────────────────────────────────────────────────────────────
export function UsersPanel({email,role,notice}:{email:string;role:string;notice:Notice}){
 const [rows,setRows]=useState<any[]|null>(null),[adding,setAdding]=useState(false),[form,setForm]=useState({email:'',password:'',role:'administrator'}),[reset,setReset]=useState<{email:string;password:string}|null>(null),[busy,setBusy]=useState(false),[pw,setPw]=useState({current:'',password:'',confirm:''});
 const load=()=>request('users').then(setRows).catch(e=>notice(e.message));
 useEffect(()=>{if(role==='owner')load()},[]);// eslint-disable-line react-hooks/exhaustive-deps
 async function act(fn:()=>Promise<unknown>,msg?:string){setBusy(true);try{await fn();if(msg)notice(msg);if(role==='owner')await load()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 const owners=(rows||[]).filter(r=>r.role==='owner'&&r.active).length;
 return <div className="av-users">
  {role==='owner'&&<>
   <div className="vault-card av-traffic-hero on"><span className="av-backup-icon"><Users size={26}/></span><div><h2>{rows?`${rows.length} user${rows.length===1?'':'s'}`:'Users'}</h2><p>Everyone signs in with their own email and password. <strong>Owners</strong> manage users, settings, email, scripts and backups. <strong>Administrators</strong> edit content and work with leads.</p></div>{!adding&&<Button onClick={()=>{setAdding(true);setForm({email:'',password:strongPassword(),role:'administrator'})}}><UserPlus/>Add a user</Button>}</div>
   {adding&&<form className="vault-card av-redirect-form" onSubmit={e=>{e.preventDefault();act(async()=>{await request('users',{email:form.email,password:form.password,role:form.role,active:true});setAdding(false)},`${form.email} can sign in now. Send them their temporary password securely.`)}}>
    <h2>New user</h2>
    <div className="av-route-pair" style={{gridTemplateColumns:'1fr 1fr'}}><label>Email<Input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="name@company.com" autoFocus/></label><label>Temporary password <small>12+ characters, they can change it later</small><div className="av-pw-row"><Password label="Temporary password" value={form.password} set={v=>setForm({...form,password:v})}/><Button type="button" variant="outline" size="sm" onClick={()=>setForm({...form,password:strongPassword()})}><Wand2/>New</Button><Button type="button" variant="outline" size="sm" onClick={()=>navigator.clipboard?.writeText(form.password).then(()=>notice('Password copied.'))}>Copy</Button></div></label></div>
    <fieldset className="av-choice"><legend>Role</legend>{([['administrator','Administrator','Edits pages, blogs and media, and works with leads.'],['owner','Owner','Everything, including users, email, scripts, traffic and backups.']] as const).map(([v,t,d])=><label key={v} className={form.role===v?'selected':''}><input type="radio" checked={form.role===v} onChange={()=>setForm({...form,role:v})}/><strong>{t}</strong><small>{d}</small></label>)}</fieldset>
    <div className="av-form-actions"><Button type="button" variant="outline" onClick={()=>setAdding(false)}>Cancel</Button><Button disabled={busy||form.password.length<12}>Add user</Button></div>
   </form>}
   <section className="vault-card av-table-card">
    {!rows&&<p className="av-empty" role="status">Loading users…</p>}
    {rows&&<div className="av-table av-users-table" role="table" aria-label="Users">
     <div className="av-tr av-th" role="row"><span role="columnheader">User</span><span role="columnheader">Role</span><span role="columnheader">Status</span><span role="columnheader">Last sign-in</span><span role="columnheader"><span className="sr-only">Actions</span></span></div>
     {rows.map(r=>{const me=r.email===email;return <div key={r.email} className="av-user-row">
      <div className={'av-tr'+(r.active?'':' av-row-off')} role="row">
       <span role="cell" className="av-user-cell"><span className="av-avatar lg" aria-hidden="true">{initials(r.email)}</span><span className="av-cell-title"><strong>{r.email}{me&&<em className="av-you">You</em>}</strong><small>Added {r.created_at?new Date(r.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'}</small></span></span>
       <span role="cell"><select className="av-inline-select" value={r.role} disabled={busy||(me&&owners<=1)} aria-label={'Role for '+r.email} onChange={e=>act(()=>request('users',{email:r.email,role:e.target.value}),`${r.email} is now ${e.target.value==='owner'?'an owner':'an administrator'}.`)}><option value="owner">Owner</option><option value="administrator">Administrator</option></select></span>
       <span role="cell">{me?<span className="av-pill av-pill-live">Active</span>:<Switch on={!!r.active} label={'Allow '+r.email+' to sign in'} disabled={busy} set={v=>act(()=>request('users',{email:r.email,active:v}),v?`${r.email} can sign in again.`:`${r.email} can no longer sign in.`)}/>}</span>
       <span role="cell" className="av-muted-cell" title={fullTime(r.last_login_at)}>{ago(r.last_login_at)}</span>
       <span role="cell" className="av-actions-cell">{!me&&<><Button variant="outline" size="sm" disabled={busy} onClick={()=>setReset(reset?.email===r.email?null:{email:r.email,password:strongPassword()})}><KeyRound/>Reset password</Button><Button variant="ghost" size="sm" disabled={busy} onClick={()=>{if(confirm(`Delete ${r.email}? They will be signed out and can’t sign in again.`))act(()=>request('user-delete',{email:r.email}),`${r.email} deleted.`)}}>Delete</Button></>}</span>
      </div>
      {reset?.email===r.email&&<form className="av-inline-panel" onSubmit={e=>{e.preventDefault();act(async()=>{await request('users',{email:r.email,password:reset!.password});setReset(null)},`New password set. ${r.email} has been signed out everywhere.`)}}><label>New password for {r.email}<div className="av-pw-row"><Password label="New password" value={reset!.password} set={v=>setReset({email:r.email,password:v})}/><Button type="button" variant="outline" size="sm" onClick={()=>setReset({email:r.email,password:strongPassword()})}><Wand2/>New</Button><Button type="button" variant="outline" size="sm" onClick={()=>navigator.clipboard?.writeText(reset!.password).then(()=>notice('Password copied.'))}>Copy</Button></div></label><div className="av-form-actions"><Button type="button" variant="outline" size="sm" onClick={()=>setReset(null)}>Cancel</Button><Button size="sm" disabled={busy||reset!.password.length<12}>Set password</Button></div></form>}
     </div>})}
    </div>}
   </section>
  </>}
  <form className="vault-card av-mypw" onSubmit={e=>{e.preventDefault();if(pw.password!==pw.confirm)return notice('The new passwords do not match.');act(async()=>{await request('password',{current:pw.current,password:pw.password});location.href='/avault/login/'})}}>
   <div><h2><KeyRound size={18}/>Your password</h2><p className="muted">Signed in as {email}. Changing it signs you out on every device.</p></div>
   <input type="email" name="username" autoComplete="username" value={email} readOnly hidden/>
   <div className="av-mypw-fields"><label>Current password<Password label="Current password" autoComplete="current-password" value={pw.current} set={v=>setPw({...pw,current:v})}/></label><label>New password <small>12–128 characters</small><Password label="New password" value={pw.password} set={v=>setPw({...pw,password:v})}/></label><label>Repeat new password<Password label="Repeat new password" value={pw.confirm} set={v=>setPw({...pw,confirm:v})}/></label></div>
   <div className="av-form-actions">{pw.password&&pw.confirm&&pw.password!==pw.confirm&&<span className="av-rule-err">The new passwords don’t match.</span>}<Button disabled={busy||!pw.current||pw.password.length<12||pw.password!==pw.confirm}>Change password</Button></div>
  </form>
 </div>;
}

// ── Email ───────────────────────────────────────────────────────────────────
const PROVIDERS=[{k:'gmail',t:'Gmail or Google Workspace',d:'Send from your Google account with an app password.'},{k:'smtp',t:'Other SMTP',d:'Outlook, Zoho, your host’s mail server and others.'},{k:'mailgun',t:'Mailgun',d:'A sending service with your own domain.'}] as const;
export function EmailSetup({role,notice}:{role:string;notice:Notice}){
 const [v,setV]=useState<any>(null),[saved,setSaved]=useState(''),[rev,setRev]=useState(0),[busy,setBusy]=useState(false),[recipient,setRecipient]=useState(''),[tested,setTested]=useState<string|null>(null);
 const clean=(x:any)=>({...x,mailgun:{...x.mailgun,key:''},smtp:{...x.smtp,pass:''}});
 useEffect(()=>{if(role==='owner')request('email-config').then(r=>{const c=clean(r.value);setV(c);setSaved(JSON.stringify(c));setRev(r.revision)}).catch(e=>notice(e.message))},[role]);// eslint-disable-line react-hooks/exhaustive-deps
 if(role!=='owner')return <div className="vault-card"><p>Only owners can change email delivery.</p></div>;
 if(!v)return <p className="vault-card av-empty" role="status">Loading email settings…</p>;
 const dirty=JSON.stringify(v)!==saved,set=(k:string,val:unknown)=>setV((c:any)=>({...c,[k]:val})),sub=(g:'mailgun'|'smtp',k:string,val:unknown)=>setV((c:any)=>({...c,[g]:{...c[g],[k]:val}}));
 const kind=v.provider==='mailgun'?'mailgun':/gmail\.com$|googlemail/i.test(v.smtp.host||'')?'gmail':'smtp';
 const choose=(k:string)=>{if(k==='mailgun')set('provider','mailgun');else setV((c:any)=>({...c,provider:'smtp',smtp:k==='gmail'?{...c.smtp,host:'smtp.gmail.com',port:465}:{...c.smtp,host:/gmail/i.test(c.smtp.host)?'':c.smtp.host}}))};
 const secretSaved=v.provider==='smtp'?v.smtp.passSaved:v.mailgun.keySaved,ready=!!(v.fromAddress&&v.recipients.length&&(secretSaved||(v.provider==='smtp'?v.smtp.pass:v.mailgun.key)));
 async function save(){setBusy(true);try{const r=await request('email-config',{value:v,revision:rev});const c=clean(r.value);setRev(r.revision);setV(c);setSaved(JSON.stringify(c));notice(c.enabled?'Saved. New leads will be emailed.':'Saved. Email is off, so leads are only stored.')}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 async function test(){setBusy(true);setTested(null);try{await request('email-test',{});setTested('ok');notice('Test email accepted. Check the recipients’ inboxes (and spam).')}catch(e){setTested((e as Error).message);notice((e as Error).message)}finally{setBusy(false)}}
 function addRecipient(){const r=recipient.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r))return notice('Enter a valid email address.');if(!v.recipients.includes(r))set('recipients',[...v.recipients,r]);setRecipient('')}
 return <div className="av-email">
  <div className={'vault-card av-traffic-hero'+(v.enabled&&ready?' on':'')}><span className="av-backup-icon"><Mail size={26}/></span><div><h2>{v.enabled?(ready?'Lead emails are on':'Lead emails are on, but setup isn’t finished'):'Lead emails are off'}</h2><p>{v.enabled?`New leads are emailed to ${v.recipients.length||'no'} recipient${v.recipients.length===1?'':'s'}. Every lead is also saved in Leads first, so nothing is lost if an email fails.`:'Leads are saved in Leads, but nobody is emailed. Finish the steps below, send a test, then switch this on.'}</p></div><Switch large on={!!v.enabled} label="Email new leads" set={x=>set('enabled',x)}/></div>
  <section className="vault-card av-step-card"><h3><span className="av-step-num">1</span>How the site sends email</h3><div className="av-gallery-grid">{PROVIDERS.map(p=><button key={p.k} type="button" className={'av-gallery-item'+(kind===p.k?' selected':'')} onClick={()=>choose(p.k)}><strong>{p.t}</strong><small>{p.d}</small></button>)}</div>
   {v.provider==='mailgun'?<div className="av-grid-2"><label>Sending domain<Input value={v.mailgun.domain} onChange={e=>sub('mailgun','domain',e.target.value)} placeholder="mg.yourdomain.com"/></label><label>Region<select className="av-select" value={v.mailgun.region} onChange={e=>sub('mailgun','region',e.target.value)}><option value="us">United States (api.mailgun.net)</option><option value="eu">Europe (api.eu.mailgun.net)</option></select></label><label className="span-2">Sending API key {v.mailgun.keySaved&&<small className="av-saved"><CircleCheck size={13}/>Saved. Leave blank to keep it</small>}<Password label="Mailgun key" value={v.mailgun.key} set={x=>sub('mailgun','key',x)} placeholder={v.mailgun.keySaved?'••••••••••••':'key-…'}/></label></div>
   :<>{kind==='gmail'&&<p className="av-hint-box">Use your full Gmail address as the username, and an <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">app password</a> (not your normal password). The server and port are filled in for you.</p>}
    <div className="av-grid-2">{kind!=='gmail'&&<><label>Server<Input value={v.smtp.host} onChange={e=>sub('smtp','host',e.target.value)} placeholder="smtp.office365.com"/></label><label>Port<select className="av-select" value={v.smtp.port} onChange={e=>sub('smtp','port',+e.target.value)}><option value={465}>465 (SSL)</option><option value={587}>587 (STARTTLS)</option><option value={2525}>2525</option><option value={25}>25</option></select></label></>}<label>Username<Input value={v.smtp.user} onChange={e=>sub('smtp','user',e.target.value)} autoComplete="off" placeholder={kind==='gmail'?'you@gmail.com':''}/></label><label>{kind==='gmail'?'App password':'Password'} {v.smtp.passSaved&&<small className="av-saved"><CircleCheck size={13}/>Saved. Leave blank to keep it</small>}<Password label="SMTP password" value={v.smtp.pass} set={x=>sub('smtp','pass',x)} placeholder={v.smtp.passSaved?'••••••••••••':''}/></label></div></>}
   <p className="av-attrib">Keys and passwords are encrypted and never shown again after saving.</p>
  </section>
  <section className="vault-card av-step-card"><h3><span className="av-step-num">2</span>Who it’s from and who gets it</h3>
  <div className="av-grid-2"><label>Sender name<Input value={v.senderName} onChange={e=>set('senderName',e.target.value)} placeholder="AROZ Webdesign Agentur"/></label><label>From address <small>must be allowed by the provider</small><Input type="email" value={v.fromAddress} onChange={e=>set('fromAddress',e.target.value)} placeholder={kind==='gmail'?v.smtp.user||'you@gmail.com':'no-reply@yourdomain.com'}/></label></div>
   <label className="av-label">Send lead emails to</label>
   <form className="av-rule-add" onSubmit={e=>{e.preventDefault();addRecipient()}}><Input type="email" value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="service@yourdomain.com" aria-label="Add a recipient"/><Button type="submit" variant="outline" size="sm">Add</Button></form>
   {v.recipients.length?<ul className="av-chips-list">{v.recipients.map((r:string)=><li key={r}><span>{r}</span><button type="button" aria-label={'Remove '+r} onClick={()=>set('recipients',v.recipients.filter((x:string)=>x!==r))}><X size={13}/></button></li>)}</ul>:<p className="av-rule-err">Add at least one recipient.</p>}
   <details className="av-media-more"><summary><ChevronDown size={15}/>Reply-to for test emails</summary><p>Lead emails always reply to the person who sent the form. This address is only used for test emails.</p><Input type="email" value={v.replyTo} onChange={e=>set('replyTo',e.target.value)} placeholder="optional"/></details>
  </section>
  <section className="vault-card av-step-card"><h3><span className="av-step-num">3</span>Send a test</h3><p className="muted">{dirty?'Save your changes first, then send a test to every recipient.':'Sends a short test email to every recipient using the saved settings. It works even while lead emails are off.'}</p>
   <div className="actions"><Button variant="outline" disabled={busy||dirty||!ready} onClick={test}><Send/>{busy?'Sending…':'Send a test email'}</Button>{tested==='ok'&&<span className="av-verified"><CircleCheck size={16}/>Accepted by the provider</span>}{tested&&tested!=='ok'&&<span className="av-rule-err">{tested}</span>}</div>
   <p className="av-attrib">If a lead email fails, it is retried automatically up to 5 times. Failures show on System health and in each lead.</p>
  </section>
  <SaveBar dirty={dirty} busy={busy} discard={()=>setV(JSON.parse(saved))} save={save} label="Save email settings"/>
 </div>;
}

// ── Site settings ───────────────────────────────────────────────────────────
const SOCIALS:[string,string][]=[['facebook','Facebook'],['instagram','Instagram'],['linkedin','LinkedIn'],['x','X (Twitter)'],['youtube','YouTube'],['tiktok','TikTok'],['pinterest','Pinterest']];
const DAYS=['Mo','Tu','We','Th','Fr','Sa','Su'],DAY_NAME:Record<string,string>={Mo:'Monday',Tu:'Tuesday',We:'Wednesday',Th:'Thursday',Fr:'Friday',Sa:'Saturday',Su:'Sunday'};
type Day={open:boolean;from:string;to:string};
function parseHours(lines:string[]):Record<string,Day>{const out:Record<string,Day>=Object.fromEntries(DAYS.map(d=>[d,{open:false,from:'09:00',to:'17:00'}]));
 for(const l of lines){const m=String(l).trim().match(/^([A-Za-z,-]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);if(!m)continue;for(const part of m[1].split(',')){const [a,b]=part.split('-');const i=DAYS.indexOf(a),j=b?DAYS.indexOf(b):i;if(i<0||j<0)continue;for(let k=i;k<=j;k++)out[DAYS[k]]={open:true,from:m[2],to:m[3]}}}return out}
// Consecutive days with the same times collapse into one line, e.g. "Mo-Fr 09:00-17:00".
function formatHours(h:Record<string,Day>){const lines:string[]=[];let i=0;while(i<7){const d=h[DAYS[i]];if(!d.open){i++;continue}let j=i;while(j+1<7&&h[DAYS[j+1]].open&&h[DAYS[j+1]].from===d.from&&h[DAYS[j+1]].to===d.to)j++;lines.push(`${DAYS[i]}${j>i?'-'+DAYS[j]:''} ${d.from}-${d.to}`);i=j+1}return lines}
export function SettingsForm({role,notice}:{role:string;notice:Notice}){
 const [v,setV]=useState<any>(null),[saved,setSaved]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{request('settings').then(r=>{setV(r);setSaved(JSON.stringify(r))}).catch(e=>notice(e.message))},[]);// eslint-disable-line react-hooks/exhaustive-deps
 const hours=useMemo(()=>v?parseHours(v.hours||[]):null,[v]);
 if(!v||!hours)return <p className="vault-card av-empty" role="status">Loading settings…</p>;
 const owner=role==='owner',dirty=JSON.stringify(v)!==saved;
 const set=(k:string,val:unknown)=>setV((c:any)=>({...c,[k]:val})),sub=(g:string,k:string,val:unknown)=>setV((c:any)=>({...c,[g]:{...c[g],[k]:val}}));
 const setDay=(d:string,p:Partial<Day>)=>set('hours',formatHours({...hours,[d]:{...hours[d],...p}}));
 const field=(k:string,label:string,hint?:string,ph?:string)=><label key={k}>{label}{hint&&<small>{hint}</small>}<Input value={v[k]||''} onChange={e=>set(k,e.target.value)} placeholder={ph} disabled={!owner}/></label>;
 async function uploadSetting(file:File,key:'logo'|'image'){setBusy(true);try{const form=new FormData();form.set('file',file);form.set('alt',key==='logo'?v.name+' logo':v.name+' default sharing image');const r=await adminFetch('media/',{method:'POST',body:form}),data=await r.json();if(!r.ok)throw new Error(data.error||'Upload failed');set(key,data.url);notice(`${key==='logo'?'Logo':'Sharing image'} uploaded. Save settings to publish it.`)}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 async function save(){setBusy(true);try{const r=await request('settings',v);const next={...v,revision:r.revision};setV(next);setSaved(JSON.stringify(next));notice('Settings saved. Every page, contact link and the schema use them now.')}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 const titlePreview=(v.titleTemplate||'%s | AROZ Webdesign Agentur').replace('%s','Webdesign');
 const local=v.businessType!=='Organization'&&v.businessType!=='Corporation';
 return <div className="av-settings">
  {!owner&&<p className="av-traffic-warn">Only owners can change site settings. You can view them here.</p>}
  <section className="vault-card av-set-card"><h3><Building2 size={18}/>Business identity</h3>
   <div className="av-grid-2">{field('name','Business name')}{field('legalName','Legal name','Used in schema if different.','')}{field('tagline','Tagline')}<label>Business type <small>how search engines describe you</small><select className="av-select" value={v.businessType} onChange={e=>set('businessType',e.target.value)} disabled={!owner}><option value="Organization">Online / nationwide service</option><option value="ProfessionalService">Professional service with an office</option><option value="LocalBusiness">Local business</option><option value="Corporation">Corporation</option></select></label><label>Logo<Input value={v.logo||''} onChange={e=>set('logo',e.target.value)} disabled={!owner}/>{owner&&<span className="av-upload-control"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const f=e.target.files?.[0];if(f)uploadSetting(f,'logo')}}/><small>Upload a new logo or choose an existing media URL.</small></span>}</label><label>Default sharing image <small>Used when a page has no social image.</small><Input value={v.image||''} onChange={e=>set('image',e.target.value)} disabled={!owner}/>{owner&&<span className="av-upload-control"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const f=e.target.files?.[0];if(f)uploadSetting(f,'image')}}/><small>Upload the photo used by social and search previews.</small></span>}</label></div>
  </section>
  <section className="vault-card av-set-card"><h3><Phone size={18}/>Contact</h3><p className="muted">Changing these updates the phone number, tel: links and email address on every page.</p>
  <div className="av-grid-3">{field('phone','Phone')}{field('email','Email')}{field('areaServed','Area served','','Schwelm, Nordrhein-Westfalen')}</div>
  </section>
  <section className="vault-card av-set-card"><h3><MapPin size={18}/>Address & map</h3><p className="muted">Leave blank if customers don’t visit you. Shown on the contact page and in schema.</p>
   <div className="av-grid-2"><label className="span-2">Street address<Input value={v.address.street||''} onChange={e=>sub('address','street',e.target.value)} disabled={!owner}/></label>{([['city','City'],['region','State'],['postalCode','ZIP code'],['country','Country code']] as const).map(([k,l])=><label key={k}>{l}<Input value={v.address[k]||''} onChange={e=>sub('address',k,e.target.value)} disabled={!owner} placeholder={k==='country'?'US':''}/></label>)}<label className="span-2">Google Business Profile / Maps link<Input value={v.mapUrl||''} onChange={e=>set('mapUrl',e.target.value)} placeholder="https://maps.app.goo.gl/…" disabled={!owner}/></label></div>
   <details className="av-media-more"><summary><ChevronDown size={15}/>Map coordinates (optional)</summary><div className="av-grid-2"><label>Latitude<Input value={v.geo.lat||''} onChange={e=>sub('geo','lat',e.target.value)} disabled={!owner}/></label><label>Longitude<Input value={v.geo.lng||''} onChange={e=>sub('geo','lng',e.target.value)} disabled={!owner}/></label></div></details>
  </section>
  <section className="vault-card av-set-card"><h3><Clock size={18}/>Opening hours</h3><p className="muted">Shown on the contact page{local?' and in schema':''}.{!local&&' Search engines only use hours for businesses with an office, so switch the business type if you want them in schema.'}</p>
   <ul className="av-hours">{DAYS.map(d=>{const h=hours[d];return <li key={d} className={h.open?'':'closed'}><strong>{DAY_NAME[d]}</strong><Switch on={h.open} label={DAY_NAME[d]+' open'} disabled={!owner} set={x=>setDay(d,{open:x})}/>{h.open?<span className="av-hours-times"><Input type="time" aria-label={DAY_NAME[d]+' opens'} value={h.from} onChange={e=>setDay(d,{from:e.target.value})} disabled={!owner}/><span>to</span><Input type="time" aria-label={DAY_NAME[d]+' closes'} value={h.to} onChange={e=>setDay(d,{to:e.target.value})} disabled={!owner}/></span>:<span className="av-muted-cell">Closed</span>}</li>})}</ul>
   {owner&&<div className="actions"><Button type="button" variant="outline" size="sm" onClick={()=>set('hours',formatHours(Object.fromEntries(DAYS.map((d,i)=>[d,{open:i<5,from:hours.Mo.open?hours.Mo.from:'09:00',to:hours.Mo.open?hours.Mo.to:'17:00'}]))))}>Copy Monday to weekdays</Button>{local&&field('priceRange','Price range','','$$')}</div>}
  </section>
  <section className="vault-card av-set-card"><h3><Share2 size={18}/>Social profiles</h3><p className="muted">Links to these networks across the site point here, and search engines learn these profiles belong to you.</p>
   <div className="av-grid-2">{SOCIALS.map(([k,l])=><label key={k}>{l}<Input value={v.socials[k]||''} onChange={e=>sub('socials',k,e.target.value)} placeholder={`https://${k==='x'?'x':k}.com/…`} disabled={!owner}/></label>)}</div>
  </section>
  <section className="vault-card av-set-card"><h3><Search size={18}/>Search appearance</h3><p className="muted">Used when a page doesn’t set its own title or description.</p>
  <div className="av-grid-2"><label>Title template <small>%s is the page name</small><Input value={v.titleTemplate||''} onChange={e=>set('titleTemplate',e.target.value)} placeholder="%s | AROZ Webdesign Agentur" disabled={!owner}/></label><label>Default description <small>{(v.defaultDescription||'').length}/160</small><Textarea rows={3} value={v.defaultDescription||''} onChange={e=>set('defaultDescription',e.target.value)} disabled={!owner}/></label></div>
   <div className="av-serp" aria-label="Search result preview"><small>{(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000').replace(/^https?:\/\//,'')} › commercial-door-repair</small><strong>{titlePreview}</strong><p>{v.defaultDescription||'Your default description appears here.'}</p></div>
  </section>
  {owner&&<SaveBar dirty={dirty} busy={busy} discard={()=>setV(JSON.parse(saved))} save={save} label="Save settings"/>}
 </div>;
}

// ── Visitors ────────────────────────────────────────────────────────────────
const dur=(a:string,b:string)=>{const s=Math.max(0,Math.round((Date.parse(b)-Date.parse(a))/1000));return s<60?`${s}s`:s<3600?`${Math.floor(s/60)}m ${s%60}s`:`${Math.floor(s/3600)}h ${Math.floor(s%3600/60)}m`};
const host=(u:string)=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch{return u||'Direct'}};
function Journey({events}:{events:any[]}){if(!events.length)return <p className="av-rule-empty">No steps recorded.</p>;const start=events[0].created_at;
 return <ol className="av-journey">{events.map(e=>{const kind=e.type==='call'?'call':e.type==='form'?'form':e.type==='page'?'page':e.type==='click'?'click':'other';
  const text=e.type==='page'?<>Viewed <strong>{e.page}</strong>{e.title&&<small>{e.title}</small>}{e.referrer&&<small>Arrived from {host(e.referrer)}</small>}</>:e.type==='leave'?<>Spent {dur(new Date(0).toISOString(),new Date((e.seconds||0)*1000).toISOString())} on {e.page}</>:e.type==='click'?<>Clicked “{e.label||'link'}”{e.href&&<small>{e.href}</small>}</>:e.type==='form'?<><strong>Sent a form</strong><small>on {e.page}</small></>:e.type==='call'?<><strong>Tapped to call {e.target}</strong><small>on {e.page}</small></>:<>{e.type}</>;
  return <li key={e.id} className={kind}><time>+{dur(start,e.created_at)}</time><span className="av-journey-dot"/><div>{text}</div></li>})}</ol>}
const device=(b:any)=>b?[b.name,b.os,b.device].filter(Boolean).join(' · '):'';
export function VisitorsView({notice}:{notice:Notice}){
 const [range,setRange]=useState('7'),[country,setCountry]=useState(''),[group,setGroup]=useState('session'),[q,setQ]=useState(''),[page,setPage]=useState(0),[rows,setRows]=useState<any[]|null>(null),[sum,setSum]=useState<any>(null),[live,setLive]=useState<any[]>([]),[open,setOpen]=useState<{key:string;events:any[]|null}|null>(null);
 const params=`range=${range}&country=${country}`;
 useEffect(()=>{setSum(null);request('visitors-summary?'+params).then(setSum).catch(e=>notice(e.message))},[range,country]);// eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{const t=setTimeout(()=>request(`visitors?page=${page}&group=${group}&q=${encodeURIComponent(q)}&${params}`).then(setRows).catch(e=>notice(e.message)),q?300:0);return()=>clearTimeout(t)},[page,q,group,range,country]);// eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{const load=()=>request('presence').then(setLive).catch(()=>{});load();const t=setInterval(load,30000);return()=>clearInterval(t)},[]);
 async function toggle(r:any){if(open?.key===r.key)return setOpen(null);setOpen({key:r.key,events:null});try{setOpen({key:r.key,events:await request(group==='session'?'journey?session='+encodeURIComponent(r.session):'journey?visitor='+encodeURIComponent(r.visitor))})}catch(e){notice((e as Error).message)}}
 const tiles:[string,string|number,typeof Activity][]= [['Visits',sum?.visits??'–',Activity],['Visitors',sum?.visitors??'–',Users],['Page views',sum?.views??'–',FileText],['Leads sent',sum?.forms??'–',Inbox],['Call taps',sum?.calls??'–',Phone]];
 return <div className="av-visitors">
  <div className="av-range-bar"><div className="av-seg av-seg-wrap" role="tablist" aria-label="Time range">{RANGES.map(([k,l])=><button key={k} type="button" role="tab" aria-selected={range===k} className={range===k?'selected':''} onClick={()=>{setRange(k);setPage(0)}}>{l}</button>)}</div>{country&&<button type="button" className="av-filter-chip" onClick={()=>setCountry('')}>{regionName(country)}<X size={13}/></button>}<span className="av-live"><i/>{live.length} on the site now</span></div>
  <div className="av-stat-row">{tiles.map(([l,n,I])=><div key={l} className="vault-card av-kpi"><I size={18}/><strong>{typeof n==='number'?n.toLocaleString():n}</strong><span>{l}</span></div>)}</div>
  <div className="av-insights">
   <section className="vault-card"><h3><Globe size={16}/>Countries</h3><Bars rows={sum?.countries||[]} label={regionName} onPick={c=>{setCountry(c);setPage(0)}} picked={country}/></section>
   <section className="vault-card"><h3><FileText size={16}/>Most viewed pages</h3><Bars rows={sum?.pages||[]} label={k=>k}/></section>
   <section className="vault-card"><h3><MousePointerClick size={16}/>Where they came from</h3><Bars rows={sum?.sources||[]} label={k=>k==='Direct'?'Direct / unknown':k}/></section>
  </div>
  <section className="vault-card av-table-card">
   <div className="av-table-tools"><div className="av-seg av-seg-wrap" role="tablist" aria-label="Group by">{([['session','Each visit'],['visitor','Each visitor'],['ip','Each IP']] as const).map(([k,l])=><button key={k} type="button" role="tab" aria-selected={group===k} className={group===k?'selected':''} onClick={()=>{setGroup(k);setPage(0);setOpen(null)}}>{l}</button>)}</div><label className="av-find"><Search size={16} aria-hidden="true"/><Input aria-label="Search visitors" placeholder="IP address, visitor or session ID…" value={q} onChange={e=>{setQ(e.target.value);setPage(0)}}/></label><button type="button" className="av-link" onClick={()=>{setRows(null);request(`visitors?page=${page}&group=${group}&q=${encodeURIComponent(q)}&${params}`).then(setRows)}}><RefreshCw size={14}/>Refresh</button></div>
   {!rows&&<p className="av-empty" role="status">Loading visits…</p>}
   {rows&&!rows.length&&<p className="av-empty">No visits in this range yet.</p>}
   {rows&&rows.length>0&&<div className="av-table av-visit-table" role="table" aria-label="Visits">
    <div className="av-tr av-th" role="row"><span role="columnheader">Visitor</span><span role="columnheader">Landed on</span><span role="columnheader">Activity</span><span role="columnheader">Time on site</span><span role="columnheader">When</span></div>
    {rows.map(r=><div key={r.key} className={'av-visit'+(open?.key===r.key?' open':'')}>
     <div className="av-tr av-row-link" role="row" onClick={()=>toggle(r)}>
      <span role="cell" className="av-cell-title"><strong>{regionName(r.country)}</strong><small>{r.ip||'unknown IP'}{device(r.browser)?' · '+device(r.browser):''}</small></span>
      <span role="cell" className="av-cell-title"><strong className="av-ellipsis">{r.landing||'(no page view)'}</strong><small>from {r.referrer?host(r.referrer):'direct / unknown'}</small></span>
      <span role="cell" className="av-muted-cell"><span>{r.views} page{r.views===1?'':'s'} · {r.clicks||0} click{r.clicks===1?'':'s'}{group!=='session'?` · ${r.sessions} visit${r.sessions===1?'':'s'}`:''}</span><span className="av-chips">{r.forms>0&&<span className="av-pill av-pill-spam">Sent a lead</span>}{r.calls>0&&<span className="av-pill av-pill-live">Tapped to call</span>}</span></span>
      <span role="cell" className="av-muted-cell">{dur(r.first,r.last)}</span>
      <span role="cell" className="av-muted-cell" title={fullTime(r.first)}>{ago(r.last)}</span>
     </div>
    </div>)}
   </div>}
   {rows&&(page>0||rows.length>=50)&&<div className="av-table-foot av-pager"><span>Page {page+1}</span><span className="actions"><Button variant="outline" size="sm" disabled={!page} onClick={()=>setPage(page-1)}>Newer</Button><Button variant="outline" size="sm" disabled={rows.length<50} onClick={()=>setPage(page+1)}>Older</Button></span></div>}
  </section>
  {open&&<section className="vault-card av-journey-panel" aria-label="Selected visitor journey"><header><div><p className="eyebrow">Visitor detail</p><h2>Their journey, step by step</h2><p className="muted">Every recorded page, click, form and call during this visit.</p></div><Button variant="outline" size="sm" onClick={()=>setOpen(null)}><X/>Close</Button></header>{open.events?<Journey events={open.events}/>:<p className="av-rule-empty">Loading the journey…</p>}</section>}
 </div>;
}

// ── Calls ───────────────────────────────────────────────────────────────────
export function CallsView({notice}:{notice:Notice}){
 const [range,setRange]=useState('30'),[country,setCountry]=useState(''),[page,setPage]=useState(0),[rows,setRows]=useState<any[]|null>(null),[sum,setSum]=useState<any>(null),[open,setOpen]=useState<{id:string;events:any[]|null}|null>(null);
 const params=`range=${range}&country=${country}`;
 useEffect(()=>{request('calls-summary?'+params).then(setSum).catch(e=>notice(e.message))},[range,country]);// eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{setRows(null);request(`calls?page=${page}&${params}`).then(setRows).catch(e=>notice(e.message))},[page,range,country]);// eslint-disable-line react-hooks/exhaustive-deps
 async function toggle(r:any){if(open?.id===r.id)return setOpen(null);setOpen({id:r.id,events:null});try{setOpen({id:r.id,events:await request('journey?session='+encodeURIComponent(r.session))})}catch(e){notice((e as Error).message)}}
 return <div className="av-visitors">
  <div className="av-stat-row av-stat-4">{([['Today',sum?.today],['Last 7 days',sum?.week],['Last 30 days',sum?.month],['All time',sum?.total]] as const).map(([l,n])=><div key={l} className="vault-card av-kpi"><Phone size={18}/><strong>{n??'–'}</strong><span>{l}</span></div>)}</div>
  <div className="av-range-bar"><div className="av-seg av-seg-wrap" role="tablist" aria-label="Time range">{RANGES.map(([k,l])=><button key={k} type="button" role="tab" aria-selected={range===k} className={range===k?'selected':''} onClick={()=>{setRange(k);setPage(0)}}>{l}</button>)}</div>{country&&<button type="button" className="av-filter-chip" onClick={()=>setCountry('')}>{regionName(country)}<X size={13}/></button>}<span className="av-attrib">Recorded when a visitor taps a phone number on the website.</span></div>
  <div className="av-insights">
   <section className="vault-card"><h3><Phone size={16}/>Numbers tapped</h3><Bars rows={sum?.numbers||[]} label={k=>k}/></section>
   <section className="vault-card"><h3><FileText size={16}/>Pages that bring calls</h3><Bars rows={sum?.pages||[]} label={k=>k}/></section>
   <section className="vault-card"><h3><Globe size={16}/>Caller countries</h3><Bars rows={sum?.countries||[]} label={regionName} onPick={c=>{setCountry(c);setPage(0)}} picked={country}/></section>
  </div>
  <section className="vault-card av-table-card">
   {!rows&&<p className="av-empty" role="status">Loading calls…</p>}
   {rows&&!rows.length&&<p className="av-empty">No call taps in this range.</p>}
   {rows&&rows.length>0&&<div className="av-table av-call-table" role="table" aria-label="Call taps">
    <div className="av-tr av-th" role="row"><span role="columnheader">Number</span><span role="columnheader">From page</span><span role="columnheader">Caller</span><span role="columnheader">When</span></div>
    {rows.map(r=><div key={r.id} className={'av-visit'+(open?.id===r.id?' open':'')}>
     <div className="av-tr av-row-link" role="row" onClick={()=>toggle(r)} title="Show this visitor’s journey">
      <span role="cell" className="av-cell-title"><strong>{r.target||'Phone link'}</strong><small>Tap to call</small></span>
      <span role="cell" className="av-cell-title"><strong className="av-ellipsis">{r.page||'—'}</strong></span>
      <span role="cell" className="av-cell-title"><strong>{regionName(r.country)}</strong><small>{r.ip||'unknown IP'}{device(r.browser)?' · '+device(r.browser):''}</small></span>
      <span role="cell" className="av-muted-cell" title={fullTime(r.created_at)}>{ago(r.created_at)}</span>
     </div>
     {open?.id===r.id&&<div className="av-inline-panel"><p className="av-label">Their visit, step by step</p>{open?.events?<Journey events={open.events}/>:<p className="av-rule-empty">Loading…</p>}</div>}
    </div>)}
   </div>}
   {rows&&(page>0||rows.length>=50)&&<div className="av-table-foot av-pager"><span>Page {page+1}</span><span className="actions"><Button variant="outline" size="sm" disabled={!page} onClick={()=>setPage(page-1)}>Newer</Button><Button variant="outline" size="sm" disabled={rows.length<50} onClick={()=>setPage(page+1)}>Older</Button></span></div>}
  </section>
 </div>;
}
