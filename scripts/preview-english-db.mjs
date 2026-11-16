import fs from 'node:fs';
import {loadDevelopmentEnv} from './dev-env.mjs';
import {getMongoClient} from '../db/connection.js';
loadDevelopmentEnv();
const output=process.argv.find(v=>v.startsWith('--output='))?.slice(9)||'.avault-kit/english-review/database-before.json';
if(fs.existsSync(output))throw new Error('The snapshot already exists. Preserve it; do not replace it with a later database state.');
const client=await getMongoClient();
try{
 const db=client.db('avault_dev');
 const documents=await db.collection('documents').find({}).toArray();
 const settings=await db.collection('settings').find({}).toArray();
 const redirects=await db.collection('redirects').find({}).toArray();
 fs.mkdirSync('.avault-kit/english-review',{recursive:true});
 fs.writeFileSync(output,JSON.stringify({documents,settings,redirects},null,2));
 console.log(JSON.stringify({database:db.databaseName,documents:documents.length,unpublishedEdits:documents.filter(d=>d.draft!==d.published).map(d=>d.route),settings:settings.map(s=>s.id),redirects:redirects.length}));
}finally{await client.close()}
