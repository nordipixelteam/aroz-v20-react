import {CONFIG} from './config';
import {esc} from './store';
import {describeAgent} from './agent';
export {describeAgent};

// Lead notification email styled to match the AROZ website.
// Email clients ignore external CSS and strip <style> unevenly, so everything is inline and table-based.
const BLUE='#181719',RED='#e81848',YELLOW='#b38d3b',GREEN='#176b45',INK='#181719',MUTED='#625d5f',LINE='#e2dcda';
const FONT=`'Mona Sans',Arial,sans-serif`;
export type LeadRecord={id:string;value:Record<string,unknown>;ip?:string;user_agent?:string;language?:string;country?:string;created_at?:string;fill_seconds?:number;spam?:string;previous?:number};

const when=(iso?:string)=>{const d=iso?new Date(iso):new Date();return d.toLocaleString('de-DE',{timeZone:'Europe/Berlin',weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})};
const duration=(s?:number)=>!s||s<0?'':s<60?`${Math.round(s)} Sek.`:s<3600?`${Math.floor(s/60)} Min. ${Math.round(s%60)} Sek.`:'Über eine Stunde';
const str=(v:unknown)=>String(v??'').trim();
const ask=(r:string)=>r||'Projektanfrage';

function rows(f:Record<string,unknown>,r:LeadRecord){
 const utm=[f.utm_source,f.utm_medium,f.utm_campaign,f.utm_term,f.utm_content].map(str).filter(Boolean).join(' / ');
 return {
    request:[['Name',str(f.name)],['Telefon',str(f.phone)],['E-Mail',str(f.email)],['Website',str(f.website)],['Thema',str(f.service)],['Projekt / Nachricht',str(f.details)],['Anfrage',str(f.request)],...Object.entries((f.extra||{}) as Record<string,unknown>).map(([k,v])=>[k,str(v)])],
    visit:[['Eingegangen',when(r.created_at)],['Seite',str(f.page)],['Herkunft',str(f.referrer)||'Direkt / keine'],['Kampagne (UTM)',utm],['Zeit bis zum Absenden',duration(r.fill_seconds)]],
    sender:[['IP-Adresse',str(r.ip)],['Land',str(r.country)],['Gerät',describeAgent(r.user_agent)],['Sprache',str(r.language).split(',')[0]],['Spamprüfung',str(r.spam)],['Frühere Anfragen',r.previous?String(r.previous):'Keine'],['Lead-ID',r.id],['User-Agent',str(r.user_agent)]],
 } as Record<string,string[][]>;
}

export function leadText(r:LeadRecord){const f=r.value,g=rows(f,r);
 const block=(title:string,list:string[][])=>title.toUpperCase()+'\n'+list.filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join('\n');
 return ['Neue Projektanfrage von '+str(f.name),'',block('Anfrage',g.request),'',block('Besuch',g.visit),'',block('Absender',g.sender),'',`In AVAULT öffnen: ${CONFIG.origin}/avault?view=leads`].join('\n');
}

