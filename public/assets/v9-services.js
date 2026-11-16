/* V16: continuous scroll positions blend panel heights; clicks remain accessible. */
(()=>{'use strict';const section=document.querySelector('.v9-services');if(!section)return;const rows=[...section.querySelectorAll('.v9-service')],buttons=rows.map(r=>r.querySelector('h3 button')),panels=rows.map(r=>r.querySelector('.v9-service-panel'));let active=0,manualAt=null,manualTween=null,desktop=null,mm=null;const weights={w0:1,w1:0,w2:0,w3:0};const clamp=n=>Math.max(0,Math.min(1,n));const smooth=n=>n*n*(3-2*n);
function semantics(index){active=index;rows.forEach((r,i)=>{const yes=i===index;r.classList.toggle('is-open',yes);buttons[i].setAttribute('aria-expanded',String(yes));buttons[i].querySelector('i').textContent=yes?'−':'+';panels[i].inert=!yes})}
function open(index){manualAt=scrollY;manualTween?.kill();semantics(index);if(desktop){const target={};rows.forEach((r,i)=>target['w'+i]=i===index?1:0);manualTween=gsap.to(weights,{...target,duration:.7,ease:'power2.inOut',onUpdate:()=>desktop.paint()})}}
section.classList.add('js-services');semantics(0);buttons.forEach((b,i)=>{b.addEventListener('click',()=>open(active===i?-1:i));b.addEventListener('keydown',e=>{let next;if(e.key==='ArrowDown')next=(i+1)%rows.length;else if(e.key==='ArrowUp')next=(i-1+rows.length)%rows.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=rows.length-1;else if(e.key==='Escape'){e.preventDefault();open(-1);return}else return;e.preventDefault();buttons[next].focus()})});
if(window.gsap&&window.ScrollTrigger){
 gsap.registerPlugin(ScrollTrigger);
 mm=gsap.matchMedia();
 mm.add('(min-width: 921px) and (min-height: 860px) and (prefers-reduced-motion: no-preference)',()=>{
  section.classList.add('is-scroll-pinned','v16-scroll-services');
  const motion={position:0};
  let heights=[];
  function paint(){
   rows.forEach((row,i)=>{
    const weight=clamp(weights['w'+i]);
    panels[i].style.height=(heights[i]*weight)+'px';
    panels[i].style.opacity=String(weight===0?0:Math.pow(weight,1.6));
    row.style.setProperty('--v16-focus',String(weight));
    panels[i].inert=weight<.5;
   });
  }
  function measure(){
   // Native sticky owns the visual hold; one explicit distance owns the scroll.
   // There is no transformed pin or extra pin spacer left behind on refresh.
   section.style.setProperty('--service-scroll-distance',Math.round(innerHeight*3.2)+'px');
   heights=panels.map(panel=>panel.firstElementChild.scrollHeight);
   paint();
  }
  function render(){
   if(manualAt!==null){
    if(Math.abs(scrollY-manualAt)<90)return;
    manualAt=null;manualTween?.kill();
   }
   const position=clamp(motion.position/(rows.length-1))*(rows.length-1);
   const base=Math.floor(position),fraction=smooth(position-base);
   rows.forEach((row,i)=>weights['w'+i]=i===base?1-fraction:i===base+1?fraction:0);
   semantics(fraction>.5?Math.min(rows.length-1,base+1):base);
   paint();
  }
  desktop={paint};measure();
  const timeline=gsap.timeline({scrollTrigger:{
   trigger:section,start:()=>section.getBoundingClientRect().top+scrollY,
   end:()=>section.getBoundingClientRect().top+scrollY+section.offsetHeight-innerHeight,refreshPriority:20,
   scrub:.35,invalidateOnRefresh:true,onRefreshInit:measure
  }});
  timeline.to(motion,{position:0,duration:.15,ease:'none'})
   .to(motion,{position:rows.length-1,duration:3,ease:'none',onUpdate:render})
   // Copywriting stays fully visible for about half a viewport before release.
   .to(motion,{position:rows.length-1,duration:.6,ease:'none',onUpdate:render});
  ScrollTrigger.sort();
  const refreshFrame=requestAnimationFrame(()=>ScrollTrigger.refresh());
  return()=>{
   cancelAnimationFrame(refreshFrame);manualTween?.kill();manualAt=null;desktop=null;
   section.classList.remove('is-scroll-pinned','v16-scroll-services');
   section.style.removeProperty('--service-scroll-distance');
   rows.forEach((row,i)=>{
    row.style.removeProperty('--v16-focus');
    panels[i].style.removeProperty('height');panels[i].style.removeProperty('opacity');
   });
   semantics(active<0?-1:active);
  };
 });
}
const form=document.querySelector('.v9-contact-form');form?.addEventListener('submit',e=>{e.preventDefault();const name=form.querySelector('[name=name]');name.setCustomValidity(name.value.trim()?'':"Please enter your name.");if(!form.reportValidity())return;const status=form.querySelector('.v9-form-status');status.hidden=false;status.textContent="Your details are complete. No enquiry was sent in this design preview. Delivery will be connected to the server.";status.focus()});form?.querySelector('[name=name]').addEventListener('input',e=>e.target.setCustomValidity(''));addEventListener('load',()=>window.ScrollTrigger?.refresh(),{once:true});addEventListener('pageshow',event=>{if(event.persisted)requestAnimationFrame(()=>window.ScrollTrigger?.refresh())});addEventListener('pagehide',event=>{if(event.persisted)return;manualTween?.kill();mm?.revert()});})();
