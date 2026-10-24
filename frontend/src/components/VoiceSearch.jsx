import { useEffect, useId, useRef, useState } from 'react';
import { useLanguage } from '../translations/useLanguage.js';
import { languages } from '../translations/translations.js';
import { categories } from '../services/helpService.js';
import { matchVoiceSearch } from '../utils/voiceSearch.js';
import useRecognition from '../hooks/useRecognition.js';
import './VoiceSearch.css';

const errorMessages = {
  'speech-unavailable': 'Voice search is unavailable in this browser. You can type below or use the category buttons.',
  'microphone-denied': 'Allow microphone access in your browser, then try again.',
  'no-microphone': 'No microphone was found. Connect one and try again.',
  network: 'Voice recognition could not connect. Check your internet connection or type below.',
  'language-unavailable': 'Speech recognition is unavailable for this language in this browser. You can type below.',
  'no-speech': 'No speech was recognised. Try again or type below.',
  'not-understood': 'Speech could not be understood. Try again or type below.',
  'recognition-failed': 'Voice recognition stopped unexpectedly. Try again or type below.',
};

function VoiceSearchForm({ categoryId, onSelect, language, t }) {
  const recognition = useRecognition(language);
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const editorRef = useRef(null);
  const focusEditor = useRef(false);
  const id = useId();
  const active = ['starting', 'listening', 'processing'].includes(recognition.status);
  const languageLabel = languages.find((item) => item.code === language)?.label;

  useEffect(() => {
    if (expanded && focusEditor.current) {
      editorRef.current?.focus();
      focusEditor.current = false;
    }
  }, [expanded]);

  useEffect(() => {
    if (!recognition.ready) return;
    setText(recognition.transcript);
    setSuggestions(null);
  }, [recognition.ready, recognition.status, recognition.transcript, recognition.finalTranscript]);

  const statusMessage = recognition.status === 'starting' ? 'Starting microphone…'
    : recognition.status === 'listening' ? 'Listening… Speak now.'
      : recognition.status === 'processing' ? 'Finishing recording…' : '';
  const errorMessage = recognition.ready && !recognition.supported
    ? errorMessages['speech-unavailable'] : errorMessages[recognition.error];

  function clear() {
    recognition.cancel();
    setText('');
    setSuggestions(null);
  }

  function startRecording() {
    setExpanded(true);
    recognition.start();
  }

  function openTyping() {
    focusEditor.current = true;
    setExpanded(true);
  }

  function close() {
    clear();
    setExpanded(false);
  }

  function findMatches(event) {
    event.preventDefault();
    if (active || !text.trim()) return;
    setSuggestions(matchVoiceSearch(text, { categoryId }));
  }

  function chooseSuggestion(suggestion) {
    close();
    onSelect({ categoryId: suggestion.categoryId, clues: suggestion.clues });
  }

  return (
    <section className="voice-search" aria-labelledby={`${id}-title`}>
      <div className="voice-search-bar">
        <div className="voice-search-heading">
          <h2 id={`${id}-title`}>{t('Voice search')}</h2>
          <span className="voice-search-language" title={t('Speech input language:')}>
            <strong lang={language}>{languageLabel}</strong>
          </span>
        </div>
        <div className="voice-search-actions">
          <button type="button" className="voice-record-btn"
            disabled={!recognition.ready || !recognition.supported || active}
            aria-expanded={expanded} aria-controls={`${id}-body`}
            aria-describedby={`${id}-privacy`} onClick={startRecording}>
            <span aria-hidden="true">🎤 </span>{t('Start voice search')}
          </button>
          {expanded
            ? <button type="button" onClick={close} aria-expanded={true} aria-controls={`${id}-body`}>
              {t('Close voice search')}
            </button>
            : <button type="button" onClick={openTyping} aria-expanded={false} aria-controls={`${id}-body`}>
              {t('Type instead')}
            </button>}
        </div>
      </div>
      <div id={`${id}-body`} className="voice-search-body" hidden={!expanded}>
        <p>{t('Speak or type a short description of your situation.')}</p>
        {active && <div className="voice-search-actions">
          <button type="button" disabled={recognition.status === 'processing'} onClick={recognition.stop}>
            {t('Stop recording')}
          </button>
          <button type="button" onClick={clear}>{t('Cancel recording')}</button>
        </div>}
      <p className="voice-search-status" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage ? t(statusMessage) : ''}
      </p>
      {errorMessage && <p className="voice-search-error" role="alert">{t(errorMessage)}</p>}
      <form onSubmit={findMatches}>
        <label htmlFor={`${id}-text`}>{t('Review or edit your words')}</label>
        <textarea ref={editorRef} id={`${id}-text`} value={text} disabled={active} rows={2}
          placeholder={t('Describe your situation…')} autoComplete="off"
          onChange={(event) => { setText(event.target.value); setSuggestions(null); }} />
        <div className="voice-search-actions">
          <button type="submit" className="voice-find-btn" disabled={active || !text.trim()}>
            {t('Find matching clues')}
          </button>
          <button type="button" disabled={active || !text} onClick={clear}>{t('Clear')}</button>
        </div>
      </form>
      <p id={`${id}-privacy`} className="voice-search-note">{t('Your browser may send audio to its speech service. Review the words before continuing.')}</p>

      {suggestions !== null && <div className="voice-search-suggestions">
        {suggestions.length === 0 ? <p role="status">{t(categoryId
          ? 'No matching clues in this category. Try different words or select the options below.'
          : 'No matching clues found. Try different words or choose a category below.')}</p> : <>
          <h3>{t(categoryId ? 'Review these clues' : 'Suggested categories')}</h3>
          <p>{t('Review the suggestions before continuing.')}</p>
          {suggestions.map((suggestion) => {
            const category = categories.find((item) => item.id === suggestion.categoryId);
            return <article className="voice-search-suggestion" key={suggestion.categoryId}>
              <h4><span aria-hidden="true">{category.icon} </span>{t(category.label)}</h4>
              <ul>{suggestion.clues.map((clue) => <li key={clue}>{t(clue)}</li>)}</ul>
              <button type="button" onClick={() => chooseSuggestion(suggestion)}>
                {t('Continue with these clues')}
              </button>
            </article>;
          })}
        </>}
      </div>}
      </div>
    </section>
  );
}

export default function VoiceSearch({ categoryId, onSelect }) {
  const { t, language } = useLanguage();
  // A language/category change discards transcripts and cancels the old microphone session.
  return <VoiceSearchForm key={`${language}:${categoryId || 'all'}`}
    categoryId={categoryId} onSelect={onSelect} language={language} t={t} />;
}
