import {mongoDb} from '@/db/mongo';
import {HttpError} from './store';

// Lead-form spam defence, in layers:
//  1. A signed, single-use form token issued by /api/forms/token. Bots that post straight to the API
//     (most form spam) have no token; a token can't be forged without AVAULT_ENCRYPTION_KEY or replayed.
//  2. A hidden honeypot field people never see or fill (injected into every lead form by enhancePublic).
//  3. Rate limits per IP (hour and day) and per email address (day).
//  4. Content checks. Anything caught here is still stored, but as status "spam" with no email sent,
//     so a false positive can be restored from AVAULT → Leads → Spam.
export const HONEYPOT='contact_me_by_fax';
const MIN_AGE=2500,MAX_AGE=6*3600000;
const encoder=new TextEncoder();
const hex=(b:ArrayBuffer)=>Array.from(new Uint8Array(b)).map(n=>n.toString(16).padStart(2,'0')).join('');
async function key(){const secret=process.env.AVAULT_ENCRYPTION_KEY;if(!secret)throw new HttpError(503,'Forms are temporarily unavailable.');return crypto.subtle.importKey('raw',encoder.encode('form-token:'+secret),{name:'HMAC',hash:'SHA-256'},false,['sign'])}
const sign=async(data:string)=>hex(await crypto.subtle.sign('HMAC',await key(),encoder.encode(data)));
export const sha=async(s:string)=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(s)));

export async function issueFormToken(){const payload=`${Date.now()}.${crypto.randomUUID().replaceAll('-','')}`;return `${payload}.${await sign(payload)}`}

// Throws for a missing, forged, too-fast or expired token. Returns its age in seconds and consume(), which marks it used
// (and throws if it already was). Call consume() only after the fields are valid, so a corrected resubmission still works.
export async function verifyFormToken(token:unknown){
 const reload=new HttpError(422,'This form expired. Please reload the page and try again.');
 const [issued,nonce,mac]=String(token||'').split('.');if(!issued||!nonce||!mac||!/^\d{13}$/.test(issued)||!/^[0-9a-f]{32}$/.test(nonce))throw reload;
 const expected=await sign(`${issued}.${nonce}`);let diff=expected.length^mac.length;for(let i=0;i<expected.length;i++)diff|=expected.charCodeAt(i)^(mac.charCodeAt(i)||0);if(diff)throw reload;
 const age=Date.now()-Number(issued);if(age>MAX_AGE)throw reload;if(age<MIN_AGE)throw new HttpError(422,'Please review your details and try again.');
 // Single use: the unique index on rate_limits.id rejects a second insert of the same nonce.
 const consume=async()=>{try{await (await mongoDb()).collection('rate_limits').insertOne({id:'form-token:'+nonce,count:1,expires:Number(issued)+MAX_AGE})}catch{throw new HttpError(422,'This request was already sent. Reload the page to send another.')}};
 return {age:Math.round(age/1000),consume};
}

async function bump(id:string,windowMs:number){const db=await mongoDb();const row=await db.collection('rate_limits').findOneAndUpdate({id},{$inc:{count:1},$setOnInsert:{expires:Date.now()+windowMs}},{upsert:true,returnDocument:'after'});return Number(row?.count||0)}
export async function enforceLimits(ip:string,email:string){
 const hour=Math.floor(Date.now()/3600000),day=Math.floor(Date.now()/86400000);
 const [perHour,perDay,perEmail]=await Promise.all([bump('form-ip-h:'+await sha(ip+hour),3600000),bump('form-ip-d:'+await sha(ip+day),86400000),bump('form-email-d:'+await sha(email.toLowerCase()+day),86400000)]);
 if(perHour>4||perDay>12||perEmail>3)throw new HttpError(429,'Too many requests. Please try again later, or call us.');
}

// Throwaway inbox services that real business leads don't use.
const DISPOSABLE=new Set(['mailinator.com','guerrillamail.com','guerrillamail.info','sharklasers.com','10minutemail.com','tempmail.com','temp-mail.org','temp-mail.io','yopmail.com','trashmail.com','getnada.com','dispostable.com','maildrop.cc','fakeinbox.com','throwawaymail.com','mailnesia.com','mintemail.com','emailondeck.com','spamgourmet.com','mohmal.com','tempail.com','moakt.com','burnermail.io','mailpoof.com','tempr.email','discard.email','33mail.com','spambox.us','grr.la','emltmp.com','tmpmail.org','tmail.ws']);
const LINK=/https?:\/\/|www\.|\[url|<a\s|\.(?:ru|cn|top|xyz|click|loan|work|biz)\b/i;
const SPAM_WORDS=/\b(?:viagra|cialis|casino|porn|crypto(?:currency)? invest|bitcoin|forex|loan offer|backlinks? (?:package|for sale)|guest post|seo packages? from \$|rank (?:you|your site) #?1|whatsapp me|telegram)\b/i;
const FOREIGN_SCRIPT=/[Ѐ-ӿ؀-ۿ一-鿿぀-ヿ가-힯]/;

// Reasons a submission looks automated. An empty list means it passed.
export function contentFlags(v:{name:string;email:string;website:string;goal:string;request:string},ageSeconds:number,duplicate:boolean){
 const flags:string[]=[];const name=v.name.trim(),domain=v.email.split('@')[1]?.toLowerCase()||'';
 if(LINK.test(name)||/[@#$%^*=<>{}[\]|\\/]/.test(name)||/\d{3,}/.test(name))flags.push('links or symbols in the name');
 // Random-string bot names: one long "word" with case flips and a consonant run, e.g. "kJhGfDsaQwe".
 if(!/\s/.test(name)&&name.length>=10&&(name.slice(1).match(/[A-Z]/g)||[]).length>=2&&/[a-z][A-Z]/.test(name)&&/[bcdfghjklmnpqrstvwxz]{4,}/i.test(name))flags.push('random-looking name');
 if(name.length>2&&!/[aeiouy]/i.test(name)&&!FOREIGN_SCRIPT.test(name))flags.push('name has no vowels');
 if(name.length>0&&name.toLowerCase()===v.email.split('@')[0].toLowerCase()&&/\d/.test(name))flags.push('name copied from email');
 if(DISPOSABLE.has(domain))flags.push('disposable email address');
 if(FOREIGN_SCRIPT.test(name+v.goal))flags.push('non-Latin text');
 if(LINK.test(v.goal)||(v.goal.match(/https?:\/\//g)||[]).length>0)flags.push('links in the message');
 if(SPAM_WORDS.test(v.goal+' '+v.name+' '+v.request))flags.push('spam phrases');
 if(v.goal.length>600)flags.push('very long message');
 if(ageSeconds<4)flags.push('sent too quickly');
 if(duplicate)flags.push('same email and website sent in the last 24 hours');
 return flags;
}
