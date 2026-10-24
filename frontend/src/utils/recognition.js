export const recognitionLocales = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
};

const normaliseText = (text) => String(text ?? '').replace(/\s+/gu, ' ').trim();

function recognitionError(error) {
  const code = error?.error ?? error?.name ?? error;
  switch (code) {
    case 'not-allowed':
    case 'NotAllowedError':
    case 'SecurityError':
      return 'microphone-denied';
    case 'service-not-allowed':
      return 'speech-unavailable';
    case 'audio-capture':
    case 'NotFoundError':
    case 'NotReadableError':
      return 'no-microphone';
    case 'network':
    case 'NetworkError':
      return 'network';
    case 'language-not-supported':
    case 'NotSupportedError':
      return 'language-unavailable';
    case 'no-speech':
      return 'no-speech';
    default:
      return 'recognition-failed';
  }
}

/** A single user-initiated speech recognition session, with no browser globals. */
export function createRecognitionController({
  Recognition,
  secureContext = true,
  onChange = () => {},
} = {}) {
  const supported = secureContext && typeof Recognition === 'function';
  let disposed = false;
  let session = null;
  let pendingAbort = null;
  let state = {
    supported: Boolean(supported),
    status: supported ? 'idle' : 'error',
    transcript: '',
    finalTranscript: '',
    error: supported ? null : 'speech-unavailable',
  };

  const getState = () => ({ ...state });
  const update = (changes) => {
    if (disposed) return;
    state = { ...state, ...changes };
    onChange(getState());
  };

  const detach = (recognition) => {
    recognition.onstart = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onnomatch = null;
    recognition.onend = null;
  };

  // Invalidating the session before abort prevents synchronous/late browser
  // callbacks from publishing text into a different language or page.
  const release = (run, abort = false) => {
    if (session === run) session = null;
    detach(run.recognition);
    if (!abort) return true;
    try {
      run.recognition.abort();
      return true;
    } catch {
      pendingAbort = run.recognition;
      run.recognition.onend = () => {
        if (pendingAbort === run.recognition) pendingAbort = null;
        run.recognition.onend = null;
      };
      return false;
    }
  };

  const finishError = (run, error) => {
    if (session !== run || disposed) return;
    release(run, true);
    // Keep words already received so the user can review/edit them after a
    // service failure. A browser error must not erase the editable transcript.
    update({ status: 'error', error });
  };

  const clearPendingAbort = () => {
    if (!pendingAbort) return true;
    const recognition = pendingAbort;
    try {
      recognition.abort();
      recognition.onend = null;
      if (pendingAbort === recognition) pendingAbort = null;
      return true;
    } catch {
      return false;
    }
  };

  const start = (language) => {
    if (disposed || session) return false;
    if (!supported) {
      update({ status: 'error', error: 'speech-unavailable' });
      return false;
    }
    const locale = recognitionLocales[language] ??
      Object.values(recognitionLocales).find(
        (candidate) => candidate.toLowerCase() === String(language).toLowerCase(),
      );
    if (!locale) {
      update({ status: 'error', error: 'language-unavailable' });
      return false;
    }
    if (!clearPendingAbort()) {
      update({ status: 'error', error: 'speech-unavailable' });
      return false;
    }

    let recognition;
    try {
      recognition = new Recognition();
      recognition.lang = locale;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
    } catch (error) {
      update({ status: 'error', error: recognitionError(error) });
      return false;
    }
    const run = { recognition, stopping: false };
    session = run;
    const isCurrent = () => !disposed && session === run;

    recognition.onstart = () => {
      if (!isCurrent()) return;
      update({ status: run.stopping ? 'processing' : 'listening', error: null });
    };
    recognition.onresult = (event) => {
      if (!isCurrent()) return;
      try {
        // Web Speech supplies the complete result list on every event. Rebuild
        // it rather than appending repeated final results or superseded interim
        // hypotheses, including when the result list becomes shorter.
        const results = Array.from(event?.results ?? []);
        const segments = results.map((result) => ({
          text: normaliseText(result?.[0]?.transcript),
          final: Boolean(result?.isFinal),
        }));
        update({
          transcript: segments.map(({ text }) => text).filter(Boolean).join(' '),
          finalTranscript: segments
            .filter(({ final }) => final)
            .map(({ text }) => text)
            .filter(Boolean)
            .join(' '),
        });
      } catch {
        finishError(run, 'recognition-failed');
      }
    };
    recognition.onerror = (error) => {
      if (isCurrent()) finishError(run, recognitionError(error));
    };
    recognition.onnomatch = () => {
      if (isCurrent()) finishError(run, 'not-understood');
    };
    recognition.onend = () => {
      if (!isCurrent()) return;
      release(run);
      // Some engines end after sending only interim hypotheses, including
      // after stop(). They are still useful for explicit user review; keep
      // finalTranscript reserved for results the engine actually finalised.
      const transcript = state.transcript;
      update({
        transcript,
        status: transcript ? 'idle' : 'error',
        error: transcript ? null : 'no-speech',
      });
    };

    update({ status: 'starting', transcript: '', finalTranscript: '', error: null });
    try {
      recognition.start();
      return true;
    } catch (error) {
      finishError(run, recognitionError(error));
      return false;
    }
  };

  const stop = () => {
    if (disposed || !session || session.stopping) return false;
    const run = session;
    run.stopping = true;
    update({ status: 'processing' });
    try {
      run.recognition.stop();
      return true;
    } catch (error) {
      finishError(run, recognitionError(error));
      return false;
    }
  };

  const cancel = () => {
    if (disposed) return;
    const stopped = session ? release(session, true) : clearPendingAbort();
    update({
      status: stopped ? 'idle' : 'error',
      transcript: '',
      finalTranscript: '',
      error: stopped ? null : 'speech-unavailable',
    });
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (session) release(session, true);
    clearPendingAbort();
    if (pendingAbort) detach(pendingAbort);
    pendingAbort = null;
    state = { ...state, status: 'idle', transcript: '', finalTranscript: '', error: null };
  };

  onChange(getState());
  return { start, stop, cancel, dispose, getState };
}
