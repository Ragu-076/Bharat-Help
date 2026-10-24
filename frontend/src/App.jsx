import { useEffect, useRef } from 'react';
import './App.css';
import CategoryCard from './components/CategoryCard';
import ClueSelector from './components/ClueSelector';
import ResultsPage from './components/ResultsPage';
import VoiceSearch from './components/VoiceSearch';
import { categories } from './services/helpService.js';
import useHelp from './hooks/useHelp.js';
import useNavigation from './hooks/useNavigation.js';
import { useLanguage } from './translations/useLanguage.js';
import { languages } from './translations/translations.js';

function App() {
  const { t, language, setLanguage } = useLanguage();
  const [route, navigate, back] = useNavigation();
  const { screen, categoryId, clues: selectedClues } = route;
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const request = useHelp(categoryId, selectedClues, screen === 'results', language);
  const mainRef = useRef(null);

  useEffect(() => {
    mainRef.current?.focus();
    window.scrollTo(0, 0);
  }, [screen, categoryId]);

  function handleCategoryClick(category) {
    navigate({ screen: 'clues', categoryId: category.id, clues: [] });
  }

  function handleToggleClue(clue) {
    const clues = selectedClues.includes(clue)
      ? selectedClues.filter((item) => item !== clue)
      : [...selectedClues, clue];
    navigate({ ...route, clues }, { replace: true });
  }

  function handleFindHelp() {
    if (selectedClues.length) navigate({ ...route, screen: 'results' });
  }

  function handleVoiceSelection({ categoryId: nextCategoryId, clues }) {
    const keepSelection = screen === 'clues' && categoryId === nextCategoryId;
    navigate({ screen: 'clues', categoryId: nextCategoryId,
      clues: keepSelection ? [...new Set([...selectedClues, ...clues])] : clues,
    }, { replace: keepSelection });
  }

  function handleBackToClues() {
    back({ ...route, screen: 'clues' });
  }

  function handleHome() {
    navigate({ screen: 'home' });
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <button type="button" className="header-left" onClick={handleHome} aria-label={t('Bharat Help home')}>
          <span className="logo-flag">🇮🇳</span>
          <span className="logo-text">{t('Bharat Help')}</span>
        </button>
        <label className="language-picker">
          <span>{t('Language')}</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            {languages.map(({ code, label }) => <option key={code} value={code} lang={code}>{label}</option>)}
          </select>
        </label>
      </header>

      <main className="main-content" ref={mainRef} tabIndex={-1}>
        {screen === 'home' && (
          <div className="home-page">
            <div className="hero">
              <h1>{t('Find the right help, without searching multiple websites.')}</h1>
              <p>
                {t("Select your situation below. We'll show you emergency contacts, your legal rights, and government schemes — all in one place.")}
              </p>
            </div>

            <VoiceSearch onSelect={handleVoiceSelection} />

            <h2 className="section-title">{t('What do you need help with?')}</h2>

            <div className="category-grid">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onClick={handleCategoryClick}
                />
              ))}
            </div>

            <div className="how-it-works">
              <h2 className="section-title">{t('How it works')}</h2>
              <div className="steps">
                <div className="step">
                  <div className="step-num">1</div>
                  <p>{t('Pick a category')}</p>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <div className="step-num">2</div>
                  <p>{t('Select clues about your situation')}</p>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <div className="step-num">3</div>
                  <p>{t('Get relevant help info')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {screen === 'clues' && selectedCategory && (
          <ClueSelector
            category={selectedCategory}
            selectedClues={selectedClues}
            onToggleClue={handleToggleClue}
            onFindHelp={handleFindHelp}
            onVoiceSelect={handleVoiceSelection}
            onBack={() => back({ screen: 'home' })}
          />
        )}

        {screen === 'results' && (
          <ResultsPage
            categoryId={categoryId}
            results={request.data?.results || []}
            unmatchedClues={request.data?.unmatchedClues || []}
            unmatchedClueLabels={request.data?.unmatchedClueLabels}
            selectedClueLabels={request.data?.selectedClueLabels}
            status={request.status}
            onRetry={request.retry}
            isSchemes={categoryId === 'government-schemes'}
            isCommonHealth={categoryId === 'common-health'}
            categoryLabel={selectedCategory?.label || ''}
            selectedClues={selectedClues}
            onBack={handleBackToClues}
            onHome={handleHome}
          />
        )}
      </main>

      <footer className="footer">
        <p>{t('Bharat Help — Pinnacle Project')}</p>
      </footer>
    </div>
  );
}

export default App;
