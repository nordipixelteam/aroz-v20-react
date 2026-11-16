import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import type {WithId} from 'mongodb';
import {hashPassword,verifyPassword,needsPasswordRehash,DUMMY_PASSWORD_HASH} from './passwords.mjs';
export {hashPassword,verifyPassword} from './passwords.mjs';
import {mongoDb} from '@/db/mongo';
import {HttpError,clientIp,now} from './store';

// AVAULT accounts live in the MongoDB `users` collection. Passwords are scrypt hashes; sessions are
// HMAC-signed cookies that are re-checked against the database on every request, so deactivating a user
// or changing a password (which bumps session_version) signs them out everywhere.
export type AdminUser={email:string;role:'owner'|'administrator';active:boolean;password_hash:string;session_version:number;created_at:string;updated_at:string;last_login_at?:string;password_changed_at?:string};
export const COOKIE='avault_session';
const SESSION_SECONDS=4*60*60;
const ROLES=['owner','administrator'] as const;

export async function users(){const db=await mongoDb();return db.collection<AdminUser>('users')}
export const normalizeEmail=(value:unknown)=>String(value||'').trim().toLowerCase();
export function checkEmail(email:string){if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>250)throw new HttpError(422,'Enter a valid email address.');return email}
export function checkPassword(password:unknown){const s=String(password||'');if(s.length<12||s.length>128)throw new HttpError(422,'Use a password between 12 and 128 characters.');return s}
export function checkRole(role:unknown){if(!ROLES.includes(role as never))throw new HttpError(422,'Choose owner or administrator.');return role as AdminUser['role']}

function sessionKey(){const key=process.env.AVAULT_ENCRYPTION_KEY;if(!key||!/^[a-f0-9]{64}$/.test(key))throw new HttpError(503,'AVAULT_ENCRYPTION_KEY is not configured.');return createHmac('sha256',Buffer.from(key,'hex')).update('avault-session-v1').digest()}
const sign=(payload:string)=>createHmac('sha256',sessionKey()).update(payload).digest('base64url');
function cookieValue(req:Request){for(const part of (req.headers.get('cookie')||'').split(';')){const [k,...v]=part.trim().split('=');if(k===COOKIE)return v.join('=')}return ''}
function readSession(req:Request){const [payload,signature]=cookieValue(req).split('.');if(!payload||!signature)return null;const expected=Buffer.from(sign(payload)),actual=Buffer.from(signature);if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return null;try{const s=JSON.parse(Buffer.from(payload,'base64url').toString());return typeof s.e==='string'&&typeof s.a==='string'&&/^[a-f0-9]{24}$/.test(s.a)&&typeof s.j==='string'&&/^[a-f0-9]{64}$/.test(s.j)&&Number.isInteger(s.v)&&Number.isFinite(s.x)&&s.x>Date.now()/1000?s as {e:string;a:string;j:string;v:number;x:number}:null}catch{return null}}
const secure=()=>process.env.NODE_ENV==='production'?'; Secure':'';
export function sessionCookie(user:Pick<WithId<AdminUser>,'_id'|'email'|'session_version'>){const payload=Buffer.from(JSON.stringify({e:user.email,a:user._id.toHexString(),j:randomBytes(32).toString('hex'),v:user.session_version,x:Math.floor(Date.now()/1000)+SESSION_SECONDS})).toString('base64url');return `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure()}`}
export const clearedCookie=()=>`${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure()}`;

// Only a digest of the random session identifier is persisted; expired revocations have a TTL index.
const revocationId=(j:string)=>createHash('sha256').update(j).digest('hex');
export async function revokeSession(req:Request){const s=readSession(req);if(!s)return;await (await mongoDb()).collection('session_revocations').updateOne({id:revocationId(s.j)},{$set:{expires:new Date(s.x*1000)}},{upsert:true})}
export async function sessionUser(req:Request){const s=readSession(req);if(!s)return null;const db=await mongoDb();const user=await (await users()).findOne({email:s.e});if(!user||user._id.toHexString()!==s.a||!user.active||user.session_version!==s.v)return null;if(await db.collection('session_revocations').findOne({id:revocationId(s.j)}))return null;return {email:user.email,role:user.role}}

