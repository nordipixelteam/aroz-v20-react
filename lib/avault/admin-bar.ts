import {esc,Doc} from './store';

// WordPress-style toolbar shown on public pages to signed-in AVAULT users only. The response is already
// no-store, so a page rendered with the bar is never cached for visitors.
export function adminBar(user:{email:string;role:string},doc:Doc,newLeads:number){
 const view=doc.kind==='post'?'blogs':'pages';const edit=`/avault/?view=${view}&route=${encodeURIComponent(doc.route)}`;
 const item=(href:string,label:string,extra='')=>`<a href="${esc(href)}"${extra}>${label}</a>`;
 return `<div id="avault-bar" role="navigation" aria-label="AVAULT toolbar"><style>
html{margin-top:40px!important}.header-wrap{top:40px!important}
#avault-bar{position:fixed;inset:0 0 auto 0;height:40px;z-index:2147483000;display:flex;align-items:center;gap:4px;padding:0 12px;background:#062744;color:#fff;font:700 12px/1 Arial,sans-serif;letter-spacing:.01em;box-shadow:inset 0 -2px #cc293c}
#avault-bar a,#avault-bar button{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 12px;border-radius:2px;color:#fff;text-decoration:none;background:none;border:1px solid transparent;font:inherit;cursor:pointer;white-space:nowrap}
#avault-bar a:hover,#avault-bar button:hover{background:#fff;color:#062744}
#avault-bar .avb-brand{font-family:Georgia,serif;font-weight:700;font-size:15px;letter-spacing:.04em}
#avault-bar .avb-brand::before{content:"A";display:grid;place-items:center;width:20px;height:20px;background:#cc293c;color:#fff;font:700 12px/1 Georgia,serif}
#avault-bar .avb-edit{background:#cc293c;color:#fff}#avault-bar .avb-edit:hover{background:#fff;color:#062744}
#avault-bar .avb-count{min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#fff;color:#062744;font-size:11px;display:inline-grid;place-items:center}
#avault-bar .avb-status{padding:0 10px;color:#c7d3dc;font-weight:500}
#avault-bar .avb-right{margin-left:auto;display:flex;align-items:center;gap:4px}
#avault-bar form{margin:0}
@media(max-width:760px){#avault-bar .avb-hide{display:none}}
</style>
${item('/avault/','AVAULT',' class="avb-brand"')}
${item(edit,doc.kind==='post'?'Edit post':'Edit page',' class="avb-edit"')}
${item('/avault/?view=leads',`Leads${newLeads?` <span class="avb-count">${newLeads}</span>`:''}`,' class="avb-hide"')}
${item('/avault/?view=seo','SEO review',' class="avb-hide"')}
${doc.seo.noindex?'<span class="avb-status avb-hide">Hidden from search</span>':''}
<span class="avb-right"><span class="avb-status avb-hide">${esc(user.email)}</span><form method="post" action="/api/admin/logout/"><button type="submit">Sign out</button></form></span></div>`;
}
