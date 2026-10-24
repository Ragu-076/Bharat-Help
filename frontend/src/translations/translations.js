import { rows } from './messages.js';
import { legacyTextRows } from './legacyTextRows.js';
import { resourceRows } from './resourceTranslations.js';
import { hindiMessageRows } from './hindiMessages.js';
import { hindiResultRows } from './hindiResults.js';
import { hindiResourceRows } from './hindiResources.js';
import { hindiHealthRows } from './hindiHealth.js';
import { speechRows } from './speechMessages.js';
import { voiceSearchRows } from './voiceSearchMessages.js';
import { sourceRows } from './sourceMessages.js';

export const languages = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'hi', label: 'हिन्दी' },
];
export const dictionaries = {
  ta: {},
  hi: Object.fromEntries([...hindiMessageRows, ...hindiResultRows, ...hindiResourceRows, ...hindiHealthRows,
    ...speechRows.map(([english, , hindi]) => [english, hindi]),
    ...voiceSearchRows.map(([english, , hindi]) => [english, hindi]),
    ...sourceRows.map(([english, , hindi]) => [english, hindi])]),
};
const add = ([english, ta]) => {
  dictionaries.ta[english] = ta;
};
[...rows, ...resourceRows, ...legacyTextRows, ...speechRows, ...voiceSearchRows, ...sourceRows].forEach(add);

export function normalizeLanguage(code) {
  return languages.some((language) => language.code === code) ? code : 'en';
}

export function translate(text, language = 'en') {
  if (language === 'en') return text;
  const dictionary = dictionaries[normalizeLanguage(language)];
  if (!dictionary) return text;
  if (dictionary[text]) return dictionary[text];
  // Keep the domain unchanged while translating a source's organisation label.
  const separator = text.lastIndexOf(' — ');
  if (separator > 0) {
    const label = text.slice(0, separator);
    if (dictionary[label]) return `${dictionary[label]} — ${text.slice(separator + 3)}`;
  }
  return text;
}
