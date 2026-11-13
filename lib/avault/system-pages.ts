import {CONFIG} from './config';
import {Doc,esc} from './store';
import {render} from './render';
import {profile,type Profile} from './site';

// Code-owned utility pages use the public site's own header, footer, typography and motion shell.
export type SystemPage='contact'|'thank-you'|'not-found';
export const SYSTEM_PAGE_ROUTE:Record<SystemPage,string>={contact:'/contact/','thank-you':'/thank-you/','not-found':'/not-found/'};
const COLORS=['blue','red','blue','red'];
const colorWord=(word:string)=>{let i=0;return [...word].map(ch=>ch===' '?'<span class="av-sys-gap"> </span>':`<span class="av-sys-${COLORS[i++%COLORS.length]}">${esc(ch)}</span>`).join('')};
const arrow='<svg class="cta-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7"/></svg>';
const button=(href:string,label:string,secondary=false)=>`<a class="av-sys-button${secondary?' av-sys-button-secondary':''}" href="${href}"><span>${label}</span>${arrow}</a>`;
const DAYS:Record<string,string>={Mo:'Monday',Tu:'Tuesday',We:'Wednesday',Th:'Thursday',Fr:'Friday',Sa:'Saturday',Su:'Sunday'};
const time=(t:string)=>{const [h,m]=t.split(':').map(Number);return `${h%12||12}${m?':'+String(m).padStart(2,'0'):''} ${h<12?'AM':'PM'}`};
const hoursLine=(h:string)=>{const [days,span]=h.split(' ');const [a,b]=(span||'').split('-');return `${days.split(',').map(d=>d.split('-').map(x=>DAYS[x]||x).join(' – ')).join(', ')}${a&&b?`, ${time(a)} – ${time(b)}`:''}`};
const icon=(path:string)=>`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const tel='tel:'+CONFIG.phone.replace(/[^+0-9]/g,'');

function contactMain(p:Profile){
 const a=p.address,street=[esc(a.street),esc([a.city,a.region].filter(Boolean).join(', ')+(a.postalCode?' '+a.postalCode:''))].filter(s=>s.trim()).join('<br>');
 const cards=[
  `<li class="av-contact-card av-c-blue">${icon('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>')}<h2>Call us</h2><p>Talk with a commercial Website-Projekt specialist.</p><a href="${tel}">${esc(CONFIG.phoneDisplay)}</a></li>`,
  ...(p.email?[`<li class="av-contact-card av-c-red">${icon('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>')}<h2>Email us</h2><p>Send door details, photos or scheduling questions.</p><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></li>`]:[]),
  ...(street?[`<li class="av-contact-card av-c-yellow">${icon('<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>')}<h2>Service office</h2><p>${street}</p>${p.mapUrl?`<a href="${esc(p.mapUrl)}" target="_blank" rel="noopener">Get directions</a>`:''}</li>`]:[]),
  ...(p.hours.length?[`<li class="av-contact-card av-c-green">${icon('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>')}<h2>Service hours</h2><p>${p.hours.map(h=>esc(hoursLine(h))).join('<br>')}</p></li>`]:[]),
 ];
 if(!p.phone)cards.shift();
 return `<section class="av-sys-hero av-sys-contact"><div class="shell-wide av-sys-inner">
  <p class="i-kicker av-sys-kicker"><span class="av-sys-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></span> Kontakt ${esc(CONFIG.name)}</p>
  <h1>Planen Sie Ihren <span class="av-sys-soft">digitalen Auftritt.</span></h1>
  <p class="av-sys-lead">Beschreiben Sie Ihr Vorhaben. AROZ verbindet Webdesign, SEO, KI-Sichtbarkeit und Copywriting zu einem stimmigen digitalen Auftritt.</p>
  <div class="av-sys-actions">${button('/kontakt/','Projekt besprechen')}${p.phone?button(tel,'Anrufen',true):''}</div>
  <ul class="av-contact-cards">${cards.join('')}</ul>
  <ol class="av-sys-steps"><li><b class="av-sys-blue">1</b><strong>Projekt beschreiben</strong><span>Teilen Sie Ihre Ziele und den aktuellen Stand Ihrer Website.</span></li><li><b class="av-sys-red">2</b><strong>Gemeinsam planen</strong><span>Wir besprechen die passende Strategie und die nächsten Schritte.</span></li><li><b class="av-sys-blue">3</b><strong>Auftritt weiterentwickeln</strong><span>Design, Inhalte und Sichtbarkeit greifen sinnvoll ineinander.</span></li></ol>
 </div><div class="i-hero-line" aria-hidden="true"><span></span><span></span><span></span><span></span></div></section>`;
}

const PAGES:Record<SystemPage,{label:string;title:string;description:string;main:string|((p:Profile)=>string);index?:boolean}>={
 contact:{label:'Kontakt',title:'Kontakt | AROZ Webdesign Agentur',description:'Projektanfragen für Webdesign, SEO, KI-Sichtbarkeit und Copywriting in Schwelm und Umgebung.',index:true,main:contactMain},
 'thank-you':{label:'Thank you',title:'Request received | '+CONFIG.name,description:'Your service request has reached the AROZ Webdesign Agentur team.',main:`<section class="av-sys-hero av-ty"><div class="shell-wide av-ty-grid"><div class="av-ty-copy"><span class="av-ty-badge" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span><p class="i-kicker av-sys-kicker">Request received</p><h1>Thank you.</h1><p class="av-ty-sub">Your request is with our commercial Website-Projekt team.</p><p class="av-sys-lead">We will review your service details and contact you about the next step. If the job is urgent, call us now.</p><div class="av-sys-actions">${button('/','Back to the homepage')}${button(tel,'Call '+CONFIG.phoneDisplay,true)}</div></div><aside class="av-ty-card" aria-label="What happens next"><div class="av-ty-card-head"><span>Your request</span><b>Received</b></div><h2>What happens next</h2><ol class="av-ty-timeline"><li class="done"><b>1</b><div><strong>Request received</strong><span>Your details are safely with our team.</span></div></li><li><b>2</b><div><strong>We assess the service need</strong><span>We review the door type, issue and location.</span></div></li><li><b>3</b><div><strong>We contact you</strong><span>A specialist follows up about service and scheduling.</span></div></li></ol></aside></div><div class="i-hero-line" aria-hidden="true"><span></span><span></span><span></span><span></span></div></section>`},
 'not-found':{label:'Page not found',title:'Page not found | '+CONFIG.name,description:'The requested page could not be found.',main:`<section class="av-sys-hero av-sys-404"><div class="shell-wide av-sys-inner"><p class="i-kicker av-sys-kicker">Error 404</p><p class="av-sys-giant" aria-hidden="true">${colorWord('404')}</p><h1>This page moved <span class="av-sys-soft">or never existed.</span></h1><p class="av-sys-lead">The link may be old or mistyped. Return home to find commercial door services, or call and we will point you in the right direction.</p><div class="av-sys-actions">${button('/','Go to the homepage')}${button(tel,'Call '+CONFIG.phoneDisplay,true)}</div><ul class="av-sys-links" aria-label="Popular pages"><li><a href="/commercial-door-closers/">Commercial door closers</a></li><li><a href="/commercial-exit-devices/">Commercial exit devices</a></li><li><a href="/ada-handicap-exit-devices/">ADA and exit devices</a></li><li><a href="/blogs/">Website-Projekt guides</a></li></ul></div><div class="i-hero-line" aria-hidden="true"><span></span><span></span><span></span><span></span></div></section>`},
};

export function systemPage(kind:SystemPage,home:Doc,g:Record<string,any>,registry:Record<string,Doc>,origin:string){
 const p=PAGES[kind],route=SYSTEM_PAGE_ROUTE[kind];let main=typeof p.main==='function'?p.main(profile(g)):p.main;
 for(const [from,to] of [
  ['Request received','Anfrage eingegangen'],['Thank you.','Vielen Dank.'],
  ['Your request is with our commercial Website-Projekt team.','Ihre Anfrage ist bei AROZ eingegangen.'],
  ['We will review your service details and contact you about the next step. If the job is urgent, call us now.','Wir prüfen Ihre Anfrage und melden uns zeitnah bei Ihnen.'],
  ['What happens next','Wie geht es weiter?'],['Your request','Ihre Anfrage'],['Received','Eingegangen'],
  ['Request received','Anfrage eingegangen'],['Your details are safely with our team.','Ihre Angaben sind sicher bei AROZ eingegangen.'],
  ['We assess the service need','Wir besprechen Ihr Vorhaben'],['We review the door type, issue and location.','Wir prüfen Ziele, Inhalte und den aktuellen Auftritt.'],
  ['We contact you','Wir melden uns bei Ihnen'],['A specialist follows up about service and scheduling.','Wir melden uns mit den passenden nächsten Schritten.'],
  ['This page moved','Diese Seite wurde verschoben'],['or never existed.','oder existiert nicht.'],
  ['The link may be old or mistyped. Return home to find commercial door services, or call and we will point you in the right direction.','Der Link ist möglicherweise veraltet oder falsch. Kehren Sie zur Startseite zurück oder entdecken Sie unsere Leistungen.'],
  ['/commercial-door-closers/','/webdesign/'],['Commercial door closers','Webdesign'],
  ['/commercial-exit-devices/','/seo/'],['Commercial exit devices','SEO'],
  ['/ada-handicap-exit-devices/','/ki-seo/'],['ADA and exit devices','KI-Sichtbarkeit'],
  ['/blogs/','/projekte/'],['Website-Projekt guides','Projekte'],
 ] as const)main=main.replaceAll(from,to);
 if(!CONFIG.phone)main=main.replace(/<a class="av-sys-button av-sys-button-secondary" href="tel:">[\s\S]*?<\/a>/g,'');
 const template=home.template.replace(/<main\b[^>]*>[\s\S]*<\/main>/,`<main id="main">${main}</main>`).replace('</head>','<link rel="stylesheet" href="/system-pages.css"></head>');
 const doc:Doc={...home,route,label:p.label,kind:'page',template,blocks:[],sectionOrder:undefined,hiddenSections:undefined,body:'',seo:{...home.seo,title:p.title,description:p.description,canonical:origin+route,noindex:!p.index,nofollow:false,schema:'',ogTitle:p.title,ogDescription:p.description}};
 return render(doc,g,false,registry,origin);
}
