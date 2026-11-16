import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {IMPORTED_IMAGE_ALIASES,importedImageUrl} from '../lib/avault/imported-images.mjs';

test('repaired aliases point to retained public originals',()=>{
 assert.equal(Object.keys(IMPORTED_IMAGE_ALIASES).length,24);
 for(const target of Object.values(IMPORTED_IMAGE_ALIASES))assert.ok(fs.statSync('public'+target).isFile(),target);
});
test('repair preserves query strings, fragments and page-specific brand artwork',()=>{
 assert.equal(importedImageUrl('/assets/team-contact.webp?size=2#photo'),'/kontakt/assets/team-contact.webp?size=2#photo');
 assert.equal(importedImageUrl('/assets/aroz-mark.webp','/webdesign/'),'/webdesign/assets/aroz-mark.webp');
 assert.equal(importedImageUrl('/assets/aroz-mark.webp','/agentur/'),'/agentur/assets/aroz-mark.webp');
});
test('working assets, uploaded media and unrecognized URLs are never remapped',()=>{
 for(const url of ['/assets/aroz-full-logo.png','/media/example.png','/assets/unrecognized.webp','https://example.com/assets/team-contact.webp','/private-backups/example.enc'])assert.equal(importedImageUrl(url),url);
});
