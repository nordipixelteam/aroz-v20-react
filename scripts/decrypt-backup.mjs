// Opens an AVAULT backup downloaded from AVAULT → Backups. Downloads stay encrypted (AES-256-GCM with the site's
// AVAULT_ENCRYPTION_KEY); this writes the decrypted JSON snapshot next to it, or to the path given.
//   npm run backup:decrypt -- avault-backup-2026-10-27-<id>.enc [out.json] [--checksum <sha256>]
// The checksum (shown as the X-Backup-Checksum download header, and stored in the backups collection) is optional;
// when given, the decrypted snapshot must match it.
import fs from 'node:fs';
import {createDecipheriv,createHash} from 'node:crypto';

for(const file of ['.env.local','.env'])if(fs.existsSync(file))for(const line of fs.readFileSync(file,'utf8').replace(/^﻿/,'').split(/\r?\n/)){
  const match=line.match(/^([A-Z0-9_]+)=(.*)$/);if(match&&!process.env[match[1]])process.env[match[1]]=match[2].replace(/^["']|["']$/g,'');
}
const args=process.argv.slice(2);const at=args.indexOf('--checksum');const checksum=at>=0?args.splice(at,2)[1]:'';
const [input,output=String(input||'').replace(/\.enc$/,'')+'.json']=args;
if(!input){console.error('Usage: npm run backup:decrypt -- <backup.enc> [out.json] [--checksum <sha256>]');process.exit(1)}
const key=process.env.AVAULT_ENCRYPTION_KEY||'';
if(!/^[a-f0-9]{64}$/.test(key)){console.error('AVAULT_ENCRYPTION_KEY (64 hex characters) is required: use the key of the site that made the backup.');process.exit(1)}

// Format written by seal() in lib/avault/runtime.ts: "<iv hex>.<ciphertext + 16-byte GCM tag, hex>".
const [iv,data]=fs.readFileSync(input,'utf8').trim().split('.');
if(!iv||!data){console.error('This is not an AVAULT backup file.');process.exit(1)}
const sealed=Buffer.from(data,'hex');
let text;
try{const decipher=createDecipheriv('aes-256-gcm',Buffer.from(key,'hex'),Buffer.from(iv,'hex'));decipher.setAuthTag(sealed.subarray(-16));text=Buffer.concat([decipher.update(sealed.subarray(0,-16)),decipher.final()]).toString('utf8')}
catch{console.error('Could not decrypt: wrong encryption key, or the file is damaged.');process.exit(1)}
const digest=createHash('sha256').update(text).digest('hex');
if(checksum&&checksum!==digest){console.error('Integrity check failed: the decrypted snapshot does not match the checksum.');process.exit(1)}
fs.writeFileSync(output,text,{mode:0o600});
const snapshot=JSON.parse(text);
console.log(`Decrypted backup from ${snapshot.createdAt} (${snapshot.origin}) to ${output}`);
for(const [table,rows] of Object.entries(snapshot.tables||{}))console.log(`  ${table.padEnd(12)} ${rows.length}`);
console.log('It contains leads and password hashes. Keep it private and delete it when you are done.');
