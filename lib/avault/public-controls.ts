import {settingsRead} from './runtime';
import {esc,allDocs,db,clientIp} from './store';
import {HONEYPOT} from './spam';
import {applyForms} from './forms';
import {countryOf} from './geo';
import {normalizeScripts,pageMatches,renderSnippet} from './snippets';
import {matchesIP} from './ip';
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
 if(/<form\b[^>]*class="[^"]*\baudit-form\b[^"]*"/i.test(html))head+='<script src="/avault-forms.js" defer></script>';
 // Lead forms get a hidden honeypot field. People never see or reach it; form bots fill it in.
 html=html.replace(/<form\b[^>]*class="[^"]*\baudit-form\b[^"]*"[^>]*>/g,tag=>tag+`<div class="av-hp" aria-hidden="true"><label>Leave this field empty<input type="text" name="${HONEYPOT}" tabindex="-1" autocomplete="off" value=""></label></div>`);
 // Every page's footer links to the privacy policy once it is published.
 const privacy=await db().prepare('SELECT published FROM documents WHERE route=?').bind('/privacy-policy/').first<{published:string|null}>();
 if(privacy?.published&&!html.includes('href="/privacy-policy/"'))html=html.replace(/(<div class="footer-utility">[\s\S]*?)(<\/div>)/,'$1<a href="/privacy-policy/">Privacy policy</a>$2');
 if(route==='/blogs/'){const categories=new Map((await db().prepare('SELECT id,label FROM taxonomy').all<any>()).results.map(t=>[t.id,t.label]));const docs=Object.values(await allDocs()).filter(d=>d.kind==='post'&&!d.seo.noindex);html=html.replace('</main>',`<section class="shell-wide avault-content-block"><h2>All blog posts</h2><div class="avault-content-cards">${docs.map(d=>`<article>${d.featuredImage?`<img src="${esc(d.featuredImage)}" alt="${esc(d.featuredAlt||'')}" loading="lazy" decoding="async">`:''}<h3><a href="${esc(d.route)}">${esc(d.label)}</a></h3><p>${esc(d.excerpt||d.seo.description)}</p><small>${[d.author,d.category?categories.get(d.category)||d.category:''].filter(Boolean).map(esc).join(' · ')}</small></article>`).join('')}</div></section></main>`)}
 return {html:html.replace('</head>',head+'</head>'),nonce,customScripts:live.length>0};
}
