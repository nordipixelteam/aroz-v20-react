// Offline/local recovery of the existing v2 encrypted backup contract. Never loads environment files.
import {createDecipheriv,createHash,timingSafeEqual} from 'node:crypto';
import {GridFSBucket} from 'mongodb';

export const V2_TABLES=['documents','settings','redirects','media','taxonomy','users','schedules','forms','revisions','activity'];
export function decodeBackup(sealed,key,checksum,expectedOrigin){
 if(!/^[a-f0-9]{64}$/.test(key||'')||!/^[a-f0-9]{64}$/.test(checksum||''))throw Error('A valid decryption key and expected checksum are required.');
 const parts=String(sealed).trim().split('.');
 if(parts.length!==2||!/^[a-f0-9]{24}$/.test(parts[0])||(parts[1].length<34||parts[1].length%2!==0||!/^[a-f0-9]+$/.test(parts[1])))throw Error('Invalid encrypted backup envelope.');
 let text;try{const data=Buffer.from(parts[1],'hex'),decipher=createDecipheriv('aes-256-gcm',Buffer.from(key,'hex'),Buffer.from(parts[0],'hex'));decipher.setAuthTag(data.subarray(-16));text=Buffer.concat([decipher.update(data.subarray(0,-16)),decipher.final()]).toString('utf8')}catch{throw Error('Backup authentication failed.');}
 const digest=createHash('sha256').update(text).digest();if(!timingSafeEqual(digest,Buffer.from(checksum,'hex')))throw Error('Backup checksum mismatch.');
 let snapshot;try{snapshot=JSON.parse(text)}catch{throw Error('Backup payload is invalid.');}
 if(snapshot.version!==2||snapshot.origin!==expectedOrigin)throw Error('Backup version or source origin does not match the selected source.');
 if(!snapshot.tables||Object.keys(snapshot.tables).length!==V2_TABLES.length||Object.keys(snapshot.tables).some(t=>!V2_TABLES.includes(t))||V2_TABLES.some(t=>!Array.isArray(snapshot.tables[t])||snapshot.tables[t].some(r=>!r||typeof r!=='object'||Array.isArray(r))))throw Error('Unexpected backup tables or records.');
 if(!Array.isArray(snapshot.mediaCopies)||snapshot.mediaCopies.some(m=>typeof m.original!=='string'||typeof m.backup!=='string'||!m.backup.startsWith('private-backups/media/')))throw Error('Invalid backup media manifest.');
 if(snapshot.tables.media.some(m=>!snapshot.mediaCopies.some(c=>c.original===m.key)))throw Error('Backup is missing a media copy.');
 return snapshot;
}

export function assertLocalRestoreTarget(client,name){
 if(!/^avault_restore_test_[a-z0-9_-]+$/.test(name))throw Error('Restore target must be a separate named restore-test database.');
 const hosts=client.options.hosts||[];
 if(client.options.srvHost||!hosts.length||hosts.some(h=>!['127.0.0.1','localhost','::1'].includes(h.host)))throw Error('This restore tool accepts loopback databases only.');
}
const withoutId=({_id,...row})=>{void _id;return row};
function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));return value}
export function sameRecords(a,b){return JSON.stringify(a.map(r=>JSON.stringify(canonical(withoutId(r)))).sort())===JSON.stringify(b.map(r=>JSON.stringify(canonical(withoutId(r)))).sort())}

export async function restoreSnapshot(database,snapshot,readMedia){
 assertLocalRestoreTarget(database.client,database.databaseName);
 if((await database.listCollections({},{nameOnly:true}).toArray()).length)throw Error('Restore target must be completely empty.');
 await database.collection('_restore_status').insertOne({complete:false,startedAt:new Date(),sourceOrigin:snapshot.origin});
 const counts={};
 for(const name of V2_TABLES){const rows=snapshot.tables[name].map(withoutId);if(rows.length)await database.collection(name).insertMany(rows);counts[name]=rows.length;}
 for(const [collection,key] of [['documents','route'],['users','email'],['settings','id'],['redirects','source'],['media','key'],['taxonomy','id'],['schedules','route']])await database.collection(collection).createIndex({[key]:1},{unique:true});
 const files=new GridFSBucket(database,{bucketName:'avault_files'});let mediaCount=0;
 for(const media of snapshot.tables.media){
  const copy=snapshot.mediaCopies.find(c=>c.original===media.key),object=await readMedia(copy.backup);
  if(!object)throw Error('A required backup media object is unavailable.');
  const stream=files.openUploadStream(media.key,{metadata:{contentType:object.mime||media.mime}});stream.end(object.bytes);await new Promise((resolve,reject)=>stream.once('finish',resolve).once('error',reject));
  const chunks=[];for await(const bytes of files.openDownloadStream(stream.id))chunks.push(bytes);
  if(!Buffer.concat(chunks).equals(object.bytes))throw Error('Restored media did not match its backup.');mediaCount++;
 }
 const verified={};for(const name of V2_TABLES){const rows=await database.collection(name).find({}).toArray();verified[name]={expected:counts[name],restored:rows.length,contentsMatch:sameRecords(snapshot.tables[name],rows)};if(!verified[name].contentsMatch)throw Error('Restored records did not match the backup.');}
 await database.collection('_restore_status').updateOne({complete:false},{$set:{complete:true,completedAt:new Date()}});
 return {tables:verified,mediaObjects:mediaCount};
}
