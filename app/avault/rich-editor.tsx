'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {useEditor,EditorContent,type Editor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import {TableKit} from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import {TextStyle,Color} from '@tiptap/extension-text-style';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import {Bold,Italic,Underline,Strikethrough,Highlighter,Superscript as Sup,Subscript as Sub,Code,List,ListOrdered,Indent,Outdent,AlignLeft,AlignCenter,AlignRight,AlignJustify,Quote,SquareCode,Minus,Link2,Unlink,ImagePlus,Table as TableIcon,Undo2,Redo2,RemoveFormatting,Rows3,Columns3,Trash2,Merge,Split} from 'lucide-react';
import type {Doc} from '@/lib/avault/store';
import {ClassificationTools} from './content-tools';
import {notify} from './toast';

// A blog post edited the way it looks live: the article header (eyebrow, title, intro, byline) as styled
// inputs, and the body as rich text inside the site's own article typography.
const COLORS=[['Default',''],['Brand navy','#062744'],['Brand red','#cc293c'],['Ink','#142c40'],['Slate','#5e6d79']];

function Tool({on,active,disabled,label,children}:{on:()=>void;active?:boolean;disabled?:boolean;label:string;children:React.ReactNode}){return <button type="button" className={'av-tool'+(active?' on':'')} title={label} aria-label={label} aria-pressed={active} disabled={disabled} onMouseDown={e=>e.preventDefault()} onClick={on}>{children}</button>}

