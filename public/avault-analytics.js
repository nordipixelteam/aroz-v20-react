// First-party visitor journeys for AVAULT: page views (with time on page), link/button clicks, form sends and
// phone taps, in order. Honors the browser's Global Privacy Control signal and a footer opt-out link.
(()=>{if(window.__avaultAnalytics)return;window.__avaultAnalytics=true;
const store=(s,k,v)=>{try{if(v===undefined)return s.getItem(k);if(v===null)s.removeItem(k);else s.setItem(k,v)}catch{return null}};
const optedOut=()=>navigator.globalPrivacyControl===true||store(localStorage,'avault-optout')==='1';
const uuid=()=>crypto.randomUUID?crypto.randomUUID():'10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
function ids(){let session=store(sessionStorage,'avault-session'),visitor=store(localStorage,'avault-visitor');if(!session){session=uuid();store(sessionStorage,'avault-session',session)}if(!visitor){visitor=uuid();store(localStorage,'avault-visitor',visitor)}return {session,visitor}}
let pageStart=Date.now(),lastPath=location.pathname;
function send(type,extra={}){if(optedOut())return;const {session,visitor}=ids();const body=JSON.stringify({type,session,visitor,page:location.pathname,...extra});
 if(type!=='heartbeat'&&navigator.sendBeacon&&navigator.sendBeacon('/api/events/',new Blob([body],{type:'application/json'})))return;
 fetch('/api/events/',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{})}
const label=el=>(el.getAttribute('aria-label')||el.textContent||el.getAttribute('title')||'').replace(/\s+/g,' ').trim().slice(0,90);
function pageView(){send('page',{referrer:document.referrer,title:document.title.slice(0,120)});pageStart=Date.now();lastPath=location.pathname}
function leave(){const seconds=Math.round((Date.now()-pageStart)/1000);if(seconds>0)send('leave',{seconds,page:lastPath})}
pageView();
document.addEventListener('click',e=>{const el=e.target.closest?.('a,button,[role="button"]');if(!el||el.closest('#avault-bar'))return;const href=el.getAttribute('href')||'';
 if(href.startsWith('tel:'))return send('call',{target:href,label:label(el)});
 send('click',{label:label(el),href:href.slice(0,300)})},{capture:true});
document.addEventListener('submit',e=>{const f=e.target;send('form',{label:(f.getAttribute('aria-label')||f.dataset.service||f.className||'form').toString().slice(0,90)})},{capture:true});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')leave();else pageStart=Date.now()});
window.addEventListener('allure:navigation',()=>{leave();pageView()});
setInterval(()=>{if(document.visibilityState==='visible')send('heartbeat')},60000);
const optout=document.createElement('button');optout.type='button';optout.className='avault-measurement-preferences';
const paint=()=>{optout.textContent=optedOut()?'Visit tracking is off':'Don’t track my visits'};paint();
optout.onclick=()=>{if(navigator.globalPrivacyControl===true)return;store(localStorage,'avault-optout',optedOut()?null:'1');paint()};
(document.querySelector('.footer-utility')||document.querySelector('footer'))?.append(optout);
})();
