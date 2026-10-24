import test from 'node:test';
import assert from 'node:assert/strict';
import { categories, getHelp } from '../src/services/helpService.js';
import categoryCatalog from '../src/data/categoryCatalog.js';

const names = { en: 'Workplace Harassment', hi: 'कार्यस्थल पर उत्पीड़न', ta: 'பணியிடத் துன்புறுத்தல்' };
const clueLabels = { en: 'Workplace', hi: 'कार्यस्थल', ta: 'பணியிடம்' };

function fixture(language = 'en') {
  return {
    categoryId: 'women-support', language,
    selectedClues: ['Workplace'], selectedClueLabels: [clueLabels[language]],
    unmatchedClues: [], unmatchedClueLabels: [],
    results: [{
      id: 'women-support/workplace-harassment', name: names[language],
      keywords: ['Harassment', 'Workplace'], matchCount: 1,
      matchedClues: ['Workplace'], matchedClueLabels: [clueLabels[language]],
      sourceDetails: [{ title: 'SHe-Box', url: 'https://shebox.wcd.gov.in/' }],
      reviewedOn: '2026-10-24', coverage: 'India; workplace sexual harassment complaints.',
      help: {
        immediateHelp: ['Keep a record of the incident.'], rights: ['POSH Act, 2013'],
        contacts: [{ name: 'Women Helpline', number: '181', available: 'Available 24x7' }],
        schemes: [{ name: 'SHe-Box', description: 'Official complaint portal' }],
        sources: ['https://shebox.wcd.gov.in/'],
      },
    }],
  };
}

const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json' },
});

function pendingResponse(signal) {
  return new Promise((_resolve, reject) => {
    const abort = () => reject(new DOMException('Cancelled', 'AbortError'));
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, { once: true });
  });
}

test('the frontend exports only the display catalogue and sends canonical JSON to the API', async (context) => {
  assert.deepEqual(categories, categoryCatalog);
  const input = ['Workplace', 'Workplace'];
  const fetchMock = context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/help');
    assert.equal(options.method, 'POST');
    assert.equal(new Headers(options.headers).get('Content-Type'), 'application/json');
    assert.deepEqual(JSON.parse(options.body), {
      categoryId: 'women-support', clues: ['Workplace'], language: 'en',
    });
    assert.ok(options.signal instanceof AbortSignal);
    return jsonResponse(fixture());
  });
  const response = await getHelp('women-support', input);
  assert.deepEqual(response, fixture());
  assert.deepEqual(input, ['Workplace', 'Workplace']);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test('each selected language is sent while translated API fields and canonical keys are preserved', async (context) => {
  context.mock.method(globalThis, 'fetch', async (_url, options) => {
    const { language, clues } = JSON.parse(options.body);
    assert.deepEqual(clues, ['Workplace']);
    return jsonResponse(fixture(language));
  });
  for (const language of ['en', 'hi', 'ta']) {
    const response = await getHelp('women-support', ['Workplace'], { language });
    assert.deepEqual(response, fixture(language));
    assert.equal(response.results[0].help.contacts[0].number, '181');
    assert.equal(response.results[0].help.sources[0], 'https://shebox.wcd.gov.in/');
  }
});

test('successful empty and uncovered selections remain successful API responses', async (context) => {
  context.mock.method(globalThis, 'fetch', async (_url, options) => {
    const { categoryId, clues, language } = JSON.parse(options.body);
    return jsonResponse({
      categoryId, language, selectedClues: clues, selectedClueLabels: clues,
      unmatchedClues: clues, unmatchedClueLabels: clues, results: [],
    });
  });
  for (const clues of [[], ['Online Danger']]) {
    const response = await getHelp('child-support', clues);
    assert.deepEqual(response.results, []);
    assert.deepEqual(response.unmatchedClues, clues);
  }
});

