# Local English content update

The English source pages live in `src/content/`. These dictionaries record the
reviewed translations used to update both the source and existing AVAULT records.
`en.json` covers visible content, attributes and metadata. `runtime-en.json` also
covers forms, scripts, schema names and CSS-generated labels. `system-en.json`
records the translations of code-owned utility pages and lead notifications.
Brand names, addresses, contact information, URLs and technical field keys remain
unchanged. Headings split across multiple fields are translated as a whole before
the individual translated fragments are assigned.

The update utilities load only `.env.development.local` and require the database
name to be exactly `avault_dev`. They do not use the fresh-database importer to
overwrite an existing database.

1. `node --conditions=react-server scripts/preview-english-db.mjs` captures a local
   before-snapshot in the ignored `.avault-kit/english-review/` directory. It refuses
   to overwrite an existing snapshot. Use `--output=<new-file>` for a later snapshot.
2. `node scripts/prepare-english.mjs` creates a plan, rendered HTML previews and a
   summary in that directory. Use `--snapshot=<file>` for a later snapshot.
3. Review `summary.json`, `preview/`, and the before/after records in `plan.json`.
   Nothing is written to the database at this stage.
4. Add `--write-source` to the preparation command to save the previewed English
   source pages. This does not connect to MongoDB.
5. `node --conditions=react-server scripts/apply-english-dev.mjs --apply` applies the
   plan in one transaction, only to changed records. Every update matches the exact
   previewed revision, draft and published value. A concurrent edit cancels the
   transaction. Drafts and published content are translated independently. History
   entries are added and the original snapshot remains available locally.

Checks:

```powershell
node --test scripts/english-content.test.mjs
node node_modules/typescript/bin/tsc --noEmit
node --conditions=react-server scripts/verify-english-dev.mjs
```

The last check requires the local server at `http://127.0.0.1:3000`. It verifies all
37 database records, checks English contact-form validation, and submits one dummy
lead only when email delivery is disabled. The test lead is then removed. Its
result is saved to `verification.json`. It does not perform browser automation.

The public Translate control loads the Google script only after a non-English
language is selected. The dashboard never includes it. Each fresh page load starts
from the original English content. Chrome verification confirmed that selecting
German translates the contact page and selecting English restores the original.
The automated test also covers the delay before Google populates its language
list. Local browser results are recorded in `browser-verification.json` inside
the ignored review directory.
