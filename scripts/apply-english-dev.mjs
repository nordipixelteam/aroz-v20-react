// Applies only an already-reviewed local plan. Never loads production env files.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {loadDevelopmentEnv} from './dev-env.mjs';
import {getMongoClient} from '../db/connection.js';

loadDevelopmentEnv();
const file='.avault-kit/english-review/plan.json';
const plan=JSON.parse(fs.readFileSync(file,'utf8'));
assert.equal(plan.database,'avault_dev');assert.equal(plan.documents.length,37);
const changes=plan.documents.filter(item=>item.after.draft!==item.before.draft||item.after.published!==item.before.published);
if(!process.argv.includes('--apply')){console.log('Preview only. Review .avault-kit/english-review/summary.json and preview/ before using --apply.');process.exit(0)}
const client=await getMongoClient();const session=client.startSession();
try{
 const db=client.db('avault_dev'),stamp=new Date().toISOString();
 await session.withTransaction(async()=>{
  for(const item of changes){
   const version=item.before.revision+1;
   const revise=value=>value?JSON.stringify({...JSON.parse(value),revision:version,updatedAt:stamp}):null;
   const after={draft:revise(item.after.draft),published:revise(item.after.published)};
   const result=await db.collection('documents').updateOne({route:item.route,...item.before},{$set:{...after,revision:version,updated_at:stamp}},{session});
   assert.equal(result.matchedCount,1,`Content changed since preview: ${item.route}. Entire update cancelled.`);
   await db.collection('revisions').insertOne({id:randomUUID(),document_id:item.route,before:item.before.draft,after:after.draft,actor:'local:english-default',state:'applied',created_at:stamp},{session});
  }
  for(const item of plan.settings){
   const result=await db.collection('settings').updateOne({id:item.id,...item.before},{$set:{value:item.after},$inc:{revision:1}},{session});
   assert.equal(result.matchedCount,1,`Settings changed since preview: ${item.id}. Entire update cancelled.`);
  }
 });
 fs.writeFileSync('.avault-kit/english-review/applied.json',JSON.stringify({database:'avault_dev',pagesReviewed:plan.documents.length,pagesChanged:changes.length,at:stamp},null,2));
 console.log(`Applied reviewed English content to ${changes.length} of ${plan.documents.length} avault_dev pages. URLs, redirects and independently translated drafts retained.`);
}finally{await session.endSession();await client.close()}
