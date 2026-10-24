import test from 'node:test';
import assert from 'node:assert/strict';
import helpData from './fixtures/helpData.js';
import { commonHealthCategory } from './fixtures/commonHealthData.js';
import { categories } from '../src/services/helpService.js';
import { getHelpFixture as getHelp } from './fixtures/helpResults.js';
import { dictionaries, languages, normalizeLanguage, translate } from '../src/translations/translations.js';
import { rows } from '../src/translations/messages.js';
import { speechRows } from '../src/translations/speechMessages.js';
import { voiceSearchRows } from '../src/translations/voiceSearchMessages.js';

test('English, Tamil and Hindi are supported and all interface strings have translations', () => {
  assert.deepEqual(languages.map((language) => language.code), ['en', 'ta', 'hi']);
  assert.deepEqual(Object.keys(dictionaries), ['ta', 'hi']);
  assert.equal(normalizeLanguage('hi'), 'hi');
  assert.equal(normalizeLanguage('ta'), 'ta');
  assert.equal(normalizeLanguage('en'), 'en');
  assert.equal(translate('Women Support', 'hi'), 'महिलाओं के लिए सहायता');
  assert.equal(normalizeLanguage(null), 'en');
  assert.equal(normalizeLanguage('unsupported'), 'en');
  for (const [english] of [...rows, ...speechRows, ...voiceSearchRows]) {
    for (const language of ['ta', 'hi']) {
      assert.ok(dictionaries[language][english], `${language}: ${english}`);
      assert.equal(translate(english, 'en'), english);
    }
  }
});

test('all category, clue and result content is translated, except proper names and addresses', () => {
  const properNames = new Set(['SHe-Box', 'TrackChild', 'iCall (TISS)', 'CERT-In']);
  const check = (text) => {
    if (properNames.has(text) || /^https?:\/\//.test(text) || /^[a-z0-9.-]+\.[a-z]{2,}$/.test(text)) return;
    for (const language of ['ta', 'hi']) {
      assert.notEqual(translate(text, language), text, `${language} missing: ${text}`);
    }
  };
  for (const category of [...helpData, commonHealthCategory]) {
    [category.label, category.description, ...category.clues].forEach(check);
    for (const issue of category.issues) {
      [issue.name, ...issue.help.immediateHelp, ...issue.help.rights, ...issue.help.sources,
        ...issue.help.contacts.flatMap((contact) => [contact.name, contact.available]),
        ...issue.help.schemes.flatMap((scheme) => [scheme.name, scheme.description]),
        ...(issue.help.seekHelp || []),
        ...(issue.help.medicines || []).flatMap((medicine) => [medicine.name, medicine.purpose, ...medicine.precautions]),
      ].forEach(check);
    }
  }
});

test('display translations do not change canonical clues or matching', async () => {
  const input = ['Common Cold', 'Diarrhoea'];
  const response = getHelp('common-health', input);
  const original = JSON.stringify(response);
  for (const language of ['en', 'ta', 'hi']) {
    response.results.forEach((issue) => translate(issue.name, language));
    input.forEach((clue) => translate(clue, language));
    assert.equal(JSON.stringify(response), original);
  }
  assert.equal(categories.length, 7);
  assert.deepEqual(response.results.map((issue) => issue.name), input);
  assert.deepEqual(response.unmatchedClues, []);
});

test('source labels translate without changing official domains, numbers or unknown text', () => {
  const source = 'Ministry of Home Affairs — mha.gov.in';
  assert.equal(translate(source, 'hi'), 'गृह मंत्रालय — mha.gov.in');
  assert.equal(translate(source, 'en'), source);
  for (const language of ['en', 'ta', 'hi', 'unsupported']) {
    assert.equal(translate('112', language), '112');
    assert.equal(translate('https://112.gov.in/', language), 'https://112.gov.in/');
    assert.equal(translate('Untranslated fallback', language), 'Untranslated fallback');
  }
  assert.equal(translate('Women Support', 'unsupported'), 'Women Support');
});

test('common health topics have separate medicine information, precautions, escalation and sources', async () => {
  for (const clue of commonHealthCategory.clues) {
    const response = getHelp('common-health', [clue]);
    assert.equal(response.results.length, 1, `Unrelated topic matched: ${clue}`);
    const { help } = response.results[0];
    assert.ok(help.medicines.length > 0);
    assert.ok(help.seekHelp.length > 0);
    assert.ok(help.sources.every((source) => source.startsWith('https://www.nhs.uk/')));
    assert.ok(help.medicines.every((medicine) => medicine.precautions.length > 0));
  }
  const emergency = getHelp('medical-emergency', ['Heart Attack']);
  assert.ok(emergency.results.every((issue) => !issue.help.medicines));
});
