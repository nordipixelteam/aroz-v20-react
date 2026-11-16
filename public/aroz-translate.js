(() => {
 'use strict';
 if(location.pathname.startsWith('/avault'))return;
 const picker=document.querySelector('#aroz-language');
 const status=document.querySelector('[data-translate-status]');
 if(!picker||!status)return;
 // Do not auto-restore a previous Google translation on a fresh page load.
 for(const domain of ['',location.hostname,'.'+location.hostname]){
  document.cookie=`googtrans=; Max-Age=0; Path=/${domain?`; Domain=${domain}`:''}`;
 }
 let loading;
 function load(){
  if(loading)return loading;
  loading=new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   const timer=setTimeout(()=>reject(new Error('Google Translate did not respond. Please try again.')),15000);
   window.arozTranslateReady=()=>{
    try{
     new window.google.translate.TranslateElement({pageLanguage:'en',autoDisplay:false},'aroz-google-translate');
     // Google adds its language selector asynchronously after its callback.
     const root=document.querySelector('#aroz-google-translate');
     const ready=()=>{const select=root.querySelector('select.goog-te-combo');if(!select||select.options.length<2)return;clearTimeout(timer);observer.disconnect();resolve(select)};
     const observer=new MutationObserver(ready);observer.observe(root,{childList:true,subtree:true});ready();
    }catch(error){clearTimeout(timer);reject(error)}
   };
   script.src='https://translate.google.com/translate_a/element.js?cb=arozTranslateReady';
   script.async=true;
   script.onerror=()=>{clearTimeout(timer);reject(new Error('Google Translate could not load. Check your connection and try again.'))};
   document.head.append(script);
  }).catch(error=>{loading=undefined;throw error});
  return loading;
 }
 let choice=0;
 picker.addEventListener('change',async()=>{
  const language=picker.value,token=++choice;
  if(language==='en'){location.reload();return}
  status.textContent='Loading Google Translate…';
  try{
   const select=await load();if(token!==choice)return;
   select.value=language;
   if(select.value!==language)throw new Error('This language is unavailable. Please choose another language.');
   select.dispatchEvent(new Event('change',{bubbles:true}));
   status.textContent='Google Translate is translating this page. English remains the original version.';
  }catch(error){if(token===choice)status.textContent=error.message}
 });
})();
