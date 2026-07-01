import { Link } from "react-router-dom";
import { formatCurrency, stockLabels } from "../utils/formatters";

const ProductCard = ({ product, onAddToCart, disableCart }) => (
  <article className="product-card">
    <img src={product.imageUrl} alt={product.name} className="product-card__image" />
    <div className="product-card__body">
      <span className="tag">{product.category?.name || "Kategori"}</span>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <div className="product-card__meta">
        <strong>{formatCurrency(product.price)}</strong>
        <span>{stockLabels[product.stockStatus] || product.stockStatus}</span>
      </div>
      <div className="product-card__actions">
        <Link to={`/products/${product._id}`} className="ghost-button">
          Detay
        </Link>
        <button
          type="button"
          className="primary-button"
          disabled={disableCart || product.stockStatus === "out_of_stock"}
          onClick={() => onAddToCart?.(product)}
        >
          Sepete Ekle
        </button>
      </div>
    </div>
  </article>
);

export default ProductCard;
