// Custom scripts (settings id `scripts`): named snippets placed in the head, at the start or end of the body,
// on every page or chosen pages. Pasted code may be plain JavaScript or full HTML snippets with <script>
// tags, as Google, Meta and others hand them out; every <script> gets the page's CSP nonce. Snippets that
// respect privacy load only when the visitor hasn't opted out (footer link) or sent Global Privacy Control.
// Pure module: the AVAULT screen imports it for templates and validation.
export type Placement='head'|'bodyStart'|'bodyEnd';
export type Snippet={id:string;name:string;placement:Placement;code:string;enabled:boolean;pages:string[];respectOptOut:boolean;template:string};
export type ScriptsConfig={enabled:boolean;snippets:Snippet[]};
export const PLACEMENTS:Record<Placement,string>={head:'Inside <head>',bodyStart:'Start of <body>',bodyEnd:'End of <body>'};

const sid=()=>Math.random().toString(36).slice(2,10);
const snippet=(p:Partial<Snippet>):Snippet=>({id:sid(),name:'Custom code',placement:'head',code:'',enabled:true,pages:[],respectOptOut:true,template:'custom',...p});

// Ready-made snippets. `id` is the account/measurement ID the visitor types in.
export const TEMPLATES:{key:string;name:string;label:string;pattern:RegExp;example:string;build:(id:string)=>Snippet[]}[]=[
 {key:'ga4',name:'Google Analytics 4',label:'Measurement ID',pattern:/^G-[A-Z0-9]{4,16}$/,example:'G-XXXXXXXXXX',build:id=>[snippet({name:'Google Analytics 4',template:'ga4',code:`<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', '${id}');\n</script>`})]},
 {key:'gtm',name:'Google Tag Manager',label:'Container ID',pattern:/^GTM-[A-Z0-9]{4,12}$/,example:'GTM-XXXXXXX',build:id=>[snippet({name:'Google Tag Manager',template:'gtm',code:`<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;var n=d.querySelector('[nonce]');n&&j.setAttribute('nonce',n.nonce||n.getAttribute('nonce'));f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');</script>`})]},
 {key:'meta',name:'Meta Pixel',label:'Pixel ID',pattern:/^\d{6,20}$/,example:'123456789012345',build:id=>[snippet({name:'Meta Pixel',template:'meta',code:`<script>\n  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');\n  fbq('init', '${id}');\n  fbq('track', 'PageView');\n</script>`})]},
 {key:'clarity',name:'Microsoft Clarity',label:'Project ID',pattern:/^[a-z0-9]{6,20}$/,example:'abcde12345',build:id=>[snippet({name:'Microsoft Clarity',template:'clarity',code:`<script>\n  (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${id}");\n</script>`})]},
 {key:'custom',name:'Custom code',label:'',pattern:/.*/,example:'',build:()=>[snippet({name:'Custom code',respectOptOut:false})]},
];

// Older saves kept three plain-JavaScript boxes; they become snippets the first time they're read.
export function normalizeScripts(v:any):ScriptsConfig{
 if(Array.isArray(v?.snippets))return {enabled:!!v.enabled,snippets:v.snippets.map((s:any)=>snippet({...s,pages:Array.isArray(s.pages)?s.pages:[]}))};
 const legacy:[Placement,string][]=[['head','Head code'],['bodyStart','Body start code'],['bodyEnd','Body end code']];
 return {enabled:!!v?.enabled,snippets:legacy.filter(([k])=>String(v?.[k]||'').trim()).map(([k,name])=>snippet({id:'legacy-'+k,name,placement:k,code:String(v[k]),respectOptOut:false}))};
}

export function validateScripts(v:any):ScriptsConfig{
 const n=normalizeScripts(v);if(n.snippets.length>30)throw new Error('Use up to 30 snippets.');
 const ids=new Set<string>();
 const snippets=n.snippets.map(s=>{
  const id=String(s.id).replace(/[^a-z0-9-]/gi,'').slice(0,40)||sid();if(ids.has(id))throw new Error('Two snippets share an ID. Reload and try again.');ids.add(id);
  const name=String(s.name||'').trim().slice(0,80)||'Custom code';
  if(typeof s.code!=='string'||s.code.length>30000)throw new Error(`“${name}” is too long (30,000 characters at most).`);
  if(!(s.placement in PLACEMENTS))throw new Error(`Choose where “${name}” goes.`);
  const pages=(s.pages||[]).map((p:unknown)=>String(p).trim()).filter(Boolean).slice(0,50);
  if(pages.some((p:string)=>!p.startsWith('/')||p.length>300))throw new Error(`Pages for “${name}” must be site paths like /contact/ (end with * for a whole section).`);
  return {id,name,placement:s.placement,code:s.code,enabled:!!s.enabled,pages,respectOptOut:!!s.respectOptOut,template:String(s.template||'custom').slice(0,20)};
 });
 return {enabled:!!v?.enabled,snippets};
}

// "/blog/*" matches the blog and everything under it; anything else must match the page exactly.
export const pageMatches=(pages:string[],route:string)=>!pages.length||pages.some(p=>p.endsWith('*')?route.startsWith(p.slice(0,-1)):p===route||p===route.replace(/\/$/,'')||p+'/'===route);

function withNonce(code:string,nonce:string){
 // Full HTML (from a provider's copy button) keeps its tags; bare JavaScript is wrapped in one script tag.
 if(/<(script|noscript|img|link|meta|iframe|style|div|span|!--)\b/i.test(code))return code.replace(/<script\b(?![^>]*\bnonce=)/gi,`<script nonce="${nonce}"`);
 return `<script nonce="${nonce}">${code.replace(/<\/script/gi,'<\\/script')}</script>`;
}
// Respectful snippets sit in an inert <template>; a small loader copies them in unless the visitor opted out.
const loader=(id:string,nonce:string)=>`<script nonce="${nonce}">(function(t,me){try{if(navigator.globalPrivacyControl===true||localStorage.getItem('avault-optout')==='1')return}catch(e){}if(!t)return;Array.prototype.forEach.call(t.content.childNodes,function(c){var n=c;if(c.nodeName==='SCRIPT'){n=document.createElement('script');for(var i=0;i<c.attributes.length;i++)n.setAttribute(c.attributes[i].name,c.attributes[i].value);n.nonce='${nonce}';n.async=false;n.text=c.textContent}else n=c.cloneNode(true);me.parentNode.insertBefore(n,me)})})(document.getElementById('avs-${id}'),document.currentScript)</script>`;
export function renderSnippet(s:Snippet,nonce:string){
 const code=withNonce(s.code,nonce),mark=`<!-- avault:snippet:${s.id} -->`;
 return s.respectOptOut?`${mark}<template id="avs-${s.id}">${code}</template>${loader(s.id,nonce)}`:mark+code;
}
