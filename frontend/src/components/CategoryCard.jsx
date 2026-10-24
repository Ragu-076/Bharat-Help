import './CategoryCard.css';
import { useLanguage } from '../translations/useLanguage.js';

function CategoryCard({ category, onClick }) {
  const { t } = useLanguage();
  return (
    <button className="category-card" onClick={() => onClick(category)}>
      <span className="category-icon">{category.icon}</span>
      <span className="category-label">{t(category.label)}</span>
      <span className="category-desc">{t(category.description)}</span>
    </button>
  );
}

export default CategoryCard;
