// Disposable media/security integration checks. Only the isolated development database and local app.
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import fs from 'node:fs';
import {MongoClient,GridFSBucket} from 'mongodb';
import {loadDevelopmentEnv} from './dev-env.mjs';
import {hashPassword} from '../lib/avault/passwords.mjs';

loadDevelopmentEnv();
fs.mkdirSync('.avault-kit/security-audit',{recursive:true});
const origin=process.argv[2]||'http://127.0.0.1:3000';
if(!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))throw Error('Requires a local HTTP origin.');
const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});
const tag='public-media-check-'+randomUUID(),email=tag+'@example.com',password=randomBytes(30).toString('base64url');
let db,files,cookie='',ipKey='',passed=0;const baseline=await imageBaseline();const uploaded=[];
function check(ok,label){if(!ok){const error=Error(label);error.safe=true;throw error}console.log('PASS '+label);passed++}
async function request(path,options={}){return fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(30000),...options})}
function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let j=0;j<8;j++)crc=(crc>>>1)^(0xedb88320&-(crc&1))}return (crc^0xffffffff)>>>0}
function chunk(type,data){const name=Buffer.from(type),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([name,data])));return Buffer.concat([size,name,data,crc])}
async function imageBaseline(){
 const routes=fs.readdirSync('src/content').filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync('src/content/'+f)).path).map(p=>p==='index.html'?'/':'/'+p.replace(/index\.html$/,''));
 const assets=new Set();
 for(let i=0;i<routes.length;i+=5)await Promise.all(routes.slice(i,i+5).map(async route=>{const html=await (await request(route)).text();for(const m of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g))if(/^\/(assets|media)\//.test(m[1]))assets.add(m[1])}));
 const images=[];for(let i=0;i<[...assets].length;i+=6)await Promise.all([...assets].slice(i,i+6).map(async url=>{const r=await request(url);await r.arrayBuffer();images.push({url,status:r.status,type:r.headers.get('content-type')})}));
 return {routes:routes.length,images};
}
function dummyPng(){const header=Buffer.alloc(13);header.writeUInt32BE(2,0);header.writeUInt32BE(2,4);header[8]=8;header[9]=6;const pixels=Buffer.concat([Buffer.from([0]),randomBytes(8),Buffer.from([0]),randomBytes(8)]);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))])}
async function upload(bytes,name,type,authenticated=true){const form=new FormData();form.set('file',new Blob([bytes],{type}),name);form.set('alt','Disposable public website asset');return request('/api/admin/media/',{method:'POST',headers:{Origin:origin,...(authenticated?{Cookie:cookie}:{})},body:form})}
try{
 await client.connect();db=client.db(process.env.MONGODB_DB);if(db.databaseName!=='avault_dev')throw Error('Requires avault_dev.');files=new GridFSBucket(db,{bucketName:'avault_files'});
 await db.collection('users').insertOne({email,password_hash:await hashPassword(password),role:'administrator',active:true,session_version:1,created_at:new Date().toISOString(),updated_at:new Date().toISOString()});
 const login=await request('/api/admin/login/',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
 check(login.status===200,'dummy administrator signs in to the avault_dev application');cookie=login.headers.get('set-cookie').split(';')[0];await login.arrayBuffer();
 const who=await request('/api/admin/whoami/',{headers:{Cookie:cookie}}),location=await who.json();ipKey='login:'+createHash('sha256').update(location.ip).digest('hex').slice(0,32)+':'+email;
 const png=dummyPng();
 const denied=await upload(png,tag+'.png','image/png',false);await denied.arrayBuffer();check(denied.status===401,'signed-out users cannot upload media');
 for(const [bytes,name,type] of [[png,tag+'.png','image/png'],[Buffer.from('Harmless public website document '+tag),tag+'.txt','text/plain']]){
  const response=await upload(bytes,name,type),value=await response.json();if(value.url&&!value.duplicate)uploaded.push(value.url.slice(7));
  check(response.status===200&&value.url?.startsWith('/media/')&&!value.duplicate,'administrator uploads a disposable public '+(type.startsWith('image/')?'image':'document'));
  const download=await request(value.url),actual=Buffer.from(await download.arrayBuffer());
  check(download.status===200&&download.headers.get('content-type')===type&&actual.equals(bytes),'unused '+(type.startsWith('image/')?'image':'document')+' is readable without a session immediately after upload');
 }
 const repeated=await upload(png,tag+'.png','image/png'),duplicate=await repeated.json();check(repeated.status===200&&duplicate.duplicate===true&&uploaded.includes(duplicate.url.slice(7)),'duplicate public-image upload reuses its existing public URL');
 const privateKey='private-backups/'+tag+'.enc',stream=files.openUploadStream(privateKey,{metadata:{contentType:'application/octet-stream'}});stream.end(Buffer.from('Dummy private-storage sentinel, not a real backup.'));await new Promise((resolve,reject)=>stream.once('finish',resolve).once('error',reject));uploaded.push(privateKey);
 const privateGet=await request('/media/'+privateKey);await privateGet.arrayBuffer();check(privateGet.status===404,'public media route cannot expose a private backup object without a media record');
 for(const [headers,expected,label] of [[{},401,'signed-out visitor'],[{Cookie:cookie},403,'administrator']]){const r=await request('/api/admin/backup-download/?id='+tag,{headers});await r.arrayBuffer();check(r.status===expected,label+' cannot download owner-only backups');}
 const results=[];
 for(let i=0;i<baseline.images.length;i+=6)await Promise.all(baseline.images.slice(i,i+6).map(async image=>{const r=await request(image.url);await r.arrayBuffer();results.push({...image,afterStatus:r.status,afterType:r.headers.get('content-type')})}));
 check(results.filter(x=>x.status===200).every(x=>x.afterStatus===200&&x.afterType?.startsWith('image/')),'all previously working public website images still load');
 fs.writeFileSync('.avault-kit/security-audit/image-verification.json',JSON.stringify({routes:baseline.routes,images:results},null,2));
 console.log('Existing image baseline: '+results.filter(x=>x.status===200).length+' loaded, '+results.filter(x=>x.status!==200).length+' pre-existing missing URLs. No new failures.');
 const logout=await request('/api/admin/logout/',{method:'POST',headers:{Origin:origin,Cookie:cookie}});await logout.arrayBuffer();check(logout.status===200,'dummy browser session is logged out');
 console.log('PASS all '+passed+' public-media checks.');
}catch(error){console.error('FAIL '+(error.safe?error.message:'Local media verification failed; private diagnostics suppressed.'));process.exitCode=1}
finally{
 if(db){
  for(const key of uploaded){for(const file of await files.find({filename:key}).toArray())await files.delete(file._id);await db.collection('media').deleteMany({key});}
  if(cookie){const session=JSON.parse(Buffer.from(cookie.split('=')[1].split('.')[0],'base64url'));await db.collection('session_revocations').deleteOne({id:createHash('sha256').update(session.j).digest('hex')});}
  await db.collection('users').deleteOne({email});await db.collection('activity').deleteMany({actor:email});if(ipKey)await db.collection('rate_limits').deleteOne({id:ipKey});
  console.log('Removed disposable account, session, media records, storage objects and activity.');
 }await client.close();
}
