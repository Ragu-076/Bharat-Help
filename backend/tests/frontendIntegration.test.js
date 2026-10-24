import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import { findHelp } from '../src/helpRepository.js';
import { localizeHelpResponse } from '../src/localization.js';
import { categories, getHelp } from '../../frontend/src/services/helpService.js';

let server, base;
const realFetch = globalThis.fetch;

before(async () => {
  server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

function useActualApi(context) {
  return context.mock.method(globalThis, 'fetch', (url, options) => {
    assert.equal(url, '/api/help');
    return realFetch(`${base}${url}`, options);
  });
}

test('the frontend adapter receives actual HTTP results for all categories in every language', async (context) => {
  const fetchMock = useActualApi(context);
  for (const category of categories) {
    for (const language of ['en', 'hi', 'ta']) {
      const response = await getHelp(category.id, category.clues, { language });
      const expected = localizeHelpResponse(findHelp(category.id, category.clues), language);
      assert.deepEqual(response, expected);
      assert.equal(response.language, language);
      assert.ok(response.results.length > 0);
    }
  }
  assert.equal(fetchMock.mock.callCount(), categories.length * 3);
});

test('actual API adds agriculture and online-safety coverage while preserving duplicates and empty selections', async (context) => {
  useActualApi(context);
  const clues = ['Financial Aid', 'Agriculture', 'Financial Aid'];
  const partial = await getHelp('government-schemes', clues, { language: 'hi' });
  assert.deepEqual(clues, ['Financial Aid', 'Agriculture', 'Financial Aid']);
  assert.deepEqual(partial.selectedClues, ['Financial Aid', 'Agriculture']);
  assert.deepEqual(partial.unmatchedClues, []);
  assert.deepEqual(partial.unmatchedClueLabels, []);
  assert.ok(partial.results.some(({ id }) => id === 'government-schemes/pm-kisan'));
  assert.ok(partial.results.length > 0);
  const empty = await getHelp('child-support', [], { language: 'ta' });
  assert.deepEqual(empty.results, []);
  assert.deepEqual(empty.unmatchedClues, []);
  const online = await getHelp('child-support', ['Online Danger'], { language: 'ta' });
  assert.equal(online.results[0].id, 'child-support/child-online-safety-and-grooming');
  assert.deepEqual(online.unmatchedClues, []);
});

test('actual translated health results keep every escalation warning and medicine precaution', async (context) => {
  useActualApi(context);
  const clues = ['Mild Headache', 'Common Cold', 'Diarrhoea', 'Occasional Acidity'];
  const original = findHelp('common-health', clues);
  for (const language of ['hi', 'ta']) {
    const response = await getHelp('common-health', clues, { language });
    assert.equal(response.results.length, 4);
    response.results.forEach((issue, index) => {
      const source = original.results[index];
      assert.equal(issue.help.seekHelp.length, source.help.seekHelp.length);
      assert.equal(issue.help.medicines.length, source.help.medicines.length);
      issue.help.medicines.forEach((medicine, medicineIndex) => {
        assert.equal(medicine.precautions.length, source.help.medicines[medicineIndex].precautions.length);
      });
      assert.deepEqual(issue.help.contacts.map(({ number }) => number), source.help.contacts.map(({ number }) => number));
      assert.deepEqual(issue.help.sources, source.help.sources);
    });
  }
});
