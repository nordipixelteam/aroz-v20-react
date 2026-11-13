import LoginForm from './login-form';
export const dynamic='force-dynamic';
export const metadata={title:'Anmelden | AVAULT',robots:{index:false,follow:false}};
export default function Page(){return <main className="av-login"><div className="av-login-card"><img src="/assets/aroz-full-logo.png" alt="AROZ Webdesign Agentur" width="180"/><p className="eyebrow" style={{marginTop:28}}>AROZ WEBDESIGN · WEBSITE-VERWALTUNG</p><h1 style={{marginTop:14}}>Bei AVAULT anmelden</h1><p style={{margin:'14px 0 26px'}}>Melden Sie sich mit Ihrem AROZ-Administratorkonto an.</p><LoginForm/><p style={{marginTop:24,fontSize:14}}><a href="/">← Zur Website</a></p></div></main>}
