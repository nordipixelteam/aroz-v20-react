import {MongoClient} from 'mongodb';
import {loadDevelopmentEnv} from './dev-env.mjs';

loadDevelopmentEnv();
const origin=String(process.env.NEXT_PUBLIC_SITE_URL||'').replace(/\/$/,'');
if(!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(origin))throw new Error('NEXT_PUBLIC_SITE_URL must be an HTTPS origin without a path.');

const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});
await client.connect();
try{
 const collection=client.db(process.env.MONGODB_DB||undefined).collection('documents');
 const records=await collection.find({},{projection:{route:1,draft:1,published:1,revision:1}}).toArray();
 let updated=0;
 for(const record of records){
  const route=String(record.route||'/');
  const nextRevision=Number(record.revision||0)+1;
  const patch={};
  let changed=false;
  for(const state of ['draft','published']){
   if(!record[state])continue;
   const document=JSON.parse(String(record[state]));
   const canonical=origin+route;
   if(document.seo?.canonical===canonical)continue;
   document.seo={...(document.seo||{}),canonical};
   document.revision=nextRevision;
   patch[state]=JSON.stringify(document);
   changed=true;
  }
  if(changed){await collection.updateOne({_id:record._id,revision:record.revision},{$set:{...patch,revision:nextRevision,updated_at:new Date().toISOString()}});updated++}
 }
 console.log(`Canonical origin ${origin}: ${updated} document record(s) updated, ${records.length-updated} already current.`);
}finally{
 await client.close();
}
