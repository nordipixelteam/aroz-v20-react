import sanitizeHtml from 'sanitize-html';
import {HttpError} from './store';

// Rich article bodies (blog posts). Stored as allowlisted HTML and rendered into the template's {{BODY}} slot.
// The title field owns the page's single H1, so any H1 in the body becomes an H2.
export const BODY_SLOT='{{BODY}}';
const HOSTS_OK=/^(https?:|mailto:|tel:|\/(?!\/)|#)/i;
export function sanitizeBody(value:unknown){const html=String(value??'');if(html.length>400000)throw new HttpError(422,'The article is too long.');
 return sanitizeHtml(html,{
  allowedTags:['p','h2','h3','h4','h5','h6','strong','b','em','i','u','s','del','mark','sup','sub','code','pre','blockquote','ul','ol','li','a','img','figure','figcaption','table','thead','tbody','tr','th','td','hr','br','span','div'],
  allowedAttributes:{a:['href','target','rel','title'],img:['src','alt','title','width','height','loading'],th:['colspan','rowspan','style'],td:['colspan','rowspan','style'],span:['style'],mark:['style','data-color'],p:['style'],h2:['style'],h3:['style'],h4:['style'],h5:['style'],h6:['style'],li:['style'],div:['class'],ol:['start']},
  allowedClasses:{div:['article-table']},
  allowedStyles:{'*':{'text-align':[/^(left|right|center|justify)$/]},span:{color:[/^#[0-9a-f]{3,8}$/i,/^rgb\([\d\s,.%]+\)$/i],'background-color':[/^#[0-9a-f]{3,8}$/i,/^rgb\([\d\s,.%]+\)$/i]},mark:{'background-color':[/^#[0-9a-f]{3,8}$/i,/^rgb\([\d\s,.%]+\)$/i]}},
  allowedSchemes:['http','https','mailto','tel'],allowedSchemesAppliedToAttributes:['href','src'],allowProtocolRelative:false,
  transformTags:{h1:'h2',b:'strong',i:'em',a:(tag,attribs)=>{const href=String(attribs.href||'');const out:Record<string,string>={href};if(attribs.target==='_blank')out.target='_blank';
   // New-tab links always get noopener noreferrer; nofollow/sponsored/ugc are kept only when chosen.
   const rel=new Set(String(attribs.rel||'').split(/\s+/).filter(r=>['nofollow','sponsored','ugc'].includes(r)));if(out.target)['noopener','noreferrer'].forEach(r=>rel.add(r));if(rel.size)out.rel=[...rel].join(' ');if(attribs.title)out.title=attribs.title;return {tagName:'a',attribs:out}},
   img:(tag,attribs)=>({tagName:'img',attribs:{...attribs,loading:'lazy'}})},
  exclusiveFilter:frame=>(frame.tag==='a'&&!HOSTS_OK.test(String(frame.attribs.href||'')))?false:(frame.tag==='img'&&!/^(https:\/\/|\/(?!\/))/i.test(String(frame.attribs.src||''))),
 }).trim();
}
// Tables from the editor are wrapped in the site's scrollable, bordered table container.
export function wrapTables(html:string){return html.replace(/<div class="article-table">\s*(<table\b[\s\S]*?<\/table>)\s*<\/div>/g,'$1').replace(/<table\b[\s\S]*?<\/table>/g,t=>`<div class="article-table">${t}</div>`)}
export const bodyLinks=(html?:string)=>[...String(html||'').matchAll(/<a\b[^>]*href="([^"]*)"/g)].map(m=>m[1].replace(/&amp;/g,'&'));
export const bodyImages=(html?:string)=>[...String(html||'').matchAll(/<img\b[^>]*>/g)].map(m=>({src:(m[0].match(/src="([^"]*)"/)||[])[1]||'',alt:(m[0].match(/alt="([^"]*)"/)||[])[1]??null}));
export const bodyH1=(html?:string)=>(String(html||'').match(/<h1\b/g)||[]).length;

// "Keep exploring" at the end of every post, chosen automatically: same category, then the same topic
// (the eyebrow above the title), then shared title words, newest first. Always ends with the blog index.
export const RELATED_SLOT='{{RELATED}}';
type Post={route:string;label:string;kind:string;category?:string;template:string;fields:{key:string;value:string}[];seo:{noindex:boolean};publishedAt?:string;updatedAt?:string};
const ARROW='<svg class="cta-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7"/></svg>';
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function postTopic(d:Post){const html=d.template.match(/<p class="article-eyebrow">[\s\S]*?<\/p>/)?.[0]||'';return [...html.matchAll(/\{\{(f\d+)\}\}/g)].map(m=>d.fields.find(f=>f.key===m[1])?.value||'').join('').replace(/\s+/g,' ').trim().toLowerCase()}
const words=(s:string)=>new Set(s.toLowerCase().match(/[a-z]{4,}/g)||[]);
export function relatedPosts(d:Post,registry:Record<string,Post>,count=2){const topic=postTopic(d),mine=words(d.label);
 return Object.values(registry).filter(p=>p.kind==='post'&&p.route!==d.route&&p.route!=='/blog/'&&!p.seo.noindex).map(p=>{let score=0;if(d.category&&p.category===d.category)score+=6;if(topic&&postTopic(p)===topic)score+=4;for(const w of words(p.label))if(mine.has(w))score+=1;return {p,score}})
  .sort((a,b)=>b.score-a.score||String(b.p.publishedAt||b.p.updatedAt||'').localeCompare(String(a.p.publishedAt||a.p.updatedAt||''))).slice(0,count).map(x=>x.p)}
export function relatedHtml(d:Post,registry:Record<string,Post>){const posts=relatedPosts(d,registry);
 return `<aside class="article-related" aria-label="Related articles"><h2>Keep exploring.</h2>${posts.map(p=>`<a href="${escape(p.route)}"><span>${escape(p.label)}</span>${ARROW}</a>`).join('')}<a href="/blog/">All articles ${ARROW}</a></aside>`}
