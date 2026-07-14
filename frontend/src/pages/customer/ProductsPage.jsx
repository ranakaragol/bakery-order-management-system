import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { publicApi } from "../../api/client";
import CategoryCard from "../../components/CategoryCard";
import ProductCard from "../../components/ProductCard";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { fallbackCategories, fallbackProducts } from "../../utils/fallbackContent";
import {
  areCategoriesEquivalent,
  buildCategoryQueryValue,
  filterCatalogProducts,
  findMatchingCategory,
  resolveCatalogSnapshot,
  safelyDecodeUriComponent
} from "../../utils/catalogFilters";

const fallbackCatalog = {
  categories: fallbackCategories,
  products: fallbackProducts
};

const ProductsPage = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [catalog, setCatalog] = useState(fallbackCatalog);
  const [status, setStatus] = useState(() => (fallbackProducts.length ? "loading" : "empty"));
  const [searchInput, setSearchInput] = useState(() => safelyDecodeUriComponent(searchParams.get("search") || ""));
  const productResultsRef = useRef(null);
  const lastScrolledCategoryRef = useRef("");

  const categoryQuery = searchParams.get("category") || "";
  const searchQuery = safelyDecodeUriComponent(searchParams.get("search") || "");

  const activeCategory = useMemo(
    () => findMatchingCategory(catalog.categories, categoryQuery),
    [catalog.categories, categoryQuery]
  );

  const visibleProducts = useMemo(
    () =>
      filterCatalogProducts(catalog.products, {
        category: activeCategory,
        search: searchQuery
      }),
    [activeCategory, catalog.products, searchQuery]
  );

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (!activeCategory || status === "loading") {
      if (!categoryQuery) {
        lastScrolledCategoryRef.current = "";
      }
      return;
    }

    const scrollKey = buildCategoryQueryValue(activeCategory);

    if (!scrollKey || lastScrolledCategoryRef.current === scrollKey) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      productResultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
      lastScrolledCategoryRef.current = scrollKey;
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeCategory, categoryQuery, status]);

  useEffect(() => {
    let cancelled = false;

    const syncCatalog = async () => {
      try {
        const [categoriesResponse, productsResponse] = await Promise.all([
          publicApi.get("/categories"),
          publicApi.get("/products")
        ]);

        if (!cancelled) {
          const nextCatalog = resolveCatalogSnapshot({
            apiCategories: categoriesResponse.data,
            apiProducts: productsResponse.data,
            fallbackCategories,
            fallbackProducts
          });

          setCatalog(nextCatalog);
          setStatus(nextCatalog.products.length ? "success" : "empty");
        }
      } catch (error) {
        if (!cancelled) {
          setCatalog(fallbackCatalog);
          setStatus(fallbackProducts.length ? "success" : "error");
        }
      }
    };

    syncCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    const normalizedSearch = searchInput.trim();

    if (activeCategory) {
      nextParams.set("category", buildCategoryQueryValue(activeCategory));
    } else {
      nextParams.delete("category");
    }

    if (normalizedSearch) {
      nextParams.set("search", normalizedSearch);
    } else {
      nextParams.delete("search");
    }

    setSearchParams(nextParams);
  };

  const handleCategoryClick = (category) => {
    const nextParams = new URLSearchParams(searchParams);
    const isActiveCategory = areCategoriesEquivalent(activeCategory, category);

    if (isActiveCategory) {
      nextParams.delete("category");
    } else {
      nextParams.set("category", buildCategoryQueryValue(category));
    }

    if (searchInput.trim()) {
      nextParams.set("search", searchInput.trim());
    } else {
      nextParams.delete("search");
    }

    setSearchParams(nextParams);
  };

  const handleAddToCart = async (product) => {
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
      // Redirect only after the cart API confirms success.
    }
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
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
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
          {catalog.categories.map((category) => (
            <CategoryCard
              key={category._id}
              category={category}
              active={areCategoriesEquivalent(activeCategory, category)}
              onClick={handleCategoryClick}
            />
          ))}
        </div>
      </section>

      <div className="section-divider" aria-hidden="true" />

      {status === "loading" && <div className="panel">Ürünler yükleniyor...</div>}

      {visibleProducts.length ? (
        <section ref={productResultsRef} className="content-section">
          <div className="section-heading">
            <span className="eyebrow">{activeCategory ? "Kategori" : "Liste"}</span>
            <h2>{activeCategory ? `${activeCategory.name} ürünleri` : "Tüm ürünler"}</h2>
          </div>
          <div className="product-grid">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onAddToCart={handleAddToCart}
                disableCart={user?.role === "admin"}
                readOnly={user?.role === "admin"}
              />
            ))}
          </div>
        </section>
      ) : status === "error" || !catalog.products.length ? (
        <div className="panel">Ürünler şu anda görüntülenemiyor.</div>
      ) : activeCategory ? (
        <div className="panel">Bu kategoride henüz ürün bulunmuyor.</div>
      ) : (
        <div className="panel">Aradığınız kriterlere uygun ürün bulunamadı.</div>
      )}
    </div>
  );
};

export default ProductsPage;
