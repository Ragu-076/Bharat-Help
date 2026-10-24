import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getResources } from '../src/services/resourceService.js';

const row = { id: 'hospital-1', name: 'Hospital', state: 'Tamil Nadu', district: 'Chennai', address: 'Public address',
  phones: ['04412345678'], verificationStatus: 'source-listing-unconfirmed' };
const data = { type: 'hospitals', language: 'ta', notice: 'சரிபார்க்கவும்', sourceUrl: 'https://www.data.gov.in/',
  page: 1, pageSize: 10, total: 1, records: [row] };
const response = (value) => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });

test('resource filters are encoded and responses with wrong language, URLs or contact types are rejected', async (context) => {
  let next = data;
  context.mock.method(globalThis, 'fetch', async (url) => {
    const parsed = new URL(url, 'https://example.test');
    assert.equal(parsed.pathname, '/api/resources');
    assert.equal(parsed.searchParams.get('state'), 'Tamil Nadu');
    assert.equal(parsed.searchParams.get('district'), 'Chennai');
    return response(next);
  });
  const filters = { state: 'Tamil Nadu', district: 'Chennai' };
  assert.deepEqual(await getResources('hospitals', filters, { language: 'ta' }), data);
  for (const mutate of [
    (value) => { value.language = 'hi'; },
    (value) => { value.sourceUrl = 'javascript:alert(1)'; },
    (value) => { value.records[0].phones = ['0']; },
    (value) => { value.total = -1; },
  ]) {
    next = structuredClone(data); mutate(next);
    await assert.rejects(getResources('hospitals', filters, { language: 'ta' }));
  }
});

test('aborted resource requests cannot replace later selections', async (context) => {
  context.mock.method(globalThis, 'fetch', async (_url, { signal }) => {
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')), { once: true }));
  });
  const controller = new AbortController();
  const pending = getResources('hospitals', { state: 'Tamil Nadu', district: 'Chennai' }, { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});
