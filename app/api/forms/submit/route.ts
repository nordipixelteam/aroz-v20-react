import {deliverForm} from '@/lib/avault/email';
import {sameOrigin,body,id,now,json,failure,HttpError,clientIp} from '@/lib/avault/store';
import {HONEYPOT,verifyFormToken,enforceLimits,contentFlags} from '@/lib/avault/spam';
import {mongoDb} from '@/db/mongo';
import {settingsRead} from '@/lib/avault/runtime';
import {extraValues} from '@/lib/avault/forms';
import {countryOf} from '@/lib/avault/geo';
const UTM=['utm_source','utm_medium','utm_campaign','utm_term','utm_content'] as const;
const OK='Vielen Dank. Ihre Projektanfrage wurde sicher übermittelt.';
export async function POST(req:Request){try{sameOrigin(req);const b=await body(req,12000);
 // Honeypot: a hidden field people never see. Bots that fill it get a normal-looking reply and nothing is stored.
 if(b[HONEYPOT])return json({ok:true,message:OK});
 // A signed, single-use token from /api/forms/token proves the form was loaded in a browser on this site.
 const token=await verifyFormToken(b.token),age=token.age;
 if(typeof b.name!=='string'||b.name.trim().length<2||b.name.length>150)throw new HttpError(422,'Bitte geben Sie Ihren Namen ein.');
 if(typeof b.email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)||b.email.length>250)throw new HttpError(422,'Bitte geben Sie eine gültige E-Mail-Adresse ein.');
 const phone=String(b.phone||'').trim().slice(0,40);if(phone&&phone.replace(/\D/g,'').length<7)throw new HttpError(422,'Bitte prüfen Sie Ihre Telefonnummer.');
 const website=String(b.website||'').trim().slice(0,500);if(website&&!/^(?:https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}(?:[/:?#][^\s]*)?$/i.test(website))throw new HttpError(422,'Bitte prüfen Sie die Website-Adresse.');
 const service=String(b.service||'').trim().slice(0,200);
 const details=[b.message,b.project,b.details,b.notes].map(value=>String(value||'').trim()).filter(Boolean).join('\n\n').slice(0,3000);
 let extra:Record<string,string>;try{extra=extraValues(b,(await settingsRead('forms')).value)}catch(e){throw new HttpError(422,(e as Error).message)}
 // The token is used up only now, so a submission rejected above can be corrected and sent again.
 await token.consume();
 const ip=clientIp(req);await enforceLimits(ip,String(b.email||b.phone).trim());
 const page=String(b.page||'').slice(0,1000);let pageUrl:URL|null=null;try{pageUrl=new URL(page)}catch{}
 if(pageUrl?.pathname==='/'&&!['on','true'].includes(String(b.privacyConsent||'')))throw new HttpError(422,'Bitte bestätigen Sie die Datenschutzhinweise.');
 const utm=Object.fromEntries(UTM.map(k=>[k,String(pageUrl?.searchParams.get(k)||b[k]||'').slice(0,200)]).filter(([,v])=>v));
 const value={name:b.name.trim(),phone,email:b.email.trim(),website,zip:String(b.zip||'').trim().slice(0,32),service,details,goal:details,request:String(b.request||'AROZ Projektanfrage').slice(0,300),page,path:pageUrl?.pathname||'',referrer:String(b.referrer||'').slice(0,1000),...utm,...(Object.keys(extra).length?{extra}:{})};
 const forms=(await mongoDb()).collection('forms');
 const search=[value.name,value.phone,value.email,value.zip,value.service,value.request,value.details,value.path,...Object.values(extra)].join(' ').toLowerCase();
 const esc=(s:string)=>s.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const identity=[value.phone,value.email].filter(Boolean).map(v=>new RegExp(esc(v)));const duplicate=!!await forms.findOne({created_at:{$gt:new Date(Date.now()-86400000).toISOString()},search:{$all:identity}},{projection:{_id:1}});
 const flags=contentFlags({name:value.name,email:value.email,website:'',goal:[value.details,...Object.values(extra)].join(' '),request:value.request},age,duplicate);
 const uuid=id();
 // Stored before any email is attempted, so a delivery failure never loses a lead. Flagged leads go to
 // AVAULT → Leads → Spam without an email; the visitor sees the same reply either way.
 await forms.insertOne({id:uuid,value:JSON.stringify(value),status:flags.length?'spam':'new',delivery:flags.length?'blocked':'pending',attempts:0,created_at:now(),ip,user_agent:String(req.headers.get('user-agent')||'').slice(0,400),language:String(req.headers.get('accept-language')||'').slice(0,100),country:countryOf(req,ip).slice(0,8),fill_seconds:age,spam:flags.length?'flagged: '+flags.join('; '):'passed (token, honeypot, rate limit, content checks)',...(flags.length?{delivery_message:'Not emailed: marked as spam.'}:{}),search});
 if(!flags.length)await deliverForm(uuid).catch(()=>{});
 return json({ok:true,message:OK});
}catch(e){return failure(e)}}
