import {settingsRead} from '@/lib/avault/runtime';
import {countryOf} from '@/lib/avault/geo';
import {sameOrigin,body,db,id,now,json,failure,HttpError,clientIp} from '@/lib/avault/store';
import {mongoDb} from '@/db/mongo';
const TYPES=['page','leave','click','form','call','heartbeat'];
// Rough browser/device label for the Visitors screen; the raw user agent is kept alongside it.
function browser(ua:string){const name=/Edg\//.test(ua)?'Edge':/OPR\/|Opera/.test(ua)?'Opera':/SamsungBrowser/.test(ua)?'Samsung Internet':/Firefox\//.test(ua)?'Firefox':/Chrome\//.test(ua)?'Chrome':/Safari\//.test(ua)?'Safari':'Other';const device=/iPad|Tablet/i.test(ua)?'tablet':/Mobi|Android|iPhone/i.test(ua)?'mobile':'desktop';const os=/Windows/.test(ua)?'Windows':/Mac OS X/.test(ua)&&!/iPhone|iPad/.test(ua)?'macOS':/iPhone|iPad/.test(ua)?'iOS':/Android/.test(ua)?'Android':/Linux/.test(ua)?'Linux':'';return {name,device,os}}
const BOT=/bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|curl|wget|python|axios/i;
const clip=(v:unknown,n:number)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,n);
export async function POST(req:Request){try{sameOrigin(req);
 // Recording is on unless an owner switches it off under Privacy & tracking.
 const c=(await settingsRead('operations')).value;if(c.analytics===false)return json({accepted:false});
 if(req.headers.get('sec-gpc')==='1')return json({accepted:false});
 // The site team's own browsing (signed in to AVAULT) is not counted as visitor traffic.
 if(/(?:^|;\s*)avault_session=/.test(req.headers.get('cookie')||''))return json({accepted:false});
 const ua=String(req.headers.get('user-agent')||'').slice(0,400);if(!ua||BOT.test(ua))return json({accepted:false});
 const b=await body(req,4000);
 if(!TYPES.includes(b.type)||!/^[a-f0-9-]{36}$/.test(b.session)||(b.visitor&&!/^[a-f0-9-]{36}$/.test(b.visitor)))throw new HttpError(422,'Invalid event.');
 let page;try{page=new URL(b.page,new URL(req.url).origin).pathname}catch{throw new HttpError(422,'Invalid page.')}if(page.startsWith('/avault')||page.startsWith('/api/'))return json({accepted:false});
 const ip=clientIp(req);const securityKey=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip+Math.floor(Date.now()/3600000)));const securityId='security:'+Array.from(new Uint8Array(securityKey)).map(n=>n.toString(16).padStart(2,'0')).join('');const ipCount=await db().prepare('INSERT INTO rate_limits(id,count,expires) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(securityId,Date.now()+3600000).first<{count:number}>();if((ipCount?.count||0)>2000)throw new HttpError(429,'Too many requests.');const minute=Math.floor(Date.now()/60000),rate='event:'+b.session+':'+minute;const count=await db().prepare('INSERT INTO rate_limits(id,count,expires) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(rate,Date.now()+120000).first<{count:number}>();if((count?.count||0)>60)throw new HttpError(429,'Too many events.');
 let referrer='';try{const r=new URL(String(b.referrer||''));referrer=r.origin===new URL(req.url).origin||r.origin===new URL(String(req.headers.get('origin'))).origin?'':r.origin+r.pathname}catch{}
 const value:Record<string,unknown>={page:page.slice(0,300)};
 if(referrer)value.referrer=referrer.slice(0,300);if(b.type==='page'&&b.title)value.title=clip(b.title,120);
 if(b.type==='call')value.target=String(b.target||'').replace(/[^+0-9]/g,'').slice(0,20);
 if(b.type==='click'||b.type==='call'||b.type==='form')value.label=clip(b.label,90);if(b.type==='click'&&b.href)value.href=clip(b.href,300);
 if(b.type==='leave')value.seconds=Math.max(0,Math.min(86400,Math.round(Number(b.seconds)||0)));
 await (await mongoDb()).collection('events').insertOne({id:id(),type:b.type,session:b.session,visitor:b.visitor||b.session,value:JSON.stringify(value),created_at:now(),ip,user_agent:ua,browser:browser(ua),country:countryOf(req,ip)});
 return json({accepted:true})}catch(e){return failure(e)}}
