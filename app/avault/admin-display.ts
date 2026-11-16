// Admin presentation only. Never copy these titles into document labels, fields,
// SEO metadata, templates or published content. No database migration is needed.
export const IMPORTED_PAGE_TITLES:Readonly<Record<string,string>>={
 '/':'Homepage',
 '/agentur/':'About AROZ',
 '/copywriting/':'Website Copywriting',
 '/copywriting/conversion-texte/':'Conversion Copywriting',
 '/copywriting/markenbotschaften/':'Brand Messaging',
 '/copywriting/seo-texte/':'SEO Copywriting',
 '/copywriting/website-texte/':'Website Content',
 '/datenschutz/':'Privacy Policy',
 '/impressum/':'Legal Notice',
 '/ki-seo/':'AI SEO',
 '/ki-seo/entitaeten-seo/':'Entity SEO',
 '/ki-seo/ki-sichtbarkeit/':'AI Visibility',
 '/ki-seo/llm-seo/':'LLM SEO',
 '/ki-seo/strukturierte-inhalte/':'Structured Content',
 '/kontakt/':'Contact',
 '/projects/':'Projects (legacy URL)',
 '/projects/fahrschule-fast-drive/':'Fast Drive Driving School (legacy URL)',
 '/projects/fahrschule-yes/':'YES! Driving School (legacy URL)',
 '/projects/itrust-automobile/':'iTrust Automobile (legacy URL)',
 '/projekte/':'Projects',
 '/projekte/4fahrlehrer/':'4Fahrlehrer',
 '/projekte/autoankauf-itrust/':'iTrust Car Buying',
 '/projekte/fahrschule-fast-drive/':'Fast Drive Driving School',
 '/projekte/fahrschule-yes/':'YES! Driving School',
 '/projekte/itrust-automobile/':'iTrust Automobile',
 '/SEITENUEBERSICHT.html':'All Pages',
 '/seo/':'SEO for Businesses',
 '/seo/lokales-seo/':'Local SEO',
 '/seo/seo-fuer-websites/':'Website SEO',
 '/seo/seo-relaunch/':'SEO for Website Relaunches',
 '/seo/technisches-seo/':'Technical SEO',
 '/webdesign/':'Web Design for Businesses',
 '/webdesign/conversion-webdesign/':'Conversion Web Design',
 '/webdesign/website-erstellen-lassen/':'Website Creation',
 '/webdesign/website-kosten/':'Website Costs',
 '/webdesign/website-relaunch/':'Website Relaunch',
 '/webdesign/wordpress-webdesign/':'WordPress Web Design',
};

export function adminTitle(doc:{route:string;label?:string}|null|undefined):string{
 if(!doc)return '';
 return IMPORTED_PAGE_TITLES[doc.route]||doc.label||doc.route;
}

export function adminDate(value?:string|null):string{
 if(!value)return '—';
 const date=new Date(value);
 return Number.isNaN(date.getTime())?'—':date.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
}
