import { useCallback, useEffect, useRef, useState } from 'react';
import { createSpeechController } from '../utils/speech.js';

export default function useSpeech(language, results) {
  const controller = useRef(null);
  const [state, setState] = useState(null);
  useEffect(() => {
    const player = createSpeechController({
      synthesis: window.speechSynthesis,
      Utterance: window.SpeechSynthesisUtterance,
      onChange: setState,
    });
    controller.current = player;
    const refresh = () => player.refreshVoices();
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      player.dispose();
      controller.current = null;
    };
  }, []);
  useEffect(() => { controller.current?.refreshVoices(); }, [language]);
  // Also covers route changes that reuse the mounted results screen.
  useEffect(() => () => controller.current?.stop(), [language, results]);

  const start = useCallback((id, text, spokenLanguage = language) => controller.current?.start({ id, text, language: spokenLanguage }), [language]);
  const stop = useCallback(() => controller.current?.stop(), []);
  const refreshVoices = useCallback(() => controller.current?.refreshVoices(), []);
  return {
    ...state,
    ready: state !== null,
    canSpeak: !!state?.supported && state.availableLanguages.includes(language),
    start,
    stop,
    refreshVoices,
  };
}
