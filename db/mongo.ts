import {GridFSBucket, type ClientSession, type Db, type Document, type Filter, type MongoClient} from 'mongodb';
import {getMongoClient} from './connection.js';

type QueryResult<T=Record<string, unknown>>={results:T[];success:true;meta:{changes:number}};
type RunResult={success:true;meta:{changes:number}};

const globalMongo=globalThis as typeof globalThis & {
  __allureMongo?:Promise<{client:MongoClient;db:Db;files:GridFSBucket}>;
  // false once the server has said it can't run transactions (a standalone mongod), so batches stop trying.
  __allureMongoTransactions?:boolean;
};

function connection(){
  if(!globalMongo.__allureMongo){
    globalMongo.__allureMongo=(async()=>{
      const client=await getMongoClient();
      const database=process.env.MONGODB_DB;
      if(!database)throw new Error('MONGODB_DB is required; refusing to choose a database implicitly.');
      const db=client.db(database);
      await Promise.all([
        db.collection('documents').createIndex({route:1},{unique:true}),
        db.collection('settings').createIndex({id:1},{unique:true}),
        db.collection('redirects').createIndex({source:1},{unique:true}),
        db.collection('media').createIndex({key:1},{unique:true}),
        db.collection('users').createIndex({email:1},{unique:true}),
        db.collection('rate_limits').createIndex({id:1},{unique:true}),
        db.collection('schedules').createIndex({route:1},{unique:true}),
        db.collection('taxonomy').createIndex({id:1},{unique:true}),
      ]);
      return {client,db,files:new GridFSBucket(db,{bucketName:'avault_files'})};
    })();
  }
  return globalMongo.__allureMongo;
}

function clean<T extends Document>(row:T|null):T|null{
  if(!row)return null;
  const {_id,...value}=row;
  void _id;
  return value as T;
}

function normalize(sql:string){return sql.replace(/\s+/g,' ').trim()}

function splitCsv(value:string){
  const out:string[]=[];let current='',depth=0,quote='';
  for(const char of value){
    if(quote){current+=char;if(char===quote)quote='';continue}
    if(char==="'"||char==='"'){quote=char;current+=char;continue}
    if(char==='(')depth++;else if(char===')')depth--;
    if(char===','&&depth===0){out.push(current.trim());current='';}else current+=char;
  }
  if(current.trim())out.push(current.trim());return out;
}

function literal(token:string,args:unknown[],cursor:{value:number}){
  token=token.trim();
  if(token==='?')return args[cursor.value++];
  if(/^null$/i.test(token))return null;
  if(/^\d+$/.test(token))return Number(token);
  const quoted=token.match(/^'([\s\S]*)'$/);if(quoted)return quoted[1].replace(/''/g,"'");
  return token;
}

function whereFilter(where:string|undefined,args:unknown[],cursor:{value:number}):Filter<Document>{
  if(!where)return {};
  const filter:Record<string,unknown>={};
  for(const raw of where.split(/\s+AND\s+/i)){
    const part=raw.trim().replace(/^\(|\)$/g,'');
    let match=part.match(/^(\w+)\s*=\s*(\?|\d+|'[^']*')$/i);
    if(match){filter[match[1]]=literal(match[2],args,cursor);continue}
    match=part.match(/^(\w+)\s*(<=|<|>=|>)\s*(\?)$/i);
    if(match){const op:{[key:string]:string}={'<':'$lt','<=':'$lte','>':'$gt','>=':'$gte'};filter[match[1]]={[op[match[2]]]:literal(match[3],args,cursor)};continue}
    match=part.match(/^(\w+)\s+NOT IN\s*\(([^)]+)\)$/i);
    if(match){filter[match[1]]={$nin:splitCsv(match[2]).map(v=>literal(v,args,cursor))};continue}
    throw new Error('Unsupported Mongo query condition: '+part);
  }
  return filter;
}

// The collections whose plain INSERTs must not collide with an existing row, and the field that identifies a row.
const NATURAL_KEYS:Record<string,string>={documents:'route',redirects:'source',users:'email',schedules:'route',settings:'id',rate_limits:'id',taxonomy:'id'};

