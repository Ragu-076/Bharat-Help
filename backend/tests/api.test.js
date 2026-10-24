import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import { recordCount } from '../src/recordStore.js';

let server, base;
before(async () => {
  server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise((resolve) => server.close(resolve)); });
const post = (body) => fetch(`${base}/api/help`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

test('health endpoint states the current data source', async () => {
  const response = await fetch(`${base}/api/health`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.dataSource, 'curated-source-records');
  assert.equal(data.recordCount, recordCount);
  assert.match(data.catalogVersion, /^\d{4}-\d{2}-\d{2}$/u);
});

test('existing HTTP help requests default to English results', async () => {
  const response = await post({ categoryId: 'women-support', clues: ['Workplace'] });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('content-language'), 'en');
  const data = await response.json();
  assert.equal(data.language, 'en');
  assert.equal(data.results.length, 1);
  assert.equal(data.results[0].id, 'women-support/workplace-sexual-harassment');
  assert.ok(data.results[0].sourceDetails.some(({ url }) => url === 'https://shebox.wcd.gov.in/'));
  assert.deepEqual(data.results[0].matchedClues, ['Workplace']);
});

test('empty selections, newly covered clues, duplicates and medicine fields survive HTTP', async () => {
  const empty = await post({ categoryId: 'child-support', clues: [] });
  assert.equal(empty.status, 200);
  assert.deepEqual((await empty.json()).results, []);
  const partial = await (await post({ categoryId: 'government-schemes', clues: ['Financial Aid', 'Agriculture', 'Financial Aid'] })).json();
  assert.deepEqual(partial.selectedClues, ['Financial Aid', 'Agriculture']);
  assert.deepEqual(partial.unmatchedClues, []);
  assert.ok(partial.results.some(({ id }) => id === 'government-schemes/pm-kisan'));
  const online = await (await post({ categoryId: 'child-support', clues: ['Online Danger'] })).json();
  assert.equal(online.results.length, 1);
  assert.equal(online.results[0].id, 'child-support/child-online-safety-and-grooming');
  const health = await (await post({ categoryId: 'common-health', clues: ['Diarrhoea'] })).json();
  assert.ok(health.results[0].help.medicines[0].precautions.length);
});

test('invalid inputs return JSON errors without exposing server internals', async () => {
  for (const body of [null, [], {}, { categoryId: 'child-support', clues: null },
    { categoryId: 'child-support', clues: [{}] }, { categoryId: 'child-support', clues: ['Workplace'] }]) {
    const response = await post(body);
    assert.equal(response.status, 400);
    assert.equal(typeof (await response.json()).error, 'string');
  }
  assert.equal((await post({ categoryId: 'unknown', clues: [] })).status, 404);
});

test('malformed JSON, content type, body size, method and path errors', async () => {
  const malformed = await fetch(`${base}/api/help`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).error, 'Invalid JSON body.');
  assert.equal((await fetch(`${base}/api/help`, { method: 'POST', body: 'text' })).status, 415);
  assert.equal((await post({ categoryId: 'child-support', clues: ['x'.repeat(11000)] })).status, 413);
  const method = await fetch(`${base}/api/help`);
  assert.equal(method.status, 405);
  assert.equal(method.headers.get('allow'), 'POST');
  const missing = await fetch(`${base}/api/missing`);
  assert.equal(missing.status, 404);
  assert.equal(typeof (await missing.json()).error, 'string');
});
