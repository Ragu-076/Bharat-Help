import helpData, { matchIssues } from './helpData.js';
import { commonHealthCategory } from './commonHealthData.js';

// Content/narration unit tests use seed fixtures; HTTP transport has separate tests.
export function getHelpFixture(categoryId, clues) {
  const category = [...helpData, commonHealthCategory].find((item) => item.id === categoryId);
  const selectedClues = [...new Set(clues)];
  const results = matchIssues(category, selectedClues).map((issue) => ({
    ...structuredClone(issue),
    matchedClues: selectedClues.filter((clue) =>
      issue.keywords.some((keyword) => keyword.toLowerCase() === clue.toLowerCase())),
  }));
  return {
    results,
    unmatchedClues: selectedClues.filter((clue) =>
      !results.some((issue) => issue.matchedClues.includes(clue))),
  };
}
