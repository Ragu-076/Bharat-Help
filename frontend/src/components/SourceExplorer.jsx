import { useEffect, useState } from 'react';
import { useLanguage } from '../translations/useLanguage.js';
import { getResources } from '../services/resourceService.js';
import './SourceExplorer.css';

export default function SourceExplorer({ kind, topic = '', speech }) {
  const { t, language } = useLanguage();
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [queryText, setQueryText] = useState('');
  const [options, setOptions] = useState(null);
  const [optionsError, setOptionsError] = useState(false);
  const [search, setSearch] = useState(null);
  const [request, setRequest] = useState({ status: 'idle' });
  const [attempt, setAttempt] = useState(0);
  const canSpeakEnglish = Boolean(speech?.supported && speech.availableLanguages?.includes('en'));
  const schemes = kind === 'schemes';

  useEffect(() => {
    const controller = new AbortController();
    setOptions(null); setOptionsError(false);
    getResources(kind, { state }, { signal: controller.signal, language, options: true })
      .then((data) => { if (!controller.signal.aborted) setOptions(data); })
      .catch(() => { if (!controller.signal.aborted) setOptionsError(true); });
    return () => controller.abort();
  }, [kind, state, language, attempt]);

  useEffect(() => {
    if (!search) { setRequest({ status: 'idle' }); return; }
    const controller = new AbortController();
    setRequest({ status: 'loading' });
    getResources(kind, search, { signal: controller.signal, language })
      .then((data) => { if (!controller.signal.aborted) setRequest({ status: 'success', data }); })
      .catch(() => { if (!controller.signal.aborted) setRequest({ status: 'error' }); });
    return () => controller.abort();
  }, [kind, language, search, attempt]);

  function reset() { setSearch(null); speech.stop(); }
  function submit(event) {
    event.preventDefault(); speech.stop();
    setSearch({ state, district: schemes ? '' : district, q: queryText.trim(), topic: schemes ? topic : '', page: 1 });
  }
  function paginate(page) { speech.stop(); setSearch({ ...search, page }); }
  const data = request.data;
  const title = schemes ? 'Browse more schemes' : kind === 'centres' ? 'Find One Stop Centre listings' : 'Find hospital listings';
  return <section className="source-explorer" aria-label={t(title)}>
    <h2>{t(title)}</h2>
    <p className="source-explorer-note">{options?.notice || data?.notice || t('Collected source listings; confirm current details with the official service.')}</p>
    <form onSubmit={submit} className="source-filters">
      <label>{t('State / Union Territory')}
        <select value={state} disabled={!options && !optionsError} onChange={(event) => { setState(event.target.value); setDistrict(''); reset(); }}>
          <option value="">{t(schemes ? 'All states' : 'Choose a state')}</option>
          {options?.states.map((value) => <option key={value} value={value}>{value === 'Central' ? t('National schemes') : value}</option>)}
        </select>
      </label>
      {!schemes && <label>{t('District')}
        <select value={district} disabled={!state || !options} onChange={(event) => { setDistrict(event.target.value); reset(); }}>
          <option value="">{t('Choose a district')}</option>
          {options?.districts.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>}
      <label>{t('Name or keyword')}
        <input value={queryText} maxLength={120} onChange={(event) => { setQueryText(event.target.value); reset(); }} placeholder={t('Optional search')} />
      </label>
      <button type="submit" className="home-btn" disabled={!options || (!schemes && (!state || !district))}>{t('Search listings')}</button>
    </form>
    {optionsError && <p role="alert">{t('Listings could not be loaded.')} <button type="button" onClick={() => setAttempt((value) => value + 1)}>{t('Try again')}</button></p>}
    {request.status === 'loading' && <p role="status">{t('Loading listings…')}</p>}
    {request.status === 'error' && <p role="alert">{t('Listings could not be loaded.')} <button type="button" onClick={() => setAttempt((value) => value + 1)}>{t('Try again')}</button></p>}
    {data && request.status === 'success' && <>
      <p role="status">{t('Matching listings')}: {data.total}</p>
      {data.records.length === 0 && <p>{t('No listings match these filters.')}</p>}
      <div className="directory-grid">{data.records.map((row) => <article key={row.id} className="directory-card">
        <h3>{row.name}</h3>
        <p className="source-status">{t(schemes ? 'Source snapshot — confirm on the official page' : 'Directory listing — details not reconfirmed')}</p>
        <p>{row.state}{row.district ? ` — ${row.district}` : ''}</p>
        {schemes ? <>
          <p>{t('Original source text: English')}</p>
          <p lang="en">{row.description}</p>
          <details><summary>{t('View collected details')}</summary>
            {[['Benefits', row.benefits], ['Eligibility', row.eligibility], ['How to apply', row.application], ['Documents', row.documents]].map(([label, text]) => text && <section key={label}><h4>{t(label)}</h4><p lang="en">{text}</p></section>)}
          </details>
          <div className="speech-controls"><button type="button" className="listen-btn" disabled={!canSpeakEnglish || speech.activeId === row.id}
            onClick={() => speech.start(row.id, ['This is collected source text. Confirm current rules on the official scheme page.', row.name, row.description, row.benefits, row.eligibility, row.application, row.documents].filter(Boolean).join('\n\n'), 'en')}>{t('Listen in English')}</button>
            <button type="button" className="stop-btn" disabled={speech.activeId !== row.id} onClick={speech.stop}>{t('Stop')}</button></div>
          <a href={row.officialUrl} target="_blank" rel="noopener noreferrer">{t('Open official source')}</a>
        </> : <>
          <p>{row.address || t('Address not provided in the source.')}</p>
          {row.reviewNotice && <p className="source-status">{row.reviewNotice} ({row.sourceCheckedOn})</p>}
          {row.phones.length > 0 && <p>{t('Listed phone — confirm first')}: {row.phones.join(' / ')}</p>}
          <a href={row.sourceUrl || data.sourceUrl} target="_blank" rel="noopener noreferrer">{t('Open official source')}</a>
        </>}
      </article>)}</div>
      {data.total > data.pageSize && <nav className="source-pagination" aria-label={t('Listing pages')}>
        <button type="button" disabled={data.page === 1} onClick={() => paginate(data.page - 1)}>{t('Previous')}</button>
        <span>{t('Page')} {data.page} / {Math.ceil(data.total / data.pageSize)}</span>
        <button type="button" disabled={data.page * data.pageSize >= data.total} onClick={() => paginate(data.page + 1)}>{t('Next')}</button>
      </nav>}
    </>}
  </section>;
}
