const types = ['hospitals', 'centres', 'schemes'];
function https(value) { try { return typeof value === 'string' && new URL(value).protocol === 'https:'; } catch { return false; } }
export async function getResources(kind, filters = {}, { signal, language = 'en', options = false } = {}) {
  if (!types.includes(kind) || !['en', 'hi', 'ta'].includes(language)) throw new Error('Invalid resource request.');
  const query = new URLSearchParams({ type: kind, language });
  for (const [key, value] of Object.entries(filters)) {
    if (value !== '' && value !== undefined) query.set(key, String(value));
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 15000);
  try {
    const response = await fetch(`/api/resources${options ? '/options' : ''}?${query}`, { signal: controller.signal });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Resources unavailable.');
    const data = await response.json();
    if (controller.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (data.type !== kind || data.language !== language || typeof data.notice !== 'string' || !https(data.sourceUrl)) throw new Error('Invalid resource response.');
    if (options) {
      if (!['states', 'districts', 'topics'].every((key) => Array.isArray(data[key]) && data[key].every((item) => typeof item === 'string'))) throw new Error('Invalid resource options.');
    } else {
      if (!Number.isInteger(data.total) || data.total < 0 || !Number.isInteger(data.page) || data.page < 1 || data.pageSize !== 10 ||
          !Array.isArray(data.records) || data.records.length > data.pageSize || !data.records.every((row) => {
            if (!row || !['id', 'name', 'state', 'verificationStatus'].every((key) => typeof row[key] === 'string')) return false;
            if (row.sourceUrl !== undefined && !https(row.sourceUrl)) return false;
            if (row.reviewNotice !== undefined && (typeof row.reviewNotice !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(row.sourceCheckedOn))) return false;
            if (kind === 'schemes') return https(row.officialUrl) && row.originalLanguage === 'en' &&
              ['description', 'benefits', 'eligibility', 'application', 'documents', 'category'].every((key) => typeof row[key] === 'string');
            return typeof row.district === 'string' && typeof row.address === 'string' && Array.isArray(row.phones) &&
              row.phones.every((phone) => typeof phone === 'string' && /^\+?\d{7,13}$/u.test(phone));
          })) throw new Error('Invalid resource records.');
    }
    return data;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
