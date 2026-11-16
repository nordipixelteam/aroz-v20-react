// Reads only avault_dev; writes only to a fresh authenticated loopback database.
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomBytes,createHash} from 'node:crypto';
import {MongoClient,GridFSBucket} from 'mongodb';
import {loadDevelopmentEnv} from './dev-env.mjs';
import {decodeBackup,restoreSnapshot} from './backup-restore.mjs';
import {hashPassword} from '../lib/avault/passwords.mjs';
import {deflateSync} from 'node:zlib';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';

function png(){
 const crc32=bytes=>{let crc=0xffffffff;for(const b of bytes){crc^=b;for(let j=0;j<8;j++)crc=(crc>>>1)^(0xedb88320&-(crc&1))}return(crc^0xffffffff)>>>0};
 const chunk=(type,data)=>{const n=Buffer.from(type),s=Buffer.alloc(4),c=Buffer.alloc(4);s.writeUInt32BE(data.length);c.writeUInt32BE(crc32(Buffer.concat([n,data])));return Buffer.concat([s,n,data,c])};
 const h=Buffer.alloc(13);h.writeUInt32BE(2,0);h.writeUInt32BE(2,4);h[8]=8;h[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',h),chunk('IDAT',deflateSync(Buffer.concat([Buffer.from([0]),randomBytes(8),Buffer.from([0]),randomBytes(8)]))),chunk('IEND',Buffer.alloc(0))]);
}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const freePort=()=>new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p))})});

