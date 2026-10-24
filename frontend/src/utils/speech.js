export const speechLocales = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
};

const normaliseLocale = (locale) =>
  String(locale ?? '').trim().replaceAll('_', '-').toLowerCase();

export function selectVoice(voices, language) {
  const locale = normaliseLocale(speechLocales[language] ?? language);
  const baseLanguage = locale.split('-')[0];
  if (!baseLanguage || !Array.isArray(voices)) return null;

  return (
    voices.find((voice) => normaliseLocale(voice?.lang) === locale) ??
    voices.find(
      (voice) => normaliseLocale(voice?.lang).split('-')[0] === baseLanguage,
    ) ??
    null
  );
}

export function splitSpeechText(text) {
  const paragraphs = String(text ?? '').trim().split(/\r?\n+/u);
  const chunks = [];
  const maxLength = 220;

  for (const paragraph of paragraphs) {
    const cleanParagraph = paragraph.replace(/\s+/gu, ' ').trim();
    if (!cleanParagraph) continue;

    const sentences = cleanParagraph.match(/.+?(?:[.!?।…]+(?=\s|$)|$)/gu) ?? [];
    let chunk = '';
    const flush = () => {
      if (chunk) chunks.push(chunk);
      chunk = '';
    };

    for (const sentence of sentences) {
      const cleanSentence = sentence.trim();
      const pieces =
        cleanSentence.length > maxLength ? cleanSentence.split(' ') : [cleanSentence];

      for (const piece of pieces) {
        if (chunk && chunk.length + piece.length + 1 > maxLength) flush();
        chunk = chunk ? `${chunk} ${piece}` : piece;
      }
    }
    flush();
  }

  return chunks;
}

