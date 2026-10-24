import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import { categoryCatalog, findHelp, RequestError } from '../src/helpRepository.js';
import { localizeHelpResponse, validateLanguage } from '../src/localization.js';

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

const scripts = { hi: /[\u0900-\u097f]/u, ta: /[\u0b80-\u0bff]/u };
function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

test('language validation accepts only the supported codes and defaults to English', () => {
  assert.equal(validateLanguage(), 'en');
  for (const language of ['en', 'hi', 'ta']) assert.equal(validateLanguage(language), language);
  for (const invalid of ['', 'HI', 'en-US', 'fr', ' hi', null, 1, true, [], {}]) {
    assert.throws(() => validateLanguage(invalid), (error) => error instanceof RequestError && error.status === 400);
    assert.throws(() => localizeHelpResponse(findHelp('women-support', ['Workplace']), invalid),
      (error) => error instanceof RequestError && error.status === 400);
  }
});

test('omitted language preserves English display fields and adds English clue labels', () => {
  const original = findHelp('women-support', ['Workplace']);
  const data = localizeHelpResponse(original);
  assert.deepEqual(data, {
    ...original,
    language: 'en',
    selectedClueLabels: ['Workplace'],
    unmatchedClueLabels: [],
    results: original.results.map((issue) => ({ ...issue, matchedClueLabels: ['Workplace'] })),
  });
});

test('Hindi response translates curated workplace guidance and preserves official source URLs', () => {
  const data = localizeHelpResponse(findHelp('women-support', ['Workplace']), 'hi');
  assert.equal(data.language, 'hi');
  assert.deepEqual(data.selectedClueLabels, ['कार्यस्थल']);
  const issue = data.results[0];
  assert.equal(issue.name, 'कार्यस्थल पर यौन उत्पीड़न - शी-बॉक्स');
  assert.deepEqual(issue.matchedClueLabels, ['कार्यस्थल']);
  issue.help.immediateHelp.forEach((text) => assert.match(text, scripts.hi));
  assert.match(issue.help.rights[0], scripts.hi);
  assert.equal(issue.help.contacts[0].name, 'महिला हेल्पलाइन');
  assert.match(issue.help.contacts[0].available, scripts.hi);
  assert.equal(issue.help.contacts[0].number, '181');
  assert.ok(issue.help.sources.includes('https://shebox.wcd.gov.in/'));
  assert.match(issue.coverage, scripts.hi);
});

test('Tamil response translates representative assistance fields and preserves source domains', () => {
  const data = localizeHelpResponse(findHelp('women-support', ['Workplace']), 'ta');
  assert.equal(data.language, 'ta');
  assert.deepEqual(data.selectedClueLabels, ['பணியிடம்']);
  const issue = data.results[0];
  assert.equal(issue.name, 'பணியிடப் பாலியல் துன்புறுத்தல் - ஷீ-பாக்ஸ்');
  assert.deepEqual(issue.matchedClueLabels, ['பணியிடம்']);
  issue.help.immediateHelp.forEach((text) => assert.match(text, scripts.ta));
  assert.match(issue.help.rights[0], scripts.ta);
  assert.match(issue.help.contacts[0].name, scripts.ta);
  assert.match(issue.help.contacts[0].available, scripts.ta);
  assert.ok(issue.help.sources.includes('https://shebox.wcd.gov.in/'));
  assert.match(issue.coverage, scripts.ta);
});

