import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,scryptSync} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {assertDevelopmentDatabase} from '../db/environment.mjs';
import {hashPassword,verifyPassword,needsPasswordRehash} from '../lib/avault/passwords.mjs';

test('development guard rejects missing/wrong database without connecting',()=>{
 for(const database of [undefined,'','not-the-development-database'])assert.throws(()=>assertDevelopmentDatabase({NODE_ENV:'development',MONGODB_DB:database}),/Development requires MONGODB_DB=avault_dev/);
 assert.doesNotThrow(()=>assertDevelopmentDatabase({NODE_ENV:'development',MONGODB_DB:'avault_dev'}));
 assert.doesNotThrow(()=>assertDevelopmentDatabase({NODE_ENV:'production',MONGODB_DB:'deployment-configured-database'}));
});

test('next dev fails at startup with a wrong database before listening',()=>{
 const result=spawnSync(process.execPath,['node_modules/next/dist/bin/next','dev','--port','4197'],{env:{...process.env,NODE_ENV:'development',MONGODB_DB:'not-the-development-database'},encoding:'utf8',timeout:30000});
 assert.ok(result.status!==0&&/Development requires MONGODB_DB=avault_dev/.test(result.stdout+result.stderr),'Expected development startup guard; private diagnostics suppressed.');
});

test('production CSP forbids eval and inline scripts while retaining editor styles',()=>{
 const testModule={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/avault/dashboard-security.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:testModule,exports:testModule.exports});
 const production=testModule.exports.dashboardCsp('dummy-test-nonce',false),development=testModule.exports.dashboardCsp('dummy-test-nonce',true);
 assert.ok(production.includes("'nonce-dummy-test-nonce'")&&production.includes("'strict-dynamic'"));
 assert.ok(production.includes("frame-ancestors 'none'")&&production.includes("object-src 'none'"));
 assert.ok(!/script-src[^;]*'unsafe-inline'/.test(production)&&!production.includes('unsafe-eval')&&!production.includes('ws:'));
 assert.ok(production.includes("style-src 'self' https: 'unsafe-inline'"));
 assert.ok(development.includes('unsafe-eval')&&development.includes('ws:'));
});

test('current hashes use higher cost and preserve legacy verification',async()=>{
 const password=randomBytes(30).toString('base64url'),salt=randomBytes(16);
 const legacy='scrypt$16384$8$1$'+salt.toString('base64')+'$'+scryptSync(password,salt,64,{N:16384,r:8,p:1,maxmem:64*1024*1024}).toString('base64');
 const current=await hashPassword(password);
 assert.ok(current.startsWith('scrypt$16384$8$5$'));
 assert.ok(needsPasswordRehash(legacy)&&!needsPasswordRehash(current));
 assert.ok(await verifyPassword(password,legacy)&&await verifyPassword(password,current));
 assert.equal(await verifyPassword('a different dummy password',current),false);
 assert.equal(await verifyPassword(password,'scrypt$1073741824$8$1$invalid$invalid'),false);
 assert.equal(await verifyPassword(password,'scrypt$16384$8$5$bad$bad'),false);
 assert.ok(current!==await hashPassword(password),'Each new hash uses a fresh salt.');
});
