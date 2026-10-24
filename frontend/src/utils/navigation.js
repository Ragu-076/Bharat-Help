export function readRoute(hash, categories) {
  const [path, query = ''] = hash.replace(/^#/, '').split('?');
  const parts = path.split('/').filter(Boolean);
  const category = categories.find((item) => item.id === parts[1]);
  if (parts[0] !== 'category' || !category || parts.length > 3 ||
      (parts[2] && parts[2] !== 'results')) {
    return { screen: 'home', categoryId: null, clues: [] };
  }
  const clues = [...new Set(new URLSearchParams(query).getAll('clue'))]
    .filter((clue) => category.clues.includes(clue));
  return {
    screen: parts[2] === 'results' && clues.length ? 'results' : 'clues',
    categoryId: category.id,
    clues,
  };
}

export function routeHash({ screen, categoryId, clues = [] }) {
  if (screen === 'home') return '#/';
  const params = new URLSearchParams();
  clues.forEach((clue) => params.append('clue', clue));
  const query = params.toString();
  return `#/category/${categoryId}${screen === 'results' ? '/results' : ''}${query ? `?${query}` : ''}`;
}
