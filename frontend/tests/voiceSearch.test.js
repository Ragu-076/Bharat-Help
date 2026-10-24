import test from 'node:test';
import assert from 'node:assert/strict';
import categories from '../src/data/categoryCatalog.js';
import { translate } from '../src/translations/translations.js';
import { matchVoiceSearch } from '../src/utils/voiceSearch.js';

const cluesFor = (text, categoryId, scope) => matchVoiceSearch(text, scope)
  .find((result) => result.categoryId === categoryId)?.clues || [];

test('every existing clue is searchable in English, Tamil and Hindi within its category', () => {
  for (const category of categories) {
    for (const clue of category.clues) {
      for (const language of ['en', 'ta', 'hi']) {
        const phrase = translate(clue, language);
        assert.ok(cluesFor(phrase, category.id, { categoryId: category.id }).includes(clue),
          `${category.id}: ${clue} (${language}: ${phrase})`);
      }
    }
  }
});

test('natural English fraud, missing child and ambulance phrases select existing canonical clues', () => {
  assert.deepEqual(cluesFor('I lost money through UPI', 'cyber-crime'), ['UPI / Banking Fraud']);
  assert.deepEqual(cluesFor('My child is missing, please help', 'child-support'), ['Missing Child']);
  assert.deepEqual(cluesFor('I need an ambulance', 'emergency-helplines'), ['Ambulance']);
  assert.deepEqual(cluesFor('Someone hacked my account', 'cyber-crime'), ['Hacking']);
  assert.deepEqual(cluesFor('My daughter is missing', 'child-support'), ['Missing Child']);
  assert.deepEqual(cluesFor('My child has been missing since morning', 'child-support'), ['Missing Child']);
  assert.deepEqual(cluesFor('I lost money using UPI', 'cyber-crime'), ['UPI / Banking Fraud']);
  assert.deepEqual(cluesFor('I need a job', 'government-schemes'), ['Employment']);
});

test('the demo theft phrase and spoken UPI acronym match banking fraud without broad theft matches', () => {
  for (const text of ['Someone stole money through UPI', 'Someone stole my money using UPI',
    'My money was stolen through UPI', 'Someone stole money through U P I',
    'Someone stole money through U.P.I.']) {
    assert.deepEqual(cluesFor(text, 'cyber-crime'), ['UPI / Banking Fraud'], text);
    assert.deepEqual(cluesFor(text, 'cyber-crime', { categoryId: 'cyber-crime' }), ['UPI / Banking Fraud'], text);
  }
  assert.deepEqual(matchVoiceSearch('Someone stole my wallet'), []);
  assert.deepEqual(matchVoiceSearch('No money was stolen through UPI'), []);
  assert.deepEqual(matchVoiceSearch('Someone stole money through UPI', {categoryId:'women-support'}), []);
});

test('Tamil natural phrases preserve script and find matching clues', () => {
  assert.deepEqual(cluesFor('என் குழந்தை காணவில்லை உதவி வேண்டும்', 'child-support'), ['Missing Child']);
  assert.deepEqual(cluesFor('எனக்கு மூச்சு விட முடியவில்லை', 'medical-emergency'), ['Breathing Problem']);
  assert.deepEqual(cluesFor('வீடு எரிகிறது உதவி வேண்டும்', 'emergency-helplines'), ['Fire']);
  assert.deepEqual(cluesFor('கல்வி உதவித்தொகை வேண்டும்', 'government-schemes'), ['Education']);
});

test('Hindi natural phrases and mixed script find matching clues', () => {
  assert.deepEqual(cluesFor('मेरा बच्चा खो गया है', 'child-support'), ['Missing Child']);
  assert.deepEqual(cluesFor('मुझे सांस नहीं आ रही है', 'medical-emergency'), ['Breathing Problem']);
  assert.deepEqual(cluesFor('UPI से पैसे कट गए मदद चाहिए', 'cyber-crime'), ['UPI / Banking Fraud']);
  assert.deepEqual(cluesFor('எனக்கு UPI scam நடந்தது', 'cyber-crime'), ['UPI / Banking Fraud']);
});

test('punctuation, casing, Unicode normalization and repeated clues are handled', () => {
  const first = matchVoiceSearch('UPI-FRAUD! upi fraud. UPI / Banking Fraud');
  assert.deepEqual(first.find((result) => result.categoryId === 'cyber-crime')?.clues, ['UPI / Banking Fraud']);
  const phrase = translate('Employment', 'hi');
  assert.deepEqual(cluesFor(phrase.normalize('NFD'), 'government-schemes'), ['Employment']);
});

test('specific phrases suppress overlapping generic clues across categories', () => {
  assert.deepEqual(cluesFor('online abuse', 'child-support'), []);
  assert.deepEqual(cluesFor('online abuse', 'women-support'), ['Online Abuse']);
  assert.deepEqual(cluesFor('education denied', 'government-schemes'), []);
  assert.deepEqual(cluesFor('education denied', 'child-support'), ['Education Denied']);
  assert.deepEqual(matchVoiceSearch('education denied', { categoryId: 'government-schemes' }), []);
  assert.deepEqual(matchVoiceSearch('online abuse', { categoryId: 'child-support' }), []);
  assert.deepEqual(cluesFor('mental health crisis', 'emergency-helplines'), []);
  assert.deepEqual(cluesFor('mental health crisis', 'medical-emergency'), ['Mental Health Crisis']);
  assert.deepEqual(cluesFor('heart attack', 'medical-emergency'), ['Heart Attack']);
});

