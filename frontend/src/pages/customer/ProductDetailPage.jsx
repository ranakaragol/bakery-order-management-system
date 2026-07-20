import { useEffect, useId, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { publicApi } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import FormMessage from "../../components/FormMessage";
import LoadingState from "../../components/LoadingState";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { getApiErrorMessage } from "../../utils/apiErrors";
import { fallbackProducts } from "../../utils/fallbackContent";
import {
  canOrderProduct,
  formatDeliveryFee,
  formatCurrency,
  formatLineTotal,
  formatProductPrice,
  formatQuantity,
  formatUnitPrice,
  getProductImage,
  hasProductVariants,
  isTrayOnlyProduct,
  stockLabels
} from "../../utils/formatters";
import {
  decrementQuantity,
  getDefaultQuantity,
  incrementQuantity,
  isValidQuantityForUnit,
  normalizeQuantity,
  sanitizeQuantity
} from "../../../../shared/commerce.js";

const ProductDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const quantityOutputId = useId();
  const [product, setProduct] = useState(null);
  const [pageStatus, setPageStatus] = useState("loading");
  const [pageError, setPageError] = useState("");
  const [quantity, setQuantity] = useState(getDefaultQuantity());
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [cartError, setCartError] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      setPageStatus("loading");
      setPageError("");

      try {
        const { data } = await publicApi.get(`/products/${id}`);

        if (cancelled) {
          return;
        }

        setProduct(data);
        setPageStatus("success");
      } catch (error) {
        if (cancelled) {
          return;
        }

        const fallbackProduct = fallbackProducts.find((item) => item._id === id) || null;

        setProduct(fallbackProduct);
        setPageStatus(fallbackProduct ? "success" : "error");
        setPageError(getApiErrorMessage(error, "Ürün bilgileri şu anda yüklenemiyor."));
      } finally {
        if (!cancelled) {
          setQuantity(getDefaultQuantity());
          setSelectedVariantId("");
          setCartError("");
        }
      }
    };

    loadProduct();

    return () => {
      cancelled = true;
    };
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

    setCartError("");
    const sanitizedQuantity = sanitizeQuantity(quantity);

    if (!Number.isFinite(sanitizedQuantity) || !isValidQuantityForUnit(sanitizedQuantity, product.unit)) {
      setCartError("Geçersiz miktar.");
      return;
    }

    try {
      setIsAddingToCart(true);
      await addToCart(product._id, normalizeQuantity(sanitizedQuantity, product.unit), selectedVariantId);
      navigate("/cart");
    } catch (error) {
      setCartError(getApiErrorMessage(error, "Ürün sepete eklenemedi."));
    } finally {
      setIsAddingToCart(false);
    }
  };

  const selectedVariant = hasProductVariants(product)
    ? product.variants.find((variant) => variant.id === selectedVariantId)
    : null;
  const resolvedPrice = selectedVariant ? formatCurrency(selectedVariant.price) : formatProductPrice(product);
  const requiresVariantSelection = hasProductVariants(product) && !selectedVariant;
  const resolvedUnit = selectedVariant ? "adet" : product?.unit;
  const lineTotal = selectedVariant
    ? formatLineTotal(selectedVariant.price, quantity)
    : hasProductVariants(product)
      ? null
      : canOrderProduct(product)
      ? formatLineTotal(product.price, quantity)
      : null;

  if (pageStatus === "loading") {
    return <LoadingState message="Ürün bilgileri yükleniyor..." />;
  }

  if (pageStatus === "error" && !product) {
    return <ErrorState message={pageError || "Ürün bilgileri yüklenemedi."} onRetry={() => window.location.reload()} />;
  }

  if (!product) {
    return (
      <EmptyState
        title="Ürün bulunamadı"
        description="Aradığınız ürün artık katalogda olmayabilir."
        actionLabel="Ürünlere Dön"
        actionTo="/products"
      />
    );
  }

  return (
    <section className="detail-layout">
      <img src={getProductImage(product)} alt={product.name} className="detail-layout__image" />
      <div className="detail-layout__content">
        <span className="tag">{product.category?.name}</span>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <FormMessage type="error" message={pageStatus === "success" ? "" : pageError} />
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
            <label htmlFor={quantityOutputId}>{product.unit === "Adet" ? "Adet" : "Miktar"}</label>
            <div className="quantity-stepper">
              <button
                type="button"
                className="ghost-button"
                aria-label={`${product.name} miktarını azalt`}
                onClick={() => setQuantity((current) => decrementQuantity(current, product.unit))}
                disabled={isAddingToCart}
              >
                -
              </button>
              <output id={quantityOutputId} className="quantity-stepper__value" aria-live="polite">
                {formatQuantity(quantity, resolvedUnit)}
              </output>
              <button
                type="button"
                className="ghost-button"
                aria-label={`${product.name} miktarını artır`}
                onClick={() => setQuantity((current) => incrementQuantity(current, product.unit))}
                disabled={isAddingToCart}
              >
                +
              </button>
            </div>
            <div className="detail-specs">
              <div className="detail-spec">
                <span>Birim fiyat</span>
                <strong>
                  {selectedVariant
                    ? resolvedPrice
                    : !hasProductVariants(product)
                      ? formatUnitPrice(product.price, product.unit)
                      : resolvedPrice}
                </strong>
              </div>
              {lineTotal && (
                <div className="detail-spec">
                  <span>Toplam</span>
                  <strong>{lineTotal}</strong>
                </div>
              )}
              <div className="detail-spec">
                <span>Teslimat</span>
                <strong>{formatDeliveryFee()}</strong>
              </div>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={handleAddToCart}
              disabled={requiresVariantSelection || isAddingToCart}
            >
              {isAddingToCart
                ? "Sepete ekleniyor..."
                : hasProductVariants(product)
                  ? "Boy Seçerek Sepete Ekle"
                  : "Sepete Ekle"}
            </button>
            {requiresVariantSelection && <p className="helper-text">Sepete eklemek için önce pasta boyunu seçin.</p>}
            <FormMessage type="error" message={cartError} />
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
