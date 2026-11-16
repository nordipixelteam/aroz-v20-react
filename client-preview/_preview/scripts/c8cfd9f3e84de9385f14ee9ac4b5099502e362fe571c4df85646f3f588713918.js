
const steps=[...document.querySelectorAll('.step')],shots=[...document.querySelectorAll('.shot')];
function updateStory(){if(innerWidth<=820)return;const target=innerHeight*.5;let best=0,bestD=1e9;steps.forEach((s,i)=>{const r=s.getBoundingClientRect();const c=r.top+r.height*.38;const d=Math.abs(c-target);if(d<bestD){bestD=d;best=i}});steps.forEach((s,i)=>s.classList.toggle('active',i===best));shots.forEach((s,i)=>s.classList.toggle('active',i===best));}
addEventListener('scroll',updateStory,{passive:true});addEventListener('resize',updateStory,{passive:true});updateStory();
