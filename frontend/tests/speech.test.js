import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSpeechController,
  selectVoice,
  speechLocales,
  splitSpeechText,
} from '../src/utils/speech.js';

class FakeUtterance {
  constructor(text) {
    this.text = text;
  }
}

function fakeSynthesis(initialVoices = []) {
  let voices = initialVoices;
  const listeners = new Map();
  return {
    spoken: [],
    cancelCount: 0,
    getVoices() {
      return voices;
    },
    speak(utterance) {
      this.spoken.push(utterance);
    },
    cancel() {
      this.cancelCount += 1;
    },
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    setVoices(nextVoices) {
      voices = nextVoices;
      for (const listener of listeners.get('voiceschanged') ?? []) listener();
    },
    listenerCount(type) {
      return listeners.get(type)?.size ?? 0;
    },
  };
}

const english = Object.freeze({ name: 'English India', lang: 'en-IN' });
const hindi = Object.freeze({ name: 'Hindi India', lang: 'hi-IN' });
const tamil = Object.freeze({ name: 'Tamil India', lang: 'ta-IN' });

function setup(voices = [english, hindi, tamil]) {
  const synthesis = fakeSynthesis(voices);
  const changes = [];
  const controller = createSpeechController({
    synthesis,
    Utterance: FakeUtterance,
    onChange: (state) => changes.push(state),
  });
  return { synthesis, changes, controller };
}

test('voice selection prefers the exact locale, normalizes locale spelling, and never uses another language', () => {
  assert.deepEqual(speechLocales, { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN' });
  const usEnglish = { name: 'English US', lang: 'en-US' };
  const normalizedHindi = { name: 'Hindi', lang: 'HI_in' };
  const sriLankanTamil = { name: 'Tamil Sri Lanka', lang: 'ta-LK' };
  const voices = Object.freeze([usEnglish, english, normalizedHindi, sriLankanTamil]);

  assert.equal(selectVoice(voices, 'en'), english);
  assert.equal(selectVoice(voices, 'hi'), normalizedHindi);
  assert.equal(selectVoice(voices, 'ta'), sriLankanTamil);
  assert.equal(selectVoice([usEnglish], 'en'), usEnglish);
  assert.equal(selectVoice([english], 'hi'), null);
  assert.equal(selectVoice([english], 'ta'), null);
  assert.deepEqual(voices, [usEnglish, english, normalizedHindi, sriLankanTamil]);
});

test('speech chunks stay short without losing words or splitting a long unbroken word', () => {
  const text = Array.from({ length: 100 }, (_, index) => `guidance${index}`).join(' ');
  const chunks = splitSpeechText(text);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.length <= 220 && chunk === chunk.trim()));
  assert.equal(chunks.join(' '), text);
  assert.deepEqual(splitSpeechText('   \n\t '), []);
  const longWord = 'a'.repeat(260);
  assert.deepEqual(splitSpeechText(longWord), [longWord]);
  assert.equal(splitSpeechText('உதவி தகவல் हिंदी जानकारी').join(' '), 'உதவி தகவல் हिंदी जानकारी');
});

test('an unavailable speech API reports a clear error without trying to play', () => {
  const controller = createSpeechController({ synthesis: null, Utterance: FakeUtterance });
  assert.equal(controller.getState().supported, false);
  assert.deepEqual(controller.getState().availableLanguages, []);
  assert.equal(controller.start({ id: 'result', text: 'Help information', language: 'en' }), false);
  assert.equal(controller.getState().status, 'error');
  assert.equal(controller.getState().error, 'speech-unavailable');
  controller.stop();
  controller.dispose();
});

test('missing Hindi and Tamil voices do not silently read translated text with an English voice', () => {
  const { synthesis, controller } = setup([english]);
  assert.deepEqual(controller.getState().availableLanguages, ['en']);
  for (const language of ['hi', 'ta']) {
    assert.equal(controller.start({ id: language, text: 'Translated information', language }), false);
    assert.equal(controller.getState().error, 'voice-unavailable');
  }
  assert.equal(synthesis.spoken.length, 0);
  controller.dispose();
});

test('voices that load asynchronously update availability and allow playback', () => {
  const { synthesis, changes, controller } = setup([]);
  assert.deepEqual(controller.getState().availableLanguages, []);
  synthesis.setVoices([tamil, english, hindi]);
  assert.deepEqual(controller.getState().availableLanguages, ['en', 'hi', 'ta']);
  assert.deepEqual(changes.at(-1).availableLanguages, ['en', 'hi', 'ta']);
  assert.equal(controller.start({ id: 'tamil-result', text: 'உதவி தகவல்', language: 'ta' }), true);
  assert.equal(synthesis.spoken[0].voice, tamil);
  assert.equal(synthesis.spoken[0].lang, 'ta-IN');
  controller.dispose();
});

