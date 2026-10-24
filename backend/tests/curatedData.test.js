import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { categoryCatalog, findHelp } from '../src/helpRepository.js';
import { assistanceRecords, dataSource } from '../src/recordStore.js';
import { localizeHelpResponse } from '../src/localization.js';
import { translate } from '../../frontend/src/translations/translations.js';
import { buildResultSpeech, healthNotices } from '../../frontend/src/utils/resultSpeech.js';

test('every selectable clue has sourced content and retained source files exist', () => {
  assert.equal(dataSource, 'curated-source-records');
  assert.equal(categoryCatalog.length, 7);
  for (const category of categoryCatalog) {
    for (const clue of category.clues) {
      const result = findHelp(category.id, [clue]);
      assert.equal(result.unmatchedClues.length, 0, `${category.id}: ${clue}`);
      assert.ok(result.results.length > 0, `${category.id}: ${clue}`);
    }
  }
  for (const record of assistanceRecords) {
    assert.ok(Object.isFrozen(record.help), record.id);
    for (const url of record.help.sources) {
      assert.ok(record.sourceDetails.some((source) => source.url === url), `${record.id}: ${url}`);
    }
    for (const source of record.sourceDetails) {
      if (source.rawFile) assert.ok(existsSync(new URL(`../../${source.rawFile}`, import.meta.url)), source.rawFile);
    }
  }
});

test('emergency selections do not return the old combined helpline list', () => {
  const expected = {
    Police: 'police', Ambulance: 'ambulance', Fire: 'fire', 'Women Helpline': 'women-helpline',
    Childline: 'child-helpline', 'Cyber Crime': 'cyber-reporting', Disaster: 'disaster-safety',
    'Mental Health': 'mental-health',
  };
  for (const [clue, id] of Object.entries(expected)) {
    const response = findHelp('emergency-helplines', [clue]);
    assert.deepEqual(response.results.map((issue) => issue.id), [`emergency-helplines/${id}`]);
  }
  const fire = findHelp('emergency-helplines', ['Fire']).results[0];
  assert.ok(fire.help.contacts.some(({ number }) => number === '112'));
  assert.ok(!fire.help.contacts.some(({ number }) => ['1930', '1098', '181'].includes(number)));
  assert.deepEqual(findHelp('emergency-helplines', ['Fire', 'Police', 'Fire']).results.map(({ id }) => id).sort(),
    ['emergency-helplines/fire', 'emergency-helplines/police']);
});

test('specific cyber and medical selections do not accumulate unrelated assistance', () => {
  assert.deepEqual(findHelp('cyber-crime', ['Online Fraud', 'UPI / Banking Fraud']).results.map(({ id }) => id),
    ['cyber-crime/financial-fraud']);
  assert.deepEqual(findHelp('cyber-crime', ['Hacking']).results.map(({ id }) => id), ['cyber-crime/hacked-account']);
  assert.deepEqual(findHelp('medical-emergency', ['Snake Bite']).results.map(({ id }) => id), ['medical-emergency/snake-bite']);
  const scheme = findHelp('government-schemes', ['Agriculture']).results;
  assert.deepEqual(scheme.map(({ id }) => id), ['government-schemes/pm-kisan', 'government-schemes/pmfby-crop-insurance']);
  const health = findHelp('common-health', ['Occasional Acidity']).results;
  assert.equal(health.length, 1);
  assert.ok(health[0].help.seekHelp.some((text) => /chest pain/iu.test(text)));
});

test('curated results keep localized guidance, warnings, coverage and source labels in narration', () => {
  const scripts = { hi: /[\u0900-\u097f]/u, ta: /[\u0b80-\u0bff]/u };
  for (const category of categoryCatalog) {
    const original = findHelp(category.id, category.clues);
    for (const language of ['en', 'hi', 'ta']) {
      const response = localizeHelpResponse(original, language);
      const t = (text) => translate(text, language);
      const isCommonHealth = category.id === 'common-health';
      for (const issue of response.results) {
        const speech = buildResultSpeech(issue, t, { isCommonHealth, isSchemes: category.id === 'government-schemes' });
        const guidance = [...issue.help.immediateHelp, ...issue.help.rights, ...(issue.help.seekHelp || []), ...(issue.help.awareness || [])];
        for (const text of guidance) {
          if (language !== 'en') assert.match(text, scripts[language], `${issue.id}: ${language}`);
          assert.ok(speech.includes(text), `${issue.id}: missing spoken guidance`);
        }
        assert.ok(speech.includes(issue.coverage), `${issue.id}: coverage`);
        assert.ok(speech.includes(issue.reviewedOn), `${issue.id}: source date`);
        issue.sourceDetails.forEach(({ title }) => assert.ok(speech.includes(t(title)), `${issue.id}: source label`));
        assert.doesNotMatch(speech, /https?:\/\//u);
        if (isCommonHealth) {
          for (const notice of healthNotices) assert.ok(speech.includes(t(notice)));
          for (const medicine of issue.help.medicines) {
            for (const precaution of medicine.precautions) assert.ok(speech.includes(precaution));
          }
          assert.ok(speech.indexOf(issue.help.seekHelp[0]) < speech.indexOf(t('Medicine information')));
        }
      }
    }
  }
});
