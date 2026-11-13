'use client';
import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Database,Mail,CalendarClock,DatabaseBackup,Inbox,RefreshCw,Play,ArrowRight,CircleCheck,TriangleAlert,CircleAlert} from 'lucide-react';
import {request} from './content-tools';

// AVAULT → System health: one card per service, an overall banner, and what the last scheduled run did.
type Check={id:string;title:string;status:'ok'|'warn'|'bad';value:string;detail:string;extra?:string;view?:string};
const ICON:Record<string,typeof Database>={database:Database,email:Mail,scheduler:CalendarClock,backups:DatabaseBackup,leads:Inbox};
const LABEL={ok:'Working',warn:'Needs a look',bad:'Action needed'};
const stamp=(s:string)=>s.replace(/(\d{4}-\d{2}-\d{2}T[\d:.]+Z)/,iso=>{const d=new Date(iso),m=Math.round((Date.now()-d.getTime())/60000);return m<1?'just now':m<60?`${m} min ago`:m<1440?`${Math.round(m/60)} h ago`:d.toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})});
const uptime=(s:number)=>s<3600?`${Math.round(s/60)} min`:s<86400?`${Math.round(s/3600)} h`:`${Math.round(s/86400)} days`;

export function HealthPanel({role,notice,go}:{role:string;notice:(s:string)=>void;go:(view:string)=>void}){
 const [d,setD]=useState<any>(null),[busy,setBusy]=useState(false);
 const load=()=>request('health').then(setD).catch(e=>notice(e.message));
 useEffect(()=>{load()},[]);// eslint-disable-line react-hooks/exhaustive-deps
 async function run(){setBusy(true);try{const r=await request('maintenance',{});notice(`Maintenance finished${r.published?.length?`: ${r.published.length} post(s) published`:''}.`);await load()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 if(!d)return <p role="status" className="vault-card av-empty">Checking every service…</p>;
 const checks:Check[]=d.checks||[],bad=checks.filter(c=>c.status==='bad').length,warn=checks.filter(c=>c.status==='warn').length;
 const overall=bad?'bad':warn?'warn':'ok',r=d.lastResults;
 return <div className="av-health">
  <div className={'vault-card av-health-banner '+overall}>
   {overall==='ok'?<CircleCheck size={28}/>:overall==='warn'?<TriangleAlert size={28}/>:<CircleAlert size={28}/>}
   <div><h2>{overall==='ok'?'Everything is working':`${bad+warn} thing${bad+warn===1?' needs':'s need'} attention`}</h2><p>{d.site.replace(/^https?:\/\//,'')} · server up {uptime(d.uptime)} · Node {d.node}</p></div>
   <div className="av-health-actions"><Button variant="outline" onClick={()=>{setD(null);load()}}><RefreshCw/>Check again</Button>{role==='owner'&&<Button disabled={busy} onClick={run}><Play/>{busy?'Running…':'Run maintenance now'}</Button>}</div>
  </div>
  <div className="av-health-grid">{checks.map(c=>{const I=ICON[c.id]||Database;return <article key={c.id} className={'vault-card av-health-card '+c.status}>
   <div className="av-health-top"><span className="av-health-icon"><I size={20}/></span><span className={'av-health-status '+c.status}>{LABEL[c.status]}</span></div>
   <h3>{c.title}</h3><strong>{c.value}</strong><p>{c.detail}</p>{c.extra&&<small>{stamp(c.extra)}</small>}
   {c.view&&<button type="button" className="av-link" onClick={()=>go(c.view!)}>{c.id==='email'?'Open email settings':c.id==='backups'?'Open backups':'Open leads'}<ArrowRight size={14}/></button>}
  </article>})}</div>
  <section className="vault-card av-health-last"><h2>Last scheduled run</h2>{!d.lastRun?<p className="muted">No run recorded yet.</p>:<><p className="muted">{stamp(d.lastRun)}</p><ul>
   <li><b>{r?.published?.length||0}</b> scheduled post{r?.published?.length===1?'':'s'} published</li>
   <li><b>{r?.failed?.length||0}</b> post{r?.failed?.length===1?'':'s'} that couldn’t publish{r?.failed?.length?': '+r.failed.map((f:any)=>f.route).join(', '):''}</li>
   <li><b>{r?.conflicts?.length||0}</b> skipped because the draft changed after scheduling</li>
   <li><b>{r?.backup?'1':'0'}</b> backup created</li></ul></>}</section>
 </div>;
}
