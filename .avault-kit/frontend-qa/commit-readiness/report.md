# AROZ Phase 1 commit readiness

**Follow-up:** The QA-011 and QA-013 hold recorded below was cleared by the final visual corrections and the seven-viewport retest. This report remains the pre-correction record. [Final visual regression report](../visual-final/report.md)

**Branch** `feature/avault-development`. The working tree remains unstaged. The pre-existing `next-env.d.ts` development-types change was preserved. Build and browser evidence was written under the ignored audit directory. No application source was edited during this pass.

**Readiness** The isolated production build and form tests pass. Full Phase 1 sign-off is pending the case-study header overlap. The existing desktop navigation fix passed on the sampled controls, but both Fahrschule YES variants still render a legacy navigation underneath the shared header. The overlap is plainly visible at 768 × 1024. It was also visible in the previous remediation screenshots. [English-path screenshot](projects__fahrschule-yes-768.png) · [German-path screenshot](projekte__fahrschule-yes-768.png) · [Header rectangles at all six viewports](tablet-header.json)

## Retest results

Chrome captured all six requested viewports on 16 targeted routes, yielding 96 route screenshots. The viewport order is 320 × 568, 375 × 812, 390 × 844, 768 × 1024, 1440 × 900 and 1920 × 1080. The sheets include real browser captures, scaled for comparison. The JSON records the original geometry. [Sheet 1](visual-0.jpg) · [Sheet 2](visual-1.jpg) · [Sheet 3](visual-2.jpg) · [Sheet 4](visual-3.jpg) · [Browser records](browser.json)

| Issue | Result | Evidence |
| --- | --- | --- |
| QA-002 project links | PASS | Both listing destinations returned 200. Both legacy paths returned 308 to the intended published routes and retained the query string. |
| QA-003 missing headings | PASS | Both Fahrschule YES variants expose one H1 with the original case-study title. |
| QA-004 Translate overlay | PASS on the original CTA scope | The widget stays in the mobile page flow and the tested hero actions remain clear. Enter and Space opened and closed the disclosure. The desktop widget can still obscure part of the small homepage photo credit at 1440 × 900. |
| QA-006 system-page contrast | PASS | Both routes passed the six-width axe test and retain readable dark text on the light surface. |
| QA-007 AI SEO CTA contrast | PASS | Primary CTA remained readable across the sampled AI SEO routes. |
| QA-008 service label clipping | PASS | Service labels wrapped within the viewport. The 96 targeted geometry checks found no document-level horizontal overflow. |
| QA-009 form validation | PASS with mocks | Homepage consent and review, contact validation, duplicate dispatch, handler validation ordering and same-token rejection passed. |
| QA-010 receipt acknowledgment | PASS with mocks | A failed delivery mock still reported receipt. The contact error preserved input and a successful retry cleared it. |
| QA-011 editorial contrast | PARTIAL | Axe detected zero violations in 36 scans across six routes and six widths. Manual inspection found “WITHOUT PRESSURE.” at approximately 1:1 contrast on the Fahrschule YES tablet view (`#f3f0ea` on `#f1f1f1`). |
| QA-012 hidden Copywriting links | PASS | The keyboard sample did not enter `#mobileMenu`. |
| QA-013 navigation overlap | PARTIAL | Menu open, Escape and focus return passed at all six viewport sizes. Shared logo and menu hit tests passed. Both YES pages still render overlapping legacy and shared navs. Their source fixtures contain both `nav.nav` and `header.v3-nav`. At 768 px, Tab entered two legacy links before reaching the shared header. |
| QA-014 system animation errors | PASS | 404 and thank-you pages had no JavaScript runtime errors. On the returning-visitor homepage the project stage pinned, moved and loaded project images. A separate fresh-context wheel check confirmed first-visit scrolling. |

[Axe data](axe-six-viewports.json) · [Menu and route checks](interaction.json) · [Manual tablet contrast and focus](yes-tablet-details.json) · [Mocked contact form](form-browser.json) · [Motion recheck](motion-recheck.json) · [First-visit scrolling](first-visit-scroll.json)

## Build and diff review

- The isolated `npm run build` passed webpack compilation, TypeScript, page generation and output tracing. Next.js emitted a workspace-root warning because the test build was nested under the checkout. Node also emitted a dependency deprecation warning. [Build log](build.log)
- Seven tests passed in `form-remediation.test.mjs` and `security-hardening.test.mjs`. Both changed public JavaScript files passed syntax checks. `git diff --check` passed.
- The complete diff, including the two untracked Phase 1 files, contains no dependency or lockfile changes, credentials, debug logging, production configuration changes, or legal publication or indexing-policy changes. Testing covered the principal public site interactions in the stated scope.

## Modified files

Phase 1 files:

- `app/[[...path]]/route.ts`
- `app/api/forms/submit/route.ts`
- `lib/avault/forms.ts`
- `lib/avault/public-controls.ts`
- `lib/avault/render.ts`
- `public/aroz-translate.css`
- `public/assets/qa-accessibility.css` (untracked)
- `public/assets/v3-sections.js`
- `public/avault-forms.js`
- `scripts/form-remediation.test.mjs` (untracked)

Pre-existing working-tree file: `next-env.d.ts`. Keep it outside a Phase 1 commit unless its inclusion is separately requested.

## Remaining decisions

- QA-013 and QA-011 require correction or explicit acceptance before full Phase 1 sign-off.
- QA-001 awaits the public HTTPS domain and indexing policy.
- QA-005 awaits approved privacy and legal-notice copy and publication authorization.
- Real form storage and email delivery still require an authorized disposable database and test mailbox.

Suggested commit message: `fix: remediate AROZ Phase 1 frontend QA findings`

No commit, push, merge or deployment occurred. Production data was untouched.
