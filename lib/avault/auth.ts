import {createHash,createHmac,randomBytes,scrypt,timingSafeEqual} from 'node:crypto';
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

const derive=(password:string,salt:Buffer,n:number,r:number,p:number)=>new Promise<Buffer>((resolve,reject)=>scrypt(password,salt,64,{N:n,r,p,maxmem:64*1024*1024},(e,key)=>e?reject(e):resolve(key)));
export async function hashPassword(password:string){const salt=randomBytes(16);const key=await derive(password,salt,16384,8,1);return `scrypt$16384$8$1$${salt.toString('base64')}$${key.toString('base64')}`}
export async function verifyPassword(password:string,stored:string){const [scheme,n,r,p,salt,hash]=String(stored||'').split('$');if(scheme!=='scrypt'||!salt||!hash)return false;const expected=Buffer.from(hash,'base64');const actual=await derive(password,Buffer.from(salt,'base64'),Number(n),Number(r),Number(p));return actual.length===expected.length&&timingSafeEqual(actual,expected)}
// Compared against when an email is unknown, so response time doesn't reveal which accounts exist.
const DUMMY_HASH='scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$'+Buffer.alloc(64).toString('base64');

function sessionKey(){const key=process.env.AVAULT_ENCRYPTION_KEY;if(!key||!/^[a-f0-9]{64}$/.test(key))throw new HttpError(503,'AVAULT_ENCRYPTION_KEY is not configured.');return createHmac('sha256',Buffer.from(key,'hex')).update('avault-session-v1').digest()}
const sign=(payload:string)=>createHmac('sha256',sessionKey()).update(payload).digest('base64url');
function cookieValue(req:Request){for(const part of (req.headers.get('cookie')||'').split(';')){const [k,...v]=part.trim().split('=');if(k===COOKIE)return v.join('=')}return ''}
function readSession(req:Request){const [payload,signature]=cookieValue(req).split('.');if(!payload||!signature)return null;const expected=Buffer.from(sign(payload)),actual=Buffer.from(signature);if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return null;try{const s=JSON.parse(Buffer.from(payload,'base64url').toString());return typeof s.e==='string'&&typeof s.v==='number'&&s.x>Date.now()/1000?s as {e:string;v:number;x:number}:null}catch{return null}}
const secure=()=>process.env.NODE_ENV==='production'?'; Secure':'';
export function sessionCookie(user:Pick<AdminUser,'email'|'session_version'>){const payload=Buffer.from(JSON.stringify({e:user.email,v:user.session_version,x:Math.floor(Date.now()/1000)+SESSION_SECONDS})).toString('base64url');return `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure()}`}
export const clearedCookie=()=>`${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure()}`;

export async function sessionUser(req:Request){const s=readSession(req);if(!s)return null;const user=await (await users()).findOne({email:s.e});if(!user||!user.active||user.session_version!==s.v)return null;return {email:user.email,role:user.role}}

async function bump(key:string,windowMs:number){const db=await mongoDb();const row=await db.collection('rate_limits').findOneAndUpdate({id:key,expires:{$gt:Date.now()}},{$inc:{count:1}},{returnDocument:'after'});if(row)return Number(row.count);await db.collection('rate_limits').updateOne({id:key},{$set:{count:1,expires:Date.now()+windowMs}},{upsert:true});return 1}
async function failures(key:string){const db=await mongoDb();const row=await db.collection('rate_limits').findOne({id:key,expires:{$gt:Date.now()}});return Number(row?.count||0)}
export async function login(req:Request,emailInput:unknown,passwordInput:unknown){
 const email=normalizeEmail(emailInput),password=String(passwordInput||'').slice(0,128);
 const ip=createHash('sha256').update(clientIp(req)).digest('hex').slice(0,32);const accountKey='login:'+ip+':'+email,ipKey='login-ip:'+ip;
 if(await failures(accountKey)>=5||await failures(ipKey)>=20)throw new HttpError(429,'Too many sign-in attempts. Try again in 15 minutes.');
 const collection=await users();const user=email?await collection.findOne({email}):null;
 const valid=await verifyPassword(password,user?.password_hash||DUMMY_HASH)&&!!user?.active;
 if(!valid||!user){await bump(accountKey,15*60000);await bump(ipKey,15*60000);await new Promise(r=>setTimeout(r,600));throw new HttpError(401,'Incorrect email or password.')}
 await (await mongoDb()).collection('rate_limits').deleteOne({id:accountKey});
 await collection.updateOne({email},{$set:{last_login_at:now()}});return user;
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