test('language switching preserves record identity, ranking, scores and canonical selections across every category', () => {
  for (const category of categoryCatalog) {
    const original = findHelp(category.id, category.clues);
    const snapshot = structuredClone(original);
    deepFreeze(original);
    for (const language of ['en', 'hi', 'ta']) {
      const data = localizeHelpResponse(original, language);
      assert.equal(data.categoryId, original.categoryId);
      assert.deepEqual(data.selectedClues, original.selectedClues);
      assert.deepEqual(data.unmatchedClues, original.unmatchedClues);
      assert.deepEqual(data.results.map(({ id, keywords, matchedClues, matchCount }) => ({ id, keywords, matchedClues, matchCount })),
        original.results.map(({ id, keywords, matchedClues, matchCount }) => ({ id, keywords, matchedClues, matchCount })));
      assert.equal(data.selectedClueLabels.length, original.selectedClues.length);
      assert.equal(data.unmatchedClueLabels.length, original.unmatchedClues.length);
      data.results.forEach((issue, index) => {
        const source = original.results[index];
        assert.notEqual(issue, source);
        assert.notEqual(issue.help, source.help);
        assert.deepEqual(issue.help.contacts.map(({ number }) => number), source.help.contacts.map(({ number }) => number));
        assert.equal(issue.matchedClueLabels.length, source.matchedClues.length);
        source.help.sources.forEach((text, sourceIndex) => {
          if (/^https?:\/\//u.test(text)) assert.equal(issue.help.sources[sourceIndex], text);
          const domain = text.match(/(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?/iu)?.[0];
          if (domain) assert.ok(issue.help.sources[sourceIndex].includes(domain));
        });
      });
    }
    assert.deepEqual(original, snapshot);
  }
});

test('health advice retains all precautions and escalation warnings in Hindi and Tamil', () => {
  const original = findHelp('common-health', ['Mild Headache', 'Common Cold', 'Diarrhoea', 'Occasional Acidity']);
  for (const language of ['hi', 'ta']) {
    const data = localizeHelpResponse(original, language);
    assert.equal(data.results.length, 4);
    data.results.forEach((issue, index) => {
      const source = original.results[index];
      assert.match(issue.name, scripts[language]);
      assert.equal(issue.help.seekHelp.length, source.help.seekHelp.length);
      assert.equal(issue.help.immediateHelp.length, source.help.immediateHelp.length);
      for (const text of [...issue.help.immediateHelp, ...issue.help.seekHelp]) assert.match(text, scripts[language]);
      assert.equal(issue.help.medicines.length, source.help.medicines.length);
      issue.help.medicines.forEach((medicine, medicineIndex) => {
        assert.match(medicine.name, scripts[language]);
        assert.match(medicine.purpose, scripts[language]);
        assert.equal(medicine.precautions.length, source.help.medicines[medicineIndex].precautions.length);
        medicine.precautions.forEach((text) => assert.match(text, scripts[language]));
      });
      assert.deepEqual(issue.help.sources, source.help.sources);
    });
  }
  const hindiCold = localizeHelpResponse(findHelp('common-health', ['Common Cold']), 'hi').results[0];
  assert.equal(hindiCold.help.medicines[0].name, 'पैरासिटामोल');
  assert.equal(hindiCold.help.immediateHelp[0], 'आराम करें और तरल पदार्थ पिएँ। एंटीबायोटिक्स सामान्य सर्दी-जुकाम का इलाज नहीं करते।');
  assert.equal(hindiCold.help.medicines[0].precautions[1], 'उत्पाद के लेबल पर दिए निर्देशों का पालन करें। अधिक मात्रा लेने पर तुरंत चिकित्सकीय सलाह लें, भले ही आप ठीक महसूस कर रहे हों।');
});

test('coverage labels handle empty selections, newly covered clues and duplicates', () => {
  const empty = localizeHelpResponse(findHelp('child-support', []), 'hi');
  assert.deepEqual(empty.selectedClueLabels, []);
  assert.deepEqual(empty.unmatchedClueLabels, []);
  assert.deepEqual(empty.results, []);
  const unsupported = localizeHelpResponse(findHelp('child-support', ['Online Danger']), 'ta');
  assert.deepEqual(unsupported.selectedClues, ['Online Danger']);
  assert.deepEqual(unsupported.selectedClueLabels, ['இணைய ஆபத்து']);
  assert.deepEqual(unsupported.unmatchedClueLabels, []);
  assert.equal(unsupported.results.length, 1);
  assert.deepEqual(unsupported.results[0].matchedClueLabels, ['இணைய ஆபத்து']);
  const partial = localizeHelpResponse(findHelp('government-schemes', ['Financial Aid', 'Agriculture', 'Financial Aid']), 'hi');
  assert.deepEqual(partial.selectedClues, ['Financial Aid', 'Agriculture']);
  assert.deepEqual(partial.selectedClueLabels, ['आर्थिक सहायता', 'कृषि']);
  assert.deepEqual(partial.unmatchedClues, []);
  assert.deepEqual(partial.unmatchedClueLabels, []);
  assert.ok(partial.results.length > 0);
  assert.deepEqual([...new Set(partial.results.flatMap((issue) => issue.matchedClueLabels))].sort(), ['आर्थिक सहायता', 'कृषि'].sort());
});

test('unknown display text falls back to English and responses do not share mutable guidance', () => {
  const original = findHelp('women-support', ['Workplace']);
  original.results[0].help.sources.push('An unregistered organisation — example.test', 'https://example.test/guide');
  original.results[0].help.immediateHelp.push('A new instruction awaiting review');
  const first = localizeHelpResponse(original, 'hi');
  const second = localizeHelpResponse(original, 'hi');
  assert.deepEqual(first.results[0].help.sources.slice(-2), ['An unregistered organisation — example.test', 'https://example.test/guide']);
  assert.equal(first.results[0].help.immediateHelp.at(-1), 'A new instruction awaiting review');
  first.results[0].help.immediateHelp.push('Only in the first response');
  first.results[0].help.contacts[0].number = 'changed';
  first.selectedClues.push('changed');
  assert.equal(original.results[0].help.contacts[0].number, '181');
  assert.equal(second.results[0].help.contacts[0].number, '181');
  assert.deepEqual(original.selectedClues, ['Workplace']);
  assert.deepEqual(second.selectedClues, ['Workplace']);
  assert.equal(second.results[0].help.immediateHelp.length, original.results[0].help.immediateHelp.length);
});

test('HTTP help requests return requested Hindi/Tamil while omitted language remains English', async () => {
  for (const [language, name, label] of [[undefined, 'Workplace sexual harassment - SHe-Box', 'Workplace'], ['hi', 'कार्यस्थल पर यौन उत्पीड़न - शी-बॉक्स', 'कार्यस्थल'], ['ta', 'பணியிடப் பாலியல் துன்புறுத்தல் - ஷீ-பாக்ஸ்', 'பணியிடம்']]) {
    const response = await post({ categoryId: 'women-support', clues: ['Workplace'], ...(language && { language }) });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('content-language'), language || 'en');
    const data = await response.json();
    assert.equal(data.language, language || 'en');
    assert.equal(data.results[0].name, name);
    assert.deepEqual(data.selectedClueLabels, [label]);
    assert.deepEqual(data.results[0].matchedClues, ['Workplace']);
    assert.deepEqual(data.results[0].matchedClueLabels, [label]);
    assert.equal(data.results[0].help.contacts[0].number, '181');
  }
});

test('HTTP validation errors use the supported requested language', async () => {
  for (const language of ['hi', 'ta']) {
    for (const [body, status] of [
      [{ categoryId: 'unknown', clues: [], language }, 404],
      [{ categoryId: 'women-support', clues: ['Not A Valid Clue'], language }, 400],
      [{ categoryId: 'women-support', clues: null, language }, 400],
    ]) {
      const response = await post(body);
      assert.equal(response.status, status);
      assert.equal(response.headers.get('content-language'), language);
      const data = await response.json();
      assert.match(data.error, scripts[language]);
    }
  }
});

test('HTTP rejects unsupported language values rather than silently using English', async () => {
  for (const language of ['', 'fr', 'HI', 'en-US', null, 1, true, [], {}]) {
    const response = await post({ categoryId: 'women-support', clues: ['Workplace'], language });
    assert.equal(response.status, 400);
    const data = await response.json();
    assert.equal(typeof data.error, 'string');
    assert.equal(data.results, undefined);
  }
});
