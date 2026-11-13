// Runs once when the Next.js server starts. In production it starts AVAULT's built-in scheduler, so
// scheduled posts, failed-email retries, visit-record cleanup and daily backups run without a server cron job.
export async function register(){
 if(process.env.NEXT_RUNTIME!=='nodejs')return;
 if(process.env.NODE_ENV!=='production'&&process.env.AVAULT_SCHEDULER!=='on')return;
 if(process.env.AVAULT_SCHEDULER==='off')return;
 const {startScheduler}=await import('./lib/avault/scheduler');
 startScheduler();
}
