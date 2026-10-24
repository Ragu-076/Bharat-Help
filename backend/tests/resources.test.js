import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { resourceOptions, searchResources, resourceCounts } from '../src/resourceRepository.js';
import { createApp } from '../src/app.js';

let server, base;
before(async () => { server = createApp().listen(0, '127.0.0.1'); await once(server, 'listening'); base = `http://127.0.0.1:${server.address().port}`; });
after(async () => { await new Promise((resolve) => server.close(resolve)); });

test('the complete source tables reconcile to normalized, duplicate and rejected rows', () => {
  const report = JSON.parse(readFileSync(new URL('../../datasets/real-data/processed/processing-report.json', import.meta.url), 'utf8'));
  assert.equal(report.tables.hospitals.sourceRows, 30273);
  assert.equal(report.tables.centres.sourceRows, 770);
  assert.equal(report.tables.schemes.sourceRows, 4693);
  for (const table of Object.values(report.tables)) {
    assert.equal(table.sourceRows, table.accepted + table.duplicateRows.length + table.rejectedRows.length);
  }
  assert.equal(resourceCounts.hospitals, report.tables.hospitals.accepted);
  assert.equal(resourceCounts.centres, report.tables.centres.accepted);
  assert.equal(resourceCounts.schemes, report.tables.schemes.publicDiscoveryLinks);
});

test('district searches stay within the selected state and preserve source-listing status', () => {
  const options = resourceOptions({ type: 'hospitals', state: 'Tamil Nadu' });
  assert.ok(options.districts.includes('Chennai'));
  const result = searchResources({ type: 'hospitals', state: 'Tamil Nadu', district: 'Chennai' });
  assert.ok(result.total > 10);
  assert.equal(result.records.length, 10);
  for (const row of result.records) {
    assert.equal(row.state, 'Tamil Nadu'); assert.equal(row.district, 'Chennai');
    assert.equal(row.verificationStatus, 'source-listing-unconfirmed');
    assert.ok(!('Nodal_Person_Info' in row));
    row.phones.forEach((number) => assert.match(number, /^\+?\d{7,13}$/u));
  }
  const second = searchResources({ type: 'hospitals', state: 'Tamil Nadu', district: 'Chennai', page: 2 });
  assert.ok(!second.records.some((row) => result.records.some((first) => first.id === row.id)));
  const centre = searchResources({ type: 'centres', state: 'Tamil Nadu', district: 'Chennai' });
  assert.ok(centre.records.length > 0);
  assert.equal(centre.total, 3, 'Chennai, Chennai-A and Chennai-B belong to the same district filter');
  assert.ok(centre.records.every((row) => row.address && row.state === 'Tamil Nadu'));
});

test('pilot corrections preserve raw imports and distinguish webpage checks from availability', () => {
  const imported = JSON.parse(readFileSync(new URL('../../datasets/real-data/processed/hospitals.json', import.meta.url), 'utf8'));
  assert.deepEqual(imported.records.find(r => r.id === 'hospital-8302c76ab27bd658').phones, []);
  const result = searchResources({type:'hospitals', state:'Tamil Nadu', district:'Chennai', q:'Government General'});
  const hospital = result.records.find(r => r.id === 'hospital-8302c76ab27bd658');
  assert.deepEqual(hospital.phones, ['04425305000']);
  assert.equal(hospital.verificationStatus, 'source-listing-unconfirmed');
  assert.match(hospital.reviewNotice, /have not been confirmed/);
  assert.match(hospital.sourceUrl, /^https:\/\/chennai.nic.in\//);
  for (const language of ['en','ta','hi']) {
    const centres = searchResources({type:'centres', state:'Tamil Nadu', district:'Chennai', language});
    assert.ok(centres.records.every(r => typeof r.reviewNotice === 'string' && r.reviewNotice.includes('181')));
    assert.ok(centres.records.every(r => r.contactReview === 'conflicting-official-lists'));
  }
});

test('all scheme rows retain narrative eligibility while parsed eligibility does not drive public results', () => {
  const source = JSON.parse(readFileSync(new URL('../../datasets/real-data/processed/schemes-normalized.json', import.meta.url), 'utf8'));
  assert.equal(source.records.length, 4693);
  for (const row of source.records) {
    assert.equal(row.verificationStatus, 'third-party-snapshot-unconfirmed');
    assert.ok(!Object.keys(row).some((key) => key.startsWith('eligibility_')));
  }
  const result = searchResources({ type: 'schemes', state: 'Tamil Nadu', topic: 'Education' });
  assert.ok(result.total > 0);
  assert.ok(result.records.every((row) => ['Central', 'Tamil Nadu'].includes(row.state)));
  assert.ok(result.records.every((row) => row.topics.includes('Education') && row.originalLanguage === 'en'));
  assert.ok(result.records.every((row) => /^https:\/\/www\.myscheme\.gov\.in\/schemes\//u.test(row.officialUrl)));
  assert.ok(!result.records.some((row) => row.reviewReasons?.includes('potentially-outdated')));
});

test('bad type, state, district, page and filter structures are rejected', () => {
  for (const query of [
    { type: '__proto__' }, { type: ['schemes'] }, { type: 'hospitals' },
    { type: 'hospitals', state: 'Tamil Nadu', district: 'Mumbai' },
    { type: 'schemes', state: 'not-a-state' }, { type: 'schemes', q: [] },
    { type: 'schemes', page: -1 }, { type: 'schemes', page: ['1'] }, { type: 'schemes', topic: 'invented' },
  ]) assert.throws(() => searchResources(query), { status: 400 });
});

test('resource routes return localized notices and source rows through the real frontend service', async (context) => {
  const realFetch = globalThis.fetch;
  context.mock.method(globalThis, 'fetch', (url, options) => realFetch(`${base}${url}`, options));
  const { getResources } = await import('../../frontend/src/services/resourceService.js');
  for (const language of ['en', 'hi', 'ta']) {
    const options = await getResources('centres', { state: 'Tamil Nadu' }, { options: true, language });
    assert.ok(options.districts.includes('Chennai'));
    const rows = await getResources('centres', { state: 'Tamil Nadu', district: 'Chennai' }, { language });
    assert.ok(rows.records.length > 0);
    assert.equal(rows.language, language);
    if (language === 'hi') assert.match(rows.notice, /[\u0900-\u097f]/u);
    if (language === 'ta') assert.match(rows.notice, /[\u0b80-\u0bff]/u);
    const schemes = await getResources('schemes', { state: 'Tamil Nadu', topic: 'Education' }, { language });
    assert.ok(schemes.records.length > 0);
  }
});
