import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { fallbackProducts } from "../../utils/fallbackContent";
import { formatCurrency, stockLabels } from "../../utils/formatters";

const ProductDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then(({ data }) => setProduct(data))
      .catch(() => {
        const fallbackProduct = fallbackProducts.find((item) => item._id === id);
        setProduct(fallbackProduct || null);
      });
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate(`/login?next=/products/${product._id}&intent=cart`);
      return;
    }

    if (user.role !== "customer") {
      return;
    }

    await addToCart(product._id, quantity);
  };

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

        {user?.role !== "admin" ? (
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
              onClick={handleAddToCart}
            >
              Sepete Ekle
            </button>
            {!user && (
              <p className="helper-text">
                Sepete devam etmek icin giris veya kayit adimina yonlendirilirsiniz.
              </p>
            )}
          </div>
        ) : (
          <div className="panel">
            Admin hesaplari siparis vermez. Musteri akisini test etmek icin musteri girisi kullanin.
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductDetailPage;
