import { useCallback, useEffect, useRef, useState } from 'react';
import { createRecognitionController } from '../utils/recognition.js';

export default function useRecognition(language) {
  const controller = useRef(null);
  const [state, setState] = useState(null);
  useEffect(() => {
    const listener = createRecognitionController({
      Recognition: window.SpeechRecognition || window.webkitSpeechRecognition,
      secureContext: window.isSecureContext,
      onChange: setState,
    });
    controller.current = listener;
    return () => { listener.dispose(); controller.current = null; };
  }, []);
  const start = useCallback(() => controller.current?.start(language), [language]);
  const stop = useCallback(() => controller.current?.stop(), []);
  const cancel = useCallback(() => controller.current?.cancel(), []);
  return {
    status: 'idle', transcript: '', finalTranscript: '', supported: false, error: null,
    ...state, ready: state !== null, start, stop, cancel,
  };
}
