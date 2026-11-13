// Simple Icons removed Microsoft's logos (Bing, Copilot) after v12, so pages saved with those CDN links
// show a broken image. Local copies live in /public/assets. render() swaps them on the fly, and the
// scheduled maintenance run rewrites saved pages once so AVAULT (Media, editor, "Where used") agrees.
const LEGACY_ICON=/https:\/\/cdn\.jsdelivr\.net\/npm\/simple-icons@[^/"\\]+\/icons\/microsoft(bing|copilot)\.svg/g;
export const fixIcons=(s:string)=>s.replace(LEGACY_ICON,(_,name)=>`/assets/microsoft-${name}-mark.svg`);

export async function migrateLegacyIcons(){
 const {mongoDb}=await import('@/db/mongo');const db=await mongoDb();
 const rx={$regex:'cdn\\.jsdelivr\\.net/npm/simple-icons@[^/]+/icons/microsoft(bing|copilot)\\.svg'};
 const rows=await db.collection('documents').find({$or:[{draft:rx},{published:rx}]},{projection:{_id:1,route:1,draft:1,published:1}}).toArray();
 for(const r of rows)await db.collection('documents').updateOne({_id:r._id},{$set:{draft:fixIcons(String(r.draft||'')),...(r.published?{published:fixIcons(String(r.published))}:{})}});
 if(rows.length){const {recordActivity}=await import('./operations');await recordActivity('scheduled-job','media-replace',`Microsoft logos on ${rows.map(r=>r.route).join(', ')}`)}
 return rows.length;
}
