import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import CategoryCard from "../../components/CategoryCard";
import ProductCard from "../../components/ProductCard";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { fallbackCategories, fallbackProducts } from "../../utils/fallbackContent";

const ProductsPage = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [categories, setCategories] = useState(fallbackCategories);
  const [products, setProducts] = useState(fallbackProducts);
  const [usingFallback, setUsingFallback] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    search: ""
  });

  const loadProducts = async (nextFilters = filters) => {
    if (usingFallback) {
      const filteredProducts = fallbackProducts.filter((product) => {
        const matchesCategory = !nextFilters.category || product.category?.slug === nextFilters.category;
        const matchesSearch =
          !nextFilters.search ||
          `${product.name} ${product.description}`.toLowerCase().includes(nextFilters.search.toLowerCase());

        return matchesCategory && matchesSearch;
      });

      setProducts(filteredProducts);
      return;
    }

    try {
      const query = new URLSearchParams();

      if (nextFilters.category) {
        query.set("category", nextFilters.category);
      }

      if (nextFilters.search) {
        query.set("search", nextFilters.search);
      }

      const { data } = await api.get(`/products?${query.toString()}`);
      setProducts(data);
      setUsingFallback(false);
    } catch (error) {
      const filteredProducts = fallbackProducts.filter((product) => {
        const matchesCategory = !nextFilters.category || product.category?.slug === nextFilters.category;
        const matchesSearch =
          !nextFilters.search ||
          `${product.name} ${product.description}`.toLowerCase().includes(nextFilters.search.toLowerCase());

        return matchesCategory && matchesSearch;
      });

      setProducts(filteredProducts);
      setUsingFallback(true);
    }
  };

  useEffect(() => {
    Promise.all([api.get("/categories"), loadProducts()])
      .then(([categoriesResponse]) => {
        setCategories(categoriesResponse.data);
        setUsingFallback(false);
      })
      .catch(() => {
        setCategories(fallbackCategories);
        setProducts(fallbackProducts);
        setUsingFallback(true);
      });
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    loadProducts(filters);
  };

  const handleCategoryClick = (slug) => {
    const nextFilters = {
      ...filters,
      category: filters.category === slug ? "" : slug
    };
    setFilters(nextFilters);
    loadProducts(nextFilters);
  };

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
      <section className="page-header">
        <span className="eyebrow">Urunler</span>
        <h1>Ekler, magnolya ve porsiyonluk tatli secimleri</h1>
        <p>Kategori filtreleriyle gezinin, detaylari inceleyin ve giris yaptiysaniz sepetinize ekleyin.</p>
      </section>

      {usingFallback && (
        <div className="info-banner">
          Urun vitrininde su an ornek icerikler gosteriliyor. Canli veri baglantisi kuruldugunda liste otomatik
          olarak gercek urunlerle dolacak.
        </div>
      )}

      <form className="search-panel" onSubmit={handleSearch}>
        <input
          type="search"
          placeholder="Urun ara"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
        />
        <button type="submit" className="primary-button">
          Ara
        </button>
      </form>

      <div className="category-grid">
        {categories.map((category) => (
          <CategoryCard
            key={category._id}
            category={category}
            active={filters.category === category.slug}
            onClick={handleCategoryClick}
          />
        ))}
      </div>

      {products.length ? (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onAddToCart={handleAddToCart}
              disableCart={user?.role === "admin"}
            />
          ))}
        </div>
      ) : (
        <div className="panel">
          Aradiginiz filtrelere uygun urun bulunamadi. Farkli bir kategori secmeyi veya aramayi temizlemeyi deneyin.
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
