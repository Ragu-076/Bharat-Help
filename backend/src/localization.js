// Canonical clues stay stable; curated records carry their own display translations.
import { languages, translate } from '../../frontend/src/translations/translations.js';
import { RequestError } from './helpRepository.js';
import { recordText, recordCoverage } from './recordStore.js';

export const supportedLanguages = Object.freeze(languages.map(({ code }) => code));

export function validateLanguage(language = 'en') {
  if (!supportedLanguages.includes(language)) {
    throw new RequestError(400, 'Unsupported language. Use en, hi or ta.');
  }
  return language;
}

const errorTranslations = {
  hi: {
    'Provide a categoryId and an array of valid clues.': 'categoryId और मान्य संकेतों की सूची दें।',
    'Category not found.': 'श्रेणी नहीं मिली।',
    'One or more clues do not belong to this category.': 'एक या अधिक संकेत इस श्रेणी से संबंधित नहीं हैं।',
    'Unable to retrieve help. Please try again.': 'मदद की जानकारी प्राप्त नहीं हो सकी। कृपया फिर से कोशिश करें।',
  },
  ta: {
    'Provide a categoryId and an array of valid clues.': 'categoryId மற்றும் செல்லுபடியாகும் குறிப்புகளின் பட்டியலை வழங்குங்கள்.',
    'Category not found.': 'பிரிவு கிடைக்கவில்லை.',
    'One or more clues do not belong to this category.': 'ஒன்று அல்லது அதற்கு மேற்பட்ட குறிப்புகள் இந்தப் பிரிவைச் சேர்ந்தவை அல்ல.',
    'Unable to retrieve help. Please try again.': 'உதவித் தகவலைப் பெற முடியவில்லை. மீண்டும் முயலுங்கள்.',
  },
};

export function localizeErrorMessage(message, language = 'en') {
  return errorTranslations[language]?.[message] || message;
}

export function localizeHelpResponse(response, language = 'en') {
  validateLanguage(language);
  const localized = structuredClone(response);
  const t = (text) => translate(text, language);
  localized.language = language;
  // Keep stable keys for later requests; labels are display-only translations.
  localized.selectedClueLabels = localized.selectedClues.map(t);
  localized.unmatchedClueLabels = localized.unmatchedClues.map(t);

  for (const issue of localized.results) {
    const rt = (text) => recordText(issue.id, text, language) ?? t(text);
    issue.name = rt(issue.name);
    if (issue.coverage) issue.coverage = recordCoverage(issue.id, language) ?? issue.coverage;
    issue.matchedClueLabels = issue.matchedClues.map(t);
    const help = issue.help;
    help.immediateHelp = help.immediateHelp.map(rt);
    if (help.awareness) help.awareness = help.awareness.map(rt);
    help.rights = help.rights.map(rt);
    help.contacts = help.contacts.map((contact) => ({
      ...contact, name: rt(contact.name), available: rt(contact.available),
    }));
    help.schemes = help.schemes.map((scheme) => ({
      ...scheme, name: rt(scheme.name), description: rt(scheme.description),
    }));
    help.sources = help.sources.map(rt);
    if (help.seekHelp) help.seekHelp = help.seekHelp.map(rt);
    if (help.medicines) {
      help.medicines = help.medicines.map((medicine) => ({
        ...medicine,
        name: rt(medicine.name),
        purpose: rt(medicine.purpose),
        precautions: medicine.precautions.map(rt),
      }));
    }
  }
  return localized;
}
