import { readFileSync } from 'node:fs';
import catalog from '../../frontend/src/data/categoryCatalog.js';

const files = ['emergency-cyber.json', 'women-child.json', 'government-schemes.json', 'medical-common.json', 'expanded-guidance.json'];
const records = files.flatMap((file) => JSON.parse(readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8')));
const categories = new Map(catalog.map((category) => [category.id, category]));
const ids = new Set();
const textMaps = new Map();

function validSource(source) {
  if (!source || typeof source.title !== 'string' || !source.title.trim()) return false;
  try { return new URL(source.url).protocol === 'https:'; } catch { return false; }
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

function pairTexts(original, localized, map, context) {
  if (typeof original === 'string') {
    if (typeof localized !== 'string' || !localized.trim()) throw new Error(`Missing translation: ${context}`);
    if (/^https?:\/\//u.test(original) || /^[+\d\s()/.-]+$/u.test(original)) {
      if (localized !== original) throw new Error(`Changed address or number: ${context}`);
    } else {
      map.set(original, localized);
    }
  } else if (Array.isArray(original)) {
    if (!Array.isArray(localized) || original.length !== localized.length) throw new Error(`Translation length differs: ${context}`);
    original.forEach((value, index) => pairTexts(value, localized[index], map, `${context}/${index}`));
  } else if (original && typeof original === 'object') {
    if (!localized || typeof localized !== 'object') throw new Error(`Missing translated object: ${context}`);
    Object.entries(original).forEach(([key, value]) => pairTexts(value, localized[key], map, `${context}/${key}`));
  }
}

for (const record of records) {
  const category = categories.get(record.categoryId);
  if (!category || typeof record.id !== 'string' || !record.id.startsWith(`${record.categoryId}/`) || ids.has(record.id)) {
    throw new Error(`Invalid or duplicate assistance record: ${record.id}`);
  }
  ids.add(record.id);
  if (!record.keywords?.length || new Set(record.keywords).size !== record.keywords.length ||
      record.keywords.some((key) => !category.clues.includes(key))) throw new Error(`Invalid clues: ${record.id}`);
  const help = record.help;
  if (!record.name?.trim() || !help?.immediateHelp?.length ||
      !['contacts', 'rights', 'schemes', 'sources'].every((key) => Array.isArray(help[key])) || !help.sources.length) {
    throw new Error(`Incomplete assistance record: ${record.id}`);
  }
  if (!record.sourceDetails?.length || !validDate(record.reviewedOn) ||
      record.sourceDetails.some((source) => !validSource(source)) ||
      help.sources.some((url) => !record.sourceDetails.some((source) => source.url === url))) {
    throw new Error(`Missing source provenance: ${record.id}`);
  }
  if (record.categoryId === 'common-health' && (!help.seekHelp?.length || !help.medicines?.length)) {
    throw new Error(`Incomplete health information: ${record.id}`);
  }
  for (const language of ['hi', 'ta']) {
    const map = new Map();
    pairTexts({ name: record.name, help }, record.translations?.[language], map, `${record.id}/${language}`);
    if (!record.coverage?.[language]?.trim() || !record.coverage.en?.trim()) throw new Error(`Missing coverage: ${record.id}`);
    textMaps.set(`${record.id}/${language}`, map);
  }
}

export const assistanceRecords = deepFreeze(records);
export const dataSource = 'curated-source-records';
export const catalogVersion = '2026-10-24';
export const recordCount = records.length;
export const recordText = (id, text, language) => textMaps.get(`${id}/${language}`)?.get(text);
export const recordCoverage = (id, language) => records.find((record) => record.id === id)?.coverage[language];
