// Create an AVAULT account or reset its password:  npm run admin:create -- you@example.com [owner|administrator]
// The password is asked for interactively (hidden), so it never lands in shell history.
import {randomBytes,scrypt} from 'node:crypto';
import fs from 'node:fs';
import {getMongoClient} from '../db/connection.js';

const envFile='.env.development.local';
if(!fs.existsSync(envFile)){console.error('Create .env.development.local for the isolated development database first.');process.exit(1)}
delete process.env.MONGODB_URI;delete process.env.MONGODB_DB;
for(const line of fs.readFileSync(envFile,'utf8').replace(/^\uFEFF/,'').split(/\r?\n/)){const m=line.match(/^([A-Z0-9_]+)=(.*)$/);if(m)process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}
const [emailArg,roleArg='owner']=process.argv.slice(2);const email=String(emailArg||'').trim().toLowerCase();
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!['owner','administrator'].includes(roleArg)){console.error('Usage: npm run admin:create -- you@example.com [owner|administrator]');process.exit(1)}
if(!process.env.MONGODB_URI||process.env.MONGODB_URI.startsWith('<')){console.error('Set the development MONGODB_URI in .env.development.local.');process.exit(1)}
if(process.env.MONGODB_DB!=='avault_dev'){console.error('Refusing to create an owner outside the avault_dev database.');process.exit(1)}

// Connect first, so a network problem shows up before you type a password.
let client;
try{client=await getMongoClient()}catch(e){console.error(`Can't reach the development database (${e?.name||'connection error'}${Number.isInteger(e?.code)?`, code ${e.code}`:''}). Check its Atlas access rules.`);process.exit(1)}

let pending='';
// Text pasted together with this command (e.g. the next lines of a copied block) must not become the password.
async function discardTypeahead(){const input=process.stdin;input.setRawMode?.(true);input.setEncoding('utf8');const sink=()=>{};input.on('data',sink);input.resume();await new Promise(r=>setTimeout(r,300));input.off('data',sink);input.pause();input.setRawMode?.(false)}
function ask(question){return new Promise(resolve=>{const input=process.stdin;process.stdout.write(question);let value='';
 const take=()=>{while(pending){const char=pending[0];pending=pending.slice(1);if(char==='\u0003')process.exit(130);if(char==='\r'||char==='\n'){if(char==='\r'&&pending[0]==='\n')pending=pending.slice(1);input.setRawMode?.(false);input.pause();input.off('data',onData);process.stdout.write('\n');resolve(value);return}if(char==='\u007f'||char==='\b')value=value.slice(0,-1);else value+=char}};
 const onData=chunk=>{pending+=chunk;take()};input.setRawMode?.(true);input.setEncoding('utf8');input.on('data',onData);input.resume();take()})}
if(process.stdin.isTTY)await discardTypeahead();
const password=await ask('Password for '+email+': ');
if(password.length<12||password.length>128){console.error('Use a password between 12 and 128 characters.');await client.close();process.exit(1)}
if(await ask('Repeat password: ')!==password){console.error('Passwords do not match.');await client.close();process.exit(1)}

// Same format as lib/avault/auth.ts hashPassword().
const salt=randomBytes(16);const key=await new Promise((resolve,reject)=>scrypt(password,salt,64,{N:16384,r:8,p:1,maxmem:64*1024*1024},(e,k)=>e?reject(e):resolve(k)));
const hash=`scrypt$16384$8$1$${salt.toString('base64')}$${key.toString('base64')}`;
try{const db=client.db(process.env.MONGODB_DB||undefined);const stamp=new Date().toISOString();
 const result=await db.collection('users').updateOne({email},{$set:{role:roleArg,active:true,password_hash:hash,password_changed_at:stamp,updated_at:stamp},$inc:{session_version:1},$setOnInsert:{email,created_at:stamp}},{upsert:true});
 console.log(`${result.upsertedCount?'Created':'Updated'} ${roleArg} ${email} in database "${db.databaseName}". Sign in at /avault/login/`);
}finally{await client.close()}
