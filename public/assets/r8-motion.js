/* AROZ R8 / 2026: native scroll choreography; no third-party code, no tracking. */
(()=>{
'use strict';
const root=document.body;
if(!root||root.classList.contains('r8-motion-page'))return;
const theme=root.dataset.r8Theme||'studio';
root.classList.add('r8-motion-page');
const mediaReduce=window.matchMedia('(prefers-reduced-motion: reduce)');
const chapters=Array.from(document.querySelectorAll('main > section')).filter(el=>el.querySelector('h1,h2'));
const count=chapters.length;
const scrollTrack=document.createElement('div');scrollTrack.className='r8-scroll-track';scrollTrack.setAttribute('aria-hidden','true');
const scrollBar=document.createElement('div');scrollBar.className='r8-scroll-bar';scrollTrack.appendChild(scrollBar);
root.appendChild(scrollTrack);
const rail=document.createElement('div');rail.className='r8-chapter-rail';rail.setAttribute('aria-hidden','true');
rail.innerHTML='<span class="r8-chapter-rail__counter"></span><span class="r8-chapter-rail__label"></span>';
root.appendChild(rail);
const counter=rail.querySelector('.r8-chapter-rail__counter'),label=rail.querySelector('.r8-chapter-rail__label');
const tidy=t=>String(t||'').replace(/\s+/g,' ').replace(/[↗↘→]/g,'').trim().replace(/\.$/,'');
const titles=chapters.map((el,index)=>{el.dataset.r8Chapter=String(index+1);const heading=el.querySelector('h1,h2');const phrase=heading?Array.from(heading.childNodes).map(n=>n.textContent).join(' '):'';return tidy(phrase).replace(/\s+([.,!?])/g,'$1').slice(0,55)||'Kapitel';});
let positions=[],viewHeight=window.innerHeight,fullHeight=0,currentChapter=-1,scrollRequest=false;
function readPositions(){positions=chapters.map(el=>el.getBoundingClientRect().top+window.scrollY);viewHeight=window.innerHeight;fullHeight=Math.max(1,document.documentElement.scrollHeight-viewHeight)}
const desktop=()=>window.innerWidth>=900;
const allowsMotion=()=>desktop()&&!mediaReduce.matches;
const selectorsByTheme={
 studio:['.hero-photo img','.manifesto-media img','.project-media img'],
 agency:['.hero-media img','.approach-image img','.local-visual img'],
 webdesign:['.hero-media img','.architecture img','.foundation img','.routes img'],
 seo:['.why-media img','.local-media img','.hero-stage img'],
 ai:['.hero-media img','.context img','.bridge img'],
 copy:['.hero-media img','.brand-section img','.reader img'],
 portfolio:['.case-media img','.hero-media img','.real-site-showcase img','.visual-band img'],
 contact:['.hero-media img','.location-visual img']
};
const pick=selectorsByTheme[theme]||selectorsByTheme.portfolio;
const seen=new Set();const depthImages=[];
for(const sel of pick){
 for(const candidate of document.querySelectorAll(sel)){
  const img=candidate.tagName==='IMG'?candidate:candidate.querySelector('img');
  if(!img||seen.has(img)||depthImages.length>=3)continue;
  const wrapper=img.parentElement;
  if(!wrapper||wrapper.closest('a')&&theme==='contact')continue;
  seen.add(img);img.classList.add('r8-depth-image');img.dataset.r8Depth=String(14+depthImages.length*5);
  wrapper.classList.add('r8-frame');depthImages.push(img);
 }
}
function update(){scrollRequest=false;const y=window.scrollY||0;
 scrollBar.style.transform=`scaleX(${Math.max(0,Math.min(1,y/fullHeight)).toFixed(5)})`;
 if(count){const threshold=y+viewHeight*.45;let i=0;
  for(let k=0;k<positions.length;k++){if(positions[k]<=threshold)i=k;else break;}
  if(i!==currentChapter){currentChapter=i;counter.textContent=String(i+1).padStart(2,'0')+' / '+String(count).padStart(2,'0');label.textContent=titles[i];}
  rail.classList.toggle('is-visible',desktop()&&y>Math.max(240,viewHeight*.34));
 }
 if(allowsMotion()){
  for(const img of depthImages){const r=img.parentElement.getBoundingClientRect();
   if(r.bottom<-100||r.top>viewHeight+100)continue;
   const ratio=(viewHeight*.5-(r.top+r.height*.5))/Math.max(1,viewHeight*.5+r.height*.5);
   const shift=Math.max(-1,Math.min(1,ratio))*Number(img.dataset.r8Depth);
   img.style.setProperty('--r8-parallax-y',shift.toFixed(2)+'px');
  }
 }else for(const img of depthImages)img.style.setProperty('--r8-parallax-y','0px');
}
function request(){if(scrollRequest)return;scrollRequest=true;requestAnimationFrame(update)}
function refresh(){readPositions();request()}
window.addEventListener('scroll',request,{passive:true});window.addEventListener('resize',refresh,{passive:true});
window.addEventListener('load',refresh,{once:true});mediaReduce.addEventListener?.('change',request);
if('ResizeObserver' in window){let resizeTimer=false;new ResizeObserver(()=>{if(resizeTimer)return;resizeTimer=true;requestAnimationFrame(()=>{resizeTimer=false;readPositions();request()})}).observe(document.documentElement)}
refresh();
// Text remains visible before, during, and after each animation; no opacity:0 placeholders.
if(!mediaReduce.matches&&'IntersectionObserver'in window&&Element.prototype.animate){
 const first=document.querySelector('main h1');if(first){first.animate([{opacity:.78,translate:'0 12px'},{opacity:1,translate:'0 0px'}],{duration:720,easing:'cubic-bezier(.22,1,.36,1)'});}
 const headings=Array.from(document.querySelectorAll('main > section h2,main > section h3')).filter(x=>!x.classList.contains('reveal')).slice(0,32);
 const watcher=new IntersectionObserver((entries)=>{for(const entry of entries){if(!entry.isIntersecting)continue;watcher.unobserve(entry.target);entry.target.animate([{opacity:.82,translate:'0 10px'},{opacity:1,translate:'0 0px'}],{duration:540,easing:'cubic-bezier(.22,1,.36,1)'});}}, {threshold:.18,rootMargin:'0px 0px -4% 0px'});
 headings.forEach(el=>watcher.observe(el));
}
window.__AROZ_R8_MOTION__={version:'8.0.0-offline',theme,chapterCount:count,parallaxCount:depthImages.length,hasReducedMotion:mediaReduce.matches};
})();
