# AVAULT kit

One file that adds **AVAULT** — the website control panel (pages, blog, media, header & footer, SEO, redirects, lead forms and inbox, visitor and call analytics, email, users, scripts, traffic rules, backups) — to another website.

- Built 2026-10-26 from source `8889cc7 + uncommitted changes`.
- 82 source files and 11 reference files, 730 KB of code, every file with a SHA-256 checksum.

**For the person:** open your website's repository in an AI coding agent (for example Claude Code), put this file in the repository root, and say: *"Read AVAULT-KIT.md and follow Part A."* The agent will ask for your database, owner email and owner password first.

**For the agent:** this file has four parts.

- **Part A** is your instructions. Follow it step by step.
- **Part B** is the reference for how every AVAULT screen and API works.
- **Part C** contains the dependencies, the extractor and all source files. **Never retype source files by hand.** Unpack them with the extractor (Part C.2), which checks every checksum.
- The **appendix** covers production deployment.

---

# Part A — Setup brief

## AVAULT setup brief — add AVAULT to another website

This brief is **Part A of `AVAULT-KIT.md`**. That one file holds everything needed to add AVAULT to another website's repository:
- this brief;
- the reference documentation (Part B);
- every source file (Part C), each with a checksum.

Build the kit in the AVAULT source repository with `npm run kit:build`. Give the person the generated `docs/AVAULT-KIT.md`. They put it in their website's repository and ask their AI coding agent to follow Part A.

> **Agent:** you are working inside the person's website repository, which has its own code. Follow these steps in order. Don't skip step 0, and don't write code before the person has answered it. Never overwrite the site's existing files without saying so and getting a yes. Never retype AVAULT source files: unpack them with the extractor (Part C.2), which checks every checksum.

---

### 0. Ask first (before any work)

Ask these questions together, in one message, and wait for the answers. Use a multiple-choice question tool if one is available.

1. **Database.** Which database should AVAULT use?
   - **A MongoDB server** (MongoDB Atlas, or MongoDB on your own server). Ask for the **connection string** (`mongodb://…` or `mongodb+srv://…`) and the **database name**. If the string already names a database, suggest that name.
   - **A local MongoDB on this computer.** Use `mongodb://127.0.0.1:27017` and a database named after the project (lowercase with underscores, for example `acme_roofing`). Check that MongoDB is installed and running (`mongod --version`, then connect). If it isn't, stop and tell the person how to install it. Don't install software yourself without asking.
   - Recommend a **replica set** for production (Atlas is one). With a replica set AVAULT runs every multi-step change as a transaction; on a standalone server it can't roll back a write that fails part-way through.
2. **Owner email.** The email address of the first AVAULT owner. This account can manage everything, including other users.
3. **Owner password.** At least 12 characters; offer to generate a strong one instead. Never write this password into any file, commit, log or summary. Pass it only as an environment variable to the one command that creates the account (step 8).

Also ask for the **production domain** (for example `https://acmeroofing.com`) if you can't find it in the repository. AVAULT uses it for canonicals, sitemaps and the same-origin check.

Repeat back what you'll use, with the password masked, and continue.

---

### 1. Check the website fits

AVAULT is built for **Next.js 16 (App Router) on Node ≥ 22.13**, with Tailwind CSS 4 and shadcn/ui for the admin screens. It serves every public page itself from MongoDB through one catch-all route handler (`app/[[...path]]/route.ts`), using the site's own HTML as page templates.

- **A Next.js App Router site** (any styling): continue. If it's on an older Next.js, say so; upgrading comes first.
- **Next.js Pages Router, plain HTML, WordPress or another framework:** stop and explain. AVAULT needs a Next.js App Router project to live in. Offer to create one, then bring the existing pages in as HTML (step 6).

Then note how the site is built:
- its pages and routes;
- its header, footer and `<main>`;
- its forms;
- its colours, fonts and logo (the **theme**);
- its client-side scripts;
- its styling setup (Tailwind version, shadcn/ui or not);
- any existing `proxy.ts`/`middleware.ts`, `instrumentation.ts`, root catch-all route or `app/api/` routes with the same paths as AVAULT's.

Report what you found and anything that conflicts before changing anything.

---

### 2. Unpack the files

1. Put `AVAULT-KIT.md` in the repository root. Save the extractor with the one-line command in Part C.2. Add `.avault-kit/` to `.gitignore`, and to the `exclude` list in `tsconfig.json` and the ignore list of ESLint, so the staged and reference files aren't type-checked or linted.
2. Run `node .avault-kit/extract.mjs AVAULT-KIT.md --dry-run` and show the person the summary.
3. Run it for real. Every file is checked against its SHA-256; a mismatch means the kit was damaged, so get a fresh copy. File modes:
   - **owned** (AVAULT's own files: `app/avault/`, `lib/avault/`, `app/api/admin|forms|events|maintenance/`, `app/[[...path]]/route.ts`, `db/mongo.ts`, `proxy.ts`, `instrumentation.ts`, scripts): written in place.
   - **shared** (`components/ui/*`, `lib/utils.ts`, `hooks/*`, `vendor/*`, `app/globals.css`, `postcss.config.mjs`): written only if the site doesn't have them. Identical ones are skipped. Different ones go to `.avault-kit/incoming/<path>`.
   - **reference** (the original site's `dmv-runtime.js`, root layout, `next.config.ts`, `.env.example`, PM2 and deploy scripts): always go to `.avault-kit/reference/<path>`, for reading and adapting.
4. **Merge every staged file in `.avault-kit/incoming/`.** For shadcn components, keep the site's version unless AVAULT relies on something only the kit's version has (for example a variant or `data-slot` attribute that `app/avault/theme.css` targets). In that case add what's missing. Note the conflicts you resolved.
5. If the site already had `proxy.ts`/`middleware.ts`, `instrumentation.ts` or a root catch-all route, the extractor staged AVAULT's version. Combine the logic so both keep working; for example, the site's middleware plus AVAULT's `/avault` and `/api/admin` gate.

**Admin styles must not leak into the website.**
- `app/avault/theme.css` is scoped (`--av-*` variables and `.vault`/`.av-*` classes).
- The kit's `app/globals.css` is global: it holds Tailwind's preflight and shadcn's tokens.
- **Don't** import either one in the site's root layout. Create `app/avault/layout.tsx`, which imports AVAULT's base styles and `theme.css`:

  ```tsx
  import './avault-base.css';   // Tailwind 4 + shadcn tokens for the admin only
  import './theme.css';
  export default function AvaultLayout({children}:{children:React.ReactNode}){return children}
  ```

- Build `app/avault/avault-base.css` from the kit's `app/globals.css`, and fix its relative `@import` of `vendor/shadcn-tailwind-*.css`. If the site already loads Tailwind 4 and shadcn tokens globally, `avault-base.css` can be dropped.

**Dependencies and configuration** (Part C.1):
- Add the dependencies and the npm scripts. Rename `scripts/migrate-dmv-avault.mjs` to `scripts/migrate-avault.mjs` and point `db:migrate-avault` at it.
- `next.config`: set `trailingSlash: true`.
- `tsconfig.json`: the `@/*` path alias must map to the repository root (`"@/*": ["./*"]`). If the site maps it to `src/`, either move AVAULT's files under `src/` or add the root mapping.
- `postcss.config.mjs` needs the `@tailwindcss/postcss` plugin.
- Run `npm install`, then `npx tsc --noEmit`. Fix every error before going on.

---

### 3. Replace the old brand

The kit comes from DMV Commercial Door Repair. Search the unpacked files for:
- `DMV`, `Door Repair`, `door repair`;
- `8885990548`, `888-599-0548`;
- `dmv`, `alluredigital`.

Change each match to the new business's equivalent, or to a neutral word:

| File | What to change |
|---|---|
| `lib/avault/config.ts` | `name`, `phone`, `phoneDisplay`, `zone` (time zone), `locale`, `language`, `logo`, `image`, `SYSTEM_ROUTES` |
| `lib/avault/render.ts` | The phone literals it swaps for the profile phone (use the phone as written in the new site's HTML), and the brand name in the logo-detection pattern |
| `lib/avault/site.ts` | Business profile defaults |
| `lib/avault/system-pages.ts` | `/thank-you/`, 404 and contact copy and links |
| `lib/avault/lead-email.ts`, `lib/avault/email.ts` | Wordmark, colours, request wording ("door repair") |
| `lib/avault/admin-extra.ts` | CSV filename, test-email text |
| `lib/avault/public-controls.ts` | `dmv.introPlayed` storage key and the intro-loader bootstrap. Remove both if the site has no intro animation |
| `app/[[...path]]/route.ts` | The one-line business description in `llms.txt`, and the comment about `/contact-us/` |
| `app/api/forms/submit/route.ts` | Default `request` text |
| `app/avault/page.tsx`, `login/page.tsx`, `vault.tsx` | Page titles, logo alt text, default title template |
| `app/avault/leads-inbox.tsx`, `forms-editor.tsx`, `panels.tsx`, `people-views.tsx` | Reply subject, form names, placeholders |
| `scripts/migrate-avault.mjs` | Site shell, `global` defaults, seeded estimate form wording (step 6) |
| `scripts/normalize-content-records.mjs`, `scripts/ensure-schema-links.mjs` | Default form wording; brand words ignored when matching related pages |

When you're done, the search above should find only the new brand.

---

### 4. Theme the admin to match the site

AVAULT's look lives in `app/avault/theme.css`. Its tokens are CSS custom properties on `:root`:
- colours: `--av-blue`, `--av-red`, `--av-green`, `--av-yellow` (each with a `-soft` variant);
- text and surfaces: `--av-ink`, `--av-copy`, `--av-muted`, `--av-line`, `--av-paper`;
- display font: `--av-display`.

The **brand blocks near the end of the file** (comments "DMV AVAULT" and "DMV brand system") re-declare these tokens in the old brand's navy and red.

1. Read the site's colours, fonts and logo from its CSS (variables, Tailwind theme, or computed styles of the header, buttons and links).
2. Replace the brand blocks with the new palette:
   - primary → the `--av-blue` role;
   - accent → the `--av-red` role;
   - text → `--av-ink`/`--av-copy`;
   - borders → `--av-line`;
   - background → `--av-paper`;
   - display font → `--av-display` (and `--font-sans` for body text).

   Load the site's fonts the way the site does (see `.avault-kit/reference/app/layout.tsx` for how the original loaded `/assets/fonts.css`). Keep body text contrast at 4.5:1 or more.
3. Point the sidebar and login logo at the site's logo.
4. In the post editor (`rich-editor.tsx`), change the text-colour presets to the site's brand colours.
5. The **public** site keeps its own design. AVAULT renders the site's own HTML, so pages look exactly as before.

---

### 5. Public-site contract

AVAULT expects a few things from the site's HTML and scripts. Part B, §7 explains why.

- **Page structure:**
  - one `<main>` containing top-level `<section>` elements (sections can be reordered and copied);
  - the header before `<main>` (in `.header-wrap` or `<header>`), the footer after it;
  - exactly one `<h1>`;
  - `{{SEO}}` in `<head>` (the migration adds it).
- **Lead form:**
  - The main form has the class `estimate-form audit-form`. Its fields are named `name`, `phone`, `zip`, `service` (required), with optional `email` and `details`. It has a hidden `request` input and a `.form-status` element.
  - The site needs a client script that sends each `.estimate-form` to AVAULT. Base it on `bindEstimateForms` in `.avault-kit/reference/public/dmv-runtime.js`. It must:
    1. fetch a token from `GET /api/forms/token/`;
    2. on submit, post the fields plus `request`, `token`, `page` (`location.href`) and `referrer` to `POST /api/forms/submit/` as JSON;
    3. fetch a fresh token for the next submission;
    4. show the reply's `message` (success) or `error` in `.form-status`.

    Keep the form's own `request` value: `payload.request || '<default>'`.
  - If the site's form differs (for example no ZIP code), change these together:
    - the required-field check in `app/api/forms/submit/route.ts`;
    - `CORE` in `lib/avault/forms.ts`;
    - the seeded form in the migration.
- **Optional:**
  - a quick ZIP form with the class `hero-proposal`;
  - FAQ items as `<details class="faq-item">`, which become FAQ schema.

---

### 6. Bring the existing pages into AVAULT

AVAULT stores each page as a document: the page's HTML with every text and link turned into an editable `{{fN}}` field. `scripts/migrate-avault.mjs` does this conversion.

1. **Get each page's HTML.**
   - The original script reads a legacy `pages` collection. For a site whose pages are code, build and run the site, list every route (from `app/`, the sitemap or the navigation), and fetch each route's rendered HTML. Feed that into the converter instead.
   - Keep the converter's rules:
     - text nodes and the `href`/`src`/`alt`/`aria-label`/`placeholder`/`title` attributes become fields;
     - `<head>`, `<script>`, `<style>`, `<svg>`, `<noscript>` and `<template>` are skipped;
     - fields are grouped as navigation (before `<main>`), content, or footer (after `</main>`).
2. **Site shell.** Replace the original shell (fonts, CSS, loader, scripts) with the new site's stylesheets, fonts and client scripts. Put `{{SEO}}` where the title and meta tags were. CSS and JS that Next.js emits under `/_next/` must be stable files instead: copy them to `public/` or link the site's own CSS. Pages served by AVAULT don't go through the Next.js build.
3. **Page kinds.** Set `kind` per route:
   - `page`;
   - `service`;
   - `post` — blog posts. Their template must contain `{{BODY}}` for the article editor, plus `.article-eyebrow`, `.article-deck` and `.article-meta` if the design has them;
   - `case-study`.
4. **Global profile.** Write the new business's name, phone, email, address, hours, socials, title template and default description.
5. **Seeded settings.** Check that the estimate form in `modules.forms` matches the site's real form, so publishing from AVAULT → Forms doesn't change it.
6. Do a dry run first (`npm run db:migrate-avault`), show the person the page list, then run it with `-- --apply`.
7. Once AVAULT serves the pages, the site's old page files (`app/**/page.tsx` for those routes) would take priority over AVAULT. List them and **ask before removing them**. Keep any routes AVAULT doesn't manage.

Then run `npm run db:normalize-content`, `npm run db:ensure-seo` and `npm run db:verify-content`, and fix what they report.

---

### 7. Environment

Create `.env.local` and make sure `.gitignore` covers it. Never commit it.

```
MONGODB_URI=<from step 0>
MONGODB_DB=<from step 0>
NEXT_PUBLIC_SITE_URL=<production domain, or http://localhost:3000 for local work>
AVAULT_ENCRYPTION_KEY=<openssl rand -hex 32  → 64 lowercase hex characters, new for this site>
AVAULT_JOBS_SECRET=<openssl rand -hex 32>
```

Generate both secrets fresh. **Never reuse another site's key.** Tell the person to store `AVAULT_ENCRYPTION_KEY` safely: losing it makes backups and saved email passwords unreadable.

---

### 8. Create the owner account

`npm run admin:create` asks for the password interactively, which an agent can't type. Instead, use the migration's owner option on its **first** run. Pass the step 0 answers **only as environment variables for that one command**:

```bash
DEVELOPER_EMAIL='<owner email>' DEVELOPER_PASSWORD='<owner password>' npm run db:migrate-avault -- --apply
```

On Windows PowerShell, set `$env:DEVELOPER_EMAIL` and `$env:DEVELOPER_PASSWORD` for that command, then remove them with `Remove-Item Env:DEVELOPER_PASSWORD`.

If the pages are already migrated, don't re-run the migration; it overwrites migrated pages. Ask the person to run this themselves:

```
! npm run admin:create -- <owner email> owner
```

---

### 9. Verify before handing over

Run the site (`npm run dev`) and check each item. Report what passed and what didn't.

- `npm run lint` and `npx tsc --noEmit` pass.
- `/avault/` redirects to sign-in; the owner can sign in; the sidebar shows every screen.
- The admin uses the site's logo, colours and fonts.
- The site's own pages that AVAULT doesn't manage look exactly as before: no admin styles leak in.
- **Pages & services:**
  - every migrated page is listed;
  - Live edit shows the page in the site's real design;
  - editing a heading, then saving and publishing, changes the public page.
- Migrated public pages look the same as before (compare screenshots of a few routes on desktop and mobile).
- `/sitemap.xml`, `/robots.txt` and `/llms.txt` work, and canonicals use the production domain.
- **Lead form:**
  - a test lead submits;
  - it appears in AVAULT → Leads;
  - with email not configured, it shows "Saved only".
- **Header & footer** loads the site's header and footer.
- **System health** shows the database as connected.
- In a second browser, sign in, then change that user's password from the first browser. The second browser goes back to the sign-in page on its next click.

Finish with a short summary:
- what was installed;
- staged files you merged;
- old page files removed (with the person's approval);
- what the person must still do:
  - set up email in AVAULT → Email;
  - deploy (see the appendix);
  - keep `AVAULT_ENCRYPTION_KEY` safe.

Never include the password.


---

# Part B — Reference

## AVAULT — the built-in website control panel

AVAULT is the admin CMS inside this Next.js app. It lives at `/avault` and controls everything on the public website: pages, blog posts, media, header and footer, SEO, redirects, lead forms, the leads inbox, visitor and call analytics, email delivery, users, custom scripts, traffic blocking, backups and background jobs.

This document is the reference for both **operators** (what each screen does) and **developers** (how each part is built and works). It is written so it can be reused: DMV Commercial Door Repair is the filled-in example, and the places where a new project changes values are listed in [Reusing AVAULT on another project](#17-reusing-avault-on-another-project).

**To add AVAULT to another website**, run `npm run kit:build` and give the generated `docs/AVAULT-KIT.md` to an AI coding agent working in that website's repository. That single file contains Part A of this kit (which asks for the database, owner email and owner password first), this reference, and every source file with a checksum. No access to this repository is needed. Rebuild the kit after every change to AVAULT.

> Code references use `path:line`. Most AVAULT source files keep a whole component or handler on one long line, so line numbers point at where a component or function starts.

---

### Contents

1. [At a glance](#1-at-a-glance)
2. [Architecture](#2-architecture)
3. [File map](#3-file-map)
4. [Setup and configuration](#4-setup-and-configuration)
5. [Sign-in, sessions and roles](#5-sign-in-sessions-and-roles)
6. [Data model (MongoDB)](#6-data-model-mongodb)
7. [How content is stored and rendered](#7-how-content-is-stored-and-rendered)
8. [The AVAULT shell](#8-the-avault-shell)
9. [Content screens](#9-content-screens)
10. [The page and post editor](#10-the-page-and-post-editor)
11. [Conversion screens](#11-conversion-screens)
12. [Administration screens](#12-administration-screens)
13. [Public-site features driven by AVAULT](#13-public-site-features-driven-by-avault)
14. [Background jobs (maintenance)](#14-background-jobs-maintenance)
15. [Admin API reference](#15-admin-api-reference)
16. [Security model](#16-security-model)
17. [Reusing AVAULT on another project](#17-reusing-avault-on-another-project)
18. [Extending AVAULT](#18-extending-avault)
19. [Known limitations and caveats](#19-known-limitations-and-caveats)
20. [Troubleshooting](#20-troubleshooting)

---

### 1. At a glance

| | |
|---|---|
| Admin URL | `/avault/` (sign-in at `/avault/login/`) |
| Stack | Next.js 16 (App Router, route handlers), React 19, MongoDB 7 driver, shadcn/ui + Base UI, TipTap 3, sonner toasts, nodemailer, sanitize-html, mmdb-lib |
| Storage | MongoDB collections + a GridFS bucket (`avault_files`) for uploaded files and encrypted backups |
| Roles | `owner` (everything) and `administrator` (content and leads) |
| Public rendering | One catch-all route handler, `app/[[...path]]/route.ts`, renders every public page from MongoDB on each request |
| Background work | Built-in scheduler every 10 minutes (or an external cron hitting `/api/maintenance/`) |
| Secrets | `AVAULT_ENCRYPTION_KEY` (sessions, form tokens, AES-GCM encryption), `AVAULT_JOBS_SECRET` (cron) |

The sidebar has 22 screens in three groups:

| Group | Screens (`?view=` id) |
|---|---|
| **Content** | Overview (`overview`), Pages & services (`pages`), Blogs (`blogs`), Categories & tags (`taxonomy`), Scheduled publishing (`schedules`), Media (`media`), Header & footer (`navigation`), SEO & discovery (`seo`), Redirects (`redirects`) |
| **Conversions** | Leads (`leads`), Forms (`site-forms`), Calls (`calls`), Visitors (`visitors`) |
| **Administration** | Site settings (`settings`), Email (`email`), Users (`users`), Privacy & tracking (`privacy`), Custom scripts (`scripts`), Traffic access (`traffic`), Backups (`backups`), System health (`health`), Activity log (`activity`) |

Every screen is visible to both roles. On owner-only screens, an administrator sees a one-line "Only owners can …" card instead of the controls, and the server enforces the same rule.

---

### 2. Architecture

```
Browser (AVAULT SPA at /avault)                  Public visitor
        │  fetch /api/admin/<action>/                   │  GET /any/page/
        ▼                                               ▼
 proxy.ts  ── cookie gate (avault_session) ──┐   app/[[...path]]/route.ts
        │                                    │     traffic rules → media → robots/llms/sitemaps
        ▼                                    │     → redirects → trailing slash → system pages
 app/api/admin/[...path]/route.ts            │     → readDoc → render() → enhancePublic() → admin bar
   actor() session check                     │
   dispatch: admin-extra → extended → route  │   app/api/forms/token|submit   (lead forms)
        │                                    │   app/api/events                (analytics beacons)
        ▼                                    │   app/api/maintenance           (cron trigger)
 lib/avault/*  (business logic)  ◄───────────┘
        │
        ▼
 db/mongo.ts  ── SQL-style adapter + native driver ──► MongoDB (+ GridFS avault_files)

 instrumentation.ts → lib/avault/scheduler.ts → runMaintenance() every 10 min
```

Key design points:

- **One page = one MongoDB document.** Each page stores an HTML `template` with `{{f1}}`, `{{f2}}`… placeholders, plus a `fields` array with the value of every placeholder. Editing a page means changing field values, never raw HTML (see [§7](#7-how-content-is-stored-and-rendered)).
- **Draft and published copies.** Each document row holds a `draft` and a `published` JSON string. Save writes the draft; Publish copies it to `published`.
- **Optimistic concurrency everywhere.** Every write carries the `revision` the editor started from. If someone else saved in the meantime, the server answers 409 instead of overwriting.
- **Every change is versioned.** Page saves and settings saves write a `revisions` row (before/after) and an `activity` row.
- **Multi-step writes are all-or-nothing.** A batch of writes (a publish, a rename across many pages, a settings save) checks every revision guard and unique key before writing anything, and runs inside a MongoDB transaction when the server supports one (see "All-or-nothing batches" in [§7](#7-how-content-is-stored-and-rendered)).
- **No page cache.** Public HTML is sent `Cache-Control: no-store` and re-rendered from MongoDB on every request, so a publish is live immediately.
- **Single-page admin.** `/avault` is one client component (`app/avault/vault.tsx`) that swaps panels by `?view=`. All data comes from `/api/admin/<action>/`.

---

### 3. File map

#### Admin UI (`app/avault/`)

| File | Contents |
|---|---|
| `page.tsx` | Server entry. Verifies the session, redirects to login if missing, maps legacy `?view=forms` → `?view=leads`, renders `<Vault>` |
| `login/page.tsx`, `login/login-form.tsx` | Sign-in page and form (password show/hide, posts to `/api/admin/login/`) |
| `vault.tsx` | The shell: sidebar menu, view routing, document editor (tabs, undo/redo, save/publish), create page/post form, Media screen |
| `overview-views.tsx` | `OverviewPanel`, `SchedulesPanel`, `TaxonomyPanel` |
| `list-views.tsx` | `DocTable` (Pages/Blogs list), `SeoPanel`, `RedirectsPanel` |
| `page-canvas.tsx` | Live click-to-edit page canvas with section toolbar |
| `section-library-dialog.tsx` | "Add a section" dialog |
| `content-tools.tsx` | `request()` API helper, `ContentTools` (Sections & blocks tab), `PublishingTools`, `ClassificationTools`, `TextEditor` |
| `rich-editor.tsx` | `PostEditor` — TipTap article editor for blog posts |
| `panels.tsx` | `SeoTab`, `RevisionDiff`, `PreviewFrame` |
| `navigation-editor.tsx` | Visual header & footer editor, shared `CANVAS_CSS` |
| `media-tools.tsx` | `MediaCard` (usage, details, alt everywhere, replace/archive) |
| `operations-panel.tsx` | Generic settings panel (`only="menus" \| "verification" \| "files"`), `FamilyBuilder` |
| `forms-editor.tsx` | Forms screen |
| `leads-inbox.tsx` | Leads screen |
| `people-views.tsx` | `UsersPanel`, `EmailSetup`, `SettingsForm`, `VisitorsView`, `CallsView` |
| `admin-views.tsx` | `ActivityLog`, `BackupsPanel`, `TrafficPanel` |
| `scripts-privacy.tsx` | `ScriptsPanel`, `PrivacyPanel` |
| `health-panel.tsx` | System health |
| `session.ts` | `adminFetch()` — every call to `/api/admin`; on 401 goes to sign-in and back. `safeNext()` for the post-login return address |
| `toast.ts` | `notify()` — sonner toast. Errors returned by the admin API always show as errors (`serverError()`); other messages are classified by wording |
| `theme.css` | All AVAULT styles (`vault-*` older shell classes, `av-*` newer components) |

#### Server logic (`lib/avault/`)

| File | Responsibility |
|---|---|
| `config.ts` | `CONFIG` (site name, origin, default phone, zone…), `SYSTEM_ROUTES`, `DEFAULT_NAVIGATION` |
| `store.ts` | `Doc`/`Field` types, `normalizeDoc`, `readDoc`, `allDocs`, `globals`, `audit()` (publish checks), `safeUrl`, `sameOrigin`, `clientIp`, `requestOrigin`, `body()`, `json()`, `failure()`, shared security headers |
| `auth.ts` | Users collection, scrypt hashing, signed session cookie, login rate limiting, `saveUser`, `deleteUser` |
| `render.ts` | `render()` — template + fields → HTML, SEO tags, JSON-LD; sitemap builders |
| `blocks.ts` | Content blocks (validate/render), `sections()`, `compose()` (order/hide sections) |
| `section-library.ts` | Section library, `insertSection`, `removeSection`, `markSections` |
| `nav-canvas.ts` | Extracts header/footer from the home template and tags fields for the visual editor |
| `rich.ts` | `sanitizeBody` for article HTML, table wrapping, related posts |
| `site.ts` | Business profile defaults and `validateProfile`, `validateCustomSchema` |
| `forms.ts` | Form config normalize/validate, `applyForms` (rewrites form markup), `extraValues` |
| `spam.ts` | Signed form tokens, rate limits, content spam heuristics |
| `email.ts` | Email config (Mailgun/SMTP), `sendEmail`, `deliverForm` |
| `lead-email.ts` | Lead notification email (HTML + text) |
| `admin-extra.ts` | First-priority admin GET/POST handlers (documents, audit, overview, leads, calls, visitors, media, redirects, settings, email…) |
| `extended.ts` | Second-priority handlers (configuration, schedules, taxonomy, backups, privacy, rename, family, health, media…) |
| `runtime.ts` | `seal`/`unseal` (AES-GCM), `settingsRead`/`settingsSave`, backups, `runMaintenance` |
| `operations.ts` | `routePath`, `recordActivity`, `mutateMany` (multi-page versioned writes), rename helpers |
| `scheduler.ts` | In-process 10-minute timer |
| `public-controls.ts` | `trafficAllowed`, `enhancePublic` (scripts, analytics, menus, forms, honeypot, verification tags) |
| `ip.ts` | IPv4/IPv6 address and CIDR parsing and matching, shared by the traffic rules and the Traffic access screen |
| `snippets.ts` | Custom script templates, validation, rendering with CSP nonces |
| `system-pages.ts` | Code-owned pages: `/thank-you/`, 404 |
| `admin-bar.ts` | Bar shown on public pages to signed-in staff |
| `geo.ts` | Offline IP → country lookup |
| `media.ts` | Image dimension sniffing, media usage search |
| `agent.ts` | User-agent → "Browser · OS · Device" |
| `icon-fix.ts` | Rewrites legacy Microsoft icon URLs |

#### Routes and infrastructure

| File | Purpose |
|---|---|
| `app/api/admin/[...path]/route.ts` | The whole admin API (GET + POST), plus `commit()` and `validate()` |
| `app/api/forms/token/route.ts` | Issues signed form tokens |
| `app/api/forms/submit/route.ts` | Receives lead form submissions |
| `app/api/events/route.ts` | Receives analytics beacons |
| `app/api/maintenance/route.ts` | Cron trigger for maintenance |
| `app/[[...path]]/route.ts` | Serves every public page, `/media/*`, robots, llms.txt, sitemaps, redirects |
| `proxy.ts` | Next.js proxy (middleware): cookie gate for `/avault/*` and `/api/admin/*` |
| `instrumentation.ts` | Starts the scheduler on server boot |
| `db/mongo.ts` | Mongo client, unique indexes, SQL-compatibility adapter with all-or-nothing batches, GridFS object store (`get`/`put`/`delete`) |
| `public/avault-analytics.js` | First-party visitor tracking script |
| `scripts/*.mjs`, `scripts/*.sh` | Migration, admin creation, SEO, verification and deployment scripts |

---

### 4. Setup and configuration

#### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `MONGODB_DB` | No | Database name (defaults to the URI's database). DMV: `dmv_commercial_door_repair` |
| `NEXT_PUBLIC_SITE_URL` | Yes in production | Public origin, e.g. `https://dmvcommercialdoorrepair.com`. Used for canonicals, schema, sitemaps, robots, llms.txt **and** the same-origin check on every POST |
| `AVAULT_ENCRYPTION_KEY` | Yes | Exactly 64 lowercase hex characters (`openssl rand -hex 32`). Signs session cookies and form tokens and encrypts email secrets and backups. **Changing it signs everyone out and makes existing backups and saved email passwords unreadable** |
| `AVAULT_JOBS_SECRET` | Only for external cron | Bearer token for `POST /api/maintenance/` |
| `AVAULT_SCHEDULER` | No | `off` disables the built-in scheduler; `on` enables it outside production |
| `NODE_ENV` | — | `production` adds `Secure` to the session cookie and starts the scheduler |
| `PORT` | — | Port for `next start` (DMV: 3110) |
| `DEVELOPER_EMAIL`, `DEVELOPER_PASSWORD` | No | Used only by the migration script to create an owner account |

#### First-time setup

1. Create `.env.local` with the variables above.
2. `npm install`
3. Migrate content into AVAULT documents: `npm run db:migrate-avault` (dry run), then `npm run db:migrate-avault -- --apply`.
4. Create the first owner: `npm run admin:create -- you@example.com owner` (prompts for a password of 12+ characters).
5. `npm run dev` and open `http://localhost:3000/avault/`.

The scheduler does not run in development unless `AVAULT_SCHEDULER=on`.

The migration also creates the other settings rows AVAULT needs (`forms`, `scripts`, `menus`, `traffic`, `operations`, `verification`, `files`) **only when they are missing**, so re-running it never replaces choices saved in AVAULT. The seeded estimate form has name, email, phone, business ZIP, service and details fields; adjust it in AVAULT → Forms. Daily backups start switched on.

> Re-running `db:migrate-avault -- --apply` **does** overwrite every migrated page and the `global` business profile with the legacy content. Run it once per database, or take a backup first.

#### npm scripts

| Script | What it does |
|---|---|
| `dev`, `build` (`next build --webpack`), `start`, `lint` | Standard |
| `admin:create` | `npm run admin:create -- email [owner\|administrator]` — creates or resets an account; password typed with hidden input |
| `db:migrate-avault` | Converts the legacy `pages` collection into AVAULT `documents`. Dry run by default, `-- --apply` to write. Turns every text node and `href`/`src`/`alt`/`aria-label`/`placeholder`/`title` attribute into `{{fN}}` fields, groups fields as navigation/content/footer, picks a `kind` per route, writes `settings.global`, seeds any missing settings modules, optionally creates the developer owner |
| `backup:decrypt` | `npm run backup:decrypt -- <backup.enc> [out.json] [--checksum <sha256>]` — decrypts a backup downloaded from AVAULT → Backups with `AVAULT_ENCRYPTION_KEY` (read from the environment, `.env.local` or `.env`) and verifies the checksum if given |
| `db:normalize-content` | Roots `assets/`/`media/` URLs, demotes extra H1s to H2, trims SEO title (65) and description (170) |
| `db:ensure-seo` | Adds a "Related pages" ItemList JSON-LD to each document's custom schema |
| `db:audit-seo` | Read-only report of stored schema and the internal link graph |
| `db:verify-content` | Checks one H1 per page, rooted media URLs, related-pages schema and required settings rows. Exits 1 on problems |
| `test:custom-scripts` | Adds a temporary snippet, fetches `/` and checks it is injected with a nonce, then restores settings |
| `db:sync-origin` | Rewrites every canonical to `NEXT_PUBLIC_SITE_URL + route` |

Not aliased in npm: `scripts/verify-rendering.mjs` (checks 23 live routes), `scripts/deploy-production.sh` and `scripts/configure-webuzo-proxy.sh` (see `docs/DEPLOYMENT.md`).

#### Production process

`ecosystem.config.cjs` runs one PM2 process in fork mode (`next start -H 127.0.0.1`, port 3110, 600 MB restart limit). Keep it to **one instance**: the scheduler, the geo database and the Mongo client are per-process globals, and the maintenance lock only guards concurrent runs, not duplicate schedulers.

---

### 5. Sign-in, sessions and roles

#### How sign-in works

1. `/avault/login/` posts `{email, password}` to `POST /api/admin/login/`.
2. `login()` (`lib/avault/auth.ts`) hashes the client IP and checks rate limits in `rate_limits`: **5 failures per IP+email** or **20 per IP** in 15 minutes → 429 "Too many sign-in attempts".
3. The password is checked with scrypt (`N=16384, r=8, p=1`, 16-byte salt, 64-byte key) using a timing-safe compare. Unknown emails are checked against a dummy hash so the response time does not reveal which accounts exist. Failures wait 600 ms.
4. On success the server sets the `avault_session` cookie and logs `sign-in` in the activity log.

#### The session cookie

- Value: `base64url({e: email, v: session_version, x: expiry}) + "." + HMAC-SHA256 signature`. The HMAC key is derived from `AVAULT_ENCRYPTION_KEY`.
- `HttpOnly; SameSite=Strict; Path=/; Max-Age=14400` (4 hours), plus `Secure` in production.
- **Every** admin page and API call re-reads the user from MongoDB (`sessionUser`). The session is rejected if the user is deleted, inactive, or their `session_version` changed. A password change, role change or deactivation bumps `session_version`, which signs that user out everywhere.
- `proxy.ts` is only a fast gate: requests to `/avault/*` or `/api/admin/*` without the cookie get a 307 to `/avault/login/?next=…` (pages, and API links opened in the browser such as CSV or backup downloads) or 401 JSON (API calls). The real check is always `actor()` in the API.

#### When a session ends

A session ends after 4 hours, on sign-out, or when an owner changes the user's password, role or access. Every admin call goes through `adminFetch()` (`app/avault/session.ts`), used by `request()`, `api()` and the media uploads. On a **401** it sends the browser to `/avault/login/?next=<current screen>`, and after signing in the login form returns there (`safeNext()` only allows `/avault` addresses, so the `next` parameter can't send anyone to another site). Reloading `/avault` with an ended session does the same from the server (`app/avault/page.tsx`). If the page has unsaved changes, the browser first asks whether to leave.

#### Roles

| Capability | Administrator | Owner |
|---|:---:|:---:|
| Edit, save, publish, unpublish, schedule pages and posts; sections; rename URLs | ✓ | ✓ |
| Create pages/posts, page families, categories & tags, redirects | ✓ | ✓ |
| Upload media, edit media details, set alt text everywhere | ✓ | ✓ |
| Delete never-published drafts | | ✓ |
| Replace or archive media | | ✓ |
| Publish header & footer changes, edit extra menus, search-engine verification, robots/llms/sitemap files | | ✓ |
| Leads: view, search, change status, retry email, export CSV | ✓ | ✓ |
| Leads: delete permanently | | ✓ |
| Forms: view and preview | ✓ | ✓ |
| Forms: publish changes | | ✓ |
| Calls, Visitors, System health (view), Activity log | ✓ | ✓ |
| Site settings: view | ✓ | ✓ |
| Site settings: change | | ✓ |
| Email, Users, Privacy & tracking, Custom scripts, Traffic access, Backups | | ✓ |
| Run maintenance now | | ✓ |
| Change own password | ✓ | ✓ |

There must always be at least one active owner: the server refuses to demote, deactivate or delete the last one.

---

### 6. Data model (MongoDB)

Unique indexes are created on connect (`db/mongo.ts`): `documents.route`, `settings.id`, `redirects.source`, `media.key`, `users.email`, `rate_limits.id`, `schedules.route`, `taxonomy.id`. No TTL indexes are used; cleanup is done by the maintenance job.

| Collection | Shape | Written by |
|---|---|---|
| `documents` | `{id, route, draft: JSON Doc, published: JSON Doc \| null, revision, updated_at}` | Editor, scheduler, rename, restore |
| `settings` | `{id, value: JSON, revision}` — keys listed below | Settings screens, header & footer, scheduler |
| `revisions` | `{id, document_id (route or "@settingsKey"), before, after, actor, state: pending\|applied\|conflict\|validation-failed, created_at}` | Every document and settings write |
| `activity` | `{id, actor, action, entity, created_at}` | Every change |
| `redirects` | `{source, destination, status 307\|308, enabled, note, hits, last_hit_at, created_*, updated_*}` | Redirects screen, rename |
| `media` | `{id, key "<uuid>.<ext>", name, mime, bytes, alt, metadata: JSON {width, height, checksum, uploader, updatedAt, caption, credit}, created_at}` | Media uploads |
| `avault_files` (GridFS) | Uploaded file bytes (filename = media key) and encrypted backups (`private-backups/...`) | Uploads, backups |
| `forms` | Leads: `{id, value: JSON, status new\|read\|archived\|spam, delivery pending\|sending\|sent\|failed\|not-configured\|blocked, attempts, created_at, ip, user_agent, language, country, fill_seconds, spam, delivery_message, search, delivered_at?, last_attempt_at?}` | Form submissions |
| `events` | Analytics: `{id, type page\|leave\|click\|form\|call\|heartbeat, session, visitor, value: JSON, created_at, ip, user_agent, browser{name, device, os}, country}` | `/api/events/` |
| `users` | `{email, role, active, password_hash, session_version, created_at, updated_at, last_login_at?, password_changed_at?}` | Users screen, `admin:create` |
| `rate_limits` | `{id, count, expires}` — login, form, event limiters, single-use form tokens, `maintenance-lock` | Many |
| `schedules` | `{route, revision, due, state pending\|cancelled\|conflict\|published, actor}` | Scheduling |
| `taxonomy` | `{id, type category\|tag, slug, label}` | Categories & tags |
| `backups` | `{id, key, checksum (SHA-256 of plaintext), bytes, created_at}` | Backups |
| `pages` | Legacy source for the migration script only | — |

#### Settings keys (`settings` collection)

| `id` | Contents | Edited in |
|---|---|---|
| `global` | Business profile (name, legal name, tagline, business type, email, phone, logo, image, address, geo, hours, map URL, socials, price range, area served, title template, default description) plus `navigation` overrides | Site settings; Header & footer |
| `email` | `{enabled, provider mailgun\|smtp, senderName, fromAddress, replyTo, recipients[], mailgun{domain, region, key🔒}, smtp{host, port, secure, user, pass🔒}}` | Email |
| `forms` | `{contact, hero, custom[]}` | Forms |
| `scripts` | `{enabled, snippets[]}` | Custom scripts |
| `traffic` | `{enabled, allow[], deny[], countries[]}` | Traffic access |
| `operations` | `{analytics, retentionDays, dailyBackup, formRetentionDays}` | Privacy & tracking; Backups |
| `verification` | `{google, bing}` | SEO & discovery |
| `files` | `{robots, llms, sitemaps{exclude[], custom{}}}` | SEO & discovery |
| `menus` | `{header[], footer[], mobile[], utility[]}` | Header & footer (Extra links) |
| `last-maintenance` | `{at, results}` | Scheduler |

🔒 = sealed with AES-256-GCM before storage.

All settings edits go through `settingsSave(key, value, revision, actor)` (`lib/avault/runtime.ts`), which checks the revision (409 on mismatch), writes a revision row `@<key>`, bumps the revision and logs `settings` (with the key as entity) in the activity log. Most keys can be restored from their history (`configuration-restore`). `last-maintenance` is a status record, not an edit: the scheduler writes it directly, without a revision or activity entry.

---

### 7. How content is stored and rendered

#### The `Doc` type (`lib/avault/store.ts`)

```ts
type Field = {key: string; value: string; kind: string; label: string; section: string; group?: string};
type Doc = {
  route: string; label: string; kind: 'page' | 'service' | 'post' | 'case-study';
  template: string;            // full page HTML with {{f1}}…{{fN}}, {{SEO}}, optionally {{BODY}} / {{RELATED}}
  fields: Field[];             // one entry per placeholder
  seo: {title; description; image; imageAlt; noindex; canonical; nofollow?; noarchive?; sitemap?;
        ogTitle?; ogDescription?; twitterCard?; schema?};
  blocks?: Block[];            // extra content blocks appended to <main>
  sectionOrder?: string[];     // e.g. ['section-0','section-2','section-1']
  hiddenSections?: string[];
  category?: string; tags?: string[];            // taxonomy ids (posts)
  body?: string; author?; authorUrl?; excerpt?; featuredImage?; featuredAlt?;   // articles
  ids: string[]; images: {src; alt}[]; links: string[];
  publishedAt?; updatedAt?; revision: number; templateRoute?; scheduledAt?;
};
```

- `field.kind` is `url` for links and images (validated with `safeUrl`), otherwise text.
- `field.label` describes where the placeholder sits, e.g. `h1`, `a href`, `img src`, `img alt`, `span`.
- `field.section` is the nearest heading text; `field.group` is `navigation`, `content` or `footer`.
- A template that contains `{{BODY}}` is an **article** (blog post): it is edited in the rich-text editor instead of field by field.

**The template cannot be changed from the browser.** `validate()` in the admin route takes only field *values* from the client; the template and field metadata always come from the stored draft (or from `templateRoute` for a new page). The field count and keys must match exactly.

#### Sections

`sections(template)` (`lib/avault/blocks.ts`) walks the top-level `<section>` elements inside `<main>` and gives them positional ids `section-0`, `section-1`…. `compose()` applies `sectionOrder` and `hiddenSections` by moving section HTML between the original slots, then appends rendered content blocks in `<div class="shell-wide avault-added-content">` before `</main>`. A section containing the page's `<h1>` can't be hidden, removed or duplicated.

#### `render()` (`lib/avault/render.ts`)

1. `compose()` reorders/hides sections and inserts blocks.
2. Every `{{fN}}` is replaced with the **HTML-escaped** field value. A header/footer override from `global.navigation` (key `group|label|originalValue`) takes priority. A field reading "N min read" is recalculated from the article's word count (220 words per minute).
3. `{{BODY}}` → sanitized article HTML; `{{RELATED}}` → "Keep exploring" related posts.
4. Global profile substitutions: site name, email placeholder, phone numbers and `tel:` links, logo, social links, legacy icon URLs, relative asset paths.
5. `{{SEO}}` → `<title>` (SEO title, or the title template with the label), meta description (SEO description → excerpt → default description), canonical, robots meta, Open Graph and Twitter tags, article times, author.
6. JSON-LD `@graph`: Organization/LocalBusiness (address, geo, hours, map, area served, `sameAs`), WebSite, WebPage (CollectionPage for listing pages), Service (kind `service`), BlogPosting/Article, FAQPage (from `<details class="faq-item">`), BreadcrumbList, plus custom nodes from `seo.schema`.
7. Preview mode removes scripts (except JSON-LD) and forces `noindex, nofollow`.

#### Publish checks (`audit()` in `store.ts`)

Publishing is refused (422, up to 8 issues listed) when:

- a link field, block link or article link is unsafe, or points to an internal page that isn't published (or to an anchor that doesn't exist on the target);
- both the search description and the excerpt are empty;
- the social image URL is invalid;
- the canonical isn't `NEXT_PUBLIC_SITE_URL + route`;
- a content block's anchor id clashes with an existing id.

#### Saving: `commit()` (`app/api/admin/[...path]/route.ts`)

1. Requires `expectedRevision`; reads the current draft.
2. Sets `revision = expected + 1`, `updatedAt`, and `publishedAt` on a post's first publish.
3. Inserts a `revisions` row as `pending`.
4. If the stored revision has moved on → row becomes `conflict`, 409 "Reload the page before saving."
5. On publish, runs `audit()` → `validation-failed`, 422.
6. Writes the draft (and `published`, or `NULL` for unpublish) with `WHERE revision = expected`, marks the revision `applied`, and logs the activity.

#### All-or-nothing batches (`db/mongo.ts`)

The code talks to MongoDB through a small SQL-style adapter (`db().prepare(sql).bind(...)`, `db().batch([...])`). Multi-step writes — page saves, `mutateMany()` (rename, alt text everywhere, media replace, scheduled publish, backup restore), settings saves, header & footer — are sent as one `batch()`:

1. **Up-front checks.** Before any statement runs, every revision guard (`INSERT INTO write_guards …`) is checked against the current revision, and every plain insert into a keyed collection (`documents`, `redirects`, `users`, `schedules`, `settings`, `rate_limits`, `taxonomy`) is checked for an existing row. A stale revision or a taken URL rejects the whole batch with nothing written.
2. **Transaction.** The statements then run inside a MongoDB transaction, so any failure part-way through (a lost race, a dropped connection) rolls everything back. Transactions need a replica set; on a **standalone** server the adapter detects the "no transactions" error once and from then on runs the statements in sequence, protected only by step 1.
3. Conflicts reach the browser as **409** ("Something changed or that address is already taken. No changes were applied.").

To get full rollback in production, run MongoDB as a replica set (a single-node replica set is enough).

---

### 8. The AVAULT shell

`app/avault/vault.tsx` is one client component that owns all navigation and the document editor.

- **Routing.** The current screen is `?view=<id>`; an open page adds `&route=/path/`. Navigation uses `history.pushState`, and Back/Forward are handled with `popstate`. The server page starts on the requested view so the sidebar never flashes "Overview".
- **Sidebar.** Logo (links to the live site), grouped menu, signed-in email and role, Sign out (`POST /api/admin/logout/`). The top bar shows the breadcrumb and "View live website".
- **API helper.** `api(path, data?)` (and `request()` in `content-tools.tsx`) sends GET without data and POST JSON with data, and throws the server's `error` message on non-2xx.
- **Toasts.** All panels report through `notify()`. Error messages returned by the admin API are registered by `request()`/`api()` (`serverError()`) and always show red for 8 s. Other messages (client-side checks, confirmations) are classified by wording: ones that read like errors ("failed", "must", "not found"…) show red, everything else green for 4 s.
- **Unsaved-change protection.** While a page has unsaved edits, switching screens or returning to the list opens a "Discard unsaved page changes?" dialog, and closing the tab triggers the browser's leave warning.
- **Undo/redo.** Every draft change pushes the previous doc onto an undo stack (at most one snapshot per second, 50 deep). Redo is cleared by a new change. Structural server-side edits (add/duplicate/remove section, restore) reset the stacks.
- **Document list.** `GET documents` is loaded for every view and shared with panels (link pickers, usage counts, schedules).

---

### 9. Content screens

#### 9.1 Overview (`overview`)

A dashboard built from `GET overview` plus `GET forms?status=new`.

- **Greeting card**: date, "Good morning/afternoon/evening, <name>" (from the email), "N new leads waiting · N visits today · N call taps today", and an "Open N new leads" button.
- **Needs attention**: server warnings — email in save-only mode, scheduled jobs never run or more than 2 h stale, no backup yet, failed lead notifications — each with a fix link (Email, System health, Backups, Leads).
- **KPI row**: New leads, Calls today, Visits today, On the site now (sessions active in the last 90 s). Each opens its screen.
- **Latest new leads** (5) and **Recent changes** (6 activity rows).
- **Website content tiles**: Pages, Blog posts, Drafts, Pages to fix (SEO audit errors; highlighted when non-zero).
- **Health list**: lead email mode, scheduled jobs, last backup, failed emails.
- **Quick actions**: edit a page, write a post, upload media, check SEO, add a redirect, schedule a post.

#### 9.2 Pages & services (`pages`) and Blogs (`blogs`)

Both use `DocTable` (`list-views.tsx`). Pages shows every non-post kind (page, service, case study); Blogs shows only posts.

- **Filters**: All, Live, Drafts, Edits not live (draft differs from published), Scheduled (only when any exist).
- **Search** over title, URL and author; **sort** by recently updated, title or URL.
- **Columns**: title and URL (the homepage is badged), type or author, status pill (Live / Scheduled with date / Draft, plus "Edits not live"), search visibility (Indexed / Hidden), updated (relative), link to the live page.
- Clicking a row opens the [editor](#10-the-page-and-post-editor).

**New page / New blog post** (form in `vault.tsx` → `POST create`):

- Title, New URL and a source design. For blogs, the URL auto-fills to `/blog/<slug>/` from the title until you edit it.
- Pages copy an existing page's template and text, with the new title in the H1. Posts copy an existing post's layout but clear the body, H1, deck, meta, excerpt, author, featured image, category, tags and SEO fields, and set the date to today.
- Server rules: URL must be lowercase slug segments ending in `/` (max 250), not under `/avault`, `/api`, `/media`, `/assets`; must not already exist as a page or redirect source (409). The draft stays private until published.

**Create a related page family** (`FamilyBuilder`, Pages screen only):

- Pick a base design and enter one page per line: `/page-url/ | Page title`.
- `POST family` creates 1–15 private drafts cloned from the base, each with its own H1, SEO title (`Title | Site name`) and canonical. Duplicate or existing routes are rejected. Reload the list to see them.

#### 9.3 Categories & tags (`taxonomy`)

- Two columns, Categories and Tags, with search, usage counts ("N posts" expands to the list of posts) and rename/delete.
- **Add/edit**: name, web address slug (auto-generated from the name until edited; lowercase-hyphen format), type (new items only).
- `POST taxonomy` upserts; `POST taxonomy-delete` is refused while any draft or published post uses the term ("Reassign this classification on every page before deleting it").
- A post's category and tags are set in the editor (under the article editor, or the Classification card in Sections & blocks). They're stored as taxonomy ids on the draft, so they go through save/undo/publish like any edit.

#### 9.4 Scheduled publishing (`schedules`)

- **Schedule a page**: choose any page that's a draft or has unpublished edits (and isn't already scheduled), and a date/time at least 5 minutes ahead (local time). `POST schedule {route, revision, due}` stores one schedule per route.
- **Coming up**: pending schedules with countdown, Review (opens the editor) and Cancel (`schedule-cancel`; the draft is kept).
- **History**: Published, Cancelled, or "Skipped: page changed".
- **How it publishes**: the maintenance job (every 10 minutes) publishes due schedules **exactly as saved at the scheduled revision**. If the draft was edited after scheduling, the schedule becomes `conflict` and is skipped. If the publish checks fail, it stays pending and is retried next run.

The editor's Publishing tab can also schedule the currently saved revision.

#### 9.5 Media (`media`)

- **Upload**: PNG, JPEG, WebP, PDF, TXT, CSV, Word, Excel, PowerPoint; up to 12 MB; an accessible description is required in this form.
- **Server upload** (`POST media`, multipart): type detected by magic bytes for images/PDF; image dimensions read from the file header (rejects >30,000 px per side or >100 megapixels); SHA-256 de-duplication (the existing URL is returned); bytes stored in GridFS, a row in `media`. Files are served at `/media/<uuid>.<ext>` with a one-year immutable cache.
- **Filters**: All, In use, Unused, Missing description. The grid shows uploaded files and images already referenced by pages (`/assets/...`). 100 per page.
- **Each card** (`MediaCard`):
  - Copy URL.
  - **Where used** — every page, draft or live, plus the social image, content blocks, article bodies and header/footer.
  - **Edit details** (uploaded files) — name, description, caption, credit; optimistic check on `updatedAt`.
  - **Set the description everywhere** — dry run lists each page and spot whose `img alt` differs, then applies to all of them in one versioned write (`media-alt`).
  - **Replace** (owner) — choose another uploaded image, review affected pages, apply. Rewrites fields, social images, blocks, article bodies and global settings (`media-replace`).
  - **Archive** (owner, unused uploads only) — creates a backup first (which keeps a copy of the file), then removes the media record and the stored file (`media-delete`).

#### 9.6 Header & footer (`navigation`)

A visual editor for the header and footer shared by every page (`navigation-editor.tsx`, `lib/avault/nav-canvas.ts`).

- **How it works.** `GET navigation` returns the homepage's navigation/footer fields and its header and footer HTML. `tagFields()` marks every placeholder with `data-av-k` (text) or `data-av-a` (attributes). The canvas is an iframe built with the site's real stylesheets and a placeholder where page content would be.
- **Editing**: click any text to type over it in place; click links, images or buttons to edit their destination, image URL, alt or screen-reader label in the floating inspector. Changes are painted into the iframe live without reloading. Forms are locked with an "Open Forms" link. The services mega-menu and mobile menu can be opened.
- **Device preview**: Desktop 1440, Tablet 820, Mobile 390.
- **Changes list** shows each unpublished edit (old → new) with per-item revert, and **Revert all**.
- **All header and footer text, including hidden labels**: searchable list covering screen-reader labels, the skip link and other invisible text.
- **Publish** (owner only) → `POST navigation`. Overrides are stored in `global.navigation` keyed `group|label|originalValue`, so identical text used in several spots changes together. Every internal destination must be a published page. There is no draft stage: publishing changes every page at once.

**Extra links** (owner, below the editor; `settings.menus`): additional links appended to the header, mobile, footer and utility menus. Each item has label, destination, parent (two levels max), enabled and new-tab. Internal destinations must be published. Settings history with restore is available.

#### 9.7 SEO & discovery (`seo`)

Three numbered steps.

1. **Fix page issues** (`GET audit`).
   - **Needs attention** (errors): the publish checks plus "No H1 heading".
   - **Suggestions** (warnings): title over 65 or under 20 characters; description over 170 or under 70; duplicate titles or descriptions; more than one H1; no social image; social image without description; empty image alts; article images without alt; placeholder text (lorem ipsum, TODO, `[insert`); hidden from search but linked; orphan pages (no internal links in).
   - Stat cards act as filters; the table shows issues, incoming link count, a view-live link and Fix/Open.
2. **Connect search engines** (owner): Google Search Console and Bing Webmaster verification tokens (`settings.verification`), injected as meta tags on every page.
3. **Check discovery files**: links to `/sitemap.xml`, `/sm-pages.xml`, `/sm-posts.xml`, `/sm-images.xml`, `/robots.txt`, `/llms.txt`. Owners can add robots.txt lines, an llms.txt introduction, sitemap exclusions and extra sitemap URLs (`settings.files`).

#### 9.8 Redirects (`redirects`)

- **Add/edit**: Old URL, Send them to (published page or full `https://` address), permanent (308, default) or temporary (307), note, turned on.
- **Server rules** (`redirect-save`):
  - Paths: `/`-prefixed, max 300 characters, no `//`, not under `/avault`, `/api`, `/_next`, `/media`, `/assets`.
  - The old URL can't be a live page.
  - The destination must be published (or an external https URL) and must not itself be redirected.
  - Duplicate sources are rejected.
  - Saving **flattens chains**: existing redirects pointing at the old URL are re-pointed to the new destination.
- **Table**: filter (All/On/Off/Never used), search, hit counts and last-used time, on/off switch, edit, delete.
- Redirects are served by the public route before the trailing-slash rule; query strings are carried over. Renaming a page adds a 308 redirect automatically.

---

### 10. The page and post editor

Opening a page shows its label, route, revision, an "Unsaved changes" marker, and the toolbar: **Undo**, **Redo**, **Preview**, **Save draft**, **Publish**.

| Tab | Pages | Posts | Purpose |
|---|:---:|:---:|---|
| Live edit | ✓ | | Click-to-edit canvas |
| All fields / Article | ✓ (All fields) | ✓ (Article) | Field list, or the rich-text article editor |
| Search & sharing | ✓ | ✓ | SEO, indexing, social, article details, JSON-LD |
| Sections & blocks | ✓ | | Section order/visibility, content blocks, classification |
| Publishing | ✓ | ✓ | Schedule, change URL (draft must be saved first) |
| Revisions | ✓ | ✓ | History, diff, restore, unpublish, delete draft |

**Save draft** → `POST save`; **Publish** → `POST publish` (runs the publish checks; the page and sitemaps update immediately). **Preview** → `POST preview` returns the unsaved draft rendered with real styles, shown full-screen with Desktop/Tablet/Mobile widths (scripts limited to same-origin, forms disabled, `noindex`).

#### 10.1 Live edit canvas (`page-canvas.tsx`)

- `POST canvas` renders the unsaved draft with every placeholder tagged (`data-av-k` / `data-av-a`) and every section marked (`data-av-section`, `data-av-label`, `data-av-h1`, `data-av-hidden`). Shared header/footer are hidden (they have their own editor); hidden sections show faded.
- **Text**: click to type directly in the page (`contentEditable="plaintext-only"`). Enter finishes; Escape reverts that element.
- **Links, images, buttons**: the inspector shows destination (with a published-page picker), image URL with **Upload a new image** or **choose from the media library**, alt text and other attributes, with "edited" badges and per-field restore.
- **Forms** are locked and point to the Forms screen.
- **Shared header/footer elements** (when visible) select as a whole and point to the Header & footer editor.
- **Field edits never reload the iframe**: changed values are painted into the DOM directly, which is also how Undo/Redo and the All fields tab show up live.
- **Section toolbar** (on hover): move up/down, duplicate, hide/show, remove, and "Add section" below.
  - **Move** and **hide** are local, undoable draft edits; only `<main>` is re-rendered.
  - **Add**, **duplicate** and **remove** are built on the server (`POST section-edit`) and **saved as the draft immediately**, because later saves are validated against the stored template. They can be undone from Revisions.
  - The H1 section can't be duplicated, hidden or removed.
- **Revert page** returns every unsaved change to the last saved draft.

#### 10.2 Section library (`section-library-dialog.tsx`, `lib/avault/section-library.ts`)

- `GET section-library` gathers every top-level section from every page draft (except blog posts and H1 sections), de-duplicated by markup shape, grouped by type (Hero, FAQ, Call to action, Blog list… derived from the section's CSS class).
- By default only sections from pages with the **same page design** (same wrapper classes) are listed; a checkbox includes the rest.
- Picking a section shows a live preview (`POST section-preview`), rendered alone at 1440 px.
- **Insert** copies the section with fresh field keys (the source page's text as a starting point), renames clashing element ids (and their `for`/`aria-*`/`#` references), appends it to `<main>` and positions it with `sectionOrder`. Limit: 60 sections per page.

#### 10.3 All fields tab

Every field grouped by section, with a section list and a text search. Long values use a textarea; URL fields offer a picker of published pages.

#### 10.4 Article editor for posts (`rich-editor.tsx`)

- **TipTap 3**: StarterKit (H2–H4), links, images, tables, text align, highlight, colour (brand navy, brand red, ink, slate), sub/superscript.
- **Article header** pieces (eyebrow, H1 title, introduction, byline/date/reading time) are edited inline from the template's placeholders.
- **Toolbar**:
  - Text: paragraph style, bold/italic/underline/strike/highlight, colour, sup/sub, code.
  - Structure: lists with indent/outdent, alignment, quote, code block, divider.
  - Links: prompts for new tab, and for external links nofollow and sponsored.
  - Media: insert image by URL, upload image (then prompts for alt).
  - Tables: insert a table, plus row/column/merge/split/header/delete tools.
  - Clear formatting, undo/redo.
- Word count and reading time; pasting from Word/Google Docs keeps headings, lists, links and tables.
- **Server sanitising** (`sanitizeBody`, max 400,000 characters): tag and attribute allow-list, `h1` → `h2` (the title owns the only H1), safe URL schemes only, `noopener noreferrer` on new-tab links, lazy images, tables wrapped in `div.article-table`.
- **Related posts** ("Keep exploring") are generated automatically: same category +6, same topic +4, +1 per shared title word; top two, plus an "All articles" link.
- The category and tag picker sits below the editor. Errors from it and from image uploads show as toasts.

#### 10.5 Search & sharing tab (`panels.tsx` `SeoTab`)

- Search title (falls back to the site title template; warns over 65 characters), description (warns over 170), automatic canonical, and a search-result preview.
- Indexing: noindex (also removes from sitemaps), nofollow, noarchive, include in sitemap.
- Social: OG title/description, social image and its description, Twitter/X card type.
- Article details (posts and case studies): author name and URL, excerpt, featured image and description, first-published date.
- Structured data: explains the automatic schema, plus an **Additional JSON-LD** box. Server rules: valid JSON object or array of up to 10, max 20,000 characters, `@type` from an allow-list (Service, Product, Offer, HowTo, VideoObject, ImageObject, Event, Course, Review, ItemList, Person, Place, ContactPoint, Dataset, SoftwareApplication, CreativeWork), no `aggregateRating`/`ratingValue`.

#### 10.6 Sections & blocks tab (`content-tools.tsx`)

- **Page sections**: show/hide checkboxes and move up/down for each section.
- **Additional content blocks** appended after the page's sections. Types: paragraph, heading (H2–H6), image (URL, alt, caption), quote, list (bulleted/numbered), table (`|`-separated rows, first row is the header), call to action (button link), cards, code, rule, form (a custom form by ID). Every block has an accent colour and alignment.
- Inline formatting in block text: `**bold**`, `*italic*`, `__underline__`, `~~strike~~`, `==highlight==`, `^sup^`, `~sub~`, `` `code` ``, and links `[text](url "newtab nofollow sponsored")`, with toolbar buttons that insert them.
- Server limits: 100 blocks, unique ids, safe URLs, 50 list items, 50×12 table cells.
- **Classification**: category and tags.

#### 10.7 Publishing tab (`PublishingTools`)

- **Schedule the saved revision** at a chosen local time.
- **Change this page's URL**:
  - **Review affected pages** (`POST rename-impact`) lists every page whose links will change.
  - **Apply** (`POST rename`) does the following in one write: moves the page to the new URL, rewrites internal links across all pages (fields, article bodies, blocks, markdown links), remaps header/footer and menu links, re-points existing redirects, and adds a 308 redirect from the old URL.
  - If anything changed since the review, the server returns 409 and you review again.

#### 10.8 Revisions tab

- **Load revisions** lists each save with time, actor and state.
- **View changes** shows a before/after table of changed fields, SEO keys, label/author/author URL/excerpt/featured image/category, tags, the article text (first 600 characters; "formatting changed" when only markup differs), page structure (sections added or removed), section order/visibility and block counts.
- **Restore as draft**: if the revision has the same sections as now, it loads as an unsaved draft. If the sections differ, the server restores it as the saved draft (`revision-restore`). Publish to make it live.
- **Unpublish page**: the URL returns 404 until published again.
- **Delete draft** (owner): only for pages that were never published and that no published page links to.

---

### 11. Conversion screens

#### 11.1 Leads (`leads`)

A two-pane inbox (`leads-inbox.tsx`).

- **Folders**: Inbox (new + read), New, Spam, Archived, All, with counts.
- **Search** across name, phone, email, ZIP, service, details, page and extra fields, or an exact IP.
- **Email delivery filter**: Emailed, Failed, Sending, Saved only, Not emailed (spam).
- **Export CSV** (up to 5,000 newest leads, all statuses). Cells starting with `= + - @` are prefixed with `'` to prevent spreadsheet formula injection. The export is logged.
- **Table**: contact (unread dot), ZIP, service and details, delivery status, received. 50 per page.
- **Bulk actions** on selected rows: Mark read, Archive, Mark spam / Not spam.
- **Opening a lead** marks it read and shows:
  - **Request**: all fields, including custom form fields.
  - **Visit**: page it was sent from, referrer, UTM campaign, time on page.
  - **Sender**: IP, country, device, language, raw user agent.
  - **Spam protection**: "Flagged: <reasons>", "Passed every check", or "Not checked".
  - **Email notification**: status, attempts, delivered time, error, and **Retry email** (or "Send the email anyway" for spam).
  - Actions: Reply (mailto with a prepared subject), Spam/Not spam, Archive/Restore, Mark unread, and **Delete permanently** (owner).

**How a lead arrives** (`app/api/forms/submit/route.ts`):

1. Same-origin check; body ≤ 12,000 characters.
2. **Honeypot**: if the hidden `contact_me_by_fax` field is filled, the server replies with success and stores nothing.
3. **Signed token** (from `GET /api/forms/token/`): HMAC-signed, valid between 2.5 seconds and 6 hours after issue.
4. **Field rules**: name 2–150, phone ≥ 7 digits, 5-digit ZIP, service required, optional valid email; plus the form's custom `x_` fields (required/choices). A submission rejected here keeps its token, so the visitor can correct it and send again.
5. **Token used up**: only now is the token marked used (single use); a replay gets "This request was already sent."
6. **Rate limits**: 4 per IP per hour, 12 per IP per day, 3 per email (or phone) per day → 429.
7. **Spam heuristics** (`spam.ts`): links or symbols in the name, random-looking or vowel-less names, name copied from the email, disposable email domains, non-Latin scripts, links in the message, spam phrases, messages over 600 characters, sent within 4 seconds, duplicate in the last 24 h.
8. The lead is **stored first** — as `new`/`pending`, or `spam`/`blocked` if flagged — then emailed (non-spam only).
9. The visitor always sees "Thank you. Your estimate request has been received."

#### 11.2 Forms (`site-forms`)

Edits the forms the website shows (`forms-editor.tsx`, `lib/avault/forms.ts`, `settings.forms`).

- **Door repair estimate form** (`contact`): every `<form class="audit-form">` on the site.
- **Quick ZIP form** (`hero`): `<form class="hero-proposal">` in hero sections (label, placeholder, button).
- **Reusable custom forms**: new forms (cloned from the estimate form) with their own ID, placed on pages as a **Form block** in Sections & blocks.
- **Field editor**:
  - Each field has a label, placeholder, type (short text, phone, long text, dropdown with choices), required and half-width (two half-width fields sit side by side).
  - Fields can be reordered.
  - The core fields **name, phone, ZIP, service** are locked: they can't be removed, retyped or made optional.
  - New fields are named `x_<slug>` and arrive on the lead under "Request" by their label.
- **Button text**, the note under the button, and the **request type** (shown on each lead and in the email subject).
- **Live preview** with the site's real styles, Desktop/Mobile, and the list of pages where the form appears.
- **Publish** (owner) → `POST configuration {key:'forms'}`.
  - Limits: up to 20 fields and 20 custom forms; unique names and IDs.
  - Publishing changes every page at once: `applyForms()` rewrites the inner markup of matching forms at render time and keeps each page's `<form>` tag.

#### 11.3 Calls (`calls`)

Every tap on a `tel:` link, recorded by the analytics script as a `call` event.

- KPI tiles: today, 7 days, 30 days, all time.
- Range tabs (Today, 7, 30 (default), 90 days, All time) and a country filter.
- Insight bars: numbers tapped, pages that bring calls, caller countries (click to filter).
- Table: number, page, caller (country, IP, browser/OS/device), time. Click a row to see that visitor's journey step by step.

#### 11.4 Visitors (`visitors`)

First-party analytics.

- Live "N on the site now" (sessions active in the last 90 s, refreshed every 30 s).
- KPIs: visits (sessions), visitors (stable visitor ids), page views, leads sent, call taps.
- Insight bars: countries, most viewed pages, referrer sites.
- Table grouped by **each visit**, **each visitor** or **each IP**, with exact search by IP/visitor/session id: landing page and referrer, pages and clicks, "Sent a lead" / "Tapped to call" pills, time on site.
- **Journey**: every page view (with time spent), click, form send and call tap, with elapsed times.

How it's collected: see [§13.3](#133-visitor-analytics).

---

### 12. Administration screens

#### 12.1 Site settings (`settings`)

The business profile in `settings.global` (`people-views.tsx` `SettingsForm`, `lib/avault/site.ts`). Administrators can view; only owners can change.

- **Business identity**: name, legal name, tagline, business type (Organization, ProfessionalService, LocalBusiness, Corporation), logo and default sharing image (URL or upload).
- **Contact**: phone (required), email, area served. These replace the phone, `tel:` links and email on every page at render time.
- **Address & map**: street, city, state, ZIP, country, Google Maps link, optional latitude/longitude.
- **Opening hours**: per-day switches and times, "Copy Monday to weekdays". Stored as lines like `Mo-Fr 09:00-17:00`. Hours and price range appear in schema only for local business types.
- **Social profiles**: Facebook, Instagram, LinkedIn, X, YouTube, TikTok, Pinterest (each URL checked against its network's domain).
- **Search appearance**: title template (must contain `%s`), default description, and a search-result preview.
- Save → `POST settings` (revision-checked, versioned).

#### 12.2 Email (`email`) — owner

How new leads reach the inbox (`lib/avault/email.ts`, `settings.email`).

- **Email new leads** master switch. When it's off the site runs in **save-only mode**: leads are stored and marked "Saved only".
- **Step 1 — provider**:
  - **Gmail / Google Workspace**: SMTP `smtp.gmail.com:465` with username and app password.
  - **Other SMTP**: host, port 465/587/2525/25, username, password.
  - **Mailgun**: domain, US/EU region, API key.
- **Step 2**: sender name, from address, 1–10 recipients, optional reply-to for tests.
- **Step 3 — Send a test** (`POST email-test`): works even when delivery is off; shows "Accepted by the provider" or the error.
- **Secrets** (SMTP password, Mailgun key) are sealed with AES-256-GCM and never sent back to the browser. Leaving the field blank keeps the saved secret.
- **Delivery** (`deliverForm`): claims the lead (`sending`, attempt +1, max 5 attempts), counts the sender's earlier requests, and sends "New request: <service> from <name>" (HTML + text, Reply-To = the lead's email). Then marks the lead `sent` or `failed`. Failed sends are retried by maintenance.
- **Lead email** (`lead-email.ts`):
  - Branded HTML with Reply / Call / Open in AVAULT buttons.
  - Request, Visit (Eastern time) and Sender cards, including the spam check result and earlier requests.

#### 12.3 Users (`users`) — owner

- **Add a user**: email, a generated 18-character temporary password (regenerate/copy), role. Send the password to the person securely.
- **Table**: role (inline change), allowed to sign in (switch), last sign-in, **Reset password** (generates a new one and signs them out everywhere), **Delete**. You can't change your own status, reset or delete yourself, or remove the last active owner.
- **Your password** (all users): current password plus a new one (12–128 characters). After changing it you're signed out and must sign in again.

#### 12.4 Privacy & tracking (`privacy`) — owner

Stored in `settings.operations`.

- **Visit recording** switch. When it's off, the analytics script isn't added and `/api/events/` rejects everything.
- **Facts shown**: what's recorded, how opt-outs work, and how much is stored now (event count, oldest event, leads/archived/spam).
- **Retention**:
  - Visit records: 30 days, 90 days, 180 days, 1 year or 2 years.
  - Archived and spam leads: forever, 90 days, 180 days, 1 year or 2 years.
  - Inbox leads are never auto-deleted.
  - Enforced by maintenance every 10 minutes.
- **Daily backup** switch (same flag as on Backups). Backups include leads but not visit records.
- **Data requests**: look up an email or IP, see the matching leads and visit records, then delete them all. To delete, you must type the email or IP again to confirm. The activity log masks the email. Older backups still contain the leads until those backups are deleted under Backups.
- **Privacy-policy wording**: a generated paragraph matching your settings, with copy and a link to edit `/privacy-policy/`. Once that page is published, a "Privacy policy" link is added to the footer.

#### 12.5 Custom scripts (`scripts`) — owner

Third-party code added without editing the site (`lib/avault/snippets.ts`, `settings.scripts`).

- Master switch, plus a per-script switch.
- **Templates**:
  - Google Analytics 4 (`G-…`)
  - Google Tag Manager (`GTM-…`)
  - Meta Pixel
  - Microsoft Clarity
  - Custom code
- **Per script**: name, placement (`<head>`, start of `<body>`, end of `<body>`), code, pages (all pages or a list of paths; `/blog/*` matches a section), and **Respect visitors' privacy choice**.
- **Check on live site**: fetches a page and looks for the script's marker comment.
- **How scripts are injected** (`enhancePublic`):
  - Every `<script>` receives the page's CSP **nonce**.
  - Each snippet is preceded by `<!-- avault:snippet:<id> -->`.
  - Privacy-respecting snippets are held in a `<template>` and only cloned into the page when the visitor has no Global Privacy Control signal and hasn't opted out.
  - While custom scripts are on, the CSP widens `script-src` and `connect-src` to `https:`.
- **Limits**: 30 snippets, 30,000 characters each, 50 page patterns.

#### 12.6 Traffic access (`traffic`) — owner

Decides who can open the **public** website (`settings.traffic`). AVAULT and the API are never blocked.

- **Rules**:
  - **Always allow**: IPv4 or IPv6 addresses or CIDR ranges (`203.0.113.7`, `203.0.113.0/24`, `2001:db8::/32`), with an "Add my IP" shortcut.
  - **Block IPs**: IPv4 or IPv6 addresses or CIDR ranges.
  - **Block countries**: two-letter codes.
  - Up to 100 entries per list.
- **Order**: allow list → block IPs → block countries → open. An unknown country is allowed. IPv4-mapped IPv6 addresses (`::ffff:203.0.113.7`) are matched as IPv4.
- Blocked visitors get the `/access-denied/` page with status 403.
- A warning appears if the rules would block your own IP (including through a range) or country.
- Matching lives in `lib/avault/ip.ts`, used by both the server (`trafficAllowed`, settings validation) and the screen, so they always agree.
- Country comes from the `CF-IPCountry` header or the offline database (see [§13.6](#136-country-lookup)).

#### 12.7 Backups (`backups`) — owner

- **Back up now** and a **Daily backup** switch.
- **What a backup contains** (`createBackup`, `lib/avault/runtime.ts`):
  - Collections: `documents`, `settings`, `redirects`, `media`, `taxonomy`, `users`, `schedules`, `forms` (leads), `revisions`, `activity`. Visit `events` are **not** included.
  - Uploaded media files are copied in GridFS to `private-backups/media/<id>/`.
- **Encryption**: the JSON snapshot is sealed with AES-256-GCM (`AVAULT_ENCRYPTION_KEY`) and stored at `private-backups/YYYY-MM-DD/<id>.enc`. A SHA-256 checksum of the plaintext is verified on every read.
- **Saved backups** table (newest 50), with:
  - **Download**: returns the snapshot **still encrypted** (`avault-backup-<date>-<id>.enc`), with its SHA-256 checksum in the `X-Backup-Checksum` response header. Open it with `npm run backup:decrypt -- <file>.enc` using the same site's `AVAULT_ENCRYPTION_KEY`. The decrypted JSON contains leads and password hashes, so keep it private.
  - **Inspect & restore**: verifies the backup, shows its origin, date and record counts, and lists its pages.
  - **Delete** (every backup except the latest): removes the encrypted snapshot, its media file copies and its record. Logged as "Deleted a backup".
- **Restore one page**:
  - Pick a page from an inspected backup.
  - The server first makes a fresh backup, then writes the backup's draft and published copies as a **new revision** (revision-checked). Logged as "Restored a page from backup".
  - There is no whole-site restore in the UI; for that, decrypt a download and restore the collections with MongoDB tools.

#### 12.8 System health (`health`)

`GET health` checks and shows a status card for each:

| Check | OK | Warning | Problem |
|---|---|---|---|
| Database | Ping < 500 ms | Slow | — |
| Lead emails | Sending | Save-only mode, or failures in the last 7 days | Not set up |
| Scheduled jobs | Ran < 30 min ago | < 2 h | Older / never |
| Backups | Latest < 8 days | Older | None |
| Leads this week | Count and spam caught | — | — |

It also shows the site host, server uptime, Node version, and the last maintenance results (posts published, failed, skipped as changed, backup created). Owners get **Run maintenance now**.

#### 12.9 Activity log (`activity`)

Every change made in AVAULT, newest first, grouped by day.

- Filters: free-text search, person, action, from/to dates. 50 per page.
- Page actions link to the page in the editor.
- Each action has a plain-language label (`ACTIONS` in `admin-views.tsx`). Settings saves are named by area — "Changed email settings", "Changed traffic access", "Changed the forms", "Changed privacy & tracking" and so on — from the settings key stored as the entity.
- Actions recorded include:
  - Content: `create`, `save`, `publish`, `unpublish`, `section-insert`/`-duplicate`/`-remove`, `revision-restore`, `rename`, `create-family`, `schedule`, `cancel-schedule`, `scheduled-publish`, `delete-draft`
  - Media: `upload`, `media-alt`, `media-replace`, `media-metadata`, `archive-media`
  - Redirects and taxonomy: `redirect`, `redirect-update`, `redirect-delete`, `taxonomy`, `delete-taxonomy`
  - Leads: `form-status` (one lead), `form-bulk` (several), `delete-submission`, `export-leads`, `email-retry`, `email-test`
  - Settings and navigation: `settings` (entity = settings key), `navigation`
  - Users and sign-in: `users` (create/role/active/password reset), `delete-user`, `password`, `sign-in`. Entries written before this change used `access` for user changes; they are labelled "Changed a user" too.
  - Backups and privacy: `backup`, `backup-delete`, `restore-page`, `privacy-erase`
- The scheduler's 10-minute runs are not logged (their results are on System health).
- The log is never pruned automatically.

---

### 13. Public-site features driven by AVAULT

#### 13.1 The public request pipeline (`app/[[...path]]/route.ts`)

For every GET that isn't a static file or API route:

1. **Traffic rules** → 403 access-denied page if blocked.
2. `/media/<key>` → file from GridFS (one-year immutable cache).
3. `/robots.txt` → saved additions + `Allow: /`, `Disallow: /avault`, `Disallow: /api/`, `Sitemap:` line.
4. `/llms.txt` → saved introduction + a list of every indexable published page with its description.
5. `/sm_*.xml` legacy names → 301 to `/sm-*.xml`.
6. `/sitemap.xml` (index), `/sm-pages.xml`, `/sm-posts.xml`, `/sm-images.xml` → published, indexable, sitemap-enabled pages, minus exclusions, plus extra URLs.
7. **Redirects** from the `redirects` collection (counts hits).
8. Missing trailing slash → 308 to `path/`.
9. `/thank-you/` → code-owned system page.
10. Published document → `render()` → `enhancePublic()` → admin bar if signed in. Missing → 404 system page.
11. Any error → 503 "temporarily unavailable" with `Retry-After: 60`.

Every HTML response is `no-store` and carries a Content-Security-Policy with a fresh nonce.

#### 13.2 `enhancePublic()` (`lib/avault/public-controls.ts`)

Applied after rendering:

- Adds `width`/`height` to uploaded images.
- Adds Google/Bing verification meta tags.
- Injects custom scripts (see [§12.5](#125-custom-scripts-scripts--owner)).
- Adds the analytics script tag.
- Appends extra menus.
- Applies saved forms.
- Inserts the honeypot field into estimate forms.
- Adds the privacy-policy footer link.
- Appends an "All blog posts" grid on `/blogs/`.

#### 13.3 Visitor analytics

- `public/avault-analytics.js` gives each browser a session id (sessionStorage) and a visitor id (localStorage).
- **It sends**: `page` on load, `leave` with seconds spent, `click` for links and buttons, `call` for `tel:` links, `form` on submit, and a `heartbeat` every 60 s while the tab is visible.
- **Transport**: `navigator.sendBeacon` (falling back to a keepalive `fetch`), posted to `/api/events/`.
- **The server ignores**:
  - everything, when analytics is off;
  - visitors with Global Privacy Control;
  - signed-in staff (`avault_session` cookie);
  - bots and empty user agents;
  - `/avault` and `/api` pages.
- **Rate limits**: 2,000 per IP per hour and 60 per session per minute.
- Only the referrer's origin and path are stored.
- **Opt-out**: a footer button "Don't track my visits" sets `localStorage avault-optout=1`.

#### 13.4 Admin bar

When a signed-in AVAULT user views the public site, a 40 px bar is injected at the top. It has an AVAULT link, **Edit page/post** (opens this route in the editor), Leads with the new-lead count, SEO review, a "Hidden from search" badge when the page is `noindex`, the user's email and Sign out.

#### 13.5 System pages

`lib/avault/system-pages.ts` draws `/thank-you/` and the 404 page from code inside the homepage's header and footer, both `noindex`. `/thank-you/` counts as a valid link and redirect destination (`SYSTEM_ROUTES`).

#### 13.6 Country lookup

`lib/avault/geo.ts` uses the `CF-IPCountry` header when present, otherwise an offline MaxMind-format database from `@ip-location-db/geo-whois-asn-country-mmdb` (no network calls). Update the npm package to refresh the data. A country of `-` means it was looked up and not found.

---

### 14. Background jobs (maintenance)

`runMaintenance()` (`lib/avault/runtime.ts`) is triggered by:

- the **built-in scheduler** (`instrumentation.ts` → `lib/avault/scheduler.ts`): 60 s after boot, then every 10 minutes, in production;
- an **external cron**: `curl -X POST -H "Authorization: Bearer $AVAULT_JOBS_SECRET" https://<site>/api/maintenance/`;
- **Run maintenance now** on System health (owner).

A lock row (`rate_limits.maintenance-lock`, 5 minutes) prevents overlapping runs (409). Each run:

1. Publishes up to 20 due schedules (skips them if the draft changed; retries them next run if the publish checks fail).
2. Creates the daily backup if enabled and the last one is more than 24 h old.
3. Deletes visit events older than the retention period.
4. Deletes expired rate-limit rows.
5. Retries up to 10 failed lead emails (fewer than 5 attempts).
6. Deletes archived/spam leads past their retention, if one is set.
7. Fills in missing countries on events and leads.
8. Rewrites legacy Microsoft icon URLs in stored pages.
9. Saves `{at, results}` to `settings.last-maintenance` (read by System health and Overview). This is written directly, so it adds no revision or activity entry.

---

### 15. Admin API reference

All endpoints are `/api/admin/<action>/`. GET requires a session. POST requires a session (except login/logout) **and** an `Origin` header matching the site, with a JSON body up to 1.5 MB.

**Dispatch order**: `extraGet`/`extraPost` (`lib/avault/admin-extra.ts`) → `extendedGet`/`extendedPost` (`lib/avault/extended.ts`) → inline branches in `route.ts`. The first match wins, so when adding an endpoint, make sure its name isn't already handled earlier.

Roles in the tables: **any** means any signed-in user; **owner** means the owner role only.

#### GET

| Action | Role | Returns |
|---|---|---|
| `session`, `whoami` | any | Current user; requester IP and country |
| `settings` | any | Business profile + revision |
| `documents` | any | All pages with status, schedule, unpublished-changes flag |
| `document?route=` | any | Full draft |
| `sections?route=`, `section-library?route=` | any | Section list; section library |
| `navigation` | any | Header/footer fields, overrides, canvas HTML |
| `backlinks?route=` | any | Published pages linking to a route |
| `revisions?route=`, `revision?id=` | any (owner for `@settings`) | Revision history / one revision |
| `audit` | any | SEO errors/warnings per page |
| `overview` | any | Dashboard data |
| `media?page=`, `media-usage?url=` | any | Media library; where a URL is used |
| `redirects`, `schedules`, `taxonomy` | any | Lists |
| `forms?q=&status=&delivery=&page=` | any | Leads + counts |
| `forms-export` | any | Leads CSV |
| `calls`, `calls-summary`, `visitors`, `visitors-summary`, `journey`, `presence`, `events` | any | Analytics |
| `activity?q=&actor=&action=&from=&to=` | any | Activity log |
| `site-forms` | any | Forms config + preview shell |
| `health` | any | Health checks |
| `email-config` | owner | Email config without secrets |
| `configuration?key=` | owner | `email`, `scripts`, `traffic`, `operations`, `verification`, `files`, `menus` |
| `privacy-stats` | owner | Stored data counts |
| `users` | owner | User list (no hashes) |
| `backups`, `backup-download?id=` | owner | Backup list; the encrypted backup file (checksum in `X-Backup-Checksum`) |
| `export` | owner | Unencrypted JSON of documents, settings, redirects |

#### POST

| Action | Role | Does |
|---|---|---|
| `login`, `logout` | none | Sign in/out |
| `password` | any | Change own password (signs out) |
| `create`, `family` | any | New draft page/post; 1–15 drafts from a template |
| `save`, `publish`, `unpublish` | any | `{document, expectedRevision}` |
| `preview`, `canvas`, `section-preview` | any | Rendered HTML |
| `section-edit` | any | `op: insert \| duplicate \| remove`, saved immediately |
| `revision-restore` | any | Restore a revision as the draft |
| `document-delete` | owner | Delete a never-published draft |
| `rename-impact`, `rename` | any | Change a page URL (dry run, then apply) |
| `schedule`, `schedule-cancel` | any | Scheduled publishing |
| `taxonomy`, `taxonomy-delete` | any | Categories & tags |
| `media` (multipart) | any | Upload |
| `media-update`, `media-alt` | any | Details; alt text everywhere (dry run, then apply) |
| `media-replace`, `media-delete` | owner | Replace everywhere; archive unused |
| `redirect-save`, `redirect-delete` | any | Redirects |
| `navigation` | owner | Publish header/footer overrides |
| `settings` | owner | Business profile |
| `configuration` | owner | Save a settings key (`email`, `verification`, `scripts`, `operations`, `traffic`, `files`, `forms`, `menus`) |
| `configuration-restore` | owner | Restore a settings revision |
| `email-config`, `email-test` | owner | Email setup; test send |
| `email-retry` | any | Re-send a lead email |
| `form-status`, `form-bulk` | any | Lead status (one / up to 200) |
| `form-delete` | owner | Delete a lead |
| `privacy-lookup`, `privacy-erase` | owner | Data requests |
| `users`, `user-delete` | owner | Manage users |
| `backup`, `backup-inspect`, `backup-restore-page`, `backup-delete` | owner | Backups (the latest backup can't be deleted) |
| `maintenance` | owner | Run maintenance now |

#### Public endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/forms/token/` | Signed single-use form token |
| `POST /api/forms/submit/` | Lead submission |
| `POST /api/events/` | Analytics beacon |
| `POST /api/maintenance/` | Cron trigger (Bearer `AVAULT_JOBS_SECRET`) |

#### Error format

Errors are `{"error": "<message for the user>"}` with a meaningful status:

| Status | Meaning |
|---|---|
| 401 | Sign in |
| 403 | Owner only, or bad origin |
| 404 | Not found |
| 409 | Changed elsewhere, or a URL/key is already taken — reload (nothing was written) |
| 413 | Request too large |
| 422 | Validation failed |
| 429 | Rate limited |
| 503 | Temporarily unavailable or misconfigured |

Unexpected errors are logged and returned as 503 "Temporarily unavailable. Your changes have not been discarded."

---

### 16. Security model

| Area | Measure |
|---|---|
| Authentication | scrypt password hashes; timing-safe compare; dummy hash for unknown emails; login rate limits |
| Sessions | HMAC-signed, 4-hour, `HttpOnly`, `SameSite=Strict`, `Secure` cookie; re-validated against MongoDB on every request; `session_version` revocation |
| CSRF | Every POST (including login, forms and events) requires an `Origin` equal to `NEXT_PUBLIC_SITE_URL` or the forwarded request origin |
| Authorization | Owner/administrator checks on the server for every sensitive action, mirrored in the UI |
| Concurrency | Revision checks on documents and settings; `updatedAt` check on media; dry-run "expected impact" check on bulk operations (rename, alt text, replace); all-or-nothing batches (up-front checks + transactions on a replica set) |
| Input | All field values HTML-escaped; article HTML sanitized with an allow-list; `safeUrl` on every link; template can't be changed from the browser; custom JSON-LD type allow-list; upload type sniffed from bytes; CSV injection guard |
| Encryption at rest | AES-256-GCM (`AVAULT_ENCRYPTION_KEY`) for email secrets and backups; SHA-256 integrity check on backups; backup downloads stay encrypted |
| Headers | `no-store`, `nosniff`, `X-Frame-Options: SAMEORIGIN`, strict referrer policy, permissions policy, HSTS; per-request nonce CSP on public pages; stricter CSP on previews |
| Spam and abuse | Honeypot, signed single-use tokens with minimum/maximum age, IP and email rate limits, content heuristics, event rate limits; traffic rules for IPv4 and IPv6 |
| Client IP | The rightmost `X-Forwarded-For` entry (the one the reverse proxy adds), so visitors can't spoof it |
| Indexing | `/avault` pages are `noindex`; robots.txt disallows `/avault` and `/api/` |
| Privacy | Staff browsing, bots and GPC visitors aren't tracked; opt-out link; retention limits; data erase tool |

---

### 17. Reusing AVAULT on another project

The step-by-step version of this section, written for an AI agent and starting with the setup questions, is Part A of this kit.

AVAULT is self-contained in `app/avault/`, `lib/avault/`, `app/api/admin/`, `app/api/forms/`, `app/api/events/`, `app/api/maintenance/`, `app/[[...path]]/route.ts`, `db/mongo.ts`, `proxy.ts`, `instrumentation.ts` and `public/avault-analytics.js`. To move it to another site:

1. **Copy those paths** plus `components/ui/*` (shadcn components used by the admin) and the dependencies listed in `package.json`.
2. **Change project values**:
   - `lib/avault/config.ts` — `name`, default `phone`/`phoneDisplay`, `zone`, `logo`, `image`, `SYSTEM_ROUTES`.
   - `lib/avault/site.ts` — profile defaults.
   - Brand strings in `app/avault/page.tsx`, `login/page.tsx`, `vault.tsx` (title template default, sidebar alt text), `leads-inbox.tsx` (reply subject), `lead-email.ts`, and the CSV filename in `admin-extra.ts`.
   - The brand palette blocks at the end of `app/avault/theme.css`.
   - `render.ts` replaces the original phone strings (`+18885990548`, `888-599-0548`) with the profile phone — update those literals to the new site's template values.
3. **Template conventions** the code relies on:
   - one `<main>` with top-level `<section>`s;
   - header in `.header-wrap`/`<header>` before `<main>`, and footer after `</main>`;
   - estimate forms with class `audit-form`, hero ZIP forms with class `hero-proposal`;
   - FAQ items as `<details class="faq-item">`;
   - article templates containing `{{BODY}}`, `{{RELATED}}`, `.article-eyebrow`, `.article-deck`, `.article-meta`;
   - `{{SEO}}` in `<head>`.
4. **Migrate content**: adapt `scripts/migrate-dmv-avault.mjs` (site shell, `kind` rules per route, default `global` settings, and the seeded estimate form in `modules.forms` so its fields and wording fit the new business).
5. **Environment**: new `MONGODB_DB`, `NEXT_PUBLIC_SITE_URL`, a **new** `AVAULT_ENCRYPTION_KEY` and `AVAULT_JOBS_SECRET` per project.
6. Run `npm run admin:create -- owner@example.com owner`, then `npm run db:verify-content`.
7. Deploy using `docs/DEPLOYMENT.md` (one PM2 instance per site).

---

### 18. Extending AVAULT

#### Add a new screen

1. Build a panel component (e.g. in a new `app/avault/my-panel.tsx`) that takes `{role, notice}` and uses `request()` from `content-tools.tsx`.
2. Add an entry to the `menu` array in `vault.tsx`: `['my-view', 'Label', Icon, 'Group']`.
3. Add a subtitle in the `vault-title` description chain and render `{view==='my-view'&&<MyPanel …/>}`.
4. For owner-only screens, render an "Only owners can …" card when `role!=='owner'` and enforce the same rule on the server.

#### Add an admin endpoint

- Add a branch to `extendedGet`/`extendedPost` (`lib/avault/extended.ts`) or `admin-extra.ts`. Check the action name isn't already handled earlier in the dispatch order.
- Use `HttpError(status, message)` for user-facing errors. Check `user.role==='owner'` where needed.
- Record changes with `recordActivity(actor, action, entity)`. Add a friendly label for new actions in `ACTIONS` in `admin-views.tsx`.
- For multi-page writes, use `mutateMany()` so each page gets a revision row and a write guard.

#### Add a settings module

- Add the key to the allow-lists in `extended.ts` (`configuration` GET/POST and `configuration-restore`), with a validation branch.
- Save it with `settingsSave()` so it's versioned and restorable.
- Read it at render time in `enhancePublic()` if it affects public pages.

#### Add a content block type

- Add the type to `validateBlocks` and `renderBlocks` in `lib/avault/blocks.ts`.
- Add it to the type select and its inputs in `ContentTools` (`content-tools.tsx`).
- Style `.avault-content-block` variants in the site CSS.

---

### 19. Known limitations and caveats

#### Fixed (October 2026)

These problems were found while first documenting AVAULT and have been fixed:

| Problem | Fix |
|---|---|
| `batch()` ran statements one by one, so a failure part-way through left earlier writes in place while the message said "No changes were applied" | Guards and unique keys are checked before anything is written, and batches run in a transaction on a replica set (`db/mongo.ts`). Duplicate-key and stale-revision errors return 409 |
| Dead handlers in `route.ts` (GET `documents`, `audit`, `media`, `forms`, `activity`, `redirects`; POST `settings` and the legacy `redirects`) and a shadowed `email-test` in `extended.ts` | Removed. The legacy POST `redirects` also skipped the redirect-chain checks |
| Coarse activity labels: settings saves all "Changed site settings", user changes shown as "Changed traffic access", bulk lead changes as `form-status`, backup restores as a generic label | Settings saves are named by area; user changes log `users`; bulk changes log `form-bulk`; restores log `restore-page`; missing labels added |
| Every 10-minute maintenance run added a revision row and an activity entry | `last-maintenance` is written directly |
| Backup downloads were decrypted plaintext JSON | Downloads stay encrypted; `npm run backup:decrypt` opens them |
| Privacy screen said backups include visits (they don't) | Wording corrected on Privacy and Backups |
| No way to delete backups | Owners can delete any backup except the latest |
| Archiving media left the file in GridFS | The file is deleted too (the backup made first keeps a copy) |
| Form tokens were used up before field validation, so a corrected resubmission failed | The token is used up only after the fields pass |
| Traffic rules were IPv4 only, and the "you would be blocked" warning ignored CIDR ranges | IPv4 and IPv6 addresses and ranges, shared matching code (`lib/avault/ip.ts`) for server and screen |
| The migration didn't create `forms`, `scripts`, `menus`, `traffic` (and other) settings | Seeded when missing |
| `globals()` error named a non-existent `db:migrate-pages` script | Now says `db:migrate-avault` |
| The live canvas's "shared header/footer" inspector could never appear | Clicking a shared element now selects it and links to Header & footer |
| The revision diff ignored the article body, tags, author URL and template | All compared |
| The post editor's category/tag picker and image upload used `alert()` | Toasts |
| Toast colour depended only on wording | Server errors are always shown as errors |
| The public form script (`public/dmv-runtime.js`) overwrote every form's `request` with a fixed value, so custom forms lost their request type and extra-field checks | It keeps the form's own hidden `request` value |
| An ended session showed "Sign in to continue." toasts instead of going to the sign-in page | Every admin call redirects to sign-in on 401 and returns to the same screen afterwards |

#### Still open

- **Standalone MongoDB has no transactions.** On a standalone server the up-front checks prevent the common conflicts, but an unexpected failure part-way through a batch (for example a dropped connection) can still leave earlier statements applied. Run MongoDB as a replica set for full rollback.
- **Re-running the migration overwrites content.** `db:migrate-avault -- --apply` replaces migrated pages and the `global` profile every time it runs.
- **No full-site restore in the UI.** Only single pages can be restored from a backup.
- **Revisions and activity are never pruned.**
- **Client-side messages** (not from the server) are still coloured by wording.

---

### 20. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| "AVAULT_ENCRYPTION_KEY is not configured." | Set a 64-character lowercase hex key and restart |
| Sent to the sign-in page while working | The 4-hour session ended, or an owner changed your password, role or access. Sign in and you return to the same screen |
| Everyone signed out after deploy | `AVAULT_ENCRYPTION_KEY` changed; backups and saved email passwords made with the old key can't be read |
| "Reload this page before trying again." on every save | `NEXT_PUBLIC_SITE_URL` doesn't match the browser origin, or the proxy isn't forwarding `Host`/`X-Forwarded-Proto` |
| "Reload the page before saving." / 409 | Someone (or the scheduler) saved this page or setting after you opened it. Reload, reapply |
| Publish fails with a list of issues | Fix the listed links, description or canonical; unpublished link targets must be published first |
| "Global site settings are missing from MongoDB." | Run `npm run db:migrate-avault -- --apply` |
| Forms screen: "Form settings are missing from MongoDB." | Restore `settings.forms` from a decrypted backup. On a brand-new database the first migration run creates it — don't re-run the migration on a live site, it overwrites migrated pages |
| Scheduled posts don't publish; Health says "Scheduled jobs: not run" | Scheduler only runs in production (or `AVAULT_SCHEDULER=on`); check PM2 is running one instance, or set up the external cron |
| Leads show "Saved only" | Email delivery is off — Email screen |
| Leads show "Failed" | Check the error on the lead, send a test from Email, then Retry |
| Visitors screen empty | Analytics off (Privacy & tracking), or you're browsing while signed in (staff visits aren't recorded) |
| Countries show as blank or "-" | The `@ip-location-db` package is missing in `node_modules`, or the IP isn't in the database |
| Locked out of the public site | Traffic rules never block `/avault` — sign in and turn the rules off |
| `backup:decrypt` says "Could not decrypt" | The key in the environment isn't the one the backup was made with, or the file was changed |
| "Something changed or that address is already taken. No changes were applied." | Another session saved first, or the URL already exists — reload and redo the change |
| Lost every owner account | `npm run admin:create -- you@example.com owner` on the server |


---

# Part C — Source

## C.1 Dependencies

Add these to the website's `package.json` (keep the site's own versions where they are newer and compatible). Node ≥ 22.13 and Next.js 16 are required.

```json
{
  "dependencies": {
    "@ip-location-db/geo-whois-asn-country-mmdb": "^2.3.2026061719",
    "@tiptap/extension-highlight": "^3.31.4",
    "@tiptap/extension-image": "^3.31.4",
    "@tiptap/extension-subscript": "^3.31.4",
    "@tiptap/extension-superscript": "^3.31.4",
    "@tiptap/extension-table": "^3.31.4",
    "@tiptap/extension-text-align": "^3.31.4",
    "@tiptap/extension-text-style": "^3.31.4",
    "@tiptap/pm": "^3.31.4",
    "@tiptap/react": "^3.31.4",
    "@tiptap/starter-kit": "^3.31.4",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "lucide-react": "^1.31.0",
    "mmdb-lib": "^3.0.3",
    "mongodb": "^7.0.0",
    "next": "^16.4.3",
    "nodemailer": "^10.2.1",
    "radix-ui": "^1.6.7",
    "react": "^19.3.1",
    "react-dom": "^19.3.1",
    "sanitize-html": "^2.18.0",
    "sonner": "^2.0.8",
    "tailwind-merge": "3.6.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.2.1",
    "@types/node": "22.19.19",
    "@types/nodemailer": "^7.0.12",
    "@types/react": "19.2.14",
    "@types/react-dom": "19.2.3",
    "@types/sanitize-html": "^2.16.2",
    "eslint": "9.39.4",
    "eslint-config-next": "16.3.4",
    "tailwindcss": "4.2.1",
    "tw-animate-css": "^1.4.0",
    "typescript": "5.9.3"
  }
}
```

npm scripts to add (adjust `db:migrate-avault` to the renamed migration script):

```json
{
  "admin:create": "node scripts/create-admin.mjs",
  "db:migrate-avault": "node scripts/migrate-dmv-avault.mjs",
  "db:normalize-content": "node scripts/normalize-content-records.mjs",
  "db:ensure-seo": "node scripts/ensure-schema-links.mjs --apply",
  "db:audit-seo": "node scripts/audit-database-seo.mjs",
  "db:verify-content": "node scripts/verify-database-content.mjs",
  "test:custom-scripts": "node scripts/verify-custom-scripts.mjs",
  "db:sync-origin": "node scripts/sync-site-origin.mjs",
  "backup:decrypt": "node scripts/decrypt-backup.mjs"
}
```

## C.2 Extractor

Save the code block below as `.avault-kit/extract.mjs` **exactly**. To do it without retyping, run this from the repository root:

```bash
node -e "const fs=require('fs'),t=fs.readFileSync('AVAULT-KIT.md','utf8').split(/\r?\n/),s=t.indexOf('<!-- avault-extractor -->'),f=t[s+1].match(/^\x60+/)[0],e=t.indexOf(f,s+2);fs.mkdirSync('.avault-kit',{recursive:true});fs.writeFileSync('.avault-kit/extract.mjs',t.slice(s+2,e).join('\n')+'\n')"
```

Then check first with `node .avault-kit/extract.mjs AVAULT-KIT.md --dry-run`, and unpack with `node .avault-kit/extract.mjs AVAULT-KIT.md`. Add `.avault-kit/` to `.gitignore`.

<!-- avault-extractor -->
````js
// AVAULT kit extractor: writes every file in AVAULT-KIT.md exactly (LF line endings) and checks each SHA-256.
//   node .avault-kit/extract.mjs AVAULT-KIT.md [--dry-run] [--update]
// owned      AVAULT's own files: written. If one already exists and differs, it is staged unless --update is given.
// shared     files the site may already have (shadcn/ui, Tailwind): written when missing, skipped when identical,
//            otherwise staged in .avault-kit/incoming/<path> for you to merge. The site's own file is never replaced.
// reference  the original site's versions, to read and adapt: always written to .avault-kit/reference/<path>.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const args=process.argv.slice(2),kit=args.find(a=>!a.startsWith('--')),dry=args.includes('--dry-run'),update=args.includes('--update');
if(!kit){console.error('Usage: node .avault-kit/extract.mjs <AVAULT-KIT.md> [--dry-run] [--update]');process.exit(1)}
const lines=fs.readFileSync(kit,'utf8').split(/\r?\n/),out={written:[],unchanged:[],staged:[],reference:[]};let bad=0;
for(let i=0;i<lines.length;i++){
  const m=lines[i].match(/^<!-- avault-file path="([^"]+)" mode="(owned|shared|reference)" sha256="([0-9a-f]{64})" eol="([01])" -->$/);if(!m)continue;
  const [,file,mode,sum,eol]=m;const fence=(lines[++i]||'').match(/^`{3,}/)?.[0];if(!fence)throw new Error('No code block after '+file);
  const body=[];for(i++;;i++){if(i>=lines.length)throw new Error('Unclosed code block: '+file);if(lines[i]===fence)break;body.push(lines[i])}
  if(path.isAbsolute(file)||file.split('/').includes('..'))throw new Error('Unsafe path: '+file);
  const text=body.join('\n')+(eol==='1'?'\n':'');
  const buf=Buffer.from(text,'utf8');if(createHash('sha256').update(buf).digest('hex')!==sum){console.error('CHECKSUM MISMATCH (the kit was changed or damaged): '+file);bad++;continue}
  let target=file,kind='written';
  if(mode==='reference'){target=path.join('.avault-kit','reference',file);kind='reference'}
  else if(fs.existsSync(file)){if(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')===text){out.unchanged.push(file);continue}if(!(mode==='owned'&&update)){target=path.join('.avault-kit','incoming',file);kind='staged'}}
  out[kind].push(target.split(path.sep).join('/'));
  if(!dry){fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,buf)}
}
for(const [k,list] of Object.entries(out))console.log(`${k.padEnd(10)} ${list.length}`+(k==='staged'&&list.length?'  (merge these by hand):\n  '+list.join('\n  '):''));
if(bad){console.error(bad+' file(s) failed the checksum. Get a fresh copy of the kit.');process.exit(1)}
console.log(dry?'Dry run: nothing written.':'Done. Every file matched its checksum.');
````

## C.3 Manifest

| File | Mode | Bytes | SHA-256 |
|---|---|---:|---|
| `app/[[...path]]/route.ts` | owned | 8182 | `4e6e3d5058098578…` |
| `app/api/admin/[...path]/route.ts` | owned | 22493 | `8217c5118522e600…` |
| `app/api/events/route.ts` | owned | 4005 | `1f78d44f01ea5e04…` |
| `app/api/forms/submit/route.ts` | owned | 4082 | `d13de47d3ba82103…` |
| `app/api/forms/token/route.ts` | owned | 335 | `c74c93f02b109e95…` |
| `app/api/maintenance/route.ts` | owned | 650 | `b5ed95f23c34f3e4…` |
| `app/avault/admin-views.tsx` | owned | 23624 | `ae89f4438f17e244…` |
| `app/avault/content-tools.tsx` | owned | 11242 | `94088d3c0645e5b3…` |
| `app/avault/forms-editor.tsx` | owned | 13484 | `1c0566d9dc455546…` |
| `app/avault/health-panel.tsx` | owned | 3987 | `b97f35104b14738d…` |
| `app/avault/leads-inbox.tsx` | owned | 12597 | `48fa10273f3faff3…` |
| `app/avault/list-views.tsx` | owned | 18722 | `55de98589d073a3f…` |
| `app/avault/login/login-form.tsx` | owned | 1847 | `5bdf68a29bc06c19…` |
| `app/avault/login/page.tsx` | owned | 680 | `3585cd8e5615e95f…` |
| `app/avault/media-tools.tsx` | owned | 8371 | `6c0f52af87d0f6f3…` |
| `app/avault/navigation-editor.tsx` | owned | 17736 | `024a80293719cb85…` |
| `app/avault/operations-panel.tsx` | owned | 14229 | `84a49e45e4869118…` |
| `app/avault/overview-views.tsx` | owned | 18837 | `dea76830c8e7a52f…` |
| `app/avault/page-canvas.tsx` | owned | 23492 | `283213a5ab860062…` |
| `app/avault/page.tsx` | owned | 1047 | `41acafda20408cd5…` |
| `app/avault/panels.tsx` | owned | 9703 | `713b7a6e0076d921…` |
| `app/avault/people-views.tsx` | owned | 42381 | `eaf27fe0d660c5b8…` |
| `app/avault/rich-editor.tsx` | owned | 12086 | `a081c8574b9df835…` |
| `app/avault/scripts-privacy.tsx` | owned | 18315 | `c22f727220cf4ed8…` |
| `app/avault/section-library-dialog.tsx` | owned | 6374 | `da99c7020b509cbd…` |
| `app/avault/session.ts` | owned | 1192 | `97e5c51f5f6eca00…` |
| `app/avault/theme.css` | owned | 109676 | `fefde2d852ad47bb…` |
| `app/avault/toast.ts` | owned | 1091 | `dee1a783584d4bf7…` |
| `app/avault/vault.tsx` | owned | 23554 | `f9f6c41eeb06560e…` |
| `app/globals.css` | shared | 10149 | `438930be93e71f54…` |
| `components/ui/alert-dialog.tsx` | shared | 5439 | `9a8d950f2b9b4352…` |
| `components/ui/badge.tsx` | shared | 1776 | `46a0de5224f6a5d5…` |
| `components/ui/button.tsx` | shared | 2392 | `cc36af0f8b5019c3…` |
| `components/ui/dialog.tsx` | shared | 4303 | `dce39c6adc47d997…` |
| `components/ui/input.tsx` | shared | 962 | `8c4612a7c41319ac…` |
| `components/ui/tabs.tsx` | shared | 3782 | `865d0194331b9b2b…` |
| `components/ui/textarea.tsx` | shared | 759 | `253cdeb487c73bea…` |
| `db/mongo.ts` | owned | 15341 | `4b26d9aa51f1edc1…` |
| `instrumentation.ts` | owned | 514 | `5611410355fa63eb…` |
| `lib/avault/admin-bar.ts` | owned | 2608 | `9ec85fba326219ac…` |
| `lib/avault/admin-extra.ts` | owned | 23276 | `68a659b285a6f008…` |
| `lib/avault/agent.ts` | owned | 777 | `faa51c8ad4900d18…` |
| `lib/avault/auth.ts` | owned | 7819 | `24d7c82ace86a1e9…` |
| `lib/avault/blocks.ts` | owned | 5485 | `eaa4e7378885b21d…` |
| `lib/avault/config.ts` | owned | 729 | `cf8e58ce75e1d46a…` |
| `lib/avault/email.ts` | owned | 8127 | `2a43f9f6765ed085…` |
| `lib/avault/extended.ts` | owned | 22957 | `ac1fd51c014c7759…` |
| `lib/avault/forms.ts` | owned | 9406 | `8d027095c4e53cc6…` |
| `lib/avault/geo.ts` | owned | 2101 | `b9869eb4c08d537e…` |
| `lib/avault/icon-fix.ts` | owned | 1280 | `9a68d20e4e7abc5c…` |
| `lib/avault/ip.ts` | owned | 2305 | `7e9308709c51df57…` |
| `lib/avault/lead-email.ts` | owned | 8056 | `777d3a2f83bf72fd…` |
| `lib/avault/media.ts` | owned | 2672 | `9d80a4240db777c0…` |
| `lib/avault/nav-canvas.ts` | owned | 2197 | `d73200e0d1b13fd2…` |
| `lib/avault/operations.ts` | owned | 6532 | `e6c05652975c10c6…` |
| `lib/avault/public-controls.ts` | owned | 5280 | `a7f49165a93c2188…` |
| `lib/avault/render.ts` | owned | 9805 | `500690c2bafe11f3…` |
| `lib/avault/rich.ts` | owned | 5166 | `e062aa70e7eb237d…` |
| `lib/avault/runtime.ts` | owned | 8905 | `a59e9c43f3639e3b…` |
| `lib/avault/scheduler.ts` | owned | 817 | `81041b71ce238ff6…` |
| `lib/avault/section-library.ts` | owned | 8049 | `ab2be181cb5ac1cc…` |
| `lib/avault/site.ts` | owned | 8267 | `1dc15023a460d327…` |
| `lib/avault/snippets.ts` | owned | 7025 | `ba70c0d2992093ae…` |
| `lib/avault/spam.ts` | owned | 5957 | `e91198c4f711a370…` |
| `lib/avault/store.ts` | owned | 8767 | `0e624563e5050a44…` |
| `lib/avault/system-pages.ts` | owned | 8423 | `dd5eb79481c2e49a…` |
| `lib/utils.ts` | shared | 177 | `53f3d3d070f0a908…` |
| `mongodb-compat.d.ts` | owned | 72 | `cce753c8329aca34…` |
| `postcss.config.mjs` | shared | 94 | `dfac7ac2d86d326a…` |
| `proxy.ts` | owned | 1698 | `d366d49654e64c60…` |
| `public/avault-analytics.js` | owned | 3128 | `0f344b905c175b22…` |
| `public/system-pages.css` | owned | 5952 | `e6c3b4154f0f0b4b…` |
| `scripts/audit-database-seo.mjs` | owned | 3389 | `da8447bd4fb3d9d1…` |
| `scripts/create-admin.mjs` | owned | 3707 | `12c2a15f31464102…` |
| `scripts/decrypt-backup.mjs` | owned | 2619 | `07c827df446b3841…` |
| `scripts/ensure-schema-links.mjs` | owned | 5140 | `68f6816876f42781…` |
| `scripts/migrate-dmv-avault.mjs` | owned | 10250 | `84d09a74ab88cbe7…` |
| `scripts/normalize-content-records.mjs` | owned | 5461 | `0a033174a6fb65b7…` |
| `scripts/sync-site-origin.mjs` | owned | 1827 | `61c1beef0f9a131c…` |
| `scripts/verify-custom-scripts.mjs` | owned | 1716 | `cf157f3c1402810f…` |
| `scripts/verify-database-content.mjs` | owned | 2132 | `28478287e7b2ade0…` |
| `vendor/shadcn-tailwind-4.13.0.css` | shared | 16041 | `bc7d83425702955b…` |
| `public/dmv-runtime.js` | reference | 3161 | `6a8e113585b0c773…` |
| `app/layout.tsx` | reference | 635 | `d84dcf0900ba6597…` |
| `next.config.ts` | reference | 128 | `7cbbb771e580ae42…` |
| `tsconfig.json` | reference | 1838 | `f82756bbf1b125d4…` |
| `components.json` | reference | 420 | `31f4ca67a4a62572…` |
| `.env.example` | reference | 314 | `20c9fac369c5e38e…` |
| `ecosystem.config.cjs` | reference | 529 | `ad04bd3b6f3f86d4…` |
| `.github/workflows/deploy.yml` | reference | 2989 | `c643f2cacb3c456f…` |
| `scripts/verify-rendering.mjs` | reference | 5127 | `b479c935e9909e81…` |
| `scripts/deploy-production.sh` | reference | 2851 | `1da560704b9b8b6d…` |
| `scripts/configure-webuzo-proxy.sh` | reference | 4024 | `a64c0423f2066c72…` |

## C.4 Files

### app/[[...path]]/route.ts

<!-- avault-file path="app/[[...path]]/route.ts" mode="owned" sha256="4e6e3d5058098578a6a22c9e64c26ec9f7593a960f9d148872931b6231e6ae55" eol="1" -->
```ts
import {settingsRead} from '@/lib/avault/runtime';
import {enhancePublic,trafficAllowed} from '@/lib/avault/public-controls';
import {allDocs,readDoc,globals,headers,db,bucket} from '@/lib/avault/store';
import {render,sitemap,SITEMAP_FILES} from '@/lib/avault/render';
import {CONFIG} from '@/lib/avault/config';
import {mongoDb} from '@/db/mongo';
import {adminBar} from '@/lib/avault/admin-bar';
import {systemPage,SYSTEM_PAGE_ROUTE,type SystemPage} from '@/lib/avault/system-pages';
export const dynamic='force-dynamic';
// Canonicals, schema, sitemaps and robots always use the configured production domain.
function publicOrigin(_req:Request){return CONFIG.origin;}
const PAGE_CSP=(nonce:string)=>`default-src 'self'; script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn-uicons.flaticon.com; font-src 'self' data: https://cdn-uicons.flaticon.com; img-src 'self' data: https:; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'`;
// Thank-you and 404 pages are drawn inside the homepage's header and footer (see system-pages.ts).
async function homeShellPage(req:Request,kind:SystemPage,status:number){const headersOut={...headers,'Content-Type':'text/html; charset=utf-8',...(kind==='contact'?{}:{'X-Robots-Tag':'noindex'})};
 try{const home=await readDoc('/');if(home){const [g,registry]=await Promise.all([globals(),allDocs()]);const route=SYSTEM_PAGE_ROUTE[kind];const enhanced=await enhancePublic(systemPage(kind,home,g,registry,publicOrigin(req)),route);return new Response(enhanced.html,{status,headers:{...headersOut,'Content-Security-Policy':PAGE_CSP(enhanced.nonce)}})}}catch{}
 return kind==='not-found'?errorPage(req,'/not-found/',404,'Page not found'):new Response(`<!doctype html><html lang="en"><head><meta name="robots" content="noindex"><title>Thank you | ${CONFIG.name}</title></head><body><main><h1>Thank you</h1><p>Your request has reached the ${CONFIG.name} team. <a href="/">Return to ${CONFIG.name}</a>.</p></main></body></html>`,{status,headers:headersOut})}
// 404 / 403 responses use the AVAULT-managed pages (site header, footer and design); a plain fallback covers a missing page.
async function errorPage(req:Request,route:string,status:number,title:string){const headersOut={...headers,'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex'};
 try{const d=await readDoc(route);if(d){const [g,registry]=await Promise.all([globals(),allDocs()]);const enhanced=await enhancePublic(render(d,g,false,registry,publicOrigin(req)),route);return new Response(enhanced.html,{status,headers:{...headersOut,'Content-Security-Policy':PAGE_CSP(enhanced.nonce)}})}}catch{}
 return new Response(`<!doctype html><html lang="en"><head><meta name="robots" content="noindex"><title>${title} | ${CONFIG.name}</title></head><body><main><h1>${title}</h1><p><a href="/">Return to ${CONFIG.name}</a> or call <a href="tel:${CONFIG.phone}">${CONFIG.phoneDisplay}</a>.</p></main></body></html>`,{status,headers:headersOut})}
// Relative Location keeps visitors on the domain they used; the app itself only sees its internal address.
function relativeRedirect(location:string,status:number){return new Response(null,{status,headers:{Location:location,'Cache-Control':'no-store'}})}
export async function GET(req:Request){const u=new URL(req.url);let path=u.pathname;
 try{
 if(!await trafficAllowed(req))return errorPage(req,'/access-denied/',403,'Access unavailable');
 if(path.startsWith('/media/')){const media=await db().prepare('SELECT id,name,mime FROM media WHERE key=?').bind(path.slice(7)).first<{id:string;name:string;mime:string}>();if(!media)return new Response('Not found',{status:404});const object=await bucket().get(path.slice(7));if(!object)return new Response('Not found',{status:404});const mime=object.httpMetadata?.contentType||media.mime||'application/octet-stream';return new Response(object.body,{headers:{...headers,'Content-Type':mime,'Cache-Control':'public, max-age=31536000, immutable',...(!mime.startsWith('image/')?{'Content-Disposition':`inline; filename="${String(media.name||path.slice(7)).replace(/["\r\n]/g,'')}"`}:{})}})}
 if(path==='/robots.txt'){const origin=publicOrigin(req);return new Response(((await settingsRead('files')).value.robots||'')+'\n'+`User-agent: *\nAllow: /\nDisallow: /avault\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`,{headers:{'Content-Type':'text/plain'}})}
 if(path==='/llms.txt'){const docs=await allDocs(),origin=publicOrigin(req);return new Response(((await settingsRead('files')).value.llms||'')+`\n# ${CONFIG.name}\n\nCommercial door repair and hardware services across Washington, D.C., Maryland, and Virginia.\n\n## Pages\n${Object.values(docs).filter(d=>!d.seo.noindex).map(d=>`- [${d.label}](${origin+d.route}): ${d.seo.description}`).join('\n')}`,{headers:{'Content-Type':'text/plain; charset=utf-8'}})}
 // The old underscore sitemap names moved to sm-pages.xml etc.; anything that still asks for them is sent on.
 if(Object.hasOwn(SITEMAP_FILES,path.slice(1)))return new Response(null,{status:301,headers:{Location:'/'+SITEMAP_FILES[path.slice(1)],'Cache-Control':'public, max-age=86400'}});
 const sitemapKind=path==='/sitemap.xml'?'sitemap.xml':Object.entries(SITEMAP_FILES).find(([,f])=>'/'+f===path)?.[0];
 if(sitemapKind){const docs=await allDocs(),maps=(await settingsRead('files')).value.sitemaps||{};return new Response(sitemap(docs,sitemapKind,publicOrigin(req),maps),{headers:{'Content-Type':'application/xml; charset=utf-8'}})}
 const redirects=(await mongoDb()).collection('redirects');const redirect=await redirects.findOne({source:path,enabled:{$ne:false}});if(redirect){void redirects.updateOne({source:path},{$inc:{hits:1},$set:{last_hit_at:new Date().toISOString()}}).catch(()=>{});const target=new URL(String(redirect.destination),u.origin);if(target.origin!==u.origin)return new Response(null,{status:Number(redirect.status)||308,headers:{Location:target.href,'Cache-Control':'no-store'}});if(!target.search)target.search=u.search;return relativeRedirect(target.pathname+target.search,Number(redirect.status)||308)}
 if(!path.endsWith('/')&&!path.includes('.'))return relativeRedirect(path+'/'+u.search,308);
 if(path==='/thank-you/')return homeShellPage(req,'thank-you',200);
 const d=await readDoc(path);
 // The DMV contact page is stored in AVAULT at /contact-us/ like every other public page.
 if(!d)return homeShellPage(req,'not-found',404);
 // The managed error pages keep their error status even when opened directly.
 if(path==='/not-found/')return homeShellPage(req,'not-found',404);
 if(path==='/access-denied/')return errorPage(req,path,403,d.label);
 const [globalSettings,registry]=await Promise.all([globals(),allDocs()]);const enhanced=await enhancePublic(render(d,globalSettings,false,registry,publicOrigin(req)),path);
 // Signed-in AVAULT users get the toolbar; everyone else gets the page untouched.
 if(/(?:^|;\s*)avault_session=/.test(req.headers.get('cookie')||'')){const {sessionUser}=await import('@/lib/avault/auth');const user=await sessionUser(req).catch(()=>null);if(user){const newLeads=await (await mongoDb()).collection('forms').countDocuments({status:'new'});enhanced.html=enhanced.html.replace(/(<body\b[^>]*>)/,'$1'+adminBar(user,d,newLeads))}}return new Response(enhanced.html,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':`default-src 'self'; script-src 'self' 'nonce-${enhanced.nonce}' https://cdn.jsdelivr.net ${enhanced.customScripts?"https:":""}; style-src 'self' 'unsafe-inline' https://cdn-uicons.flaticon.com; font-src 'self' data: https://cdn-uicons.flaticon.com; img-src 'self' data: https:; media-src 'self' https: blob:; connect-src 'self' ${enhanced.customScripts?'https:':''}; frame-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'`}});
 }catch(e){console.error('Public render unavailable:',e instanceof Error?e.message:'unknown error');return new Response('The website is temporarily unavailable. Please try again shortly.',{status:503,headers:{...headers,'Retry-After':'60','X-Robots-Tag':'noindex'}})}
}
```

### app/api/admin/[...path]/route.ts

<!-- avault-file path="app/api/admin/[...path]/route.ts" mode="owned" sha256="8217c5118522e6005c1965dd8ca5fd4e9f4121256b898082853d15ee305f832d" eol="1" -->
```ts
import {imageInfo} from '@/lib/avault/media';
import {navCanvas} from '@/lib/avault/nav-canvas';
import {countryOf} from '@/lib/avault/geo';
import {SYSTEM_ROUTES} from '@/lib/avault/config';
import {settingsRead} from '@/lib/avault/runtime';
import {clientIp,actor,body,sameOrigin,db,bucket,readDoc,allDocs,globals,now,id,json,failure,HttpError,audit,Doc,safeUrl,headers,normalizeDoc} from '@/lib/avault/store';
import {validateBlocks,sections} from '@/lib/avault/blocks';
import {extendedGet,extendedPost} from '@/lib/avault/extended';
import {extraGet,extraPost} from '@/lib/avault/admin-extra';
import {validateCustomSchema} from '@/lib/avault/site';
import {sanitizeBody,BODY_SLOT} from '@/lib/avault/rich';
import {render} from '@/lib/avault/render';
import {applyForms} from '@/lib/avault/forms';
import {library,pageContext,insertSection,removeSection,markSections} from '@/lib/avault/section-library';
import {CONFIG} from '@/lib/avault/config';
import {login,sessionCookie,clearedCookie,listUsers,saveUser,deleteUser,verifyPassword,users as userCollection} from '@/lib/avault/auth';
export const dynamic='force-dynamic';
const key=(req:Request)=>new URL(req.url).pathname.split('/api/admin/')[1].replace(/\/$/,'');
async function log(email:string,action:string,entity:string){await db().prepare('INSERT INTO activity (id,actor,action,entity,created_at) VALUES (?,?,?,?,?)').bind(id(),email,action,entity,now()).run()}
export async function GET(req:Request){try{const user=await actor(req);const u=new URL(req.url);const action=key(req);const page=Math.min(10000,Math.max(0,Number(u.searchParams.get('page'))||0));
 const extra=await extraGet(action,u,user);if(extra)return extra;
 const extension=await extendedGet(action,u,user);if(extension)return extension;
 if(action==='session')return json(user);
 // The address this request came from, so AVAULT → Traffic access can offer "allow my IP".
 if(action==='whoami'){const ip=clientIp(req);return json({ip,country:countryOf(req,ip)})}
 // Prebuilt sections from every page, for the live editor's “Add section” library.
 if(action==='section-library'){const d=await readDoc(u.searchParams.get('route')||'/',true);const records=await db().prepare('SELECT route,draft,revision,updated_at,published FROM documents').all<{route:string;draft:string}>();return json({context:d?pageContext(d.template):'',items:library(records.results.map(r=>({route:r.route,doc:JSON.parse(r.draft) as Doc})))})}
 if(action==='sections'){const d=await readDoc(u.searchParams.get('route')||'/',true);if(!d)throw new HttpError(404,'Page not found.');return json(sections(d.template).items.map(i=>({id:i.id,label:i.html.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/)?.[1]?.replace(/<[^>]*>/g,'').replace(/\{\{(f\d+)\}\}/g,(_,key)=>d.fields.find(f=>f.key===key)?.value||'')||i.id})));}
 if(action==='document'){const d=await readDoc(u.searchParams.get('route')||'/',true);if(!d)throw new HttpError(404,'Page not found.');return json(d)}
 if(action==='navigation'){const row=await db().prepare('SELECT revision FROM settings WHERE id=?').bind('global').first<{revision:number}>();const home=await readDoc('/',true);const gl=await globals();return json({...gl,navigation:gl.navigation||{},revision:row?.revision||0,fields:(home?.fields||[]).filter(f=>f.group==='navigation'||f.group==='footer'),canvas:home?navCanvas(home.template):null,forms:(await settingsRead('forms')).value});}
 if(action==='backlinks'){const route=u.searchParams.get('route');return json(Object.values(await allDocs()).flatMap(d=>d.fields.filter(f=>f.label==='a href'&&f.value.split('#')[0]===route).map(f=>({route:d.route,section:f.section,field:f.key}))))}
 if(action==='revisions'&&(u.searchParams.get('route')||'').startsWith('@')&&user.role!=='owner')throw new HttpError(403,'Owner access required.');
 if(action==='revisions')return json((await db().prepare('SELECT id,actor,state,created_at FROM revisions WHERE document_id=? ORDER BY created_at DESC LIMIT 50 OFFSET ?').bind(u.searchParams.get('route'),page*50).all()).results);
 if(action==='revision'){const row=await db().prepare('SELECT * FROM revisions WHERE id=?').bind(u.searchParams.get('id')).first<any>();if(row?.document_id.startsWith('@')&&user.role!=='owner')throw new HttpError(403,'Owner access required.');return json(row)}
 if(action==='users'){if(user.role!=='owner')throw new HttpError(403,'Owner access required.');return json(await listUsers())}
 if(action==='export'){if(user.role!=='owner')throw new HttpError(403,'Owner access required.');const backup={version:1,date:now(),origin:CONFIG.origin,documents:(await db().prepare('SELECT * FROM documents').all()).results,settings:(await db().prepare('SELECT * FROM settings').all()).results,redirects:(await db().prepare('SELECT * FROM redirects').all()).results};return new Response(JSON.stringify(backup),{headers:{...headers,'Content-Type':'application/json','Content-Disposition':'attachment; filename="avault-content-backup.json"'}})}
 throw new HttpError(404,'Not found.');
 }catch(e){return failure(e)}}
export async function POST(req:Request){try{sameOrigin(req);const action=key(req);
 if(action==='login'){const b=await body(req,5000);const account=await login(req,b.email,b.password);await log(account.email,'sign-in',account.email);return new Response(JSON.stringify({email:account.email,role:account.role}),{headers:{...headers,'Content-Type':'application/json','Set-Cookie':sessionCookie(account)}})}
 if(action==='logout'){// The toolbar on public pages signs out with a plain form post; AVAULT itself uses fetch.
 if((req.headers.get('content-type')||'').includes('application/x-www-form-urlencoded'))return new Response(null,{status:303,headers:{...headers,Location:'/avault/login/','Set-Cookie':clearedCookie()}});return new Response(JSON.stringify({signedOut:true}),{headers:{...headers,'Content-Type':'application/json','Set-Cookie':clearedCookie()}})}
 const user=await actor(req);
 if(action==='media'){const len=Number(req.headers.get('content-length')||0);if(len>12582912)throw new HttpError(413,'Upload must be under 12 MB.');const form=await req.formData();const file=form.get('file');if(!(file instanceof File)||file.size>12582912||!file.size)throw new HttpError(400,'Choose a file under 12 MB.');const bytes=new Uint8Array(await file.arrayBuffer()),originalExt=(file.name.split('.').pop()||'').toLowerCase();let mime='',ext='';if(bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47){mime='image/png';ext='png'}else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255){mime='image/jpeg';ext='jpg'}else if(new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP'){mime='image/webp';ext='webp'}else if(new TextDecoder().decode(bytes.slice(0,4))==='%PDF'){mime='application/pdf';ext='pdf'}else if(['txt','csv'].includes(originalExt)){mime=originalExt==='csv'?'text/csv':'text/plain';ext=originalExt}else if(['doc','docx','xls','xlsx','ppt','pptx'].includes(originalExt)){const allowed:Record<string,string>={doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',ppt:'application/vnd.ms-powerpoint',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation'};mime=allowed[originalExt];ext=originalExt}else throw new HttpError(400,'Use PNG, JPEG, WebP, PDF, text, CSV, Word, Excel, or PowerPoint files.');const dimensions=mime.startsWith('image/')?imageInfo(bytes):{};const checksum=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');const existing=await db().prepare("SELECT key FROM media WHERE json_extract(metadata,'$.checksum')=?").bind(checksum).first<{key:string}>();if(existing)return json({url:'/media/'+existing.key,duplicate:true});const uuid=id(),key=uuid+'.'+ext;await bucket().put(key,bytes,{httpMetadata:{contentType:mime}});await db().prepare('INSERT INTO media (id,key,name,mime,bytes,alt,metadata,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(uuid,key,file.name.slice(0,200),mime,file.size,String(form.get('alt')||'').slice(0,1000),JSON.stringify({...dimensions,checksum,uploader:user.email,updatedAt:now(),caption:'',credit:''}),now()).run();await log(user.email,'upload',key);return json({url:'/media/'+key,mime})}
 const b=await body(req,1500000);const extra=await extraPost(action,b,user);if(extra)return extra;const extension=await extendedPost(action,b,user);if(extension)return extension;
 if(action==='create'){
 const route=String(b.route||'');
 // New blog posts default to an existing post's layout when none is chosen.
 let templateRoute=String(b.templateRoute||'');if(!templateRoute&&route.startsWith('/blog/'))templateRoute=Object.values(await allDocs()).find(x=>x.kind==='post'&&x.template.includes(BODY_SLOT))?.route||'';
 const template=await readDoc(templateRoute,true);if(!template||!/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)+$/.test(route)||/^\/(?:avault|api|media|assets)\//.test(route)||route.length>250||!String(b.title||'').trim())throw new HttpError(422,'Choose a template, title, and a lowercase URL ending with a slash.');if(await readDoc(route,true)||await db().prepare('SELECT source FROM redirects WHERE source=?').bind(route).first())throw new HttpError(409,'That URL already exists.');
 const d=structuredClone(template);d.templateRoute=template.route;d.route=route;d.label=String(b.title).slice(0,150);d.seo={...d.seo,title:d.label+' | '+CONFIG.name,canonical:CONFIG.origin+route,noindex:false};d.publishedAt=undefined;d.updatedAt=now();d.revision=1;
 // New documents start private and copy a known design, never a live route.
 const h=d.fields.find(f=>f.label==='h1');if(h)h.value=d.label;
 // A new blog post keeps the article design but none of the source post's writing.
 if(d.template.includes(BODY_SLOT)){const keysIn=(re:RegExp)=>new Set([...(d.template.match(re)?.[0]||'').matchAll(/\{\{(f\d+)\}\}/g)].map(m=>m[1]));const title=[...keysIn(/<h1>[\s\S]*?<\/h1>/)],deck=keysIn(/<p class="article-deck">[\s\S]*?<\/p>/),meta=keysIn(/<div class="article-meta">[\s\S]*?<\/div>/);const today=new Date();
  d.fields=d.fields.map(f=>title.includes(f.key)?{...f,value:f.key===title[0]?d.label:''}:deck.has(f.key)?{...f,value:''}:meta.has(f.key)&&f.label==='time'?{...f,value:today.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}:f);
  const iso=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;d.template=d.template.replace(/(<time\b[^>]*datetime=")[^"]*"/,`$1${iso}"`);
  Object.assign(d,{body:'<p></p>',excerpt:'',author:'',authorUrl:'',featuredImage:'',featuredAlt:'',category:'',tags:[]});d.seo={...d.seo,title:'',description:'',image:'',imageAlt:'',schema:'',ogTitle:'',ogDescription:''};}
 await db().batch([db().prepare('INSERT INTO documents(id,route,draft,published,revision,updated_at) VALUES (?,?,?,NULL,1,?)').bind(route,route,JSON.stringify(d),d.updatedAt),db().prepare('INSERT INTO activity(id,actor,action,entity,created_at) VALUES (?,?,?,?,?)').bind(id(),user.email,'create',route,now())]);return json(d);
 }
 if(action==='preview'){const d=await validate(b.document),[g,forms]=await Promise.all([globals(),settingsRead('forms')]);return new Response(applyForms(render(d,g,true,await allDocs(),undefined,false,true),forms.value),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'self'; img-src 'self' https: data:; media-src 'self' https: blob:; style-src 'self' https: 'unsafe-inline'; font-src 'self' https:; script-src 'self'; connect-src 'self'; form-action 'none'; frame-ancestors 'self'"}})}
 // One prebuilt section on its own, in its source page's design, for the library preview.
 if(action==='section-preview'){const d=await readDoc(String(b.route||''),true);if(!d||!sections(d.template).items.some(i=>i.id===b.section))throw new HttpError(404,'That section no longer exists.');return json({html:render({...d,template:markSections(d.template),sectionOrder:[String(b.section)],hiddenSections:[],blocks:[]},await globals(),true,await allDocs())})}
 // The live editor's canvas: the unsaved draft with every editable spot tagged, forms filled in, scripts removed.
 if(action==='canvas'){const d=await validate(b.document);const [g,forms]=await Promise.all([globals(),settingsRead('forms')]);return json({html:applyForms(render(d,g,true,await allDocs(),undefined,true),forms.value)})}
 if(action==='save'||action==='publish'||action==='unpublish')return commit(action,await validate(b.document),b.expectedRevision,user.email);
 // Section structure changes (add a prebuilt section, duplicate, remove) are built here and saved as the draft at once:
 // the saved draft is what later saves are checked against, so the new structure has to be stored before it can be edited.
 if(action==='section-edit'){const d=await validate(b.document);let next:Doc;
  if(b.op==='remove')next=removeSection(d,String(b.section||''));
  else if(b.op==='insert'||b.op==='duplicate'){const source=b.op==='duplicate'?d:await readDoc(String(b.source?.route||''),true);if(!source)throw new HttpError(404,'That page no longer exists.');next=insertSection(d,source,String(b.op==='duplicate'?b.section:b.source?.section||''),b.after==null?null:String(b.after))}
  else throw new HttpError(422,'Unknown section change.');
  return commit('save',next,b.expectedRevision,user.email,'section-'+b.op)}
 // A stored revision goes back in as the draft as it was, even when the page's sections have changed since.
 if(action==='revision-restore'){const r=await db().prepare('SELECT * FROM revisions WHERE id=?').bind(String(b.id||'')).first<any>();if(!r||r.document_id!==b.route||r.document_id.startsWith('@')||!r.before)throw new HttpError(404,'Revision not found.');const old=JSON.parse(r.before) as Doc;if(old.route!==b.route||!old.template||!Array.isArray(old.fields))throw new HttpError(422,'This revision can’t be restored.');return commit('save',{...old,route:b.route},b.expectedRevision,user.email,'revision-restore')}
 if(action==='navigation'){
 if(user.role!=='owner')throw new HttpError(403,'Owner access required.');const g=await globals();
 let value:any;{const home=await readDoc('/',true);if(!home)throw new HttpError(503,'Homepage content is unavailable.');const allowed=new Map(home.fields.filter(f=>['navigation','footer'].includes(f.group||'')).map(f=>[f.group+'|'+f.label+'|'+f.value,f]));if(!b.navigation||typeof b.navigation!=='object')throw new HttpError(422,'Invalid navigation.');const nav:Record<string,string>={};const docs=await allDocs();for(const [k,v] of Object.entries(b.navigation)){const f=allowed.get(k);if(!f||typeof v!=='string'||v.length>12000||f.kind==='url'&&!safeUrl(v))throw new HttpError(422,'Invalid navigation field.');if(f.kind==='url'&&v.startsWith('/')&&!v.startsWith('/assets/')){const path=v.split('#')[0];if(!docs[path]&&!SYSTEM_ROUTES.includes(path))throw new HttpError(422,'Navigation destination is not published: '+path);}nav[k]=v;}value={...g,navigation:nav};}
 const revisionId=id(),timestamp=now();await db().prepare('INSERT INTO revisions (id,document_id,before,after,actor,state,created_at) VALUES (?,?,?,?,?,?,?)').bind(revisionId,'@global',JSON.stringify(g),JSON.stringify(value),user.email,'pending',timestamp).run();
 const results=await db().batch([db().prepare('INSERT OR IGNORE INTO settings(id,value,revision) VALUES (?,?,0)').bind('global',JSON.stringify(g)),db().prepare('UPDATE settings SET value=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(value),'global',b.revision),db().prepare("UPDATE revisions SET state=CASE WHEN changes()=1 THEN 'applied' ELSE 'conflict' END WHERE id=?").bind(revisionId)]);if(!results[1].meta.changes)throw new HttpError(409,'Site settings changed in another session. Reload and reapply your changes.');await log(user.email,action,'global');return json({saved:true});}
 if(action==='form-status'){if(!['new','read','archived','spam'].includes(b.status))throw new HttpError(422,'Invalid status.');await db().prepare('UPDATE forms SET status=? WHERE id=?').bind(b.status,b.id).run();await log(user.email,'form-status',b.id);return json({saved:true})}
 if(action==='users'){if(user.role!=='owner')throw new HttpError(403,'Owner access required.');const email=await saveUser({email:b.email,role:b.role,active:b.active,password:b.password||undefined},{allowCreate:true});await log(user.email,'users',email);return json({saved:true})}
 if(action==='user-delete'){if(user.role!=='owner')throw new HttpError(403,'Owner access required.');const email=await deleteUser(b.email);await log(user.email,'delete-user',email);return json({deleted:true})}
 if(action==='password'){const account=await (await userCollection()).findOne({email:user.email});if(!account||!await verifyPassword(String(b.current||''),account.password_hash))throw new HttpError(422,'Your current password is incorrect.');await saveUser({email:user.email,password:b.password},{allowCreate:false});await log(user.email,'password',user.email);return new Response(JSON.stringify({saved:true}),{headers:{...headers,'Content-Type':'application/json','Set-Cookie':clearedCookie()}})}
 throw new HttpError(404,'Not found.');
 }catch(e){return failure(e)}}
const str=(v:unknown,max:number)=>String(v??'').slice(0,max);
const url=(v:unknown)=>{const s=String(v??'').trim();if(s&&!safeUrl(s))throw new HttpError(422,'Use a site path or https URL.');return s.slice(0,1000)};
// Writes a checked document as the draft (and, for publish, the live page) with optimistic concurrency.
async function commit(action:string,d:Doc,expectedRevision:unknown,email:string,label=action){const current=await readDoc(d.route,true);if(!current)throw new HttpError(404,'Page not found.');
 if(typeof expectedRevision!=='number')throw new HttpError(409,'Reload the page before saving.');
 const timestamp=now(),revisionId=id();d.updatedAt=timestamp;if(action==='publish'&&!current.publishedAt&&d.kind==='post')d.publishedAt=timestamp;else d.publishedAt=current.publishedAt;d.revision=expectedRevision+1;
 const proposed=JSON.stringify(d);const before=JSON.stringify(current);
 await db().prepare('INSERT INTO revisions (id,document_id,before,after,actor,state,created_at) VALUES (?,?,?,?,?,?,?)').bind(revisionId,d.route,before,proposed,email,'pending',timestamp).run();
 if(current.revision!==expectedRevision){await db().prepare('UPDATE revisions SET state=? WHERE id=?').bind('conflict',revisionId).run();throw new HttpError(409,'Another editor saved this page. Your unsaved draft is retained; reload and reapply your changes.');}
 if(action==='publish'){const issues=audit(d,{...await allDocs(),[d.route]:d});if(issues.length){await db().prepare('UPDATE revisions SET state=? WHERE id=?').bind('validation-failed',revisionId).run();throw new HttpError(422,issues.slice(0,8).join('\n'));}}
 const insert=db().prepare('INSERT OR IGNORE INTO documents (id,route,draft,published,revision,updated_at) VALUES (?,?,?,?,0,?)').bind(d.route,d.route,JSON.stringify(current),null,timestamp);
 const update=db().prepare(`UPDATE documents SET draft=?, ${action==='publish'?'published=?,':action==='unpublish'?'published=NULL,':''} revision=revision+1,updated_at=? WHERE route=? AND revision=?`).bind(...[proposed,...(action==='publish'?[proposed]:[]),timestamp,d.route,expectedRevision]);
 const results=await db().batch([insert,update,db().prepare("UPDATE revisions SET state=CASE WHEN changes()=1 THEN 'applied' ELSE 'conflict' END WHERE id=?").bind(revisionId),db().prepare("INSERT INTO activity (id,actor,action,entity,created_at) SELECT ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM revisions WHERE id=? AND state='applied')").bind(id(),email,label,d.route,timestamp,revisionId)]);
 if(!results[1].meta.changes)throw new HttpError(409,'Another editor saved first. Your draft is retained.');return json(d);
}
async function validate(value:unknown):Promise<Doc>{
 const raw=value as Doc;if(!raw||typeof raw.route!=='string')throw new HttpError(422,'Choose an existing page.');const d=normalizeDoc(raw);const base=await readDoc(d.route,true)||await readDoc(d.templateRoute||d.route,true);if(!base)throw new HttpError(422,'Choose an existing page.');if(!Array.isArray(d.fields)||d.fields.length!==base.fields.length)throw new HttpError(422,'The content structure must be preserved.');
 const fields=base.fields.map((f,i)=>{const v=d.fields[i];if(v?.key!==f.key||typeof v.value!=='string'||v.value.length>12000)throw new HttpError(422,'Invalid content field.');if(f.kind==='url'&&!safeUrl(v.value))throw new HttpError(422,'Use a safe destination URL.');return {...f,value:v.value}});
 if(!d.seo||typeof d.seo.title!=='string'||d.seo.title.length>200||typeof d.seo.description!=='string'||d.seo.description.length>1000||typeof d.seo.image!=='string'||(d.seo.image!==''&&!safeUrl(d.seo.image))||typeof d.seo.imageAlt!=='string')throw new HttpError(422,'Invalid search settings.');
 const sourceSections=sections(base.template).items;if(sourceSections.some(i=>(d.hiddenSections||[]).includes(i.id)&&/<h1\b/.test(i.html)))throw new HttpError(422,'The page heading section must stay visible.');const allowed=sourceSections.map(i=>i.id);const order=d.sectionOrder||allowed;if(order.length!==allowed.length||new Set(order).size!==order.length||order.some(k=>!allowed.includes(k)))throw new HttpError(422,'Invalid section order.');return {...base,blocks:validateBlocks(d.blocks),sectionOrder:order,hiddenSections:(d.hiddenSections||[]).filter(k=>allowed.includes(k)),category:String(d.category||'').slice(0,100),tags:(d.tags||[]).slice(0,20).map(t=>String(t).slice(0,60)),route:d.route,templateRoute:d.templateRoute,label:d.label,fields,seo:{title:d.seo.title,description:d.seo.description,image:d.seo.image,imageAlt:d.seo.imageAlt,noindex:!!d.seo.noindex,nofollow:!!d.seo.nofollow,noarchive:!!d.seo.noarchive,sitemap:d.seo.sitemap!==false,ogTitle:str(d.seo.ogTitle,200),ogDescription:str(d.seo.ogDescription,1000),twitterCard:d.seo.twitterCard==='summary'?'summary':'summary_large_image',schema:validateCustomSchema(d.seo.schema),canonical:CONFIG.origin+d.route},author:str(d.author,120),authorUrl:url(d.authorUrl),excerpt:str(d.excerpt,500),...(base.template.includes(BODY_SLOT)?{body:sanitizeBody(d.body)}:{}),featuredImage:url(d.featuredImage),featuredAlt:str(d.featuredAlt,300),revision:0};
}
```

### app/api/events/route.ts

<!-- avault-file path="app/api/events/route.ts" mode="owned" sha256="1f78d44f01ea5e04277c38b348d2bdcf1ee7b21d50daaba2a9d8b63f5e1dcb68" eol="1" -->
```ts
import {settingsRead} from '@/lib/avault/runtime';
import {countryOf} from '@/lib/avault/geo';
import {sameOrigin,body,db,id,now,json,failure,HttpError,clientIp} from '@/lib/avault/store';
import {mongoDb} from '@/db/mongo';
const TYPES=['page','leave','click','form','call','heartbeat'];
// Rough browser/device label for the Visitors screen; the raw user agent is kept alongside it.
function browser(ua:string){const name=/Edg\//.test(ua)?'Edge':/OPR\/|Opera/.test(ua)?'Opera':/SamsungBrowser/.test(ua)?'Samsung Internet':/Firefox\//.test(ua)?'Firefox':/Chrome\//.test(ua)?'Chrome':/Safari\//.test(ua)?'Safari':'Other';const device=/iPad|Tablet/i.test(ua)?'tablet':/Mobi|Android|iPhone/i.test(ua)?'mobile':'desktop';const os=/Windows/.test(ua)?'Windows':/Mac OS X/.test(ua)&&!/iPhone|iPad/.test(ua)?'macOS':/iPhone|iPad/.test(ua)?'iOS':/Android/.test(ua)?'Android':/Linux/.test(ua)?'Linux':'';return {name,device,os}}
const BOT=/bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|curl|wget|python|axios/i;
const clip=(v:unknown,n:number)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,n);
export async function POST(req:Request){try{sameOrigin(req);
 // Recording is on unless an owner switches it off under Privacy & tracking.
 const c=(await settingsRead('operations')).value;if(c.analytics===false)return json({accepted:false});
 if(req.headers.get('sec-gpc')==='1')return json({accepted:false});
 // The site team's own browsing (signed in to AVAULT) is not counted as visitor traffic.
 if(/(?:^|;\s*)avault_session=/.test(req.headers.get('cookie')||''))return json({accepted:false});
 const ua=String(req.headers.get('user-agent')||'').slice(0,400);if(!ua||BOT.test(ua))return json({accepted:false});
 const b=await body(req,4000);
 if(!TYPES.includes(b.type)||!/^[a-f0-9-]{36}$/.test(b.session)||(b.visitor&&!/^[a-f0-9-]{36}$/.test(b.visitor)))throw new HttpError(422,'Invalid event.');
 let page;try{page=new URL(b.page,new URL(req.url).origin).pathname}catch{throw new HttpError(422,'Invalid page.')}if(page.startsWith('/avault')||page.startsWith('/api/'))return json({accepted:false});
 const ip=clientIp(req);const securityKey=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip+Math.floor(Date.now()/3600000)));const securityId='security:'+Array.from(new Uint8Array(securityKey)).map(n=>n.toString(16).padStart(2,'0')).join('');const ipCount=await db().prepare('INSERT INTO rate_limits(id,count,expires) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(securityId,Date.now()+3600000).first<{count:number}>();if((ipCount?.count||0)>2000)throw new HttpError(429,'Too many requests.');const minute=Math.floor(Date.now()/60000),rate='event:'+b.session+':'+minute;const count=await db().prepare('INSERT INTO rate_limits(id,count,expires) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(rate,Date.now()+120000).first<{count:number}>();if((count?.count||0)>60)throw new HttpError(429,'Too many events.');
 let referrer='';try{const r=new URL(String(b.referrer||''));referrer=r.origin===new URL(req.url).origin||r.origin===new URL(String(req.headers.get('origin'))).origin?'':r.origin+r.pathname}catch{}
 const value:Record<string,unknown>={page:page.slice(0,300)};
 if(referrer)value.referrer=referrer.slice(0,300);if(b.type==='page'&&b.title)value.title=clip(b.title,120);
 if(b.type==='call')value.target=String(b.target||'').replace(/[^+0-9]/g,'').slice(0,20);
 if(b.type==='click'||b.type==='call'||b.type==='form')value.label=clip(b.label,90);if(b.type==='click'&&b.href)value.href=clip(b.href,300);
 if(b.type==='leave')value.seconds=Math.max(0,Math.min(86400,Math.round(Number(b.seconds)||0)));
 await (await mongoDb()).collection('events').insertOne({id:id(),type:b.type,session:b.session,visitor:b.visitor||b.session,value:JSON.stringify(value),created_at:now(),ip,user_agent:ua,browser:browser(ua),country:countryOf(req,ip)});
 return json({accepted:true})}catch(e){return failure(e)}}
```

### app/api/forms/submit/route.ts

<!-- avault-file path="app/api/forms/submit/route.ts" mode="owned" sha256="d13de47d3ba821034aaf19a858dbc2094dea81fa59a0b8c615d8dbb0a7f9adea" eol="1" -->
```ts
import {deliverForm} from '@/lib/avault/email';
import {sameOrigin,body,id,now,json,failure,HttpError,clientIp} from '@/lib/avault/store';
import {HONEYPOT,verifyFormToken,enforceLimits,contentFlags} from '@/lib/avault/spam';
import {mongoDb} from '@/db/mongo';
import {settingsRead} from '@/lib/avault/runtime';
import {extraValues} from '@/lib/avault/forms';
import {countryOf} from '@/lib/avault/geo';
const UTM=['utm_source','utm_medium','utm_campaign','utm_term','utm_content'] as const;
const OK='Thank you. Your estimate request has been received.';
export async function POST(req:Request){try{sameOrigin(req);const b=await body(req,12000);
 // Honeypot: a hidden field people never see. Bots that fill it get a normal-looking reply and nothing is stored.
 if(b[HONEYPOT])return json({ok:true,message:OK});
 // A signed, single-use token from /api/forms/token proves the form was loaded in a browser on this site.
 const token=await verifyFormToken(b.token),age=token.age;
 if(typeof b.name!=='string'||b.name.trim().length<2||b.name.length>150||typeof b.phone!=='string'||b.phone.replace(/\D/g,'').length<7||b.phone.length>40||typeof b.zip!=='string'||!/^\d{5}$/.test(b.zip)||typeof b.service!=='string'||!b.service.trim()||b.service.length>200)throw new HttpError(422,'Enter your name, phone number, business ZIP code, and service.');
 if(b.email&&(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(b.email))||String(b.email).length>250))throw new HttpError(422,'Enter a valid email address or leave it blank.');
 let extra:Record<string,string>;try{extra=extraValues(b,(await settingsRead('forms')).value)}catch(e){throw new HttpError(422,(e as Error).message)}
 // The token is used up only now, so a submission rejected above can be corrected and sent again.
 await token.consume();
 const ip=clientIp(req);await enforceLimits(ip,String(b.email||b.phone).trim());
 const page=String(b.page||'').slice(0,1000);let pageUrl:URL|null=null;try{pageUrl=new URL(page)}catch{}
 const utm=Object.fromEntries(UTM.map(k=>[k,String(pageUrl?.searchParams.get(k)||b[k]||'').slice(0,200)]).filter(([,v])=>v));
 const value={name:b.name.trim(),phone:b.phone.trim(),email:String(b.email||'').trim(),zip:b.zip.trim(),service:b.service.trim(),details:String(b.details||'').slice(0,3000),goal:String(b.details||'').slice(0,3000),request:String(b.request||'Commercial door repair estimate').slice(0,300),page,path:pageUrl?.pathname||'',referrer:String(b.referrer||'').slice(0,1000),...utm,...(Object.keys(extra).length?{extra}:{})};
 const forms=(await mongoDb()).collection('forms');
 const search=[value.name,value.phone,value.email,value.zip,value.service,value.request,value.details,value.path,...Object.values(extra)].join(' ').toLowerCase();
 const esc=(s:string)=>s.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const identity=[value.phone,value.email].filter(Boolean).map(v=>new RegExp(esc(v)));const duplicate=!!await forms.findOne({created_at:{$gt:new Date(Date.now()-86400000).toISOString()},search:{$all:identity}},{projection:{_id:1}});
 const flags=contentFlags({name:value.name,email:value.email,website:'',goal:[value.details,...Object.values(extra)].join(' '),request:value.request},age,duplicate);
 const uuid=id();
 // Stored before any email is attempted, so a delivery failure never loses a lead. Flagged leads go to
 // AVAULT → Leads → Spam without an email; the visitor sees the same reply either way.
 await forms.insertOne({id:uuid,value:JSON.stringify(value),status:flags.length?'spam':'new',delivery:flags.length?'blocked':'pending',attempts:0,created_at:now(),ip,user_agent:String(req.headers.get('user-agent')||'').slice(0,400),language:String(req.headers.get('accept-language')||'').slice(0,100),country:countryOf(req,ip).slice(0,8),fill_seconds:age,spam:flags.length?'flagged: '+flags.join('; '):'passed (token, honeypot, rate limit, content checks)',...(flags.length?{delivery_message:'Not emailed: marked as spam.'}:{}),search});
 if(!flags.length)await deliverForm(uuid).catch(()=>{});
 return json({ok:true,message:OK});
}catch(e){return failure(e)}}
```

### app/api/forms/token/route.ts

<!-- avault-file path="app/api/forms/token/route.ts" mode="owned" sha256="c74c93f02b109e9510a9989abbe50bfe4b8b439037d0924d1c8af61543919bfb" eol="1" -->
```ts
import {issueFormToken} from '@/lib/avault/spam';
import {json,failure} from '@/lib/avault/store';
export const dynamic='force-dynamic';
// Lead forms fetch a fresh signed token when the page loads; /api/forms/submit requires it.
export async function GET(){try{return json({token:await issueFormToken()})}catch(e){return failure(e)}}
```

### app/api/maintenance/route.ts

<!-- avault-file path="app/api/maintenance/route.ts" mode="owned" sha256="b5ed95f23c34f3e427e4a15f30c7b721de94b9b2b531c5f5eed1a80f72d77b47" eol="1" -->
```ts
import {runtime,runMaintenance} from '@/lib/avault/runtime';
import {db,json,failure,HttpError} from '@/lib/avault/store';
export async function POST(req:Request){try{const supplied=req.headers.get('authorization')||'';const expected='Bearer '+runtime.AVAULT_JOBS_SECRET;const a=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(supplied))),b=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(expected)));if(!runtime.AVAULT_JOBS_SECRET||a.reduce((x,v,i)=>x|(v^b[i]),0)!==0)throw new HttpError(401,'Not authorized.');return json(await runMaintenance('scheduled-job'))}catch(e){return failure(e)}}
```

### app/avault/admin-views.tsx

<!-- avault-file path="app/avault/admin-views.tsx" mode="owned" sha256="ae89f4438f17e2441520f74be174c0f716f861460737197583c9b4ba2a6d2423" eol="1" -->
```tsx
'use client';
import {useEffect,useMemo,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Search,Download,DatabaseBackup,ShieldCheck,RotateCcw,X,Plus,Globe,Ban,CircleCheck,Info,Lock,FileText,Mail,Image as ImageIcon,Settings,Users,Link as LinkIcon,KeyRound,Inbox,CalendarClock,Tags,LogIn,Trash2} from 'lucide-react';
import {request} from './content-tools';
import {isIpRange,matchesIP,parseIp} from '@/lib/avault/ip';

// Redesigned AVAULT admin screens: Activity log, Backups and Traffic access.
type Notice=(s:string)=>void;
const fullTime=(iso?:string)=>iso?new Date(iso).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):'—';
const clock=(iso:string)=>new Date(iso).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
function dayLabel(iso:string){const d=new Date(iso),t=new Date();const k=(x:Date)=>x.toDateString();const y=new Date(t);y.setDate(t.getDate()-1);return k(d)===k(t)?'Today':k(d)===k(y)?'Yesterday':d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:d.getFullYear()===t.getFullYear()?undefined:'numeric'})}
function ago(iso?:string){if(!iso)return '—';const s=(Date.now()-new Date(iso).getTime())/1000;if(s<60)return 'just now';if(s<3600)return Math.floor(s/60)+' min ago';if(s<86400)return Math.floor(s/3600)+' h ago';return Math.floor(s/86400)+' d ago'}
const Find=({value,set,placeholder}:{value:string;set:(v:string)=>void;placeholder:string})=><label className="av-find"><Search size={16} aria-hidden="true"/><Input aria-label={placeholder} placeholder={placeholder} value={value} onChange={e=>set(e.target.value)}/></label>;

// ── Activity log ────────────────────────────────────────────────────────────
// Plain-language names and a colour family for each recorded action.
const ACTIONS:Record<string,[string,string,typeof FileText]>={
 publish:['Published','green',FileText],save:['Saved a draft','blue',FileText],unpublish:['Unpublished','red',FileText],'scheduled-publish':['Published on schedule','green',CalendarClock],schedule:['Scheduled','blue',CalendarClock],'cancel-schedule':['Cancelled a schedule','red',CalendarClock],'delete-draft':['Deleted a draft','red',Trash2],rename:['Renamed a page','blue',FileText],create:['Created a draft','blue',FileText],
 upload:['Uploaded media','blue',ImageIcon],'media-metadata':['Edited media details','blue',ImageIcon],'archive-media':['Archived media','red',ImageIcon],'media-alt':['Updated image descriptions','blue',ImageIcon],'media-replace':['Replaced an image','blue',ImageIcon],
 redirect:['Saved a redirect','blue',LinkIcon],'redirect-update':['Edited a redirect','blue',LinkIcon],'redirect-delete':['Deleted a redirect','red',LinkIcon],
 'section-insert':['Added a section','blue',FileText],'section-duplicate':['Duplicated a section','blue',FileText],'section-remove':['Removed a section','red',FileText],'revision-restore':['Restored a revision','yellow',RotateCcw],'create-family':['Created a page family','blue',FileText],
 'form-status':['Updated a lead','blue',Inbox],'form-bulk':['Updated leads','blue',Inbox],'delete-submission':['Deleted a lead','red',Inbox],'export-leads':['Exported leads','blue',Download],'email-retry':['Retried a lead email','blue',Mail],'email-test':['Sent a test email','blue',Mail],
 taxonomy:['Saved a category or tag','blue',Tags],'delete-taxonomy':['Deleted a category or tag','red',Tags],
 backup:['Created a backup','green',DatabaseBackup],'backup-delete':['Deleted a backup','red',DatabaseBackup],'restore-page':['Restored a page from backup','yellow',RotateCcw],'backup-restore':['Restored a page from backup','yellow',RotateCcw],'privacy-erase':['Erased a person’s data','red',ShieldCheck],
 settings:['Changed site settings','yellow',Settings],navigation:['Changed the header or footer','yellow',Settings],configuration:['Changed a setting','yellow',Settings],access:['Changed a user','yellow',Users],
 users:['Changed a user','yellow',Users],'delete-user':['Removed a user','red',Users],password:['Changed a password','yellow',KeyRound],'sign-in':['Signed in','gray',LogIn],
};
// Every settings save is logged as "settings" with the settings key as entity; name the area that changed.
const SETTINGS:Record<string,string>={global:'site settings',email:'email settings',forms:'the forms',scripts:'custom scripts',traffic:'traffic access',operations:'privacy & tracking',verification:'search-engine verification',files:'discovery files',menus:'extra menu links'};
export const describe=(a:string,entity?:string):[string,string,typeof FileText]=>a==='settings'&&entity&&SETTINGS[entity]?['Changed '+SETTINGS[entity],'yellow',Settings]:ACTIONS[a]||[a.replace(/[-_]/g,' ').replace(/^./,c=>c.toUpperCase()),'gray',Settings];
// Entries whose entity is a page that can be opened in the editor, and entities that add nothing to the line.
const PAGE_ACTIONS=new Set(['publish','save','unpublish','scheduled-publish','schedule','cancel-schedule','rename','create','restore-page']);
export const GENERIC=new Set(['global','email','backup','settings','navigation','configuration','traffic','operations','scripts','menus','files','verification','forms']);
const initials=(e:string)=>(e.split('@')[0].split(/[._-]/).filter(Boolean).slice(0,2).map(x=>x[0]).join('')||e[0]||'?').toUpperCase();

export function ActivityLog({notice}:{notice:Notice}){
 const [f,setF]=useState({q:'',actor:'',action:'',from:'',to:''}),[page,setPage]=useState(0),[data,setData]=useState<any>(null);
 useEffect(()=>{const t=setTimeout(()=>request('activity?'+new URLSearchParams({...f,page:String(page)})).then(setData).catch(e=>notice(e.message)),f.q?300:0);return()=>clearTimeout(t)},[f,page]);// eslint-disable-line react-hooks/exhaustive-deps
 const set=(k:string,v:string)=>{setF({...f,[k]:v});setPage(0)};
 const rows:any[]=data?.rows||[];
 const groups=useMemo(()=>{const g:[string,any[]][]=[];for(const r of rows){const d=dayLabel(r.created_at);const last=g[g.length-1];if(last&&last[0]===d)last[1].push(r);else g.push([d,[r]])}return g},[rows]);
 const filtered=!!(f.q||f.actor||f.action||f.from||f.to);
 return <div className="vault-card av-table-card av-activity">
  <div className="av-table-tools">
   <Find value={f.q} set={v=>set('q',v)} placeholder="Search pages, actions or people…"/>
   <label className="av-sort">Person<select value={f.actor} onChange={e=>set('actor',e.target.value)}><option value="">Anyone</option>{data?.actors?.map((a:string)=><option key={a} value={a}>{a}</option>)}</select></label>
   <label className="av-sort">Action<select value={f.action} onChange={e=>set('action',e.target.value)}><option value="">Any action</option>{[...(data?.actions||[])].sort((a:string,b:string)=>describe(a)[0].localeCompare(describe(b)[0])).map((a:string)=><option key={a} value={a}>{describe(a)[0]}</option>)}</select></label>
   <span className="av-daterange"><Input type="date" aria-label="From date" value={f.from} onChange={e=>set('from',e.target.value)}/><span>to</span><Input type="date" aria-label="To date" value={f.to} onChange={e=>set('to',e.target.value)}/></span>
   {filtered&&<button type="button" className="av-link" onClick={()=>{setF({q:'',actor:'',action:'',from:'',to:''});setPage(0)}}><X size={14}/>Clear filters</button>}
  </div>
  {!data&&<p className="av-empty" role="status">Loading activity…</p>}
  {data&&!rows.length&&<p className="av-empty">{filtered?'No activity matches these filters.':'Nothing recorded yet.'}</p>}
  {groups.map(([day,list])=><section key={day} className="av-day"><h3>{day}<span>{list.length} event{list.length===1?'':'s'}</span></h3><ol>{list.map(r=>{const [label,tone,I]=describe(r.action,r.entity);const entity=String(r.entity||''),hidden=!entity||entity===r.actor||GENERIC.has(entity),isPage=PAGE_ACTIONS.has(r.action)&&entity.startsWith('/');return <li key={r.id}>
   <span className={'av-act-icon '+tone}><I size={16} aria-hidden="true"/></span>
   <div className="av-act-main"><p><strong>{label}</strong>{!hidden&&<> · {isPage?<a href={'/avault?view=pages&route='+encodeURIComponent(entity)}>{entity}</a>:<span className="av-act-entity">{entity}</span>}</>}</p><small><span className="av-avatar" aria-hidden="true">{initials(String(r.actor||''))}</span>{r.actor||'System'}</small></div>
   <time dateTime={r.created_at} title={fullTime(r.created_at)}>{clock(r.created_at)}</time>
  </li>})}</ol></section>)}
  {data&&(page>0||rows.length>=50)&&<div className="av-table-foot av-pager"><span>Page {page+1}</span><span className="actions"><Button variant="outline" size="sm" disabled={!page} onClick={()=>setPage(page-1)}>Newer</Button><Button variant="outline" size="sm" disabled={rows.length<50} onClick={()=>setPage(page+1)}>Older</Button></span></div>}
 </div>;
}

// ── Backups ─────────────────────────────────────────────────────────────────
const TABLES:Record<string,string>={documents:'Pages & posts',settings:'Settings',redirects:'Redirects',media:'Media records',users:'Users',forms:'Leads',activity:'Activity entries',taxonomy:'Categories & tags',schedules:'Schedules',revisions:'Revisions',events:'Visit events'};
const size=(b:number)=>b<1024*1024?`${Math.max(1,Math.round(b/1024))} KB`:`${(b/1024/1024).toFixed(1)} MB`;

export function BackupsPanel({role,notice}:{role:string;notice:Notice}){
 const [rows,setRows]=useState<any[]|null>(null),[busy,setBusy]=useState(false),[open,setOpen]=useState<string|null>(null),[inspection,setInspection]=useState<any>(null),[target,setTarget]=useState(''),[ops,setOps]=useState<{value:any;revision:number}|null>(null),[q,setQ]=useState('');
 const load=()=>request('backups?page=0').then(setRows).catch(e=>notice(e.message));
 useEffect(()=>{if(role!=='owner')return;load();request('configuration?key=operations').then(setOps).catch(()=>{})},[]);// eslint-disable-line react-hooks/exhaustive-deps
 async function act(fn:()=>Promise<unknown>){setBusy(true);try{await fn()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 if(role!=='owner')return <div className="vault-card"><p>Only owners can create, download or restore backups.</p></div>;
 const latest=rows?.[0],daily=!!ops?.value?.dailyBackup;
 const inspect=(id:string)=>{if(open===id){setOpen(null);return}act(async()=>{setInspection(null);setTarget('');setOpen(id);setInspection(await request('backup-inspect',{id}))})};
 return <div className="av-backups">
  <div className="vault-card av-backup-hero">
   <span className="av-backup-icon"><DatabaseBackup size={26}/></span>
   <div><h2>{latest?`Last backup ${ago(latest.created_at)}`:'No backups yet'}</h2><p>{latest?`${fullTime(latest.created_at)} · ${size(latest.bytes)} · ${rows!.length} kept`:'Create one before making big changes.'}</p></div>
   <div className="av-backup-actions"><Button disabled={busy} onClick={()=>act(async()=>{await request('backup',{});notice('Backup created and encrypted.');await load()})}><Plus/>{busy?'Working…':'Back up now'}</Button></div>
  </div>
  <div className="av-backup-facts">
   <div className="vault-card"><Lock size={18}/><strong>Encrypted</strong><p>Each snapshot is sealed with your encryption key and checked (SHA-256) every time it’s read.</p></div>
   <div className="vault-card"><FileText size={18}/><strong>What’s included</strong><p>Pages and posts with revisions, settings, redirects, media records and a copy of every uploaded file, users, leads and the activity log. Visit records are not included.</p></div>
   <div className="vault-card av-daily"><CalendarClock size={18}/><strong>Daily backup</strong><p>{daily?'On: a new snapshot is made once a day.':'Off: backups are only made when you click “Back up now”.'}</p>{ops&&<button type="button" role="switch" aria-checked={daily} className={'av-switch'+(daily?' on':'')} disabled={busy} onClick={()=>act(async()=>{const r=await request('configuration',{key:'operations',value:{...ops.value,dailyBackup:!daily},revision:ops.revision});setOps({value:{...ops.value,dailyBackup:!daily},revision:r.revision});notice(daily?'Daily backups turned off.':'Daily backups turned on.')})}><span/>{daily?'On':'Off'}</button>}</div>
  </div>
  <div className="vault-card av-table-card">
   <div className="av-table-tools"><h2 className="av-table-title">Saved backups</h2><span className="av-table-meta">Downloads stay encrypted. Open one with <code>npm run backup:decrypt</code> and this site’s encryption key.</span></div>
   {!rows&&<p className="av-empty" role="status">Loading backups…</p>}
   {rows&&!rows.length&&<p className="av-empty">No backups yet. Click “Back up now” to create the first one.</p>}
   {rows&&rows.length>0&&<div className="av-table av-backup-table" role="table" aria-label="Backups">
    <div className="av-tr av-th" role="row"><span role="columnheader">Created</span><span role="columnheader">Size</span><span role="columnheader">Integrity</span><span role="columnheader"><span className="sr-only">Actions</span></span></div>
    {rows.map((r,i)=><div key={r.id} className={'av-backup-row'+(open===r.id?' open':'')}>
     <div className="av-tr" role="row"><span role="cell" className="av-cell-title"><strong>{fullTime(r.created_at)}</strong><small>{ago(r.created_at)}{i===0?' · latest':''}</small></span><span role="cell" className="av-muted-cell">{size(r.bytes)}</span><span role="cell"><span className="av-pill av-pill-live"><ShieldCheck size={12}/>Encrypted</span></span><span role="cell" className="av-actions-cell"><Button variant={open===r.id?'default':'outline'} size="sm" disabled={busy} onClick={()=>inspect(r.id)}>{open===r.id?'Close':'Inspect & restore'}</Button><a className="av-icon-btn" href={'/api/admin/backup-download?id='+r.id} download aria-label={'Download encrypted backup from '+fullTime(r.created_at)} title="Download (encrypted)"><Download size={16}/></a>{i>0&&<button type="button" className="av-icon-btn" disabled={busy} aria-label={'Delete backup from '+fullTime(r.created_at)} title="Delete" onClick={()=>{if(!confirm(`Delete the backup from ${fullTime(r.created_at)}? Its encrypted snapshot and file copies are removed for good.`))return;act(async()=>{await request('backup-delete',{id:r.id});if(open===r.id)setOpen(null);notice('Backup deleted.');await load()})}}><Trash2 size={16}/></button>}</span></div>
     {open===r.id&&<div className="av-backup-detail">{!inspection?<p className="muted" role="status">Decrypting and checking this backup…</p>:<>
      <p className="av-verified"><CircleCheck size={16}/>Verified · taken {fullTime(inspection.date)}{inspection.origin?` from ${String(inspection.origin).replace(/^https?:\/\//,'')}`:''}</p>
      <div className="av-backup-counts">{Object.entries(inspection.counts).filter(([,v])=>Number(v)>0).map(([k,v])=><div key={k}><strong>{String(v)}</strong><span>{TABLES[k]||k}</span></div>)}</div>
      <div className="av-restore"><h3>Restore one page</h3><p>Brings back that page’s draft and published version from this backup as a new revision. A fresh backup is made first, so nothing is lost.</p>
       <Find value={q} set={setQ} placeholder="Find a page…"/>
       <div className="av-restore-list" role="listbox" aria-label="Pages in this backup">{inspection.documents.filter((d:any)=>d.route.includes(q.toLowerCase())).slice(0,80).map((d:any)=><button key={d.route} type="button" role="option" aria-selected={target===d.route} className={target===d.route?'selected':''} onClick={()=>setTarget(d.route)}><span>{d.route}</span><small>revision {d.revision}</small></button>)}</div>
       <Button disabled={!target||busy} onClick={()=>act(async()=>{const current=await request('document?route='+encodeURIComponent(target));if(!confirm(`Restore ${target} from the backup taken ${fullTime(inspection.date)}? A fresh backup is created first.`))return;await request('backup-restore-page',{id:r.id,route:target,expectedRevision:current.revision});notice(`${target} restored as a new revision.`);await load()})}><RotateCcw/>{target?`Restore ${target}`:'Choose a page to restore'}</Button>
      </div></>}</div>}
    </div>)}
   </div>}
  </div>
 </div>;
}

// ── Traffic access ──────────────────────────────────────────────────────────
const regionName=(c:string)=>{try{return new Intl.DisplayNames(['en'],{type:'region'}).of(c)||c}catch{return c}};
const COUNTRIES='AF AL DZ AR AM AU AT AZ BD BY BE BR BG KH CA CL CN CO HR CU CZ DK EG EE ET FI FR GE DE GH GR HK HU IN ID IR IQ IE IL IT JP JO KZ KE KP KR KW LV LB LT MY MX MD MA MM NL NZ NG NO PK PH PL PT QA RO RU SA RS SG SK ZA ES LK SE CH SY TW TH TR UA AE GB US UZ VE VN YE'.split(' ');

function RuleList({title,hint,icon,tone,items,setItems,kind,placeholder,suggest}:{title:string;hint:string;icon:React.ReactNode;tone:string;items:string[];setItems:(v:string[])=>void;kind:'ip'|'country';placeholder:string;suggest?:React.ReactNode}){
 const [draft,setDraft]=useState(''),[err,setErr]=useState('');
 function add(raw=draft){const v=kind==='country'?raw.trim().toUpperCase():raw.trim();if(!v)return;
  if(kind==='ip'&&!isIpRange(v))return setErr('Use an address like 203.0.113.7 or 2001:db8::1, or a range like 203.0.113.0/24.');
  if(kind==='country'&&!/^[A-Z]{2}$/.test(v))return setErr('Pick a country from the list (two-letter code).');
  if(items.includes(v))return setErr('Already in the list.');
  setItems([...items,v]);setDraft('');setErr('')}
 return <section className={'vault-card av-rule '+tone}>
  <header><span className="av-rule-icon">{icon}</span><div><h3>{title}</h3><p>{hint}</p></div><span className="av-count">{items.length}</span></header>
  <form className="av-rule-add" onSubmit={e=>{e.preventDefault();add()}}>
   {kind==='country'?<select className="av-select av-country-select" value={draft} onChange={e=>{setDraft(e.target.value);setErr('')}} aria-label={'Add to '+title}><option value="">Choose a country…</option>{COUNTRIES.filter(c=>!items.includes(c)).map(c=><option key={c} value={c}>{regionName(c)} ({c})</option>)}</select>:<Input value={draft} onChange={e=>{setDraft(e.target.value);setErr('')}} placeholder={placeholder} aria-label={'Add to '+title}/>}
   <Button type="submit" variant="outline" size="sm"><Plus/>Add</Button>
  </form>
  {err&&<p className="av-rule-err" role="alert">{err}</p>}
  {suggest}
  {items.length?<ul className="av-chips-list">{items.map(v=><li key={v}><span>{kind==='country'?`${regionName(v)} (${v})`:v}</span><button type="button" aria-label={'Remove '+v} onClick={()=>setItems(items.filter(x=>x!==v))}><X size={13}/></button></li>)}</ul>:<p className="av-rule-empty">None yet.</p>}
 </section>;
}

export function TrafficPanel({role,notice}:{role:string;notice:Notice}){
 const [cfg,setCfg]=useState<any>(null),[saved,setSaved]=useState<any>(null),[revision,setRevision]=useState(0),[busy,setBusy]=useState(false),[ip,setIp]=useState(''),[myCountry,setMyCountry]=useState('');
 useEffect(()=>{if(role!=='owner')return;request('configuration?key=traffic').then(r=>{const v={enabled:false,allow:[],deny:[],countries:[],...r.value};setCfg(v);setSaved(v);setRevision(r.revision)}).catch(e=>notice(e.message));request('whoami').then(r=>{setIp(r.ip||'');setMyCountry(r.country||'')}).catch(()=>{})},[]);// eslint-disable-line react-hooks/exhaustive-deps
 if(role!=='owner')return <div className="vault-card"><p>Only owners can change traffic access rules.</p></div>;
 if(!cfg)return <p className="vault-card av-empty" role="status">Loading rules…</p>;
 const dirty=JSON.stringify(cfg)!==JSON.stringify(saved);
 const set=(k:string,v:any)=>setCfg((c:any)=>({...c,[k]:v}));
 async function save(next=cfg){setBusy(true);try{const r=await request('configuration',{key:'traffic',value:next,revision});setRevision(r.revision);setSaved(next);setCfg(next);notice(next.enabled?'Traffic rules saved and active.':'Traffic rules saved. They are off.')}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 const myIpBlocked=!!ip&&!cfg.allow.some((r:string)=>matchesIP(ip,r))&&(cfg.deny.some((r:string)=>matchesIP(ip,r))||(!!myCountry&&cfg.countries.includes(myCountry)));
 const total=cfg.allow.length+cfg.deny.length+cfg.countries.length;
 return <div className="av-traffic">
  <div className={'vault-card av-traffic-hero'+(cfg.enabled?' on':'')}>
   <span className="av-backup-icon"><ShieldCheck size={26}/></span>
   <div><h2>{cfg.enabled?'Rules are active':'Rules are off'}</h2><p>{cfg.enabled?`${total} rule${total===1?'':'s'} checked on every public page request.`:'Every visitor can open the website. Turn rules on to block IPs or countries.'} AVAULT always stays reachable, so you can’t lock yourself out of the admin.</p></div>
   <button type="button" role="switch" aria-checked={cfg.enabled} className={'av-switch av-switch-lg'+(cfg.enabled?' on':'')} disabled={busy} onClick={()=>set('enabled',!cfg.enabled)}><span/>{cfg.enabled?'On':'Off'}</button>
  </div>
  {myIpBlocked&&<p className="av-traffic-warn" role="alert"><Info size={16}/>These rules block you ({ip}{myCountry?`, ${regionName(myCountry)}`:''}). You’ll still reach AVAULT, but not the public website. Add your IP to “Always allow” to keep access.</p>}
  <div className="av-rules">
   <RuleList title="Always allow" hint="These IPs are never blocked, even if another rule matches." icon={<CircleCheck size={18}/>} tone="allow" kind="ip" placeholder="203.0.113.7, 203.0.113.0/24 or 2001:db8::/32" items={cfg.allow} setItems={v=>set('allow',v)} suggest={ip&&parseIp(ip)&&!cfg.allow.some((r:string)=>matchesIP(ip,r))?<button type="button" className="av-link" onClick={()=>set('allow',[...cfg.allow,ip])}><Plus size={13}/>Add my IP ({ip})</button>:undefined}/>
   <RuleList title="Block IPs" hint="Visitors from these addresses see “Access unavailable”." icon={<Ban size={18}/>} tone="deny" kind="ip" placeholder="198.51.100.23" items={cfg.deny} setItems={v=>set('deny',v)}/>
   <RuleList title="Block countries" hint={`Each visitor’s country comes from their IP address, looked up on this server.${myCountry?` You appear to be in ${regionName(myCountry)}.`:''}`} icon={<Globe size={18}/>} tone="country" kind="country" placeholder="Type a country code, e.g. RU" items={cfg.countries} setItems={v=>set('countries',v)}/>
  </div>
  <div className="vault-card av-traffic-order"><h3>How a visit is checked</h3><ol><li><b>1</b><span>On the <em>Always allow</em> list? The page opens.</span></li><li><b>2</b><span>On <em>Block IPs</em>? The visitor sees “Access unavailable”.</span></li><li><b>3</b><span>From a <em>blocked country</em>? “Access unavailable”.</span></li><li><b>4</b><span>Anyone else: the page opens as normal.</span></li></ol><p className="av-attrib">Country data: <a href="https://github.com/sapics/ip-location-db" target="_blank" rel="noreferrer">ip-location-db</a> (CC0), including statistics from <a href="https://www.nro.net/" target="_blank" rel="noreferrer">nro.net</a> (CC BY 4.0). Updated with each site update.</p></div>
  {dirty&&<div className="av-savebar show" role="region" aria-label="Unsaved changes"><span>You have unsaved changes.</span><span className="actions"><Button variant="outline" disabled={busy} onClick={()=>setCfg(saved)}>Discard</Button><Button disabled={busy} onClick={()=>save()}>{busy?'Saving…':'Save rules'}</Button></span></div>}
 </div>;
}
```

### app/avault/content-tools.tsx

<!-- avault-file path="app/avault/content-tools.tsx" mode="owned" sha256="94088d3c0645e5b3bdf88570bb7972cdd2c25f9b5cfa0db6c52b8aad68d88e5d" eol="1" -->
```tsx
'use client';
import {useEffect,useState,useRef} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import type {Doc} from '@/lib/avault/store';
import type {Block} from '@/lib/avault/blocks';
import {ArrowUp,ArrowDown} from 'lucide-react';
import {serverError} from './toast';
import {adminFetch} from './session';

export function ClassificationTools({doc,onChange,notice}:{doc:Doc;onChange:(d:Doc)=>void;notice:(s:string)=>void}){const [taxonomy,setTaxonomy]=useState<any[]>([]);useEffect(()=>{request('taxonomy').then(setTaxonomy).catch(e=>notice(e.message))},[]);return <section className="vault-card vault-settings av-classification"><h2>Categories &amp; tags</h2><p>Choose a primary topic and add tags that connect related blog posts.</p><label>Primary category<select value={doc.category||''} onChange={e=>onChange({...doc,category:e.target.value})}><option value="">Uncategorized</option>{taxonomy.filter(t=>t.type==='category').map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></label><fieldset><legend>Tags</legend><div className="av-tag-picker">{taxonomy.filter(t=>t.type==='tag').map(t=><label key={t.id} className={doc.tags?.includes(t.id)?'selected':''}><input type="checkbox" checked={doc.tags?.includes(t.id)||false} onChange={e=>onChange({...doc,tags:e.target.checked?[...(doc.tags||[]),t.id]:(doc.tags||[]).filter(id=>id!==t.id)})}/>{t.label}</label>)}</div></fieldset><a className="av-link" href="/avault?view=taxonomy">Manage categories and tags</a></section>}
export async function request(path:string,data?:unknown){const r=await adminFetch(path,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});const v:any=await r.json();if(!r.ok)throw serverError(v.error||'Request failed');return v}
function TextEditor({value,change}:{value:string;change:(v:string)=>void}){const ref=useRef<HTMLTextAreaElement>(null);function wrap(before:string,after=before){const el=ref.current;if(!el)return;const start=el.selectionStart,end=el.selectionEnd;change(value.slice(0,start)+before+value.slice(start,end)+after+value.slice(end));requestAnimationFrame(()=>{el.focus();el.setSelectionRange(start+before.length,end+before.length)})}return <><div className="actions" role="toolbar" aria-label="Text formatting">{[['Bold','**'],['Italic','*'],['Underline','__'],['Strike','~~'],['Highlight','=='],['Superscript','^'],['Subscript','~'],['Code','`']].map(([label,marker])=><Button type="button" variant="outline" key={label} onClick={()=>wrap(marker)}>{label}</Button>)}<Button type="button" variant="outline" onClick={()=>{const url=prompt('Link destination: a page path like /local-seo/, a full https:// address, tel: or mailto:','/');if(!url)return;const external=/^https?:/.test(url);const opts=[...(confirm(external?'Open in a new tab?':'Open in a new tab? (Usually No for your own pages.)')?['newtab']:[]),...(external&&confirm('Add nofollow? Use for links you don’t vouch for.')?['nofollow']:[]),...(external&&confirm('Is it a paid or affiliate link (sponsored)?')?['sponsored']:[])];wrap('[',']('+url+(opts.length?' "'+opts.join(' ')+'"':'')+')')}}>Link</Button><Button type="button" variant="outline" onClick={()=>{const el=ref.current;if(!el)return;const start=el.selectionStart,end=el.selectionEnd;const whole=start===end;const part=whole?value:value.slice(start,end);const clean=part.replace(/\*\*|__|~~|==|[*^~`]/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1');change(whole?clean:value.slice(0,start)+clean+value.slice(end))}}>Clear formatting</Button></div><Textarea ref={ref} value={value} onChange={e=>change(e.target.value)} rows={5}/></>}
export function ContentTools({doc,onChange,notice}:{doc:Doc;onChange:(d:Doc)=>void;notice:(s:string)=>void}){const [sections,setSections]=useState<any[]>([]),[type,setType]=useState<Block['type']>('paragraph'),[taxonomy,setTaxonomy]=useState<any[]>([]);useEffect(()=>{request('taxonomy').then(setTaxonomy).catch(e=>notice(e.message));request('sections?route='+encodeURIComponent(doc.route)).then(setSections).catch(e=>notice(e.message))},[doc.route]);const blocks=doc.blocks||[];const order=doc.sectionOrder||sections.map(s=>s.id);function move<T>(items:T[],i:number,offset:number){const copy=[...items];[copy[i],copy[i+offset]]=[copy[i+offset],copy[i]];return copy}function patch(i:number,p:Partial<Block>){onChange({...doc,blocks:blocks.map((b,n)=>i===n?{...b,...p}:b)})}
return <><section className="vault-card"><h2>Page sections</h2><p>Reorder existing sections or hide a section. The main heading must stay visible.</p>{order.map((id,i)=><div className="vault-row" key={id}><label className="inline"><input type="checkbox" checked={!doc.hiddenSections?.includes(id)} onChange={e=>onChange({...doc,hiddenSections:e.target.checked?(doc.hiddenSections||[]).filter(s=>s!==id):[...(doc.hiddenSections||[]),id]})}/>{sections.find(s=>s.id===id)?.label||id}</label><div className="actions"><Button variant="outline" disabled={!i} onClick={()=>onChange({...doc,sectionOrder:move(order,i,-1)})}><ArrowUp/>Move up</Button><Button variant="outline" disabled={i===order.length-1} onClick={()=>onChange({...doc,sectionOrder:move(order,i,1)})}><ArrowDown/>Move down</Button></div></div>)}</section><section className="vault-card av-additional-content"><h2>Additional content</h2><p>Add sections after the existing content. Text supports **bold**, *italic*, __underline__, ~~strikethrough~~, ==highlight==, ^superscript^, ~subscript~ and links. Internal links open in the same tab and pass SEO value; the Link button asks about new tab and nofollow for other sites. Pasted text arrives as plain text, so no hidden formatting or scripts come along.</p><div className="actions"><select aria-label="Block type" value={type} onChange={e=>setType(e.target.value as Block['type'])}>{['paragraph','heading','image','quote','list','table','cta','cards','code','rule','form'].map(t=><option key={t}>{t}</option>)}</select><Button onClick={()=>onChange({...doc,blocks:[...blocks,{id:crypto.randomUUID(),type,text:'',formId:'',items:[],rows:[],color:'neutral'}]})}>Add content block</Button></div>{blocks.map((b,i)=><article className="vault-block" key={b.id}><div className="vault-row"><h3>{i+1}. {b.type}</h3><div className="actions"><Button variant="outline" disabled={!i} onClick={()=>onChange({...doc,blocks:move(blocks,i,-1)})}><ArrowUp/>Move up</Button><Button variant="outline" disabled={i===blocks.length-1} onClick={()=>onChange({...doc,blocks:move(blocks,i,1)})}><ArrowDown/>Move down</Button><Button variant="outline" onClick={()=>onChange({...doc,blocks:blocks.filter((_,n)=>n!==i)})}>Remove</Button></div></div>{b.type==='form'&&<label>Reusable form ID<Input value={b.formId||''} onChange={e=>patch(i,{formId:e.target.value})} placeholder="custom-form-1"/><small>Create the form in Forms, then use its ID here.</small></label>}{!['image','list','cards','table','rule','form'].includes(b.type)&&<label>Text<TextEditor value={b.text||''} change={text=>patch(i,{text})}/></label>}{['image','cta'].includes(b.type)&&<label>{b.type==='image'?'Image URL':'Destination URL'}<Input value={b.url||''} onChange={e=>patch(i,{url:e.target.value})}/></label>}{b.type==='image'&&<><label>Image description<Input value={b.alt||''} onChange={e=>patch(i,{alt:e.target.value})}/></label><label>Caption<Input value={b.caption||''} onChange={e=>patch(i,{caption:e.target.value})}/></label></>}{['list','cards'].includes(b.type)&&<label>One item per line<Textarea value={(b.items||[]).join('\n')} onChange={e=>patch(i,{items:e.target.value.split('\n')})}/></label>}{b.type==='table'&&<label>One row per line; separate columns with |. First row is the heading.<Textarea value={(b.rows||[]).map(r=>r.join(' | ')).join('\n')} onChange={e=>patch(i,{rows:e.target.value.split('\n').map(r=>r.split('|').map(v=>v.trim()))})}/></label>}<div className="actions">{b.type==='heading'&&<label>Heading level<select value={b.level||2} onChange={e=>patch(i,{level:+e.target.value})}>{[2,3,4,5,6].map(n=><option key={n}>{n}</option>)}</select></label>}<label>Accent<select value={b.color||'neutral'} onChange={e=>patch(i,{color:e.target.value as Block['color']})}>{['neutral','blue','red','green','yellow'].map(v=><option key={v}>{v}</option>)}</select></label><label>Alignment<select value={b.align||'left'} onChange={e=>patch(i,{align:e.target.value as Block['align']})}>{['left','center','right','justify'].map(v=><option key={v}>{v}</option>)}</select></label>{b.type==='list'&&<label><input type="checkbox" checked={b.ordered||false} onChange={e=>patch(i,{ordered:e.target.checked})}/> Numbered list</label>}</div></article>)}</section><section className="vault-card vault-settings"><h2>Classification</h2><label>Category<select value={doc.category||''} onChange={e=>onChange({...doc,category:e.target.value})}><option value="">Uncategorized</option>{taxonomy.filter(t=>t.type==='category').map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></label><p>Manage categories and tags under Categories &amp; tags.</p>{taxonomy.filter(t=>t.type==='tag').map(t=><label className="inline" key={t.id}><input type="checkbox" checked={doc.tags?.includes(t.id)||false} onChange={e=>onChange({...doc,tags:e.target.checked?[...(doc.tags||[]),t.id]:(doc.tags||[]).filter(id=>id!==t.id)})}/>{t.label}</label>)}</section></>}
export function PublishingTools({doc,notice,open}:{doc:Doc;notice:(s:string)=>void;open:(s:string)=>void}){const [to,setTo]=useState(''),[impact,setImpact]=useState<any>(null),[due,setDue]=useState(''),[busy,setBusy]=useState(false);async function act(fn:()=>Promise<any>){setBusy(true);try{await fn()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}return <section className="vault-card vault-settings"><h2>Publishing controls</h2><p>Save your draft before using these controls. Scheduled publication uses the saved revision and stops if someone edits it.</p><label>Publish at (your local time)<Input type="datetime-local" value={due} onChange={e=>setDue(e.target.value)}/></label><Button disabled={busy||!due} onClick={()=>act(async()=>{await request('schedule',{route:doc.route,revision:doc.revision,due:new Date(due).toISOString()});notice('Schedule saved. It publishes automatically within 10 minutes of the time you chose. You can also run due jobs now from System health.')})}>Schedule saved revision</Button><h2>Change this page’s URL</h2><label>New URL<Input value={to} onChange={e=>{setTo(e.target.value);setImpact(null)}} placeholder="/new-page/"/></label><Button variant="outline" disabled={busy||!to} onClick={()=>act(async()=>setImpact(await request('rename-impact',{from:doc.route,to})))}>Review affected pages</Button>{impact&&<><p>{impact.affected.length} pages will be updated together. The old URL will redirect permanently.</p><ul>{impact.affected.map((d:any)=><li key={d.route}>{d.route} · revision {d.revision}</li>)}</ul><Button disabled={busy} onClick={()=>act(async()=>{const result=await request('rename',{from:doc.route,to,expected:impact.affected});notice('Page moved and references updated.');open(result.route)})}>Apply URL change</Button></>}</section>}
```

### app/avault/forms-editor.tsx

<!-- avault-file path="app/avault/forms-editor.tsx" mode="owned" sha256="1c0566d9dc4555462135ac5ecb9407ddd6b2581ed987b7834ab6fea7536eeb34" eol="1" -->
```tsx
'use client';
import {useEffect,useMemo,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {ArrowUp,ArrowDown,Trash2,Plus,Monitor,Smartphone,Lock} from 'lucide-react';
import {request} from './content-tools';
import {contactFormInner,heroFormInner,CORE,FIELD_TYPES,type FormsConfig,type FormField,type FieldType} from '@/lib/avault/forms';

// AVAULT → Forms: every form on the website, where it appears, a live preview in the site's design,
// and an editor for its fields, choices and button. Saving applies the form to every page that has it.
const TYPE_LABEL:Record<FieldType,string>={text:'Short text',email:'Email',url:'Website',tel:'Phone',textarea:'Long text',select:'Dropdown'};
const NAME_LABEL:Record<string,string>={name:'Name',phone:'Phone',email:'Email',zip:'Business ZIP',service:'Service',details:'Details'};
const esc=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const slug=(s:string)=>'x_'+(s.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,30)||'field');

export function FormsEditor({role,notice}:{role:string;notice:(s:string)=>void}){
 const [data,setData]=useState<any>(null),[form,setForm]=useState<string>('contact'),[cfg,setCfg]=useState<FormsConfig|null>(null),[dirty,setDirty]=useState(false),[busy,setBusy]=useState(false),[open,setOpen]=useState<number|null>(null),[device,setDevice]=useState<'desktop'|'mobile'>('desktop'),[showPages,setShowPages]=useState(false),[frameHeight,setFrameHeight]=useState(640);
 async function load(){try{const d=await request('site-forms');setData(d);setCfg(d.config);setDirty(false)}catch(e){notice((e as Error).message)}}
 useEffect(()=>{load()},[]);// eslint-disable-line react-hooks/exhaustive-deps
 const edit=(fn:(c:FormsConfig)=>FormsConfig)=>{setCfg(c=>c&&fn(structuredClone(c)));setDirty(true)};
 const customId=form.startsWith('custom:')?form.slice(7):'',customIndex=cfg?.custom.findIndex(f=>f.id===customId)??-1,custom=customIndex>=0?cfg!.custom[customIndex]:null,active=custom||cfg?.contact;
 const setField=(i:number,patch:Partial<FormField>)=>edit(c=>{const target=customId?c.custom.find(f=>f.id===customId):c.contact;if(target)target.fields[i]={...target.fields[i],...patch};return c});
 const move=(i:number,by:number)=>{const j=i+by;if(!cfg||!active||j<0||j>=active.fields.length)return;edit(c=>{const target=customId?c.custom.find(x=>x.id===customId):c.contact;if(target){const f=target.fields;[f[i],f[j]]=[f[j],f[i]]}return c});setOpen(j)};

 const preview=useMemo(()=>{if(!data||!cfg)return '';const s=data.shell;
  const selected=form.startsWith('custom:')?cfg.custom.find(f=>f.id===form.slice(7))||cfg.contact:cfg.contact;
  const body=form!=='hero'?`<footer class="i-footer" id="contact"><div class="shell-wide i-audit" style="display:block;max-width:680px;margin:0 auto"><form class="estimate-form audit-form i-form reveal">${contactFormInner(selected)}</form></div></footer>`:`<section class="i-hero"><div class="shell-wide i-hero-grid" style="grid-template-columns:1fr"><div class="i-hero-copy"><form class="hero-proposal" id="proposal">${heroFormInner(cfg.hero)}</form></div></div><div class="i-hero-line" aria-hidden="true"><span></span><span></span><span></span><span></span></div></section>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${s.styles.map((h:string)=>`<link rel="stylesheet" href="${esc(h)}">`).join('')}<style>.reveal{opacity:1!important;transform:none!important}html,body{margin:0;background:#f8f9fa}.i-footer{padding:28px 0!important;margin:0!important}.i-hero{padding:28px 0 0!important}form{pointer-events:none}</style></head><body${s.bodyAttrs}><div class="concept concept-i is-visible">${body}</div></body></html>`},[data,cfg,form]);

 async function save(){if(!cfg)return;setBusy(true);try{const r=await request('configuration',{key:'forms',value:cfg,revision:data.revision});setData({...data,revision:r.revision,saved:{contact:true,hero:true}});setDirty(false);notice('Forms published. Every page now uses these fields.')}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 function add(type:FieldType){if(cfg&&active)setOpen(active.fields.length);edit(c=>{const target=customId?c.custom.find(f=>f.id===customId):c.contact;if(!target)return c;const label=type==='tel'?'Phone number':type==='textarea'?'Tell us about your project':type==='select'?'New dropdown':'New field';let name=slug(label),n=2;while(target.fields.some(f=>f.name===name))name=slug(label)+'_'+n++;target.fields.push({name,label,type,placeholder:'',required:false,options:type==='select'?['Option 1','Option 2']:[],width:'full'});return c})}
 function createCustom(){if(!cfg)return;let n=cfg.custom.length+1,id=`custom-form-${n}`;while(cfg.custom.some(f=>f.id===id))id=`custom-form-${++n}`;edit(c=>{c.custom.push({...structuredClone(c.contact),id,title:`Custom form ${n}`,enabled:true});return c});setForm('custom:'+id);setOpen(0);setShowPages(false)}

 if(!data||!cfg)return <p role="status">Loading forms…</p>;
 const pages=(form.startsWith('custom:')?[]:data.pages[form]||[]) as {route:string;label:string}[];
 const list=[...cfg.custom.map(f=>({id:'custom:'+f.id,title:f.title,where:'Reusable form · ID '+f.id,count:0,fields:f.fields.length+' fields',saved:true,custom:true})),{id:'contact',title:'Door repair estimate form',where:'Estimate sections across the website',count:data.pages.contact.length,fields:cfg.contact.fields.length+' fields',saved:data.saved.contact,custom:false},...(data.pages.hero.length?[{id:'hero',title:'Quick ZIP form',where:'Hero sections where enabled',count:data.pages.hero.length,fields:'1 field',saved:data.saved.hero,custom:false}]:[])];
 return <div className="av-forms">
  <section className="av-forms-index"><div className="av-content-intro"><div><h2>Reusable custom forms</h2><p>Create a form once, preview it immediately, then insert it as a Form block on any page. Every submission reaches the same secure lead inbox.</p></div><Button type="button" onClick={createCustom}><Plus/>New custom form</Button></div><div className="av-forms-list">{list.map(f=><button key={f.id} type="button" className={'vault-card av-form-card'+(form===f.id?' selected':'')+(f.custom?' custom':' built-in')} onClick={()=>{if(dirty&&form!==f.id&&!confirm('Switch forms? Unpublished changes stay in place until you publish or reload.'))return;setForm(f.id);setOpen(null);setShowPages(false)}}><span className="av-form-dot"/><strong>{f.title}</strong><small>{f.where}{f.count?` · on ${f.count} page${f.count===1?'':'s'}`:''} · {f.fields}{!f.saved?' · Uses the original site design':''}</small></button>)}</div></section>
  <div className="av-forms-layout">
   <section className="vault-card av-forms-preview">
    <div className="actions"><h2>Live preview</h2><div className="av-seg" role="group" aria-label="Preview size">{([['desktop',Monitor,'Desktop'],['mobile',Smartphone,'Mobile']] as const).map(([k,I,l])=><button key={k} type="button" className={device===k?'selected':''} onClick={()=>setDevice(k)}><I size={16}/>{l}</button>)}</div></div>
    <div className="av-forms-frame"><iframe title="Form preview" srcDoc={preview} onLoad={e=>{const d=e.currentTarget.contentDocument;const fit=()=>setFrameHeight(Math.max(240,d?.documentElement.scrollHeight||0));fit();if(d)new ResizeObserver(fit).observe(d.body)}} style={{width:device==='mobile'?390:'100%',height:frameHeight}}/></div>
    <p className="muted">On {pages.length} page{pages.length===1?'':'s'}. <button type="button" className="av-link" onClick={()=>setShowPages(!showPages)}>{showPages?'Hide':'Show'} pages</button></p>
    {showPages&&<ul className="av-forms-pages">{pages.map(p=><li key={p.route}><a href={p.route} target="_blank" rel="noreferrer">{p.label}</a><small>{p.route}</small></li>)}</ul>}
   </section>
   <section className="vault-card av-forms-fields">
    {form!=='hero'&&active?<>
     {custom&&<div className="av-custom-form-identity"><div><h2>{custom.title}</h2><p>Use this form ID when inserting the form as a page block.</p></div><Button type="button" variant="outline" onClick={()=>{if(confirm(`Remove “${custom.title}”? Existing page blocks using it will no longer render a form.`)){edit(c=>{c.custom.splice(customIndex,1);return c});setForm('contact');setOpen(null)}}}><Trash2/>Remove form</Button><label>Form name<Input value={custom.title} onChange={e=>edit(c=>{c.custom[customIndex].title=e.target.value;return c})}/></label><label>Form ID<Input value={custom.id} pattern="[a-z0-9]+(-[a-z0-9]+)*" onChange={e=>{const next=e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'');edit(c=>{c.custom[customIndex].id=next;return c});setForm('custom:'+next)}}/></label></div>}
     <h2>Fields</h2><p>Reorder with the arrows. Name, phone, business ZIP and service are required for an estimate request, so they can be renamed but not removed.</p>
     <ol className="av-field-list">{active.fields.map((f,i)=>{const core=(CORE as readonly string[]).includes(f.name);return <li key={f.name} className={open===i?'open':''}>
      <div className="av-field-head"><button type="button" className="av-field-title" onClick={()=>setOpen(open===i?null:i)} aria-expanded={open===i}><strong>{f.label||'(no label)'}</strong><small>{TYPE_LABEL[f.type]}{f.required?' · required':''}{f.width==='half'?' · half width':''}{NAME_LABEL[f.name]?'':' · added'}</small></button>{core&&<Lock size={14} aria-label="Needed by the site"/>}<span className="actions"><Button variant="ghost" size="icon" aria-label="Move up" disabled={!i} onClick={()=>move(i,-1)}><ArrowUp/></Button><Button variant="ghost" size="icon" aria-label="Move down" disabled={i===active.fields.length-1} onClick={()=>move(i,1)}><ArrowDown/></Button>{!core&&<Button variant="ghost" size="icon" aria-label={'Remove '+f.label} onClick={()=>{if(confirm(`Remove “${f.label}” from this form?`)){edit(c=>{const target=customId?c.custom.find(x=>x.id===customId):c.contact;if(target)target.fields.splice(i,1);return c});setOpen(null)}}}><Trash2/></Button>}</span></div>
      {open===i&&<div className="av-field-body">
       <label>Label<Input value={f.label} onChange={e=>setField(i,{label:e.target.value})}/></label>
       <label>{f.type==='select'?'Prompt shown before a choice':'Placeholder (example text inside the box)'}<Input value={f.placeholder} onChange={e=>setField(i,{placeholder:e.target.value})}/></label>
       {!core&&<label>Type<select value={f.type} onChange={e=>setField(i,{type:e.target.value as FieldType,options:e.target.value==='select'&&!f.options.length?['Option 1','Option 2']:f.options})}>{FIELD_TYPES.filter(t=>t!=='email'&&t!=='url').map(t=><option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</select></label>}
       {f.type==='select'&&<label>Choices <small>one per line</small><Textarea rows={Math.min(10,f.options.length+1)} value={f.options.join('\n')} onChange={e=>setField(i,{options:e.target.value.split('\n')})}/></label>}
       <div className="av-field-row"><label className="inline"><input type="checkbox" checked={f.required} disabled={core} onChange={e=>setField(i,{required:e.target.checked})}/>Required</label><label className="inline"><input type="checkbox" checked={f.width==='half'} onChange={e=>setField(i,{width:e.target.checked?'half':'full'})}/>Half width (sits beside the next half-width field)</label></div>
      </div>}
     </li>})}</ol>
     <div className="av-add"><span>Add a field</span>{(['text','tel','textarea','select'] as FieldType[]).map(t=><Button key={t} variant="outline" size="sm" onClick={()=>add(t)}><Plus/>{TYPE_LABEL[t]}</Button>)}</div>
     <h2>Button &amp; wording</h2>
     <label>Button text<Input value={active.button} onChange={e=>edit(c=>{const target=customId?c.custom.find(x=>x.id===customId):c.contact;if(target)target.button=e.target.value;return c})}/></label>
     <label>Note under the button<Input value={active.note} onChange={e=>edit(c=>{const target=customId?c.custom.find(x=>x.id===customId):c.contact;if(target)target.note=e.target.value;return c})}/></label>
     <label>Request type <small>shown as “Request” on each lead and email subject</small><Input value={active.request} onChange={e=>edit(c=>{const target=customId?c.custom.find(x=>x.id===customId):c.contact;if(target)target.request=e.target.value;return c})}/></label>
    </>:<>
     <h2>Quick ZIP form</h2><p>Visitors enter their business ZIP code before continuing to the complete estimate form.</p>
     <label>Field label <small>read by screen readers</small><Input value={cfg.hero.label} onChange={e=>edit(c=>{c.hero.label=e.target.value;return c})}/></label>
     <label>Placeholder<Input value={cfg.hero.placeholder} onChange={e=>edit(c=>{c.hero.placeholder=e.target.value;return c})}/></label>
     <label>Button text<Input value={cfg.hero.button} onChange={e=>edit(c=>{c.hero.button=e.target.value;return c})}/></label>
    </>}
    <div className="av-forms-save">{dirty&&<Button variant="outline" disabled={busy} onClick={()=>{if(confirm('Discard unpublished form changes?'))load()}}>Discard</Button>}<Button disabled={busy||!dirty||role!=='owner'} onClick={save}>{dirty?'Publish form changes':'No changes yet'}</Button></div>
    {role!=='owner'&&<p className="muted">Only owners can publish form changes.</p>}
   </section>
  </div>
 </div>;
}
```

### app/avault/health-panel.tsx

<!-- avault-file path="app/avault/health-panel.tsx" mode="owned" sha256="b97f35104b14738d8f5df626df0d958b2091540a85ca24bd6a7aba6dc955f778" eol="1" -->
```tsx
'use client';
import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Database,Mail,CalendarClock,DatabaseBackup,Inbox,RefreshCw,Play,ArrowRight,CircleCheck,TriangleAlert,CircleAlert} from 'lucide-react';
import {request} from './content-tools';

// AVAULT → System health: one card per service, an overall banner, and what the last scheduled run did.
type Check={id:string;title:string;status:'ok'|'warn'|'bad';value:string;detail:string;extra?:string;view?:string};
const ICON:Record<string,typeof Database>={database:Database,email:Mail,scheduler:CalendarClock,backups:DatabaseBackup,leads:Inbox};
const LABEL={ok:'Working',warn:'Needs a look',bad:'Action needed'};
const stamp=(s:string)=>s.replace(/(\d{4}-\d{2}-\d{2}T[\d:.]+Z)/,iso=>{const d=new Date(iso),m=Math.round((Date.now()-d.getTime())/60000);return m<1?'just now':m<60?`${m} min ago`:m<1440?`${Math.round(m/60)} h ago`:d.toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})});
const uptime=(s:number)=>s<3600?`${Math.round(s/60)} min`:s<86400?`${Math.round(s/3600)} h`:`${Math.round(s/86400)} days`;

export function HealthPanel({role,notice,go}:{role:string;notice:(s:string)=>void;go:(view:string)=>void}){
 const [d,setD]=useState<any>(null),[busy,setBusy]=useState(false);
 const load=()=>request('health').then(setD).catch(e=>notice(e.message));
 useEffect(()=>{load()},[]);// eslint-disable-line react-hooks/exhaustive-deps
 async function run(){setBusy(true);try{const r=await request('maintenance',{});notice(`Maintenance finished${r.published?.length?`: ${r.published.length} post(s) published`:''}.`);await load()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 if(!d)return <p role="status" className="vault-card av-empty">Checking every service…</p>;
 const checks:Check[]=d.checks||[],bad=checks.filter(c=>c.status==='bad').length,warn=checks.filter(c=>c.status==='warn').length;
 const overall=bad?'bad':warn?'warn':'ok',r=d.lastResults;
 return <div className="av-health">
  <div className={'vault-card av-health-banner '+overall}>
   {overall==='ok'?<CircleCheck size={28}/>:overall==='warn'?<TriangleAlert size={28}/>:<CircleAlert size={28}/>}
   <div><h2>{overall==='ok'?'Everything is working':`${bad+warn} thing${bad+warn===1?' needs':'s need'} attention`}</h2><p>{d.site.replace(/^https?:\/\//,'')} · server up {uptime(d.uptime)} · Node {d.node}</p></div>
   <div className="av-health-actions"><Button variant="outline" onClick={()=>{setD(null);load()}}><RefreshCw/>Check again</Button>{role==='owner'&&<Button disabled={busy} onClick={run}><Play/>{busy?'Running…':'Run maintenance now'}</Button>}</div>
  </div>
  <div className="av-health-grid">{checks.map(c=>{const I=ICON[c.id]||Database;return <article key={c.id} className={'vault-card av-health-card '+c.status}>
   <div className="av-health-top"><span className="av-health-icon"><I size={20}/></span><span className={'av-health-status '+c.status}>{LABEL[c.status]}</span></div>
   <h3>{c.title}</h3><strong>{c.value}</strong><p>{c.detail}</p>{c.extra&&<small>{stamp(c.extra)}</small>}
   {c.view&&<button type="button" className="av-link" onClick={()=>go(c.view!)}>{c.id==='email'?'Open email settings':c.id==='backups'?'Open backups':'Open leads'}<ArrowRight size={14}/></button>}
  </article>})}</div>
  <section className="vault-card av-health-last"><h2>Last scheduled run</h2>{!d.lastRun?<p className="muted">No run recorded yet.</p>:<><p className="muted">{stamp(d.lastRun)}</p><ul>
   <li><b>{r?.published?.length||0}</b> scheduled post{r?.published?.length===1?'':'s'} published</li>
   <li><b>{r?.failed?.length||0}</b> post{r?.failed?.length===1?'':'s'} that couldn’t publish{r?.failed?.length?': '+r.failed.map((f:any)=>f.route).join(', '):''}</li>
   <li><b>{r?.conflicts?.length||0}</b> skipped because the draft changed after scheduling</li>
   <li><b>{r?.backup?'1':'0'}</b> backup created</li></ul></>}</section>
 </div>;
}
```

### app/avault/leads-inbox.tsx

<!-- avault-file path="app/avault/leads-inbox.tsx" mode="owned" sha256="48fa10273f3faff3de21bba7167527a7fff8bfbfadd85d6f09ef2d8857c83d78" eol="1" -->
```tsx
'use client';
import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Search,Mail,Archive,ShieldAlert,ShieldCheck,Trash2,RotateCcw,Download,X,ExternalLink,MailCheck,MailX,Clock,Inbox} from 'lucide-react';
import {request} from './content-tools';
import {describeAgent} from '@/lib/avault/agent';

// AVAULT → Leads: an inbox list with status tabs, and a detail panel with everything known about a lead.
type Notice=(s:string)=>void;
const parse=(s:string)=>{try{return JSON.parse(s||'{}')}catch{return {}}};
function ago(iso?:string){if(!iso)return '—';const d=new Date(iso),s=(Date.now()-d.getTime())/1000;if(s<60)return 'Just now';if(s<3600)return Math.floor(s/60)+' min ago';if(s<86400)return Math.floor(s/3600)+' h ago';if(s<86400*7)return Math.floor(s/86400)+' d ago';return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:d.getFullYear()===new Date().getFullYear()?undefined:'numeric'})}
const full=(iso?:string)=>iso?new Date(iso).toLocaleString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):'—';
const secs=(n?:number)=>!n?'':n<60?`${n} sec`:n<3600?`${Math.floor(n/60)} min ${n%60} sec`:'Over an hour';
const STATUS:Record<string,[string,string]>={new:['New','av-pill-scheduled'],read:['Read','av-pill-draft'],archived:['Archived','av-pill-draft'],spam:['Spam','av-pill-spam']};
const DELIVERY:Record<string,[string,typeof Mail,string]>={sent:['Emailed',MailCheck,'ok'],failed:['Email failed',MailX,'bad'],pending:['Sending',Clock,''],sending:['Sending',Clock,''],'not-configured':['Saved only',Inbox,''],blocked:['Not emailed',ShieldAlert,'']};

export function LeadsInbox({role,notice}:{role:string;notice:Notice}){
 const [q,setQ]=useState(''),[tab,setTab]=useState(''),[delivery,setDelivery]=useState(''),[page,setPage]=useState(0),[data,setData]=useState<any>(null),[openId,setOpenId]=useState<string|null>(null),[selected,setSelected]=useState<string[]>([]),[busy,setBusy]=useState(false);
 async function load(){const p=new URLSearchParams({q,status:tab,delivery,page:String(page)});setData(await request('forms?'+p));setSelected([])}
 useEffect(()=>{const t=setTimeout(()=>{load().catch(e=>notice(e.message))},q?300:0);return()=>clearTimeout(t)},[q,tab,delivery,page]);// eslint-disable-line react-hooks/exhaustive-deps
 async function act(fn:()=>Promise<unknown>){setBusy(true);try{await fn()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 const setStatus=(ids:string[],s:string,msg?:string)=>act(async()=>{if(ids.length===1)await request('form-status',{id:ids[0],status:s});else await request('form-bulk',{ids,status:s});if(msg)notice(msg);await load()});
 const rows:any[]=data?.rows||[],c=data?.counts||{};
 const lead=rows.find(r=>r.id===openId);
 // Opening a new lead marks it read, like an email inbox.
 function openLead(r:any){setOpenId(r.id);if(r.status==='new')request('form-status',{id:r.id,status:'read'}).then(()=>setData((d:any)=>d&&{...d,rows:d.rows.map((x:any)=>x.id===r.id?{...x,status:'read'}:x),counts:{...d.counts,new:Math.max(0,(d.counts?.new||1)-1),read:(d.counts?.read||0)+1}})).catch(()=>{})}
 const tabs:[string,string,number][]=[['','Inbox',(c.new||0)+(c.read||0)],['new','New',c.new||0],['spam','Spam',c.spam||0],['archived','Archived',c.archived||0],['all','All',Object.values(c).reduce((a:number,b:any)=>a+Number(b),0)]];
 return <div className={'av-leads'+(lead?' has-detail':'')}>
  <div className="vault-card av-table-card">
   <div className="av-table-tools">
    <div className="av-seg av-seg-wrap" role="tablist" aria-label="Lead folders">{tabs.map(([k,l,n])=><button key={k||'inbox'} type="button" role="tab" aria-selected={tab===k} className={tab===k?'selected':''} onClick={()=>{setTab(k);setPage(0);setOpenId(null)}}>{l}<span className={'av-count'+(k==='new'&&n?' hot':'')}>{n}</span></button>)}</div>
    <label className="av-find"><Search size={16} aria-hidden="true"/><Input aria-label="Search leads" placeholder="Search name, phone, email, ZIP or IP…" value={q} onChange={e=>{setQ(e.target.value);setPage(0)}}/></label>
    <label className="av-sort">Email<select value={delivery} onChange={e=>{setDelivery(e.target.value);setPage(0)}}><option value="">Any</option><option value="sent">Emailed</option><option value="failed">Failed</option><option value="pending">Sending</option><option value="not-configured">Saved only</option><option value="blocked">Not emailed (spam)</option></select></label>
    <a className="av-export" href="/api/admin/forms-export" download><Download size={15}/>Export CSV</a>
   </div>
   {selected.length>0&&<div className="av-bulk"><span>{selected.length} selected</span><Button variant="outline" size="sm" disabled={busy} onClick={()=>setStatus(selected,'read')}>Mark read</Button><Button variant="outline" size="sm" disabled={busy} onClick={()=>setStatus(selected,'archived','Archived.')}><Archive/>Archive</Button>{tab==='spam'?<Button variant="outline" size="sm" disabled={busy} onClick={()=>setStatus(selected,'new','Moved to the inbox.')}><ShieldCheck/>Not spam</Button>:<Button variant="outline" size="sm" disabled={busy} onClick={()=>setStatus(selected,'spam','Moved to spam.')}><ShieldAlert/>Mark spam</Button>}<button type="button" className="av-link" onClick={()=>setSelected([])}>Clear</button></div>}
   <div className="av-table av-leads-table" role="table" aria-label="Leads">
    <div className="av-tr av-th" role="row"><span role="columnheader"><input type="checkbox" aria-label="Select all on this page" checked={!!rows.length&&selected.length===rows.length} onChange={e=>setSelected(e.target.checked?rows.map(r=>r.id):[])}/></span><span role="columnheader">Contact</span><span role="columnheader">ZIP</span><span role="columnheader">Service</span><span role="columnheader">Delivery</span><span role="columnheader">Received</span></div>
    {rows.map(r=>{const f=parse(r.value),[dl,DI,dc]=DELIVERY[r.delivery]||[r.delivery||'—',Mail,''];return <div key={r.id} role="row" className={'av-tr av-row-link'+(r.id===openId?' active':'')+(r.status==='new'?' unread':'')} onClick={()=>openLead(r)}>
     <span role="cell" onClick={e=>e.stopPropagation()}><input type="checkbox" aria-label={'Select '+f.name} checked={selected.includes(r.id)} onChange={e=>setSelected(e.target.checked?[...selected,r.id]:selected.filter(x=>x!==r.id))}/></span>
     <span role="cell" className="av-cell-title"><button type="button">{r.status==='new'&&<i className="av-unread-dot" aria-label="New"/>}{f.name||'(no name)'}</button><small>{f.phone||f.email}</small></span>
     <span role="cell" className="av-muted-cell av-ellipsis">{f.zip||'—'}</span>
     <span role="cell" className="av-muted-cell"><span className="av-ellipsis">{f.service||f.request||'—'}</span>{f.details&&<small className="av-ellipsis">{f.details}</small>}</span>
     <span role="cell"><span className={'av-delivery '+dc} title={r.delivery_message||''}><DI size={15} aria-hidden="true"/>{dl}</span>{r.status==='spam'&&<span className="av-pill av-pill-spam">Spam</span>}</span>
     <span role="cell" className="av-muted-cell" title={full(r.created_at)}>{ago(r.created_at)}</span>
    </div>})}
    {data&&!rows.length&&<p className="av-empty">{tab==='spam'?'No spam. Caught submissions land here without emailing you.':q?'No leads match your search.':'No leads here yet.'}</p>}
    {!data&&<p className="av-empty" role="status">Loading leads…</p>}
   </div>
   {data&&<div className="av-table-foot av-pager"><span>{data.total} lead{data.total===1?'':'s'}{data.total>50?` · page ${page+1}`:''}</span>{data.total>50&&<span className="actions"><Button variant="outline" size="sm" disabled={!page} onClick={()=>setPage(page-1)}>Previous</Button><Button variant="outline" size="sm" disabled={(page+1)*50>=data.total} onClick={()=>setPage(page+1)}>Next</Button></span>}</div>}
  </div>
  {lead&&<LeadDetail r={lead} role={role} busy={busy} close={()=>setOpenId(null)} setStatus={setStatus} act={act} reload={load} notice={notice}/>}
 </div>;
}

// One titled group of details; empty rows are left out.
function Section({title,rows}:{title:string;rows:[string,React.ReactNode][]}){const shown=rows.filter(([,v])=>v!==''&&v!==undefined&&v!==null);return shown.length?<section><h3>{title}</h3><dl>{shown.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></section>:null}

function LeadDetail({r,role,busy,close,setStatus,act,reload,notice}:{r:any;role:string;busy:boolean;close:()=>void;setStatus:(ids:string[],s:string,msg?:string)=>void;act:(fn:()=>Promise<unknown>)=>void;reload:()=>Promise<void>;notice:Notice}){
 const f=parse(r.value),[sl,sc]=STATUS[r.status]||[r.status,'av-pill-draft'],[dl,DI,dc]=DELIVERY[r.delivery]||[r.delivery||'—',Mail,''];
 const utm=[f.utm_source,f.utm_medium,f.utm_campaign,f.utm_term,f.utm_content].filter(Boolean).join(' / ');
 const spam=String(r.spam||''),flagged=spam.startsWith('flagged');
 const link=(u:string)=>u?<a href={u} target="_blank" rel="noreferrer">{u}<ExternalLink size={12}/></a>:'';
 return <aside className="vault-card av-lead-detail" aria-label={'Lead from '+f.name}>
  <div className="av-lead-head"><div><span className={'av-pill '+sc}>{sl}</span><h2>{f.name||'(no name)'}</h2>{f.phone&&<p><a href={'tel:'+String(f.phone).replace(/[^+\d]/g,'')}>{f.phone}</a></p>}{f.email&&<p><a href={'mailto:'+f.email}>{f.email}</a></p>}<small title={full(r.created_at)}>Received {full(r.created_at)}</small></div><button type="button" className="av-nav-close" aria-label="Close" onClick={close}><X size={18}/></button></div>
  <div className="av-lead-actions">
   {f.email&&<a className="av-btn-primary" href={`mailto:${f.email}?subject=${encodeURIComponent('Your '+(f.request||'door repair')+' request — DMV Commercial Door Repair')}`}><Mail size={15}/>Reply</a>}
   {r.status==='spam'?<Button variant="outline" size="sm" disabled={busy} onClick={()=>setStatus([r.id],'new','Moved to the inbox.')}><ShieldCheck/>Not spam</Button>:<Button variant="outline" size="sm" disabled={busy} onClick={()=>setStatus([r.id],'spam','Moved to spam.')}><ShieldAlert/>Spam</Button>}
   {r.status==='archived'?<Button variant="outline" size="sm" disabled={busy} onClick={()=>setStatus([r.id],'read','Restored to the inbox.')}><RotateCcw/>Restore</Button>:<Button variant="outline" size="sm" disabled={busy} onClick={()=>setStatus([r.id],'archived','Archived.')}><Archive/>Archive</Button>}
   {r.status!=='new'&&r.status!=='spam'&&<Button variant="ghost" size="sm" disabled={busy} onClick={()=>setStatus([r.id],'new')}>Mark unread</Button>}
  </div>
  <div className="av-lead-body">
   <Section title="Request" rows={[['Phone',f.phone],['Email',f.email],['Business ZIP',f.zip],['Service',f.service],['Details',f.details],['Request',f.request],...Object.entries(f.extra||{}).map(([k,v])=>[k,String(v)] as [string,string])]}/>
   <Section title="Visit" rows={[['Sent from',f.page?link(f.page):''],['Came from',f.referrer?link(f.referrer):'Direct / none'],['Campaign (UTM)',utm],['Time on page',secs(r.fill_seconds)]]}/>
   <Section title="Sender" rows={[['IP address',r.ip],['Country',r.country],['Device',r.user_agent?describeAgent(r.user_agent):''],['Language',String(r.language||'').split(',')[0]],['Browser details',r.user_agent?<span className="av-small">{r.user_agent}</span>:'']]}/>
   <section><h3>Spam protection</h3><p className={'av-spam-check '+(flagged?'bad':'ok')}>{flagged?<ShieldAlert size={16}/>:<ShieldCheck size={16}/>}<span>{flagged?'Flagged: '+spam.replace(/^flagged:\s*/,''):spam?'Passed every check':'Not checked (sent before protection was added)'}</span></p></section>
   <section><h3>Email notification</h3><p className={'av-delivery '+dc}><DI size={15}/>{dl}{r.attempts?` · ${r.attempts} attempt${r.attempts===1?'':'s'}`:''}{r.delivered_at?` · ${full(r.delivered_at)}`:''}</p>{r.delivery_message&&<p className="av-small">{r.delivery_message}</p>}{r.delivery!=='sent'&&<Button variant="outline" size="sm" disabled={busy} onClick={()=>act(async()=>{await request('email-retry',{id:r.id});notice('Retried. The result is shown here.');await reload()})}>{r.delivery==='blocked'?'Send the email anyway':'Retry email'}</Button>}</section>
  </div>
  {role==='owner'&&<div className="av-lead-danger"><Button variant="ghost" size="sm" disabled={busy} onClick={()=>act(async()=>{if(!confirm('Permanently delete this lead? This cannot be undone.'))return;await request('form-delete',{id:r.id});notice('Lead deleted.');close();await reload()})}><Trash2/>Delete permanently</Button></div>}
 </aside>;
}
```

### app/avault/list-views.tsx

<!-- avault-file path="app/avault/list-views.tsx" mode="owned" sha256="55de98589d073a3ffafeda789556b91616ad473949efd69aad58d5c22794bd70" eol="1" -->
```tsx
'use client';
import {useEffect,useMemo,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {ArrowUpRight,ChevronRight,Search,ArrowRight,Pencil,Trash2,Plus,ShieldCheck,FileCode2,Stethoscope,CircleAlert,TriangleAlert,CircleCheck,Home} from 'lucide-react';
import {request} from './content-tools';
import {OperationsPanel} from './operations-panel';

// Table-style lists for AVAULT: pages and blogs, the SEO health check, and redirects.
type Notice=(s:string)=>void;
const KIND:Record<string,string>={page:'Page',service:'Service',post:'Blog post','case-study':'Case study'};
function ago(iso?:string){if(!iso)return '—';const d=new Date(iso),s=(Date.now()-d.getTime())/1000;if(isNaN(s))return '—';if(s<60)return 'Just now';if(s<3600)return Math.floor(s/60)+' min ago';if(s<86400)return Math.floor(s/3600)+' h ago';if(s<86400*7)return Math.floor(s/86400)+' d ago';return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:d.getFullYear()===new Date().getFullYear()?undefined:'numeric'})}
const Seg=({value,set,items}:{value:string;set:(v:string)=>void;items:[string,string,number?][]})=><div className="av-seg av-seg-wrap" role="tablist">{items.map(([k,l,n])=><button key={k} type="button" role="tab" aria-selected={value===k} className={value===k?'selected':''} onClick={()=>set(k)}>{l}{n!==undefined&&<span className="av-count">{n}</span>}</button>)}</div>;
const Find=({value,set,placeholder}:{value:string;set:(v:string)=>void;placeholder:string})=><label className="av-find"><Search size={16} aria-hidden="true"/><Input aria-label={placeholder} placeholder={placeholder} value={value} onChange={e=>set(e.target.value)}/></label>;

// ── Pages & blogs ───────────────────────────────────────────────────────────
export function DocTable({docs,posts,open,loading}:{docs:any[];posts:boolean;open:(route:string)=>void;loading?:boolean}){
 const [filter,setFilter]=useState('all'),[q,setQ]=useState(''),[sort,setSort]=useState('updated');
 const all=docs.filter(d=>posts?d.kind==='post':d.kind!=='post');
 const match=(d:any,f:string)=>f==='all'||(f==='live'?d.status==='published':f==='draft'?d.status==='draft':f==='scheduled'?d.status==='scheduled':d.unpublishedChanges);
 const rows=all.filter(d=>match(d,filter)&&(d.label+' '+d.route+' '+(d.author||'')).toLowerCase().includes(q.toLowerCase()))
  .sort((a,b)=>sort==='title'?a.label.localeCompare(b.label):sort==='url'?a.route.localeCompare(b.route):String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
 const count=(f:string)=>all.filter(d=>match(d,f)).length;
 const filters:[string,string,number][]=[['all','All',all.length],['live','Live',count('live')],['draft','Drafts',count('draft')],...(count('scheduled')?[['scheduled','Scheduled',count('scheduled')] as [string,string,number]]:[]),['edits','Edits not live',count('edits')]];
 return <div className="vault-card av-table-card">
  <div className="av-table-tools"><Seg value={filter} set={setFilter} items={filters}/><Find value={q} set={setQ} placeholder={posts?'Search posts…':'Search pages…'}/><label className="av-sort">Sort<select value={sort} onChange={e=>setSort(e.target.value)}><option value="updated">Recently updated</option><option value="title">Title A–Z</option><option value="url">URL</option></select></label></div>
  <div className={'av-table '+(posts?'av-docs-posts':'av-docs')} role="table" aria-label={posts?'Blog posts':'Pages'}>
   <div className="av-tr av-th" role="row"><span role="columnheader">{posts?'Post':'Page'}</span><span role="columnheader">{posts?'Author':'Type'}</span><span role="columnheader">Status</span><span role="columnheader">Search</span><span role="columnheader">Updated</span><span role="columnheader"><span className="sr-only">Actions</span></span></div>
   {rows.map(d=><div className={'av-tr av-row-link'+(d.route==='/'?' av-home-row':'')} role="row" key={d.route} onClick={()=>open(d.route)}>
    <span role="cell" className="av-cell-title"><button type="button" onClick={e=>{e.stopPropagation();open(d.route)}}>{d.label}</button><small>{d.route}{d.route==='/'&&<span className="av-home-label"><Home size={11}/>Homepage</span>}</small></span>
    <span role="cell" className="av-muted-cell">{posts?d.author||'—':KIND[d.kind]||d.kind}</span>
    <span role="cell" className="av-status-cell"><span className={'av-pill av-pill-'+(d.status==='published'?'live':d.status)}>{d.status==='published'?'Live':d.status==='scheduled'?'Scheduled':'Draft'}</span>{d.status==='scheduled'&&d.scheduledFor&&<small>{new Date(d.scheduledFor).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</small>}{d.unpublishedChanges&&<small className="av-edits">Edits not live</small>}</span>
    <span role="cell"><span className={'av-dot-label '+(d.noindex?'off':'on')}>{d.noindex?'Hidden':'Indexed'}</span></span>
    <span role="cell" className="av-muted-cell" title={d.updatedAt?new Date(d.updatedAt).toLocaleString():''}>{ago(d.updatedAt)}</span>
    <span role="cell" className="av-actions-cell">{d.status==='published'&&<a href={d.route} target="_blank" rel="noreferrer" aria-label={'View '+d.label+' on the website'} title="View on the website" onClick={e=>e.stopPropagation()}><ArrowUpRight size={17}/></a>}<ChevronRight size={18} aria-hidden="true"/></span>
   </div>)}
   {!rows.length&&<p className="av-empty" role="status">{loading&&!all.length?'Loading…':all.length?'Nothing matches this filter.':posts?'No blog posts yet.':'No pages yet.'}</p>}
  </div>
  <p className="av-table-foot">Showing {rows.length} of {all.length}</p>
 </div>;
}

// ── SEO & discovery ─────────────────────────────────────────────────────────
export function SeoPanel({role,notice,docs,open}:{role:string;notice:Notice;docs:any[];open:(route:string)=>void}){
 const [tab,setTab]=useState('health'),[rows,setRows]=useState<any[]|null>(null),[filter,setFilter]=useState('errors'),[q,setQ]=useState('');
 useEffect(()=>{request('audit').then(r=>{setRows(r);if(!r.some((x:any)=>x.errors.length))setFilter(r.some((x:any)=>x.warnings.length)?'warnings':'all')}).catch(e=>notice(e.message))},[]);// eslint-disable-line react-hooks/exhaustive-deps
 const stats=useMemo(()=>{const r=rows||[];return {total:r.length,errors:r.filter(x=>x.errors.length).length,warnings:r.filter(x=>!x.errors.length&&x.warnings.length).length,passed:r.filter(x=>!x.errors.length&&!x.warnings.length).length}},[rows]);
 const match=(x:any)=>filter==='all'||(filter==='errors'?x.errors.length:filter==='warnings'?!x.errors.length&&x.warnings.length:!x.errors.length&&!x.warnings.length);
 const shown=(rows||[]).filter(x=>match(x)&&((x.label||'')+' '+x.route).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>b.errors.length-a.errors.length||b.warnings.length-a.warnings.length||a.route.localeCompare(b.route));
 const steps:[string,string,string,typeof Stethoscope][]=[['health','Fix page issues','Each page is checked for titles, descriptions, headings, images and links.',Stethoscope],['verification','Connect search engines','Prove you own the site to Google Search Console and Bing.',ShieldCheck],['files','Check discovery files','Sitemaps, robots.txt and llms.txt tell crawlers what to read.',FileCode2]];
 return <div className="av-seo">
  <div className="av-steps" role="tablist" aria-label="SEO tasks">{steps.map(([k,t,d,I],i)=><button key={k} type="button" role="tab" aria-selected={tab===k} className={'vault-card av-step'+(tab===k?' selected':'')} onClick={()=>setTab(k)}><span className="av-step-num">{i+1}</span><I size={20} aria-hidden="true"/><strong>{t}</strong><small>{d}</small></button>)}</div>
  {tab==='health'&&<>
   <div className="av-stats">{([['errors','Need attention',stats.errors,CircleAlert],['warnings','Suggestions',stats.warnings,TriangleAlert],['passed','Passed',stats.passed,CircleCheck]] as const).map(([k,l,n,I])=><button key={k} type="button" className={'vault-card av-stat av-stat-'+k+(filter===k?' selected':'')} onClick={()=>setFilter(k)}><I size={20} aria-hidden="true"/><strong>{rows?n:'–'}</strong><span>{l}</span></button>)}<button type="button" className={'vault-card av-stat'+(filter==='all'?' selected':'')} onClick={()=>setFilter('all')}><Stethoscope size={20} aria-hidden="true"/><strong>{rows?stats.total:'–'}</strong><span>Pages checked</span></button></div>
   <div className="vault-card av-table-card">
    <div className="av-table-tools"><p className="av-legend"><span className="av-legend-err">Needs attention</span> blocks a page from being found or shared well. <span className="av-legend-warn">Suggestion</span> is worth improving.</p><Find value={q} set={setQ} placeholder="Search pages…"/></div>
    {!rows&&<p className="av-empty" role="status">Checking every page…</p>}
    {rows&&<div className="av-table av-seo-table" role="table" aria-label="Page health">
     <div className="av-tr av-th" role="row"><span role="columnheader">Page</span><span role="columnheader">What to fix</span><span role="columnheader">Links in</span><span role="columnheader"><span className="sr-only">Actions</span></span></div>
     {shown.map(x=><div className="av-tr" role="row" key={x.route}>
      <span role="cell" className="av-cell-title"><button type="button" onClick={()=>open(x.route)}>{x.label||x.route}</button><small>{x.route}{x.kind?' · '+(KIND[x.kind]||x.kind):''}</small></span>
      <span role="cell">{!x.errors.length&&!x.warnings.length?<span className="av-pill av-pill-live">All checks passed</span>:<ul className="av-issues">{x.errors.map((e:string)=><li key={e} className="err">{e}</li>)}{x.warnings.map((e:string)=><li key={e} className="warn">{e}</li>)}</ul>}</span>
      <span role="cell" className="av-muted-cell" title="Other pages on the site that link here">{x.incoming}</span>
      <span role="cell" className="av-actions-cell"><Button asChild variant="ghost" size="icon-sm"><a href={x.route} target="_blank" rel="noreferrer" aria-label={'View '+(x.label||x.route)+' on the live website'} title="View live page"><ArrowUpRight/></a></Button><Button variant="outline" size="sm" onClick={()=>open(x.route)}>{x.errors.length||x.warnings.length?'Fix':'Open'}</Button></span>
     </div>)}
     {!shown.length&&<p className="av-empty">{filter==='errors'?'No page needs attention. Nice work.':'Nothing matches.'}</p>}
    </div>}
   </div>
  </>}
  {tab==='verification'&&<OperationsPanel only="verification" role={role} notice={notice} docs={docs}/>}
  {tab==='files'&&<><div className="vault-card"><h2>Your discovery files</h2><p className="muted">Generated automatically from your published pages. Open one to see exactly what search engines and AI crawlers read.</p><div className="av-filelinks">{([['sitemap.xml','Sitemap index'],['sm-pages.xml','Pages sitemap'],['sm-posts.xml','Blog sitemap'],['sm-images.xml','Image sitemap'],['robots.txt','Crawler rules'],['llms.txt','AI summary']] as const).map(([f,l])=><a key={f} href={'/'+f} target="_blank" rel="noreferrer"><strong>{l}</strong><small>/{f}</small><ArrowUpRight size={15}/></a>)}</div></div><OperationsPanel only="files" role={role} notice={notice} docs={docs}/></>}
 </div>;
}

// ── Redirects ───────────────────────────────────────────────────────────────
const blank={source:'',destination:'',status:308,enabled:true,note:'',originalSource:''};
export function RedirectsPanel({docs,notice}:{docs:any[];notice:Notice}){
 const [rows,setRows]=useState<any[]|null>(null),[form,setForm]=useState<any>(null),[q,setQ]=useState(''),[filter,setFilter]=useState('all'),[busy,setBusy]=useState(false);
 const load=()=>request('redirects').then(setRows);useEffect(()=>{load().catch(e=>notice(e.message))},[]);// eslint-disable-line react-hooks/exhaustive-deps
 async function act(fn:()=>Promise<unknown>){setBusy(true);try{await fn()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 const list=rows||[];const match=(r:any)=>filter==='all'||(filter==='off'?r.enabled===false:filter==='unused'?!r.hits:r.enabled!==false);
 const shown=list.filter(r=>match(r)&&(r.source+' '+r.destination+' '+(r.note||'')).toLowerCase().includes(q.toLowerCase()));
 const hits=list.reduce((n,r)=>n+(r.hits||0),0);
 const save=()=>act(async()=>{const r=await request('redirect-save',form);notice(form.originalSource?'Redirect updated.':'Redirect added.'+(r.flattened?` ${r.flattened} older redirect(s) now point straight to the new destination.`:''));setForm(null);await load()});
 const toggle=(r:any)=>act(async()=>{await request('redirect-save',{source:r.source,destination:r.destination,status:r.status===307?307:308,enabled:r.enabled===false,note:r.note||'',originalSource:r.source});notice(r.enabled===false?'Redirect turned on.':'Redirect turned off.');await load()});
 return <div className="av-redirects">
  <div className="vault-card av-intro"><div><h2>Send an old link to a new page</h2><p>When a page moves or is removed, a redirect sends visitors and search engines from the old URL to the right place, so links and rankings aren’t lost. Renaming a page in AVAULT adds one for you.</p></div>{!form&&<Button onClick={()=>setForm({...blank})}><Plus/>Add a redirect</Button>}</div>
  {form&&<form className="vault-card av-redirect-form" onSubmit={e=>{e.preventDefault();save()}}>
   <h2>{form.originalSource?'Edit redirect':'New redirect'}</h2>
   <div className="av-route-pair"><label>Old URL <small>the path people or search engines still visit</small><Input value={form.source} onChange={e=>setForm({...form,source:e.target.value})} placeholder="/previous-page/" required autoFocus/></label><ArrowRight className="av-route-arrow" aria-hidden="true"/><label>Send them to <small>a published page, or a full https:// address</small><Input list="redirect-destinations" value={form.destination} onChange={e=>setForm({...form,destination:e.target.value})} placeholder="/local-seo/" required/></label></div>
   <datalist id="redirect-destinations">{docs.filter(d=>d.status==='published').map(d=><option key={d.route} value={d.route}>{d.label}</option>)}</datalist>
   <fieldset className="av-choice"><legend>Is this move permanent?</legend>{([[308,'Yes, permanent','The page has moved for good. Search engines move its ranking to the new page. Use this in almost every case.'],[307,'No, temporary','The old page is coming back soon, for example during a short promotion.']] as const).map(([v,t,d])=><label key={v} className={form.status===v?'selected':''}><input type="radio" name="status" checked={form.status===v} onChange={()=>setForm({...form,status:v})}/><strong>{t}</strong><small>{d}</small></label>)}</fieldset>
   <div className="av-redirect-extra"><label>Note <small>optional, only you see it</small><Input value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Why this redirect exists"/></label><label className="inline"><input type="checkbox" checked={form.enabled} onChange={e=>setForm({...form,enabled:e.target.checked})}/>Turned on</label></div>
   {form.source&&form.destination&&<p className="av-sentence">Anyone who opens <code>{form.source}</code> will land on <code>{form.destination}</code>{form.enabled?'':' (once you turn it on)'}.</p>}
   <div className="av-form-actions"><Button type="button" variant="outline" onClick={()=>setForm(null)}>Cancel</Button><Button disabled={busy}>{form.originalSource?'Save changes':'Add redirect'}</Button></div>
  </form>}
  <div className="vault-card av-table-card">
   <div className="av-table-tools"><Seg value={filter} set={setFilter} items={[['all','All',list.length],['on','On',list.filter(r=>r.enabled!==false).length],['off','Off',list.filter(r=>r.enabled===false).length],['unused','Never used',list.filter(r=>!r.hits).length]]}/><Find value={q} set={setQ} placeholder="Search redirects…"/><span className="av-table-meta">{hits.toLocaleString()} visit{hits===1?'':'s'} redirected in total</span></div>
   {!rows&&<p className="av-empty" role="status">Loading redirects…</p>}
   {rows&&<div className="av-table av-redirect-table" role="table" aria-label="Redirects">
    <div className="av-tr av-th" role="row"><span role="columnheader">From</span><span role="columnheader"><span className="sr-only">to</span></span><span role="columnheader">To</span><span role="columnheader">Type</span><span role="columnheader">Used</span><span role="columnheader">Status</span><span role="columnheader"><span className="sr-only">Actions</span></span></div>
    {shown.map(r=><div className={'av-tr'+(r.enabled===false?' av-row-off':'')} role="row" key={r.source}>
     <span role="cell" className="av-cell-title"><code>{r.source}</code>{r.note&&<small>{r.note}</small>}</span>
     <span role="cell" className="av-arrow-cell" aria-hidden="true"><ArrowRight size={16}/></span>
     <span role="cell" className="av-cell-title"><code>{r.destination}</code>{docs.find(d=>d.route===r.destination)&&<small>{docs.find(d=>d.route===r.destination).label}</small>}</span>
     <span role="cell" className="av-muted-cell">{r.status===307?'Temporary':'Permanent'}</span>
     <span role="cell" className="av-muted-cell" title={r.last_hit_at?'Last used '+new Date(r.last_hit_at).toLocaleString():'Not used yet'}>{(r.hits||0).toLocaleString()}<small>{r.last_hit_at?ago(r.last_hit_at):'never'}</small></span>
     <span role="cell"><button type="button" role="switch" aria-checked={r.enabled!==false} className={'av-switch'+(r.enabled!==false?' on':'')} disabled={busy} onClick={()=>toggle(r)}><span/>{r.enabled!==false?'On':'Off'}</button></span>
     <span role="cell" className="av-actions-cell"><Button variant="ghost" size="icon" aria-label={'Edit redirect from '+r.source} onClick={()=>{setForm({source:r.source,destination:r.destination,status:r.status===307?307:308,enabled:r.enabled!==false,note:r.note||'',originalSource:r.source});scrollTo({top:0,behavior:'smooth'})}}><Pencil/></Button><Button variant="ghost" size="icon" aria-label={'Delete redirect from '+r.source} disabled={busy} onClick={()=>act(async()=>{if(!confirm('Delete the redirect from '+r.source+'? Visitors to that old URL will see "page not found".'))return;await request('redirect-delete',{source:r.source});notice('Redirect deleted.');await load()})}><Trash2/></Button></span>
    </div>)}
    {!shown.length&&<p className="av-empty">{list.length?'Nothing matches.':'No redirects yet.'}</p>}
   </div>}
  </div>
 </div>;
}
```

### app/avault/login/login-form.tsx

<!-- avault-file path="app/avault/login/login-form.tsx" mode="owned" sha256="5bdf68a29bc06c19fbbcec285c5f8fb4ac498fe11b8f548e75bc850874ff7871" eol="1" -->
```tsx
'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Eye,EyeOff} from 'lucide-react';
import {safeNext} from '../session';
export default function LoginForm(){
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[show,setShow]=useState(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');const f=new FormData(e.currentTarget);try{const r=await fetch('/api/admin/login/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:f.get('email'),password:f.get('password')})});const v=await r.json();if(!r.ok)throw new Error(v.error||'Sign-in failed.');location.href=safeNext(new URLSearchParams(location.search).get('next'))}catch(err){setError((err as Error).message);setBusy(false)}}
 return <form onSubmit={submit} style={{display:'grid',gap:18}}><label style={{display:'grid',gap:6,fontSize:14}}>Email<Input type="email" name="email" autoComplete="username" required autoFocus/></label><div style={{display:'grid',gap:6,fontSize:14}}><label htmlFor="av-password">Password</label><div className="av-password"><Input id="av-password" type={show?'text':'password'} name="password" autoComplete="current-password" autoCapitalize="none" spellCheck={false} required/><button type="button" className="av-password-toggle" onClick={()=>setShow(!show)} aria-label={show?'Hide password':'Show password'} aria-pressed={show} aria-controls="av-password" title={show?'Hide password':'Show password'}>{show?<EyeOff size={18} aria-hidden="true"/>:<Eye size={18} aria-hidden="true"/>}</button></div></div>{error&&<p role="alert" style={{color:'#d93025',fontSize:14,margin:0}}>{error}</p>}<Button disabled={busy}>{busy?'Signing in…':'Sign in'}</Button></form>;
}
```

### app/avault/login/page.tsx

<!-- avault-file path="app/avault/login/page.tsx" mode="owned" sha256="3585cd8e5615e95f03bdb0a502fcfa170f1887b59576a5efabe9d1961f5f17fd" eol="1" -->
```tsx
import LoginForm from './login-form';
export const dynamic='force-dynamic';
export const metadata={title:'Sign in | AVAULT',robots:{index:false,follow:false}};
export default function Page(){return <main className="av-login"><div className="av-login-card"><img src="/assets/logo.png" alt="DMV Commercial Door Repair" width="180"/><p className="eyebrow" style={{marginTop:28}}>DMV COMMERCIAL DOOR REPAIR · WEBSITE CONTROL</p><h1 style={{marginTop:14}}>Sign in to AVAULT</h1><p style={{margin:'14px 0 26px'}}>Use your DMV Commercial Door Repair administrator account.</p><LoginForm/><p style={{marginTop:24,fontSize:14}}><a href="/">← Return to the website</a></p></div></main>}
```

### app/avault/media-tools.tsx

<!-- avault-file path="app/avault/media-tools.tsx" mode="owned" sha256="6c0f52af87d0f6f3f89c170d182058c3ac35bdec4284e8ded04ca84054862fd3" eol="1" -->
```tsx
'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Copy,MapPin,Pencil,ChevronDown,PanelsTopLeft,ArrowUpRight,FileText} from 'lucide-react';
import {request} from './content-tools';

// One image in AVAULT → Media: preview, where it's used (one line per page), and its maintenance tools.
type Use={route:string;label?:string;state:'published'|'draft';section:string;group?:string};
function summarize(list:Use[]){
 // A shared header/footer image appears on every page; that's one fact, not a page list.
 const shared=list.filter(u=>u.group==='navigation'||u.group==='footer'||u.route==='@global');
 const sharedPages=new Set(shared.filter(u=>u.route!=='@global').map(u=>u.route));
 const pages=new Map<string,{route:string;label:string;live:boolean;draft:boolean;places:Set<string>}>();
 for(const u of list){if(u.route==='@global'||u.group==='navigation'||u.group==='footer')continue;
  const p=pages.get(u.route)||{route:u.route,label:u.label||u.route,live:false,draft:false,places:new Set<string>()};
  if(u.state==='published')p.live=true;else p.draft=true;
  if(['Social image','Content block','Article body'].includes(u.section))p.places.add(u.section);
  pages.set(u.route,p)}
 return {shared:shared.length>0,sharedCount:sharedPages.size,pages:[...pages.values()].sort((a,b)=>a.label.localeCompare(b.label))};
}

export function MediaCard({media,uploads,role,notice,reload}:{media:any;uploads:any[];role:string;notice:(s:string)=>void;reload:()=>void}){
 const [usage,setUsage]=useState<ReturnType<typeof summarize>|null>(null),[showUsage,setShowUsage]=useState(false),[all,setAll]=useState(false),[alt,setAlt]=useState(media.alt||''),[altImpact,setAltImpact]=useState<any>(null),[editing,setEditing]=useState(false),[value,setValue]=useState({...media,...JSON.parse(media.metadata||'{}')}),[to,setTo]=useState(''),[impact,setImpact]=useState<any>(null),[busy,setBusy]=useState(false);
 const url=media.src||'/media/'+media.key,name=url.split('/').pop(),isImage=!media.mime||String(media.mime).startsWith('image/');
 async function act(fn:()=>Promise<any>){setBusy(true);try{await fn()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 const toggleUsage=()=>{if(showUsage)return setShowUsage(false);act(async()=>{setUsage(summarize(await request('media-usage?url='+encodeURIComponent(url))));setShowUsage(true)})};
 const copy=()=>navigator.clipboard?.writeText(url).then(()=>notice('File address copied.'),()=>notice('Copy failed. Select the address and copy it instead.'));
 const visible=usage?(all?usage.pages:usage.pages.slice(0,6)):[];
 return <article className="vault-card av-media-card">
  <div className={'av-media-thumb'+(isImage?'':' av-file-thumb')}>{isImage?<img src={url} alt={media.alt||''} loading="lazy" decoding="async"/>:<><FileText size={46}/><span>{String(media.mime||'file').split('/').pop()}</span></>}</div>
  <div className="av-media-body">
   <strong className="av-media-name" title={name}>{media.name||name}</strong>
   <p className={media.alt?'av-media-alt':'av-media-alt none'}>{media.alt||(isImage?'No description (fine only for decorative images)':'No accessible file description')}</p>
   <div className="av-chips"><span className={'av-pill '+(media.uses?'av-pill-live':'av-pill-draft')}>{media.uses?`On ${media.uses} page${media.uses===1?'':'s'}`:'Not used'}</span>{media.missingAlt&&<span className="av-pill av-pill-warn">Missing a description somewhere</span>}</div>
   <div className="av-media-url"><code title={url}>{url}</code><Button variant="ghost" size="icon" aria-label="Copy file address" onClick={copy}><Copy/></Button></div>
   <div className="av-media-actions"><Button variant={showUsage?'default':'outline'} size="sm" disabled={busy} onClick={toggleUsage} aria-expanded={showUsage}><MapPin/>Where used</Button>{media.id&&<Button variant={editing?'default':'outline'} size="sm" onClick={()=>setEditing(!editing)} aria-expanded={editing}><Pencil/>Edit details</Button>}</div>
  </div>
  {showUsage&&usage&&<div className="av-media-panel">
   {!usage.shared&&!usage.pages.length&&<p className="muted">Not used on any page.</p>}
   {usage.shared&&<a className="av-use-row" href="/avault?view=navigation"><PanelsTopLeft size={16} aria-hidden="true"/><span><strong>Header &amp; footer</strong><small>Shown on every page{usage.sharedCount?` (${usage.sharedCount})`:''}</small></span><ArrowUpRight size={15} aria-hidden="true"/></a>}
   {usage.pages.length>0&&<><p className="av-use-head">{usage.pages.length} page{usage.pages.length===1?'':'s'}{usage.shared?' also use it in their content':''}</p>
    <ul className="av-use-list">{visible.map(p=><li key={p.route}><a href={'/avault?view=pages&route='+encodeURIComponent(p.route)}><span><strong>{p.label}</strong><small>{p.route}{p.places.size?' · '+[...p.places].join(', '):''}</small></span>{p.live?<span className="av-pill av-pill-live">Live</span>:<span className="av-pill av-pill-draft">Draft only</span>}</a></li>)}</ul>
    {usage.pages.length>6&&<button type="button" className="av-link" onClick={()=>setAll(!all)}>{all?'Show fewer':`Show all ${usage.pages.length}`}</button>}</>}
  </div>}
  {editing&&<div className="av-media-panel av-media-form">{(['name','alt','caption','credit'] as const).map(k=><label key={k}>{({name:'Name',alt:'Description',caption:'Caption',credit:'Credit'})[k]}<Input value={value[k]||''} onChange={e=>setValue({...value,[k]:e.target.value})}/></label>)}{value.width&&<p className="muted">{value.width} × {value.height}px</p>}<Button size="sm" disabled={busy} onClick={()=>act(async()=>{await request('media-update',{id:media.id,...value,expectedUpdatedAt:JSON.parse(media.metadata||'{}').updatedAt});notice('Media details saved. Existing page descriptions are preserved.');setEditing(false);reload()})}>Save details</Button></div>}
  <details className="av-media-more"><summary><ChevronDown size={15} aria-hidden="true"/>Set the description everywhere</summary><p>Updates this image’s description on every page that shows it, drafts and live pages. Leave it empty only for purely decorative images.</p><label>Description<Input value={alt} onChange={e=>{setAlt(e.target.value);setAltImpact(null)}}/></label><Button variant="outline" size="sm" disabled={busy} onClick={()=>act(async()=>setAltImpact(await request('media-alt',{url,alt,dryRun:true})))}>Review affected pages</Button>{altImpact&&<>{!altImpact.affected.length?<p>Every use already has this description.</p>:<><ul className="av-use-list compact">{altImpact.affected.map((a:any)=><li key={a.route}><span><strong>{a.route}</strong><small>{a.locations.length} spot{a.locations.length===1?'':'s'}</small></span></li>)}</ul><Button size="sm" disabled={busy} onClick={()=>act(async()=>{const r=await request('media-alt',{url,alt,expected:altImpact.affected.map((a:any)=>({route:a.route,revision:a.revision}))});notice(`Description updated on ${r.updated} page(s).`);setAltImpact(null);reload()})}>Apply to {altImpact.affected.length} page{altImpact.affected.length===1?'':'s'}</Button></>}</>}</details>
  {role==='owner'&&<details className="av-media-more"><summary><ChevronDown size={15} aria-hidden="true"/>Replace or archive</summary><label>Swap every use for an uploaded image<select value={to} onChange={e=>{setTo(e.target.value);setImpact(null)}}><option value="">Choose image</option>{uploads.filter(m=>'/media/'+m.key!==url).map(m=><option key={m.id} value={'/media/'+m.key}>{m.name}</option>)}</select></label><Button variant="outline" size="sm" disabled={!to||busy} onClick={()=>act(async()=>setImpact(await request('media-replace',{from:url,to,dryRun:true})))}>Review replacement</Button>{impact&&<><p>{impact.affected.length} page record{impact.affected.length===1?'':'s'} affected.</p><Button size="sm" disabled={busy} onClick={()=>act(async()=>{await request('media-replace',{from:url,to,expected:impact.affected});notice('Image references updated.');setImpact(null);reload()})}>Apply replacement</Button></>}{media.id&&<Button variant="outline" size="sm" disabled={busy} onClick={()=>act(async()=>{if(!confirm('Archive this unused image? A backup is created first, and in-use images cannot be archived.'))return;await request('media-delete',{id:media.id});notice('Image archived.');reload()})}>Archive unused upload</Button>}</details>}
 </article>;
}
```

### app/avault/navigation-editor.tsx

<!-- avault-file path="app/avault/navigation-editor.tsx" mode="owned" sha256="024a80293719cb851dabf26a1590716fc35e63218179f2111662cb9c5fa56621" eol="1" -->
```tsx
'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogMedia,AlertDialogTitle} from '@/components/ui/alert-dialog';
import {Monitor,Tablet,Smartphone,MousePointerClick,RotateCcw,ChevronDown,Search} from 'lucide-react';
import {request} from './content-tools';
import {applyForms} from '@/lib/avault/forms';

// Visual editor for the shared header and footer. The canvas is the homepage's real header and footer in
// the site's own CSS; clicking text edits it in place, clicking anything shows its text, link and labels in
// the inspector. Saved values are overrides keyed group|label|original value, applied to every page.
type Field={key:string;value:string;kind:string;label:string;section:string;group?:string};
type Selection={kind:'element';text:string[];attrs:{attr:string;key:string}[];title:string}|{kind:'form'};
const esc=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const okey=(f:Field)=>f.group+'|'+f.label+'|'+f.value;
const DEVICES={desktop:{w:1440,icon:Monitor,label:'Desktop'},tablet:{w:820,icon:Tablet,label:'Tablet'},mobile:{w:390,icon:Smartphone,label:'Mobile'}} as const;
export function friendly(label:string){const attr=label.split(' ')[1];return attr==='href'?'Link destination':attr==='src'?'Image URL':attr==='alt'?'Image description':attr==='aria-label'?'Screen-reader label':attr==='placeholder'?'Placeholder':attr?attr:'Text'}
const pairs=(el:Element)=>(el.getAttribute('data-av-a')||'').split(',').filter(Boolean).map(p=>{const [attr,key]=p.split('=');return {attr,key}});
export const CANVAS_CSS=`
.reveal{opacity:1!important;transform:none!important}
.header-wrap{position:relative!important;top:auto!important}
[data-av-k],[data-av-a]{cursor:pointer}
.av-hover{outline:2px dashed #062744!important;outline-offset:3px;border-radius:3px}
.av-selected{outline:2px solid #d6283b!important;outline-offset:3px;border-radius:3px;background-color:rgba(214,40,59,.06)!important}
[contenteditable="plaintext-only"],[contenteditable="true"]{cursor:text!important;outline:2px solid #d6283b!important;outline-offset:3px;background-color:rgba(214,40,59,.06)!important}
.av-canvas-main{display:grid;place-items:center;min-height:200px;margin:28px auto;width:calc(100% - 64px);max-width:1360px;border:2px dashed #dadce0;border-radius:24px;color:#80868b;font:500 15px/1.6 "Google Sans Flex",Arial,sans-serif;text-align:center;background:repeating-linear-gradient(45deg,#fafbfc 0 14px,#f3f5f8 14px 28px)}
.av-canvas-main strong{display:block;color:#3c4043;font-size:17px}
form.av-form-lock{position:relative;cursor:pointer}
form.av-form-lock *{pointer-events:none}
form.av-form-lock::after{content:"FORM";position:absolute;top:12px;right:12px;padding:7px 10px;border:1px solid #d6283b;border-radius:3px;background:#fff;color:#062744;font:700 11px/1 "Google Sans Flex",Arial,sans-serif;letter-spacing:.12em;opacity:0;transition:opacity .15s}
form.av-form-lock:hover::after,form.av-form-lock.av-selected::after{opacity:1}
`;

export function NavigationEditor({role,notice,docs,go}:{role:string;notice:(s:string)=>void;docs:any[];go:(view:string)=>void}){
 const [data,setData]=useState<any>(null),[nav,setNav]=useState<Record<string,string>>({}),[sel,setSel]=useState<Selection|null>(null),[device,setDevice]=useState<keyof typeof DEVICES>('desktop'),[busy,setBusy]=useState(false),[frameKey,setFrameKey]=useState(0),[height,setHeight]=useState(900),[width,setWidth]=useState(1000),[menuOpen,setMenuOpen]=useState(false),[query,setQuery]=useState(''),[showChanges,setShowChanges]=useState(false),[confirmDiscard,setConfirmDiscard]=useState(false);
 const frame=useRef<HTMLIFrameElement>(null),wrap=useRef<HTMLDivElement>(null),bar=useRef<HTMLDivElement>(null),[panelTop,setPanelTop]=useState(96),navRef=useRef(nav);
 useEffect(()=>{navRef.current=nav},[nav]);
 const fields:Field[]=useMemo(()=>data?.fields||[],[data]);
 const byKey=useMemo(()=>new Map(fields.map(f=>[f.key,f])),[fields]);
 const value=(k:string)=>{const f=byKey.get(k);return f?nav[okey(f)]??f.value:''};

 async function load(){try{const d=await request('navigation');setData(d);setNav(d.navigation||{});setSel(null);setFrameKey(k=>k+1)}catch(e){notice((e as Error).message)}}
 useEffect(()=>{load()},[]);// eslint-disable-line react-hooks/exhaustive-deps

 // Built once per load; later edits change the canvas DOM directly so typing never reloads the frame.
 const srcDoc=useMemo(()=>{if(!data?.canvas)return '';const c=data.canvas,start:Record<string,string>=data.navigation||{};
  const fill=(s:string)=>s.replace(/\{\{(f\d+)\}\}/g,(_,k)=>{const f=byKey.get(k);return esc(f?start[okey(f)]??f.value:'')});
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${c.styles.map((h:string)=>`<link rel="stylesheet" href="${esc(h)}">`).join('')}<style>${CANVAS_CSS}</style></head><body${c.bodyAttrs}><div class="concept concept-i is-visible">${fill(c.header)}<main class="av-canvas-main"><div><strong>Page content</strong>Each page shows its own content here. The header above and footer below are shared by every page.</div></main>${applyForms(fill(c.footer),data.forms)}</div></body></html>`;
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[data,frameKey]);

 const doc=()=>frame.current?.contentDocument||null;
 // Writes a value everywhere it appears: every field that shares this override key, text and attributes alike.
 const paint=useCallback((key:string,v:string)=>{const d=doc(),f=byKey.get(key);if(!d||!f)return;const ok=okey(f);
  for(const g of fields.filter(x=>okey(x)===ok)){d.querySelectorAll(`[data-av-k="${g.key}"]`).forEach(el=>{if(el!==d.activeElement)el.textContent=v});d.querySelectorAll('[data-av-a]').forEach(el=>{for(const p of pairs(el))if(p.key===g.key)el.setAttribute(p.attr,v)})}},[byKey,fields]);
 const setValue=useCallback((key:string,v:string,fromCanvas=false)=>{const f=byKey.get(key);if(!f)return;const ok=okey(f);setNav(n=>({...n,[ok]:v}));navRef.current={...navRef.current,[ok]:v};if(!fromCanvas)paint(key,v);else{const d=doc();if(d){for(const g of fields.filter(x=>okey(x)===ok&&x.key!==key))d.querySelectorAll(`[data-av-k="${g.key}"]`).forEach(el=>el.textContent=v)}}},[byKey,fields,paint]);

 function chooseCategory(d:Document,index:number){const cloud=d.querySelector('.cloud-menu');if(!cloud)return;cloud.classList.add('is-enhanced');(cloud as HTMLElement).dataset.category=String(index);cloud.querySelectorAll('.cloud-category').forEach((b,i)=>b.setAttribute('aria-selected',String(i===index)));cloud.querySelectorAll<HTMLElement>('.cloud-panel').forEach((p,i)=>p.hidden=i!==index)}
 const measure=useCallback(()=>{const d=doc();if(!d)return;setHeight(Math.max(d.documentElement.scrollHeight,menuOpen?1000:0,400))},[menuOpen]);

 function onLoad(){const d=doc();if(!d)return;let hover:Element|null=null;
  chooseCategory(d,0);d.querySelectorAll('form').forEach(f=>f.classList.add('av-form-lock'));
  const clear=()=>d.querySelectorAll('.av-selected').forEach(x=>x.classList.remove('av-selected'));
  d.addEventListener('mouseover',e=>{const t=(e.target as Element).closest('form.av-form-lock,[data-av-k],[data-av-a]');if(hover!==t){hover?.classList.remove('av-hover');t?.classList.add('av-hover');hover=t}});
  d.addEventListener('mouseleave',()=>{hover?.classList.remove('av-hover');hover=null});
  d.addEventListener('click',e=>{const t=e.target as Element;if((t as HTMLElement).closest?.('[contenteditable="plaintext-only"]'))return;e.preventDefault();e.stopPropagation();
   const form=t.closest('form');if(form){clear();form.classList.add('av-selected');setSel({kind:'form'});setShowChanges(false);return}
   const summary=t.closest('summary');if(summary){const det=summary.parentElement as HTMLDetailsElement;det.open=!det.open;setMenuOpen(det.open)}
   const cat=t.closest('.cloud-category');if(cat)chooseCategory(d,[...d.querySelectorAll('.cloud-category')].indexOf(cat));
   const toggle=t.closest('.menu-toggle');if(toggle){const n=d.querySelector('.i-nav');const open=!n?.classList.contains('is-open');n?.classList.toggle('is-open',open);d.body.classList.toggle('menu-open',open)}
   const el=t.closest('[data-av-k],[data-av-a]');if(!el)return;clear();
   const link=el.closest('[data-av-a]');const own=el.getAttribute('data-av-k');
   const text=[...new Set([...(own?[own]:[]),...[...(link||el).querySelectorAll('[data-av-k]')].map(x=>x.getAttribute('data-av-k')!)])].slice(0,8);
   const target=link&&link.contains(el)?link:el;target.classList.add('av-selected');
   const name=link?.tagName==='A'?'Link':el.tagName==='IMG'?'Image':el.closest('h1,h2,h3,h4')?'Heading':el.tagName==='BUTTON'||el.closest('button')?'Button':'Text';
   setSel({kind:'element',text,attrs:link?pairs(link):pairs(el),title:name});setShowChanges(false);
   // Text is edited right where it sits.
   if(own&&!el.querySelector('[data-av-k]')){const h=el as HTMLElement;h.contentEditable='plaintext-only';h.focus();const r=d.createRange();r.selectNodeContents(h);r.collapse(false);const s=d.getSelection();s?.removeAllRanges();s?.addRange(r)}
  },true);
  d.addEventListener('input',e=>{const el=(e.target as Element).closest?.('[data-av-k]');if(el)setValue(el.getAttribute('data-av-k')!,el.textContent||'',true)});
  d.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key==='Escape')&&(d.activeElement as HTMLElement)?.isContentEditable){e.preventDefault();(d.activeElement as HTMLElement).blur()}});
  d.addEventListener('focusout',e=>{const el=e.target as HTMLElement;if(el.isContentEditable)el.contentEditable='false'});
  d.addEventListener('submit',e=>e.preventDefault(),true);
  new ResizeObserver(measure).observe(d.body);measure();
 }
 useEffect(()=>{measure()},[menuOpen,measure]);
 const ready=!!data?.canvas;
 // The floating inspector sits just under the toolbar, wherever the toolbar is on screen.
 useEffect(()=>{const place=()=>{const b=bar.current?.getBoundingClientRect();if(b)setPanelTop(Math.max(16,b.bottom+12))};place();const o=new ResizeObserver(place);if(bar.current)o.observe(bar.current);addEventListener('scroll',place,true);addEventListener('resize',place);return()=>{o.disconnect();removeEventListener('scroll',place,true);removeEventListener('resize',place)}},[ready]);
 useEffect(()=>{const el=wrap.current;if(!el)return;setWidth(el.clientWidth);const o=new ResizeObserver(()=>setWidth(el.clientWidth));o.observe(el);return()=>o.disconnect()},[ready]);
 function toggleMenu(){const d=doc();const det=d?.querySelector<HTMLDetailsElement>('.services-menu');if(!det)return;det.open=!det.open;setMenuOpen(det.open)}

 // Unpublished = differs from what is live now; the saved set = every override that differs from the original text.
 const orig=(k:string)=>k.split('|').slice(2).join('|');
 const changes=useMemo(()=>{const live=data?.navigation||{};return [...new Set([...Object.keys(nav),...Object.keys(live)])].filter(k=>(nav[k]??orig(k))!==(live[k]??orig(k))).map(k=>({k,v:nav[k]??orig(k),was:live[k]??orig(k),f:fields.find(f=>okey(f)===k)})).filter(c=>c.f)},[nav,fields,data]);
 async function publish(){setBusy(true);try{await request('navigation',{navigation:Object.fromEntries(Object.entries(nav).filter(([k,v])=>v!==orig(k))),revision:data.revision});notice('Header and footer published. Every page uses the new version.');await load()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 function revert(k:string){const f=fields.find(x=>okey(x)===k);if(!f)return;setValue(f.key,data.navigation?.[k]??f.value)}

 if(!data)return <p role="status">Loading the header and footer…</p>;
 if(!data.canvas)return <div className="vault-card"><p>The homepage could not be loaded, so the shared header and footer are unavailable.</p></div>;
 const D=DEVICES[device],scale=Math.min(1,width/D.w);
 const fieldInput=(key:string,label?:string)=>{const f=byKey.get(key);if(!f)return null;const v=nav[okey(f)]??f.value,changed=v!==f.value;const shared=fields.filter(x=>okey(x)===okey(f)).length;
  return <label key={key} className="av-nav-field"><span>{label||friendly(f.label)}{changed&&<Badge variant="outline">edited</Badge>}</span>{f.kind==='url'?<Input list="av-nav-pages" value={v} onChange={e=>setValue(key,e.target.value)}/>:v.length>90?<Textarea rows={3} value={v} onChange={e=>setValue(key,e.target.value)}/>:<Input value={v} onChange={e=>setValue(key,e.target.value)}/>}{shared>1&&<small>Also used in {shared-1} other spot{shared>2?'s':''}; they change together.</small>}{changed&&<button type="button" className="av-link" onClick={()=>setValue(key,f.value)}><RotateCcw size={13}/>Restore “{f.value.slice(0,40)}”</button>}</label>};

 return <div className="av-nav">
  <datalist id="av-nav-pages">{docs.filter(d=>d.status==='published').map(d=><option key={d.route} value={d.route}>{d.label}</option>)}</datalist>
  <div className="vault-card av-nav-toolbar" ref={bar}>
   <div className="av-seg" role="group" aria-label="Preview size">{(Object.keys(DEVICES) as (keyof typeof DEVICES)[]).map(k=>{const I=DEVICES[k].icon;return <button key={k} type="button" className={device===k?'selected':''} onClick={()=>setDevice(k)} aria-pressed={device===k}><I size={16}/>{DEVICES[k].label}</button>})}</div>
   {device==='desktop'&&<Button variant="outline" onClick={toggleMenu}><ChevronDown/>{menuOpen?'Close':'Open'} services menu</Button>}
   {!changes.length&&<span className="av-nav-hint"><MousePointerClick size={16}/>Click text to edit · click a link to change it</span>}
   <span className="av-nav-actions">{changes.length>0&&<Button variant="outline" onClick={()=>{setShowChanges(!showChanges);setSel(null)}}>{changes.length} unpublished</Button>}{changes.length>0&&<Button variant="outline" disabled={busy} onClick={()=>setConfirmDiscard(true)}><RotateCcw/>Revert all</Button>}<Button disabled={busy||role!=='owner'||!changes.length} onClick={publish}>{changes.length?`Publish ${changes.length} change${changes.length>1?'s':''}`:'No changes yet'}</Button></span>
  </div>
  <div className="av-nav-layout">
   <div className="av-nav-stage" ref={wrap}><div style={{height:height*scale,position:'relative'}}><iframe key={frameKey} ref={frame} title="Header and footer editor" srcDoc={srcDoc} onLoad={onLoad} style={{width:D.w,height,transform:`scale(${scale})`,transformOrigin:'0 0',position:'absolute',left:Math.max(0,(width-D.w*scale)/2)}}/></div></div>
   {(sel||showChanges)&&<aside className="vault-card av-nav-inspector" aria-label="Edit selection" style={{top:panelTop,maxHeight:`calc(100vh - ${panelTop+24}px)`}}><button type="button" className="av-nav-close" aria-label="Close" onClick={()=>{setSel(null);setShowChanges(false);doc()?.querySelectorAll('.av-selected').forEach(x=>x.classList.remove('av-selected'))}}>×</button>
    {sel?.kind==='form'&&<><h2>Contact form</h2><p>The form’s fields, choices and button are edited in <b>Forms</b>, where you can also add new fields.</p><Button onClick={()=>go('site-forms')}>Open Forms</Button></>}
    {sel?.kind==='element'&&<><p className="eyebrow">Selected</p><h2>{sel.title}</h2>{sel.text.map(k=>fieldInput(k,sel.text.length>1?`Text: “${value(k).slice(0,28)}”`:undefined))}{sel.attrs.map(a=>fieldInput(a.key))}{!sel.text.length&&!sel.attrs.length&&<p>Nothing to edit here.</p>}<Button variant="outline" onClick={()=>{setSel(null);doc()?.querySelectorAll('.av-selected').forEach(x=>x.classList.remove('av-selected'))}}>Done</Button></>}
    {!sel&&showChanges&&changes.length>0&&<div className="av-nav-changes"><h3>Unpublished changes ({changes.length})</h3>{changes.map(c=><div key={c.k} className="vault-row"><span><small>{c.f!.group==='footer'?'Footer':'Header'} · {friendly(c.f!.label)}</small><del>{c.was||'(empty)'}</del><strong>{c.v||'(empty)'}</strong></span><button type="button" className="av-link" onClick={()=>revert(c.k)} aria-label="Undo this change"><RotateCcw size={14}/></button></div>)}</div>}
   </aside>}
  </div>
  <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}><AlertDialogContent className="av-editor-confirm"><AlertDialogHeader><AlertDialogMedia><RotateCcw/></AlertDialogMedia><AlertDialogTitle>Revert all header and footer changes?</AlertDialogTitle><AlertDialogDescription>Every unpublished shared-navigation and footer edit will return to the current live version. Published content will not change.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction onClick={()=>{setNav(data.navigation||{});setSel(null);setShowChanges(false);setFrameKey(k=>k+1)}}>Revert unpublished changes</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  <details className="vault-card av-nav-all"><summary>All header and footer text, including hidden labels ({fields.length})</summary><p>Screen-reader labels, the skip link and other text that isn’t visible in the preview.</p><label className="av-search"><Search size={16}/><Input placeholder="Find text or a link…" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="av-nav-grid">{fields.filter(f=>!query||(value(f.key)+' '+f.label).toLowerCase().includes(query.toLowerCase())).filter((f,i,a)=>a.findIndex(x=>okey(x)===okey(f))===i).slice(0,200).map(f=>fieldInput(f.key,`${f.group==='footer'?'Footer':'Header'} · ${friendly(f.label)}`))}</div></details>
 </div>;
}
```

### app/avault/operations-panel.tsx

<!-- avault-file path="app/avault/operations-panel.tsx" mode="owned" sha256="84a49e45e48691183d3d03ffe12de20691b51d8a236e80ac1b31d09cae09b04a" eol="1" -->
```tsx
'use client';
import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {request} from './content-tools';
const defaults:Record<string,any>={verification:{google:'',bing:''},scripts:{enabled:false,head:'',bodyStart:'',bodyEnd:''},traffic:{enabled:false,allow:[],deny:[],countries:[]},operations:{analytics:true,retentionDays:365,dailyBackup:false,formRetentionDays:0},files:{robots:'',llms:'',sitemaps:{exclude:[],custom:{'sm_pages.xml':[],'sm_posts.xml':[]}}},menus:{header:[],footer:[],mobile:[],utility:[]}};
const configLabels:Record<string,string>={verification:'Search engine verification',scripts:'Custom scripts',traffic:'Traffic access rules',operations:'Privacy, tracking & retention',files:'robots.txt, llms.txt & sitemaps',menus:'Additional menus'};
export function OperationsPanel({role,notice,docs,only}:{role:string;notice:(s:string)=>void;docs:any[];only?:string}){const [tab,setTab]=useState(only||'schedules'),[data,setData]=useState<any>(null),[value,setValue]=useState<any>(()=>({...(defaults[only||'']||{})})),[revision,setRevision]=useState(0),[busy,setBusy]=useState(false),[page,setPage]=useState(0),[inspection,setInspection]=useState<any>(null),[backupId,setBackupId]=useState(''),[target,setTarget]=useState(''),[history,setHistory]=useState<any[]>([]);async function load(){setBusy(true);try{if(defaults[tab]){const r=await request('configuration?key='+tab);if(!r.value||!Object.keys(r.value).length)throw new Error(configLabels[tab]+' are missing from the database.');setValue(r.value);setRevision(r.revision);setData(null)}else{setData(await request(tab+'?page='+page));setInspection(null)}setHistory([])}catch(e){notice((e as Error).message)}finally{setBusy(false)}}useEffect(()=>{load()},[tab,page]);async function act(fn:()=>Promise<any>,reload=true){setBusy(true);try{await fn();if(reload)await load()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}const set=(k:string,v:any)=>setValue((c:any)=>({...c,[k]:v}));const tabs=[['schedules','Schedules'],['taxonomy','Categories & tags'],['events','Events'],['presence','Live sessions'],...(role==='owner'?[...Object.entries(configLabels),['backups','Backups']]:[])];
if(defaults[tab]&&role!=='owner')return <div className="vault-card"><p>Only owners can change {configLabels[tab].toLowerCase()}.</p></div>;
return <>{!only&&<div className="vault-tabs">{tabs.map(([k,label])=><Button key={k} variant={tab===k?'default':'outline'} onClick={()=>{setTab(k);setPage(0)}}>{label}</Button>)}</div>}{busy&&<p role="status">Working…</p>}
{defaults[tab]&&role==='owner'&&<form className="vault-card vault-settings" onSubmit={e=>{e.preventDefault();act(async()=>{const r=await request('configuration',{key:tab,value,revision});setRevision(r.revision);notice('Settings saved.')})}}><h2>{configLabels[tab]}</h2>
{tab==='verification'&&<><p>Paste the token from Google Search Console or Bing Webmaster Tools. AVAULT adds the matching meta tag.</p>{['google','bing'].map(k=><label key={k}>{k}<Input value={value[k]} onChange={e=>set(k,e.target.value)}/></label>)}</>}
{tab==='scripts'&&<><p>Owner-managed JavaScript runs publicly. Paste JavaScript only, without script tags. Disable here to stop all custom scripts.</p><label className="inline"><input type="checkbox" checked={value.enabled} onChange={e=>set('enabled',e.target.checked)}/>Enable scripts</label>{['head','bodyStart','bodyEnd'].map(k=><label key={k}>{k}<Textarea rows={8} value={value[k]} onChange={e=>set(k,e.target.value)}/></label>)}</>}
{tab==='traffic'&&<><p>Rules affect public page requests. AVAULT remains accessible for recovery. Allow rules take priority. Country rules use the hosting provider’s country header when available.</p><label><input type="checkbox" checked={value.enabled} onChange={e=>set('enabled',e.target.checked)}/> Enable rules</label>{['allow','deny','countries'].map(k=><label key={k}>{k} — one per line<Textarea value={value[k].join('\n')} onChange={e=>set(k,e.target.value.split('\n').filter(Boolean))}/></label>)}</>}
{tab==='operations'&&<><p>Every visit is recorded automatically: pages viewed and time on each, links and buttons clicked, forms sent and phone taps, with referrer, browser and IP address. See it under Visitors and Calls. Search-engine bots are ignored. Visitors whose browser sends the Global Privacy Control signal, or who click “Don’t track my visits” in the footer, are not recorded.</p><p><strong>Privacy policy:</strong> say that the site records visits this way, for how long, and that visitors can opt out with the footer link.</p><label className="inline"><input type="checkbox" checked={value.analytics!==false} onChange={e=>set('analytics',e.target.checked)}/>Record visitor journeys</label><label>Keep visitor journeys for<select value={value.retentionDays||365} onChange={e=>set('retentionDays',+e.target.value)}>{[30,90,180,365,730].map(n=><option value={n} key={n}>{n>=365?`${n/365} year${n>365?'s':''}`:`${n} days`}</option>)}</select></label><label>Delete archived leads after<select value={value.formRetentionDays||0} onChange={e=>set('formRetentionDays',+e.target.value)}>{[0,90,180,365,730].map(n=><option value={n} key={n}>{n?`${n} days`:'Keep forever'}</option>)}</select></label><label className="inline"><input type="checkbox" checked={!!value.dailyBackup} onChange={e=>set('dailyBackup',e.target.checked)}/>Create a daily backup when scheduled jobs run</label><p>Deleting old records and daily backups run automatically every 10 minutes.</p></>}
{tab==='files'&&<><p>These additions appear before generated content. Protected routes and the sitemap declaration remain in robots.txt.</p><label>robots.txt additions<Textarea rows={8} value={value.robots} onChange={e=>set('robots',e.target.value)}/></label><label>llms.txt introduction<Textarea rows={8} value={value.llms} onChange={e=>set('llms',e.target.value)}/></label><h3>Sitemaps</h3><p>Published, indexable pages are listed automatically; hidden (noindex) pages never are. Use these to leave extra pages out, or to add URLs that AVAULT doesn’t manage.</p><label>Leave these pages out (one path per line)<Textarea rows={4} value={(value.sitemaps?.exclude||[]).join('\n')} onChange={e=>set('sitemaps',{...value.sitemaps,exclude:e.target.value.split('\n')})} placeholder="/thank-you/"/></label>{['sm_pages.xml','sm_posts.xml'].map(k=><label key={k}>Extra URLs for {k.replace('_','-')} (one per line)<Textarea rows={3} value={(value.sitemaps?.custom?.[k]||[]).join('\n')} onChange={e=>set('sitemaps',{...value.sitemaps,custom:{...value.sitemaps?.custom,[k]:e.target.value.split('\n')}})}/></label>)}</>}
{tab==='menus'&&<><p>Optional extra links complement the existing header, mega menu, and footer. Edit existing links in Navigation & footer.</p>{['header','mobile','footer','utility'].map(name=><div className="vault-block" key={name}><h3>{name}</h3>{value[name].map((item:any,i:number)=><div className="vault-block" key={item.id}><label>Label<Input value={item.label} onChange={e=>set(name,value[name].map((x:any,n:number)=>n===i?{...x,label:e.target.value}:x))}/></label><label>Destination<Input list="vault-destinations" value={item.url} onChange={e=>set(name,value[name].map((x:any,n:number)=>n===i?{...x,url:e.target.value}:x))}/></label><label>Parent<select value={item.parent||''} onChange={e=>set(name,value[name].map((x:any,n:number)=>n===i?{...x,parent:e.target.value}:x))}><option value="">Top level</option>{value[name].filter((x:any)=>x.id!==item.id&&!x.parent).map((x:any)=><option key={x.id} value={x.id}>{x.label||'Untitled item'}</option>)}</select></label><label className="inline"><input type="checkbox" checked={item.enabled!==false} onChange={e=>set(name,value[name].map((x:any,n:number)=>n===i?{...x,enabled:e.target.checked}:x))}/>Enabled</label><label className="inline"><input type="checkbox" checked={item.newTab||false} onChange={e=>set(name,value[name].map((x:any,n:number)=>n===i?{...x,newTab:e.target.checked}:x))}/>Open in a new tab</label><div className="actions"><Button type="button" variant="outline" disabled={!i} onClick={()=>{const next=[...value[name]];[next[i-1],next[i]]=[next[i],next[i-1]];set(name,next)}}>Move up</Button><Button type="button" variant="outline" onClick={()=>set(name,value[name].filter((_:any,n:number)=>n!==i))}>Remove</Button></div></div>)}<Button type="button" variant="outline" onClick={()=>set(name,[...value[name],{id:crypto.randomUUID(),label:'',url:'/',enabled:true,parent:'',newTab:false}])}>Add {name} link</Button></div>)}<datalist id="vault-destinations">{docs.filter(d=>d.status==='published').map(d=><option key={d.route} value={d.route}>{d.label}</option>)}</datalist></>}
<Button disabled={busy}>Save {configLabels[tab].toLowerCase()}</Button><Button type="button" variant="outline" onClick={()=>act(async()=>setHistory(await request('revisions?route='+encodeURIComponent('@'+tab))),false)}>Show settings history</Button>{history.map(r=><div className="vault-row" key={r.id}><span>{r.created_at} · {r.actor} · {r.state}</span><Button type="button" variant="outline" disabled={busy} onClick={()=>act(async()=>{if(!confirm('Restore the settings before this change as a new revision?'))return;await request('configuration-restore',{id:r.id,expectedRevision:revision});notice('Previous settings restored as a new revision.')})}>Restore previous settings</Button></div>)}</form>}

{tab==='taxonomy'&&<form className="vault-card vault-settings" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);act(async()=>{await request('taxonomy',Object.fromEntries(f));notice('Classification saved.')})}}><h2>Add category or tag</h2><label>Type<select name="type"><option value="category">Category</option><option value="tag">Tag</option></select></label><label>Label<Input name="label" required/></label><label>Slug<Input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*"/></label><Button>Add classification</Button></form>}
{tab==='backups'&&<section className="vault-card"><h2>Encrypted backups</h2><p>Snapshots include content, settings, redirects, media records, access settings, form requests, and audit history. Uploaded media objects remain in durable storage. Downloads contain private data; store them securely.</p><Button disabled={busy} onClick={()=>act(async()=>{await request('backup',{});notice('Encrypted snapshot created.')})}>Create a backup now</Button>{inspection&&<div className="vault-block"><h3>Verified snapshot · {inspection.date}</h3><p>{Object.entries(inspection.counts).map(([k,v])=>`${v} ${k}`).join(' · ')}</p><label>Restore one page<select value={target} onChange={e=>setTarget(e.target.value)}><option value="">Choose a page</option>{inspection.documents.map((d:any)=><option key={d.route}>{d.route}</option>)}</select></label><Button disabled={!target||busy} onClick={()=>act(async()=>{const current=await request('document?route='+encodeURIComponent(target));if(!confirm('Restore the saved draft and publication state for '+target+'? A fresh backup will be created first.'))return;await request('backup-restore-page',{id:backupId,route:target,expectedRevision:current.revision});notice('Page restored as a new revision.')})}>Restore selected page</Button></div>}</section>}
{Array.isArray(data)&&<section className="vault-card"><h2>{tabs.find(x=>x[0]===tab)?.[1]}</h2>{!data.length&&<p>No records yet.</p>}{data.map((r:any,i:number)=><div className="vault-row" key={r.id||r.route||r.session||i}><div>{tab==='events'?<><strong>{r.type}</strong><p>{JSON.parse(r.value).page}</p><small>{r.created_at}</small></>:tab==='backups'?<><strong>{r.created_at}</strong><small>{Math.round(r.bytes/1024)} KB · SHA-256 verified on read</small></>:tab==='schedules'?<><strong>{r.route}</strong><p>{r.due} · {r.state} · revision {r.revision}</p></>:tab==='taxonomy'?<><strong>{r.label}</strong><small>{r.type} · {r.slug}</small></>:<><strong>{r.session}</strong><small>{r.last_seen}</small></>}</div>{tab==='backups'&&<div className="actions"><Button variant="outline" onClick={()=>act(async()=>{setBackupId(r.id);setInspection(await request('backup-inspect',{id:r.id}))},false)}>Inspect & restore</Button><a href={'/api/admin/backup-download?id='+r.id} download>Download</a></div>}{tab==='taxonomy'&&<Button variant="outline" onClick={()=>act(()=>request('taxonomy-delete',{id:r.id}))}>Delete unused</Button>}{tab==='schedules'&&r.state==='pending'&&<Button variant="outline" onClick={()=>act(()=>request('schedule-cancel',{route:r.route}))}>Cancel</Button>}</div>)}<div className="actions"><Button variant="outline" disabled={!page} onClick={()=>setPage(page-1)}>Previous</Button><Button variant="outline" disabled={data.length<50||tab==='presence'} onClick={()=>setPage(page+1)}>Next</Button><Button variant="outline" onClick={load}>Refresh</Button></div></section>}
</>}
export function FamilyBuilder({docs,notice}:{docs:any[];notice:(s:string)=>void}){const [template,setTemplate]=useState(docs[0]?.route||'/'),[rows,setRows]=useState(''),[busy,setBusy]=useState(false);return <form className="vault-card vault-settings" onSubmit={async e=>{e.preventDefault();setBusy(true);try{const pages=rows.split('\n').filter(Boolean).map(r=>{const [route,...title]=r.split('|');return {route:route.trim(),title:title.join('|').trim()}});if(pages.some(p=>!p.title))throw new Error('Each row needs a URL and title.');await request('family',{templateRoute:template,pages});notice(`${pages.length} private drafts created. Reload the page list to edit them.`);setRows('')}catch(e){notice((e as Error).message)}finally{setBusy(false)}}}><h2>Create a related page family</h2><p>Create up to 15 private drafts from one design. Replace each draft’s content before publishing.</p><label>Base design<select value={template} onChange={e=>setTemplate(e.target.value)}>{docs.map(d=><option key={d.route} value={d.route}>{d.label}</option>)}</select></label><label>One page per line: /page-url/ | Page title<Textarea rows={5} value={rows} onChange={e=>setRows(e.target.value)} placeholder="/local-seo/brooklyn/ | Local SEO in Brooklyn" required/></label><Button disabled={busy}>Create private drafts</Button></form>}
```

### app/avault/overview-views.tsx

<!-- avault-file path="app/avault/overview-views.tsx" mode="owned" sha256="dea76830c8e7a52f04cf9e22d730d3bd8c375e6a362629121b5f154b15122680" eol="1" -->
```tsx
'use client';
import {useEffect,useMemo,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Inbox,Phone,Activity,Radio,FileText,PenLine,FilePen,Stethoscope,TriangleAlert,ArrowRight,ImagePlus,Link as LinkIcon,Search,CalendarClock,Plus,Tags,Folder,Hash,Pencil,Trash2,Mail,HeartPulse,DatabaseBackup,CircleCheck} from 'lucide-react';
import {request} from './content-tools';
import {describe,GENERIC} from './admin-views';

// AVAULT → Overview, Scheduled publishing, and Categories & tags.
type Notice=(s:string)=>void;
function ago(iso?:string|null){if(!iso)return 'never';const s=(Date.now()-new Date(iso).getTime())/1000;if(s<60)return 'just now';if(s<3600)return Math.floor(s/60)+' min ago';if(s<86400)return Math.floor(s/3600)+' h ago';return Math.floor(s/86400)+' d ago'}
const fullTime=(iso?:string|null)=>iso?new Date(iso).toLocaleString('en-US',{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'—';
const parse=(s:string)=>{try{return JSON.parse(s||'{}')}catch{return {}}};

// ── Overview ────────────────────────────────────────────────────────────────
// Each warning from the server points at the screen that fixes it.
const FIX:[RegExp,string,string][]=[[/email/i,'email','Open email settings'],[/scheduled jobs/i,'health','Open system health'],[/backup/i,'backups','Back up now'],[/notification/i,'leads','Open leads']];
export function OverviewPanel({go,email}:{go:(v:string)=>void;email:string}){
 const [d,setD]=useState<any>(null),[error,setError]=useState(''),[leads,setLeads]=useState<any[]>([]),[now]=useState(()=>Date.now());
 useEffect(()=>{request('overview').then(setD).catch(e=>setError(e.message));request('forms?status=new').then(r=>setLeads((r.rows||[]).slice(0,5))).catch(()=>{})},[]);
 if(error)return <p className="vault-card av-empty">{error}</p>;
 if(!d)return <p className="vault-card av-empty" role="status">Loading your overview…</p>;
 const h=new Date().getHours(),hello=h<12?'Good morning':h<18?'Good afternoon':'Good evening',name=email.split('@')[0].split(/[._-]/)[0];
 const summary=[d.newLeads?`${d.newLeads} new lead${d.newLeads===1?'':'s'} waiting`:'No new leads',`${d.visitorsToday} visit${d.visitorsToday===1?'':'s'} today`,d.callsToday?`${d.callsToday} call tap${d.callsToday===1?'':'s'} today`:''].filter(Boolean).join(' · ');
 const kpis:[string,number,string,typeof Inbox,string][]=[['New leads',d.newLeads,'leads',Inbox,'blue'],['Calls today',d.callsToday,'calls',Phone,'green'],['Visits today',d.visitorsToday,'visitors',Activity,'yellow'],['On the site now',d.liveNow,'visitors',Radio,'red']];
 const content:[string,number,string,typeof FileText][]=[['Pages',d.pages,'pages',FileText],['Blog posts',d.posts,'blogs',PenLine],['Drafts',d.drafts,'pages',FilePen],['Pages to fix',d.auditErrors,'seo',Stethoscope]];
 return <div className="av-overview">
  <div className="vault-card av-hello"><div><p className="eyebrow">{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</p><h2>{hello}{name?`, ${name[0].toUpperCase()+name.slice(1)}`:''}.</h2><p>{summary}.</p></div>{d.newLeads>0&&<Button onClick={()=>go('leads')}><Inbox/>Open {d.newLeads} new lead{d.newLeads===1?'':'s'}</Button>}</div>
  {d.warnings.length>0&&<section className="vault-card av-attention"><h3><TriangleAlert size={18}/>Needs attention</h3><ul>{d.warnings.map((w:string)=>{const fix=FIX.find(([rx])=>rx.test(w));return <li key={w}><span>{w}</span>{fix&&<button type="button" className="av-link" onClick={()=>go(fix[1])}>{fix[2]}<ArrowRight size={14}/></button>}</li>})}</ul></section>}
  <div className="av-stat-row av-stat-4">{kpis.map(([l,n,v,I,tone])=><button key={l} type="button" className={'vault-card av-kpi av-kpi-link '+tone} onClick={()=>go(v)}><I size={18}/><strong>{n.toLocaleString()}</strong><span>{l}</span></button>)}</div>
  <div className="av-ov-grid">
   <section className="vault-card av-ov-leads"><div className="av-ov-head"><h3><Inbox size={16}/>Latest new leads</h3><button type="button" className="av-link" onClick={()=>go('leads')}>All leads<ArrowRight size={14}/></button></div>
    {!leads.length?<p className="av-rule-empty">No new leads right now.</p>:<ul className="av-use-list">{leads.map(r=>{const f=parse(r.value);return <li key={r.id}><a href="/avault?view=leads"><span><strong>{f.name||'(no name)'}</strong><small>{f.service||f.request||'Estimate request'}{f.zip?` · ${f.zip}`:''}</small></span><small>{ago(r.created_at)}</small></a></li>})}</ul>}
   </section>
   <section className="vault-card av-ov-activity"><div className="av-ov-head"><h3><Activity size={16}/>Recent changes</h3><button type="button" className="av-link" onClick={()=>go('activity')}>Activity log<ArrowRight size={14}/></button></div>
    {!d.recentActivity.length?<p className="av-rule-empty">Changes will appear here.</p>:<ol className="av-mini-activity">{d.recentActivity.slice(0,6).map((r:any)=>{const [label,tone,I]=describe(r.action,r.entity);return <li key={r.id}><span className={'av-act-icon '+tone}><I size={14}/></span><span><strong>{label}</strong>{r.entity&&r.entity!==r.actor&&!GENERIC.has(r.entity)?<small>{r.entity}</small>:null}</span><time title={fullTime(r.created_at)}>{ago(r.created_at)}</time></li>})}</ol>}
   </section>
  </div>
  <div className="av-ov-grid">
   <section className="vault-card"><h3><FileText size={16}/>Website content</h3><div className="av-ov-tiles">{content.map(([l,n,v,I])=><button key={l} type="button" className={'av-ov-tile'+(l==='Pages to fix'&&n?' warn':'')} onClick={()=>go(v)}><I size={16}/><strong>{n}</strong><span>{l}</span></button>)}</div></section>
   <section className="vault-card"><h3><HeartPulse size={16}/>Health</h3><ul className="av-ov-health">
    <li><Mail size={15}/><span>Lead emails</span><b className={d.emailMode==='save-only'?'warn':'ok'}>{d.emailMode==='save-only'?'Off (saved only)':`On · ${d.emailMode==='smtp'?'SMTP':'Mailgun'}`}</b></li>
    <li><CalendarClock size={15}/><span>Scheduled jobs</span><b className={d.lastMaintenance&&now-Date.parse(d.lastMaintenance)<30*60000?'ok':'warn'}>{d.lastMaintenance?`Ran ${ago(d.lastMaintenance)}`:'Not run yet'}</b></li>
    <li><DatabaseBackup size={15}/><span>Last backup</span><b className={d.lastBackup?'ok':'warn'}>{d.lastBackup?ago(d.lastBackup):'None yet'}</b></li>
    <li><Inbox size={15}/><span>Failed lead emails</span><b className={d.failedDeliveries?'warn':'ok'}>{d.failedDeliveries||'None'}</b></li>
   </ul><button type="button" className="av-link" onClick={()=>go('health')}>System health<ArrowRight size={14}/></button></section>
  </div>
  <section className="vault-card"><h3>Quick actions</h3><div className="av-quick">{([['Edit a page','pages',FileText],['Write a blog post','blogs',PenLine],['Upload media','media',ImagePlus],['Check SEO','seo',Search],['Add a redirect','redirects',LinkIcon],['Schedule a post','schedules',CalendarClock]] as const).map(([l,v,I])=><button key={l} type="button" className="av-quick-item" onClick={()=>go(v)}><I size={18}/><span>{l}</span><ArrowRight size={14}/></button>)}</div></section>
 </div>;
}

// ── Scheduled publishing ────────────────────────────────────────────────────
const STATE:Record<string,[string,string]>={pending:['Waiting','av-pill-scheduled'],published:['Published','av-pill-live'],cancelled:['Cancelled','av-pill-draft'],conflict:['Skipped: page changed','av-pill-warn']};
function countdown(iso:string){const s=(Date.parse(iso)-Date.now())/1000;if(s<=0)return 'due now';if(s<3600)return `in ${Math.ceil(s/60)} min`;if(s<86400)return `in ${Math.round(s/3600)} h`;return `in ${Math.round(s/86400)} days`}
export function SchedulesPanel({docs,notice,open,reloadDocs}:{docs:any[];notice:Notice;open:(route:string)=>void;reloadDocs:()=>void}){
 const [rows,setRows]=useState<any[]|null>(null),[busy,setBusy]=useState(false),[adding,setAdding]=useState(false),[route,setRoute]=useState(''),[when,setWhen]=useState(''),[minLocal]=useState(()=>new Date(Date.now()+5*60000-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16));
 const load=()=>request('schedules?page=0').then(setRows).catch(e=>notice(e.message));
 useEffect(()=>{load()},[]);// eslint-disable-line react-hooks/exhaustive-deps
 async function act(fn:()=>Promise<unknown>,msg:string){setBusy(true);try{await fn();notice(msg);await load();reloadDocs()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 const label=(r:string)=>docs.find(d=>d.route===r)?.label||r;
 const upcoming=(rows||[]).filter(r=>r.state==='pending').sort((a,b)=>a.due.localeCompare(b.due)),past=(rows||[]).filter(r=>r.state!=='pending').sort((a,b)=>b.due.localeCompare(a.due));
 const candidates=docs.filter(d=>(d.status==='draft'||d.unpublishedChanges)&&!upcoming.some(u=>u.route===d.route));
 return <div className="av-schedules">
  <div className="vault-card av-traffic-hero on"><span className="av-backup-icon"><CalendarClock size={26}/></span><div><h2>{upcoming.length?`${upcoming.length} page${upcoming.length===1?'':'s'} waiting to publish`:'Nothing scheduled'}</h2><p>Pick a saved draft and a time. It goes live on its own within 10 minutes of that time, and is skipped if someone edits the page after scheduling, so nothing unreviewed is published.</p></div>{!adding&&<Button onClick={()=>{setAdding(true);setRoute(candidates[0]?.route||'');setWhen('')}}><Plus/>Schedule a page</Button>}</div>
  {adding&&<form className="vault-card av-redirect-form" onSubmit={e=>{e.preventDefault();const d=docs.find(x=>x.route===route);if(!d||!when)return;act(()=>request('schedule',{route,revision:d.revision,due:new Date(when).toISOString()}),`${d.label} will publish ${fullTime(new Date(when).toISOString())}.`).then(()=>setAdding(false))}}>
   <h2>Schedule a page</h2>
   {!candidates.length?<p className="muted">Every page is already live with no unpublished changes. Save a draft in the page editor first, then come back.</p>:<div className="av-route-pair" style={{gridTemplateColumns:'minmax(0,1.4fr) auto minmax(0,1fr)'}}><label>Page or post <small>drafts and pages with unpublished edits</small><select className="av-select" value={route} onChange={e=>setRoute(e.target.value)}>{candidates.map(d=><option key={d.route} value={d.route}>{d.label} ({d.route}){d.status==='draft'?' · draft':' · edits not live'}</option>)}</select></label><ArrowRight className="av-route-arrow" aria-hidden="true"/><label>Publish on<Input type="datetime-local" min={minLocal} value={when} onChange={e=>setWhen(e.target.value)} required/></label></div>}
   {when&&route&&<p className="av-sentence"><strong>{label(route)}</strong> will go live {fullTime(new Date(when).toISOString())} (your local time), exactly as it’s saved now.</p>}
   <div className="av-form-actions"><Button type="button" variant="outline" onClick={()=>setAdding(false)}>Cancel</Button><Button disabled={busy||!candidates.length||!when}>Schedule</Button></div>
  </form>}
  <section className="vault-card av-table-card"><div className="av-table-tools"><h2 className="av-table-title">Coming up</h2></div>
   {!rows&&<p className="av-empty" role="status">Loading…</p>}
   {rows&&!upcoming.length&&<p className="av-empty">Nothing waiting. Schedule a page above, or from the Publishing tab in any page editor.</p>}
   {upcoming.length>0&&<div className="av-table av-sched-table" role="table">{upcoming.map(r=><div key={r.route} className="av-tr" role="row"><span role="cell" className="av-cell-title"><button type="button" onClick={()=>open(r.route)}>{label(r.route)}</button><small>{r.route}{r.actor?` · scheduled by ${r.actor}`:''}</small></span><span role="cell" className="av-cell-title"><strong>{fullTime(r.due)}</strong><small>{countdown(r.due)}</small></span><span role="cell"><span className="av-pill av-pill-scheduled">Waiting</span></span><span role="cell" className="av-actions-cell"><Button variant="outline" size="sm" onClick={()=>open(r.route)}><Pencil/>Review</Button><Button variant="ghost" size="sm" disabled={busy} onClick={()=>{if(confirm(`Cancel the scheduled publish of ${label(r.route)}?`))act(()=>request('schedule-cancel',{route:r.route}),'Schedule cancelled. The draft is kept.')}}>Cancel</Button></span></div>)}</div>}
  </section>
  {past.length>0&&<section className="vault-card av-table-card"><div className="av-table-tools"><h2 className="av-table-title">History</h2></div><div className="av-table av-sched-table" role="table">{past.slice(0,30).map(r=>{const [l,c]=STATE[r.state]||[r.state,'av-pill-draft'];return <div key={r.route+r.due} className="av-tr" role="row"><span role="cell" className="av-cell-title"><button type="button" onClick={()=>open(r.route)}>{label(r.route)}</button><small>{r.route}</small></span><span role="cell" className="av-muted-cell">{fullTime(r.due)}</span><span role="cell"><span className={'av-pill '+c}>{l}</span></span><span role="cell"/></div>})}</div></section>}
 </div>;
}

// ── Categories & tags ───────────────────────────────────────────────────────
const slugify=(s:string)=>s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60);
export function TaxonomyPanel({docs,notice,open}:{docs:any[];notice:Notice;open:(route:string)=>void}){
 const [rows,setRows]=useState<any[]|null>(null),[busy,setBusy]=useState(false),[form,setForm]=useState<{id?:string;type:string;label:string;slug:string;auto:boolean}|null>(null),[showUses,setShowUses]=useState<string|null>(null),[q,setQ]=useState('');
 const load=()=>request('taxonomy?page=0').then(setRows).catch(e=>notice(e.message));
 useEffect(()=>{load()},[]);// eslint-disable-line react-hooks/exhaustive-deps
 const uses=useMemo(()=>{const m=new Map<string,any[]>();for(const d of docs){if(d.category)m.set(d.category,[...(m.get(d.category)||[]),d]);for(const t of d.tags||[])m.set(t,[...(m.get(t)||[]),d])}return m},[docs]);
 async function save(){if(!form)return;setBusy(true);try{await request('taxonomy',{id:form.id,type:form.type,label:form.label.trim(),slug:form.slug});notice(form.id?'Saved.':`${form.type==='category'?'Category':'Tag'} “${form.label}” added.`);setForm(null);await load()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 async function remove(r:any){if(!confirm(`Delete “${r.label}”?`))return;setBusy(true);try{await request('taxonomy-delete',{id:r.id});notice('Deleted.');await load()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 const group=(type:string)=>(rows||[]).filter(r=>r.type===type&&(r.label+' '+r.slug).toLowerCase().includes(q.toLowerCase()));
 const column=(type:string,title:string,icon:React.ReactNode,hint:string)=>{const list=group(type);return <section className="vault-card av-tax-col"><div className="av-ov-head"><h3>{icon}{title}<span className="av-count">{(rows||[]).filter(r=>r.type===type).length}</span></h3><Button variant="outline" size="sm" onClick={()=>setForm({type,label:'',slug:'',auto:true})}><Plus/>Add</Button></div><p className="muted">{hint}</p>
  {!rows?<p className="av-rule-empty">Loading…</p>:!list.length?<p className="av-rule-empty">{q?'Nothing matches.':`No ${title.toLowerCase()} yet.`}</p>:<ul className="av-tax-list">{list.map(r=>{const used=uses.get(r.id)||[];return <li key={r.id}><div className="av-tax-row"><span className="av-cell-title"><strong>{r.label}</strong><small>/{r.slug}/</small></span><button type="button" className="av-tax-uses" disabled={!used.length} onClick={()=>setShowUses(showUses===r.id?null:r.id)}>{used.length?`${used.length} post${used.length===1?'':'s'}`:'Unused'}</button><span className="av-actions-cell"><button type="button" className="av-icon-btn" aria-label={'Rename '+r.label} onClick={()=>setForm({id:r.id,type:r.type,label:r.label,slug:r.slug,auto:false})}><Pencil size={15}/></button><button type="button" className="av-icon-btn" aria-label={'Delete '+r.label} disabled={busy||used.length>0} title={used.length?'Remove it from every post first':'Delete'} onClick={()=>remove(r)}><Trash2 size={15}/></button></span></div>{showUses===r.id&&<ul className="av-tax-posts">{used.map(d=><li key={d.route}><button type="button" onClick={()=>open(d.route)}>{d.label}</button></li>)}</ul>}</li>})}</ul>}
 </section>};
 return <div className="av-taxonomy">
  <div className="vault-card av-traffic-hero on"><span className="av-backup-icon"><Tags size={26}/></span><div><h2>Organise your blog</h2><p>A <strong>category</strong> is the main topic a post belongs to (one per post). <strong>Tags</strong> are extra keywords (any number). Set them for each post in its editor, under Publishing.</p></div><label className="av-find" style={{marginLeft:'auto'}}><Search size={16} aria-hidden="true"/><Input aria-label="Search categories and tags" placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)}/></label></div>
  {form&&<form className="vault-card av-redirect-form" onSubmit={e=>{e.preventDefault();save()}}><h2>{form.id?'Edit':'New'} {form.type==='category'?'category':'tag'}</h2>
   <div className="av-grid-2"><label>Name<Input autoFocus required value={form.label} onChange={e=>setForm({...form,label:e.target.value,slug:form.auto?slugify(e.target.value):form.slug})} placeholder={form.type==='category'?'Local SEO':'google-maps'}/></label><label>Web address <small>lowercase, hyphens only</small><Input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={e=>setForm({...form,slug:slugify(e.target.value),auto:false})}/></label></div>
   {!form.id&&<fieldset className="av-choice"><legend>Type</legend>{([['category','Category','The main topic. Each post has one.'],['tag','Tag','A keyword. Posts can have many.']] as const).map(([v,t,d])=><label key={v} className={form.type===v?'selected':''}><input type="radio" checked={form.type===v} onChange={()=>setForm({...form,type:v})}/><strong>{t}</strong><small>{d}</small></label>)}</fieldset>}
   <div className="av-form-actions"><Button type="button" variant="outline" onClick={()=>setForm(null)}>Cancel</Button><Button disabled={busy||!form.label.trim()||!form.slug}>{form.id?'Save':'Add'}</Button></div>
  </form>}
  <div className="av-tax-grid">{column('category','Categories',<Folder size={16}/>,'Shown on posts and used to group them on the blog.')}{column('tag','Tags',<Hash size={16}/>,'Help related posts find each other.')}</div>
  {rows&&rows.length>0&&<p className="av-attrib"><CircleCheck size={13}/> Categories and tags that are still in use can’t be deleted. Remove them from those posts first.</p>}
 </div>;
}
```

### app/avault/page-canvas.tsx

<!-- avault-file path="app/avault/page-canvas.tsx" mode="owned" sha256="283213a5ab86006234e95204972ff6c47f68383fd7e1b2baac1d365c1415a4af" eol="1" -->
```tsx
'use client';
import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogMedia,AlertDialogTitle} from '@/components/ui/alert-dialog';
import {Monitor,Tablet,Smartphone,MousePointerClick,RefreshCw,RotateCcw,Upload,PanelsTopLeft,ArrowUp,ArrowDown,Copy,Eye,EyeOff,Trash2,Plus} from 'lucide-react';
import {SectionLibrary,type LibraryItem} from './section-library-dialog';
import {request} from './content-tools';
import {adminFetch} from './session';
import {CANVAS_CSS,friendly} from './navigation-editor';
import type {Doc} from '@/lib/avault/store';

// Live editor for a page's own content. The canvas is the unsaved draft rendered by the server with every
// {{fN}} spot tagged (data-av-k for text, data-av-a for attributes). Text is typed right on the page; links,
// images and labels open in the inspector. Edits go straight into the draft, so Undo, Save and Publish work
// as on every other tab. Shared site chrome is omitted here because it has its own editor.
// Sections (data-av-section) get a toolbar on hover: move and hide change the draft like any edit; adding a
// prebuilt section, duplicating and removing change the page's structure, so the server builds those and
// saves the draft straight away.
type Hover={id:string;label:string;top:number;left:number;width:number;height:number;hidden:boolean;h1:boolean};
type Selection={kind:'element';text:string[];attrs:{attr:string;key:string}[];title:string}|{kind:'form';keys:string[]}|{kind:'shared'};
type Confirmation={title:string;description:string;action:string;destructive?:boolean;run:()=>void|Promise<void>};
const DEVICES={desktop:{w:1440,icon:Monitor,label:'Desktop'},tablet:{w:820,icon:Tablet,label:'Tablet'},mobile:{w:390,icon:Smartphone,label:'Mobile'}} as const;
const pairs=(el:Element)=>(el.getAttribute('data-av-a')||'').split(',').filter(Boolean).map(p=>{const [attr,key]=p.split('=');return {attr,key}});
const PAGE_CSS=`
.site-loader,#page-curtain,.topbar,.header-wrap,.site-header,.site-footer,.back-to-top,body>header,body>footer{display:none!important}
.reveal,[class*="reveal"]{opacity:1!important;transform:none!important;visibility:visible!important}
[data-av-section].av-section-hover{outline:2px solid rgba(26,115,232,.45)!important;outline-offset:-2px}
[data-av-hidden]{opacity:.35;filter:grayscale(.6)}
`;
const isShared=(group?:string)=>group==='navigation'||group==='footer';
const structureKey=(d:Doc)=>JSON.stringify([d.sectionOrder,d.hiddenSections,d.blocks,d.template]);

export function PageCanvas({doc,setField,change,replace,revert,docs,go,notice,original}:{doc:Doc;setField:(key:string,value:string)=>void;change:(d:Doc)=>void;replace:(d:Doc)=>void;revert:()=>void;docs:any[];go:(view:string)=>void;notice:(s:string)=>void;original:Doc|null}){
 const [html,setHtml]=useState(''),[loading,setLoading]=useState(false),[sel,setSel]=useState<Selection|null>(null),[device,setDevice]=useState<keyof typeof DEVICES>('desktop'),[height,setHeight]=useState(1200),[width,setWidth]=useState(1000),[panelTop,setPanelTop]=useState(96),[media,setMedia]=useState<{src:string;alt:string}[]|null>(null),[uploading,setUploading]=useState(false),[hover,setHover]=useState<Hover|null>(null),[library,setLibrary]=useState<{after:string|null}|null>(null),[working,setWorking]=useState(false),[domOrder,setDomOrder]=useState<string[]>([]),[confirmation,setConfirmation]=useState<Confirmation|null>(null);
 const frame=useRef<HTMLIFrameElement>(null),wrap=useRef<HTMLDivElement>(null),bar=useRef<HTMLDivElement>(null),upload=useRef<HTMLInputElement>(null);
 // What the canvas DOM currently shows for each field, so only real changes (undo, inspector) are repainted.
 const painted=useRef(new Map<string,string>()),hoverEl=useRef<Element|null>(null),skipStructure=useRef('');
 const fieldRef=useRef(setField),docRef=useRef(doc);
 const byKey=useMemo(()=>new Map(doc.fields.map(f=>[f.key,f])),[doc.fields]);
 const byKeyRef=useRef(byKey);
 // The canvas's own listeners are attached once per load, so they read the latest values through refs.
 useLayoutEffect(()=>{fieldRef.current=setField;docRef.current=doc;byKeyRef.current=byKey});
 const startValue=useMemo(()=>new Map((original?.fields||[]).map(f=>[f.key,f.value])),[original]);
 const pageChanged=useMemo(()=>!!original&&JSON.stringify(doc)!==JSON.stringify(original),[doc,original]);

 const load=useCallback(async()=>{const d=docRef.current;setLoading(true);try{const r=await request('canvas',{document:d});painted.current=new Map(d.fields.map(f=>[f.key,f.value]));setSel(null);setHover(null);hoverEl.current=null;setHtml(r.html)}catch(e){notice((e as Error).message)}finally{setLoading(false)}},[notice]);
 // Sections, blocks and the order they appear in change the page's markup, so those reload the canvas.
 const structure=structureKey(doc);
 useEffect(()=>{if(skipStructure.current===structure){skipStructure.current='';return}const t=setTimeout(load,html?500:0);return()=>clearTimeout(t)},[structure]);// eslint-disable-line react-hooks/exhaustive-deps

 const frameDoc=()=>frame.current?.contentDocument||null;
 // Field changes made anywhere else (inspector, Undo/Redo, the All fields tab) are written into the canvas DOM.
 useEffect(()=>{const d=frameDoc();if(!d)return;for(const f of doc.fields){if(painted.current.get(f.key)===f.value)continue;painted.current.set(f.key,f.value);
  d.querySelectorAll(`[data-av-k="${f.key}"]`).forEach(el=>{if(el!==d.activeElement)el.textContent=f.value});
  d.querySelectorAll('[data-av-a]').forEach(el=>{for(const p of pairs(el))if(p.key===f.key)el.setAttribute(p.attr,f.value)})}
 },[doc.fields]);

 const place=useCallback((el:Element|null)=>{if(!el){setHover(null);return}const r=el.getBoundingClientRect();setHover({id:el.getAttribute('data-av-section')!,label:el.getAttribute('data-av-label')||'Section',top:r.top,left:r.left,width:r.width,height:r.height,hidden:el.hasAttribute('data-av-hidden'),h1:el.hasAttribute('data-av-h1')})},[]);
 const measure=useCallback(()=>{const d=frameDoc();if(d)setHeight(Math.max(d.documentElement.scrollHeight,400));place(hoverEl.current)},[place]);
 const clear=(d:Document)=>d.querySelectorAll('.av-selected').forEach(x=>x.classList.remove('av-selected'));
 const commit=(key:string,value:string)=>{painted.current.set(key,value);fieldRef.current(key,value)};

 const keysOf=(el:Element)=>[el.getAttribute('data-av-k'),...pairs(el).map(p=>p.key)].filter(Boolean) as string[];
 function decorateCanvas(d:Document){
  d.querySelectorAll('[data-av-k],[data-av-a]').forEach(el=>{const keys=keysOf(el);if(keys.length&&keys.every(k=>isShared(byKeyRef.current.get(k)?.group)))el.classList.add('av-shared')});
  d.querySelectorAll('form').forEach(f=>f.classList.add('av-form-lock'));
  setDomOrder([...d.querySelectorAll('[data-av-section]')].map(s=>s.getAttribute('data-av-section')!));
  const cloud=d.querySelector('.cloud-menu');if(cloud){cloud.classList.add('is-enhanced');cloud.querySelectorAll<HTMLElement>('.cloud-panel').forEach((p,i)=>p.hidden=i!==0)}
 }
 function onLoad(){const d=frameDoc();if(!d)return;let hover:Element|null=null,before='';
  decorateCanvas(d);
  d.addEventListener('mouseover',e=>{const t=(e.target as Element).closest('form.av-form-lock,[data-av-k],[data-av-a]');if(hover!==t){hover?.classList.remove('av-hover');t?.classList.add('av-hover');hover=t}
   const sec=(e.target as Element).closest('[data-av-section]');if(sec&&sec!==hoverEl.current){hoverEl.current?.classList.remove('av-section-hover');sec.classList.add('av-section-hover');hoverEl.current=sec;place(sec)}});
  d.addEventListener('mouseleave',()=>{hover?.classList.remove('av-hover');hover=null});
  d.addEventListener('click',e=>{const t=e.target as Element;if((t as HTMLElement).closest?.('[contenteditable="plaintext-only"]'))return;e.preventDefault();e.stopPropagation();
   const form=t.closest('form');if(form){clear(d);form.classList.add('av-selected');setSel({kind:'form',keys:[...new Set([...form.querySelectorAll('[data-av-k],[data-av-a]')].flatMap(keysOf))].filter(k=>byKeyRef.current.has(k))});return}
   const summary=t.closest('summary');if(summary&&!summary.classList.contains('av-selected')&&!summary.querySelector('.av-selected')){const det=summary.parentElement as HTMLDetailsElement;det.open=!det.open}
   const el=t.closest('[data-av-k],[data-av-a]');if(!el){clear(d);setSel(null);return}
   const shared=el.closest('.av-shared');if(shared){clear(d);shared.classList.add('av-selected');setSel({kind:'shared'});return}
   clear(d);
   const link=el.closest('a[data-av-a],button[data-av-a]'),own=el.getAttribute('data-av-k');
   const text=[...new Set([...(own?[own]:[]),...[...(link||el).querySelectorAll('[data-av-k]')].map(x=>x.getAttribute('data-av-k')!)])].filter(k=>byKeyRef.current.has(k)).slice(0,8);
   const attrs=[...pairs(el),...(link&&link!==el?pairs(link):[])].filter(a=>byKeyRef.current.has(a.key));
   (link&&link!==el&&el.tagName!=='IMG'?link:el).classList.add('av-selected');
   const name=el.tagName==='IMG'?'Image':link?.tagName==='A'?'Link':el.closest('h1,h2,h3,h4')?'Heading':el.closest('button')?'Button':el.closest('summary')?'Question':'Text';
   setSel({kind:'element',text,attrs,title:name});
   // Text is edited right where it sits.
   if(own&&!el.querySelector('[data-av-k]')&&byKeyRef.current.has(own)){const h=el as HTMLElement;before=byKeyRef.current.get(own)!.value;if(h.textContent!==before)h.textContent=before;h.contentEditable='plaintext-only';h.focus();const r=d.createRange();r.selectNodeContents(h);r.collapse(false);const s=d.getSelection();s?.removeAllRanges();s?.addRange(r)}
  },true);
  d.addEventListener('input',e=>{const el=(e.target as Element).closest?.('[data-av-k]');if(!el)return;const key=el.getAttribute('data-av-k')!;const f=byKeyRef.current.get(key);if(!f)return;let v=el.textContent||'';if(!before.includes('\u00a0'))v=v.replace(/\u00a0/g,' ');commit(key,v)});
  d.addEventListener('keydown',e=>{const a=d.activeElement as HTMLElement|null;if(!a?.isContentEditable)return;
   if(e.key==='Escape'){e.preventDefault();const key=a.getAttribute('data-av-k');if(key){a.textContent=before;commit(key,before)}a.blur()}
   else if(e.key==='Enter'&&!e.isComposing){e.preventDefault();a.blur()}
   // A space inside a question would otherwise open or close its answer.
   else if(e.key===' '&&a.closest('summary')){e.preventDefault();d.execCommand('insertText',false,' ')}
  });
  d.addEventListener('focusout',e=>{const el=e.target as HTMLElement;if(el.isContentEditable)el.contentEditable='false'});
  d.addEventListener('submit',e=>e.preventDefault(),true);
  new ResizeObserver(measure).observe(d.body);measure();
 }

 // The floating inspector sits just under the toolbar, wherever the toolbar is on screen.
 useEffect(()=>{const place=()=>{const b=bar.current?.getBoundingClientRect();if(b)setPanelTop(Math.max(16,b.bottom+12))};place();const o=new ResizeObserver(place);if(bar.current)o.observe(bar.current);addEventListener('scroll',place,true);addEventListener('resize',place);return()=>{o.disconnect();removeEventListener('scroll',place,true);removeEventListener('resize',place)}},[]);
 useEffect(()=>{const el=wrap.current;if(!el)return;setWidth(el.clientWidth);const o=new ResizeObserver(()=>setWidth(el.clientWidth));o.observe(el);return()=>o.disconnect()},[]);
 useEffect(()=>{if(sel?.kind==='element'&&sel.attrs.some(a=>a.attr==='src')&&!media)request('media').then((r:any)=>{const seen=new Set<string>();setMedia([...(r.uploaded||[]).map((m:any)=>({src:'/media/'+m.key,alt:m.alt||''})),...(r.existing||[])].filter(m=>m.src&&!seen.has(m.src)&&seen.add(m.src)))}).catch(()=>setMedia([]))},[sel,media]);

 async function uploadImage(file:File,srcKey:string){setUploading(true);try{const f=new FormData();f.set('file',file);f.set('alt','');const r=await adminFetch('media/',{method:'POST',body:f});const v:any=await r.json();if(!r.ok)throw new Error(v.error||'Upload failed');setField(srcKey,v.url);setMedia(m=>m&&[{src:v.url,alt:''},...m.filter(x=>x.src!==v.url)]);notice('Image uploaded. Add a description for people who can’t see it.')}catch(e){notice((e as Error).message)}finally{setUploading(false)}}
 function close(){setSel(null);const d=frameDoc();if(d)clear(d)}

 // Section order covers every section, hidden ones included (the canvas shows those faded).
 const order=()=>doc.sectionOrder||domOrder;
 async function paintStructure(next:Doc){const r=await request('canvas',{document:next}),parsed=new DOMParser().parseFromString(r.html,'text/html'),current=frameDoc(),from=parsed.querySelector('main'),to=current?.querySelector('main');if(!current||!from||!to){setHtml(r.html);return}const scroll=current.defaultView?.scrollY||0;to.innerHTML=from.innerHTML;painted.current=new Map(next.fields.map(f=>[f.key,f.value]));setSel(null);setHover(null);hoverEl.current=null;decorateCanvas(current);requestAnimationFrame(()=>{measure();current.defaultView?.scrollTo({top:scroll})})}
 async function updateStructure(next:Doc){setWorking(true);try{await paintStructure(next);skipStructure.current=structureKey(next);change(next)}catch(e){notice((e as Error).message)}finally{setWorking(false)}}
 function move(id:string,by:number){const o=[...order()],i=o.indexOf(id),j=i+by;if(i<0||j<0||j>=o.length)return;[o[i],o[j]]=[o[j],o[i]];void updateStructure({...doc,sectionOrder:o})}
 function toggleHidden(id:string){const h=doc.hiddenSections||[];void updateStructure({...doc,sectionOrder:order(),hiddenSections:h.includes(id)?h.filter(x=>x!==id):[...h,id]})}
 async function restructure(op:'insert'|'duplicate'|'remove',extra:Record<string,unknown>,done:string){setWorking(true);try{const next=await request('section-edit',{document:docRef.current,expectedRevision:docRef.current.revision,op,...extra});await paintStructure(next);skipStructure.current=structureKey(next);replace(next);setLibrary(null);notice(done)}catch(e){notice((e as Error).message)}finally{setWorking(false)}}
 const addFrom=(item:LibraryItem)=>restructure('insert',{source:{route:item.route,section:item.section},after:library?.after??null},`${item.type} section added and the draft saved. Click its text to make it yours.`);
 const remove=(id:string,label:string)=>setConfirmation({title:`Remove ${label.toLowerCase()} section?`,description:'The section and its text will be removed and the draft will save immediately. You can restore it later from Revisions.',action:'Remove section',destructive:true,run:()=>void restructure('remove',{section:id},'Section removed and the draft saved.')});
 async function revertPage(){if(!original)return;setWorking(true);try{await paintStructure(original);skipStructure.current=structureKey(original);revert();notice('All unsaved page changes were reverted to the last saved draft.')}catch(e){notice((e as Error).message)}finally{setWorking(false)}}

 // The editor's outlines and hover states go into the page alongside its own stylesheets.
 const srcDoc=useMemo(()=>html.replace(/\s+inert(?=[\s>])/g,'').replace('</head>',()=>`<style>${CANVAS_CSS}${PAGE_CSS}</style></head>`),[html]);
 const D=DEVICES[device],scale=Math.min(1,width/D.w),offset=Math.max(0,(width-D.w*scale)/2);
 const fieldInput=(key:string,label?:string)=>{const f=byKey.get(key);if(!f)return null;const was=startValue.get(key),changed=was!==undefined&&f.value!==was;
  return <label key={key} className="av-nav-field"><span>{label||friendly(f.label)}{changed&&<Badge variant="outline">edited</Badge>}</span>{f.kind==='url'?<Input list="av-page-destinations" value={f.value} onChange={e=>setField(key,e.target.value)}/>:f.value.length>90?<Textarea rows={4} value={f.value} onChange={e=>setField(key,e.target.value)}/>:<Input value={f.value} onChange={e=>setField(key,e.target.value)}/>}{changed&&<button type="button" className="av-link" onClick={()=>setField(key,was!)}><RotateCcw size={13}/>Restore “{was!.slice(0,40)}”</button>}</label>};
 const imageTools=(srcKey:string)=>{const src=byKey.get(srcKey)?.value||'';return <div className="av-canvas-image" key={'img-'+srcKey}>
  {src&&<img src={src} alt=""/>}
  <input ref={upload} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml" hidden onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)uploadImage(file,srcKey)}}/>
  <Button variant="outline" disabled={uploading} onClick={()=>upload.current?.click()}><Upload/>{uploading?'Uploading…':'Upload a new image'}</Button>
  {media&&media.length>0&&<label className="av-nav-field"><span>Or choose from the media library</span><select value="" onChange={e=>{if(e.target.value)setField(srcKey,e.target.value)}}><option value="">Choose an image…</option>{media.map(m=><option key={m.src} value={m.src}>{m.alt||m.src.split('/').pop()}</option>)}</select></label>}
 </div>};

 return <div className="av-nav av-page-canvas">
  <datalist id="av-page-destinations">{docs.filter(d=>d.status==='published').map(d=><option key={d.route} value={d.route}>{d.label}</option>)}</datalist>
  <div className="vault-card av-nav-toolbar" ref={bar}>
   <div className="av-seg" role="group" aria-label="Preview size">{(Object.keys(DEVICES) as (keyof typeof DEVICES)[]).map(k=>{const I=DEVICES[k].icon;return <button key={k} type="button" className={device===k?'selected':''} onClick={()=>setDevice(k)} aria-pressed={device===k}><I size={16}/>{DEVICES[k].label}</button>})}</div>
   <span className="av-nav-hint"><MousePointerClick size={16}/>Click text to type over it · hover a section to move, hide or add one</span>
   <span className="av-nav-actions"><Button variant="outline" onClick={()=>{const o=order();setLibrary({after:o[o.length-1]||null})}} disabled={working||!html}><Plus/>Add section</Button><Button variant="outline" onClick={()=>setConfirmation({title:'Revert the whole page?',description:'Every unsaved text, image, SEO, section order, visibility and content-block change on this page will return to the last saved draft.',action:'Revert unsaved changes',run:revertPage})} disabled={working||!pageChanged}><RotateCcw/>Revert page</Button><Button variant="outline" onClick={load} disabled={loading||working}><RefreshCw/>{loading?'Loading…':'Refresh'}</Button></span>
  </div>
  <div className="av-nav-layout">
   <div className="av-nav-stage" ref={wrap} onMouseLeave={()=>{hoverEl.current?.classList.remove('av-section-hover');hoverEl.current=null;setHover(null)}}>{html?<div style={{height:height*scale,position:'relative'}}><iframe ref={frame} title="Live page editor" srcDoc={srcDoc} onLoad={onLoad} style={{width:D.w,height,transform:`scale(${scale})`,transformOrigin:'0 0',position:'absolute',left:offset}}/>
    {hover&&<SectionTools hover={hover} order={order()} scale={scale} offset={offset} working={working} move={move} toggleHidden={toggleHidden} duplicate={id=>restructure('duplicate',{section:id,after:id},'Section duplicated and the draft saved.')} remove={remove} add={id=>setLibrary({after:id})}/>}
   </div>:<p role="status" style={{padding:24}}>Loading the page…</p>}</div>
   {sel&&<aside className="vault-card av-nav-inspector" aria-label="Edit selection" style={{top:panelTop,maxHeight:`calc(100vh - ${panelTop+24}px)`}}><button type="button" className="av-nav-close" aria-label="Close" onClick={close}>×</button>
    {sel.kind==='shared'&&<><p className="eyebrow">Shared on every page</p><h2>Header & footer</h2><p>This part of the page is the same on every page, so it’s edited in one place.</p><Button onClick={()=>go('navigation')}><PanelsTopLeft/>Edit header & footer</Button></>}
    {sel.kind==='form'&&<><p className="eyebrow">Selected</p><h2>Form</h2><p>Fields, choices and where requests go are set in <b>Forms</b>.</p>{sel.keys.filter(k=>!isShared(byKey.get(k)?.group)).map(k=>fieldInput(k,`${friendly(byKey.get(k)!.label)}: “${byKey.get(k)!.value.slice(0,28)}”`))}<Button variant="outline" onClick={()=>go('site-forms')}>Open Forms</Button></>}
    {sel.kind==='element'&&<><p className="eyebrow">Selected</p><h2>{sel.title}</h2>
     {sel.attrs.filter(a=>a.attr==='src').map(a=>imageTools(a.key))}
     {sel.text.map(k=>fieldInput(k,sel.text.length>1?`Text: “${(byKey.get(k)?.value||'').slice(0,28)}”`:undefined))}
     {sel.attrs.map(a=>fieldInput(a.key))}
     {!sel.text.length&&!sel.attrs.length&&<p>Nothing to edit here.</p>}
     <Button variant="outline" onClick={close}>Done</Button></>}
   </aside>}
  </div>
  <SectionLibrary open={!!library} route={doc.route} busy={working} onClose={()=>setLibrary(null)} onPick={addFrom}/>
  <AlertDialog open={!!confirmation} onOpenChange={open=>{if(!open)setConfirmation(null)}}><AlertDialogContent className="av-editor-confirm"><AlertDialogHeader><AlertDialogMedia className={confirmation?.destructive?'danger':''}>{confirmation?.destructive?<Trash2/>:<RotateCcw/>}</AlertDialogMedia><AlertDialogTitle>{confirmation?.title}</AlertDialogTitle><AlertDialogDescription>{confirmation?.description}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction variant={confirmation?.destructive?'destructive':'default'} onClick={()=>{const action=confirmation?.run;setConfirmation(null);void action?.()}}>{confirmation?.action}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
 </div>;
}

// The hovered section's outline toolbar and “Add section” button, drawn over the scaled canvas.
function SectionTools({hover,order,scale,offset,working,move,toggleHidden,duplicate,remove,add}:{hover:Hover;order:string[];scale:number;offset:number;working:boolean;move:(id:string,by:number)=>void;toggleHidden:(id:string)=>void;duplicate:(id:string)=>void;remove:(id:string,label:string)=>void;add:(after:string)=>void}){
 const i=order.indexOf(hover.id);
 return <div className="av-section-frame" style={{top:hover.top*scale,left:offset+hover.left*scale,width:hover.width*scale,height:hover.height*scale}}>
  <div className="av-section-tools" role="toolbar" aria-label={`${hover.label} section`}><span>{hover.label}{hover.hidden&&<em>Hidden</em>}</span>
   <button type="button" title="Move this section up" aria-label="Move section up" disabled={working||i<=0} onClick={()=>move(hover.id,-1)}><ArrowUp size={15}/><small>Up</small></button>
   <button type="button" title="Move this section down" aria-label="Move section down" disabled={working||i<0||i>=order.length-1} onClick={()=>move(hover.id,1)}><ArrowDown size={15}/><small>Down</small></button>
   <button type="button" title="Duplicate" aria-label="Duplicate section" disabled={working||hover.h1} onClick={()=>duplicate(hover.id)}><Copy size={15}/></button>
   <button type="button" title={hover.hidden?'Show on the page':'Hide from the page'} aria-label={hover.hidden?'Show section':'Hide section'} disabled={working||hover.h1} onClick={()=>toggleHidden(hover.id)}>{hover.hidden?<Eye size={15}/>:<EyeOff size={15}/>}</button>
   <button type="button" title="Remove" aria-label="Remove section" disabled={working||hover.h1} onClick={()=>remove(hover.id,hover.label)}><Trash2 size={15}/></button>
  </div>
  <button type="button" className="av-section-add" disabled={working} onClick={()=>add(hover.id)}><Plus size={14}/>Add section</button>
 </div>;
}
```

### app/avault/page.tsx

<!-- avault-file path="app/avault/page.tsx" mode="owned" sha256="41acafda20408cd5c3eb90bd4f2ec5b8185f44aefa73ea2de5568211e7d5418f" eol="1" -->
```tsx
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {sessionUser} from '@/lib/avault/auth';
import Vault from './vault';
export const dynamic='force-dynamic';
export const metadata={title:'AVAULT | DMV Commercial Door Repair',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const params=await searchParams;const user=await sessionUser(new Request('https://app.local',{headers:await headers()}));
 if(!user){const back=new URLSearchParams(Object.entries(params).flatMap(([k,v])=>typeof v==='string'?[[k,v]]:[]));const query=back.toString();redirect('/avault/login/?next='+encodeURIComponent('/avault/'+(query?'?'+query:'')))}
 const view=params.view;
 // The leads inbox used to live at ?view=forms; old bookmarks and emails land on the new address.
 if(view==='forms')redirect('/avault/?view=leads');
 return <Vault email={user.email} role={user.role} initialView={typeof view==='string'?view:'overview'}/>}
```

### app/avault/panels.tsx

<!-- avault-file path="app/avault/panels.tsx" mode="owned" sha256="713b7a6e0076d921e1befb94802b580e5ff2d1ae3841e56d33a381221f66575c" eol="1" -->
```tsx
'use client';
import {useEffect,useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import type {Doc} from '@/lib/avault/store';

const when=(s?:string|null)=>s?new Date(s).toLocaleString():'—';

// ── Page / post search & sharing ────────────────────────────────────────────
export function SeoTab({doc,set,setDoc,titleTemplate}:{doc:Doc;set:(k:string,v:unknown)=>void;setDoc:(fn:(d:Doc)=>Doc)=>void;titleTemplate:string}){const s=doc.seo;const title=s.title||titleTemplate.replace('%s',doc.label);const post=doc.kind==='post'||doc.kind==='case-study';const top=(k:keyof Doc,v:unknown)=>setDoc(d=>({...d,[k]:v}));
 return <div className="vault-settings"><section className="vault-card"><div className="av-card-heading"><div><h2>Search appearance</h2><p className="muted">Control how this page is presented in search and social results.</p></div><Button asChild variant="outline"><a href={doc.route} target="_blank" rel="noreferrer"><ArrowUpRight/>View live page</a></Button></div><label>Search title<Input value={s.title} onChange={e=>set('title',e.target.value)} placeholder={titleTemplate.replace('%s',doc.label)}/><small>{title.length} characters{!s.title?' · using the site title template':''}{title.length>65?' · may be cut off in results':''}</small></label><label>Description<Textarea value={s.description} onChange={e=>set('description',e.target.value)}/><small>{s.description.length} characters{s.description.length>170?' · may be cut off':''}</small></label><label>Canonical (automatic)<Input readOnly value={s.canonical}/></label><div className="search-preview"><small>{s.canonical}</small><h3>{title}</h3><p>{s.description||doc.excerpt}</p></div></section>
 <section className="vault-card"><h2>Indexing</h2><label className="inline"><input type="checkbox" checked={!!s.noindex} onChange={e=>set('noindex',e.target.checked)}/>Hide from search engines (noindex; also removed from sitemaps)</label><label className="inline"><input type="checkbox" checked={!!s.nofollow} onChange={e=>set('nofollow',e.target.checked)}/>Don’t follow links on this page (nofollow)</label><label className="inline"><input type="checkbox" checked={!!s.noarchive} onChange={e=>set('noarchive',e.target.checked)}/>Don’t show cached copies (noarchive)</label><label className="inline"><input type="checkbox" checked={s.sitemap!==false} onChange={e=>set('sitemap',e.target.checked)} disabled={!!s.noindex}/>Include in the sitemap</label></section>
 <section className="vault-card"><h2>Social sharing</h2><label>Sharing title (optional)<Input value={s.ogTitle||''} onChange={e=>set('ogTitle',e.target.value)} placeholder={title}/></label><label>Sharing description (optional)<Textarea value={s.ogDescription||''} onChange={e=>set('ogDescription',e.target.value)} placeholder={s.description}/></label><label>Social image URL<Input value={s.image} onChange={e=>set('image',e.target.value)} placeholder={doc.featuredImage||'site default image'}/></label><label>Social image description<Input value={s.imageAlt} onChange={e=>set('imageAlt',e.target.value)}/></label><label>Twitter / X card<select value={s.twitterCard||'summary_large_image'} onChange={e=>set('twitterCard',e.target.value)}><option value="summary_large_image">Large image</option><option value="summary">Small square image</option></select></label></section>
 {post&&<section className="vault-card"><h2>Article details</h2><label>Author name<Input value={doc.author||''} onChange={e=>top('author',e.target.value)} placeholder="Leave blank to credit DMV Commercial Door Repair"/></label><label>Author profile URL (optional)<Input value={doc.authorUrl||''} onChange={e=>top('authorUrl',e.target.value)}/></label><label>Excerpt<Textarea value={doc.excerpt||''} onChange={e=>top('excerpt',e.target.value)}/><small>Shown on the blog index and used when the description is empty.</small></label><label>Featured image URL<Input value={doc.featuredImage||''} onChange={e=>top('featuredImage',e.target.value)} placeholder="/media/…"/></label><label>Featured image description<Input value={doc.featuredAlt||''} onChange={e=>top('featuredAlt',e.target.value)}/></label>{doc.featuredImage&&<img src={doc.featuredImage} alt={doc.featuredAlt||''} style={{width:320,height:'auto',borderRadius:8}}/>}{doc.publishedAt&&<p><small>First published {when(doc.publishedAt)}. Later edits update the modified date only.</small></p>}</section>}
 <section className="vault-card"><h2>Structured data</h2><p>Organization, WebSite, WebPage, breadcrumbs, {post?'Article, ':''}{doc.kind==='service'?'Service, ':''}and FAQ (from visible FAQ sections) are generated automatically. Add extra JSON-LD for this page only, e.g. a HowTo or VideoObject. It must describe content that’s visible on the page.</p><label>Additional JSON-LD<Textarea rows={8} value={s.schema||''} onChange={e=>set('schema',e.target.value)} placeholder={'{"@type":"VideoObject","name":"…","contentUrl":"…"}'} style={{fontFamily:'monospace'}}/></label></section></div>}

// ── Revision diff ───────────────────────────────────────────────────────────
export function RevisionDiff({before,after}:{before:Doc;after:Doc}){const changes:{where:string;from:string;to:string}[]=[];
 for(const f of after.fields||[]){const old=before.fields?.find(x=>x.key===f.key);if(old?.value!==f.value)changes.push({where:`${f.section} · ${f.label}`,from:old?.value??'',to:f.value})}
 const seoKeys=['title','description','image','imageAlt','noindex','nofollow','noarchive','sitemap','ogTitle','ogDescription','twitterCard','schema'] as const;for(const k of seoKeys){const a=String((before.seo as any)?.[k]??''),b=String((after.seo as any)?.[k]??'');if(a!==b)changes.push({where:'Search · '+k,from:a,to:b})}
 for(const k of ['label','author','authorUrl','excerpt','featuredImage','featuredAlt','category'] as const){const a=String(before[k]??''),b=String(after[k]??'');if(a!==b)changes.push({where:k,from:a,to:b})}
 if(JSON.stringify(before.sectionOrder||[])!==JSON.stringify(after.sectionOrder||[])||JSON.stringify(before.hiddenSections||[])!==JSON.stringify(after.hiddenSections||[]))changes.push({where:'Section order / visibility',from:(before.hiddenSections||[]).join(', ')||'all visible',to:(after.hiddenSections||[]).join(', ')||'all visible'});
 {const a=(before.tags||[]).join(', '),b=(after.tags||[]).join(', ');if(a!==b)changes.push({where:'tags',from:a,to:b})}
 // Article bodies are HTML: compare and show their text, trimmed so a long post doesn't flood the table.
 {const text=(h?:string)=>String(h||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim(),a=text(before.body),b=text(after.body);if((before.body||'')!==(after.body||''))changes.push({where:'Article',from:a.length>600?a.slice(0,600)+'…':a,to:a===b?'(formatting changed)':b.length>600?b.slice(0,600)+'…':b})}
 if(before.template!==after.template)changes.push({where:'Page structure',from:`${(before.fields||[]).length} fields`,to:`${(after.fields||[]).length} fields (sections added or removed)`});
 if(JSON.stringify(before.blocks||[])!==JSON.stringify(after.blocks||[]))changes.push({where:'Additional content blocks',from:`${(before.blocks||[]).length} block(s)`,to:`${(after.blocks||[]).length} block(s)`});
 if(!changes.length)return <p>No content differences.</p>;
 return <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}><thead><tr><th style={{textAlign:'left',padding:8}}>Where</th><th style={{textAlign:'left',padding:8}}>Before</th><th style={{textAlign:'left',padding:8}}>After</th></tr></thead><tbody>{changes.map((c,i)=><tr key={i} style={{borderTop:'1px solid #eef0f4',verticalAlign:'top'}}><td style={{padding:8}}><strong>{c.where}</strong></td><td style={{padding:8,background:'#fdecea',overflowWrap:'anywhere'}}>{c.from||<em>empty</em>}</td><td style={{padding:8,background:'#e6f4ea',overflowWrap:'anywhere'}}>{c.to||<em>empty</em>}</td></tr>)}</tbody></table></div>}

// ── Device preview ──────────────────────────────────────────────────────────
export function PreviewFrame({html,close}:{html:string;close:()=>void}){const [size,setSize]=useState<'desktop'|'tablet'|'mobile'>('desktop');const width={desktop:'100%',tablet:'820px',mobile:'390px'}[size];
 useEffect(()=>{const before=document.body.style.overflow;document.body.style.overflow='hidden';const key=(e:KeyboardEvent)=>{if(e.key==='Escape')close()};addEventListener('keydown',key);return()=>{document.body.style.overflow=before;removeEventListener('keydown',key)}},[close]);
 return <section className="vault-preview av-preview-full" role="dialog" aria-modal="true" aria-label="Full page draft preview"><div className="av-preview-bar"><div><strong>Unsaved draft preview</strong><small>Real frontend styles and animations</small></div><div className="actions">{(['desktop','tablet','mobile'] as const).map(s=><Button key={s} variant={size===s?'default':'outline'} onClick={()=>setSize(s)}>{s[0].toUpperCase()+s.slice(1)}</Button>)}<Button variant="outline" onClick={close}>Close preview</Button></div></div><div className="av-preview-stage"><iframe title="Exact page preview" srcDoc={html} sandbox="allow-same-origin allow-scripts allow-forms" style={{width,maxWidth:'100%'}}/></div></section>}
```

### app/avault/people-views.tsx

<!-- avault-file path="app/avault/people-views.tsx" mode="owned" sha256="eaf27fe0d660c5b8123a340e177c6aef85d6087968a8bf2f0ac653f2ae8ef69c" eol="1" -->
```tsx
'use client';
import {useEffect,useMemo,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Users,UserPlus,KeyRound,Eye,EyeOff,Mail,Send,CircleCheck,X,Building2,Phone,MapPin,Clock,Share2,Search,Activity,MousePointerClick,Globe,FileText,Inbox,ChevronDown,RefreshCw,Wand2} from 'lucide-react';
import {request} from './content-tools';
import {adminFetch} from './session';

// AVAULT → Users, Email, Site settings, Visitors and Calls.
type Notice=(s:string)=>void;
const fullTime=(iso?:string|null)=>iso?new Date(iso).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):'—';
function ago(iso?:string|null){if(!iso)return 'never';const s=(Date.now()-new Date(iso).getTime())/1000;if(s<60)return 'just now';if(s<3600)return Math.floor(s/60)+' min ago';if(s<86400)return Math.floor(s/3600)+' h ago';if(s<86400*30)return Math.floor(s/86400)+' d ago';return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
const regionName=(c:string)=>{if(!/^[A-Z]{2}$/.test(c||''))return 'Unknown';try{return new Intl.DisplayNames(['en'],{type:'region'}).of(c)||c}catch{return c}};
const initials=(e:string)=>(e.split('@')[0].split(/[._-]/).filter(Boolean).slice(0,2).map(x=>x[0]).join('')||'?').toUpperCase();
const Switch=({on,set,label,large,disabled}:{on:boolean;set:(v:boolean)=>void;label?:string;large?:boolean;disabled?:boolean})=><button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} className={'av-switch'+(large?' av-switch-lg':'')+(on?' on':'')} onClick={()=>set(!on)}><span/>{on?'On':'Off'}</button>;
const SaveBar=({dirty,busy,discard,save,label='Save changes'}:{dirty:boolean;busy:boolean;discard:()=>void;save:()=>void;label?:string})=>dirty?<div className="av-savebar show" role="region" aria-label="Unsaved changes"><span>You have unsaved changes.</span><span className="actions"><Button variant="outline" disabled={busy} onClick={discard}>Discard</Button><Button disabled={busy} onClick={save}>{busy?'Saving…':label}</Button></span></div>:null;
function Password({value,set,placeholder,autoComplete='new-password',label}:{value:string;set:(v:string)=>void;placeholder?:string;autoComplete?:string;label:string}){const [show,setShow]=useState(false);return <div className="av-password"><Input type={show?'text':'password'} aria-label={label} value={value} onChange={e=>set(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} spellCheck={false}/><button type="button" className="av-password-toggle" aria-label={show?'Hide':'Show'} aria-pressed={show} onClick={()=>setShow(!show)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div>}
const strongPassword=()=>{const a='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';const b=new Uint32Array(18);crypto.getRandomValues(b);return [...b].map(n=>a[n%a.length]).join('')};
const Bars=({rows,label,onPick,picked}:{rows:{key:string;n:number}[];label:(k:string)=>string;onPick?:(k:string)=>void;picked?:string})=>{const max=Math.max(1,...rows.map(r=>r.n));return rows.length?<ul className="av-bars">{rows.map(r=><li key={r.key}><button type="button" disabled={!onPick} className={picked===r.key?'picked':''} onClick={()=>onPick?.(picked===r.key?'':r.key)} title={onPick?(picked===r.key?'Show all':'Filter by this'):undefined}><span className="av-bar-label">{label(r.key)}</span><span className="av-bar-n">{r.n.toLocaleString()}</span><span className="av-bar" style={{width:`${Math.max(4,r.n/max*100)}%`}}/></button></li>)}</ul>:<p className="av-rule-empty">Nothing yet.</p>};
const RANGES:[string,string][]=[['1','Today'],['7','7 days'],['30','30 days'],['90','90 days'],['0','All time']];

// ── Users ───────────────────────────────────────────────────────────────────
export function UsersPanel({email,role,notice}:{email:string;role:string;notice:Notice}){
 const [rows,setRows]=useState<any[]|null>(null),[adding,setAdding]=useState(false),[form,setForm]=useState({email:'',password:'',role:'administrator'}),[reset,setReset]=useState<{email:string;password:string}|null>(null),[busy,setBusy]=useState(false),[pw,setPw]=useState({current:'',password:'',confirm:''});
 const load=()=>request('users').then(setRows).catch(e=>notice(e.message));
 useEffect(()=>{if(role==='owner')load()},[]);// eslint-disable-line react-hooks/exhaustive-deps
 async function act(fn:()=>Promise<unknown>,msg?:string){setBusy(true);try{await fn();if(msg)notice(msg);if(role==='owner')await load()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 const owners=(rows||[]).filter(r=>r.role==='owner'&&r.active).length;
 return <div className="av-users">
  {role==='owner'&&<>
   <div className="vault-card av-traffic-hero on"><span className="av-backup-icon"><Users size={26}/></span><div><h2>{rows?`${rows.length} user${rows.length===1?'':'s'}`:'Users'}</h2><p>Everyone signs in with their own email and password. <strong>Owners</strong> manage users, settings, email, scripts and backups. <strong>Administrators</strong> edit content and work with leads.</p></div>{!adding&&<Button onClick={()=>{setAdding(true);setForm({email:'',password:strongPassword(),role:'administrator'})}}><UserPlus/>Add a user</Button>}</div>
   {adding&&<form className="vault-card av-redirect-form" onSubmit={e=>{e.preventDefault();act(async()=>{await request('users',{email:form.email,password:form.password,role:form.role,active:true});setAdding(false)},`${form.email} can sign in now. Send them their temporary password securely.`)}}>
    <h2>New user</h2>
    <div className="av-route-pair" style={{gridTemplateColumns:'1fr 1fr'}}><label>Email<Input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="name@company.com" autoFocus/></label><label>Temporary password <small>12+ characters, they can change it later</small><div className="av-pw-row"><Password label="Temporary password" value={form.password} set={v=>setForm({...form,password:v})}/><Button type="button" variant="outline" size="sm" onClick={()=>setForm({...form,password:strongPassword()})}><Wand2/>New</Button><Button type="button" variant="outline" size="sm" onClick={()=>navigator.clipboard?.writeText(form.password).then(()=>notice('Password copied.'))}>Copy</Button></div></label></div>
    <fieldset className="av-choice"><legend>Role</legend>{([['administrator','Administrator','Edits pages, blogs and media, and works with leads.'],['owner','Owner','Everything, including users, email, scripts, traffic and backups.']] as const).map(([v,t,d])=><label key={v} className={form.role===v?'selected':''}><input type="radio" checked={form.role===v} onChange={()=>setForm({...form,role:v})}/><strong>{t}</strong><small>{d}</small></label>)}</fieldset>
    <div className="av-form-actions"><Button type="button" variant="outline" onClick={()=>setAdding(false)}>Cancel</Button><Button disabled={busy||form.password.length<12}>Add user</Button></div>
   </form>}
   <section className="vault-card av-table-card">
    {!rows&&<p className="av-empty" role="status">Loading users…</p>}
    {rows&&<div className="av-table av-users-table" role="table" aria-label="Users">
     <div className="av-tr av-th" role="row"><span role="columnheader">User</span><span role="columnheader">Role</span><span role="columnheader">Status</span><span role="columnheader">Last sign-in</span><span role="columnheader"><span className="sr-only">Actions</span></span></div>
     {rows.map(r=>{const me=r.email===email;return <div key={r.email} className="av-user-row">
      <div className={'av-tr'+(r.active?'':' av-row-off')} role="row">
       <span role="cell" className="av-user-cell"><span className="av-avatar lg" aria-hidden="true">{initials(r.email)}</span><span className="av-cell-title"><strong>{r.email}{me&&<em className="av-you">You</em>}</strong><small>Added {r.created_at?new Date(r.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'}</small></span></span>
       <span role="cell"><select className="av-inline-select" value={r.role} disabled={busy||(me&&owners<=1)} aria-label={'Role for '+r.email} onChange={e=>act(()=>request('users',{email:r.email,role:e.target.value}),`${r.email} is now ${e.target.value==='owner'?'an owner':'an administrator'}.`)}><option value="owner">Owner</option><option value="administrator">Administrator</option></select></span>
       <span role="cell">{me?<span className="av-pill av-pill-live">Active</span>:<Switch on={!!r.active} label={'Allow '+r.email+' to sign in'} disabled={busy} set={v=>act(()=>request('users',{email:r.email,active:v}),v?`${r.email} can sign in again.`:`${r.email} can no longer sign in.`)}/>}</span>
       <span role="cell" className="av-muted-cell" title={fullTime(r.last_login_at)}>{ago(r.last_login_at)}</span>
       <span role="cell" className="av-actions-cell">{!me&&<><Button variant="outline" size="sm" disabled={busy} onClick={()=>setReset(reset?.email===r.email?null:{email:r.email,password:strongPassword()})}><KeyRound/>Reset password</Button><Button variant="ghost" size="sm" disabled={busy} onClick={()=>{if(confirm(`Delete ${r.email}? They will be signed out and can’t sign in again.`))act(()=>request('user-delete',{email:r.email}),`${r.email} deleted.`)}}>Delete</Button></>}</span>
      </div>
      {reset?.email===r.email&&<form className="av-inline-panel" onSubmit={e=>{e.preventDefault();act(async()=>{await request('users',{email:r.email,password:reset!.password});setReset(null)},`New password set. ${r.email} has been signed out everywhere.`)}}><label>New password for {r.email}<div className="av-pw-row"><Password label="New password" value={reset!.password} set={v=>setReset({email:r.email,password:v})}/><Button type="button" variant="outline" size="sm" onClick={()=>setReset({email:r.email,password:strongPassword()})}><Wand2/>New</Button><Button type="button" variant="outline" size="sm" onClick={()=>navigator.clipboard?.writeText(reset!.password).then(()=>notice('Password copied.'))}>Copy</Button></div></label><div className="av-form-actions"><Button type="button" variant="outline" size="sm" onClick={()=>setReset(null)}>Cancel</Button><Button size="sm" disabled={busy||reset!.password.length<12}>Set password</Button></div></form>}
     </div>})}
    </div>}
   </section>
  </>}
  <form className="vault-card av-mypw" onSubmit={e=>{e.preventDefault();if(pw.password!==pw.confirm)return notice('The new passwords do not match.');act(async()=>{await request('password',{current:pw.current,password:pw.password});location.href='/avault/login/'})}}>
   <div><h2><KeyRound size={18}/>Your password</h2><p className="muted">Signed in as {email}. Changing it signs you out on every device.</p></div>
   <input type="email" name="username" autoComplete="username" value={email} readOnly hidden/>
   <div className="av-mypw-fields"><label>Current password<Password label="Current password" autoComplete="current-password" value={pw.current} set={v=>setPw({...pw,current:v})}/></label><label>New password <small>12–128 characters</small><Password label="New password" value={pw.password} set={v=>setPw({...pw,password:v})}/></label><label>Repeat new password<Password label="Repeat new password" value={pw.confirm} set={v=>setPw({...pw,confirm:v})}/></label></div>
   <div className="av-form-actions">{pw.password&&pw.confirm&&pw.password!==pw.confirm&&<span className="av-rule-err">The new passwords don’t match.</span>}<Button disabled={busy||!pw.current||pw.password.length<12||pw.password!==pw.confirm}>Change password</Button></div>
  </form>
 </div>;
}

// ── Email ───────────────────────────────────────────────────────────────────
const PROVIDERS=[{k:'gmail',t:'Gmail or Google Workspace',d:'Send from your Google account with an app password.'},{k:'smtp',t:'Other SMTP',d:'Outlook, Zoho, your host’s mail server and others.'},{k:'mailgun',t:'Mailgun',d:'A sending service with your own domain.'}] as const;
export function EmailSetup({role,notice}:{role:string;notice:Notice}){
 const [v,setV]=useState<any>(null),[saved,setSaved]=useState(''),[rev,setRev]=useState(0),[busy,setBusy]=useState(false),[recipient,setRecipient]=useState(''),[tested,setTested]=useState<string|null>(null);
 const clean=(x:any)=>({...x,mailgun:{...x.mailgun,key:''},smtp:{...x.smtp,pass:''}});
 useEffect(()=>{if(role==='owner')request('email-config').then(r=>{const c=clean(r.value);setV(c);setSaved(JSON.stringify(c));setRev(r.revision)}).catch(e=>notice(e.message))},[role]);// eslint-disable-line react-hooks/exhaustive-deps
 if(role!=='owner')return <div className="vault-card"><p>Only owners can change email delivery.</p></div>;
 if(!v)return <p className="vault-card av-empty" role="status">Loading email settings…</p>;
 const dirty=JSON.stringify(v)!==saved,set=(k:string,val:unknown)=>setV((c:any)=>({...c,[k]:val})),sub=(g:'mailgun'|'smtp',k:string,val:unknown)=>setV((c:any)=>({...c,[g]:{...c[g],[k]:val}}));
 const kind=v.provider==='mailgun'?'mailgun':/gmail\.com$|googlemail/i.test(v.smtp.host||'')?'gmail':'smtp';
 const choose=(k:string)=>{if(k==='mailgun')set('provider','mailgun');else setV((c:any)=>({...c,provider:'smtp',smtp:k==='gmail'?{...c.smtp,host:'smtp.gmail.com',port:465}:{...c.smtp,host:/gmail/i.test(c.smtp.host)?'':c.smtp.host}}))};
 const secretSaved=v.provider==='smtp'?v.smtp.passSaved:v.mailgun.keySaved,ready=!!(v.fromAddress&&v.recipients.length&&(secretSaved||(v.provider==='smtp'?v.smtp.pass:v.mailgun.key)));
 async function save(){setBusy(true);try{const r=await request('email-config',{value:v,revision:rev});const c=clean(r.value);setRev(r.revision);setV(c);setSaved(JSON.stringify(c));notice(c.enabled?'Saved. New leads will be emailed.':'Saved. Email is off, so leads are only stored.')}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 async function test(){setBusy(true);setTested(null);try{await request('email-test',{});setTested('ok');notice('Test email accepted. Check the recipients’ inboxes (and spam).')}catch(e){setTested((e as Error).message);notice((e as Error).message)}finally{setBusy(false)}}
 function addRecipient(){const r=recipient.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r))return notice('Enter a valid email address.');if(!v.recipients.includes(r))set('recipients',[...v.recipients,r]);setRecipient('')}
 return <div className="av-email">
  <div className={'vault-card av-traffic-hero'+(v.enabled&&ready?' on':'')}><span className="av-backup-icon"><Mail size={26}/></span><div><h2>{v.enabled?(ready?'Lead emails are on':'Lead emails are on, but setup isn’t finished'):'Lead emails are off'}</h2><p>{v.enabled?`New leads are emailed to ${v.recipients.length||'no'} recipient${v.recipients.length===1?'':'s'}. Every lead is also saved in Leads first, so nothing is lost if an email fails.`:'Leads are saved in Leads, but nobody is emailed. Finish the steps below, send a test, then switch this on.'}</p></div><Switch large on={!!v.enabled} label="Email new leads" set={x=>set('enabled',x)}/></div>
  <section className="vault-card av-step-card"><h3><span className="av-step-num">1</span>How the site sends email</h3><div className="av-gallery-grid">{PROVIDERS.map(p=><button key={p.k} type="button" className={'av-gallery-item'+(kind===p.k?' selected':'')} onClick={()=>choose(p.k)}><strong>{p.t}</strong><small>{p.d}</small></button>)}</div>
   {v.provider==='mailgun'?<div className="av-grid-2"><label>Sending domain<Input value={v.mailgun.domain} onChange={e=>sub('mailgun','domain',e.target.value)} placeholder="mg.yourdomain.com"/></label><label>Region<select className="av-select" value={v.mailgun.region} onChange={e=>sub('mailgun','region',e.target.value)}><option value="us">United States (api.mailgun.net)</option><option value="eu">Europe (api.eu.mailgun.net)</option></select></label><label className="span-2">Sending API key {v.mailgun.keySaved&&<small className="av-saved"><CircleCheck size={13}/>Saved. Leave blank to keep it</small>}<Password label="Mailgun key" value={v.mailgun.key} set={x=>sub('mailgun','key',x)} placeholder={v.mailgun.keySaved?'••••••••••••':'key-…'}/></label></div>
   :<>{kind==='gmail'&&<p className="av-hint-box">Use your full Gmail address as the username, and an <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">app password</a> (not your normal password). The server and port are filled in for you.</p>}
    <div className="av-grid-2">{kind!=='gmail'&&<><label>Server<Input value={v.smtp.host} onChange={e=>sub('smtp','host',e.target.value)} placeholder="smtp.office365.com"/></label><label>Port<select className="av-select" value={v.smtp.port} onChange={e=>sub('smtp','port',+e.target.value)}><option value={465}>465 (SSL)</option><option value={587}>587 (STARTTLS)</option><option value={2525}>2525</option><option value={25}>25</option></select></label></>}<label>Username<Input value={v.smtp.user} onChange={e=>sub('smtp','user',e.target.value)} autoComplete="off" placeholder={kind==='gmail'?'you@gmail.com':''}/></label><label>{kind==='gmail'?'App password':'Password'} {v.smtp.passSaved&&<small className="av-saved"><CircleCheck size={13}/>Saved. Leave blank to keep it</small>}<Password label="SMTP password" value={v.smtp.pass} set={x=>sub('smtp','pass',x)} placeholder={v.smtp.passSaved?'••••••••••••':''}/></label></div></>}
   <p className="av-attrib">Keys and passwords are encrypted and never shown again after saving.</p>
  </section>
  <section className="vault-card av-step-card"><h3><span className="av-step-num">2</span>Who it’s from and who gets it</h3>
   <div className="av-grid-2"><label>Sender name<Input value={v.senderName} onChange={e=>set('senderName',e.target.value)} placeholder="DMV Commercial Door Repair Website"/></label><label>From address <small>must be allowed by the provider</small><Input type="email" value={v.fromAddress} onChange={e=>set('fromAddress',e.target.value)} placeholder={kind==='gmail'?v.smtp.user||'you@gmail.com':'no-reply@yourdomain.com'}/></label></div>
   <label className="av-label">Send lead emails to</label>
   <form className="av-rule-add" onSubmit={e=>{e.preventDefault();addRecipient()}}><Input type="email" value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="service@yourdomain.com" aria-label="Add a recipient"/><Button type="submit" variant="outline" size="sm">Add</Button></form>
   {v.recipients.length?<ul className="av-chips-list">{v.recipients.map((r:string)=><li key={r}><span>{r}</span><button type="button" aria-label={'Remove '+r} onClick={()=>set('recipients',v.recipients.filter((x:string)=>x!==r))}><X size={13}/></button></li>)}</ul>:<p className="av-rule-err">Add at least one recipient.</p>}
   <details className="av-media-more"><summary><ChevronDown size={15}/>Reply-to for test emails</summary><p>Lead emails always reply to the person who sent the form. This address is only used for test emails.</p><Input type="email" value={v.replyTo} onChange={e=>set('replyTo',e.target.value)} placeholder="optional"/></details>
  </section>
  <section className="vault-card av-step-card"><h3><span className="av-step-num">3</span>Send a test</h3><p className="muted">{dirty?'Save your changes first, then send a test to every recipient.':'Sends a short test email to every recipient using the saved settings. It works even while lead emails are off.'}</p>
   <div className="actions"><Button variant="outline" disabled={busy||dirty||!ready} onClick={test}><Send/>{busy?'Sending…':'Send a test email'}</Button>{tested==='ok'&&<span className="av-verified"><CircleCheck size={16}/>Accepted by the provider</span>}{tested&&tested!=='ok'&&<span className="av-rule-err">{tested}</span>}</div>
   <p className="av-attrib">If a lead email fails, it is retried automatically up to 5 times. Failures show on System health and in each lead.</p>
  </section>
  <SaveBar dirty={dirty} busy={busy} discard={()=>setV(JSON.parse(saved))} save={save} label="Save email settings"/>
 </div>;
}

// ── Site settings ───────────────────────────────────────────────────────────
const SOCIALS:[string,string][]=[['facebook','Facebook'],['instagram','Instagram'],['linkedin','LinkedIn'],['x','X (Twitter)'],['youtube','YouTube'],['tiktok','TikTok'],['pinterest','Pinterest']];
const DAYS=['Mo','Tu','We','Th','Fr','Sa','Su'],DAY_NAME:Record<string,string>={Mo:'Monday',Tu:'Tuesday',We:'Wednesday',Th:'Thursday',Fr:'Friday',Sa:'Saturday',Su:'Sunday'};
type Day={open:boolean;from:string;to:string};
function parseHours(lines:string[]):Record<string,Day>{const out:Record<string,Day>=Object.fromEntries(DAYS.map(d=>[d,{open:false,from:'09:00',to:'17:00'}]));
 for(const l of lines){const m=String(l).trim().match(/^([A-Za-z,-]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);if(!m)continue;for(const part of m[1].split(',')){const [a,b]=part.split('-');const i=DAYS.indexOf(a),j=b?DAYS.indexOf(b):i;if(i<0||j<0)continue;for(let k=i;k<=j;k++)out[DAYS[k]]={open:true,from:m[2],to:m[3]}}}return out}
// Consecutive days with the same times collapse into one line, e.g. "Mo-Fr 09:00-17:00".
function formatHours(h:Record<string,Day>){const lines:string[]=[];let i=0;while(i<7){const d=h[DAYS[i]];if(!d.open){i++;continue}let j=i;while(j+1<7&&h[DAYS[j+1]].open&&h[DAYS[j+1]].from===d.from&&h[DAYS[j+1]].to===d.to)j++;lines.push(`${DAYS[i]}${j>i?'-'+DAYS[j]:''} ${d.from}-${d.to}`);i=j+1}return lines}
export function SettingsForm({role,notice}:{role:string;notice:Notice}){
 const [v,setV]=useState<any>(null),[saved,setSaved]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{request('settings').then(r=>{setV(r);setSaved(JSON.stringify(r))}).catch(e=>notice(e.message))},[]);// eslint-disable-line react-hooks/exhaustive-deps
 const hours=useMemo(()=>v?parseHours(v.hours||[]):null,[v]);
 if(!v||!hours)return <p className="vault-card av-empty" role="status">Loading settings…</p>;
 const owner=role==='owner',dirty=JSON.stringify(v)!==saved;
 const set=(k:string,val:unknown)=>setV((c:any)=>({...c,[k]:val})),sub=(g:string,k:string,val:unknown)=>setV((c:any)=>({...c,[g]:{...c[g],[k]:val}}));
 const setDay=(d:string,p:Partial<Day>)=>set('hours',formatHours({...hours,[d]:{...hours[d],...p}}));
 const field=(k:string,label:string,hint?:string,ph?:string)=><label key={k}>{label}{hint&&<small>{hint}</small>}<Input value={v[k]||''} onChange={e=>set(k,e.target.value)} placeholder={ph} disabled={!owner}/></label>;
 async function uploadSetting(file:File,key:'logo'|'image'){setBusy(true);try{const form=new FormData();form.set('file',file);form.set('alt',key==='logo'?v.name+' logo':v.name+' default sharing image');const r=await adminFetch('media/',{method:'POST',body:form}),data=await r.json();if(!r.ok)throw new Error(data.error||'Upload failed');set(key,data.url);notice(`${key==='logo'?'Logo':'Sharing image'} uploaded. Save settings to publish it.`)}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 async function save(){setBusy(true);try{const r=await request('settings',v);const next={...v,revision:r.revision};setV(next);setSaved(JSON.stringify(next));notice('Settings saved. Every page, contact link and the schema use them now.')}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 const titlePreview=(v.titleTemplate||'%s | DMV Commercial Door Repair').replace('%s','Commercial Door Repair');
 const local=v.businessType!=='Organization'&&v.businessType!=='Corporation';
 return <div className="av-settings">
  {!owner&&<p className="av-traffic-warn">Only owners can change site settings. You can view them here.</p>}
  <section className="vault-card av-set-card"><h3><Building2 size={18}/>Business identity</h3>
   <div className="av-grid-2">{field('name','Business name')}{field('legalName','Legal name','Used in schema if different.','Allure Digital LLC')}{field('tagline','Tagline')}<label>Business type <small>how search engines describe you</small><select className="av-select" value={v.businessType} onChange={e=>set('businessType',e.target.value)} disabled={!owner}><option value="Organization">Online / nationwide service</option><option value="ProfessionalService">Professional service with an office</option><option value="LocalBusiness">Local business</option><option value="Corporation">Corporation</option></select></label><label>Logo<Input value={v.logo||''} onChange={e=>set('logo',e.target.value)} disabled={!owner}/>{owner&&<span className="av-upload-control"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const f=e.target.files?.[0];if(f)uploadSetting(f,'logo')}}/><small>Upload a new logo or choose an existing media URL.</small></span>}</label><label>Default sharing image <small>Used when a page has no social image.</small><Input value={v.image||''} onChange={e=>set('image',e.target.value)} disabled={!owner}/>{owner&&<span className="av-upload-control"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const f=e.target.files?.[0];if(f)uploadSetting(f,'image')}}/><small>Upload the photo used by social and search previews.</small></span>}</label></div>
  </section>
  <section className="vault-card av-set-card"><h3><Phone size={18}/>Contact</h3><p className="muted">Changing these updates the phone number, tel: links and email address on every page.</p>
   <div className="av-grid-3">{field('phone','Phone','','+1-888-599-0548')}{field('email','Email')}{field('areaServed','Area served','','Washington, D.C., Maryland and Virginia')}</div>
  </section>
  <section className="vault-card av-set-card"><h3><MapPin size={18}/>Address & map</h3><p className="muted">Leave blank if customers don’t visit you. Shown on the contact page and in schema.</p>
   <div className="av-grid-2"><label className="span-2">Street address<Input value={v.address.street||''} onChange={e=>sub('address','street',e.target.value)} disabled={!owner}/></label>{([['city','City'],['region','State'],['postalCode','ZIP code'],['country','Country code']] as const).map(([k,l])=><label key={k}>{l}<Input value={v.address[k]||''} onChange={e=>sub('address',k,e.target.value)} disabled={!owner} placeholder={k==='country'?'US':''}/></label>)}<label className="span-2">Google Business Profile / Maps link<Input value={v.mapUrl||''} onChange={e=>set('mapUrl',e.target.value)} placeholder="https://maps.app.goo.gl/…" disabled={!owner}/></label></div>
   <details className="av-media-more"><summary><ChevronDown size={15}/>Map coordinates (optional)</summary><div className="av-grid-2"><label>Latitude<Input value={v.geo.lat||''} onChange={e=>sub('geo','lat',e.target.value)} disabled={!owner}/></label><label>Longitude<Input value={v.geo.lng||''} onChange={e=>sub('geo','lng',e.target.value)} disabled={!owner}/></label></div></details>
  </section>
  <section className="vault-card av-set-card"><h3><Clock size={18}/>Opening hours</h3><p className="muted">Shown on the contact page{local?' and in schema':''}.{!local&&' Search engines only use hours for businesses with an office, so switch the business type if you want them in schema.'}</p>
   <ul className="av-hours">{DAYS.map(d=>{const h=hours[d];return <li key={d} className={h.open?'':'closed'}><strong>{DAY_NAME[d]}</strong><Switch on={h.open} label={DAY_NAME[d]+' open'} disabled={!owner} set={x=>setDay(d,{open:x})}/>{h.open?<span className="av-hours-times"><Input type="time" aria-label={DAY_NAME[d]+' opens'} value={h.from} onChange={e=>setDay(d,{from:e.target.value})} disabled={!owner}/><span>to</span><Input type="time" aria-label={DAY_NAME[d]+' closes'} value={h.to} onChange={e=>setDay(d,{to:e.target.value})} disabled={!owner}/></span>:<span className="av-muted-cell">Closed</span>}</li>})}</ul>
   {owner&&<div className="actions"><Button type="button" variant="outline" size="sm" onClick={()=>set('hours',formatHours(Object.fromEntries(DAYS.map((d,i)=>[d,{open:i<5,from:hours.Mo.open?hours.Mo.from:'09:00',to:hours.Mo.open?hours.Mo.to:'17:00'}]))))}>Copy Monday to weekdays</Button>{local&&field('priceRange','Price range','','$$')}</div>}
  </section>
  <section className="vault-card av-set-card"><h3><Share2 size={18}/>Social profiles</h3><p className="muted">Links to these networks across the site point here, and search engines learn these profiles belong to you.</p>
   <div className="av-grid-2">{SOCIALS.map(([k,l])=><label key={k}>{l}<Input value={v.socials[k]||''} onChange={e=>sub('socials',k,e.target.value)} placeholder={`https://${k==='x'?'x':k}.com/…`} disabled={!owner}/></label>)}</div>
  </section>
  <section className="vault-card av-set-card"><h3><Search size={18}/>Search appearance</h3><p className="muted">Used when a page doesn’t set its own title or description.</p>
   <div className="av-grid-2"><label>Title template <small>%s is the page name</small><Input value={v.titleTemplate||''} onChange={e=>set('titleTemplate',e.target.value)} placeholder="%s | DMV Commercial Door Repair" disabled={!owner}/></label><label>Default description <small>{(v.defaultDescription||'').length}/160</small><Textarea rows={3} value={v.defaultDescription||''} onChange={e=>set('defaultDescription',e.target.value)} disabled={!owner}/></label></div>
   <div className="av-serp" aria-label="Search result preview"><small>{(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000').replace(/^https?:\/\//,'')} › commercial-door-repair</small><strong>{titlePreview}</strong><p>{v.defaultDescription||'Your default description appears here.'}</p></div>
  </section>
  {owner&&<SaveBar dirty={dirty} busy={busy} discard={()=>setV(JSON.parse(saved))} save={save} label="Save settings"/>}
 </div>;
}

// ── Visitors ────────────────────────────────────────────────────────────────
const dur=(a:string,b:string)=>{const s=Math.max(0,Math.round((Date.parse(b)-Date.parse(a))/1000));return s<60?`${s}s`:s<3600?`${Math.floor(s/60)}m ${s%60}s`:`${Math.floor(s/3600)}h ${Math.floor(s%3600/60)}m`};
const host=(u:string)=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch{return u||'Direct'}};
function Journey({events}:{events:any[]}){if(!events.length)return <p className="av-rule-empty">No steps recorded.</p>;const start=events[0].created_at;
 return <ol className="av-journey">{events.map(e=>{const kind=e.type==='call'?'call':e.type==='form'?'form':e.type==='page'?'page':e.type==='click'?'click':'other';
  const text=e.type==='page'?<>Viewed <strong>{e.page}</strong>{e.title&&<small>{e.title}</small>}{e.referrer&&<small>Arrived from {host(e.referrer)}</small>}</>:e.type==='leave'?<>Spent {dur(new Date(0).toISOString(),new Date((e.seconds||0)*1000).toISOString())} on {e.page}</>:e.type==='click'?<>Clicked “{e.label||'link'}”{e.href&&<small>{e.href}</small>}</>:e.type==='form'?<><strong>Sent a form</strong><small>on {e.page}</small></>:e.type==='call'?<><strong>Tapped to call {e.target}</strong><small>on {e.page}</small></>:<>{e.type}</>;
  return <li key={e.id} className={kind}><time>+{dur(start,e.created_at)}</time><span className="av-journey-dot"/><div>{text}</div></li>})}</ol>}
const device=(b:any)=>b?[b.name,b.os,b.device].filter(Boolean).join(' · '):'';
export function VisitorsView({notice}:{notice:Notice}){
 const [range,setRange]=useState('7'),[country,setCountry]=useState(''),[group,setGroup]=useState('session'),[q,setQ]=useState(''),[page,setPage]=useState(0),[rows,setRows]=useState<any[]|null>(null),[sum,setSum]=useState<any>(null),[live,setLive]=useState<any[]>([]),[open,setOpen]=useState<{key:string;events:any[]|null}|null>(null);
 const params=`range=${range}&country=${country}`;
 useEffect(()=>{setSum(null);request('visitors-summary?'+params).then(setSum).catch(e=>notice(e.message))},[range,country]);// eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{const t=setTimeout(()=>request(`visitors?page=${page}&group=${group}&q=${encodeURIComponent(q)}&${params}`).then(setRows).catch(e=>notice(e.message)),q?300:0);return()=>clearTimeout(t)},[page,q,group,range,country]);// eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{const load=()=>request('presence').then(setLive).catch(()=>{});load();const t=setInterval(load,30000);return()=>clearInterval(t)},[]);
 async function toggle(r:any){if(open?.key===r.key)return setOpen(null);setOpen({key:r.key,events:null});try{setOpen({key:r.key,events:await request(group==='session'?'journey?session='+encodeURIComponent(r.session):'journey?visitor='+encodeURIComponent(r.visitor))})}catch(e){notice((e as Error).message)}}
 const tiles:[string,string|number,typeof Activity][]= [['Visits',sum?.visits??'–',Activity],['Visitors',sum?.visitors??'–',Users],['Page views',sum?.views??'–',FileText],['Leads sent',sum?.forms??'–',Inbox],['Call taps',sum?.calls??'–',Phone]];
 return <div className="av-visitors">
  <div className="av-range-bar"><div className="av-seg av-seg-wrap" role="tablist" aria-label="Time range">{RANGES.map(([k,l])=><button key={k} type="button" role="tab" aria-selected={range===k} className={range===k?'selected':''} onClick={()=>{setRange(k);setPage(0)}}>{l}</button>)}</div>{country&&<button type="button" className="av-filter-chip" onClick={()=>setCountry('')}>{regionName(country)}<X size={13}/></button>}<span className="av-live"><i/>{live.length} on the site now</span></div>
  <div className="av-stat-row">{tiles.map(([l,n,I])=><div key={l} className="vault-card av-kpi"><I size={18}/><strong>{typeof n==='number'?n.toLocaleString():n}</strong><span>{l}</span></div>)}</div>
  <div className="av-insights">
   <section className="vault-card"><h3><Globe size={16}/>Countries</h3><Bars rows={sum?.countries||[]} label={regionName} onPick={c=>{setCountry(c);setPage(0)}} picked={country}/></section>
   <section className="vault-card"><h3><FileText size={16}/>Most viewed pages</h3><Bars rows={sum?.pages||[]} label={k=>k}/></section>
   <section className="vault-card"><h3><MousePointerClick size={16}/>Where they came from</h3><Bars rows={sum?.sources||[]} label={k=>k==='Direct'?'Direct / unknown':k}/></section>
  </div>
  <section className="vault-card av-table-card">
   <div className="av-table-tools"><div className="av-seg av-seg-wrap" role="tablist" aria-label="Group by">{([['session','Each visit'],['visitor','Each visitor'],['ip','Each IP']] as const).map(([k,l])=><button key={k} type="button" role="tab" aria-selected={group===k} className={group===k?'selected':''} onClick={()=>{setGroup(k);setPage(0);setOpen(null)}}>{l}</button>)}</div><label className="av-find"><Search size={16} aria-hidden="true"/><Input aria-label="Search visitors" placeholder="IP address, visitor or session ID…" value={q} onChange={e=>{setQ(e.target.value);setPage(0)}}/></label><button type="button" className="av-link" onClick={()=>{setRows(null);request(`visitors?page=${page}&group=${group}&q=${encodeURIComponent(q)}&${params}`).then(setRows)}}><RefreshCw size={14}/>Refresh</button></div>
   {!rows&&<p className="av-empty" role="status">Loading visits…</p>}
   {rows&&!rows.length&&<p className="av-empty">No visits in this range yet.</p>}
   {rows&&rows.length>0&&<div className="av-table av-visit-table" role="table" aria-label="Visits">
    <div className="av-tr av-th" role="row"><span role="columnheader">Visitor</span><span role="columnheader">Landed on</span><span role="columnheader">Activity</span><span role="columnheader">Time on site</span><span role="columnheader">When</span></div>
    {rows.map(r=><div key={r.key} className={'av-visit'+(open?.key===r.key?' open':'')}>
     <div className="av-tr av-row-link" role="row" onClick={()=>toggle(r)}>
      <span role="cell" className="av-cell-title"><strong>{regionName(r.country)}</strong><small>{r.ip||'unknown IP'}{device(r.browser)?' · '+device(r.browser):''}</small></span>
      <span role="cell" className="av-cell-title"><strong className="av-ellipsis">{r.landing||'(no page view)'}</strong><small>from {r.referrer?host(r.referrer):'direct / unknown'}</small></span>
      <span role="cell" className="av-muted-cell"><span>{r.views} page{r.views===1?'':'s'} · {r.clicks||0} click{r.clicks===1?'':'s'}{group!=='session'?` · ${r.sessions} visit${r.sessions===1?'':'s'}`:''}</span><span className="av-chips">{r.forms>0&&<span className="av-pill av-pill-spam">Sent a lead</span>}{r.calls>0&&<span className="av-pill av-pill-live">Tapped to call</span>}</span></span>
      <span role="cell" className="av-muted-cell">{dur(r.first,r.last)}</span>
      <span role="cell" className="av-muted-cell" title={fullTime(r.first)}>{ago(r.last)}</span>
     </div>
    </div>)}
   </div>}
   {rows&&(page>0||rows.length>=50)&&<div className="av-table-foot av-pager"><span>Page {page+1}</span><span className="actions"><Button variant="outline" size="sm" disabled={!page} onClick={()=>setPage(page-1)}>Newer</Button><Button variant="outline" size="sm" disabled={rows.length<50} onClick={()=>setPage(page+1)}>Older</Button></span></div>}
  </section>
  {open&&<section className="vault-card av-journey-panel" aria-label="Selected visitor journey"><header><div><p className="eyebrow">Visitor detail</p><h2>Their journey, step by step</h2><p className="muted">Every recorded page, click, form and call during this visit.</p></div><Button variant="outline" size="sm" onClick={()=>setOpen(null)}><X/>Close</Button></header>{open.events?<Journey events={open.events}/>:<p className="av-rule-empty">Loading the journey…</p>}</section>}
 </div>;
}

// ── Calls ───────────────────────────────────────────────────────────────────
export function CallsView({notice}:{notice:Notice}){
 const [range,setRange]=useState('30'),[country,setCountry]=useState(''),[page,setPage]=useState(0),[rows,setRows]=useState<any[]|null>(null),[sum,setSum]=useState<any>(null),[open,setOpen]=useState<{id:string;events:any[]|null}|null>(null);
 const params=`range=${range}&country=${country}`;
 useEffect(()=>{request('calls-summary?'+params).then(setSum).catch(e=>notice(e.message))},[range,country]);// eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{setRows(null);request(`calls?page=${page}&${params}`).then(setRows).catch(e=>notice(e.message))},[page,range,country]);// eslint-disable-line react-hooks/exhaustive-deps
 async function toggle(r:any){if(open?.id===r.id)return setOpen(null);setOpen({id:r.id,events:null});try{setOpen({id:r.id,events:await request('journey?session='+encodeURIComponent(r.session))})}catch(e){notice((e as Error).message)}}
 return <div className="av-visitors">
  <div className="av-stat-row av-stat-4">{([['Today',sum?.today],['Last 7 days',sum?.week],['Last 30 days',sum?.month],['All time',sum?.total]] as const).map(([l,n])=><div key={l} className="vault-card av-kpi"><Phone size={18}/><strong>{n??'–'}</strong><span>{l}</span></div>)}</div>
  <div className="av-range-bar"><div className="av-seg av-seg-wrap" role="tablist" aria-label="Time range">{RANGES.map(([k,l])=><button key={k} type="button" role="tab" aria-selected={range===k} className={range===k?'selected':''} onClick={()=>{setRange(k);setPage(0)}}>{l}</button>)}</div>{country&&<button type="button" className="av-filter-chip" onClick={()=>setCountry('')}>{regionName(country)}<X size={13}/></button>}<span className="av-attrib">Recorded when a visitor taps a phone number on the website.</span></div>
  <div className="av-insights">
   <section className="vault-card"><h3><Phone size={16}/>Numbers tapped</h3><Bars rows={sum?.numbers||[]} label={k=>k}/></section>
   <section className="vault-card"><h3><FileText size={16}/>Pages that bring calls</h3><Bars rows={sum?.pages||[]} label={k=>k}/></section>
   <section className="vault-card"><h3><Globe size={16}/>Caller countries</h3><Bars rows={sum?.countries||[]} label={regionName} onPick={c=>{setCountry(c);setPage(0)}} picked={country}/></section>
  </div>
  <section className="vault-card av-table-card">
   {!rows&&<p className="av-empty" role="status">Loading calls…</p>}
   {rows&&!rows.length&&<p className="av-empty">No call taps in this range.</p>}
   {rows&&rows.length>0&&<div className="av-table av-call-table" role="table" aria-label="Call taps">
    <div className="av-tr av-th" role="row"><span role="columnheader">Number</span><span role="columnheader">From page</span><span role="columnheader">Caller</span><span role="columnheader">When</span></div>
    {rows.map(r=><div key={r.id} className={'av-visit'+(open?.id===r.id?' open':'')}>
     <div className="av-tr av-row-link" role="row" onClick={()=>toggle(r)} title="Show this visitor’s journey">
      <span role="cell" className="av-cell-title"><strong>{r.target||'Phone link'}</strong><small>Tap to call</small></span>
      <span role="cell" className="av-cell-title"><strong className="av-ellipsis">{r.page||'—'}</strong></span>
      <span role="cell" className="av-cell-title"><strong>{regionName(r.country)}</strong><small>{r.ip||'unknown IP'}{device(r.browser)?' · '+device(r.browser):''}</small></span>
      <span role="cell" className="av-muted-cell" title={fullTime(r.created_at)}>{ago(r.created_at)}</span>
     </div>
     {open?.id===r.id&&<div className="av-inline-panel"><p className="av-label">Their visit, step by step</p>{open?.events?<Journey events={open.events}/>:<p className="av-rule-empty">Loading…</p>}</div>}
    </div>)}
   </div>}
   {rows&&(page>0||rows.length>=50)&&<div className="av-table-foot av-pager"><span>Page {page+1}</span><span className="actions"><Button variant="outline" size="sm" disabled={!page} onClick={()=>setPage(page-1)}>Newer</Button><Button variant="outline" size="sm" disabled={rows.length<50} onClick={()=>setPage(page+1)}>Older</Button></span></div>}
  </section>
 </div>;
}
```

### app/avault/rich-editor.tsx

<!-- avault-file path="app/avault/rich-editor.tsx" mode="owned" sha256="a081c8574b9df8358a73d38006632f8f5c349980206026e9f6243578c26186b9" eol="1" -->
```tsx
'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {useEditor,EditorContent,type Editor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import {TableKit} from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import {TextStyle,Color} from '@tiptap/extension-text-style';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import {Bold,Italic,Underline,Strikethrough,Highlighter,Superscript as Sup,Subscript as Sub,Code,List,ListOrdered,Indent,Outdent,AlignLeft,AlignCenter,AlignRight,AlignJustify,Quote,SquareCode,Minus,Link2,Unlink,ImagePlus,Table as TableIcon,Undo2,Redo2,RemoveFormatting,Rows3,Columns3,Trash2,Merge,Split} from 'lucide-react';
import type {Doc} from '@/lib/avault/store';
import {ClassificationTools} from './content-tools';
import {notify} from './toast';

// A blog post edited the way it looks live: the article header (eyebrow, title, intro, byline) as styled
// inputs, and the body as rich text inside the site's own article typography.
const COLORS=[['Default',''],['Brand navy','#062744'],['Brand red','#cc293c'],['Ink','#142c40'],['Slate','#5e6d79']];

function Tool({on,active,disabled,label,children}:{on:()=>void;active?:boolean;disabled?:boolean;label:string;children:React.ReactNode}){return <button type="button" className={'av-tool'+(active?' on':'')} title={label} aria-label={label} aria-pressed={active} disabled={disabled} onMouseDown={e=>e.preventDefault()} onClick={on}>{children}</button>}

function Toolbar({editor,upload}:{editor:Editor;upload:(f:File)=>Promise<string>}){const [,force]=useState(0);useEffect(()=>{const f=()=>force(n=>n+1);editor.on('transaction',f);return()=>{editor.off('transaction',f)}},[editor]);
 const c=()=>editor.chain().focus();const inTable=editor.isActive('table');const file=useRef<HTMLInputElement>(null);
 const block=editor.isActive('heading',{level:2})?'h2':editor.isActive('heading',{level:3})?'h3':editor.isActive('heading',{level:4})?'h4':'p';
 function link(){const prev=editor.getAttributes('link');const href=prompt('Link to: a page like /local-seo/, a full https:// address, mailto: or tel:',prev.href||'/');if(href===null)return;if(!href){c().unsetLink().run();return}
  const external=/^https?:/i.test(href);const newTab=confirm(external?'Open in a new tab?':'Open in a new tab? (Usually No for your own pages.)');const rel=[...(external&&confirm('Add nofollow? Use for links you don’t vouch for.')?['nofollow']:[]),...(external&&confirm('Is it a paid or affiliate link (sponsored)?')?['sponsored']:[])];
  c().extendMarkRange('link').setLink({href,target:newTab?'_blank':null,rel:[...(newTab?['noopener','noreferrer']:[]),...rel].join(' ')||null}).run()}
 async function image(f?:File){try{let src='';if(f)src=await upload(f);else{src=prompt('Image URL (/media/… or https://…). Or cancel and use Upload.','')||''}if(!src)return;const alt=prompt('Describe the image for people who can’t see it (leave empty only if purely decorative):','')??'';c().setImage({src,alt}).run()}catch(e){notify((e as Error).message)}}
 return <div className="av-toolbar" role="toolbar" aria-label="Article formatting">
  <select aria-label="Text style" value={block} onChange={e=>{const v=e.target.value;if(v==='p')c().setParagraph().run();else c().setHeading({level:+v.slice(1) as 2|3|4}).run()}}><option value="p">Paragraph</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option><option value="h4">Heading 4</option></select>
  <span className="av-sep"/>
  <Tool label="Bold" active={editor.isActive('bold')} on={()=>c().toggleBold().run()}><Bold size={16}/></Tool><Tool label="Italic" active={editor.isActive('italic')} on={()=>c().toggleItalic().run()}><Italic size={16}/></Tool><Tool label="Underline" active={editor.isActive('underline')} on={()=>c().toggleUnderline().run()}><Underline size={16}/></Tool><Tool label="Strikethrough" active={editor.isActive('strike')} on={()=>c().toggleStrike().run()}><Strikethrough size={16}/></Tool><Tool label="Highlight" active={editor.isActive('highlight')} on={()=>c().toggleHighlight().run()}><Highlighter size={16}/></Tool>
  <select aria-label="Text colour" value={editor.getAttributes('textStyle').color||''} onChange={e=>e.target.value?c().setColor(e.target.value).run():c().unsetColor().run()}>{COLORS.map(([l,v])=><option key={l} value={v}>{l==='Default'?'Colour':l}</option>)}</select>
  <Tool label="Superscript" active={editor.isActive('superscript')} on={()=>c().toggleSuperscript().run()}><Sup size={16}/></Tool><Tool label="Subscript" active={editor.isActive('subscript')} on={()=>c().toggleSubscript().run()}><Sub size={16}/></Tool><Tool label="Inline code" active={editor.isActive('code')} on={()=>c().toggleCode().run()}><Code size={16}/></Tool>
  <span className="av-sep"/>
  <Tool label="Bulleted list" active={editor.isActive('bulletList')} on={()=>c().toggleBulletList().run()}><List size={16}/></Tool><Tool label="Numbered list" active={editor.isActive('orderedList')} on={()=>c().toggleOrderedList().run()}><ListOrdered size={16}/></Tool><Tool label="Indent" disabled={!editor.can().sinkListItem('listItem')} on={()=>c().sinkListItem('listItem').run()}><Indent size={16}/></Tool><Tool label="Outdent" disabled={!editor.can().liftListItem('listItem')} on={()=>c().liftListItem('listItem').run()}><Outdent size={16}/></Tool>
  <span className="av-sep"/>
  {([['left',AlignLeft],['center',AlignCenter],['right',AlignRight],['justify',AlignJustify]] as const).map(([a,I])=><Tool key={a} label={'Align '+a} active={editor.isActive({textAlign:a})} on={()=>c().setTextAlign(a).run()}><I size={16}/></Tool>)}
  <span className="av-sep"/>
  <Tool label="Quote" active={editor.isActive('blockquote')} on={()=>c().toggleBlockquote().run()}><Quote size={16}/></Tool><Tool label="Code block" active={editor.isActive('codeBlock')} on={()=>c().toggleCodeBlock().run()}><SquareCode size={16}/></Tool><Tool label="Divider line" on={()=>c().setHorizontalRule().run()}><Minus size={16}/></Tool>
  <Tool label="Link" active={editor.isActive('link')} on={link}><Link2 size={16}/></Tool><Tool label="Remove link" disabled={!editor.isActive('link')} on={()=>c().unsetLink().run()}><Unlink size={16}/></Tool>
  <Tool label="Insert image from URL" on={()=>image()}><ImagePlus size={16}/></Tool><button type="button" className="av-tool av-tool-text" onMouseDown={e=>e.preventDefault()} onClick={()=>file.current?.click()}>Upload image</button><input ref={file} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(f)image(f)}}/>
  <Tool label="Insert table" on={()=>c().insertTable({rows:3,cols:3,withHeaderRow:true}).run()}><TableIcon size={16}/></Tool>
  {inTable&&<><Tool label="Add row below" on={()=>c().addRowAfter().run()}><Rows3 size={16}/></Tool><Tool label="Add column right" on={()=>c().addColumnAfter().run()}><Columns3 size={16}/></Tool><button type="button" className="av-tool av-tool-text" onClick={()=>c().deleteRow().run()}>− row</button><button type="button" className="av-tool av-tool-text" onClick={()=>c().deleteColumn().run()}>− column</button><button type="button" className="av-tool av-tool-text" onClick={()=>c().toggleHeaderRow().run()}>Header row</button><Tool label="Merge cells" disabled={!editor.can().mergeCells()} on={()=>c().mergeCells().run()}><Merge size={16}/></Tool><Tool label="Split cell" disabled={!editor.can().splitCell()} on={()=>c().splitCell().run()}><Split size={16}/></Tool><Tool label="Delete table" on={()=>c().deleteTable().run()}><Trash2 size={16}/></Tool></>}
  <span className="av-sep"/>
  <Tool label="Clear formatting" on={()=>c().unsetAllMarks().clearNodes().run()}><RemoveFormatting size={16}/></Tool><Tool label="Undo" disabled={!editor.can().undo()} on={()=>c().undo().run()}><Undo2 size={16}/></Tool><Tool label="Redo" disabled={!editor.can().redo()} on={()=>c().redo().run()}><Redo2 size={16}/></Tool>
 </div>}

// One editable run of header text. Uncontrolled while typing (so the caret never jumps), synced when the value changes elsewhere.
function Piece({value,accent,label,onChange}:{value:string;accent:boolean;label:string;onChange:(v:string)=>void}){const ref=useRef<HTMLSpanElement>(null);
 useEffect(()=>{if(ref.current&&ref.current.textContent!==value)ref.current.textContent=value},[value]);
 return <span ref={ref} className={'av-piece'+(accent?' accent':'')} role="textbox" aria-label={label} contentEditable="plaintext-only" suppressContentEditableWarning spellCheck onInput={e=>onChange((e.currentTarget.textContent||'').replace(/\s*\n\s*/g,' '))} onKeyDown={e=>{if(e.key==='Enter')e.preventDefault()}}/>}
export function PostEditor({doc,change,upload}:{doc:Doc;change:(d:Doc)=>void;upload:(f:File)=>Promise<string>}){
 const docRef=useRef(doc);useLayoutEffect(()=>{docRef.current=doc});
 const editor=useEditor({immediatelyRender:false,extensions:[StarterKit.configure({heading:{levels:[2,3,4]},link:{openOnClick:false,autolink:true,HTMLAttributes:{target:null,rel:null}}}),Image.configure({HTMLAttributes:{loading:'lazy'}}),TableKit.configure({table:{resizable:false}}),TextAlign.configure({types:['heading','paragraph']}),Highlight,TextStyle,Color,Subscript,Superscript],
  content:doc.body||'<p></p>',editorProps:{attributes:{'aria-label':'Article body','class':'av-prose'}},onUpdate:({editor})=>change({...docRef.current,body:editor.getHTML()})});
 // Switching posts (or restoring a revision) replaces the editor content without adding an undo step.
 useEffect(()=>{if(editor&&!editor.isDestroyed&&editor.getHTML()!==(doc.body||'<p></p>'))editor.commands.setContent(doc.body||'<p></p>',{emitUpdate:false})},[doc.route,doc.revision]);// eslint-disable-line react-hooks/exhaustive-deps
 // Each header element keeps its pieces in template order; pieces inside .heading-accent use the accent colour.
 const part=(re:RegExp)=>{const html=doc.template.match(re)?.[0]||'';const accent=new Set([...(html.match(/<span class="heading-accent">[\s\S]*?<\/span>/g)||[]).join('').matchAll(/\{\{(f\d+)\}\}/g)].map(m=>m[1]));return [...html.matchAll(/\{\{(f\d+)\}\}/g)].map(m=>doc.fields.find(f=>f.key===m[1])).filter(Boolean).map(f=>({f:f!,accent:accent.has(f!.key)}))};
 const eyebrow=part(/<p class="article-eyebrow">[\s\S]*?<\/p>/),title=part(/<h1>[\s\S]*?<\/h1>/),deck=part(/<p class="article-deck">[\s\S]*?<\/p>/),meta=part(/<div class="article-meta">[\s\S]*?<\/div>/);
 const field=(key:string,value:string)=>change({...docRef.current,fields:docRef.current.fields.map(f=>f.key===key?{...f,value}:f)});
 const pieces=(items:{f:any;accent:boolean}[],cls:string,label:string)=>items.length>0&&<div className={cls} role="group" aria-label={label}>{items.map(({f,accent})=><Piece key={f.key} value={f.value} accent={accent} label={label+(accent?' (accent colour)':'')} onChange={v=>field(f.key,v)}/>)}</div>;
 const tint=/blog-(yellow|blue|red|green)/.exec(doc.template)?.[1]||'yellow';
 const words=(editor?.getText()||'').trim().split(/\s+/).filter(Boolean).length;
 return <><div className="av-post">
  <div className={'av-post-canvas blog-'+tint}>
   <header className="av-post-header">{pieces(eyebrow,'av-post-eyebrow','Eyebrow')}{pieces(title,'av-post-title','Title (H1)')}{pieces(deck,'av-post-deck','Introduction')}{pieces(meta,'av-post-meta','Byline, date and reading time')}</header>
   {editor&&<Toolbar editor={editor} upload={upload}/>}
   <div className="article-body av-post-body"><EditorContent editor={editor}/></div>
  </div>
  <p className="av-post-count">{words} words · about {Math.max(1,Math.round(words/220))} min read. Paste from Word or Google Docs keeps headings, lists, links and tables and drops everything else.</p>
  <p className="av-post-count">“Keep exploring” links at the end of the post are chosen automatically from related posts.</p>
 </div><ClassificationTools doc={doc} onChange={change} notice={notify}/></>}
```

### app/avault/scripts-privacy.tsx

<!-- avault-file path="app/avault/scripts-privacy.tsx" mode="owned" sha256="c22f727220cf4ed89f4d50481cb458f7a496a1f9ae3c20738f9d81e0da3c0911" eol="1" -->
```tsx
'use client';
import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Code2,Plus,Trash2,ChevronDown,ShieldCheck,CircleCheck,CircleAlert,Eye,Activity,Clock,Search,Copy,FileText,DatabaseBackup,UserX,ExternalLink} from 'lucide-react';
import {request} from './content-tools';
import {TEMPLATES,PLACEMENTS,normalizeScripts,type ScriptsConfig,type Snippet,type Placement} from '@/lib/avault/snippets';

// AVAULT → Custom scripts and AVAULT → Privacy & tracking.
type Notice=(s:string)=>void;
const fullTime=(iso?:string|null)=>iso?new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—';
const TAG:Record<string,string>={ga4:'Analytics',gtm:'Tag manager',meta:'Advertising',clarity:'Heatmaps',custom:'Custom'};

// ── Custom scripts ──────────────────────────────────────────────────────────
export function ScriptsPanel({role,notice}:{role:string;notice:Notice}){
 const [cfg,setCfg]=useState<ScriptsConfig|null>(null),[saved,setSaved]=useState(''),[revision,setRevision]=useState(0),[busy,setBusy]=useState(false),[open,setOpen]=useState<string|null>(null),[adding,setAdding]=useState<string|null>(null),[tplId,setTplId]=useState(''),[checks,setChecks]=useState<Record<string,boolean|null>>({});
 useEffect(()=>{if(role!=='owner')return;request('configuration?key=scripts').then(r=>{const c=normalizeScripts(r.value);setCfg(c);setSaved(JSON.stringify(c));setRevision(r.revision)}).catch(e=>notice(e.message))},[]);// eslint-disable-line react-hooks/exhaustive-deps
 if(role!=='owner')return <div className="vault-card"><p>Only owners can add scripts to the website.</p></div>;
 if(!cfg)return <p className="vault-card av-empty" role="status">Loading scripts…</p>;
 const dirty=JSON.stringify(cfg)!==saved,active=cfg.snippets.filter(s=>s.enabled&&s.code.trim()).length;
 const patch=(id:string,p:Partial<Snippet>)=>setCfg(c=>c&&{...c,snippets:c.snippets.map(s=>s.id===id?{...s,...p}:s)});
 const tpl=TEMPLATES.find(t=>t.key===adding);
 function add(){if(!tpl)return;const id=tplId.trim().toUpperCase().replace(/^G-|^GTM-/,m=>m);const value=tpl.key==='clarity'?tplId.trim().toLowerCase():tpl.key==='meta'?tplId.trim():id;
  if(tpl.key!=='custom'&&!tpl.pattern.test(value))return notice(`That doesn’t look like a ${tpl.name} ${tpl.label.toLowerCase()} (for example ${tpl.example}).`);
  const made=tpl.build(value);setCfg(c=>c&&{...c,enabled:true,snippets:[...c.snippets,...made]});setOpen(made[0].id);setAdding(null);setTplId('')}
 async function save(){if(!cfg)return;setBusy(true);try{const r=await request('configuration',{key:'scripts',value:cfg,revision});setRevision(r.revision);setSaved(JSON.stringify(cfg));setChecks({});notice(cfg.enabled?'Scripts saved. They’re live on the website now.':'Scripts saved. They’re switched off.')}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 // Loads the page each snippet targets and looks for its marker, proving it really is on the site.
 async function verify(){if(!cfg)return;const out:Record<string,boolean|null>={};await Promise.all(cfg.snippets.filter(s=>s.enabled).map(async s=>{const page=(s.pages.find(p=>!p.endsWith('*'))||s.pages[0]?.replace(/\*$/,'')||'/');try{const html=await (await fetch(page,{cache:'no-store'})).text();out[s.id]=html.includes(`avault:snippet:${s.id}`)}catch{out[s.id]=null}}));setChecks(out);const ok=Object.values(out).filter(Boolean).length;notice(`${ok} of ${Object.keys(out).length} script${Object.keys(out).length===1?'':'s'} found on the live site.`)}
 return <div className="av-scripts">
  <div className={'vault-card av-traffic-hero'+(cfg.enabled?' on':'')}>
   <span className="av-backup-icon"><Code2 size={26}/></span>
   <div><h2>{cfg.enabled?`${active} script${active===1?'':'s'} running on the website`:'Custom scripts are off'}</h2><p>Add analytics, ad pixels or chat widgets without touching the code. Paste the snippet exactly as the provider gives it, script tags and all. Turning this off removes every script at once.</p></div>
   <button type="button" role="switch" aria-checked={cfg.enabled} className={'av-switch av-switch-lg'+(cfg.enabled?' on':'')} onClick={()=>setCfg({...cfg,enabled:!cfg.enabled})}><span/>{cfg.enabled?'On':'Off'}</button>
  </div>
  <section className="vault-card av-gallery"><h3>Add a script</h3><div className="av-gallery-grid">{TEMPLATES.map(t=><button key={t.key} type="button" className={'av-gallery-item'+(adding===t.key?' selected':'')} onClick={()=>{setAdding(adding===t.key?null:t.key);setTplId('')}}><strong>{t.name}</strong><small>{t.key==='custom'?'Paste any snippet':t.label}</small></button>)}</div>
   {tpl&&<form className="av-gallery-form" onSubmit={e=>{e.preventDefault();add()}}>{tpl.key==='custom'?<p>Adds an empty snippet. Paste your code into it, then save.</p>:<label>{tpl.name} {tpl.label}<Input autoFocus value={tplId} onChange={e=>setTplId(e.target.value)} placeholder={tpl.example}/></label>}<Button type="submit"><Plus/>Add {tpl.name}</Button></form>}
  </section>
  <section className="vault-card av-table-card">
   <div className="av-table-tools"><h2 className="av-table-title">Your scripts</h2>{cfg.snippets.some(s=>s.enabled)&&!dirty&&<Button variant="outline" size="sm" onClick={verify}><Eye/>Check on live site</Button>}</div>
   {!cfg.snippets.length&&<p className="av-empty">No scripts yet. Pick one above to add it.</p>}
   <ul className="av-snippets">{cfg.snippets.map(s=>{const isOpen=open===s.id,check=checks[s.id];return <li key={s.id} className={(isOpen?'open ':'')+(s.enabled?'':'off')}>
    <div className="av-snippet-head">
     <button type="button" className="av-snippet-title" onClick={()=>setOpen(isOpen?null:s.id)} aria-expanded={isOpen}><ChevronDown size={16} aria-hidden="true"/><span><strong>{s.name}</strong><small>{TAG[s.template]||'Custom'} · {PLACEMENTS[s.placement]} · {s.pages.length?`${s.pages.length} page${s.pages.length===1?'':'s'}`:'all pages'}{s.respectOptOut?' · respects opt-out':''}</small></span></button>
     {check!==undefined&&<span className={'av-pill '+(check?'av-pill-live':'av-pill-spam')}>{check?'Found on site':check===false?'Not found':'Couldn’t check'}</span>}
     <button type="button" role="switch" aria-checked={s.enabled} aria-label={'Run '+s.name} className={'av-switch'+(s.enabled?' on':'')} onClick={()=>patch(s.id,{enabled:!s.enabled})}><span/>{s.enabled?'On':'Off'}</button>
    </div>
    {isOpen&&<div className="av-snippet-body">
     <div className="av-snippet-grid"><label>Name<Input value={s.name} onChange={e=>patch(s.id,{name:e.target.value})}/></label><label>Where it goes<select value={s.placement} onChange={e=>patch(s.id,{placement:e.target.value as Placement})}>{(Object.keys(PLACEMENTS) as Placement[]).map(k=><option key={k} value={k}>{PLACEMENTS[k]}</option>)}</select></label></div>
     <label>Code <small>paste it exactly as given: &lt;script&gt; tags are fine</small><Textarea className="av-code" rows={Math.min(18,Math.max(6,s.code.split('\n').length+1))} spellCheck={false} value={s.code} onChange={e=>patch(s.id,{code:e.target.value})} placeholder={'<script>\n  // your code\n</script>'}/></label>
     <fieldset className="av-choice av-pages"><legend>Which pages?</legend><label className={!s.pages.length?'selected':''}><input type="radio" checked={!s.pages.length} onChange={()=>patch(s.id,{pages:[]})}/><strong>Every page</strong><small>Recommended for analytics and pixels.</small></label><label className={s.pages.length?'selected':''}><input type="radio" checked={!!s.pages.length} onChange={()=>patch(s.id,{pages:s.pages.length?s.pages:['/']})}/><strong>Only some pages</strong><small>One path per line. End with * for a whole section, like /blog/*.</small></label></fieldset>
     {!!s.pages.length&&<Textarea rows={3} value={s.pages.join('\n')} onChange={e=>patch(s.id,{pages:e.target.value.split('\n')})} placeholder={'/contact/\n/blog/*'}/>}
     <label className="inline av-optout"><input type="checkbox" checked={s.respectOptOut} onChange={e=>patch(s.id,{respectOptOut:e.target.checked})}/><span><strong>Respect visitors’ privacy choice</strong><small>Skip this script for visitors who clicked “Don’t track my visits” or whose browser sends Global Privacy Control. Turn on for any tracking or advertising code.</small></span></label>
     <div className="av-snippet-foot"><Button variant="ghost" size="sm" onClick={()=>{if(confirm(`Remove “${s.name}” from the website?`))setCfg({...cfg,snippets:cfg.snippets.filter(x=>x.id!==s.id)})}}><Trash2/>Remove</Button></div>
    </div>}
   </li>})}</ul>
  </section>
  <p className="av-attrib">Scripts that load other code from the internet are allowed automatically. Code inside Google Tag Manager’s “Custom HTML” tags may be blocked by the site’s security policy; prefer built-in tag types there.</p>
  {dirty&&<div className="av-savebar show" role="region" aria-label="Unsaved changes"><span>You have unsaved changes.</span><span className="actions"><Button variant="outline" disabled={busy} onClick={()=>{setCfg(JSON.parse(saved));setChecks({})}}>Discard</Button><Button disabled={busy} onClick={save}>{busy?'Saving…':'Save scripts'}</Button></span></div>}
 </div>;
}

// ── Privacy & tracking ──────────────────────────────────────────────────────
const KEEP=[30,90,180,365,730];
const span=(n:number)=>n>=365?`${n/365} year${n>365?'s':''}`:`${n} days`;
export function PrivacyPanel({role,notice,go}:{role:string;notice:Notice;go:(v:string)=>void}){
 const [cfg,setCfg]=useState<any>(null),[saved,setSaved]=useState(''),[revision,setRevision]=useState(0),[stats,setStats]=useState<any>(null),[busy,setBusy]=useState(false),[q,setQ]=useState(''),[found,setFound]=useState<any>(null),[confirmText,setConfirmText]=useState('');
 const loadStats=()=>request('privacy-stats').then(setStats).catch(()=>{});
 useEffect(()=>{if(role!=='owner')return;request('configuration?key=operations').then(r=>{const v={analytics:true,retentionDays:365,dailyBackup:false,formRetentionDays:0,...r.value};setCfg(v);setSaved(JSON.stringify(v));setRevision(r.revision)}).catch(e=>notice(e.message));loadStats()},[]);// eslint-disable-line react-hooks/exhaustive-deps
 if(role!=='owner')return <div className="vault-card"><p>Only owners can change privacy settings.</p></div>;
 if(!cfg)return <p className="vault-card av-empty" role="status">Loading privacy settings…</p>;
 const dirty=JSON.stringify(cfg)!==saved,set=(k:string,v:any)=>setCfg((c:any)=>({...c,[k]:v}));
 async function save(){setBusy(true);try{const r=await request('configuration',{key:'operations',value:cfg,revision});setRevision(r.revision);setSaved(JSON.stringify(cfg));notice('Privacy settings saved.')}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 async function lookup(){setBusy(true);setFound(null);setConfirmText('');try{setFound(await request('privacy-lookup',{query:q}))}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 async function erase(){setBusy(true);try{const r=await request('privacy-erase',{query:q,confirm:confirmText.trim().toLowerCase()});notice(`Deleted ${r.leads} lead${r.leads===1?'':'s'} and ${r.events} visit record${r.events===1?'':'s'}.`);setFound(null);setQ('');setConfirmText('');loadStats()}catch(e){notice((e as Error).message)}finally{setBusy(false)}}
 const on=cfg.analytics!==false,days=Number(cfg.retentionDays)||365,leadDays=Number(cfg.formRetentionDays)||0;
 const policy=`${on?`This website records how visitors use it: the pages viewed and time spent on each, links and buttons clicked, forms sent and phone numbers tapped, together with the referring site, browser type and IP address. These records are kept for ${span(days)} and then deleted automatically.`:'This website does not record visitor journeys.'} When you send a request through our form, we keep the details you provide so we can reply${leadDays?`; archived requests are deleted after ${span(leadDays)}`:''}. ${on?'You can stop visit recording at any time with the “Don’t track my visits” link in the footer, and browsers that send the Global Privacy Control signal are never recorded. ':''}To see or delete the information we hold about you, contact us and we will respond promptly.`;
 return <div className="av-privacy">
  <div className={'vault-card av-traffic-hero'+(on?' on':'')}>
   <span className="av-backup-icon"><Activity size={26}/></span>
   <div><h2>{on?'Visit recording is on':'Visit recording is off'}</h2><p>{on?'Every visit is recorded so you can see journeys under Visitors and Calls. Search-engine bots are ignored, and visitors who opt out are never recorded.':'No visits are recorded. Visitors and Calls will stop updating.'}</p></div>
   <button type="button" role="switch" aria-checked={on} className={'av-switch av-switch-lg'+(on?' on':'')} onClick={()=>set('analytics',!on)}><span/>{on?'On':'Off'}</button>
  </div>
  <div className="av-backup-facts">
   <div className="vault-card"><Eye size={18}/><strong>What’s recorded</strong><p>Pages and time on each, clicks, form sends and phone taps, plus referrer, browser and IP address. Never passwords or form contents.</p></div>
   <div className="vault-card"><ShieldCheck size={18}/><strong>Opt-outs are honoured</strong><p>The footer’s “Don’t track my visits” link and the browser Global Privacy Control signal both stop recording for that visitor.</p></div>
   <div className="vault-card"><DatabaseBackup size={18}/><strong>Stored right now</strong><p>{stats?`${stats.events.toLocaleString()} visit records${stats.oldestEvent?` since ${fullTime(stats.oldestEvent)}`:''} · ${stats.leads} leads (${stats.archived} archived, ${stats.spam} spam)`:'Counting…'}</p><button type="button" className="av-link" onClick={()=>go('visitors')}>Open Visitors<ExternalLink size={13}/></button></div>
  </div>
  <section className="vault-card av-privacy-keep"><h3><Clock size={18}/>How long data is kept</h3><p className="muted">Older records are deleted automatically every 10 minutes.</p>
   <div className="av-keep-row"><div><strong>Visit records</strong><small>Visitor journeys, clicks and calls.</small></div><div className="av-seg av-seg-wrap">{KEEP.map(n=><button key={n} type="button" className={days===n?'selected':''} onClick={()=>set('retentionDays',n)}>{span(n)}</button>)}</div></div>
   <div className="av-keep-row"><div><strong>Archived and spam leads</strong><small>Leads you archived, or that were caught as spam. Inbox leads are never deleted automatically.</small></div><div className="av-seg av-seg-wrap">{[0,...KEEP.slice(1)].map(n=><button key={n} type="button" className={leadDays===n?'selected':''} onClick={()=>set('formRetentionDays',n)}>{n?span(n):'Keep forever'}</button>)}</div></div>
   <div className="av-keep-row"><div><strong>Daily backup</strong><small>Backups include leads but not visit records; they’re kept until you delete them under Backups.</small></div><button type="button" role="switch" aria-checked={!!cfg.dailyBackup} className={'av-switch'+(cfg.dailyBackup?' on':'')} onClick={()=>set('dailyBackup',!cfg.dailyBackup)}><span/>{cfg.dailyBackup?'On':'Off'}</button></div>
  </section>
  <section className="vault-card av-privacy-request"><h3><UserX size={18}/>A visitor asked to see or delete their data</h3><p className="muted">Find everything stored about one person by their email address (their leads) or IP address (their visits and leads), then delete it in one step.</p>
   <form className="av-rule-add" onSubmit={e=>{e.preventDefault();if(q.trim())lookup()}}><label className="av-find" style={{maxWidth:'none',flex:1}}><Search size={16} aria-hidden="true"/><Input aria-label="Email or IP address" placeholder="name@company.com or 203.0.113.7" value={q} onChange={e=>{setQ(e.target.value);setFound(null)}}/></label><Button type="submit" variant="outline" disabled={busy||!q.trim()}>Find data</Button></form>
   {found&&<div className="av-found">
    {!found.leads.length&&!found.events?<p className="av-verified"><CircleCheck size={16}/>Nothing is stored for {q}.</p>:<>
     <p><strong>{found.leads.length}</strong> lead{found.leads.length===1?'':'s'} and <strong>{found.events.toLocaleString()}</strong> visit record{found.events===1?'':'s'} (from {found.eventsFrom}).</p>
     {found.leads.length>0&&<ul className="av-use-list compact">{found.leads.map((l:any)=><li key={l.id}><span><span><strong>{l.name||'(no name)'}</strong><small>{l.email} · {fullTime(l.created_at)} · {l.status}</small></span></span></li>)}</ul>}
     <div className="av-erase"><CircleAlert size={16}/><span>To delete all of it permanently, type <code>{q.trim().toLowerCase()}</code></span><Input value={confirmText} onChange={e=>setConfirmText(e.target.value)} aria-label="Type to confirm"/><Button variant="destructive" disabled={busy||confirmText.trim().toLowerCase()!==q.trim().toLowerCase()} onClick={erase}><Trash2/>Delete everything</Button></div>
     <p className="av-attrib">Backups made before today still contain this data until they’re deleted.</p></>}
   </div>}
  </section>
  <section className="vault-card av-privacy-policy"><h3><FileText size={18}/>Wording for your privacy policy</h3><p className="muted">Matches the settings above. Copy it into the privacy policy whenever you change them.</p><blockquote>{policy}</blockquote><div className="actions"><Button variant="outline" onClick={()=>navigator.clipboard?.writeText(policy).then(()=>notice('Wording copied.'),()=>notice('Copy failed. Select the text instead.'))}><Copy/>Copy wording</Button><a className="av-link" href="/avault?view=pages&route=%2Fprivacy-policy%2F">Edit the privacy policy<ExternalLink size={13}/></a></div></section>
  {dirty&&<div className="av-savebar show" role="region" aria-label="Unsaved changes"><span>You have unsaved changes.</span><span className="actions"><Button variant="outline" disabled={busy} onClick={()=>setCfg(JSON.parse(saved))}>Discard</Button><Button disabled={busy} onClick={save}>{busy?'Saving…':'Save settings'}</Button></span></div>}
 </div>;
}
```

### app/avault/section-library-dialog.tsx

<!-- avault-file path="app/avault/section-library-dialog.tsx" mode="owned" sha256="da99c7020b509cbd5ead11124200b3aa03c561b0a7d000da241c7140bd45636a" eol="1" -->
```tsx
'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Search,Plus,LayoutPanelTop} from 'lucide-react';
import {request} from './content-tools';

// The “Add section” library: every section already designed on the site, deduplicated, with a live preview.
// Sections from pages with a different page design (e.g. a case study into a service page) are listed
// separately, since the page's styles may not fit them.
type Item={key:string;route:string;section:string;type:string;title:string;page:string;pages:number;context:string;fields:number};
const PREVIEW_CSS=`.site-loader,#site-loader,#page-curtain{display:none!important}
html{background:#fff!important}.is-loading body{overflow:auto!important}.is-loading #app,#app[inert]{opacity:1!important;visibility:visible!important;pointer-events:auto!important}
.reveal,[class*="reveal"]{opacity:1!important;transform:none!important;visibility:visible!important}
html,body{overflow:hidden!important}`;
const PREVIEW_WIDTH=1440;

export function SectionLibrary({open,route,onClose,onPick,busy}:{open:boolean;route:string;onClose:()=>void;onPick:(item:Item)=>void;busy:boolean}){
 const [data,setData]=useState<{context:string;items:Item[]}|null>(null),[error,setError]=useState(''),[query,setQuery]=useState(''),[others,setOthers]=useState(false),[pick,setPick]=useState<Item|null>(null),[html,setHtml]=useState(''),[height,setHeight]=useState(600),[width,setWidth]=useState(600);
 const frame=useRef<HTMLIFrameElement>(null),observer=useRef<ResizeObserver|null>(null);
 // The preview stage mounts and unmounts with the dialog, so it is measured whenever a new one appears.
 const stage=useCallback((el:HTMLDivElement|null)=>{observer.current?.disconnect();observer.current=null;if(!el)return;const fit=()=>{if(el.clientWidth)setWidth(el.clientWidth)};fit();observer.current=new ResizeObserver(fit);observer.current.observe(el)},[]);
 useEffect(()=>{if(!open||data)return;request('section-library?route='+encodeURIComponent(route)).then(setData).catch(e=>setError((e as Error).message))},[open,data,route]);
 useEffect(()=>{if(!pick){setHtml('');return}let live=true;setHtml('');request('section-preview',{route:pick.route,section:pick.section}).then((r:any)=>{if(live)setHtml(r.html.replace('</head>',()=>`<style>${PREVIEW_CSS}</style></head>`))}).catch(e=>{if(live)setError((e as Error).message)});return()=>{live=false}},[pick]);
 const shown=useMemo(()=>{if(!data)return [];const q=query.trim().toLowerCase();return data.items.filter(i=>(others||i.context===data.context)&&(!q||(i.type+' '+i.title+' '+i.page).toLowerCase().includes(q)))},[data,query,others]);
 const groups=useMemo(()=>{const m=new Map<string,Item[]>();for(const i of shown)m.set(i.type,[...(m.get(i.type)||[]),i]);return [...m]},[shown]);
 const otherCount=data?data.items.filter(i=>i.context!==data.context).length:0;
 const scale=Math.min(1,width/PREVIEW_WIDTH);
 // Only the chosen section shows: everything beside it or beside its wrappers (header, footer, other content) is hidden.
 function loaded(){const d=frame.current?.contentDocument;if(!d)return;let el:Element|null=d.querySelector('[data-av-section]');while(el&&el.parentElement&&el.tagName!=='BODY'){for(const c of el.parentElement.children)if(c!==el)(c as HTMLElement).style.display='none';el=el.parentElement}const measure=()=>setHeight(Math.max(200,d.documentElement.scrollHeight));new ResizeObserver(measure).observe(d.body);measure()}

 return <Dialog open={open} onOpenChange={v=>{if(!v)onClose()}}>
  <DialogContent className="av-library sm:max-w-[1180px]">
   <div className="av-library-head"><span className="av-library-mark" aria-hidden="true"><LayoutPanelTop/></span><div><DialogTitle>Add a section</DialogTitle><DialogDescription>Choose a proven section from your website. Its design and starter copy are copied into this page for you to edit.</DialogDescription></div><span className="av-library-total">{data?shown.length:'—'} available</span></div>
   <div className="av-library-body">
    <div className="av-library-list">
     <label className="av-search"><Search size={16}/><Input placeholder="Find a section…" value={query} onChange={e=>setQuery(e.target.value)} aria-label="Find a section"/></label>
     {otherCount>0&&<label className="inline av-library-others"><input type="checkbox" checked={others} onChange={e=>setOthers(e.target.checked)}/>Include {otherCount} sections from other page designs</label>}
     {error&&<p role="alert">{error}</p>}
     {!data&&!error&&<p role="status">Loading sections…</p>}
     {data&&!shown.length&&<p className="av-library-no-results">No sections match “{query}”. Try another search or include other page designs.</p>}
     {groups.map(([type,items])=><div key={type} className="av-library-group"><h3><span>{type}</span><small>{items.length}</small></h3>{items.map(i=><button type="button" key={i.key} className={pick?.key===i.key?'selected':''} onClick={()=>setPick(i)}><strong>{i.title}</strong><span><small>{i.page}</small>{i.pages>1&&<small>Used on {i.pages} pages</small>}{i.context!==data?.context&&<small>Different page design</small>}</span></button>)}</div>)}
    </div>
    <div className="av-library-preview">
     {!pick&&<div className="av-library-empty"><LayoutPanelTop aria-hidden="true"/><strong>Preview a section</strong><p>Select any section on the left to see its real website design here before adding it.</p></div>}
     {pick&&<><div className="av-library-bar"><span><strong>{pick.type}</strong><small>From {pick.page}</small></span><Button disabled={busy} onClick={()=>onPick(pick)}><Plus/>{busy?'Adding…':'Add this section'}</Button></div>
      <div className="av-library-stage" ref={stage}>{html?<div style={{height:height*scale,position:'relative'}}><iframe ref={frame} title="Section preview" srcDoc={html} onLoad={loaded} sandbox="allow-same-origin" style={{width:PREVIEW_WIDTH,height,transform:`scale(${scale})`,transformOrigin:'0 0',position:'absolute',left:0,top:0,border:0,pointerEvents:'none'}}/></div>:<p role="status" style={{padding:24}}>Loading preview…</p>}</div></>}
    </div>
   </div>
  </DialogContent>
 </Dialog>;
}
export type LibraryItem=Item;
```

### app/avault/session.ts

<!-- avault-file path="app/avault/session.ts" mode="owned" sha256="97e5c51f5f6eca00ac4f14959deaa51f50b17247dd6a57567ee02d89c945aea6" eol="1" -->
```ts
// Every AVAULT call to /api/admin goes through adminFetch. A 401 means the session expired, was revoked (password or
// role change, user deactivated) or the cookie is gone, so the browser goes to the sign-in page and returns to this
// same screen afterwards instead of showing "Sign in to continue." on every action.
let leaving=false;

export function signInAgain(){
 if(leaving)return;leaving=true;
 // With unsaved page changes the browser first asks whether to leave; if the editor stays, the next call tries again.
 setTimeout(()=>{leaving=false},3000);
 location.href='/avault/login/?next='+encodeURIComponent(location.pathname+location.search);
}

export async function adminFetch(path:string,init?:RequestInit){
 const r=await fetch('/api/admin/'+path,init);
 if(r.status===401){signInAgain();throw new Error('Your session has ended. Taking you to sign in…')}
 return r;
}

// Where to go after signing in: only AVAULT screens, never another site or the sign-in page itself.
export function safeNext(value:string|null|undefined){
 const next=String(value||'');
 return /^\/avault(?:\/|\?|$)/.test(next)&&!next.startsWith('/avault/login')&&!/[\\\s]/.test(next)?next:'/avault/';
}
```

### app/avault/theme.css

<!-- avault-file path="app/avault/theme.css" mode="owned" sha256="fefde2d852ad47bb9fa06dec4acb704f0ed0e5397c929df48d6f9e230004d93a" eol="1" -->
```css
/* AVAULT theme, matched to the public homepage: Cal Sans display type, Google Sans Flex text,
   Google-colour pill buttons, soft paper backgrounds, 14–20px cards and letter-spaced kickers. */
:root{--av-blue:#1a73e8;--av-blue-soft:#e8f0fe;--av-red:#d93025;--av-red-soft:#fce8e6;--av-green:#188038;--av-green-soft:#e6f4ea;--av-yellow:#f9ab00;--av-yellow-soft:#fef7e0;--av-ink:#202124;--av-copy:#5f6368;--av-muted:#80868b;--av-line:#e4e7ec;--av-paper:#f7f9fc;--av-display:"Cal Sans","Google Sans Flex",Arial,sans-serif;--av-bar:linear-gradient(90deg,#4285f4 0 25%,#ea4335 0 50%,#fbbc05 0 75%,#34a853 0)}
body:has(.vault),body:has(.av-login){background:var(--av-paper)}
.vault{background:var(--av-paper);color:var(--av-ink);font-family:var(--font-sans)}
.vault ::selection{background:var(--av-blue-soft)}

/* Sidebar */
.vault-sidebar{background:#fff;border-right:1px solid var(--av-line);padding:26px 18px}
.vault-brand{font-family:var(--av-display);font-weight:400;font-size:28px;letter-spacing:-1px;color:var(--av-ink)}
.vault-brand span{font-family:var(--font-sans);font-size:9.5px;letter-spacing:2.4px;font-weight:700;color:var(--av-muted)}
.vault .vault-navlabel{display:flex;align-items:center;gap:10px;margin:26px 12px 8px;font-size:10.5px;font-weight:760;letter-spacing:1.6px;text-transform:uppercase;color:var(--av-muted)}
.vault .vault-navlabel::before{content:"";width:18px;height:3px;border-radius:3px;background:var(--av-bar);flex:none}
.vault-sidebar nav{gap:2px}
.vault-sidebar nav button{border-radius:999px;padding:10px 14px;font-size:14px;font-weight:550;color:#3c4043;transition:background .15s,color .15s}
.vault-sidebar nav button:hover{background:#f1f3f4}
.vault-sidebar nav button.selected{background:var(--av-blue-soft);color:#1967d2;font-weight:650}
.vault-account{border-top:1px solid var(--av-line);margin-top:24px;padding-top:18px;font-size:12px}
.vault-sidebar>a:last-child{display:inline-flex;align-self:flex-start;margin-top:6px;padding:7px 14px;border:1px solid var(--av-line);border-radius:999px;font-size:12px;font-weight:600;color:var(--av-copy)}
.vault-sidebar>a:last-child:hover{border-color:var(--av-red);color:var(--av-red)}

/* Top bar and titles */
.vault-top{background:rgba(255,255,255,.86);backdrop-filter:blur(10px);border-bottom:1px solid var(--av-line);position:sticky;top:0;z-index:5;font-size:14px;font-weight:550}
.vault-top a{padding:8px 16px;border-radius:999px;border:1px solid var(--av-line);font-weight:600}
.vault-top a:hover{border-color:var(--av-blue);color:var(--av-blue)}
.vault h1{font-family:var(--av-display);font-weight:400;font-size:clamp(34px,4vw,52px);letter-spacing:-.045em;line-height:1.02;color:var(--av-ink)}
.vault h2{font-family:var(--av-display);font-weight:400;font-size:22px;letter-spacing:-.02em;color:var(--av-ink)}
.vault h3{font-weight:700;font-size:16px}
.vault p{color:var(--av-copy)}
.vault .eyebrow{display:flex;align-items:center;gap:12px;font-size:11.5px;font-weight:760;letter-spacing:1.8px;color:#646b77}
.vault .eyebrow::before{content:"";width:24px;height:3px;border-radius:3px;background:var(--av-bar)}
.vault-title{margin-bottom:32px}

/* Cards */
.vault-card,.vault-fields{background:#fff;border:1px solid var(--av-line);border-radius:20px;padding:28px}
.vault-block{background:var(--av-paper);border:1px solid var(--av-line);border-radius:16px}
.vault-row{border-bottom:1px solid #eef0f3}
.vault-list .vault-row:hover{background:#fafbfd}
.vault-stats{grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}
.vault-stats .vault-card{position:relative;overflow:hidden;padding:24px;transition:transform .15s,border-color .15s}
.vault-stats .vault-card:hover{transform:translateY(-2px);border-color:#cfd6e0}
.vault-stats .vault-card p{font-size:12px;font-weight:760;letter-spacing:1.2px;text-transform:uppercase;color:var(--av-muted);margin:0 0 8px}
.vault-stats strong{font-family:var(--av-display);font-weight:400;font-size:48px;letter-spacing:-.04em;line-height:1}
.vault-stats .vault-card:nth-child(4n+1) strong{color:var(--av-blue)}
.vault-stats .vault-card:nth-child(4n+2) strong{color:var(--av-red)}
.vault-stats .vault-card:nth-child(4n+3) strong{color:var(--av-green)}
.vault-stats .vault-card:nth-child(4n+4) strong{color:#e37400}
.vault-stats .vault-card::after{content:"";position:absolute;right:-28px;top:-28px;width:92px;height:92px;border-radius:50%;opacity:.55}
.vault-stats .vault-card:nth-child(4n+1)::after{background:var(--av-blue-soft)}
.vault-stats .vault-card:nth-child(4n+2)::after{background:var(--av-red-soft)}
.vault-stats .vault-card:nth-child(4n+3)::after{background:var(--av-green-soft)}
.vault-stats .vault-card:nth-child(4n+4)::after{background:var(--av-yellow-soft)}
.vault-notice{background:var(--av-blue-soft);border:1px solid #c6dafc;border-radius:16px;color:#174ea6}
.search-preview{background:var(--av-paper);border:1px solid var(--av-line);border-radius:16px}
.search-preview h3{font-family:var(--font-sans);font-weight:500}

/* Controls */
.vault [data-slot="button"],.av-login [data-slot="button"]{border-radius:999px;font-weight:600;letter-spacing:.005em;height:auto;min-height:40px;padding:9px 18px;box-shadow:none;transition:background .15s,border-color .15s,color .15s,transform .1s}
.vault [data-slot="button"]:active{transform:translateY(1px)}
.vault [data-slot="button"][data-variant="default"],.av-login [data-slot="button"][data-variant="default"]{background:var(--av-blue);border:1px solid var(--av-blue);color:#fff}
.vault [data-slot="button"][data-variant="default"]:hover,.av-login [data-slot="button"][data-variant="default"]:hover{background:#1765cc}
.vault [data-slot="button"][data-variant="outline"]{background:#fff;border:1px solid #dadce0;color:#3c4043}
.vault [data-slot="button"][data-variant="outline"]:hover{border-color:var(--av-blue);color:var(--av-blue);background:#fff}
.vault [data-slot="button"]:disabled{opacity:.45}
.vault [data-slot="input"],.vault [data-slot="textarea"],.vault select,.av-login [data-slot="input"]{border:1px solid #dadce0;border-radius:12px;background:#fff;box-shadow:none;min-height:42px;padding:9px 14px;font-size:15px}
.vault [data-slot="input"]:focus,.vault [data-slot="textarea"]:focus,.vault select:focus,.av-login [data-slot="input"]:focus{outline:none;border-color:var(--av-blue);box-shadow:0 0 0 3px rgba(26,115,232,.16)}
.vault input[type="checkbox"]{accent-color:var(--av-blue);width:16px;height:16px}
.vault label{font-weight:550;color:#3c4043}
.vault label small{font-weight:400}
.vault [data-slot="badge"]{border-radius:999px;font-weight:650;padding:3px 10px}
.vault [data-slot="badge"][data-variant="secondary"]{background:var(--av-green-soft);color:var(--av-green)}
.vault [data-slot="badge"][data-variant="default"]{background:var(--av-yellow-soft);color:#b06000}
.vault [data-slot="badge"][data-variant="destructive"]{background:var(--av-red-soft);color:var(--av-red)}
.vault [data-slot="badge"][data-variant="outline"]{border-color:#c6dafc;color:#1967d2}
.vault [data-slot="tabs-list"]{background:#fff;border:1px solid var(--av-line);border-radius:999px;padding:4px;gap:2px}
.vault [data-slot="tabs-trigger"]{border-radius:999px;padding:8px 16px;font-weight:600}
.vault [data-slot="tabs-trigger"][data-state="active"],.vault [data-slot="tabs-trigger"][aria-selected="true"]{background:var(--av-blue-soft);color:#1967d2;box-shadow:none}
.vault-tabs{gap:6px}
.vault-sectionlist button{border-radius:999px;padding:9px 14px}
.vault-sectionlist .selected{background:var(--av-blue-soft);color:#1967d2}
.vault a{color:inherit}
.vault-main a:not([data-slot]){color:var(--av-blue);font-weight:550}
.vault .error{color:var(--av-red)}
.vault details>summary{cursor:pointer;font-weight:650;padding:8px 0;color:#3c4043}
.vault-preview iframe{border-radius:20px;border:1px solid var(--av-line);box-shadow:0 24px 70px rgba(22,27,38,.08)}
.vault-media .vault-card img{border-radius:12px;background:var(--av-paper)}

/* Sign-in page */
.av-login{min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 50% -10%,#e8f0fe 0,rgba(232,240,254,0) 55%),var(--av-paper);font-family:var(--font-sans)}
.av-login-card{width:100%;max-width:440px;background:#fff;border:1px solid var(--av-line);border-radius:24px;padding:40px}
.av-login-card h1{font-family:var(--av-display);font-weight:400;font-size:40px;letter-spacing:-.045em;line-height:1.02;margin:26px 0 10px;color:var(--av-ink)}
.av-login-card .eyebrow{display:flex;align-items:center;gap:12px;font-size:11px;font-weight:760;letter-spacing:1.8px;color:#646b77}
.av-login-card .eyebrow::before{content:"";width:24px;height:3px;border-radius:3px;background:var(--av-bar)}
.av-login-card p{color:var(--av-copy)}
.av-login-card label{font-weight:550;color:#3c4043}
.av-login-card a{color:var(--av-blue);font-weight:550}

@media(max-width:1100px){.vault-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:700px){.vault-card,.vault-fields{padding:20px;border-radius:16px}.vault-sidebar nav button{padding:8px 12px}.av-login-card{padding:28px}}

.vault-row time{white-space:nowrap;font-size:13px;color:var(--av-muted)}
.vault-sidebar nav button{padding:9px 14px}
.vault-row.wrap{flex-wrap:wrap}
.vault-row.wrap>.vault-block,.vault-row.wrap>ol{flex-basis:100%;margin-top:4px}
.vault-dl .vault-row{justify-content:flex-start;padding:10px 4px}
.vault-dl dt{flex:0 0 170px;color:var(--av-muted);font-size:13px;font-weight:650}
.vault-dl dd{flex:1;margin:0}

/* Forms: consistent vertical rhythm, including bare inputs */
.vault form.vault-card{display:grid;gap:16px;align-content:start}
.vault form.vault-card>label,.vault form.vault-card>.vault-block{margin:0}
.vault form.vault-card>h2{margin-bottom:0}
.vault form.vault-card>p{margin:0}
.vault form.vault-card>[data-slot="button"]{justify-self:start}
.vault label{display:grid;gap:8px}
.vault label.inline{display:flex;gap:10px;align-items:center}

/* Blog post editor: the live article's typography (from public/site.css), scoped to the canvas */
.av-post-canvas{--blog-accent:#fbbc05;--blog-tint:#fef7e0;background:#fff;border:1px solid var(--av-line);border-radius:20px;overflow:hidden}
.av-post-canvas.blog-blue{--blog-tint:#e8f0fe}.av-post-canvas.blog-red{--blog-tint:#fce8e6}.av-post-canvas.blog-green{--blog-tint:#e6f4ea}
.av-post-header{background:var(--blog-tint);padding:36px 48px 40px;display:grid;gap:14px}
.av-post-header input,.av-post-header textarea{background:transparent;border:1px dashed transparent;border-radius:10px;padding:4px 8px;margin:0 -8px;color:inherit;font:inherit;resize:vertical;width:100%}
.av-post-header input:hover,.av-post-header textarea:hover{border-color:rgba(32,33,36,.2)}
.av-post-header input:focus,.av-post-header textarea:focus{outline:none;border-color:var(--av-blue);background:rgba(255,255,255,.6)}
.av-post-eyebrow{display:flex;gap:6px;font-size:13px;font-weight:760;letter-spacing:1.6px;text-transform:uppercase;color:#5f6368}.av-post-eyebrow input{width:auto;flex:0 1 auto}
.av-post-title{font-family:var(--av-display);font-size:clamp(34px,4vw,60px);line-height:1.08;letter-spacing:-1.5px;color:#202124}
.av-post-deck{font-size:20px;line-height:1.6;color:#5f6368}
.av-post-meta{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:14px;color:#5f6368}.av-post-meta input{width:auto}
.av-toolbar{position:sticky;top:76px;z-index:4;display:flex;flex-wrap:wrap;align-items:center;gap:2px;padding:8px 14px;background:rgba(255,255,255,.96);backdrop-filter:blur(8px);border-top:1px solid var(--av-line);border-bottom:1px solid var(--av-line)}
.av-toolbar select{min-height:34px;padding:4px 10px;border:1px solid #dadce0;border-radius:999px;font-size:13px;background:#fff}
.av-tool{display:inline-grid;place-items:center;min-width:34px;height:34px;padding:0 8px;border-radius:999px;border:0;background:none;color:#3c4043;cursor:pointer}
.av-tool:hover{background:#f1f3f4}.av-tool.on{background:var(--av-blue-soft);color:#1967d2}.av-tool:disabled{opacity:.35;cursor:default}
.av-tool-text{font-size:12.5px;font-weight:650}
.av-sep{width:1px;height:22px;background:var(--av-line);margin:0 6px}
.av-post-body{max-width:none;padding:48px 56px 64px;font-size:18px;line-height:1.8;color:#3c4043}
.av-post-body .av-prose{outline:none;min-height:420px}
.av-post-body p{margin:0 0 24px}
.av-post-body h2{font-family:var(--av-display);font-weight:400;color:#202124;font-size:34px;line-height:1.2;margin:48px 0 20px;letter-spacing:-.5px}
.av-post-body h3{font-family:var(--av-display);font-weight:400;color:#202124;font-size:25px;line-height:1.3;margin:32px 0 16px}
.av-post-body h4{color:#202124;font-size:20px;margin:28px 0 12px}
.av-post-body a{color:#1967d2;text-decoration:underline;text-underline-offset:3px}
.av-post-body ul,.av-post-body ol{padding-left:24px;margin:0 0 28px}.av-post-body ul{list-style:disc}.av-post-body ol{list-style:decimal}
.av-post-body li{margin:10px 0;padding-left:5px}.av-post-body li p{margin:0}
.av-post-body blockquote{border-top:2px solid var(--blog-accent);padding:18px 0 4px;margin:28px 0;color:#202124;font-size:20px}
.av-post-body pre{background:#202124;color:#e8eaed;border-radius:12px;padding:18px 20px;font-size:14px;overflow:auto}
.av-post-body code{background:#f1f3f4;border-radius:6px;padding:1px 6px;font-size:.9em}.av-post-body pre code{background:none;padding:0}
.av-post-body hr{border:0;border-top:1px solid #dadce0;margin:40px 0}
.av-post-body img{max-width:100%;height:auto;border-radius:14px;margin:12px 0}.av-post-body img.ProseMirror-selectednode{outline:3px solid var(--av-blue)}
.av-post-body mark{background:#fef7e0;padding:0 2px}
.av-post-body table{width:100%;border-collapse:collapse;font-size:16px;line-height:1.6;text-align:left;margin:30px 0;border:1px solid #dadce0;border-radius:14px;overflow:hidden;table-layout:fixed}
.av-post-body th,.av-post-body td{padding:14px 18px;border:1px solid #e8eaed;vertical-align:top;position:relative}
.av-post-body th{background:var(--blog-tint);color:#202124;font-weight:600}
.av-post-body .selectedCell::after{content:"";position:absolute;inset:0;background:rgba(26,115,232,.12);pointer-events:none}
.av-post-body .ProseMirror p.is-editor-empty:first-child::before{content:"Start writing…";color:#9aa0a6;float:left;height:0;pointer-events:none}
.av-post-count{font-size:13px;color:var(--av-muted);margin:10px 4px 24px}
.vault .av-plain{border:1px solid #dadce0;border-radius:12px;min-height:40px;padding:8px 12px;font:inherit;width:100%}
@media(max-width:700px){.av-post-header{padding:24px 20px}.av-post-body{padding:28px 20px 40px;font-size:17px}.av-toolbar{top:60px}}
/* Header pieces: inline inputs that grow with their text, so the header reads like the live one */
.av-post-header>div{display:flex;flex-wrap:wrap;align-items:baseline;gap:0}
.av-post-header>div input{width:auto;max-width:100%;flex:0 1 auto;margin:0}
.av-post-header .av-post-title input{font-family:var(--av-display);font-size:clamp(34px,4vw,60px);line-height:1.12;letter-spacing:-1.5px;color:#202124}
.av-post-header .av-post-title input.accent{color:var(--av-red)}
.av-post-canvas.blog-yellow .av-post-title input.accent{color:#e37400}.av-post-canvas.blog-blue .av-post-title input.accent{color:var(--av-blue)}.av-post-canvas.blog-green .av-post-title input.accent{color:var(--av-green)}
.av-post-header .av-post-deck input{font-size:20px;line-height:1.6;color:#5f6368}
.av-post-header .av-post-eyebrow input{font-size:13px;font-weight:760;letter-spacing:1.6px;text-transform:uppercase;color:#5f6368}
.av-post-header .av-post-meta{gap:4px 14px}.av-post-header .av-post-meta input{font-size:14px;color:#5f6368}
.vault .av-toolbar select{width:auto;min-height:34px;flex:0 0 auto}
/* Header text flows like the live header; each piece is editable in place */
.av-post-header>div{display:block}
.av-piece{outline:none;border-radius:8px;white-space:pre-wrap;box-decoration-break:clone;-webkit-box-decoration-break:clone;transition:background .12s}
.av-piece:hover{background:rgba(32,33,36,.06)}.av-piece:focus{background:rgba(255,255,255,.75);box-shadow:0 0 0 2px var(--av-blue)}
.av-piece:empty::before{content:"…";color:#9aa0a6}
.av-post-header .av-post-title{font-family:var(--av-display);font-size:clamp(34px,4vw,60px);line-height:1.12;letter-spacing:-1.5px;color:#202124}
.av-post-header .av-post-title .accent{color:var(--av-red)}
.av-post-canvas.blog-yellow .av-post-title .accent{color:#e37400}.av-post-canvas.blog-blue .av-post-title .accent{color:var(--av-blue)}.av-post-canvas.blog-green .av-post-title .accent{color:var(--av-green)}
.av-post-header .av-post-deck{font-size:20px;line-height:1.6;color:#5f6368}
.av-post-header .av-post-eyebrow{font-size:13px;font-weight:760;letter-spacing:1.6px;text-transform:uppercase;color:#5f6368}
.av-post-header .av-post-meta{display:flex;flex-wrap:wrap;gap:4px 22px;font-size:14px;color:#5f6368}
/* Same reading measure as the live article column (850px), so line lengths match what readers see */
.av-post-body>div{max-width:850px;margin:0 auto}

/* Toasts (sonner): every AVAULT notice, dismissed on its own. */
[data-sonner-toaster] .vault-toast{font-family:var(--font-sans);font-size:14px;border-radius:16px;box-shadow:0 12px 32px #20212420}

/* Shared bits for the visual editors */
.av-seg{display:inline-flex;gap:2px;padding:3px;border:1px solid var(--av-line);border-radius:999px;background:#fff}
.av-seg button{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:999px;font-size:13px;font-weight:600;color:var(--av-copy)}
.av-seg button:hover{color:var(--av-ink)}
.av-seg button.selected{background:var(--av-blue-soft);color:#1967d2}
.av-link{display:inline-flex;align-items:center;gap:5px;padding:0;background:none;border:0;color:var(--av-blue);font-size:12.5px;font-weight:600;cursor:pointer}
.av-link:hover{text-decoration:underline}
.av-subtitle{margin-top:40px}
.av-subtitle h2{font-family:var(--av-display);font-weight:400;font-size:26px;margin:0 0 4px}

/* Header & footer editor */
.av-nav-toolbar{display:flex!important;flex-wrap:wrap;align-items:center;gap:12px;padding:14px 16px!important;position:sticky;top:12px;z-index:5;overflow:visible!important}
.av-nav-hint{display:inline-flex;align-items:center;gap:7px;color:var(--av-copy);font-size:13px}
.av-nav-actions{display:flex;flex-wrap:wrap;gap:8px;margin-left:auto}
.av-nav-layout{position:relative}
.av-nav-stage{min-width:0;overflow:hidden;border:1px solid var(--av-line);border-radius:20px;background:#fff;box-shadow:0 1px 2px #2021240a}
.av-nav-stage iframe{border:0;background:#fff}
.av-nav-inspector{position:fixed!important;right:28px;top:96px;z-index:30;width:min(360px,calc(100vw - 56px));max-height:calc(100vh - 124px);overflow:auto!important;margin:0!important;box-shadow:0 24px 60px #20212429,0 2px 6px #2021241a;animation:av-pop .18s cubic-bezier(.2,.8,.2,1)}
@keyframes av-pop{from{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:none}}
.av-nav-close{position:absolute;top:12px;right:14px;width:32px;height:32px;border-radius:50%;background:none;border:0;font-size:22px;line-height:1;color:var(--av-copy);cursor:pointer}
.av-nav-close:hover{background:#f1f3f4;color:var(--av-ink)}
.av-nav-inspector h2{font-family:var(--av-display);font-weight:400;font-size:24px;margin:0}
.av-nav-inspector p{margin:0;color:var(--av-copy);font-size:14px;line-height:1.55}
.av-nav-tips{display:grid;gap:10px;margin:0;padding:0;list-style:none;font-size:13.5px;color:var(--av-copy);line-height:1.5}
.av-nav-tips li{padding:10px 12px;border-radius:12px;background:var(--av-paper)}
.av-nav-tips b{color:var(--av-ink)}
.av-nav-field{display:grid;gap:6px;font-size:13px;font-weight:600;color:var(--av-ink)}
.av-nav-field>span{display:flex;align-items:center;gap:8px}
.av-nav-field small{font-weight:500;color:var(--av-muted);font-size:12px}
.av-nav-changes{border-top:1px solid var(--av-line);padding-top:14px;display:grid;gap:4px}
.av-nav-changes h3{margin:0 0 4px;font-size:14px}
.av-nav-changes .vault-row{padding:8px 0;gap:10px}
.av-nav-changes .vault-row>span{display:grid;gap:2px;min-width:0;font-size:13px}
.av-nav-changes del{color:var(--av-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.av-nav-changes strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.av-nav-all{margin-top:20px}
.av-nav-all summary{cursor:pointer;font-weight:650}
.av-nav-all>p{margin:0;color:var(--av-copy);font-size:14px}
.av-search{display:flex;align-items:center;gap:8px;max-width:420px;color:var(--av-muted)}
.av-nav-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}


/* Forms */
.av-forms-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-bottom:20px}
.av-form-card{display:grid!important;grid-template-columns:auto 1fr;gap:4px 12px!important;align-items:center;text-align:left;margin:0!important;padding:18px 20px!important;cursor:pointer}
.av-form-card:hover{border-color:#c6dafc}
.av-form-card.selected{border-color:var(--av-blue);box-shadow:0 0 0 3px var(--av-blue-soft)}
.av-form-card small{grid-column:2;color:var(--av-copy);font-size:13px}
.av-form-card .av-form-dot{width:10px;height:10px;border-radius:50%;background:var(--av-blue);grid-row:span 2}
.av-form-card:nth-child(2) .av-form-dot{background:#34a853}
.av-form-card>[data-slot="badge"],.av-form-card>.badge{grid-column:2;justify-self:start}
.av-forms-layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(340px,1fr);gap:20px;align-items:start}
.av-forms-preview .actions{justify-content:space-between}
.av-forms-preview h2,.av-forms-fields h2{font-family:var(--av-display);font-weight:400;font-size:24px;margin:0}
.av-forms-frame{display:flex;justify-content:center;border:1px solid var(--av-line);border-radius:16px;overflow:hidden;background:#fff}
.av-forms-frame iframe{border:0;max-width:100%}
.av-forms-pages{display:grid;gap:6px;margin:0;padding:0;list-style:none;max-height:260px;overflow:auto;font-size:13.5px}
.av-forms-pages li{display:flex;justify-content:space-between;gap:12px}
.av-forms-pages small{color:var(--av-muted)}
.av-forms-fields>p{margin:0;color:var(--av-copy);font-size:14px;line-height:1.55}
.av-forms-fields label{display:grid;gap:6px;font-size:13px;font-weight:600}
.av-forms-fields label small{font-weight:500;color:var(--av-muted)}
.av-field-list{display:grid;gap:8px;margin:0;padding:0;list-style:none}
.av-field-list>li{border:1px solid var(--av-line);border-radius:14px;background:#fff;transition:border-color .15s,box-shadow .15s}
.av-field-list>li.open{border-color:#c6dafc;box-shadow:0 0 0 3px var(--av-blue-soft)}
.av-field-head{display:flex;align-items:center;gap:6px;padding:6px 6px 6px 14px}
.av-field-head svg[aria-label]{color:var(--av-muted)}
.av-field-head .actions{margin-left:auto;gap:0}
.av-field-title{display:grid;gap:2px;flex:1;min-width:0;padding:6px 0;background:none;border:0;text-align:left;cursor:pointer}
.av-field-title strong{font-size:14.5px}
.av-field-title small{color:var(--av-copy);font-size:12.5px}
.av-field-body{display:grid;gap:12px;padding:4px 14px 16px;border-top:1px solid #eef0f3;padding-top:14px}
.av-field-body select{height:40px;border:1px solid var(--av-line);border-radius:10px;padding:0 10px;background:#fff;font:inherit}
.av-field-row{display:flex;flex-wrap:wrap;gap:8px 20px}
.av-field-row .inline{display:inline-flex!important;align-items:center;gap:8px;font-weight:500!important}
.av-add{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:12px;border:1px dashed #c9ced6;border-radius:14px}
.av-add>span{font-size:13px;font-weight:650;margin-right:4px}
.av-forms-save{display:flex;justify-content:flex-end;gap:8px;border-top:1px solid var(--av-line);padding-top:16px}
@media (max-width:1180px){.av-forms-layout{grid-template-columns:1fr}}

/* ── Tables (pages, blogs, SEO health, redirects) ─────────────────────── */
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.av-seg-wrap{flex-wrap:wrap;border-radius:16px}
.av-count{display:inline-grid;place-items:center;min-width:22px;height:20px;margin-left:6px;padding:0 6px;border-radius:999px;background:#f1f3f4;color:var(--av-copy);font-size:11.5px;font-weight:700}
.av-seg button.selected .av-count{background:#fff;color:#1967d2}
.av-find{display:flex!important;flex-direction:row!important;margin:0!important;align-items:center;gap:8px;flex:1 1 220px;max-width:340px;padding:0 12px;border:1px solid var(--av-line);border-radius:999px;background:#fff;color:var(--av-muted)}
.av-find input{border:0!important;box-shadow:none!important;padding-left:0;background:transparent}
.av-sort{display:inline-flex!important;flex-direction:row!important;margin:0!important;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--av-copy)}
.av-sort select{width:auto!important;min-width:0;height:36px;padding:0 10px;border:1px solid var(--av-line);border-radius:10px;background:#fff;font:inherit;font-weight:500;color:var(--av-ink)}
.av-table-card{padding:0!important;gap:0!important}
.av-table-tools{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid var(--av-line)}
.av-table-meta{margin-left:auto;font-size:13px;color:var(--av-copy)}
.av-table{display:grid}
.av-tr{display:grid;align-items:center;gap:16px;padding:14px 20px;border-bottom:1px solid #eef0f3;font-size:14px}
.av-tr:last-child{border-bottom:0}
.av-th{position:sticky;top:0;z-index:1;padding-top:10px;padding-bottom:10px;background:#fafbfc;font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--av-muted)}
.av-row-link{cursor:pointer;transition:background .12s}
.av-row-link:hover{background:#f8fafd}
.av-cell-title{display:grid;gap:3px;min-width:0}
.av-cell-title>button{justify-self:start;max-width:100%;padding:0;background:none;border:0;text-align:left;font:inherit;font-weight:650;color:var(--av-ink);cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.av-cell-title>button:hover{color:var(--av-blue);text-decoration:underline}
.av-cell-title small{font-size:12.5px;color:var(--av-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.av-cell-title code{justify-self:start;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:3px 8px;border-radius:8px;background:var(--av-paper);font-size:13px}
.av-muted-cell{display:grid;gap:2px;color:var(--av-copy);font-size:13.5px}
.av-muted-cell small{font-size:12px;color:var(--av-muted)}
.av-status-cell{display:grid;justify-items:start;gap:4px}
.av-status-cell small{font-size:12px;color:var(--av-muted)}
.av-status-cell .av-edits{color:#b06000;font-weight:600}
.av-status-cell .av-edits::before{content:"";display:inline-block;width:6px;height:6px;margin-right:6px;border-radius:50%;background:var(--av-yellow);vertical-align:1px}
.av-actions-cell{display:flex;align-items:center;justify-content:flex-end;gap:6px;color:var(--av-muted)}
.av-actions-cell a{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;color:var(--av-copy)}
.av-actions-cell a:hover{background:var(--av-blue-soft);color:var(--av-blue)}
.av-pill{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:650;line-height:1.5;white-space:nowrap}
.av-pill::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.av-pill-live{background:var(--av-green-soft);color:var(--av-green)}
.av-pill-draft{background:#f1f3f4;color:#5f6368}
.av-pill-scheduled{background:var(--av-blue-soft);color:#1967d2}
.av-pill-warn{background:var(--av-yellow-soft);color:#b06000}
.av-dot-label{display:inline-flex;align-items:center;gap:7px;font-size:13px;color:var(--av-copy)}
.av-dot-label::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--av-green)}
.av-dot-label.off::before{background:#bdc1c6}
.av-empty{padding:28px 20px;margin:0;text-align:center;color:var(--av-copy)}
.av-table-foot{margin:0;padding:12px 20px;border-top:1px solid var(--av-line);font-size:12.5px;color:var(--av-muted)}
.av-docs .av-tr{grid-template-columns:minmax(0,1fr) 110px 150px 100px 110px 72px}
.av-docs-posts .av-tr{grid-template-columns:minmax(0,1fr) 140px 150px 100px 110px 72px}
@media (max-width:900px){
 .av-docs .av-tr,.av-docs-posts .av-tr{grid-template-columns:minmax(0,1fr) auto;row-gap:6px}
 .av-docs .av-th,.av-docs-posts .av-th{display:none}
 .av-docs .av-tr>:nth-child(2),.av-docs-posts .av-tr>:nth-child(2),.av-docs .av-tr>:nth-child(4),.av-docs-posts .av-tr>:nth-child(4),.av-docs .av-tr>:nth-child(5),.av-docs-posts .av-tr>:nth-child(5){display:none}
 .av-docs .av-tr>:nth-child(3),.av-docs-posts .av-tr>:nth-child(3){grid-row:2;grid-column:1}
 .av-docs .av-tr>:nth-child(6),.av-docs-posts .av-tr>:nth-child(6){grid-row:1/3;grid-column:2}
}

/* ── Media ─────────────────────────────────────────────────────────────── */
.vault-media{align-items:start}
.vault-media>.av-media-card{display:flex!important;flex-direction:column;min-width:0;margin:0!important;padding:16px!important;gap:12px!important}
.av-media-thumb{display:grid;place-items:center;aspect-ratio:16/10;border-radius:12px;background:var(--av-paper) repeating-conic-gradient(#eef1f5 0 25%,transparent 0 50%) 0 0/16px 16px;overflow:hidden}
.av-media-thumb img{width:100%!important;height:100%!important;object-fit:contain;border-radius:0!important;background:none!important}
.av-media-body{display:grid;gap:8px;min-width:0}
.av-media-name{font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.av-media-alt{margin:0;font-size:13.5px;line-height:1.45;color:var(--av-copy);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.av-media-alt.none{color:var(--av-muted);font-style:italic}
.av-chips{display:flex;flex-wrap:wrap;gap:6px}
.av-media-url{display:flex;align-items:center;gap:4px;min-width:0;padding:2px 2px 2px 10px;border:1px solid var(--av-line);border-radius:10px;background:var(--av-paper)}
.av-media-url code{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;color:var(--av-copy)}
.av-media-actions{display:flex;flex-wrap:wrap;gap:8px}
.av-media-panel{display:grid;gap:10px;padding:12px;border:1px solid var(--av-line);border-radius:14px;background:#fbfcfe}
.av-media-form label{display:grid;gap:5px;font-size:12.5px;font-weight:600}
.av-use-head{margin:4px 0 0;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--av-muted)}
.av-use-list{display:grid;gap:6px;max-height:300px;overflow:auto;margin:0;padding:0;list-style:none}
.av-use-list li>a,.av-use-list li>span,.av-use-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 11px;border:1px solid #eef0f3;border-radius:10px;background:#fff;color:inherit;text-decoration:none;min-width:0}
.av-use-list li>a:hover,.av-use-row:hover{border-color:#c6dafc;background:#f8fbff}
.av-use-list li span:first-child,.av-use-row>span{display:grid;gap:2px;min-width:0}
.av-use-list strong,.av-use-row strong{font-size:13.5px;line-height:1.35;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.av-use-list small,.av-use-row small{font-size:12px;color:var(--av-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.av-use-row{justify-content:flex-start;color:var(--av-ink)}
.av-use-row>span{flex:1}
.av-use-row svg{color:var(--av-blue);flex:none}
.av-media-more{border-top:1px solid #eef0f3;padding-top:10px;font-size:13.5px}
.av-media-more summary{display:flex;align-items:center;gap:6px;cursor:pointer;font-weight:600;color:var(--av-copy);list-style:none}
.av-media-more summary::-webkit-details-marker{display:none}
.av-media-more[open] summary{color:var(--av-ink);margin-bottom:10px}
.av-media-more[open] summary svg{transform:rotate(180deg)}
.av-media-more p{margin:0 0 10px;color:var(--av-copy);font-size:13px;line-height:1.5}
.av-media-more label{display:grid;gap:5px;margin-bottom:10px;font-size:12.5px;font-weight:600}
.av-media-more select{height:36px;padding:0 10px;border:1px solid var(--av-line);border-radius:10px;background:#fff;font:inherit}
.av-media-more>button{margin:0 8px 8px 0}

/* ── SEO & discovery ───────────────────────────────────────────────────── */
.av-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:20px}
.av-step{display:grid!important;grid-template-columns:auto 1fr;align-items:start;align-content:start;gap:4px 12px!important;margin:0!important;padding:18px 20px!important;text-align:left;cursor:pointer}
.av-step:hover{border-color:#c6dafc}
.av-step.selected{border-color:var(--av-blue);box-shadow:0 0 0 3px var(--av-blue-soft)}
.av-step-num{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#f1f3f4;color:var(--av-copy);font-size:13px;font-weight:700}
.av-step.selected .av-step-num{background:var(--av-blue);color:#fff}
.av-step>svg{display:none}
.av-step strong{font-size:15px}
.av-step small{grid-column:2;font-size:13px;line-height:1.45;color:var(--av-copy)}
.av-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:20px}
.av-stat{display:grid!important;grid-template-columns:auto 1fr;align-items:center;gap:2px 12px!important;margin:0!important;padding:16px 18px!important;text-align:left;cursor:pointer}
.av-stat svg{grid-row:span 2;color:var(--av-copy)}
.av-stat strong{font-family:var(--av-display);font-weight:400;font-size:30px;line-height:1}
.av-stat span{font-size:13px;color:var(--av-copy)}
.av-stat.selected{border-color:var(--av-blue);box-shadow:0 0 0 3px var(--av-blue-soft)}
.av-stat-errors svg{color:var(--av-red)}
.av-stat-warnings svg{color:#e37400}
.av-stat-passed svg{color:var(--av-green)}
.av-legend{flex:1 1 320px;margin:0;font-size:13px;color:var(--av-copy)}
.av-legend span{font-weight:650}
.av-legend-err{color:var(--av-red)}
.av-legend-warn{color:#b06000}
.av-seo-table .av-tr{grid-template-columns:minmax(200px,.9fr) minmax(0,1.6fr) 70px 80px;align-items:start}
.av-issues{display:grid;gap:5px;margin:0;padding:0;list-style:none;font-size:13.5px;line-height:1.45}
.av-issues li{position:relative;padding-left:16px}
.av-issues li::before{content:"";position:absolute;left:0;top:.5em;width:8px;height:8px;border-radius:50%}
.av-issues li.err{color:#a50e0e}
.av-issues li.err::before{background:var(--av-red)}
.av-issues li.warn{color:#5f4200}
.av-issues li.warn::before{background:var(--av-yellow)}
.av-filelinks{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}
.av-filelinks a{display:grid;grid-template-columns:1fr auto;gap:2px 8px;padding:12px 14px;border:1px solid var(--av-line);border-radius:12px;color:inherit;text-decoration:none}
.av-filelinks a:hover{border-color:#c6dafc;background:#f8fbff}
.av-filelinks small{color:var(--av-muted);font-size:12.5px}
.av-filelinks svg{grid-row:1/3;grid-column:2;align-self:center;color:var(--av-blue)}
@media (max-width:1000px){
 .av-steps,.av-stats{grid-template-columns:1fr 1fr}
 .av-seo-table .av-tr{grid-template-columns:minmax(0,1fr) auto}
 .av-seo-table .av-th{display:none}
 .av-seo-table .av-tr>:nth-child(2){grid-column:1/-1;grid-row:2}
 .av-seo-table .av-tr>:nth-child(3){display:none}
}

/* ── Redirects ─────────────────────────────────────────────────────────── */
.av-intro{display:flex!important;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px!important}
.av-intro>div{max-width:720px}
.av-intro h2,.av-redirect-form h2{font-family:var(--av-display);font-weight:400;font-size:24px;margin:0 0 6px}
.av-intro p{margin:0;color:var(--av-copy);font-size:14.5px;line-height:1.6}
.av-redirect-form{border-color:#c6dafc!important;box-shadow:0 0 0 3px var(--av-blue-soft)}
.av-redirect-form label{display:grid;gap:6px;font-size:13px;font-weight:650}
.av-redirect-form label small{font-weight:500;color:var(--av-muted)}
.av-route-pair{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:end;gap:14px}
.av-route-arrow{margin-bottom:9px;color:var(--av-blue)}
.av-choice{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0;padding:0;border:0}
.av-choice legend{margin-bottom:8px;font-size:13px;font-weight:650}
.av-choice label{display:grid!important;grid-template-columns:auto 1fr;gap:4px 10px!important;padding:14px;border:1px solid var(--av-line);border-radius:14px;cursor:pointer}
.av-choice label.selected{border-color:var(--av-blue);background:#f8fbff}
.av-choice input{grid-row:span 2;margin-top:3px;accent-color:var(--av-blue)}
.av-choice strong{font-size:14px}
.av-choice small{font-weight:500!important;line-height:1.45;color:var(--av-copy)!important}
.av-redirect-extra{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:16px}
.av-redirect-extra .inline{display:inline-flex!important;align-items:center;gap:8px;height:36px}
.av-sentence{margin:0;padding:12px 14px;border-radius:12px;background:var(--av-paper);font-size:14px;color:var(--av-copy)}
.av-sentence code{padding:2px 6px;border-radius:6px;background:#fff;border:1px solid var(--av-line);color:var(--av-ink)}
.av-form-actions{display:flex;justify-content:flex-end;gap:8px}
.av-redirect-table .av-tr{grid-template-columns:minmax(0,1fr) 20px minmax(0,1fr) 96px 80px 84px 84px}
.av-arrow-cell{color:var(--av-muted)}
.av-row-off .av-cell-title code{color:var(--av-muted);text-decoration:line-through}
.av-switch{display:inline-flex;align-items:center;gap:8px;padding:0;background:none;border:0;font-size:13px;font-weight:600;color:var(--av-copy);cursor:pointer}
.av-switch>span{position:relative;width:32px;height:18px;border-radius:999px;background:#dadce0;transition:background .15s}
.av-switch>span::after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 1px 2px #0003;transition:transform .15s}
.av-switch.on{color:var(--av-green)}
.av-switch.on>span{background:var(--av-green)}
.av-switch.on>span::after{transform:translateX(14px)}
.av-switch:disabled{opacity:.6;cursor:wait}
@media (max-width:900px){
 .av-route-pair,.av-choice,.av-redirect-extra{grid-template-columns:1fr}
 .av-route-arrow{transform:rotate(90deg);margin:0 auto}
 .av-redirect-table .av-th{display:none}
 .av-redirect-table .av-tr{grid-template-columns:minmax(0,1fr) auto}
 .av-redirect-table .av-tr>:nth-child(2),.av-redirect-table .av-tr>:nth-child(4),.av-redirect-table .av-tr>:nth-child(5){display:none}
 .av-redirect-table .av-tr>:nth-child(3){grid-row:2;grid-column:1}
 .av-redirect-table .av-tr>:nth-child(6){grid-row:1;grid-column:2}
 .av-redirect-table .av-tr>:nth-child(7){grid-row:2;grid-column:2}
}

/* Space below a toolbar of tabs/toggles before the content it controls. */
.av-forms-preview{display:grid!important;gap:16px!important}
.av-forms-preview>.actions{margin:0 0 4px;gap:12px}
.av-nav-toolbar{margin-bottom:20px!important}
.av-forms-list{margin-bottom:24px}

/* ── Leads ─────────────────────────────────────────────────────────────── */
.av-leads{display:grid;grid-template-columns:minmax(0,1fr);gap:20px;align-items:start}
.av-leads.has-detail{grid-template-columns:minmax(0,1fr) minmax(360px,420px)}
.av-leads-table .av-tr{grid-template-columns:28px minmax(170px,1.2fr) minmax(110px,.8fr) minmax(0,1.3fr) 130px 96px}
.av-leads.has-detail .av-leads-table .av-tr{grid-template-columns:28px minmax(150px,1.2fr) minmax(0,1.2fr) 120px 86px}
.av-leads.has-detail .av-leads-table .av-tr>:nth-child(3){display:none}
.av-leads-table input[type=checkbox]{width:16px;height:16px;accent-color:var(--av-blue)}
.av-leads-table .av-tr.active{background:var(--av-blue-soft)!important;box-shadow:inset 3px 0 0 var(--av-blue)}
.av-leads-table .av-tr.unread .av-cell-title>button{font-weight:750}
.av-unread-dot{display:inline-block;width:8px;height:8px;margin-right:8px;border-radius:50%;background:var(--av-blue);vertical-align:1px}
.av-ellipsis{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.av-count.hot{background:var(--av-blue);color:#fff}
.av-pill-spam{background:var(--av-red-soft);color:var(--av-red)}
.av-delivery{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--av-copy);white-space:nowrap}
.av-delivery.ok{color:var(--av-green)}
.av-delivery.bad{color:var(--av-red)}
.av-leads-table .av-tr>:nth-child(5){display:grid;justify-items:start;gap:4px}
.av-export{display:inline-flex;align-items:center;gap:6px;margin-left:auto;font-size:13px;font-weight:650;color:var(--av-blue)}
.av-bulk{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:10px 20px;border-bottom:1px solid var(--av-line);background:#f8fbff;font-size:13px;font-weight:650}
.av-pager{display:flex;align-items:center;justify-content:space-between}
.av-lead-detail{position:sticky;top:16px;max-height:calc(100vh - 32px);overflow:auto!important;margin:0!important;padding:0!important;gap:0!important}
.av-lead-head{display:flex;justify-content:space-between;gap:12px;padding:20px 22px 16px;border-bottom:1px solid var(--av-line)}
.av-lead-head h2{margin:10px 0 2px;font-family:var(--av-display);font-weight:400;font-size:26px;line-height:1.15;overflow-wrap:anywhere}
.av-lead-head p{margin:0;font-size:14px;overflow-wrap:anywhere}
.av-lead-head small{display:block;margin-top:6px;font-size:12.5px;color:var(--av-muted)}
.av-lead-head .av-nav-close{position:static;flex:none;display:grid;place-items:center}
.av-lead-actions{display:flex;flex-wrap:wrap;gap:8px;padding:14px 22px;border-bottom:1px solid var(--av-line)}
.av-btn-primary{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 14px;border-radius:999px;background:var(--av-blue);color:#fff!important;font-size:13px;font-weight:650;text-decoration:none}
.av-btn-primary:hover{background:#155fc0}
.av-lead-body{display:grid}
.av-lead-body section{padding:16px 22px;border-bottom:1px solid #eef0f3}
.av-lead-body h3{margin:0 0 10px;font-size:11.5px;font-weight:750;letter-spacing:.07em;text-transform:uppercase;color:var(--av-muted)}
.av-lead-body dl{display:grid;gap:9px;margin:0}
.av-lead-body dl>div{display:grid;grid-template-columns:120px minmax(0,1fr);gap:12px;font-size:13.5px;line-height:1.45}
.av-lead-body dt{color:var(--av-copy)}
.av-lead-body dd{margin:0;color:var(--av-ink);overflow-wrap:anywhere}
.av-lead-body dd a{display:inline-flex;align-items:center;gap:4px;color:var(--av-blue);overflow-wrap:anywhere}
.av-lead-body dd a svg{flex:none}
.av-lead-body p{margin:0 0 10px}
.av-small{font-size:12px;color:var(--av-muted);line-height:1.5}
.av-spam-check{display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border-radius:12px;font-size:13.5px;line-height:1.45}
.av-spam-check svg{flex:none;margin-top:1px}
.av-spam-check.ok{background:var(--av-green-soft);color:var(--av-green)}
.av-spam-check.bad{background:var(--av-red-soft);color:#a50e0e}
.av-lead-danger{padding:12px 22px 16px}
.av-lead-danger button{color:var(--av-red)}
@media (max-width:1280px){.av-leads.has-detail{grid-template-columns:1fr}.av-lead-detail{position:static;max-height:none}.av-leads.has-detail .av-leads-table .av-tr>:nth-child(3){display:block}.av-leads.has-detail .av-leads-table .av-tr{grid-template-columns:28px minmax(170px,1.2fr) minmax(110px,.8fr) minmax(0,1.3fr) 130px 96px}}
@media (max-width:900px){.av-leads-table .av-th{display:none}.av-leads-table .av-tr,.av-leads.has-detail .av-leads-table .av-tr{grid-template-columns:28px minmax(0,1fr) auto}.av-leads-table .av-tr>:nth-child(3),.av-leads-table .av-tr>:nth-child(4){display:none!important}.av-leads-table .av-tr>:nth-child(5){grid-row:2;grid-column:2}.av-leads-table .av-tr>:nth-child(6){grid-row:1;grid-column:3}}
.av-forms-fields{display:grid!important;gap:14px!important;align-content:start}
.av-forms-fields>h2:not(:first-child){margin-top:12px}

/* Show / hide password on the sign-in form */
.av-password{position:relative}
.av-login .av-password [data-slot="input"]{padding-right:48px}
.av-password-toggle{position:absolute;top:50%;right:6px;display:grid;place-items:center;width:36px;height:36px;transform:translateY(-50%);border:0;border-radius:50%;background:none;color:var(--av-copy);cursor:pointer;transition:background .15s,color .15s}
.av-password-toggle:hover{background:#f1f3f4;color:var(--av-ink)}
.av-password-toggle:focus-visible{outline:2px solid var(--av-blue);outline-offset:1px}
.av-password-toggle[aria-pressed="true"]{color:var(--av-blue)}

/* ── System health ─────────────────────────────────────────────────────── */
.av-health{display:grid;gap:20px}
.av-health-banner{display:flex!important;flex-wrap:wrap;align-items:center;gap:16px!important;margin:0!important;padding:22px 24px!important}
.av-health-banner>svg{flex:none}
.av-health-banner.ok{border-color:#ceead6!important;background:linear-gradient(90deg,var(--av-green-soft),#fff 70%)}
.av-health-banner.ok>svg{color:var(--av-green)}
.av-health-banner.warn{border-color:#fde293!important;background:linear-gradient(90deg,var(--av-yellow-soft),#fff 70%)}
.av-health-banner.warn>svg{color:#e37400}
.av-health-banner.bad{border-color:#f6c7c3!important;background:linear-gradient(90deg,var(--av-red-soft),#fff 70%)}
.av-health-banner.bad>svg{color:var(--av-red)}
.av-health-banner h2{margin:0;font-family:var(--av-display);font-weight:400;font-size:24px}
.av-health-banner p{margin:4px 0 0;font-size:13.5px;color:var(--av-copy)}
.av-health-actions{display:flex;flex-wrap:wrap;gap:8px;margin-left:auto}
.av-health-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px}
.av-health-card{display:flex!important;flex-direction:column;gap:6px!important;margin:0!important;padding:20px!important;border:1px solid var(--av-line)!important}
.av-health-card.ok{border-color:#ceead6!important}
.av-health-card.ok .av-health-icon{background:var(--av-green-soft);color:var(--av-green)}
.av-health-card.warn{border-color:#fde293!important}
.av-health-card.warn .av-health-icon{background:var(--av-yellow-soft);color:#b06000}
.av-health-card.bad{border-color:#f6c7c3!important}
.av-health-card.bad .av-health-icon{background:var(--av-red-soft);color:var(--av-red)}
.av-health-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.av-health-icon{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:var(--av-paper);color:var(--av-copy)}
.av-health-status{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:650}
.av-health-status::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.av-health-status.ok{background:var(--av-green-soft);color:var(--av-green)}
.av-health-status.warn{background:var(--av-yellow-soft);color:#b06000}
.av-health-status.bad{background:var(--av-red-soft);color:var(--av-red)}
.av-health-card h3{margin:0;font-size:13px;font-weight:650;color:var(--av-copy)}
.av-health-card strong{font-family:var(--av-display);font-weight:400;font-size:26px;line-height:1.1;color:var(--av-ink)}
.av-health-card p{margin:2px 0 0;font-size:13.5px;line-height:1.5;color:var(--av-copy)}
.av-health-card small{font-size:12.5px;color:var(--av-muted)}
.av-health-card .av-link{margin-top:auto;padding-top:10px;align-self:flex-start}
.av-health-last{margin:0!important}
.av-health-last h2{margin:0;font-size:16px}
.av-health-last p{margin:0}
.av-health-last ul{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin:0;padding:0;list-style:none}
.av-health-last li{padding:12px 14px;border:1px solid #eef0f3;border-radius:12px;font-size:13.5px;color:var(--av-copy)}
.av-health-last li b{display:block;font-family:var(--av-display);font-weight:400;font-size:22px;color:var(--av-ink)}

/* ── Activity log ──────────────────────────────────────────────────────── */
.av-daterange{display:inline-flex;align-items:center;gap:8px;font-size:13px;color:var(--av-copy)}
.av-daterange input{width:150px!important;min-height:36px!important}
.av-day{border-bottom:1px solid var(--av-line)}
.av-day:last-of-type{border-bottom:0}
.av-day h3{position:sticky;top:0;z-index:1;display:flex;align-items:center;gap:10px;margin:0;padding:10px 20px;background:#fafbfc;border-bottom:1px solid #eef0f3;font-size:12px;font-weight:750;letter-spacing:.06em;text-transform:uppercase;color:var(--av-copy)}
.av-day h3 span{font-weight:600;letter-spacing:0;text-transform:none;color:var(--av-muted)}
.av-day ol{margin:0;padding:4px 0;list-style:none}
.av-day li{display:grid;grid-template-columns:36px minmax(0,1fr) auto;align-items:center;gap:14px;padding:11px 20px}
.av-day li:hover{background:#f8fafd}
.av-act-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:12px;background:#f1f3f4;color:var(--av-copy)}
.av-act-icon.green{background:var(--av-green-soft);color:var(--av-green)}
.av-act-icon.blue{background:var(--av-blue-soft);color:var(--av-blue)}
.av-act-icon.red{background:var(--av-red-soft);color:var(--av-red)}
.av-act-icon.yellow{background:var(--av-yellow-soft);color:#b06000}
.av-act-main{min-width:0}
.av-act-main p{margin:0;font-size:14px;line-height:1.45;overflow-wrap:anywhere}
.av-act-main p a{color:var(--av-blue);font-weight:550}
.av-act-entity{color:var(--av-copy)}
.av-act-main small{display:inline-flex;align-items:center;gap:7px;margin-top:3px;font-size:12.5px;color:var(--av-muted)}
.av-avatar{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#e8eaed;color:#3c4043;font-size:9.5px;font-weight:750;letter-spacing:.02em}
.av-day time{font-size:12.5px;color:var(--av-muted);white-space:nowrap;font-variant-numeric:tabular-nums}

/* ── Backups ───────────────────────────────────────────────────────────── */
.av-backups,.av-traffic{display:grid;gap:20px}
.av-backup-hero,.av-traffic-hero{display:flex!important;flex-wrap:wrap;align-items:center;gap:18px!important;margin:0!important;padding:24px!important}
.av-backup-hero h2,.av-traffic-hero h2{margin:0;font-family:var(--av-display);font-weight:400;font-size:26px}
.av-backup-hero p,.av-traffic-hero p{margin:4px 0 0;max-width:720px;font-size:14px;line-height:1.55;color:var(--av-copy)}
.av-backup-icon{display:grid;place-items:center;flex:none;width:56px;height:56px;border-radius:18px;background:var(--av-blue-soft);color:var(--av-blue)}
.av-backup-actions{margin-left:auto}
.av-backup-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.av-backup-facts>.vault-card{display:grid!important;grid-template-columns:auto 1fr;align-items:center;gap:4px 10px!important;align-content:start;margin:0!important;padding:18px 20px!important}
.av-backup-facts svg{color:var(--av-blue)}
.av-backup-facts strong{font-size:14.5px}
.av-backup-facts p{grid-column:1/-1;margin:0;font-size:13.5px;line-height:1.55;color:var(--av-copy)}
.av-backup-facts .av-switch{grid-column:1/-1;justify-self:start;margin-top:6px}
.av-table-title{margin:0;font-size:16px}
.av-backup-table .av-tr{grid-template-columns:minmax(0,1fr) 100px 120px 230px}
.av-backup-row{border-bottom:1px solid #eef0f3}
.av-backup-row:last-child{border-bottom:0}
.av-backup-row .av-tr{border-bottom:0}
.av-backup-row.open{background:#f8fbff}
.av-backup-row .av-pill svg{margin-right:-2px}
.av-backup-row .av-pill::before{display:none}
.av-icon-btn{display:grid;place-items:center;width:34px;height:34px;border:1px solid var(--av-line);border-radius:50%;color:var(--av-copy)}
.av-icon-btn:hover{border-color:var(--av-blue);color:var(--av-blue)}
.av-backup-detail{display:grid;gap:16px;margin:0 20px 18px;padding:18px;border:1px solid #d2e3fc;border-radius:16px;background:#fff}
.av-verified{display:flex;align-items:center;gap:8px;margin:0;font-size:13.5px;font-weight:600;color:var(--av-green)}
.av-backup-counts{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}
.av-backup-counts div{padding:10px 12px;border:1px solid #eef0f3;border-radius:12px}
.av-backup-counts strong{display:block;font-family:var(--av-display);font-weight:400;font-size:22px}
.av-backup-counts span{font-size:12.5px;color:var(--av-copy)}
.av-restore{display:grid;gap:10px;padding-top:14px;border-top:1px solid #eef0f3}
.av-restore h3{margin:0;font-size:15px}
.av-restore p{margin:0;font-size:13.5px;line-height:1.55;color:var(--av-copy)}
.av-restore .av-find{max-width:none}
.av-restore-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:6px;max-height:240px;overflow:auto;padding:2px}
.av-restore-list button{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;border:1px solid #eef0f3;border-radius:10px;background:#fff;text-align:left;font-size:13px;cursor:pointer;min-width:0}
.av-restore-list button span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.av-restore-list button small{flex:none;color:var(--av-muted);font-size:11.5px}
.av-restore-list button:hover{border-color:#c6dafc}
.av-restore-list button.selected{border-color:var(--av-blue);background:var(--av-blue-soft);color:#174ea6}
.av-restore>[data-slot="button"]{justify-self:start}
@media (max-width:900px){.av-backup-facts{grid-template-columns:1fr}.av-backup-table .av-th{display:none}.av-backup-table .av-tr{grid-template-columns:minmax(0,1fr) auto}.av-backup-table .av-tr>:nth-child(2),.av-backup-table .av-tr>:nth-child(3){display:none}}

/* ── Traffic access ────────────────────────────────────────────────────── */
.av-traffic-hero.on{border-color:#ceead6!important}
.av-traffic-hero.on .av-backup-icon{background:var(--av-green-soft);color:var(--av-green)}
.av-traffic-hero .av-switch{margin-left:auto}
.av-switch-lg{font-size:15px!important}
.av-switch-lg>span{width:44px!important;height:24px!important}
.av-switch-lg>span::after{width:20px!important;height:20px!important}
.av-switch-lg.on>span::after{transform:translateX(20px)!important}
.av-traffic-warn{display:flex;align-items:center;gap:8px;margin:0;padding:12px 16px;border:1px solid #fde293;border-radius:14px;background:var(--av-yellow-soft);color:#7a4a00;font-size:14px}
.av-rules{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:start}
.av-rule{display:grid!important;gap:12px!important;margin:0!important;padding:20px!important}
.av-rule header{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:start;gap:12px}
.av-rule h3{margin:0;font-size:15.5px}
.av-rule header p{margin:3px 0 0;font-size:13px;line-height:1.5;color:var(--av-copy)}
.av-rule-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:12px}
.av-rule.allow .av-rule-icon{background:var(--av-green-soft);color:var(--av-green)}
.av-rule.deny .av-rule-icon{background:var(--av-red-soft);color:var(--av-red)}
.av-rule.country .av-rule-icon{background:var(--av-blue-soft);color:var(--av-blue)}
.av-rule-add{display:flex;gap:8px}
.av-rule-add input{flex:1;min-width:0}
.av-rule .av-rule-err{margin:-4px 0 0!important;font-size:12.5px!important;line-height:1.45;color:var(--av-red)!important}
.av-rule .av-rule-empty{font-size:13px!important}
.av-verified{color:var(--av-green)!important}
.av-rule>.av-link{justify-self:start}
.av-chips-list{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}
.av-chips-list li{display:inline-flex;align-items:center;gap:6px;padding:5px 6px 5px 11px;border:1px solid var(--av-line);border-radius:999px;background:#fff;font-size:13px;font-variant-numeric:tabular-nums}
.av-rule.deny .av-chips-list li{border-color:#f6c7c3;background:#fffafa}
.av-rule.allow .av-chips-list li{border-color:#ceead6;background:#fafffb}
.av-chips-list button{display:grid;place-items:center;width:20px;height:20px;border:0;border-radius:50%;background:none;color:var(--av-muted);cursor:pointer}
.av-chips-list button:hover{background:#f1f3f4;color:var(--av-red)}
.av-rule-empty{margin:0;font-size:13px;color:var(--av-muted)}
.av-traffic-order{margin:0!important}
.av-traffic-order h3{margin:0;font-size:15px}
.av-traffic-order ol{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0;padding:0;list-style:none}
.av-traffic-order li{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border:1px solid #eef0f3;border-radius:12px;font-size:13.5px;line-height:1.5;color:var(--av-copy)}
.av-traffic-order b{display:grid;place-items:center;flex:none;width:24px;height:24px;border-radius:50%;background:var(--av-blue-soft);color:var(--av-blue);font-size:12px}
.av-traffic-order em{font-style:normal;font-weight:650;color:var(--av-ink)}
.av-savebar{position:sticky;bottom:16px;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px 12px 20px;border:1px solid var(--av-line);border-radius:18px;background:#fff;box-shadow:0 8px 28px #2021241a;font-size:14px;color:var(--av-copy)}
.av-savebar.show{border-color:#c6dafc;color:var(--av-ink)}
@media (max-width:1100px){.av-rules{grid-template-columns:1fr}.av-traffic-order ol{grid-template-columns:1fr 1fr}}
.av-activity .av-sort select{max-width:230px}
.av-attrib{margin:4px 0 0;font-size:12px;color:var(--av-muted)}
.av-attrib a{color:inherit;text-decoration:underline}

/* ── Custom scripts ────────────────────────────────────────────────────── */
.av-scripts,.av-privacy{display:grid;gap:20px}
.av-gallery{margin:0!important}
.av-gallery h3,.av-privacy h3{display:flex;align-items:center;gap:8px;margin:0;font-size:16px}
.av-gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}
.av-gallery-item{display:grid;gap:3px;padding:14px 16px;border:1px solid var(--av-line);border-radius:14px;background:#fff;text-align:left;cursor:pointer;transition:border-color .15s,box-shadow .15s}
.av-gallery-item:hover{border-color:#c6dafc}
.av-gallery-item.selected{border-color:var(--av-blue);box-shadow:0 0 0 3px var(--av-blue-soft)}
.av-gallery-item strong{font-size:14px}
.av-gallery-item small{font-size:12.5px;color:var(--av-copy)}
.av-gallery-form{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px;padding:14px;border-radius:14px;background:var(--av-paper)}
.av-gallery-form label{display:grid;gap:6px;flex:1;min-width:240px;font-size:13px;font-weight:650}
.av-gallery-form p{flex:1;margin:0;font-size:13.5px;color:var(--av-copy)}
.av-snippets{display:grid;margin:0;padding:0;list-style:none}
.av-snippets>li{border-bottom:1px solid #eef0f3}
.av-snippets>li:last-child{border-bottom:0}
.av-snippets>li.open{background:#fbfcfe}
.av-snippets>li.off .av-snippet-title strong{color:var(--av-muted)}
.av-snippet-head{display:flex;align-items:center;gap:12px;padding:12px 20px}
.av-snippet-title{display:flex;align-items:center;gap:10px;flex:1;min-width:0;padding:4px 0;background:none;border:0;text-align:left;cursor:pointer}
.av-snippet-title>svg{flex:none;color:var(--av-muted);transition:transform .15s}
.av-snippets>li.open .av-snippet-title>svg{transform:rotate(180deg)}
.av-snippet-title>span{display:grid;gap:2px;min-width:0}
.av-snippet-title strong{font-size:14.5px}
.av-snippet-title small{font-size:12.5px;color:var(--av-copy);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.av-snippet-body{display:grid;gap:14px;padding:4px 20px 18px 46px}
.av-snippet-body>label,.av-snippet-grid label{display:grid;gap:6px;font-size:13px;font-weight:650}
.av-snippet-body label small{font-weight:500;color:var(--av-muted)}
.av-snippet-grid{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:14px}
.av-snippet-grid select{height:40px;padding:0 10px;border:1px solid #dadce0;border-radius:12px;background:#fff;font:inherit;font-weight:500}
.av-code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;font-size:12.5px!important;line-height:1.55!important;background:#0f172a!important;color:#e2e8f0!important;border-color:#0f172a!important;tab-size:2}
.av-code::placeholder{color:#64748b}
.av-pages{grid-template-columns:1fr 1fr!important}
.av-optout{display:flex!important;align-items:flex-start;gap:10px;padding:12px 14px;border:1px solid var(--av-line);border-radius:14px;background:#fff;font-weight:500!important;cursor:pointer}
.av-optout input{margin-top:3px;accent-color:var(--av-blue)}
.av-optout span{display:grid;gap:3px}
.av-optout strong{font-size:13.5px}
.av-optout small{font-size:12.5px;line-height:1.5;color:var(--av-copy)!important}
.av-snippet-foot{display:flex;justify-content:flex-end}
.av-snippet-foot button{color:var(--av-red)}
@media (max-width:900px){.av-snippet-grid,.av-pages{grid-template-columns:1fr!important}.av-snippet-body{padding-left:20px}}

/* ── Privacy & tracking ────────────────────────────────────────────────── */
.av-privacy section.vault-card{margin:0!important}
.av-privacy .muted{margin:0;font-size:13.5px}
.av-keep-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding:14px 0;border-top:1px solid #eef0f3}
.av-keep-row>div:first-child{display:grid;gap:2px;min-width:220px;flex:1}
.av-keep-row strong{font-size:14px}
.av-keep-row small{font-size:12.5px;color:var(--av-copy)}
.av-found{display:grid;gap:12px;padding:14px;border:1px solid var(--av-line);border-radius:14px;background:#fbfcfe}
.av-found p{margin:0;font-size:14px}
.av-use-list.compact li>span{padding:8px 11px}
.av-erase{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px;border:1px solid #f6c7c3;border-radius:12px;background:#fffafa;font-size:13.5px;color:#a50e0e}
.av-erase code{padding:1px 6px;border-radius:6px;background:#fff;border:1px solid #f6c7c3}
.av-erase input{flex:1;min-width:200px}
.av-privacy-policy blockquote{margin:0;padding:16px 18px;border:1px solid var(--av-line);border-radius:4px;background:var(--av-paper);font-size:14px;line-height:1.7;color:var(--av-ink)}
.av-privacy-policy .actions{align-items:center;gap:14px}
.av-privacy section.vault-card,.av-gallery{display:grid!important;gap:14px!important;align-content:start}
.av-privacy section.vault-card>h3+.muted{margin-top:-8px!important}
.av-backup-facts .av-link{grid-column:1/-1;justify-self:start}

/* ── Users ─────────────────────────────────────────────────────────────── */
.av-users,.av-email,.av-settings,.av-visitors{display:grid;gap:20px}
.av-users-table .av-tr{grid-template-columns:minmax(0,1.6fr) 150px 110px 120px 260px}
.av-user-row{border-bottom:1px solid #eef0f3}
.av-user-row:last-child{border-bottom:0}
.av-user-row .av-tr{border-bottom:0}
.av-user-cell{display:flex;align-items:center;gap:12px;min-width:0}
.av-avatar.lg{width:36px;height:36px;font-size:12.5px;flex:none;background:var(--av-blue-soft);color:#1967d2}
.av-you{margin-left:8px;padding:2px 8px;border-radius:999px;background:var(--av-blue-soft);color:#1967d2;font-style:normal;font-size:11px;font-weight:700;vertical-align:1px}
.av-inline-select{height:34px;padding:0 10px;border:1px solid var(--av-line);border-radius:10px;background:#fff;font:inherit;font-size:13.5px}
.av-inline-panel{display:grid;gap:12px;margin:0 20px 16px;padding:16px;border:1px solid #d2e3fc;border-radius:14px;background:#f8fbff}
.av-inline-panel label{display:grid;gap:6px;font-size:13px;font-weight:650}
.av-pw-row{display:flex;gap:8px;align-items:center}
.av-pw-row .av-password{flex:1}
.av-password [data-slot="input"]{padding-right:48px}
.av-mypw{display:grid!important;gap:16px!important;margin:0!important}
.av-mypw h2{display:flex;align-items:center;gap:8px;margin:0 0 4px;font-size:17px}
.av-mypw .muted{margin:0}
.av-mypw-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.av-mypw-fields label,.av-grid-2 label,.av-grid-3 label,.av-snippet-grid label{display:grid;gap:6px;font-size:13px;font-weight:650}
.av-mypw-fields small,.av-grid-2 small,.av-grid-3 small{font-weight:500;color:var(--av-muted)}
@media (max-width:1100px){.av-users-table .av-th{display:none}.av-users-table .av-tr{grid-template-columns:minmax(0,1fr) auto;row-gap:10px}.av-users-table .av-tr>:nth-child(4){display:none}.av-users-table .av-tr>:nth-child(5){grid-column:1/-1;justify-content:flex-start}.av-mypw-fields{grid-template-columns:1fr}}

/* ── Email & settings ──────────────────────────────────────────────────── */
.av-step-card,.av-set-card{display:grid!important;gap:14px!important;margin:0!important;align-content:start}
.av-step-card h3,.av-set-card h3{display:flex;align-items:center;gap:10px;margin:0;font-size:16px}
.av-step-card .muted,.av-set-card .muted{margin:-6px 0 0;font-size:13.5px}
.av-grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.av-grid-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.av-grid-2 .span-2{grid-column:1/-1}
.av-select{height:40px;width:100%;padding:0 10px;border:1px solid #dadce0;border-radius:12px;background:#fff;font:inherit;font-weight:500}
.av-saved{display:inline-flex!important;align-items:center;gap:4px;color:var(--av-green)!important;font-weight:600!important}
.av-hint-box{margin:0;padding:12px 14px;border-radius:12px;background:var(--av-blue-soft);color:#174ea6;font-size:13.5px;line-height:1.55}
.av-hint-box a{color:inherit;text-decoration:underline;font-weight:650}
.av-label{margin:4px 0 -6px;font-size:13px;font-weight:650}
.av-hours{display:grid;gap:2px;margin:0;padding:0;list-style:none}
.av-hours li{display:grid;grid-template-columns:130px 90px minmax(0,1fr);align-items:center;gap:12px;padding:8px 10px;border-radius:12px}
.av-hours li:nth-child(odd){background:#fafbfc}
.av-hours li.closed strong{color:var(--av-muted)}
.av-hours strong{font-size:14px}
.av-hours-times{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--av-copy)}
.av-hours-times input{width:150px!important;min-height:36px!important}
.av-serp{display:grid;gap:3px;max-width:640px;padding:16px 18px;border:1px solid var(--av-line);border-radius:14px;background:#fff;font-family:var(--font-sans)}
.av-serp small{font-size:12.5px;color:#4d5156}
.av-serp strong{font-size:19px;font-weight:400;color:#1a0dab;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.av-serp p{margin:0;font-size:13.5px;line-height:1.55;color:#4d5156;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
@media (max-width:900px){.av-grid-2,.av-grid-3{grid-template-columns:1fr}.av-hours li{grid-template-columns:1fr auto}.av-hours-times{grid-column:1/-1}}

/* ── Visitors & calls ──────────────────────────────────────────────────── */
.av-range-bar{display:flex;flex-wrap:wrap;align-items:center;gap:12px}
.av-range-bar .av-attrib{margin:0}
.av-filter-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 10px 6px 14px;border:1px solid var(--av-blue);border-radius:999px;background:var(--av-blue-soft);color:#1967d2;font-size:13px;font-weight:650;cursor:pointer}
.av-live{display:inline-flex;align-items:center;gap:8px;margin-left:auto;font-size:13.5px;font-weight:600;color:var(--av-copy)}
.av-live i{width:9px;height:9px;border-radius:50%;background:var(--av-green);box-shadow:0 0 0 0 #34a85366;animation:av-pulse 2s infinite}
@keyframes av-pulse{70%{box-shadow:0 0 0 8px #34a85300}100%{box-shadow:0 0 0 0 #34a85300}}
@media (prefers-reduced-motion:reduce){.av-live i{animation:none}}
.av-stat-row{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px}
.av-stat-row.av-stat-4{grid-template-columns:repeat(4,minmax(0,1fr))}
.av-kpi{display:grid!important;grid-template-columns:auto 1fr;align-items:center;gap:2px 12px!important;margin:0!important;padding:16px 18px!important}
.av-kpi svg{grid-row:span 2;color:var(--av-blue)}
.av-kpi strong{font-family:var(--av-display);font-weight:400;font-size:28px;line-height:1}
.av-kpi span{font-size:13px;color:var(--av-copy)}
.av-insights{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:start}
.av-insights>section{display:grid!important;gap:12px!important;margin:0!important}
.av-insights h3{display:flex;align-items:center;gap:8px;margin:0;font-size:14.5px}
.av-insights h3 svg{color:var(--av-blue)}
.av-bars{display:grid;gap:4px;margin:0;padding:0;list-style:none}
.av-bars button{position:relative;display:flex;justify-content:space-between;gap:10px;width:100%;padding:7px 10px;border:0;border-radius:8px;background:none;text-align:left;font-size:13.5px;overflow:hidden;cursor:default}
.av-bars button:not(:disabled){cursor:pointer}
.av-bars button:not(:disabled):hover{background:#f6f9fe}
.av-bars button.picked{outline:2px solid var(--av-blue);outline-offset:-2px}
.av-bar{position:absolute;inset:0 auto 0 0;z-index:0;border-radius:8px;background:var(--av-blue-soft)}
.av-bar-label,.av-bar-n{position:relative;z-index:1}
.av-bar-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--av-ink)}
.av-bar-n{flex:none;font-weight:650;color:var(--av-copy);font-variant-numeric:tabular-nums}
.av-visit-table .av-tr{grid-template-columns:minmax(0,1fr) minmax(0,1.1fr) minmax(0,1fr) 100px 100px;align-items:start}
.av-call-table .av-tr{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr) minmax(0,1.2fr) 110px}
.av-visit{border-bottom:1px solid #eef0f3}
.av-visit:last-child{border-bottom:0}
.av-visit .av-tr{border-bottom:0}
.av-visit.open{background:#fbfcfe}
.av-visit .av-chips{margin-top:4px}
.av-journey{display:grid;gap:0;margin:0;padding:0;list-style:none}
.av-journey li{position:relative;display:grid;grid-template-columns:62px 14px minmax(0,1fr);gap:10px;padding:6px 0;font-size:13.5px}
.av-journey li::before{content:"";position:absolute;left:78px;top:0;bottom:0;width:2px;background:#e8eaed}
.av-journey li:first-child::before{top:14px}
.av-journey li:last-child::before{bottom:calc(100% - 14px)}
.av-journey time{padding-top:1px;font-size:12px;color:var(--av-muted);text-align:right;font-variant-numeric:tabular-nums}
.av-journey-dot{position:relative;z-index:1;width:12px;height:12px;margin-top:3px;border:2px solid #fff;border-radius:50%;background:#bdc1c6;box-shadow:0 0 0 1px #dadce0}
.av-journey .page .av-journey-dot{background:var(--av-blue)}
.av-journey .click .av-journey-dot{background:#9aa0a6}
.av-journey .form .av-journey-dot{background:var(--av-red)}
.av-journey .call .av-journey-dot{background:var(--av-green)}
.av-journey li>div{display:grid;gap:1px;overflow-wrap:anywhere}
.av-journey small{color:var(--av-muted);font-size:12.5px}
@media (max-width:1100px){.av-stat-row{grid-template-columns:repeat(3,minmax(0,1fr))}.av-insights{grid-template-columns:1fr}.av-visit-table .av-th,.av-call-table .av-th{display:none}.av-visit-table .av-tr,.av-call-table .av-tr{grid-template-columns:minmax(0,1fr) auto}.av-visit-table .av-tr>:nth-child(3),.av-visit-table .av-tr>:nth-child(4){display:none}}
.av-bars button:disabled{opacity:1;color:inherit}
.av-traffic-hero>[data-slot="button"]{margin-left:auto}
/* Field hints sit beside their label so side-by-side inputs line up. */
.av-grid-2>label,.av-grid-3>label,.av-mypw-fields>label{display:flex!important;flex-wrap:wrap;align-items:baseline;align-content:flex-start;column-gap:8px;row-gap:6px}
.av-grid-2>label>:not(small),.av-grid-3>label>:not(small),.av-mypw-fields>label>:not(small){flex-basis:100%}

/* ── Overview ──────────────────────────────────────────────────────────── */
.av-overview,.av-schedules,.av-taxonomy{display:grid;gap:20px}
.av-hello{display:flex!important;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px!important;margin:0!important;padding:26px 28px!important;background:linear-gradient(120deg,#f3f7fe 0,#fff 60%)}
.av-hello h2{margin:6px 0 4px;font-family:var(--av-display);font-weight:400;font-size:30px;letter-spacing:-.02em}
.av-hello p:not(.eyebrow){margin:0;font-size:15px;color:var(--av-copy)}
.av-attention{display:grid!important;gap:10px!important;margin:0!important;border-color:#fde293!important;background:#fffdf5}
.av-attention h3{display:flex;align-items:center;gap:8px;margin:0;font-size:15.5px;color:#7a4a00}
.av-attention ul{display:grid;gap:6px;margin:0;padding:0;list-style:none}
.av-attention li{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:12px;background:#fff;border:1px solid #fbe9b7;font-size:14px}
.av-kpi-link{cursor:pointer;text-align:left;transition:border-color .15s,transform .15s}
.av-kpi-link:hover{border-color:#c6dafc;transform:translateY(-1px)}
.av-kpi-link.green svg{color:var(--av-green)}
.av-kpi-link.yellow svg{color:#e37400}
.av-kpi-link.red svg{color:var(--av-red)}
.av-ov-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start}
.av-ov-grid>section,.av-overview>section.vault-card{display:grid!important;gap:12px!important;margin:0!important;align-content:start}
.av-overview h3{display:flex;align-items:center;gap:8px;margin:0;font-size:15px}
.av-overview h3 svg{color:var(--av-blue)}
.av-ov-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
.av-ov-head h3{margin:0}
.av-ov-leads .av-use-list li>a{align-items:center}
.av-ov-leads .av-use-list li>a>small{flex:none;font-size:12px;color:var(--av-muted)}
.av-mini-activity{display:grid;gap:2px;margin:0;padding:0;list-style:none}
.av-mini-activity li{display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:10px;padding:7px 4px;border-bottom:1px solid #f1f3f4;font-size:13.5px}
.av-mini-activity li:last-child{border-bottom:0}
.av-mini-activity .av-act-icon{width:28px;height:28px;border-radius:9px}
.av-mini-activity span:nth-child(2){display:grid;min-width:0}
.av-mini-activity small{color:var(--av-muted);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.av-mini-activity time{font-size:12px;color:var(--av-muted);white-space:nowrap}
.av-ov-tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.av-ov-tile{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:2px 10px;padding:14px;border:1px solid var(--av-line);border-radius:14px;background:#fff;text-align:left;cursor:pointer;transition:border-color .15s}
.av-ov-tile:hover{border-color:#c6dafc}
.av-ov-tile svg{grid-row:span 2;color:var(--av-blue)}
.av-ov-tile strong{font-family:var(--av-display);font-weight:400;font-size:24px;line-height:1}
.av-ov-tile span{font-size:12.5px;color:var(--av-copy)}
.av-ov-tile.warn{border-color:#fde293;background:#fffdf5}
.av-ov-tile.warn svg{color:#e37400}
.av-ov-health{display:grid;gap:0;margin:0;padding:0;list-style:none}
.av-ov-health li{display:grid;grid-template-columns:18px minmax(0,1fr) auto;align-items:center;gap:10px;padding:10px 2px;border-bottom:1px solid #f1f3f4;font-size:14px}
.av-ov-health li:last-child{border-bottom:0}
.av-ov-health svg{color:var(--av-muted)}
.av-ov-health b{font-size:13px;font-weight:650}
.av-ov-health b.ok{color:var(--av-green)}
.av-ov-health b.warn{color:#b06000}
.av-overview>section>.av-link{justify-self:start}
.av-ov-grid section>.av-link{justify-self:start}
.av-quick{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}
.av-quick-item{display:flex;align-items:center;gap:10px;padding:14px 16px;border:1px solid var(--av-line);border-radius:14px;background:#fff;font-size:14px;font-weight:600;color:var(--av-ink);cursor:pointer;transition:border-color .15s,background .15s}
.av-quick-item svg:first-child{color:var(--av-blue)}
.av-quick-item svg:last-child{margin-left:auto;color:var(--av-muted)}
.av-quick-item:hover{border-color:#c6dafc;background:#f8fbff}
@media (max-width:1000px){.av-ov-grid{grid-template-columns:1fr}}

/* ── Scheduled publishing ──────────────────────────────────────────────── */
.av-sched-table .av-tr{grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) 170px 210px}
@media (max-width:900px){.av-sched-table .av-tr{grid-template-columns:minmax(0,1fr) auto}.av-sched-table .av-tr>:nth-child(3){display:none}.av-sched-table .av-tr>:nth-child(4){grid-column:1/-1;justify-content:flex-start}}

/* ── Categories & tags ─────────────────────────────────────────────────── */
.av-tax-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start}
.av-tax-col{display:grid!important;gap:12px!important;margin:0!important;align-content:start}
.av-tax-col h3{display:flex;align-items:center;gap:8px;margin:0;font-size:15.5px}
.av-tax-col h3 svg{color:var(--av-blue)}
.av-tax-col .muted{margin:-6px 0 0;font-size:13px}
.av-tax-list{display:grid;gap:6px;margin:0;padding:0;list-style:none}
.av-tax-list>li{border:1px solid #eef0f3;border-radius:12px;background:#fff}
.av-tax-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:10px;padding:8px 8px 8px 14px}
.av-tax-uses{padding:4px 10px;border:1px solid var(--av-line);border-radius:999px;background:#fff;font-size:12.5px;font-weight:600;color:var(--av-blue);cursor:pointer}
.av-tax-uses:disabled{color:var(--av-muted);cursor:default}
.av-tax-row .av-actions-cell{gap:4px}
.av-tax-row .av-icon-btn{background:#fff;cursor:pointer}
.av-tax-row .av-icon-btn:disabled{opacity:.4;cursor:not-allowed}
.av-tax-posts{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0 14px 12px;list-style:none}
.av-tax-posts button{padding:4px 10px;border:1px solid #d2e3fc;border-radius:999px;background:var(--av-blue-soft);color:#174ea6;font-size:12.5px;cursor:pointer}
@media (max-width:900px){.av-tax-grid{grid-template-columns:1fr}}
.av-taxonomy .av-attrib{display:flex;align-items:center;gap:6px;margin:0;font-size:12.5px!important;color:var(--av-muted)!important}
/* Live page editor (Pages → Live edit). Reuses the header and footer editor's canvas and inspector. */
.av-page-canvas{margin-top:16px}
.av-canvas-image{display:grid;gap:10px;padding-bottom:14px;border-bottom:1px solid var(--av-line)}
.av-canvas-image img{width:100%;max-height:180px;object-fit:contain;border-radius:12px;background:var(--av-paper)}
.av-canvas-image select{height:36px;border:1px solid var(--av-line);border-radius:8px;padding:0 10px;background:#fff;font:inherit;font-weight:500}
/* overflow:clip (not hidden) so the section toolbar can stick below the editor toolbar while scrolling. */
.av-page-canvas .av-nav-stage{position:relative;overflow:clip}
.av-section-frame{position:absolute;pointer-events:none;z-index:2}
.av-section-tools{position:sticky;top:100px;margin:10px 0 0 10px;width:max-content;display:flex;align-items:center;gap:2px;padding:4px;border-radius:999px;background:#1f1f1f;color:#fff;box-shadow:0 4px 14px #0003;pointer-events:auto}
.av-section-tools>span{display:inline-flex;align-items:center;gap:6px;padding:0 10px 0 8px;font-size:12.5px;font-weight:600;white-space:nowrap}
.av-section-tools em{font-style:normal;font-weight:600;font-size:11px;padding:1px 7px;border-radius:999px;background:#fbbc04;color:#1f1f1f}
.av-section-tools button{display:grid;place-items:center;width:30px;height:30px;border:0;border-radius:50%;background:none;color:inherit;cursor:pointer}
.av-section-tools button:hover:not(:disabled){background:#ffffff26}
.av-section-tools button:disabled{opacity:.35;cursor:default}
.av-section-add{position:absolute;left:50%;bottom:-15px;transform:translateX(-50%);display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 14px;border:0;border-radius:999px;background:#1a73e8;color:#fff;font:600 13px/1 inherit;box-shadow:0 4px 14px #1a73e855;cursor:pointer;pointer-events:auto;white-space:nowrap}
.av-section-add:hover:not(:disabled){background:#1765cc}
/* Section library */
.av-library{display:flex!important;flex-direction:column;gap:16px!important;width:min(1180px,calc(100vw - 32px))!important;max-width:none!important;height:min(860px,calc(100vh - 48px));padding:24px!important;border-radius:24px!important}
.av-library-head{display:grid;gap:4px;padding-right:32px}
.av-library-head h2{font-family:var(--av-display);font-weight:400;font-size:26px;margin:0}
.av-library-head p{margin:0;color:var(--av-copy);font-size:14px}
.av-library-body{display:grid;grid-template-columns:minmax(260px,330px) 1fr;gap:20px;min-height:0;flex:1}
.av-library-list{display:flex;flex-direction:column;gap:12px;overflow:auto;min-height:0;padding-right:6px}
.av-library-others{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--av-copy)}
.av-library-group{display:grid;gap:4px}
.av-library-group h3{margin:8px 0 2px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--av-muted)}
.av-library-group h3 small{font-weight:600;letter-spacing:0}
.av-library-group button{display:grid;gap:2px;text-align:left;padding:10px 12px;border:1px solid transparent;border-radius:12px;background:none;cursor:pointer;font:inherit}
.av-library-group button:hover{background:var(--av-paper)}
.av-library-group button.selected{border-color:#1a73e8;background:var(--av-blue-soft)}
.av-library-group button strong{font-size:14px;font-weight:600;color:var(--av-ink);line-height:1.35}
.av-library-group button small{font-size:12px;color:var(--av-muted)}
.av-library-preview{display:flex;flex-direction:column;gap:12px;min-height:0;min-width:0}
.av-library-bar{display:flex;align-items:center;justify-content:space-between;gap:12px}
.av-library-bar>span{display:grid;gap:2px}
.av-library-bar small{color:var(--av-muted);font-size:12.5px}
.av-library-stage{flex:1;min-height:0;overflow:auto;border:1px solid var(--av-line);border-radius:16px;background:#fff}
.av-library-empty{display:grid;place-items:center;flex:1;margin:0;border:2px dashed var(--av-line);border-radius:16px;color:var(--av-muted)}
@media (max-width:760px){.av-library-body{grid-template-columns:1fr;grid-template-rows:minmax(160px,40%) 1fr}}
/* DMV AVAULT: a quiet blue-grey frame around the existing high-density CMS. */
:root{--av-blue:#062744;--av-blue-soft:#e8eef3;--av-red:#d6283b;--av-red-soft:#fbe9ec;--av-green:#16734a;--av-green-soft:#e6f3ed;--av-yellow:#a86d00;--av-yellow-soft:#fbf1dc;--av-ink:#10283b;--av-copy:#506373;--av-muted:#718291;--av-line:#e5eaee;--av-paper:#f2f5f7;--av-bar:#d6283b}
body:has(.vault),body:has(.av-login){background:var(--av-paper)}
.vault{background:var(--av-paper)}
.vault-sidebar{width:236px;background:var(--av-paper);border-right:0;padding:22px 16px}
.vault-body{margin-left:236px;padding:0 8px 8px 0;background:var(--av-paper)}
.vault-top{height:48px;padding:0 24px;background:var(--av-paper);border:0;backdrop-filter:none}
.vault-main{min-height:calc(100vh - 56px);padding:24px;background:#fff;border:1px solid var(--av-line);border-radius:16px;box-shadow:none}
.vault-brand{grid-template-columns:50px 1fr;font-size:25px;color:var(--av-blue)}
.vault-brand img{width:48px;height:34px;object-fit:contain}
.vault-brand span{color:#647887;letter-spacing:1.7px}
.vault .vault-navlabel::before,.vault .eyebrow::before{background:var(--av-red)}
.vault-sidebar nav button{border-radius:8px}
.vault-sidebar nav button.selected{background:transparent;color:var(--av-blue);box-shadow:inset 2px 0 var(--av-red)}
.vault-card,.vault-fields{border-color:var(--av-line);border-radius:14px;box-shadow:none}
.vault .av-btn-primary,.vault button[data-slot="button"][class*="bg-primary"]{background:var(--av-blue)}
.vault a:hover,.av-link{color:var(--av-red)}
.av-login{background:var(--av-paper)}
.av-login [data-slot="input"]:focus{box-shadow:none;border-color:var(--av-blue)}
.av-login-card img{height:auto;max-width:180px;object-fit:contain}
@media(max-width:1000px){.vault-sidebar{width:210px}.vault-body{margin-left:210px}}
@media(max-width:700px){.vault-sidebar{width:100%}.vault-body{margin-left:0;padding:0}.vault-main{border-radius:0;border-left:0;border-right:0}}

/* Refined application chrome: use the supplied brand artwork at a readable size and keep controls aligned. */
.vault-sidebar{width:252px;background:#fff;border-right:1px solid var(--av-line);padding:18px 16px 20px}
.vault-body{margin-left:252px}
.vault-brand{display:grid;grid-template-columns:1fr;gap:8px;align-items:center;padding:2px 8px 16px;border-bottom:1px solid var(--av-line);font-size:initial;letter-spacing:normal;color:var(--av-ink)}
.vault-brand img{grid-column:1;width:100%;height:58px;object-fit:cover;object-position:center 50%}
.vault-brand .vault-brand-meta{display:flex;align-items:baseline;justify-content:space-between;gap:8px;color:var(--av-copy);letter-spacing:normal}
.vault-brand-meta b{font-family:var(--av-display);font-size:19px;font-weight:400;letter-spacing:-.02em;color:var(--av-blue)}
.vault-brand-meta small{font-size:9px;font-weight:750;letter-spacing:.14em;text-transform:uppercase;color:var(--av-muted)}
.vault-sidebar nav button{min-height:40px;border-radius:10px;align-items:center}
.vault-sidebar nav button svg{flex:0 0 18px}
.vault-sidebar nav button span{min-width:0;line-height:1.25}
.vault-sidebar nav button.selected{background:var(--av-blue-soft);color:var(--av-blue);box-shadow:inset 3px 0 var(--av-red)}
.vault .actions{align-items:center}
.vault .actions>[data-slot="button"]{display:inline-flex;align-items:center;justify-content:center;gap:7px}
.vault-title>.actions{justify-content:flex-end}
.vault .av-actions-cell>[data-slot="button"]{min-width:64px;justify-content:center}
.vault .av-form-actions>[data-slot="button"]{min-width:108px;justify-content:center}
@media(max-width:1000px){.vault-sidebar{width:220px}.vault-body{margin-left:220px}.vault-brand img{height:50px}}
@media(max-width:700px){.vault-sidebar{width:100%}.vault-body{margin-left:0}.vault-brand{grid-template-columns:150px 1fr;padding-bottom:10px}.vault-brand img{height:44px}.vault-brand .vault-brand-meta{display:grid;justify-content:start}.vault-sidebar nav{padding-bottom:4px}}

/* DMV brand system: rectangular, direct and shared with the public website. */
:root{--av-blue:#062744;--av-blue-soft:#e9eef2;--av-red:#cc293c;--av-red-soft:#f8e9ec;--av-green:#062744;--av-green-soft:#e9eef2;--av-yellow:#647887;--av-yellow-soft:#eef1f3;--av-ink:#142c40;--av-copy:#506373;--av-muted:#718291;--av-line:#dce2e7;--av-paper:#f5f6f7;--av-bar:#cc293c}
.vault ::selection,.av-login ::selection{background:var(--av-red);color:#fff}
.vault-main{border-radius:6px}
.vault-card,.vault-fields{border-radius:5px}
.vault-sidebar nav button{border-radius:3px}
.vault-sidebar nav button.selected{background:var(--av-blue-soft);box-shadow:inset 3px 0 var(--av-red)}
.vault [data-slot="button"]{min-height:42px;border-radius:3px;font-weight:700;box-shadow:none}
.vault [data-slot="button"][data-variant="default"],.vault .av-btn-primary,.av-login [data-slot="button"][data-variant="default"]{border-color:var(--av-red);background:var(--av-red);color:#fff}
.vault [data-slot="button"][data-variant="default"]:hover,.vault .av-btn-primary:hover,.av-login [data-slot="button"][data-variant="default"]:hover{border-color:var(--av-blue);background:var(--av-blue)}
.vault [data-slot="button"][data-variant="outline"]{border-color:var(--av-blue);background:#fff;color:var(--av-blue)}
.vault [data-slot="button"][data-variant="outline"]:hover{background:var(--av-blue-soft)}
.vault [data-slot="button"][data-variant="secondary"]{background:var(--av-blue-soft);color:var(--av-blue)}

/* Cohesive application chrome and clear active state. */
:root{--av-green:#16734a;--av-green-soft:#e6f3ed}
.vault-brand img{height:64px!important;object-fit:contain!important;object-position:center!important;padding:5px;background:#fff}
.vault-sidebar nav button{position:relative;border:1px solid transparent}
.vault-sidebar nav button.selected{background:var(--av-blue)!important;color:#fff!important;box-shadow:none!important;border-color:var(--av-blue)!important}
.vault-sidebar nav button.selected::after{content:"";position:absolute;right:9px;width:6px;height:6px;border-radius:50%;background:var(--av-red)}
.vault-top{height:64px!important;padding:0 28px!important;background:#fff!important;border-bottom:1px solid var(--av-line)!important}
.vault-top>span:first-child{display:flex;align-items:center;gap:9px;font-family:var(--av-display);font-size:16px;color:var(--av-blue)}
.vault-top>span:first-child::before{content:"A";display:grid;place-items:center;width:30px;height:30px;background:var(--av-blue);color:#fff;font-family:var(--av-display);font-size:17px}
.vault-top>a{min-height:38px;padding:0 14px;border:1px solid var(--av-blue);border-radius:3px;color:var(--av-blue);font-weight:700}
.vault-top>a:hover{background:var(--av-blue);color:#fff}
.av-home-row{background:linear-gradient(90deg,var(--av-blue-soft),#fff 45%);outline:1px solid color-mix(in srgb,var(--av-blue) 28%,transparent);outline-offset:-1px}
.av-home-label{display:inline-flex;align-items:center;gap:4px;margin-left:8px;padding:2px 7px;background:var(--av-blue);color:#fff;border-radius:999px;font-size:10px;font-weight:750;text-transform:uppercase;letter-spacing:.04em}

/* True full-page draft preview. */
.av-preview-full{position:fixed;inset:0;z-index:1000;display:grid;grid-template-rows:auto 1fr;background:#dce2e7}
.av-preview-bar{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:12px 18px;background:#fff;border-bottom:1px solid var(--av-line);box-shadow:0 8px 24px rgba(6,39,68,.12)}
.av-preview-bar>div:first-child{display:grid;gap:1px}.av-preview-bar small{color:var(--av-muted)}
.av-preview-stage{display:flex;justify-content:center;min-height:0;overflow:auto;padding:14px}
.av-preview-stage iframe{height:100%!important;min-height:calc(100vh - 88px);margin:0!important;border:0!important;border-radius:0!important;background:#fff;box-shadow:0 8px 40px rgba(6,39,68,.2)}

/* Clear section controls, media files and visitor detail. */
.av-section-tools button{width:auto!important;min-width:44px!important;padding:0 7px!important;gap:3px}.av-section-tools button small{font-size:10px;font-weight:750}
.av-file-thumb{display:grid!important;place-items:center;align-content:center;gap:8px;background:var(--av-blue-soft);color:var(--av-blue)}.av-file-thumb span{font-size:11px;font-weight:750;text-transform:uppercase}
.av-journey-panel{margin-top:20px!important;border-top:4px solid var(--av-red)!important}.av-journey-panel>header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}.av-journey-panel h2{margin:2px 0}.av-journey-panel .av-journey{max-width:820px}
.av-tag-picker{display:flex;flex-wrap:wrap;gap:8px}.av-tag-picker label{display:inline-flex!important;align-items:center;gap:7px;margin:0!important;padding:8px 11px;border:1px solid var(--av-line);border-radius:999px}.av-tag-picker label.selected{border-color:var(--av-blue);background:var(--av-blue-soft);color:var(--av-blue)}
.av-upload-control{display:grid;gap:4px;padding:10px;border:1px dashed var(--av-line);background:var(--av-paper)}
.av-country-select{width:100%;min-height:42px}
.av-subtitle+form.vault-settings{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.av-subtitle+form.vault-settings>h2,.av-subtitle+form.vault-settings>p,.av-subtitle+form.vault-settings>button,.av-subtitle+form.vault-settings>.vault-row{grid-column:1/-1}.av-subtitle+form.vault-settings>.vault-block{margin:0;padding:18px;background:var(--av-paper);border:1px solid var(--av-line)}.av-subtitle+form.vault-settings>.vault-block>h3{text-transform:capitalize;color:var(--av-blue)}.av-subtitle+form.vault-settings>.vault-block>.vault-block{background:#fff;border:1px solid var(--av-line);display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 14px}.av-subtitle+form.vault-settings>.vault-block>.vault-block>.actions{grid-column:1/-1}

/* Users are presented as an access-management surface instead of a dense utility table. */
.av-users-table{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;padding:16px}.av-users-table>.av-th{display:none!important}.av-user-row{border:1px solid var(--av-line);background:#fff}.av-user-row>.av-tr{display:grid!important;grid-template-columns:1fr auto!important;gap:14px;padding:18px!important}.av-user-row>.av-tr>span{min-width:0}.av-user-row .av-user-cell{grid-column:1/-1}.av-user-row .av-actions-cell{grid-column:1/-1;justify-content:flex-start}.av-user-row .av-inline-panel{border-top:1px solid var(--av-line);background:var(--av-paper)}

/* Exactly five health services across wide screens; responsive below. */
.av-health-grid{grid-template-columns:repeat(5,minmax(0,1fr))!important}.av-health-card.ok{border-color:#a9d5bf!important}.av-health-card.ok .av-health-icon,.av-health-status.ok{background:var(--av-green-soft)!important;color:var(--av-green)!important}
@media(max-width:1300px){.av-health-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
@media(max-width:900px){.av-health-grid,.av-users-table{grid-template-columns:repeat(2,minmax(0,1fr))!important}.av-preview-bar{align-items:flex-start;flex-direction:column}}
@media(max-width:620px){.av-health-grid,.av-users-table,.av-subtitle+form.vault-settings{grid-template-columns:1fr!important}.av-preview-stage{padding:0}.av-preview-bar .actions{width:100%;overflow:auto;flex-wrap:nowrap}}
.vault [data-slot="button"][data-variant="ghost"]{min-height:36px;border-radius:3px}
.vault [data-slot="input"],.vault [data-slot="textarea"],.av-select,.av-inline-select,.av-canvas-image select{border-color:var(--av-line);border-radius:3px;background:#fff}
.vault [data-slot="input"]:focus-visible,.vault [data-slot="textarea"]:focus-visible,.av-select:focus-visible,.av-inline-select:focus-visible{border-color:var(--av-red);box-shadow:0 0 0 2px var(--av-red-soft);outline:0}
.vault [data-slot="badge"]{border-radius:3px}
.vault [data-slot="badge"][data-variant="default"]{background:var(--av-blue);color:#fff}
.vault [data-slot="badge"][data-variant="outline"]{border-color:var(--av-line);background:#fff;color:var(--av-blue)}
.vault [data-slot="tabs-list"]{gap:2px;padding:2px;border-radius:3px;background:var(--av-paper)}
.vault [data-slot="tabs-trigger"]{border-radius:2px}
.vault [data-slot="tabs-trigger"][data-state="active"],.vault [data-slot="tabs-trigger"][aria-selected="true"]{background:var(--av-blue);color:#fff}
.av-seg{padding:2px;border:1px solid var(--av-line);border-radius:3px;background:var(--av-paper)}
.av-seg button{border-radius:2px}
.av-seg button.selected{background:var(--av-blue);color:#fff}
.av-seg button.selected .av-count{background:#fff;color:var(--av-blue)}
.av-count,.av-you,.av-tax-uses,.av-tax-posts button,.av-filter-chip{border-radius:3px}
.av-count{background:var(--av-paper);color:var(--av-copy)}
.av-find,.av-inline-panel,.av-hint-box,.av-hours li,.av-bars button,.av-bar,.av-gallery-item,.av-filelinks a,.av-use-list li>a,.av-use-row,.av-tax-list>li,.av-quick-item{border-radius:4px}
.av-inline-panel{border-color:var(--av-line);background:var(--av-paper)}
.av-hint-box{background:var(--av-blue-soft);color:var(--av-blue)}
.av-form-card{border-radius:4px}
.av-form-card:hover{border-color:var(--av-blue)}
.av-form-card.selected{border-color:var(--av-blue);box-shadow:inset 0 3px var(--av-red)}
.av-form-card .av-form-dot{background:var(--av-blue)}
.av-form-card:nth-child(2) .av-form-dot{background:var(--av-red)}
.av-form-card .av-form-dot{border-radius:1px}
.av-field-list>li{border-radius:4px}
.av-field-list>li.open{border-color:var(--av-blue);box-shadow:none}
.av-pill,.av-status-cell .av-edits{border-radius:3px}
.av-pill-live,.av-pill-draft,.av-pill-scheduled{background:var(--av-blue-soft);color:var(--av-blue)}
.av-pill-warn,.av-status-cell .av-edits{background:var(--av-red-soft);color:var(--av-red)}
.av-pill::before,.av-dot-label::before,.av-status-cell .av-edits::before{border-radius:1px;background:var(--av-blue)}
.av-pill-warn::before,.av-status-cell .av-edits::before{background:var(--av-red)}
.av-step{border-radius:4px}
.av-step:hover,.av-step.selected{border-color:var(--av-blue)}
.av-step.selected{box-shadow:inset 0 3px var(--av-red)}
.av-step-num{border-radius:2px;background:var(--av-blue);color:#fff}
.av-stat-warnings svg,.av-legend-warn{color:var(--av-red)}
.av-stat-passed svg,.av-legend-ok,.av-saved{color:var(--av-blue)!important}
.av-stat.selected{border-color:var(--av-blue);box-shadow:inset 0 3px var(--av-red)}
.av-issues li.warn{color:var(--av-copy)}
.av-issues li.warn::before{background:var(--av-red)}
.av-redirect-form,.av-savebar.show{border-color:var(--av-blue)!important;box-shadow:none}
.av-health-banner,.av-health-card,.av-restore-list button{border-radius:4px}
.av-health-banner.warn>svg,.av-health-card.warn .av-health-icon,.av-health-status.warn,.av-act-icon.yellow{color:var(--av-red)}
.av-health-card.warn .av-health-icon,.av-health-status.warn,.av-act-icon.yellow{background:var(--av-red-soft)}
.av-health-card.ok .av-health-icon,.av-health-status.ok,.av-act-icon.green{background:var(--av-blue-soft);color:var(--av-blue)}
.av-avatar.lg{background:var(--av-blue-soft);color:var(--av-blue)}
.av-serp{border-radius:4px;font-family:var(--font-sans)}
.av-serp strong{color:var(--av-blue)}
.av-filter-chip{border-color:var(--av-blue);background:#fff;color:var(--av-blue)}
.av-filter-chip:hover{background:var(--av-blue-soft)}
.av-live i{border-radius:1px;background:var(--av-red);box-shadow:0 0 0 0 rgba(204,41,60,.35)}
@keyframes av-pulse{70%{box-shadow:0 0 0 8px rgba(204,41,60,0)}100%{box-shadow:0 0 0 0 rgba(204,41,60,0)}}
.av-kpi-link.green svg,.av-kpi-link svg{color:var(--av-blue)}
.av-kpi-link.yellow svg,.av-kpi-link.red svg{color:var(--av-red)}
.av-kpi-link:hover{border-color:var(--av-blue);transform:translateY(-1px)}
.av-hello{border-top:3px solid var(--av-red);background:#fff}
.av-attention{border-color:var(--av-line)!important;border-top:3px solid var(--av-red)!important;background:var(--av-paper)}
.av-attention h3{color:var(--av-blue)}
.av-attention li{border-color:var(--av-line);border-radius:4px}
.av-ov-tile{border-radius:4px}
.av-ov-tile:hover{border-color:var(--av-blue)}
.av-ov-tile.warn{border-color:var(--av-red);background:var(--av-red-soft)}
.av-ov-tile.warn svg,.av-ov-health b.warn{color:var(--av-red)}
.av-ov-health b.ok{color:var(--av-blue)}
.av-quick-item:hover{border-color:var(--av-blue);background:var(--av-blue-soft)}
.av-tax-posts button{border-color:var(--av-line);background:var(--av-blue-soft);color:var(--av-blue)}
.vault-top a,.vault-sidebar>a:last-child{border-radius:3px}
.vault-sectionlist button{border-radius:3px}
.vault-preview iframe,.av-forms-frame,.av-media-thumb,.av-media-panel,.av-media-url{border-radius:4px}
.av-actions-cell a{border-radius:3px}
.av-toolbar select,.av-tool{border-radius:3px}
.av-switch.on{color:var(--av-blue)}
.av-switch.on>span{background:var(--av-blue)}
.vault-stats .vault-card:nth-child(odd) strong{color:var(--av-blue)}
.vault-stats .vault-card:nth-child(even) strong{color:var(--av-red)}
.vault-stats .vault-card:nth-child(odd)::after{background:var(--av-blue-soft)}
.vault-stats .vault-card:nth-child(even)::after{background:var(--av-red-soft)}
.vault-notice{border-color:var(--av-line);border-radius:4px;background:var(--av-blue-soft);color:var(--av-blue)}
.av-section-tools{border-radius:3px;background:var(--av-blue)}
.av-section-tools em{border-radius:2px;background:var(--av-red);color:#fff}
.av-section-tools button{border-radius:2px}
.av-section-add{border-radius:3px;background:var(--av-red);box-shadow:none}
.av-section-add:hover:not(:disabled){background:var(--av-blue)}
.av-library{border-radius:6px!important}
.av-library-group button{border-radius:3px}
.av-library-group button.selected{border-color:var(--av-blue);background:var(--av-blue-soft);box-shadow:inset 3px 0 var(--av-red)}
.av-library-stage,.av-library-empty{border-radius:4px}
.av-post-canvas{--blog-accent:var(--av-red);--blog-tint:var(--av-red-soft);border-radius:5px}
.av-post-canvas.blog-blue,.av-post-canvas.blog-green{--blog-tint:var(--av-blue-soft)}
.av-post-canvas.blog-red,.av-post-canvas.blog-yellow{--blog-tint:var(--av-red-soft)}
.av-post-canvas.blog-yellow .av-post-title input.accent,.av-post-canvas.blog-yellow .av-post-title .accent,.av-post-canvas.blog-red .av-post-title input.accent,.av-post-canvas.blog-red .av-post-title .accent{color:var(--av-red)}
.av-post-body a,.av-tool.on{color:var(--av-blue)}
.av-post-body mark{background:var(--av-red-soft)}
.av-login{background:var(--av-paper)}
.av-login-card{border-radius:6px!important;border-color:var(--av-blue)!important;box-shadow:0 6px 0 var(--av-red)}
.av-login [data-slot="button"]{border-radius:3px;background:var(--av-red)}
@media(max-width:700px){.vault-main{border-radius:0}.vault [data-slot="button"]{min-height:44px}}

/* Search editing keeps the live result one click away. */
.av-card-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:20px}
.av-card-heading h2,.av-card-heading p{margin:0}.av-card-heading p{margin-top:5px;max-width:62ch}

/* Section library: compact catalogue beside an honest website preview. */
.av-library{width:min(1240px,calc(100vw - 40px))!important;height:min(880px,calc(100vh - 40px));padding:0!important;gap:0!important;overflow:hidden;border:1px solid var(--av-line)!important;background:#fff!important;box-shadow:0 24px 70px rgba(6,39,68,.24)!important}
.av-library-head{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:14px;padding:22px 58px 20px 24px;border-bottom:1px solid var(--av-line);background:var(--av-paper)}
.av-library-mark{display:grid;place-items:center;width:42px;height:42px;border-radius:4px;background:var(--av-blue);color:#fff}.av-library-mark svg{width:21px;height:21px}
.av-library-head h2{font-size:28px!important;line-height:1.05}.av-library-head p{max-width:70ch!important;margin-top:6px!important}
.av-library-total{align-self:start;padding:6px 9px;border:1px solid var(--av-line);border-radius:3px;background:#fff;color:var(--av-blue);font-size:12px;font-weight:750;font-variant-numeric:tabular-nums}
.av-library-body{grid-template-columns:minmax(290px,360px) minmax(0,1fr);gap:0!important}
.av-library-list{gap:10px;padding:18px;border-right:1px solid var(--av-line);background:#fff}
.av-library-list>.av-search{position:sticky;top:0;z-index:2;background:#fff;padding-bottom:4px}
.av-library-others{padding:10px 11px;border:1px solid var(--av-line);border-radius:3px;background:var(--av-paper)}
.av-library-group{gap:5px}.av-library-group h3{display:flex;align-items:center;justify-content:space-between;margin:15px 0 3px!important;color:var(--av-blue)!important}.av-library-group h3 small{display:grid;place-items:center;min-width:22px;height:22px;border-radius:3px;background:var(--av-blue-soft);color:var(--av-blue)}
.av-library-group button{position:relative;gap:5px!important;padding:12px 13px!important;border:1px solid var(--av-line)!important;border-radius:4px!important;background:#fff!important}
.av-library-group button:hover{border-color:color-mix(in srgb,var(--av-blue) 45%,var(--av-line))!important;background:var(--av-paper)!important}.av-library-group button.selected{border-color:var(--av-blue)!important;background:var(--av-blue-soft)!important;box-shadow:none!important}
.av-library-group button.selected::after{content:"";position:absolute;right:11px;top:13px;width:7px;height:7px;border-radius:50%;background:var(--av-red)}
.av-library-group button>span{display:flex;flex-wrap:wrap;gap:5px 9px}.av-library-group button>span small+small{padding-left:9px;border-left:1px solid var(--av-line)}
.av-library-no-results{padding:18px;border:1px dashed var(--av-line);color:var(--av-muted);line-height:1.55}
.av-library-preview{gap:0!important;background:#dce2e7}.av-library-bar{min-height:67px;padding:12px 16px 12px 20px;border-bottom:1px solid var(--av-line);background:#fff}.av-library-bar>span strong{color:var(--av-blue)}
.av-library-stage{margin:18px;min-height:0;border:0!important;border-radius:4px!important;box-shadow:0 8px 30px rgba(6,39,68,.18);background:#fff}
.av-library-empty{gap:8px;align-content:center;margin:18px!important;border:1px dashed #9babb7!important;border-radius:4px!important;background:rgba(255,255,255,.62);text-align:center}.av-library-empty svg{width:34px;height:34px;color:var(--av-blue)}.av-library-empty strong{color:var(--av-blue);font-size:18px}.av-library-empty p{max-width:42ch;margin:0;color:var(--av-copy)}

/* Reusable forms lead the workspace and new forms open directly in preview/edit mode. */
.av-forms-index{margin-bottom:20px;padding:22px;border:1px solid var(--av-line);background:var(--av-paper)}
.av-forms-index .av-content-intro{align-items:center;margin-bottom:18px}.av-forms-index .av-content-intro h2{margin:0;color:var(--av-blue);font-family:var(--av-display);font-size:27px;font-weight:400}.av-forms-index .av-content-intro p{max-width:72ch;margin:6px 0 0;color:var(--av-copy)}
.av-forms-index .av-forms-list{margin:0}.av-form-card.custom{background:#fff}.av-form-card.built-in{background:color-mix(in srgb,var(--av-blue-soft) 38%,#fff)}
.av-form-card.custom .av-form-dot{background:var(--av-red)}.av-form-card.built-in .av-form-dot{background:var(--av-blue)}
.av-custom-form-identity{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;padding-bottom:18px;border-bottom:1px solid var(--av-line)}.av-custom-form-identity>div h2,.av-custom-form-identity>div p{margin:0}.av-custom-form-identity>div p{margin-top:5px;color:var(--av-copy)}.av-custom-form-identity>label{grid-column:span 1}.av-custom-form-identity>label:first-of-type{grid-column:1}.av-custom-form-identity>label:last-of-type{grid-column:2}
@media(max-width:760px){.av-card-heading{align-items:stretch;flex-direction:column}.av-library{width:calc(100vw - 16px)!important;height:calc(100vh - 16px)}.av-library-head{grid-template-columns:auto 1fr;padding:16px 48px 15px 16px}.av-library-total{display:none}.av-library-body{grid-template-columns:1fr;grid-template-rows:minmax(220px,42%) 1fr}.av-library-list{padding:12px;border-right:0;border-bottom:1px solid var(--av-line)}.av-library-stage,.av-library-empty{margin:10px!important}.av-forms-index{padding:16px}.av-forms-index .av-content-intro{align-items:stretch;flex-direction:column}.av-custom-form-identity{grid-template-columns:1fr}.av-custom-form-identity>*{grid-column:1!important}}

/* Live-editor decisions use the AVAULT language and brand instead of browser confirms. */
[data-slot="alert-dialog-overlay"]{background:rgba(6,39,68,.58)!important}
.av-editor-confirm{max-width:520px!important;gap:20px!important;padding:26px!important;border:1px solid var(--av-line)!important;border-radius:6px!important;background:#fff!important;box-shadow:0 22px 70px rgba(6,39,68,.28)!important;color:var(--av-ink)!important}
.av-editor-confirm [data-slot="alert-dialog-header"]{grid-template-columns:auto minmax(0,1fr)!important;grid-template-rows:auto auto!important;place-items:start!important;gap:5px 16px!important;text-align:left!important}
.av-editor-confirm [data-slot="alert-dialog-media"]{grid-column:1!important;grid-row:1/3!important;width:46px!important;height:46px!important;margin:0!important;border-radius:4px!important;background:var(--av-blue-soft)!important;color:var(--av-blue)!important}
.av-editor-confirm [data-slot="alert-dialog-media"].danger{background:var(--av-red-soft)!important;color:var(--av-red)!important}
.av-editor-confirm [data-slot="alert-dialog-media"] svg{width:22px!important;height:22px!important}
.av-editor-confirm [data-slot="alert-dialog-title"]{grid-column:2!important;margin:0!important;color:var(--av-blue)!important;font-family:var(--av-display);font-size:24px!important;font-weight:400!important;line-height:1.15}
.av-editor-confirm [data-slot="alert-dialog-description"]{grid-column:2!important;margin:0!important;color:var(--av-copy)!important;font-size:14px!important;line-height:1.6}
.av-editor-confirm [data-slot="alert-dialog-footer"]{gap:9px!important;border-top:1px solid var(--av-line);padding-top:18px}
@media(max-width:560px){.av-editor-confirm{padding:20px!important}.av-editor-confirm [data-slot="alert-dialog-header"]{grid-template-columns:1fr!important}.av-editor-confirm [data-slot="alert-dialog-media"],.av-editor-confirm [data-slot="alert-dialog-title"],.av-editor-confirm [data-slot="alert-dialog-description"]{grid-column:1!important;grid-row:auto!important}.av-editor-confirm [data-slot="alert-dialog-footer"]{display:flex!important;flex-direction:column-reverse!important}.av-editor-confirm [data-slot="button"]{width:100%}}
```

### app/avault/toast.ts

<!-- avault-file path="app/avault/toast.ts" mode="owned" sha256="dee1a783584d4bf7745b5ddbc02b0a2287544893f977bfdb2e8df7b0fa279deb" eol="1" -->
```ts
import {toast} from 'sonner';
// Every AVAULT panel reports through one `notice(message)` call; this shows it as a toast that clears itself.
// Errors stay a little longer and use the red style; an empty message (used to "clear") does nothing.
const ERROR=/\b(fail|failed|error|invalid|unable|could not|couldn['’]t|cannot|can['’]t|rejected|denied|required|must|too many|not (?:found|allowed|published|configured|reachable)|unavailable|expired|sign in|try again|does not|do not match|enter (?:a|the|your|between|both))\b/i;
// Messages the admin API returned as errors. request() and api() register them, so they show as errors whatever their
// wording; anything else (client-side checks, success notes) falls back to the word list above.
const serverErrors=new Set<string>();
export function serverError(message:string){serverErrors.add(message);return new Error(message)}
export function notify(message:string){if(!message)return;const failed=serverErrors.delete(message)||ERROR.test(message);if(failed)toast.error(message,{duration:8000});else toast.success(message,{duration:4000})}
```

### app/avault/vault.tsx

<!-- avault-file path="app/avault/vault.tsx" mode="owned" sha256="f9f6c41eeb06560e33b06fce08477e7f763ca9abc804c1a4a50bd2e62355c3c7" eol="1" -->
```tsx
'use client';
import {MediaCard} from './media-tools';
import {ContentTools,PublishingTools} from './content-tools';
import {OperationsPanel,FamilyBuilder} from './operations-panel';
import {PostEditor} from './rich-editor';
import {NavigationEditor} from './navigation-editor';
import {PageCanvas} from './page-canvas';
import {FormsEditor} from './forms-editor';
import {DocTable,SeoPanel,RedirectsPanel} from './list-views';
import {LeadsInbox} from './leads-inbox';
import {HealthPanel} from './health-panel';
import {ActivityLog,BackupsPanel,TrafficPanel} from './admin-views';
import {ScriptsPanel,PrivacyPanel} from './scripts-privacy';
import {UsersPanel,EmailSetup,SettingsForm,VisitorsView,CallsView} from './people-views';
import {OverviewPanel,SchedulesPanel,TaxonomyPanel} from './overview-views';
// Old links used ?view=forms for the leads inbox (page.tsx redirects them; this covers back/forward).
const ALIAS:Record<string,string>={forms:'leads'};
const viewOf=(v:string|null)=>ALIAS[v||'']||v||'overview';
import {SeoTab,RevisionDiff,PreviewFrame} from './panels';
import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogMedia,AlertDialogTitle} from '@/components/ui/alert-dialog';
import {FileText,Search,Image as ImageIcon,Inbox,History,Settings,Link as LinkIcon,Users,ArrowUpRight,ShieldCheck,Save,Eye,Upload,LayoutDashboard,Mail,Phone,Activity,Undo2,Redo2,RotateCcw,Trash2,Tags,CalendarClock,DatabaseBackup,HeartPulse,Code2,Ban,Eye as EyeIcon,PanelsTopLeft,ClipboardList,Plus} from 'lucide-react';
import type {Doc} from '@/lib/avault/store';
import {Toaster} from 'sonner';
import {notify,serverError} from './toast';
import {adminFetch} from './session';
const setNotice=notify;
const menu=[['overview','Overview',LayoutDashboard,'Content'],['pages','Pages & services',FileText,'Content'],['blogs','Blogs',FileText,'Content'],['taxonomy','Categories & tags',Tags,'Content'],['schedules','Scheduled publishing',CalendarClock,'Content'],['media','Media',ImageIcon,'Content'],['navigation','Header & footer',PanelsTopLeft,'Content'],['seo','SEO & discovery',Search,'Content'],['redirects','Redirects',LinkIcon,'Content'],['leads','Leads',Inbox,'Conversions'],['site-forms','Forms',ClipboardList,'Conversions'],['calls','Calls',Phone,'Conversions'],['visitors','Visitors',Activity,'Conversions'],['settings','Site settings',Settings,'Administration'],['email','Email',Mail,'Administration'],['users','Users',Users,'Administration'],['privacy','Privacy & tracking',EyeIcon,'Administration'],['scripts','Custom scripts',Code2,'Administration'],['traffic','Traffic access',Ban,'Administration'],['backups','Backups',DatabaseBackup,'Administration'],['health','System health',HeartPulse,'Administration'],['activity','Activity log',History,'Administration']] as const;
async function api(path:string,data?:unknown):Promise<any>{const r=await adminFetch(path,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});const v:any=await r.json();if(!r.ok)throw serverError(v.error||'Request failed');return v}
export default function Vault({email,role,initialView='overview'}:{email:string;role:string;initialView?:string}){
 // Starts on the requested screen so the sidebar never flashes "Overview" first.
 const [view,setView]=useState(viewOf(initialView)),[list,setList]=useState<any[]>([]),[data,setData]=useState<any>(null),[doc,setDoc]=useState<Doc|null>(null),[query,setQuery]=useState(''),[section,setSection]=useState(''),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false),[preview,setPreview]=useState(''),[revisions,setRevisions]=useState<any[]>([]),[creating,setCreating]=useState(false),[page,setPage]=useState(0),[diff,setDiff]=useState<{before:Doc;after:Doc}|null>(null),[undo,setUndo]=useState<Doc[]>([]),[redo,setRedo]=useState<Doc[]>([]),[lastSnap,setLastSnap]=useState(0),[titleTemplate,setTitleTemplate]=useState('%s | DMV Commercial Door Repair'),[mediaFilter,setMediaFilter]=useState('all'),[savedDoc,setSavedDoc]=useState<Doc|null>(null);
 const [discard,setDiscard]=useState<{description:string;run:()=>void}|null>(null);
 function finishNavigate(v:string){setView(v);setPage(0);setDoc(null);setData(null);setDirty(false);setQuery('');history.pushState({},'',`/avault?view=${v}`)}
 function navigate(v:string){if(dirty){setDiscard({description:'Leaving now will discard every unsaved change on this page. The last saved draft will remain unchanged.',run:()=>finishNavigate(v)});return}finishNavigate(v)}
 const loadToken=useRef(0);
 async function load(v=view){const token=++loadToken.current;const current=()=>token===loadToken.current;setBusy(true);try{const docs=await api('documents');if(!current())return;setList(docs);const next=['media'].includes(v)?await api(v+'?page='+page):null;if(current())setData(next)}catch(e){if(current())setNotice((e as Error).message)}finally{if(current())setBusy(false)}}
 useEffect(()=>{const u=new URL(location.href),v=viewOf(u.searchParams.get('view'));setView(v);const route=u.searchParams.get('route');if(route)open(route,v);const back=()=>{const u=new URL(location.href);setView(viewOf(u.searchParams.get('view')));if(u.searchParams.get('route'))open(u.searchParams.get('route')!);else setDoc(null)};window.addEventListener('popstate',back);return()=>window.removeEventListener('popstate',back)},[]);
 useEffect(()=>{load()},[view,page]);
 useEffect(()=>{api('settings').then(g=>setTitleTemplate(g.titleTemplate||'%s | DMV Commercial Door Repair')).catch(()=>{})},[]);
 useEffect(()=>{const fn=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',fn);return()=>window.removeEventListener('beforeunload',fn)},[dirty]);
 async function open(route:string,inView=view){try{const opened=await api('document?route='+encodeURIComponent(route));setDoc(opened);setSavedDoc(opened);setDirty(false);setSection('');setPreview('');setRevisions([]);setDiff(null);setUndo([]);setRedo([]);history.replaceState({},'',`/avault?view=${inView}&route=${encodeURIComponent(route)}`)}catch(e){setNotice((e as Error).message)}}
 async function save(action:string){if(!doc)return;setBusy(true);setNotice('');try{const result=await api(action,{document:doc,expectedRevision:doc.revision});setDoc(result);setSavedDoc(result);setDirty(false);setNotice(action==='publish'?'Published. The public page and sitemaps now use this revision.':'Saved.');await load()}catch(e){setNotice((e as Error).message)}finally{setBusy(false)}}
 async function showPreview(){if(!doc)return;setBusy(true);try{const r=await adminFetch('preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({document:doc})});if(!r.ok)throw new Error(((await r.json()) as any).error);setPreview(await r.text())}catch(e){setNotice((e as Error).message)}finally{setBusy(false)}}
 function change(next:Doc){if(doc&&Date.now()-lastSnap>1000){setUndo(u=>[...u.slice(-49),doc]);setLastSnap(Date.now())}setRedo([]);setDoc(next);setDirty(true)}
 function stepHistory(back:boolean){if(!doc)return;const from=back?undo:redo;if(!from.length)return;const prev=from[from.length-1];(back?setUndo:setRedo)(from.slice(0,-1));(back?setRedo:setUndo)(s=>[...s,doc]);setDoc(prev);setDirty(true);setLastSnap(0)}
 // A saved structure change (sections added or removed) replaces the draft; earlier undo steps no longer fit it.
 function replaceDoc(next:Doc){setDoc(next);setSavedDoc(next);setDirty(false);setUndo([]);setRedo([]);setLastSnap(0);load()}
 function revertDoc(){if(!savedDoc)return;setDoc(structuredClone(savedDoc));setDirty(false);setUndo([]);setRedo([]);setLastSnap(0)}
 function field(key:string,value:string){if(doc)change({...doc,fields:doc.fields.map(f=>f.key===key?{...f,value}:f)})}
 function seo(key:string,value:any){if(doc)change({...doc,seo:{...doc.seo,[key]:value}})}
 return <div className="vault"><aside className="vault-sidebar"><a href="/" className="vault-brand" aria-label="DMV Commercial Door Repair website"><img src="/assets/logo.png" alt="DMV Commercial Door Repair"/><span className="vault-brand-meta"><b>AVAULT</b><small>Website control</small></span></a><nav>{menu.map(([id,label,Icon,group],i)=><div key={id} style={{display:'contents'}}>{menu[i-1]?.[3]!==group&&<p className="vault-navlabel">{group}</p>}<button type="button" className={view===id?'selected':''} onClick={()=>navigate(id)}><Icon size={18}/><span>{label}</span></button></div>)}</nav><div className="vault-account"><ShieldCheck size={18}/><span>{email}<small>{role}</small></span></div><a href="/avault/login/" onClick={async e=>{e.preventDefault();await fetch('/api/admin/logout/',{method:'POST'});location.href='/avault/login/'}}>Sign out</a></aside><div className="vault-body"><header className="vault-top"><span>AVAULT <span className="muted">/ {menu.find(m=>m[0]===view)?.[1]}</span></span><a href="/" target="_blank" rel="noreferrer">View live website <ArrowUpRight size={15}/></a></header><main className="vault-main"><Toaster position="bottom-right" theme="light" richColors closeButton toastOptions={{className:'vault-toast'}}/><AlertDialog open={!!discard} onOpenChange={open=>{if(!open)setDiscard(null)}}><AlertDialogContent className="av-editor-confirm"><AlertDialogHeader><AlertDialogMedia><RotateCcw/></AlertDialogMedia><AlertDialogTitle>Discard unsaved page changes?</AlertDialogTitle><AlertDialogDescription>{discard?.description}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction onClick={()=>{const action=discard?.run;setDiscard(null);action?.()}}>Discard changes</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
 {doc?<><div className="vault-title"><div><button onClick={()=>{const leave=()=>{setDoc(null);setDirty(false)};if(dirty)setDiscard({description:'Returning to the page list will discard every unsaved change on this page. The last saved draft will remain unchanged.',run:leave});else leave()}}>← All pages</button><h1>{doc.label}</h1><p>{doc.route} · Revision {doc.revision} {dirty?'· Unsaved changes':''}</p></div><div className="actions"><Button variant="outline" aria-label="Undo" title="Undo" onClick={()=>stepHistory(true)} disabled={!undo.length}><Undo2/></Button><Button variant="outline" aria-label="Redo" title="Redo" onClick={()=>stepHistory(false)} disabled={!redo.length}><Redo2/></Button><Button variant="outline" onClick={showPreview} disabled={busy}><Eye/>Preview</Button><Button variant="outline" onClick={()=>save('save')} disabled={busy}><Save/>Save draft</Button><Button onClick={()=>save('publish')} disabled={busy}>Publish</Button></div></div><Tabs key={doc.route} defaultValue={doc.template.includes('{{BODY}}')?'content':'live'}><TabsList>{!doc.template.includes('{{BODY}}')&&<TabsTrigger value="live">Live edit</TabsTrigger>}<TabsTrigger value="content">{doc.template.includes('{{BODY}}')?'Article':'All fields'}</TabsTrigger><TabsTrigger value="seo">Search & sharing</TabsTrigger>{!doc.template.includes('{{BODY}}')&&<TabsTrigger value="structure">Sections & blocks</TabsTrigger>}<TabsTrigger value="publishing">Publishing</TabsTrigger><TabsTrigger value="history">Revisions</TabsTrigger></TabsList>{!doc.template.includes('{{BODY}}')&&<TabsContent value="live"><PageCanvas doc={doc} original={savedDoc} setField={field} change={change} replace={replaceDoc} revert={revertDoc} docs={list} go={navigate} notice={setNotice}/></TabsContent>}<TabsContent value="content">{doc.template.includes('{{BODY}}')?<PostEditor doc={doc} change={change} upload={async file=>{const f=new FormData();f.set('file',file);f.set('alt','');const r=await adminFetch('media/',{method:'POST',body:f});const v:any=await r.json();if(!r.ok)throw new Error(v.error||'Upload failed');return v.url}}/>:<div className="vault-editor"><div className="vault-sectionlist"><Input aria-label="Find content" placeholder="Find text or section…" value={query} onChange={e=>setQuery(e.target.value)}/><button onClick={()=>setSection('')}>All sections</button>{[...new Set(doc.fields.map(f=>f.section))].map(s=><button className={section===s?'selected':''} key={s} onClick={()=>setSection(s)}>{s}</button>)}</div><div className="vault-fields"><datalist id="page-destinations">{list.filter(d=>d.status==='published').map(d=><option key={d.route} value={d.route}>{d.label}</option>)}</datalist>{doc.fields.filter(f=>(!section||f.section===section)&&(!query||(f.value+' '+f.section+' '+f.label).toLowerCase().includes(query.toLowerCase()))).map(f=><label key={f.key}><span>{f.section} <small>{f.label}</small></span>{f.value.length>130?<Textarea value={f.value} onChange={e=>field(f.key,e.target.value)}/>:<Input list={f.kind==='url'?'page-destinations':undefined} value={f.value} onChange={e=>field(f.key,e.target.value)}/>}</label>)}</div></div>}</TabsContent><TabsContent value="structure"><ContentTools doc={doc} onChange={change} notice={setNotice}/></TabsContent><TabsContent value="publishing">{dirty?<p>Save the current draft to use publishing controls.</p>:<PublishingTools doc={doc} notice={setNotice} open={open}/>}</TabsContent><TabsContent value="seo"><SeoTab doc={doc} set={seo} setDoc={fn=>change(fn(doc))} titleTemplate={titleTemplate}/></TabsContent><TabsContent value="history"><div className="vault-card"><h2>Revision history</h2><Button variant="outline" onClick={async()=>setRevisions(await api('revisions?route='+encodeURIComponent(doc.route)))}>Load revisions</Button>{revisions.map(r=><div className="vault-row" key={r.id}><span>{r.created_at} · {r.actor} · {r.state}</span><Button variant="outline" onClick={async()=>{const v=await api('revision?id='+r.id);const before=JSON.parse(v.before),after=JSON.parse(v.after);setDiff({before,after})}}>View changes</Button><Button variant="outline" onClick={async()=>{const v=await api('revision?id='+r.id);const before=JSON.parse(v.before) as Doc;
 // Same sections as now: load it as an unsaved draft. Different sections: the server restores it as the saved draft.
 if(before.template===doc.template&&before.fields.map(f=>f.key).join()===doc.fields.map(f=>f.key).join()){setDoc({...before,revision:doc.revision});setDirty(true);setNotice('Previous content loaded as an unsaved draft. Preview and publish to restore as a new revision.');return}
 if(!confirm('This revision has different sections from the current page. Restore it as the saved draft now? Any unsaved changes are discarded.'))return;try{replaceDoc(await api('revision-restore',{id:r.id,route:doc.route,expectedRevision:doc.revision}));setNotice('Revision restored as the draft. Preview and publish to make it live.')}catch(e){setNotice((e as Error).message)}}}>Restore as draft</Button></div>)}{diff&&<><h3>Changes in this revision</h3><RevisionDiff before={diff.before} after={diff.after}/></>}<div className="actions" style={{marginTop:24}}><Button variant="outline" onClick={()=>{if(confirm('Unpublish this route? It will return not found until published again.'))save('unpublish')}}>Unpublish page</Button>{role==='owner'&&list.find(d=>d.route===doc.route)?.status==='draft'&&<Button variant="outline" onClick={async()=>{if(!confirm('Delete this never-published draft permanently?'))return;try{await api('document-delete',{route:doc.route});setDoc(null);setDirty(false);setNotice('Draft deleted.');load()}catch(e){setNotice((e as Error).message)}}}><Trash2/>Delete draft</Button>}</div></div></TabsContent></Tabs>{preview&&<PreviewFrame html={preview} close={()=>setPreview('')}/>}</>:<>
 <div className="vault-title"><div><h1>{view==='overview'?'Your website, in view.':menu.find(m=>m[0]===view)?.[1]}</h1><p>{view==='overview'?'Today on the website, what needs you, and where to go next.':view==='pages'||view==='blogs'?'Edit a draft, preview the design, then publish your changes.':view==='navigation'?'The header and footer shared by every page. Click anything in the preview to edit it.':view==='site-forms'?'Every form on the website. Change fields, choices and wording; the preview shows the result.':view==='seo'?'Three things keep the site easy to find: healthy pages, a verified owner, and up-to-date discovery files.':view==='redirects'?'Old links that now lead somewhere new.':view==='leads'?'Every request sent through the website. Open one to see where it came from and reply.':view==='health'?'Live status of the services that keep the website and AVAULT running.':view==='activity'?'Everything people have changed in AVAULT, newest first.':view==='backups'?'Encrypted snapshots of your content and settings. Restore a single page whenever you need to.':view==='traffic'?'Decide who can open the public website. AVAULT itself is never blocked.':view==='schedules'?'Pages and posts set to go live at a chosen time.':view==='taxonomy'?'The categories and tags that organise your blog.':view==='users'?'Who can sign in to AVAULT, and what they can change.':view==='email'?'How new leads reach your inbox.':view==='settings'?'Your business details. They update every page, the contact links and what search engines see.':view==='visitors'?'Who is visiting, where from, and what they do on the site.':view==='calls'?'Every tap on a phone number, with the page and visitor behind it.':view==='scripts'?'Analytics, pixels and other third-party code, added without editing the website.':view==='privacy'?'What the site records about visitors, how long it’s kept, and handling data requests.':''}</p></div>{busy&&<Badge>Loading…</Badge>}</div>
 {view==='taxonomy'&&<TaxonomyPanel docs={list} notice={setNotice} open={route=>open(route,'blogs')}/>}
 {view==='schedules'&&<SchedulesPanel docs={list} notice={setNotice} open={route=>open(route)} reloadDocs={()=>load()}/>}
 {view==='overview'&&<OverviewPanel go={navigate} email={email}/>}
 {view==='health'&&<HealthPanel role={role} notice={setNotice} go={navigate}/>}
 {view==='email'&&<EmailSetup role={role} notice={setNotice}/>}
 {view==='calls'&&<CallsView notice={setNotice}/>}
 {view==='visitors'&&<VisitorsView notice={setNotice}/>}
 {['pages','blogs'].includes(view)&&<><div className="actions" style={{marginBottom:20}}><Button onClick={()=>setCreating(!creating)}><Plus/>{view==='blogs'?'New blog post':'New page'}</Button></div>{creating&&<form className="vault-card vault-settings" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{const result=await api('create',Object.fromEntries(f));setDoc(result);setSavedDoc(result);setCreating(false);setDirty(false);load()}catch(e){setNotice((e as Error).message)}}}><h2>{view==='blogs'?'Create a blog post draft':'Create a page draft'}</h2><label>Title<Input name="title" required onChange={e=>{if(view!=='blogs')return;const r=e.currentTarget.form?.elements.namedItem('route') as HTMLInputElement|null;if(r&&(!r.value||r.dataset.auto==='1')){r.value='/blog/'+e.target.value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)+'/';r.dataset.auto='1'}}}/></label><label>New URL<Input name="route" onInput={e=>{e.currentTarget.dataset.auto='0'}} placeholder={view==='blogs'?'/blog/your-post/':'/your-page/'} required/></label><label>{view==='blogs'?'Layout (copied from this post; its text is not copied)':'Existing design'}<select name="templateRoute">{list.filter(d=>view==='blogs'?d.kind==='post':d.kind!=='post').map(d=><option key={d.route} value={d.route}>{d.label}</option>)}</select></label><p>{view==='blogs'?'The new post opens in the article editor with an empty body. It stays private until you publish it.':'The copied page stays private until you replace its content and publish it.'}</p><Button disabled={!list.some(d=>view==='blogs'?d.kind==='post':d.kind!=='post')}>Create draft</Button></form>}<DocTable docs={list} posts={view==='blogs'} open={route=>open(route)} loading={busy}/></>}
 {view==='seo'&&<SeoPanel role={role} notice={setNotice} docs={list} open={route=>open(route)}/>}
 {view==='navigation'&&<><NavigationEditor role={role} notice={setNotice} docs={list} go={navigate}/><div className="vault-title av-subtitle"><div><h2>Extra links</h2><p>Optional links added after the built-in header and footer links, for example a seasonal promotion.</p></div></div><OperationsPanel only="menus" role={role} notice={setNotice} docs={list}/></>}
 {view==='site-forms'&&<FormsEditor role={role} notice={setNotice}/>}
 {view==='settings'&&<SettingsForm role={role} notice={setNotice}/>}
 {view==='media'&&data&&<><form className="vault-card" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;setBusy(true);try{const r=await adminFetch('media',{method:'POST',body:new FormData(form)});const result:any=await r.json();if(!r.ok)throw new Error(result.error);setNotice('Uploaded: '+result.url);form.reset();load()}catch(e){setNotice((e as Error).message)}finally{form.reset();setBusy(false)}}}><h2>Upload media</h2><p>Images, PDFs and office files are stored in the media library. Add an accessible description so editors know what every file contains.</p><label>File · up to 12 MB<Input type="file" name="file" accept="image/png,image/jpeg,image/webp,application/pdf,text/plain,text/csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx" required/></label><label>Accessible description<Input name="alt" required/></label><Button disabled={busy}><Upload/>Upload file</Button></form>{(()=>{const all=[...data.uploaded.map((m:any)=>({...m,src:'/media/'+m.key,alt:m.alt})),...data.existing];const count=(f:string)=>all.filter((m:any)=>f==='all'||(f==='used'?m.uses>0:f==='unused'?!m.uses:m.missingAlt)).length;return <div className="vault-tabs" role="tablist" aria-label="Filter media">{[['all','All'],['used','In use'],['unused','Unused'],['missing','Missing description']].map(([k,l])=><Button key={k} variant={mediaFilter===k?'default':'outline'} onClick={()=>setMediaFilter(k)}>{l} ({count(k)})</Button>)}</div>})()}<div className="vault-media">{[...data.uploaded.map((m:any)=>({...m,src:'/media/'+m.key,alt:m.alt})),...data.existing].filter((m:any)=>mediaFilter==='all'||(mediaFilter==='used'?m.uses>0:mediaFilter==='unused'?!m.uses:m.missingAlt)).map((m:any)=><MediaCard key={m.src} media={m} uploads={data.uploaded} role={role} notice={setNotice} reload={load}/>)}</div></>}
 {view==='leads'&&<LeadsInbox role={role} notice={setNotice}/>}
 {view==='pages'&&list.length>0&&<FamilyBuilder docs={list} notice={setNotice}/>}
 {view==='redirects'&&<RedirectsPanel docs={list} notice={setNotice}/>}
 {view==='users'&&<UsersPanel email={email} role={role} notice={setNotice}/>}
 {view==='activity'&&<ActivityLog notice={setNotice}/>}
 {view==='backups'&&<BackupsPanel role={role} notice={setNotice}/>}
 {view==='traffic'&&<TrafficPanel role={role} notice={setNotice}/>}
 {view==='scripts'&&<ScriptsPanel role={role} notice={setNotice}/>}
 {view==='privacy'&&<PrivacyPanel role={role} notice={setNotice} go={navigate}/>}
 {view==='media'&&data&&<div className="actions"><Button variant="outline" disabled={!page} onClick={()=>setPage(page-1)}>Previous page</Button><span>Page {page+1}</span><Button variant="outline" disabled={data.uploaded.length<100} onClick={()=>setPage(page+1)}>Next page</Button></div>}</>}</main></div></div>
}
```

### app/globals.css

<!-- avault-file path="app/globals.css" mode="shared" sha256="438930be93e71f545e40ef35863bcce3c202f8f8d3bb05b08f41e9cefcd1661d" eol="1" -->
```css
@import "tailwindcss";
@import "tw-animate-css";
@import "../vendor/shadcn-tailwind-4.13.0.css";

@utility scrollbar-thin {
  scrollbar-width: thin;
}

@utility scrollbar-none {
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

@utility scrollbar-gutter-stable {
  scrollbar-gutter: stable;
}

:root {
  --background: #ffffff;
  --foreground: #171717;
  --card: #ffffff;
  --card-foreground: #171717;
  --popover: #ffffff;
  --popover-foreground: #171717;
  --primary: #171717;
  --primary-foreground: #fafafa;
  --secondary: #f5f5f5;
  --secondary-foreground: #171717;
  --muted: #f5f5f5;
  --muted-foreground: #737373;
  --accent: #f5f5f5;
  --accent-foreground: #171717;
  --destructive: #e7000b;
  --border: #e5e5e5;
  --input: #e5e5e5;
  --ring: #a1a1a1;
  --chart-1: #f54900;
  --chart-2: #009689;
  --chart-3: #104e64;
  --chart-4: #ffb900;
  --chart-5: #fe9a00;
  --radius: 0.625rem;
  --sidebar: #fafafa;
  --sidebar-foreground: #171717;
  --sidebar-primary: #171717;
  --sidebar-primary-foreground: #fafafa;
  --sidebar-accent: #f5f5f5;
  --sidebar-accent-foreground: #171717;
  --sidebar-border: #e5e5e5;
  --sidebar-ring: #a1a1a1;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --font-sans: "Google Sans", Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
    --card: #171717;
    --card-foreground: #ededed;
    --popover: #171717;
    --popover-foreground: #ededed;
    --primary: #ededed;
    --primary-foreground: #171717;
    --secondary: #262626;
    --secondary-foreground: #ededed;
    --muted: #262626;
    --muted-foreground: #a1a1a1;
    --accent: #262626;
    --accent-foreground: #ededed;
    --destructive: #ff6467;
    --border: #ffffff1a;
    --input: #ffffff26;
    --ring: #737373;
    --chart-1: #8e51ff;
    --chart-2: #00bc7d;
    --chart-3: #fe9a00;
    --chart-4: #ad46ff;
    --chart-5: #ff2056;
    --sidebar: #171717;
    --sidebar-foreground: #ededed;
    --sidebar-primary: #8e51ff;
    --sidebar-primary-foreground: #ededed;
    --sidebar-accent: #262626;
    --sidebar-accent-foreground: #ededed;
    --sidebar-border: #ffffff1a;
    --sidebar-ring: #737373;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}
.vault{font-family:var(--font-sans);background:#f6f8fc;min-height:100vh;color:#202124;font-size:16px;display:flex}.vault-sidebar{width:248px;background:white;padding:30px 22px;position:fixed;inset:0 auto 0 0;display:flex;flex-direction:column;border-right:1px solid #e4e8ee}.vault-brand{display:grid;grid-template-columns:40px 1fr;font-size:26px;letter-spacing:-1px;font-weight:750;align-items:center;column-gap:10px}.vault-brand img{width:36px;grid-row:span 2}.vault-brand span{font-size:10px;letter-spacing:2px;color:#667085}.vault-navlabel{font-size:11px;letter-spacing:1.5px;color:#89919e;margin:42px 12px 12px}.vault-sidebar nav{display:grid;gap:5px}.vault-sidebar nav button{padding:12px;display:flex;gap:12px;border-radius:9px;text-align:left;font-size:14px;font-weight:500}.vault-sidebar nav button.selected{background:#e8f0fe;color:#1967d2}.vault-account{margin-top:auto;display:flex;gap:8px;font-size:11px;padding:22px 0 10px;overflow-wrap:anywhere}.vault-account small{display:block;color:#64748b}.vault-sidebar>a:last-child{font-size:12px;color:#64748b}.vault-body{margin-left:248px;flex:1;min-width:0}.vault-top{height:76px;background:white;padding:0 44px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e4e8ee;font-size:14px}.vault-top a{display:flex;align-items:center;gap:6px}.vault-main{padding:44px}.vault-title{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:30px}.vault h1{font-size:34px;font-weight:650;letter-spacing:-1.1px;margin:8px 0}.vault h2{font-size:20px;font-weight:600;margin-bottom:12px}.vault p{line-height:1.65;color:#657084;font-size:15px;margin-bottom:15px}.vault .eyebrow{font-size:11px;letter-spacing:1.8px;color:#1a73e8;font-weight:700}.vault .muted{color:#758094}.vault .actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.vault button{cursor:pointer}.vault-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin:24px 0}.vault-stats strong{font-size:42px;letter-spacing:-2px;color:#1a73e8}.vault-card{background:white;border:1px solid #e4e8ee;border-radius:16px;padding:26px;margin-bottom:24px}.vault-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}.vault-notice{border:1px solid #c6d8fa;background:#edf4ff;padding:18px;border-radius:10px;display:flex;justify-content:space-between;white-space:pre-line;margin-bottom:24px}.vault-search{margin-bottom:22px;background:white}.vault-list{padding:0;overflow:hidden}.vault-row{display:flex;align-items:center;gap:20px;width:100%;padding:20px 8px;border-bottom:1px solid #eef0f4;text-align:left;justify-content:space-between}.vault-list .vault-row{padding:22px 26px}.vault-row:last-child{border:0}.vault-row small{display:block;color:#758094;font-size:12px;margin-top:6px}.vault-editor{display:grid;grid-template-columns:230px 1fr;gap:24px;margin-top:24px}.vault-sectionlist{max-height:75vh;overflow:auto;position:sticky;top:12px;display:flex;flex-direction:column;gap:4px;align-self:start}.vault-sectionlist button{font-size:13px;text-align:left;padding:10px;border-radius:6px}.vault-sectionlist .selected{background:#e8f0fe;color:#1967d2}.vault-fields{background:white;padding:30px;border-radius:16px;display:grid;gap:24px}.vault label{display:grid;gap:8px;font-size:14px;margin-bottom:18px}.vault label small{color:#89919e;font-size:11px;margin-left:8px}.vault label>span{font-weight:500}.vault input,.vault textarea{background:white;font-size:15px}.vault textarea{min-height:100px}.vault-settings{margin-top:24px}.vault .inline{display:flex;align-items:center;gap:10px}.search-preview{padding:24px;background:#f7f9fc;margin:24px 0;border-radius:12px}.search-preview h3{color:#1a0dab;font-size:20px;margin:8px 0}.search-preview small{color:#50775f}.vault-preview iframe{width:100%;height:760px;background:white;border:1px solid #dde3ec;border-radius:16px;margin-top:20px}.vault-media{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.vault-media img{width:100%;height:180px;object-fit:contain}.vault pre{max-height:450px;overflow:auto;font-size:12px;white-space:pre-wrap;background:#f6f8fc;padding:20px}.vault .error{color:#c5221f}.vault a:hover{color:#1a73e8}@media(max-width:1000px){.vault-sidebar{width:200px;padding:24px 14px}.vault-body{margin-left:200px}.vault-main{padding:24px}.vault-title{align-items:start;flex-direction:column}.vault-editor{grid-template-columns:180px 1fr}.vault-media{grid-template-columns:1fr 1fr}}@media(max-width:700px){.vault{display:block}.vault-sidebar{position:static;width:100%;padding:18px}.vault-sidebar nav{display:flex;overflow:auto;margin-top:18px}.vault-sidebar nav button{white-space:nowrap}.vault-navlabel,.vault-account,.vault-sidebar>a:last-child{display:none}.vault-body{margin-left:0}.vault-top{padding:0 20px;height:60px}.vault-main{padding:24px 16px}.vault h1{font-size:28px}.vault-stats{gap:10px}.vault-stats .vault-card{padding:16px}.vault-stats strong{font-size:30px}.vault-grid{grid-template-columns:1fr}.vault-editor{grid-template-columns:1fr}.vault-sectionlist{position:static;max-height:190px}.vault-fields{padding:20px}.vault-media{grid-template-columns:1fr}.vault-row{flex-wrap:wrap}}
.vault{--primary:#1a73e8;--primary-foreground:#fff;--ring:#4285f4;--radius:0.6rem;--muted:#f1f4f9;--accent:#e8f0fe;--accent-foreground:#1967d2}.vault select{border:1px solid #d8dee9;border-radius:8px;padding:10px;background:white;width:100%}
.vault-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}.vault-block{padding:24px;border:1px solid #dce3ed;border-radius:16px;margin-top:20px;background:#fafbfd}.vault-block label{display:block;margin:12px 0;font-size:14px}.vault-block select,.vault-settings select{padding:10px;border:1px solid #d5dce6;border-radius:8px;max-width:100%;background:white}.vault-main .vault-card{margin-bottom:24px}.vault-main label{font-size:14px}.vault-main .vault-row{gap:16px;overflow-wrap:anywhere}.vault-main pre{white-space:pre-wrap;overflow-wrap:anywhere}.vault-main button:disabled{opacity:.5}.vault-main dl dd{margin:0}.vault-sidebar{overflow-y:auto}.vault-main [role=tablist]{flex-wrap:wrap;height:auto}@media(max-width:700px){.vault-block{padding:16px}.vault-main .vault-row{flex-wrap:wrap}.vault-main .actions{flex-wrap:wrap}}
```

### components/ui/alert-dialog.tsx

<!-- avault-file path="components/ui/alert-dialog.tsx" mode="shared" sha256="9a8d950f2b9b4352d5ebb762fb44d5c28c2d353aa29712071973656a8736e311" eol="1" -->
```tsx
"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> & {
  size?: "default" | "sm"
}) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        data-size={size}
        className={cn(
          "group/alert-dialog-content fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[size=sm]:max-w-xs data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[size=default]:sm:max-w-lg",
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        "grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-6 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        "text-lg font-semibold sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function AlertDialogMedia({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        "mb-2 inline-flex size-16 items-center justify-center rounded-md bg-muted sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*='size-'])]:size-8",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <Button variant={variant} size={size} asChild>
      <AlertDialogPrimitive.Action
        data-slot="alert-dialog-action"
        className={cn(className)}
        {...props}
      />
    </Button>
  )
}

function AlertDialogCancel({
  className,
  variant = "outline",
  size = "default",
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel> &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <Button variant={variant} size={size} asChild>
      <AlertDialogPrimitive.Cancel
        data-slot="alert-dialog-cancel"
        className={cn(className)}
        {...props}
      />
    </Button>
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
```

### components/ui/badge.tsx

<!-- avault-file path="components/ui/badge.tsx" mode="shared" sha256="46a0de5224f6a5d5d63d45246534288518dce888f031064bff925bbc7fe6ad97" eol="1" -->
```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
```

### components/ui/button.tsx

<!-- avault-file path="components/ui/button.tsx" mode="shared" sha256="cc36af0f8b5019c33cc039fbf03bb952a513072b15b55b53c592b78af3e5f4c4" eol="1" -->
```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

### components/ui/dialog.tsx

<!-- avault-file path="components/ui/dialog.tsx" mode="shared" sha256="dce39c6adc47d997bd2567f8b7a72f466b0134715105cd42f9194007b8ecdb14" eol="1" -->
```tsx
"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
```

### components/ui/input.tsx

<!-- avault-file path="components/ui/input.tsx" mode="shared" sha256="8c4612a7c41319ac5049daa3b34b080f9784b6245c17780eb87c127e58e473db" eol="1" -->
```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
```

### components/ui/tabs.tsx

<!-- avault-file path="components/ui/tabs.tsx" mode="shared" sha256="865d0194331b9b2be36723fa79d3575dc83078b4cb941cafee87cb72fc2cff46" eol="1" -->
```tsx
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-[orientation=horizontal]/tabs:h-9 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent",
        "data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
```

### components/ui/textarea.tsx

<!-- avault-file path="components/ui/textarea.tsx" mode="shared" sha256="253cdeb487c73beaaccdf47fc163e36e7d5b7ae6ddf09a4f64998a109a112979" eol="1" -->
```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
```

### db/mongo.ts

<!-- avault-file path="db/mongo.ts" mode="owned" sha256="4b26d9aa51f1edc1aebdb16704cfe8ba4fb72c4b919174a4f5d5b2492f2929d5" eol="1" -->
```ts
import {GridFSBucket, MongoClient, type ClientSession, type Db, type Document, type Filter} from 'mongodb';

type QueryResult<T=Record<string, unknown>>={results:T[];success:true;meta:{changes:number}};
type RunResult={success:true;meta:{changes:number}};

const globalMongo=globalThis as typeof globalThis & {
  __allureMongo?:Promise<{client:MongoClient;db:Db;files:GridFSBucket}>;
  // false once the server has said it can't run transactions (a standalone mongod), so batches stop trying.
  __allureMongoTransactions?:boolean;
};

function connection(){
  if(!globalMongo.__allureMongo){
    const uri=process.env.MONGODB_URI;
    if(!uri)throw new Error('MONGODB_URI is required. Add it to .env.local or the PM2 environment.');
    globalMongo.__allureMongo=(async()=>{
      const client=await new MongoClient(uri).connect();
      const db=client.db(process.env.MONGODB_DB||undefined);
      await Promise.all([
        db.collection('documents').createIndex({route:1},{unique:true}),
        db.collection('settings').createIndex({id:1},{unique:true}),
        db.collection('redirects').createIndex({source:1},{unique:true}),
        db.collection('media').createIndex({key:1},{unique:true}),
        db.collection('users').createIndex({email:1},{unique:true}),
        db.collection('rate_limits').createIndex({id:1},{unique:true}),
        db.collection('schedules').createIndex({route:1},{unique:true}),
        db.collection('taxonomy').createIndex({id:1},{unique:true}),
      ]);
      return {client,db,files:new GridFSBucket(db,{bucketName:'avault_files'})};
    })();
  }
  return globalMongo.__allureMongo;
}

function clean<T extends Document>(row:T|null):T|null{
  if(!row)return null;
  const {_id,...value}=row;
  void _id;
  return value as T;
}

function normalize(sql:string){return sql.replace(/\s+/g,' ').trim()}

function splitCsv(value:string){
  const out:string[]=[];let current='',depth=0,quote='';
  for(const char of value){
    if(quote){current+=char;if(char===quote)quote='';continue}
    if(char==="'"||char==='"'){quote=char;current+=char;continue}
    if(char==='(')depth++;else if(char===')')depth--;
    if(char===','&&depth===0){out.push(current.trim());current='';}else current+=char;
  }
  if(current.trim())out.push(current.trim());return out;
}

function literal(token:string,args:unknown[],cursor:{value:number}){
  token=token.trim();
  if(token==='?')return args[cursor.value++];
  if(/^null$/i.test(token))return null;
  if(/^\d+$/.test(token))return Number(token);
  const quoted=token.match(/^'([\s\S]*)'$/);if(quoted)return quoted[1].replace(/''/g,"'");
  return token;
}

function whereFilter(where:string|undefined,args:unknown[],cursor:{value:number}):Filter<Document>{
  if(!where)return {};
  const filter:Record<string,unknown>={};
  for(const raw of where.split(/\s+AND\s+/i)){
    const part=raw.trim().replace(/^\(|\)$/g,'');
    let match=part.match(/^(\w+)\s*=\s*(\?|\d+|'[^']*')$/i);
    if(match){filter[match[1]]=literal(match[2],args,cursor);continue}
    match=part.match(/^(\w+)\s*(<=|<|>=|>)\s*(\?)$/i);
    if(match){const op:{[key:string]:string}={'<':'$lt','<=':'$lte','>':'$gt','>=':'$gte'};filter[match[1]]={[op[match[2]]]:literal(match[3],args,cursor)};continue}
    match=part.match(/^(\w+)\s+NOT IN\s*\(([^)]+)\)$/i);
    if(match){filter[match[1]]={$nin:splitCsv(match[2]).map(v=>literal(v,args,cursor))};continue}
    throw new Error('Unsupported Mongo query condition: '+part);
  }
  return filter;
}

// The collections whose plain INSERTs must not collide with an existing row, and the field that identifies a row.
const NATURAL_KEYS:Record<string,string>={documents:'route',redirects:'source',users:'email',schedules:'route',settings:'id',rate_limits:'id',taxonomy:'id'};

function parseInsert(sql:string,args:unknown[],cursor:{value:number}){
  const insert=sql.match(/^INSERT( OR IGNORE)? INTO (\w+)\s*\(([^)]+)\) VALUES\s*\((.*?)\)(.*)$/i);
  if(!insert)return null;
  const [,ignore,table,fieldList,valueList,tail]=insert;const fields=splitCsv(fieldList);const tokens=splitCsv(valueList);const doc:Record<string,unknown>={};
  fields.forEach((field,index)=>doc[field.trim()]=literal(tokens[index],args,cursor));
  return {ignore:!!ignore,table,doc,tail,naturalKey:NATURAL_KEYS[table]||null};
}

export class MongoPreparedStatement{
  private args:unknown[]=[];
  constructor(private sql:string){}
  bind(...args:unknown[]){this.args=args;return this}
  async first<T=Record<string,unknown>>():Promise<T|null>{
    const result=await this.execute('first',0);
    return (result.rows[0]||null) as T|null;
  }
  async all<T=Record<string,unknown>>():Promise<QueryResult<T>>{
    const result=await this.execute('all',0);
    return {results:result.rows as T[],success:true,meta:{changes:result.changes}};
  }
  async run():Promise<RunResult>{const result=await this.execute('run',0);return {success:true,meta:{changes:result.changes}}}

  // Runs before any statement of a batch is applied: a stale revision or a taken key fails the whole batch up front.
  async precheck(){
    const {db}=await connection();const sql=normalize(this.sql);
    if(/^INSERT INTO write_guards/i.test(sql))return this.guard(db);
    if(!/^INSERT INTO/i.test(sql)||/ON CONFLICT/i.test(sql))return;
    const insert=parseInsert(sql,this.args,{value:0});
    if(insert?.naturalKey&&await db.collection(insert.table).findOne({[insert.naturalKey]:insert.doc[insert.naturalKey]},{projection:{_id:1}}))throw new Error(`UNIQUE constraint failed: ${insert.table}.${insert.naturalKey}`);
  }

  private async guard(db:Db,session?:ClientSession){
    const [,target,expected]=this.args;const table=normalize(this.sql).includes('FROM documents')?'documents':'settings';const key=table==='documents'?'route':'id';
    const row=await db.collection(table).findOne({[key]:target},session?{session}:{});
    if(Number(row?.revision||0)!==Number(expected))throw new Error('valid_write');
  }

  async execute(mode:'first'|'all'|'run',lastChanges:number,session?:ClientSession):Promise<{rows:Record<string,unknown>[];changes:number}>{
    const {db}=await connection();const sql=normalize(this.sql);const cursor={value:0};const o=session?{session}:{};
    if(/^SELECT 1$/i.test(sql))return {rows:[{'1':1}],changes:0};

    if(/^SELECT session,MAX\(created_at\) AS last_seen FROM events/i.test(sql)){
      const after=this.args[0];
      const rows=await db.collection('events').aggregate([
        {$match:{created_at:{$gt:after}}},{$group:{_id:'$session',last_seen:{$max:'$created_at'}}},
        {$sort:{last_seen:-1}},{$limit:100},{$project:{_id:0,session:'$_id',last_seen:1}},
      ],o).toArray();return {rows,changes:0};
    }

    const count=sql.match(/^SELECT COUNT\(\*\) AS (\w+) FROM (\w+)$/i);
    if(count){const n=await db.collection(count[2]).countDocuments({},o);return {rows:[{[count[1]]:n}],changes:0}}

    const checksum=sql.match(/^SELECT key FROM media WHERE json_extract\(metadata,'\$\.checksum'\)=\?$/i);
    if(checksum){const rows=await db.collection('media').find({},o).project({_id:0,key:1,metadata:1}).toArray();const row=rows.find(r=>{try{return JSON.parse(String(r.metadata)).checksum===this.args[0]}catch{return false}});return {rows:row?[{key:row.key}]:[],changes:0}}

    const select=sql.match(/^SELECT (.+?) FROM (\w+)(?: WHERE (.*?))?(?: ORDER BY (.*?))?(?: LIMIT (\d+))?(?: OFFSET \?)?$/i);
    if(select){
      const [,fields,table,where,order,limit]=select;const filter=whereFilter(where,this.args,cursor);
      let find=db.collection(table).find(filter,o);
      if(fields!=='*'){const projection:Record<string,1>={};for(const field of splitCsv(fields))projection[field.trim()]=1;find=find.project({_id:0,...projection})}else find=find.project({_id:0});
      if(order){const sort:Record<string,1|-1>={};for(const item of splitCsv(order)){const [field,direction]=item.trim().split(/\s+/);sort[field]=direction?.toUpperCase()==='DESC'?-1:1}find=find.sort(sort)}
      if(limit)find=find.limit(Number(limit));
      if(/ OFFSET \?$/i.test(sql))find=find.skip(Number(this.args[cursor.value++]||0));
      const rows=await find.toArray();return {rows:rows as Record<string,unknown>[],changes:0};
    }

    const del=sql.match(/^DELETE FROM (\w+)(?: WHERE (.+))?$/i);
    if(del){const result=await db.collection(del[1]).deleteMany(whereFilter(del[2],this.args,cursor),o);return {rows:[],changes:result.deletedCount}}

    if(/^INSERT INTO write_guards/i.test(sql)){await this.guard(db,session);return {rows:[],changes:1}}

    if(/^UPDATE revisions SET state=CASE WHEN changes\(\)=1/i.test(sql)){
      const result=await db.collection('revisions').updateOne({id:this.args[0]},{$set:{state:lastChanges===1?'applied':'conflict'}},o);return {rows:[],changes:result.modifiedCount};
    }

    if(/^INSERT INTO activity .* WHERE EXISTS/i.test(sql)){
      const [id,actor,action,entity,createdAt,revisionId]=this.args;
      const revision=await db.collection('revisions').findOne({id:revisionId,state:'applied'},o);
      if(!revision)return {rows:[],changes:0};
      await db.collection('activity').insertOne({id,actor,action,entity,created_at:createdAt},o);return {rows:[],changes:1};
    }

    const maintenance=sql.match(/^INSERT INTO rate_limits\(id,count,expires\) VALUES \('maintenance-lock',1,\?\).*RETURNING id$/i);
    if(maintenance){const [expires,staleBefore]=this.args;const result=await db.collection('rate_limits').findOneAndUpdate({id:'maintenance-lock',$or:[{expires:{$lt:staleBefore}},{expires:{$exists:false}}]},{$set:{count:1,expires}},{upsert:true,returnDocument:'after',...o}).catch(()=>null);return {rows:result?[clean(result)!]:[],changes:result?1:0}}

    if(/^INSERT INTO rate_limits/i.test(sql)&&/count=count\+1 RETURNING count/i.test(sql)){
      const [id,expires]=this.args;const row=await db.collection('rate_limits').findOneAndUpdate({id},{$set:{expires},$inc:{count:1}},{upsert:true,returnDocument:'after',...o});return {rows:row?[clean(row)!]:[],changes:1};
    }

    const insert=parseInsert(sql,this.args,cursor);
    if(insert){
      const {ignore,table,doc,tail,naturalKey}=insert;
      const collection=db.collection(table);let changes=1;let row:Document|null=null;
      if(/ON CONFLICT/i.test(tail)&&naturalKey){
        const keyValue=doc[naturalKey];const set={...doc};delete set[naturalKey];
        row=await collection.findOneAndUpdate({[naturalKey]:keyValue},{$set:set,$setOnInsert:{[naturalKey]:keyValue}},{upsert:true,returnDocument:'after',...o});
      }else if(ignore&&naturalKey){const result=await collection.updateOne({[naturalKey]:doc[naturalKey]},{$setOnInsert:doc},{upsert:true,...o});changes=result.upsertedCount}
      else{await collection.insertOne(doc,o);row=doc}
      return {rows:/RETURNING/i.test(tail)&&row?[clean(row)!]:[],changes};
    }

    const update=sql.match(/^UPDATE (\w+) SET (.+?) WHERE (.+)$/i);
    if(update){
      const [,table,setText,where]=update;const set:Record<string,unknown>={};const inc:Record<string,number>={};const unset:Record<string,''>={};
      for(const assignment of splitCsv(setText)){
        const match=assignment.match(/^(\w+)=(.+)$/);if(!match)throw new Error('Unsupported Mongo update: '+assignment);
        const [,field,value]=match;
        if(value===field+'+1')inc[field]=1;
        else if(/^NULL$/i.test(value))set[field]=null;
        else set[field]=literal(value,this.args,cursor);
      }
      const returning=where.match(/^(.*?) RETURNING \w+$/i);const filter=whereFilter(returning?returning[1]:where,this.args,cursor);const changeset:Document={};if(Object.keys(set).length)changeset.$set=set;if(Object.keys(inc).length)changeset.$inc=inc;if(Object.keys(unset).length)changeset.$unset=unset;
      if(returning){const row=await db.collection(table).findOneAndUpdate(filter,changeset,{returnDocument:'after',...o});return {rows:row?[clean(row)!]:[],changes:row?1:0}}
      const result=await db.collection(table).updateMany(filter,changeset,o);return {rows:[],changes:result.modifiedCount};
    }

    throw new Error(`Unsupported Mongo compatibility query (${mode}): ${sql}`);
  }
}

async function runAll(statements:MongoPreparedStatement[],session?:ClientSession){
  const results:RunResult[]=[];let previous=0;
  for(const statement of statements){const result=await statement.execute('run',previous,session);previous=result.changes;results.push({success:true,meta:{changes:result.changes}})}
  return results;
}

// A standalone mongod rejects the first statement of a transaction with IllegalOperation (code 20), which the driver
// may wrap as "does not support retryable writes" with the original error attached.
const transactionsUnsupported=(e:unknown)=>{const err=e as {code?:number;message?:string;originalError?:{code?:number;message?:string}};return err?.code===20||err?.originalError?.code===20||/Transaction numbers are only allowed|does not support retryable writes/i.test(`${err?.message||''} ${err?.originalError?.message||''}`)};

const adapter={
  prepare(sql:string){return new MongoPreparedStatement(sql)},
  // A batch is all-or-nothing. Revision guards and unique keys are checked before anything is written; on a replica set
  // the statements then run in one transaction, so a failure part-way through (a lost race, a dropped connection) rolls
  // everything back. A standalone server has no transactions, so there only the up-front checks protect the batch.
  async batch(statements:MongoPreparedStatement[]){
    for(const statement of statements)await statement.precheck();
    if(globalMongo.__allureMongoTransactions!==false){
      const {client}=await connection();const session=client.startSession();
      try{let results:RunResult[]=[];await session.withTransaction(async()=>{results=await runAll(statements,session)});globalMongo.__allureMongoTransactions=true;return results}
      catch(e){if(!transactionsUnsupported(e))throw e;globalMongo.__allureMongoTransactions=false}
      finally{await session.endSession()}
    }
    return runAll(statements);
  },
};

export const database=()=>adapter;
export async function mongoDb(){return (await connection()).db}

export const objectStore=()=>({
  async get(key:string){
    const {files}=await connection();const record=await files.find({filename:key}).sort({uploadDate:-1}).limit(1).next();if(!record)return null;
    const chunks:Buffer[]=[];for await(const chunk of files.openDownloadStream(record._id))chunks.push(Buffer.from(chunk));const body=Buffer.concat(chunks);
    return {body,httpMetadata:{contentType:String(record.metadata?.contentType||'application/octet-stream')},text:async()=>body.toString('utf8')};
  },
  async put(key:string,value:Uint8Array|string|Buffer,options?:{httpMetadata?:{contentType?:string}}){
    const {files}=await connection();const existing=await files.find({filename:key}).toArray();for(const file of existing)await files.delete(file._id);
    const stream=files.openUploadStream(key,{metadata:{contentType:options?.httpMetadata?.contentType}});stream.end(Buffer.from(value));await new Promise<void>((resolve,reject)=>stream.once('finish',()=>resolve()).once('error',reject));
  },
  async delete(key:string){
    const {files}=await connection();const existing=await files.find({filename:key}).toArray();for(const file of existing)await files.delete(file._id);return existing.length;
  },
});
```

### instrumentation.ts

<!-- avault-file path="instrumentation.ts" mode="owned" sha256="5611410355fa63ebf1a35c0499856ebda9375281a95ea91c523ece6905c07309" eol="1" -->
```ts
// Runs once when the Next.js server starts. In production it starts AVAULT's built-in scheduler, so
// scheduled posts, failed-email retries, visit-record cleanup and daily backups run without a server cron job.
export async function register(){
 if(process.env.NEXT_RUNTIME!=='nodejs')return;
 if(process.env.NODE_ENV!=='production'&&process.env.AVAULT_SCHEDULER!=='on')return;
 if(process.env.AVAULT_SCHEDULER==='off')return;
 const {startScheduler}=await import('./lib/avault/scheduler');
 startScheduler();
}
```

### lib/avault/admin-bar.ts

<!-- avault-file path="lib/avault/admin-bar.ts" mode="owned" sha256="9ec85fba326219ace04b0e738308fc0eb46088e9500c7df6e360fea59dda1682" eol="1" -->
```ts
import {esc,Doc} from './store';

// WordPress-style toolbar shown on public pages to signed-in AVAULT users only. The response is already
// no-store, so a page rendered with the bar is never cached for visitors.
export function adminBar(user:{email:string;role:string},doc:Doc,newLeads:number){
 const view=doc.kind==='post'?'blogs':'pages';const edit=`/avault/?view=${view}&route=${encodeURIComponent(doc.route)}`;
 const item=(href:string,label:string,extra='')=>`<a href="${esc(href)}"${extra}>${label}</a>`;
 return `<div id="avault-bar" role="navigation" aria-label="AVAULT toolbar"><style>
html{margin-top:40px!important}.header-wrap{top:40px!important}
#avault-bar{position:fixed;inset:0 0 auto 0;height:40px;z-index:2147483000;display:flex;align-items:center;gap:4px;padding:0 12px;background:#062744;color:#fff;font:700 12px/1 Arial,sans-serif;letter-spacing:.01em;box-shadow:inset 0 -2px #cc293c}
#avault-bar a,#avault-bar button{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 12px;border-radius:2px;color:#fff;text-decoration:none;background:none;border:1px solid transparent;font:inherit;cursor:pointer;white-space:nowrap}
#avault-bar a:hover,#avault-bar button:hover{background:#fff;color:#062744}
#avault-bar .avb-brand{font-family:Georgia,serif;font-weight:700;font-size:15px;letter-spacing:.04em}
#avault-bar .avb-brand::before{content:"A";display:grid;place-items:center;width:20px;height:20px;background:#cc293c;color:#fff;font:700 12px/1 Georgia,serif}
#avault-bar .avb-edit{background:#cc293c;color:#fff}#avault-bar .avb-edit:hover{background:#fff;color:#062744}
#avault-bar .avb-count{min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#fff;color:#062744;font-size:11px;display:inline-grid;place-items:center}
#avault-bar .avb-status{padding:0 10px;color:#c7d3dc;font-weight:500}
#avault-bar .avb-right{margin-left:auto;display:flex;align-items:center;gap:4px}
#avault-bar form{margin:0}
@media(max-width:760px){#avault-bar .avb-hide{display:none}}
</style>
${item('/avault/','AVAULT',' class="avb-brand"')}
${item(edit,doc.kind==='post'?'Edit post':'Edit page',' class="avb-edit"')}
${item('/avault/?view=leads',`Leads${newLeads?` <span class="avb-count">${newLeads}</span>`:''}`,' class="avb-hide"')}
${item('/avault/?view=seo','SEO review',' class="avb-hide"')}
${doc.seo.noindex?'<span class="avb-status avb-hide">Hidden from search</span>':''}
<span class="avb-right"><span class="avb-status avb-hide">${esc(user.email)}</span><form method="post" action="/api/admin/logout/"><button type="submit">Sign out</button></form></span></div>`;
}
```

### lib/avault/admin-extra.ts

<!-- avault-file path="lib/avault/admin-extra.ts" mode="owned" sha256="68a659b285a6f008c300da0c9a29db83aa2a7638ba08d1934e3ab6211136fcd5" eol="1" -->
```ts
import {mongoDb} from '@/db/mongo';
import {CONFIG,SYSTEM_ROUTES} from './config';
import {HttpError,json,headers,allDocs,audit,now,Doc,safeUrl} from './store';
import {settingsRead,settingsSave} from './runtime';
import {recordActivity,mutateMany} from './operations';
import {buildEmailConfig,publicEmailConfig,sendEmail} from './email';
import {validateProfile,profile} from './site';
import {bodyImages} from './rich';
import {countryOfIp,countryLabel,backfillCountries} from './geo';
// Visitors & Calls: ?range=days (0 = all time) and ?country=XX narrow every list and summary.
const since=(u:URL)=>{const d=Number(u.searchParams.get('range')||0);return d>0?{created_at:{$gte:new Date(Date.now()-d*86400000).toISOString()}}:{}};
const inCountry=(u:URL)=>{const c=String(u.searchParams.get('country')||'').toUpperCase();return /^[A-Z]{2}$/.test(c)?{country:c}:{}};
const countryFor=(r:any)=>countryLabel(r.country)||countryOfIp(String(r.ip||''));
// First regex capture from an event's JSON value (MongoDB 4.2+).
const grab=(regex:string)=>({$let:{vars:{m:{$regexFind:{input:'$value',regex}}},in:{$arrayElemAt:[{$ifNull:['$$m.captures',[null]]},0]}}});
const capture=(field:string)=>grab(`"${field}":"([^"]*)"`);

type User={email:string;role:string};
const owner=(u:User)=>{if(u.role!=='owner')throw new HttpError(403,'Owner access required.')};
const pageOf=(u:URL,size=50)=>Math.max(0,Math.min(10000,Number(u.searchParams.get('page'))||0))*size;
const rx=(s:string)=>new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');
const parse=(s:unknown)=>{try{return JSON.parse(String(s||'{}'))}catch{return {}}};
async function drafts(){const rows=await (await mongoDb()).collection('documents').find({},{projection:{_id:0}}).toArray();return rows.map(r=>({route:String(r.route),draft:parse(r.draft) as Doc,published:r.published?parse(r.published) as Doc:null,revision:Number(r.revision||0),updated_at:String(r.updated_at||'')}))}

// Media usage counted in one pass over every draft and publication (page fields, social images, blocks, featured images).
function usageCounts(rows:Awaited<ReturnType<typeof drafts>>){const counts=new Map<string,Set<string>>();const add=(url:string,route:string)=>{if(!url)return;if(!counts.has(url))counts.set(url,new Set());counts.get(url)!.add(route)};for(const r of rows)for(const d of [r.draft,r.published])if(d){for(const f of d.fields||[])if(f.label==='img src')add(f.value,r.route);add(d.seo?.image,r.route);add(d.featuredImage||'',r.route);for(const b of d.blocks||[])if(b.url)add(b.url,r.route);for(const i of bodyImages(d.body))add(i.src,r.route)}return counts}
// A page image's description is the `img alt` field that directly follows its `img src` field.
function altUsages(d:Doc,url:string){const out:{key:string;value:string;section:string}[]=[];d.fields.forEach((f,i)=>{const next=d.fields[i+1];if(f.label==='img src'&&f.value===url&&next?.label==='img alt')out.push({key:next.key,value:next.value,section:f.section})});return out}

async function extendedAudit(){const registry=await allDocs();const docs=Object.values(registry);const incoming=new Map<string,number>();
 for(const d of docs)for(const f of d.fields.filter(f=>f.label==='a href'))try{const p=new URL(f.value,CONFIG.origin+d.route);if(p.origin===CONFIG.origin&&p.pathname!==d.route)incoming.set(p.pathname,(incoming.get(p.pathname)||0)+1)}catch{}
 const titles=new Map<string,string[]>(),descriptions=new Map<string,string[]>();for(const d of docs){const t=d.seo.title.trim().toLowerCase(),s=d.seo.description.trim().toLowerCase();if(t)titles.set(t,[...(titles.get(t)||[]),d.route]);if(s)descriptions.set(s,[...(descriptions.get(s)||[]),d.route])}
 return docs.map(d=>{const h1=(d.template.match(/<h1\b/gi)||[]).length+(String(d.body||'').match(/<h1\b/gi)||[]).length;const t=d.seo.title.trim(),s=d.seo.description.trim();const warnings=[
  ...(t.length>65?['Search title is longer than 65 characters']:[]),...(t&&t.length<20?['Search title is shorter than 20 characters']:[]),
  ...(s.length>170?['Description is longer than 170 characters']:[]),...(s&&s.length<70?['Description is shorter than 70 characters']:[]),
  ...((titles.get(t.toLowerCase())||[]).length>1?['Duplicate search title: also on '+titles.get(t.toLowerCase())!.filter(r=>r!==d.route).join(', ')]:[]),
  ...((descriptions.get(s.toLowerCase())||[]).length>1?['Duplicate description: also on '+descriptions.get(s.toLowerCase())!.filter(r=>r!==d.route).join(', ')]:[]),
  ...(h1>1?[`${h1} H1 headings; use exactly one`]:[]),...(!d.seo.image&&!d.featuredImage?['No social sharing image']:[]),...(d.seo.image&&!d.seo.imageAlt?['Social image has no description']:[]),
  ...(d.fields.some(f=>f.label==='img alt'&&!f.value)?['Review empty image descriptions; keep empty only for decorative images']:[]),...(bodyImages(d.body).some(i=>!i.alt)?['An image in the article has no description']:[]),
  ...([...d.fields.map(f=>f.value),d.body||''].some(v=>/lorem ipsum|\bTODO\b|placeholder text|\[insert/i.test(v))?['Contains placeholder text']:[]),
  ...(d.seo.noindex&&incoming.get(d.route)?['Hidden from search but linked from other pages']:[]),
  ...(!incoming.has(d.route)&&d.route!=='/'&&!d.seo.noindex?['No incoming internal link (orphan page)']:[])];
  const errors=[...audit(d,registry),...(h1===0&&d.template&&!/<h1\b/.test(d.template)?['No H1 heading']:[])];
  return {route:d.route,label:d.label,kind:d.kind,errors,warnings,incoming:incoming.get(d.route)||0}})}

export async function extraGet(action:string,u:URL,user:User):Promise<Response|null>{const db=await mongoDb();
 if(action==='settings'){const r=await settingsRead('global');return json({...profile(r.value),revision:r.revision})}
 if(action==='documents'){const [rows,schedules]=await Promise.all([drafts(),db.collection('schedules').find({state:'pending'}).toArray()]);const due=new Map(schedules.map(s=>[String(s.route),String(s.due)]));return json(rows.map(r=>({route:r.route,label:r.draft.label,kind:r.draft.kind,revision:r.revision,status:due.has(r.route)?'scheduled':r.published?'published':'draft',scheduledFor:due.get(r.route)||null,unpublishedChanges:!!r.published&&JSON.stringify({...r.draft,revision:0,updatedAt:''})!==JSON.stringify({...r.published,revision:0,updatedAt:''}),updatedAt:r.updated_at,noindex:!!r.draft.seo?.noindex,category:r.draft.category||'',tags:Array.isArray(r.draft.tags)?r.draft.tags:[],author:r.draft.author||''})))}
 if(action==='audit')return json(await extendedAudit());
 if(action==='overview'){const day=new Date(Date.now()-86400000).toISOString(),week=new Date(Date.now()-7*86400000).toISOString(),live=new Date(Date.now()-90000).toISOString();const [rows,newLeads,failed,callsDay,callsWeek,visitsDay,liveNow,activity,lastBackup,maintenance,email,auditRows]=await Promise.all([drafts(),db.collection('forms').countDocuments({status:'new'}),db.collection('forms').countDocuments({delivery:'failed'}),db.collection('events').countDocuments({type:'call',created_at:{$gt:day}}),db.collection('events').countDocuments({type:'call',created_at:{$gt:week}}),db.collection('events').distinct('session',{type:'page',created_at:{$gt:day}}),db.collection('events').distinct('session',{created_at:{$gt:live}}),db.collection('activity').find({},{projection:{_id:0}}).sort({created_at:-1}).limit(8).toArray(),db.collection('backups').find().sort({created_at:-1}).limit(1).next(),settingsRead('last-maintenance'),settingsRead('email'),extendedAudit()]);
  const warnings=[...(!publicEmailConfig(email.value).enabled?['Email delivery is in save-only mode: new leads are stored but nobody is emailed.']:[]),...(!maintenance.value.at?['Scheduled jobs have not run yet. They start on their own about a minute after the site restarts; redeploy if this stays.']:Date.now()-Date.parse(maintenance.value.at)>2*3600000?['Scheduled jobs have not run for over 2 hours.']:[]),...(!lastBackup?['No backup has been created yet.']:[]),...(failed?[`${failed} lead notification(s) failed to send.`]:[])];
  return json({pages:rows.filter(r=>r.draft.kind!=='post').length,posts:rows.filter(r=>r.draft.kind==='post').length,services:rows.filter(r=>r.draft.kind==='service').length,drafts:rows.filter(r=>!r.published).length,newLeads,failedDeliveries:failed,callsToday:callsDay,callsWeek,visitorsToday:visitsDay.length,liveNow:liveNow.length,auditErrors:auditRows.filter(a=>a.errors.length).length,auditWarnings:auditRows.filter(a=>a.warnings.length).length,recentActivity:activity,lastBackup:lastBackup?.created_at||null,lastMaintenance:maintenance.value.at||null,emailMode:publicEmailConfig(email.value).enabled?publicEmailConfig(email.value).provider:'save-only',warnings})}
 if(action==='forms'){const q=String(u.searchParams.get('q')||'').trim().toLowerCase(),status=u.searchParams.get('status')||'',delivery=u.searchParams.get('delivery')||'';const filter:any={};if(['new','read','archived','spam'].includes(status))filter.status=status;else filter.status={$nin:['archived','spam']};if(status==='all')delete filter.status;if(['pending','sent','failed','not-configured','sending','blocked'].includes(delivery))filter.delivery=delivery;if(q)filter.$or=[{search:{$regex:rx(q)}},{value:{$regex:rx(q)}},{ip:q}];
  const [rows,total]=await Promise.all([db.collection('forms').find(filter,{projection:{_id:0,search:0}}).sort({created_at:-1}).skip(pageOf(u)).limit(50).toArray(),db.collection('forms').countDocuments(filter)]);
  // Per-status totals for the inbox tabs (not affected by the search box or delivery filter).
  const counts=Object.fromEntries((await db.collection('forms').aggregate([{$group:{_id:'$status',n:{$sum:1}}}]).toArray()).map(x=>[String(x._id),x.n]));return json({rows:rows.map(r=>({...r,country:countryFor(r)})),total,counts})}
 if(action==='forms-export'){const rows=await db.collection('forms').find({},{projection:{_id:0,search:0}}).sort({created_at:-1}).limit(5000).toArray();const cols=['created_at','status','delivery','name','phone','email','zip','service','details','request','path','referrer','utm_source','utm_medium','utm_campaign','utm_term','utm_content','extra','ip','user_agent'];const cell=(v:unknown)=>{const s=String(v??'');return /[",\n]/.test(s)||/^[=+\-@]/.test(s)?'"'+(/^[=+\-@]/.test(s)?"'":'')+s.replace(/"/g,'""')+'"':s};const csv=[cols.join(','),...rows.map(r=>{const p=parse(r.value);const v={...r,...p,extra:p?.extra?Object.entries(p.extra).map(([k,x])=>k+': '+x).join(' | '):''};return cols.map(c=>cell((v as any)[c])).join(',')})].join('\n');await recordActivity(user.email,'export-leads',String(rows.length));return new Response(csv,{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="dmv-door-repair-leads-${now().slice(0,10)}.csv"`}})}
 if(action==='email-config'){owner(user);const r=await settingsRead('email');return json({value:publicEmailConfig(r.value),revision:r.revision})}
 if(action==='calls'){const rows=await db.collection('events').find({type:'call',...since(u),...inCountry(u)},{projection:{_id:0}}).sort({created_at:-1}).skip(pageOf(u)).limit(50).toArray();return json(rows.map(r=>({...r,...parse(r.value),country:countryFor(r)})))}
 if(action==='calls-summary'){await backfillCountries(2000).catch(()=>0);const base={type:'call',...inCountry(u)},ago=(d:number)=>new Date(Date.now()-d*86400000).toISOString();
  const [today,week,month,total,facets]=await Promise.all([db.collection('events').countDocuments({...base,created_at:{$gte:ago(1)}}),db.collection('events').countDocuments({...base,created_at:{$gte:ago(7)}}),db.collection('events').countDocuments({...base,created_at:{$gte:ago(30)}}),db.collection('events').countDocuments(base),
   db.collection('events').aggregate([{$match:{...base,...since(u)}},{$facet:{numbers:[{$group:{_id:capture('target'),n:{$sum:1}}},{$sort:{n:-1}},{$limit:6}],pages:[{$group:{_id:capture('page'),n:{$sum:1}}},{$sort:{n:-1}},{$limit:6}],countries:[{$group:{_id:'$country',n:{$sum:1}}},{$sort:{n:-1}},{$limit:8}]}}]).next()]);
  const list=(rows:any[])=>rows.filter(r=>r._id&&r._id!=='-').map(r=>({key:String(r._id),n:r.n}));
  return json({today,week,month,total,numbers:list(facets?.numbers||[]),pages:list(facets?.pages||[]),countries:list(facets?.countries||[])})}
 if(action==='visitors-summary'){await backfillCountries(2000).catch(()=>0);const match={type:{$ne:'heartbeat'},...since(u),...inCountry(u)};
  const f=await db.collection('events').aggregate([{$match:match},{$facet:{
   totals:[{$group:{_id:null,sessions:{$addToSet:'$session'},visitors:{$addToSet:{$ifNull:['$visitor','$session']}},views:{$sum:{$cond:[{$eq:['$type','page']},1,0]}},forms:{$sum:{$cond:[{$eq:['$type','form']},1,0]}},calls:{$sum:{$cond:[{$eq:['$type','call']},1,0]}},clicks:{$sum:{$cond:[{$eq:['$type','click']},1,0]}}}},{$project:{_id:0,visits:{$size:'$sessions'},visitors:{$size:'$visitors'},views:1,forms:1,calls:1,clicks:1}}],
   countries:[{$group:{_id:{s:'$session',c:'$country'}}},{$group:{_id:'$_id.c',n:{$sum:1}}},{$sort:{n:-1}},{$limit:8}],
   pages:[{$match:{type:'page'}},{$group:{_id:capture('page'),n:{$sum:1}}},{$sort:{n:-1}},{$limit:6}],
   sources:[{$match:{type:'page'}},{$group:{_id:{$ifNull:[grab('"referrer":"https?://(?:www\\.)?([^/"]+)'),'Direct']},n:{$sum:1}}},{$sort:{n:-1}},{$limit:6}]}}]).next();
  const list=(rows:any[])=>(rows||[]).filter(r=>r._id&&r._id!=='-').map(r=>({key:String(r._id),n:r.n}));
  return json({...(f?.totals?.[0]||{visits:0,visitors:0,views:0,forms:0,calls:0,clicks:0}),countries:list(f?.countries),pages:list(f?.pages),sources:list(f?.sources)})}
 if(action==='visitors'){const q=String(u.searchParams.get('q')||'').trim(),group=u.searchParams.get('group'),by=group==='ip'?'$ip':group==='visitor'?{$ifNull:['$visitor','$session']}:'$session';const match:any={type:{$ne:'heartbeat'},...since(u),...inCountry(u),...(q?{$or:[{ip:q},{session:q},{visitor:q}]}:{})};
  const rows=await db.collection('events').aggregate([{$match:match},{$sort:{created_at:1}},{$group:{_id:by,sessions:{$addToSet:'$session'},first:{$first:'$created_at'},last:{$last:'$created_at'},events:{$sum:1},pages:{$push:{$cond:[{$eq:['$type','page']},'$value',null]}},calls:{$sum:{$cond:[{$eq:['$type','call']},1,0]}},clicks:{$sum:{$cond:[{$eq:['$type','click']},1,0]}},forms:{$sum:{$cond:[{$eq:['$type','form']},1,0]}},visitor:{$first:'$visitor'},ip:{$first:'$ip'},browser:{$first:'$browser'},country:{$first:'$country'}}},{$sort:{last:-1}},{$skip:pageOf(u)},{$limit:50}]).toArray();
  return json(rows.map(r=>{const pages=(r.pages as unknown[]).filter(Boolean).map(v=>parse(v));return {key:r._id,visitor:r.visitor||r.sessions[0],sessions:r.sessions.length,session:r.sessions[0],first:r.first,last:r.last,events:r.events,calls:r.calls,clicks:r.clicks,forms:r.forms,views:pages.length,landing:pages[0]?.page||'',referrer:pages.find(p=>p.referrer)?.referrer||'',ip:r.ip||'',browser:r.browser||null,country:countryFor(r)}}))}
 if(action==='journey'){const session=String(u.searchParams.get('session')||''),visitor=String(u.searchParams.get('visitor')||'');const rows=await db.collection('events').find(visitor?{visitor,type:{$ne:'heartbeat'}}:{session,type:{$ne:'heartbeat'}},{projection:{_id:0}}).sort({created_at:1}).limit(500).toArray();return json(rows.map(r=>({...r,...parse(r.value)})))}
 if(action==='activity'){const filter:any={};const q=String(u.searchParams.get('q')||'').trim(),actor=u.searchParams.get('actor')||'',act=u.searchParams.get('action')||'',from=u.searchParams.get('from')||'',to=u.searchParams.get('to')||'';if(q)filter.$or=[{entity:{$regex:rx(q)}},{action:{$regex:rx(q)}},{actor:{$regex:rx(q)}}];if(actor)filter.actor=actor;if(act)filter.action=act;if(from||to)filter.created_at={...(from?{$gte:new Date(from).toISOString()}:{}),...(to?{$lte:new Date(new Date(to).getTime()+86400000).toISOString()}:{})};
  const [rows,actors,actions]=await Promise.all([db.collection('activity').find(filter,{projection:{_id:0}}).sort({created_at:-1}).skip(pageOf(u)).limit(50).toArray(),db.collection('activity').distinct('actor'),db.collection('activity').distinct('action')]);return json({rows,actors,actions})}
 if(action==='redirects'){return json(await db.collection('redirects').find({},{projection:{_id:0}}).sort({source:1}).skip(pageOf(u,200)).limit(200).toArray())}
 if(action==='media'){const rows=await drafts();const counts=usageCounts(rows);const uploaded=await db.collection('media').find({},{projection:{_id:0}}).sort({created_at:-1}).skip(pageOf(u,100)).limit(100).toArray();const existing=new Map<string,{src:string;alt:string;route:string}>();for(const r of rows){const d=r.published||r.draft;d.fields.forEach((f,i)=>{if(f.label==='img src'&&f.value&&!existing.has(f.value)){const next=d.fields[i+1];existing.set(f.value,{src:f.value,alt:next?.label==='img alt'?next.value:'',route:r.route})}})}
  const missingAlt=(url:string)=>rows.some(r=>altUsages(r.published||r.draft,url).some(a=>!a.value));return json({uploaded:uploaded.map(m=>({...m,uses:counts.get('/media/'+m.key)?.size||0,missingAlt:!m.alt})),existing:[...existing.values()].filter(e=>!e.src.startsWith('/media/')).map(e=>({...e,uses:counts.get(e.src)?.size||0,missingAlt:missingAlt(e.src)}))})}
 return null;
}

function checkRedirectPath(s:unknown,label:string){const v=String(s||'').trim();if(!/^\/[a-z0-9\-/._~%]*$/i.test(v)||v.includes('//')||v.length>300)throw new HttpError(422,label+' must be a site path starting with /.');if(/^\/(avault|api|_next|media|assets)(\/|$)/.test(v))throw new HttpError(422,label+' cannot be an AVAULT, API, or static-file path.');return v}

export async function extraPost(action:string,b:any,user:User):Promise<Response|null>{const db=await mongoDb();
 if(action==='settings'){owner(user);const current=await settingsRead('global');const value=validateProfile(b,current.value);const revision=await settingsSave('global',value,Number(b.revision),user.email);return json({saved:true,revision})}
 if(action==='email-config'){owner(user);const current=await settingsRead('email');const value=await buildEmailConfig(b.value,current.value);const revision=await settingsSave('email',value,Number(b.revision),user.email);return json({revision,value:publicEmailConfig(value)})}
 if(action==='email-test'){owner(user);await sendEmail('AVAULT delivery test','This is a requested test of the DMV Commercial Door Repair website email configuration. If you can read this, lead notifications will reach this inbox.',undefined,{force:true});await recordActivity(user.email,'email-test','email');return json({sent:true})}
 if(action==='redirect-save'){const source=checkRedirectPath(b.source,'The old path');let destination=String(b.destination||'').trim();const status=Number(b.status)===307?307:308;
  const registry=await allDocs();if(registry[source])throw new HttpError(422,'That old path is a live page. Unpublish or rename the page instead.');
  if(/^https:\/\//.test(destination)){if(!safeUrl(destination))throw new HttpError(422,'Invalid destination.')}else{destination=checkRedirectPath(destination,'The destination');const path=destination.split(/[?#]/)[0];if(!registry[path]&&!SYSTEM_ROUTES.includes(path))throw new HttpError(422,'The destination must be a published page (or a full https:// address).')}
  if(destination===source)throw new HttpError(422,'The old path and destination must differ.');
  const collection=db.collection('redirects');if(await collection.findOne({source:destination.split(/[?#]/)[0]}))throw new HttpError(422,'The destination is itself redirected. Point to the final page to avoid a redirect chain.');
  const original=b.originalSource?String(b.originalSource):source;if(original!==source&&await collection.findOne({source}))throw new HttpError(409,'A redirect for that old path already exists.');if(!b.originalSource&&await collection.findOne({source}))throw new HttpError(409,'A redirect for that old path already exists. Edit it instead.');
  // Anything that pointed at this old path now points straight at the new destination, so no chain forms.
  const flattened=await collection.updateMany({destination:source},{$set:{destination,updated_at:now()}});
  await collection.updateOne({source:original},{$set:{source,destination,status,enabled:b.enabled!==false,note:String(b.note||'').slice(0,300),updated_at:now(),updated_by:user.email},$setOnInsert:{created_at:now(),created_by:user.email,hits:0}},{upsert:true});
  await recordActivity(user.email,b.originalSource?'redirect-update':'redirect',source+' -> '+destination+' ('+status+')');return json({saved:true,flattened:flattened.modifiedCount})}
 if(action==='redirect-delete'){const source=String(b.source||'');const r=await db.collection('redirects').deleteOne({source});if(!r.deletedCount)throw new HttpError(404,'Redirect not found.');await recordActivity(user.email,'redirect-delete',source);return json({deleted:true})}
 if(action==='media-alt'){const url=String(b.url||''),alt=String(b.alt??'').slice(0,1000);if(!url)throw new HttpError(422,'Choose an image.');const rows=await drafts();
  const impact=rows.filter(r=>altUsages(r.draft,url).some(a=>a.value!==alt)||(r.published&&altUsages(r.published,url).some(a=>a.value!==alt))).map(r=>({route:r.route,revision:r.revision,locations:[...altUsages(r.draft,url),...(r.published?altUsages(r.published,url):[])].map(a=>a.section+': "'+(a.value||'(empty)')+'"')}));
  if(b.dryRun)return json({affected:impact});if(JSON.stringify(b.expected)!==JSON.stringify(impact.map(i=>({route:i.route,revision:i.revision}))))throw new HttpError(409,'Image usage changed. Review the affected pages again.');
  const set=(d:Doc)=>{const keys=new Set(altUsages(d,url).map(a=>a.key));return {...d,fields:d.fields.map(f=>keys.has(f.key)?{...f,value:alt}:f)}};
  if(impact.length)await mutateMany(impact.map(i=>{const r=rows.find(x=>x.route===i.route)!;return {before:{...r.draft,revision:r.revision},draft:set(r.draft),published:r.published?set(r.published):null}}),user.email,'media-alt');
  if(url.startsWith('/media/'))await db.collection('media').updateOne({key:url.slice(7)},{$set:{alt}});return json({updated:impact.length})}
 if(action==='document-delete'){owner(user);const route=String(b.route||'');const row=await db.collection('documents').findOne({route});if(!row)throw new HttpError(404,'Page not found.');if(route==='/')throw new HttpError(422,'The homepage cannot be deleted.');if(row.published)throw new HttpError(422,'Only never-published drafts can be deleted. Unpublish and rename live pages instead, so their URL keeps redirecting.');
  const linked=Object.values(await allDocs()).filter(d=>d.fields.some(f=>f.label==='a href'&&f.value.split(/[?#]/)[0]===route));if(linked.length)throw new HttpError(422,'Remove links to this draft first: '+linked.map(d=>d.route).join(', '));
  await db.collection('documents').deleteOne({route,published:null});await db.collection('schedules').deleteOne({route});await recordActivity(user.email,'delete-draft',route);return json({deleted:true})}
 if(action==='form-bulk'){const ids=(Array.isArray(b.ids)?b.ids:[]).map(String).slice(0,200);if(!['read','archived','new','spam'].includes(b.status))throw new HttpError(422,'Invalid status.');const r=await db.collection('forms').updateMany({id:{$in:ids}},{$set:{status:b.status}});await recordActivity(user.email,'form-bulk',ids.length+' leads -> '+b.status);return json({updated:r.modifiedCount})}
 return null;
}
```

### lib/avault/agent.ts

<!-- avault-file path="lib/avault/agent.ts" mode="owned" sha256="faa51c8ad4900d188e6aa82dc056483aec5ad32f4e88c914cbb4ce82748795fb" eol="1" -->
```ts
// Pure helper, safe to import from AVAULT's browser code.
// A short, readable browser / OS / device label. Good enough to tell a phone lead from a desktop one.
export function describeAgent(ua=''){
 const browser=/Edg\//.test(ua)?'Edge':/OPR\/|Opera/.test(ua)?'Opera':/SamsungBrowser/.test(ua)?'Samsung Internet':/Firefox\//.test(ua)?'Firefox':/CriOS|Chrome\//.test(ua)?'Chrome':/Safari\//.test(ua)?'Safari':'';
 const os=/Windows NT/.test(ua)?'Windows':/iPhone|iPad|iPod/.test(ua)?'iOS':/Android/.test(ua)?'Android':/Mac OS X/.test(ua)?'macOS':/CrOS/.test(ua)?'ChromeOS':/Linux/.test(ua)?'Linux':'';
 const device=/iPad|Tablet/.test(ua)?'Tablet':/Mobi|iPhone|Android/.test(ua)?'Mobile':ua?'Desktop':'';
 return [browser,os,device].filter(Boolean).join(' · ')||'Unknown';
}
```

### lib/avault/auth.ts

<!-- avault-file path="lib/avault/auth.ts" mode="owned" sha256="24d7c82ace86a1e94760972ab4c8ff95b9e74130972b8896d27fdf4a7c597dde" eol="1" -->
```ts
import {createHash,createHmac,randomBytes,scrypt,timingSafeEqual} from 'node:crypto';
import {mongoDb} from '@/db/mongo';
import {HttpError,clientIp,now} from './store';

// AVAULT accounts live in the MongoDB `users` collection. Passwords are scrypt hashes; sessions are
// HMAC-signed cookies that are re-checked against the database on every request, so deactivating a user
// or changing a password (which bumps session_version) signs them out everywhere.
export type AdminUser={email:string;role:'owner'|'administrator';active:boolean;password_hash:string;session_version:number;created_at:string;updated_at:string;last_login_at?:string;password_changed_at?:string};
export const COOKIE='avault_session';
const SESSION_SECONDS=4*60*60;
const ROLES=['owner','administrator'] as const;

export async function users(){const db=await mongoDb();return db.collection<AdminUser>('users')}
export const normalizeEmail=(value:unknown)=>String(value||'').trim().toLowerCase();
export function checkEmail(email:string){if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>250)throw new HttpError(422,'Enter a valid email address.');return email}
export function checkPassword(password:unknown){const s=String(password||'');if(s.length<12||s.length>128)throw new HttpError(422,'Use a password between 12 and 128 characters.');return s}
export function checkRole(role:unknown){if(!ROLES.includes(role as never))throw new HttpError(422,'Choose owner or administrator.');return role as AdminUser['role']}

const derive=(password:string,salt:Buffer,n:number,r:number,p:number)=>new Promise<Buffer>((resolve,reject)=>scrypt(password,salt,64,{N:n,r,p,maxmem:64*1024*1024},(e,key)=>e?reject(e):resolve(key)));
export async function hashPassword(password:string){const salt=randomBytes(16);const key=await derive(password,salt,16384,8,1);return `scrypt$16384$8$1$${salt.toString('base64')}$${key.toString('base64')}`}
export async function verifyPassword(password:string,stored:string){const [scheme,n,r,p,salt,hash]=String(stored||'').split('$');if(scheme!=='scrypt'||!salt||!hash)return false;const expected=Buffer.from(hash,'base64');const actual=await derive(password,Buffer.from(salt,'base64'),Number(n),Number(r),Number(p));return actual.length===expected.length&&timingSafeEqual(actual,expected)}
// Compared against when an email is unknown, so response time doesn't reveal which accounts exist.
const DUMMY_HASH='scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$'+Buffer.alloc(64).toString('base64');

function sessionKey(){const key=process.env.AVAULT_ENCRYPTION_KEY;if(!key||!/^[a-f0-9]{64}$/.test(key))throw new HttpError(503,'AVAULT_ENCRYPTION_KEY is not configured.');return createHmac('sha256',Buffer.from(key,'hex')).update('avault-session-v1').digest()}
const sign=(payload:string)=>createHmac('sha256',sessionKey()).update(payload).digest('base64url');
function cookieValue(req:Request){for(const part of (req.headers.get('cookie')||'').split(';')){const [k,...v]=part.trim().split('=');if(k===COOKIE)return v.join('=')}return ''}
function readSession(req:Request){const [payload,signature]=cookieValue(req).split('.');if(!payload||!signature)return null;const expected=Buffer.from(sign(payload)),actual=Buffer.from(signature);if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return null;try{const s=JSON.parse(Buffer.from(payload,'base64url').toString());return typeof s.e==='string'&&typeof s.v==='number'&&s.x>Date.now()/1000?s as {e:string;v:number;x:number}:null}catch{return null}}
const secure=()=>process.env.NODE_ENV==='production'?'; Secure':'';
export function sessionCookie(user:Pick<AdminUser,'email'|'session_version'>){const payload=Buffer.from(JSON.stringify({e:user.email,v:user.session_version,x:Math.floor(Date.now()/1000)+SESSION_SECONDS})).toString('base64url');return `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure()}`}
export const clearedCookie=()=>`${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure()}`;

export async function sessionUser(req:Request){const s=readSession(req);if(!s)return null;const user=await (await users()).findOne({email:s.e});if(!user||!user.active||user.session_version!==s.v)return null;return {email:user.email,role:user.role}}

async function bump(key:string,windowMs:number){const db=await mongoDb();const row=await db.collection('rate_limits').findOneAndUpdate({id:key,expires:{$gt:Date.now()}},{$inc:{count:1}},{returnDocument:'after'});if(row)return Number(row.count);await db.collection('rate_limits').updateOne({id:key},{$set:{count:1,expires:Date.now()+windowMs}},{upsert:true});return 1}
async function failures(key:string){const db=await mongoDb();const row=await db.collection('rate_limits').findOne({id:key,expires:{$gt:Date.now()}});return Number(row?.count||0)}
export async function login(req:Request,emailInput:unknown,passwordInput:unknown){
 const email=normalizeEmail(emailInput),password=String(passwordInput||'').slice(0,128);
 const ip=createHash('sha256').update(clientIp(req)).digest('hex').slice(0,32);const accountKey='login:'+ip+':'+email,ipKey='login-ip:'+ip;
 if(await failures(accountKey)>=5||await failures(ipKey)>=20)throw new HttpError(429,'Too many sign-in attempts. Try again in 15 minutes.');
 const collection=await users();const user=email?await collection.findOne({email}):null;
 const valid=await verifyPassword(password,user?.password_hash||DUMMY_HASH)&&!!user?.active;
 if(!valid||!user){await bump(accountKey,15*60000);await bump(ipKey,15*60000);await new Promise(r=>setTimeout(r,600));throw new HttpError(401,'Incorrect email or password.')}
 await (await mongoDb()).collection('rate_limits').deleteOne({id:accountKey});
 await collection.updateOne({email},{$set:{last_login_at:now()}});return user;
}

export async function activeOwners(){return (await users()).countDocuments({role:'owner',active:true})}
export async function listUsers(){return (await users()).find({},{projection:{_id:0,password_hash:0}}).sort({email:1}).limit(200).toArray()}
// Creates or updates an account. A new password or a change of role/active state invalidates existing sessions.
export async function saveUser(input:{email:unknown;role?:unknown;active?:unknown;password?:unknown},options:{allowCreate:boolean}){
 const email=checkEmail(normalizeEmail(input.email));const collection=await users();const current=await collection.findOne({email});
 if(!current&&!options.allowCreate)throw new HttpError(404,'Administrator not found.');
 const role=input.role===undefined?current?.role||'administrator':checkRole(input.role);const active=input.active===undefined?current?.active??true:!!input.active;
 if(!current&&!input.password)throw new HttpError(422,'Set a password for the new administrator.');
 if(current?.role==='owner'&&current.active&&(role!=='owner'||!active)&&await activeOwners()<=1)throw new HttpError(422,'Keep at least one active owner.');
 const set:Partial<AdminUser>={role,active,updated_at:now()};if(input.password){set.password_hash=await hashPassword(checkPassword(input.password));set.password_changed_at=now()}
 const invalidate=!!input.password||(current&&(current.role!==role||current.active!==active));
 await collection.updateOne({email},{$set:set,...(invalidate?{$inc:{session_version:1}}:{}),$setOnInsert:{email,created_at:now(),...(invalidate?{}:{session_version:0})}},{upsert:true});
 return email;
}
export async function deleteUser(emailInput:unknown){const email=normalizeEmail(emailInput);const collection=await users();const current=await collection.findOne({email});if(!current)throw new HttpError(404,'Administrator not found.');if(current.role==='owner'&&current.active&&await activeOwners()<=1)throw new HttpError(422,'Keep at least one active owner.');await collection.deleteOne({email});return email}
```

### lib/avault/blocks.ts

<!-- avault-file path="lib/avault/blocks.ts" mode="owned" sha256="eaa4e7378885b21d9e128ecd986e4eba0169bdf33915c91fd3c743d414f9fc94" eol="1" -->
```ts
import {esc,HttpError,safeUrl} from './store';
export type Block={id:string;type:'paragraph'|'heading'|'image'|'quote'|'list'|'table'|'cta'|'cards'|'code'|'rule'|'form';text?:string;formId?:string;level?:number;url?:string;alt?:string;caption?:string;items?:string[];rows?:string[][];align?:'left'|'center'|'right'|'justify';color?:'blue'|'red'|'green'|'yellow'|'neutral';ordered?:boolean};
export function validateBlocks(value:unknown):Block[]{if(value===undefined)return [];if(!Array.isArray(value)||value.length>100)throw new HttpError(422,'Use up to 100 content blocks.');const ids=new Set();return value.map((b:any)=>{if(!b||!['paragraph','heading','image','quote','list','table','cta','cards','code','rule','form'].includes(b.type)||typeof b.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(b.id)||ids.has(b.id))throw new HttpError(422,'Invalid content block.');ids.add(b.id);if(b.url&&(!safeUrl(b.url)||String(b.url).length>1500))throw new HttpError(422,'Invalid block URL.');if(b.type==='image'&&b.url&&!/^(https:\/\/|\/(?!\/))/.test(b.url))throw new HttpError(422,'Use a secure image URL.');const clean:Block={id:b.id,type:b.type,text:String(b.text||'').slice(0,30000),formId:/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(b.formId||''))?String(b.formId):'',level:[2,3,4,5,6].includes(b.level)?b.level:2,url:String(b.url||''),alt:String(b.alt||'').slice(0,1000),caption:String(b.caption||'').slice(0,2000),align:['left','center','right','justify'].includes(b.align)?b.align:'left',color:['blue','red','green','yellow','neutral'].includes(b.color)?b.color:'neutral',ordered:!!b.ordered};if(b.type==='form'&&!clean.formId)throw new HttpError(422,'Choose a custom form.');if(b.items){if(!Array.isArray(b.items)||b.items.length>50)throw new HttpError(422,'Too many items.');clean.items=b.items.map((v:unknown)=>String(v).slice(0,5000))}if(b.rows){if(!Array.isArray(b.rows)||b.rows.length>50||b.rows.some((r:any)=>!Array.isArray(r)||r.length>12))throw new HttpError(422,'Use up to 50 table rows and 12 columns.');clean.rows=b.rows.map((r:any[])=>r.map(v=>String(v).slice(0,1000)))}return clean;});}
export function inline(value:string){let s=esc(value);s=s.replace(/\[([^\]\n]+)\]\(([^\s)]+)(?:\s+&quot;([a-z ]{1,60})&quot;)?\)/g,(_,label,url,opts='')=>{if(!safeUrl(url))return label;const o=String(opts).split(' '),newTab=o.includes('newtab'),rel=[...(newTab?['noopener','noreferrer']:[]),...(o.includes('nofollow')?['nofollow']:[]),...(o.includes('sponsored')?['sponsored']:[])];return `<a href="${url}"${newTab?' target="_blank"':''}${rel.length?` rel="${rel.join(' ')}"`:''}>${label}</a>`});return s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>').replace(/~~([^~]+)~~/g,'<del>$1</del>').replace(/__([^_]+)__/g,'<u>$1</u>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/==([^=]+)==/g,'<mark>$1</mark>').replace(/\^([^\^]+)\^/g,'<sup>$1</sup>').replace(/~([^~]+)~/g,'<sub>$1</sub>');}
export function renderBlocks(blocks:Block[]=[]){return blocks.map(b=>{let h='';switch(b.type){case'heading':h=`<h${b.level||2}>${inline(b.text||'')}</h${b.level||2}>`;break;case'image':h=`<figure><img src="${esc(b.url)}" alt="${esc(b.alt)}" loading="lazy" decoding="async">${b.caption?`<figcaption>${inline(b.caption)}</figcaption>`:''}</figure>`;break;case'quote':h=`<blockquote>${inline(b.text||'')}</blockquote>`;break;case'list':{const t=b.ordered?'ol':'ul';h=`<${t}>${(b.items||[]).map(i=>`<li>${inline(i)}</li>`).join('')}</${t}>`;break}case'cards':h=`<div class="avault-content-cards">${(b.items||[]).map(i=>`<article>${inline(i).replaceAll('\n','<br>')}</article>`).join('')}</div>`;break;case'table':h=`<div class="avault-table-scroll"><table>${(b.rows||[]).map((r,i)=>`<tr>${r.map(c=>`<${i?'td':'th'}>${inline(c)}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</table></div>`;break;case'cta':h=`<a class="i-button i-button-primary" href="${esc(b.url)}">${esc(b.text)}</a>`;break;case'form':h=`<form class="estimate-form audit-form i-form" data-avault-form="${esc(b.formId)}"></form>`;break;case'code':h=`<pre><code>${esc(b.text)}</code></pre>`;break;case'rule':h='<hr>';break;default:h=(b.text||'').split(/\n\s*\n/).filter(Boolean).map(p=>`<p>${inline(p).replaceAll('\n','<br>')}</p>`).join('')}
return `<section id="block-${esc(b.id)}" class="avault-content-block avault-color-${esc(b.color||'neutral')}" style="text-align:${esc(b.align||'left')}">${h}</section>`}).join('')}
export function sections(template:string){const main=template.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1]||'';const out:{id:string;start:number;end:number;html:string}[]=[];let depth=0,start=0;for(const m of main.matchAll(/<\/?section\b[^>]*>/g)){if(m[0].startsWith('</')){if(--depth===0)out.push({id:'section-'+out.length,start,end:m.index!+m[0].length,html:main.slice(start,m.index!+m[0].length)})}else{if(depth===0)start=m.index!;depth++}}return {main,items:out}}
export function compose(template:string,order?:string[],hidden?:string[],blocks:Block[]=[]){if(order||hidden){const {main,items}=sections(template);const map=new Map(items.map(i=>[i.id,i]));const arranged=(order||items.map(i=>i.id)).filter(id=>!hidden?.includes(id)).map(id=>map.get(id)?.html||'');let rewritten=main;for(let i=items.length-1;i>=0;i--)rewritten=rewritten.slice(0,items[i].start)+(arranged[i]||'')+rewritten.slice(items[i].end);template=template.replace(main,rewritten)}return template.replace('</main>',`<div class="shell-wide avault-added-content">${renderBlocks(blocks)}</div></main>`)}
```

### lib/avault/config.ts

<!-- avault-file path="lib/avault/config.ts" mode="owned" sha256="cf8e58ce75e1d46afefe8072ff3eadeaec21fbdbc8254aedb16b66fe3b15fd9a" eol="1" -->
```ts
export const CONFIG={name:'DMV Commercial Door Repair',origin:(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000').replace(/\/$/,''),email:'__PUBLIC_EMAIL_NOT_CONFIGURED__',phone:'+18885990548',phoneDisplay:'888-599-0548',locale:'en_US',language:'en-US',zone:'America/New_York',logo:'/assets/logo.png',image:'/assets/hero.jpg'};
// Pages drawn by code (lib/avault/system-pages.ts) rather than stored in AVAULT. They count as published
// destinations for links and redirects. /contact/ is indexable; the others are not.
export const SYSTEM_ROUTES=['/thank-you/'];
// Built-in header/footer overrides, applied unless the Header & footer editor saves its own value.
export const DEFAULT_NAVIGATION:Record<string,string>={};
```

### lib/avault/email.ts

<!-- avault-file path="lib/avault/email.ts" mode="owned" sha256="2a43f9f6765ed0857023832c5a16f3465b88d16b666aeb076387b17181c88a7f" eol="1" -->
```ts
import nodemailer from 'nodemailer';
import {mongoDb} from '@/db/mongo';
import {HttpError,now} from './store';
import {seal,unseal,settingsRead} from './runtime';
import {leadHtml,leadText} from './lead-email';

// Email delivery settings (settings id `email`). Secrets are sealed with AVAULT_ENCRYPTION_KEY and never
// returned to the browser; `enabled:false` is save-only mode, where leads are stored but no email is sent.
export type EmailConfig={enabled:boolean;provider:'mailgun'|'smtp';senderName:string;fromAddress:string;replyTo:string;recipients:string[];
 mailgun:{domain:string;region:'us'|'eu';key:string};smtp:{host:string;port:number;secure:boolean;user:string;pass:string}};
const EMAIL=/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
export const MAX_ATTEMPTS=5;

// Older records stored Mailgun fields at the top level with a combined "Name <address>" sender.
export function normalizeEmailConfig(v:any):EmailConfig{
 const legacySender=String(v?.sender||'').match(/^\s*(?:([^<]*?)\s*<)?([^<>\s]+@[^<>\s]+)>?\s*$/);
 return {enabled:!!v?.enabled,provider:v?.provider==='smtp'?'smtp':'mailgun',senderName:String(v?.senderName??legacySender?.[1]??''),fromAddress:String(v?.fromAddress??legacySender?.[2]??''),replyTo:String(v?.replyTo||''),recipients:Array.isArray(v?.recipients)?v.recipients.map(String):[],
  mailgun:{domain:String(v?.mailgun?.domain??v?.domain??''),region:(v?.mailgun?.region??v?.region)==='eu'?'eu':'us',key:String(v?.mailgun?.key??v?.key??'')},
  smtp:{host:String(v?.smtp?.host||''),port:Number(v?.smtp?.port)||587,secure:!!v?.smtp?.secure,user:String(v?.smtp?.user||''),pass:String(v?.smtp?.pass||'')}};
}
// What the browser may see: everything except the secrets, plus whether each secret is stored.
export function publicEmailConfig(v:any){const c=normalizeEmailConfig(v);return {...c,mailgun:{...c.mailgun,key:'',keySaved:!!c.mailgun.key},smtp:{...c.smtp,pass:'',passSaved:!!c.smtp.pass}}}

export async function buildEmailConfig(input:any,current:any):Promise<EmailConfig>{
 const old=normalizeEmailConfig(current),v=input||{};const provider=v.provider==='smtp'?'smtp':'mailgun';
 const recipients=(Array.isArray(v.recipients)?v.recipients:[]).map((r:unknown)=>String(r).trim()).filter(Boolean);
 if(recipients.length<1||recipients.length>10||recipients.some((r:string)=>!EMAIL.test(r)))throw new HttpError(422,'Enter between 1 and 10 valid recipient addresses.');
 const fromAddress=String(v.fromAddress||'').trim();if(!EMAIL.test(fromAddress))throw new HttpError(422,'Enter a valid "from" address.');
 const replyTo=String(v.replyTo||'').trim();if(replyTo&&!EMAIL.test(replyTo))throw new HttpError(422,'Enter a valid reply-to address or leave it blank.');
 const senderName=String(v.senderName||'').replace(/[<>"\r\n]/g,'').trim().slice(0,100);
 const config:EmailConfig={enabled:!!v.enabled,provider,senderName,fromAddress,replyTo,recipients,mailgun:old.mailgun,smtp:old.smtp};
 if(provider==='mailgun'){const domain=String(v.mailgun?.domain||'').trim();if(!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain))throw new HttpError(422,'Enter the Mailgun sending domain, such as mg.example.com.');config.mailgun={domain,region:v.mailgun?.region==='eu'?'eu':'us',key:v.mailgun?.key?await seal(String(v.mailgun.key).trim()):old.mailgun.key};if(config.enabled&&!config.mailgun.key)throw new HttpError(422,'Enter the Mailgun sending key before enabling delivery.')}
 else{const host=String(v.smtp?.host||'').trim(),port=Number(v.smtp?.port),user=String(v.smtp?.user||'').trim();if(!/^[a-z0-9.-]+$/i.test(host))throw new HttpError(422,'Enter the SMTP host, such as smtp.gmail.com.');if(![25,465,587,2525].includes(port))throw new HttpError(422,'Use SMTP port 465, 587, 25 or 2525.');if(!user)throw new HttpError(422,'Enter the SMTP username.');config.smtp={host,port,secure:port===465,user,pass:v.smtp?.pass?await seal(String(v.smtp.pass)):old.smtp.pass};if(config.enabled&&!config.smtp.pass)throw new HttpError(422,'Enter the SMTP password (for Gmail, an app password) before enabling delivery.')}
 return config;
}

const from=(c:EmailConfig)=>c.senderName?`"${c.senderName}" <${c.fromAddress}>`:c.fromAddress;
// Provider messages can echo credentials or internal hosts; only a short, generic reason is kept.
const redact=(s:string)=>s.replace(/(key|pass(word)?|token|auth)[^\s]*/gi,'$1 [redacted]').slice(0,200);

export async function sendEmail(subject:string,text:string,replyTo?:string,options:{force?:boolean;html?:string}={}){
 const c=normalizeEmailConfig((await settingsRead('email')).value);
 if(!c.enabled&&!options.force)throw new HttpError(422,'Email delivery is in save-only mode. Enable it under Email.');
 if(!c.recipients.length||!c.fromAddress)throw new HttpError(422,'Configure email delivery first.');
 const reply=replyTo||c.replyTo||undefined;
 if(c.provider==='smtp'){
  if(!c.smtp.pass)throw new HttpError(422,'Save the SMTP password first.');
  const transport=nodemailer.createTransport({host:c.smtp.host,port:c.smtp.port,secure:c.smtp.secure,auth:{user:c.smtp.user,pass:await unseal(c.smtp.pass)},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000});
  try{await transport.sendMail({from:from(c),to:c.recipients,subject,text,html:options.html,replyTo:reply})}catch(e){throw new HttpError(502,'SMTP delivery failed: '+redact(String((e as Error).message||'unknown error')))}finally{transport.close()}
  return true;
 }
 if(!c.mailgun.key)throw new HttpError(422,'Save the Mailgun sending key first.');
 const data=new FormData();data.set('from',from(c));for(const r of c.recipients)data.append('to',r);data.set('subject',subject);data.set('text',text);if(options.html)data.set('html',options.html);if(reply)data.set('h:Reply-To',reply);
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
 try{const response=await fetch(`https://${c.mailgun.region==='eu'?'api.eu.mailgun.net':'api.mailgun.net'}/v3/${encodeURIComponent(c.mailgun.domain)}/messages`,{method:'POST',headers:{Authorization:'Basic '+btoa('api:'+await unseal(c.mailgun.key))},body:data,signal:controller.signal});
  if(!response.ok)throw new HttpError(502,`Mailgun rejected delivery (HTTP ${response.status}). Check the domain, region, sender and key.`);return true}
 catch(e){if(e instanceof HttpError)throw e;throw new HttpError(502,'Mailgun could not be reached: '+redact(String((e as Error).message||'timeout')))}finally{clearTimeout(timer)}
}

// Records every attempt on the submission: delivery is pending → sending → sent | failed | not-configured.
export async function deliverForm(formId:string){
 const db=await mongoDb();const forms=db.collection('forms');const c=normalizeEmailConfig((await settingsRead('email')).value);
 if(!c.enabled){await forms.updateOne({id:formId,delivery:{$nin:['sent','sending']}},{$set:{delivery:'not-configured',delivery_message:'Save-only mode: email delivery is off.'}});return}
 const claimed=await forms.findOneAndUpdate({id:formId,delivery:{$nin:['sent','sending']},attempts:{$not:{$gte:MAX_ATTEMPTS}}},{$set:{delivery:'sending'},$inc:{attempts:1}},{returnDocument:'after'});if(!claimed)return;
 const f=JSON.parse(String(claimed.value||'{}'));
 const contact=String(f.email||f.phone||'').toLowerCase();const previous=contact?await forms.countDocuments({id:{$ne:formId},search:{$regex:contact.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}}).catch(()=>0):0;
 const lead={id:formId,value:f,ip:claimed.ip,user_agent:claimed.user_agent,language:claimed.language,country:claimed.country,created_at:claimed.created_at,fill_seconds:claimed.fill_seconds,spam:claimed.spam,previous};
 try{await sendEmail(`New request: ${String(f.service||f.request||'door repair estimate').slice(0,80)} from ${String(f.name||'a visitor').slice(0,60)}`,leadText(lead),f.email||undefined,{html:leadHtml(lead)});await forms.updateOne({id:formId},{$set:{delivery:'sent',delivery_message:'Delivered to '+c.recipients.length+' recipient(s) via '+c.provider+'.',delivered_at:now()}})}
 catch(e){await forms.updateOne({id:formId},{$set:{delivery:'failed',delivery_message:e instanceof HttpError?e.message:'Delivery failed.',last_attempt_at:now()}})}
}
```

### lib/avault/extended.ts

<!-- avault-file path="lib/avault/extended.ts" mode="owned" sha256="ac1fd51c014c7759ca7866d73b3941288ba4ed05bd5866fb88cc4a96e24c5445" eol="1" -->
```ts
import {usages} from './media';
import {db,readDoc,allDocs,Doc,id,now,json,HttpError,safeUrl,headers} from './store';
import {renameImpact,renamePage,mutateMany,recordActivity,routePath} from './operations';
import {settingsRead,settingsSave,deliverForm,createBackup,backupRead,backupFile,backupDelete,runMaintenance} from './runtime';
import {bucket} from './store';
import {isIpRange} from './ip';
import {CONFIG} from './config';
import {buildEmailConfig,publicEmailConfig} from './email';
import {normalizeForms,validateForms} from './forms';
import {validateScripts} from './snippets';
import {render} from './render';
import {globals} from './store';
export async function extendedGet(action:string,u:URL,user:{email:string;role:string}){const page=Math.max(0,Math.min(10000,Number(u.searchParams.get('page'))||0));
 if(action==='configuration'){if(user.role!=='owner')throw new HttpError(403,'Owner access required.');const key=u.searchParams.get('key')||'';if(!['email','scripts','traffic','operations','verification','files','menus'].includes(key))throw new HttpError(404,'Not found.');const result=await settingsRead(key);if(key==='email')result.value=publicEmailConfig(result.value);return json(result)}
 // Privacy & tracking: how much visitor and lead data is stored right now.
 if(action==='privacy-stats'){if(user.role!=='owner')throw new HttpError(403,'Owner access required.');const {mongoDb}=await import('@/db/mongo');const m=await mongoDb();
  const [events,oldest,leads,archived,spam]=await Promise.all([m.collection('events').estimatedDocumentCount(),m.collection('events').find({},{projection:{_id:0,created_at:1}}).sort({created_at:1}).limit(1).next(),m.collection('forms').countDocuments({}),m.collection('forms').countDocuments({status:'archived'}),m.collection('forms').countDocuments({status:'spam'})]);
  return json({events,oldestEvent:oldest?.created_at||null,leads,archived,spam})}
 // AVAULT → Forms: where each form appears, the saved definition (or what pages show now), and the site's stylesheets for the preview.
 if(action==='site-forms'){const [docs,saved,g]=await Promise.all([allDocs(),settingsRead('forms'),globals()]);const home=docs['/'];
  const pages=(cls:string)=>Object.values(docs).filter(d=>new RegExp(`<form\\b[^>]*class="[^"]*\\b${cls}\\b`).test(d.template)).map(d=>({route:d.route,label:d.label})).sort((a,b)=>a.route.localeCompare(b.route));
  const html=home?render(home,g,true,docs):'',config=normalizeForms(saved.value);if(!config.contact.enabled||!config.contact.fields.length)throw new HttpError(503,'Form settings are missing from MongoDB. Run the AVAULT migration before editing forms.');
  return json({config,saved:{contact:true,hero:config.hero.enabled},revision:saved.revision,pages:{contact:pages('audit-form'),hero:pages('hero-proposal')},
   shell:{styles:[...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)].map(m=>m[0].match(/href="([^"]+)"/)?.[1]||'').filter(Boolean),bodyAttrs:html.match(/<body\b([^>]*)>/)?.[1]||''}})}
 if(action==='schedules'||action==='taxonomy'||action==='backups'){if(action==='backups'&&user.role!=='owner')throw new HttpError(403,'Owner access required.');return json((await db().prepare(`SELECT * FROM ${action} ORDER BY ${action==='taxonomy'?'label':action==='schedules'?'due':'created_at DESC'} LIMIT 50 OFFSET ?`).bind(page*50).all()).results)}
 if(action==='events'){const session=u.searchParams.get('session'),type=u.searchParams.get('type');const where=session?' WHERE session=?':type==='call'?" WHERE type='call'":'';return json((await db().prepare('SELECT * FROM events'+where+' ORDER BY created_at DESC LIMIT 50 OFFSET ?').bind(...(session?[session]:[]),page*50).all()).results)}
 if(action==='presence'){return json((await db().prepare('SELECT session,MAX(created_at) AS last_seen FROM events WHERE created_at>? GROUP BY session ORDER BY last_seen DESC LIMIT 100').bind(new Date(Date.now()-90000).toISOString()).all()).results)}
 // System health: each check reports ok | warn | bad with a plain-language detail for the AVAULT panel.
 if(action==='health'){const {mongoDb}=await import('@/db/mongo');const mdb=await mongoDb();const t0=Date.now();await mdb.command({ping:1});const ping=Date.now()-t0;
  const [m,emailRow,lastBackup,backupCount,lastSent,failedWeek,leadsWeek,spamWeek,schedules]=await Promise.all([settingsRead('last-maintenance'),settingsRead('email'),mdb.collection('backups').find({},{projection:{_id:0,created_at:1}}).sort({created_at:-1}).limit(1).next(),mdb.collection('backups').countDocuments({}),mdb.collection('forms').find({delivery:'sent'},{projection:{_id:0,delivered_at:1}}).sort({delivered_at:-1}).limit(1).next(),mdb.collection('forms').countDocuments({delivery:'failed',created_at:{$gt:new Date(Date.now()-7*86400000).toISOString()}}),mdb.collection('forms').countDocuments({created_at:{$gt:new Date(Date.now()-7*86400000).toISOString()}}),mdb.collection('forms').countDocuments({status:'spam',created_at:{$gt:new Date(Date.now()-7*86400000).toISOString()}}),mdb.collection('schedules').countDocuments({state:'pending'})]);
  const e=publicEmailConfig(emailRow.value),secret=e.provider==='smtp'?e.smtp.passSaved:e.mailgun.keySaved,ready=!!(e.fromAddress&&e.recipients.length&&secret);
  const via=e.provider==='smtp'?`SMTP (${e.smtp.host||'no host'})`:`Mailgun (${e.mailgun.domain||'no domain'})`;
  const ranAt=m.value.at as string|undefined,ago=ranAt?Date.now()-Date.parse(ranAt):Infinity;
  const backupAge=lastBackup?Date.now()-Date.parse(String(lastBackup.created_at)):Infinity;
  const checks=[
   {id:'database',title:'Database',status:ping<500?'ok':'warn',value:ping<500?'Connected':'Slow',detail:`MongoDB answered in ${ping} ms.`},
   {id:'email',title:'Lead emails',status:e.enabled&&ready?(failedWeek?'warn':'ok'):ready?'warn':'bad',value:e.enabled&&ready?'Sending':ready?'Save-only mode':'Not set up',detail:e.enabled&&ready?`Via ${via} to ${e.recipients.length} recipient${e.recipients.length===1?'':'s'}.${failedWeek?` ${failedWeek} failed in the last 7 days.`:''}`:ready?`Settings are saved (${via}) but "Send email notifications" is off, so leads are stored without an email.`:'Add a provider, sender and recipients, then send a test email.',extra:lastSent?.delivered_at?`Last lead email sent ${lastSent.delivered_at}`:'',view:'email'},
   {id:'scheduler',title:'Scheduled jobs',status:ago<30*60000?'ok':ago<2*3600000?'warn':'bad',value:ranAt?(ago<30*60000?'Running':'Delayed'):'Not run yet',detail:ranAt?`Runs every 10 minutes. ${schedules?`${schedules} post${schedules===1?'':'s'} waiting to publish.`:'Nothing waiting to publish.'}`:'Starts about a minute after the site restarts.',extra:ranAt?`Last run ${ranAt}`:''},
   {id:'backups',title:'Backups',status:backupAge<8*86400000?'ok':lastBackup?'warn':'bad',value:lastBackup?`${backupCount} saved`:'None yet',detail:lastBackup?'Daily backups can be turned on under Privacy & tracking.':'Create one now under Backups.',extra:lastBackup?`Latest ${lastBackup.created_at}`:'',view:'backups'},
   {id:'leads',title:'Leads this week',status:'ok',value:String(leadsWeek),detail:spamWeek?`${spamWeek} caught as spam and not emailed.`:'No spam caught this week.',view:'leads'},
  ];
  return json({checks,lastResults:m.value.results||null,lastRun:ranAt||null,site:CONFIG.origin,node:process.version,uptime:Math.round(process.uptime())})}
 if(action==='media-usage')return json(await usages(u.searchParams.get('url')||''));
 // Downloads the snapshot still encrypted; scripts/decrypt-backup.mjs opens it with the site's AVAULT_ENCRYPTION_KEY.
 if(action==='backup-download'){if(user.role!=='owner')throw new HttpError(403,'Owner access required.');const file=await backupFile(u.searchParams.get('id')||'');return new Response(file.body,{headers:{...headers,'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="${file.name}"`,'X-Backup-Checksum':file.checksum}})}
 return null;
}
export async function extendedPost(action:string,b:any,user:{email:string;role:string}){const owner=()=>{if(user.role!=='owner')throw new HttpError(403,'Owner access required.')};
 // Data requests (access / deletion) for one person, found by email (leads) or IP address (leads and visits).
 if(action==='privacy-lookup'||action==='privacy-erase'){owner();const {mongoDb}=await import('@/db/mongo');const m=await mongoDb();
  const q=String(b.query||'').trim().toLowerCase();const isEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q),isIp=/^[0-9a-f:.]{3,45}$/i.test(q)&&/[.:]/.test(q);
  if(!isEmail&&!isIp)throw new HttpError(422,'Enter an email address or an IP address.');
  const rx=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const candidates=await m.collection('forms').find(isEmail?{search:{$regex:rx}}:{ip:q},{projection:{_id:0,id:1,value:1,status:1,created_at:1,ip:1}}).limit(500).toArray();
  const leads=candidates.filter(r=>{if(!isEmail)return true;try{return String(JSON.parse(String(r.value)).email||'').toLowerCase()===q}catch{return false}});
  const eventFilter=isIp?{ip:q}:{ip:{$in:[...new Set(leads.map(r=>String(r.ip||'')).filter(Boolean))]}};
  const events=await m.collection('events').countDocuments(eventFilter);
  if(action==='privacy-lookup')return json({kind:isEmail?'email':'ip',leads:leads.map(r=>{let f:any={};try{f=JSON.parse(String(r.value))}catch{}return {id:r.id,name:f.name||'',email:f.email||'',phone:f.phone||'',zip:f.zip||'',status:r.status,created_at:r.created_at}}),events,eventsFrom:isEmail?'the IP addresses those leads were sent from':'this IP address'});
  if(b.confirm!==q)throw new HttpError(422,'Type the email or IP again to confirm.');
  const [l,e]=await Promise.all([m.collection('forms').deleteMany({id:{$in:leads.map(r=>r.id)}}),m.collection('events').deleteMany(eventFilter)]);
  await recordActivity(user.email,'privacy-erase',isEmail?q.replace(/^(.).*(@.*)$/,'$1…$2'):q);
  return json({leads:l.deletedCount,events:e.deletedCount})}

 if(action==='rename-impact'){const impact=await renameImpact(String(b.from),routePath(b.to));return json({from:impact.from,to:impact.to,affected:impact.affected})}
 if(action==='rename'){return json(await renamePage(String(b.from),routePath(b.to),b.expected,user.email))}
 if(action==='schedule'){const d=await readDoc(b.route,true);if(!d||d.revision!==b.revision)throw new HttpError(409,'Save and reload the current revision first.');if(!Number.isFinite(Date.parse(b.due))||Date.parse(b.due)<=Date.now())throw new HttpError(422,'Choose a future date and time.');await db().prepare("INSERT INTO schedules(route,revision,due,state,actor) VALUES (?,?,?,'pending',?) ON CONFLICT(route) DO UPDATE SET revision=excluded.revision,due=excluded.due,state='pending',actor=excluded.actor").bind(d.route,d.revision,new Date(b.due).toISOString(),user.email).run();await recordActivity(user.email,'schedule',d.route);return json({saved:true})}
 if(action==='schedule-cancel'){await db().prepare("UPDATE schedules SET state='cancelled' WHERE route=?").bind(b.route).run();await recordActivity(user.email,'cancel-schedule',b.route);return json({saved:true})}
 if(action==='taxonomy'){if(!['category','tag'].includes(b.type)||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(b.slug)||!String(b.label).trim())throw new HttpError(422,'Enter a label and lowercase slug.');await db().prepare('INSERT INTO taxonomy(id,type,slug,label) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET label=excluded.label,slug=excluded.slug').bind(b.id||id(),b.type,b.slug,String(b.label).slice(0,100)).run();await recordActivity(user.email,'taxonomy',b.slug);return json({saved:true})}
 if(action==='taxonomy-delete'){const docs=await allDocs();const drafts=await db().prepare('SELECT draft FROM documents').all<any>();if([...Object.values(docs),...drafts.results.map(r=>JSON.parse(r.draft))].some(d=>d.category===b.id||d.tags?.includes(b.id)))throw new HttpError(422,'Reassign this classification on every page before deleting it.');await db().prepare('DELETE FROM taxonomy WHERE id=?').bind(b.id).run();await recordActivity(user.email,'delete-taxonomy',b.id);return json({deleted:true})}
 if(action==='family'){const base=await readDoc(b.templateRoute,true);if(!base||!Array.isArray(b.pages)||b.pages.length<1||b.pages.length>15)throw new HttpError(422,'Choose a template and between 1 and 15 pages.');const paths=b.pages.map((p:any)=>routePath(p.route));if(new Set(paths).size!==paths.length)throw new HttpError(422,'Duplicate routes in this family.');for(const route of paths)if(await readDoc(route,true)||await db().prepare('SELECT source FROM redirects WHERE source=?').bind(route).first())throw new HttpError(409,'A family route already exists: '+route);const stmts=b.pages.map((p:any)=>{const d=structuredClone(base);d.route=routePath(p.route);d.templateRoute=base.templateRoute||base.route;d.label=String(p.title).slice(0,150);d.seo={...d.seo,title:d.label+' | '+CONFIG.name,canonical:CONFIG.origin+d.route};d.revision=1;d.fields=d.fields.map(f=>({...f,value:f.label==='h1'?d.label:f.value}));return db().prepare('INSERT INTO documents(id,route,draft,published,revision,updated_at) VALUES (?,?,?,NULL,1,?)').bind(d.route,d.route,JSON.stringify(d),now())});await db().batch([...stmts,db().prepare('INSERT INTO activity(id,actor,action,entity,created_at) VALUES (?,?,?,?,?)').bind(id(),user.email,'create-family',paths.join(','),now())]);return json({routes:paths})}
 if(action==='configuration-restore'){owner();const r=await db().prepare('SELECT * FROM revisions WHERE id=?').bind(b.id).first<any>();if(!r?.document_id.startsWith('@')||!r.before)throw new HttpError(422,'Choose a configuration revision.');const key=r.document_id.slice(1);if(!['global','email','scripts','traffic','operations','verification','files','menus'].includes(key))throw new HttpError(422,'This system revision cannot be restored.');const revision=await settingsSave(key,JSON.parse(r.before),b.expectedRevision,user.email);return json({revision})}
 if(action==='configuration'){owner();const key=String(b.key),v=b.value||{};let value:any;
 if(key==='email'){value=await buildEmailConfig(v,(await settingsRead(key)).value);}
 else if(key==='verification'){for(const k of ['google','bing'])if(v[k]&&!/^[A-Za-z0-9_-]{8,200}$/.test(v[k]))throw new HttpError(422,'Paste only the verification token.');value={google:v.google||'',bing:v.bing||''};}
 else if(key==='scripts'){try{value=validateScripts(v)}catch(e){throw new HttpError(422,(e as Error).message)}}
 else if(key==='operations'){const days=Number(v.retentionDays)||365;if(![30,90,180,365,730].includes(days))throw new HttpError(422,'Choose a retention period.');const formDays=Number(v.formRetentionDays||0);if(![0,90,180,365,730].includes(formDays))throw new HttpError(422,'Choose an approved lead retention period.');value={analytics:v.analytics!==false,retentionDays:days,dailyBackup:!!v.dailyBackup,formRetentionDays:formDays};}
 else if(key==='traffic'){const list=(x:any)=>Array.isArray(x)?x.map((s:any)=>String(s).trim()).filter(Boolean).slice(0,100):[];value={enabled:!!v.enabled,allow:list(v.allow),deny:list(v.deny),countries:list(v.countries).map((s:string)=>s.toUpperCase())};if([...value.allow,...value.deny].some((s:string)=>!isIpRange(s))||value.countries.some((s:string)=>!/^[A-Z]{2}$/.test(s)))throw new HttpError(422,'Use IPv4 or IPv6 addresses or CIDR ranges and two-letter country codes.');}
 else if(key==='files'){if(typeof(v.robots||'')!=='string'||String(v.robots||'').length>10000||typeof(v.llms||'')!=='string'||String(v.llms||'').length>20000)throw new HttpError(422,'Invalid technical file.');const paths=(x:unknown)=>(Array.isArray(x)?x:[]).map((s:unknown)=>String(s).trim()).filter(Boolean).slice(0,500);const exclude=paths(v.sitemaps?.exclude),custom={'sm_pages.xml':paths(v.sitemaps?.custom?.['sm_pages.xml']),'sm_posts.xml':paths(v.sitemaps?.custom?.['sm_posts.xml'])};if([...exclude,...custom['sm_pages.xml'],...custom['sm_posts.xml']].some(u=>!(u.startsWith('/')&&!u.startsWith('//'))&&!/^https:\/\//.test(u)))throw new HttpError(422,'Sitemap entries must be site paths (/page/) or https:// URLs.');value={robots:v.robots||'',llms:v.llms||'',sitemaps:{exclude,custom}};}
 else if(key==='forms'){try{value=validateForms(v)}catch(e){throw new HttpError(422,(e as Error).message)}}
 else if(key==='menus'){value={};for(const name of ['header','footer','mobile','utility']){const items=v[name]||[];if(!Array.isArray(items)||items.length>40)throw new HttpError(422,'Use up to 40 menu items.');const ids=new Set(items.map((i:any)=>i.id));if(ids.size!==items.length||items.some((i:any)=>!i.id||i.parent&&(!ids.has(i.parent)||i.parent===i.id||items.find((x:any)=>x.id===i.parent)?.parent)))throw new HttpError(422,'Use unique menu IDs and a maximum of two levels.');const published=await allDocs();if(items.some((i:any)=>String(i.url).startsWith('/')&&!published[String(i.url).split(/[?#]/)[0]]))throw new HttpError(422,'Choose a published internal destination.');value[name]=items.map((i:any)=>{if(!safeUrl(String(i.url))||typeof i.label!=='string'||!i.label.trim())throw new HttpError(422,'Each menu item needs a label and safe URL.');return {id:String(i.id).slice(0,100),label:i.label.slice(0,120),url:i.url,parent:String(i.parent||''),enabled:i.enabled!==false,newTab:!!i.newTab}});}}
 else throw new HttpError(404,'Unknown settings module.');const revision=await settingsSave(key,value,b.revision,user.email);return json({revision});}
 if(action==='email-retry'){const {mongoDb}=await import('@/db/mongo');await (await mongoDb()).collection('forms').updateOne({id:String(b.id),delivery:{$ne:'sent'}},{$set:{attempts:0,delivery:'failed'}});await deliverForm(String(b.id));await recordActivity(user.email,'email-retry',b.id);return json({saved:true})}
 if(action==='backup'){owner();return json(await createBackup(user.email))}
 if(action==='backup-delete'){owner();const latest=await db().prepare('SELECT id FROM backups ORDER BY created_at DESC LIMIT 1').first<any>();if(latest?.id===b.id)throw new HttpError(422,'Keep the latest backup. Make a new one before deleting this.');return json(await backupDelete(String(b.id||''),user.email))}
 if(action==='backup-inspect'){owner();const data=await backupRead(b.id);return json({origin:data.origin,date:data.createdAt,counts:Object.fromEntries(Object.entries(data.tables).map(([k,v])=>[k,(v as any[]).length])),documents:data.tables.documents.map((r:any)=>({route:r.route,revision:r.revision}))})}
 if(action==='backup-restore-page'){owner();const data=await backupRead(b.id);const r=data.tables.documents.find((r:any)=>r.route===b.route);const current=await readDoc(b.route,true);if(!r||!current||current.revision!==b.expectedRevision)throw new HttpError(409,'Reload the target page revision before restoring.');const draft=JSON.parse(r.draft),published=r.published?JSON.parse(r.published):null;await createBackup(user.email);await mutateMany([{before:current,draft,published}],user.email,'restore-page');return json({restored:true})}
 if(action==='maintenance'){owner();return json(await runMaintenance(user.email))}
 if(action==='media-update'){const row=await db().prepare('SELECT * FROM media WHERE id=?').bind(b.id).first<any>();if(!row)throw new HttpError(404,'Uploaded image not found.');const old=JSON.parse(row.metadata||'{}');if(b.expectedUpdatedAt!==old.updatedAt)throw new HttpError(409,'Media details changed. Reload before saving.');const metadata={...old,caption:String(b.caption||'').slice(0,2000),credit:String(b.credit||'').slice(0,500),updatedAt:now()};const result=await db().prepare('UPDATE media SET name=?,alt=?,metadata=? WHERE id=? AND metadata=?').bind(String(b.name||row.name).slice(0,200),String(b.alt||'').slice(0,1000),JSON.stringify(metadata),b.id,row.metadata).run();if(!result.meta.changes)throw new HttpError(409,'Media details changed. Reload before saving.');await recordActivity(user.email,'media-metadata',b.id);return json({saved:true})}
 if(action==='media-delete'){owner();const row=await db().prepare('SELECT * FROM media WHERE id=?').bind(b.id).first<any>();if(!row)throw new HttpError(404,'Image not found.');const uses=await usages('/media/'+row.key);if(uses.length)throw new HttpError(422,'This image is still in use. Replace its references first.');await createBackup(user.email);await db().prepare('DELETE FROM media WHERE id=?').bind(b.id).run();
 // The backup above holds a copy of the file, so the original can go too.
 await bucket().delete(row.key);await recordActivity(user.email,'archive-media',row.name||b.id);return json({archived:true})}

 if(action==='media-replace'){owner();const from=String(b.from),to=String(b.to);if(!/^\/(assets|media)\//.test(from)||!/^\/media\//.test(to))throw new HttpError(422,'Choose an existing image and an uploaded replacement.');const target=await db().prepare('SELECT key FROM media WHERE key=?').bind(to.slice(7)).first();if(!target)throw new HttpError(422,'Upload the replacement image first.');const pubs=await allDocs(),records=await db().prepare('SELECT route,draft,revision FROM documents').all<any>(),drafts={...pubs};for(const r of records.results)drafts[r.route]={...JSON.parse(r.draft),revision:r.revision};const rewrite=(d:Doc)=>({...d,...(d.body?{body:d.body.split(`src="${from}"`).join(`src="${to}"`)}:{}),fields:d.fields.map(f=>({...f,value:f.value===from?to:f.value})),seo:{...d.seo,image:d.seo.image===from?to:d.seo.image},blocks:d.blocks?.map(x=>({...x,url:x.url===from?to:x.url}))});const touched=Object.values(drafts).filter(d=>JSON.stringify(rewrite(d))!==JSON.stringify(d)||(pubs[d.route]&&JSON.stringify(rewrite(pubs[d.route]))!==JSON.stringify(pubs[d.route])));const impact=touched.map(d=>({route:d.route,revision:d.revision}));const globalImpact=await settingsRead('global');if(JSON.stringify(globalImpact.value).includes(JSON.stringify(from)))impact.push({route:'@global',revision:globalImpact.revision});if(b.dryRun)return json({affected:impact});if(JSON.stringify(b.expected)!==JSON.stringify(impact))throw new HttpError(409,'Media usage changed. Review the replacement again.');const global=globalImpact;const text=JSON.stringify(global.value);const extra:D1PreparedStatement[]=[];if(text.includes(JSON.stringify(from))){const updated=JSON.parse(text.replaceAll(JSON.stringify(from),JSON.stringify(to))),guard=id();extra.push(db().prepare('INSERT INTO write_guards(id,valid) VALUES (?,CASE WHEN (SELECT revision FROM settings WHERE id=?)=? THEN 1 ELSE 0 END)').bind(guard,'global',global.revision),db().prepare('UPDATE settings SET value=?,revision=revision+1 WHERE id=?').bind(JSON.stringify(updated),'global'),db().prepare('DELETE FROM write_guards WHERE id=?').bind(guard))}await mutateMany(touched.map(d=>({before:d,draft:rewrite(d),published:pubs[d.route]?rewrite(pubs[d.route]):null})),user.email,'media-replace',extra);return json({updated:impact.length})}
 if(action==='form-delete'){owner();await db().prepare('DELETE FROM forms WHERE id=?').bind(b.id).run();await recordActivity(user.email,'delete-submission',b.id);return json({deleted:true})}
 return null;
}
```

### lib/avault/forms.ts

<!-- avault-file path="lib/avault/forms.ts" mode="owned" sha256="8d027095c4e53cc6384f1286474ede9062e5ef6dcbc390fb2224b7143f90e252" eol="1" -->
```ts
// Website forms editable from AVAULT → Forms (settings id `forms`). Two forms exist on the site:
//  • contact: the lead form in every page's footer (`form.audit-form`), which posts to /api/forms/submit
//  • hero: the one-field website form in homepage and service-page heroes (`form.hero-proposal`),
//    which hands the website to the contact form.
// Until a form is saved here, pages keep the markup they were built with. Once saved, the form's inner
// markup is regenerated from this definition on every page; the <form> tag itself (with its per-page
// data-service / data-review) is left alone. Pure functions only: the AVAULT preview imports this file.
export type FieldType='text'|'email'|'url'|'tel'|'textarea'|'select';
export type FormField={name:string;label:string;type:FieldType;placeholder:string;required:boolean;options:string[];width:'half'|'full'};
export type ContactForm={enabled:boolean;request:string;fields:FormField[];button:string;note:string};
export type HeroForm={enabled:boolean;label:string;placeholder:string;button:string};
export type CustomForm=ContactForm&{id:string;title:string};
export type FormsConfig={contact:ContactForm;hero:HeroForm;custom:CustomForm[]};
// The submit route, the footer script and the hero hand-off rely on these names.
export const CORE=['name','phone','zip','service'] as const;
export const BUILT_IN=['name','phone','email','zip','service','details'];
export const FIELD_TYPES:FieldType[]=['text','email','url','tel','textarea','select'];

const esc=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const ARROW='<svg class="cta-arrow" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13 5l7 7-7 7"/></svg>';
const AUTOCOMPLETE:Record<string,string>={name:'name',email:'email',phone:'tel',zip:'postal-code'};
const MAX:Record<FieldType,number>={text:200,email:200,url:300,tel:40,textarea:2000,select:0};

function control(f:FormField){
 const req=f.required?' required':'';
 if(f.type==='select')return `<select name="${esc(f.name)}"${req}><option value="" disabled selected>${esc(f.placeholder||'Choose an option')}</option>${f.options.map(o=>`<option>${esc(o)}</option>`).join('')}</select>`;
 if(f.type==='textarea')return `<textarea name="${esc(f.name)}" rows="4" maxlength="2000" placeholder="${esc(f.placeholder)}"${req}></textarea>`;
 const type=f.type==='url'?'text" inputmode="url':f.type;
 return `<input name="${esc(f.name)}" type="${type}"${AUTOCOMPLETE[f.name]?` autocomplete="${AUTOCOMPLETE[f.name]}"`:f.type==='tel'?' autocomplete="tel"':''}${req} maxlength="${MAX[f.type]}" placeholder="${esc(f.placeholder)}">`;
}
const field=(f:FormField)=>`<label>${esc(f.label)}<span class="gemini-field"><span class="field-orbit" aria-hidden="true"></span>${control(f)}</span></label>`;

export function contactFormInner(c:ContactForm){
 let out=`<input type="hidden" name="request" value="${esc(c.request)}">\n    <div class="form-grid">`;
 // Consecutive half-width fields sit side by side, as name and email do on the original form.
 for(let i=0;i<c.fields.length;i++){const f=c.fields[i],next=c.fields[i+1];
  if(f.width==='half'&&next?.width==='half'){out+=`<div class="field-pair">${field(f)}${field(next)}</div>\n    `;i++}else out+=field(f)+'\n    ';}
 return out+`</div><button class="button button--red" type="submit"><span class="button-label">${esc(c.button)}</span><span class="button-arrow" aria-hidden="true"><i class="fi fi-rs-arrow-up-right arrow-out" aria-hidden="true"></i><i class="fi fi-rs-arrow-up-right arrow-in" aria-hidden="true"></i></span></button><p class="form-note">${esc(c.note)}</p><p class="form-status" role="status" aria-live="polite"></p>`;
}
export const heroFormInner=(h:HeroForm)=>`<label><span>${esc(h.label)}</span><span class="gemini-field"><span class="field-orbit" aria-hidden="true"></span><input name="zip" type="text" inputmode="numeric" autocomplete="postal-code" placeholder="${esc(h.placeholder)}" required maxlength="10" aria-label="${esc(h.label)}"></span></label><button type="submit">${esc(h.button)} ${ARROW}</button><p class="hero-proposal-status" role="status" aria-live="polite"></p>`;

export function normalizeForms(v:any):FormsConfig{
 const c=v?.contact,h=v?.hero;
 return {contact:{enabled:!!c?.enabled,request:String(c?.request||''),button:String(c?.button||''),note:String(c?.note||''),fields:Array.isArray(c?.fields)?c.fields:[]},hero:{enabled:!!h?.enabled,label:String(h?.label||''),placeholder:String(h?.placeholder||''),button:String(h?.button||'')},custom:(Array.isArray(v?.custom)?v.custom:[]).map((f:any)=>({...f,id:String(f.id||''),title:String(f.title||''),enabled:f.enabled!==false,fields:Array.isArray(f.fields)?f.fields:[]}))};
}

// Validates an AVAULT save. Throws a plain Error with a reader-facing message.
export function validateForms(v:any):FormsConfig{
 const t=(s:unknown,max:number)=>String(s??'').replace(/[\r\n]+/g,' ').trim().slice(0,max);
 const c=v?.contact||{},h=v?.hero||{};
 const fields=(Array.isArray(c.fields)?c.fields:[]).slice(0,20).map((f:any):FormField=>{
  const type=FIELD_TYPES.includes(f?.type)?f.type:'text',name=String(f?.name||'');
  if(!/^(?:name|phone|email|zip|service|details|x_[a-z0-9_]{1,40})$/.test(name))throw new Error('Field names must be built-in or start with x_.');
  const label=t(f.label,120);if(!label)throw new Error('Every field needs a label.');
  const options=type==='select'?(Array.isArray(f.options)?f.options:[]).map((o:unknown)=>t(o,150)).filter(Boolean).slice(0,30):[];
  if(type==='select'&&!options.length)throw new Error(`Add at least one choice to "${label}".`);
  return {name,label,type:name==='email'?'email':name==='phone'?'tel':type,placeholder:t(f.placeholder,150),required:CORE.includes(name as any)?true:!!f.required,options,width:f.width==='half'?'half':'full'};
 });
 for(const core of CORE)if(!fields.some((f:FormField)=>f.name===core))throw new Error(`The ${core} field can't be removed; the site needs it to reply.`);
 if(new Set(fields.map((f:FormField)=>f.name)).size!==fields.length)throw new Error('Two fields share the same name.');
 const button=t(c.button,80),heroButton=t(h.button,80);if(!button)throw new Error('The form button needs text.');if(h.enabled&&!heroButton)throw new Error('The quick form button needs text.');
 const custom:CustomForm[]=(Array.isArray(v?.custom)?v.custom:[]).slice(0,20).map((form:any):CustomForm=>{const id=t(form.id,60);if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))throw new Error('Custom form IDs use lowercase letters, numbers and hyphens.');const title=t(form.title,100);if(!title)throw new Error('Every custom form needs a title.');const customFields:FormField[]=(Array.isArray(form.fields)?form.fields:[]).slice(0,20).map((f:any):FormField=>{const name=String(f?.name||''),type=FIELD_TYPES.includes(f?.type)?f.type:'text';if(!/^(?:name|phone|email|zip|service|details|x_[a-z0-9_]{1,40})$/.test(name))throw new Error(`Invalid field in ${title}.`);return {name,label:t(f.label,120),type,placeholder:t(f.placeholder,150),required:!!f.required,options:type==='select'?(Array.isArray(f.options)?f.options:[]).map((o:unknown)=>t(o,150)).filter(Boolean).slice(0,30):[],width:f.width==='half'?'half':'full'}});for(const core of CORE)if(!customFields.some((f:FormField)=>f.name===core))throw new Error(`${title} needs the ${core} field.`);return {id,title,enabled:form.enabled!==false,request:t(form.request,120),fields:customFields,button:t(form.button,80),note:t(form.note,240)}});if(new Set(custom.map((f:CustomForm)=>f.id)).size!==custom.length)throw new Error('Custom form IDs must be unique.');
 return {contact:{enabled:true,request:t(c.request,120),fields,button,note:t(c.note,240)},hero:{enabled:!!h.enabled,label:t(h.label,120),placeholder:t(h.placeholder,150),button:heroButton},custom};
}

// Rewrites saved forms into a rendered page.
export function applyForms(html:string,v:any){const f=normalizeForms(v);
 if(f.contact.enabled)html=html.replace(/(<form\b[^>]*class="[^"]*\baudit-form\b[^"]*"[^>]*>)[\s\S]*?<\/form>/g,(_,open)=>open+contactFormInner(f.contact)+'</form>');
 if(f.hero.enabled)html=html.replace(/(<form\b[^>]*class="[^"]*\bhero-proposal\b[^"]*"[^>]*>)[\s\S]*?<\/form>/g,(_,open)=>open+heroFormInner(f.hero)+'</form>');
 for(const form of f.custom.filter(x=>x.enabled))html=html.replace(new RegExp(`(<form\\b[^>]*data-avault-form=["']${form.id}["'][^>]*>)[\\s\\S]*?<\\/form>`,'g'),(_,open)=>open+contactFormInner(form)+'</form>');
 return html;
}

// Values sent for added (x_) fields, keyed by their label, for the lead record and email.
export function extraValues(b:Record<string,unknown>,v:any){const f=normalizeForms(v);if(!f.contact.enabled)return {};const selected=f.custom.find(x=>x.enabled&&x.request===String(b.request||''))||f.contact,out:Record<string,string>={};
 for(const field of selected.fields.filter(x=>x.name.startsWith('x_'))){const value=String(b[field.name]??'').trim().slice(0,2000);if(field.required&&!value)throw new Error(`Please fill in "${field.label}".`);if(field.type==='select'&&value&&!field.options.includes(value))throw new Error(`Choose a listed option for "${field.label}".`);if(value)out[field.label]=value}
 return out;
}
```

### lib/avault/geo.ts

<!-- avault-file path="lib/avault/geo.ts" mode="owned" sha256="b9869eb4c08d537e137f8bb866f73bb03cf79eb78b7ef2cba1b4968352a495d7" eol="1" -->
```ts
import fs from 'node:fs';
import path from 'node:path';
import {Reader,type Response} from 'mmdb-lib';

// Visitor country without Cloudflare: an offline IP→country database (ip-location-db
// "geo-whois-asn-country", CC0, with NRO statistics under CC BY 4.0) read in memory. No outside requests.
// A Cloudflare country header still wins when present. Updating the npm package refreshes the data.
type Row=Response&{country_code?:string};
const g=globalThis as typeof globalThis&{__avaultGeo?:Reader<Row>|null};
function reader(){
 if(g.__avaultGeo!==undefined)return g.__avaultGeo;
 try{g.__avaultGeo=new Reader<Row>(fs.readFileSync(path.join(process.cwd(),'node_modules/@ip-location-db/geo-whois-asn-country-mmdb/geo-whois-asn-country.mmdb')))}
 catch{console.error('AVAULT: the IP country database is unavailable; country rules are skipped.');g.__avaultGeo=null}
 return g.__avaultGeo;
}
export function countryOfIp(ip:string){const v=ip.replace(/^::ffff:/,'');if(!v||v==='unknown')return '';try{return reader()?.get(v)?.country_code?.toUpperCase()||''}catch{return ''}}
export const countryOf=(req:Request,ip:string)=>(req.headers.get('cf-ipcountry')||'').toUpperCase().replace(/^XX$/,'')||countryOfIp(ip);

// Visits, calls and leads recorded before country lookup existed get their country filled in, a batch at a
// time, by the scheduled maintenance run.
export async function backfillCountries(limit=5000){
 const {mongoDb}=await import('@/db/mongo');const db=await mongoDb();let done=0;
 for(const name of ['events','forms']){
  const rows=await db.collection(name).find({$or:[{country:{$exists:false}},{country:''}],ip:{$nin:['','unknown',null]}},{projection:{_id:1,ip:1}}).limit(limit).toArray();
  const ops=rows.map(r=>({updateOne:{filter:{_id:r._id},update:{$set:{country:countryOfIp(String(r.ip))||'-'}}}}));
  if(ops.length){await db.collection(name).bulkWrite(ops,{ordered:false});done+=ops.length}
 }
 return done;
}
// '-' marks "looked up, no country found" so the row isn't retried; it reads as unknown everywhere.
export const countryLabel=(c?:string|null)=>c&&c!=='-'?c:'';
```

### lib/avault/icon-fix.ts

<!-- avault-file path="lib/avault/icon-fix.ts" mode="owned" sha256="9a68d20e4e7abc5cab16d73377d2dc28922a6a8a6a24e515afd7d805650106f4" eol="1" -->
```ts
// Simple Icons removed Microsoft's logos (Bing, Copilot) after v12, so pages saved with those CDN links
// show a broken image. Local copies live in /public/assets. render() swaps them on the fly, and the
// scheduled maintenance run rewrites saved pages once so AVAULT (Media, editor, "Where used") agrees.
const LEGACY_ICON=/https:\/\/cdn\.jsdelivr\.net\/npm\/simple-icons@[^/"\\]+\/icons\/microsoft(bing|copilot)\.svg/g;
export const fixIcons=(s:string)=>s.replace(LEGACY_ICON,(_,name)=>`/assets/microsoft-${name}-mark.svg`);

export async function migrateLegacyIcons(){
 const {mongoDb}=await import('@/db/mongo');const db=await mongoDb();
 const rx={$regex:'cdn\\.jsdelivr\\.net/npm/simple-icons@[^/]+/icons/microsoft(bing|copilot)\\.svg'};
 const rows=await db.collection('documents').find({$or:[{draft:rx},{published:rx}]},{projection:{_id:1,route:1,draft:1,published:1}}).toArray();
 for(const r of rows)await db.collection('documents').updateOne({_id:r._id},{$set:{draft:fixIcons(String(r.draft||'')),...(r.published?{published:fixIcons(String(r.published))}:{})}});
 if(rows.length){const {recordActivity}=await import('./operations');await recordActivity('scheduled-job','media-replace',`Microsoft logos on ${rows.map(r=>r.route).join(', ')}`)}
 return rows.length;
}
```

### lib/avault/ip.ts

<!-- avault-file path="lib/avault/ip.ts" mode="owned" sha256="7e9308709c51df57fab10c9c9db92fbe34448a202fdcaf0278709a55a324d618" eol="1" -->
```ts
// IPv4 and IPv6 addresses and CIDR ranges. Shared by the traffic rules on the server and the Traffic access screen,
// so both agree on what a rule matches. IPv4-mapped IPv6 addresses (::ffff:203.0.113.7) count as IPv4.
type Address={bits:32|128;value:bigint};
const ZERO=BigInt(0),B16=BigInt(16),B32=BigInt(32),FFFF=BigInt(0xffff),V4MASK=BigInt(0xffffffff);

function v4(s:string):bigint|null{const p=s.split('.');if(p.length!==4||!p.every(x=>/^\d{1,3}$/.test(x)&&+x<=255))return null;return p.reduce((n,x)=>n*BigInt(256)+BigInt(x),ZERO)}

function v6(s:string):bigint|null{
 if(!/^[0-9a-f:.]+$/i.test(s)||s.split('::').length>2)return null;
 // A dotted IPv4 tail (::ffff:1.2.3.4) becomes the last two hex groups.
 if(s.includes('.')){const at=s.lastIndexOf(':');const four=v4(s.slice(at+1));if(four===null)return null;s=s.slice(0,at+1)+(four>>B16).toString(16)+':'+(four&FFFF).toString(16)}
 const [head,tail]=s.split('::');const groups=(x:string)=>x?x.split(':'):[];
 const h=groups(head),t=tail===undefined?[]:groups(tail);
 if([...h,...t].some(g=>!/^[0-9a-f]{1,4}$/i.test(g)))return null;
 const fill=tail===undefined?0:8-h.length-t.length;
 if(tail===undefined?h.length!==8:fill<1)return null;
 return [...h,...Array(fill).fill('0'),...t].reduce((n,g)=>n*BigInt(65536)+BigInt(parseInt(g,16)),ZERO);
}

export function parseIp(raw:string):Address|null{
 const s=String(raw||'').trim().replace(/%.*$/,'');
 const four=v4(s);if(four!==null)return {bits:32,value:four};
 const six=v6(s);if(six===null)return null;
 if(six>>B32===FFFF)return {bits:32,value:six&V4MASK};
 return {bits:128,value:six};
}

function parseRange(range:string){
 const [address,prefix]=String(range||'').trim().split('/');const a=parseIp(address);if(!a)return null;
 if(prefix!==undefined&&!/^\d{1,3}$/.test(prefix))return null;
 const n=prefix===undefined?a.bits:Number(prefix);if(n>a.bits)return null;
 return {...a,prefix:n};
}

/** An address or CIDR range a traffic rule can hold: 203.0.113.7, 203.0.113.0/24, 2001:db8::1 or 2001:db8::/32. */
export const isIpRange=(range:string)=>parseRange(range)!==null;

export function matchesIP(ip:string,range:string){
 const a=parseIp(ip),r=parseRange(range);if(!a||!r||a.bits!==r.bits)return false;
 const shift=BigInt(r.bits-r.prefix);return a.value>>shift===r.value>>shift;
}
```

### lib/avault/lead-email.ts

<!-- avault-file path="lib/avault/lead-email.ts" mode="owned" sha256="777d3a2f83bf72fdb2bd8d5f59e99cc912bc76b43292cc8ebf7e3d38453c91cf" eol="1" -->
```ts
import {CONFIG} from './config';
import {esc} from './store';
import {describeAgent} from './agent';
export {describeAgent};

// Lead notification email styled to match the DMV Commercial Door Repair website.
// Email clients ignore external CSS and strip <style> unevenly, so everything is inline and table-based.
const BLUE='#173b63',RED='#c62828',YELLOW='#e4a11b',GREEN='#2e7d32',INK='#172033',MUTED='#5b6472',LINE='#dfe5ec';
const FONT=`'Google Sans','Google Sans Flex',Inter,Roboto,Arial,sans-serif`;
export type LeadRecord={id:string;value:Record<string,unknown>;ip?:string;user_agent?:string;language?:string;country?:string;created_at?:string;fill_seconds?:number;spam?:string;previous?:number};

const when=(iso?:string)=>{const d=iso?new Date(iso):new Date();return d.toLocaleString('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'})+' ET'};
const duration=(s?:number)=>!s||s<0?'':s<60?`${Math.round(s)} sec`:s<3600?`${Math.floor(s/60)} min ${Math.round(s%60)} sec`:'Over an hour';
const str=(v:unknown)=>String(v??'').trim();
const ask=(r:string)=>{const s=(r||'door repair estimate').replace(/^(.)/,c=>c.toLowerCase());return /^(a|an|the|my|our)\s/.test(s)?s:(/^[aeiou]/.test(s)?'an ':'a ')+s};

function rows(f:Record<string,unknown>,r:LeadRecord){
 const utm=[f.utm_source,f.utm_medium,f.utm_campaign,f.utm_term,f.utm_content].map(str).filter(Boolean).join(' / ');
 return {
  request:[['Name',str(f.name)],['Phone',str(f.phone)],['Email',str(f.email)],['Business ZIP',str(f.zip)],['Service',str(f.service)],['Details',str(f.details)],['Request',str(f.request)],...Object.entries((f.extra||{}) as Record<string,unknown>).map(([k,v])=>[k,str(v)])],
  visit:[['Submitted',when(r.created_at)],['Page',str(f.page)],['Referrer',str(f.referrer)||'Direct / none'],['Campaign (UTM)',utm],['Time on page before sending',duration(r.fill_seconds)]],
  sender:[['IP address',str(r.ip)],['Country',str(r.country)],['Device',describeAgent(r.user_agent)],['Language',str(r.language).split(',')[0]],['Spam check',str(r.spam)],['Earlier requests from this contact',r.previous?String(r.previous):'None — first request'],['Lead ID',r.id],['User agent',str(r.user_agent)]],
 } as Record<string,string[][]>;
}

export function leadText(r:LeadRecord){const f=r.value,g=rows(f,r);
 const block=(title:string,list:string[][])=>title.toUpperCase()+'\n'+list.filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join('\n');
 return ['New door repair request from '+str(f.name),'',block('Request',g.request),'',block('Visit',g.visit),'',block('Sender',g.sender),'',`Open in AVAULT: ${CONFIG.origin}/avault?view=leads`].join('\n');
}

const link=(v:string)=>/^https?:\/\//.test(v)?`<a href="${esc(v)}" style="color:${BLUE};text-decoration:none;word-break:break-all">${esc(v)}</a>`:/^[^\s@]+@[^\s@]+$/.test(v)?`<a href="mailto:${esc(v)}" style="color:${BLUE};text-decoration:none">${esc(v)}</a>`:/^\+?[\d().\s-]{7,}$/.test(v)?`<a href="tel:${esc(v.replace(/[^+\d]/g,''))}" style="color:${BLUE};text-decoration:none">${esc(v)}</a>`:esc(v);
function card(title:string,accent:string,list:string[][]){
 const body=list.filter(([,v])=>v).map(([k,v],i)=>`<tr><td style="padding:12px 0;${i?`border-top:1px solid ${LINE};`:''}font:500 13px/1.4 ${FONT};color:${MUTED};width:38%;vertical-align:top">${esc(k)}</td><td style="padding:12px 0;${i?`border-top:1px solid ${LINE};`:''}font:500 15px/1.45 ${FONT};color:${INK};vertical-align:top;word-break:break-word">${link(v)}</td></tr>`).join('');
 return `<tr><td style="padding:0 0 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;border:1px solid ${LINE};border-radius:20px;border-collapse:separate"><tr><td style="padding:22px 26px 10px"><p style="margin:0 0 6px;font:600 12px/1 ${FONT};letter-spacing:.12em;text-transform:uppercase;color:${MUTED}"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${accent};margin-right:8px;vertical-align:1px"></span>${esc(title)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${body}</table></td></tr></table></td></tr>`;
}
const wordmark=`<table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="padding-right:12px;vertical-align:middle"><img src="${CONFIG.origin}/assets/logo.png" width="44" height="37" alt="" style="display:block;border:0;width:44px;height:37px"></td><td style="vertical-align:middle"><div style="font:800 22px/1 ${FONT};letter-spacing:-.04em;color:${INK};white-space:nowrap">DMV DOOR REPAIR</div><div style="margin-top:6px;font:600 8px/1 ${FONT};letter-spacing:.14em;color:#34363b;white-space:nowrap">D.C. <span style="color:${RED}">&#8226;</span> MARYLAND <span style="color:${RED}">&#8226;</span> VIRGINIA</div></td></tr></table>`;
const rule=`<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>${[BLUE,RED,YELLOW,GREEN].map(c=>`<td style="height:6px;line-height:6px;font-size:0;background:${c}">&nbsp;</td>`).join('')}</tr></table>`;
const button=(href:string,label:string,bg:string,color='#ffffff',border=bg)=>`<a href="${esc(href)}" style="display:inline-block;padding:13px 24px;margin:0 8px 8px 0;border-radius:999px;background:${bg};border:1px solid ${border};color:${color};font:600 15px/1 ${FONT};text-decoration:none">${esc(label)}</a>`;

export function leadHtml(r:LeadRecord){const f=r.value,g=rows(f,r),name=str(f.name)||'A visitor',email=str(f.email),phone=str(f.phone),details=str(f.details);
 const reply=email?`mailto:${email}?subject=${encodeURIComponent('Your '+(str(f.service)||str(f.request)||'door repair')+' request — DMV Commercial Door Repair')}`:'';
 const call=phone?`tel:${phone.replace(/[^+\d]/g,'')}`:'';
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>New door repair request</title></head>
<body style="margin:0;padding:0;background:#f5f7fa">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(name)} requested ${esc(str(f.service)||str(f.request)||'a door repair estimate')}.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fa"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px">
<tr><td style="padding:0 4px 20px"><a href="${CONFIG.origin}/" style="text-decoration:none">${wordmark}</a></td></tr>
<tr><td style="padding:0 0 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;border:1px solid ${LINE};border-radius:24px;border-collapse:separate;overflow:hidden">
<tr><td>${rule}</td></tr>
<tr><td style="padding:30px 28px 26px">
<p style="margin:0 0 14px;font:600 13px/1 ${FONT};color:${MUTED}"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${GREEN};margin-right:8px;vertical-align:1px"></span>New estimate request</p>
<h1 style="margin:0 0 10px;font:700 34px/1.12 ${FONT};letter-spacing:-.03em;color:${INK}">${esc(name)} <span style="color:${BLUE}">needs ${esc(ask(str(f.service)||str(f.request)))}.</span></h1>
${details?`<p style="margin:0 0 22px;font:400 16px/1.55 ${FONT};color:${MUTED}">Door details: <strong style="color:${INK};font-weight:600">${esc(details)}</strong></p>`:'<div style="height:12px"></div>'}
${reply?button(reply,'Reply to '+name.split(' ')[0],BLUE):''}${call?button(call,'Call '+name.split(' ')[0],RED):''}${button(CONFIG.origin+'/avault?view=leads','Open in AVAULT','#ffffff',INK,'#dadce0')}
</td></tr></table></td></tr>
${card('Request',BLUE,g.request)}${card('Visit',RED,g.visit)}${card('Sender',GREEN,g.sender)}
<tr><td style="padding:8px 4px 0;font:400 12px/1.6 ${FONT};color:${MUTED}">Sent by the ${esc(CONFIG.name)} website at ${esc(CONFIG.origin.replace(/^https?:\/\//,''))}. This lead is also saved in AVAULT → Leads.</td></tr>
</table></td></tr></table></body></html>`;
}
```

### lib/avault/media.ts

<!-- avault-file path="lib/avault/media.ts" mode="owned" sha256="9d80a4240db777c0f1446a3a22160b384954c42c53690ffe1d0038b296830a6b" eol="1" -->
```ts
import {HttpError,db,allDocs,Doc} from './store';
export function imageInfo(b:Uint8Array){const v=new DataView(b.buffer,b.byteOffset,b.byteLength);let width=0,height=0;try{if(b[0]===137&&b.length>=24){width=v.getUint32(16);height=v.getUint32(20)}else if(b[0]===255&&b[1]===216){let offset=2;while(offset+9<b.length){if(b[offset]!==255){offset++;continue}const marker=b[offset+1],length=v.getUint16(offset+2);if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){height=v.getUint16(offset+5);width=v.getUint16(offset+7);break}if(length<2)break;offset+=length+2}}else{const code=new TextDecoder().decode(b.slice(12,16));if(code==='VP8X'){width=1+b[24]+(b[25]<<8)+(b[26]<<16);height=1+b[27]+(b[28]<<8)+(b[29]<<16)}else if(code==='VP8 '){width=v.getUint16(26,true)&0x3fff;height=v.getUint16(28,true)&0x3fff}else if(code==='VP8L'){width=1+b[21]+((b[22]&63)<<8);height=1+(b[22]>>6)+(b[23]<<2)+((b[24]&15)<<10)}}}catch{}if(!width||!height||width>30000||height>30000||width*height>100000000)throw new HttpError(422,'The image is invalid or exceeds 100 megapixels.');return {width,height}}
export async function mediaDocs(){const published=await allDocs(),drafts={...published};for(const r of (await db().prepare('SELECT route,draft,revision FROM documents').all<any>()).results)drafts[r.route]={...JSON.parse(r.draft),revision:r.revision};return {published,drafts}}
export function uses(d:Doc,url:string){return d.fields.some(f=>f.value===url)||d.seo.image===url||d.blocks?.some(b=>b.url===url)||!!d.body?.includes(`src="${url}"`)}
export async function usages(url:string){const {published,drafts}=await mediaDocs();const entries=[];for(const [state,docs] of [['published',published],['draft',drafts]] as const)for(const d of Object.values(docs)){for(const f of d.fields.filter(f=>f.value===url))entries.push({route:d.route,label:d.label,state,field:f.key,section:f.section,group:f.group||'',revision:d.revision});if(d.seo.image===url)entries.push({route:d.route,label:d.label,state,field:'seo.image',section:'Social image',revision:d.revision});for(const b of d.blocks||[])if(b.url===url)entries.push({route:d.route,label:d.label,state,field:'block:'+b.id,section:'Content block',revision:d.revision});if(d.body?.includes(`src="${url}"`))entries.push({route:d.route,label:d.label,state,field:'body',section:'Article body',revision:d.revision})}const global=await db().prepare('SELECT value FROM settings WHERE id=?').bind('global').first<any>();if(global&&JSON.stringify(JSON.parse(global.value)).includes(JSON.stringify(url)))entries.push({route:'@global',state:'published',field:'settings',section:'Global identity/navigation',revision:0});return entries}
```

### lib/avault/nav-canvas.ts

<!-- avault-file path="lib/avault/nav-canvas.ts" mode="owned" sha256="d73200e0d1b13fd2b29283628d6737af9985eb44812b86aa8b7867d811bb68ce" eol="1" -->
```ts
// The shared header and footer as the AVAULT visual editor draws them. Placeholders ({{fN}}) stay in place
// and every editable spot is tagged: `data-av-k="fN"` on an element whose text is field fN, and
// `data-av-a="href=f3,aria-label=f4"` on an element whose attributes are fields. Scripts are dropped.
export type NavCanvas={styles:string[];header:string;footer:string;bodyAttrs:string};

export function tagFields(html:string){
 const parts=html.split(/(<[^>]+>)/);
 for(let i=0;i<parts.length;i++){const p=parts[i];
  if(p.startsWith('<')){
   if(p.startsWith('</')||p.startsWith('<!'))continue;
   const attrs=[...p.matchAll(/\s([a-zA-Z-]+)="\{\{(f\d+)\}\}"/g)].map(m=>m[1]+'='+m[2]);
   if(attrs.length)parts[i]=p.replace(/\s*(\/?)>$/,` data-av-a="${attrs.join(',')}"$1>`);
   continue;
  }
  if(!p.includes('{{'))continue;
  // A placeholder that is an element's whole content tags that element; anything else gets its own span.
  const sole=p.match(/^\{\{(f\d+)\}\}$/),open=parts[i-1]||'',name=open.match(/^<([a-zA-Z0-9]+)/)?.[1];
  if(sole&&name&&!open.startsWith('</')&&(parts[i+1]||'').toLowerCase()===`</${name.toLowerCase()}>`){parts[i-1]=parts[i-1].replace(/\s*(\/?)>$/,` data-av-k="${sole[1]}"$1>`);continue}
  parts[i]=p.replace(/\{\{(f\d+)\}\}/g,'<span data-av-k="$1" data-av-wrap>{{$1}}</span>');
 }
 return parts.join('');
}

export function navCanvas(template:string):NavCanvas{
 const styles=[...template.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)].map(m=>m[0].match(/href="([^"]+)"/)?.[1]||'').filter(Boolean);
 const bodyAttrs=template.match(/<body\b([^>]*)>/)?.[1]||'';
 const start=template.search(/<div class="header-wrap">|<header\b/),headerEnd=template.indexOf('</header>');
 let header=start>=0&&headerEnd>start?template.slice(start,headerEnd+9):'';
 if(header.startsWith('<div class="header-wrap">'))header+='</div>';
 const mainEnd=template.indexOf('</main>'),footerEnd=template.lastIndexOf('</footer>');
 const footer=mainEnd>=0&&footerEnd>mainEnd?template.slice(mainEnd+7,footerEnd+9):'';
 const clean=(s:string)=>s.replace(/<script\b[\s\S]*?<\/script>/gi,'');
 return {styles,header:tagFields(clean(header)),footer:tagFields(clean(footer)),bodyAttrs};
}
```

### lib/avault/operations.ts

<!-- avault-file path="lib/avault/operations.ts" mode="owned" sha256="e6c05652975c10c692ae1c44c4d2d2e8e12858cd54dbd51061bb2a0f6c45165e" eol="1" -->
```ts
import {db,now,id,readDoc,allDocs,Doc,HttpError} from './store';
import {CONFIG} from './config';
export function routePath(value:unknown){const s=String(value);if(!/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)+$/.test(s)||s.length>250||/^\/(avault|api|assets|media)\//.test(s))throw new HttpError(422,'Use a lowercase public URL with a trailing slash.');return s}
export async function recordActivity(actor:string,action:string,entity:string){await db().prepare('INSERT INTO activity(id,actor,action,entity,created_at) VALUES (?,?,?,?,?)').bind(id(),actor,action,entity,now()).run()}
export async function mutateMany(changes:{before:Doc;draft:Doc;published:Doc|null}[],actor:string,action:string,extra:D1PreparedStatement[]=[]){const stamp=now();const stmts:D1PreparedStatement[]=[];for(const c of changes){const key=c.before.route,op=id(),rev=id();stmts.push(db().prepare('INSERT OR IGNORE INTO documents(id,route,draft,published,revision,updated_at) VALUES (?,?,?,?,0,?)').bind(key,key,JSON.stringify(c.before),c.published?JSON.stringify(c.before):null,stamp));stmts.push(db().prepare('INSERT INTO write_guards(id,valid) VALUES (?,CASE WHEN (SELECT revision FROM documents WHERE route=?)=? THEN 1 ELSE 0 END)').bind(op,key,c.before.revision));const draft={...c.draft,revision:c.before.revision+1,updatedAt:stamp};const published=c.published?{...c.published,revision:c.before.revision+1,updatedAt:stamp}:null;stmts.push(db().prepare('INSERT INTO revisions(id,document_id,before,after,actor,state,created_at) VALUES (?,?,?,?,?,?,?)').bind(rev,key,JSON.stringify(c.before),JSON.stringify(draft),actor,'applied',stamp));stmts.push(db().prepare('UPDATE documents SET draft=?,published=?,revision=revision+1,updated_at=? WHERE route=?').bind(JSON.stringify(draft),published?JSON.stringify(published):null,stamp,key));stmts.push(db().prepare('DELETE FROM write_guards WHERE id=?').bind(op));}stmts.push(...extra,db().prepare('INSERT INTO activity(id,actor,action,entity,created_at) VALUES(?,?,?,?,?)').bind(id(),actor,action,changes.map(c=>c.before.route).join(',').slice(0,2000),stamp));try{await db().batch(stmts)}catch(e){if(/valid_write|UNIQUE constraint|E11000/.test(String(e)))throw new HttpError(409,'Content changed or a URL was taken. No changes were applied. Reload the impact report.');throw e}}
function remap(value:string,from:string,to:string){if(value===from||value.startsWith(from+'#')||value.startsWith(from+'?'))return to+value.slice(from.length);if(value===CONFIG.origin+from||value.startsWith(CONFIG.origin+from+'#'))return CONFIG.origin+to+value.slice((CONFIG.origin+from).length);return value}
function rewrite(d:Doc,from:string,to:string){const copy=structuredClone(d);copy.fields=copy.fields.map(f=>({...f,value:f.kind==='url'?remap(f.value,from,to):f.value}));if(copy.body)copy.body=copy.body.replace(/href="([^"]*)"/g,(m,h)=>`href="${remap(h.replace(/&amp;/g,'&'),from,to).replace(/&/g,'&amp;')}"`);copy.blocks=copy.blocks?.map(b=>({...b,url:b.url?remap(b.url,from,to):b.url,text:b.text?.replaceAll(']('+from+')',']('+to+')').replaceAll(']('+from+' "',']('+to+' "')}));return copy}
export async function renameImpact(from:string,to:string){const registry=await allDocs();if(from==='/'||!registry[from])throw new HttpError(422,'Choose a published page other than the homepage.');routePath(to);if(await readDoc(to,true)||await db().prepare('SELECT source FROM redirects WHERE source=?').bind(to).first())throw new HttpError(409,'The new URL is already in use.');const rows=await db().prepare('SELECT route,draft,published,revision FROM documents').all<any>();const drafts={...registry};for(const r of rows.results)drafts[r.route]={...JSON.parse(r.draft),revision:r.revision};return {from,to,affected:Object.values(drafts).filter(d=>d.route===from||JSON.stringify(rewrite(d,from,to))!==JSON.stringify(d)||registry[d.route]&&JSON.stringify(rewrite(registry[d.route],from,to))!==JSON.stringify(registry[d.route])).map(d=>({route:d.route,revision:d.revision})),registry,drafts};}
export async function renamePage(from:string,to:string,expected:{route:string;revision:number}[],actor:string){const impact=await renameImpact(from,to);if(JSON.stringify(impact.affected)!==JSON.stringify(expected))throw new HttpError(409,'The impact changed. Review it again.');const original=impact.registry[from],draft=impact.drafts[from];const changes=impact.affected.map(a=>({before:impact.drafts[a.route],draft:rewrite(impact.drafts[a.route],from,to),published:a.route===from?null:impact.registry[a.route]?rewrite(impact.registry[a.route],from,to):null}));const move=(d:Doc)=>({...rewrite(d,from,to),templateRoute:d.templateRoute||from,route:to,seo:{...d.seo,canonical:CONFIG.origin+to},revision:1,updatedAt:now()});const menus=await db().prepare('SELECT value,revision FROM settings WHERE id=?').bind('menus').first<any>();const g=await db().prepare('SELECT value,revision FROM settings WHERE id=?').bind('global').first<any>();const extras=[db().prepare('INSERT INTO documents(id,route,draft,published,revision,updated_at) VALUES (?,?,?,?,1,?)').bind(to,to,JSON.stringify(move(draft)),JSON.stringify(move(original)),now()),db().prepare('INSERT INTO redirects(source,destination,status) VALUES (?,?,308)').bind(from,to),db().prepare('UPDATE redirects SET destination=? WHERE destination=?').bind(to,from)];if(g){const value=JSON.parse(g.value);if(value.navigation)for(const k in value.navigation)value.navigation[k]=remap(value.navigation[k],from,to);if(value.menus)for(const list of Object.values(value.menus) as any[])for(const item of list)item.url=remap(item.url,from,to);const guard=id();extras.push(db().prepare('INSERT INTO write_guards(id,valid) VALUES (?,CASE WHEN (SELECT revision FROM settings WHERE id=?)=? THEN 1 ELSE 0 END)').bind(guard,'global',g.revision),db().prepare('UPDATE settings SET value=?,revision=revision+1 WHERE id=?').bind(JSON.stringify(value),'global'),db().prepare('DELETE FROM write_guards WHERE id=?').bind(guard))}if(menus){const value=JSON.parse(menus.value);for(const list of Object.values(value) as any[])for(const item of list)item.url=remap(item.url,from,to);const guard=id();extras.push(db().prepare('INSERT INTO write_guards(id,valid) VALUES (?,CASE WHEN (SELECT revision FROM settings WHERE id=?)=? THEN 1 ELSE 0 END)').bind(guard,'menus',menus.revision),db().prepare('UPDATE settings SET value=?,revision=revision+1 WHERE id=?').bind(JSON.stringify(value),'menus'),db().prepare('DELETE FROM write_guards WHERE id=?').bind(guard))}await mutateMany(changes,actor,'rename',extras);return {route:to}}
```

### lib/avault/public-controls.ts

<!-- avault-file path="lib/avault/public-controls.ts" mode="owned" sha256="a7f49165a93c2188ff045e8eaaf88e084556c52268ec31831cf96cae7ce5a1c3" eol="1" -->
```ts
import {settingsRead} from './runtime';
import {esc,allDocs,db,clientIp} from './store';
import {HONEYPOT} from './spam';
import {applyForms} from './forms';
import {countryOf} from './geo';
import {normalizeScripts,pageMatches,renderSnippet} from './snippets';
import {matchesIP} from './ip';
export {matchesIP};
export async function trafficAllowed(req:Request){const c=(await settingsRead('traffic')).value;if(!c.enabled)return true;const ip=clientIp(req),country=countryOf(req,ip);if(c.allow?.some((r:string)=>matchesIP(ip,r)))return true;if(c.deny?.some((r:string)=>matchesIP(ip,r)))return false;return !country||!c.countries?.includes(country)}
export async function enhancePublic(html:string,route:string){const configs=await Promise.all(['verification','scripts','operations','menus','forms'].map(settingsRead));const [verification,scripts,operations,menus,forms]=configs.map(c=>c.value);const nonce=crypto.randomUUID().replaceAll('-','');
 const mediaSizes=new Map((await db().prepare('SELECT key,metadata FROM media').all<any>()).results.map(m=>['/media/'+m.key,JSON.parse(m.metadata||'{}')]));html=html.replace(/<img\b[^>]*>/g,tag=>{const src=tag.match(/src="([^"]+)"/)?.[1];const size=mediaSizes.get(src||'');if(!size?.width||!size?.height)return tag;return tag.replace(/\s(?:width|height)="[^"]*"/g,'').replace('<img',`<img width="${size.width}" height="${size.height}"`)});let head='';for(const [k,name] of [['google','google-site-verification'],['bing','msvalidate.01']])if(verification[k])head+=`<meta name="${name}" content="${esc(verification[k])}">`;
 // Decide before first paint whether this tab has already played the branded intro. The deferred module
 // reuses window.showSiteLoader instead of re-reading the value after this bootstrap sets it.
 head=`<script nonce="${nonce}">(function(d){var show=true;try{show=sessionStorage.getItem('dmv.introPlayed')!=='1';if(show)sessionStorage.setItem('dmv.introPlayed','1')}catch(e){}window.showSiteLoader=show;d.documentElement.classList.toggle('is-loading',show);d.documentElement.classList.toggle('intro-complete',!show)})(document)</script>`+head;
 // Custom scripts: each enabled snippet for this page, in its chosen place (lib/avault/snippets.ts).
 const live=scripts.enabled?normalizeScripts(scripts).snippets.filter(s=>s.enabled&&s.code.trim()&&pageMatches(s.pages,route)):[];
 const at=(p:string)=>live.filter(s=>s.placement===p).map(s=>renderSnippet(s,nonce)).join('');
 head+=at('head');if(live.length){html=html.replace(/(<body\b[^>]*>)/,m=>m+at('bodyStart'));html=html.replace('</body>',()=>at('bodyEnd')+'</body>')}
 if(operations.analytics!==false)head+='<script src="/avault-analytics.js" defer></script>';
 const renderMenu=(name:string)=>{const items=(menus[name]||[]).filter((i:any)=>i.enabled);const item=(i:any)=>`<li><a href="${esc(i.url)}"${i.newTab?' target="_blank" rel="noopener noreferrer"':''}>${esc(i.label)}</a>${items.some((x:any)=>x.parent===i.id)?'<ul>'+items.filter((x:any)=>x.parent===i.id).map((x:any)=>`<li><a href="${esc(x.url)}">${esc(x.label)}</a></li>`).join('')+'</ul>':''}</li>`;return items.length?`<nav class="avault-menu avault-menu-${name}" aria-label="${name} links"><ul>${items.filter((i:any)=>!i.parent||!items.some((x:any)=>x.id===i.parent)).map(item).join('')}</ul></nav>`:''};
 // Additional menus preserve the site's existing mega menu and its interactions.
 html=html.replace('</header>',renderMenu('header')+renderMenu('mobile')+'</header>').replace('</footer>',renderMenu('footer')+renderMenu('utility')+'</footer>');
 // Forms saved in AVAULT → Forms replace the built-in markup before the honeypot goes in.
 html=applyForms(html,forms);
 // Lead forms get a hidden honeypot field. People never see or reach it; form bots fill it in.
 html=html.replace(/<form\b[^>]*class="[^"]*\baudit-form\b[^"]*"[^>]*>/g,tag=>tag+`<div class="av-hp" aria-hidden="true"><label>Leave this field empty<input type="text" name="${HONEYPOT}" tabindex="-1" autocomplete="off" value=""></label></div>`);
 // Every page's footer links to the privacy policy once it is published.
 const privacy=await db().prepare('SELECT published FROM documents WHERE route=?').bind('/privacy-policy/').first<{published:string|null}>();
 if(privacy?.published&&!html.includes('href="/privacy-policy/"'))html=html.replace(/(<div class="footer-utility">[\s\S]*?)(<\/div>)/,'$1<a href="/privacy-policy/">Privacy policy</a>$2');
 if(route==='/blogs/'){const categories=new Map((await db().prepare('SELECT id,label FROM taxonomy').all<any>()).results.map(t=>[t.id,t.label]));const docs=Object.values(await allDocs()).filter(d=>d.kind==='post'&&!d.seo.noindex);html=html.replace('</main>',`<section class="shell-wide avault-content-block"><h2>All blog posts</h2><div class="avault-content-cards">${docs.map(d=>`<article>${d.featuredImage?`<img src="${esc(d.featuredImage)}" alt="${esc(d.featuredAlt||'')}" loading="lazy" decoding="async">`:''}<h3><a href="${esc(d.route)}">${esc(d.label)}</a></h3><p>${esc(d.excerpt||d.seo.description)}</p><small>${[d.author,d.category?categories.get(d.category)||d.category:''].filter(Boolean).map(esc).join(' · ')}</small></article>`).join('')}</div></section></main>`)}
 return {html:html.replace('</head>',head+'</head>'),nonce,customScripts:live.length>0};
}
```

### lib/avault/render.ts

<!-- avault-file path="lib/avault/render.ts" mode="owned" sha256="500690c2bafe11f3ff2f0fad3c56b33b9534bb378ecd4ab929999a9c5cb053db" eol="1" -->
```ts
import {compose} from './blocks';
import {CONFIG} from './config';
import {fixIcons} from './icon-fix';
import {tagFields} from './nav-canvas';
import {markSections} from './section-library';
import {Doc,esc} from './store';
import {profile,organizationNode,syncSocialLinks,customSchemaNodes} from './site';
import {BODY_SLOT,RELATED_SLOT,wrapTables,bodyImages,relatedHtml} from './rich';
const text=(s:string)=>s.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').trim();
const absolute=(s:string,origin=CONFIG.origin)=>new URL(s,origin).href;
// canvas: the AVAULT live editor's copy. Every {{fN}} spot in the body is tagged (see tagFields) before values go in.
export function render(d:Doc,g:Record<string,any>={},preview=false,registry:Record<string,Doc>={},origin=CONFIG.origin,canvas=false,interactivePreview=false){
 const nav=g.navigation||{};
 // The canvas also shows hidden sections (faded), so they can be found and shown again.
 let html=canvas?compose(markSections(d.template,d.hiddenSections),d.sectionOrder,undefined,d.blocks).replace(/<body\b[\s\S]*$/,tagFields):compose(d.template,d.sectionOrder,d.hiddenSections,d.blocks);const minutes=d.body?Math.max(1,Math.round(d.body.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length/220)):0;const fields=new Map(d.fields.map(f=>[f.key,minutes&&/^\d+ min read$/.test(f.value)?`${minutes} min read`:nav[f.group+'|'+f.label+'|'+f.value]??f.value]));html=html.replace(/\{\{(f\d+)\}\}/g,(_,k)=>esc(fields.get(k)||''));
 // Rich article body (already sanitized on save) goes in after field values, so it is never re-processed.
 html=html.replace(BODY_SLOT,()=>wrapTables(d.body||''));
 html=html.replace(RELATED_SLOT,()=>relatedHtml(d as any,registry as any));
 // Global contact values are resolved in every rendered page, not copied over saved records.
 if(g.name)html=html.replaceAll(CONFIG.name,esc(g.name));
 const phone=String(g.phone||''),digits=phone.replace(/\D/g,'').replace(/^1(?=\d{10}$)/,''),phoneText=digits.length===10?`(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`:phone,tel='tel:'+phone.replace(/[^+0-9]/g,'');
 html=html.replaceAll(CONFIG.email,esc(String(g.email||''))).replaceAll('tel:'+CONFIG.phone.replace(/[^+0-9]/g,''),esc(tel)).replaceAll(CONFIG.phone,esc(phone)).replaceAll(CONFIG.phoneDisplay,esc(phoneText));
 if(g.logo)html=html.replace(/(<img\b[^>]*\bsrc=")[^"]*("[^>]*(?:class="[^"]*(?:logo|brand)[^"]*"|alt="[^"]*(?:DMV Commercial Door Repair|logo)[^"]*")[^>]*>)/gi,`$1${esc(g.logo)}$2`);
 html=syncSocialLinks(html,g);
 html=fixIcons(html);
 // Imported pages historically stored public assets as `assets/...`. Root them so nested routes do not
 // request `/service-slug/assets/...` and 404. External, anchor, mail, phone, and ordinary page links stay unchanged.
 html=html.replace(/\b(src|href|poster|data-src)="((?:assets|media)\/[^"<>]*)"/gi,(_match,attr,value)=>`${attr}="/${value}"`);
 const p=profile(g);const title=d.seo.title.trim()||p.titleTemplate.replace('%s',d.label);const description=d.seo.description.trim()||d.excerpt||p.defaultDescription;const ogTitle=d.seo.ogTitle?.trim()||title,ogDescription=d.seo.ogDescription?.trim()||description;
 const canonical=origin+d.route;const image=absolute(d.seo.image||d.featuredImage||p.image,origin);const imageAlt=d.seo.image?d.seo.imageAlt:d.featuredImage?d.featuredAlt||d.seo.imageAlt:d.seo.imageAlt;const heading=text(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1]||d.label);
 const graph:Record<string,unknown>[]=[{...organizationNode(g,html,CONFIG.origin),telephone:phone},{'@type':'WebSite','@id':CONFIG.origin+'/#website',url:CONFIG.origin+'/',name:p.name,publisher:{'@id':CONFIG.origin+'/#organization'},inLanguage:CONFIG.language},{'@type':d.route==='/blogs/'||d.route==='/case-studies/'?'CollectionPage':'WebPage','@id':canonical+'#webpage',url:canonical,name:title,description,isPartOf:{'@id':CONFIG.origin+'/#website'},inLanguage:CONFIG.language,primaryImageOfPage:{'@type':'ImageObject',url:image,caption:imageAlt}}];
 if(d.kind==='service')graph.push({'@type':'Service','@id':canonical+'#service',name:heading,url:canonical,description,provider:{'@id':origin+'/#organization'},areaServed:{'@type':'AdministrativeArea',name:p.areaServed},mainEntityOfPage:{'@id':canonical+'#webpage'}});
 if(d.kind==='post'||d.kind==='case-study')graph.push({'@type':d.kind==='post'?'BlogPosting':'Article','@id':canonical+'#article',headline:heading,description,image:[image],author:d.author?{'@type':'Person',name:d.author,...(d.authorUrl?{url:absolute(d.authorUrl,origin)}:{})}:{'@id':origin+'/#organization'},...(d.category?{articleSection:d.category}:{}),publisher:{'@id':origin+'/#organization'},mainEntityOfPage:{'@id':canonical+'#webpage'},inLanguage:CONFIG.language,...(d.publishedAt?{datePublished:d.publishedAt}:{}),...(d.updatedAt?{dateModified:d.updatedAt}:{})});
 const faqSection=d.route==='/faqs/'?html:html.match(/<section\b[^>]*class="[^"]*(?:faq-section|\bfaq\b)[^"]*"[^>]*>([\s\S]*?)<\/section>/)?.[1];const faqItems=faqSection?[...faqSection.matchAll(/<details\b[^>]*class="[^"]*faq-item[^"]*"[^>]*>[\s\S]*?<summary\b[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)].map(match=>({question:text(match[1]),answer:text(match[2])})).filter(item=>item.question&&item.answer):[];if(faqItems.length)graph.push({'@type':'FAQPage','@id':canonical+'#faq',mainEntity:faqItems.map(item=>({'@type':'Question',name:item.question,acceptedAnswer:{'@type':'Answer',text:item.answer}}))});
 if(d.route!=='/') {const crumbs=[{name:registry['/']?.label||'Home',url:'/'}];const parts=d.route.split('/').filter(Boolean);for(let i=0;i<parts.length;i++){const route='/'+parts.slice(0,i+1).join('/')+'/';const page=registry[route];if(page||route===d.route)crumbs.push({name:route===d.route?heading:page?.label||heading,url:route});}graph.push({'@type':'BreadcrumbList','@id':canonical+'#breadcrumb',itemListElement:crumbs.map((c,i)=>({'@type':'ListItem',position:i+1,name:c.name,item:origin+c.url}))});}
 graph.push(...customSchemaNodes(d.seo.schema,canonical));
 const robots=preview?'noindex, nofollow':[d.seo.noindex?'noindex':'index',d.seo.nofollow?'nofollow':'follow',...(d.seo.noarchive?['noarchive']:[]),...(d.seo.noindex?[]:['max-image-preview:large','max-snippet:-1','max-video-preview:-1'])].join(', ');
 const schema=JSON.stringify({'@context':'https://schema.org','@graph':graph}).replaceAll(CONFIG.origin,origin).replace(/</g,'\\u003c');
 const metadata=`<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}"><meta name="robots" content="${robots}"><meta property="og:site_name" content="${esc(p.name)}"><meta property="og:title" content="${esc(ogTitle)}"><meta property="og:description" content="${esc(ogDescription)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:type" content="${d.kind==='post'?'article':'website'}"><meta property="og:locale" content="en_US"><meta property="og:image" content="${esc(image)}"><meta property="og:image:alt" content="${esc(imageAlt)}">${d.kind==='post'&&d.publishedAt?`<meta property="article:published_time" content="${esc(d.publishedAt)}">`:''}${d.kind==='post'&&d.updatedAt?`<meta property="article:modified_time" content="${esc(d.updatedAt)}">`:''}${d.author?`<meta name="author" content="${esc(d.author)}">`:''}<meta name="twitter:card" content="${d.seo.twitterCard==='summary'?'summary':'summary_large_image'}"><meta name="twitter:title" content="${esc(ogTitle)}"><meta name="twitter:description" content="${esc(ogDescription)}"><meta name="twitter:image" content="${esc(image)}"><meta name="twitter:image:alt" content="${esc(imageAlt)}"><script type="application/ld+json">${schema}</script>`;
 html=html.replace('{{SEO}}',metadata);
 if(preview){
  html=html.replace(/<script\b(?![^>]*application\/ld\+json)([^>]*)>[\s\S]*?<\/script>/gi,(tag,attrs)=>interactivePreview&&/\bsrc=["']\/(?!\/)[^"']+["']/i.test(attrs)?tag:'');
  html=html.replace('<body','<body data-preview="true"');
 }
 return html;
}
// Public sitemap file names. Internally (and in saved settings) the older underscore names are the keys.
export const SITEMAP_FILES:Record<string,string>={'sm_pages.xml':'sm-pages.xml','sm_posts.xml':'sm-posts.xml','sm_images.xml':'sm-images.xml'};
export function sitemap(docs:Record<string,Doc>,kind:string,origin=CONFIG.origin,files:{exclude?:string[];custom?:Record<string,string[]>}={}){const excluded=new Set(files.exclude||[]);const eligible=Object.values(docs).filter(d=>!d.seo.noindex&&d.seo.sitemap!==false&&!excluded.has(d.route));const custom=(files.custom?.[kind]||[]).filter(u=>/^https:\/\//.test(u)||u.startsWith('/'));const xml=(s:string)=>esc(s);if(kind==='sitemap.xml')return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.values(SITEMAP_FILES).map(f=>`<sitemap><loc>${origin}/${f}</loc></sitemap>`).join('')}</sitemapindex>`;
 return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${eligible.filter(d=>kind==='sm_images.xml'||(kind==='sm_posts.xml'?d.kind==='post':d.kind!=='post')).map(d=>`<url><loc>${xml(origin+d.route)}</loc>${d.updatedAt?`<lastmod>${xml(d.updatedAt)}</lastmod>`:''}${kind==='sm_images.xml'?[...new Set([...d.fields.filter(f=>f.label==='img src').map(f=>f.value),...(d.blocks||[]).filter(b=>b.type==='image'&&b.url).map(b=>b.url!),...bodyImages(d.body).map(i=>i.src).filter(Boolean)])].map(src=>`<image:image><image:loc>${xml(absolute(src,origin))}</image:loc></image:image>`).join(''):''}</url>`).join('')}${kind==='sm_images.xml'?'':custom.map(u=>`<url><loc>${xml(absolute(u,origin))}</loc></url>`).join('')}</urlset>`;}
```

### lib/avault/rich.ts

<!-- avault-file path="lib/avault/rich.ts" mode="owned" sha256="e062aa70e7eb237dd0def3b9e840a5b23005dbe63f8bfb9a0051e2df2ad2c81d" eol="1" -->
```ts
import sanitizeHtml from 'sanitize-html';
import {HttpError} from './store';

// Rich article bodies (blog posts). Stored as allowlisted HTML and rendered into the template's {{BODY}} slot.
// The title field owns the page's single H1, so any H1 in the body becomes an H2.
export const BODY_SLOT='{{BODY}}';
const HOSTS_OK=/^(https?:|mailto:|tel:|\/(?!\/)|#)/i;
export function sanitizeBody(value:unknown){const html=String(value??'');if(html.length>400000)throw new HttpError(422,'The article is too long.');
 return sanitizeHtml(html,{
  allowedTags:['p','h2','h3','h4','h5','h6','strong','b','em','i','u','s','del','mark','sup','sub','code','pre','blockquote','ul','ol','li','a','img','figure','figcaption','table','thead','tbody','tr','th','td','hr','br','span','div'],
  allowedAttributes:{a:['href','target','rel','title'],img:['src','alt','title','width','height','loading'],th:['colspan','rowspan','style'],td:['colspan','rowspan','style'],span:['style'],mark:['style','data-color'],p:['style'],h2:['style'],h3:['style'],h4:['style'],h5:['style'],h6:['style'],li:['style'],div:['class'],ol:['start']},
  allowedClasses:{div:['article-table']},
  allowedStyles:{'*':{'text-align':[/^(left|right|center|justify)$/]},span:{color:[/^#[0-9a-f]{3,8}$/i,/^rgb\([\d\s,.%]+\)$/i],'background-color':[/^#[0-9a-f]{3,8}$/i,/^rgb\([\d\s,.%]+\)$/i]},mark:{'background-color':[/^#[0-9a-f]{3,8}$/i,/^rgb\([\d\s,.%]+\)$/i]}},
  allowedSchemes:['http','https','mailto','tel'],allowedSchemesAppliedToAttributes:['href','src'],allowProtocolRelative:false,
  transformTags:{h1:'h2',b:'strong',i:'em',a:(tag,attribs)=>{const href=String(attribs.href||'');const out:Record<string,string>={href};if(attribs.target==='_blank')out.target='_blank';
   // New-tab links always get noopener noreferrer; nofollow/sponsored/ugc are kept only when chosen.
   const rel=new Set(String(attribs.rel||'').split(/\s+/).filter(r=>['nofollow','sponsored','ugc'].includes(r)));if(out.target)['noopener','noreferrer'].forEach(r=>rel.add(r));if(rel.size)out.rel=[...rel].join(' ');if(attribs.title)out.title=attribs.title;return {tagName:'a',attribs:out}},
   img:(tag,attribs)=>({tagName:'img',attribs:{...attribs,loading:'lazy'}})},
  exclusiveFilter:frame=>(frame.tag==='a'&&!HOSTS_OK.test(String(frame.attribs.href||'')))?false:(frame.tag==='img'&&!/^(https:\/\/|\/(?!\/))/i.test(String(frame.attribs.src||''))),
 }).trim();
}
// Tables from the editor are wrapped in the site's scrollable, bordered table container.
export function wrapTables(html:string){return html.replace(/<div class="article-table">\s*(<table\b[\s\S]*?<\/table>)\s*<\/div>/g,'$1').replace(/<table\b[\s\S]*?<\/table>/g,t=>`<div class="article-table">${t}</div>`)}
export const bodyLinks=(html?:string)=>[...String(html||'').matchAll(/<a\b[^>]*href="([^"]*)"/g)].map(m=>m[1].replace(/&amp;/g,'&'));
export const bodyImages=(html?:string)=>[...String(html||'').matchAll(/<img\b[^>]*>/g)].map(m=>({src:(m[0].match(/src="([^"]*)"/)||[])[1]||'',alt:(m[0].match(/alt="([^"]*)"/)||[])[1]??null}));
export const bodyH1=(html?:string)=>(String(html||'').match(/<h1\b/g)||[]).length;

// "Keep exploring" at the end of every post, chosen automatically: same category, then the same topic
// (the eyebrow above the title), then shared title words, newest first. Always ends with the blog index.
export const RELATED_SLOT='{{RELATED}}';
type Post={route:string;label:string;kind:string;category?:string;template:string;fields:{key:string;value:string}[];seo:{noindex:boolean};publishedAt?:string;updatedAt?:string};
const ARROW='<svg class="cta-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7"/></svg>';
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function postTopic(d:Post){const html=d.template.match(/<p class="article-eyebrow">[\s\S]*?<\/p>/)?.[0]||'';return [...html.matchAll(/\{\{(f\d+)\}\}/g)].map(m=>d.fields.find(f=>f.key===m[1])?.value||'').join('').replace(/\s+/g,' ').trim().toLowerCase()}
const words=(s:string)=>new Set(s.toLowerCase().match(/[a-z]{4,}/g)||[]);
export function relatedPosts(d:Post,registry:Record<string,Post>,count=2){const topic=postTopic(d),mine=words(d.label);
 return Object.values(registry).filter(p=>p.kind==='post'&&p.route!==d.route&&p.route!=='/blog/'&&!p.seo.noindex).map(p=>{let score=0;if(d.category&&p.category===d.category)score+=6;if(topic&&postTopic(p)===topic)score+=4;for(const w of words(p.label))if(mine.has(w))score+=1;return {p,score}})
  .sort((a,b)=>b.score-a.score||String(b.p.publishedAt||b.p.updatedAt||'').localeCompare(String(a.p.publishedAt||a.p.updatedAt||''))).slice(0,count).map(x=>x.p)}
export function relatedHtml(d:Post,registry:Record<string,Post>){const posts=relatedPosts(d,registry);
 return `<aside class="article-related" aria-label="Related articles"><h2>Keep exploring.</h2>${posts.map(p=>`<a href="${escape(p.route)}"><span>${escape(p.label)}</span>${ARROW}</a>`).join('')}<a href="/blog/">All articles ${ARROW}</a></aside>`}
```

### lib/avault/runtime.ts

<!-- avault-file path="lib/avault/runtime.ts" mode="owned" sha256="a59e9c43f3639e3b6b954a2a380f591cffa761abd5cf8557460374ca2445b689" eol="1" -->
```ts
import {db,bucket,id,now,HttpError,Doc,readDoc,allDocs,audit} from './store';
import {CONFIG} from './config';
import {recordActivity,mutateMany} from './operations';
export const runtime=process.env as {AVAULT_ENCRYPTION_KEY?:string;AVAULT_JOBS_SECRET?:string};
const bytes=(hex:string)=>new Uint8Array(hex.match(/.{2}/g)!.map(v=>parseInt(v,16)));
const hex=(b:ArrayBuffer|Uint8Array)=>Array.from(new Uint8Array(b)).map(n=>n.toString(16).padStart(2,'0')).join('');
async function cipherKey(){const key=runtime.AVAULT_ENCRYPTION_KEY;if(!key||!/^[a-f0-9]{64}$/.test(key))throw new HttpError(503,'Secure storage is not configured.');return crypto.subtle.importKey('raw',bytes(key),'AES-GCM',false,['encrypt','decrypt'])}
export async function seal(value:string){const iv=crypto.getRandomValues(new Uint8Array(12));return hex(iv)+'.'+hex(await crypto.subtle.encrypt({name:'AES-GCM',iv},await cipherKey(),new TextEncoder().encode(value)))}
export async function unseal(value:string){const [iv,data]=value.split('.');return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(iv)},await cipherKey(),bytes(data)))}
export async function settingsRead(key:string){const row=await db().prepare('SELECT value,revision FROM settings WHERE id=?').bind(key).first<any>();return {value:row?JSON.parse(row.value):{},revision:row?.revision||0}}
export async function settingsSave(key:string,value:unknown,revision:number,actor:string){const current=await settingsRead(key);if(current.revision!==revision)throw new HttpError(409,'Settings changed. Reload before saving.');const guard=id(),rev=id();try{await db().batch([db().prepare('INSERT OR IGNORE INTO settings(id,value,revision) VALUES (?, ?,0)').bind(key,'{}'),db().prepare('INSERT INTO write_guards(id,valid) VALUES (?,CASE WHEN (SELECT revision FROM settings WHERE id=?)=? THEN 1 ELSE 0 END)').bind(guard,key,revision),db().prepare('INSERT INTO revisions(id,document_id,before,after,actor,state,created_at) VALUES (?,?,?,?,?,?,?)').bind(rev,'@'+key,JSON.stringify(current.value),JSON.stringify(value),actor,'applied',now()),db().prepare('UPDATE settings SET value=?,revision=revision+1 WHERE id=?').bind(JSON.stringify(value),key),db().prepare('DELETE FROM write_guards WHERE id=?').bind(guard),db().prepare('INSERT INTO activity(id,actor,action,entity,created_at) VALUES (?,?,?,?,?)').bind(id(),actor,'settings',key,now())]);}catch(e){if(String(e).includes('valid_write'))throw new HttpError(409,'Settings changed. Reload before saving.');throw e}return revision+1}
export {sendEmail,deliverForm} from './email';
import {deliverForm} from './email';
export const backupTables=['documents','settings','redirects','media','taxonomy','users','schedules','forms','revisions','activity'] as const;
export async function createBackup(actor:string){const snapshot:any={version:2,origin:CONFIG.origin,createdAt:now(),tables:{}};for(const t of backupTables)snapshot.tables[t]=(await db().prepare(`SELECT * FROM ${t}`).all()).results;snapshot.mediaCopies=[];const archivePrefix='private-backups/media/'+id()+'/';for(const m of snapshot.tables.media){const object=await bucket().get(m.key);if(!object)throw new HttpError(503,'A media file is unavailable. Backup was not marked complete.');const key=archivePrefix+m.key;await bucket().put(key,object.body,{httpMetadata:object.httpMetadata});snapshot.mediaCopies.push({original:m.key,backup:key})}const serialized=JSON.stringify(snapshot);const payload=await seal(serialized);const checksum=hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(serialized)));const backupId=id(),key='private-backups/'+snapshot.createdAt.slice(0,10)+'/'+backupId+'.enc';await bucket().put(key,payload,{httpMetadata:{contentType:'application/octet-stream'}});await db().prepare('INSERT INTO backups(id,key,checksum,bytes,created_at) VALUES (?,?,?,?,?)').bind(backupId,key,checksum,payload.length,now()).run();await recordActivity(actor,'backup',backupId);return {id:backupId,checksum,bytes:payload.length}}
export async function backupRead(backupId:string){const row=await db().prepare('SELECT * FROM backups WHERE id=?').bind(backupId).first<any>();if(!row)throw new HttpError(404,'Backup not found.');const object=await bucket().get(row.key);if(!object)throw new HttpError(503,'Backup file is unavailable.');const text=await unseal(await object.text());if(hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))!==row.checksum)throw new HttpError(422,'Backup integrity check failed.');return JSON.parse(text)}
// Removes a backup's encrypted snapshot and its copies of media files, then its record.
export async function backupDelete(backupId:string,actor:string){const row=await db().prepare('SELECT * FROM backups WHERE id=?').bind(backupId).first<any>();if(!row)throw new HttpError(404,'Backup not found.');let copies:string[]=[];try{const data=await backupRead(backupId);copies=(data.mediaCopies||[]).map((m:any)=>String(m.backup))}catch{}for(const key of [row.key,...copies])await bucket().delete(key);await db().prepare('DELETE FROM backups WHERE id=?').bind(backupId).run();await recordActivity(actor,'backup-delete',String(row.created_at||backupId));return {deleted:true}}
// The stored snapshot exactly as saved: still encrypted, so a download never puts leads or password hashes in plain text.
export async function backupFile(backupId:string){const row=await db().prepare('SELECT * FROM backups WHERE id=?').bind(backupId).first<any>();if(!row)throw new HttpError(404,'Backup not found.');const object=await bucket().get(row.key);if(!object)throw new HttpError(503,'Backup file is unavailable.');return {name:`avault-backup-${String(row.created_at).slice(0,10)}-${row.id}.enc`,checksum:String(row.checksum),body:await object.text()}}
async function maintenanceWork(actor:string){const results:any={published:[],conflicts:[],failed:[]};const jobs=await db().prepare("SELECT * FROM schedules WHERE state='pending' AND due<=? ORDER BY due LIMIT 20").bind(now()).all<any>();for(const job of jobs.results){const draft=await readDoc(job.route,true);if(!draft||draft.revision!==job.revision){await db().prepare('UPDATE schedules SET state=? WHERE route=?').bind('conflict',job.route).run();results.conflicts.push(job.route);continue}try{const issues=audit(draft,{...await allDocs(),[draft.route]:draft});if(issues.length){results.failed.push({route:job.route,errors:issues});continue}const pub={...draft,publishedAt:draft.publishedAt||now()};await mutateMany([{before:draft,draft:pub,published:pub}],actor,'scheduled-publish',[db().prepare('UPDATE schedules SET state=? WHERE route=?').bind('published',job.route)]);results.published.push(job.route)}catch{results.failed.push({route:job.route,errors:['Content changed or publication unavailable; retry after review.']})}}const config=(await settingsRead('operations')).value;if(config.dailyBackup){const latest=await db().prepare('SELECT created_at FROM backups ORDER BY created_at DESC LIMIT 1').first<any>();if(!latest||Date.now()-Date.parse(latest.created_at)>86400000)results.backup=await createBackup(actor)}{const cutoff=new Date(Date.now()-(Number(config.retentionDays)||365)*86400000).toISOString();await db().prepare('DELETE FROM events WHERE created_at<?').bind(cutoff).run()}await db().prepare('DELETE FROM rate_limits WHERE expires<?').bind(Date.now()).run();const {mongoDb}=await import('@/db/mongo');const failed=await (await mongoDb()).collection('forms').find({delivery:'failed',attempts:{$lt:5}},{projection:{id:1}}).sort({created_at:1}).limit(10).toArray();for(const f of failed)await deliverForm(String(f.id));if(config.formRetentionDays){const cutoff=new Date(Date.now()-config.formRetentionDays*86400000).toISOString();await (await mongoDb()).collection('forms').deleteMany({status:{$in:['archived','spam']},created_at:{$lt:cutoff}})}try{results.countries=await (await import('./geo')).backfillCountries()}catch{}
 try{results.icons=await (await import('./icon-fix')).migrateLegacyIcons()}catch{}
 // A status record, not an edit: stored directly so a run every 10 minutes doesn't add a revision and an activity entry each time.
 await db().prepare('INSERT INTO settings(id,value,revision) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value,revision=excluded.revision').bind('last-maintenance',JSON.stringify({at:now(),results}),(await settingsRead('last-maintenance')).revision+1).run();return results}

export async function runMaintenance(actor:string){const lock=await db().prepare("INSERT INTO rate_limits(id,count,expires) VALUES ('maintenance-lock',1,?) ON CONFLICT(id) DO UPDATE SET expires=excluded.expires WHERE expires<? RETURNING id").bind(Date.now()+300000,Date.now()).first();if(!lock)throw new HttpError(409,'Maintenance is already running.');try{return await maintenanceWork(actor)}finally{await db().prepare('DELETE FROM rate_limits WHERE id=?').bind('maintenance-lock').run()}}
```

### lib/avault/scheduler.ts

<!-- avault-file path="lib/avault/scheduler.ts" mode="owned" sha256="81041b71ce238ff650a7a018e87187e7acb7e69eed09d111b9f73198ccd6e2cf" eol="1" -->
```ts
import {runMaintenance} from './runtime';
import {HttpError} from './store';

// Built-in scheduler (started from instrumentation.ts). Every 10 minutes it runs the same job as
// POST /api/maintenance/. The database lock in runMaintenance stops two runs overlapping, so an external
// cron job calling the endpoint as well is harmless.
const EVERY=10*60*1000,FIRST=60*1000;
const g=globalThis as typeof globalThis&{__avaultScheduler?:boolean};
export function startScheduler(){
 if(g.__avaultScheduler)return;g.__avaultScheduler=true;
 const run=()=>runMaintenance('built-in-scheduler').catch(e=>{if(!(e instanceof HttpError&&e.status===409))console.error('AVAULT scheduled maintenance failed:',e instanceof Error?e.message:'unknown error')});
 setTimeout(()=>{run();setInterval(run,EVERY).unref()},FIRST).unref();
}
```

### lib/avault/section-library.ts

<!-- avault-file path="lib/avault/section-library.ts" mode="owned" sha256="ab2be181cb5ac1cc89694a9467b35e409235fcc844c113577d9f25d1b84fcf27" eol="1" -->
```ts
import {sections} from './blocks';
import {HttpError,esc} from './store';
import type {Doc,Field} from './store';

// Prebuilt sections: every top-level <section> already designed on some page can be copied into another page.
// The copy is made here, from the stored template, so section markup never comes from the browser. Its
// placeholders get fresh field keys (the text starts as the source page's copy) and clashing element ids are
// renamed. The new section goes into the template after the last section, so existing section ids
// (section-N, by position) keep their meaning; sectionOrder then places it where it was asked for.
const PLACE=/\{\{(f\d+)\}\}/g;
const COLORS=/^(?:sc-)?(?:blue|green|red|yellow)$|^case-(?:blue|green|red|yellow)$/;
const NAMES:Record<string,string>={'faq-section':'FAQ','sc-hero':'Hero','sc-problem':'Problem','sc-decisions':'Decisions','sc-scope':'Scope','sc-delivery':'Delivery','sc-measure':'Measurement','sc-proof':'Proof','sc-example':'Example','sc-signature':'Signature visual','sc-chapter':'Chapter','service-insight-panel':'Insight panel','service-website-entry':'Website check form','scroll-cta':'Call to action','video-testimonials':'Video testimonials','cs-channel-section':'Channel results','cs-work-chapter':'Work chapter','cs-graph-section':'Results graph','i-roi':'ROI','seo-story':'SEO story','shell-wide':'Section','journal-index-group':'Blog list','i-problems':'Problems','cs-hub-collection':'Case study collection'};
const clean=(s:string)=>s.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();

export function sectionType(html:string){
 const list=(html.match(/^<section\b[^>]*\bclass="([^"]*)"/)?.[1]||'').split(/\s+/).filter(c=>c&&!COLORS.test(c)&&!/^sc-route-\d+$/.test(c));
 const main=list[0]==='sc-section'&&list[1]?list[1]:list[0];if(!main)return 'Section';
 return NAMES[main]||(main.replace(/^(?:sc|cs|i|gpt|claude)-/,'').replace(/-/g,' ').replace(/^./,c=>c.toUpperCase()));
}
export function sectionTitle(html:string,fields:Map<string,string>){
 const fill=(s:string)=>clean(s.replace(PLACE,(_,k)=>fields.get(k)||''));
 const h=html.match(/<h[2-4]\b[^>]*>([\s\S]*?)<\/h[2-4]>/)?.[1]||html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/)?.[1]||'';
 return fill(h).slice(0,90)||sectionType(html);
}
// The classes of the elements a section sits inside within <main>, e.g. "service-canvas". Page CSS styles
// sections through these, so a copied section looks right only where they match.
export function contextOf(template:string,start:number){
 const main=template.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1]||'';const stack:string[]=[];
 for(const m of main.slice(0,start).matchAll(/<(\/?)(div|article|section)\b([^>]*)>/g)){if(m[1])stack.pop();else stack.push(m[3].match(/\bclass="([^"\s]*)/)?.[1]||'')}
 return stack.filter(Boolean).join('>');
}
export function pageContext(template:string){const s=sections(template).items[0];return s?contextOf(template,s.start):''}

export type LibraryItem={key:string;route:string;section:string;type:string;title:string;page:string;pages:number;context:string;fields:number};
export function library(docs:{route:string;doc:Doc}[]){
 const seen=new Map<string,LibraryItem>();
 for(const {route,doc} of docs){if(!doc.template||doc.template.includes('{{BODY}}'))continue;const values=new Map(doc.fields.map(f=>[f.key,f.value]));
  for(const s of sections(doc.template).items){if(/<h1\b/.test(s.html))continue;
   const shape=s.html.replace(PLACE,'{{}}');const found=seen.get(shape);if(found){found.pages++;continue}
   seen.set(shape,{key:route+'#'+s.id,route,section:s.id,type:sectionType(s.html),title:sectionTitle(s.html,values),page:doc.label,pages:1,context:contextOf(doc.template,s.start),fields:new Set([...s.html.matchAll(PLACE)].map(m=>m[1])).size});
  }}
 return [...seen.values()].sort((a,b)=>a.type.localeCompare(b.type)||b.pages-a.pages||a.title.localeCompare(b.title));
}

const idsIn=(html:string)=>[...html.matchAll(/\sid="([^"{}]+)"/g)].map(m=>m[1]);
function nextKey(d:Doc){return Math.max(0,...d.fields.map(f=>Number(f.key.slice(1))||0),...[...d.template.matchAll(PLACE)].map(m=>Number(m[1].slice(1))))+1}

// Copies section `sectionId` of `source` into `target`, placed right after `after` (null = at the top).
export function insertSection(target:Doc,source:Doc,sectionId:string,after:string|null):Doc{
 const src=sections(source.template).items.find(s=>s.id===sectionId);if(!src)throw new HttpError(404,'That section no longer exists.');
 if(/<h1\b/.test(src.html))throw new HttpError(422,'A page has one main heading, so its opening section can’t be copied.');
 const t=sections(target.template);if(!t.items.length)throw new HttpError(422,'This page has no sections to add to.');if(t.items.length>=60)throw new HttpError(422,'A page can hold up to 60 sections.');
 const order=target.sectionOrder||t.items.map(s=>s.id);if(after&&!order.includes(after))throw new HttpError(422,'Choose where the section goes.');
 // Fresh field keys, in the order they appear.
 let n=nextKey(target);const keys=new Map<string,string>();for(const m of src.html.matchAll(PLACE))if(!keys.has(m[1]))keys.set(m[1],'f'+n++);
 let html=src.html.replace(PLACE,(_,k)=>`{{${keys.get(k)}}}`);
 // Element ids already on the page get a suffix, along with the links and labels inside the copy that use them.
 const taken=new Set(idsIn(target.template));
 for(const id of new Set(idsIn(html))){if(!taken.has(id))continue;let i=2;while(taken.has(`${id}-${i}`))i++;const to=`${id}-${i}`;taken.add(to);
  const q=id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');html=html.replace(new RegExp(`(\\s(?:id|for|aria-controls|aria-labelledby|aria-describedby)=")${q}"`,'g'),`$1${to}"`).replace(new RegExp(`(href=")#${q}"`,'g'),`$1#${to}"`)}
 const byKey=new Map(source.fields.map(f=>[f.key,f]));
 const added:Field[]=[...keys].map(([from,to])=>{const f=byKey.get(from);return f?{...f,key:to}:{key:to,value:'',kind:'text',label:'span',section:sectionType(src.html),group:'content'}});
 const at=t.items[t.items.length-1].end;const main=t.main.slice(0,at)+html+t.main.slice(at);
 const template=target.template.replace(t.main,()=>main);const id='section-'+t.items.length;
 const nextOrder=[...order];nextOrder.splice(after?nextOrder.indexOf(after)+1:0,0,id);
 return {...target,template,fields:[...target.fields,...added],sectionOrder:nextOrder,ids:idsIn(template)};
}

// Removes a section and its fields for good. Ids after it shift down by one, as they are positional.
export function removeSection(target:Doc,sectionId:string):Doc{
 const t=sections(target.template);const index=t.items.findIndex(s=>s.id===sectionId);if(index<0)throw new HttpError(404,'That section no longer exists.');
 const s=t.items[index];if(/<h1\b/.test(s.html))throw new HttpError(422,'The section with the page’s main heading can’t be removed.');
 const main=t.main.slice(0,s.start)+t.main.slice(s.end);const template=target.template.replace(t.main,()=>main);
 const gone=new Set([...s.html.matchAll(PLACE)].map(m=>m[1]).filter(k=>!template.includes(`{{${k}}}`)));
 const shift=(ids:string[])=>ids.filter(i=>i!==sectionId).map(i=>{const k=Number(i.slice(8));return k>index?'section-'+(k-1):i});
 return {...target,template,fields:target.fields.filter(f=>!gone.has(f.key)),sectionOrder:shift(target.sectionOrder||t.items.map(i=>i.id)),hiddenSections:shift(target.hiddenSections||[]),ids:idsIn(template)};
}

// For the editor canvas: marks each top-level section with its id, and hidden ones so they can be shown faded.
export function markSections(template:string,hidden:string[]=[]){
 const t=sections(template);let main=t.main;
 for(let i=t.items.length-1;i>=0;i--){const s=t.items[i];const open=s.html.match(/^<section\b[^>]*?(\/?)>/)![0];
  main=main.slice(0,s.start)+open.replace(/>$/,` data-av-section="${s.id}" data-av-label="${esc(sectionType(s.html))}"${/<h1/.test(s.html)?' data-av-h1':''}${hidden.includes(s.id)?' data-av-hidden':''}>`)+main.slice(s.start+open.length)}
 return template.replace(t.main,()=>main);
}
```

### lib/avault/site.ts

<!-- avault-file path="lib/avault/site.ts" mode="owned" sha256="1dc15023a460d327f63072af41617431e15bfa0b32aee39a52b13fc12edfde31" eol="1" -->
```ts
import {HttpError,safeUrl} from './store';

// Global business profile (settings id `global`). One set of values drives the visible contact/social links,
// the Organization schema (sameAs, hasMap, address, hours) and the default title/description.
export const SOCIAL:Record<string,{label:string;domains:RegExp}>={
 facebook:{label:'Facebook',domains:/^https:\/\/(?:www\.|m\.)?facebook\.com\//},
 instagram:{label:'Instagram',domains:/^https:\/\/(?:www\.)?instagram\.com\//},
 linkedin:{label:'LinkedIn',domains:/^https:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\//},
 x:{label:'X (Twitter)',domains:/^https:\/\/(?:www\.)?(?:x|twitter)\.com\//},
 youtube:{label:'YouTube',domains:/^https:\/\/(?:www\.|m\.)?youtube\.com\//},
 tiktok:{label:'TikTok',domains:/^https:\/\/(?:www\.)?tiktok\.com\//},
 pinterest:{label:'Pinterest',domains:/^https:\/\/(?:[a-z]{2,3}\.)?pinterest\.com\//},
};
export const BUSINESS_TYPES=['Organization','ProfessionalService','LocalBusiness','Corporation'] as const;
export type Profile={name:string;legalName:string;tagline:string;businessType:typeof BUSINESS_TYPES[number];email:string;phone:string;image:string;logo:string;
 address:{street:string;city:string;region:string;postalCode:string;country:string};geo:{lat:string;lng:string};hours:string[];mapUrl:string;
 socials:Record<string,string>;priceRange:string;areaServed:string;titleTemplate:string;defaultDescription:string};

export function profile(g:any):Profile{const a=g?.address||{},geo=g?.geo||{};return {name:String(g?.name||''),legalName:String(g?.legalName||''),tagline:String(g?.tagline||''),businessType:BUSINESS_TYPES.includes(g?.businessType)?g.businessType:'Organization',email:String(g?.email||''),phone:String(g?.phone||''),image:String(g?.image||''),logo:String(g?.logo||''),
 address:{street:String(a.street||''),city:String(a.city||''),region:String(a.region||''),postalCode:String(a.postalCode||''),country:String(a.country||'')},geo:{lat:String(geo.lat||''),lng:String(geo.lng||'')},hours:Array.isArray(g?.hours)?g.hours.map(String):[],mapUrl:String(g?.mapUrl||''),
 socials:Object.fromEntries(Object.keys(SOCIAL).map(k=>[k,String(g?.socials?.[k]||'')])),priceRange:String(g?.priceRange||''),areaServed:String(g?.areaServed||''),titleTemplate:String(g?.titleTemplate||'%s'),defaultDescription:String(g?.defaultDescription||'')}}

// Validates an AVAULT settings form. Unknown keys are dropped; navigation overrides are kept as they are.
export function validateProfile(b:any,current:any){
 const t=(v:unknown,max=200)=>String(v??'').trim().slice(0,max);
 const email=t(b.email,250),phone=t(b.phone,40),image=t(b.image,500),logo=t(b.logo,500),mapUrl=t(b.mapUrl,1000);
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new HttpError(422,'Enter a valid contact email or leave it blank.');
 if(!/^\+?[0-9 ()-]{7,25}$/.test(phone))throw new HttpError(422,'Enter a valid phone number.');
 for(const [label,v] of [['Default image',image],['Logo',logo]])if(v&&!safeUrl(v))throw new HttpError(422,label+' must be a site path or https URL.');
 if(mapUrl&&!/^https:\/\//.test(mapUrl))throw new HttpError(422,'The Google Business Profile / map link must start with https://');
 const socials:Record<string,string>={};for(const [k,rule] of Object.entries(SOCIAL)){const v=t(b.socials?.[k],500);if(v&&!rule.domains.test(v))throw new HttpError(422,`${rule.label} must be a full https link to ${rule.label}.`);socials[k]=v}
 const lat=t(b.geo?.lat,20),lng=t(b.geo?.lng,20);if((lat||lng)&&(!(Math.abs(+lat)<=90)||!(Math.abs(+lng)<=180)||!lat||!lng))throw new HttpError(422,'Enter both latitude and longitude as numbers, or leave both blank.');
 const hours=(Array.isArray(b.hours)?b.hours:String(b.hours||'').split('\n')).map((h:unknown)=>t(h,60)).filter(Boolean).slice(0,14);
 if(hours.some((h:string)=>!/^(Mo|Tu|We|Th|Fr|Sa|Su)(-(Mo|Tu|We|Th|Fr|Sa|Su))?(,(Mo|Tu|We|Th|Fr|Sa|Su)(-(Mo|Tu|We|Th|Fr|Sa|Su))?)* \d{2}:\d{2}-\d{2}:\d{2}$/.test(h)))throw new HttpError(422,'Write opening hours like "Mo-Fr 09:00-17:00", one per line.');
 const titleTemplate=t(b.titleTemplate,120);if(!titleTemplate.includes('%s'))throw new HttpError(422,'The title template must contain %s where the page title goes.');const name=t(b.name,100);if(!name)throw new HttpError(422,'Business name is required.');
 return {...current,name,legalName:t(b.legalName,150),tagline:t(b.tagline,200),businessType:BUSINESS_TYPES.includes(b.businessType)?b.businessType:'Organization',email,phone,image,logo,
  address:{street:t(b.address?.street),city:t(b.address?.city,100),region:t(b.address?.region,100),postalCode:t(b.address?.postalCode,20),country:t(b.address?.country,60)},geo:{lat,lng},hours,mapUrl,socials,priceRange:t(b.priceRange,20),areaServed:t(b.areaServed,200),titleTemplate,defaultDescription:t(b.defaultDescription,300)};
}

const abs=(s:string,origin:string)=>new URL(s,origin).href;
// Existing links to a platform are pointed at the configured profile, so visible links and schema never diverge.
export function syncSocialLinks(html:string,g:any){const p=profile(g);for(const [k,rule] of Object.entries(SOCIAL)){const url=p.socials[k];if(!url)continue;html=html.replace(/href="(https:\/\/[^"]+)"/g,(m,href)=>rule.domains.test(href)?`href="${url.replace(/"/g,'&quot;')}"`:m)}return html}

export function organizationNode(g:any,html:string,origin:string){const p=profile(g);
 const linked=[...html.matchAll(/href="(https:\/\/[^"]+)"/g)].map(m=>m[1]).filter(h=>Object.values(SOCIAL).some(r=>r.domains.test(h)));
 const a=p.address,hasAddress=Object.values(a).some(Boolean);
 return {'@type':p.businessType,'@id':origin+'/#organization',name:p.name,...(p.legalName?{legalName:p.legalName}:{}),...(p.tagline?{slogan:p.tagline}:{}),url:origin+'/',logo:abs(p.logo,origin),image:abs(p.image,origin),...(p.email?{email:p.email}:{}),telephone:p.phone,
  ...(hasAddress?{address:{'@type':'PostalAddress',streetAddress:a.street||undefined,addressLocality:a.city||undefined,addressRegion:a.region||undefined,postalCode:a.postalCode||undefined,addressCountry:a.country||undefined}}:{}),
  ...(p.geo.lat&&p.geo.lng?{geo:{'@type':'GeoCoordinates',latitude:+p.geo.lat,longitude:+p.geo.lng}}:{}),
  ...(p.hours.length&&p.businessType!=='Organization'&&p.businessType!=='Corporation'?{openingHours:p.hours}:{}),
  ...(p.priceRange&&p.businessType!=='Organization'&&p.businessType!=='Corporation'?{priceRange:p.priceRange}:{}),
  ...(p.mapUrl?{hasMap:p.mapUrl}:{}),areaServed:{'@type':'AdministrativeArea',name:p.areaServed},
  sameAs:[...new Set([...Object.values(p.socials).filter(Boolean),...linked])]};
}

// Page-level JSON-LD additions. System-owned properties always win, and only content types may be added.
const ALLOWED_TYPES=['Service','Product','Offer','HowTo','VideoObject','ImageObject','Event','Course','Review','ItemList','Person','Place','ContactPoint','Dataset','SoftwareApplication','CreativeWork'];
export function validateCustomSchema(value:unknown){const s=String(value||'').trim();if(!s)return '';if(s.length>20000)throw new HttpError(422,'Page schema is too long.');let parsed:any;try{parsed=JSON.parse(s)}catch{throw new HttpError(422,'Page schema must be valid JSON.')}
 const nodes=Array.isArray(parsed)?parsed:[parsed];if(!nodes.length||nodes.length>10||nodes.some(n=>!n||typeof n!=='object'||Array.isArray(n)))throw new HttpError(422,'Page schema must be one JSON object or a list of up to 10 objects.');
 for(const n of nodes){const types=[].concat(n['@type']||[]);if(!types.length||types.some((t:unknown)=>!ALLOWED_TYPES.includes(String(t))))throw new HttpError(422,'Page schema @type must be one of: '+ALLOWED_TYPES.join(', ')+'. Organization, WebSite, WebPage, BreadcrumbList, Article and FAQ are generated automatically.')}
 if(/aggregateRating|"ratingValue"/i.test(s))throw new HttpError(422,'Ratings are not allowed in page schema unless they come from a verified review source.');
 return s;
}
export function customSchemaNodes(schema:string|undefined,canonical:string){if(!schema)return [];try{const parsed=JSON.parse(schema);return (Array.isArray(parsed)?parsed:[parsed]).map((n:any,i:number)=>{const {['@context']:_c,['@id']:_i,...rest}=n;void _c;void _i;return {...rest,'@id':canonical+'#custom-'+(i+1),mainEntityOfPage:{'@id':canonical+'#webpage'}}})}catch{return []}}
```

### lib/avault/snippets.ts

<!-- avault-file path="lib/avault/snippets.ts" mode="owned" sha256="ba70c0d2992093aeba02dae104468f20401150c75b4285cbd150d7cdc31c04ea" eol="1" -->
```ts
// Custom scripts (settings id `scripts`): named snippets placed in the head, at the start or end of the body,
// on every page or chosen pages. Pasted code may be plain JavaScript or full HTML snippets with <script>
// tags, as Google, Meta and others hand them out; every <script> gets the page's CSP nonce. Snippets that
// respect privacy load only when the visitor hasn't opted out (footer link) or sent Global Privacy Control.
// Pure module: the AVAULT screen imports it for templates and validation.
export type Placement='head'|'bodyStart'|'bodyEnd';
export type Snippet={id:string;name:string;placement:Placement;code:string;enabled:boolean;pages:string[];respectOptOut:boolean;template:string};
export type ScriptsConfig={enabled:boolean;snippets:Snippet[]};
export const PLACEMENTS:Record<Placement,string>={head:'Inside <head>',bodyStart:'Start of <body>',bodyEnd:'End of <body>'};

const sid=()=>Math.random().toString(36).slice(2,10);
const snippet=(p:Partial<Snippet>):Snippet=>({id:sid(),name:'Custom code',placement:'head',code:'',enabled:true,pages:[],respectOptOut:true,template:'custom',...p});

// Ready-made snippets. `id` is the account/measurement ID the visitor types in.
export const TEMPLATES:{key:string;name:string;label:string;pattern:RegExp;example:string;build:(id:string)=>Snippet[]}[]=[
 {key:'ga4',name:'Google Analytics 4',label:'Measurement ID',pattern:/^G-[A-Z0-9]{4,16}$/,example:'G-XXXXXXXXXX',build:id=>[snippet({name:'Google Analytics 4',template:'ga4',code:`<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', '${id}');\n</script>`})]},
 {key:'gtm',name:'Google Tag Manager',label:'Container ID',pattern:/^GTM-[A-Z0-9]{4,12}$/,example:'GTM-XXXXXXX',build:id=>[snippet({name:'Google Tag Manager',template:'gtm',code:`<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;var n=d.querySelector('[nonce]');n&&j.setAttribute('nonce',n.nonce||n.getAttribute('nonce'));f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');</script>`})]},
 {key:'meta',name:'Meta Pixel',label:'Pixel ID',pattern:/^\d{6,20}$/,example:'123456789012345',build:id=>[snippet({name:'Meta Pixel',template:'meta',code:`<script>\n  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');\n  fbq('init', '${id}');\n  fbq('track', 'PageView');\n</script>`})]},
 {key:'clarity',name:'Microsoft Clarity',label:'Project ID',pattern:/^[a-z0-9]{6,20}$/,example:'abcde12345',build:id=>[snippet({name:'Microsoft Clarity',template:'clarity',code:`<script>\n  (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${id}");\n</script>`})]},
 {key:'custom',name:'Custom code',label:'',pattern:/.*/,example:'',build:()=>[snippet({name:'Custom code',respectOptOut:false})]},
];

// Older saves kept three plain-JavaScript boxes; they become snippets the first time they're read.
export function normalizeScripts(v:any):ScriptsConfig{
 if(Array.isArray(v?.snippets))return {enabled:!!v.enabled,snippets:v.snippets.map((s:any)=>snippet({...s,pages:Array.isArray(s.pages)?s.pages:[]}))};
 const legacy:[Placement,string][]=[['head','Head code'],['bodyStart','Body start code'],['bodyEnd','Body end code']];
 return {enabled:!!v?.enabled,snippets:legacy.filter(([k])=>String(v?.[k]||'').trim()).map(([k,name])=>snippet({id:'legacy-'+k,name,placement:k,code:String(v[k]),respectOptOut:false}))};
}

export function validateScripts(v:any):ScriptsConfig{
 const n=normalizeScripts(v);if(n.snippets.length>30)throw new Error('Use up to 30 snippets.');
 const ids=new Set<string>();
 const snippets=n.snippets.map(s=>{
  const id=String(s.id).replace(/[^a-z0-9-]/gi,'').slice(0,40)||sid();if(ids.has(id))throw new Error('Two snippets share an ID. Reload and try again.');ids.add(id);
  const name=String(s.name||'').trim().slice(0,80)||'Custom code';
  if(typeof s.code!=='string'||s.code.length>30000)throw new Error(`“${name}” is too long (30,000 characters at most).`);
  if(!(s.placement in PLACEMENTS))throw new Error(`Choose where “${name}” goes.`);
  const pages=(s.pages||[]).map((p:unknown)=>String(p).trim()).filter(Boolean).slice(0,50);
  if(pages.some((p:string)=>!p.startsWith('/')||p.length>300))throw new Error(`Pages for “${name}” must be site paths like /contact/ (end with * for a whole section).`);
  return {id,name,placement:s.placement,code:s.code,enabled:!!s.enabled,pages,respectOptOut:!!s.respectOptOut,template:String(s.template||'custom').slice(0,20)};
 });
 return {enabled:!!v?.enabled,snippets};
}

// "/blog/*" matches the blog and everything under it; anything else must match the page exactly.
export const pageMatches=(pages:string[],route:string)=>!pages.length||pages.some(p=>p.endsWith('*')?route.startsWith(p.slice(0,-1)):p===route||p===route.replace(/\/$/,'')||p+'/'===route);

function withNonce(code:string,nonce:string){
 // Full HTML (from a provider's copy button) keeps its tags; bare JavaScript is wrapped in one script tag.
 if(/<(script|noscript|img|link|meta|iframe|style|div|span|!--)\b/i.test(code))return code.replace(/<script\b(?![^>]*\bnonce=)/gi,`<script nonce="${nonce}"`);
 return `<script nonce="${nonce}">${code.replace(/<\/script/gi,'<\\/script')}</script>`;
}
// Respectful snippets sit in an inert <template>; a small loader copies them in unless the visitor opted out.
const loader=(id:string,nonce:string)=>`<script nonce="${nonce}">(function(t,me){try{if(navigator.globalPrivacyControl===true||localStorage.getItem('avault-optout')==='1')return}catch(e){}if(!t)return;Array.prototype.forEach.call(t.content.childNodes,function(c){var n=c;if(c.nodeName==='SCRIPT'){n=document.createElement('script');for(var i=0;i<c.attributes.length;i++)n.setAttribute(c.attributes[i].name,c.attributes[i].value);n.nonce='${nonce}';n.async=false;n.text=c.textContent}else n=c.cloneNode(true);me.parentNode.insertBefore(n,me)})})(document.getElementById('avs-${id}'),document.currentScript)</script>`;
export function renderSnippet(s:Snippet,nonce:string){
 const code=withNonce(s.code,nonce),mark=`<!-- avault:snippet:${s.id} -->`;
 return s.respectOptOut?`${mark}<template id="avs-${s.id}">${code}</template>${loader(s.id,nonce)}`:mark+code;
}
```

### lib/avault/spam.ts

<!-- avault-file path="lib/avault/spam.ts" mode="owned" sha256="e91198c4f711a3709df449aff61e7ee174d864aeaa4f3ab5ee6448b38db0dcca" eol="1" -->
```ts
import {mongoDb} from '@/db/mongo';
import {HttpError} from './store';

// Lead-form spam defence, in layers:
//  1. A signed, single-use form token issued by /api/forms/token. Bots that post straight to the API
//     (most form spam) have no token; a token can't be forged without AVAULT_ENCRYPTION_KEY or replayed.
//  2. A hidden honeypot field people never see or fill (injected into every lead form by enhancePublic).
//  3. Rate limits per IP (hour and day) and per email address (day).
//  4. Content checks. Anything caught here is still stored, but as status "spam" with no email sent,
//     so a false positive can be restored from AVAULT → Leads → Spam.
export const HONEYPOT='contact_me_by_fax';
const MIN_AGE=2500,MAX_AGE=6*3600000;
const encoder=new TextEncoder();
const hex=(b:ArrayBuffer)=>Array.from(new Uint8Array(b)).map(n=>n.toString(16).padStart(2,'0')).join('');
async function key(){const secret=process.env.AVAULT_ENCRYPTION_KEY;if(!secret)throw new HttpError(503,'Forms are temporarily unavailable.');return crypto.subtle.importKey('raw',encoder.encode('form-token:'+secret),{name:'HMAC',hash:'SHA-256'},false,['sign'])}
const sign=async(data:string)=>hex(await crypto.subtle.sign('HMAC',await key(),encoder.encode(data)));
export const sha=async(s:string)=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(s)));

export async function issueFormToken(){const payload=`${Date.now()}.${crypto.randomUUID().replaceAll('-','')}`;return `${payload}.${await sign(payload)}`}

// Throws for a missing, forged, too-fast or expired token. Returns its age in seconds and consume(), which marks it used
// (and throws if it already was). Call consume() only after the fields are valid, so a corrected resubmission still works.
export async function verifyFormToken(token:unknown){
 const reload=new HttpError(422,'This form expired. Please reload the page and try again.');
 const [issued,nonce,mac]=String(token||'').split('.');if(!issued||!nonce||!mac||!/^\d{13}$/.test(issued)||!/^[0-9a-f]{32}$/.test(nonce))throw reload;
 const expected=await sign(`${issued}.${nonce}`);let diff=expected.length^mac.length;for(let i=0;i<expected.length;i++)diff|=expected.charCodeAt(i)^(mac.charCodeAt(i)||0);if(diff)throw reload;
 const age=Date.now()-Number(issued);if(age>MAX_AGE)throw reload;if(age<MIN_AGE)throw new HttpError(422,'Please review your details and try again.');
 // Single use: the unique index on rate_limits.id rejects a second insert of the same nonce.
 const consume=async()=>{try{await (await mongoDb()).collection('rate_limits').insertOne({id:'form-token:'+nonce,count:1,expires:Number(issued)+MAX_AGE})}catch{throw new HttpError(422,'This request was already sent. Reload the page to send another.')}};
 return {age:Math.round(age/1000),consume};
}

async function bump(id:string,windowMs:number){const db=await mongoDb();const row=await db.collection('rate_limits').findOneAndUpdate({id},{$inc:{count:1},$setOnInsert:{expires:Date.now()+windowMs}},{upsert:true,returnDocument:'after'});return Number(row?.count||0)}
export async function enforceLimits(ip:string,email:string){
 const hour=Math.floor(Date.now()/3600000),day=Math.floor(Date.now()/86400000);
 const [perHour,perDay,perEmail]=await Promise.all([bump('form-ip-h:'+await sha(ip+hour),3600000),bump('form-ip-d:'+await sha(ip+day),86400000),bump('form-email-d:'+await sha(email.toLowerCase()+day),86400000)]);
 if(perHour>4||perDay>12||perEmail>3)throw new HttpError(429,'Too many requests. Please try again later, or call us.');
}

// Throwaway inbox services that real business leads don't use.
const DISPOSABLE=new Set(['mailinator.com','guerrillamail.com','guerrillamail.info','sharklasers.com','10minutemail.com','tempmail.com','temp-mail.org','temp-mail.io','yopmail.com','trashmail.com','getnada.com','dispostable.com','maildrop.cc','fakeinbox.com','throwawaymail.com','mailnesia.com','mintemail.com','emailondeck.com','spamgourmet.com','mohmal.com','tempail.com','moakt.com','burnermail.io','mailpoof.com','tempr.email','discard.email','33mail.com','spambox.us','grr.la','emltmp.com','tmpmail.org','tmail.ws']);
const LINK=/https?:\/\/|www\.|\[url|<a\s|\.(?:ru|cn|top|xyz|click|loan|work|biz)\b/i;
const SPAM_WORDS=/\b(?:viagra|cialis|casino|porn|crypto(?:currency)? invest|bitcoin|forex|loan offer|backlinks? (?:package|for sale)|guest post|seo packages? from \$|rank (?:you|your site) #?1|whatsapp me|telegram)\b/i;
const FOREIGN_SCRIPT=/[Ѐ-ӿ؀-ۿ一-鿿぀-ヿ가-힯]/;

// Reasons a submission looks automated. An empty list means it passed.
export function contentFlags(v:{name:string;email:string;website:string;goal:string;request:string},ageSeconds:number,duplicate:boolean){
 const flags:string[]=[];const name=v.name.trim(),domain=v.email.split('@')[1]?.toLowerCase()||'';
 if(LINK.test(name)||/[@#$%^*=<>{}[\]|\\/]/.test(name)||/\d{3,}/.test(name))flags.push('links or symbols in the name');
 // Random-string bot names: one long "word" with case flips and a consonant run, e.g. "kJhGfDsaQwe".
 if(!/\s/.test(name)&&name.length>=10&&(name.slice(1).match(/[A-Z]/g)||[]).length>=2&&/[a-z][A-Z]/.test(name)&&/[bcdfghjklmnpqrstvwxz]{4,}/i.test(name))flags.push('random-looking name');
 if(name.length>2&&!/[aeiouy]/i.test(name)&&!FOREIGN_SCRIPT.test(name))flags.push('name has no vowels');
 if(name.length>0&&name.toLowerCase()===v.email.split('@')[0].toLowerCase()&&/\d/.test(name))flags.push('name copied from email');
 if(DISPOSABLE.has(domain))flags.push('disposable email address');
 if(FOREIGN_SCRIPT.test(name+v.goal))flags.push('non-Latin text');
 if(LINK.test(v.goal)||(v.goal.match(/https?:\/\//g)||[]).length>0)flags.push('links in the message');
 if(SPAM_WORDS.test(v.goal+' '+v.name+' '+v.request))flags.push('spam phrases');
 if(v.goal.length>600)flags.push('very long message');
 if(ageSeconds<4)flags.push('sent too quickly');
 if(duplicate)flags.push('same email and website sent in the last 24 hours');
 return flags;
}
```

### lib/avault/store.ts

<!-- avault-file path="lib/avault/store.ts" mode="owned" sha256="0e624563e5050a44efe50e622ef345529f034306b34e025af6473d7cad1d8f0e" eol="1" -->
```ts
import type {Block} from './blocks';
import {CONFIG} from './config';
import {database, objectStore} from '@/db/mongo';
export type Field={key:string;value:string;kind:string;label:string;section:string;group?:string};
export type Doc={blocks?:Block[];sectionOrder?:string[];hiddenSections?:string[];category?:string;tags?:string[];scheduledAt?:string;templateRoute?:string;route:string;label:string;kind:string;template:string;fields:Field[];seo:{title:string;description:string;image:string;imageAlt:string;noindex:boolean;canonical:string;nofollow?:boolean;noarchive?:boolean;sitemap?:boolean;ogTitle?:string;ogDescription?:string;twitterCard?:'summary'|'summary_large_image';schema?:string};body?:string;author?:string;authorUrl?:string;excerpt?:string;featuredImage?:string;featuredAlt?:string;ids:string[];images:{src:string;alt:string}[];links:string[];publishedAt?:string;updatedAt?:string;revision:number};
export const db=database;
export const bucket=objectStore;
export const now=()=>new Date().toISOString();
export const id=()=>crypto.randomUUID();
export const esc=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const rootAsset=(value:string)=>/^(?:assets|media)\//i.test(value.trim())?'/'+value.trim():value;
const rootAssetsInHtml=(html:string)=>String(html||'').replace(/\b(src|href|poster|data-src)="((?:assets|media)\/[^"<>]*)"/gi,(_m,attr,value)=>`${attr}="/${value}"`);
function oneH1(template:string,fields:Field[]){let seen=0;const changed=new Set<string>();const html=template.replace(/<h1(\b[^>]*)>([\s\S]*?)<\/h1>/gi,(tag,attrs,inner)=>{seen++;if(seen===1)return tag;for(const m of String(inner).matchAll(/\{\{(f\d+)\}\}/g))changed.add(m[1]);return `<h2${attrs}>${inner}</h2>`});return {template:html,fields:fields.map(f=>changed.has(f.key)&&f.label==='h1'?{...f,label:'h2'}:f)};}
const concise=(value:string,max:number)=>{const text=String(value||'').trim();if(text.length<=max)return text;const suffix=' | '+CONFIG.name;const without=text.endsWith(suffix)?text.slice(0,-suffix.length).trim():text;if(without.length<=max)return without;const cut=without.slice(0,max+1);return cut.slice(0,Math.max(cut.lastIndexOf(' '),Math.floor(max*.72))).replace(/[\s,;:.-]+$/,'');};
/** Normalizes imported legacy records without introducing a JSON fallback or mutating MongoDB on read. */
export function normalizeDoc(value:Doc):Doc{const fields=(value.fields||[]).map(f=>({...f,value:f.kind==='url'?rootAsset(f.value):f.value}));const heading=oneH1(rootAssetsInHtml(value.template),fields);return {...value,template:heading.template,fields:heading.fields,body:rootAssetsInHtml(value.body||''),seo:{...value.seo,title:concise(value.seo?.title||'',65),description:concise(value.seo?.description||'',170),image:rootAsset(value.seo?.image||'')},featuredImage:rootAsset(value.featuredImage||''),images:(value.images||[]).map(i=>({...i,src:rootAsset(i.src)})),blocks:(value.blocks||[]).map(b=>({...b,...('url' in b&&typeof b.url==='string'?{url:rootAsset(b.url)}:{})}))};}
export async function actor(req:Request){
 // Lazy import keeps node:crypto out of any module graph that only needs the helpers below.
 const {sessionUser}=await import('./auth');const user=await sessionUser(req);
 if(!user)throw new HttpError(401,'Sign in to continue.');return user;
}
// Behind the web server the app sees http://127.0.0.1:PORT; the browser's view comes from forwarded headers.
export function requestOrigin(req:Request){const u=new URL(req.url);const host=(req.headers.get('x-forwarded-host')||req.headers.get('host')||u.host).split(',')[0].trim();const proto=(req.headers.get('x-forwarded-proto')||u.protocol.replace(':','')).split(',')[0].trim();return `${proto}://${host}`}
// The web server appends the connecting address last, so the rightmost entry is the one a visitor can't forge.
export function clientIp(req:Request){const forwarded=(req.headers.get('x-forwarded-for')||'').split(',').map(s=>s.trim()).filter(Boolean);return forwarded[forwarded.length-1]||req.headers.get('x-real-ip')||'unknown'}
export class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
export async function body(req:Request,max=300000){if(Number(req.headers.get('content-length')||0)>max)throw new HttpError(413,'Request too large.');const s=await req.text();if(s.length>max)throw new HttpError(413,'Request too large.');try{return JSON.parse(s)}catch{throw new HttpError(400,'Invalid request.')}}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');if(!origin||![CONFIG.origin,requestOrigin(req)].includes(origin))throw new HttpError(403,'Reload this page before trying again.');}
export async function readDoc(route:string,draft=false):Promise<Doc|null>{const r=await db().prepare('SELECT * FROM documents WHERE route=?').bind(route).first<{draft:string;published:string|null;revision:number;updated_at:string}>();if(!r||!draft&&!r.published)return null;const value=JSON.parse(draft?r.draft:r.published!);return normalizeDoc({...value,revision:r.revision,updatedAt:r.updated_at});}
export async function allDocs(){const records=await db().prepare('SELECT route,published,revision,updated_at FROM documents').all<{route:string;published:string|null;revision:number;updated_at:string}>();const map:Record<string,Doc>={};for(const r of records.results)if(r.published)map[r.route]=normalizeDoc({...JSON.parse(r.published),revision:r.revision,updatedAt:r.updated_at});return map;}
export function safeUrl(s:string){if(s.startsWith('/')&&!s.startsWith('//')&&!/[\\\x00-\x20]/.test(s))return true;try{return ['https:','http:','mailto:','tel:'].includes(new URL(s).protocol)}catch{return /^#[a-zA-Z0-9_-]+$/.test(s)}}
export async function globals(){const r=await db().prepare('SELECT value FROM settings WHERE id=?').bind('global').first<{value:string}>();if(!r)throw new Error('Global site settings are missing from MongoDB. Run npm run db:migrate-avault -- --apply.');return JSON.parse(r.value);}
export function audit(d:Doc,registry:Record<string,Doc>){const errors:string[]=[];for(const b of d.blocks||[]){if(d.ids.includes('block-'+b.id))errors.push('Duplicate section anchor: block-'+b.id);const urls=[...(b.type==='cta'?[b.url||'']:[]),...Array.from((b.text||'').matchAll(/\[[^\]]+\]\(([^\s)]+)/g),m=>m[1])];for(const link of urls){if(!safeUrl(link))errors.push('Unsafe block link');else if(link.startsWith('/')){const u=new URL(link,CONFIG.origin);if(!registry[u.pathname]&&!u.pathname.startsWith('/assets/')&&!u.pathname.startsWith('/media/'))errors.push('Missing block destination: '+link)}}}for(const link of [...String(d.body||'').matchAll(/<a\b[^>]*href="([^"]*)"/g)].map(m=>m[1].replace(/&amp;/g,'&'))){if(!safeUrl(link))errors.push('Unsafe article link: '+link);else if(link.startsWith('/')){const u=new URL(link,CONFIG.origin);if(!registry[u.pathname]&&!u.pathname.startsWith('/assets/')&&!u.pathname.startsWith('/media/'))errors.push('Missing article link destination: '+link)}}
 if(!d.seo.description.trim()&&!d.excerpt?.trim())errors.push('A search description is required (or an excerpt for posts).');if(d.seo.image&&!safeUrl(d.seo.image))errors.push('Social image URL is invalid.');if(d.seo.canonical!==CONFIG.origin+d.route)errors.push('Canonical must match this published route.');for(const f of d.fields.filter(f=>f.kind==='url')){if(!safeUrl(f.value))errors.push('Unsafe link: '+f.value);if(f.label==='a href'&&(f.value.startsWith('/')||f.value.startsWith('#'))){const u=new URL(f.value,CONFIG.origin+d.route);const target=registry[u.pathname];if(!target&&!u.pathname.startsWith('/assets/')&&!u.pathname.startsWith('/media/'))errors.push('Missing destination: '+f.value);else if(target&&u.hash&&!target.ids.includes(decodeURIComponent(u.hash.slice(1))))errors.push('Missing anchor: '+f.value);}}return [...new Set(errors)];}
export const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Strict-Transport-Security':'max-age=31536000; includeSubDomains'};
export function json(value:unknown,status=200){return Response.json(value,{status,headers});}
export function failure(e:unknown){if(e instanceof HttpError)return json({error:e.message},e.status);const text=String(e instanceof Error?e.message:e);if(/UNIQUE constraint|E11000|valid_write/.test(text))return json({error:'Something changed or that address is already taken. No changes were applied. Reload and try again.'},409);console.error('AVAULT request failed',e instanceof Error?e.message:'unavailable');return json({error:'Temporarily unavailable. Your changes have not been discarded.'},503)}
```

### lib/avault/system-pages.ts

<!-- avault-file path="lib/avault/system-pages.ts" mode="owned" sha256="dd5eb79481c2e49a6b46d39922108f9ee38ddc323a7aa13874a9580f0fd1aa7f" eol="1" -->
```ts
import {CONFIG} from './config';
import {Doc,esc} from './store';
import {render} from './render';
import {profile,type Profile} from './site';

// Code-owned utility pages use the public site's own header, footer, typography and motion shell.
export type SystemPage='contact'|'thank-you'|'not-found';
export const SYSTEM_PAGE_ROUTE:Record<SystemPage,string>={contact:'/contact/','thank-you':'/thank-you/','not-found':'/not-found/'};
const COLORS=['blue','red','blue','red'];
const colorWord=(word:string)=>{let i=0;return [...word].map(ch=>ch===' '?'<span class="av-sys-gap"> </span>':`<span class="av-sys-${COLORS[i++%COLORS.length]}">${esc(ch)}</span>`).join('')};
const arrow='<svg class="cta-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7"/></svg>';
const button=(href:string,label:string,secondary=false)=>`<a class="av-sys-button${secondary?' av-sys-button-secondary':''}" href="${href}"><span>${label}</span>${arrow}</a>`;
const DAYS:Record<string,string>={Mo:'Monday',Tu:'Tuesday',We:'Wednesday',Th:'Thursday',Fr:'Friday',Sa:'Saturday',Su:'Sunday'};
const time=(t:string)=>{const [h,m]=t.split(':').map(Number);return `${h%12||12}${m?':'+String(m).padStart(2,'0'):''} ${h<12?'AM':'PM'}`};
const hoursLine=(h:string)=>{const [days,span]=h.split(' ');const [a,b]=(span||'').split('-');return `${days.split(',').map(d=>d.split('-').map(x=>DAYS[x]||x).join(' – ')).join(', ')}${a&&b?`, ${time(a)} – ${time(b)}`:''}`};
const icon=(path:string)=>`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const tel='tel:'+CONFIG.phone.replace(/[^+0-9]/g,'');

function contactMain(p:Profile){
 const a=p.address,street=[esc(a.street),esc([a.city,a.region].filter(Boolean).join(', ')+(a.postalCode?' '+a.postalCode:''))].filter(s=>s.trim()).join('<br>');
 const cards=[
  `<li class="av-contact-card av-c-blue">${icon('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>')}<h2>Call us</h2><p>Talk with a commercial door repair specialist.</p><a href="${tel}">${esc(CONFIG.phoneDisplay)}</a></li>`,
  ...(p.email?[`<li class="av-contact-card av-c-red">${icon('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>')}<h2>Email us</h2><p>Send door details, photos or scheduling questions.</p><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></li>`]:[]),
  ...(street?[`<li class="av-contact-card av-c-yellow">${icon('<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>')}<h2>Service office</h2><p>${street}</p>${p.mapUrl?`<a href="${esc(p.mapUrl)}" target="_blank" rel="noopener">Get directions</a>`:''}</li>`]:[]),
  ...(p.hours.length?[`<li class="av-contact-card av-c-green">${icon('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>')}<h2>Service hours</h2><p>${p.hours.map(h=>esc(hoursLine(h))).join('<br>')}</p></li>`]:[]),
 ];
 return `<section class="av-sys-hero av-sys-contact"><div class="shell-wide av-sys-inner">
  <p class="i-kicker av-sys-kicker"><span class="av-sys-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></span> Contact ${esc(CONFIG.name)}</p>
  <h1>Tell us what your <span class="av-sys-soft">commercial door needs.</span></h1>
  <p class="av-sys-lead">Share the door type, damage, location and best time to reach you. Our team will review the request and follow up about repair or replacement options.</p>
  <div class="av-sys-actions">${button('#contact','Request an estimate')}${button(tel,'Call '+CONFIG.phoneDisplay,true)}</div>
  <ul class="av-contact-cards">${cards.join('')}</ul>
  <ol class="av-sys-steps"><li><b class="av-sys-blue">1</b><strong>Send the details</strong><span>Include your ZIP code, service need and a short description.</span></li><li><b class="av-sys-red">2</b><strong>We assess the job</strong><span>We review the door, hardware or glass issue and the service location.</span></li><li><b class="av-sys-blue">3</b><strong>We arrange service</strong><span>A specialist follows up with next steps and scheduling.</span></li></ol>
 </div><div class="i-hero-line" aria-hidden="true"><span></span><span></span><span></span><span></span></div></section>`;
}

const PAGES:Record<SystemPage,{label:string;title:string;description:string;main:string|((p:Profile)=>string);index?:boolean}>={
 contact:{label:'Contact us',title:'Contact DMV Commercial Door Repair',description:`Request commercial door, glass or hardware service across D.C., Maryland and Virginia. Call ${CONFIG.phoneDisplay} or send your job details.`,index:true,main:contactMain},
 'thank-you':{label:'Thank you',title:'Request received | '+CONFIG.name,description:'Your service request has reached the DMV Commercial Door Repair team.',main:`<section class="av-sys-hero av-ty"><div class="shell-wide av-ty-grid"><div class="av-ty-copy"><span class="av-ty-badge" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span><p class="i-kicker av-sys-kicker">Request received</p><h1>Thank you.</h1><p class="av-ty-sub">Your request is with our commercial door repair team.</p><p class="av-sys-lead">We will review your service details and contact you about the next step. If the job is urgent, call us now.</p><div class="av-sys-actions">${button('/','Back to the homepage')}${button(tel,'Call '+CONFIG.phoneDisplay,true)}</div></div><aside class="av-ty-card" aria-label="What happens next"><div class="av-ty-card-head"><span>Your request</span><b>Received</b></div><h2>What happens next</h2><ol class="av-ty-timeline"><li class="done"><b>1</b><div><strong>Request received</strong><span>Your details are safely with our team.</span></div></li><li><b>2</b><div><strong>We assess the service need</strong><span>We review the door type, issue and location.</span></div></li><li><b>3</b><div><strong>We contact you</strong><span>A specialist follows up about service and scheduling.</span></div></li></ol></aside></div><div class="i-hero-line" aria-hidden="true"><span></span><span></span><span></span><span></span></div></section>`},
 'not-found':{label:'Page not found',title:'Page not found | '+CONFIG.name,description:'The requested page could not be found.',main:`<section class="av-sys-hero av-sys-404"><div class="shell-wide av-sys-inner"><p class="i-kicker av-sys-kicker">Error 404</p><p class="av-sys-giant" aria-hidden="true">${colorWord('404')}</p><h1>This page moved <span class="av-sys-soft">or never existed.</span></h1><p class="av-sys-lead">The link may be old or mistyped. Return home to find commercial door services, or call and we will point you in the right direction.</p><div class="av-sys-actions">${button('/','Go to the homepage')}${button(tel,'Call '+CONFIG.phoneDisplay,true)}</div><ul class="av-sys-links" aria-label="Popular pages"><li><a href="/commercial-door-closers/">Commercial door closers</a></li><li><a href="/commercial-exit-devices/">Commercial exit devices</a></li><li><a href="/ada-handicap-exit-devices/">ADA and exit devices</a></li><li><a href="/blogs/">Door repair guides</a></li></ul></div><div class="i-hero-line" aria-hidden="true"><span></span><span></span><span></span><span></span></div></section>`},
};

export function systemPage(kind:SystemPage,home:Doc,g:Record<string,any>,registry:Record<string,Doc>,origin:string){
 const p=PAGES[kind],route=SYSTEM_PAGE_ROUTE[kind],main=typeof p.main==='function'?p.main(profile(g)):p.main;
 const template=home.template.replace(/<main\b[^>]*>[\s\S]*<\/main>/,`<main id="main">${main}</main>`).replace('</head>','<link rel="stylesheet" href="/system-pages.css"></head>');
 const doc:Doc={...home,route,label:p.label,kind:'page',template,blocks:[],sectionOrder:undefined,hiddenSections:undefined,body:'',seo:{...home.seo,title:p.title,description:p.description,canonical:origin+route,noindex:!p.index,nofollow:false,schema:'',ogTitle:p.title,ogDescription:p.description}};
 return render(doc,g,false,registry,origin);
}
```

### lib/utils.ts

<!-- avault-file path="lib/utils.ts" mode="shared" sha256="53f3d3d070f0a9082934da25b875f9499855c2b0693868dd28be8c23d8730f68" eol="1" -->
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

### mongodb-compat.d.ts

<!-- avault-file path="mongodb-compat.d.ts" mode="owned" sha256="cce753c8329aca344d65b2e67ee29a7ce30cea31160b955482aa79865021e328" eol="1" -->
```ts
type D1PreparedStatement = import('./db/mongo').MongoPreparedStatement;
```

### postcss.config.mjs

<!-- avault-file path="postcss.config.mjs" mode="shared" sha256="dfac7ac2d86d326a0e5adb024e7943c181393ed17a5fcb8f0315b24c7da6ddde" eol="1" -->
```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### proxy.ts

<!-- avault-file path="proxy.ts" mode="owned" sha256="d366d49654e64c60c87f3ccaf052565cf648d7520949806b9f67b5827465fa9b" eol="1" -->
```ts
import {NextRequest,NextResponse} from 'next/server';

// Only a quick gate: requests without a session cookie go to the sign-in page. Every AVAULT page and API
// call still verifies the signed session against the MongoDB `users` collection (lib/avault/auth.ts).
const PUBLIC=['/avault/login/','/api/admin/login/','/api/admin/logout/'];

export function proxy(request:NextRequest){
  const path=request.nextUrl.pathname.endsWith('/')?request.nextUrl.pathname:request.nextUrl.pathname+'/';
  if(PUBLIC.includes(path)||request.cookies.has('avault_session'))return NextResponse.next();
  const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'};
  const navigation=request.headers.get('sec-fetch-mode')==='navigate';
  if(path.startsWith('/api/')&&!navigation)return NextResponse.json({error:'Sign in to continue.'},{status:401,headers});
  // Next requires an absolute URL here; build it from the browser-facing host, not the internal one.
  const host=(request.headers.get('x-forwarded-host')||request.headers.get('host')||request.nextUrl.host).split(',')[0].trim();
  const proto=(request.headers.get('x-forwarded-proto')||request.nextUrl.protocol.replace(':','')).split(',')[0].trim();
  // Come back to the requested screen after signing in (an API download link returns to AVAULT's start page).
  const next=path.startsWith('/avault/')?request.nextUrl.pathname+request.nextUrl.search:'/avault/';
  const response=NextResponse.redirect(`${proto}://${host}/avault/login/?next=${encodeURIComponent(next)}`,307);
  for(const [k,v] of Object.entries(headers))response.headers.set(k,v);
  return response;
}

export const config={matcher:['/avault/:path*','/api/admin/:path*']};
```

### public/avault-analytics.js

<!-- avault-file path="public/avault-analytics.js" mode="owned" sha256="0f344b905c175b2263fb34cac391c86f6c6883c880bb1593262113323ceb0266" eol="1" -->
```js
// First-party visitor journeys for AVAULT: page views (with time on page), link/button clicks, form sends and
// phone taps, in order. Honors the browser's Global Privacy Control signal and a footer opt-out link.
(()=>{if(window.__avaultAnalytics)return;window.__avaultAnalytics=true;
const store=(s,k,v)=>{try{if(v===undefined)return s.getItem(k);if(v===null)s.removeItem(k);else s.setItem(k,v)}catch{return null}};
const optedOut=()=>navigator.globalPrivacyControl===true||store(localStorage,'avault-optout')==='1';
const uuid=()=>crypto.randomUUID?crypto.randomUUID():'10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
function ids(){let session=store(sessionStorage,'avault-session'),visitor=store(localStorage,'avault-visitor');if(!session){session=uuid();store(sessionStorage,'avault-session',session)}if(!visitor){visitor=uuid();store(localStorage,'avault-visitor',visitor)}return {session,visitor}}
let pageStart=Date.now(),lastPath=location.pathname;
function send(type,extra={}){if(optedOut())return;const {session,visitor}=ids();const body=JSON.stringify({type,session,visitor,page:location.pathname,...extra});
 if(type!=='heartbeat'&&navigator.sendBeacon&&navigator.sendBeacon('/api/events/',new Blob([body],{type:'application/json'})))return;
 fetch('/api/events/',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{})}
const label=el=>(el.getAttribute('aria-label')||el.textContent||el.getAttribute('title')||'').replace(/\s+/g,' ').trim().slice(0,90);
function pageView(){send('page',{referrer:document.referrer,title:document.title.slice(0,120)});pageStart=Date.now();lastPath=location.pathname}
function leave(){const seconds=Math.round((Date.now()-pageStart)/1000);if(seconds>0)send('leave',{seconds,page:lastPath})}
pageView();
document.addEventListener('click',e=>{const el=e.target.closest?.('a,button,[role="button"]');if(!el||el.closest('#avault-bar'))return;const href=el.getAttribute('href')||'';
 if(href.startsWith('tel:'))return send('call',{target:href,label:label(el)});
 send('click',{label:label(el),href:href.slice(0,300)})},{capture:true});
document.addEventListener('submit',e=>{const f=e.target;send('form',{label:(f.getAttribute('aria-label')||f.dataset.service||f.className||'form').toString().slice(0,90)})},{capture:true});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')leave();else pageStart=Date.now()});
window.addEventListener('allure:navigation',()=>{leave();pageView()});
setInterval(()=>{if(document.visibilityState==='visible')send('heartbeat')},60000);
const optout=document.createElement('button');optout.type='button';optout.className='avault-measurement-preferences';
const paint=()=>{optout.textContent=optedOut()?'Visit tracking is off':'Don’t track my visits'};paint();
optout.onclick=()=>{if(navigator.globalPrivacyControl===true)return;store(localStorage,'avault-optout',optedOut()?null:'1');paint()};
(document.querySelector('.footer-utility')||document.querySelector('footer'))?.append(optout);
})();
```

### public/system-pages.css

<!-- avault-file path="public/system-pages.css" mode="owned" sha256="e6c3b4154f0f0b4bbbe3d8bcc0bfd0f26d175ab1feffa9de644ec0ac946767f4" eol="1" -->
```css
.shell-wide{width:min(1440px,calc(100% - var(--gutter)*2));margin-inline:auto}
.av-sys-hero{position:relative;isolation:isolate;overflow:hidden;min-height:calc(100svh - 141px);display:flex;align-items:center;padding-block:clamp(72px,9vw,136px);background:var(--paper)}
.av-sys-inner{position:relative;z-index:1}
.av-sys-kicker{display:flex;align-items:center;gap:12px;margin:0 0 24px;color:var(--navy);font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.av-sys-kicker:before{content:'';width:24px;height:2px;background:var(--red)}
.av-sys-hero h1{max-width:940px;color:var(--navy);font-size:clamp(48px,6.6vw,100px);line-height:.98;letter-spacing:-.04em}
.av-sys-soft{color:#778b9b}
.av-sys-lead{max-width:720px;margin-top:28px;color:var(--muted);font-size:18px;line-height:1.75}
.av-sys-actions{display:flex;flex-wrap:wrap;gap:14px;margin-top:36px}
.av-sys-button{display:inline-flex;align-items:center;justify-content:space-between;gap:28px;min-height:58px;padding:8px 8px 8px 22px;border:1px solid var(--red);border-radius:3px;background:var(--red);color:#fff;font-size:14px;font-weight:650;transition:transform .25s,background .25s,border-color .25s}
.av-sys-button .cta-arrow{display:grid;place-items:center;width:40px;height:40px;padding:10px;background:#ffffff1f}
.av-sys-button-secondary{border-color:var(--navy);background:transparent;color:var(--navy)}
.av-sys-button-secondary .cta-arrow{background:#0627440b}
.av-sys-button:hover,.av-sys-button:focus-visible{transform:translateY(-2px);background:var(--navy);border-color:var(--navy);color:#fff}
.av-sys-button-secondary:hover,.av-sys-button-secondary:focus-visible{background:var(--red);border-color:var(--red)}
.i-hero-line{position:absolute;right:0;bottom:0;left:0;display:grid;grid-template-columns:repeat(4,1fr);height:5px}
.i-hero-line span:nth-child(odd){background:var(--navy)}.i-hero-line span:nth-child(even){background:var(--red)}
.av-sys-giant{position:absolute;z-index:-1;top:50%;right:-.03em;margin:0;transform:translateY(-55%);font-family:var(--heading);font-size:clamp(230px,37vw,620px);font-weight:400;line-height:.75;letter-spacing:-.08em;opacity:.075;white-space:nowrap;pointer-events:none}
.av-sys-giant span{display:inline-block}.av-sys-blue,.av-sys-green{color:var(--navy)}.av-sys-red,.av-sys-yellow{color:var(--red)}.av-sys-gap{width:.12em}
.av-sys-links{display:flex;flex-wrap:wrap;gap:10px 26px;margin:48px 0 0;padding:26px 0 0;border-top:1px solid var(--line);list-style:none}
.av-sys-links a{color:var(--navy);font-size:14px;font-weight:600;text-decoration:underline;text-decoration-color:#a9b6c0;text-underline-offset:5px}
.av-sys-links a:hover{color:var(--red);text-decoration-color:var(--red)}
.av-sys-dots{display:inline-flex;gap:4px}.av-sys-dots i{width:5px;height:5px;background:var(--red)}
.av-contact-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;margin:56px 0 0;padding:1px;background:var(--line);list-style:none}
.av-contact-card{min-width:0;padding:30px;background:#fff}.av-contact-card svg{color:var(--red)}.av-contact-card h2{margin-top:28px;color:var(--navy);font-size:25px}.av-contact-card p{margin-top:12px;font-size:15px;line-height:1.7}.av-contact-card>a{display:inline-block;margin-top:18px;color:var(--navy);font-weight:650;text-decoration:underline;text-underline-offset:5px;overflow-wrap:anywhere}
.av-sys-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:36px;margin:44px 0 0;padding:0;list-style:none}.av-sys-steps li{display:grid;grid-template-columns:42px 1fr;gap:6px 18px;padding-top:24px;border-top:1px solid var(--line)}.av-sys-steps b{grid-row:span 2;font-family:var(--heading);font-size:36px;line-height:1}.av-sys-steps strong{color:var(--navy);font-size:16px}.av-sys-steps span{color:var(--muted);font-size:14px;line-height:1.65}
.av-ty-grid{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1.25fr) minmax(340px,.75fr);gap:clamp(50px,8vw,120px);align-items:center}.av-ty-badge{display:grid;place-items:center;width:64px;height:64px;margin-bottom:28px;background:var(--red);color:#fff}.av-ty-copy h1{color:var(--navy);font-size:clamp(62px,8vw,118px)}.av-ty-sub{margin-top:18px;color:var(--navy);font-family:var(--heading);font-size:28px}.av-ty-card{padding:36px;background:#fff;border-top:4px solid var(--red);box-shadow:0 20px 55px #06274412}.av-ty-card-head{display:flex;justify-content:space-between;gap:20px;color:var(--muted);font-size:13px;text-transform:uppercase;letter-spacing:.09em}.av-ty-card-head b{color:#237459}.av-ty-card h2{margin-top:30px;color:var(--navy);font-size:34px}.av-ty-timeline{display:grid;gap:0;margin:26px 0 0;padding:0;list-style:none}.av-ty-timeline li{display:grid;grid-template-columns:36px 1fr;gap:16px;padding:19px 0;border-top:1px solid var(--line)}.av-ty-timeline li>b{display:grid;place-items:center;width:30px;height:30px;border:1px solid #bdc9d2;color:var(--navy)}.av-ty-timeline .done>b{border-color:var(--red);background:var(--red);color:#fff}.av-ty-timeline strong{display:block;color:var(--navy)}.av-ty-timeline span{display:block;margin-top:5px;color:var(--muted);font-size:14px;line-height:1.6}
@media(max-width:1000px){.av-contact-cards{grid-template-columns:repeat(2,1fr)}.av-ty-grid{grid-template-columns:1fr;gap:48px}.av-ty-card{max-width:680px}.av-sys-giant{top:31%;font-size:55vw}}
@media(max-width:700px){.av-sys-hero{min-height:calc(100svh - 116px);padding-block:64px}.av-sys-hero h1{font-size:clamp(44px,13vw,68px)}.av-sys-lead{font-size:16px}.av-sys-actions{display:grid}.av-sys-button{width:100%}.av-contact-cards,.av-sys-steps{grid-template-columns:1fr}.av-contact-card{padding:26px}.av-sys-links{display:grid;gap:16px}.av-sys-giant{top:25%;right:-.12em;font-size:74vw}.av-ty-sub{font-size:24px}.av-ty-card{padding:27px}.av-ty-card h2{font-size:29px}}
@media(prefers-reduced-motion:reduce){.av-sys-button{transition:none}.av-sys-button:hover,.av-sys-button:focus-visible{transform:none}}
```

### scripts/audit-database-seo.mjs

<!-- avault-file path="scripts/audit-database-seo.mjs" mode="owned" sha256="da8447bd4fb3d9d1bc7b25e177713170a12e912203766a953e5da6bd1db86a03" eol="1" -->
```js
import fs from 'node:fs';
import {MongoClient} from 'mongodb';

for(const file of ['.env.local','.env'])if(fs.existsSync(file))for(const line of fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'').split(/\r?\n/)){
 const match=line.match(/^([A-Z0-9_]+)=(.*)$/);if(match&&!process.env[match[1]])process.env[match[1]]=match[2].replace(/^["']|["']$/g,'');
}
if(!process.env.MONGODB_URI)throw new Error('MONGODB_URI is required.');
const origin=String(process.env.NEXT_PUBLIC_SITE_URL||'').replace(/\/$/,'');
if(!/^https:\/\//.test(origin))throw new Error('NEXT_PUBLIC_SITE_URL must be a full https origin.');

const markdownLinks=value=>[...String(value||'').matchAll(/\[[^\]\n]+\]\(([^\s)]+)/g)].map(match=>match[1]);
function internalRoutes(document){
 const fields=new Map((document.fields||[]).map(field=>[field.key,String(field.value||'')]));
 const html=String(document.template||'').replace(/\{\{(f\d+)\}\}/g,(_match,key)=>fields.get(key)||'')+'\n'+String(document.body||'');
 const links=[...html.matchAll(/\bhref=["']([^"']+)["']/gi)].map(match=>match[1]);
 for(const field of document.fields||[])if(field.label==='a href'||field.kind==='url')links.push(field.value);
 for(const block of document.blocks||[]){if(block.type==='cta'&&block.url)links.push(block.url);links.push(...markdownLinks(block.text));for(const item of block.items||[])links.push(...markdownLinks(item));}
 const routes=[];for(const href of links)try{const url=new URL(String(href),origin+document.route);if(url.origin===origin&&!/^(?:\/assets\/|\/media\/|\/api\/|\/avault\/)/.test(url.pathname))routes.push(url.pathname.endsWith('/')||url.pathname==='/'?url.pathname:url.pathname+'/')}catch{}
 return [...new Set(routes)];
}

const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});await client.connect();
try{
 const db=client.db(process.env.MONGODB_DB||undefined),records=await db.collection('documents').find({published:{$ne:null}},{projection:{_id:0,route:1,published:1}}).sort({route:1}).toArray();
 const docs=records.map(record=>JSON.parse(String(record.published))),routes=new Set(docs.map(document=>document.route)),incoming=new Map([...routes].map(route=>[route,0]));
 let storedSchema=0,invalidSchema=0;
 for(const document of docs){
  const raw=String(document.seo?.schema||'').trim();if(raw){storedSchema++;try{JSON.parse(raw)}catch{invalidSchema++;}}
  document._internal=internalRoutes(document).filter(route=>routes.has(route)&&route!==document.route);for(const route of document._internal)incoming.set(route,(incoming.get(route)||0)+1);
 }
 console.log(`Published pages: ${docs.length}; stored page schema: ${storedSchema}; invalid schema: ${invalidSchema}.`);
 for(const document of docs)console.log(`${document.route} outgoing=${document._internal.length} incoming=${incoming.get(document.route)||0} schema=${document.seo?.schema?'stored':'generated-only'}`);
 const orphans=docs.filter(document=>document.route!=='/'&&!document.seo?.noindex&&!(incoming.get(document.route)||0));
 const deadEnds=docs.filter(document=>!document.seo?.noindex&&!document._internal.length);
 if(orphans.length)console.log('ORPHANS '+orphans.map(document=>document.route).join(', '));
 if(deadEnds.length)console.log('DEAD ENDS '+deadEnds.map(document=>document.route).join(', '));
 if(invalidSchema||orphans.length||deadEnds.length)process.exitCode=1;
}finally{await client.close()}
```

### scripts/create-admin.mjs

<!-- avault-file path="scripts/create-admin.mjs" mode="owned" sha256="12c2a15f31464102303544daa65cfc47719faf74a1ae5a78b26bd7d4026b6098" eol="1" -->
```js
// Create an AVAULT account or reset its password:  npm run admin:create -- you@example.com [owner|administrator]
// The password is asked for interactively (hidden), so it never lands in shell history.
import {randomBytes,scrypt} from 'node:crypto';
import fs from 'node:fs';
import {MongoClient} from 'mongodb';

for(const file of ['.env.local','.env'])if(fs.existsSync(file))for(const line of fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'').split(/\r?\n/)){const m=line.match(/^([A-Z0-9_]+)=(.*)$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^["']|["']$/g,'')}
const [emailArg,roleArg='owner']=process.argv.slice(2);const email=String(emailArg||'').trim().toLowerCase();
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!['owner','administrator'].includes(roleArg)){console.error('Usage: npm run admin:create -- you@example.com [owner|administrator]');process.exit(1)}
if(!process.env.MONGODB_URI){console.error('MONGODB_URI is missing (.env.local).');process.exit(1)}

// Connect first, so a network problem shows up before you type a password.
const host=(()=>{try{return new URL(process.env.MONGODB_URI).host}catch{return 'the MONGODB_URI host'}})();
const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:10000});
try{await client.connect()}catch(e){console.error(`Can't reach MongoDB at ${host}: ${e.message}
Check MONGODB_URI in .env.local and that this server is allowed to connect to that port.`);process.exit(1)}

let pending='';
// Text pasted together with this command (e.g. the next lines of a copied block) must not become the password.
async function discardTypeahead(){const input=process.stdin;input.setRawMode?.(true);input.setEncoding('utf8');const sink=()=>{};input.on('data',sink);input.resume();await new Promise(r=>setTimeout(r,300));input.off('data',sink);input.pause();input.setRawMode?.(false)}
function ask(question){return new Promise(resolve=>{const input=process.stdin;process.stdout.write(question);let value='';
 const take=()=>{while(pending){const char=pending[0];pending=pending.slice(1);if(char==='\u0003')process.exit(130);if(char==='\r'||char==='\n'){if(char==='\r'&&pending[0]==='\n')pending=pending.slice(1);input.setRawMode?.(false);input.pause();input.off('data',onData);process.stdout.write('\n');resolve(value);return}if(char==='\u007f'||char==='\b')value=value.slice(0,-1);else value+=char}};
 const onData=chunk=>{pending+=chunk;take()};input.setRawMode?.(true);input.setEncoding('utf8');input.on('data',onData);input.resume();take()})}
if(process.stdin.isTTY)await discardTypeahead();
const password=await ask('Password for '+email+': ');
if(password.length<12||password.length>128){console.error('Use a password between 12 and 128 characters.');await client.close();process.exit(1)}
if(await ask('Repeat password: ')!==password){console.error('Passwords do not match.');await client.close();process.exit(1)}

// Same format as lib/avault/auth.ts hashPassword().
const salt=randomBytes(16);const key=await new Promise((resolve,reject)=>scrypt(password,salt,64,{N:16384,r:8,p:1,maxmem:64*1024*1024},(e,k)=>e?reject(e):resolve(k)));
const hash=`scrypt$16384$8$1$${salt.toString('base64')}$${key.toString('base64')}`;
try{const db=client.db(process.env.MONGODB_DB||undefined);const stamp=new Date().toISOString();
 const result=await db.collection('users').updateOne({email},{$set:{role:roleArg,active:true,password_hash:hash,password_changed_at:stamp,updated_at:stamp},$inc:{session_version:1},$setOnInsert:{email,created_at:stamp}},{upsert:true});
 console.log(`${result.upsertedCount?'Created':'Updated'} ${roleArg} ${email} in database "${db.databaseName}". Sign in at /avault/login/`);
}finally{await client.close()}
```

### scripts/decrypt-backup.mjs

<!-- avault-file path="scripts/decrypt-backup.mjs" mode="owned" sha256="07c827df446b3841eefbea976628b8f63c25f012e8fe9559b77f5467e53be934" eol="1" -->
```js
// Opens an AVAULT backup downloaded from AVAULT → Backups. Downloads stay encrypted (AES-256-GCM with the site's
// AVAULT_ENCRYPTION_KEY); this writes the decrypted JSON snapshot next to it, or to the path given.
//   npm run backup:decrypt -- avault-backup-2026-10-27-<id>.enc [out.json] [--checksum <sha256>]
// The checksum (shown as the X-Backup-Checksum download header, and stored in the backups collection) is optional;
// when given, the decrypted snapshot must match it.
import fs from 'node:fs';
import {createDecipheriv,createHash} from 'node:crypto';

for(const file of ['.env.local','.env'])if(fs.existsSync(file))for(const line of fs.readFileSync(file,'utf8').replace(/^﻿/,'').split(/\r?\n/)){
  const match=line.match(/^([A-Z0-9_]+)=(.*)$/);if(match&&!process.env[match[1]])process.env[match[1]]=match[2].replace(/^["']|["']$/g,'');
}
const args=process.argv.slice(2);const at=args.indexOf('--checksum');const checksum=at>=0?args.splice(at,2)[1]:'';
const [input,output=String(input||'').replace(/\.enc$/,'')+'.json']=args;
if(!input){console.error('Usage: npm run backup:decrypt -- <backup.enc> [out.json] [--checksum <sha256>]');process.exit(1)}
const key=process.env.AVAULT_ENCRYPTION_KEY||'';
if(!/^[a-f0-9]{64}$/.test(key)){console.error('AVAULT_ENCRYPTION_KEY (64 hex characters) is required: use the key of the site that made the backup.');process.exit(1)}

// Format written by seal() in lib/avault/runtime.ts: "<iv hex>.<ciphertext + 16-byte GCM tag, hex>".
const [iv,data]=fs.readFileSync(input,'utf8').trim().split('.');
if(!iv||!data){console.error('This is not an AVAULT backup file.');process.exit(1)}
const sealed=Buffer.from(data,'hex');
let text;
try{const decipher=createDecipheriv('aes-256-gcm',Buffer.from(key,'hex'),Buffer.from(iv,'hex'));decipher.setAuthTag(sealed.subarray(-16));text=Buffer.concat([decipher.update(sealed.subarray(0,-16)),decipher.final()]).toString('utf8')}
catch{console.error('Could not decrypt: wrong encryption key, or the file is damaged.');process.exit(1)}
const digest=createHash('sha256').update(text).digest('hex');
if(checksum&&checksum!==digest){console.error('Integrity check failed: the decrypted snapshot does not match the checksum.');process.exit(1)}
fs.writeFileSync(output,text,{mode:0o600});
const snapshot=JSON.parse(text);
console.log(`Decrypted backup from ${snapshot.createdAt} (${snapshot.origin}) to ${output}`);
for(const [table,rows] of Object.entries(snapshot.tables||{}))console.log(`  ${table.padEnd(12)} ${rows.length}`);
console.log('It contains leads and password hashes. Keep it private and delete it when you are done.');
```

### scripts/ensure-schema-links.mjs

<!-- avault-file path="scripts/ensure-schema-links.mjs" mode="owned" sha256="68f6816876f42781290248cfc1f655e4c2c501c376032d1507d7daf6278e059c" eol="1" -->
```js
import fs from 'node:fs';
import {MongoClient} from 'mongodb';

for(const file of ['.env.local','.env'])if(fs.existsSync(file))for(const line of fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'').split(/\r?\n/)){
 const match=line.match(/^([A-Z0-9_]+)=(.*)$/);if(match&&!process.env[match[1]])process.env[match[1]]=match[2].replace(/^["']|["']$/g,'');
}
if(!process.env.MONGODB_URI)throw new Error('MONGODB_URI is required.');
const origin=String(process.env.NEXT_PUBLIC_SITE_URL||'').replace(/\/$/,'');
if(!/^https:\/\//.test(origin))throw new Error('NEXT_PUBLIC_SITE_URL must be a full https origin.');

const markdownLinks=value=>[...String(value||'').matchAll(/\[[^\]\n]+\]\(([^\s)]+)/g)].map(match=>match[1]);
function internalRoutes(document){
 const fields=new Map((document.fields||[]).map(field=>[field.key,String(field.value||'')]));
 const html=String(document.template||'').replace(/\{\{(f\d+)\}\}/g,(_match,key)=>fields.get(key)||'')+'\n'+String(document.body||'');
 const links=[...html.matchAll(/\bhref=["']([^"']+)["']/gi)].map(match=>match[1]);
 for(const field of document.fields||[])if(field.label==='a href'||field.kind==='url')links.push(field.value);
 for(const block of document.blocks||[]){if(block.type==='cta'&&block.url)links.push(block.url);links.push(...markdownLinks(block.text));for(const item of block.items||[])links.push(...markdownLinks(item));}
 const routes=[];for(const href of links)try{const url=new URL(String(href),origin+document.route);if(url.origin===origin&&!/^(?:\/assets\/|\/media\/|\/api\/|\/avault\/)/.test(url.pathname))routes.push(url.pathname.endsWith('/')||url.pathname==='/'?url.pathname:url.pathname+'/')}catch{}
 return [...new Set(routes)];
}
const words=value=>new Set(String(value||'').toLowerCase().split(/[^a-z0-9]+/).filter(word=>word.length>3&&!['commercial','door','doors','repair','dmv','page'].includes(word)));
function related(document,registry){
 const available=internalRoutes(document).filter(route=>registry.has(route)&&route!==document.route),sourceWords=words(document.label);
 return available.map((route,index)=>{const target=registry.get(route),targetWords=words(target.label);let score=document.kind===target.kind?20:0;if(document.kind==='post'&&route==='/blogs/')score+=30;if(document.route==='/blogs/'&&target.kind==='post')score+=30;if(route==='/contact-us/')score+=3;for(const word of sourceWords)if(targetWords.has(word))score+=8;return {route,target,index,score}})
  .sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,8);
}
function withSchema(document,registry){
 const links=related(document,registry);if(!links.length)throw new Error(`${document.route} has no published internal links to describe.`);
 let nodes=[];const raw=String(document.seo?.schema||'').trim();if(raw){const parsed=JSON.parse(raw);nodes=Array.isArray(parsed)?parsed:[parsed]}
 const itemList={'@type':'ItemList',name:'Related pages',itemListElement:links.map(({route,target},index)=>({'@type':'ListItem',position:index+1,name:target.label,url:origin+route}))};
 const existing=nodes.findIndex(node=>node?.['@type']==='ItemList'&&node?.name==='Related pages');if(existing>=0)nodes[existing]=itemList;else nodes.push(itemList);
 if(nodes.length>10)throw new Error(`${document.route} would exceed the 10-node custom schema limit.`);
 return {...document,seo:{...(document.seo||{}),schema:JSON.stringify(nodes.length===1?nodes[0]:nodes)}};
}

const apply=process.argv.includes('--apply'),client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});await client.connect();
try{
 const db=client.db(process.env.MONGODB_DB||undefined),documents=db.collection('documents'),records=await documents.find({},{projection:{route:1,draft:1,published:1,revision:1,updated_at:1}}).sort({route:1}).toArray();
 const registries={};for(const state of ['draft','published'])registries[state]=new Map(records.filter(record=>record[state]).map(record=>{const document=JSON.parse(String(record[state]));return [document.route,document]}));
 const stamp=new Date().toISOString(),migrationId='ensure-schema-links-'+stamp;let changed=0;
 for(const record of records){const patch={};for(const state of ['draft','published'])if(record[state]){const before=JSON.parse(String(record[state])),after=withSchema(before,registries[state]);if(JSON.stringify(before)!==JSON.stringify(after))patch[state]=JSON.stringify({...after,revision:Number(record.revision||0)+1,updatedAt:stamp})}
  if(!Object.keys(patch).length)continue;changed++;if(!apply)continue;
  await db.collection('migration_backups').insertOne({migrationId,route:record.route,record,created_at:stamp});
  const result=await documents.updateOne({_id:record._id,revision:record.revision},{$set:{...patch,revision:Number(record.revision||0)+1,updated_at:stamp}});if(!result.modifiedCount)throw new Error(`${record.route} changed during migration; rerun the command.`);
 }
 console.log(`${apply?'Persisted':'Would persist'} related-page ItemList schema for ${changed} of ${records.length} MongoDB document record(s).${apply?' Backup id: '+migrationId:' Run again with --apply to write changes.'}`);
}finally{await client.close()}
```

### scripts/migrate-dmv-avault.mjs

<!-- avault-file path="scripts/migrate-dmv-avault.mjs" mode="owned" sha256="84d09a74ab88cbe7259080686730dcc7be1daad957b7b391f9365d5d2e264baa" eol="1" -->
```js
import fs from 'node:fs';
import {randomBytes,scrypt} from 'node:crypto';
import {MongoClient} from 'mongodb';

for(const file of ['.env.local','.env'])if(fs.existsSync(file))for(const line of fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'').split(/\r?\n/)){
  const match=line.match(/^([A-Z0-9_]+)=(.*)$/);if(match&&!process.env[match[1]])process.env[match[1]]=match[2].replace(/^["']|["']$/g,'');
}
if(!process.env.MONGODB_URI)throw new Error('MONGODB_URI is required.');
const apply=process.argv.includes('--apply');
const origin=(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000').replace(/\/$/,'');
const decode=s=>s.replace(/&nbsp;/g,'\u00a0').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&amp;/g,'&');
const plain=s=>decode(String(s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ')).trim();
const ATTRS=['href','src','alt','aria-label','placeholder','title'];
const VOID=new Set(['area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr']);

function shell(page){
  const bodyClass=String(page.bodyClass||'').replace(/"/g,'&quot;');
  const content=String(page.contentHtml||'').replace(/class="([^"]*\bestimate-form\b[^"]*)"/g,(_,c)=>`class="${c.includes('audit-form')?c:c+' audit-form'}"`);
  return `<!doctype html><html lang="en" class="is-loading"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#062744"><link rel="icon" href="/assets/favicon.ico?v=3" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png?v=3"><link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon-180.png"><link rel="preload" href="/assets/dmv-logo-loader.gif" as="image"><link rel="preload" href="/assets/cal-sans.woff" as="font" type="font/woff" crossorigin><link rel="preload" href="/assets/google-sans.woff" as="font" type="font/woff" crossorigin><link rel="stylesheet" href="/assets/fonts.css"><link rel="stylesheet" href="/assets/flaticon.css"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/service-pages.css"><link rel="stylesheet" href="/support-pages.css">{{SEO}}</head><body class="${bodyClass}"><div id="page-curtain" class="page-curtain" aria-hidden="true"><span class="page-curtain-panel page-curtain--left"></span><span class="page-curtain-panel page-curtain--right"></span></div><div class="site-loader" id="site-loader" role="status" aria-label="Loading DMV Commercial Door Repair"><div class="loader-panel loader-panel--left"></div><div class="loader-panel loader-panel--right"></div><div class="loader-content"><img src="/assets/dmv-logo-loader.gif" alt="" width="640" height="240" fetchpriority="high"><div class="loader-track"><span></span></div><p>D.C. · MARYLAND · VIRGINIA</p></div></div><a class="skip-link" href="#main">Skip to content</a><div id="app" inert>${page.headerHtml}<main id="main">${content}</main>${page.footerHtml}</div><script defer src="/assets/gsap.min.js"></script><script defer src="/assets/ScrollTrigger.min.js"></script><script defer src="/assets/lenis.min.js"></script><script type="module" src="/dmv-runtime.js"></script></body></html>`;
}

function convert(page){
  let html=shell(page);const fields=[];let n=0,group='navigation',section='Header',skip=0;const stack=[];
  const add=(value,kind,label)=>{const key='f'+n++,clean=kind==='url'&&/^(?:assets|media)\//i.test(value)?'/'+value:value;fields.push({key,value:clean,kind,label,section,group});return `{{${key}}}`};
  const parts=html.split(/(<!--[\s\S]*?-->|<[^>]+>)/);
  for(let i=0;i<parts.length;i++){
    const p=parts[i];if(!p||p.startsWith('<!--'))continue;
    if(p.startsWith('<')){
      const close=p.startsWith('</'),name=(p.match(/^<\/?([a-zA-Z0-9-]+)/)?.[1]||'').toLowerCase();
      if(['head','script','style','svg','noscript','template'].includes(name)){skip+=close?-1:(p.endsWith('/>')?0:1);continue}
      if(name==='main')group=close?'footer':'content';
      if(close){const at=stack.lastIndexOf(name);if(at>=0)stack.length=at;continue}
      if(skip||name.startsWith('!'))continue;
      let tag=p;for(const attr of ATTRS){if(attr==='href'&&name!=='a')continue;if(attr==='src'&&name!=='img')continue;
        tag=tag.replace(new RegExp(`(\\s${attr}=")([^"{]+)(")`),(_,a,value,z)=>a+add(decode(value),attr==='href'||attr==='src'?'url':'text',`${name} ${attr}`)+z);
      }
      parts[i]=tag;if(!VOID.has(name)&&!p.endsWith('/>'))stack.push(name);continue;
    }
    if(skip||!p.trim())continue;
    const parent=stack.at(-1)||'span',lead=p.match(/^\s*/)[0],trail=p.match(/\s*$/)[0],value=decode(p.trim());
    if(parent==='h1'||parent==='h2')section=plain(value).slice(0,90);
    parts[i]=lead+add(value,'text',parent)+trail;
  }
  const template=parts.join('');
  const images=fields.filter(f=>f.label==='img src').map(f=>{const at=fields.indexOf(f);return {src:f.value,alt:fields[at+1]?.label==='img alt'?fields[at+1].value:''}});
  const h1=plain(page.contentHtml.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]);
  const route=page.path==='/'?'/':('/'+String(page.path||'').split('/').filter(Boolean).join('/')+'/');
  const kind=route.startsWith('/blogs/')&&route!=='/blogs/'?'post':route==='/'||route==='/blogs/'||route==='/contact-us/'||route==='/faqs/'?'page':'service';
  const stamp=page.updatedAt instanceof Date?page.updatedAt.toISOString():String(page.updatedAt||new Date().toISOString());
  return {route,label:h1||String(page.title||route).split('|')[0].trim(),kind,template,fields,seo:{title:String(page.title||''),description:String(page.description||''),image:images.find(x=>x.src&&!x.src.includes('logo'))?.src||'/assets/hero.jpg',imageAlt:images.find(x=>x.src&&!x.src.includes('logo'))?.alt||'',noindex:false,canonical:origin+route,nofollow:false,noarchive:false,sitemap:true,twitterCard:'summary_large_image'},ids:[...template.matchAll(/\sid="([^"{}]+)"/g)].map(m=>m[1]),images,links:fields.filter(f=>f.label==='a href').map(f=>f.value),publishedAt:kind==='post'?stamp:undefined,updatedAt:stamp,revision:0};
}

const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});await client.connect();
try{
  const db=client.db(process.env.MONGODB_DB||undefined);const pages=await db.collection('pages').find({status:{$ne:'draft'}}).sort({path:1}).toArray();
  const docs=pages.map(convert);for(const doc of docs)console.log(`${doc.route.padEnd(52)} ${doc.kind.padEnd(8)} ${String(doc.fields.length).padStart(4)} fields`);
  if(!apply){console.log(`\nDry run: ${docs.length} pages. Re-run with --apply to write AVAULT records.`);process.exitCode=0;}
  else{
    const now=new Date().toISOString();
    for(const doc of docs)await db.collection('documents').updateOne({route:doc.route},{$set:{id:doc.route,route:doc.route,draft:JSON.stringify(doc),published:JSON.stringify(doc),revision:0,updated_at:now}},{upsert:true});
    const global={name:'DMV Commercial Door Repair',legalName:'DMV Commercial Door Repair',tagline:'Commercial door repair across D.C., Maryland and Virginia.',businessType:'LocalBusiness',email:'',phone:'+18885990548',image:'/assets/hero.jpg',logo:'/assets/logo.png',address:{street:'',city:'',region:'',postalCode:'',country:'US'},geo:{lat:'',lng:''},hours:[],mapUrl:'',socials:{},priceRange:'$$',areaServed:'Washington, D.C., Maryland and Virginia',titleTemplate:'%s | DMV Commercial Door Repair',defaultDescription:'Commercial door repair, glass replacement and door hardware service across Washington, D.C., Maryland and Virginia.',navigation:{}};
    await db.collection('settings').updateOne({id:'global'},{$set:{id:'global',value:JSON.stringify(global),revision:0}},{upsert:true});
    // The other settings modules AVAULT's screens read (Forms needs `forms`; db:verify-content checks them all). Only
    // created when missing, so re-running the migration never replaces choices already saved in AVAULT.
    const field=(name,label,type,required,width,placeholder='')=>({name,label,type,placeholder,required,options:[],width});
    const modules={
      forms:{contact:{enabled:true,request:'Commercial door repair estimate',button:'Request an estimate',note:'',fields:[field('name','Name','text',true,'half'),field('email','Email','email',false,'half'),field('phone','Phone','tel',true,'half'),field('zip','Business ZIP code','text',true,'half'),field('service','Service needed','text',true,'full'),field('details','Project details','textarea',false,'full')]},hero:{enabled:false,label:'Business ZIP code',placeholder:'Enter your ZIP code',button:'Get started'},custom:[]},
      scripts:{enabled:false,snippets:[]},
      menus:{header:[],footer:[],mobile:[],utility:[]},
      traffic:{enabled:false,allow:[],deny:[],countries:[]},
      operations:{analytics:true,retentionDays:365,dailyBackup:true,formRetentionDays:0},
      verification:{google:'',bing:''},
      files:{robots:'',llms:'',sitemaps:{exclude:[],custom:{'sm_pages.xml':[],'sm_posts.xml':[]}}},
    };
    const seeded=[];for(const [id,value] of Object.entries(modules)){const r=await db.collection('settings').updateOne({id},{$setOnInsert:{id,value:JSON.stringify(value),revision:0}},{upsert:true});if(r.upsertedCount)seeded.push(id)}
    const email=String(process.env.DEVELOPER_EMAIL||'software@alluredigital.net').trim().toLowerCase(),password=String(process.env.DEVELOPER_PASSWORD||'');
    if(password){const salt=randomBytes(16);const key=await new Promise((resolve,reject)=>scrypt(password,salt,64,{N:16384,r:8,p:1,maxmem:64*1024*1024},(error,value)=>error?reject(error):resolve(value)));const password_hash=`scrypt$16384$8$1$${salt.toString('base64')}$${key.toString('base64')}`;await db.collection('users').updateOne({email},{$set:{email,role:'owner',active:true,password_hash,password_changed_at:now,updated_at:now},$inc:{session_version:1},$setOnInsert:{created_at:now}},{upsert:true});}
    console.log(`\nMigrated ${docs.length} published pages, global site settings${seeded.length?`, default ${seeded.join(', ')} settings`:''}${password?', and the AVAULT owner account':''}.`);
  }
}finally{await client.close()}
```

### scripts/normalize-content-records.mjs

<!-- avault-file path="scripts/normalize-content-records.mjs" mode="owned" sha256="0a033174a6fb65b7ba99894acb5f636591fe8929350994db5fc0e12dd670ed2f" eol="1" -->
```js
import fs from 'node:fs';
import {MongoClient} from 'mongodb';

for(const file of ['.env.local','.env'])if(fs.existsSync(file))for(const line of fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'').split(/\r?\n/)){
 const match=line.match(/^([A-Z0-9_]+)=(.*)$/);if(match&&!process.env[match[1]])process.env[match[1]]=match[2].replace(/^["']|["']$/g,'');
}
if(!process.env.MONGODB_URI)throw new Error('MONGODB_URI is required.');

const rootAsset=value=>/^(?:assets|media)\//i.test(String(value||'').trim())?'/'+String(value).trim():String(value||'');
const rootHtml=html=>String(html||'').replace(/\b(src|href|poster|data-src)="((?:assets|media)\/[^"<>]*)"/gi,(_m,attr,value)=>`${attr}="/${value}"`);
const concise=(value,max)=>{const text=String(value||'').trim();if(text.length<=max)return text;const cut=text.slice(0,max+1);return cut.slice(0,Math.max(cut.lastIndexOf(' '),Math.floor(max*.72))).replace(/[\s,;:.-]+$/,'')};
function normalize(document){
 const next=structuredClone(document),changedFields=new Set();let seen=0;
 next.template=rootHtml(next.template).replace(/<h1(\b[^>]*)>([\s\S]*?)<\/h1>/gi,(tag,attrs,inner)=>{if(++seen===1)return tag;for(const m of inner.matchAll(/\{\{(f\d+)\}\}/g))changedFields.add(m[1]);return `<h2${attrs}>${inner}</h2>`});
 next.fields=(next.fields||[]).map(field=>({...field,value:field.kind==='url'?rootAsset(field.value):field.value,label:changedFields.has(field.key)&&field.label==='h1'?'h2':field.label}));
 next.body=rootHtml(next.body||'');next.featuredImage=rootAsset(next.featuredImage||'');
 next.images=(next.images||[]).map(image=>({...image,src:rootAsset(image.src)}));
 next.blocks=(next.blocks||[]).map(block=>({...block,...(typeof block.url==='string'?{url:rootAsset(block.url)}:{})}));
 next.seo={...(next.seo||{}),title:concise(next.seo?.title,65),description:concise(next.seo?.description,170),image:rootAsset(next.seo?.image||'')};
 return next;
}

const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});await client.connect();
try{
 const db=client.db(process.env.MONGODB_DB||undefined),documents=db.collection('documents'),stamp=new Date().toISOString(),migrationId='normalize-content-'+stamp;
 const records=await documents.find({},{projection:{route:1,draft:1,published:1,revision:1,updated_at:1}}).toArray();let updated=0;
 for(const record of records){const patch={};for(const state of ['draft','published'])if(record[state]){const before=JSON.parse(String(record[state])),after=normalize(before);if(JSON.stringify(before)!==JSON.stringify(after))patch[state]=JSON.stringify({...after,revision:Number(record.revision||0)+1,updatedAt:stamp})}
  if(!Object.keys(patch).length)continue;
  await db.collection('migration_backups').insertOne({migrationId,route:record.route,record,created_at:stamp});
  const result=await documents.updateOne({_id:record._id,revision:record.revision},{$set:{...patch,revision:Number(record.revision||0)+1,updated_at:stamp}});if(result.modifiedCount)updated++;
 }
 const seeds={forms:{contact:{enabled:true,request:'Commercial door repair estimate',button:'Preview My Estimate Request',note:'Your request is securely saved for the DMV Commercial Door Repair team.',fields:[{name:'name',label:'Your name',type:'text',placeholder:'Full name',required:true,options:[],width:'half'},{name:'phone',label:'Phone number',type:'tel',placeholder:'Your phone number',required:true,options:[],width:'half'},{name:'email',label:'Email address',type:'email',placeholder:'you@company.com',required:false,options:[],width:'half'},{name:'zip',label:'Business ZIP code',type:'text',placeholder:'ZIP code',required:true,options:[],width:'half'},{name:'service',label:'What does your door need?',type:'select',placeholder:'Select a service',required:true,width:'full',options:['Broken or cracked glass','Emergency board-up','Door hardware repair','Glass replacement','Other commercial door service']},{name:'details',label:'Tell us a little more',type:'textarea',placeholder:'Door type, damage, and the best time to reach you',required:false,options:[],width:'full'}]},custom:[]},scripts:{enabled:false,snippets:[]},menus:{header:[],mobile:[],footer:[],utility:[]},traffic:{enabled:false,allow:[],deny:[],countries:[]},operations:{analytics:true,retentionDays:365,dailyBackup:false,formRetentionDays:0},verification:{google:'',bing:''},files:{robots:'',llms:'',sitemaps:{exclude:[],custom:{'sm_pages.xml':[],'sm_posts.xml':[]}}}};
 for(const [setting,value] of Object.entries(seeds))await db.collection('settings').updateOne({id:setting},{$setOnInsert:{id:setting,value:JSON.stringify(value),revision:0}},{upsert:true});
 const forms=await db.collection('settings').findOne({id:'forms'});if(forms){const value=JSON.parse(String(forms.value||'{}')),hasQuickZip=records.some(record=>['draft','published'].some(state=>record[state]&&/\bhero-proposal\b/.test(JSON.parse(String(record[state])).template||'')));let changed=false;if(!Array.isArray(value.custom)){value.custom=[];changed=true}if(!hasQuickZip&&value.hero){delete value.hero;changed=true}if(changed){await db.collection('migration_backups').insertOne({migrationId,route:'@forms',record:forms,created_at:stamp});await db.collection('settings').updateOne({_id:forms._id,revision:forms.revision},{$set:{value:JSON.stringify(value)},$inc:{revision:1}})}}
 console.log(`Normalized ${updated} of ${records.length} MongoDB document record(s). Backup id: ${migrationId}`);
}finally{await client.close()}
```

### scripts/sync-site-origin.mjs

<!-- avault-file path="scripts/sync-site-origin.mjs" mode="owned" sha256="61c1beef0f9a131c65a1ff4e19caab4bec50a690ba2e242f49993df932f43e6b" eol="1" -->
```js
import fs from 'node:fs';
import {MongoClient} from 'mongodb';

for(const file of ['.env.local','.env'])if(fs.existsSync(file))for(const line of fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'').split(/\r?\n/)){
 const match=line.match(/^([A-Z0-9_]+)=(.*)$/);if(match&&!process.env[match[1]])process.env[match[1]]=match[2].replace(/^["']|["']$/g,'');
}
if(!process.env.MONGODB_URI)throw new Error('MONGODB_URI is required.');
const origin=String(process.env.NEXT_PUBLIC_SITE_URL||'').replace(/\/$/,'');
if(!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(origin))throw new Error('NEXT_PUBLIC_SITE_URL must be an HTTPS origin without a path.');

const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});
await client.connect();
try{
 const collection=client.db(process.env.MONGODB_DB||undefined).collection('documents');
 const records=await collection.find({},{projection:{route:1,draft:1,published:1,revision:1}}).toArray();
 let updated=0;
 for(const record of records){
  const route=String(record.route||'/');
  const nextRevision=Number(record.revision||0)+1;
  const patch={};
  let changed=false;
  for(const state of ['draft','published']){
   if(!record[state])continue;
   const document=JSON.parse(String(record[state]));
   const canonical=origin+route;
   if(document.seo?.canonical===canonical)continue;
   document.seo={...(document.seo||{}),canonical};
   document.revision=nextRevision;
   patch[state]=JSON.stringify(document);
   changed=true;
  }
  if(changed){await collection.updateOne({_id:record._id,revision:record.revision},{$set:{...patch,revision:nextRevision,updated_at:new Date().toISOString()}});updated++}
 }
 console.log(`Canonical origin ${origin}: ${updated} document record(s) updated, ${records.length-updated} already current.`);
}finally{
 await client.close();
}
```

### scripts/verify-custom-scripts.mjs

<!-- avault-file path="scripts/verify-custom-scripts.mjs" mode="owned" sha256="cf157f3c1402810f4ee5166c441218598fb31c374182c7202c5be4f52955abf5" eol="1" -->
```js
import fs from 'node:fs';
import {MongoClient} from 'mongodb';
for(const file of ['.env.local','.env'])if(fs.existsSync(file))for(const line of fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'').split(/\r?\n/)){const m=line.match(/^([A-Z0-9_]+)=(.*)$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^["']|["']$/g,'')}
const origin=process.argv[2]||'http://127.0.0.1:4190',client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});await client.connect();const collection=client.db(process.env.MONGODB_DB||undefined).collection('settings'),before=await collection.findOne({id:'scripts'});if(!before)throw new Error('scripts setting is missing.');
const marker='avault-integration-'+Date.now(),value=JSON.parse(String(before.value||'{}'));value.enabled=true;value.snippets=[...(Array.isArray(value.snippets)?value.snippets:[]),{id:marker,name:'Temporary integration check',placement:'bodyEnd',code:'window.__avaultScriptIntegration=true;',enabled:true,pages:['/'],respectOptOut:false,template:'custom'}];
try{await collection.updateOne({_id:before._id},{$set:{value:JSON.stringify(value)}});const response=await fetch(origin+'/',{headers:{'user-agent':'AVAULT integration check'}}),html=await response.text();if(!response.ok||!html.includes(`avault:snippet:${marker}`)||!html.includes('window.__avaultScriptIntegration=true;')||!new RegExp(`<script nonce="[^"]+">window\\.__avaultScriptIntegration=true;`).test(html))throw new Error(`Custom script was not rendered correctly (HTTP ${response.status}).`);console.log('PASS custom script marker, code, placement and CSP nonce rendered on the frontend.')}finally{await collection.replaceOne({_id:before._id},before);await client.close()}
```

### scripts/verify-database-content.mjs

<!-- avault-file path="scripts/verify-database-content.mjs" mode="owned" sha256="28478287e7b2ade0f6adb636e47ef86dfe2ad7cbce47ceaa426f971dd3f871e8" eol="1" -->
```js
import fs from 'node:fs';
import {MongoClient} from 'mongodb';
for(const file of ['.env.local','.env'])if(fs.existsSync(file))for(const line of fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'').split(/\r?\n/)){const m=line.match(/^([A-Z0-9_]+)=(.*)$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^["']|["']$/g,'')}
if(!process.env.MONGODB_URI)throw new Error('MONGODB_URI is required.');
const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});await client.connect();
try{const db=client.db(process.env.MONGODB_DB||undefined),pingAt=Date.now();await db.command({ping:1});const docs=await db.collection('documents').find({},{projection:{route:1,draft:1,published:1}}).toArray(),problems=[];
 for(const record of docs)for(const state of ['draft','published'])if(record[state]){const d=JSON.parse(String(record[state])),h1=(d.template.match(/<h1\b/gi)||[]).length;if(h1!==1)problems.push(`${record.route} ${state}: ${h1} H1 headings`);if(/(?:src|href|poster|data-src)="(?:assets|media)\//i.test(d.template))problems.push(`${record.route} ${state}: unrooted media URL`);try{const parsed=JSON.parse(String(d.seo?.schema||'')),nodes=Array.isArray(parsed)?parsed:[parsed],related=nodes.find(node=>node?.['@type']==='ItemList'&&node?.name==='Related pages');if(!related||!Array.isArray(related.itemListElement)||!related.itemListElement.length)problems.push(`${record.route} ${state}: missing related-page ItemList schema`)}catch{problems.push(`${record.route} ${state}: invalid or missing stored page schema`)}}
 const settings=await db.collection('settings').find({id:{$in:['global','forms','scripts','menus','traffic']}},{projection:{id:1,value:1}}).toArray(),ids=new Set(settings.map(x=>x.id));for(const id of ['global','forms','scripts','menus','traffic'])if(!ids.has(id))problems.push(`Missing database setting: ${id}`);
 if(problems.length){console.error(problems.join('\n'));process.exitCode=1}else console.log(`PASS MongoDB answered in ${Date.now()-pingAt} ms; ${docs.length} document records have one H1, stored ItemList schema, and required settings.`)
}finally{await client.close()}
```

### vendor/shadcn-tailwind-4.13.0.css

<!-- avault-file path="vendor/shadcn-tailwind-4.13.0.css" mode="shared" sha256="bc7d83425702955b4cb67cb14ede9d603f9d912376d57a2d81d661094d2a782a" eol="1" -->
```css
@theme inline {
  @keyframes accordion-down {
    from {
      height: 0;
    }
    to {
      height: var(
        --radix-accordion-content-height,
        var(--accordion-panel-height, auto)
      );
    }
  }

  @keyframes accordion-up {
    from {
      height: var(
        --radix-accordion-content-height,
        var(--accordion-panel-height, auto)
      );
    }
    to {
      height: 0;
    }
  }
}

/* Custom variants */
@custom-variant data-open {
  &:where([data-state="open"]),
  &:where([data-open]:not([data-open="false"])) {
    @slot;
  }
}

@custom-variant data-closed {
  &:where([data-state="closed"]),
  &:where([data-closed]:not([data-closed="false"])) {
    @slot;
  }
}

@custom-variant data-checked {
  &:where([data-state="checked"]),
  &:where([data-checked]:not([data-checked="false"])) {
    @slot;
  }
}

@custom-variant data-unchecked {
  &:where([data-state="unchecked"]),
  &:where([data-unchecked]:not([data-unchecked="false"])) {
    @slot;
  }
}

@custom-variant data-selected {
  &:where([data-selected="true"]) {
    @slot;
  }
}

@custom-variant data-disabled {
  &:where([data-disabled="true"]),
  &:where([data-disabled]:not([data-disabled="false"])) {
    @slot;
  }
}

@custom-variant data-active {
  &:where([data-state="active"]),
  &:where([data-active]:not([data-active="false"])) {
    @slot;
  }
}

@custom-variant data-horizontal {
  &:where([data-orientation="horizontal"]) {
    @slot;
  }
}

@custom-variant data-vertical {
  &:where([data-orientation="vertical"]) {
    @slot;
  }
}

@utility no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

/* scroll-fade */
@property --scroll-fade-t {
  syntax: "<length-percentage>";
  inherits: false;
  initial-value: 0px;
}
@property --scroll-fade-b {
  syntax: "<length-percentage>";
  inherits: false;
  initial-value: 0px;
}
@property --scroll-fade-s {
  syntax: "<length-percentage>";
  inherits: false;
  initial-value: 0px;
}
@property --scroll-fade-e {
  syntax: "<length-percentage>";
  inherits: false;
  initial-value: 0px;
}
@property --scroll-fade-mask {
  syntax: "*";
  inherits: false;
}

@theme inline {
  @keyframes scroll-fade-reveal-t {
    from {
      --scroll-fade-t: 0px;
    }
    to {
      --scroll-fade-t: var(--_scroll-fade-size-t, var(--scroll-fade-size, min(12%, calc(var(--spacing) * 10))));
    }
  }
  @keyframes scroll-fade-reveal-b {
    from {
      --scroll-fade-b: var(--_scroll-fade-size-b, var(--scroll-fade-size, min(12%, calc(var(--spacing) * 10))));
    }
    to {
      --scroll-fade-b: 0px;
    }
  }
  @keyframes scroll-fade-reveal-s {
    from {
      --scroll-fade-s: 0px;
    }
    to {
      --scroll-fade-s: var(--_scroll-fade-size-s, var(--scroll-fade-size, min(12%, calc(var(--spacing) * 10))));
    }
  }
  @keyframes scroll-fade-reveal-e {
    from {
      --scroll-fade-e: var(--_scroll-fade-size-e, var(--scroll-fade-size, min(12%, calc(var(--spacing) * 10))));
    }
    to {
      --scroll-fade-e: 0px;
    }
  }
}

@utility scroll-fade {
  --_scroll-fade-size-t: var(
    --scroll-fade-t-size,
    var(--scroll-fade-size, min(12%, calc(var(--spacing) * 10)))
  );
  --_scroll-fade-size-b: var(
    --scroll-fade-b-size,
    var(--scroll-fade-size, min(12%, calc(var(--spacing) * 10)))
  );
  --scroll-fade-block: linear-gradient(
    to bottom,
    transparent 0,
    #000 var(--scroll-fade-t, 0px),
    #000 calc(100% - var(--scroll-fade-b, 0px)),
    transparent 100%
  );
  -webkit-mask-image: var(--scroll-fade-mask, var(--scroll-fade-block));
  mask-image: var(--scroll-fade-mask, var(--scroll-fade-block));
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;

  @supports (animation-timeline: scroll()) {
    animation:
      scroll-fade-reveal-t 1ms ease-in-out,
      scroll-fade-reveal-b 1ms ease-in-out;
    animation-timeline: scroll(self y), scroll(self y);
    animation-range:
      0 var(--scroll-fade-reveal, calc(var(--spacing) * 24)),
      calc(100% - var(--scroll-fade-reveal, calc(var(--spacing) * 24))) 100%;
    animation-fill-mode: both;
  }

  @supports not (animation-timeline: scroll()) {
    --scroll-fade-t: var(--_scroll-fade-size-t);
    --scroll-fade-b: var(--_scroll-fade-size-b);
  }
}

@utility scroll-fade-y {
  --_scroll-fade-size-t: var(
    --scroll-fade-t-size,
    var(--scroll-fade-size, min(12%, calc(var(--spacing) * 10)))
  );
  --_scroll-fade-size-b: var(
    --scroll-fade-b-size,
    var(--scroll-fade-size, min(12%, calc(var(--spacing) * 10)))
  );
  --scroll-fade-block: linear-gradient(
    to bottom,
    transparent 0,
    #000 var(--scroll-fade-t, 0px),
    #000 calc(100% - var(--scroll-fade-b, 0px)),
    transparent 100%
  );
  -webkit-mask-image: var(--scroll-fade-mask, var(--scroll-fade-block));
  mask-image: var(--scroll-fade-mask, var(--scroll-fade-block));
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;

  @supports (animation-timeline: scroll()) {
    animation:
      scroll-fade-reveal-t 1ms ease-in-out,
      scroll-fade-reveal-b 1ms ease-in-out;
    animation-timeline: scroll(self y), scroll(self y);
    animation-range:
      0 var(--scroll-fade-reveal, calc(var(--spacing) * 24)),
      calc(100% - var(--scroll-fade-reveal, calc(var(--spacing) * 24))) 100%;
    animation-fill-mode: both;
  }

  @supports not (animation-timeline: scroll()) {
    --scroll-fade-t: var(--_scroll-fade-size-t);
    --scroll-fade-b: var(--_scroll-fade-size-b);
  }
}

@utility scroll-fade-x {
  --_scroll-fade-size-s: var(
    --scroll-fade-s-size,
    var(--scroll-fade-size, min(12%, calc(var(--spacing) * 10)))
  );
  --_scroll-fade-size-e: var(
    --scroll-fade-e-size,
    var(--scroll-fade-size, min(12%, calc(var(--spacing) * 10)))
  );
  --scroll-fade-inline: linear-gradient(
    to right,
    transparent 0,
    #000 var(--scroll-fade-s, 0px),
    #000 calc(100% - var(--scroll-fade-e, 0px)),
    transparent 100%
  );
  &:where([dir="rtl"], [dir="rtl"] *) {
    --scroll-fade-inline: linear-gradient(
      to left,
      transparent 0,
      #000 var(--scroll-fade-s, 0px),
      #000 calc(100% - var(--scroll-fade-e, 0px)),
      transparent 100%
    );
  }
  -webkit-mask-image: var(--scroll-fade-mask, var(--scroll-fade-inline));
  mask-image: var(--scroll-fade-mask, var(--scroll-fade-inline));
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;

  @supports (animation-timeline: scroll()) {
    animation:
      scroll-fade-reveal-s 1ms ease-in-out,
      scroll-fade-reveal-e 1ms ease-in-out;
    animation-timeline: scroll(self inline), scroll(self inline);
    animation-range:
      0 var(--scroll-fade-reveal, calc(var(--spacing) * 24)),
      calc(100% - var(--scroll-fade-reveal, calc(var(--spacing) * 24))) 100%;
    animation-fill-mode: both;
  }

  @supports not (animation-timeline: scroll()) {
    --scroll-fade-s: var(--_scroll-fade-size-s);
    --scroll-fade-e: var(--_scroll-fade-size-e);
  }
}

@utility scroll-fade-t {
  --_scroll-fade-size-t: var(
    --scroll-fade-t-size,
    var(--scroll-fade-size, min(12%, calc(var(--spacing) * 10)))
  );
  --scroll-fade-mask: linear-gradient(
    to bottom,
    transparent 0,
    #000 var(--scroll-fade-t, 0px),
    #000 100%
  );
  -webkit-mask-image: var(--scroll-fade-mask);
  mask-image: var(--scroll-fade-mask);
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;

  @supports (animation-timeline: scroll()) {
    animation: scroll-fade-reveal-t 1ms ease-in-out;
    animation-timeline: scroll(self y);
    animation-range: 0 var(--scroll-fade-reveal, calc(var(--spacing) * 24));
    animation-fill-mode: both;
  }

  @supports not (animation-timeline: scroll()) {
    --scroll-fade-t: var(--_scroll-fade-size-t);
  }
}

@utility scroll-fade-b {
  --_scroll-fade-size-b: var(
    --scroll-fade-b-size,
    var(--scroll-fade-size, min(12%, calc(var(--spacing) * 10)))
  );
  --scroll-fade-mask: linear-gradient(
    to bottom,
    #000 0,
    #000 calc(100% - var(--scroll-fade-b, 0px)),
    transparent 100%
  );
  -webkit-mask-image: var(--scroll-fade-mask);
  mask-image: var(--scroll-fade-mask);
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;

  @supports (animation-timeline: scroll()) {
    animation: scroll-fade-reveal-b 1ms ease-in-out;
    animation-timeline: scroll(self y);
    animation-range: calc(
        100% - var(--scroll-fade-reveal, calc(var(--spacing) * 24))
      )
      100%;
    animation-fill-mode: both;
  }

  @supports not (animation-timeline: scroll()) {
    --scroll-fade-b: var(--_scroll-fade-size-b);
  }
}

@utility scroll-fade-l {
  --_scroll-fade-size-s: var(
    --scroll-fade-s-size,
    var(--scroll-fade-size, min(12%, calc(var(--spacing) * 10)))
  );
  --scroll-fade-mask: linear-gradient(
    to right,
    transparent 0,
    #000 var(--scroll-fade-s, 0px),
    #000 100%
  );
  -webkit-mask-image: var(--scroll-fade-mask);
  mask-image: var(--scroll-fade-mask);
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;

  @supports (animation-timeline: scroll()) {
    animation: scroll-fade-reveal-s 1ms ease-in-out;
    animation-timeline: scroll(self x);
    animation-range: 0 var(--scroll-fade-reveal, calc(var(--spacing) * 24));
    animation-fill-mode: both;
  }

  @supports not (animation-timeline: scroll()) {
    --scroll-fade-s: var(--_scroll-fade-size-s);
  }
}

@utility scroll-fade-r {
  --_scroll-fade-size-e: var(
    --scroll-fade-e-size,
    var(--scroll-fade-size, min(12%, calc(var(--spacing) * 10)))
  );
  --scroll-fade-mask: linear-gradient(
    to right,
    #000 0,
    #000 calc(100% - var(--scroll-fade-e, 0px)),
    transparent 100%
  );
  -webkit-mask-image: var(--scroll-fade-mask);
  mask-image: var(--scroll-fade-mask);
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;

  @supports (animation-timeline: scroll()) {
    animation: scroll-fade-reveal-e 1ms ease-in-out;
    animation-timeline: scroll(self x);
    animation-range: calc(
        100% - var(--scroll-fade-reveal, calc(var(--spacing) * 24))
      )
      100%;
    animation-fill-mode: both;
  }

  @supports not (animation-timeline: scroll()) {
    --scroll-fade-e: var(--_scroll-fade-size-e);
  }
}

@utility scroll-fade-s {
  --_scroll-fade-size-s: var(
    --scroll-fade-s-size,
    var(--scroll-fade-size, min(12%, calc(var(--spacing) * 10)))
  );
  --scroll-fade-mask: linear-gradient(
    to right,
    transparent 0,
    #000 var(--scroll-fade-s, 0px),
    #000 100%
  );
  &:where([dir="rtl"], [dir="rtl"] *) {
    --scroll-fade-mask: linear-gradient(
      to left,
      transparent 0,
      #000 var(--scroll-fade-s, 0px),
      #000 100%
    );
  }
  -webkit-mask-image: var(--scroll-fade-mask);
  mask-image: var(--scroll-fade-mask);
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;

  @supports (animation-timeline: scroll()) {
    animation: scroll-fade-reveal-s 1ms ease-in-out;
    animation-timeline: scroll(self inline);
    animation-range: 0 var(--scroll-fade-reveal, calc(var(--spacing) * 24));
    animation-fill-mode: both;
  }

  @supports not (animation-timeline: scroll()) {
    --scroll-fade-s: var(--_scroll-fade-size-s);
  }
}

@utility scroll-fade-e {
  --_scroll-fade-size-e: var(
    --scroll-fade-e-size,
    var(--scroll-fade-size, min(12%, calc(var(--spacing) * 10)))
  );
  --scroll-fade-mask: linear-gradient(
    to right,
    #000 0,
    #000 calc(100% - var(--scroll-fade-e, 0px)),
    transparent 100%
  );
  &:where([dir="rtl"], [dir="rtl"] *) {
    --scroll-fade-mask: linear-gradient(
      to left,
      #000 0,
      #000 calc(100% - var(--scroll-fade-e, 0px)),
      transparent 100%
    );
  }
  -webkit-mask-image: var(--scroll-fade-mask);
  mask-image: var(--scroll-fade-mask);
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;

  @supports (animation-timeline: scroll()) {
    animation: scroll-fade-reveal-e 1ms ease-in-out;
    animation-timeline: scroll(self inline);
    animation-range: calc(
        100% - var(--scroll-fade-reveal, calc(var(--spacing) * 24))
      )
      100%;
    animation-fill-mode: both;
  }

  @supports not (animation-timeline: scroll()) {
    --scroll-fade-e: var(--_scroll-fade-size-e);
  }
}

@utility scroll-fade-* {
  --scroll-fade-size: calc(var(--spacing) * --value(integer));
  --scroll-fade-size: --value([length], [percentage]);
}

@utility scroll-fade-t-* {
  --scroll-fade-t-size: calc(var(--spacing) * --value(integer));
  --scroll-fade-t-size: --value([length], [percentage]);
}

@utility scroll-fade-b-* {
  --scroll-fade-b-size: calc(var(--spacing) * --value(integer));
  --scroll-fade-b-size: --value([length], [percentage]);
}

@utility scroll-fade-s-* {
  --scroll-fade-s-size: calc(var(--spacing) * --value(integer));
  --scroll-fade-s-size: --value([length], [percentage]);
}

@utility scroll-fade-e-* {
  --scroll-fade-e-size: calc(var(--spacing) * --value(integer));
  --scroll-fade-e-size: --value([length], [percentage]);
}

@utility scroll-fade-none {
  --scroll-fade-mask: none;
}

/* shimmer */
@property --shimmer-angle {
  syntax: "<angle>";
  inherits: true;
  initial-value: 20deg;
}
@property --shimmer-image {
  syntax: "*";
  inherits: false;
}
@property --shimmer-text-fill {
  syntax: "*";
  inherits: false;
}

@theme inline {
  @keyframes tw-shimmer {
    from {
      background-position: 100% 0;
    }
    to {
      background-position: 0 0;
    }
  }
}

@utility shimmer {
  --_spread: var(--shimmer-spread, calc(3ch + 40px));
  --_base: currentColor;
  --_highlight: var(
    --shimmer-color,
    oklch(from currentColor l c h / calc(alpha* 0.2))
  );

  background-image: var(
    --shimmer-image,
    linear-gradient(
      calc(90deg + var(--shimmer-angle)),
      var(--_base) calc(50% - var(--_spread)),
      color-mix(in oklch, var(--_highlight), var(--_base) 50%)
        calc(50% - var(--_spread) * 0.5),
      var(--_highlight) 50%,
      color-mix(in oklch, var(--_highlight), var(--_base) 50%)
        calc(50% + var(--_spread) * 0.5),
      var(--_base) calc(50% + var(--_spread))
    )
  );
  background-repeat: no-repeat;
  background-size: calc(200% + var(--_spread) * 2) 100%;
  background-position: 0 0;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: var(--shimmer-text-fill, transparent);
  animation: tw-shimmer var(--shimmer-duration, 2s) linear infinite;

  @variant dark {
    --_highlight: var(
      --shimmer-color,
      oklch(from currentColor max(0.8, calc(l + 0.4)) c h / calc(alpha + 0.4))
    );
  }

  &:where([dir="rtl"], [dir="rtl"] *) {
    animation-direction: reverse;
  }
}

@utility shimmer-once {
  animation-iteration-count: 1;
}

@utility shimmer-reverse {
  animation-direction: reverse;
}

@utility shimmer-none {
  --shimmer-image: none;
  --shimmer-text-fill: currentColor;
}

@utility shimmer-color-* {
  --shimmer-color: --value(--color, [color]);
  --shimmer-color: color-mix(
    in oklch,
    --value(--color, [color]) calc(--modifier(integer) * 1%),
    transparent
  );
}

@utility shimmer-duration-* {
  --shimmer-duration: calc(--value(integer) * 1ms);
}

@utility shimmer-spread-* {
  --shimmer-spread: calc(var(--spacing) * --value(integer));
  --shimmer-spread: --value([length], [percentage]);
}

@utility shimmer-angle-* {
  --shimmer-angle: calc(--value(integer) * 1deg);
}

@media (prefers-reduced-motion: reduce) {
  .shimmer {
    animation: none;
    background-image: none;
    -webkit-text-fill-color: currentColor;
  }
}
```

### public/dmv-runtime.js

<!-- avault-file path="public/dmv-runtime.js" mode="reference" sha256="6a8e113585b0c7738769002dfd5b7b73259b0d158523432a133e131df759ba8c" eol="1" -->
```js
import {initHeader,initFAQ,initTestimonials,initServiceOfferings,initSupportPages} from './dmv/interactions.js';
import {initPageTransitions} from './dmv/page-transitions.js';
import {initMotion} from './dmv/motion.js';

if(typeof window.showSiteLoader!=='boolean'){
  window.showSiteLoader=true;
  try{
    window.showSiteLoader=sessionStorage.getItem('dmv.introPlayed')!=='1';
    if(window.showSiteLoader)sessionStorage.setItem('dmv.introPlayed','1');
  }catch{}
}
document.documentElement.classList.toggle('is-loading',window.showSiteLoader);
document.documentElement.classList.toggle('intro-complete',!window.showSiteLoader);
document.documentElement.classList.toggle('is-page-entering',!window.showSiteLoader);
window.loaderFailSafe=setTimeout(()=>{
  document.documentElement.classList.remove('is-loading','is-page-entering','is-page-leaving');
  document.querySelector('#site-loader')?.remove();
  document.querySelector('#page-curtain')?.remove();
  document.querySelector('#app')?.removeAttribute('inert');
},6500);

function bindEstimateForms(){
  document.querySelectorAll('.estimate-form').forEach(form=>{
    let tokenPromise=fetch('/api/forms/token',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(r=>r.token||'').catch(()=>'');
    const started=Date.now();
    form.addEventListener('submit',async event=>{
      event.preventDefault();if(!form.reportValidity())return;
      const status=form.querySelector('.form-status'),button=form.querySelector('button[type="submit"]');
      status.textContent='Sending your request…';button.disabled=true;
      try{
        const payload=Object.fromEntries(new FormData(form));
        Object.assign(payload,{request:payload.request||'Commercial door repair estimate',token:await tokenPromise,started,page:location.href,referrer:document.referrer});
        tokenPromise=fetch('/api/forms/token',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(r=>r.token||'').catch(()=>'');
        const response=await fetch('/api/forms/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const result=await response.json();if(!response.ok)throw new Error(result.error||'Unable to send the request.');
        form.reset();status.textContent=result.message;
      }catch(error){status.textContent=error instanceof Error?error.message:'Unable to send the request.'}finally{button.disabled=false}
    });
  });
}

function initialize(){
  initHeader();initFAQ();initTestimonials();initServiceOfferings();initSupportPages();initPageTransitions();bindEstimateForms();
  const onScroll=()=>document.querySelector('.back-to-top')?.classList.toggle('visible',scrollY>850);
  addEventListener('scroll',onScroll,{passive:true});onScroll();
  initMotion().catch(()=>{
    document.querySelector('#app')?.removeAttribute('inert');
    document.documentElement.classList.remove('is-loading','is-page-entering','is-page-leaving');
    document.querySelector('#page-curtain')?.remove();document.querySelector('#site-loader')?.remove();
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
```

### app/layout.tsx

<!-- avault-file path="app/layout.tsx" mode="reference" sha256="d84dcf0900ba65979e44c9445d3f6f1900f849848aaa616b33cd78e899c04ec8" eol="1" -->
```tsx
import './globals.css';
import './avault/theme.css';

// Same Cal Sans + Google Sans Flex the public site loads, so AVAULT matches it.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/assets/favicon.ico?v=3" sizes="any" />
        <link rel="icon" href="/assets/favicon-32.png?v=3" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/assets/favicon-180.png" sizes="180x180" />
        <link rel="stylesheet" href="/assets/fonts.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### next.config.ts

<!-- avault-file path="next.config.ts" mode="reference" sha256="7cbbb771e580ae422d8856ea65840ff8a6a2f51723d7b85e199174053685d84f" eol="1" -->
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
};

export default nextConfig;
```

### tsconfig.json

<!-- avault-file path="tsconfig.json" mode="reference" sha256="f82756bbf1b125d4b225e22af8326c365ac99e11dae454fcb8d419473d955851" eol="1" -->
```json
{
    "compilerOptions":  {
                            "target":  "ES2017",
                            "lib":  [
                                        "dom",
                                        "dom.iterable",
                                        "esnext"
                                    ],
                            "allowJs":  true,
                            "skipLibCheck":  true,
                            "strict":  true,
                            "noEmit":  true,
                            "esModuleInterop":  true,
                            "module":  "esnext",
                            "moduleResolution":  "bundler",
                            "resolveJsonModule":  true,
                            "isolatedModules":  true,
                            "jsx":  "react-jsx",
                            "incremental":  true,
                            "plugins":  [
                                            {
                                                "name":  "next"
                                            }
                                        ],
                            "paths":  {
                                          "@/*":  [
                                                      "./*"
                                                  ]
                                      },
                            "types":  [
                                          "node"
                                      ]
                        },
    "include":  [
                    "next-env.d.ts",
                    "**/*.ts",
                    "**/*.tsx",
                    ".next/types/**/*.ts",
                    ".next/dev/types/**/*.ts",
                    "**/*.mts"
                ],
    "exclude":  [
                    "node_modules"
                ]
}
```

### components.json

<!-- avault-file path="components.json" mode="reference" sha256="31f4ca67a4a62572571003d3d5aac85ee6fbfca67a192924bac6b168d95e98fd" eol="1" -->
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {}
}
```

### .env.example

<!-- avault-file path=".env.example" mode="reference" sha256="20c9fac369c5e38e0dfe09f56c44a30d7225c3494329ac618ef5ea48188f9e3e" eol="1" -->
```text
MONGODB_URI=mongodb://username:password@host:port/database?authSource=admin
MONGODB_DB=dmv_commercial_door_repair
NEXT_PUBLIC_SITE_URL=https://dmvcommercialdoorrepair.com
AVAULT_ENCRYPTION_KEY=replace-with-64-random-hex-characters
AVAULT_JOBS_SECRET=replace-with-a-long-random-secret
PORT=3110
NODE_ENV=production
```

### ecosystem.config.cjs

<!-- avault-file path="ecosystem.config.cjs" mode="reference" sha256="ad04bd3b6f3f86d44ccc74bc4c14a7e37006a1b1297e33903f4ef6bbc76797fc" eol="1" -->
```js
module.exports = {
  apps: [
    {
      name: "dmv-commercial-door-repair",
      cwd: __dirname,
      script: "./node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1",
      interpreter: "node",
      // Cluster mode (PM2's default when `instances` is set) makes `next start` exit right after "Ready".
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "600M",
      time: true,
      env: {
        NODE_ENV: "production",
        PORT: 3110,
      },
    },
  ],
};
```

### .github/workflows/deploy.yml

<!-- avault-file path=".github/workflows/deploy.yml" mode="reference" sha256="c643f2cacb3c456f15db2a53570153224eefca0a199bae4c550ed3de3e26df4b" eol="1" -->
```text
name: Deploy DMV Commercial Door Repair

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: dmv-commercial-door-repair-production
  cancel-in-progress: false

jobs:
  deploy:
    name: Deploy to Webuzo production server
    runs-on: ubuntu-latest
    steps:
      - name: Load the deployment key
        uses: webfactory/ssh-agent@v0.9.1
        with:
          ssh-private-key: ${{ secrets.DEPLOY_KEY }}

      - name: Trust the production server
        env:
          SERVER_IP: ${{ secrets.SERVER_IP }}
        run: |
          if [ -z "$SERVER_IP" ]; then
            echo "SERVER_IP is missing."
            exit 1
          fi
          mkdir -p ~/.ssh
          scan_file="$(mktemp)"
          trap 'rm -f "$scan_file"' EXIT
          for attempt in 1 2 3 4; do
            : > "$scan_file"
            if timeout 20 ssh-keyscan -T 10 -t ed25519 -p 22 -H "$SERVER_IP" > "$scan_file" && [ -s "$scan_file" ]; then
              cat "$scan_file" >> ~/.ssh/known_hosts
              exit 0
            fi
            echo "SSH host-key scan failed (attempt $attempt of 4)."
            if [ "$attempt" -lt 4 ]; then sleep $((attempt * 15)); fi
          done
          echo "Could not read the server SSH host key."
          exit 1

      - name: Clone or update and deploy
        env:
          SERVER_IP: ${{ secrets.SERVER_IP }}
        run: |
          remote='set -Eeuo pipefail
            mkdir -p /root/.ssh
            chmod 700 /root/.ssh
            ssh-keyscan -T 10 -t ed25519 github.com >> /root/.ssh/known_hosts 2>/dev/null
            chmod 600 /root/.ssh/known_hosts
            export GIT_SSH_COMMAND="ssh -i /root/.ssh/dmv-commercial-door-repair_repository_deploy -o IdentitiesOnly=yes"
            mkdir -p /root/dmv-commercial-door-repair
            cd /root/dmv-commercial-door-repair
            if [ ! -d .git ]; then
              git init
              git remote add origin git@github.com:AllureDigitalSoftwares/dmv-commercial-door-repair.git
            else
              git remote set-url origin git@github.com:AllureDigitalSoftwares/dmv-commercial-door-repair.git
            fi
            git fetch --prune origin main
            git checkout --force main
            git reset --hard origin/main
            APP_DIR=/root/dmv-commercial-door-repair BRANCH=main APP_PORT=3110 SITE_ORIGIN=https://dmvcommercialdoorrepair.com bash scripts/deploy-production.sh'
          for attempt in 1 2 3 4; do
            sleep $(( attempt == 1 ? 5 : attempt * 15 ))
            set +e
            ssh -A -p 22 -o BatchMode=yes -o ConnectTimeout=20 -o ServerAliveInterval=30 -o ServerAliveCountMax=6 root@"$SERVER_IP" "$remote"
            status=$?
            set -e
            if [ "$status" -ne 255 ]; then exit "$status"; fi
            echo "SSH connection failed (attempt $attempt of 4)."
          done
          echo "Could not open an SSH session to the production server."
          exit 255
```

### scripts/verify-rendering.mjs

<!-- avault-file path="scripts/verify-rendering.mjs" mode="reference" sha256="b479c935e9909e8193b5c469105b07e5b1fb36575bd7642d121fc389d37f32ac" eol="1" -->
```js
const base=process.argv[2]||'http://127.0.0.1:3108';
const routes=['/','/ada-handicap-exit-devices/','/automatic-door-operators/','/blogs/','/blogs/automatic-door-not-opening/','/blogs/prepare-commercial-door-repair-estimate/','/blogs/why-commercial-doors-slam/','/commercial-concealed-door-closer-repair/','/commercial-door-alarm-systems/','/commercial-door-closers/','/commercial-door-handles/','/commercial-door-hinge-replacement/','/commercial-door-stops/','/commercial-exit-devices/','/commercial-high-security-locks/','/commercial-intercom-systems/','/commercial-keypad-entry-systems/','/commercial-magnetic-locks/','/commercial-push-handles/','/commercial-sliding-door-repair/','/contact-us/','/faqs/','/vertical-rod-exit-devices/'];
let passed=0;const assets=new Set(),renderedLinks=new Map(),routeSet=new Set(routes);
for(const route of routes){
  const response=await fetch(base+route,{signal:AbortSignal.timeout(60000)});const html=await response.text();
  const types=[...html.matchAll(/"@type":"([^"]+)"/g)].map(match=>match[1]);
  const required=['<title>','<meta name="description"','<link rel="canonical"','application/ld+json','/dmv-runtime.js'];
  const missing=required.filter(value=>!html.includes(value));if(html.includes('{{'))missing.push('unresolved placeholders');
  const h1=(html.match(/<h1\b/gi)||[]).length;if(h1!==1)missing.push(`${h1} H1 headings`);
  const title=(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]||'').replace(/<[^>]+>/g,'').trim();if(title.length>65)missing.push(`title ${title.length} chars`);
  const description=(html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1]||'').trim();if(description.length>170)missing.push(`description ${description.length} chars`);
  const expected=route.startsWith('/blogs/')&&route!=='/blogs/'?'BlogPosting':route==='/blogs/'?'CollectionPage':route==='/faqs/'?'FAQPage':route!=='/'&&route!=='/contact-us/'?'Service':'WebPage';
  if(!types.includes(expected))missing.push(expected+' schema');
  const schemaScripts=[...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];let schemas=[];
  if(!schemaScripts.length)missing.push('server-rendered JSON-LD');else for(const script of schemaScripts)try{schemas.push(JSON.parse(script[1]))}catch{missing.push('invalid JSON-LD')}
  const schemaNodes=schemas.flatMap(value=>Array.isArray(value?.['@graph'])?value['@graph']:Array.isArray(value)?value:[value]);
  const related=schemaNodes.find(node=>node?.['@type']==='ItemList'&&node?.name==='Related pages');if(!related||!Array.isArray(related.itemListElement)||!related.itemListElement.length)missing.push('stored related-page ItemList schema');
  const internal=[];for(const match of html.matchAll(/\bhref=["']([^"']+)["']/gi))try{const url=new URL(match[1],base+route),baseUrl=new URL(base);if(url.origin===baseUrl.origin){const path=url.pathname==='/'?'/':url.pathname.replace(/\/$/,'')+'/';if(routeSet.has(path)&&path!==route)internal.push(path)}}catch{}
  renderedLinks.set(route,[...new Set(internal)]);
  for(const match of html.matchAll(/(?:src|href|poster)="([^"]+\.(?:css|js|png|svg|jpe?g|webp|gif|ico|woff2?)(?:\?[^"#]*)?)"/gi)){
    if(/^(?:assets|media)\//i.test(match[1]))missing.push('relative asset '+match[1]);
    const url=new URL(match[1],base+route);if(url.origin===new URL(base).origin)assets.add(url.href);
  }
  const ok=response.ok&&!missing.length;if(ok)passed++;
  console.log(`${ok?'PASS':'FAIL'} ${route} ${[...new Set(types)].join(',')} ${missing.join('; ')}`.trim());
}
const incoming=new Map(routes.map(route=>[route,0]));for(const links of renderedLinks.values())for(const route of links)incoming.set(route,(incoming.get(route)||0)+1);
for(const route of routes){if(!(renderedLinks.get(route)||[]).length){console.log(`FAIL LINK ${route} has no outgoing internal page link`);passed--}if(route!=='/'&&!(incoming.get(route)||0)){console.log(`FAIL LINK ${route} has no incoming internal page link`);passed--}}
const missingAssets=[];for(const batch of Array.from(assets).reduce((a,u,i)=>(a[Math.floor(i/20)]??=[]).push(u)&&a,[])){
 const results=await Promise.all(batch.map(async url=>{try{return {url,response:await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(20000)})}}catch{return {url,response:null}}}));
 for(const {url,response} of results)if(!response?.ok)missingAssets.push(`${response?.status||'ERR'} ${url}`);
}
const missingRoute=await fetch(base+'/this-page-must-not-exist/',{signal:AbortSignal.timeout(60000)});const missingHtml=await missingRoute.text();
const notFoundOk=missingRoute.status===404&&missingHtml.includes('av-sys-404')&&missingHtml.includes('/system-pages.css');
console.log(`${notFoundOk?'PASS':'FAIL'} /404-system-page/ status=${missingRoute.status}`);
for(const asset of missingAssets)console.log('FAIL ASSET '+asset);
console.log(`SUMMARY ${passed}/${routes.length} routes passed; ${assets.size-missingAssets.length}/${assets.size} assets passed; ${routes.length} page link graphs checked; JSON-LD parsed; 404 ${notFoundOk?'passed':'failed'}`);
if(passed!==routes.length||missingAssets.length||!notFoundOk)process.exitCode=1;
```

### scripts/deploy-production.sh

<!-- avault-file path="scripts/deploy-production.sh" mode="reference" sha256="1da560704b9b8b6da5188d8d95ce162996c02ca714b3c16caf7c332983f632c1" eol="1" -->
```bash
#!/usr/bin/env bash

set -Eeuo pipefail

APP_DIR="${APP_DIR:-/root/dmv-commercial-door-repair}"
APP_NAME="dmv-commercial-door-repair"
BRANCH="${BRANCH:-main}"
APP_PORT="${APP_PORT:-3110}"
SITE_ORIGIN="${SITE_ORIGIN:-https://dmvcommercialdoorrepair.com}"
VERIFY_PUBLIC_ORIGIN="${VERIFY_PUBLIC_ORIGIN:-auto}"
PROXY_READY_FILE="${PROXY_READY_FILE:-/root/.config/allure-deploy/${APP_NAME}.proxy-ready}"
LOCK_FILE="/var/lock/dmv-commercial-door-repair-deploy.lock"

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "Expected Git checkout not found: $APP_DIR" >&2
  exit 1
fi
if [[ ! -f "$APP_DIR/.env.local" ]]; then
  echo "Missing $APP_DIR/.env.local. Create it from .env.example on the server." >&2
  exit 1
fi

command -v git >/dev/null
command -v npm >/dev/null
command -v pm2 >/dev/null
command -v flock >/dev/null
command -v curl >/dev/null

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "A DMV Commercial Door Repair deployment is already running." >&2
  exit 1
fi

if ! pm2 describe "$APP_NAME" >/dev/null 2>&1 && command -v ss >/dev/null && ss -ltn | awk '{print $4}' | grep -Eq "[:.]${APP_PORT}$"; then
  echo "Port ${APP_PORT} is already in use by another service. Choose a free loopback port before deploying." >&2
  exit 1
fi

cd "$APP_DIR"
git fetch --prune origin "$BRANCH"
git checkout --force "$BRANCH"
git reset --hard "origin/$BRANCH"

npm ci
rm -rf "$APP_DIR/.next"
npm run db:sync-origin
npm run db:normalize-content
npm run db:ensure-seo
npm run build

if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --only "$APP_NAME" --update-env
else
  pm2 start ecosystem.config.cjs --only "$APP_NAME" --update-env
fi
pm2 save

ready=0
for attempt in 1 2 3 4 5 6; do
  if curl --fail --silent --show-error --max-time 15 "http://127.0.0.1:${APP_PORT}/" >/dev/null; then
    ready=1
    break
  fi
  echo "Waiting for the application (attempt $attempt of 6)..."
  sleep 5
done
if [[ "$ready" -ne 1 ]]; then
  pm2 logs "$APP_NAME" --lines 80 --nostream
  exit 1
fi

node scripts/verify-rendering.mjs "http://127.0.0.1:${APP_PORT}"
if [[ "$VERIFY_PUBLIC_ORIGIN" == "1" || ( "$VERIFY_PUBLIC_ORIGIN" == "auto" && -f "$PROXY_READY_FILE" ) ]]; then
  curl --fail --silent --show-error --max-time 20 "${SITE_ORIGIN}/robots.txt" | grep -F "Sitemap: ${SITE_ORIGIN}/sitemap.xml" >/dev/null
  curl --fail --silent --show-error --max-time 20 "${SITE_ORIGIN}/" | grep -F "<link rel=\"canonical\" href=\"${SITE_ORIGIN}/\"" >/dev/null
elif [[ "$VERIFY_PUBLIC_ORIGIN" == "0" || "$VERIFY_PUBLIC_ORIGIN" == "auto" ]]; then
  echo "Skipped public-origin checks because the Webuzo proxy is not marked ready. Run scripts/configure-webuzo-proxy.sh once the local application responds."
else
  echo "VERIFY_PUBLIC_ORIGIN must be auto, 1, or 0." >&2
  exit 1
fi

pm2 status "$APP_NAME"
echo "Deployment checks passed for ${SITE_ORIGIN}."
```

### scripts/configure-webuzo-proxy.sh

<!-- avault-file path="scripts/configure-webuzo-proxy.sh" mode="reference" sha256="a64c0423f2066c72479dff642496d0897bfd0bf4fe871d3779e5871731b3da67" eol="1" -->
```bash
#!/usr/bin/env bash

set -Eeuo pipefail

DOMAIN="${DOMAIN:?Set DOMAIN before running this script.}"
APP_PORT="${APP_PORT:?Set APP_PORT before running this script.}"
APP_NAME="${PM2_NAME:-${PROJECT_SLUG:-}}"
SITE_ORIGIN="${SITE_ORIGIN:-https://${DOMAIN}}"
CONFIG_ROOT="${WEBUZO_APACHE_DOMAIN_DIR:-/var/webuzo-data/apache2/custom/domains}"
CONFIG_FILE="${CONFIG_ROOT}/${DOMAIN}.conf"
PROXY_READY_FILE="${PROXY_READY_FILE:-/root/.config/allure-deploy/${APP_NAME}.proxy-ready}"
BEGIN_MARKER="# BEGIN ALLURE NODE PROXY ${APP_NAME}"
END_MARKER="# END ALLURE NODE PROXY ${APP_NAME}"

if [[ "$EUID" -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi
if [[ -z "$APP_NAME" || ! "$DOMAIN" =~ ^[A-Za-z0-9.-]+$ || ! "$APP_PORT" =~ ^[0-9]+$ || "$APP_PORT" -lt 1 || "$APP_PORT" -gt 65535 ]]; then
  echo "DOMAIN, PROJECT_SLUG/PM2_NAME, or APP_PORT is invalid." >&2
  exit 1
fi
if ! curl --fail --silent --show-error --max-time 15 "http://127.0.0.1:${APP_PORT}/" >/dev/null; then
  echo "The application is not ready on 127.0.0.1:${APP_PORT}; the proxy was not changed." >&2
  exit 1
fi

APACHECTL=""
for candidate in /usr/local/apps/apache2/bin/apachectl /usr/sbin/apachectl /usr/sbin/apache2ctl; do
  if [[ -x "$candidate" ]]; then APACHECTL="$candidate"; break; fi
done
if [[ -z "$APACHECTL" ]]; then
  APACHECTL="$(command -v apachectl || command -v apache2ctl || true)"
fi
if [[ -z "$APACHECTL" ]]; then
  echo "Could not locate apachectl; the proxy was not changed." >&2
  exit 1
fi

modules="$($APACHECTL -M 2>/dev/null || true)"
for module in proxy_module proxy_http_module headers_module; do
  if ! grep -q "$module" <<<"$modules"; then
    echo "Apache module $module is not enabled; the proxy was not changed." >&2
    exit 1
  fi
done

install -d -m 755 "$CONFIG_ROOT"
tmp_file="$(mktemp "${CONFIG_ROOT}/.${DOMAIN}.XXXXXX")"
backup_file=""
had_existing=0
trap 'rm -f "$tmp_file"' EXIT

if [[ -e "$CONFIG_FILE" ]]; then
  if [[ -L "$CONFIG_FILE" || ! -f "$CONFIG_FILE" ]]; then
    echo "Refusing to modify non-regular file: $CONFIG_FILE" >&2
    exit 1
  fi
  had_existing=1
  backup_file="${CONFIG_FILE}.backup.$(date -u +%Y%m%dT%H%M%SZ)"
  cp -a "$CONFIG_FILE" "$backup_file"
  if ! awk -v begin="$BEGIN_MARKER" -v end="$END_MARKER" '
    $0 == begin { if (skip) exit 42; skip=1; next }
    $0 == end { if (!skip) exit 43; skip=0; next }
    !skip { print }
    END { if (skip) exit 44 }
  ' "$CONFIG_FILE" > "$tmp_file"; then
    echo "The existing managed proxy block is malformed; original file was not changed." >&2
    exit 1
  fi
fi

cat >> "$tmp_file" <<EOF

$BEGIN_MARKER
ProxyPreserveHost On
ProxyPass / http://127.0.0.1:${APP_PORT}/ retry=0 timeout=120
ProxyPassReverse / http://127.0.0.1:${APP_PORT}/
RequestHeader set X-Forwarded-Proto "https"
$END_MARKER
EOF

chown root:root "$tmp_file"
chmod 644 "$tmp_file"
mv -f "$tmp_file" "$CONFIG_FILE"

if ! "$APACHECTL" -t; then
  echo "Apache rejected the configuration; restoring the previous file." >&2
  if [[ "$had_existing" -eq 1 ]]; then
    cp -a "$backup_file" "$CONFIG_FILE"
  else
    rm -f "$CONFIG_FILE"
  fi
  "$APACHECTL" -t || true
  exit 1
fi

"$APACHECTL" -k graceful

if curl --fail --silent --show-error --max-time 20 "${SITE_ORIGIN}/robots.txt" | grep -F "Sitemap: ${SITE_ORIGIN}/sitemap.xml" >/dev/null \
  && curl --fail --silent --show-error --max-time 20 "${SITE_ORIGIN}/" | grep -F "<link rel=\"canonical\" href=\"${SITE_ORIGIN}/\"" >/dev/null; then
  install -d -m 700 "$(dirname "$PROXY_READY_FILE")"
  printf 'domain=%s\nport=%s\nconfigured_at=%s\n' "$DOMAIN" "$APP_PORT" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$PROXY_READY_FILE"
  chmod 600 "$PROXY_READY_FILE"
  echo "Webuzo Apache proxy is live for ${SITE_ORIGIN} -> 127.0.0.1:${APP_PORT}."
else
  echo "Apache reloaded, but public verification did not pass. The ready marker was not created." >&2
  echo "Inspect ${CONFIG_FILE}, DNS/CDN state, and the Apache error log." >&2
  exit 1
fi

if [[ -n "$backup_file" ]]; then
  echo "Previous configuration backup: $backup_file"
fi
```

---

# Appendix — Production deployment

## Reusable private-repository deployment on Webuzo

This is the shared team process for deploying a private Next.js repository to the Webuzo server with GitHub Actions, root SSH, PM2, and an Apache reverse proxy.

All commands in this guide run in a Linux Bash server terminal such as:

```text
[root@legacyserver ~]#
```

Do not use PowerShell syntax in these blocks. DMV Commercial Door Repair is included only as the filled-in example; the process and GitHub secret names are reusable.

### Simple process

1. Fill in one project-variable block.
2. Generate and authorize one project deployment key.
3. Add its public key and two general secrets to GitHub.
4. Test the chosen port.
5. Test root SSH and private-repository access.
6. Create the server-only environment file.
7. Run the first deployment and verify the private loopback port.
8. Install the Webuzo reverse proxy from the root terminal.
9. Push `main` and run the GitHub workflow.
10. Verify PM2 and the live domain.

### General GitHub secret names

Use these exact repository-secret names for every project:

- `SERVER_IP`
- `DEPLOY_KEY`

GitHub repository secrets are independently scoped, so every repository can use the same names. Each private repository must still have its own deployment key. The key's public half is authorized for root on the server and added as a read-only GitHub deploy key; its private half is stored once as `DEPLOY_KEY`.

### 1. Set the project variables

Copy this block and replace the values for the project being deployed. The values shown are the DMV example:

```bash
export SERVER_IP="152.53.38.141"
export REPO="AllureDigitalSoftwares/dmv-commercial-door-repair"
export PROJECT_SLUG="dmv-commercial-door-repair"
export DOMAIN="dmvcommercialdoorrepair.com"
export WEBUZO_USER="dmvcdr"
export APP_PORT="3110"
export MONGODB_DB="dmv_commercial_door_repair"
export PM2_NAME="$PROJECT_SLUG"
export APP_DIR="/root/${PROJECT_SLUG}"
export KEY_DIR="/root/.ssh"
export DEPLOY_KEY="${KEY_DIR}/${PROJECT_SLUG}_repository_deploy"

mkdir -p "$KEY_DIR" "$APP_DIR"
chmod 700 "$KEY_DIR" "$APP_DIR"
```

What each value means:

| Variable | Value to enter | DMV example |
| --- | --- | --- |
| `SERVER_IP` | Shared production server IP. | `152.53.38.141` |
| `REPO` | GitHub `OWNER/REPOSITORY`, without `.git`. | `AllureDigitalSoftwares/dmv-commercial-door-repair` |
| `PROJECT_SLUG` | Unique lowercase, hyphenated project name. | `dmv-commercial-door-repair` |
| `DOMAIN` | Production hostname without protocol or trailing slash. | `dmvcommercialdoorrepair.com` |
| `WEBUZO_USER` | Webuzo **Current User** for the domain. | `dmvcdr` |
| `APP_PORT` | Free loopback port unique to this PM2 app. | `3110` |
| `MONGODB_DB` | Project's MongoDB database name. | `dmv_commercial_door_repair` |
| `PM2_NAME` | Unique PM2 process name; normally use the project slug. | `dmv-commercial-door-repair` |
| `APP_DIR` | Unique root deployment directory; derived automatically. | `/root/dmv-commercial-door-repair` |
| `DEPLOY_KEY` | Project key used for both server and repository access; derived automatically. | `/root/.ssh/dmv-commercial-door-repair_repository_deploy` |

Confirm the values before doing anything else:

```bash
printf 'server=%s\nrepo=%s\nproject=%s\ndomain=%s\nwebuzo=%s\nport=%s\ndatabase=%s\npm2=%s\napp=%s\n' \
  "$SERVER_IP" "$REPO" "$PROJECT_SLUG" "$DOMAIN" "$WEBUZO_USER" \
  "$APP_PORT" "$MONGODB_DB" "$PM2_NAME" "$APP_DIR"
```

Every command below uses these variables. For another project, change the block above instead of rewriting every command.

### 2. Generate the deployment key

This block does not overwrite existing keys:

```bash
if [[ -e "$DEPLOY_KEY" || -e "${DEPLOY_KEY}.pub" ]]; then
  echo "Deployment key already exists: $DEPLOY_KEY"
else
  ssh-keygen -t ed25519 -C "git@github.com:${REPO}.git" -f "$DEPLOY_KEY" -N ""
fi
```

Verify the key:

```bash
ssh-keygen -lf "${DEPLOY_KEY}.pub"
```

The deploy-key comment must end with the current repository SSH URL, without Markdown `**` characters. For the configured variables, the expected comment is printed by:

```bash
printf 'git@github.com:%s.git\n' "$REPO"
```

If the existing comment is wrong, correct it without regenerating the key:

```bash
ssh-keygen -c -C "git@github.com:${REPO}.git" -f "$DEPLOY_KEY" -P ""
ssh-keygen -lf "${DEPLOY_KEY}.pub"
```

### 3. Authorize the deployment key for root

```bash
touch "$KEY_DIR/authorized_keys"
chmod 600 "$KEY_DIR/authorized_keys"
grep -qxF "$(cat "${DEPLOY_KEY}.pub")" "$KEY_DIR/authorized_keys" || \
  cat "${DEPLOY_KEY}.pub" >> "$KEY_DIR/authorized_keys"
```

The append is silent when successful. Verify the key appears exactly once:

```bash
if [[ "$(grep -Fxc "$(cat "${DEPLOY_KEY}.pub")" "$KEY_DIR/authorized_keys")" -eq 1 ]]; then
  echo "Deployment key is authorized for root exactly once"
else
  echo "Authorization check failed; inspect $KEY_DIR/authorized_keys"
fi
```

### 4. Configure the GitHub repository

#### Add the public deploy key

Display the public repository key:

```bash
cat "${DEPLOY_KEY}.pub"
```

In the configured GitHub repository, open:

**Settings -> Deploy keys -> Add deploy key**

- Title: `${PROJECT_SLUG} production read-only`
- Key: complete single line printed above.
- Allow write access: unchecked.

The title uses the actual value of `PROJECT_SLUG`; for the DMV example it is `dmv-commercial-door-repair production read-only`.

#### Add the two general Actions secrets

Open:

**Settings -> Secrets and variables -> Actions -> New repository secret**

Create:

| Secret | Value |
| --- | --- |
| `SERVER_IP` | Current value of `$SERVER_IP`. |
| `DEPLOY_KEY` | Complete private key printed by `cat "$DEPLOY_KEY"`. |

Display a private key only when ready to paste it directly into GitHub:

```bash
cat "$DEPLOY_KEY"
```

Each private value includes both boundary lines:

```text
-----BEGIN OPENSSH PRIVATE KEY-----
-----END OPENSSH PRIVATE KEY-----
```

Never paste private keys into chat, email, tickets, documentation, or source control.

### 5. Test the selected port

```bash
ss -ltnp | grep ":${APP_PORT} " || echo "Port ${APP_PORT} is available"
```

The expected result is `Port <number> is available`. If a listening process is printed, choose a different port and update `APP_PORT` before proceeding.

Every project must use the same chosen port in:

- its project-variable block and `.env.local`
- `.github/workflows/deploy.yml`
- `scripts/deploy-production.sh`
- `ecosystem.config.cjs`
- Webuzo reverse-proxy configuration

### 6. Test both connections

#### Test root SSH

```bash
ssh -i "$DEPLOY_KEY" \
  -o IdentitiesOnly=yes \
  -o BatchMode=yes \
  -o StrictHostKeyChecking=accept-new \
  root@127.0.0.1 "echo server-ssh-ready"
```

Expected output:

```text
server-ssh-ready
```

#### Test private-repository access

Run this after adding the public deploy key to the configured GitHub repository:

```bash
ssh-keyscan -T 10 -t ed25519 github.com >> "$KEY_DIR/known_hosts" 2>/dev/null
chmod 600 "$KEY_DIR/known_hosts"

GIT_SSH_COMMAND="ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes" \
  git ls-remote "git@github.com:${REPO}.git" HEAD
```

Expected output is a commit hash followed by `HEAD`. `Repository not found` or `Permission denied` means the GitHub deploy key is not configured correctly.

### 7. Create the server-only environment

Confirm the required software is available:

```bash
node --version
npm --version
git --version
pm2 --version
curl --version
```

This application requires Node `22.13` or newer. Install or upgrade missing prerequisites before continuing.

Create the environment file. The MongoDB URI prompt is hidden. Copy the complete `read ...` command below as one line; it writes the whole file without a multi-line shell group:

```bash
cd "$APP_DIR"
read -rsp 'MongoDB URI: ' MONGODB_URI; echo; AVAULT_ENCRYPTION_KEY="$(openssl rand -hex 32)"; AVAULT_JOBS_SECRET="$(openssl rand -hex 32)"; umask 077; printf 'MONGODB_URI=%s\nMONGODB_DB=%s\nNEXT_PUBLIC_SITE_URL=https://%s\nAVAULT_ENCRYPTION_KEY=%s\nAVAULT_JOBS_SECRET=%s\nPORT=%s\nNODE_ENV=production\n' "$MONGODB_URI" "$MONGODB_DB" "$DOMAIN" "$AVAULT_ENCRYPTION_KEY" "$AVAULT_JOBS_SECRET" "$APP_PORT" > "$APP_DIR/.env.local"; chmod 600 "$APP_DIR/.env.local"; unset MONGODB_URI AVAULT_ENCRYPTION_KEY AVAULT_JOBS_SECRET
```

Wait for the `MongoDB URI:` prompt, paste the URI, and press Enter. Nothing is displayed while it is being entered. Do not run only the final `printf` portion separately.

Verify the file without printing its secrets:

```bash
test -s "$APP_DIR/.env.local" && echo "Server environment is ready"
stat -c '%a %U:%G %n' "$APP_DIR/.env.local"
```

Expected permissions are `600 root:root`.

The MongoDB URI, encryption root, and jobs secret must stay outside MongoDB because the application needs them before it can access or decrypt database records. They stay only in the ignored server `.env.local`. Editable site data remains in MongoDB.

### 8. Configure the Webuzo reverse proxy

Do this only after the local homepage returns `200`:

```bash
cd "$APP_DIR"
DOMAIN="$DOMAIN" APP_PORT="$APP_PORT" PROJECT_SLUG="$PROJECT_SLUG" PM2_NAME="$PM2_NAME" \
  SITE_ORIGIN="https://${DOMAIN}" bash scripts/configure-webuzo-proxy.sh
```

The script manages only its marked block in Webuzo's domain file:

```text
/var/webuzo-data/apache2/custom/domains/<DOMAIN>.conf
```

It refuses to continue unless the loopback application responds and the required Apache modules are enabled. It preserves unrelated existing directives, creates a timestamped backup, validates Apache, restores the previous file if validation fails, reloads Apache gracefully, verifies the public canonical and sitemap, and creates the proxy-ready marker used by later deployments.

Do not paste `ProxyPass` directives directly at the Bash prompt. The script writes them into the correct Webuzo custom virtual-host file. This standard domain path is automatically included in the domain's SSL and non-SSL virtual hosts.

Keep the existing Webuzo SSL certificate. Do not expose the application port publicly; only Apache should access it on loopback. This application has no WebSocket endpoint, so it does not need a separate WebSocket proxy rule.

### 9. Customize the reusable deployment files

Copy these files into the project repository:

- `.github/workflows/deploy.yml`
- `scripts/deploy-production.sh`
- `scripts/configure-webuzo-proxy.sh`
- `ecosystem.config.cjs`

Update their project-specific constants:

| File | Values to change |
| --- | --- |
| `.github/workflows/deploy.yml` | Workflow name, concurrency group, repository SSH URL, server deploy-key path, `APP_DIR`, `APP_PORT`, and `SITE_ORIGIN`. |
| `scripts/deploy-production.sh` | Default `APP_DIR`, `APP_NAME`, `APP_PORT`, `SITE_ORIGIN`, lock filename, and proxy-ready filename. |
| `scripts/configure-webuzo-proxy.sh` | Normally no edits; it reads the project variables at runtime. |
| `ecosystem.config.cjs` | PM2 name and port. |

Keep the two general secret references unchanged:

```text
SERVER_IP
DEPLOY_KEY
```

For this DMV repository, those files are already configured with the example values.

### 10. Run the deployment

#### First deployment from the server terminal

Use this once while the domain still serves the existing static site. It preserves `.env.local`, checks out the private repository, builds the application, starts PM2, and verifies every route on the private loopback port. Public-domain checks are skipped until Webuzo points to the app.

```bash
cd "$APP_DIR"
export GIT_SSH_COMMAND="ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes"
if [[ ! -d .git ]]; then git init; git remote add origin "git@github.com:${REPO}.git"; else git remote set-url origin "git@github.com:${REPO}.git"; fi
git fetch --prune origin main
git checkout -B main origin/main
APP_DIR="$APP_DIR" BRANCH=main APP_PORT="$APP_PORT" SITE_ORIGIN="https://${DOMAIN}" bash scripts/deploy-production.sh
unset GIT_SSH_COMMAND
```

The first run automatically skips only the public-domain checks because the proxy-ready marker does not exist yet. It still fails on installation, build, PM2, database, or local-route errors.

Confirm the private application before changing Webuzo:

```bash
pm2 describe "$PM2_NAME"
ss -ltnp | grep ":${APP_PORT} "
curl -I "http://127.0.0.1:${APP_PORT}/"
```

When the local request returns `200`, run the terminal proxy script from step 8. Then verify the public Next.js signals and generated SEO endpoints:

```bash
curl -sSI "https://${DOMAIN}/" | grep -Ei '^(vary:.*rsc|cache-control: no-store|content-security-policy:.*nonce-)'
curl -sSI "https://${DOMAIN}/avault/" | grep -Ei '^(HTTP/|location:|x-robots-tag:)'
curl -fsS "https://${DOMAIN}/robots.txt" | grep -F "Sitemap: https://${DOMAIN}/sitemap.xml"
curl -fsS "https://${DOMAIN}/sitemap.xml" | grep -F '<urlset'
```

Apache remains the public server and will continue to send `Server: Apache`; that is expected for a reverse proxy. The `rsc` router headers, per-request CSP nonce, AVAULT authentication redirect, and generated robots/sitemap responses confirm that Apache is forwarding to Next.js. Do not compare full HTML hashes because the security nonce intentionally changes on every request. The proxy script creates a server-only marker after its public checks pass. From that point forward, every normal deployment strictly checks the public sitemap and canonical.

If the server reports `GLIBC_2.29 not found` for a Next.js SWC native binary but then downloads the WASM binding and completes the build, that is a compatibility warning rather than a deployment failure. The application can run normally with the WASM fallback. Upgrade the server OS separately instead of replacing system GLIBC in place.

To run the deployment script normally after the proxy is active:

```bash
APP_DIR="$APP_DIR" BRANCH=main APP_PORT="$APP_PORT" SITE_ORIGIN="https://${DOMAIN}" bash scripts/deploy-production.sh
```

#### Later deployments through GitHub Actions

Commit and push the repository's `main` branch from the development computer. The project owner performs commits and pushes manually.

Open:

**GitHub repository -> Actions -> the project's deploy workflow**

A push to `main` starts the workflow automatically. To start it manually, select **Run workflow**.

The reusable workflow:

1. Loads the single deployment key.
2. Connects to `root@$SERVER_IP` with the GitHub secret key.
3. Uses the matching server key file to initialize or update `$APP_DIR` from the private repository.
4. Preserves the untracked server `.env.local` file.
5. Installs exact dependencies and builds the application.
6. Starts or reloads the configured PM2 process.
7. Runs all local route checks; after the proxy-ready marker exists, it also enforces the production-origin checks.

### 11. Confirm production

Use the configured variables:

```bash
pm2 status "$PM2_NAME"
pm2 logs "$PM2_NAME" --lines 100 --nostream
curl -I "http://127.0.0.1:${APP_PORT}/"
curl -I "https://${DOMAIN}/"
```

Check the public endpoints:

```bash
curl -I "https://${DOMAIN}/avault/"
curl -I "https://${DOMAIN}/robots.txt"
curl -I "https://${DOMAIN}/sitemap.xml"
```

After the first successful run, later pushes to `main` deploy automatically.

