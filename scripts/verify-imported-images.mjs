import fs from 'node:fs';
import sharp from 'sharp';
import {IMPORTED_IMAGE_ALIASES} from '../lib/avault/imported-images.mjs';

const origin=process.argv[2]||'http://127.0.0.1:3000';
if(!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))throw Error('Only a local development origin is allowed.');
const input='.avault-kit/security-audit/image-verification.json';
const baseline=JSON.parse(fs.readFileSync(input,'utf8'));
const result={sourceReport:input,repaired:[],previouslyWorking:[],missingOriginals:[],pages:[]};
let failures=0;
async function checkImage(image){
 const target=IMPORTED_IMAGE_ALIASES[image.url];
 if(target&&!fs.existsSync('public'+target)){result.missingOriginals.push({url:image.url,expectedOriginal:target});failures++;return;}
 const initial=await fetch(origin+image.url,{redirect:'manual',signal:AbortSignal.timeout(30000)});await initial.arrayBuffer();
 const response=await fetch(origin+image.url,{signal:AbortSignal.timeout(30000)}),bytes=Buffer.from(await response.arrayBuffer());
 let decoded=false;try{const metadata=await sharp(bytes).metadata();decoded=metadata.width>0&&metadata.height>0}catch{}
 const row={url:image.url,target:target||image.url,initialStatus:initial.status,redirect:initial.headers.get('location'),status:response.status,mime:response.headers.get('content-type'),decoded,...(target?{matchesOriginal:bytes.equals(fs.readFileSync('public'+target))}:{})};
 row.pass=row.status===200&&row.mime?.startsWith('image/')&&decoded&&(!target||(row.initialStatus===308&&row.redirect===target&&row.matchesOriginal));
 if(!row.pass)failures++;
 (image.afterStatus===200?result.previouslyWorking:result.repaired).push(row);
}
for(let i=0;i<baseline.images.length;i+=6)await Promise.all(baseline.images.slice(i,i+6).map(checkImage));
const routes=fs.readdirSync('src/content').filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync('src/content/'+f)).path).map(p=>p==='index.html'?'/':'/'+p.replace(/index\.html$/,''));
for(let i=0;i<routes.length;i+=5)await Promise.all(routes.slice(i,i+5).map(async route=>{
 const response=await fetch(origin+route,{signal:AbortSignal.timeout(30000)}),html=await response.text();
 const remaining=[...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(m=>m[1]).filter(url=>Object.hasOwn(IMPORTED_IMAGE_ALIASES,url));
 const row={route,status:response.status,remainingBrokenAliases:remaining,pass:response.status===200&&!remaining.length};result.pages.push(row);if(!row.pass)failures++;
}));
fs.writeFileSync('.avault-kit/security-audit/image-repair-verification.json',JSON.stringify(result,null,2));
console.log('Repaired image URLs: '+result.repaired.filter(r=>r.pass).length+'/'+result.repaired.length);
console.log('Previously working images preserved: '+result.previouslyWorking.filter(r=>r.pass).length+'/'+result.previouslyWorking.length);
console.log('Public pages using repaired paths: '+result.pages.filter(r=>r.pass).length+'/'+result.pages.length);
console.log('Missing originals: '+result.missingOriginals.length+'; failed checks: '+failures);
if(failures)process.exitCode=1;