test('only one result plays, and old playback callbacks cannot affect its replacement', () => {
  const { synthesis, controller } = setup();
  assert.equal(controller.start({ id: 'first', text: 'First result.', language: 'en' }), true);
  const oldUtterance = synthesis.spoken[0];
  const oldEnd = oldUtterance.onend;
  const oldError = oldUtterance.onerror;
  const cancellationsBefore = synthesis.cancelCount;
  assert.equal(controller.start({ id: 'second', text: 'दूसरी जानकारी', language: 'hi' }), true);
  assert.ok(synthesis.cancelCount > cancellationsBefore);
  assert.equal(controller.getState().activeId, 'second');
  assert.equal(controller.getState().status, 'speaking');
  assert.equal(synthesis.spoken[1].voice, hindi);

  oldEnd?.();
  oldError?.({ error: 'interrupted' });
  assert.equal(controller.getState().activeId, 'second');
  assert.equal(controller.getState().status, 'speaking');
  assert.equal(controller.getState().error, null);
  assert.equal(synthesis.spoken.length, 2);
  controller.dispose();
});

test('voice loading recovers after an initial engine error without leaving an unavailable message', () => {
  const synthesis = fakeSynthesis([english]);
  const getVoices = synthesis.getVoices;
  synthesis.getVoices = () => { throw new Error('Engine still starting'); };
  const controller = createSpeechController({ synthesis, Utterance: FakeUtterance });
  assert.equal(controller.getState().error, 'speech-unavailable');
  synthesis.getVoices = getVoices;
  synthesis.setVoices([english]);
  assert.deepEqual(controller.getState().availableLanguages, ['en']);
  assert.equal(controller.getState().status, 'idle');
  assert.equal(controller.getState().error, null);
  assert.equal(controller.start({ id: 'ready', text: 'Information', language: 'en' }), true);
  controller.dispose();
});

test('long results play one chunk at a time and finish in the idle state', () => {
  const { synthesis, controller } = setup();
  const text = Array.from({ length: 90 }, (_, index) => `information${index}`).join(' ');
  const expected = splitSpeechText(text);
  assert.equal(controller.start({ id: 'long-result', text, language: 'en' }), true);
  assert.equal(synthesis.spoken.length, 1);
  for (let index = 0; index < expected.length; index += 1) {
    assert.equal(synthesis.spoken[index].text, expected[index]);
    assert.equal(synthesis.spoken.length, index + 1);
    synthesis.spoken[index].onend();
  }
  assert.equal(synthesis.spoken.length, expected.length);
  assert.equal(controller.getState().status, 'idle');
  assert.equal(controller.getState().activeId, null);
  assert.equal(controller.getState().error, null);
  controller.dispose();
});

test('stop cancels playback and late callbacks cannot resume the remaining chunks', () => {
  const { synthesis, controller } = setup();
  const text = 'Long assistance information. '.repeat(30);
  controller.start({ id: 'result', text, language: 'en' });
  const lateEnd = synthesis.spoken[0].onend;
  const lateError = synthesis.spoken[0].onerror;
  const cancellationsBefore = synthesis.cancelCount;
  controller.stop();
  assert.ok(synthesis.cancelCount > cancellationsBefore);
  assert.equal(controller.getState().status, 'idle');
  assert.equal(controller.getState().activeId, null);
  lateEnd?.();
  lateError?.({ error: 'canceled' });
  assert.equal(synthesis.spoken.length, 1);
  assert.equal(controller.getState().status, 'idle');
  assert.equal(controller.getState().error, null);
  controller.dispose();
});

test('dispose removes voice listeners and ignores future starts, events, and callbacks', () => {
  const { synthesis, changes, controller } = setup();
  controller.start({ id: 'result', text: 'Information. '.repeat(60), language: 'en' });
  const lateEnd = synthesis.spoken[0].onend;
  const lateError = synthesis.spoken[0].onerror;
  assert.equal(synthesis.listenerCount('voiceschanged'), 1);
  controller.dispose();
  const changeCount = changes.length;
  const cancelCount = synthesis.cancelCount;
  assert.equal(synthesis.listenerCount('voiceschanged'), 0);
  lateEnd?.();
  lateError?.({ error: 'interrupted' });
  synthesis.setVoices([]);
  assert.equal(controller.start({ id: 'new', text: 'New result', language: 'en' }), false);
  controller.stop();
  controller.dispose();
  assert.equal(changes.length, changeCount);
  assert.equal(synthesis.cancelCount, cancelCount);
  assert.equal(synthesis.spoken.length, 1);
});

