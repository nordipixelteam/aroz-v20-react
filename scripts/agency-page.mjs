export const oldApproach="const approachObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){approachSteps.forEach(x=>x.classList.remove('active'));e.target.classList.add('active')}}),{threshold:.58,rootMargin:'-16% 0px -16%'});approachSteps.forEach(x=>approachObserver.observe(x));";
export const newApproach="/* Active step follows the nearest row centre at the viewport reading line. */";
export const updateAnchor='function update(){const vh=innerHeight;';
export const updatedAnchor=updateAnchor+"\n   if(approachSteps.length){const marker=vh*.5;let nearest=0,distance=Infinity;approachSteps.forEach((step,i)=>{const r=step.getBoundingClientRect();const d=Math.abs(r.top+r.height/2-marker);if(d<distance){nearest=i;distance=d}});approachSteps.forEach((step,i)=>step.classList.toggle('active',i===nearest))}";
export function fixAgencyScript(text){return text.replace(oldApproach,newApproach).replace(updatedAnchor,updateAnchor).replace(updateAnchor,updatedAnchor);}
export const headingBefore=['Rooted here.','Working beyond the region','together.'];
export const headingAfter=['Rooted in Schwelm.','Connected beyond','the region.'];
