import {NextRequest,NextResponse} from 'next/server';

// Only a quick gate: requests without a session cookie go to the sign-in page. Every AVAULT page and API
// call still verifies the signed session against the MongoDB `users` collection (lib/avault/auth.ts).
const PUBLIC=['/avault/login/','/api/admin/login/','/api/admin/logout/'];

export function proxy(request:NextRequest){
  const path=request.nextUrl.pathname.endsWith('/')?request.nextUrl.pathname:request.nextUrl.pathname+'/';
  if(PUBLIC.includes(path)||request.cookies.has('avault_session'))return NextResponse.next();
  const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'};
  const navigation=request.headers.get('sec-fetch-mode')==='navigate';
  if(path.startsWith('/api/')&&!navigation)return NextResponse.json({error:'Sign in to continue.'},{status:401,headers});
  // Next requires an absolute URL here; build it from the browser-facing host, not the internal one.
  const host=(request.headers.get('x-forwarded-host')||request.headers.get('host')||request.nextUrl.host).split(',')[0].trim();
  const proto=(request.headers.get('x-forwarded-proto')||request.nextUrl.protocol.replace(':','')).split(',')[0].trim();
  // Come back to the requested screen after signing in (an API download link returns to AVAULT's start page).
  const next=path.startsWith('/avault/')?request.nextUrl.pathname+request.nextUrl.search:'/avault/';
  const response=NextResponse.redirect(`${proto}://${host}/avault/login/?next=${encodeURIComponent(next)}`,307);
  for(const [k,v] of Object.entries(headers))response.headers.set(k,v);
  return response;
}

export const config={matcher:['/avault/:path*','/api/admin/:path*']};
