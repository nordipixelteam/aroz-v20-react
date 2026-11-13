'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Eye,EyeOff} from 'lucide-react';
import {safeNext} from '../session';
export default function LoginForm(){
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[show,setShow]=useState(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');const f=new FormData(e.currentTarget);try{const r=await fetch('/api/admin/login/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:f.get('email'),password:f.get('password')})});const v=await r.json();if(!r.ok)throw new Error(v.error||'Anmeldung fehlgeschlagen.');location.href=safeNext(new URLSearchParams(location.search).get('next'))}catch(err){setError((err as Error).message);setBusy(false)}}
 return <form onSubmit={submit} style={{display:'grid',gap:18}}><label style={{display:'grid',gap:6,fontSize:14}}>E-Mail<Input type="email" name="email" autoComplete="username" required autoFocus/></label><div style={{display:'grid',gap:6,fontSize:14}}><label htmlFor="av-password">Passwort</label><div className="av-password"><Input id="av-password" type={show?'text':'password'} name="password" autoComplete="current-password" autoCapitalize="none" spellCheck={false} required/><button type="button" className="av-password-toggle" onClick={()=>setShow(!show)} aria-label={show?'Passwort ausblenden':'Passwort anzeigen'} aria-pressed={show} aria-controls="av-password" title={show?'Passwort ausblenden':'Passwort anzeigen'}>{show?<EyeOff size={18} aria-hidden="true"/>:<Eye size={18} aria-hidden="true"/>}</button></div></div>{error&&<p role="alert" style={{color:'#d93025',fontSize:14,margin:0}}>{error}</p>}<Button disabled={busy}>{busy?'Anmeldung läuft…':'Anmelden'}</Button></form>;
}
