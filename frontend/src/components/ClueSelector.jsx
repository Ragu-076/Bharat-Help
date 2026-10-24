import './ClueSelector.css';
import { useLanguage } from '../translations/useLanguage.js';
import VoiceSearch from './VoiceSearch.jsx';

function ClueSelector({ category, selectedClues, onToggleClue, onFindHelp, onBack, onVoiceSelect }) {
  const { t } = useLanguage();
  return (
    <div className="clue-selector">
      <button className="back-btn" onClick={onBack}>{t('← Back')}</button>

      <div className="clue-header">
        <span className="clue-header-icon">{category.icon}</span>
        <h1>{t(category.label)}</h1>
        <p className="clue-subtitle">{t('What is happening? Select all that apply.')}</p>
      </div>

      <VoiceSearch categoryId={category.id} onSelect={onVoiceSelect} />

      <div className="clue-grid">
        {category.clues.map((clue) => {
          const isSelected = selectedClues.includes(clue);
          return (
            <button
              key={clue}
              type="button"
              aria-pressed={isSelected}
              className={`clue-btn ${isSelected ? 'clue-btn--selected' : ''}`}
              onClick={() => onToggleClue(clue)}
            >
              {isSelected && <span className="clue-check">✓</span>}
              {t(clue)}
            </button>
          );
        })}
      </div>

      {selectedClues.length > 0 && (
        <button className="find-help-btn" onClick={onFindHelp}>
          {t('Find Help →')}
        </button>
      )}

      {selectedClues.length === 0 && (
        <p className="clue-hint">{t('Select one or more options above to continue')}</p>
      )}
    </div>
  );
}

export default ClueSelector;
