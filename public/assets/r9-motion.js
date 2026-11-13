/* AROZ R9 Motion QA — progressive, content-first, no network, no external dependencies. */
(()=>{
'use strict';
const root=document.body;
if(!root||root.classList.contains('r9-motion-page'))return;
root.classList.add('r9-motion-page');
const theme=root.dataset.r8Theme||'studio';
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const sections=Array.from(document.querySelectorAll('main > section')).filter(el=>el.querySelector('h1,h2'));
const titles=sections.map(el=>{
 const h=el.querySelector('h1,h2');
 return (h?Array.from(h.childNodes).map(n=>n.textContent).join(' '):'Abschnitt').replace(/\s+/g,' ').replace(/[↗↘→]/g,'').trim().replace(/\.$/,'').slice(0,55);
});
const chapters=sections.length;
const make=(tag,cls)=>{const el=document.createElement(tag);el.className=cls;return el;};
const track=make('div','r9-scroll-track');track.setAttribute('aria-hidden','true');
const progress=make('div','r9-scroll-bar');track.append(progress);root.append(track);
const rail=make('div','r9-chapter-rail');rail.setAttribute('aria-hidden','true');
const counter=make('span','r9-chapter-counter');const label=make('span','r9-chapter-label');
rail.append(counter,label);root.append(rail);
const desktop=()=>window.matchMedia('(min-width:900px) and (pointer:fine)').matches;
const shouldMove=()=>desktop()&&!reduced.matches&&!document.hidden;
const selectorMap={
 studio:['.hero-photo img','.manifesto-media figure img','.project-media img'],
 agency:['.approach-image img','.local-visual img','.manifesto-proof figure img'],
 webdesign:['.hero-stage img','.manifesto-visual figure img','.route-image img'],
 seo:['.why-media img','.local-media img'],
 ai:['.analysis-media img'],
 copy:['.brand-photo img'],
 portfolio:['.case-media img','.real-site-showcase img','.hero-card img','.website-reveal img','.visual-band img','.local-visual img'],
 contact:['.hero-media img','.location-visual img']
};
const selectors=['.r6-case-media img','.r6-aside-photo img',...(selectorMap[theme]||selectorMap.portfolio)];
const frames=[];
const isDecoration=(img)=>/\b(mark|slash|logo|icon|signature)\b/i.test((img.className?.baseVal||img.className||'')+' '+(img.getAttribute('src')||'')) || !img.getAttribute('alt')?.trim();
function frameFor(img){
 let el=img.parentElement;
 while(el&&el!==document.body&&el!==document.documentElement){
  if(el.matches('figure,picture,a.project-media,a.route-image,div.r6-case-media,div.r6-aside-photo,div.hero-media,div.approach-image,div.local-visual,div.analysis-media,div.case-media,div.hero-card,div.website-reveal,div.real-site-showcase,div.visual-band')){
   if(el.querySelectorAll('img').length===1 && getComputedStyle(el).position!=='sticky' && !el.closest('.hero-sticky,.founders-stage,.sticky-story,.sticky-visual,[data-sticky]'))return el;
  }
  if(el.matches('section,main,article'))break;
  el=el.parentElement;
 }
 return null;
}
for(const selector of selectors){
 for(const img of document.querySelectorAll(selector)){
  if(frames.length>=3)break;
  if(img.dataset.r9Depth||isDecoration(img))continue;
  const frame=frameFor(img);
  if(!frame||frame.getBoundingClientRect().width<230||frame.getBoundingClientRect().height<210)continue;
  img.dataset.r9Depth=String(14+frames.length*4);
  img.classList.add('r9-depth-image');frame.classList.add('r9-motion-frame');
  frames.push({img,frame,shift:14+frames.length*4});
 }
 if(frames.length>=3)break;
}
let chapterPositions=[],docHeight=1,height=window.innerHeight,now=-1,pending=false,renderCount=0;
function recalc(){
 height=window.innerHeight;
 docHeight=Math.max(1,document.documentElement.scrollHeight-height);
 chapterPositions=sections.map(el=>el.getBoundingClientRect().top+scrollY);
}
function render(){
 pending=false;renderCount++;
 const y=window.scrollY||0;
 progress.style.transform=`scaleX(${Math.max(0,Math.min(1,y/docHeight)).toFixed(5)})`;
 if(chapters){
  let idx=0;const mark=y+height*.45;
  for(let k=0;k<chapterPositions.length;k++){if(chapterPositions[k]<=mark)idx=k;else break;}
  if(now!==idx){now=idx;counter.textContent=String(idx+1).padStart(2,'0')+' / '+String(chapters).padStart(2,'0');label.textContent=titles[idx]||'Abschnitt';}
  rail.classList.toggle('r9-visible',desktop()&&y>Math.max(340,height*.50));
 }
 const active=shouldMove();
 for(const {img,frame,shift} of frames){
  const rect=frame.getBoundingClientRect();
  const visible=rect.bottom>0&&rect.top<height;
  img.classList.toggle('r9-depth-active',visible&&active);
  if(!active){img.style.setProperty('--r9-shift','0px');continue;}
  if(!visible)continue;
  const halfFrame=Math.max(1,rect.height*.5);
  const ratio=(height*.50-(rect.top+halfFrame))/Math.max(1,height*.50+halfFrame);
  // Scale 1.10 creates ~5% overhang each edge. Keep 1% safety margin.
  const safeDistance=Math.max(0,rect.height*.04);
  const max=Math.min(safeDistance,shift);
  img.style.setProperty('--r9-shift',(Math.max(-1,Math.min(1,ratio))*max).toFixed(2)+'px');
 }
}
function request(){if(pending)return;pending=true;requestAnimationFrame(render)}
function refresh(){recalc();request()}
window.addEventListener('scroll',request,{passive:true});
window.addEventListener('resize',refresh,{passive:true});
window.addEventListener('load',refresh,{once:true});
window.addEventListener('pageshow',refresh);
document.addEventListener('visibilitychange',request);
reduced.addEventListener?.('change',request);
if('ResizeObserver'in window){let scheduled=false;new ResizeObserver(()=>{
 if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;recalc();request();});
}).observe(document.documentElement)}
// No element is initially hidden. Reduced-motion and no-JS work without reveal dependencies.
if(!reduced.matches&&'IntersectionObserver'in window&&Element.prototype.animate){
 const headings=Array.from(document.querySelectorAll('main > section h1,main > section h2')).filter(el=>!el.classList.contains('reveal')).slice(0,22);
 const io=new IntersectionObserver(entries=>{for(const e of entries){if(!e.isIntersecting)continue;io.unobserve(e.target);
  e.target.animate([{opacity:1,translate:'0 9px'},{opacity:1,translate:'0 0'}],{duration:480,easing:'cubic-bezier(.22,1,.36,1)'});
 }},{threshold:.17,rootMargin:'0px 0px -6% 0px'});
 headings.forEach(el=>io.observe(el));
}
refresh();
window.__AROZ_R9_MOTION__={version:'9.0.0-review',theme,chapterCount:chapters,parallaxCount:frames.length,getState:()=>({reduced:reduced.matches,desktop:desktop(),renderCount,activeChapter:now,scrollFraction:Number((window.scrollY/docHeight).toFixed(3)),targets:frames.map(({img,frame})=>({y:img.style.getPropertyValue('--r9-shift'),height:Math.round(frame.getBoundingClientRect().height),frameTag:frame.tagName}))})};
})();