function parseInsert(sql:string,args:unknown[],cursor:{value:number}){
  const insert=sql.match(/^INSERT( OR IGNORE)? INTO (\w+)\s*\(([^)]+)\) VALUES\s*\((.*?)\)(.*)$/i);
  if(!insert)return null;
  const [,ignore,table,fieldList,valueList,tail]=insert;const fields=splitCsv(fieldList);const tokens=splitCsv(valueList);const doc:Record<string,unknown>={};
  fields.forEach((field,index)=>doc[field.trim()]=literal(tokens[index],args,cursor));
  return {ignore:!!ignore,table,doc,tail,naturalKey:NATURAL_KEYS[table]||null};
}

export class MongoPreparedStatement{
  private args:unknown[]=[];
  constructor(private sql:string){}
  bind(...args:unknown[]){this.args=args;return this}
  async first<T=Record<string,unknown>>():Promise<T|null>{
    const result=await this.execute('first',0);
    return (result.rows[0]||null) as T|null;
  }
  async all<T=Record<string,unknown>>():Promise<QueryResult<T>>{
    const result=await this.execute('all',0);
    return {results:result.rows as T[],success:true,meta:{changes:result.changes}};
  }
  async run():Promise<RunResult>{const result=await this.execute('run',0);return {success:true,meta:{changes:result.changes}}}

  // Runs before any statement of a batch is applied: a stale revision or a taken key fails the whole batch up front.
  async precheck(){
    const {db}=await connection();const sql=normalize(this.sql);
    if(/^INSERT INTO write_guards/i.test(sql))return this.guard(db);
    if(!/^INSERT INTO/i.test(sql)||/ON CONFLICT/i.test(sql))return;
    const insert=parseInsert(sql,this.args,{value:0});
    if(insert?.naturalKey&&await db.collection(insert.table).findOne({[insert.naturalKey]:insert.doc[insert.naturalKey]},{projection:{_id:1}}))throw new Error(`UNIQUE constraint failed: ${insert.table}.${insert.naturalKey}`);
  }

  private async guard(db:Db,session?:ClientSession){
    const [,target,expected]=this.args;const table=normalize(this.sql).includes('FROM documents')?'documents':'settings';const key=table==='documents'?'route':'id';
    const row=await db.collection(table).findOne({[key]:target},session?{session}:{});
    if(Number(row?.revision||0)!==Number(expected))throw new Error('valid_write');
  }

