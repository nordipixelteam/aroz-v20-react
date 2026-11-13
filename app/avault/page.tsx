import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {sessionUser} from '@/lib/avault/auth';
import Vault from './vault';
export const dynamic='force-dynamic';
export const metadata={title:'AVAULT | AROZ Webdesign Agentur',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const params=await searchParams;const user=await sessionUser(new Request('https://app.local',{headers:await headers()}));
 if(!user){const back=new URLSearchParams(Object.entries(params).flatMap(([k,v])=>typeof v==='string'?[[k,v]]:[]));const query=back.toString();redirect('/avault/login/?next='+encodeURIComponent('/avault/'+(query?'?'+query:'')))}
 const view=params.view;
 // The leads inbox used to live at ?view=forms; old bookmarks and emails land on the new address.
 if(view==='forms')redirect('/avault/?view=leads');
 return <Vault email={user.email} role={user.role} initialView={typeof view==='string'?view:'overview'}/>}
