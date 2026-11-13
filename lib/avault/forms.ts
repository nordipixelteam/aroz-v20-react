// Website forms editable from AVAULT → Forms (settings id `forms`). AROZ uses its existing contact
// form markup on the homepage and contact page; both submit to /api/forms/submit.
// Until a form is saved here, pages keep the markup they were built with. Once saved, the form's inner
// markup is regenerated from this definition on every page; the <form> tag itself (with its per-page
// data-service / data-review) is left alone. Pure functions only: the AVAULT preview imports this file.
export type FieldType='text'|'email'|'url'|'tel'|'textarea'|'select';
export type FormField={name:string;label:string;type:FieldType;placeholder:string;required:boolean;options:string[];width:'half'|'full'};
export type ContactForm={enabled:boolean;request:string;fields:FormField[];button:string;note:string};
export type HeroForm={enabled:boolean;label:string;placeholder:string;button:string};
export type CustomForm=ContactForm&{id:string;title:string};
export type FormsConfig={contact:ContactForm;hero:HeroForm;custom:CustomForm[]};
// The submit route, the footer script and the hero hand-off rely on these names.
export const CORE=['name','email'] as const;
export const BUILT_IN=['name','email','phone','website','service','zip','project','message','details','notes'];
export const FIELD_TYPES:FieldType[]=['text','email','url','tel','textarea','select'];

const esc=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const ARROW='<svg class="cta-arrow" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13 5l7 7-7 7"/></svg>';
const AUTOCOMPLETE:Record<string,string>={name:'name',email:'email',phone:'tel',zip:'postal-code'};
const MAX:Record<FieldType,number>={text:200,email:200,url:300,tel:40,textarea:2000,select:0};

function control(f:FormField){
 const req=f.required?' required':'';
 if(f.type==='select')return `<select name="${esc(f.name)}"${req}><option value="" disabled selected>${esc(f.placeholder||'Choose an option')}</option>${f.options.map(o=>`<option>${esc(o)}</option>`).join('')}</select>`;
 if(f.type==='textarea')return `<textarea name="${esc(f.name)}" rows="4" maxlength="2000" placeholder="${esc(f.placeholder)}"${req}></textarea>`;
 const type=f.type==='url'?'text" inputmode="url':f.type;
 return `<input name="${esc(f.name)}" type="${type}"${AUTOCOMPLETE[f.name]?` autocomplete="${AUTOCOMPLETE[f.name]}"`:f.type==='tel'?' autocomplete="tel"':''}${req} maxlength="${MAX[f.type]}" placeholder="${esc(f.placeholder)}">`;
}
const field=(f:FormField)=>`<label>${esc(f.label)}<span class="gemini-field"><span class="field-orbit" aria-hidden="true"></span>${control(f)}</span></label>`;

