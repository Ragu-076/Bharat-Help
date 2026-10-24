import catalog from '../../frontend/src/data/categoryCatalog.js';
import { assistanceRecords } from './recordStore.js';

export const categoryCatalog = catalog.map(({ id, label, icon, description, clues }) => ({
  id, label, icon, description, clues: [...clues],
}));

export class RequestError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function findHelp(categoryId, clues) {
  if (typeof categoryId !== 'string' || !categoryId || !Array.isArray(clues) || clues.length > 50 ||
      clues.some((clue) => typeof clue !== 'string')) {
    throw new RequestError(400, 'Provide a categoryId and an array of valid clues.');
  }
  const category = categoryCatalog.find((item) => item.id === categoryId);
  if (!category) throw new RequestError(404, 'Category not found.');
  if (clues.some((clue) => !category.clues.includes(clue))) {
    throw new RequestError(400, 'One or more clues do not belong to this category.');
  }
  const selectedClues = [...new Set(clues)];
  const results = assistanceRecords.filter((record) => record.categoryId === categoryId).map((record) => {
    const matchedClues = selectedClues.filter((clue) => record.keywords.includes(clue));
    return {
      id: record.id, name: record.name, keywords: [...record.keywords],
      help: structuredClone(record.help), matchedClues, matchCount: matchedClues.length,
      sourceDetails: structuredClone(record.sourceDetails), reviewedOn: record.reviewedOn,
      coverage: record.coverage.en,
    };
  }).filter((record) => record.matchCount > 0).sort((a, b) => b.matchCount - a.matchCount);
  return {
    categoryId, selectedClues, results,
    unmatchedClues: selectedClues.filter((clue) =>
      !results.some((issue) => issue.matchedClues.includes(clue))),
  };
}
