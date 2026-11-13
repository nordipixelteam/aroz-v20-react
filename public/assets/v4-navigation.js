(()=>{const header=document.querySelector('.v3-nav'),dialog=document.querySelector('#v3-menu'),toggle=document.querySelector('.v3-menu-toggle');
 const close=()=>{dialog.close();toggle.setAttribute('aria-expanded','false');toggle.focus();};
 toggle.addEventListener('click',()=>{dialog.showModal();toggle.setAttribute('aria-expanded','true');});dialog.querySelector('.v3-close').addEventListener('click',close);dialog.addEventListener('close',()=>toggle.setAttribute('aria-expanded','false'));dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();});

})();
