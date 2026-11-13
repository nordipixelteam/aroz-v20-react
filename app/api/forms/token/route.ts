import {issueFormToken} from '@/lib/avault/spam';
import {json,failure} from '@/lib/avault/store';
export const dynamic='force-dynamic';
// Lead forms fetch a fresh signed token when the page loads; /api/forms/submit requires it.
export async function GET(){try{return json({token:await issueFormToken()})}catch(e){return failure(e)}}
