export const oldChoices="rows.forEach(x=>x.addEventListener('click',()=>{choose(x.dataset.service);document.querySelector('#projekt')?.scrollIntoView({behavior:reduce?'auto':'smooth'})}));";
export const newChoices=`function showBrief(){const brief=document.querySelector('#projekt .brief-grid')||document.querySelector('#projekt');if(!brief)return;const header=document.querySelector('header'),clearance=Math.max(96,header?.getBoundingClientRect().bottom||0)+24;history.replaceState(null,'','#projekt');scrollTo({top:Math.max(0,brief.getBoundingClientRect().top+scrollY-clearance),behavior:reduce?'instant':'smooth'});}
rows.forEach(x=>x.addEventListener('click',()=>{choose(x.dataset.service);showBrief()}));
document.querySelectorAll('.analysis-card a[href="#projekt"]').forEach((link,i)=>link.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();choose(rows[i]?.dataset.service||picks[i]?.dataset.value||'');showBrief()},true));
document.querySelector('#contactForm')?.addEventListener('reset',()=>requestAnimationFrame(()=>choose('')));`;
export function fixContactScript(script){return script.replace(oldChoices,newChoices).replace("document.querySelector('#projekt .brief-intro')||document.querySelector('#projekt')","document.querySelector('#projekt .brief-grid')||document.querySelector('#projekt')");}
export const contactCopy=new Map([
 ['Design preview · no delivery yet','Project enquiries'],
 ['This page is a design preview. Before publication, we will add verified phone and email contact details and secure form delivery.',"Tell us what you have in mind using the project brief. Your enquiry is stored securely so our team can review it and follow up."],
 ['Form preview ↗','Send a project enquiry ↗'],
 ['Website Content','Website content'],
 ['Nordrhein-Westfalen','North Rhine-Westphalia'],
]);
