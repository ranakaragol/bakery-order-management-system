import { Link, useNavigate } from "react-router-dom";
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

const CartPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, updateCartItem, removeCartItem, subtotal } = useCart();
  const totalAmount = calculateOrderTotal(subtotal, DELIVERY_FEE);

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

  return (
    <section className="stack-lg">
      <div className="page-header">
        <span className="eyebrow">Sepet</span>
        <h1>Seçilen ürünler</h1>
      </div>

      {!cart?.items?.length ? (
        <div className="panel">Sepetiniz boş.</div>
      ) : (
        <div className="cart-layout">
          <div className="stack-md">
            {cart.items.map((item) => (
              <article key={item._id} className="cart-item">
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
                    >
                      -
                    </button>
                    <span>{formatQuantity(item.quantity, item.unitSnapshot || item.product?.unit)}</span>
                    <button
                      type="button"
                      className="ghost-button"
                      aria-label={`${item.nameSnapshot} miktarını artır`}
                      onClick={() => handleQuantityChange(item, "increase")}
                    >
                      +
                    </button>
                  </div>
                </div>
                <button type="button" className="text-button" onClick={() => removeCartItem(item._id)}>
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
              <strong>{formatDeliveryFee(DELIVERY_FEE)}</strong>
            </div>
            <div className="summary-row">
              <span>Genel Toplam</span>
              <strong>{formatCurrency(totalAmount)}</strong>
            </div>
            <button type="button" className="primary-button" onClick={() => navigate("/checkout")}>
              Ödemeye Geç
            </button>
          </aside>
        </div>
      )}
    </section>
  );
};

export default CartPage;
