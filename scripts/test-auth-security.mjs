// Local integration regressions. Requires the local dev server; never accepts a remote origin.
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {randomBytes,randomUUID,createHmac,createHash,scryptSync} from 'node:crypto';
import {MongoClient} from 'mongodb';
import ts from 'typescript';
import * as passwords from '../lib/avault/passwords.mjs';
import {loadDevelopmentEnv} from './dev-env.mjs';

loadDevelopmentEnv();
const origin=process.argv[2]||'http://127.0.0.1:3000';
if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin))throw Error('Only a local HTTP development origin is permitted.');
const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});
const require=createRequire(import.meta.url),tag='auth-regression-'+randomUUID();
const emails=['owner','admin','lifecycle','rate','legacy'].map(s=>`${tag}-${s}@example.com`);
const [ownerEmail,adminEmail,lifeEmail,rateEmail,legacyEmail]=emails,password=randomBytes(30).toString('base64url');
const route='/'+tag+'/',cookies=[],rateKeys=new Set();let db,passed=0,httpRateBefore,httpRateAfter,httpRateIpKey;
class HttpError extends Error{constructor(status,message){super(message);this.status=status}}
function check(ok,label){if(!ok){const error=Error(label);error.safeLabel=true;throw error;}passed++;console.log('PASS '+label)}
function load(file,imports){const testModule={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{module:testModule,exports:testModule.exports,require:n=>Object.hasOwn(imports,n)?imports[n]:require(n),process,Buffer,Date,Request,setTimeout},{filename:file});return testModule.exports}
async function http(action,{cookie,body}={}){const response=await fetch(origin+'/api/admin/'+action,{method:body?'POST':'GET',headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'manual',signal:AbortSignal.timeout(45000)});let value;try{value=await response.json()}catch{}return {status:response.status,value,cookie:response.headers.get('set-cookie')}}
const status=async promise=>{try{await promise;return 200}catch(e){if(e instanceof HttpError)return e.status;throw Error('Local auth function failed; private diagnostics suppressed.')}};
function remember(cookie){cookies.push(cookie);return cookie.split(';')[0]}
function request(cookie){return new Request(origin,{headers:{Cookie:cookie}})}

