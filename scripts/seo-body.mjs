// SEO-only template upgrade. Existing keys, copy and unrelated draft values stay intact.
export const seoBodyFields=[
 {value:'02 · Content',kind:'text',label:'SEO diagram: content status',section:'SEO starts with how the website is built.'},
 {value:'03 · Internal linking',kind:'text',label:'SEO diagram: linking status',section:'SEO starts with how the website is built.'},
 {value:'04 · Technology',kind:'text',label:'SEO diagram: technology status',section:'SEO starts with how the website is built.'},
 {value:'/seo/technisches-seo',kind:'text',label:'Technical SEO: URL illustration',section:'Three SEO tasks. Three different ways to improve.'},
 {value:'OLD',kind:'text',label:'Relaunch diagram: old label',section:'Three SEO tasks. Three different ways to improve.'},
 {value:'NEW ↗',kind:'text',label:'Relaunch diagram: new label',section:'Three SEO tasks. Three different ways to improve.'},
 {value:'',kind:'text',label:'Decorative AROZ mark: img alt',section:'SEO from Schwelm. For clearly structured websites.'},
];
export function seoBodyTemplate(html,values){
 html=html.replace(/const archLabels=\[[^;]+\];/,'');
 if(html.includes('data-seo-status'))return html;
 html=html.replace(/<strong data-arch-label="">([\s\S]*?)<\/strong>/,(_,first)=>`<strong data-arch-label="" data-seo-status="0">${first}</strong>`+values.slice(0,3).map((v,i)=>`<strong data-seo-status="${i+1}" hidden>${v}</strong>`).join(''));
 html=html.replace(/<div aria-hidden="true" class="micro tech"><\/div>/,`<div aria-hidden="true" class="micro tech"><span class="seo-tech-url">${values[3]}</span></div>`);
 html=html.replace(/<div aria-hidden="true" class="micro relaunch"><i><\/i><\/div>/,`<div aria-hidden="true" class="micro relaunch"><span class="seo-relaunch-old">${values[4]}</span><span class="seo-relaunch-new">${values[5]}</span><i></i></div>`);
 html=html.replace(/<img alt="" aria-hidden="true" class="local-mark"/,`<img alt="${values[6]}" aria-hidden="true" class="local-mark"`);
 html=html.replace(/if\(archLabel\)archLabel\.textContent=archLabels\[best\];/,`document.querySelectorAll('[data-seo-status]').forEach((label,index)=>{label.hidden=index!==best});`);
 return html;
}
export function upgradeSeoDocument(doc){
 if(doc.route!=='/seo/')throw Error('SEO upgrade only accepts /seo/.');
 if(doc.template.includes('data-seo-status'))return {...doc,template:seoBodyTemplate(doc.template,[])};
 const start=Math.max(...doc.fields.map(f=>Number(f.key.slice(1))))+1;
 const added=seoBodyFields.map((f,i)=>({...f,key:'f'+(start+i),group:'content'}));
 const template=seoBodyTemplate(doc.template,added.map(f=>'{{'+f.key+'}}')).replace('</head>','<link rel="stylesheet" href="/assets/seo-page.css"></head>');
 if(!added.every(f=>template.includes('{{'+f.key+'}}')))throw Error('An SEO field was not placed in its template.');
 return {...doc,template,fields:[...doc.fields,...added]};
}
