import test from 'node:test';
import assert from 'node:assert/strict';
import { getHelpFixture as getHelp } from './fixtures/helpResults.js';
import { commonHealthCategory } from './fixtures/commonHealthData.js';
import { translate } from '../src/translations/translations.js';
import { buildResultSpeech } from '../src/utils/resultSpeech.js';

const languages = ['en', 'ta', 'hi'];
const adultNotice = 'General adult information, not a diagnosis or prescription. Ask a pharmacist about suitability and follow the product label. Children, pregnancy, ongoing illnesses, and other medicines need individual advice.';
const emergencyNotice = 'Use emergency services for severe symptoms; do not wait for an over-the-counter medicine to work.';
const relevanceNotice = 'Related information based on matching clues. Match counts show relevance, not urgency.';

function assertContains(text, expected, context) {
  assert.ok(text.includes(expected), `${context}: missing ${expected}`);
}

test('health speech retains all displayed warnings, self-care, escalation and medicine cautions in every language', async () => {
  for (const clue of commonHealthCategory.clues) {
    const response = getHelp('common-health', [clue]);
    const issue = response.results[0];
    const before = JSON.stringify(issue);
    for (const language of languages) {
      const t = (text) => translate(text, language);
      const speech = buildResultSpeech(issue, t, { isCommonHealth: true });
      const context = `${language}: ${clue}`;
      assert.equal(typeof speech, 'string');
      for (const text of [issue.name, adultNotice, emergencyNotice, relevanceNotice,
        ...issue.help.immediateHelp, ...issue.help.seekHelp,
        ...issue.help.medicines.flatMap((medicine) => [medicine.name, medicine.purpose, ...medicine.precautions]),
      ]) {
        assertContains(speech, t(text), context);
      }
      const medicinesStart = speech.indexOf(t('Medicine information'));
      assert.ok(medicinesStart >= 0, `${context}: medicine section missing`);
      assert.ok(speech.indexOf(t(adultNotice)) < medicinesStart, `${context}: adult safety notice must precede medicine information`);
      assert.ok(speech.indexOf(t(emergencyNotice)) < medicinesStart, `${context}: emergency safety notice must precede medicine information`);
      const selfCareStart = speech.indexOf(t(issue.help.immediateHelp[0]));
      assert.ok(speech.indexOf(t(adultNotice)) < selfCareStart, `${context}: adult safety notice must precede self-care advice`);
      assert.ok(speech.indexOf(t(emergencyNotice)) < selfCareStart, `${context}: emergency safety notice must precede self-care advice`);
      for (const warning of issue.help.seekHelp) {
        assert.ok(speech.indexOf(t(warning)) < medicinesStart, `${context}: escalation guidance must precede medicine information`);
      }
      assertContains(speech, t('Call 112'), context);
      assert.doesNotMatch(speech, /https?:\/\/|www\.nhs\.uk|<\/?[a-z][^>]*>/i);
      assert.equal(JSON.stringify(issue), before, `${context}: narration must not change the result record`);
    }
  }
});

test('cold and diarrhoea narration preserves the displayed numeric escalation thresholds', async () => {
  for (const [clue, thresholds] of [['Common Cold', ['3', '10']], ['Diarrhoea', ['7']]]) {
    const { results: [issue] } = getHelp('common-health', [clue]);
    for (const language of languages) {
      const speech = buildResultSpeech(issue, (text) => translate(text, language), { isCommonHealth: true });
      for (const threshold of thresholds) {
        assert.match(speech, new RegExp(`\\b${threshold}\\b`), `${language}: ${clue} threshold ${threshold}`);
      }
    }
  }
});

test('ordinary assistance narration includes matches, actions, phone contacts, rights and scheme descriptions', async () => {
  const { results: [issue] } = getHelp('women-support', ['Workplace']);
  const before = JSON.stringify(issue);
  for (const language of languages) {
    const t = (text) => translate(text, language);
    const speech = buildResultSpeech(issue, t);
    for (const text of [issue.name, ...issue.matchedClues, relevanceNotice,
      ...issue.help.immediateHelp, ...issue.help.rights,
      ...issue.help.contacts.flatMap((contact) => [contact.name, contact.available]),
      ...issue.help.schemes.flatMap((scheme) => [scheme.name, scheme.description]),
    ]) {
      assertContains(speech, t(text), language);
    }
    assertContains(speech, '181', language);
    assertContains(speech, t('Call 112'), language);
    assert.doesNotMatch(speech, /https?:\/\/|wcd\.nic\.in|<\/?[a-z][^>]*>/i);
    assert.ok(speech.indexOf(t(issue.help.immediateHelp[0])) < speech.indexOf(t(issue.help.rights[0])));
    assert.equal(JSON.stringify(issue), before);
  }
});

test('scheme narration presents next steps rather than an immediate-emergency heading', async () => {
  const { results: [issue] } = getHelp('government-schemes', ['Health Insurance']);
  assert.ok(issue, 'expected a matching government scheme record');
  for (const language of languages) {
    const t = (text) => translate(text, language);
    const speech = buildResultSpeech(issue, t, { isSchemes: true });
    assertContains(speech, t('Next steps'), language);
    assertContains(speech, t('Application / Support Contacts'), language);
    assertContains(speech, t(issue.help.immediateHelp[0]), language);
    assert.ok(!speech.includes(t('🚨 Immediate Help')), `${language}: scheme instructions are not emergency instructions`);
  }
});

test('readable source labels remain, while raw source addresses and interface buttons are not narrated', async () => {
  const { results: [issue] } = getHelp('women-support', ['Workplace']);
  // A URL-only source may appear alongside labelled official references.
  issue.help.sources.push('https://example.gov.in/very/long/path');
  for (const language of languages) {
    const t = (text) => translate(text, language);
    const speech = buildResultSpeech(issue, t);
    assertContains(speech, t('Ministry of Women and Child Development'), language);
    assertContains(speech, t('Sexual Harassment of Women at Workplace Act, 2013'), language);
    assert.doesNotMatch(speech, /example\.gov\.in|wcd\.nic\.in|https?:\/\/|<\/?[a-z][^>]*>/i);
    for (const label of ['← Back to clues', '← Back to Home']) {
      assert.ok(!speech.includes(t(label)), `${language}: navigation is not assistance content`);
    }
  }
});
