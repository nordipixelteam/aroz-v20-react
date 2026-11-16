
(()=>{
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const btn=document.querySelector('.menu-btn'),menu=document.querySelector('.mobile-menu');
 if(btn&&menu){btn.addEventListener('click',()=>{const o=btn.getAttribute('aria-expanded')==='true';btn.setAttribute('aria-expanded',String(!o));menu.classList.toggle('open',!o);menu.setAttribute('aria-hidden',String(o));document.body.classList.toggle('menu-open',!o)});addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('open')){btn.click();btn.focus()}})}
 const tabs=[...document.querySelectorAll('.route-tab')],panels=[...document.querySelectorAll('.route-panel')];
 tabs.forEach(t=>t.addEventListener('click',()=>{const i=+t.dataset.panel;tabs.forEach((x,j)=>{x.classList.toggle('active',j===i);x.setAttribute('aria-selected',String(j===i))});panels.forEach((p,j)=>p.classList.toggle('active',j===i))}));
 if(!reduce){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.14,rootMargin:'0px 0px -7%'});document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  const systemSection=document.querySelector('.architecture'),systemSteps=[...document.querySelectorAll('.system-step')];
  /* System selection is updated with the existing scroll frame below. */
  const heroImg=document.querySelector('.hero-stage img'),manifesto=document.querySelector('.manifesto');let ticking=false;
  function scrollFx(){const vh=innerHeight;
   // One reading line drives the active text, diagram state and progress together.
   if(systemSection&&systemSteps.length){let active=0,distance=Infinity;systemSteps.forEach((step,i)=>{const r=step.getBoundingClientRect(),d=Math.abs(r.top+r.height/2-vh*.5);if(d<distance){active=i;distance=d}});systemSection.dataset.systemStep=String(active);systemSection.style.setProperty('--system-progress',String(.12+(active/Math.max(1,systemSteps.length-1))*.88));systemSteps.forEach((step,i)=>step.classList.toggle('active',i===active));}
   if(heroImg){const r=heroImg.parentElement.getBoundingClientRect();const p=Math.max(0,Math.min(1,(vh-r.top)/(vh+r.height)));heroImg.style.transform=`scale(${1.055-p*.055}) translateY(${(p-.5)*10}px)`;}
   if(manifesto){const r=manifesto.getBoundingClientRect();const p=Math.max(0,Math.min(1,(vh-r.top)/(vh+r.height)));const centered=(p-.5);const mobile=innerWidth<=640;const factor=mobile*.42+(!mobile)*1;manifesto.style.setProperty('--m-kicker-y',`${centered*-16*factor}px`);manifesto.style.setProperty('--m-title-y',`${centered*-28*factor}px`);manifesto.style.setProperty('--m-copy-y',`${centered*-13*factor}px`);manifesto.style.setProperty('--m-img1-y',`${centered*-46*factor}px`);manifesto.style.setProperty('--m-img2-y',`${centered*34*factor}px`);manifesto.style.setProperty('--m-img1-inner-y',`${centered*8.5*factor}px`);manifesto.style.setProperty('--m-img2-inner-y',`${centered*-6.8*factor}px`);}
   ticking=false;
  }
  addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(scrollFx);ticking=true}},{passive:true});addEventListener('resize',()=>{if(!ticking){requestAnimationFrame(scrollFx);ticking=true}},{passive:true});scrollFx();
  if(manifesto&&matchMedia('(hover:hover) and (pointer:fine)').matches){const visual=manifesto.querySelector('.manifesto-visual');if(visual){visual.addEventListener('pointermove',e=>{const r=visual.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;manifesto.style.setProperty('--m-img1-x',`${x*8}px`);manifesto.style.setProperty('--m-img2-x',`${x*-10}px`);manifesto.style.setProperty('--m-tilt1',`${y*.35}deg`);manifesto.style.setProperty('--m-tilt2',`${y*-.45}deg`)});visual.addEventListener('pointerleave',()=>{manifesto.style.setProperty('--m-img1-x','0px');manifesto.style.setProperty('--m-img2-x','0px');manifesto.style.setProperty('--m-tilt1','0deg');manifesto.style.setProperty('--m-tilt2','0deg')})}}
 }else{document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));document.querySelectorAll('.system-step').forEach(el=>el.style.opacity='1')}
})();
