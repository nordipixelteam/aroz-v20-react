import {settingsRead} from './runtime';
import {esc,allDocs,db,clientIp} from './store';
import {HONEYPOT} from './spam';
import {applyForms} from './forms';
import {countryOf} from './geo';
import {normalizeScripts,pageMatches,renderSnippet} from './snippets';
import {matchesIP} from './ip';
import {translateOption} from './translate-option';
export {matchesIP};
export async function trafficAllowed(req:Request){const c=(await settingsRead('traffic')).value;if(!c.enabled)return true;const ip=clientIp(req),country=countryOf(req,ip);if(c.allow?.some((r:string)=>matchesIP(ip,r)))return true;if(c.deny?.some((r:string)=>matchesIP(ip,r)))return false;return !country||!c.countries?.includes(country)}
export async function enhancePublic(html:string,route:string){const configs=await Promise.all(['verification','scripts','operations','menus','forms'].map(settingsRead));const [verification,scripts,operations,menus,forms]=configs.map(c=>c.value);const nonce=crypto.randomUUID().replaceAll('-','');
 const mediaSizes=new Map((await db().prepare('SELECT key,metadata FROM media').all<any>()).results.map(m=>['/media/'+m.key,JSON.parse(m.metadata||'{}')]));html=html.replace(/<img\b[^>]*>/g,tag=>{const src=tag.match(/src="([^"]+)"/)?.[1];const size=mediaSizes.get(src||'');if(!size?.width||!size?.height)return tag;return tag.replace(/\s(?:width|height)="[^"]*"/g,'').replace('<img',`<img width="${size.width}" height="${size.height}"`)});let head='';for(const [k,name] of [['google','google-site-verification'],['bing','msvalidate.01']])if(verification[k])head+=`<meta name="${name}" content="${esc(verification[k])}">`;
 // Decide before first paint whether this tab has already played the branded intro. The deferred module
 // reuses window.showSiteLoader instead of re-reading the value after this bootstrap sets it.
 head=`<script nonce="${nonce}">(function(d){var show=true;try{show=sessionStorage.getItem('aroz.introPlayed')!=='1';if(show)sessionStorage.setItem('aroz.introPlayed','1')}catch(e){}window.showSiteLoader=show;d.documentElement.classList.toggle('is-loading',show);d.documentElement.classList.toggle('intro-complete',!show)})(document)</script>`+head;
 // Custom scripts: each enabled snippet for this page, in its chosen place (lib/avault/snippets.ts).
 const live=scripts.enabled?normalizeScripts(scripts).snippets.filter(s=>s.enabled&&s.code.trim()&&pageMatches(s.pages,route)):[];
 const at=(p:string)=>live.filter(s=>s.placement===p).map(s=>renderSnippet(s,nonce)).join('');
 head+=at('head');if(live.length){html=html.replace(/(<body\b[^>]*>)/,m=>m+at('bodyStart'));html=html.replace('</body>',()=>at('bodyEnd')+'</body>')}
 if(operations.analytics===true)head+='<script src="/avault-analytics.js" defer></script>';
 const renderMenu=(name:string)=>{const items=(menus[name]||[]).filter((i:any)=>i.enabled);const item=(i:any)=>`<li><a href="${esc(i.url)}"${i.newTab?' target="_blank" rel="noopener noreferrer"':''}>${esc(i.label)}</a>${items.some((x:any)=>x.parent===i.id)?'<ul>'+items.filter((x:any)=>x.parent===i.id).map((x:any)=>`<li><a href="${esc(x.url)}">${esc(x.label)}</a></li>`).join('')+'</ul>':''}</li>`;return items.length?`<nav class="avault-menu avault-menu-${name}" aria-label="${name} links"><ul>${items.filter((i:any)=>!i.parent||!items.some((x:any)=>x.id===i.parent)).map(item).join('')}</ul></nav>`:''};
 // Additional menus preserve the site's existing mega menu and its interactions.
 html=html.replace('</header>',renderMenu('header')+renderMenu('mobile')+'</header>').replace('</footer>',renderMenu('footer')+renderMenu('utility')+'</footer>');
 // Forms saved in AVAULT → Forms replace the built-in markup before the honeypot goes in.
 html=applyForms(html,forms);
 html=html.replace(/(<a\b(?=[^>]*\bclass="[^"]*\bv3-talk\b)[^>]*\bhref=")\/kontakt\/(?:index\.html)?(")/gi,'$1/kontakt/#contactForm$2');
 if(route==='/kontakt/'&&/<form\b[^>]*\bid="contactForm"/i.test(html)){
  // A native fragment moves the keyboard starting point to the enquiry form.
  html=html.replace(/(<form\b[^>]*\bid="contactForm"[^>]*)(>)/i,'$1 tabindex="-1"$2');
  html=html.replace(/(<a\b[^>]*\bclass="[^"]*\bav-hero-primary\b[^"]*"[^>]*\bhref=")#projekt(")/i,'$1#contactForm$2');
 }
 if(route==='/projekte/'||route==='/projects/'){
  html=html.replace(/<section class="index">/,'<section class="index" id="project-index" tabindex="-1">');
  if(html.includes('id="project-index"')){
   html=html.replace(/<a\b[^>]*\bhref="#reel"[^>]*>[\s\S]*?<\/a>/i,link=>link+'<a class="text-link av-hero-button av-hero-secondary project-index-jump" href="#project-index">Jump to project index <span aria-hidden="true">↓</span></a>');
  }
 }
 // The homepage keeps its imported, editable form fields and consent mapping.
 if(route==='/')html=html.replace(/(<form\b[^>]*data-avault-form="homepage-contact"[^>]*>)([\s\S]*?)(<\/form>)/g,(_,open,inner,close)=>open+inner.replace(/<input\b(?=[^>]*type="checkbox")(?![^>]*\bname=)/g,'<input name="privacyConsent"')+close);
 if(/<form\b[^>]*class="[^"]*\baudit-form\b[^"]*"/i.test(html))head+='<script src="/avault-forms.js" defer></script>';
 // Lead forms get a hidden honeypot field. People never see or reach it; form bots fill it in.
 html=html.replace(/<form\b[^>]*class="[^"]*\baudit-form\b[^"]*"[^>]*>/g,tag=>tag+`<div class="av-hp"${tag.includes('homepage-contact')||route==='/kontakt/'?' hidden inert':''} aria-hidden="true"><label>Leave this field empty<input type="text" name="${HONEYPOT}" tabindex="-1" autocomplete="off" value=""></label></div>`);
 // Every page's footer links to the privacy policy once it is published.
 const privacy=await db().prepare('SELECT published FROM documents WHERE route=?').bind('/privacy-policy/').first<{published:string|null}>();
 if(privacy?.published&&!html.includes('href="/privacy-policy/"'))html=html.replace(/(<div class="footer-utility">[\s\S]*?)(<\/div>)/,'$1<a href="/privacy-policy/">Privacy policy</a>$2');
 if(route==='/blogs/'){const categories=new Map((await db().prepare('SELECT id,label FROM taxonomy').all<any>()).results.map(t=>[t.id,t.label]));const docs=Object.values(await allDocs()).filter(d=>d.kind==='post'&&!d.seo.noindex);html=html.replace('</main>',`<section class="shell-wide avault-content-block"><h2>All blog posts</h2><div class="avault-content-cards">${docs.map(d=>`<article>${d.featuredImage?`<img src="${esc(d.featuredImage)}" alt="${esc(d.featuredAlt||'')}" loading="lazy" decoding="async">`:''}<h3><a href="${esc(d.route)}">${esc(d.label)}</a></h3><p>${esc(d.excerpt||d.seo.description)}</p><small>${[d.author,d.category?categories.get(d.category)||d.category:''].filter(Boolean).map(esc).join(' · ')}</small></article>`).join('')}</div></section></main>`)}
 html=html.replace('</body>',translateOption()+'<script src="/english-validation.js" defer></script></body>');
 if(route==='/projekte/fahrschule-fast-drive/')head+='<link rel="stylesheet" href="/assets/fast-drive-case.css">';
 if(route==='/projekte/itrust-automobile/')head+='<link rel="stylesheet" href="/assets/itrust-automobile-case.css">';
 if(route==='/projekte/autoankauf-itrust/')head+='<link rel="stylesheet" href="/assets/autoankauf-itrust-case.css">';
 if(route==='/projekte/fahrschule-yes/'){
  head+='<link rel="stylesheet" href="/assets/fahrschule-yes-case.css">';
  html=html.replace(/<section class="snapshot"([^>]*)>([\s\S]*?)<\/section>/i,(section,attrs,content)=>{
   if(/<h1\b/i.test(html.slice(0,html.indexOf(section))))return section;
   const assetPath='/projekte/fahrschule-yes/assets/';
   return `<section class="yes-case-hero" aria-labelledby="yes-case-title">
    <picture class="yes-case-media"><source media="(max-width: 700px)" srcset="${assetPath}yes-homepage-hero-mobile.webp"><img src="${assetPath}yes-homepage-hero.webp" width="1920" height="1004" fetchpriority="high" decoding="async" alt="A smiling driver behind the wheel, from the Fahrschule YES! homepage"></picture>
    <div class="wrap yes-case-intro">
     <p class="eyebrow">Case Study 05 · Driving school · Velbert</p>
     <h1 id="yes-case-title">Fahrschule <em>YES!</em></h1>
     <p class="yes-case-lead">A driving school website built around clarity, trust and a training journey that feels easy to understand.</p>
     <p class="yes-case-scope">Web Design · SEO · Copywriting</p>
    </div>
   </section><section class="snapshot"${attrs}>${content.replace(/<h1(\b[^>]*)>([\s\S]*?)<\/h1>/i,'<h2$1>$2</h2>')}</section>`;
  });
 }
 if(route==='/projekte/4fahrlehrer/'){
  head+='<link rel="stylesheet" href="/assets/4fahrlehrer-case.css">';
  html=html.replaceAll('<div class="brand4"><span>4</span>Driving instructors</div>','<div class="brand4"><span>4</span>Fahrlehrer</div>');
  const assetPath='/projekte/4fahrlehrer/assets/';
  html=html.replace(/<section class="hero wrap">[\s\S]*?<\/section>/i,hero=>hero
   .replace('<section class="hero wrap">','<section class="hero wrap fourfahr-hero"><div class="fourfahr-hero-intro">')
   .replace(/<h1>[^<]+<br\s*\/?>(\s*)<span class="outline">/i,'<h1 lang="de"><span class="fourfahr-hero-prefix">Webdesign für</span> $1<span class="fourfahr-hero-name">')
   .replace('</h1>',`</h1></div><figure class="fourfahr-hero-visual"><div class="real-browser-bar" aria-hidden="true"><i></i><i></i><i></i><span>4fahrlehrer.de</span></div><img src="${assetPath}homepage-desktop.webp" width="1440" height="1000" fetchpriority="high" decoding="async" alt="Published 4Fahrlehrer homepage with its green identity and branded vehicle lineup"></figure>`));
  const artwork=/<div class="real-shot case-static-shot"><div class="real-fallback"><small>[^<]*<\/small><strong>[^<]*<br\s*\/?><span>[^<]*<\/span><\/strong><\/div><\/div>([\s\S]*?<\/a>)/i;
  html=html.replace(/<section class="real-site-showcase"[^>]*>[\s\S]*?<\/section>/i,section=>{
   if(!artwork.test(section))return section;
   return section
    .replace(/(<p class="case-art-note"[^>]*>)[^<]*(<\/p>)/i,'$1Screenshots from the published 4Fahrlehrer website. Open the desktop preview to visit the live project.$2')
    .replace(artwork,(_match,cardEnd)=>`<div class="fourfahr-project-shot"><img src="${assetPath}homepage-desktop.webp" width="1440" height="1000" loading="lazy" decoding="async" alt="Desktop homepage with the 4Fahrlehrer logo, medical assessment introduction and branded vehicles"></div>${cardEnd}
    <div class="fourfahr-project-details">
     <figure class="fourfahr-project-mobile"><img src="${assetPath}homepage-mobile.webp" width="780" height="1688" loading="lazy" decoding="async" alt="Mobile homepage with the 4Fahrlehrer logo, appointment button, menu and introductory copy"><figcaption>Mobile homepage</figcaption></figure>
     <figure><img src="${assetPath}branded-vehicles.webp" width="1440" height="434" loading="lazy" decoding="async" alt="Branded truck, taxi, SUV and coach arranged around the green 4Fahrlehrer shield"><figcaption>Branded vehicle lineup</figcaption></figure>
     <figure><img src="${assetPath}medical-services.webp" width="1380" height="896" loading="lazy" decoding="async" alt="Medical assessment overview with cards for general health, physical limitations and visual acuity"><figcaption>Medical assessment services</figcaption></figure>
    </div>`);
  });
 }
 html=html.replace('</head>',head+'<link rel="stylesheet" href="/assets/qa-accessibility.css"><link rel="stylesheet" href="/assets/responsive-ux.css"></head>');
 // Imported, trusted inline interactions (including contact service choices)
 // need the same request nonce as our bootstrap. Keep unsafe-inline disabled.
 html=html.replace(/<script\b(?![^>]*\bnonce=)(?![^>]*\bsrc=)([^>]*)>/gi,`<script nonce="${nonce}"$1>`);
 return {html,nonce,customScripts:live.length>0};
}
