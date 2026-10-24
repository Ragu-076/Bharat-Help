import { useEffect, useState } from 'react';
import { getHelp } from '../services/helpService.js';

export default function useHelp(categoryId, clues, enabled, language = 'en') {
  const [attempt, setAttempt] = useState(0);
  const [request, setRequest] = useState({ key: null, status: 'idle' });
  const cluesKey = JSON.stringify(clues);
  const key = JSON.stringify([categoryId, cluesKey, language, attempt]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setRequest({ key, status: 'loading' });
    getHelp(categoryId, JSON.parse(cluesKey), { signal: controller.signal, language })
      .then((data) => {
        if (!controller.signal.aborted) setRequest({ key, status: 'success', data });
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== 'AbortError') {
          setRequest({ key, status: 'error' });
        }
      });
    return () => controller.abort();
  }, [categoryId, cluesKey, enabled, key, language]);

  return {
    ...(enabled && request.key === key ? request : { status: enabled ? 'loading' : 'idle' }),
    retry: () => setAttempt((value) => value + 1),
  };
}
