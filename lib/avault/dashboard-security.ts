export function dashboardCsp(nonce:string,development:boolean){
 return ["default-src 'self'",`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development?" 'unsafe-eval'":''}`,
  // React/Radix positioning, rich text, and same-origin srcdoc previews use inline style attributes.
  "style-src 'self' https: 'unsafe-inline'","img-src 'self' https: data: blob:","font-src 'self' https: data:",
  `connect-src 'self'${development?' ws: wss:':''}`,"frame-src 'self' blob:","media-src 'self' https: blob:",
  "object-src 'none'","base-uri 'self'","form-action 'self'","frame-ancestors 'none'"].join('; ');
}
