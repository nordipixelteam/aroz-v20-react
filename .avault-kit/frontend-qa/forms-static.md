# AROZ static form and API audit

The homepage enquiry, contact enquiry, booking preview, and public AVAULT sign-in were reviewed from their rendered controls and source. Browser automation blocked application API requests. Database writes, new credentials, real form submissions, and notifications were outside this pass.

| Check | Status | Evidence and interpretation |
| --- | --- | --- |
| Contact input labels and initial validity | PASS | Browser exposed associated labels for the core form fields. A blank contact form was invalid and a malformed email triggered a type mismatch in the earlier browser check. |
| Contact service buttons | PASS | Keyboard activation set the first choice to pressed and populated `serviceValue` with Website / Web design. See `widget-keyboard.json`. |
| Input error UI in source | PASS | `public/avault-forms.js:52` sets aria-invalid on invalid controls. Input and change handlers clear the state. The submission handler checks HTTP status and response success before reset. Accessible announcement and recovery across all error branches still need interaction tests. |
| Origin, payload size, and token controls in source | PASS | `app/api/forms/submit/route.ts:10` calls the origin and payload-size checks. Token verification occurs at line 13. `lib/avault/store.ts:27` and `:28` implement the request parsing and origin checks. Running the protections against a deployed service was outside this pass. |
| Server-side schema parity | FAIL | The core endpoint validates name, email, phone, and website. In `lib/avault/forms.ts:101` custom values are explicitly checked, while configured required built-in fields and allowed values lack uniform enforcement through the selected schema. Reuse the published form schema for both render and server validation. QA-009 covers the broader validation ordering and parity. |
| Rejected consent and retry ordering | FAIL | `app/api/forms/submit/route.ts:23–26` consumes the token and checks rate allowance before validating the homepage consent field. Validate the complete schema and consent before consuming the token or charging allowance. The retry impact is inferred from source and has not been exercised against the database. |
| Submission acknowledgment and delivery semantics | FAIL | `app/api/forms/submit/route.ts:11` promises the enquiry has been sent. The normal path later permits save-only or failed delivery outcomes in `lib/avault/email.ts:63–69`. Use an acknowledgment that reflects the status actually established and preserve delivery state for operators. See QA-010. |
| Duplicate confirmation, persistence, and cleanup | BLOCKED | One-time token, duplicate flagging, and inserts are visible in source. This pass has no authorized disposable DB record or service account to verify the outcome. |
| SMTP or Mailgun delivery, retries, and bounce handling | BLOCKED | Source contains separate delivery states and provider calls. A configured disposable mailbox and isolated environment are needed for delivery tests. |
| Booking provider | PASS | Source review confirms the UI is an appointment preview. The provider in `public/assets/v7-booking.js` generates example time slots and uses a preview submission path. Real calendar booking is outside this implementation and this audit. |
| Sign-in visibility toggle | PASS | Keyboard activation switched the password input from password to text and set aria-pressed to true. |
| Authenticated workflows and session expiry | BLOCKED | No authenticated session was supplied or created. |

Static PASS applies to the stated control or source behavior. It does not establish backend operation or complete security coverage.

## Phase 1 retest

| Check | Status | Retest |
| --- | --- | --- |
| Configured and imported required fields | PASS | The handler validates required built-in and custom fields, configured selections, types and limits. Mock tests cover missing selections, missing messages and invalid values. |
| Consent and request accounting | PASS | Handler mocks confirmed validation and consent failures return 422 before token consumption or rate accounting. |
| Duplicate submit | PASS | Browser mocks recorded one outgoing request after duplicate form events. Concurrent same-token submissions through the mocked handler recorded one insert and one rejection. The real database unique index and repeated submissions using distinct tokens were outside this test. |
| Contact form failure and retry | PASS | The response error was shown, input was preserved, and a successful mocked retry cleared the form. |
| Homepage consent and review | PASS | The browser prevented submission before consent, showed the review before sending, and sent one mocked request when confirmed. |
| Acknowledgment | PASS | The browser fallback and API report receipt. The handler mock returned the receipt acknowledgment when its mock delivery function failed. |
| Actual persistence and mail delivery | BLOCKED | A separately authorized disposable database and test mailbox are needed. All submitted examples in this phase went to mocks. |

[Contact browser mock](remediation-1/form-browser.json) · [Homepage browser mock](remediation-1/homepage-form.json)
