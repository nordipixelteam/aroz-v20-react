// The shared header and footer as the AVAULT visual editor draws them. Placeholders ({{fN}}) stay in place
// and every editable spot is tagged: `data-av-k="fN"` on an element whose text is field fN, and
// `data-av-a="href=f3,aria-label=f4"` on an element whose attributes are fields. Scripts are dropped.
export type NavCanvas={styles:string[];header:string;footer:string;bodyAttrs:string};

export function tagFields(html:string){
 const parts=html.split(/(<[^>]+>)/);
 for(let i=0;i<parts.length;i++){const p=parts[i];
  if(p.startsWith('<')){
   if(p.startsWith('</')||p.startsWith('<!'))continue;
   const attrs=[...p.matchAll(/\s([a-zA-Z-]+)="\{\{(f\d+)\}\}"/g)].map(m=>m[1]+'='+m[2]);
   if(attrs.length)parts[i]=p.replace(/\s*(\/?)>$/,` data-av-a="${attrs.join(',')}"$1>`);
   continue;
  }
  if(!p.includes('{{'))continue;
  // A placeholder that is an element's whole content tags that element; anything else gets its own span.
  const sole=p.match(/^\{\{(f\d+)\}\}$/),open=parts[i-1]||'',name=open.match(/^<([a-zA-Z0-9]+)/)?.[1];
  if(sole&&name&&!open.startsWith('</')&&(parts[i+1]||'').toLowerCase()===`</${name.toLowerCase()}>`){parts[i-1]=parts[i-1].replace(/\s*(\/?)>$/,` data-av-k="${sole[1]}"$1>`);continue}
  parts[i]=p.replace(/\{\{(f\d+)\}\}/g,'<span data-av-k="$1" data-av-wrap>{{$1}}</span>');
 }
 return parts.join('');
}

export function navCanvas(template:string):NavCanvas{
 const styles=[...template.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)].map(m=>m[0].match(/href="([^"]+)"/)?.[1]||'').filter(Boolean);
 const bodyAttrs=template.match(/<body\b([^>]*)>/)?.[1]||'';
 const start=template.search(/<div class="header-wrap">|<header\b/),headerEnd=template.indexOf('</header>');
 let header=start>=0&&headerEnd>start?template.slice(start,headerEnd+9):'';
 if(header.startsWith('<div class="header-wrap">'))header+='</div>';
 const mainEnd=template.indexOf('</main>'),footerEnd=template.lastIndexOf('</footer>');
 const footer=mainEnd>=0&&footerEnd>mainEnd?template.slice(mainEnd+7,footerEnd+9):'';
 const clean=(s:string)=>s.replace(/<script\b[\s\S]*?<\/script>/gi,'');
 return {styles,header:tagFields(clean(header)),footer:tagFields(clean(footer)),bodyAttrs};
}
