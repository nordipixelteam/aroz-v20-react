import {compose} from './blocks';
import {CONFIG} from './config';
import {fixIcons} from './icon-fix';
import {tagFields} from './nav-canvas';
import {markSections} from './section-library';
import {Doc,esc} from './store';
import {profile,organizationNode,syncSocialLinks,customSchemaNodes} from './site';
import {BODY_SLOT,RELATED_SLOT,wrapTables,bodyImages,relatedHtml} from './rich';
const text=(s:string)=>s.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').trim();
const absolute=(s:string,origin=CONFIG.origin)=>new URL(s,origin).href;
// canvas: the AVAULT live editor's copy. Every {{fN}} spot in the body is tagged (see tagFields) before values go in.
export function render(d:Doc,g:Record<string,any>={},preview=false,registry:Record<string,Doc>={},origin=CONFIG.origin,canvas=false,interactivePreview=false){
 const nav=g.navigation||{};
 // The canvas also shows hidden sections (faded), so they can be found and shown again.
 let html=canvas?compose(markSections(d.template,d.hiddenSections),d.sectionOrder,undefined,d.blocks).replace(/<body\b[\s\S]*$/,tagFields):compose(d.template,d.sectionOrder,d.hiddenSections,d.blocks);const minutes=d.body?Math.max(1,Math.round(d.body.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length/220)):0;const fields=new Map(d.fields.map(f=>[f.key,minutes&&/^\d+ min read$/.test(f.value)?`${minutes} min read`:nav[f.group+'|'+f.label+'|'+f.value]??f.value]));html=html.replace(/\{\{(f\d+)\}\}/g,(_,k)=>esc(fields.get(k)||''));
 // Rich article body (already sanitized on save) goes in after field values, so it is never re-processed.
 html=html.replace(BODY_SLOT,()=>wrapTables(d.body||''));
 html=html.replace(RELATED_SLOT,()=>relatedHtml(d as any,registry as any));
 // Global contact values are resolved in every rendered page, not copied over saved records.
 if(g.name)html=html.replaceAll(CONFIG.name,esc(g.name));
 const phone=String(g.phone||''),digits=phone.replace(/\D/g,'').replace(/^1(?=\d{10}$)/,''),phoneText=digits.length===10?`(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`:phone,tel='tel:'+phone.replace(/[^+0-9]/g,'');
 if(CONFIG.email)html=html.replaceAll(CONFIG.email,esc(String(g.email||'')));
 if(CONFIG.phone)html=html.replaceAll('tel:'+CONFIG.phone.replace(/[^+0-9]/g,''),esc(tel)).replaceAll(CONFIG.phone,esc(phone));
 if(CONFIG.phoneDisplay)html=html.replaceAll(CONFIG.phoneDisplay,esc(phoneText));
 if(g.logo)html=html.replace(/(<img\b[^>]*\bsrc=")[^"]*("[^>]*(?:class="[^"]*(?:logo|brand)[^"]*"|alt="[^"]*(?:AROZ|logo)[^"]*")[^>]*>)/gi,`$1${esc(g.logo)}$2`);
 html=syncSocialLinks(html,g);
 html=fixIcons(html);
 // Imported pages historically stored public assets as `assets/...`. Root them so nested routes do not
 // request `/service-slug/assets/...` and 404. External, anchor, mail, phone, and ordinary page links stay unchanged.
 html=html.replace(/\b(src|href|poster|data-src)="((?:assets|media)\/[^"<>]*)"/gi,(_match,attr,value)=>`${attr}="/${value}"`);
 const p=profile(g);const title=d.seo.title.trim()||p.titleTemplate.replace('%s',d.label);const description=d.seo.description.trim()||d.excerpt||p.defaultDescription;const ogTitle=d.seo.ogTitle?.trim()||title,ogDescription=d.seo.ogDescription?.trim()||description;
 const canonical=origin+d.route;const image=absolute(d.seo.image||d.featuredImage||p.image,origin);const imageAlt=d.seo.image?d.seo.imageAlt:d.featuredImage?d.featuredAlt||d.seo.imageAlt:d.seo.imageAlt;const heading=text(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1]||d.label);
 const graph:Record<string,unknown>[]=[{...organizationNode(g,html,CONFIG.origin),telephone:phone},{'@type':'WebSite','@id':CONFIG.origin+'/#website',url:CONFIG.origin+'/',name:p.name,publisher:{'@id':CONFIG.origin+'/#organization'},inLanguage:CONFIG.language},{'@type':d.route==='/blogs/'||d.route==='/case-studies/'?'CollectionPage':'WebPage','@id':canonical+'#webpage',url:canonical,name:title,description,isPartOf:{'@id':CONFIG.origin+'/#website'},inLanguage:CONFIG.language,primaryImageOfPage:{'@type':'ImageObject',url:image,caption:imageAlt}}];
 if(d.kind==='service')graph.push({'@type':'Service','@id':canonical+'#service',name:heading,url:canonical,description,provider:{'@id':origin+'/#organization'},areaServed:{'@type':'AdministrativeArea',name:p.areaServed},mainEntityOfPage:{'@id':canonical+'#webpage'}});
 if(d.kind==='post'||d.kind==='case-study')graph.push({'@type':d.kind==='post'?'BlogPosting':'Article','@id':canonical+'#article',headline:heading,description,image:[image],author:d.author?{'@type':'Person',name:d.author,...(d.authorUrl?{url:absolute(d.authorUrl,origin)}:{})}:{'@id':origin+'/#organization'},...(d.category?{articleSection:d.category}:{}),publisher:{'@id':origin+'/#organization'},mainEntityOfPage:{'@id':canonical+'#webpage'},inLanguage:CONFIG.language,...(d.publishedAt?{datePublished:d.publishedAt}:{}),...(d.updatedAt?{dateModified:d.updatedAt}:{})});
 const faqSection=d.route==='/faqs/'?html:html.match(/<section\b[^>]*class="[^"]*(?:faq-section|\bfaq\b)[^"]*"[^>]*>([\s\S]*?)<\/section>/)?.[1];const faqItems=faqSection?[...faqSection.matchAll(/<details\b[^>]*class="[^"]*faq-item[^"]*"[^>]*>[\s\S]*?<summary\b[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)].map(match=>({question:text(match[1]),answer:text(match[2])})).filter(item=>item.question&&item.answer):[];if(faqItems.length)graph.push({'@type':'FAQPage','@id':canonical+'#faq',mainEntity:faqItems.map(item=>({'@type':'Question',name:item.question,acceptedAnswer:{'@type':'Answer',text:item.answer}}))});
 if(d.route!=='/') {const crumbs=[{name:registry['/']?.label||'Home',url:'/'}];const parts=d.route.split('/').filter(Boolean);for(let i=0;i<parts.length;i++){const route='/'+parts.slice(0,i+1).join('/')+'/';const page=registry[route];if(page||route===d.route)crumbs.push({name:route===d.route?heading:page?.label||heading,url:route});}graph.push({'@type':'BreadcrumbList','@id':canonical+'#breadcrumb',itemListElement:crumbs.map((c,i)=>({'@type':'ListItem',position:i+1,name:c.name,item:origin+c.url}))});}
 graph.push(...customSchemaNodes(d.seo.schema,canonical));
 const robots=preview?'noindex, nofollow':[d.seo.noindex?'noindex':'index',d.seo.nofollow?'nofollow':'follow',...(d.seo.noarchive?['noarchive']:[]),...(d.seo.noindex?[]:['max-image-preview:large','max-snippet:-1','max-video-preview:-1'])].join(', ');
 const schema=JSON.stringify({'@context':'https://schema.org','@graph':graph}).replaceAll(CONFIG.origin,origin).replace(/</g,'\\u003c');
 const metadata=`<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}"><meta name="robots" content="${robots}"><meta property="og:site_name" content="${esc(p.name)}"><meta property="og:title" content="${esc(ogTitle)}"><meta property="og:description" content="${esc(ogDescription)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:type" content="${d.kind==='post'?'article':'website'}"><meta property="og:locale" content="${CONFIG.locale}"><meta property="og:image" content="${esc(image)}"><meta property="og:image:alt" content="${esc(imageAlt)}">${d.kind==='post'&&d.publishedAt?`<meta property="article:published_time" content="${esc(d.publishedAt)}">`:''}${d.kind==='post'&&d.updatedAt?`<meta property="article:modified_time" content="${esc(d.updatedAt)}">`:''}${d.author?`<meta name="author" content="${esc(d.author)}">`:''}<meta name="twitter:card" content="${d.seo.twitterCard==='summary'?'summary':'summary_large_image'}"><meta name="twitter:title" content="${esc(ogTitle)}"><meta name="twitter:description" content="${esc(ogDescription)}"><meta name="twitter:image" content="${esc(image)}"><meta name="twitter:image:alt" content="${esc(imageAlt)}"><script type="application/ld+json">${schema}</script>`;
 html=html.replace('{{SEO}}',metadata);
 if(preview){
  html=html.replace(/<script\b(?![^>]*application\/ld\+json)([^>]*)>[\s\S]*?<\/script>/gi,(tag,attrs)=>interactivePreview&&/\bsrc=["']\/(?!\/)[^"']+["']/i.test(attrs)?tag:'');
  html=html.replace('<body','<body data-preview="true"');
 }
 return html;
}
// Public sitemap file names. Internally (and in saved settings) the older underscore names are the keys.
export const SITEMAP_FILES:Record<string,string>={'sm_pages.xml':'sm-pages.xml','sm_posts.xml':'sm-posts.xml','sm_images.xml':'sm-images.xml'};
export function sitemap(docs:Record<string,Doc>,kind:string,origin=CONFIG.origin,files:{exclude?:string[];custom?:Record<string,string[]>}={}){const excluded=new Set(files.exclude||[]);const eligible=Object.values(docs).filter(d=>!d.seo.noindex&&d.seo.sitemap!==false&&!excluded.has(d.route));const custom=(files.custom?.[kind]||[]).filter(u=>/^https:\/\//.test(u)||u.startsWith('/'));const xml=(s:string)=>esc(s);if(kind==='sitemap.xml')return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.values(SITEMAP_FILES).map(f=>`<sitemap><loc>${origin}/${f}</loc></sitemap>`).join('')}</sitemapindex>`;
 return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${eligible.filter(d=>kind==='sm_images.xml'||(kind==='sm_posts.xml'?d.kind==='post':d.kind!=='post')).map(d=>`<url><loc>${xml(origin+d.route)}</loc>${d.updatedAt?`<lastmod>${xml(d.updatedAt)}</lastmod>`:''}${kind==='sm_images.xml'?[...new Set([...d.fields.filter(f=>f.label==='img src').map(f=>f.value),...(d.blocks||[]).filter(b=>b.type==='image'&&b.url).map(b=>b.url!),...bodyImages(d.body).map(i=>i.src).filter(Boolean)])].map(src=>`<image:image><image:loc>${xml(absolute(src,origin))}</image:loc></image:image>`).join(''):''}</url>`).join('')}${kind==='sm_images.xml'?'':custom.map(u=>`<url><loc>${xml(absolute(u,origin))}</loc></url>`).join('')}</urlset>`;}
