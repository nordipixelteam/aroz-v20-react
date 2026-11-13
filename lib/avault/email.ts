import nodemailer from 'nodemailer';
import {mongoDb} from '@/db/mongo';
import {HttpError,now} from './store';
import {seal,unseal,settingsRead} from './runtime';
import {leadHtml,leadText} from './lead-email';

// Email delivery settings (settings id `email`). Secrets are sealed with AVAULT_ENCRYPTION_KEY and never
// returned to the browser; `enabled:false` is save-only mode, where leads are stored but no email is sent.
export type EmailConfig={enabled:boolean;provider:'mailgun'|'smtp';senderName:string;fromAddress:string;replyTo:string;recipients:string[];
 mailgun:{domain:string;region:'us'|'eu';key:string};smtp:{host:string;port:number;secure:boolean;user:string;pass:string}};
const EMAIL=/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
export const MAX_ATTEMPTS=5;

// Older records stored Mailgun fields at the top level with a combined "Name <address>" sender.
export function normalizeEmailConfig(v:any):EmailConfig{
 const legacySender=String(v?.sender||'').match(/^\s*(?:([^<]*?)\s*<)?([^<>\s]+@[^<>\s]+)>?\s*$/);
 return {enabled:!!v?.enabled,provider:v?.provider==='smtp'?'smtp':'mailgun',senderName:String(v?.senderName??legacySender?.[1]??''),fromAddress:String(v?.fromAddress??legacySender?.[2]??''),replyTo:String(v?.replyTo||''),recipients:Array.isArray(v?.recipients)?v.recipients.map(String):[],
  mailgun:{domain:String(v?.mailgun?.domain??v?.domain??''),region:(v?.mailgun?.region??v?.region)==='eu'?'eu':'us',key:String(v?.mailgun?.key??v?.key??'')},
  smtp:{host:String(v?.smtp?.host||''),port:Number(v?.smtp?.port)||587,secure:!!v?.smtp?.secure,user:String(v?.smtp?.user||''),pass:String(v?.smtp?.pass||'')}};
}
// What the browser may see: everything except the secrets, plus whether each secret is stored.
export function publicEmailConfig(v:any){const c=normalizeEmailConfig(v);return {...c,mailgun:{...c.mailgun,key:'',keySaved:!!c.mailgun.key},smtp:{...c.smtp,pass:'',passSaved:!!c.smtp.pass}}}

