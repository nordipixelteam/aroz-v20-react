import {settingsRead} from '@/lib/avault/runtime';
import {enhancePublic,trafficAllowed} from '@/lib/avault/public-controls';
import {allDocs,readDoc,globals,headers,db,bucket} from '@/lib/avault/store';
import {render,sitemap,SITEMAP_FILES} from '@/lib/avault/render';
import {CONFIG} from '@/lib/avault/config';
import {mongoDb} from '@/db/mongo';
import {adminBar} from '@/lib/avault/admin-bar';
import {systemPage,SYSTEM_PAGE_ROUTE,type SystemPage} from '@/lib/avault/system-pages';
export const dynamic='force-dynamic';
// Canonicals, schema, sitemaps and robots always use the configured production domain.
function publicOrigin(_req:Request){return CONFIG.origin;}
const PAGE_CSP=(nonce:string)=>`default-src 'self'; script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn-uicons.flaticon.com; font-src 'self' data: https://cdn-uicons.flaticon.com; img-src 'self' data: https:; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'`;
// Thank-you and 404 pages are drawn inside the homepage's header and footer (see system-pages.ts).
async function homeShellPage(req:Request,kind:SystemPage,status:number){const headersOut={...headers,'Content-Type':'text/html; charset=utf-8',...(kind==='contact'?{}:{'X-Robots-Tag':'noindex'})};
 try{const home=await readDoc('/');if(home){const [g,registry]=await Promise.all([globals(),allDocs()]);const route=SYSTEM_PAGE_ROUTE[kind];const enhanced=await enhancePublic(systemPage(kind,home,g,registry,publicOrigin(req)),route);return new Response(enhanced.html,{status,headers:{...headersOut,'Content-Security-Policy':PAGE_CSP(enhanced.nonce)}})}}catch{}
 return kind==='not-found'?errorPage(req,'/not-found/',404,'Page not found'):new Response(`<!doctype html><html lang="en"><head><meta name="robots" content="noindex"><title>Thank you | ${CONFIG.name}</title></head><body><main><h1>Thank you</h1><p>Your request has reached the ${CONFIG.name} team. <a href="/">Return to ${CONFIG.name}</a>.</p></main></body></html>`,{status,headers:headersOut})}
// 404 / 403 responses use the AVAULT-managed pages (site header, footer and design); a plain fallback covers a missing page.
async function errorPage(req:Request,route:string,status:number,title:string){const headersOut={...headers,'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex'};
 try{const d=await readDoc(route);if(d){const [g,registry]=await Promise.all([globals(),allDocs()]);const enhanced=await enhancePublic(render(d,g,false,registry,publicOrigin(req)),route);return new Response(enhanced.html,{status,headers:{...headersOut,'Content-Security-Policy':PAGE_CSP(enhanced.nonce)}})}}catch{}
 return new Response(`<!doctype html><html lang="en"><head><meta name="robots" content="noindex"><title>${title} | ${CONFIG.name}</title></head><body><main><h1>${title}</h1><p><a href="/">Return to ${CONFIG.name}</a> or call <a href="tel:${CONFIG.phone}">${CONFIG.phoneDisplay}</a>.</p></main></body></html>`,{status,headers:headersOut})}
