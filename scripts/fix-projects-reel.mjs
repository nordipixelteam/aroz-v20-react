import assert from'node:assert/strict';
import {MongoClient} from'mongodb';
import {loadDevelopmentEnv} from'./dev-env.mjs';
loadDevelopmentEnv();const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});
try{
 await client.connect();const documents=client.db('avault_dev').collection('documents'),row=await documents.findOne({route:'/projekte/'});if(!row)throw Error('Projects document not found.');
 const changes={},summary=[];
 for(const state of['published','draft']){
  if(!row[state])continue;
  const before=JSON.parse(row[state]),after=structuredClone(before);
  if(!after.template.includes('/assets/projects-reel.css'))after.template=after.template.replace('</head>','<link rel="stylesheet" href="/assets/projects-reel.css"></head>');
  assert.ok(after.template.includes('/assets/projects-reel.css'));
  assert.deepEqual({...after,template:''},{...before,template:''});
  assert.equal(after.template.replace('<link rel="stylesheet" href="/assets/projects-reel.css">',''),before.template.replace('<link rel="stylesheet" href="/assets/projects-reel.css">',''));
  if(after.template!==before.template)changes[state]=JSON.stringify({...after,revision:Number(row.revision||0)+1,updatedAt:new Date().toISOString()});
  summary.push({state,fieldsPreserved:before.fields.length,changed:after.template!==before.template});
 }
 console.log(JSON.stringify({database:'avault_dev',route:'/projekte/',mode:process.argv.includes('--apply')?'apply':'preview',summary}));
 if(process.argv.includes('--apply')&&Object.keys(changes).length){const result=await documents.updateOne({_id:row._id,published:row.published,draft:row.draft},{$set:{...changes,revision:Number(row.revision||0)+1,updated_at:new Date().toISOString()}});assert.equal(result.modifiedCount,1,'Projects changed concurrently; preview again.');console.log('Applied stylesheet reference only; source script, all fields and unpublished edits retained.');}
}finally{await client.close()}