const link=(v:string)=>/^https?:\/\//.test(v)?`<a href="${esc(v)}" style="color:${BLUE};text-decoration:none;word-break:break-all">${esc(v)}</a>`:/^[^\s@]+@[^\s@]+$/.test(v)?`<a href="mailto:${esc(v)}" style="color:${BLUE};text-decoration:none">${esc(v)}</a>`:/^\+?[\d().\s-]{7,}$/.test(v)?`<a href="tel:${esc(v.replace(/[^+\d]/g,''))}" style="color:${BLUE};text-decoration:none">${esc(v)}</a>`:esc(v);
function card(title:string,accent:string,list:string[][]){
 const body=list.filter(([,v])=>v).map(([k,v],i)=>`<tr><td style="padding:12px 0;${i?`border-top:1px solid ${LINE};`:''}font:500 13px/1.4 ${FONT};color:${MUTED};width:38%;vertical-align:top">${esc(k)}</td><td style="padding:12px 0;${i?`border-top:1px solid ${LINE};`:''}font:500 15px/1.45 ${FONT};color:${INK};vertical-align:top;word-break:break-word">${link(v)}</td></tr>`).join('');
 return `<tr><td style="padding:0 0 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;border:1px solid ${LINE};border-radius:20px;border-collapse:separate"><tr><td style="padding:22px 26px 10px"><p style="margin:0 0 6px;font:600 12px/1 ${FONT};letter-spacing:.12em;text-transform:uppercase;color:${MUTED}"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${accent};margin-right:8px;vertical-align:1px"></span>${esc(title)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${body}</table></td></tr></table></td></tr>`;
}
const wordmark=`<table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="padding:8px 12px;vertical-align:middle;background:${INK}"><img src="${CONFIG.origin}/assets/aroz-full-logo.png" width="180" alt="AROZ Webdesign Agentur" style="display:block;border:0;width:180px;height:auto"></td></tr></table>`;
const rule=`<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>${[BLUE,RED,YELLOW,GREEN].map(c=>`<td style="height:6px;line-height:6px;font-size:0;background:${c}">&nbsp;</td>`).join('')}</tr></table>`;
const button=(href:string,label:string,bg:string,color='#ffffff',border=bg)=>`<a href="${esc(href)}" style="display:inline-block;padding:13px 24px;margin:0 8px 8px 0;border-radius:999px;background:${bg};border:1px solid ${border};color:${color};font:600 15px/1 ${FONT};text-decoration:none">${esc(label)}</a>`;

export function leadHtml(r:LeadRecord){const f=r.value,g=rows(f,r),name=str(f.name)||'A visitor',email=str(f.email),phone=str(f.phone),details=str(f.details);
 const reply=email?`mailto:${email}?subject=${encodeURIComponent('Ihre Anfrage — AROZ Webdesign Agentur')}`:'';
 const call=phone?`tel:${phone.replace(/[^+\d]/g,'')}`:'';
 return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Neue Projektanfrage</title></head>
<body style="margin:0;padding:0;background:#f5f2ee">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(name)} hat eine Anfrage über ${esc(str(f.service)||str(f.request)||'AROZ Webdesign')} gesendet.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f2ee"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px">
<tr><td style="padding:0 4px 20px"><a href="${CONFIG.origin}/" style="text-decoration:none">${wordmark}</a></td></tr>
<tr><td style="padding:0 0 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;border:1px solid ${LINE};border-radius:24px;border-collapse:separate;overflow:hidden">
<tr><td>${rule}</td></tr>
<tr><td style="padding:30px 28px 26px">
<p style="margin:0 0 14px;font:600 13px/1 ${FONT};color:${MUTED}"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${GREEN};margin-right:8px;vertical-align:1px"></span>Neue Anfrage</p>
<h1 style="margin:0 0 10px;font:700 34px/1.12 ${FONT};letter-spacing:-.03em;color:${INK}">${esc(name)} <span style="color:${BLUE}">hat eine Anfrage gesendet: ${esc(ask(str(f.service)||str(f.request)))}.</span></h1>
${details?`<p style="margin:0 0 22px;font:400 16px/1.55 ${FONT};color:${MUTED}">Projektbeschreibung: <strong style="color:${INK};font-weight:600">${esc(details)}</strong></p>`:'<div style="height:12px"></div>'}
${reply?button(reply,'Antworten',BLUE):''}${call?button(call,'Anrufen',RED):''}${button(CONFIG.origin+'/avault?view=leads','In AVAULT öffnen','#ffffff',INK,'#dadce0')}
</td></tr></table></td></tr>
${card('Anfrage',BLUE,g.request)}${card('Besuch',RED,g.visit)}${card('Absender',GREEN,g.sender)}
<tr><td style="padding:8px 4px 0;font:400 12px/1.6 ${FONT};color:${MUTED}">Gesendet über ${esc(CONFIG.name)} auf ${esc(CONFIG.origin.replace(/^https?:\/\//,''))}. Diese Anfrage ist auch in AVAULT → Leads gespeichert.</td></tr>
</table></td></tr></table></body></html>`;
}
