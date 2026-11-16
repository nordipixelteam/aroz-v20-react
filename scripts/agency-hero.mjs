import assert from 'node:assert/strict';

// Move the original field-backed photo, rather than introducing a second image.
export function integrateAgencyHero(html){
 return html.replace(/<section\b[^>]*data-av-hero="shared"[\s\S]*?<\/section>/,hero=>{
  if(hero.includes('data-agency-photo="integrated"'))return hero;
  const media=hero.match(/<div\b[^>]*class="hero-media"[^>]*>[\s\S]*?<\/div>/)?.[0];
  assert.ok(media,'Agency hero photo is missing');
  const photo=media.replace(/height="1540"/,'height="1084"').replace(/width="1048"/,'width="960"');
  return hero.replace(media,'').replace(/^(<section\b[^>]*)(>)/,'$1 data-agency-photo="integrated">'+photo);
 });
}
