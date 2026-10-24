import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecognitionController, recognitionLocales } from '../src/utils/recognition.js';

function setup(options = {}) {
  const instances = [];
  class FakeRecognition {
    constructor() {
      this.starts = 0;
      this.stops = 0;
      this.aborts = 0;
      instances.push(this);
    }
    start() {
      this.starts += 1;
      if (this.startError) throw this.startError;
    }
    stop() {
      this.stops += 1;
      if (this.stopError) throw this.stopError;
    }
    abort() {
      this.aborts += 1;
      if (this.abortError) throw this.abortError;
    }
  }
  const changes = [];
  const controller = createRecognitionController({
    Recognition: FakeRecognition,
    onChange: (state) => changes.push(state),
    ...options,
  });
  return { controller, changes, instances, FakeRecognition };
}

function result(text, isFinal = true) {
  const value = [{ transcript: text, confidence: 0.9 }];
  value.isFinal = isFinal;
  return value;
}

test('recognition is user initiated and configures each supported Indian language', () => {
  assert.deepEqual(recognitionLocales, { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN' });
  const { controller, instances } = setup();
  assert.equal(instances.length, 0);
  assert.deepEqual(controller.getState(), {
    supported: true, status: 'idle', transcript: '', finalTranscript: '', error: null,
  });
  for (const [language, locale] of Object.entries(recognitionLocales)) {
    assert.equal(controller.start(language), true);
    const recognition = instances.at(-1);
    assert.equal(recognition.lang, locale);
    assert.equal(recognition.continuous, false);
    assert.equal(recognition.interimResults, true);
    assert.equal(recognition.maxAlternatives, 1);
    assert.equal(recognition.starts, 1);
    assert.equal(controller.getState().status, 'starting');
    recognition.onstart();
    assert.equal(controller.getState().status, 'listening');
    controller.cancel();
    assert.equal(recognition.aborts, 1);
  }
  assert.equal(controller.start('HI-in'), true);
  assert.equal(instances.at(-1).lang, 'hi-IN');
  controller.dispose();
});

test('missing browser API or insecure context never creates a recognition session', () => {
  for (const options of [{ Recognition: undefined }, { secureContext: false }]) {
    const { controller, instances } = setup(options);
    assert.equal(controller.getState().supported, false);
    assert.equal(controller.getState().error, 'speech-unavailable');
    assert.equal(controller.start('en'), false);
    assert.equal(instances.length, 0);
    assert.equal(controller.stop(), false);
    controller.cancel();
    assert.equal(controller.start('en'), false);
    assert.equal(controller.getState().error, 'speech-unavailable');
    controller.dispose();
  }
});

test('unsupported languages are rejected without silently switching to English', () => {
  const { controller, instances } = setup();
  assert.equal(controller.start('fr'), false);
  assert.equal(controller.getState().error, 'language-unavailable');
  assert.equal(instances.length, 0);
  assert.equal(controller.start('ta'), true);
  assert.equal(instances[0].lang, 'ta-IN');
  assert.equal(controller.getState().error, null);
  controller.dispose();
});

test('repeated clicks cannot create overlapping sessions while starting, listening or processing', () => {
  const { controller, instances } = setup();
  assert.equal(controller.start('en'), true);
  assert.equal(controller.start('en'), false);
  instances[0].onstart();
  assert.equal(controller.start('hi'), false);
  assert.equal(controller.stop(), true);
  assert.equal(controller.getState().status, 'processing');
  assert.equal(controller.start('ta'), false);
  assert.equal(controller.stop(), false);
  assert.equal(instances.length, 1);
  assert.equal(instances[0].stops, 1);
  controller.dispose();
});

test('cumulative results replace interim words and do not duplicate finalized speech', () => {
  const { controller, instances } = setup();
  controller.start('en');
  const recognition = instances[0];
  recognition.onstart();
  recognition.onresult({ results: [result(' emergency ', false)], resultIndex: 0 });
  assert.equal(controller.getState().transcript, 'emergency');
  assert.equal(controller.getState().finalTranscript, '');
  recognition.onresult({ results: [result('emergency help'), result('for a', false)], resultIndex: 0 });
  assert.equal(controller.getState().transcript, 'emergency help for a');
  assert.equal(controller.getState().finalTranscript, 'emergency help');
  recognition.onresult({ results: [result('emergency help'), result('for an accident')], resultIndex: 1 });
  recognition.onresult({ results: [result('emergency help'), result('for an accident')], resultIndex: 1 });
  assert.equal(controller.getState().transcript, 'emergency help for an accident');
  assert.equal(controller.getState().finalTranscript, 'emergency help for an accident');
  recognition.onend();
  assert.equal(controller.getState().status, 'idle');
  assert.equal(controller.getState().error, null);
  assert.equal(instances.length, 1, 'Recognition must not restart automatically');
  controller.dispose();
});

test('a shorter result list removes superseded interim hypotheses and preserves Unicode', () => {
  const { controller, instances } = setup();
  controller.start('ta');
  const recognition = instances[0];
  recognition.onresult({ results: [result('எனக்கு உதவி'), result('வேண்டும்', false)] });
  recognition.onresult({ results: [result('எனக்கு உதவி')] });
  assert.equal(controller.getState().transcript, 'எனக்கு உதவி');
  recognition.onend();
  assert.equal(controller.getState().finalTranscript, 'எனக்கு உதவி');
  controller.start('hi');
  instances[1].onresult({ results: [result('मुझे  मदद  चाहिए')] });
  instances[1].onend();
  assert.equal(controller.getState().transcript, 'मुझे मदद चाहिए');
  controller.dispose();
});

test('graceful stop permits final results before end and keeps processing if start arrives late', () => {
  const { controller, instances } = setup();
  controller.start('en');
  const recognition = instances[0];
  recognition.onresult({ results: [result('medical', false)] });
  assert.equal(controller.stop(), true);
  recognition.onstart();
  assert.equal(controller.getState().status, 'processing');
  recognition.onresult({ results: [result('medical help')] });
  recognition.onend();
  assert.equal(controller.getState().status, 'idle');
  assert.equal(controller.getState().transcript, 'medical help');
  assert.equal(recognition.aborts, 0);
  controller.dispose();
});

test('an empty current result list reports no-speech without restoring withdrawn words', () => {
  const { controller, instances } = setup();
  for (const results of [[], [result('  ')]]) {
    controller.start('en');
    const recognition = instances.at(-1);
    recognition.onresult({ results: [result('withdrawn words', false)] });
    recognition.onresult({ results });
    recognition.onend();
    assert.equal(controller.getState().status, 'error');
    assert.equal(controller.getState().error, 'no-speech');
    assert.equal(controller.getState().transcript, '');
  }
  controller.dispose();
});

test('interim words survive natural end and manual stop for review in every language', () => {
  const { controller, instances } = setup();
  for (const [language, text] of [['en', 'I need an ambulance'], ['ta', 'ஆம்புலன்ஸ் வேண்டும்'], ['hi', 'एम्बुलेंस चाहिए']]) {
    for (const manualStop of [false, true]) {
      controller.start(language);
      const recognition = instances.at(-1);
      recognition.onstart();
      recognition.onresult({ results: [result(text, false)] });
      if (manualStop) controller.stop();
      recognition.onend();
      assert.equal(controller.getState().status, 'idle');
      assert.equal(controller.getState().error, null);
      assert.equal(controller.getState().transcript, text);
      assert.equal(controller.getState().finalTranscript, '', 'Interim words must not be relabelled as final');
    }
  }
  controller.dispose();
});

test('recognition errors preserve captured words and their actual error for review', () => {
  const { controller, instances } = setup();
  for (const error of ['network', 'no-speech']) {
    controller.start('en');
    const recognition = instances.at(-1);
    recognition.onresult({ results: [result('I need'), result('an ambulance', false)] });
    const lateEnd = recognition.onend;
    recognition.onerror({ error });
    lateEnd();
    assert.equal(controller.getState().status, 'error');
    assert.equal(controller.getState().error, error);
    assert.equal(controller.getState().transcript, 'I need an ambulance');
    assert.equal(controller.getState().finalTranscript, 'I need');
  }
  controller.dispose();
});

test('a low-confidence nomatch is distinguished from silence and keeps any captured words', () => {
  const { controller, instances } = setup();
  for (const text of ['', 'ambulance']) {
    controller.start('en');
    const recognition = instances.at(-1);
    if (text) recognition.onresult({ results: [result(text, false)] });
    recognition.onnomatch();
    assert.equal(controller.getState().error, 'not-understood');
    assert.equal(controller.getState().transcript, text);
  }
  controller.dispose();
});

test('browser failures distinguish permissions, microphone, service, language and silence', () => {
  const { controller, instances } = setup();
  const errors = {
    'not-allowed': 'microphone-denied',
    'service-not-allowed': 'speech-unavailable',
    'audio-capture': 'no-microphone',
    network: 'network',
    'language-not-supported': 'language-unavailable',
    'no-speech': 'no-speech',
    aborted: 'recognition-failed',
    unknown: 'recognition-failed',
  };
  for (const [error, expected] of Object.entries(errors)) {
    assert.equal(controller.start('hi'), true);
    const recognition = instances.at(-1);
    const lateEnd = recognition.onend;
    recognition.onerror({ error });
    assert.equal(controller.getState().status, 'error');
    assert.equal(controller.getState().error, expected);
    assert.equal(recognition.aborts, 1);
    lateEnd();
    assert.equal(controller.getState().error, expected);
  }
  assert.equal(controller.start('ta'), true, 'A user can retry after an error');
  assert.equal(controller.getState().error, null);
  controller.dispose();
});

test('cancel discards text and invalidates old events before a different language starts', () => {
  const { controller, instances, changes } = setup();
  controller.start('en');
  const previous = instances[0];
  const late = { start: previous.onstart, result: previous.onresult, end: previous.onend, error: previous.onerror };
  previous.onresult({ results: [result('old request')] });
  controller.cancel();
  assert.equal(controller.getState().transcript, '');
  assert.equal(controller.getState().finalTranscript, '');
  assert.equal(controller.getState().status, 'idle');
  assert.equal(previous.aborts, 1);
  controller.start('ta');
  const count = changes.length;
  late.start();
  late.result({ results: [result('outdated English words')] });
  late.error({ error: 'not-allowed' });
  late.end();
  assert.equal(changes.length, count);
  assert.equal(controller.getState().status, 'starting');
  assert.equal(controller.getState().transcript, '');
  instances[1].onresult({ results: [result('தமிழ் உதவி')] });
  instances[1].onend();
  assert.equal(controller.getState().transcript, 'தமிழ் உதவி');
  controller.dispose();
});

test('a new request clears the previous completed transcript', () => {
  const { controller, instances } = setup();
  controller.start('en');
  instances[0].onresult({ results: [result('finished search')] });
  instances[0].onend();
  controller.start('hi');
  assert.equal(controller.getState().transcript, '');
  assert.equal(controller.getState().finalTranscript, '');
  assert.equal(controller.getState().error, null);
  controller.dispose();
});

test('synchronous start and stop exceptions are reported and a retry can recover', () => {
  class StartThrows {
    start() { throw Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' }); }
    abort() { this.aborted = true; }
  }
  const failing = createRecognitionController({ Recognition: StartThrows });
  assert.equal(failing.start('en'), false);
  assert.equal(failing.getState().error, 'microphone-denied');
  failing.dispose();

  const { controller, instances } = setup();
  controller.start('ta');
  instances[0].stopError = new Error('Cannot stop');
  assert.equal(controller.stop(), false);
  assert.equal(controller.getState().error, 'recognition-failed');
  assert.equal(instances[0].aborts, 1);
  assert.equal(controller.start('ta'), true);
  assert.equal(controller.getState().status, 'starting');
  controller.dispose();
});

test('constructor failure does not leave a phantom active session', () => {
  class CannotConstruct {
    constructor() { throw new Error('Service unavailable'); }
  }
  const controller = createRecognitionController({ Recognition: CannotConstruct });
  assert.equal(controller.start('en'), false);
  assert.equal(controller.getState().status, 'error');
  assert.equal(controller.getState().error, 'recognition-failed');
  assert.equal(controller.stop(), false);
  controller.dispose();
});

test('failed abort invalidates old callbacks and prevents overlapping recognition until cancellation recovers', () => {
  const { controller, instances } = setup();
  controller.start('en');
  const previous = instances[0];
  const lateResult = previous.onresult;
  const lateEnd = previous.onend;
  previous.abortError = new Error('Busy speech engine');
  controller.cancel();
  assert.equal(controller.getState().error, 'speech-unavailable');
  lateResult({ results: [result('stale words')] });
  lateEnd();
  assert.equal(controller.getState().transcript, '');
  assert.equal(controller.start('hi'), false);
  assert.equal(instances.length, 1);
  previous.abortError = null;
  assert.equal(controller.start('hi'), true);
  assert.equal(instances.length, 2);
  assert.equal(controller.getState().error, null);
  controller.dispose();
});

test('a failed abort can also recover when the old browser session eventually ends', () => {
  const { controller, instances } = setup();
  controller.start('en');
  instances[0].abortError = new Error('Cannot abort yet');
  controller.cancel();
  instances[0].onend();
  assert.equal(controller.start('ta'), true);
  assert.equal(instances.length, 2);
  controller.dispose();
});

test('dispose aborts and detaches recognition, ignores late events and never emits again', () => {
  const { controller, instances, changes } = setup();
  controller.start('en');
  const recognition = instances[0];
  const lateResult = recognition.onresult;
  const lateEnd = recognition.onend;
  const lateError = recognition.onerror;
  controller.dispose();
  const count = changes.length;
  assert.equal(recognition.aborts, 1);
  assert.equal(recognition.onstart, null);
  assert.equal(recognition.onresult, null);
  assert.equal(recognition.onend, null);
  lateResult({ results: [result('late transcript')] });
  lateEnd();
  lateError({ error: 'network' });
  assert.equal(controller.start('ta'), false);
  assert.equal(controller.stop(), false);
  controller.cancel();
  controller.dispose();
  assert.equal(changes.length, count);
  assert.equal(instances.length, 1);
  assert.equal(controller.getState().transcript, '');
});

test('external state snapshots cannot change recognition state', () => {
  const { controller, changes } = setup();
  changes[0].status = 'listening';
  const state = controller.getState();
  state.transcript = 'changed outside the controller';
  state.supported = false;
  assert.equal(controller.getState().status, 'idle');
  assert.equal(controller.getState().transcript, '');
  assert.equal(controller.getState().supported, true);
  controller.dispose();
});
