import { useEffect, useState } from 'react';
import { categories } from '../services/helpService.js';
import { readRoute, routeHash } from '../utils/navigation.js';

export default function useNavigation() {
  const [route, setRoute] = useState(() => readRoute(window.location.hash, categories));
  useEffect(() => {
    const sync = () => setRoute(readRoute(window.location.hash, categories));
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  function navigate(next, { replace = false } = {}) {
    const hash = routeHash(next);
    if (hash !== window.location.hash) {
      const state = replace ? window.history.state : { bharatHelpParent: window.location.hash };
      window.history[replace ? 'replaceState' : 'pushState'](state, '', hash);
    }
    setRoute(readRoute(hash, categories));
  }
  function back(fallback) {
    const parent = window.history.state?.bharatHelpParent;
    if (typeof parent === 'string' &&
        routeHash(readRoute(parent, categories)) === routeHash(fallback)) {
      window.history.back();
    } else {
      navigate(fallback, { replace: true });
    }
  }
  return [route, navigate, back];
}
