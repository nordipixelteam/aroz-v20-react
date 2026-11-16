// Create an AVAULT account or reset its password:  npm run admin:create -- you@example.com [owner|administrator]
// The password is asked for interactively (hidden), so it never lands in shell history.
import {hashPassword} from '../lib/avault/passwords.mjs';
import fs from 'node:fs';
import {getMongoClient} from '../db/connection.js';
import {hiddenPasswordSession} from './hidden-password.mjs';

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

const prompts=hiddenPasswordSession();
let password;
try{
 if(process.stdin.isTTY)await prompts.discardTypeahead();
 password=await prompts.ask('Password for '+email+': ');
 if(password.length<12||password.length>128)throw new Error('Use a password between 12 and 128 characters.');
 if(await prompts.ask('Repeat password: ')!==password)throw new Error('Passwords do not match.');
}catch(error){
 console.error(error.message);await client.close();process.exitCode=error.exitCode||1;
}finally{prompts.close()}
if(process.exitCode)process.exit(process.exitCode);

const hash=await hashPassword(password);
try{const db=client.db(process.env.MONGODB_DB||undefined);const stamp=new Date().toISOString();
 const result=await db.collection('users').updateOne({email},{$set:{role:roleArg,active:true,password_hash:hash,password_changed_at:stamp,updated_at:stamp},$inc:{session_version:1},$setOnInsert:{email,created_at:stamp}},{upsert:true});
 console.log(`${result.upsertedCount?'Created':'Updated'} ${roleArg} ${email} in database "${db.databaseName}". Sign in at /avault/login/`);
}finally{await client.close()}
