import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { fallbackProducts } from "../../utils/fallbackContent";
import {
  canOrderProduct,
  formatCurrency,
  formatProductPrice,
  getProductImage,
  hasProductVariants,
  isTrayOnlyProduct,
  stockLabels
} from "../../utils/formatters";

const ProductDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState("");

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        setProduct(data);
        setSelectedVariantId("");
      })
      .catch(() => {
        const fallbackProduct = fallbackProducts.find((item) => item._id === id);
        setProduct(fallbackProduct || null);
        setSelectedVariantId("");
      });
  }, [id]);

  const handleAddToCart = async () => {
    if (!canOrderProduct(product)) {
      return;
    }

    if (!user) {
      navigate(`/login?next=/products/${product._id}&intent=cart`);
      return;
    }

    if (user.role !== "customer") {
      return;
    }

    await addToCart(product._id, quantity, selectedVariantId);
  };

  const selectedVariant = hasProductVariants(product)
    ? product.variants.find((variant) => variant.id === selectedVariantId)
    : null;
  const resolvedPrice = selectedVariant ? formatCurrency(selectedVariant.price) : formatProductPrice(product);
  const requiresVariantSelection = hasProductVariants(product) && !selectedVariant;

  if (!product) {
    return <div className="panel">Ürün yükleniyor...</div>;
  }

  return (
    <section className="detail-layout">
      <img src={getProductImage(product)} alt={product.name} className="detail-layout__image" />
      <div className="detail-layout__content">
        <span className="tag">{product.category?.name}</span>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <div className="detail-layout__facts">
          <strong>{resolvedPrice}</strong>
          <span>{stockLabels[product.stockStatus]}</span>
        </div>
        {hasProductVariants(product) && (
          <div className="variant-picker">
            <span className="variant-picker__label">Pasta boyu seçin</span>
            <div className="variant-picker__options">
              {product.variants.map((variant) => (
                <label key={variant.id} className="variant-option">
                  <input
                    type="radio"
                    name="variant"
                    value={variant.id}
                    checked={selectedVariantId === variant.id}
                    onChange={(event) => setSelectedVariantId(event.target.value)}
                  />
                  <span>{variant.name}</span>
                  <strong>{formatCurrency(variant.price)}</strong>
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="detail-specs">
          <div className="detail-spec">
            <span>Birim</span>
            <strong>{product.unit || "Bilgi yok"}</strong>
          </div>
          {product.weight && (
            <div className="detail-spec">
              <span>Gramaj</span>
              <strong>{product.weight}</strong>
            </div>
          )}
          <div className="detail-spec">
            <span>Porsiyon</span>
            <strong>{product.portion || "Bilgi yok"}</strong>
          </div>
          <div className="detail-spec">
            <span>Raf ömrü</span>
            <strong>{product.shelfLife || "Bilgi yok"}</strong>
          </div>
          <div className="detail-spec">
            <span>Saklama</span>
            <strong>{product.storageCondition || "Bilgi yok"}</strong>
          </div>
          {product.catalogPage && (
            <div className="detail-spec">
              <span>Katalog</span>
              <strong>Sayfa {product.catalogPage}</strong>
            </div>
          )}
        </div>

        {isTrayOnlyProduct(product) && <div className="info-banner">Tekli satış bulunmamaktadır.</div>}

        {user?.role !== "admin" && canOrderProduct(product) ? (
          <div className="quantity-box">
            <label htmlFor="quantity">{product.unit === "Adet" ? "Adet" : "Miktar"}</label>
            <input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
            <button
              type="button"
              className="primary-button"
              onClick={handleAddToCart}
              disabled={requiresVariantSelection}
            >
              {hasProductVariants(product) ? "Boy Seçerek Sepete Ekle" : "Sepete Ekle"}
            </button>
            {requiresVariantSelection && <p className="helper-text">Sepete eklemek için önce pasta boyunu seçin.</p>}
            {!user && (
              <p className="helper-text">
                Sepete devam etmek için giriş veya kayıt adımına yönlendirilirsiniz.
              </p>
            )}
          </div>
        ) : !canOrderProduct(product) ? (
          <div className="panel">
            Bu ürün için fiyat teyidi gereklidir. Sipariş oluşturmadan önce mağazayla iletişime geçin.
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default ProductDetailPage;