// Reserve before password verification. The unique ID index and pipeline make window reset + increment
// one atomic operation, including concurrent first attempts. In-flight attempts count toward the limit.
async function reserve(key:string){const collection=(await mongoDb()).collection('rate_limits'),time=Date.now();
 const expired={$lte:[{$ifNull:['$expires',0]},time]};
 const update=[{$set:{count:{$cond:[expired,1,{$add:[{$ifNull:['$count',0]},1]}]},expires:{$cond:[expired,time+15*60000,'$expires']}}}];
 let row;try{row=await collection.findOneAndUpdate({id:key},update,{upsert:true,returnDocument:'after'})}catch(e){if((e as {code?:number}).code!==11000)throw e;row=await collection.findOneAndUpdate({id:key},update,{returnDocument:'after'})}
 if(!row)throw new HttpError(503,'Sign-in is temporarily unavailable.');return {key,count:Number(row.count),expires:Number(row.expires)};
}
async function release(reservation:{key:string;expires:number}){await (await mongoDb()).collection('rate_limits').updateOne({id:reservation.key,expires:reservation.expires,count:{$gt:0}},{$inc:{count:-1}})}
export async function login(req:Request,emailInput:unknown,passwordInput:unknown){
 const email=normalizeEmail(emailInput),password=String(passwordInput||'').slice(0,128);
 const ip=createHash('sha256').update(clientIp(req)).digest('hex').slice(0,32);const accountKey='login:'+ip+':'+email,ipKey='login-ip:'+ip;
 const account=await reserve(accountKey);if(account.count>5)throw new HttpError(429,'Too many sign-in attempts. Try again in 15 minutes.');
 const address=await reserve(ipKey);if(address.count>20){await release(account);throw new HttpError(429,'Too many sign-in attempts. Try again in 15 minutes.')}
 const collection=await users();const user=email?await collection.findOne({email}):null;
 const valid=await verifyPassword(password,user?.password_hash||DUMMY_PASSWORD_HASH)&&!!user?.active;
 if(!valid||!user){await new Promise(r=>setTimeout(r,600));throw new HttpError(401,'Incorrect email or password.')}
 // Compare-and-set prevents a rehash from overwriting a simultaneous password change.
 if(needsPasswordRehash(user.password_hash)){
  const upgraded=await hashPassword(password);
  const result=await collection.updateOne({_id:user._id,password_hash:user.password_hash,session_version:user.session_version,active:true},{$set:{password_hash:upgraded,updated_at:now()}});
  if(!result.matchedCount){const latest=await collection.findOne({_id:user._id});if(!latest?.active||latest.session_version!==user.session_version||!await verifyPassword(password,latest.password_hash))throw new HttpError(401,'Incorrect email or password.')}
 }
 // Release only this successful attempt, never delete another concurrent attempt's failure.
 await Promise.all([release(account),release(address)]);
 await collection.updateOne({_id:user._id},{$set:{last_login_at:now()}});return user;
}

export async function activeOwners(){return (await users()).countDocuments({role:'owner',active:true})}
export async function listUsers(){return (await users()).find({},{projection:{_id:0,password_hash:0}}).sort({email:1}).limit(200).toArray()}
// Creates or updates an account. A new password or a change of role/active state invalidates existing sessions.
export async function saveUser(input:{email:unknown;role?:unknown;active?:unknown;password?:unknown},options:{allowCreate:boolean}){
 const email=checkEmail(normalizeEmail(input.email));const collection=await users();const current=await collection.findOne({email});
 if(!current&&!options.allowCreate)throw new HttpError(404,'Administrator not found.');
 const role=input.role===undefined?current?.role||'administrator':checkRole(input.role);const active=input.active===undefined?current?.active??true:!!input.active;
 if(!current&&!input.password)throw new HttpError(422,'Set a password for the new administrator.');
 if(current?.role==='owner'&&current.active&&(role!=='owner'||!active)&&await activeOwners()<=1)throw new HttpError(422,'Keep at least one active owner.');
 const set:Partial<AdminUser>={role,active,updated_at:now()};if(input.password){set.password_hash=await hashPassword(checkPassword(input.password));set.password_changed_at=now()}
 const invalidate=!!input.password||(current&&(current.role!==role||current.active!==active));
 await collection.updateOne({email},{$set:set,...(invalidate?{$inc:{session_version:1}}:{}),$setOnInsert:{email,created_at:now(),...(invalidate?{}:{session_version:0})}},{upsert:true});
 return email;
}
export async function deleteUser(emailInput:unknown){const email=normalizeEmail(emailInput);const collection=await users();const current=await collection.findOne({email});if(!current)throw new HttpError(404,'Administrator not found.');if(current.role==='owner'&&current.active&&await activeOwners()<=1)throw new HttpError(422,'Keep at least one active owner.');await collection.deleteOne({email});return email}
