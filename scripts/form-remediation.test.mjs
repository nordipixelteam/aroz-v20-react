import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {runInThisContext} from 'node:vm';
import ts from 'typescript';

function loadModule(path, dependencies = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const {outputText} = ts.transpileModule(source, {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
  });
  const loaded = {exports: {}};
  runInThisContext(`(function(require, module, exports) {${outputText}\n})`)(
    name => {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected module: ${name}`);
      return dependencies[name];
    },
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}

const fields = loadModule('../lib/avault/forms.ts');
const config = {contact: {enabled: true, request: 'Project enquiry', fields: [
  {name: 'service', label: 'Service', type: 'select', options: ['SEO'], required: true},
  {name: 'message', label: 'Message', type: 'textarea', required: true},
  {name: 'x_timing', label: 'Timing', type: 'select', options: ['Soon'], required: false},
]}};
const valid = {formId: 'homepage-contact', page: 'http://localhost:3000/', name: 'Test visitor',
  email: 'test@example.invalid', service: 'SEO', message: 'Example only', x_timing: 'Soon',
  privacyConsent: 'on', token: 'mock-token'};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function mockHandler() {
  const calls = [];
  const used = new Set();
  const collection = {
    findOne: async () => null,
    insertOne: async () => { calls.push('stored'); },
  };
  const json = (value, status = 200) => Response.json(value, {status});
  const {POST} = loadModule('../app/api/forms/submit/route.ts', {
    '@/lib/avault/email': {deliverForm: async () => { calls.push('delivery attempted'); throw new Error('Mock failure'); }},
    '@/lib/avault/store': {
      sameOrigin: () => {}, body: request => request.json(), id: () => 'mock-lead',
      now: () => new Date(0).toISOString(), json, HttpError, clientIp: () => 'local-test',
      failure: error => json({error: error.message}, error.status || 503),
    },
    '@/lib/avault/spam': {
      HONEYPOT: 'contact_me_by_fax', contentFlags: () => [], enforceLimits: async () => { calls.push('rate limit'); },
      verifyFormToken: async token => ({age: 3, consume: async () => {
        if (used.has(token)) throw new HttpError(422, 'This request was already sent.');
        used.add(token);
        calls.push('token consumed');
      }}),
    },
    '@/db/mongo': {mongoDb: async () => ({collection: () => collection})},
    '@/lib/avault/runtime': {settingsRead: async () => ({value: config})},
    '@/lib/avault/forms': fields,
    '@/lib/avault/geo': {countryOf: () => ''},
  });
  return {calls, submit: payload => POST(new Request(valid.page, {method: 'POST', body: JSON.stringify(payload)}))};
}

test('configured fields validate required values and allowlisted options', () => {
  assert.throws(() => fields.validateEnquiryFields({...valid, service: ''}, config), /fill in "Service"/);
  assert.throws(() => fields.validateEnquiryFields({...valid, service: 'Other'}, config), /listed option/);
  assert.throws(() => fields.validateEnquiryFields({...valid, message: '   '}, config), /fill in "Message"/);
  assert.throws(() => fields.validateEnquiryFields({...valid, x_timing: []}, config), /check "Timing"/);
  assert.throws(() => fields.validateEnquiryFields({formId: 'contact', message: ' '}, {}), /describe your project/);
  assert.equal(fields.validateEnquiryFields(valid, config).Timing, 'Soon');
});

test('rejected submissions do not consume the token or rate allowance', async () => {
  const {submit, calls} = mockHandler();
  for (const invalid of [{privacyConsent: ''}, {email: 'invalid'}, {service: ''}, {message: ''}]) {
    const response = await submit({...valid, ...invalid});
    assert.equal(response.status, 422);
    assert.ok((await response.json()).error);
  }
  assert.deepEqual(calls, []);
  assert.equal((await submit(valid)).status, 200);
  assert.deepEqual(calls, ['token consumed', 'rate limit', 'stored', 'delivery attempted']);
});

test('a repeated token is rejected and an email failure does not imply delivery', async () => {
  const {submit, calls} = mockHandler();
  const responses = await Promise.all([submit(valid), submit(valid)]);
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 422]);
  const success = await responses.find(response => response.ok).json();
  assert.match(success.message, /received your project enquiry/);
  assert.doesNotMatch(success.message, /sent|delivered/i);
  assert.equal(calls.filter(call => call === 'stored').length, 1);
});
