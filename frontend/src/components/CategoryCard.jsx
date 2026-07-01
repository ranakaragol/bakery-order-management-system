const CategoryCard = ({ category, active, onClick }) => (
  <button
    type="button"
    className={`category-card ${active ? "category-card--active" : ""}`}
    onClick={() => onClick?.(category.slug)}
  >
    <img src={category.imageUrl} alt={category.name} />
    <div>
      <h3>{category.name}</h3>
      <p>{category.description}</p>
    </div>
  </button>
);

export default CategoryCard;
