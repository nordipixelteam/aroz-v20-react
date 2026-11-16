import test from 'node:test';
import assert from 'node:assert/strict';
import {assertDatabaseEnvironment} from '../db/environment.mjs';

const staging={NODE_ENV:'production',VERCEL_ENV:'preview',AVAULT_ENV:'staging',MONGODB_DB:'avault_staging',MONGODB_URI:'mongodb+srv://dummy.invalid/',AVAULT_ENCRYPTION_KEY:'1'.repeat(64),NEXT_PUBLIC_SITE_URL:'https://dummy-staging.example.test',AVAULT_SCHEDULER:'off'};
test('staging production-mode build accepts only explicit isolated configuration',()=>assert.doesNotThrow(()=>assertDatabaseEnvironment(staging)));
test('staging rejects development, restore, other and missing database selections',()=>{
 for(const MONGODB_DB of ['avault_dev','avault_restore_test_dummy','another-database','',undefined])assert.throws(()=>assertDatabaseEnvironment({...staging,MONGODB_DB}),/Staging requires MONGODB_DB=avault_staging/);
});
test('preview cannot silently inherit production configuration',()=>assert.throws(()=>assertDatabaseEnvironment({...staging,AVAULT_ENV:undefined}),/explicit staging configuration/));
test('staging requires its own secret configuration and HTTPS origin',()=>{
 for(const patch of [{MONGODB_URI:''},{AVAULT_ENCRYPTION_KEY:''},{AVAULT_ENCRYPTION_KEY:'invalid'},{NEXT_PUBLIC_SITE_URL:'http://dummy-staging.example.test'},{NEXT_PUBLIC_SITE_URL:'https://dummy-staging.example.test/avault/'},{NEXT_PUBLIC_SITE_URL:'https://user:dummy@dummy-staging.example.test'},{AVAULT_SCHEDULER:'on'}])assert.throws(()=>assertDatabaseEnvironment({...staging,...patch}));
});
test('development isolation and existing non-preview production behavior remain intact',()=>{
 assert.doesNotThrow(()=>assertDatabaseEnvironment({NODE_ENV:'development',MONGODB_DB:'avault_dev'}));
 assert.throws(()=>assertDatabaseEnvironment({NODE_ENV:'development',MONGODB_DB:'avault_staging'}));
 assert.doesNotThrow(()=>assertDatabaseEnvironment({NODE_ENV:'production',VERCEL_ENV:'production'}));
});
