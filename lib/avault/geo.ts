import fs from 'node:fs';
import path from 'node:path';
import {Reader,type Response} from 'mmdb-lib';

// Visitor country without Cloudflare: an offline IP→country database (ip-location-db
// "geo-whois-asn-country", CC0, with NRO statistics under CC BY 4.0) read in memory. No outside requests.
// A Cloudflare country header still wins when present. Updating the npm package refreshes the data.
type Row=Response&{country_code?:string};
const g=globalThis as typeof globalThis&{__avaultGeo?:Reader<Row>|null};
function reader(){
 if(g.__avaultGeo!==undefined)return g.__avaultGeo;
 try{g.__avaultGeo=new Reader<Row>(fs.readFileSync(path.join(process.cwd(),'node_modules/@ip-location-db/geo-whois-asn-country-mmdb/geo-whois-asn-country.mmdb')))}
 catch{console.error('AVAULT: the IP country database is unavailable; country rules are skipped.');g.__avaultGeo=null}
 return g.__avaultGeo;
}
export function countryOfIp(ip:string){const v=ip.replace(/^::ffff:/,'');if(!v||v==='unknown')return '';try{return reader()?.get(v)?.country_code?.toUpperCase()||''}catch{return ''}}
export const countryOf=(req:Request,ip:string)=>(req.headers.get('cf-ipcountry')||'').toUpperCase().replace(/^XX$/,'')||countryOfIp(ip);

// Visits, calls and leads recorded before country lookup existed get their country filled in, a batch at a
// time, by the scheduled maintenance run.
export async function backfillCountries(limit=5000){
 const {mongoDb}=await import('@/db/mongo');const db=await mongoDb();let done=0;
 for(const name of ['events','forms']){
  const rows=await db.collection(name).find({$or:[{country:{$exists:false}},{country:''}],ip:{$nin:['','unknown',null]}},{projection:{_id:1,ip:1}}).limit(limit).toArray();
  const ops=rows.map(r=>({updateOne:{filter:{_id:r._id},update:{$set:{country:countryOfIp(String(r.ip))||'-'}}}}));
  if(ops.length){await db.collection(name).bulkWrite(ops,{ordered:false});done+=ops.length}
 }
 return done;
}
// '-' marks "looked up, no country found" so the row isn't retried; it reads as unknown everywhere.
export const countryLabel=(c?:string|null)=>c&&c!=='-'?c:'';
