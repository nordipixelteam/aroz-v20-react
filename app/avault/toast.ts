import {toast} from 'sonner';
// Every AVAULT panel reports through one `notice(message)` call; this shows it as a toast that clears itself.
// Errors stay a little longer and use the red style; an empty message (used to "clear") does nothing.
const ERROR=/\b(fail|failed|error|invalid|unable|could not|couldn['’]t|cannot|can['’]t|rejected|denied|required|must|too many|not (?:found|allowed|published|configured|reachable)|unavailable|expired|sign in|try again|does not|do not match|enter (?:a|the|your|between|both))\b/i;
// Messages the admin API returned as errors. request() and api() register them, so they show as errors whatever their
// wording; anything else (client-side checks, success notes) falls back to the word list above.
const serverErrors=new Set<string>();
export function serverError(message:string){serverErrors.add(message);return new Error(message)}
export function notify(message:string){if(!message)return;const failed=serverErrors.delete(message)||ERROR.test(message);if(failed)toast.error(message,{duration:8000});else toast.success(message,{duration:4000})}
