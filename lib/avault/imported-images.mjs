// Originals retained in the imported pages' public asset folders. Only aliases that were 404s
// are listed: existing /assets files and uploaded /media files must keep their current URLs.
export const IMPORTED_IMAGE_ALIASES=Object.freeze({
 '/assets/aroz-slash.webp':'/agentur/assets/aroz-slash.webp',
 '/assets/hero-team.webp':'/agentur/assets/hero-team.webp',
 '/assets/work-dark.webp':'/agentur/assets/work-dark.webp',
 '/assets/founder-adem.webp':'/agentur/assets/founder-adem.webp',
 '/assets/founder-renato.webp':'/agentur/assets/founder-renato.webp',
 '/assets/aroz-mark.webp':'/agentur/assets/aroz-mark.webp',
 '/assets/steps.webp':'/agentur/assets/steps.webp',
 '/assets/aroz-slash.png':'/webdesign/assets/aroz-slash.png',
 '/assets/red-chairs.webp':'/agentur/assets/red-chairs.webp',
 '/assets/aroz-a.webp':'/agentur/assets/aroz-a.webp',
 '/assets/team-red.webp':'/webdesign/assets/team-red.webp',
 '/assets/walk.webp':'/agentur/assets/walk.webp',
 '/assets/aroz-a-mark.png':'/webdesign/assets/aroz-a-mark.png',
 '/assets/team-contact.webp':'/kontakt/assets/team-contact.webp',
 '/assets/office-detail.webp':'/kontakt/assets/office-detail.webp',
 '/assets/yes-project-cover.png':'/projekte/fahrschule-yes/assets/yes-project-cover.png',
 '/assets/fastdrive.webp':'/projekte/assets/fastdrive.webp',
 '/assets/itrust.webp':'/projekte/assets/itrust.webp',
 '/assets/hero-project.webp':'/webdesign/assets/hero-project.webp',
 '/assets/project-dark.webp':'/webdesign/assets/project-dark.webp',
 '/assets/seo-team.webp':'/seo/assets/seo-team.webp',
 '/assets/seo-detail.webp':'/seo/assets/seo-detail.webp',
 '/assets/team-steps.webp':'/webdesign/assets/team-steps.webp',
 '/assets/project-auto.webp':'/webdesign/assets/project-auto.webp',
});

export function importedImageUrl(value,sourceRoute='/'){
 const url=String(value||''),pathname=url.split(/[?#]/,1)[0];
 if(!Object.hasOwn(IMPORTED_IMAGE_ALIASES,pathname))return url;
 // This filename has a different original on the web-design page. Preserve that version in
 // page rendering/imports, while direct legacy links use the agency/project version.
 const target=pathname==='/assets/aroz-mark.webp'&&sourceRoute.startsWith('/webdesign/')?'/webdesign/assets/aroz-mark.webp':IMPORTED_IMAGE_ALIASES[pathname];
 return target+url.slice(pathname.length);
}
