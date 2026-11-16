export function fixAiScript(script){return script.replace("const hero=document.querySelector('.hero'),heroStage=", "const hero=document.querySelector('.hero:not([data-av-hero=\"shared\"])'),heroStage=");}
export function fixAiAssets(text){return text.replace(/url\((['"]?)assets\/(aroz-a-mark|aroz-slash)\.png\1\)/g,"url('/ki-seo/assets/$2.png')");}