export async function buildEmailConfig(input:any,current:any):Promise<EmailConfig>{
 const old=normalizeEmailConfig(current),v=input||{};const provider=v.provider==='smtp'?'smtp':'mailgun';
 const recipients=(Array.isArray(v.recipients)?v.recipients:[]).map((r:unknown)=>String(r).trim()).filter(Boolean);
 if(recipients.length<1||recipients.length>10||recipients.some((r:string)=>!EMAIL.test(r)))throw new HttpError(422,'Enter between 1 and 10 valid recipient addresses.');
 const fromAddress=String(v.fromAddress||'').trim();if(!EMAIL.test(fromAddress))throw new HttpError(422,'Enter a valid "from" address.');
 const replyTo=String(v.replyTo||'').trim();if(replyTo&&!EMAIL.test(replyTo))throw new HttpError(422,'Enter a valid reply-to address or leave it blank.');
 const senderName=String(v.senderName||'').replace(/[<>"\r\n]/g,'').trim().slice(0,100);
 const config:EmailConfig={enabled:!!v.enabled,provider,senderName,fromAddress,replyTo,recipients,mailgun:old.mailgun,smtp:old.smtp};
 if(provider==='mailgun'){const domain=String(v.mailgun?.domain||'').trim();if(!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain))throw new HttpError(422,'Enter the Mailgun sending domain, such as mg.example.com.');config.mailgun={domain,region:v.mailgun?.region==='eu'?'eu':'us',key:v.mailgun?.key?await seal(String(v.mailgun.key).trim()):old.mailgun.key};if(config.enabled&&!config.mailgun.key)throw new HttpError(422,'Enter the Mailgun sending key before enabling delivery.')}
 else{const host=String(v.smtp?.host||'').trim(),port=Number(v.smtp?.port),user=String(v.smtp?.user||'').trim();if(!/^[a-z0-9.-]+$/i.test(host))throw new HttpError(422,'Enter the SMTP host, such as smtp.gmail.com.');if(![25,465,587,2525].includes(port))throw new HttpError(422,'Use SMTP port 465, 587, 25 or 2525.');if(!user)throw new HttpError(422,'Enter the SMTP username.');config.smtp={host,port,secure:port===465,user,pass:v.smtp?.pass?await seal(String(v.smtp.pass)):old.smtp.pass};if(config.enabled&&!config.smtp.pass)throw new HttpError(422,'Enter the SMTP password (for Gmail, an app password) before enabling delivery.')}
 return config;
}

const from=(c:EmailConfig)=>c.senderName?`"${c.senderName}" <${c.fromAddress}>`:c.fromAddress;
// Provider messages can echo credentials or internal hosts; only a short, generic reason is kept.
const redact=(s:string)=>s.replace(/(key|pass(word)?|token|auth)[^\s]*/gi,'$1 [redacted]').slice(0,200);

export async function sendEmail(subject:string,text:string,replyTo?:string,options:{force?:boolean;html?:string}={}){
 const c=normalizeEmailConfig((await settingsRead('email')).value);
 if(!c.enabled&&!options.force)throw new HttpError(422,'Email delivery is in save-only mode. Enable it under Email.');
 if(!c.recipients.length||!c.fromAddress)throw new HttpError(422,'Configure email delivery first.');
 const reply=replyTo||c.replyTo||undefined;
 if(c.provider==='smtp'){
  if(!c.smtp.pass)throw new HttpError(422,'Save the SMTP password first.');
  const transport=nodemailer.createTransport({host:c.smtp.host,port:c.smtp.port,secure:c.smtp.secure,auth:{user:c.smtp.user,pass:await unseal(c.smtp.pass)},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000});
  try{await transport.sendMail({from:from(c),to:c.recipients,subject,text,html:options.html,replyTo:reply})}catch(e){throw new HttpError(502,'SMTP delivery failed: '+redact(String((e as Error).message||'unknown error')))}finally{transport.close()}
  return true;
 }
 if(!c.mailgun.key)throw new HttpError(422,'Save the Mailgun sending key first.');
 const data=new FormData();data.set('from',from(c));for(const r of c.recipients)data.append('to',r);data.set('subject',subject);data.set('text',text);if(options.html)data.set('html',options.html);if(reply)data.set('h:Reply-To',reply);
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
 try{const response=await fetch(`https://${c.mailgun.region==='eu'?'api.eu.mailgun.net':'api.mailgun.net'}/v3/${encodeURIComponent(c.mailgun.domain)}/messages`,{method:'POST',headers:{Authorization:'Basic '+btoa('api:'+await unseal(c.mailgun.key))},body:data,signal:controller.signal});
  if(!response.ok)throw new HttpError(502,`Mailgun rejected delivery (HTTP ${response.status}). Check the domain, region, sender and key.`);return true}
 catch(e){if(e instanceof HttpError)throw e;throw new HttpError(502,'Mailgun could not be reached: '+redact(String((e as Error).message||'timeout')))}finally{clearTimeout(timer)}
}

// Records every attempt on the submission: delivery is pending → sending → sent | failed | not-configured.
export async function deliverForm(formId:string){
 const db=await mongoDb();const forms=db.collection('forms');const c=normalizeEmailConfig((await settingsRead('email')).value);
 if(!c.enabled){await forms.updateOne({id:formId,delivery:{$nin:['sent','sending']}},{$set:{delivery:'not-configured',delivery_message:'Save-only mode: email delivery is off.'}});return}
 const claimed=await forms.findOneAndUpdate({id:formId,delivery:{$nin:['sent','sending']},attempts:{$not:{$gte:MAX_ATTEMPTS}}},{$set:{delivery:'sending'},$inc:{attempts:1}},{returnDocument:'after'});if(!claimed)return;
 const f=JSON.parse(String(claimed.value||'{}'));
 const contact=String(f.email||f.phone||'').toLowerCase();const previous=contact?await forms.countDocuments({id:{$ne:formId},search:{$regex:contact.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}}).catch(()=>0):0;
 const lead={id:formId,value:f,ip:claimed.ip,user_agent:claimed.user_agent,language:claimed.language,country:claimed.country,created_at:claimed.created_at,fill_seconds:claimed.fill_seconds,spam:claimed.spam,previous};
 try{await sendEmail(`Neue Anfrage: ${String(f.service||f.request||'AROZ Projektanfrage').slice(0,80)} von ${String(f.name||'einer Person').slice(0,60)}`,leadText(lead),f.email||undefined,{html:leadHtml(lead)});await forms.updateOne({id:formId},{$set:{delivery:'sent',delivery_message:'An '+c.recipients.length+' Empfänger über '+c.provider+' zugestellt.',delivered_at:now()}})}
 catch(e){await forms.updateOne({id:formId},{$set:{delivery:'failed',delivery_message:e instanceof HttpError?e.message:'Delivery failed.',last_attempt_at:now()}})}
}
