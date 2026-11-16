import {HttpError,type Doc} from './store';
import {navCanvas} from './nav-canvas';
import {sections} from './blocks';

// Check trusted stored metadata, never the groups supplied by a client. This also guards restores
// and section edits at the common commit boundary, before any revision or document is written.
export function assertNavigationPermission(current:Doc,next:Doc,role:string){
 if(role==='owner')return;
 const shared=(d:Doc)=>d.fields.filter(f=>f.group==='navigation'||f.group==='footer');
 const structure=(d:Doc)=>{
  const keys=new Set(shared(d).map(f=>f.key));
  const protectedSections=sections(d.template).items.filter(s=>[...s.html.matchAll(/\{\{(f\d+)\}\}/g)].some(m=>keys.has(m[1])));
  return protectedSections.map(s=>({id:s.id,html:s.html,hidden:(d.hiddenSections||[]).includes(s.id),position:(d.sectionOrder||sections(d.template).items.map(s=>s.id)).indexOf(s.id)}));
 };
 const canvas=(d:Doc)=>{const {header,footer}=navCanvas(d.template);return {header,footer}};
 if(JSON.stringify(shared(current))!==JSON.stringify(shared(next))||JSON.stringify(canvas(current))!==JSON.stringify(canvas(next))||JSON.stringify(structure(current))!==JSON.stringify(structure(next)))throw new HttpError(403,'Owner access required to edit navigation or footer.');
}
