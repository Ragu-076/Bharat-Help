import test from 'node:test';
import assert from 'node:assert/strict';
import { categoryCatalog, findHelp } from '../src/helpRepository.js';
import frontendCatalog from '../../frontend/src/data/categoryCatalog.js';

test('frontend catalogue matches server records', () => assert.deepEqual(frontendCatalog, categoryCatalog));

test('scheme clues retrieve distinct sourced records and response changes cannot alter the store', () => {
  const response = findHelp('government-schemes', ['Financial Aid', 'Agriculture', 'Financial Aid']);
  assert.deepEqual(response.selectedClues, ['Financial Aid', 'Agriculture']);
  assert.deepEqual(response.unmatchedClues, []);
  assert.deepEqual(response.results.map(({ id }) => id).sort(), ['government-schemes/nfbs', 'government-schemes/pm-kisan',
    'government-schemes/pmfby-crop-insurance', 'government-schemes/pmjjby-life-insurance', 'government-schemes/pmuy-lpg']);
  assert.ok(response.results.every((issue) => issue.matchCount === 1));
  response.results[0].help.contacts[0].number = 'modified';
  assert.notEqual(findHelp('government-schemes', ['Financial Aid']).results[0].help.contacts[0].number, 'modified');
});

test('empty selections stay empty while child online safety now has specific information', () => {
  assert.deepEqual(findHelp('child-support', []).results, []);
  const response = findHelp('child-support', ['Online Danger']);
  assert.equal(response.results.length, 1);
  assert.equal(response.results[0].id, 'child-support/child-online-safety-and-grooming');
  assert.deepEqual(response.unmatchedClues, []);
});

test('invalid category and clue inputs are rejected', () => {
  for (const value of [null, 'Abuse', [{}], ['unknown'], ['Workplace'], Array(51).fill('Abuse')]) {
    assert.throws(() => findHelp('child-support', value), { status: 400 });
  }
  assert.throws(() => findHelp('unknown', []), { status: 404 });
  assert.throws(() => findHelp(null, []), { status: 400 });
});

test('all 1,296 clue combinations have sorted scores and complete coverage metadata', () => {
  let count = 0;
  for (const category of categoryCatalog) {
    for (let mask = 0; mask < 2 ** category.clues.length; mask++) {
      const clues = category.clues.filter((_, index) => mask & (1 << index));
      const response = findHelp(category.id, clues);
      for (const clue of clues) {
        assert.equal(response.results.some((issue) => issue.matchedClues.includes(clue)), !response.unmatchedClues.includes(clue));
      }
      response.results.forEach((issue, index) => {
        assert.equal(issue.matchCount, issue.matchedClues.length);
        assert.ok(!index || response.results[index - 1].matchCount >= issue.matchCount);
      });
      assert.equal(new Set(response.results.map((issue) => issue.id)).size, response.results.length);
      count++;
    }
  }
  assert.equal(count, 1296);
});
