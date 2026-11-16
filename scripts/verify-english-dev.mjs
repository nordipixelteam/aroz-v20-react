import fs from 'node:fs';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {loadDevelopmentEnv} from './dev-env.mjs';
import {getMongoClient} from '../db/connection.js';
import {translations} from './english-content.mjs';

loadDevelopmentEnv();
const client=await getMongoClient();
const origin='http://127.0.0.1:3000';
const request=async(path,body)=>{
 const response=await fetch(origin+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json',Origin:origin}:{},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
 return {status:response.status,value:await response.json()};
};
try{
 const db=client.db('avault_dev');
 const before=JSON.parse(fs.readFileSync('.avault-kit/english-review/database-before.json','utf8'));
 const documents=await db.collection('documents').find({}).toArray();
 assert.equal(documents.length,37);
 assert.deepEqual(documents.map(d=>d.route).sort(),before.documents.map(d=>d.route).sort());
 assert.deepEqual(await db.collection('redirects').find({}).toArray(),before.redirects);
 let count=0;
 for(const row of documents){
  for(const state of ['draft','published']){
   if(!row[state])continue;
   const doc=JSON.parse(row[state]);assert.match(doc.template,/<html[^>]*lang="en"/);
   const old=JSON.parse(before.documents.find(d=>d.route===row.route)[state]);
   assert.deepEqual(doc.fields.filter(f=>f.kind==='url').map(f=>[f.key,f.value]),old.fields.filter(f=>f.kind==='url').map(f=>[f.key,f.value]));
   for(const f of doc.fields.filter(f=>f.kind!=='url')){
    if(translations.has(f.value))assert.equal(translations.get(f.value),f.value,`Untranslated field ${row.route} ${f.key}`);
   }
   count+=doc.fields.length;
  }
 }
 const contact=JSON.parse(documents.find(d=>d.route==='/kontakt/').draft);
 assert.ok(contact.fields.some(f=>f.value==='Your name / business'));assert.ok(contact.fields.some(f=>f.value==='What would you like to change or achieve?'));
 const token=await request('/api/forms/token/');assert.equal(token.status,200);
 await new Promise(resolve=>setTimeout(resolve,2600));
 const invalid=await request('/api/forms/submit/',{token:token.value.token,name:'A',email:'invalid'});
 assert.equal(invalid.status,422);assert.equal(invalid.value.error,'Please enter your name.');
 const emailSetting=await db.collection('settings').findOne({id:'email'});
 assert.ok(!emailSetting||!JSON.parse(emailSetting.value).enabled,'Refusing to send a test email to configured recipients.');
 const marker='Local English verification '+randomUUID();
 const valid=await request('/api/forms/submit/',{token:token.value.token,name:'Local English Test',email:'avault-english-test@example.com',request:marker,message:'Checking the English contact form locally.',page:origin+'/kontakt/'});
 assert.equal(valid.status,200);assert.equal(valid.value.message,'Thank you. Your project enquiry has been sent securely.');
 const lead=await db.collection('forms').findOne({search:{$regex:marker.toLowerCase()}});
 assert.ok(lead);assert.equal(JSON.parse(lead.value).name,'Local English Test');assert.notEqual(lead.delivery,'sent');
 await db.collection('forms').deleteOne({_id:lead._id,id:lead.id});
 const report={database:'avault_dev',pages:documents.length,fieldsChecked:count,contactEditorFields:'English',urls:'unchanged',redirects:'unchanged',formValidation:invalid.value.error,formSubmission:valid.value.message,testLeadRemoved:true,emailSent:false};
 fs.writeFileSync('.avault-kit/english-review/verification.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
}finally{await client.close()}
