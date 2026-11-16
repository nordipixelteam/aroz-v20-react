import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

test('snapshot builder fails closed for Production deployments',()=>{
 const result=spawnSync(process.execPath,['scripts/build-client-preview.mjs'],{env:{...process.env,VERCEL:'1',VERCEL_ENV:'production'},encoding:'utf8'});
 assert.notEqual(result.status,0);assert.match(result.stderr,/Preview-only/);
});
test('all exported public pages match their manifest and contain no active backend client',()=>{
 const manifest=JSON.parse(fs.readFileSync('client-preview/manifest.json','utf8'));assert.equal(manifest.pages.length,37);
 for(const page of manifest.pages){assert.ok(!/^\/(?:api|avault)\//.test(page.route));const html=fs.readFileSync('client-preview/'+page.file,'utf8');assert.equal(createHash('sha256').update(html).digest('hex'),page.htmlDigest);assert.ok(!/src="[^"]*(?:avault-forms|avault-analytics)\.js/.test(html));assert.ok(html.includes('/_preview/read-only.js'));assert.ok(!/\snonce="/.test(html));}
});
test('read-only submit handler prevents backend submission and explains why',()=>{
 let handler,status,prevented=false,stopped=false;
 vm.runInNewContext(fs.readFileSync('dist-client-preview/_preview/read-only.js','utf8'),{document:{addEventListener:(event,fn,capture)=>{assert.equal(event,'submit');assert.equal(capture,true);handler=fn;},createElement:()=>({setAttribute(){},classList:{add(){}}})}});
 handler({preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true},target:{querySelector(){return null},append(n){status=n}}});
 assert.ok(prevented&&stopped);assert.match(status.textContent,/no enquiry was sent/);
});
test('private environment files and local audit evidence are ignored',()=>{
 for(const file of['.env.local','.env.development.local','.avault-kit/private-check.json','docs/screenshots/audit.png','dist-client-preview/index.html'])assert.equal(spawnSync('git',['check-ignore','--quiet',file]).status,0);
});
