import LoginForm from './login-form';
export const dynamic='force-dynamic';
export const metadata={title:'Sign in | AVAULT',robots:{index:false,follow:false}};
export default function Page(){return <main lang="en" className="av-login"><div className="av-login-card"><img src="/assets/aroz-full-logo.png" alt="AROZ Webdesign Agentur" width="180"/><p className="eyebrow" style={{marginTop:28}}>AROZ WEB DESIGN · WEBSITE MANAGEMENT</p><h1 style={{marginTop:14}}>Sign in to AVAULT</h1><p style={{margin:'14px 0 26px'}}>Sign in with your AROZ administrator account.</p><LoginForm/><p style={{marginTop:24,fontSize:14}}><a href="/">← Back to website</a></p></div></main>}
