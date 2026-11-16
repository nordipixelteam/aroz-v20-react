import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {translatePage,translateDocument,translateHtml} from './english-content.mjs';

test('all 37 source pages have English metadata without changing URLs',()=>{
 const files=fs.readdirSync('src/content').filter(f=>f.endsWith('.json'));assert.equal(files.length,37);
 for(const file of files){
  const before=JSON.parse(fs.readFileSync(`src/content/${file}`,'utf8')),after=translatePage(before);
  assert.equal(after.lang,'en');assert.equal(after.path,before.path);
  for(const attr of ['href','src','id'])assert.deepEqual([...after.html.matchAll(new RegExp(`\\b${attr}="([^"]*)"`,'g'))].map(m=>m[1]),[...before.html.matchAll(new RegExp(`\\b${attr}="([^"]*)"`,'g'))].map(m=>m[1]),`${file}: ${attr}`);
 }
});

test('draft changes remain independent from published content',()=>{
 const base={route:'/kontakt/',label:'Kontakt',template:'<html lang="de"><p>{{f0}}</p></html>',fields:[{key:'f0',kind:'text',value:'Kontakt',section:'Kontakt'}],seo:{title:'Kontakt',description:'',canonical:'https://example.com/kontakt/'},links:['/kontakt/'],ids:[],images:[],revision:4};
 const draft={...structuredClone(base),fields:[{...base.fields[0],value:'Unpublished editorial note'}]};
 const published=translateDocument(base,{}),translatedDraft=translateDocument(draft,{});
 assert.equal(published.fields[0].value,'Contact');assert.equal(translatedDraft.fields[0].value,'Unpublished editorial note');
 assert.notDeepEqual(translatedDraft,published);assert.deepEqual(translatedDraft.links,draft.links);assert.equal(translatedDraft.seo.canonical,draft.seo.canonical);
});

test('split headings translate in context, retaining markup and URLs',()=>{
 const html='<h1>Vier<br><span>Disziplinen.</span>Ein Auftritt</h1><a href="/datenschutz/">Datenschutz</a>';
 assert.equal(translateHtml(html),'<h1>Four<br><span>disciplines.</span>One presence</h1><a href="/datenschutz/">Privacy Policy</a>');
});

test('shared heading fragments keep their meaning and translation is idempotent',()=>{
 const page={path:'index.html',html:'<h2 id="ansatz-title">Erst verstehen.<br/>Dann <span>gestalten.</span></h2>',title:'',description:'',styles:[],scripts:[]};
 const translated=translatePage(page);
 assert.match(translated.html,/Understand first\.<br\/>Then <span>design\.<\/span>/);
 assert.deepEqual(translatePage(translated),translated);
 const doc={route:'/agentur/',label:'Agency',template:'<html lang="en"></html>',fields:[{key:'f130',kind:'text',value:'Understand first.',section:'Understand first.'},{key:'f131',kind:'text',value:'Then design.',section:'Then design.'}],seo:{},images:[]};
 const next=translateDocument(doc,{});assert.equal(next.fields[0].value,"Don't start with design.");assert.equal(next.fields[1].value,'Understand first.');
 assert.deepEqual(translateDocument(next,{}),next);
});

test('Google Translate makes no request until a non-English choice, then dispatches translation',async()=>{
 const handlers={},scripts=[],status={textContent:''},cookies=[];let requestedLanguage,disconnected=false,mutation;
 const picker={value:'en',addEventListener:(name,fn)=>{handlers[name]=fn}};
 const select={value:'',options:[],dispatchEvent(){requestedLanguage=this.value}};
 let widgetReady=false;
 const root={querySelector:()=>widgetReady?select:null};
 const document={querySelector:selector=>selector==='#aroz-language'?picker:selector==='[data-translate-status]'?status:root,createElement:()=>({}),head:{append:script=>scripts.push(script)},set cookie(v){cookies.push(v)}};
 const context={document,location:{pathname:'/kontakt/',hostname:'localhost',reload(){}},window:{},setTimeout,clearTimeout,Event:class {},MutationObserver:class{constructor(fn){mutation=fn}observe(){}disconnect(){disconnected=true}}};
 vm.runInNewContext(fs.readFileSync('public/aroz-translate.js','utf8'),context);
 assert.equal(scripts.length,0);assert.ok(cookies.every(c=>c.includes('Max-Age=0')));
 picker.value='de';const pending=handlers.change();assert.equal(scripts.length,1);assert.match(scripts[0].src,/^https:\/\/translate.google.com\//);
 context.window.google={translate:{TranslateElement:class{constructor(options){assert.equal(options.pageLanguage,'en');assert.equal(options.autoDisplay,false);widgetReady=true}}}};
 context.window.arozTranslateReady();await Promise.resolve();assert.equal(requestedLanguage,undefined,'Wait for Google to populate its initially empty selector');
 select.options=[{value:''},{value:'de'}];mutation();await pending;assert.equal(requestedLanguage,'de');assert.equal(disconnected,true);
});

test('Google controller does not run on dashboard routes',()=>{
 vm.runInNewContext(fs.readFileSync('public/aroz-translate.js','utf8'),{location:{pathname:'/avault/'}});
});

test('native validation feedback is English and clears when corrected',()=>{
 const handlers={};let message='';
 const field={type:'email',validity:{valueMissing:false,typeMismatch:true},setCustomValidity(value){message=value;this.validity.customError=!!value}};
 vm.runInNewContext(fs.readFileSync('public/english-validation.js','utf8'),{document:{addEventListener:(name,fn)=>{handlers[name]=fn}}});
 handlers.invalid({target:field});assert.equal(message,'Please enter a valid email address.');
 handlers.input({target:field});assert.equal(message,'');
 field.validity={valueMissing:true};handlers.invalid({target:field});assert.equal(message,'Please fill in this field.');
 handlers.change({target:field});assert.equal(message,'');
 field.validity={customError:true};field.setCustomValidity('Specific English error.');handlers.invalid({target:field});assert.equal(message,'Specific English error.');
});

test('contact submission reveals English feedback hidden by the imported CSS',async()=>{
 const handlers={},classes=new Set(['form-success']);let reset=false;
 const status={hidden:true,textContent:'',dataset:{},classList:{contains:value=>classes.has(value),add:value=>classes.add(value)},focus(){}};
 class Form{
  matches(){return true}
  reportValidity(){return true}
  querySelector(selector){return selector==='[type="submit"]'?{disabled:false}:status}
  reset(){reset=true}
 }
 const context={document:{querySelectorAll:()=>[{dataset:{avaultForm:'contact'}}],addEventListener:(name,fn)=>{handlers[name]=fn},referrer:''},location:{href:'http://localhost:3000/kontakt/'},HTMLFormElement:Form,FormData:class{entries(){return [['name','Local English Test'],['email','test@example.com']]}},setTimeout,fetch:async url=>({ok:true,json:async()=>url.includes('/token/')?{token:(Date.now()-10000)+'.dummy'}:{ok:true,message:'Thank you. Your project enquiry has been sent securely.'}})};
 vm.runInNewContext(fs.readFileSync('public/avault-forms.js','utf8'),context);
 await handlers.submit({target:new Form(),preventDefault(){},stopImmediatePropagation(){}});
 assert.equal(status.textContent,'Thank you. Your project enquiry has been sent securely.');
 assert.equal(status.hidden,false);assert.ok(classes.has('show'));assert.equal(reset,true);
});
