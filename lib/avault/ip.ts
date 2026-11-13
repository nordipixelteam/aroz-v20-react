// IPv4 and IPv6 addresses and CIDR ranges. Shared by the traffic rules on the server and the Traffic access screen,
// so both agree on what a rule matches. IPv4-mapped IPv6 addresses (::ffff:203.0.113.7) count as IPv4.
type Address={bits:32|128;value:bigint};
const ZERO=BigInt(0),B16=BigInt(16),B32=BigInt(32),FFFF=BigInt(0xffff),V4MASK=BigInt(0xffffffff);

function v4(s:string):bigint|null{const p=s.split('.');if(p.length!==4||!p.every(x=>/^\d{1,3}$/.test(x)&&+x<=255))return null;return p.reduce((n,x)=>n*BigInt(256)+BigInt(x),ZERO)}

function v6(s:string):bigint|null{
 if(!/^[0-9a-f:.]+$/i.test(s)||s.split('::').length>2)return null;
 // A dotted IPv4 tail (::ffff:1.2.3.4) becomes the last two hex groups.
 if(s.includes('.')){const at=s.lastIndexOf(':');const four=v4(s.slice(at+1));if(four===null)return null;s=s.slice(0,at+1)+(four>>B16).toString(16)+':'+(four&FFFF).toString(16)}
 const [head,tail]=s.split('::');const groups=(x:string)=>x?x.split(':'):[];
 const h=groups(head),t=tail===undefined?[]:groups(tail);
 if([...h,...t].some(g=>!/^[0-9a-f]{1,4}$/i.test(g)))return null;
 const fill=tail===undefined?0:8-h.length-t.length;
 if(tail===undefined?h.length!==8:fill<1)return null;
 return [...h,...Array(fill).fill('0'),...t].reduce((n,g)=>n*BigInt(65536)+BigInt(parseInt(g,16)),ZERO);
}

export function parseIp(raw:string):Address|null{
 const s=String(raw||'').trim().replace(/%.*$/,'');
 const four=v4(s);if(four!==null)return {bits:32,value:four};
 const six=v6(s);if(six===null)return null;
 if(six>>B32===FFFF)return {bits:32,value:six&V4MASK};
 return {bits:128,value:six};
}

function parseRange(range:string){
 const [address,prefix]=String(range||'').trim().split('/');const a=parseIp(address);if(!a)return null;
 if(prefix!==undefined&&!/^\d{1,3}$/.test(prefix))return null;
 const n=prefix===undefined?a.bits:Number(prefix);if(n>a.bits)return null;
 return {...a,prefix:n};
}

/** An address or CIDR range a traffic rule can hold: 203.0.113.7, 203.0.113.0/24, 2001:db8::1 or 2001:db8::/32. */
export const isIpRange=(range:string)=>parseRange(range)!==null;

export function matchesIP(ip:string,range:string){
 const a=parseIp(ip),r=parseRange(range);if(!a||!r||a.bits!==r.bits)return false;
 const shift=BigInt(r.bits-r.prefix);return a.value>>shift===r.value>>shift;
}
