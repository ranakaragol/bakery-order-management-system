import { Link } from "react-router-dom";
import { buildCategoryQueryValue } from "../utils/catalogFilters";

const CategoryCard = ({ category, active, onClick }) => {
  const categoryQueryValue = buildCategoryQueryValue(category);
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
    <Link
      className="category-card"
      to={categoryQueryValue ? `/products?category=${encodeURIComponent(categoryQueryValue)}` : "/products"}
    >
      {content}
    </Link>
  );
};

export default CategoryCard;
