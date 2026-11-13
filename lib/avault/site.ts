import {HttpError,safeUrl} from './store';

// Global business profile (settings id `global`). One set of values drives the visible contact/social links,
// the Organization schema (sameAs, hasMap, address, hours) and the default title/description.
export const SOCIAL:Record<string,{label:string;domains:RegExp}>={
 facebook:{label:'Facebook',domains:/^https:\/\/(?:www\.|m\.)?facebook\.com\//},
 instagram:{label:'Instagram',domains:/^https:\/\/(?:www\.)?instagram\.com\//},
 linkedin:{label:'LinkedIn',domains:/^https:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\//},
 x:{label:'X (Twitter)',domains:/^https:\/\/(?:www\.)?(?:x|twitter)\.com\//},
 youtube:{label:'YouTube',domains:/^https:\/\/(?:www\.|m\.)?youtube\.com\//},
 tiktok:{label:'TikTok',domains:/^https:\/\/(?:www\.)?tiktok\.com\//},
 pinterest:{label:'Pinterest',domains:/^https:\/\/(?:[a-z]{2,3}\.)?pinterest\.com\//},
};
export const BUSINESS_TYPES=['Organization','ProfessionalService','LocalBusiness','Corporation'] as const;
export type Profile={name:string;legalName:string;tagline:string;businessType:typeof BUSINESS_TYPES[number];email:string;phone:string;image:string;logo:string;
 address:{street:string;city:string;region:string;postalCode:string;country:string};geo:{lat:string;lng:string};hours:string[];mapUrl:string;
 socials:Record<string,string>;priceRange:string;areaServed:string;titleTemplate:string;defaultDescription:string};

export function profile(g:any):Profile{const a=g?.address||{},geo=g?.geo||{};return {name:String(g?.name||''),legalName:String(g?.legalName||''),tagline:String(g?.tagline||''),businessType:BUSINESS_TYPES.includes(g?.businessType)?g.businessType:'Organization',email:String(g?.email||''),phone:String(g?.phone||''),image:String(g?.image||''),logo:String(g?.logo||''),
 address:{street:String(a.street||''),city:String(a.city||''),region:String(a.region||''),postalCode:String(a.postalCode||''),country:String(a.country||'')},geo:{lat:String(geo.lat||''),lng:String(geo.lng||'')},hours:Array.isArray(g?.hours)?g.hours.map(String):[],mapUrl:String(g?.mapUrl||''),
 socials:Object.fromEntries(Object.keys(SOCIAL).map(k=>[k,String(g?.socials?.[k]||'')])),priceRange:String(g?.priceRange||''),areaServed:String(g?.areaServed||''),titleTemplate:String(g?.titleTemplate||'%s'),defaultDescription:String(g?.defaultDescription||'')}}

// Validates an AVAULT settings form. Unknown keys are dropped; navigation overrides are kept as they are.
export function validateProfile(b:any,current:any){
 const t=(v:unknown,max=200)=>String(v??'').trim().slice(0,max);
 const email=t(b.email,250),phone=t(b.phone,40),image=t(b.image,500),logo=t(b.logo,500),mapUrl=t(b.mapUrl,1000);
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new HttpError(422,'Enter a valid contact email or leave it blank.');
 if(phone&&!/^\+?[0-9 ()-]{7,25}$/.test(phone))throw new HttpError(422,'Enter a valid phone number.');
 for(const [label,v] of [['Default image',image],['Logo',logo]])if(v&&!safeUrl(v))throw new HttpError(422,label+' must be a site path or https URL.');
 if(mapUrl&&!/^https:\/\//.test(mapUrl))throw new HttpError(422,'The Google Business Profile / map link must start with https://');
 const socials:Record<string,string>={};for(const [k,rule] of Object.entries(SOCIAL)){const v=t(b.socials?.[k],500);if(v&&!rule.domains.test(v))throw new HttpError(422,`${rule.label} must be a full https link to ${rule.label}.`);socials[k]=v}
 const lat=t(b.geo?.lat,20),lng=t(b.geo?.lng,20);if((lat||lng)&&(!(Math.abs(+lat)<=90)||!(Math.abs(+lng)<=180)||!lat||!lng))throw new HttpError(422,'Enter both latitude and longitude as numbers, or leave both blank.');
 const hours=(Array.isArray(b.hours)?b.hours:String(b.hours||'').split('\n')).map((h:unknown)=>t(h,60)).filter(Boolean).slice(0,14);
 if(hours.some((h:string)=>!/^(Mo|Tu|We|Th|Fr|Sa|Su)(-(Mo|Tu|We|Th|Fr|Sa|Su))?(,(Mo|Tu|We|Th|Fr|Sa|Su)(-(Mo|Tu|We|Th|Fr|Sa|Su))?)* \d{2}:\d{2}-\d{2}:\d{2}$/.test(h)))throw new HttpError(422,'Write opening hours like "Mo-Fr 09:00-17:00", one per line.');
 const titleTemplate=t(b.titleTemplate,120);if(!titleTemplate.includes('%s'))throw new HttpError(422,'The title template must contain %s where the page title goes.');const name=t(b.name,100);if(!name)throw new HttpError(422,'Business name is required.');
 return {...current,name,legalName:t(b.legalName,150),tagline:t(b.tagline,200),businessType:BUSINESS_TYPES.includes(b.businessType)?b.businessType:'Organization',email,phone,image,logo,
  address:{street:t(b.address?.street),city:t(b.address?.city,100),region:t(b.address?.region,100),postalCode:t(b.address?.postalCode,20),country:t(b.address?.country,60)},geo:{lat,lng},hours,mapUrl,socials,priceRange:t(b.priceRange,20),areaServed:t(b.areaServed,200),titleTemplate,defaultDescription:t(b.defaultDescription,300)};
}

const abs=(s:string,origin:string)=>new URL(s,origin).href;
// Existing links to a platform are pointed at the configured profile, so visible links and schema never diverge.
export function syncSocialLinks(html:string,g:any){const p=profile(g);for(const [k,rule] of Object.entries(SOCIAL)){const url=p.socials[k];if(!url)continue;html=html.replace(/href="(https:\/\/[^"]+)"/g,(m,href)=>rule.domains.test(href)?`href="${url.replace(/"/g,'&quot;')}"`:m)}return html}

export function organizationNode(g:any,html:string,origin:string){const p=profile(g);
 const linked=[...html.matchAll(/href="(https:\/\/[^"]+)"/g)].map(m=>m[1]).filter(h=>Object.values(SOCIAL).some(r=>r.domains.test(h)));
 const a=p.address,hasAddress=Object.values(a).some(Boolean);
 return {'@type':p.businessType,'@id':origin+'/#organization',name:p.name,...(p.legalName?{legalName:p.legalName}:{}),...(p.tagline?{slogan:p.tagline}:{}),url:origin+'/',logo:abs(p.logo,origin),image:abs(p.image,origin),...(p.email?{email:p.email}:{}),telephone:p.phone,
  ...(hasAddress?{address:{'@type':'PostalAddress',streetAddress:a.street||undefined,addressLocality:a.city||undefined,addressRegion:a.region||undefined,postalCode:a.postalCode||undefined,addressCountry:a.country||undefined}}:{}),
  ...(p.geo.lat&&p.geo.lng?{geo:{'@type':'GeoCoordinates',latitude:+p.geo.lat,longitude:+p.geo.lng}}:{}),
  ...(p.hours.length&&p.businessType!=='Organization'&&p.businessType!=='Corporation'?{openingHours:p.hours}:{}),
  ...(p.priceRange&&p.businessType!=='Organization'&&p.businessType!=='Corporation'?{priceRange:p.priceRange}:{}),
  ...(p.mapUrl?{hasMap:p.mapUrl}:{}),areaServed:{'@type':'AdministrativeArea',name:p.areaServed},
  sameAs:[...new Set([...Object.values(p.socials).filter(Boolean),...linked])]};
}

// Page-level JSON-LD additions. System-owned properties always win, and only content types may be added.
const ALLOWED_TYPES=['Service','Product','Offer','HowTo','VideoObject','ImageObject','Event','Course','Review','ItemList','Person','Place','ContactPoint','Dataset','SoftwareApplication','CreativeWork'];
export function validateCustomSchema(value:unknown){const s=String(value||'').trim();if(!s)return '';if(s.length>20000)throw new HttpError(422,'Page schema is too long.');let parsed:any;try{parsed=JSON.parse(s)}catch{throw new HttpError(422,'Page schema must be valid JSON.')}
 const nodes=Array.isArray(parsed)?parsed:[parsed];if(!nodes.length||nodes.length>10||nodes.some(n=>!n||typeof n!=='object'||Array.isArray(n)))throw new HttpError(422,'Page schema must be one JSON object or a list of up to 10 objects.');
 for(const n of nodes){const types=[].concat(n['@type']||[]);if(!types.length||types.some((t:unknown)=>!ALLOWED_TYPES.includes(String(t))))throw new HttpError(422,'Page schema @type must be one of: '+ALLOWED_TYPES.join(', ')+'. Organization, WebSite, WebPage, BreadcrumbList, Article and FAQ are generated automatically.')}
 if(/aggregateRating|"ratingValue"/i.test(s))throw new HttpError(422,'Ratings are not allowed in page schema unless they come from a verified review source.');
 return s;
}
export function customSchemaNodes(schema:string|undefined,canonical:string){if(!schema)return [];try{const parsed=JSON.parse(schema);return (Array.isArray(parsed)?parsed:[parsed]).map((n:any,i:number)=>{const {['@context']:_c,['@id']:_i,...rest}=n;void _c;void _i;return {...rest,'@id':canonical+'#custom-'+(i+1),mainEntityOfPage:{'@id':canonical+'#webpage'}}})}catch{return []}}
