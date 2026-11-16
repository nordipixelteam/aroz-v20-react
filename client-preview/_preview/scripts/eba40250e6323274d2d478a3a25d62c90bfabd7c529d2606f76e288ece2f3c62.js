
const story=document.querySelector('.story'), views=[...document.querySelectorAll('.story .pageview')], copies=[...document.querySelectorAll('.story .copy')];
function updateStory(){if(!story||innerWidth<=900)return;const r=story.getBoundingClientRect(), total=story.offsetHeight-innerHeight;let p=Math.max(0,Math.min(1,-r.top/Math.max(1,total)));let i=Math.min(3,Math.floor(p*4));views.forEach((v,j)=>v.classList.toggle('active',j===i));copies.forEach((c,j)=>c.classList.toggle('active',j===i));}
addEventListener('scroll',updateStory,{passive:true});addEventListener('resize',updateStory,{passive:true});updateStory();
