/* AROZ V5 R4: focus-management hardening for mobile preview navigation. */
(()=>{
 const btn=document.querySelector('.menu-btn, .menu-toggle');
 if(!btn)return;
 let panel=btn.getAttribute('aria-controls')&&document.getElementById(btn.getAttribute('aria-controls'));
 if(!panel){ panel=document.querySelector('.mobile-menu,.mobile-nav,nav#main-nav,#mobileMenu'); }
 if(!panel)return;
 if(!panel.id)panel.id='r4-mobile-navigation';
 btn.setAttribute('aria-controls',panel.id);
 if(!btn.hasAttribute('aria-expanded'))btn.setAttribute('aria-expanded','false');
 let wasOpen=false;
 const elements=()=>[btn,...panel.querySelectorAll('a[href],button:not([disabled]),input:not([disabled])')].filter(el=>{const r=el.getBoundingClientRect();return r.height>0&&r.width>0&&getComputedStyle(el).visibility!=='hidden'});
 btn.addEventListener('click',()=>{requestAnimationFrame(()=>{
   const open=btn.getAttribute('aria-expanded')==='true';
   if(open&&!wasOpen&&document.activeElement===btn){const first=elements().find(x=>x!==btn); if(first)first.focus({preventScroll:true});}
   wasOpen=open;
 });});
 document.addEventListener('keydown',e=>{
   if(e.key==='Tab'&&btn.getAttribute('aria-expanded')==='true'){
     const a=elements();if(a.length<2)return;
     let first=a[0],last=a[a.length-1];
     if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
     else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
   }
 });
})();