test('invalid category, clues, language and timeout are rejected before making a request', async (context) => {
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => {
    throw new Error('Invalid input reached the network');
  });
  await assert.rejects(getHelp('unknown', []));
  for (const clues of [null, 'Workplace', [{}], ['unknown'], ['Abuse']]) {
    await assert.rejects(getHelp('women-support', clues));
  }
  for (const language of [null, '', 'HI', 'en-IN', 'fr', 1, []]) {
    await assert.rejects(getHelp('women-support', ['Workplace'], { language }));
  }
  for (const timeoutMs of [0, -1, Infinity, NaN, '100', null]) {
    await assert.rejects(getHelp('women-support', ['Workplace'], { timeoutMs }));
  }
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('network, HTTP and non-JSON failures are exposed and a later retry can succeed', async (context) => {
  const outcomes = [
    () => { throw new TypeError('Network unavailable'); },
    () => jsonResponse({ error: 'Temporary failure' }, 503),
    () => new Response('<html>Proxy unavailable</html>', { status: 502, headers: { 'Content-Type': 'text/html' } }),
    () => new Response('not JSON', { headers: { 'Content-Type': 'application/json' } }),
    () => new Response(JSON.stringify(fixture()), { headers: { 'Content-Type': 'text/plain' } }),
    () => jsonResponse(fixture()),
  ];
  context.mock.method(globalThis, 'fetch', async () => outcomes.shift()());
  for (let attempt = 0; attempt < 5; attempt++) {
    await assert.rejects(getHelp('women-support', ['Workplace']), Error);
  }
  assert.deepEqual(await getHelp('women-support', ['Workplace']), fixture());
});

test('malformed and mismatched successful payloads cannot appear as valid help', async (context) => {
  let response;
  context.mock.method(globalThis, 'fetch', async () => jsonResponse(response));
  const changes = [
    () => null,
    () => [],
    () => ({}),
    (data) => { data.categoryId = 'child-support'; return data; },
    (data) => { data.language = 'hi'; return data; },
    (data) => { data.selectedClues = ['Threat']; return data; },
    (data) => { data.selectedClueLabels = []; return data; },
    (data) => { data.unmatchedClues = ['Threat']; data.unmatchedClueLabels = ['Threat']; return data; },
    (data) => { delete data.unmatchedClueLabels; return data; },
    (data) => { data.results = null; return data; },
    (data) => { data.results[0].matchCount = '1'; return data; },
    (data) => { data.results[0].matchedClues = ['Threat']; return data; },
    (data) => { data.results[0].matchedClueLabels = []; return data; },
    (data) => { data.results.push(structuredClone(data.results[0])); return data; },
    (data) => { delete data.results[0].help; return data; },
    (data) => { data.results[0].help.immediateHelp = 'Take action'; return data; },
    (data) => { data.results[0].help.contacts[0].number = 181; return data; },
    (data) => { data.results[0].help.schemes[0].description = null; return data; },
    (data) => { delete data.results[0].sourceDetails; return data; },
    (data) => { data.results[0].sourceDetails = []; return data; },
    (data) => { data.results[0].sourceDetails[0].url = 'javascript:alert(1)'; return data; },
    (data) => { data.results[0].help.sources = ['https://example.test/unrecorded']; return data; },
    (data) => { data.results[0].reviewedOn = '2026-02-30'; return data; },
    (data) => { data.results[0].coverage = ''; return data; },
  ];
  for (const change of changes) {
    response = change(fixture());
    await assert.rejects(getHelp('women-support', ['Workplace']), Error);
  }
  response = fixture();
  assert.deepEqual(await getHelp('women-support', ['Workplace']), fixture());
});

test('malformed health instructions and medicine precautions are rejected', async (context) => {
  const health = {
    categoryId: 'common-health', language: 'en',
    selectedClues: ['Mild Headache'], selectedClueLabels: ['Mild Headache'],
    unmatchedClues: [], unmatchedClueLabels: [],
    results: [{
      id: 'common-health/mild-headache', name: 'Mild Headache', keywords: ['Mild Headache'],
      matchCount: 1, matchedClues: ['Mild Headache'], matchedClueLabels: ['Mild Headache'],
      sourceDetails: [{ title: 'NHS — headaches', url: 'https://www.nhs.uk/symptoms/headaches/' }],
      reviewedOn: '2026-10-24', coverage: 'General adult health information.',
      help: {
        immediateHelp: ['Rest and drink water.'], contacts: [], rights: [], schemes: [], sources: ['https://www.nhs.uk/symptoms/headaches/'],
        seekHelp: ['Seek care for sudden severe pain.'],
        medicines: [{ name: 'Paracetamol', purpose: 'Short-term pain relief', precautions: ['Follow the product label.'] }],
      },
    }],
  };
  let response;
  context.mock.method(globalThis, 'fetch', async () => jsonResponse(response));
  for (const change of [
    (data) => { delete data.results[0].help.seekHelp; },
    (data) => { delete data.results[0].help.medicines; },
    (data) => { data.results[0].help.medicines[0].precautions = 'Be careful'; },
    (data) => { data.results[0].help.medicines[0].precautions = []; },
  ]) {
    response = structuredClone(health);
    change(response);
    await assert.rejects(getHelp('common-health', ['Mild Headache']), Error);
  }
  response = structuredClone(health);
  assert.deepEqual(await getHelp('common-health', ['Mild Headache']), health);
});

test('external cancellation and pre-aborted requests reject with AbortError and allow retry', async (context) => {
  let pending = true;
  const fetchMock = context.mock.method(globalThis, 'fetch', async (_url, { signal }) =>
    pending ? pendingResponse(signal) : jsonResponse(fixture()));
  const controller = new AbortController();
  const request = getHelp('women-support', ['Workplace'], { signal: controller.signal });
  controller.abort();
  await assert.rejects(request, { name: 'AbortError' });
  const callCount = fetchMock.mock.callCount();
  await assert.rejects(getHelp('women-support', ['Workplace'], { signal: controller.signal }), { name: 'AbortError' });
  assert.equal(fetchMock.mock.callCount(), callCount);
  pending = false;
  assert.deepEqual(await getHelp('women-support', ['Workplace']), fixture());
});

test('a stalled request times out rather than returning local results and a retry can succeed', async (context) => {
  let stalled = true;
  let requestSignal;
  context.mock.method(globalThis, 'fetch', async (_url, { signal }) => {
    requestSignal = signal;
    return stalled ? pendingResponse(signal) : jsonResponse(fixture());
  });
  await assert.rejects(getHelp('women-support', ['Workplace'], { timeoutMs: 10 }), (error) =>
    error instanceof Error && error.name !== 'AbortError');
  assert.equal(requestSignal.aborted, true);
  stalled = false;
  assert.deepEqual(await getHelp('women-support', ['Workplace']), fixture());
});

test('cancellation while parsing the response prevents completed data from being returned', async (context) => {
  const controller = new AbortController();
  context.mock.method(globalThis, 'fetch', async () => ({
    ok: true, status: 200, headers: new Headers({ 'Content-Type': 'application/json' }),
    async json() {
      controller.abort();
      return fixture();
    },
  }));
  await assert.rejects(getHelp('women-support', ['Workplace'], { signal: controller.signal }), { name: 'AbortError' });
});