const base=path.resolve('.avault-kit/restore-lab');
const run=new Date().toISOString().replace(/[^0-9]/g,'');
const target='avault_restore_test_'+run;
let source,root,writer,server,dummyEmail,cookie,imageKey,leadId,backupRow,snapshot,restoredApp,runDir,report,tokenNonce;
let step='initialization';
console.warn=()=>{};console.error=()=>{};
try{
 loadDevelopmentEnv();
 source=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});await source.connect();
 const sourceDb=source.db('avault_dev'),files=new GridFSBucket(sourceDb,{bucketName:'avault_files'});
 const readObject=async key=>{const row=await files.find({filename:key}).sort({uploadDate:-1}).limit(1).next();if(!row)throw Error('Required private backup object is missing.');const chunks=[];for await(const c of files.openDownloadStream(row._id))chunks.push(c);return {bytes:Buffer.concat(chunks),mime:row.metadata?.contentType}};
 step='reading existing encrypted development backup';
 dummyEmail='restore-drill-'+run+'@example.com';const passwordForLogin=randomBytes(30).toString('base64url'),time=new Date().toISOString();
 await sourceDb.collection('users').insertOne({email:dummyEmail,role:'owner',active:true,password_hash:await hashPassword(passwordForLogin),session_version:1,created_at:time,updated_at:time});
 const origin='http://127.0.0.1:3000';
 const request=async(action,body)=>fetch(origin+'/api/admin/'+action+'/',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(120000)});
 const login=await request('login',{email:dummyEmail,password:passwordForLogin});if(login.status!==200)throw Error('Local owner sign-in failed.');cookie=login.headers.get('set-cookie')?.split(';')[0];if(!cookie)throw Error('Local owner session unavailable.');
 step='submitting dummy contact through the public form';
 const emailSettings=await sourceDb.collection('settings').findOne({id:'email'});if(JSON.parse(emailSettings?.value||'{}').enabled)throw Error('Email delivery must already be disabled for this drill.');
 const contact=await fetch(origin+'/kontakt/');if(contact.status!==200)throw Error('Contact page unavailable.');await contact.arrayBuffer();
 const {token}=await(await fetch(origin+'/api/forms/token/')).json();tokenNonce=token.split('.')[1];await delay(5000);
 const submitted=await fetch(origin+'/api/forms/submit/',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({token,name:'Local Recovery Test',email:dummyEmail,message:'This is a non-sensitive local recovery test enquiry. Please remove this test record after verification.',page:origin+'/kontakt/',privacyConsent:'on'})});
 if(submitted.status!==200){process.stdout.write('Contact HTTP '+submitted.status+'\n');throw Error('Dummy contact submission failed.');}await submitted.arrayBuffer();step='finding dummy contact in source database';
 const lead=await sourceDb.collection('forms').findOne({search:{$regex:dummyEmail.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}});if(!lead)throw Error('Contact was not stored.');leadId=lead.id;
 step='verifying dummy contact in Leads';const leadResponse=await fetch(origin+'/api/admin/forms/?q='+encodeURIComponent(dummyEmail),{headers:{Cookie:cookie}}),leadList=await leadResponse.json();if(leadResponse.status!==200||!leadList.rows?.some(r=>r.id===leadId)||lead.status!=='new'||lead.delivery!=='not-configured'){process.stdout.write(JSON.stringify({leadsHttp:leadResponse.status,listed:leadList.rows?.some(r=>r.id===leadId),status:lead.status,delivery:lead.delivery})+'\n');throw Error('Dummy lead is missing from Leads or save-only flow.');}
 step='uploading non-sensitive PNG through AVAULT';const image=png(),form=new FormData();form.set('file',new Blob([image],{type:'image/png'}),'local-recovery-'+run+'.png');form.set('alt','Non-sensitive local recovery test image');
 const uploaded=await fetch(origin+'/api/admin/media/',{method:'POST',headers:{Origin:origin,Cookie:cookie},body:form}),upload=await uploaded.json();if(uploaded.status!==200||upload.duplicate||!upload.url?.startsWith('/media/'))throw Error('Dummy upload failed.');imageKey=upload.url.slice(7);
 const originalImage=await fetch(origin+upload.url);if(originalImage.status!==200||!Buffer.from(await originalImage.arrayBuffer()).equals(image))throw Error('Uploaded image not readable.');
 step='creating backup through the normal owner endpoint';const created=await request('backup',{});if(created.status!==200){const v=await created.json().catch(()=>({}));process.stdout.write('Backup HTTP '+created.status+'; missing media: '+(String(v.error||'').includes('media file is unavailable'))+'\n');throw Error('Owner backup failed.');}const createdValue=await created.json();
 const backup=await sourceDb.collection('backups').findOne({id:createdValue.id});if(!backup)throw Error('Created backup unavailable.');backupRow=backup;
 step='reading created encrypted backup object';const sealed=(await readObject(backup.key)).bytes;
 step='authenticating backup envelope';snapshot=decodeBackup(sealed.toString(),process.env.AVAULT_ENCRYPTION_KEY,backup.checksum,(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000').replace(/\/$/,''));
 if(!snapshot.tables.forms.some(r=>r.id===leadId)||!snapshot.tables.media.some(r=>r.key===imageKey)||!snapshot.mediaCopies.some(r=>r.original===imageKey))throw Error('Backup excludes the dummy lead or image.');
 const dir=path.join(base,'runs',run);runDir=dir;await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,'backup.enc'),sealed);
 process.env.MONGOMS_DOWNLOAD_DIR=path.join(base,'bin');process.env.MONGOMS_PREFER_GLOBAL_PATH='false';
 const {MongoMemoryServer}=await import('../.avault-kit/restore-lab/node_modules/mongodb-memory-server-core/lib/index.js');
 const password=randomBytes(30).toString('base64url'),scopedPassword=randomBytes(30).toString('base64url');
 const dataPath=path.join(dir,'database');await fs.mkdir(dataPath);
 step='starting isolated authenticated local database';
 server=await MongoMemoryServer.create({instance:{ip:'127.0.0.1',dbPath:dataPath},binary:{version:'8.2.6',downloadDir:path.join(base,'bin')},spawn:{windowsHide:true},auth:{enable:true,customRootName:'restore_operator',customRootPwd:password}});
 root=new MongoClient(server.getUri(),{auth:{username:'restore_operator',password},authSource:'admin'});await root.connect();
 await root.db(target).command({createUser:'restore_writer',pwd:scopedPassword,roles:[{role:'readWrite',db:target}]});
 writer=new MongoClient(server.getUri(),{auth:{username:'restore_writer',password:scopedPassword},authSource:target});await writer.connect();
 let scopeDenied=false;try{await writer.db('unrelated_restore_probe').collection('probe').findOne({})}catch(e){scopeDenied=e.code===13}if(!scopeDenied)throw Error('Restore credential scope check failed.');
 step='restoring and comparing all records and media';
 const result=await restoreSnapshot(writer.db(target),snapshot,readObject);
 if(!await writer.db(target).collection('forms').findOne({id:leadId}))throw Error('Restore lost the backed-up lead.');
 step='loading image through a restored Next.js instance';
 const port=await freePort(),restoreOrigin='http://127.0.0.1:'+port,uri=new URL(server.getUri());uri.username='restore_writer';uri.password=scopedPassword;uri.searchParams.set('authSource',target);
 const env={...process.env,NODE_ENV:'production',AVAULT_ENV:'restore-test',AVAULT_SCHEDULER:'off',MONGODB_URI:uri.toString(),MONGODB_DB:target,NEXT_PUBLIC_SITE_URL:restoreOrigin};delete env.VERCEL_ENV;
 restoredApp=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{cwd:process.cwd(),env,stdio:'ignore',windowsHide:true});
 let restoredImage;for(let i=0;i<60;i++){try{restoredImage=await fetch(restoreOrigin+upload.url,{signal:AbortSignal.timeout(2000)});if(restoredImage.status===200)break;await restoredImage.arrayBuffer()}catch{}await delay(500)}
 if(!restoredImage||restoredImage.status!==200||!restoredImage.headers.get('content-type')?.startsWith('image/png')||!Buffer.from(await restoredImage.arrayBuffer()).equals(image))throw Error('Restored-instance image HTTP read failed.');
 let published=0,drafts=0;for(const row of await writer.db(target).collection('documents').find({}).toArray())for(const field of ['published','draft'])if(row[field]){const doc=typeof row[field]==='string'?JSON.parse(row[field]):row[field];if(!doc||typeof doc!=='object')throw Error('Unreadable page record.');if(field==='published')published++;else drafts++;}
 report={run,target,source:'avault_dev',backupVersion:2,normalOwnerLoginAndBackup:true,contactFormSubmission:true,visibleInLeads:true,backupIncludesDummyLeadAndImage:true,restoredLeadReadable:true,restoredInstanceImageHttp200AndBytesMatch:true,authenticatedDecryption:true,checksumVerified:true,scopedCredentialDenialVerified:scopeDenied,...result,readablePublishedPages:published,readableDraftPages:drafts,productionUntouched:true};
}catch(e){process.stdout.write('FAIL at '+step+' ('+e.name+', '+(e.cause?.code||'no transport code')+'). Private diagnostics suppressed.\n');process.exitCode=1}
finally{
 if(restoredApp&&!restoredApp.killed){restoredApp.kill();await new Promise(resolve=>restoredApp.once('exit',resolve));}
 if(writer)await writer.close();if(root)await root.close();if(server)await server.stop({doCleanup:true,force:true});
 if(source){const d=source.db('avault_dev'),files=new GridFSBucket(d,{bucketName:'avault_files'});
 const removeFile=async key=>{for(const row of await files.find({filename:key}).toArray())await files.delete(row._id)};
 if(backupRow){for(const copy of snapshot?.mediaCopies||[])await removeFile(copy.backup);await removeFile(backupRow.key);await d.collection('backups').deleteOne({_id:backupRow._id});}
 if(imageKey){await removeFile(imageKey);await d.collection('media').deleteOne({key:imageKey});}if(leadId)await d.collection('forms').deleteOne({id:leadId});
 if(tokenNonce)await d.collection('rate_limits').deleteOne({id:'form-token:'+tokenNonce});
 if(dummyEmail){await d.collection('users').deleteOne({email:dummyEmail});await d.collection('activity').deleteMany({actor:dummyEmail});await d.collection('rate_limits').deleteMany({id:{$regex:dummyEmail.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$'}});for(const day of [Math.floor(Date.now()/86400000),Math.floor(Date.now()/86400000)-1])await d.collection('rate_limits').deleteOne({id:'form-email-d:'+createHash('sha256').update(dummyEmail+day).digest('hex')});}
 const clean=!await d.collection('users').findOne({email:dummyEmail})&&(!leadId||!await d.collection('forms').findOne({id:leadId}))&&(!imageKey||!await d.collection('media').findOne({key:imageKey}))&&(!backupRow||!await d.collection('backups').findOne({_id:backupRow._id}));if(!clean)throw Error('Test-record cleanup incomplete.');await source.close();
 }
 if(runDir){const resolved=path.resolve(runDir);if(!resolved.startsWith(base+path.sep)||path.dirname(resolved)!==path.join(base,'runs'))throw Error('Unsafe cleanup path.');await fs.rm(resolved,{recursive:true,force:true});}
 if(report){report.testRecordsAndTemporaryRestoreDataRemoved=true;await fs.writeFile('docs/local-restore-verification.json',JSON.stringify(report,null,2));process.stdout.write(JSON.stringify(report,null,2)+'\n');}
}
