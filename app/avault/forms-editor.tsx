'use client';
import {useEffect,useMemo,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {ArrowUp,ArrowDown,Trash2,Plus,Monitor,Smartphone,Lock} from 'lucide-react';
import {request} from './content-tools';
import {contactFormInner,heroFormInner,CORE,FIELD_TYPES,type FormsConfig,type FormField,type FieldType} from '@/lib/avault/forms';

// AVAULT → Forms: every form on the website, where it appears, a live preview in the site's design,
// and an editor for its fields, choices and button. Saving applies the form to every page that has it.
const TYPE_LABEL:Record<FieldType,string>={text:'Short text',email:'Email',url:'Website',tel:'Phone',textarea:'Long text',select:'Dropdown'};
const NAME_LABEL:Record<string,string>={name:'Name',email:'Email',phone:'Telefon',website:'Website',service:'Thema',zip:'Postleitzahl',project:'Projekt',message:'Nachricht',details:'Details',notes:'Notizen'};
const esc=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const slug=(s:string)=>'x_'+(s.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,30)||'field');

export function FormsEditor({role,notice}:{role:string;notice:(s:string)=>void}){
 const [data,setData]=useState<any>(null),[form,setForm]=useState<string>('contact'),[cfg,setCfg]=useState<FormsConfig|null>(null),[dirty,setDirty]=useState(false),[busy,setBusy]=useState(false),[open,setOpen]=useState<number|null>(null),[device,setDevice]=useState<'desktop'|'mobile'>('desktop'),[showPages,setShowPages]=useState(false),[frameHeight,setFrameHeight]=useState(640);
 async function load(){try{const d=await request('site-forms');setData(d);setCfg(d.config);setDirty(false)}catch(e){notice((e as Error).message)}}
 useEffect(()=>{load()},[]);// eslint-disable-line react-hooks/exhaustive-deps
 const edit=(fn:(c:FormsConfig)=>FormsConfig)=>{setCfg(c=>c&&fn(structuredClone(c)));setDirty(true)};
 const customId=form.startsWith('custom:')?form.slice(7):'',customIndex=cfg?.custom.findIndex(f=>f.id===customId)??-1,custom=customIndex>=0?cfg!.custom[customIndex]:null,active=custom||cfg?.contact;
 const setField=(i:number,patch:Partial<FormField>)=>edit(c=>{const target=customId?c.custom.find(f=>f.id===customId):c.contact;if(target)target.fields[i]={...target.fields[i],...patch};return c});
 const move=(i:number,by:number)=>{const j=i+by;if(!cfg||!active||j<0||j>=active.fields.length)return;edit(c=>{const target=customId?c.custom.find(x=>x.id===customId):c.contact;if(target){const f=target.fields;[f[i],f[j]]=[f[j],f[i]]}return c});setOpen(j)};

 const preview=useMemo(()=>{if(!data||!cfg)return '';const s=data.shell;
  const selected=form.startsWith('custom:')?cfg.custom.find(f=>f.id===form.slice(7))||cfg.contact:cfg.contact;
  const body=form!=='hero'?`<footer class="i-footer" id="contact"><div class="shell-wide i-audit" style="display:block;max-width:680px;margin:0 auto"><form class="estimate-form audit-form i-form reveal">${contactFormInner(selected)}</form></div></footer>`:`<section class="i-hero"><div class="shell-wide i-hero-grid" style="grid-template-columns:1fr"><div class="i-hero-copy"><form class="hero-proposal" id="proposal">${heroFormInner(cfg.hero)}</form></div></div><div class="i-hero-line" aria-hidden="true"><span></span><span></span><span></span><span></span></div></section>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${s.styles.map((h:string)=>`<link rel="stylesheet" href="${esc(h)}">`).join('')}<style>.reveal{opacity:1!important;transform:none!important}html,body{margin:0;background:#f8f9fa}.i-footer{padding:28px 0!important;margin:0!important}.i-hero{padding:28px 0 0!important}form{pointer-events:none}</style></head><body${s.bodyAttrs}><div class="concept concept-i is-visible">${body}</div></body></html>`},[data,cfg,form]);

 async function save(){if(!cfg)return;setBusy(true);try{const r=await request('configuration',{key:'forms',value:cfg,revision:data.revision});setData({...data,revision:r.revision,saved:{contact:true,hero:true}});setDirty(false);notice('Forms published. Every page now uses these fields.')}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 function add(type:FieldType){if(cfg&&active)setOpen(active.fields.length);edit(c=>{const target=customId?c.custom.find(f=>f.id===customId):c.contact;if(!target)return c;const label=type==='tel'?'Phone number':type==='textarea'?'Tell us about your project':type==='select'?'New dropdown':'New field';let name=slug(label),n=2;while(target.fields.some(f=>f.name===name))name=slug(label)+'_'+n++;target.fields.push({name,label,type,placeholder:'',required:false,options:type==='select'?['Option 1','Option 2']:[],width:'full'});return c})}
 function createCustom(){if(!cfg)return;let n=cfg.custom.length+1,id=`custom-form-${n}`;while(cfg.custom.some(f=>f.id===id))id=`custom-form-${++n}`;edit(c=>{c.custom.push({...structuredClone(c.contact),id,title:`Custom form ${n}`,enabled:true});return c});setForm('custom:'+id);setOpen(0);setShowPages(false)}

 if(!data||!cfg)return <p role="status">Loading forms…</p>;
 const pages=(form.startsWith('custom:')?[]:data.pages[form]||[]) as {route:string;label:string}[];
 const list=[...cfg.custom.map(f=>({id:'custom:'+f.id,title:f.title,where:'Wiederverwendbares Formular · ID '+f.id,count:0,fields:f.fields.length+' Felder',saved:true,custom:true})),{id:'contact',title:'AROZ-Projektanfrage',where:'Kontaktformulare auf der Website',count:data.pages.contact.length,fields:cfg.contact.fields.length+' Felder',saved:data.saved.contact,custom:false},...(data.pages.hero.length?[{id:'hero',title:'Schnellanfrage',where:'Formulare im Hero-Bereich',count:data.pages.hero.length,fields:'1 Feld',saved:data.saved.hero,custom:false}]:[])];
 return <div className="av-forms">
  <section className="av-forms-index"><div className="av-content-intro"><div><h2>Reusable custom forms</h2><p>Create a form once, preview it immediately, then insert it as a Form block on any page. Every submission reaches the same secure lead inbox.</p></div><Button type="button" onClick={createCustom}><Plus/>New custom form</Button></div><div className="av-forms-list">{list.map(f=><button key={f.id} type="button" className={'vault-card av-form-card'+(form===f.id?' selected':'')+(f.custom?' custom':' built-in')} onClick={()=>{if(dirty&&form!==f.id&&!confirm('Switch forms? Unpublished changes stay in place until you publish or reload.'))return;setForm(f.id);setOpen(null);setShowPages(false)}}><span className="av-form-dot"/><strong>{f.title}</strong><small>{f.where}{f.count?` · on ${f.count} page${f.count===1?'':'s'}`:''} · {f.fields}{!f.saved?' · Uses the original site design':''}</small></button>)}</div></section>
  <div className="av-forms-layout">
   <section className="vault-card av-forms-preview">
    <div className="actions"><h2>Live preview</h2><div className="av-seg" role="group" aria-label="Preview size">{([['desktop',Monitor,'Desktop'],['mobile',Smartphone,'Mobile']] as const).map(([k,I,l])=><button key={k} type="button" className={device===k?'selected':''} onClick={()=>setDevice(k)}><I size={16}/>{l}</button>)}</div></div>
    <div className="av-forms-frame"><iframe title="Form preview" srcDoc={preview} onLoad={e=>{const d=e.currentTarget.contentDocument;const fit=()=>setFrameHeight(Math.max(240,d?.documentElement.scrollHeight||0));fit();if(d)new ResizeObserver(fit).observe(d.body)}} style={{width:device==='mobile'?390:'100%',height:frameHeight}}/></div>
    <p className="muted">On {pages.length} page{pages.length===1?'':'s'}. <button type="button" className="av-link" onClick={()=>setShowPages(!showPages)}>{showPages?'Hide':'Show'} pages</button></p>
    {showPages&&<ul className="av-forms-pages">{pages.map(p=><li key={p.route}><a href={p.route} target="_blank" rel="noreferrer">{p.label}</a><small>{p.route}</small></li>)}</ul>}
   </section>
   <section className="vault-card av-forms-fields">
    {form!=='hero'&&active?<>
     {custom&&<div className="av-custom-form-identity"><div><h2>{custom.title}</h2><p>Use this form ID when inserting the form as a page block.</p></div><Button type="button" variant="outline" onClick={()=>{if(confirm(`Remove “${custom.title}”? Existing page blocks using it will no longer render a form.`)){edit(c=>{c.custom.splice(customIndex,1);return c});setForm('contact');setOpen(null)}}}><Trash2/>Remove form</Button><label>Form name<Input value={custom.title} onChange={e=>edit(c=>{c.custom[customIndex].title=e.target.value;return c})}/></label><label>Form ID<Input value={custom.id} pattern="[a-z0-9]+(-[a-z0-9]+)*" onChange={e=>{const next=e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'');edit(c=>{c.custom[customIndex].id=next;return c});setForm('custom:'+next)}}/></label></div>}
    <h2>Felder</h2><p>Name und E-Mail sind erforderlich. Projekt, Website und Thema können Sie ergänzen oder entfernen.</p>
     <ol className="av-field-list">{active.fields.map((f,i)=>{const core=(CORE as readonly string[]).includes(f.name);return <li key={f.name} className={open===i?'open':''}>
      <div className="av-field-head"><button type="button" className="av-field-title" onClick={()=>setOpen(open===i?null:i)} aria-expanded={open===i}><strong>{f.label||'(no label)'}</strong><small>{TYPE_LABEL[f.type]}{f.required?' · required':''}{f.width==='half'?' · half width':''}{NAME_LABEL[f.name]?'':' · added'}</small></button>{core&&<Lock size={14} aria-label="Needed by the site"/>}<span className="actions"><Button variant="ghost" size="icon" aria-label="Move up" disabled={!i} onClick={()=>move(i,-1)}><ArrowUp/></Button><Button variant="ghost" size="icon" aria-label="Move down" disabled={i===active.fields.length-1} onClick={()=>move(i,1)}><ArrowDown/></Button>{!core&&<Button variant="ghost" size="icon" aria-label={'Remove '+f.label} onClick={()=>{if(confirm(`Remove “${f.label}” from this form?`)){edit(c=>{const target=customId?c.custom.find(x=>x.id===customId):c.contact;if(target)target.fields.splice(i,1);return c});setOpen(null)}}}><Trash2/></Button>}</span></div>
      {open===i&&<div className="av-field-body">
       <label>Label<Input value={f.label} onChange={e=>setField(i,{label:e.target.value})}/></label>
       <label>{f.type==='select'?'Prompt shown before a choice':'Placeholder (example text inside the box)'}<Input value={f.placeholder} onChange={e=>setField(i,{placeholder:e.target.value})}/></label>
       {!core&&<label>Type<select value={f.type} onChange={e=>setField(i,{type:e.target.value as FieldType,options:e.target.value==='select'&&!f.options.length?['Option 1','Option 2']:f.options})}>{FIELD_TYPES.filter(t=>t!=='email'&&t!=='url').map(t=><option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</select></label>}
       {f.type==='select'&&<label>Choices <small>one per line</small><Textarea rows={Math.min(10,f.options.length+1)} value={f.options.join('\n')} onChange={e=>setField(i,{options:e.target.value.split('\n')})}/></label>}
       <div className="av-field-row"><label className="inline"><input type="checkbox" checked={f.required} disabled={core} onChange={e=>setField(i,{required:e.target.checked})}/>Required</label><label className="inline"><input type="checkbox" checked={f.width==='half'} onChange={e=>setField(i,{width:e.target.checked?'half':'full'})}/>Half width (sits beside the next half-width field)</label></div>
      </div>}
     </li>})}</ol>
     <div className="av-add"><span>Add a field</span>{(['text','tel','textarea','select'] as FieldType[]).map(t=><Button key={t} variant="outline" size="sm" onClick={()=>add(t)}><Plus/>{TYPE_LABEL[t]}</Button>)}</div>
     <h2>Button &amp; wording</h2>
     <label>Button text<Input value={active.button} onChange={e=>edit(c=>{const target=customId?c.custom.find(x=>x.id===customId):c.contact;if(target)target.button=e.target.value;return c})}/></label>
     <label>Note under the button<Input value={active.note} onChange={e=>edit(c=>{const target=customId?c.custom.find(x=>x.id===customId):c.contact;if(target)target.note=e.target.value;return c})}/></label>
     <label>Request type <small>shown as “Request” on each lead and email subject</small><Input value={active.request} onChange={e=>edit(c=>{const target=customId?c.custom.find(x=>x.id===customId):c.contact;if(target)target.request=e.target.value;return c})}/></label>
    </>:<>
     <h2>Quick ZIP form</h2><p>Visitors enter their business ZIP code before continuing to the complete estimate form.</p>
     <label>Field label <small>read by screen readers</small><Input value={cfg.hero.label} onChange={e=>edit(c=>{c.hero.label=e.target.value;return c})}/></label>
     <label>Placeholder<Input value={cfg.hero.placeholder} onChange={e=>edit(c=>{c.hero.placeholder=e.target.value;return c})}/></label>
     <label>Button text<Input value={cfg.hero.button} onChange={e=>edit(c=>{c.hero.button=e.target.value;return c})}/></label>
    </>}
    <div className="av-forms-save">{dirty&&<Button variant="outline" disabled={busy} onClick={()=>{if(confirm('Discard unpublished form changes?'))load()}}>Discard</Button>}<Button disabled={busy||!dirty||role!=='owner'} onClick={save}>{dirty?'Publish form changes':'No changes yet'}</Button></div>
    {role!=='owner'&&<p className="muted">Only owners can publish form changes.</p>}
   </section>
  </div>
 </div>;
}
