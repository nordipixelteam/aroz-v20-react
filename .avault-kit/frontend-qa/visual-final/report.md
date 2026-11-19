# AROZ Phase 1 final visual corrections

Branch `feature/avault-development`. Both routes share the same imported Fahrschule YES template structure. This pass changed two existing Phase 1 source files and preserved the unrelated `next-env.d.ts` modification byte for byte.

## QA-013 · Duplicate navigation

Both imported case-study documents rendered a fixed `nav.nav` with `aria-label="Main navigation"` as well as the shared `header.v3-nav`. The legacy rule positions `.nav` at the top of the viewport, where it sat behind the current header. The case-study inline script drives the story steps and panels. The shared `public/assets/v5-navigation.js` drives the current header, dialog, focus, and compact state.

At `lib/avault/render.ts:44–48`, the public renderer removes the legacy nav only for the two YES paths and only when a shared header is present. The exact legacy class and navigation label identify the element. The stored templates and canvas markup are preserved. The change leaves the footer, case-study links, existing H1 correction and shared header JavaScript in place.

## QA-011 · Manifesto contrast

The affected element is `.manifesto > .wrap > .big:not(.outline)`, whose content is “WITHOUT PRESSURE.”. The imported text rule set `#f3f0ea`, and the shared surface rule in `public/assets/v14-type-palette.css:25` set the background to `#f1f1f1`. This was a mismatched color assignment on a light surface.

`public/assets/qa-accessibility.css:93` applies `#29252b` to the filled manifesto line on case studies. The original background, outline treatment, font and story animation are preserved. The measured contrast is **13.34:1** against `#f1f1f1`, above both AA text thresholds.

## Before and after

| Route | Before at 768 × 1024 | After at 768 × 1024 | Scrolled contrast |
| --- | --- | --- | --- |
| `/projects/fahrschule-yes/` | [Before](../commit-readiness/projects__fahrschule-yes-768.png) | [After](projects-768x1024-header.png) | [Text section](projects-768x1024-manifesto.png) |
| `/projekte/fahrschule-yes/` | [Before](../commit-readiness/projekte__fahrschule-yes-768.png) | [After](projekte-768x1024-header.png) | [Text section](projekte-768x1024-manifesto.png) |

## Regression results

QA-011 and QA-013 passed the visual and browser retests on both URLs. The 14 route and viewport combinations each recorded one shared header, zero legacy navs, zero Tab stops in the legacy nav, working logo and menu hit targets, Enter to open, Escape to close, and focus return. The browser found no document-level horizontal overflow or JavaScript runtime errors and retained the case-study H1 and project content links. Four images were loaded in each case-study sample and no image that completed loading failed.

| Viewport | English path | German path |
| --- | --- | --- |
| 320 × 568 | PASS | PASS |
| 375 × 812 | PASS | PASS |
| 390 × 844 | PASS | PASS |
| 768 × 1024 | PASS | PASS |
| 1024 × 768 | PASS | PASS |
| 1440 × 900 | PASS | PASS |
| 1920 × 1080 | PASS | PASS |

Normal-motion scrolling was exercised at all sizes. At 1024 px and above, scrolling activated story step 2 and its matching panel. At the narrower sizes the layout retained its stacked story presentation. The measured manifesto text stayed visible at 13.34:1 in every scrolled sample. All 14 axe WCAG A/AA scans reported zero violations. The 768 px screenshots for both routes and the 1024 px header were inspected manually. The color selector matched no elements on the homepage, agency, Fast Drive case study or AI SEO landing page.

The production build passed webpack compilation, TypeScript checking, page generation and output tracing in an isolated copy. Seven existing form and security tests passed. Targeted ESLint and `git diff --check` passed. [Build log](build.log) · [Browser results](browser.json)

QA-001 remains pending the public domain and indexing decision. QA-005 remains pending approved legal copy and publication authorization. Actual form storage and email delivery remain unverified. No commit, push, merge, pull request, deployment or production data change occurred.
