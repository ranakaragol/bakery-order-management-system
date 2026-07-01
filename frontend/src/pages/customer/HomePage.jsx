import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import CategoryCard from "../../components/CategoryCard";
import ProductCard from "../../components/ProductCard";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

const HomePage = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [data, setData] = useState({
    hero: null,
    categories: [],
    featuredProducts: [],
    contactInfo: null
  });

  useEffect(() => {
    api.get("/public/home").then(({ data: response }) => setData(response));
  }, []);

  return (
    <div className="stack-lg">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Butik Pastacilik Deneyimi</span>
          <h1>{data.hero?.title || "Kutlamalari zarafetle tatlandiran tasarimlar"}</h1>
          <p>
            {data.hero?.description ||
              "Ozel gunler, kurumsal davetler ve gundelik keyifler icin tasarlanmis premium urun seckisi."}
          </p>
          <div className="hero-actions">
            <Link to="/products" className="primary-button">
              Kategorileri Incele
            </Link>
            {!user && (
              <Link to="/register" className="ghost-button">
                Uyelik Olustur
              </Link>
            )}
          </div>
        </div>

        <div className="hero-card">
          <p>One Cikan Hizmetler</p>
          <ul className="inline-list">
            <li>Butik pasta tasarimi</li>
            <li>Kurumsal siparis operasyonu</li>
            <li>Ayni gun teslimat planlamasi</li>
          </ul>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <span className="eyebrow">Kategoriler</span>
          <h2>Her kutlama icin ayri bir vitrin</h2>
        </div>
        <div className="category-grid">
          {data.categories.map((category) => (
            <CategoryCard key={category._id} category={category} />
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <span className="eyebrow">Secili Urunler</span>
          <h2>En cok tercih edilen tasarimlar</h2>
        </div>
        <div className="product-grid">
          {data.featuredProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onAddToCart={addToCart}
              disableCart={!user || user.role !== "customer"}
            />
          ))}
        </div>
      </section>

      <section className="contact-band">
        <div>
          <span className="eyebrow">Iletisim</span>
          <h2>Siparis oncesi ekibimizle gorusun</h2>
        </div>
        <div className="contact-band__grid">
          <div>
            <strong>Telefon</strong>
            <p>{data.contactInfo?.phone}</p>
          </div>
          <div>
            <strong>E-posta</strong>
            <p>{data.contactInfo?.email}</p>
          </div>
          <div>
            <strong>Adres</strong>
            <p>{data.contactInfo?.address}</p>
          </div>
          <div>
            <strong>Sosyal Medya</strong>
            <p>{data.contactInfo?.socialLinks?.instagram}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
