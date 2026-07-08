import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/client";
import CategoryCard from "../../components/CategoryCard";
import ProductCard from "../../components/ProductCard";
import { useAuth } from "../../context/AuthContext";
import { pasaliBrand } from "../../data/pasaliCatalog";
import { useCart } from "../../context/CartContext";
import {
  fallbackCategories,
  fallbackContactInfo,
  fallbackProducts
} from "../../utils/fallbackContent";

const fallbackHomeData = {
  hero: {
    title: "Lezzetin ve ustalığın buluştuğu özel tatlar.",
    description: "Paşalı Patiserrie'nin özenle hazırlanan ürünlerini inceleyin."
  },
  categories: fallbackCategories,
  featuredProducts: fallbackProducts.filter((product) => product.featured),
  contactInfo: fallbackContactInfo
};

const HomePage = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [data, setData] = useState(fallbackHomeData);

  useEffect(() => {
    api
      .get("/public/home")
      .then(({ data: response }) => {
        setData({
          hero: response.hero || fallbackHomeData.hero,
          categories: response.categories?.length ? response.categories : fallbackHomeData.categories,
          featuredProducts: response.featuredProducts?.length
            ? response.featuredProducts
            : fallbackHomeData.featuredProducts,
          contactInfo: response.contactInfo || fallbackHomeData.contactInfo
        });
      })
      .catch(() => {
        setData(fallbackHomeData);
      });
  }, []);

  const handleAddToCart = async (product) => {
    if (!user) {
      navigate(`/login?next=/products/${product._id}&intent=cart`);
      return;
    }

    if (user.role !== "customer") {
      return;
    }

    await addToCart(product._id);
  };

  return (
    <div className="stack-lg">
      <section className="hero-panel" id="hakkimizda">
        <div className="hero-copy">
          <span className="eyebrow">Paşalı Patiserrie</span>
          <h1>{data.hero?.title}</h1>
          <p>{data.hero?.description}</p>
          <div className="hero-actions">
            <Link to="/products" className="primary-button">
              Ürünleri İncele
            </Link>
          </div>
        </div>

        <aside className="hero-card hero-card--editorial">
          <span className="tag tag--dark">Paşalı</span>
          <h3>{pasaliBrand.name}</h3>
          <img src={pasaliBrand.logo} alt={pasaliBrand.name} className="hero-card__brand-image" />
          <p>{pasaliBrand.tagline}</p>
          <div className="hero-note">{pasaliBrand.motto}</div>
        </aside>
      </section>

      <section className="content-section">
        <div className="section-heading section-heading--ruled">
          <span className="eyebrow">Kategoriler</span>
          <h2>Ürün kategorileri</h2>
          <span className="section-heading__rule" aria-hidden="true" />
        </div>
        <div className="category-grid">
          {data.categories.map((category) => (
            <CategoryCard key={category._id} category={category} />
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <span className="eyebrow">Ürünler</span>
          <h2>Öne çıkan tatlar</h2>
        </div>
        <div className="product-grid">
          {data.featuredProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onAddToCart={handleAddToCart}
              disableCart={user?.role === "admin"}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