  async execute(mode:'first'|'all'|'run',lastChanges:number,session?:ClientSession):Promise<{rows:Record<string,unknown>[];changes:number}>{
    const {db}=await connection();const sql=normalize(this.sql);const cursor={value:0};const o=session?{session}:{};
    if(/^SELECT 1$/i.test(sql))return {rows:[{'1':1}],changes:0};

    if(/^SELECT session,MAX\(created_at\) AS last_seen FROM events/i.test(sql)){
      const after=this.args[0];
      const rows=await db.collection('events').aggregate([
        {$match:{created_at:{$gt:after}}},{$group:{_id:'$session',last_seen:{$max:'$created_at'}}},
        {$sort:{last_seen:-1}},{$limit:100},{$project:{_id:0,session:'$_id',last_seen:1}},
      ],o).toArray();return {rows,changes:0};
    }

    const count=sql.match(/^SELECT COUNT\(\*\) AS (\w+) FROM (\w+)$/i);
    if(count){const n=await db.collection(count[2]).countDocuments({},o);return {rows:[{[count[1]]:n}],changes:0}}

    const checksum=sql.match(/^SELECT key FROM media WHERE json_extract\(metadata,'\$\.checksum'\)=\?$/i);
    if(checksum){const rows=await db.collection('media').find({},o).project({_id:0,key:1,metadata:1}).toArray();const row=rows.find(r=>{try{return JSON.parse(String(r.metadata)).checksum===this.args[0]}catch{return false}});return {rows:row?[{key:row.key}]:[],changes:0}}

    const select=sql.match(/^SELECT (.+?) FROM (\w+)(?: WHERE (.*?))?(?: ORDER BY (.*?))?(?: LIMIT (\d+))?(?: OFFSET \?)?$/i);
    if(select){
      const [,fields,table,where,order,limit]=select;const filter=whereFilter(where,this.args,cursor);
      let find=db.collection(table).find(filter,o);
      if(fields!=='*'){const projection:Record<string,1>={};for(const field of splitCsv(fields))projection[field.trim()]=1;find=find.project({_id:0,...projection})}else find=find.project({_id:0});
      if(order){const sort:Record<string,1|-1>={};for(const item of splitCsv(order)){const [field,direction]=item.trim().split(/\s+/);sort[field]=direction?.toUpperCase()==='DESC'?-1:1}find=find.sort(sort)}
      if(limit)find=find.limit(Number(limit));
      if(/ OFFSET \?$/i.test(sql))find=find.skip(Number(this.args[cursor.value++]||0));
      const rows=await find.toArray();return {rows:rows as Record<string,unknown>[],changes:0};
    }

    const del=sql.match(/^DELETE FROM (\w+)(?: WHERE (.+))?$/i);
    if(del){const result=await db.collection(del[1]).deleteMany(whereFilter(del[2],this.args,cursor),o);return {rows:[],changes:result.deletedCount}}

    if(/^INSERT INTO write_guards/i.test(sql)){await this.guard(db,session);return {rows:[],changes:1}}

    if(/^UPDATE revisions SET state=CASE WHEN changes\(\)=1/i.test(sql)){
      const result=await db.collection('revisions').updateOne({id:this.args[0]},{$set:{state:lastChanges===1?'applied':'conflict'}},o);return {rows:[],changes:result.modifiedCount};
    }

    if(/^INSERT INTO activity .* WHERE EXISTS/i.test(sql)){
      const [id,actor,action,entity,createdAt,revisionId]=this.args;
      const revision=await db.collection('revisions').findOne({id:revisionId,state:'applied'},o);
      if(!revision)return {rows:[],changes:0};
      await db.collection('activity').insertOne({id,actor,action,entity,created_at:createdAt},o);return {rows:[],changes:1};
    }

    const maintenance=sql.match(/^INSERT INTO rate_limits\(id,count,expires\) VALUES \('maintenance-lock',1,\?\).*RETURNING id$/i);
    if(maintenance){const [expires,staleBefore]=this.args;const result=await db.collection('rate_limits').findOneAndUpdate({id:'maintenance-lock',$or:[{expires:{$lt:staleBefore}},{expires:{$exists:false}}]},{$set:{count:1,expires}},{upsert:true,returnDocument:'after',...o}).catch(()=>null);return {rows:result?[clean(result)!]:[],changes:result?1:0}}

    if(/^INSERT INTO rate_limits/i.test(sql)&&/count=count\+1 RETURNING count/i.test(sql)){
      const [id,expires]=this.args;const row=await db.collection('rate_limits').findOneAndUpdate({id},{$set:{expires},$inc:{count:1}},{upsert:true,returnDocument:'after',...o});return {rows:row?[clean(row)!]:[],changes:1};
    }

    const insert=parseInsert(sql,this.args,cursor);
    if(insert){
      const {ignore,table,doc,tail,naturalKey}=insert;
      const collection=db.collection(table);let changes=1;let row:Document|null=null;
      if(/ON CONFLICT/i.test(tail)&&naturalKey){
        const keyValue=doc[naturalKey];const set={...doc};delete set[naturalKey];
        row=await collection.findOneAndUpdate({[naturalKey]:keyValue},{$set:set,$setOnInsert:{[naturalKey]:keyValue}},{upsert:true,returnDocument:'after',...o});
      }else if(ignore&&naturalKey){const result=await collection.updateOne({[naturalKey]:doc[naturalKey]},{$setOnInsert:doc},{upsert:true,...o});changes=result.upsertedCount}
      else{await collection.insertOne(doc,o);row=doc}
      return {rows:/RETURNING/i.test(tail)&&row?[clean(row)!]:[],changes};
    }

    const update=sql.match(/^UPDATE (\w+) SET (.+?) WHERE (.+)$/i);
    if(update){
      const [,table,setText,where]=update;const set:Record<string,unknown>={};const inc:Record<string,number>={};const unset:Record<string,''>={};
      for(const assignment of splitCsv(setText)){
        const match=assignment.match(/^(\w+)=(.+)$/);if(!match)throw new Error('Unsupported Mongo update: '+assignment);
        const [,field,value]=match;
        if(value===field+'+1')inc[field]=1;
        else if(/^NULL$/i.test(value))set[field]=null;
        else set[field]=literal(value,this.args,cursor);
      }
      const returning=where.match(/^(.*?) RETURNING \w+$/i);const filter=whereFilter(returning?returning[1]:where,this.args,cursor);const changeset:Document={};if(Object.keys(set).length)changeset.$set=set;if(Object.keys(inc).length)changeset.$inc=inc;if(Object.keys(unset).length)changeset.$unset=unset;
      if(returning){const row=await db.collection(table).findOneAndUpdate(filter,changeset,{returnDocument:'after',...o});return {rows:row?[clean(row)!]:[],changes:row?1:0}}
      const result=await db.collection(table).updateMany(filter,changeset,o);return {rows:[],changes:result.modifiedCount};
    }

    throw new Error(`Unsupported Mongo compatibility query (${mode}): ${sql}`);
  }
}

