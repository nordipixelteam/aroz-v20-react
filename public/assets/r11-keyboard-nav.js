/* AROZ R11: Mobile navigation keyboard focus management.
 * Enhances existing menu toggles without replacing their styling/animations.
 * Keeps focus inside open navigation; Escape returns focus to toggle.
 * No dependencies, no network, no background operations.
 */
(()=>{
 'use strict';
 const toggles=[...document.querySelectorAll('button[aria-expanded]')].filter(t=>
   t.matches('.menu-btn,.r6-toggle,.menu-toggle') && (t.hasAttribute('aria-controls') || t.closest('header')));
 const focusable='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
 const visible=el=>{
   if(!el||el.closest('[inert],[aria-hidden="true"]'))return false;
   const cs=getComputedStyle(el),r=el.getBoundingClientRect();
   return cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0;
 };
 for(const trigger of toggles){
   let id=trigger.getAttribute('aria-controls');
   let menu=id?document.getElementById(id):null;
   if(!menu && trigger.classList.contains('menu-btn')){
     menu=document.querySelector('nav.mobile-menu,div.mobile-menu,nav.mobile-nav,div.mobile-nav');
     if(menu){id='r11-mobile-'+[...document.querySelectorAll('button.menu-btn')].indexOf(trigger);menu.id=menu.id||id;trigger.setAttribute('aria-controls',menu.id);}
   }
   if(!menu)continue;
   if(menu.tagName==='NAV'&&!menu.hasAttribute('aria-label'))menu.setAttribute('aria-label','Mobile Navigation');
   const isOpen=()=>trigger.getAttribute('aria-expanded')==='true';
   const navItems=()=>[...menu.querySelectorAll(focusable)].filter(visible);
   const clear=()=>{if(document.activeElement&&menu.contains(document.activeElement)&&!isOpen())trigger.focus({preventScroll:true});};
   const obs=new MutationObserver(()=>{
     if(isOpen()){
       const focusWhenReady=(tryCount=0)=>{
         if(!isOpen()||!visible(trigger))return;
         const first=navItems()[0];
         if(first){
           if(document.activeElement===trigger||!menu.contains(document.activeElement))first.focus({preventScroll:true});
         }else if(tryCount<9){window.setTimeout(()=>focusWhenReady(tryCount+1),90);}
       };
       requestAnimationFrame(()=>focusWhenReady());
     }else{clear();}
   });
   obs.observe(trigger,{attributes:true,attributeFilter:['aria-expanded']});
   document.addEventListener('keydown',event=>{
     if(!isOpen()||!visible(trigger))return;
     if(event.key==='Escape'){
       event.preventDefault();event.stopPropagation();
       trigger.click();
       if(isOpen()){trigger.setAttribute('aria-expanded','false');}
       trigger.focus({preventScroll:true});return;
     }
     if(event.key!=='Tab')return;
     const nodes=[trigger,...navItems()];
     // During visibility/opacity transitions the menu links may not yet be
     // focusable. Never let Tab escape to the obscured page in that interval.
     if(nodes.length<2){event.preventDefault();trigger.focus({preventScroll:true});return;}
     const i=nodes.indexOf(document.activeElement);
     if(i===-1){event.preventDefault();(event.shiftKey?nodes.at(-1):nodes[1]).focus({preventScroll:true});return;}
     // Cycle from final menu item to the toggle, then from toggle to the first link.
     event.preventDefault();
     nodes[(i+(event.shiftKey?-1:1)+nodes.length)%nodes.length].focus({preventScroll:true});
   },true);
   window.addEventListener('resize',()=>{if(isOpen()&&!visible(trigger))trigger.click();},{passive:true});
 }
})();
