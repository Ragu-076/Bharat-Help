import categoryCatalog from '../data/categoryCatalog.js';

// Only the selection catalogue lives here; result matching is handled by the API.
export const categories = categoryCatalog;

const strings = (value) => Array.isArray(value) && value.every((item) => typeof item === 'string');
const sameValues = (actual, expected) => strings(actual) && JSON.stringify(actual) === JSON.stringify(expected);
const labelsFor = (labels, keys) => strings(labels) && labels.length === keys.length;
const httpsUrl = (value) => {
  if (typeof value !== 'string') return false;
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
};

function validProvenance(issue) {
  const date = typeof issue.reviewedOn === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(issue.reviewedOn)
    ? new Date(`${issue.reviewedOn}T00:00:00.000Z`) : null;
  return Array.isArray(issue.sourceDetails) && issue.sourceDetails.length > 0 &&
    issue.sourceDetails.every((source) => source && typeof source.title === 'string' && source.title.trim() && httpsUrl(source.url)) &&
    date && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === issue.reviewedOn &&
    typeof issue.coverage === 'string' && issue.coverage.trim().length > 0 &&
    strings(issue.help?.sources) && issue.help.sources.length > 0 &&
    issue.help.sources.every((url) => issue.sourceDetails.some((source) => source.url === url));
}

function validResult(issue, selectedClues, commonHealth) {
  if (!issue || typeof issue.id !== 'string' || typeof issue.name !== 'string' ||
      !strings(issue.matchedClues) || !labelsFor(issue.matchedClueLabels, issue.matchedClues) ||
      !Number.isInteger(issue.matchCount) || issue.matchCount < 1 ||
      issue.matchCount !== issue.matchedClues.length ||
      new Set(issue.matchedClues).size !== issue.matchedClues.length ||
      issue.matchedClues.some((clue) => !selectedClues.includes(clue)) || !validProvenance(issue)) return false;
  const help = issue.help;
  if (help?.awareness !== undefined && !strings(help.awareness)) return false;
  if (!help || !strings(help.immediateHelp) || !strings(help.rights) || !strings(help.sources) ||
      !Array.isArray(help.contacts) || !help.contacts.every((contact) =>
        contact && ['name', 'number', 'available'].every((key) => typeof contact[key] === 'string')) ||
      !Array.isArray(help.schemes) || !help.schemes.every((scheme) =>
        scheme && typeof scheme.name === 'string' && typeof scheme.description === 'string')) return false;
  if (commonHealth && (!strings(help.seekHelp) || help.seekHelp.length === 0 ||
      !Array.isArray(help.medicines) || help.medicines.length === 0 ||
      !help.medicines.every((medicine) => medicine && typeof medicine.name === 'string' &&
        typeof medicine.purpose === 'string' && strings(medicine.precautions) && medicine.precautions.length > 0))) return false;
  return true;
}

function validateResponse(data, categoryId, selectedClues, language) {
  if (!data || data.categoryId !== categoryId || data.language !== language ||
      !sameValues(data.selectedClues, selectedClues) ||
      !labelsFor(data.selectedClueLabels, selectedClues) || !strings(data.unmatchedClues) ||
      !labelsFor(data.unmatchedClueLabels, data.unmatchedClues) ||
      !Array.isArray(data.results) || !data.results.every((issue) =>
        validResult(issue, selectedClues, categoryId === 'common-health')) ||
      new Set(data.results.map((issue) => issue.id)).size !== data.results.length ||
      !sameValues(data.unmatchedClues, selectedClues.filter((clue) =>
        !data.results.some((issue) => issue.matchedClues.includes(clue))))) {
    throw new Error('The help API returned an invalid response.');
  }
  return data;
}

export async function getHelp(categoryId, clues, {
  signal, language = 'en', timeoutMs = 15000,
} = {}) {
  const category = categories.find((item) => item.id === categoryId);
  if (!category || !strings(clues) || clues.length > 50 ||
      clues.some((clue) => !category.clues.includes(clue))) {
    throw new Error('Choose a valid category and clues.');
  }
  if (!['en', 'hi', 'ta'].includes(language)) throw new Error('Choose a supported language.');
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('Choose a positive request timeout.');
  signal?.throwIfAborted();
  const selectedClues = [...new Set(clues)];
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  signal?.addEventListener('abort', abort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const response = await fetch('/api/help', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ categoryId, clues: selectedClues, language }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`The help API request failed (${response.status}).`);
    if (!/^application\/(?:[\w.-]+\+)?json(?:\s*;|$)/i.test(response.headers.get('Content-Type') || '')) {
      throw new Error('The help API did not return JSON.');
    }
    const data = await response.json();
    controller.signal.throwIfAborted();
    return validateResponse(data, categoryId, selectedClues, language);
  } catch (error) {
    if (timedOut) throw new Error('Help request timed out.');
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
