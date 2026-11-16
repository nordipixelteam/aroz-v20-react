// Operates on a detached section element: reuse Web Design's field-backed hero structure.
export function updateMenuHero(section,{route,buttons=[],secondaryAnchor=true}){
 const document=section.ownerDocument;
 function groupReferenceTail(heading){
  if(route!=='/webdesign/'||heading.querySelector('[data-av-hero-tail]'))return;
  const accent=heading.querySelector('.accent'),before=accent?.previousSibling;
  if(!accent||before?.nodeType!==3)return;
  const parts=before.textContent.match(/^(.*\S)\s+(\S+)\s*$/);
  if(!parts)return;
  before.textContent=parts[1]+' ';
  const tail=document.createElement('span');tail.dataset.avHeroTail='reference';
  before.after(tail);tail.append(parts[2]+' ',accent);
 }
 if(section.dataset.avHero==='shared'){groupReferenceTail(section.querySelector('h1'));return section.outerHTML;}
 const clone=selector=>section.querySelector(selector)?.cloneNode(true);
 const heading=clone('h1'),description=clone('.hero-lead')||clone('.hero-bottom > p');
 const meta=clone('.hero-meta,.hero-topline,.hero-top,.crumb');
 if(!heading||!description||!meta)throw Error('Missing original hero content at '+route);
 const extras={
  '/webdesign/':['figure.hero-stage'],
  '/seo/':['.search-sequence','.hero-endpoint'],
  '/ki-seo/':['.hero-index','.hero-endnote'],
  '/copywriting/':['.proof','.hero-note','.hero-slash'],
  '/agentur/':['.hero-side','.hero-media','.hero-signature','.hero-scroll'],
  '/projekte/':['.hero-count','.hero-mark'],
  '/kontakt/':['.hero-media'],
 };
 if(!extras[route])throw Error('Hero upgrade is limited to approved menu routes.');
 const supplement=extras[route].map(clone).filter(Boolean);
 const anchors=[...section.querySelectorAll('.hero-actions a')].map(a=>a.cloneNode(true));
 for(const button of buttons){const a=document.createElement('a');a.setAttribute('href',button.href);a.textContent=button.text;anchors.push(a)}
 if(anchors.length!==2)throw Error('Exactly two hero buttons are required at '+route);
 heading.className='hero-title av-hero-title';
 heading.innerHTML=heading.innerHTML.replace(/<br\s*\/?\s*>/gi,' ').replace(/<\/span>\s*<span/g,'</span> <span');
 const accent=heading.querySelector('.accent,em,.mark')||(route==='/projekte/'?heading.querySelector('span'):null);
 if(!accent)throw Error('Missing editable heading accent at '+route);
 accent.classList.add('av-hero-accent');
 groupReferenceTail(heading);
 description.className='hero-lead av-hero-description';
 const top=document.createElement('div');top.className='hero-meta av-hero-meta';
 if(meta.classList.contains('crumb')){
  const left=document.createElement('div');left.className='av-hero-breadcrumb';left.append(...meta.childNodes);top.append(left);
  const right=clone('.proof-top > span');if(right)top.append(right);
 }else top.append(...meta.childNodes);
 const actions=document.createElement('div');actions.className='hero-actions av-hero-actions';
 anchors.forEach((a,index)=>{
  a.className=index===0?'btn primary av-hero-button av-hero-primary':'text-link av-hero-button av-hero-secondary';
  // Web Design already has separately editable arrow spans. Other pages use the same decoration.
  const spans=[...a.querySelectorAll('span')];
  if(!spans.length){a.textContent=a.textContent.replace(/\s*[\u2197\u2198\u2193\u2192]\s*$/,'');const arrow=document.createElement('span');arrow.className='av-hero-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent=index===0?'\u2197':secondaryAnchor?'\u2193':'\u2197';a.append(' ',arrow)}
  else spans.forEach(s=>{s.classList.add('av-hero-arrow');s.setAttribute('aria-hidden','true')});
  actions.append(a);
 });
 const bottom=document.createElement('div');bottom.className='hero-bottom av-hero-bottom';bottom.append(description,actions);
 const shell=document.createElement('div');shell.className='shell av-hero-shell';shell.append(top,heading,bottom);
 if(supplement.length){const auxiliary=document.createElement('div');auxiliary.className='av-hero-supplement';if(route==='/ki-seo/'){auxiliary.classList.add('hero-stage');auxiliary.dataset.state='1'}auxiliary.append(...supplement);shell.append(auxiliary)}
 section.classList.add('av-service-hero');section.dataset.avHero='shared';section.replaceChildren(shell);
 return section.outerHTML;
}
