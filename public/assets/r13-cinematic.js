/* AROZ R13 cinematic storytelling; no external libraries, no network calls.
 * All information remains visible without JavaScript. Reduced motion disables
 * kinetic title and parallax and leaves project content accessible. */
(()=>{
 'use strict';
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 const desktop=window.matchMedia('(min-width: 921px) and (pointer: fine)');
 const bridge=document.querySelector('.r13-bridge');
 const bridgeTrack=bridge?.querySelector('.r13-bridge-track');
 const hero=document.querySelector('.r13-hero-grid');
 const heroPhoto=document.querySelector('.r13-hero-visual');
 const projects=[...document.querySelectorAll('.projects .project-item')];
 const indicator=document.querySelector('.r13-work-meta-count');
 const meter=document.querySelector('.r13-work-meta-line i');
 const cards=[...document.querySelectorAll('.service-card')];
 const steps=[...document.querySelectorAll('.steps .step')];
 let pending=false,frames=0,projectIndex=-1,flow=0;
 const ease='cubic-bezier(.22,1,.36,1)';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const canAnimate=()=>!reduce.matches;
 function playEntrance(){
   if(!canAnimate()||!Element.prototype.animate||!hero)return;
   const micro=hero.querySelector('.r13-hero-micro');
   const title=hero.querySelector('h1');
   const copy=hero.querySelector('.hero-aside');
   const photo=heroPhoto;
   [[micro,0,510,18],[title,120,1000,28],[copy,430,650,18]].forEach(([el,delay,duration,dy])=>{
     if(!el)return;
     el.animate([{opacity:.72,transform:`translateY(${dy}px)`},{opacity:1,transform:'translateY(0)'}],{duration,delay,fill:'none',easing:ease});
   });
   if(photo)photo.animate([{clipPath:'inset(0 0 0 17%)',opacity:.82},{clipPath:'inset(0 0 0 0)',opacity:1}],{duration:1250,delay:140,easing:ease,fill:'none'});
 }
 function render(){
   pending=false;frames++;
   if(bridgeTrack){
     const r=bridge.getBoundingClientRect();
     if(canAnimate()&&desktop.matches){
       // Deliberately short side movement; vertical page scroll remains native.
       const phase=clamp((window.innerHeight*.65-r.top)/(window.innerHeight+r.height),0,1);
       flow=Math.round((phase-.5)*72*100)/100;
     }else{flow=0;}
     bridgeTrack.style.setProperty('--r13-flow-x',flow+'px');
   }
   if(projects.length){
     const center=window.innerHeight*.51;
     let closest=0,dist=Infinity;
     for(let i=0;i<projects.length;i++){
       const r=projects[i].getBoundingClientRect();
       const mid=(r.top+r.bottom)/2;
       const d=Math.abs(mid-center);
       if(d<dist){dist=d;closest=i;}
       const active=r.bottom>window.innerHeight*.25 && r.top<window.innerHeight*.77;
       projects[i].classList.toggle('r13-in-view',active);
     }
     const pr=document.getElementById('projekte').getBoundingClientRect();
     if(pr.top<window.innerHeight*.9 && pr.bottom>0){
       if(projectIndex!==closest){projectIndex=closest;if(indicator)indicator.textContent=String(closest+1).padStart(2,'0')+' / '+String(projects.length).padStart(2,'0');}
       if(meter)meter.style.transform=`scaleX(${(closest+1)/projects.length})`;
     }
   }
   cards.forEach(el=>{const r=el.getBoundingClientRect();el.classList.toggle('r13-in-view',r.top<window.innerHeight*.83&&r.bottom>window.innerHeight*.17)});
   // Exactly one currently relevant step is highlighted; no text is hidden.
   if(steps.length){
     let idx=0,d=Infinity;
     for(let i=0;i<steps.length;i++){
       const r=steps[i].getBoundingClientRect();const x=Math.abs((r.top+r.bottom)*.5-window.innerHeight*.54);
       if(x<d){d=x;idx=i;}
     }
     steps.forEach((el,i)=>el.classList.toggle('r13-in-view',i===idx&&el.getBoundingClientRect().top<window.innerHeight*.93&&el.getBoundingClientRect().bottom>0));
   }
 }
 const request=()=>{if(pending)return;pending=true;requestAnimationFrame(render);};
 window.addEventListener('scroll',request,{passive:true});
 window.addEventListener('resize',request,{passive:true});
 window.addEventListener('load',request,{once:true});
 window.addEventListener('pageshow',request);
 reduce.addEventListener?.('change',request);
 desktop.addEventListener?.('change',request);
 if('IntersectionObserver'in window&&canAnimate()&&Element.prototype.animate){
   const obs=new IntersectionObserver(entries=>{for(const entry of entries){
     if(!entry.isIntersecting)continue;obs.unobserve(entry.target);
     if(entry.target.matches('.project-content,.section-head,.manifesto-grid > div:first-child')){
       entry.target.animate([{opacity:.84,transform:'translateY(17px)'},{opacity:1,transform:'translateY(0px)'}],{duration:660,easing:ease});
     }
   }},{rootMargin:'0px 0px -7% 0px',threshold:.13});
   document.querySelectorAll('.project-content,.section-head,.manifesto-grid > div:first-child').forEach(el=>obs.observe(el));
 }
 // Layout and content are fully usable before any animation is started.
 request();if(!document.body.classList.contains("r14-agency-hero"))playEntrance();
 window.__AROZ_R13__={version:'13.0.0-offline-review',getState:()=>({frames,flow,projectIndex,reduce:reduce.matches,desktop:desktop.matches,heroHeight:Math.round(hero?.getBoundingClientRect().height||0),projects:projects.length,cardHighlights:cards.filter(x=>x.classList.contains('r13-in-view')).length})};
})();
