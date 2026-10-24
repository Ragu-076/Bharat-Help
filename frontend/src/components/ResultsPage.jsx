import { contactLinks, websiteUrl } from '../utils/resourceLinks.js';
import './ResultsPage.css';
import { useLanguage } from '../translations/useLanguage.js';
import useSpeech from '../hooks/useSpeech.js';
import { buildResultSpeech, healthNotices } from '../utils/resultSpeech.js';
import SourceExplorer from './SourceExplorer.jsx';

function ResourceLink({ href, external, children, ...props }) {
  if (!href) return <span>{children}</span>;
  return (
    <a href={href} target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined} {...props}>
      {children}
    </a>
  );
}

function ResultsPage({
  results, categoryLabel, selectedClues, unmatchedClues = [],
  selectedClueLabels, unmatchedClueLabels,
  status = 'success', onRetry, onBack, onHome, isSchemes = false, isCommonHealth = false, categoryId,
}) {
  const { t, language } = useLanguage();
  const speech = useSpeech(language, results);
  const speechMessage = !speech.ready ? 'Loading voices…'
    : !speech.supported || speech.error === 'speech-unavailable'
      ? 'Read-aloud is not available in this browser. You can still read the information.'
      : !speech.canSpeak ? 'A voice for this language is not available on this device. You can still read the information.'
        : speech.error === 'speech-failed' ? 'Playback could not finish. Try listening again.'
          : speech.error === 'empty-text' ? 'No information is available to read aloud.' : '';
  const clueList = (clues) => clues.map(t).join(', ');
  return (
    <div className="results-page" aria-busy={status === 'loading'}>
      <button className="back-btn" onClick={() => { speech.stop(); onBack(); }}>{t('← Back to clues')}</button>

      <div className="results-header">
        <h1 className="results-category">{t(categoryLabel)}</h1>
        <p className="results-clues">{t('Selected:')} {selectedClueLabels?.join(', ') ?? clueList(selectedClues)}</p>
      </div>

      {isCommonHealth && (
        <aside className="health-notice">
          {healthNotices.map((notice) => <p key={notice}>{t(notice)}</p>)}
        </aside>
      )}

      {status === 'loading' && (
        <div className="request-state" role="status">
          <h2>{t('Finding help…')}</h2>
          <p>{t('Looking for information matching your selected clues.')}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="request-state" role="alert">
          <h2>{t('Help could not be loaded')}</h2>
          <p>{t('Your selected clues are saved. Try again or go back to change them.')}</p>
          <button className="home-btn" onClick={onRetry}>{t('Try again')}</button>
        </div>
      )}

      {status === 'success' && (
        <>
          {unmatchedClues.length > 0 && results.length > 0 && (
            <p className="coverage-note" role="status">
              {t('No information is available yet for:')} {unmatchedClueLabels?.join(', ') ?? clueList(unmatchedClues)}.
              {' '}{t('The results below cover your other selections.')}
            </p>
          )}

          {results.length === 0 ? (
            <div className="no-results" role="status">
              <h2>{t('No matching information yet')}</h2>
              <p>{t('We don’t have information for these selected clues yet. Go back to choose different options.')}</p>
            </div>
          ) : (
            <>
              <p className="results-explanation">
                {t('Related information based on matching clues. Match counts show relevance, not urgency.')}
              </p>
              <p className="speech-notice" role="status" aria-live="polite" aria-atomic="true">
                {speechMessage ? t(speechMessage) : ''}
              </p>
              {speech.ready && speech.supported && !speech.canSpeak && (
                <div className="speech-setup">
                  <p>{t('On Windows, install a matching voice under Settings → Time & language → Speech → Manage voices → Add voices, then restart your browser.')}</p>
                  <div className="speech-controls">
                    <button type="button" className="stop-btn" onClick={speech.refreshVoices}>
                      {t('Check voices again')}
                    </button>
                    <a href="https://support.microsoft.com/en-us/accessibility/windows/narrator/appendix-a-supported-languages-and-voices"
                      target="_blank" rel="noopener noreferrer">{t('Voice setup instructions')}</a>
                  </div>
                </div>
              )}
              {results.map((issue) => (
                <article key={issue.id} className="result-card">
                  <div className="result-title-section">
                    <h2 className="result-title">{t('Related help:')} {t(issue.name)}</h2>
                    <span className="match-badge">
                      {issue.matchCount} {t(issue.matchCount === 1 ? 'clue matched' : 'clues matched')}
                    </span>
                  </div>
                  <div className="speech-controls">
                    <button type="button" className="listen-btn"
                      aria-label={`${t('Listen')}: ${t(issue.name)}`}
                      disabled={!speech.canSpeak || speech.activeId === issue.id}
                      onClick={() => speech.start(issue.id, buildResultSpeech(issue, t, { isSchemes, isCommonHealth }))}>
                      <span aria-hidden="true">🔊 </span>{t('Listen')}
                    </button>
                    <button type="button" className="stop-btn"
                      aria-label={`${t('Stop')}: ${t(issue.name)}`}
                      disabled={speech.activeId !== issue.id} onClick={speech.stop}>
                      {t('Stop')}
                    </button>
                    {speech.activeId === issue.id && <span className="speech-status" role="status">{t('Reading aloud…')}</span>}
                  </div>
                  <p className="matched-clues">{t('Matches:')} {issue.matchedClueLabels?.join(', ') ?? clueList(issue.matchedClues)}</p>
                  {issue.coverage && <p className="record-coverage"><strong>{t('Coverage')}:</strong> {issue.coverage}</p>}

                  <section className={`help-section${isSchemes || isCommonHealth ? '' : ' help-section--urgent'}`}>
                    <h3>{t(isCommonHealth ? 'Self-care' : isSchemes ? 'Next steps' : '🚨 Immediate Help')}</h3>
                    <ul>{issue.help.immediateHelp.map((item) => <li key={item}>{t(item)}</li>)}</ul>
                  </section>

                  {issue.help.awareness?.length > 0 && <section className="help-section">
                    <h3>{t('Safety and awareness')}</h3>
                    <ul>{issue.help.awareness.map((text) => <li key={text}>{text}</li>)}</ul>
                  </section>}

                  {isCommonHealth && (
                    <>
                      <section className="help-section health-escalation">
                        <h3>{t('When to seek medical help')}</h3>
                        <ul>{issue.help.seekHelp.map((item) => <li key={item}>{t(item)}</li>)}</ul>
                      </section>
                      <section className="help-section medicines-section">
                        <h3>{t('Medicine information')}</h3>
                        {issue.help.medicines.map((medicine) => (
                          <div className="medicine-card" key={medicine.name}>
                            <h4>{t(medicine.name)}</h4>
                            <p>{t(medicine.purpose)}</p>
                            <strong>{t('Precautions')}</strong>
                            <ul>{medicine.precautions.map((item) => <li key={item}>{t(item)}</li>)}</ul>
                          </div>
                        ))}
                      </section>
                    </>
                  )}

                  {issue.help.contacts.length > 0 && <section className="help-section">
                    <h3>{t(isSchemes ? 'Application / Support Contacts' : '📞 Emergency / Support Contacts')}</h3>
                    <div className="contacts-grid">
                      {issue.help.contacts.map((contact) => (
                        <div key={`${contact.name}-${contact.number}`} className="contact-card">
                          <div className="contact-name">{t(contact.name)}</div>
                          <div className="contact-number">
                            {contactLinks(contact.number).map(({ label, ...link }, index) => (
                              <span key={label}>
                                {index > 0 && ' / '}
                                <ResourceLink {...link} aria-label={`${t(contact.name)}: ${label}`}>
                                  {label}
                                </ResourceLink>
                              </span>
                            ))}
                          </div>
                          <div className="contact-avail">{t(contact.available)}</div>
                        </div>
                      ))}
                    </div>
                  </section>}

                  {issue.help.rights.length > 0 && <section className="help-section">
                    <h3>{t('⚖️ Your Rights')}</h3>
                    <ul>{issue.help.rights.map((right) => <li key={right}>{t(right)}</li>)}</ul>
                  </section>}

                  {issue.help.schemes.length > 0 && <section className="help-section">
                    <h3>{t('🏛️ Government Schemes / Resources')}</h3>
                    <div className="schemes-list">
                      {issue.help.schemes.map((scheme) => (
                        <div key={scheme.name} className="scheme-card">
                          <strong>{t(scheme.name)}</strong>
                          <p>{t(scheme.description)}</p>
                        </div>
                      ))}
                    </div>
                  </section>}

                  <section className="help-section">
                    <h3>{t(isCommonHealth ? 'Health information sources' : 'Information sources')}</h3>
                    <ul className="sources-list">
                      {issue.sourceDetails?.length ? issue.sourceDetails.map((source) => (
                        <li key={source.url}><ResourceLink href={source.url} external>{source.title}</ResourceLink></li>
                      )) : issue.help.sources.map((source) => (
                        <li key={source}><ResourceLink href={websiteUrl(source)} external>{t(source)}</ResourceLink></li>
                      ))}
                    </ul>
                    {issue.reviewedOn && <p className="source-review-date">{t('Sources checked')}: <time dateTime={issue.reviewedOn}>{issue.reviewedOn}</time></p>}
                  </section>
                </article>
              ))}
            </>
          )}
        </>
      )}

      {status === 'success' && (isSchemes || categoryId === 'women-support' || categoryId === 'medical-emergency') &&
        <SourceExplorer key={categoryId} kind={isSchemes ? 'schemes' : categoryId === 'women-support' ? 'centres' : 'hospitals'}
          speech={speech}
          topic={isSchemes && selectedClues.length === 1 ? selectedClues[0] : ''} />}
      <p className="emergency-shortcut">{t('Need urgent emergency help?')} <a href="tel:112">{t('Call 112')}</a></p>
      <button className="home-btn" onClick={() => { speech.stop(); onHome(); }}>{t('← Back to Home')}</button>
    </div>
  );
}

export default ResultsPage;
