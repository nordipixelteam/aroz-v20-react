# AROZ and AVAULT development

Next.js serves the public website and AVAULT dashboard. The 37 imported English pages remain editable in AVAULT; published runtime content lives in MongoDB. `src/content/` supplies importer content rather than replacing saved dashboard edits.

## Local application

Run `npm ci`, configure private `.env.development.local`, then `npm run dev`. Open `http://localhost:3000/` or `/avault/`. Development refuses any database other than `avault_dev`. Real environment files must never be committed; `config/` contains placeholder-only examples. `npm run admin:create` creates a local owner with hidden password entry.

`npm run build` builds the full Next.js app. Live hosted AVAULT still requires isolated staging credentials, database and approved network access. The staging guard remains enabled.

## This branch's read-only client preview

`feature/avault-development` deploys published public pages only to the existing Vercel client-preview project. Its `vercel.json` selects the static snapshot builder, which refuses Production builds. The snapshot has no CRM, server APIs, database configuration, accounts, leads, backups or drafts. Submission and analytics are disabled; responses are marked noindex.

Refresh published content before a preview commit:

1. Run the local application against `avault_dev` and review published pages.
2. Run `node scripts/export-client-preview.mjs`. It fetches anonymous local public responses without cookies and exports published HTML, public scripts and referenced public media to `client-preview/`.
3. Run `node scripts/build-client-preview.mjs --local`.
4. Review and commit the snapshot together with source updates.

Vercel builds the committed snapshot without MongoDB. Later AVAULT edits require another export, commit and deployment. Saving a draft does not publish or export it. Manifest digests verify published content and HTML; no private database records are exported.

The old Vite compatibility source remains in `src/main.jsx`; the local CRM uses Next.js. Do not use this branch's static preview configuration as a production release configuration. Leave `main` for a separately reviewed application deployment, migrations, isolated credentials/network and backup checks.

## Checks

- `npm run test:security-hardening`
- `npm run test:auth-security` (local dev server and avault_dev; disposable accounts)
- `npm run test:dependency-compatibility`
- `node --test scripts/english-content.test.mjs scripts/hidden-password.test.mjs scripts/imported-images.test.mjs scripts/shared-footer.test.mjs scripts/seo-structure.test.mjs scripts/backup-restore.test.mjs scripts/staging-configuration.test.mjs scripts/client-preview.test.mjs`

Private environment files, `.avault-kit/`, audit reports/screenshots under `docs/`, `.next/`, static build output and credentials are excluded. Public snapshot files in `client-preview/` are intentional deployment input.
