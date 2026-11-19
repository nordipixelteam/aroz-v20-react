/* V2 motion owner. Native scrolling; GSAP only for the new portfolio and selector. */
(()=>{'use strict';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const work=document.querySelector('.v2-work'),track=document.querySelector('.v2-work-track'),stage=document.querySelector('.v2-work-stage');
const section=document.querySelector('.v2-stories');
if(!work&&!section)return;
const mm=window.gsap?.matchMedia();
// Fonts and responsive content above Projects can settle after window.load.
// Keep the pin start aligned with the actual section, rather than leaving an
// empty spacer visible while the project stage scrolls out of the viewport.
let layoutTimer;
const refreshLayout=()=>{clearTimeout(layoutTimer);layoutTimer=setTimeout(()=>window.ScrollTrigger?.refresh(),100);};
const layoutObserver=new ResizeObserver(refreshLayout);
for(const section of document.querySelectorAll('main > section')){
 if(section===work)break;
 layoutObserver.observe(section);
}
document.fonts?.ready.then(refreshLayout);
window.addEventListener('pagehide',event=>{if(!event.persisted){clearTimeout(layoutTimer);layoutObserver.disconnect();mm?.revert();}});
if(work&&track&&stage&&window.gsap&&window.ScrollTrigger){
 gsap.registerPlugin(ScrollTrigger);
 mm.add('(min-width: 921px) and (prefers-reduced-motion: no-preference)',()=>{
  work.classList.add('is-pinned');
  const cards=[...track.children],motion={progress:0};
  const setX=gsap.quickSetter(stage,'x','px');
  const setY=cards.map(card=>gsap.quickSetter(card,'y','px'));
  let travel=0,distance=0;
  function render(){
   const progress=Math.max(0,Math.min(1,motion.progress*distance/Math.max(1,travel)));
   setX(-travel*progress);
   cards.forEach((card,i)=>{
    const phase=Math.max(0,Math.min(1,(progress-Math.min(.72,i*.23))/.24));
    setY[i](innerHeight*(i===0?.07:.4)*Math.pow(1-phase,3));
   });
  }
  function measure(){
   travel=Math.max(0,stage.scrollWidth-innerWidth+innerWidth*.08);
   distance=travel+innerHeight*.35;
   work.style.setProperty('--project-scroll-distance',distance+'px');
   render();
  }
  measure();
  gsap.fromTo(motion,{progress:0},{progress:1,ease:'none',onUpdate:render,scrollTrigger:{
   trigger:work,start:()=>work.getBoundingClientRect().top+scrollY,
   end:()=>work.getBoundingClientRect().top+scrollY+work.offsetHeight-innerHeight,
   refreshPriority:10,scrub:.4,invalidateOnRefresh:true,onRefreshInit:measure
  }});
  return()=>{
   work.classList.remove('is-pinned');work.style.removeProperty('--project-scroll-distance');
   // quickSetter writes are outside GSAP's tween context, so clear them explicitly.
   stage.style.removeProperty('transform');cards.forEach(card=>card.style.removeProperty('transform'));
  };
 });
}
if(!section)return;
const tabs=[...section.querySelectorAll('[data-story]')],copy=section.querySelector('.v2-story-copy');
// Genuine review records can replace these editorial summaries without changing the UI.
const stories=[...document.querySelectorAll('.v2-work-card:not(.v2-work-end)')].map((card,i)=>({id:String(i),company:card.querySelector('h3').textContent,description:card.querySelector('p').textContent,photo:card.querySelector('img').getAttribute('src'),role:card.querySelector('.v2-card-meta>span').textContent.replace(/^\d+ \/ /,''),url:card.querySelector('a').getAttribute('href')}));
let current=0,timer=null,transition=null,hover=false,focus=false,visible=false;
function schedule(){clearTimeout(timer);if(stories.length>1&&visible&&!hover&&!focus&&!document.hidden&&!reduced.matches)timer=setTimeout(()=>select(current+1),5600);}
function paint(i){const s=stories[i];current=i;tabs.forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));copy.querySelector('.v2-story-text').textContent=s.description;const img=copy.querySelector('img');img.src=s.photo;img.alt='Project image: '+s.company;copy.querySelector('strong').textContent=s.company;copy.querySelector('.v2-story-person span').textContent=s.role;copy.querySelector('a').href=s.url;section.querySelector('[data-counter]').textContent=String(i+1).padStart(2,'0')+' / '+String(stories.length).padStart(2,'0');}
function select(i){clearTimeout(timer);i=(i+stories.length)%stories.length;transition?.kill();if(!window.gsap||reduced.matches){paint(i);copy.style.opacity='1';copy.style.transform='none';schedule();return;}transition=gsap.timeline({onComplete:schedule});transition.to(copy,{opacity:0,y:-18,duration:.3,ease:'power2.out'}).call(()=>paint(i)).fromTo(copy,{opacity:0,y:22},{opacity:1,y:0,duration:.65,ease:'power2.out'});}
tabs.forEach((b,i)=>b.addEventListener('click',()=>select(i)));section.querySelector('[data-prev]').addEventListener('click',()=>select(current-1));section.querySelector('[data-next]').addEventListener('click',()=>select(current+1));
section.addEventListener('mouseenter',()=>{hover=true;schedule()});section.addEventListener('mouseleave',()=>{hover=false;schedule()});section.addEventListener('focusin',()=>{focus=true;schedule()});section.addEventListener('focusout',()=>{queueMicrotask(()=>{focus=section.contains(document.activeElement);schedule()})});document.addEventListener('visibilitychange',()=>{schedule();document.querySelector('.v2-footer').classList.toggle('is-visible',!document.hidden&&document.querySelector('.v2-footer').getBoundingClientRect().top<innerHeight)});reduced.addEventListener('change',schedule);
const observer=new IntersectionObserver(es=>{for(const e of es){if(e.target===section){visible=e.isIntersecting;schedule()}else e.target.classList.toggle('is-visible',e.isIntersecting&&!document.hidden)}},{threshold:.1});observer.observe(section);observer.observe(document.querySelector('.v2-footer'));
window.addEventListener('load',refreshLayout,{once:true});window.addEventListener('pageshow',event=>{if(event.persisted){refreshLayout();schedule();}});window.addEventListener('pagehide',event=>{clearTimeout(timer);if(event.persisted)return;transition?.kill();observer.disconnect();});
})();
