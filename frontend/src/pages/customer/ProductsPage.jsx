import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState(fallbackCategories);
  const [products, setProducts] = useState(fallbackProducts);
  const [usingFallback, setUsingFallback] = useState(false);
  const initialFilters = useMemo(() => {
    const categoryQuery = searchParams.get("category") || "";
    const matchedCategory = fallbackCategories.find(
      (category) =>
        category.slug.toLocaleLowerCase("tr-TR") === categoryQuery.toLocaleLowerCase("tr-TR") ||
        category.name.toLocaleLowerCase("tr-TR") === categoryQuery.toLocaleLowerCase("tr-TR")
    );

    return {
      category: matchedCategory?.slug || "",
      search: searchParams.get("search") || ""
    };
  }, [searchParams]);
  const [filters, setFilters] = useState(initialFilters);

  const matchesSearchFilter = (product, searchTerm) => {
    if (!searchTerm) {
      return true;
    }

    const haystack = `${product.name} ${product.description}`.toLocaleLowerCase("tr-TR");
    return haystack.includes(searchTerm.toLocaleLowerCase("tr-TR"));
  };

  const loadProducts = async (nextFilters = filters) => {
    if (usingFallback) {
      const filteredProducts = fallbackProducts.filter((product) => {
        const matchesCategory = !nextFilters.category || product.category?.slug === nextFilters.category;
        const matchesSearch = matchesSearchFilter(product, nextFilters.search);

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
        const matchesSearch = matchesSearchFilter(product, nextFilters.search);

        return matchesCategory && matchesSearch;
      });

      setProducts(filteredProducts);
      setUsingFallback(true);
    }
  };

  useEffect(() => {
    setFilters(initialFilters);
    Promise.all([api.get("/categories"), loadProducts(initialFilters)])
      .then(([categoriesResponse]) => {
        setCategories(categoriesResponse.data);
        setUsingFallback(false);
      })
      .catch(() => {
        setCategories(fallbackCategories);
        loadProducts(initialFilters);
        setUsingFallback(true);
      });
  }, [initialFilters]);

  const handleSearch = (event) => {
    event.preventDefault();
    const nextParams = new URLSearchParams(searchParams);

    if (filters.category) {
      const selectedCategory = categories.find((category) => category.slug === filters.category);
      nextParams.set("category", selectedCategory?.name || filters.category);
    } else {
      nextParams.delete("category");
    }

    if (filters.search) {
      nextParams.set("search", filters.search);
    } else {
      nextParams.delete("search");
    }

    setSearchParams(nextParams);
    loadProducts(filters);
  };

  const handleCategoryClick = (category) => {
    const nextFilters = {
      ...filters,
      category: filters.category === category.slug ? "" : category.slug
    };
    setFilters(nextFilters);
    const nextParams = new URLSearchParams(searchParams);

    if (nextFilters.category) {
      nextParams.set("category", category.name);
    } else {
      nextParams.delete("category");
    }

    if (nextFilters.search) {
      nextParams.set("search", nextFilters.search);
    } else {
      nextParams.delete("search");
    }

    setSearchParams(nextParams);
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
        <span className="eyebrow">Ürünler</span>
        <h1>Paşalı ürünlerini inceleyin</h1>
        <p>Kategoriye göre filtreleyin ve dilediğiniz ürünleri seçin.</p>
      </section>

      <form className="search-panel" onSubmit={handleSearch}>
        <input
          type="search"
          placeholder="Ürün ara"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
        />
        <button type="submit" className="primary-button">
          Ara
        </button>
      </form>

      <section className="content-section">
        <div className="section-heading section-heading--ruled">
          <span className="eyebrow">Kategoriler</span>
          <h2>Ürün kategorileri</h2>
          <span className="section-heading__rule" aria-hidden="true" />
        </div>
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
      </section>

      <div className="section-divider" aria-hidden="true" />

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
          Aradığınız kriterlere uygun ürün bulunamadı.
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
