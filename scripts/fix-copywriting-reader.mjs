import assert from'node:assert/strict';
import {MongoClient} from'mongodb';
import {loadDevelopmentEnv} from'./dev-env.mjs';
loadDevelopmentEnv();
const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});
try{
 await client.connect();const collection=client.db('avault_dev').collection('documents');
 const row=await collection.findOne({route:'/copywriting/'});if(!row)throw Error('Copywriting document not found.');
 const changes={},summary=[];
 for(const state of['published','draft']){
  if(!row[state])continue;
  const before=JSON.parse(row[state]),after=structuredClone(before);let replacements=0;
  after.template=after.template.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,tag=>{
   if(!tag.includes('function scrollStates()')||!tag.includes('setReader'))return tag;
   replacements++;return '<script src="/assets/copywriting-reader.js" defer></script>';
  });
  if(!after.template.includes('/assets/copywriting-reader.css'))after.template=after.template.replace('</head>','<link rel="stylesheet" href="/assets/copywriting-reader.css"></head>');
  assert.equal(after.template.includes('/assets/copywriting-reader.js'),true);
  assert.equal(after.template.includes('/assets/copywriting-reader.css'),true);
  assert.deepEqual(after.fields,before.fields);
  assert.deepEqual({...after,template:''},{...before,template:''});
  if(after.template!==before.template)changes[state]=JSON.stringify({...after,revision:Number(row.revision||0)+1,updatedAt:new Date().toISOString()});
  summary.push({state,replacements,fieldsPreserved:after.fields.length,changed:after.template!==before.template});
 }
 console.log(JSON.stringify({database:'avault_dev',route:'/copywriting/',mode:process.argv.includes('--apply')?'apply':'preview',states:summary}));
 if(process.argv.includes('--apply')&&Object.keys(changes).length){
  const filter={_id:row._id,published:row.published,draft:row.draft};
  const result=await collection.updateOne(filter,{$set:{...changes,revision:Number(row.revision||0)+1,updated_at:new Date().toISOString()}});
  assert.equal(result.modifiedCount,1,'Page changed concurrently; rerun preview.');
  console.log('Updated template script/style references only. Field values and drafts preserved.');
 }
}finally{await client.close()}
