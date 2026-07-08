import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../utils/formatters";

const CartPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, updateCartItem, removeCartItem, subtotal } = useCart();

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
                  <h3>{item.nameSnapshot}</h3>
                  <p>{formatCurrency(item.unitPrice)}</p>
                  <p>Satır toplamı: {formatCurrency(item.unitPrice * item.quantity)}</p>
                  <div className="quantity-inline">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => updateCartItem(item._id, Math.max(1, item.quantity - 1))}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => updateCartItem(item._id, item.quantity + 1)}
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
            <p>2500 TL ve üzeri siparişlerde teslimat ücretsizdir.</p>
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