test('playback failures are reported and a subsequent request can recover', () => {
  const { synthesis, controller } = setup();
  controller.start({ id: 'result', text: 'Assistance information', language: 'en' });
  synthesis.spoken[0].onerror({ error: 'synthesis-failed' });
  assert.equal(controller.getState().status, 'error');
  assert.equal(controller.getState().error, 'speech-failed');
  assert.equal(controller.getState().activeId, null);
  assert.equal(controller.start({ id: 'retry', text: 'Try this information again', language: 'en' }), true);
  assert.equal(controller.getState().status, 'speaking');
  assert.equal(controller.getState().error, null);
  assert.equal(controller.getState().activeId, 'retry');
  controller.dispose();
});

test('empty text and synchronous engine exceptions fail safely', () => {
  const { synthesis, controller } = setup();
  assert.equal(controller.start({ id: 'empty', text: ' \n ', language: 'en' }), false);
  assert.equal(controller.getState().error, 'empty-text');
  assert.equal(synthesis.spoken.length, 0);
  synthesis.speak = () => { throw new Error('Engine failed'); };
  assert.equal(controller.start({ id: 'broken', text: 'Help', language: 'en' }), false);
  assert.equal(controller.getState().error, 'speech-failed');
  controller.dispose();

  const brokenVoiceEngine = fakeSynthesis();
  brokenVoiceEngine.getVoices = () => { throw new Error('Voices unavailable'); };
  const unavailable = createSpeechController({ synthesis: brokenVoiceEngine, Utterance: FakeUtterance });
  assert.equal(unavailable.start({ id: 'result', text: 'Help', language: 'en' }), false);
  assert.equal(unavailable.getState().error, 'speech-unavailable');
  unavailable.dispose();
});

test('utterance construction errors do not leave an active result', () => {
  const synthesis = fakeSynthesis([english]);
  class BrokenUtterance {
    constructor() {
      throw new Error('Cannot create utterance');
    }
  }
  const controller = createSpeechController({ synthesis, Utterance: BrokenUtterance });
  assert.equal(controller.start({ id: 'result', text: 'Help information', language: 'en' }), false);
  assert.equal(controller.getState().status, 'error');
  assert.equal(controller.getState().error, 'speech-failed');
  assert.equal(controller.getState().activeId, null);
  assert.equal(synthesis.spoken.length, 0);
  controller.dispose();
});

test('a cancellation exception still invalidates old playback callbacks', () => {
  const { synthesis, controller } = setup();
  controller.start({ id: 'result', text: 'Assistance information. '.repeat(30), language: 'en' });
  const lateEnd = synthesis.spoken[0].onend;
  synthesis.cancel = () => { throw new Error('Cannot access speech engine'); };
  controller.stop();
  assert.equal(controller.getState().status, 'error');
  assert.equal(controller.getState().error, 'speech-unavailable');
  assert.equal(controller.getState().activeId, null);
  lateEnd?.();
  assert.equal(synthesis.spoken.length, 1);
  assert.equal(controller.start({ id: 'next', text: 'Next result', language: 'en' }), false);
  assert.equal(synthesis.spoken.length, 1);
  assert.equal(controller.getState().error, 'speech-unavailable');
  controller.dispose();
});

test('external state and callback snapshots cannot mutate controller availability', () => {
  const { synthesis, changes, controller } = setup();
  const snapshot = controller.getState();
  snapshot.availableLanguages.splice(0);
  snapshot.status = 'error';
  changes[0].availableLanguages.splice(0);
  assert.deepEqual(controller.getState().availableLanguages, ['en', 'hi', 'ta']);
  assert.equal(controller.getState().status, 'idle');
  synthesis.setVoices([hindi]);
  assert.deepEqual(controller.getState().availableLanguages, ['hi']);
  controller.dispose();
});

test('manual refresh discovers silently loaded Hindi and Tamil voices and recovers the requested language', () => {
  const { synthesis, controller } = setup([english]);
  assert.equal(controller.start({ id: 'hindi', text: 'Hindi information', language: 'hi' }), false);
  assert.equal(controller.getState().error, 'voice-unavailable');

  synthesis.getVoices = () => [english, hindi, tamil];
  assert.deepEqual(controller.getState().availableLanguages, ['en']);
  assert.equal(controller.refreshVoices(), true);
  assert.deepEqual(controller.getState().availableLanguages, ['en', 'hi', 'ta']);
  assert.equal(controller.getState().status, 'idle');
  assert.equal(controller.getState().error, null);

  assert.equal(controller.start({ id: 'hindi', text: 'Hindi information', language: 'hi' }), true);
  assert.equal(synthesis.spoken.at(-1).voice, hindi);
  assert.equal(controller.start({ id: 'tamil', text: 'Tamil information', language: 'ta' }), true);
  assert.equal(synthesis.spoken.at(-1).voice, tamil);
  controller.dispose();
});