try{
 await client.connect();db=client.db(process.env.MONGODB_DB);if(db.databaseName!=='avault_dev')throw Error('Requires avault_dev.');
 await db.collection('rate_limits').createIndex({id:1},{unique:true});
 const auth=load('lib/avault/auth.ts',{'./passwords.mjs':passwords,'@/db/mongo':{mongoDb:async()=>db},'./store':{HttpError,now:()=>new Date().toISOString(),clientIp:r=>r.headers.get('x-test-ip')}});
 for(const email of emails)await auth.saveUser({email,password,role:email===ownerEmail?'owner':'administrator'},{allowCreate:true});
 const cookieFor=async email=>remember(auth.sessionCookie(await db.collection('users').findOne({email})));
 const owner=await cookieFor(ownerEmail),admin=await cookieFor(adminEmail);
 const signedIn=await http('login/',{body:{email:adminEmail,password}});
 check(signedIn.status===200&&!!signedIn.cookie,'normal HTTP password login issues a new session');
 const signedInCookie=remember(signedIn.cookie);
 check((await http('session/',{cookie:signedInCookie})).status===200,'HTTP-issued session authenticates');
 const signedOut=await http('logout/',{cookie:signedInCookie,body:{}});
 check(signedOut.status===200&&(await http('session/',{cookie:signedInCookie})).status===401,'HTTP-issued session cannot be replayed after logout');
 const location=await http('whoami/',{cookie:admin});
 if(location.status!==200||typeof location.value?.ip!=='string')throw Error('Local IP check unavailable.');
 const httpIpHash=createHash('sha256').update(location.value.ip).digest('hex').slice(0,32);
 httpRateIpKey='login-ip:'+httpIpHash;httpRateBefore=await db.collection('rate_limits').findOne({id:httpRateIpKey});rateKeys.add('login:'+httpIpHash+':'+legacyEmail);
 const oldSalt=randomBytes(16),oldHash='scrypt$16384$8$1$'+oldSalt.toString('base64')+'$'+scryptSync(password,oldSalt,64,{N:16384,r:8,p:1,maxmem:64*1024*1024}).toString('base64');
 await db.collection('users').updateOne({email:legacyEmail},{$set:{password_hash:oldHash}});
 const legacyExistingSession=await cookieFor(legacyEmail),legacyBefore=await db.collection('users').findOne({email:legacyEmail});
 check((await http('login/',{body:{email:legacyEmail,password:'incorrect dummy password'}})).status===401,'wrong password for legacy account is denied');
 httpRateAfter=await db.collection('rate_limits').findOne({id:httpRateIpKey});
 check((await db.collection('users').findOne({email:legacyEmail})).password_hash===oldHash,'failed sign-in does not rehash a legacy account');
 const legacyLogin=await http('login/',{body:{email:legacyEmail,password}});if(legacyLogin.cookie)remember(legacyLogin.cookie);
 const upgraded=await db.collection('users').findOne({email:legacyEmail});
 check(legacyLogin.status===200&&!passwords.needsPasswordRehash(upgraded.password_hash)&&await passwords.verifyPassword(password,upgraded.password_hash),'existing password signs in and transparently receives a stronger hash');
 check(upgraded.session_version===legacyBefore.session_version&&(await http('session/',{cookie:legacyExistingSession})).status===200,'rehashing preserves password and existing session validity');
 const again=await http('login/',{body:{email:legacyEmail,password}});if(again.cookie)remember(again.cookie);
 check(again.status===200&&(await db.collection('users').findOne({email:legacyEmail})).password_hash===upgraded.password_hash,'upgraded account signs in again without unnecessary rehashing');
 await db.collection('users').updateOne({email:legacyEmail},{$set:{password_hash:oldHash}});
 const concurrentUpgrades=await Promise.all([http('login/',{body:{email:legacyEmail,password}}),http('login/',{body:{email:legacyEmail,password}})]);
 for(const result of concurrentUpgrades)if(result.cookie)remember(result.cookie);
 check(concurrentUpgrades.every(r=>r.status===200)&&!passwords.needsPasswordRehash((await db.collection('users').findOne({email:legacyEmail})).password_hash),'concurrent legacy sign-ins safely converge on a stronger hash');
 await db.collection('users').updateOne({email:legacyEmail},{$set:{password_hash:oldHash}});
 const replacementPassword=randomBytes(30).toString('base64url'),raceIp=tag+'-rehash-race',raceHash=createHash('sha256').update(raceIp).digest('hex').slice(0,32);
 rateKeys.add('login:'+raceHash+':'+legacyEmail);rateKeys.add('login-ip:'+raceHash);
 const racingAuth=load('lib/avault/auth.ts',{'./passwords.mjs':{...passwords,hashPassword:async value=>{await db.collection('users').updateOne({email:legacyEmail},{$set:{password_hash:await passwords.hashPassword(replacementPassword)},$inc:{session_version:1}});return passwords.hashPassword(value)}},'@/db/mongo':{mongoDb:async()=>db},'./store':{HttpError,now:()=>new Date().toISOString(),clientIp:()=>raceIp}});
 const raced=await status(racingAuth.login(new Request(origin),legacyEmail,password));
 const raceAccount=await db.collection('users').findOne({email:legacyEmail});
 check(raced===401&&await passwords.verifyPassword(replacementPassword,raceAccount.password_hash)&&!await passwords.verifyPassword(password,raceAccount.password_hash),'rehash cannot overwrite a simultaneous password change or issue a stale sign-in');
 const dashboard=await fetch(origin+'/avault/',{headers:{Cookie:admin},redirect:'manual'}),html=await dashboard.text(),policy=dashboard.headers.get('content-security-policy')||'';
 const nonce=policy.match(/'nonce-([^']+)'/)?.[1];
 check(dashboard.status===200&&!!nonce&&policy.includes("frame-ancestors 'none'")&&dashboard.headers.get('x-frame-options')==='DENY','authenticated dashboard sends CSP and anti-framing headers');
 check(policy.includes("'strict-dynamic'")&&!/script-src[^;]*'unsafe-inline'/.test(policy),'dashboard script policy requires nonces instead of unsafe-inline');
 const scripts=[...html.matchAll(/<script\b[^>]*>/g)].map(m=>m[0]);
 check(scripts.length>0&&scripts.every(tag=>tag.includes('nonce="'+nonce+'"')),'framework and custom dashboard scripts receive the response nonce');
 const second=await fetch(origin+'/avault/',{headers:{Cookie:admin}});await second.text();
 check(second.headers.get('content-security-policy')!==policy,'dashboard nonce changes on every request');
 const publicLogin=await fetch(origin+'/avault/login/');await publicLogin.text();
 check(publicLogin.headers.get('x-frame-options')==='DENY'&&publicLogin.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"),'sign-in page also receives security headers');
 check((await http('session/',{cookie:admin})).status===200,'local server authenticates an avault_dev-only dummy account');
 const legacyPayload=Buffer.from(JSON.stringify({e:adminEmail,v:1,x:Math.floor(Date.now()/1000)+600})).toString('base64url');
 const key=createHmac('sha256',Buffer.from(process.env.AVAULT_ENCRYPTION_KEY,'hex')).update('avault-session-v1').digest();
 const legacy='avault_session='+legacyPayload+'.'+createHmac('sha256',key).update(legacyPayload).digest('base64url');
 check((await http('session/',{cookie:legacy})).status===401,'signed legacy cookie without immutable account ID is rejected');
 let life=await cookieFor(lifeEmail);await auth.deleteUser(lifeEmail);await auth.saveUser({email:lifeEmail,password,role:'administrator'},{allowCreate:true});
 check((await http('session/',{cookie:life})).status===401,'deleted and recreated email cannot reuse an old session');
 life=await cookieFor(lifeEmail);const other=await cookieFor(lifeEmail);
 const logout=await http('logout/',{cookie:life,body:{}});
 check(logout.status===200&&logout.cookie?.includes('Max-Age=0'),'logout clears browser cookie');
 check((await http('session/',{cookie:life})).status===401,'logged-out session is revoked on the server');
 check((await http('session/',{cookie:other})).status===200,'logout preserves a separate session for the same user');
 check((await http('logout/',{cookie:life,body:{}})).status===200,'repeated logout is idempotent');
 const passwordChange=await http('password/',{cookie:other,body:{current:password,password:randomBytes(30).toString('base64url')}});
 check(passwordChange.status===200&&(await http('session/',{cookie:other})).status===401,'normal password change invalidates existing sessions');
 life=await cookieFor(lifeEmail);await auth.saveUser({email:lifeEmail,role:'owner'},{allowCreate:false});
 check((await http('session/',{cookie:life})).status===401,'role changes invalidate existing sessions');
 life=await cookieFor(lifeEmail);await auth.saveUser({email:lifeEmail,active:false},{allowCreate:false});
 check((await http('session/',{cookie:life})).status===401,'deactivation invalidates existing sessions');
 check((await http('users/',{cookie:admin,body:{email:lifeEmail,active:true}})).status===403,'administrator cannot manage users');

 const home=await http('document/?route=%2F',{cookie:admin});check(home.status===200,'administrator can read the page template');
 const created=await http('create/',{cookie:admin,body:{route,title:'Private authentication regression',templateRoute:'/'}});
 check(created.status===200,'administrator can create a disposable unpublished draft');
 let document=created.value;const ordinary=document.fields.find(f=>!['navigation','footer'].includes(f.group)&&f.kind!=='url');
 if(!ordinary)throw Error('Template lacks a permitted field.');ordinary.value+=' Regression';
 let saved=await http('save/',{cookie:admin,body:{document,expectedRevision:document.revision}});
 check(saved.status===200,'administrator can save permitted page content');document=saved.value;
 for(const group of ['navigation','footer']){
  const next=structuredClone(document),field=next.fields.find(f=>f.group===group&&f.kind!=='url');if(!field)throw Object.assign(Error('Template lacks protected '+group+' fields.'),{safeLabel:true});field.value+=' Regression';
  check((await http('save/',{cookie:admin,body:{document:next,expectedRevision:document.revision}})).status===403,'administrator cannot change '+group+' through general save');
  for(const action of ['publish/','unpublish/'])check((await http(action,{cookie:admin,body:{document:next,expectedRevision:document.revision}})).status===403,'administrator cannot change '+group+' through '+action.slice(0,-1));
  // Client-supplied metadata must not disguise protected fields.
  field.group='content';check((await http('save/',{cookie:admin,body:{document:next,expectedRevision:document.revision}})).status===403,'spoofed '+group+' group cannot bypass general save');
  saved=await http('save/',{cookie:owner,body:{document:next,expectedRevision:document.revision}});
  check(saved.status===200,'owner can change '+group+' in a disposable draft');document=saved.value;
 }
 check((await http('navigation/',{cookie:admin,body:{navigation:{},revision:0}})).status===403,'navigation endpoint remains owner-only');
 const revisions=await http('revisions/?route='+encodeURIComponent(route),{cookie:owner});const first=revisions.value?.find(r=>r.state==='applied');
 check(!!first,'disposable revision exists for restore check');
 check((await http('revision-restore/',{cookie:admin,body:{id:first.id,route,expectedRevision:document.revision}})).status===403,'revision restore cannot bypass shared-field permissions');

 async function burst(label,expired){
  const ip=tag+'-'+label,ipHash=createHash('sha256').update(ip).digest('hex').slice(0,32),accountKey='login:'+ipHash+':'+rateEmail,ipKey='login-ip:'+ipHash;
  rateKeys.add(accountKey);rateKeys.add(ipKey);
  if(expired)await db.collection('rate_limits').insertOne({id:accountKey,count:99,expires:Date.now()-1});
  const req=new Request(origin,{headers:{'x-test-ip':ip}});
  const results=await Promise.all(Array.from({length:6},()=>status(auth.login(req,rateEmail,'dummy incorrect password'))));
  check(results.filter(s=>s===401).length===5&&results.filter(s=>s===429).length===1,'six concurrent attempts enforce five-attempt limit ('+label+')');
  check(await status(auth.login(req,rateEmail,password))===429,'correct password does not bypass exhausted limit ('+label+')');
 }
 await burst('new-window',false);await burst('expired-window',true);
 const ip=tag+'-ip-limit',ipHash=createHash('sha256').update(ip).digest('hex').slice(0,32);rateKeys.add('login-ip:'+ipHash);
 const req=new Request(origin,{headers:{'x-test-ip':ip}});
 const results=await Promise.all(Array.from({length:21},(_,i)=>{const email=tag+'-unknown-'+i+'@example.com';rateKeys.add('login:'+ipHash+':'+email);return status(auth.login(req,email,'dummy incorrect password'))}));
 check(results.filter(s=>s===401).length===20&&results.filter(s=>s===429).length===1,'concurrent attempts across accounts enforce twenty-attempt IP limit');
 const mixedIp=tag+'-mixed',mixedHash=createHash('sha256').update(mixedIp).digest('hex').slice(0,32),mixedKey='login:'+mixedHash+':'+rateEmail;rateKeys.add(mixedKey);rateKeys.add('login-ip:'+mixedHash);
 const mixedReq=new Request(origin,{headers:{'x-test-ip':mixedIp}});
 await Promise.all([status(auth.login(mixedReq,rateEmail,password)),...Array.from({length:4},()=>status(auth.login(mixedReq,rateEmail,'dummy incorrect password')))]);
 check((await db.collection('rate_limits').findOne({id:mixedKey}))?.count===4,'successful concurrent login does not erase other attempts failures');
 console.log('PASS all '+passed+' security regressions (avault_dev only).');
}catch(e){console.error('FAIL '+(e.safeLabel?e.message:e instanceof HttpError?'local application check failed':String(e.message).startsWith('Local auth')?e.message:'security regression did not complete; private diagnostics suppressed.'));process.exitCode=1}
finally{
 if(db){
  const ids=cookies.map(c=>{const s=JSON.parse(Buffer.from(c.split('=')[1].split('.')[0],'base64url').toString());return createHash('sha256').update(s.j).digest('hex')});
  await db.collection('session_revocations').deleteMany({id:{$in:ids}});
  await db.collection('users').deleteMany({email:{$in:emails}});
  await db.collection('rate_limits').deleteMany({id:{$in:[...rateKeys]}});
  // Restore the one shared IP failure only if no other request changed its counter in the meantime.
  if(httpRateAfter){const unchanged={_id:httpRateAfter._id,count:httpRateAfter.count,expires:httpRateAfter.expires};if(httpRateBefore)await db.collection('rate_limits').updateOne(unchanged,{$set:{count:httpRateBefore.count,expires:httpRateBefore.expires}});else await db.collection('rate_limits').deleteOne(unchanged);}
  await db.collection('documents').deleteOne({route});
  await db.collection('revisions').deleteMany({document_id:route});
  await db.collection('activity').deleteMany({actor:{$in:emails}});
  console.log('Removed disposable accounts, sessions, rate counters, draft and audit activity.');
 }await client.close();
}
