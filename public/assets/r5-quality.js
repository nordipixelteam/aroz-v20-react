/* AROZ R5 progressive enhancement: readable without animation, robust menu state.
   No network requests, no data collection and no form transmission. */
(()=>{
 'use strict';
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const btn=document.querySelector('.menu-btn,.menu-toggle');
 if(btn){
  const panelId=btn.getAttribute('aria-controls');
  const panel=(panelId&&document.getElementById(panelId)) || document.querySelector('.mobile-menu,.mobile-nav');
  if(panel){
   const sync=()=>{
    const onMobile=getComputedStyle(btn).display!=='none';
    const expanded=btn.getAttribute('aria-expanded')==='true';
    const hidden=onMobile&&!expanded;
    btn.setAttribute('aria-label',expanded?'Menü schließen':'Menü öffnen');
    if(hidden){panel.setAttribute('inert','');panel.setAttribute('aria-hidden','true');}
    else{panel.removeAttribute('inert');panel.removeAttribute('aria-hidden');}
   };
   btn.addEventListener('click',()=>requestAnimationFrame(sync));
   document.addEventListener('keydown',event=>{
    if(event.key==='Escape' && btn.getAttribute('aria-expanded')==='true'){
     requestAnimationFrame(()=>{sync(); if(btn.getAttribute('aria-expanded')==='false')btn.focus({preventScroll:true});});
    }
   });
   window.addEventListener('resize',()=>requestAnimationFrame(sync),{passive:true});
   sync();
  }
 }
 // The elements are never hidden. Animation is an unobtrusive enhancement,
 // not a requirement for text to become visible (R4 P0 regression guard).
 if(reduce || !('IntersectionObserver' in window) || !Element.prototype.animate)return;
 const els=[...document.querySelectorAll('.reveal')];
 if(!els.length)return;
 const observer=new IntersectionObserver((entries)=>{
  for(const entry of entries){
   if(!entry.isIntersecting)continue;
   const el=entry.target;observer.unobserve(el);
   if(el.dataset.r5Animated)return;
   el.dataset.r5Animated='true';
   if(el.getBoundingClientRect().height<4)return;
   el.animate([
    {opacity:.94,transform:'translateY(8px)'},
    {opacity:1,transform:'translateY(0px)'}
   ],{duration:480,easing:'cubic-bezier(.22,1,.36,1)',iterations:1});
  }
 },{rootMargin:'0px 0px -5% 0px',threshold:.12});
 els.forEach(el=>observer.observe(el));
})();
