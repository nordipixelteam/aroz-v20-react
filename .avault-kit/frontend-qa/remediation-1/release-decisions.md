# AROZ release decisions

## QA-005 · Legal content

The audit's captured production responses for `/datenschutz/` and `/impressum/` contain the same editorial warning as the repository fixtures. The published CMS documents are rendering provisional copy that includes “OUTSTANDING / PUBLICATION BLOCKED”. The warning is inside the page body. It is separate from HTTP access and indexing controls.

The site owner needs to provide approved final versions of both documents and identify who can approve their release. The privacy policy needs verified operator and contact information, the actual purposes and data flows for forms and services, the providers and recipients in use, retention information, and the approved way to exercise rights. The legal notice needs the verified provider identity, contact details, and any registration or tax details the responsible reviewer confirms are required. Review the two approved documents against actual form delivery, hosting, analytics and translation configuration before authorizing publication.

Evidence includes the [privacy response](../production-datenschutz.html), [legal notice response](../production-impressum.html), and fixtures `src/content/datenschutz__index_html.json` and `src/content/impressum__index_html.json`.

## QA-001 · Public domain and indexing

The site owner needs to confirm one public HTTPS hostname, which project URL family should represent duplicate case studies, and the approved list of indexable pages. For the two repaired case-study aliases, the current working targets are `/projekte/4fahrlehrer/` and `/projekte/autoankauf-itrust/`. After domain approval, their recommended canonicals are those exact paths on the approved HTTPS hostname. Use the same host with a trailing slash for canonical public pages such as `/`, `/webdesign/`, and `/kontakt/`. Choose one URL per duplicate case study before making any wider consolidation decisions.

Keep the existing sitemap index at `/sitemap.xml` and its page, post, and image children. Include only the canonical public URLs approved for indexing in the page and post lists, with fully qualified HTTPS locations. Exclude redirects, error and thank-you pages, drafts, and admin routes. Have the production `robots.txt` advertise the sitemap index. Permit crawling of approved pages and keep private environments access-controlled with their existing noindex policy. Apply page-level robots directives and matching canonicals only after written domain and indexing approval. This remediation does not alter the robots, canonical, or sitemap configuration.

[Google Search Central canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) · [Sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) · [Noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