export function createSpeechController({ synthesis, Utterance, onChange = () => {} } = {}) {
  const supported = Boolean(
    synthesis &&
      typeof synthesis.getVoices === 'function' &&
      typeof synthesis.speak === 'function' &&
      typeof synthesis.cancel === 'function' &&
      typeof Utterance === 'function',
  );
  let voices = [];
  let disposed = false;
  let generation = 0;
  let activeUtterance = null;
  let requestedLanguage = null;
  let needsCancel = false;
  let removeVoiceListener = () => {};
  let state = {
    supported,
    availableLanguages: [],
    activeId: null,
    status: 'idle',
    error: null,
  };

  const getState = () => ({
    ...state,
    availableLanguages: [...state.availableLanguages],
  });

  const update = (changes) => {
    if (disposed) return;
    state = { ...state, ...changes };
    onChange(getState());
  };

  const readVoices = () => {
    try {
      voices = Array.from(synthesis.getVoices() ?? []);
      return Object.keys(speechLocales).filter((language) => selectVoice(voices, language));
    } catch {
      voices = [];
      return null;
    }
  };

  const releaseUtterance = () => {
    generation += 1;
    const ownedPlayback = Boolean(activeUtterance);
    if (activeUtterance) {
      activeUtterance.onstart = null;
      activeUtterance.onend = null;
      activeUtterance.onerror = null;
      activeUtterance = null;
    }
    return ownedPlayback;
  };

  const cancelOwnedPlayback = () => {
    const ownedPlayback = releaseUtterance();
    needsCancel = ownedPlayback || needsCancel;
    if (!needsCancel) return true;
    try {
      synthesis.cancel();
      needsCancel = false;
      return true;
    } catch {
      return false;
    }
  };

  const fail = (error) => {
    releaseUtterance();
    update({ activeId: null, status: 'error', error });
    return false;
  };

  const refreshVoices = () => {
    if (disposed || !supported) return false;
    const languages = readVoices();
    if (languages === null) {
      cancelOwnedPlayback();
      update({ availableLanguages: [], activeId: null, status: 'error', error: 'speech-unavailable' });
      return false;
    }
    const recovered = (state.error === 'speech-unavailable' && !needsCancel) ||
      (state.error === 'voice-unavailable' && languages.includes(requestedLanguage));
    update({ availableLanguages: languages, ...(recovered ? { status: 'idle', error: null } : {}) });
    return true;
  };

  if (supported) {
    const availableLanguages = readVoices();
    state = availableLanguages
      ? { ...state, availableLanguages }
      : { ...state, status: 'error', error: 'speech-unavailable' };

    const voicesChanged = () => {
      if (disposed) return;
      refreshVoices();
    };

    if (
      typeof synthesis.addEventListener === 'function' &&
      typeof synthesis.removeEventListener === 'function'
    ) {
      try {
        synthesis.addEventListener('voiceschanged', voicesChanged);
        removeVoiceListener = () => synthesis.removeEventListener('voiceschanged', voicesChanged);
      } catch {
        // Voice selection is refreshed again whenever playback is requested.
      }
    } else {
      const previousListener = synthesis.onvoiceschanged;
      const listener = (event) => {
        voicesChanged();
        if (typeof previousListener === 'function') previousListener.call(synthesis, event);
      };
      try {
        synthesis.onvoiceschanged = listener;
        removeVoiceListener = () => {
          if (synthesis.onvoiceschanged === listener) synthesis.onvoiceschanged = previousListener;
        };
      } catch {
        // Browsers with a read-only event property can still refresh on Listen.
      }
    }
  } else {
    state = { ...state, status: 'error', error: 'speech-unavailable' };
  }
  onChange(getState());

  const start = ({ id, text, language } = {}) => {
    if (disposed) return false;
    if (!cancelOwnedPlayback()) return fail('speech-unavailable');
    if (!supported) return fail('speech-unavailable');
    requestedLanguage = language;

    const chunks = splitSpeechText(text);
    if (!chunks.length) return fail('empty-text');

    const availableLanguages = readVoices();
    if (availableLanguages === null) {
      update({ availableLanguages: [] });
      return fail('speech-unavailable');
    }
    const voice = selectVoice(voices, language);
    update({ availableLanguages });
    if (!voice) return fail('voice-unavailable');

    const run = generation;
    const locale = speechLocales[language] ?? language;
    update({ activeId: String(id ?? ''), status: 'speaking', error: null });

    const speakChunk = (index) => {
      if (disposed || run !== generation) return false;
      let utterance;
      try {
        utterance = new Utterance(chunks[index]);
        utterance.lang = locale;
        utterance.voice = voice;
      } catch {
        return fail('speech-failed');
      }
      activeUtterance = utterance;

      const isCurrent = () => !disposed && run === generation && activeUtterance === utterance;
      utterance.onend = () => {
        if (!isCurrent()) return;
        utterance.onend = null;
        utterance.onerror = null;
        activeUtterance = null;
        if (index + 1 < chunks.length) {
          speakChunk(index + 1);
        } else {
          update({ activeId: null, status: 'idle', error: null });
        }
      };
      utterance.onerror = (event) => {
        if (!isCurrent()) return;
        if (event?.error === 'canceled' || event?.error === 'interrupted') {
          releaseUtterance();
          update({ activeId: null, status: 'idle', error: null });
        } else {
          fail('speech-failed');
        }
      };

      try {
        synthesis.speak(utterance);
        return true;
      } catch {
        cancelOwnedPlayback();
        return fail('speech-failed');
      }
    };

    return speakChunk(0);
  };

  const stop = () => {
    if (disposed) return false;
    if (!cancelOwnedPlayback()) return fail('speech-unavailable');
    update({ activeId: null, status: 'idle', error: null });
    return true;
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelOwnedPlayback();
    try {
      removeVoiceListener();
    } catch {
      // Disposal must still finish if a browser engine rejects listener removal.
    }
    state = { ...state, activeId: null, status: 'idle', error: null };
  };

  return { start, stop, refreshVoices, dispose, getState };
}