function Toolbar({editor,upload}:{editor:Editor;upload:(f:File)=>Promise<string>}){const [,force]=useState(0);useEffect(()=>{const f=()=>force(n=>n+1);editor.on('transaction',f);return()=>{editor.off('transaction',f)}},[editor]);
 const c=()=>editor.chain().focus();const inTable=editor.isActive('table');const file=useRef<HTMLInputElement>(null);
 const block=editor.isActive('heading',{level:2})?'h2':editor.isActive('heading',{level:3})?'h3':editor.isActive('heading',{level:4})?'h4':'p';
 function link(){const prev=editor.getAttributes('link');const href=prompt('Link to: a page like /local-seo/, a full https:// address, mailto: or tel:',prev.href||'/');if(href===null)return;if(!href){c().unsetLink().run();return}
  const external=/^https?:/i.test(href);const newTab=confirm(external?'Open in a new tab?':'Open in a new tab? (Usually No for your own pages.)');const rel=[...(external&&confirm('Add nofollow? Use for links you don’t vouch for.')?['nofollow']:[]),...(external&&confirm('Is it a paid or affiliate link (sponsored)?')?['sponsored']:[])];
  c().extendMarkRange('link').setLink({href,target:newTab?'_blank':null,rel:[...(newTab?['noopener','noreferrer']:[]),...rel].join(' ')||null}).run()}
 async function image(f?:File){try{let src='';if(f)src=await upload(f);else{src=prompt('Image URL (/media/… or https://…). Or cancel and use Upload.','')||''}if(!src)return;const alt=prompt('Describe the image for people who can’t see it (leave empty only if purely decorative):','')??'';c().setImage({src,alt}).run()}catch(e){notify((e as Error).message)}}
 return <div className="av-toolbar" role="toolbar" aria-label="Article formatting">
  <select aria-label="Text style" value={block} onChange={e=>{const v=e.target.value;if(v==='p')c().setParagraph().run();else c().setHeading({level:+v.slice(1) as 2|3|4}).run()}}><option value="p">Paragraph</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option><option value="h4">Heading 4</option></select>
  <span className="av-sep"/>
  <Tool label="Bold" active={editor.isActive('bold')} on={()=>c().toggleBold().run()}><Bold size={16}/></Tool><Tool label="Italic" active={editor.isActive('italic')} on={()=>c().toggleItalic().run()}><Italic size={16}/></Tool><Tool label="Underline" active={editor.isActive('underline')} on={()=>c().toggleUnderline().run()}><Underline size={16}/></Tool><Tool label="Strikethrough" active={editor.isActive('strike')} on={()=>c().toggleStrike().run()}><Strikethrough size={16}/></Tool><Tool label="Highlight" active={editor.isActive('highlight')} on={()=>c().toggleHighlight().run()}><Highlighter size={16}/></Tool>
  <select aria-label="Text colour" value={editor.getAttributes('textStyle').color||''} onChange={e=>e.target.value?c().setColor(e.target.value).run():c().unsetColor().run()}>{COLORS.map(([l,v])=><option key={l} value={v}>{l==='Default'?'Colour':l}</option>)}</select>
  <Tool label="Superscript" active={editor.isActive('superscript')} on={()=>c().toggleSuperscript().run()}><Sup size={16}/></Tool><Tool label="Subscript" active={editor.isActive('subscript')} on={()=>c().toggleSubscript().run()}><Sub size={16}/></Tool><Tool label="Inline code" active={editor.isActive('code')} on={()=>c().toggleCode().run()}><Code size={16}/></Tool>
  <span className="av-sep"/>
  <Tool label="Bulleted list" active={editor.isActive('bulletList')} on={()=>c().toggleBulletList().run()}><List size={16}/></Tool><Tool label="Numbered list" active={editor.isActive('orderedList')} on={()=>c().toggleOrderedList().run()}><ListOrdered size={16}/></Tool><Tool label="Indent" disabled={!editor.can().sinkListItem('listItem')} on={()=>c().sinkListItem('listItem').run()}><Indent size={16}/></Tool><Tool label="Outdent" disabled={!editor.can().liftListItem('listItem')} on={()=>c().liftListItem('listItem').run()}><Outdent size={16}/></Tool>
  <span className="av-sep"/>
  {([['left',AlignLeft],['center',AlignCenter],['right',AlignRight],['justify',AlignJustify]] as const).map(([a,I])=><Tool key={a} label={'Align '+a} active={editor.isActive({textAlign:a})} on={()=>c().setTextAlign(a).run()}><I size={16}/></Tool>)}
  <span className="av-sep"/>
  <Tool label="Quote" active={editor.isActive('blockquote')} on={()=>c().toggleBlockquote().run()}><Quote size={16}/></Tool><Tool label="Code block" active={editor.isActive('codeBlock')} on={()=>c().toggleCodeBlock().run()}><SquareCode size={16}/></Tool><Tool label="Divider line" on={()=>c().setHorizontalRule().run()}><Minus size={16}/></Tool>
  <Tool label="Link" active={editor.isActive('link')} on={link}><Link2 size={16}/></Tool><Tool label="Remove link" disabled={!editor.isActive('link')} on={()=>c().unsetLink().run()}><Unlink size={16}/></Tool>
  <Tool label="Insert image from URL" on={()=>image()}><ImagePlus size={16}/></Tool><button type="button" className="av-tool av-tool-text" onMouseDown={e=>e.preventDefault()} onClick={()=>file.current?.click()}>Upload image</button><input ref={file} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(f)image(f)}}/>
  <Tool label="Insert table" on={()=>c().insertTable({rows:3,cols:3,withHeaderRow:true}).run()}><TableIcon size={16}/></Tool>
  {inTable&&<><Tool label="Add row below" on={()=>c().addRowAfter().run()}><Rows3 size={16}/></Tool><Tool label="Add column right" on={()=>c().addColumnAfter().run()}><Columns3 size={16}/></Tool><button type="button" className="av-tool av-tool-text" onClick={()=>c().deleteRow().run()}>− row</button><button type="button" className="av-tool av-tool-text" onClick={()=>c().deleteColumn().run()}>− column</button><button type="button" className="av-tool av-tool-text" onClick={()=>c().toggleHeaderRow().run()}>Header row</button><Tool label="Merge cells" disabled={!editor.can().mergeCells()} on={()=>c().mergeCells().run()}><Merge size={16}/></Tool><Tool label="Split cell" disabled={!editor.can().splitCell()} on={()=>c().splitCell().run()}><Split size={16}/></Tool><Tool label="Delete table" on={()=>c().deleteTable().run()}><Trash2 size={16}/></Tool></>}
  <span className="av-sep"/>
  <Tool label="Clear formatting" on={()=>c().unsetAllMarks().clearNodes().run()}><RemoveFormatting size={16}/></Tool><Tool label="Undo" disabled={!editor.can().undo()} on={()=>c().undo().run()}><Undo2 size={16}/></Tool><Tool label="Redo" disabled={!editor.can().redo()} on={()=>c().redo().run()}><Redo2 size={16}/></Tool>
 </div>}