// Relative Location keeps visitors on the domain they used; the app itself only sees its internal address.
function relativeRedirect(location:string,status:number){return new Response(null,{status,headers:{Location:location,'Cache-Control':'no-store'}})}
export async function GET(req:Request){const u=new URL(req.url);const path=u.pathname;
 try{
 if(!await trafficAllowed(req))return errorPage(req,'/access-denied/',403,'Access unavailable');
 if(path.startsWith('/media/')){const media=await db().prepare('SELECT id,name,mime FROM media WHERE key=?').bind(path.slice(7)).first<{id:string;name:string;mime:string}>();if(!media)return new Response('Not found',{status:404});const object=await bucket().get(path.slice(7));if(!object)return new Response('Not found',{status:404});const mime=object.httpMetadata?.contentType||media.mime||'application/octet-stream';return new Response(object.body,{headers:{...headers,'Content-Type':mime,'Cache-Control':'public, max-age=31536000, immutable',...(!mime.startsWith('image/')?{'Content-Disposition':`inline; filename="${String(media.name||path.slice(7)).replace(/["\r\n]/g,'')}"`}:{})}})}
 if(path==='/robots.txt'){const origin=publicOrigin(req);return new Response(((await settingsRead('files')).value.robots||'')+'\n'+`User-agent: *\nAllow: /\nDisallow: /avault\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`,{headers:{'Content-Type':'text/plain'}})}
 if(path==='/llms.txt'){const docs=await allDocs(),origin=publicOrigin(req);return new Response(((await settingsRead('files')).value.llms||'')+`\n# ${CONFIG.name}\n\nCommercial door repair and hardware services across Washington, D.C., Maryland, and Virginia.\n\n## Pages\n${Object.values(docs).filter(d=>!d.seo.noindex).map(d=>`- [${d.label}](${origin+d.route}): ${d.seo.description}`).join('\n')}`,{headers:{'Content-Type':'text/plain; charset=utf-8'}})}
 // The old underscore sitemap names moved to sm-pages.xml etc.; anything that still asks for them is sent on.
 if(Object.hasOwn(SITEMAP_FILES,path.slice(1)))return new Response(null,{status:301,headers:{Location:'/'+SITEMAP_FILES[path.slice(1)],'Cache-Control':'public, max-age=86400'}});
 const sitemapKind=path==='/sitemap.xml'?'sitemap.xml':Object.entries(SITEMAP_FILES).find(([,f])=>'/'+f===path)?.[0];
 if(sitemapKind){const docs=await allDocs(),maps=(await settingsRead('files')).value.sitemaps||{};return new Response(sitemap(docs,sitemapKind,publicOrigin(req),maps),{headers:{'Content-Type':'application/xml; charset=utf-8'}})}
 const redirects=(await mongoDb()).collection('redirects');const redirect=await redirects.findOne({source:path,enabled:{$ne:false}});if(redirect){void redirects.updateOne({source:path},{$inc:{hits:1},$set:{last_hit_at:new Date().toISOString()}}).catch(()=>{});const target=new URL(String(redirect.destination),u.origin);if(target.origin!==u.origin)return new Response(null,{status:Number(redirect.status)||308,headers:{Location:target.href,'Cache-Control':'no-store'}});if(!target.search)target.search=u.search;return relativeRedirect(target.pathname+target.search,Number(redirect.status)||308)}
 if(!path.endsWith('/')&&!path.includes('.'))return relativeRedirect(path+'/'+u.search,308);
 if(path==='/thank-you/')return homeShellPage(req,'thank-you',200);
 const d=await readDoc(path);
 // The DMV contact page is stored in AVAULT at /contact-us/ like every other public page.
 if(!d)return homeShellPage(req,'not-found',404);
 // The managed error pages keep their error status even when opened directly.
 if(path==='/not-found/')return homeShellPage(req,'not-found',404);
 if(path==='/access-denied/')return errorPage(req,path,403,d.label);
 const [globalSettings,registry]=await Promise.all([globals(),allDocs()]);const enhanced=await enhancePublic(render(d,globalSettings,false,registry,publicOrigin(req)),path);
 // Signed-in AVAULT users get the toolbar; everyone else gets the page untouched.
 if(/(?:^|;\s*)avault_session=/.test(req.headers.get('cookie')||'')){const {sessionUser}=await import('@/lib/avault/auth');const user=await sessionUser(req).catch(()=>null);if(user){const newLeads=await (await mongoDb()).collection('forms').countDocuments({status:'new'});enhanced.html=enhanced.html.replace(/(<body\b[^>]*>)/,'$1'+adminBar(user,d,newLeads))}}return new Response(enhanced.html,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':`default-src 'self'; script-src 'self' 'nonce-${enhanced.nonce}' https://cdn.jsdelivr.net ${enhanced.customScripts?"https:":""}; style-src 'self' 'unsafe-inline' https://cdn-uicons.flaticon.com; font-src 'self' data: https://cdn-uicons.flaticon.com; img-src 'self' data: https:; media-src 'self' https: blob:; connect-src 'self' ${enhanced.customScripts?'https:':''}; frame-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'`}});
 }catch(e){console.error('Public render unavailable:',e instanceof Error?e.message:'unknown error');return new Response('The website is temporarily unavailable. Please try again shortly.',{status:503,headers:{...headers,'Retry-After':'60','X-Robots-Tag':'noindex'}})}
}
