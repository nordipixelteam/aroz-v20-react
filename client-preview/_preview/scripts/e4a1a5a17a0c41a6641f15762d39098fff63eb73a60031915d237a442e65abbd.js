
(()=>{
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const btn=document.querySelector('.menu-btn'),menu=document.querySelector('.mobile-menu');
 if(btn&&menu){btn.addEventListener('click',()=>{const open=btn.getAttribute('aria-expanded')==='true';btn.setAttribute('aria-expanded',String(!open));menu.classList.toggle('open',!open);menu.setAttribute('aria-hidden',String(open));document.body.classList.toggle('menu-open',!open)});addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('open')){btn.click();btn.focus()}})}
 if(reduce){document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'));return}
 const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.13,rootMargin:'0px 0px -6%'});document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
 const hero=document.querySelector('.hero'),signals=[...document.querySelectorAll('.signal-word')],whyImg=document.querySelector('.why-media img'); let ticking=false;
 function scrollFx(){const vh=innerHeight;
   if(hero){
     const r=hero.getBoundingClientRect();
     const travel=Math.max(1,hero.offsetHeight-vh);
     const p=innerWidth>1050?Math.max(0,Math.min(1,-r.top/travel)):Math.max(0,Math.min(1,-r.top/Math.max(1,r.height-vh*.28)));
     hero.style.setProperty('--hero-progress',p.toFixed(4));
     const active=Math.min(3,Math.floor(Math.min(.999,p)*4));
     signals.forEach((el,i)=>el.classList.toggle('active',i===active));
     hero.classList.toggle('is-complete',p>.9);
   }
   if(whyImg){const r=whyImg.parentElement.getBoundingClientRect();const p=Math.max(0,Math.min(1,(vh-r.top)/(vh+r.height)));whyImg.parentElement.style.setProperty('--why-img-y',`${(p-.5)*-24}px`);}
   ticking=false;
 }
 addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(scrollFx);ticking=true}},{passive:true});addEventListener('resize',()=>{if(!ticking){requestAnimationFrame(scrollFx);ticking=true}},{passive:true});scrollFx();
})();
