import {runMaintenance} from './runtime';
import {HttpError} from './store';

// Built-in scheduler (started from instrumentation.ts). Every 10 minutes it runs the same job as
// POST /api/maintenance/. The database lock in runMaintenance stops two runs overlapping, so an external
// cron job calling the endpoint as well is harmless.
const EVERY=10*60*1000,FIRST=60*1000;
const g=globalThis as typeof globalThis&{__avaultScheduler?:boolean};
export function startScheduler(){
 if(g.__avaultScheduler)return;g.__avaultScheduler=true;
 const run=()=>runMaintenance('built-in-scheduler').catch(e=>{if(!(e instanceof HttpError&&e.status===409))console.error('AVAULT scheduled maintenance failed:',e instanceof Error?e.message:'unknown error')});
 setTimeout(()=>{run();setInterval(run,EVERY).unref()},FIRST).unref();
}
