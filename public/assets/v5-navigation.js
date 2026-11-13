/* V12: scroll direction controls the shared navigation; no scroll interception. */
(()=>{'use strict';const header=document.querySelector('.v3-nav'),dialog=document.querySelector('#v3-menu'),toggle=document.querySelector('.v3-menu-toggle'),links=header?.querySelector('.v10-nav-links');if(!header||!dialog||!toggle)return;
let frame=0,lastY=scrollY,anchorY=scrollY,direction=0;
function setCompact(value){if(dialog.open)value=false;header.classList.toggle('is-compact',value);if(links)links.inert=value;toggle.setAttribute('aria-label',value?'Navigation erweitern':'Menü öffnen');toggle.setAttribute('aria-controls',value&&links?'v12-direct-nav':'v3-menu');toggle.setAttribute('aria-expanded',String(dialog.open));}
function expand(){setCompact(false);lastY=anchorY=scrollY;direction=0;}
const close=()=>{dialog.close();toggle.setAttribute('aria-expanded','false');toggle.focus();};
header.addEventListener('click',e=>{if(!header.classList.contains('is-compact'))return;if(e.target.closest('.v3-talk'))return;e.preventDefault();e.stopImmediatePropagation();expand();},{capture:true});
toggle.addEventListener('click',()=>{expand();dialog.showModal();toggle.setAttribute('aria-expanded','true');});dialog.querySelector('.v3-close').addEventListener('click',close);dialog.addEventListener('close',()=>toggle.setAttribute('aria-expanded','false'));dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();});
function update(){frame=0;const y=Math.max(0,scrollY),delta=y-lastY;lastY=y;if(y<100){expand();return}if(Math.abs(delta)<2)return;const next=delta>0?1:-1;if(next!==direction){direction=next;anchorY=y-delta}if(direction>0&&y>160&&y-anchorY>48){setCompact(true)}else if(direction<0&&anchorY-y>24){setCompact(false)}}
addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update)},{passive:true});addEventListener('pageshow',()=>{lastY=anchorY=scrollY;setCompact(scrollY>160)});setCompact(scrollY>160);
})();
