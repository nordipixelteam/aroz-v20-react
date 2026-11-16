// Shared by startup and database access. Check before constructing a client or using a cached one.
export function assertDatabaseEnvironment(env=process.env){
 if(env.NODE_ENV==='development'&&env.MONGODB_DB!=='avault_dev')throw new Error('Development requires MONGODB_DB=avault_dev; refusing to start or connect.');
 if(env.VERCEL_ENV==='preview'&&env.AVAULT_ENV!=='staging')throw new Error('AVAULT Preview deployments require explicit staging configuration.');
 if(env.AVAULT_ENV==='staging'){
  if(env.MONGODB_DB!=='avault_staging')throw new Error('Staging requires MONGODB_DB=avault_staging; refusing to start or connect.');
  if(!/^mongodb\+srv:\/\//.test(env.MONGODB_URI||''))throw new Error('Staging requires a dedicated Atlas SRV credential.');
  if(!/^[a-f0-9]{64}$/.test(env.AVAULT_ENCRYPTION_KEY||''))throw new Error('Staging requires its own 64-character hexadecimal encryption key.');
  let origin;try{origin=new URL(env.NEXT_PUBLIC_SITE_URL)}catch{throw new Error('Staging requires a valid HTTPS site origin.');}
  if(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw new Error('Staging requires a credential-free HTTPS site origin without a path or query.');
  if(env.AVAULT_SCHEDULER!=='off')throw new Error('Disable the in-process scheduler in staging; invoke maintenance through an approved external scheduler.');
 }
}
// Preserve callers of the original development-only guard.
export const assertDevelopmentDatabase=assertDatabaseEnvironment;