test('refresh keeps a missing requested language unavailable without an English fallback', () => {
  const { synthesis, controller } = setup([english]);
  assert.equal(controller.start({ id: 'tamil', text: 'Tamil information', language: 'ta' }), false);
  synthesis.getVoices = () => [english, hindi];
  assert.equal(controller.refreshVoices(), true);
  assert.deepEqual(controller.getState().availableLanguages, ['en', 'hi']);
  assert.equal(controller.getState().error, 'voice-unavailable');
  assert.equal(controller.getState().status, 'error');
  assert.equal(controller.start({ id: 'tamil', text: 'Tamil information', language: 'ta' }), false);
  assert.equal(synthesis.spoken.length, 0);
  controller.dispose();
});

test('refresh read failures cancel owned playback and can recover after the engine returns', () => {
  const { synthesis, controller } = setup();
  assert.equal(controller.start({ id: 'result', text: 'Assistance information. '.repeat(30), language: 'en' }), true);
  const lateEnd = synthesis.spoken[0].onend;
  const cancelCount = synthesis.cancelCount;
  synthesis.getVoices = () => { throw new Error('Engine temporarily unavailable'); };

  assert.equal(controller.refreshVoices(), false);
  assert.ok(synthesis.cancelCount > cancelCount);
  assert.equal(controller.getState().activeId, null);
  assert.equal(controller.getState().error, 'speech-unavailable');
  assert.deepEqual(controller.getState().availableLanguages, []);
  lateEnd?.();
  assert.equal(synthesis.spoken.length, 1);

  synthesis.getVoices = () => [english, hindi, tamil];
  assert.equal(controller.refreshVoices(), true);
  assert.equal(controller.getState().status, 'idle');
  assert.equal(controller.getState().error, null);
  assert.equal(controller.start({ id: 'recovered', text: 'Tamil information', language: 'ta' }), true);
  assert.equal(synthesis.spoken.at(-1).voice, tamil);
  controller.dispose();
});

test('a successful refresh preserves active playback and existing playback failures', () => {
  const { synthesis, controller } = setup([english]);
  assert.equal(controller.start({ id: 'active', text: 'Assistance information.', language: 'en' }), true);
  const utterance = synthesis.spoken[0];
  const cancelCount = synthesis.cancelCount;
  synthesis.getVoices = () => [english, hindi, tamil];
  assert.equal(controller.refreshVoices(), true);
  assert.equal(controller.getState().activeId, 'active');
  assert.equal(controller.getState().status, 'speaking');
  assert.equal(synthesis.cancelCount, cancelCount);
  assert.equal(synthesis.spoken.length, 1);
  assert.equal(synthesis.spoken[0], utterance);

  utterance.onerror({ error: 'synthesis-failed' });
  assert.equal(controller.getState().error, 'speech-failed');
  assert.equal(controller.refreshVoices(), true);
  assert.equal(controller.getState().error, 'speech-failed');
  assert.equal(controller.getState().status, 'error');
  controller.dispose();
});

test('refresh cannot clear an unresolved cancellation error or access a disposed engine', () => {
  const { synthesis, changes, controller } = setup();
  controller.start({ id: 'active', text: 'Assistance information.', language: 'en' });
  synthesis.cancel = () => { throw new Error('Cannot cancel playback'); };
  controller.stop();
  assert.equal(controller.getState().error, 'speech-unavailable');
  assert.equal(controller.refreshVoices(), true);
  assert.equal(controller.getState().error, 'speech-unavailable');
  assert.equal(controller.getState().status, 'error');
  controller.dispose();

  const changeCount = changes.length;
  let reads = 0;
  synthesis.getVoices = () => { reads += 1; return [english, hindi, tamil]; };
  assert.equal(controller.refreshVoices(), false);
  assert.equal(reads, 0);
  assert.equal(changes.length, changeCount);

  const unsupported = createSpeechController({ synthesis: null, Utterance: FakeUtterance });
  assert.equal(unsupported.refreshVoices(), false);
  assert.equal(unsupported.getState().error, 'speech-unavailable');
  unsupported.dispose();
});
