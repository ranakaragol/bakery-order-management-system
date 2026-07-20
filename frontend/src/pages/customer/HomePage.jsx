import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { publicApi } from "../../api/client";
import CategoryCard from "../../components/CategoryCard";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import FormMessage from "../../components/FormMessage";
import LoadingState from "../../components/LoadingState";
import ProductCard from "../../components/ProductCard";
import { useAuth } from "../../context/AuthContext";
import { pasaliBrand } from "../../data/pasaliCatalog";
import { useCart } from "../../context/CartContext";
import { getApiErrorMessage } from "../../utils/apiErrors";
import {
  fallbackCategories,
  fallbackContactInfo,
  fallbackProducts,
  mergeSiteContent
} from "../../utils/fallbackContent";
import { resolveCatalogSnapshot } from "../../utils/catalogFilters";

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
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const resolvedContactInfo = mergeSiteContent(data.contactInfo);
  const paymentDetails = resolvedContactInfo.paymentDetails;

  const loadHomeData = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const { data: response } = await publicApi.get("/public/home");
      const resolvedCatalog = resolveCatalogSnapshot({
        apiCategories: response.categories,
        apiProducts: response.featuredProducts,
        fallbackCategories,
        fallbackProducts: fallbackProducts.filter((product) => product.featured)
      });

      setData({
        hero: response.hero || fallbackHomeData.hero,
        categories: resolvedCatalog.categories,
        featuredProducts: resolvedCatalog.products,
        contactInfo: response.contactInfo || fallbackHomeData.contactInfo
      });
    } catch (error) {
      setData(fallbackHomeData);
      setErrorMessage(getApiErrorMessage(error, "Ana sayfa içerikleri şu anda yüklenemiyor."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const handleAddToCart = async (product) => {
    setCartMessage("");

    if (!user) {
      navigate(`/login?next=/products/${product._id}&intent=cart`);
      return;
    }

    if (user.role !== "customer") {
      return;
    }

    try {
      await addToCart(product._id);
      navigate("/cart");
    } catch (error) {
      setCartMessage(getApiErrorMessage(error, "Ürün sepete eklenemedi."));
    }
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

          <div className="hero-payment-card">
            <div className="section-heading">
              <span className="eyebrow">Ödeme Bilgileri</span>
              <h2>Havale & EFT ile ödeme</h2>
            </div>
            <div className="hero-payment-grid">
              <div className="hero-payment-item">
                <span>IBAN Ad Soyad</span>
                <strong>{paymentDetails.accountHolder}</strong>
              </div>
              <div className="hero-payment-item">
                <span>Banka Adı</span>
                <strong>{paymentDetails.bankName}</strong>
              </div>
              <div className="hero-payment-item hero-payment-item--iban">
                <span>IBAN</span>
                <strong>{paymentDetails.iban}</strong>
              </div>
            </div>
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

      <FormMessage type="error" message={cartMessage} />
      {errorMessage && <ErrorState message={errorMessage} onRetry={loadHomeData} />}

      <section className="content-section">
        <div className="section-heading section-heading--ruled">
          <span className="eyebrow">Kategoriler</span>
          <h2>Ürün kategorileri</h2>
          <span className="section-heading__rule" aria-hidden="true" />
        </div>
        {isLoading ? (
          <LoadingState message="Kategori bilgileri yükleniyor..." compact />
        ) : data.categories.length ? (
          <div className="category-grid">
            {data.categories.map((category) => (
              <CategoryCard key={category._id} category={category} />
            ))}
          </div>
        ) : (
          <EmptyState title="Kategori bulunamadı" description="Şu anda görüntülenecek kategori bulunmuyor." compact />
        )}
      </section>

      <div className="section-divider" aria-hidden="true" />

      <section className="content-section">
        <div className="section-heading">
          <span className="eyebrow">Ürünler</span>
          <h2>Öne çıkan tatlar</h2>
        </div>
        {isLoading ? (
          <LoadingState message="Öne çıkan ürünler yükleniyor..." compact />
        ) : data.featuredProducts.length ? (
          <div className="product-grid">
            {data.featuredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onAddToCart={handleAddToCart}
                disableCart={user?.role === "admin"}
                readOnly={user?.role === "admin"}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="Öne çıkan ürün bulunamadı" description="Ürünler sayfasından tüm kataloğu inceleyebilirsiniz." actionLabel="Ürünleri İncele" actionTo="/products" compact />
        )}
      </section>
    </div>
  );
};

export default HomePage;
