// SEO's four-stage exploded stack. Copy stays in AVAULT fields, never in this controller.
(()=>{
 'use strict';
 const section=document.getElementById('aufbau');
 if(!section||section.dataset.seoStructureReady)return;
 const graphic=section.querySelector('.exploded-stage');
 const triggers=[...section.querySelectorAll('.arch-trigger')];
 const panels=[...section.querySelectorAll('[data-arch-copy]')];
 const labels=[...section.querySelectorAll('[data-seo-status]')];
 if(!graphic||triggers.length!==4||panels.length!==4||labels.length!==4)return;
 section.dataset.seoStructureReady='true';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const staticPreview=document.body.hasAttribute('data-preview');
 let pending=false;
 function update(){
  pending=false;
  const target=innerHeight*(innerWidth<=1050?.8:.62);
  let active=0;
  const staticMode=reduced.matches||staticPreview;
  if(!staticMode)triggers.forEach((trigger,index)=>{if(trigger.getBoundingClientRect().top<=target)active=index});
  graphic.dataset.state=String(active);
  panels.forEach(panel=>{const selected=Number(panel.dataset.archCopy)===active;panel.classList.toggle('active',selected);panel.setAttribute('aria-hidden',String(!staticMode&&!selected))});
  labels.forEach(label=>{label.hidden=Number(label.dataset.seoStatus)!==active});
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(update)}}
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',schedule,{passive:true});
 addEventListener('pageshow',schedule);
 addEventListener('load',schedule,{once:true});
 reduced.addEventListener('change',schedule);
 if('ResizeObserver'in window)new ResizeObserver(schedule).observe(section);
 update();
})();