export function contactFormInner(c:ContactForm){
 let out=`<input type="hidden" name="request" value="${esc(c.request)}">\n    <div class="form-grid">`;
 // Consecutive half-width fields sit side by side, as name and email do on the original form.
 for(let i=0;i<c.fields.length;i++){const f=c.fields[i],next=c.fields[i+1];
  if(f.width==='half'&&next?.width==='half'){out+=`<div class="field-pair">${field(f)}${field(next)}</div>\n    `;i++}else out+=field(f)+'\n    ';}
 return out+`</div><button class="button button--red" type="submit"><span class="button-label">${esc(c.button)}</span><span class="button-arrow" aria-hidden="true"><i class="fi fi-rs-arrow-up-right arrow-out" aria-hidden="true"></i><i class="fi fi-rs-arrow-up-right arrow-in" aria-hidden="true"></i></span></button><p class="form-note">${esc(c.note)}</p><p class="form-status" role="status" aria-live="polite"></p>`;
}
function arozControl(f:FormField,id:string){
 const required=f.required?' required':'';
 if(f.type==='textarea')return `<textarea id="${id}" name="${esc(f.name)}" placeholder="${esc(f.placeholder)}" maxlength="2000"${required}></textarea>`;
 const type=f.type==='url'?'text':f.type;
 return `<input id="${id}" name="${esc(f.name)}" type="${type}"${f.type==='url'?' inputmode="url"':''} placeholder="${esc(f.placeholder)}" maxlength="${MAX[f.type]}"${required}>`;
}
function arozFormInner(c:ContactForm,opening:string){
 const fieldMap=new Map(c.fields.map(field=>[field.name,field]));
 const formId=/id="contactForm"/i.test(opening);
  const homepage=/data-avault-form="homepage-contact"/i.test(opening);
 const fieldHtml=(name:string)=>{const f=fieldMap.get(name);if(!f)return '';const id=`avault-${f.name}`;return `<div class="${formId?'field':'v9-av-field'}"><label for="${id}">${esc(f.label)}${f.required?' <span>*</span>':''}</label>${arozControl(f,id)}</div>`};
 const service=fieldMap.get('service');
 const serviceHtml=service?.type==='select'&&service.options.length
  ?`<fieldset class="field"><legend>${esc(service.label)}</legend><div class="service-picks">${service.options.map(option=>`<button aria-pressed="false" class="service-pick" data-value="${esc(option)}" type="button">${esc(option)}</button>`).join('')}</div><input id="serviceValue" name="service" type="hidden"${service.required?' required':''}></fieldset>`
  :fieldHtml('service');
 const request=`<input type="hidden" name="request" value="${esc(c.request)}">`;
 const status=formId
  ?`<div class="form-success" aria-live="polite" role="status" tabindex="-1"></div>`
  :`<p class="v9-form-status" hidden role="status" tabindex="-1"></p>`;
 if(formId){
  const name=fieldHtml('name'),email=fieldHtml('email'),rest=c.fields.filter(f=>!['name','email','service'].includes(f.name)).map(f=>fieldHtml(f.name)).join('');
  return `${request}<div class="form-top"><strong>Projektanfrage</strong><span>Erster Kontakt</span></div>${serviceHtml}<div class="field-pair">${name}${email}</div>${rest}<div class="form-submit"><p>${esc(c.note)}</p><button type="submit">${esc(c.button)} ↗</button></div>${status}`;
 }
 const paired=`<div class="v9-form-row">${fieldHtml('name')}${fieldHtml('email')}</div>`;
 const rest=c.fields.filter(f=>!['name','email'].includes(f.name)).map(f=>f.name==='service'?serviceHtml:fieldHtml(f.name)).join('');
  const consent=homepage?`<label class="v9-privacy"><input type="checkbox" name="privacyConsent" required><span>Ich habe die <a href="/datenschutz/">Datenschutzhinweise</a> gelesen. *</span></label>`:'';
  return `${request}<span class="v9-eyebrow">( Kurzer Kontakt )</span><h3>Erzählen Sie uns von Ihrem Vorhaben.<br/>Wir freuen uns darauf.</h3>${paired}${rest}${consent}<p class="v9-preview">${esc(c.note)}</p><button class="v9-contact-submit" type="submit"><span aria-hidden="true">↗</span> ${esc(c.button)}</button>${status}`;
}
export const heroFormInner=(h:HeroForm)=>`<label><span>${esc(h.label)}</span><span class="gemini-field"><span class="field-orbit" aria-hidden="true"></span><input name="zip" type="text" inputmode="numeric" autocomplete="postal-code" placeholder="${esc(h.placeholder)}" required maxlength="10" aria-label="${esc(h.label)}"></span></label><button type="submit">${esc(h.button)} ${ARROW}</button><p class="hero-proposal-status" role="status" aria-live="polite"></p>`;

export function normalizeForms(v:any):FormsConfig{
 const c=v?.contact,h=v?.hero;
 return {contact:{enabled:!!c?.enabled,request:String(c?.request||''),button:String(c?.button||''),note:String(c?.note||''),fields:Array.isArray(c?.fields)?c.fields:[]},hero:{enabled:!!h?.enabled,label:String(h?.label||''),placeholder:String(h?.placeholder||''),button:String(h?.button||'')},custom:(Array.isArray(v?.custom)?v.custom:[]).map((f:any)=>({...f,id:String(f.id||''),title:String(f.title||''),enabled:f.enabled!==false,fields:Array.isArray(f.fields)?f.fields:[]}))};
}

