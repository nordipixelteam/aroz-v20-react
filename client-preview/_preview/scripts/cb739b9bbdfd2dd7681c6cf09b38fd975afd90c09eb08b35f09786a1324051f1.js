
(()=>{
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const btn=document.querySelector('.menu-btn'),menu=document.querySelector('.mobile-menu');
 if(btn&&menu){btn.addEventListener('click',()=>{const open=btn.getAttribute('aria-expanded')==='true';btn.setAttribute('aria-expanded',String(!open));menu.classList.toggle('open',!open);menu.setAttribute('aria-hidden',String(open));document.body.classList.toggle('menu-open',!open);if(!open){const first=menu.querySelector('a');if(first)setTimeout(()=>first.focus(),40)}});addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('open')){btn.click();btn.focus()}})}
 if(reduce){document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));return;}
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.14,rootMargin:'0px 0px -7%'});document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
 const founders=document.querySelector('.founders'),renato=document.querySelector('.founder-panel.renato'),adem=document.querySelector('.founder-panel.adem');
 const approachSteps=[...document.querySelectorAll('.approach-step')];
 /* Active step follows the nearest row centre at the viewport reading line. */
 let ticking=false;
 function clamp(n,a=0,b=1){return Math.max(a,Math.min(b,n))}
 function update(){const vh=innerHeight;
   if(approachSteps.length){const marker=vh*.5;let nearest=0,distance=Infinity;approachSteps.forEach((step,i)=>{const r=step.getBoundingClientRect();const d=Math.abs(r.top+r.height/2-marker);if(d<distance){nearest=i;distance=d}});approachSteps.forEach((step,i)=>step.classList.toggle('active',i===nearest))}
   const hero=document.querySelector('.hero-scene');if(hero){const r=hero.getBoundingClientRect();const total=Math.max(1,hero.offsetHeight-vh);const p=clamp(-r.top/total);hero.style.setProperty('--hero-scale',String(1.07-p*.07));hero.style.setProperty('--hero-y',`${p*22}px`);hero.style.setProperty('--hero-claim-opacity',String(.25+p*.75));hero.style.setProperty('--hero-claim-y',`${18-p*18}px`);hero.style.setProperty('--hero-mark-x',`${p*-16}px`);hero.style.setProperty('--hero-mark-y',`${p*18}px`);}
   if(founders){const r=founders.getBoundingClientRect();const total=Math.max(1,founders.offsetHeight-vh);const p=clamp(-r.top/total);let state=0;if(p>.18&&p<=.46)state=1;else if(p>.46&&p<=.74)state=2;else if(p>.74)state=3;founders.dataset.state=String(state);renato?.classList.toggle('active',state===1||state===3);adem?.classList.toggle('active',state===2||state===3)}
   const local=document.querySelector('.local');if(local){const r=local.getBoundingClientRect();const p=clamp((vh-r.top)/(vh+r.height));local.style.setProperty('--local-y',`${(p-.5)*-34}px`)}
   ticking=false;
 }
 addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(update);ticking=true}},{passive:true});addEventListener('resize',()=>{if(!ticking){requestAnimationFrame(update);ticking=true}},{passive:true});update();
})();
