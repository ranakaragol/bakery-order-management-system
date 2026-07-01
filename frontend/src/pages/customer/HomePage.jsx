import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/client";
import CategoryCard from "../../components/CategoryCard";
import ProductCard from "../../components/ProductCard";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import {
  fallbackCategories,
  fallbackContactInfo,
  fallbackProducts
} from "../../utils/fallbackContent";

const fallbackHomeData = {
  hero: {
    title: "Kutlamalari zarafetle tatlandiran tasarimlar",
    description:
      "Ozel gunler, kurumsal davetler ve gundelik keyifler icin tasarlanmis premium urun seckisi."
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
  const [usingFallback, setUsingFallback] = useState(false);

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
        setUsingFallback(false);
      })
      .catch(() => {
        setData(fallbackHomeData);
        setUsingFallback(true);
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
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Butik Pastacilik Deneyimi</span>
          <h1>{data.hero?.title}</h1>
          <p>{data.hero?.description}</p>
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
          <div className="hero-stat-grid">
            <div className="hero-stat">
              <strong>24 saat</strong>
              <span>On siparis planlama hizi</span>
            </div>
            <div className="hero-stat">
              <strong>4 kategori</strong>
              <span>Gercek vitrindeki ana urun gruplari</span>
            </div>
            <div className="hero-stat">
              <strong>Ayni gun</strong>
              <span>Sehir ici teslimat planlamasi</span>
            </div>
          </div>
        </div>

        <aside className="hero-card hero-card--editorial">
          <span className="tag tag--dark">Sezon vitrini</span>
          <h3>Bu hafta en cok ilgi goren tatli vitrini</h3>
          <div className="hero-editorial-tiles">
            <div className="editorial-tile">
              <span>01</span>
              <p>Taze cikolata ve dolgu kremali eklerler</p>
            </div>
            <div className="editorial-tile">
              <span>02</span>
              <p>Meyveli magnolya bardaklari</p>
            </div>
            <div className="editorial-tile">
              <span>03</span>
              <p>Tek kisilik ve lokmalik servis urunleri</p>
            </div>
          </div>
          <div className="hero-note">
            Tasarim, uretim ve teslimat adimlari tek panelde yonetilecek sekilde kurgulandi.
          </div>
        </aside>
      </section>

      {usingFallback && (
        <div className="info-banner">
          Canli API verisi su an ulasilabilir degil. Gorunum on izlemesinde vitrin icerikleri ornek verilerle
          gosteriliyor.
        </div>
      )}

      <section className="atelier-grid">
        <article className="story-card">
          <span className="eyebrow">Marka Dili</span>
          <h2>Atelier hissi veren, kutlamaya hazir bir deneyim</h2>
          <p>
            Arayuz dili; premium ama sicak, modern ama ulasilabilir bir pastacilik markasi hissi verecek sekilde
            kurgulandi.
          </p>
        </article>
        <article className="promise-card">
          <div className="promise-item">
            <strong>Tasarla</strong>
            <p>Pasta turune gore filtrelenebilen modern urun vitrini.</p>
          </div>
          <div className="promise-item">
            <strong>Siparis Ver</strong>
            <p>Uyelikten sonra sepet ve odeme akisiyla hizli siparis tamamlama.</p>
          </div>
          <div className="promise-item">
            <strong>Takip Et</strong>
            <p>Musteri ve yonetici icin ayri siparis takibi ve durum guncelleme.</p>
          </div>
        </article>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <span className="eyebrow">Kategoriler</span>
          <h2>Gunluk vitrini urun tipine gore kesfedin</h2>
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
          <h2>En cok talep goren urunler</h2>
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

      <section className="journey-strip">
        <div className="journey-step">
          <span>1</span>
          <h3>Kategori secin</h3>
          <p>Ekler, magnolya, tek kisilik pasta veya lokmalik tatlilar arasindan ilerleyin.</p>
        </div>
        <div className="journey-step">
          <span>2</span>
          <h3>Sepeti olusturun</h3>
          <p>Urunleri miktar bazli duzenleyip toplam tutari anlik olarak gorun.</p>
        </div>
        <div className="journey-step">
          <span>3</span>
          <h3>Siparisi yonetin</h3>
          <p>Admin panelinde siparis durumlari ve musteri detaylari tek akista yonetilir.</p>
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
