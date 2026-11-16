import assert from 'node:assert/strict';
import {MongoClient} from 'mongodb';
import {loadDevelopmentEnv} from './dev-env.mjs';
import {integrateAgencyHero} from './agency-hero.mjs';
loadDevelopmentEnv();const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});
try{
 await client.connect();const docs=client.db('avault_dev').collection('documents'),row=await docs.findOne({route:'/agentur/'});assert.ok(row);
 const changes={},summary=[];
 for(const state of ['published','draft']){
  if(!row[state])continue;
  const before=JSON.parse(row[state]),after=structuredClone(before);
  after.template=integrateAgencyHero(after.template);
  if(!after.template.includes('/assets/agency-hero.css'))after.template=after.template.replace('</head>','<link rel="stylesheet" href="/assets/agency-hero.css"></head>');
  assert.ok(after.template.includes('data-agency-photo="integrated"'));
  assert.deepEqual({...after,template:''},{...before,template:''});
  // Every editable token and all non-hero body markup stay intact.
  const tokens=s=>[...s.matchAll(/\{\{(f\d+)\}\}/g)].map(m=>m[1]).sort();assert.deepEqual(tokens(after.template),tokens(before.template));
  assert.equal(after.template.split('<section class="manifesto"')[1],before.template.split('<section class="manifesto"')[1]);
  const changed=after.template!==before.template;
  if(changed)changes[state]=JSON.stringify({...after,revision:Number(row.revision||0)+1,updatedAt:new Date().toISOString()});
  summary.push({state,fieldsPreserved:before.fields.length,changed});
 }
 console.log(JSON.stringify({database:'avault_dev',mode:process.argv.includes('--apply')?'apply':'preview',summary}));
 if(process.argv.includes('--apply')&&Object.keys(changes).length){const result=await docs.updateOne({_id:row._id,published:row.published,draft:row.draft},{$set:{...changes,revision:Number(row.revision||0)+1,updated_at:new Date().toISOString()}});assert.equal(result.modifiedCount,1,'Agency changed concurrently; preview again.');console.log('Applied Agency hero layout only; all field values and unrelated draft markup preserved.');}
}finally{await client.close()}
