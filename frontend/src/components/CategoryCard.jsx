import { Link } from "react-router-dom";

const CategoryCard = ({ category, active, onClick }) => {
  const content = (
    <>
      <img src={category.imageUrl} alt={category.name} />
      <div>
        <h3>{category.name}</h3>
        <p>{category.description}</p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`category-card ${active ? "category-card--active" : ""}`}
        onClick={() => onClick(category)}
      >
        {content}
      </button>
    );
  }

  return (
    <Link className="category-card" to={`/products?category=${encodeURIComponent(category.name)}`}>
      {content}
    </Link>
  );
};

export default CategoryCard;
