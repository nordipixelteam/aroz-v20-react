import {randomBytes,scrypt,timingSafeEqual} from 'node:crypto';

// OWASP's memory-constrained scrypt profile: 16 MiB per derivation, parallelization parameter p=5.
// Keep the original profile readable; upgrade only after successful verification.
const CURRENT='scrypt$16384$8$5';
const LEGACY='scrypt$16384$8$1';
const derive=(password,salt,p)=>new Promise((resolve,reject)=>scrypt(password,salt,64,{N:16384,r:8,p,maxmem:64*1024*1024},(error,key)=>error?reject(error):resolve(key)));
function parse(stored){
 const parts=String(stored||'').split('$');
 if(parts.length!==6||![CURRENT,LEGACY].includes(parts.slice(0,4).join('$')))return null;
 const salt=Buffer.from(parts[4],'base64'),hash=Buffer.from(parts[5],'base64');
 if(salt.length!==16||hash.length!==64)return null;
 return {salt,hash,p:Number(parts[3])};
}
export async function hashPassword(password){const salt=randomBytes(16),key=await derive(password,salt,5);return `${CURRENT}$${salt.toString('base64')}$${key.toString('base64')}`}
export async function verifyPassword(password,stored){const parsed=parse(stored);if(!parsed)return false;return timingSafeEqual(await derive(password,parsed.salt,parsed.p),parsed.hash)}
export function needsPasswordRehash(stored){return !!parse(stored)&&!String(stored).startsWith(CURRENT+'$')}
// Non-secret comparison target for unknown users, using the current cost.
export const DUMMY_PASSWORD_HASH=`${CURRENT}$${Buffer.alloc(16).toString('base64')}$${Buffer.alloc(64).toString('base64')}`;
