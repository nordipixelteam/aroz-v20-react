// Simple Icons removed Microsoft's logos (Bing, Copilot) after v12, so pages saved with those CDN links
// show a broken image. Local copies live in /public/assets. render() swaps them on the fly, and the
// scheduled maintenance run rewrites saved pages once so AVAULT (Media, editor, "Where used") agrees.
const LEGACY_ICON=/https:\/\/cdn\.jsdelivr\.net\/npm\/simple-icons@[^/"\\]+\/icons\/microsoft(bing|copilot)\.svg/g;
export const fixIcons=(s:string)=>s.replace(LEGACY_ICON,(_,name)=>`/assets/microsoft-${name}-mark.svg`);

const ARROW_UP_RIGHT = /(?:\u2197|&#(?:8599|x2197);|&nearr;)(?:[\uFE0E\uFE0F]|&#(?:65038|65039|xFE0[EF]);)?/gi;
const CONTROL_OR_RAW_HTML = /<!--[\s\S]*?-->|<(script|style|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>|(<(a|button)\b(?:[^"'<>]|"[^"]*"|'[^']*')*>)([\s\S]*?)(<\/\3\s*>)/gi;

export function fixButtonArrows(html:string){
 return html.replace(CONTROL_OR_RAW_HTML,(control,_rawTag,open,_tag,body,close)=>{
  if(!open)return control;
  const label=body.replace(/<[^>]*>/g,'').replace(ARROW_UP_RIGHT,'').trim();
  const accessibility=label||/\baria-label(?:ledby)?\s*=/i.test(open)
   ?'aria-hidden="true"'
   :'role="img" aria-label="Up-right arrow"';
  const icon='<span class="av-arrow-up-right" '+accessibility+'></span>';
  return open+body.replace(/<!--[\s\S]*?-->|<(?:[^"'<>]|"[^"]*"|'[^']*')*>|[^<]+/g,part=>
   part.startsWith('<')?part:part.replace(ARROW_UP_RIGHT,icon))+close;
 });
}

export async function migrateLegacyIcons(){
 const {mongoDb}=await import('@/db/mongo');const db=await mongoDb();
 const rx={$regex:'cdn\\.jsdelivr\\.net/npm/simple-icons@[^/]+/icons/microsoft(bing|copilot)\\.svg'};
 const rows=await db.collection('documents').find({$or:[{draft:rx},{published:rx}]},{projection:{_id:1,route:1,draft:1,published:1}}).toArray();
 for(const r of rows)await db.collection('documents').updateOne({_id:r._id},{$set:{draft:fixIcons(String(r.draft||'')),...(r.published?{published:fixIcons(String(r.published))}:{})}});
 if(rows.length){const {recordActivity}=await import('./operations');await recordActivity('scheduled-job','media-replace',`Microsoft logos on ${rows.map(r=>r.route).join(', ')}`)}
 return rows.length;
}
