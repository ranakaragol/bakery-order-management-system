import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { formatCurrency, stockLabels } from "../../utils/formatters";

const ProductDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    api.get(`/products/${id}`).then(({ data }) => setProduct(data));
  }, [id]);

  if (!product) {
    return <div className="panel">Urun yukleniyor...</div>;
  }

  return (
    <section className="detail-layout">
      <img src={product.imageUrl} alt={product.name} className="detail-layout__image" />
      <div className="detail-layout__content">
        <span className="tag">{product.category?.name}</span>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <div className="detail-layout__facts">
          <strong>{formatCurrency(product.price)}</strong>
          <span>{stockLabels[product.stockStatus]}</span>
        </div>

        {user?.role === "customer" ? (
          <div className="quantity-box">
            <label htmlFor="quantity">Adet</label>
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
              onClick={() => addToCart(product._id, quantity)}
            >
              Sepete Ekle
            </button>
          </div>
        ) : (
          <div className="panel">
            Sepete eklemek ve siparis olusturmak icin <Link to="/login">giris yapin</Link>.
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductDetailPage;
