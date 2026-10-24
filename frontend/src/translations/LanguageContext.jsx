import { useEffect, useState } from 'react';
import { normalizeLanguage, translate } from './translations.js';
import LanguageContext from './languageContext.js';

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try { return normalizeLanguage(localStorage.getItem('bharat-help-language')); }
    catch { return 'en'; }
  });
  useEffect(() => {
    document.documentElement.lang = language;
    try { localStorage.setItem('bharat-help-language', language); }
    catch { /* Language selection still works when browser storage is disabled. */ }
  }, [language]);
  const value = { language, setLanguage: (code) => setLanguage(normalizeLanguage(code)), t: (text) => translate(text, language) };
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

