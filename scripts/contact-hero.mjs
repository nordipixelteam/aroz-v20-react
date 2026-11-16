import assert from'node:assert/strict';
export function integrateContactHero(html){
 return html.replace(/<section\b[^>]*data-av-hero="shared"[\s\S]*?<\/section>/,hero=>{
  if(hero.includes('data-contact-photo="integrated"'))return hero;
  const media=hero.match(/<figure\b[^>]*class="hero-media"[^>]*>[\s\S]*?<\/figure>/)?.[0];assert.ok(media,'Contact hero photo is missing');
  const photo=media.replace('<img ','<img width="1600" height="1067" ');
  return hero.replace(media,'').replace(/^(<section\b[^>]*)(>)/,'$1 data-contact-photo="integrated">'+photo);
 });
}
