import { useEffect, useState } from "react";
import api from "../../api/client";
import CategoryCard from "../../components/CategoryCard";
import ProductCard from "../../components/ProductCard";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

const ProductsPage = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: "",
    search: ""
  });

  const loadProducts = async (nextFilters = filters) => {
    const query = new URLSearchParams();

    if (nextFilters.category) {
      query.set("category", nextFilters.category);
    }

    if (nextFilters.search) {
      query.set("search", nextFilters.search);
    }

    const { data } = await api.get(`/products?${query.toString()}`);
    setProducts(data);
  };

  useEffect(() => {
    Promise.all([api.get("/categories"), loadProducts()]).then(([categoriesResponse]) => {
      setCategories(categoriesResponse.data);
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

  return (
    <div className="stack-lg">
      <section className="page-header">
        <span className="eyebrow">Urunler</span>
        <h1>Pastalar, tatlilar ve kurabiye secimleri</h1>
        <p>Kategori filtreleriyle gezinin, detaylari inceleyin ve giris yaptiysaniz sepetinize ekleyin.</p>
      </section>

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

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onAddToCart={addToCart}
            disableCart={!user || user.role !== "customer"}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductsPage;
