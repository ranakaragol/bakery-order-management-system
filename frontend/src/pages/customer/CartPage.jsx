import { Link, useNavigate } from "react-router-dom";
import EmptyState from "../../components/EmptyState";
import FormMessage from "../../components/FormMessage";
import LoadingState from "../../components/LoadingState";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import {
  formatCurrency,
  formatDeliveryFee,
  formatLineTotal,
  formatQuantity,
  formatUnitPrice
} from "../../utils/formatters";
import {
  DELIVERY_FEE,
  calculateOrderTotal,
  decrementQuantity,
  incrementQuantity,
  normalizeQuantity,
  sanitizeQuantity
} from "../../../../shared/commerce.js";
import { getRegionalOrderNotice } from "../../utils/orderMinimums";

const CartPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, updateCartItem, removeCartItem, subtotal, refreshing, error, isItemPending } = useCart();
  const minimumOrderNotice = getRegionalOrderNotice(user?.deliveryAddress, subtotal, DELIVERY_FEE);
  const totalAmount = calculateOrderTotal(subtotal, minimumOrderNotice.deliveryFee);

  const handleQuantityChange = async (item, direction) => {
    const resolvedUnit = item.unitSnapshot || item.product?.unit;
    const currentQuantity = sanitizeQuantity(item.quantity);
    const nextQuantity =
      direction === "increase"
        ? incrementQuantity(currentQuantity, resolvedUnit)
        : decrementQuantity(currentQuantity, resolvedUnit);

    await updateCartItem(item._id, normalizeQuantity(nextQuantity, resolvedUnit));
  };

  if (!user) {
    return (
      <section className="panel">
        Sepetinizi görmek için önce <Link to="/login">giriş yapın</Link>.
      </section>
    );
  }

  if (!cart && refreshing) {
    return <LoadingState message="Sepetiniz yükleniyor..." />;
  }

  return (
    <section className="stack-lg">
      <div className="page-header">
        <span className="eyebrow">Sepet</span>
        <h1>Seçilen ürünler</h1>
      </div>

      {refreshing && cart?.items?.length ? <LoadingState message="Sepetiniz güncelleniyor..." compact /> : null}
      <FormMessage type="error" message={error} />

      {!cart?.items?.length ? (
        <EmptyState
          title="Sepetiniz şu anda boş"
          description="Siparişe başlamak için ürünleri inceleyip sepetinize ekleyebilirsiniz."
          actionLabel="Ürünleri İncele"
          actionTo="/products"
        />
      ) : (
        <div className="cart-layout">
          <div className="stack-md">
            {cart.items.map((item) => (
              <article key={item._id} className="cart-item" aria-busy={isItemPending(item._id)}>
                <img src={item.imageUrlSnapshot} alt={item.nameSnapshot} />
                <div className="cart-item__content">
                  <h3>
                    <Link to={`/products/${item.product?._id || item.product}`} className="cart-item__title-link">
                      {item.nameSnapshot}
                    </Link>
                  </h3>
                  <p>{formatUnitPrice(item.unitPrice, item.unitSnapshot || item.product?.unit)}</p>
                  <p>Toplam: {formatLineTotal(item.unitPrice, item.quantity)}</p>
                  <div className="quantity-inline quantity-inline--stepper">
                    <button
                      type="button"
                      className="ghost-button"
                      aria-label={`${item.nameSnapshot} miktarını azalt`}
                      onClick={() => handleQuantityChange(item, "decrease")}
                      disabled={isItemPending(item._id)}
                    >
                      -
                    </button>
                    <span>{formatQuantity(item.quantity, item.unitSnapshot || item.product?.unit)}</span>
                    <button
                      type="button"
                      className="ghost-button"
                      aria-label={`${item.nameSnapshot} miktarını artır`}
                      onClick={() => handleQuantityChange(item, "increase")}
                      disabled={isItemPending(item._id)}
                    >
                      +
                    </button>
                  </div>
                  {isItemPending(item._id) ? <p className="helper-text">Ürün satırı güncelleniyor...</p> : null}
                </div>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => removeCartItem(item._id)}
                  disabled={isItemPending(item._id)}
                >
                  Kaldır
                </button>
              </article>
            ))}
          </div>

          <aside className="summary-card">
            <h2>Sepet Özeti</h2>
            <div className="summary-row">
              <span>Ara Toplam</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            <div className="summary-row">
              <span>Teslimat</span>
              <strong>{formatDeliveryFee(minimumOrderNotice.deliveryFee)}</strong>
            </div>
            <div className="summary-row">
              <span>Genel Toplam</span>
              <strong>{formatCurrency(totalAmount)}</strong>
            </div>
            {minimumOrderNotice.isBlocked && (
              <div className="stack-sm">
                <p className="error-text">{minimumOrderNotice.warningMessage}</p>
                <p>{minimumOrderNotice.shortfallMessage}</p>
              </div>
            )}
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate("/checkout")}
              disabled={minimumOrderNotice.isBlocked}
              aria-describedby={minimumOrderNotice.isBlocked ? "cart-checkout-reason" : undefined}
            >
              {minimumOrderNotice.isBlocked ? "Sepet tutarı tamamlanmalı" : "Ödemeye Geç"}
            </button>
            {minimumOrderNotice.isBlocked ? (
              <p id="cart-checkout-reason" className="helper-text">
                Checkout için gereken ek tutar: {minimumOrderNotice.shortfallMessage}
              </p>
            ) : null}
          </aside>
        </div>
      )}
    </section>
  );
};

export default CartPage;
