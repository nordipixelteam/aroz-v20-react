import type {Doc} from './store';
import {esc} from './store';

// The published Home document supplies the structure. Global navigation overrides supply live edits.
// Do not copy this into other documents: their existing drafts must remain independent.
export function sharedFooter(home:Doc,navigation:Record<string,string>={}){
 const template=home.template.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0];
 if(!template)return '';
 const values=new Map(home.fields.map(f=>[f.key,navigation[f.group+'|'+f.label+'|'+f.value]??f.value]));
 return template.replace(/\{\{(f\d+)\}\}/g,(_,key)=>esc(values.get(key)||'')).replace('<footer','<footer data-shared-footer="home"');
}
export function applySharedFooter(html:string,footer:string){
 if(!footer)return html;
 // Replace site footers after main; retain any semantic footer inside an article's own content.
 const end=html.indexOf('</main>');if(end<0)return html;
 const before=html.slice(0,end+7),after=html.slice(end+7).replace(/<footer\b[\s\S]*?<\/footer>/gi,'');
 return (before+footer+after).replace('</head>','<link rel="stylesheet" href="/assets/shared-footer.css"><script src="/assets/footer-wordmark.js" defer></script></head>');
}

// Presentation only: retain the branding link and all stored logo settings.
export function renderFooterWordmark(html:string){
 return html.replace(/<footer\b[^>]*data-shared-footer[^>]*>[\s\S]*?<\/footer>/gi,footer=>
  footer.replace(/(<a\b[^>]*class="[^"]*\bv8-footer-logo\b[^"]*"[^>]*>)[\s\S]*?<\/a>/gi,(_,open)=>
   open+'<span class="footer-brand-lockup"><img class="footer-brand-symbol" src="/agentur/assets/aroz-mark.webp" width="512" height="449" alt="" aria-hidden="true" loading="lazy" decoding="async"><span class="footer-wordmark"><span class="footer-wordmark-name">AROZ</span><span class="footer-wordmark-subtitle">Website Agentu<span class="footer-wordmark-last">r</span></span></span></span></a>'
  )
 );
}
