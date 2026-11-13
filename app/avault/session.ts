// Every AVAULT call to /api/admin goes through adminFetch. A 401 means the session expired, was revoked (password or
// role change, user deactivated) or the cookie is gone, so the browser goes to the sign-in page and returns to this
// same screen afterwards instead of showing "Sign in to continue." on every action.
let leaving=false;

export function signInAgain(){
 if(leaving)return;leaving=true;
 // With unsaved page changes the browser first asks whether to leave; if the editor stays, the next call tries again.
 setTimeout(()=>{leaving=false},3000);
 location.href='/avault/login/?next='+encodeURIComponent(location.pathname+location.search);
}

export async function adminFetch(path:string,init?:RequestInit){
 const r=await fetch('/api/admin/'+path,init);
 if(r.status===401){signInAgain();throw new Error('Your session has ended. Taking you to sign in…')}
 return r;
}

// Where to go after signing in: only AVAULT screens, never another site or the sign-in page itself.
export function safeNext(value:string|null|undefined){
 const next=String(value||'');
 return /^\/avault(?:\/|\?|$)/.test(next)&&!next.startsWith('/avault/login')&&!/[\\\s]/.test(next)?next:'/avault/';
}
