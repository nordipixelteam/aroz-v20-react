import {NextRequest,NextResponse} from 'next/server';
import {dashboardCsp} from './lib/avault/dashboard-security';

// Only a quick gate: requests without a session cookie go to the sign-in page. Every AVAULT page and API
// call still verifies the signed session against the MongoDB `users` collection (lib/avault/auth.ts).
const PUBLIC=['/avault/login/','/api/admin/login/','/api/admin/logout/'];

export function proxy(request:NextRequest){
  const path=request.nextUrl.pathname.endsWith('/')?request.nextUrl.pathname:request.nextUrl.pathname+'/';
  if(PUBLIC.includes(path)||request.cookies.has('avault_session')){
    if(!path.startsWith('/avault/'))return NextResponse.next();
    const nonce=Buffer.from(crypto.randomUUID()).toString('base64');
    const policy=dashboardCsp(nonce,process.env.NODE_ENV==='development');
    const requestHeaders=new Headers(request.headers);
    // Replace client-supplied values. Next reads the CSP request header to nonce framework scripts.
    requestHeaders.set('x-nonce',nonce);requestHeaders.set('Content-Security-Policy',policy);
    const response=NextResponse.next({request:{headers:requestHeaders}});
    response.headers.set('Content-Security-Policy',policy);
    response.headers.set('X-Frame-Options','DENY');
    response.headers.set('X-Content-Type-Options','nosniff');
    response.headers.set('Referrer-Policy','same-origin');
    response.headers.set('Cache-Control','no-store');
    return response;
  }
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
