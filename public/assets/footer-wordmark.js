// Fit with font size and tracking only; never stretch the glyphs horizontally.
(() => {
 'use strict';
 const marks=[...document.querySelectorAll('footer[data-shared-footer] .footer-wordmark')];
 if(!marks.length)return;
 const context=document.createElement('canvas').getContext('2d');
 if(!context)return;
 function fit(mark){
  const name=mark.querySelector('.footer-wordmark-name'),subtitle=mark.querySelector('.footer-wordmark-subtitle');
  const width=mark.getBoundingClientRect().width;
  if(!name||!subtitle||!width)return;
  const family=getComputedStyle(name).fontFamily;
  context.font='500 100px '+family;
  let size=100*width/context.measureText(name.textContent).width;
  name.style.setProperty('--wordmark-name-size',size+'px');
  // Optical sizing can change a variable font's width at smaller mobile sizes.
  for(let i=0;i<2;i++){
   size*=width/name.getBoundingClientRect().width;
   name.style.setProperty('--wordmark-name-size',size+'px');
  }
  const subSize=size*.22;
  subtitle.style.setProperty('--wordmark-subtitle-size',subSize+'px');
  subtitle.style.letterSpacing='0px';
  const tracking=Math.max(0,(width-subtitle.getBoundingClientRect().width)/(subtitle.textContent.length-1));
  subtitle.style.letterSpacing=tracking+'px';
 }
 const update=()=>marks.forEach(fit);
 new ResizeObserver(update).observe(marks[0]);
 document.fonts?.ready.then(update);
 addEventListener('pageshow',update);
 update();
})();
