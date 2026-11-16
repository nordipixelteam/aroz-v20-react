// Reader copy remains in the imported AVAULT fields; this controller only changes state.
(() => {
 'use strict';
 // Reveal setup is independent of the legacy hero and Reader update paths.
 const reveals=[...document.querySelectorAll('.reveal')];
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver'in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(entry.isIntersecting){entry.target.classList.add('in');observer.unobserve(entry.target);}
  }),{threshold:.05});
  reveals.forEach(element=>observer.observe(element));
 }else reveals.forEach(element=>element.classList.add('in'));
 const reader=document.querySelector('.reader');
 if(!reader)return;
 const story=reader.querySelector('.reader-story'),stage=reader.querySelector('.reader-stage');
 const words=[...reader.querySelectorAll('.reader-word span')],cards=[...reader.querySelectorAll('.reader-card')];
 if(!story||!stage||words.length!==4||cards.length!==4)return;
 const staticMode=matchMedia('(max-width: 1000px), (max-height: 820px), (prefers-reduced-motion: reduce)');
 // The shared hero has no legacy proof track. Never run its old scroll controller against it.
 const hero=document.querySelector('.hero:not([data-av-hero="shared"])');
 const proofRows=hero?[...hero.querySelectorAll('.proof-row')]:[];
 let pending=false;
 function update(){
  pending=false;
  const isStatic=staticMode.matches||document.body.hasAttribute('data-preview');
  reader.dataset.readerMode=isStatic?'static':'scroll';
  const top=parseFloat(getComputedStyle(stage).top)||0;
  const travel=Math.max(1,story.offsetHeight-stage.offsetHeight);
  const progress=Math.max(0,Math.min(1,(top-story.getBoundingClientRect().top)/travel));
  const index=Math.min(3,Math.floor(progress*4));
  reader.dataset.readerStep=String(isStatic?3:index);
  reader.style.setProperty('--reader-step',String(isStatic?3:index));
  words.forEach((word,i)=>word.classList.toggle('active',isStatic||i===index));
  cards.forEach((card,i)=>{card.classList.toggle('active',isStatic||i===index);card.inert=!isStatic&&i!==index;});
  if(hero&&proofRows.length){
   const rect=hero.getBoundingClientRect();
   const step=isStatic?0:Math.min(3,Math.floor(Math.max(0,Math.min(1,-rect.top/Math.max(1,rect.height-innerHeight)))*4));
   hero.dataset.step=String(step);hero.style.setProperty('--step',String(step));
   proofRows.forEach((row,i)=>row.classList.toggle('active',isStatic||i===step));
  }
 }
 const request=()=>{if(!pending){pending=true;requestAnimationFrame(update);}};
 addEventListener('scroll',request,{passive:true});
 addEventListener('resize',request,{passive:true});
 addEventListener('pageshow',request);
 staticMode.addEventListener('change',request);
 document.fonts?.ready.then(request);
 update();
})();

// Editorial Proof has its own track; shared-hero progress is intentionally unrelated.
(() => {
 'use strict';
 if(document.body.dataset.r8Theme!=='copy')return;
 const proof=document.querySelector('[data-av-hero="shared"] .proof');
 if(!proof)return;
 const paper=proof.querySelector('.proof-paper'),rows=[...proof.querySelectorAll('.proof-row')];
 if(!paper||rows.length!==4)return;
 const track=document.createElement('div');
 track.className='proof-scroll-track';
 proof.before(track);track.append(proof);
 const staticMode=matchMedia('(max-width: 1000px), (prefers-reduced-motion: reduce)');
 let pending=false;
 function update(){
  pending=false;
  const isStatic=staticMode.matches||document.body.hasAttribute('data-preview')||paper.offsetHeight>innerHeight-112;
  track.dataset.proofMode=isStatic?'static':'scroll';
  track.style.setProperty('--proof-scroll-distance',innerHeight*2+'px');
  const top=parseFloat(getComputedStyle(proof).top)||0;
  const travel=Math.max(1,track.offsetHeight-proof.offsetHeight);
  const progress=Math.max(0,Math.min(1,(top-track.getBoundingClientRect().top)/travel));
  const step=Math.min(3,Math.floor(progress*4));
  proof.dataset.step=String(isStatic?0:step);
  proof.style.setProperty('--step',String(isStatic?0:step));
  rows.forEach((row,i)=>{
   row.classList.toggle('active',isStatic||i===step);
   if(!isStatic&&i===step)row.setAttribute('aria-current','step');else row.removeAttribute('aria-current');
  });
 }
 const request=()=>{if(!pending){pending=true;requestAnimationFrame(update);}};
 addEventListener('scroll',request,{passive:true});
 addEventListener('resize',request,{passive:true});
 addEventListener('pageshow',request);
 staticMode.addEventListener('change',request);
 new ResizeObserver(request).observe(paper);
 document.fonts?.ready.then(request);
 update();
})();