test('explicit severe or sudden headache wording is not offered as the mild symptom clue', () => {
  for (const phrase of ['severe headache', 'sudden headache', 'headache is unbearable',
    'கடுமையான தலைவலி', 'திடீர் தலைவலி', 'तेज सिरदर्द', 'अचानक सिरदर्द']) {
    assert.deepEqual(cluesFor(phrase, 'common-health'), [], phrase);
  }
  assert.deepEqual(cluesFor('mild headache', 'common-health'), ['Mild Headache']);
});

test('unrelated substrings and broad words do not produce invented clues', () => {
  for (const phrase of ['firewall', 'scold', 'money', 'pain', 'help', 'medical emergency', 'women support', 'hello world', '!!!', '', 'pregnant']) {
    assert.deepEqual(matchVoiceSearch(phrase), [], phrase);
  }
  assert.deepEqual(matchVoiceSearch(null), []);
  assert.deepEqual(matchVoiceSearch({ text: 'ambulance' }), []);
});

test('category scope restricts suggestions without filling its other clues', () => {
  assert.deepEqual(matchVoiceSearch('ambulance needed', { categoryId: 'common-health' }), []);
  assert.deepEqual(matchVoiceSearch('headache', { categoryId: 'made-up-category' }), []);
  assert.deepEqual(matchVoiceSearch('headache', { categoryId: 'common-health' }).map(({ categoryId, clues }) => ({ categoryId, clues })),
    [{ categoryId: 'common-health', clues: ['Mild Headache'] }]);
});

test('straightforward nearby negations are excluded while separate positive clauses remain', () => {
  assert.deepEqual(matchVoiceSearch('no accident'), []);
  assert.deepEqual(matchVoiceSearch('not pregnant'), []);
  assert.deepEqual(matchVoiceSearch('I do not need police'), []);
  assert.deepEqual(matchVoiceSearch('விபத்து இல்லை'), []);
  assert.deepEqual(matchVoiceSearch('दुर्घटना नहीं हुई'), []);
  assert.deepEqual(matchVoiceSearch('मुझे सिरदर्द नहीं है'), []);
  assert.deepEqual(cluesFor('No accident, but I need an ambulance', 'emergency-helplines'), ['Ambulance']);
  assert.deepEqual(cluesFor('விபத்து இல்லை ஆனால் ஆம்புலன்ஸ் வேண்டும்', 'emergency-helplines'), ['Ambulance']);
  assert.deepEqual(cluesFor('I cannot breathe', 'medical-emergency'), ['Breathing Problem']);
});

test('negation does not swallow explicitly separate positive emergency requests', () => {
  assert.deepEqual(cluesFor('no accident and need ambulance', 'emergency-helplines'), ['Ambulance']);
  assert.deepEqual(cluesFor('No accident and I need an ambulance', 'emergency-helplines'), ['Ambulance']);
  assert.deepEqual(cluesFor('Do not delay call police', 'emergency-helplines'), ['Police']);
  assert.deepEqual(cluesFor('Do not delay in calling police', 'emergency-helplines'), ['Police']);
  assert.deepEqual(cluesFor('दुर्घटना नहीं हुई एंबुलेंस चाहिए', 'emergency-helplines'), ['Ambulance']);
  assert.deepEqual(cluesFor('मुझे सर्दी नहीं बल्कि सांस लेने में दिक्कत है', 'medical-emergency'), ['Breathing Problem']);
  assert.deepEqual(cluesFor('मुझे सर्दी नहीं बल्कि सांस लेने में दिक्कत है', 'common-health'), []);
  assert.deepEqual(matchVoiceSearch('no police and ambulance'), []);
  assert.deepEqual(matchVoiceSearch('do not call police'), []);
  assert.deepEqual(matchVoiceSearch('मुझे नहीं चाहिए एंबुलेंस'), []);
  assert.deepEqual(matchVoiceSearch('नहीं है एंबुलेंस'), []);
  assert.deepEqual(matchVoiceSearch('एंबुलेंस नहीं चाहिए'), []);
});

test('explicit child context routes online abuse to child Online Danger', () => {
  for (const phrase of ['My child faces online abuse', 'My daughter faces online harassment',
    'என் குழந்தைக்கு இணையத் துன்புறுத்தல்', 'मेरे बच्चे को ऑनलाइन उत्पीड़न']) {
    assert.deepEqual(cluesFor(phrase, 'child-support'), ['Online Danger'], phrase);
    assert.deepEqual(cluesFor(phrase, 'women-support'), [], phrase);
  }
  const scoped = matchVoiceSearch('My child faces online abuse', { categoryId: 'child-support' });
  assert.deepEqual(scoped.map(({ categoryId, clues }) => ({ categoryId, clues })),
    [{ categoryId: 'child-support', clues: ['Online Danger'] }]);
  const both = 'A woman and child face online abuse';
  assert.deepEqual(cluesFor(both, 'women-support'), ['Online Abuse']);
  assert.deepEqual(cluesFor(both, 'child-support'), ['Online Danger']);
  assert.deepEqual(cluesFor('A woman faces online abuse', 'women-support'), ['Online Abuse']);
});

test('multiple independent clues are deduplicated, canonical and sorted deterministically', () => {
  const phrase = 'need police and ambulance after a road accident';
  const actual = matchVoiceSearch(phrase);
  assert.deepEqual(actual, matchVoiceSearch(phrase));
  assert.deepEqual(actual[0].clues, ['Police', 'Ambulance']);
  for (const suggestion of actual) {
    const category = categories.find((item) => item.id === suggestion.categoryId);
    assert.ok(category);
    assert.ok(suggestion.score > 0);
    assert.equal(new Set(suggestion.clues).size, suggestion.clues.length);
    assert.ok(suggestion.clues.every((clue) => category.clues.includes(clue)));
  }
});