// One editable run of header text. Uncontrolled while typing (so the caret never jumps), synced when the value changes elsewhere.
function Piece({value,accent,label,onChange}:{value:string;accent:boolean;label:string;onChange:(v:string)=>void}){const ref=useRef<HTMLSpanElement>(null);
 useEffect(()=>{if(ref.current&&ref.current.textContent!==value)ref.current.textContent=value},[value]);
 return <span ref={ref} className={'av-piece'+(accent?' accent':'')} role="textbox" aria-label={label} contentEditable="plaintext-only" suppressContentEditableWarning spellCheck onInput={e=>onChange((e.currentTarget.textContent||'').replace(/\s*\n\s*/g,' '))} onKeyDown={e=>{if(e.key==='Enter')e.preventDefault()}}/>}
export function PostEditor({doc,change,upload}:{doc:Doc;change:(d:Doc)=>void;upload:(f:File)=>Promise<string>}){
 const docRef=useRef(doc);useLayoutEffect(()=>{docRef.current=doc});
 const editor=useEditor({immediatelyRender:false,extensions:[StarterKit.configure({heading:{levels:[2,3,4]},link:{openOnClick:false,autolink:true,HTMLAttributes:{target:null,rel:null}}}),Image.configure({HTMLAttributes:{loading:'lazy'}}),TableKit.configure({table:{resizable:false}}),TextAlign.configure({types:['heading','paragraph']}),Highlight,TextStyle,Color,Subscript,Superscript],
  content:doc.body||'<p></p>',editorProps:{attributes:{'aria-label':'Article body','class':'av-prose'}},onUpdate:({editor})=>change({...docRef.current,body:editor.getHTML()})});
 // Switching posts (or restoring a revision) replaces the editor content without adding an undo step.
 useEffect(()=>{if(editor&&!editor.isDestroyed&&editor.getHTML()!==(doc.body||'<p></p>'))editor.commands.setContent(doc.body||'<p></p>',{emitUpdate:false})},[doc.route,doc.revision]);// eslint-disable-line react-hooks/exhaustive-deps
 // Each header element keeps its pieces in template order; pieces inside .heading-accent use the accent colour.
 const part=(re:RegExp)=>{const html=doc.template.match(re)?.[0]||'';const accent=new Set([...(html.match(/<span class="heading-accent">[\s\S]*?<\/span>/g)||[]).join('').matchAll(/\{\{(f\d+)\}\}/g)].map(m=>m[1]));return [...html.matchAll(/\{\{(f\d+)\}\}/g)].map(m=>doc.fields.find(f=>f.key===m[1])).filter(Boolean).map(f=>({f:f!,accent:accent.has(f!.key)}))};
 const eyebrow=part(/<p class="article-eyebrow">[\s\S]*?<\/p>/),title=part(/<h1>[\s\S]*?<\/h1>/),deck=part(/<p class="article-deck">[\s\S]*?<\/p>/),meta=part(/<div class="article-meta">[\s\S]*?<\/div>/);
 const field=(key:string,value:string)=>change({...docRef.current,fields:docRef.current.fields.map(f=>f.key===key?{...f,value}:f)});
 const pieces=(items:{f:any;accent:boolean}[],cls:string,label:string)=>items.length>0&&<div className={cls} role="group" aria-label={label}>{items.map(({f,accent})=><Piece key={f.key} value={f.value} accent={accent} label={label+(accent?' (accent colour)':'')} onChange={v=>field(f.key,v)}/>)}</div>;
 const tint=/blog-(yellow|blue|red|green)/.exec(doc.template)?.[1]||'yellow';
 const words=(editor?.getText()||'').trim().split(/\s+/).filter(Boolean).length;
 return <><div className="av-post">
  <div className={'av-post-canvas blog-'+tint}>
   <header className="av-post-header">{pieces(eyebrow,'av-post-eyebrow','Eyebrow')}{pieces(title,'av-post-title','Title (H1)')}{pieces(deck,'av-post-deck','Introduction')}{pieces(meta,'av-post-meta','Byline, date and reading time')}</header>
   {editor&&<Toolbar editor={editor} upload={upload}/>}
   <div className="article-body av-post-body"><EditorContent editor={editor}/></div>
  </div>
  <p className="av-post-count">{words} words · about {Math.max(1,Math.round(words/220))} min read. Paste from Word or Google Docs keeps headings, lists, links and tables and drops everything else.</p>
  <p className="av-post-count">“Keep exploring” links at the end of the post are chosen automatically from related posts.</p>
 </div><ClassificationTools doc={doc} onChange={change} notice={notify}/></>}
