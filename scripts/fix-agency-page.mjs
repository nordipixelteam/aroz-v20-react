import assert from 'node:assert/strict';
import {MongoClient} from 'mongodb';
import {loadDevelopmentEnv} from './dev-env.mjs';
import {fixAgencyScript,oldApproach,headingBefore,headingAfter} from './agency-page.mjs';
loadDevelopmentEnv();
const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});
try{
 await client.connect();const docs=client.db('avault_dev').collection('documents'),row=await docs.findOne({route:'/agentur/'});assert.ok(row);
 const changes={},summary=[];
 for(const state of ['published','draft']){
  if(!row[state])continue;
  const before=JSON.parse(row[state]),after=structuredClone(before),headingChanges=[];
  const section=before.template.match(/<section[^>]*class="local"[\s\S]*?<\/section>/)?.[0];assert.ok(section);
  const heading=section.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1];assert.ok(heading);
  const keys=[...heading.matchAll(/\{\{(f\d+)\}\}/g)].map(m=>m[1]);
  for(const key of keys){const field=after.fields.find(f=>f.key===key);const index=headingBefore.indexOf(field?.value);if(index>=0){headingChanges.push(key);field.value=headingAfter[index];}}
  if(!after.template.includes('/assets/agency-page.css'))after.template=after.template.replace('</head>','<link rel="stylesheet" href="/assets/agency-page.css"></head>');
  after.template=fixAgencyScript(after.template);
  assert.ok(!after.template.includes(oldApproach));assert.ok(after.template.includes('nearest row centre'));
  assert.equal(after.fields.length,before.fields.length);
  for(const field of before.fields)if(!headingChanges.includes(field.key))assert.deepEqual(after.fields.find(f=>f.key===field.key),field);
  assert.deepEqual({...after,fields:[],template:''},{...before,fields:[],template:''});
  const changed=JSON.stringify(after)!==JSON.stringify(before);
  if(changed)changes[state]=JSON.stringify({...after,revision:Number(row.revision||0)+1,updatedAt:new Date().toISOString()});
  summary.push({state,fields:before.fields.length,headingFieldsUpdated:headingChanges,changed});
 }
 console.log(JSON.stringify({database:'avault_dev',mode:process.argv.includes('--apply')?'apply':'preview',summary}));
 if(process.argv.includes('--apply')&&Object.keys(changes).length){const result=await docs.updateOne({_id:row._id,published:row.published,draft:row.draft},{$set:{...changes,revision:Number(row.revision||0)+1,updated_at:new Date().toISOString()}});assert.equal(result.modifiedCount,1,'Document changed concurrently; preview again.');console.log('Applied Agency-only styles, step controller and matching default heading fields; unrelated draft edits preserved.');}
}finally{await client.close()}