// Validates an AVAULT save. Throws a plain Error with a reader-facing message.
export function validateForms(v:any):FormsConfig{
 const t=(s:unknown,max:number)=>String(s??'').replace(/[\r\n]+/g,' ').trim().slice(0,max);
 const c=v?.contact||{},h=v?.hero||{};
 const fields=(Array.isArray(c.fields)?c.fields:[]).slice(0,20).map((f:any):FormField=>{
  const type=FIELD_TYPES.includes(f?.type)?f.type:'text',name=String(f?.name||'');
    if(!/^(?:name|email|phone|website|service|zip|project|message|details|notes|x_[a-z0-9_]{1,40})$/.test(name))throw new Error('Field names must be built-in or start with x_.');
  const label=t(f.label,120);if(!label)throw new Error('Every field needs a label.');
  const options=type==='select'?(Array.isArray(f.options)?f.options:[]).map((o:unknown)=>t(o,150)).filter(Boolean).slice(0,30):[];
  if(type==='select'&&!options.length)throw new Error(`Add at least one choice to "${label}".`);
  return {name,label,type:name==='email'?'email':name==='phone'?'tel':type,placeholder:t(f.placeholder,150),required:CORE.includes(name as any)?true:!!f.required,options,width:f.width==='half'?'half':'full'};
 });
 for(const core of CORE)if(!fields.some((f:FormField)=>f.name===core))throw new Error(`The ${core} field can't be removed; the site needs it to reply.`);
 if(new Set(fields.map((f:FormField)=>f.name)).size!==fields.length)throw new Error('Two fields share the same name.');
 const button=t(c.button,80),heroButton=t(h.button,80);if(!button)throw new Error('The form button needs text.');if(h.enabled&&!heroButton)throw new Error('The quick form button needs text.');
 const custom:CustomForm[]=(Array.isArray(v?.custom)?v.custom:[]).slice(0,20).map((form:any):CustomForm=>{const id=t(form.id,60);if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))throw new Error('Custom form IDs use lowercase letters, numbers and hyphens.');const title=t(form.title,100);if(!title)throw new Error('Every custom form needs a title.');const customFields:FormField[]=(Array.isArray(form.fields)?form.fields:[]).slice(0,20).map((f:any):FormField=>{const name=String(f?.name||''),type=FIELD_TYPES.includes(f?.type)?f.type:'text';if(!/^(?:name|email|phone|website|service|zip|project|message|details|notes|x_[a-z0-9_]{1,40})$/.test(name))throw new Error(`Invalid field in ${title}.`);return {name,label:t(f.label,120),type,placeholder:t(f.placeholder,150),required:!!f.required,options:type==='select'?(Array.isArray(f.options)?f.options:[]).map((o:unknown)=>t(o,150)).filter(Boolean).slice(0,30):[],width:f.width==='half'?'half':'full'}});for(const core of CORE)if(!customFields.some((f:FormField)=>f.name===core))throw new Error(`${title} needs the ${core} field.`);return {id,title,enabled:form.enabled!==false,request:t(form.request,120),fields:customFields,button:t(form.button,80),note:t(form.note,240)}});if(new Set(custom.map((f:CustomForm)=>f.id)).size!==custom.length)throw new Error('Custom form IDs must be unique.');
 return {contact:{enabled:true,request:t(c.request,120),fields,button,note:t(c.note,240)},hero:{enabled:!!h.enabled,label:t(h.label,120),placeholder:t(h.placeholder,150),button:heroButton},custom};
}

// Rewrites saved forms into a rendered page.
export function applyForms(html:string,v:any){const f=normalizeForms(v);
 if(f.contact.enabled)html=html.replace(/(<form\b[^>]*class="[^"]*\baudit-form\b[^"]*"[^>]*>)[\s\S]*?<\/form>/g,(_,open)=>open+(/\bv9-contact-form\b|\bid="contactForm"/i.test(open)?arozFormInner(f.contact,open):contactFormInner(f.contact))+'</form>');
 if(f.hero.enabled)html=html.replace(/(<form\b[^>]*class="[^"]*\bhero-proposal\b[^"]*"[^>]*>)[\s\S]*?<\/form>/g,(_,open)=>open+heroFormInner(f.hero)+'</form>');
 for(const form of f.custom.filter(x=>x.enabled))html=html.replace(new RegExp(`(<form\\b[^>]*data-avault-form=["']${form.id}["'][^>]*>)[\\s\\S]*?<\\/form>`,'g'),(_,open)=>open+contactFormInner(form)+'</form>');
 return html;
}

// Values sent for added (x_) fields, keyed by their label, for the lead record and email.
export function extraValues(b:Record<string,unknown>,v:any){const f=normalizeForms(v);if(!f.contact.enabled)return {};const selected=f.custom.find(x=>x.enabled&&x.request===String(b.request||''))||f.contact,out:Record<string,string>={};
 for(const field of selected.fields.filter(x=>x.name.startsWith('x_'))){const value=String(b[field.name]??'').trim().slice(0,2000);if(field.required&&!value)throw new Error(`Please fill in "${field.label}".`);if(field.type==='select'&&value&&!field.options.includes(value))throw new Error(`Choose a listed option for "${field.label}".`);if(value)out[field.label]=value}
 return out;
}
