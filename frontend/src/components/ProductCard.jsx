import { Link } from "react-router-dom";
import {
  canOrderProduct,
  formatProductPrice,
  getProductImage,
  hasProductVariants,
  stockLabels
} from "../utils/formatters";

const ProductCard = ({ product, onAddToCart, disableCart, readOnly = false }) => (
  <article className="product-card">
    <Link to={`/products/${product._id}`} className="product-card__media-link" aria-label={`${product.name} detayını aç`}>
      <img src={getProductImage(product)} alt={product.name} className="product-card__image" />
    </Link>
    <div className="product-card__body">
      <span className="tag">{product.category?.name || "Kategori"}</span>
      <h3>
        <Link to={`/products/${product._id}`} className="product-card__title-link">
          {product.name}
        </Link>
      </h3>
      <div className="product-card__meta">
        <strong>{formatProductPrice(product)}</strong>
        {product.stockStatus && product.stockStatus !== "in_stock" && (
          <span>{stockLabels[product.stockStatus] || product.stockStatus}</span>
        )}
      </div>
      <div className="product-card__actions">
        <Link to={`/products/${product._id}`} className="ghost-button">
          Detay
        </Link>
        {!readOnly &&
          (hasProductVariants(product) ? (
            <Link to={`/products/${product._id}`} className="primary-button">
              Boy Seç
            </Link>
          ) : (
            <button
              type="button"
              className="primary-button"
              disabled={disableCart || product.stockStatus === "out_of_stock" || !canOrderProduct(product)}
              onClick={() => onAddToCart?.(product)}
            >
              {canOrderProduct(product) ? "Sepete Ekle" : "Fiyat Sorunuz"}
            </button>
          ))}
      </div>
    </div>
  </article>
);

export default ProductCard;