async function runAll(statements:MongoPreparedStatement[],session?:ClientSession){
  const results:RunResult[]=[];let previous=0;
  for(const statement of statements){const result=await statement.execute('run',previous,session);previous=result.changes;results.push({success:true,meta:{changes:result.changes}})}
  return results;
}

// A standalone mongod rejects the first statement of a transaction with IllegalOperation (code 20), which the driver
// may wrap as "does not support retryable writes" with the original error attached.
const transactionsUnsupported=(e:unknown)=>{const err=e as {code?:number;message?:string;originalError?:{code?:number;message?:string}};return err?.code===20||err?.originalError?.code===20||/Transaction numbers are only allowed|does not support retryable writes/i.test(`${err?.message||''} ${err?.originalError?.message||''}`)};

const adapter={
  prepare(sql:string){return new MongoPreparedStatement(sql)},
  // A batch is all-or-nothing. Revision guards and unique keys are checked before anything is written; on a replica set
  // the statements then run in one transaction, so a failure part-way through (a lost race, a dropped connection) rolls
  // everything back. A standalone server has no transactions, so there only the up-front checks protect the batch.
  async batch(statements:MongoPreparedStatement[]){
    for(const statement of statements)await statement.precheck();
    if(globalMongo.__allureMongoTransactions!==false){
      const {client}=await connection();const session=client.startSession();
      try{let results:RunResult[]=[];await session.withTransaction(async()=>{results=await runAll(statements,session)});globalMongo.__allureMongoTransactions=true;return results}
      catch(e){if(!transactionsUnsupported(e))throw e;globalMongo.__allureMongoTransactions=false}
      finally{await session.endSession()}
    }
    return runAll(statements);
  },
};

export const database=()=>adapter;
export async function mongoDb(){return (await connection()).db}

export const objectStore=()=>({
  async get(key:string){
    const {files}=await connection();const record=await files.find({filename:key}).sort({uploadDate:-1}).limit(1).next();if(!record)return null;
    const chunks:Buffer[]=[];for await(const chunk of files.openDownloadStream(record._id))chunks.push(Buffer.from(chunk));const body=Buffer.concat(chunks);
    return {body,httpMetadata:{contentType:String(record.metadata?.contentType||'application/octet-stream')},text:async()=>body.toString('utf8')};
  },
  async put(key:string,value:Uint8Array|string|Buffer,options?:{httpMetadata?:{contentType?:string}}){
    const {files}=await connection();const existing=await files.find({filename:key}).toArray();for(const file of existing)await files.delete(file._id);
    const stream=files.openUploadStream(key,{metadata:{contentType:options?.httpMetadata?.contentType}});stream.end(Buffer.from(value));await new Promise<void>((resolve,reject)=>stream.once('finish',()=>resolve()).once('error',reject));
  },
  async delete(key:string){
    const {files}=await connection();const existing=await files.find({filename:key}).toArray();for(const file of existing)await files.delete(file._id);return existing.length;
  },
});
