import test from 'node:test';
import assert from 'node:assert/strict';
import { categories } from '../src/services/helpService.js';
import { readRoute, routeHash } from '../src/utils/navigation.js';
import { contactLinks, websiteUrl } from '../src/utils/resourceLinks.js';

test('routes preserve category, screen, and special characters across refresh', () => {
  const route = { screen: 'results', categoryId: 'cyber-crime', clues: ['UPI / Banking Fraud', 'Phishing'] };
  assert.deepEqual(readRoute(routeHash(route), categories), route);
  assert.equal(readRoute('#/category/unknown/results', categories).screen, 'home');
  assert.equal(readRoute('#/category/child-support/results', categories).screen, 'clues');
  assert.deepEqual(readRoute('#/category/child-support?clue=Abuse&clue=Abuse&clue=unknown', categories).clues, ['Abuse']);
  assert.equal(readRoute('#/category/child-support/unexpected', categories).screen, 'home');
  assert.equal(readRoute('#/category/child-support/results/extra', categories).screen, 'home');
});

test('phone alternatives produce separate dial links and website sources use HTTPS', () => {
  assert.deepEqual(contactLinks('108 / 102').map((link) => link.href), ['tel:108', 'tel:102']);
  assert.equal(contactLinks('1800-11-6163')[0].href, 'tel:1800116163');
  assert.equal(contactLinks('pmjay.gov.in')[0].href, 'https://pmjay.gov.in/');
  assert.equal(websiteUrl('Ministry — wcd.nic.in'), 'https://wcd.nic.in/');
  assert.equal(websiteUrl('Information Technology Act, 2000'), null);
  assert.equal(contactLinks('Not available')[0].href, null);
});
