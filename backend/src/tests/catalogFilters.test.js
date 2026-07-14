import { describe, expect, it } from "vitest";
import { pasaliCategories, pasaliProducts } from "../../../frontend/src/data/pasaliCatalog.js";
import { buildAuthRedirectLink, resolveNextPath } from "../../../frontend/src/utils/authNavigation.js";
import {
  buildCategoryQueryValue,
  filterCatalogProducts,
  findMatchingCategory,
  resolveCatalogSnapshot
} from "../../../frontend/src/utils/catalogFilters.js";

describe("catalog filters", () => {
  it("filters products by Pastalar query with canonical category matching", () => {
    const activeCategory = findMatchingCategory(pasaliCategories, "Pastalar");
    const filteredProducts = filterCatalogProducts(pasaliProducts, {
      category: activeCategory,
      search: ""
    });

    expect(activeCategory?.slug).toBe("pastalar");
    expect(filteredProducts.length).toBeGreaterThan(0);
    expect(filteredProducts.every((product) => product.category?.slug === "pastalar")).toBe(true);
  });

  it("keeps the same active category when API categories arrive with different formatting", () => {
    const fallbackMatch = findMatchingCategory(pasaliCategories, "Cup%20Tatlılar");
    const apiCategories = pasaliCategories.map((category) =>
      category.slug === "cup-tatlilar" ? { ...category, name: " cup tatlilar " } : category
    );
    const apiMatch = findMatchingCategory(apiCategories, "Cup%20Tatlılar");

    expect(fallbackMatch?.slug).toBe("cup-tatlilar");
    expect(apiMatch?.slug).toBe("cup-tatlilar");
  });

  it("does not produce an empty screen for invalid category queries", () => {
    const activeCategory = findMatchingCategory(pasaliCategories, "Gecersiz Kategori");
    const filteredProducts = filterCatalogProducts(pasaliProducts, {
      category: activeCategory,
      search: ""
    });

    expect(activeCategory).toBeNull();
    expect(filteredProducts).toHaveLength(pasaliProducts.length);
  });

  it("uses fallback catalog data when API data is unavailable", () => {
    const resolvedCatalog = resolveCatalogSnapshot({
      apiCategories: [],
      apiProducts: [],
      fallbackCategories: pasaliCategories,
      fallbackProducts: pasaliProducts
    });

    expect(resolvedCatalog.categories).toHaveLength(pasaliCategories.length);
    expect(resolvedCatalog.products).toHaveLength(pasaliProducts.length);
  });

  it("keeps missing fallback categories and products when API is partial", () => {
    const resolvedCatalog = resolveCatalogSnapshot({
      apiCategories: pasaliCategories.filter((category) => ["pastalar", "ekler"].includes(category.slug)),
      apiProducts: pasaliProducts.filter((product) => ["pastalar", "ekler"].includes(product.category?.slug)),
      fallbackCategories: pasaliCategories,
      fallbackProducts: pasaliProducts
    });

    expect(resolvedCatalog.categories).toHaveLength(pasaliCategories.length);
    expect(resolvedCatalog.products).toHaveLength(pasaliProducts.length);
    expect(resolvedCatalog.categories.some((category) => category.slug === "cup-tatlilar")).toBe(true);
    expect(resolvedCatalog.products.some((product) => product.category?.slug === "cup-tatlilar")).toBe(true);
  });

  it("keeps fallback category assignment for matching API products", () => {
    const tepsiTatliCategory = pasaliCategories.find((category) => category.slug === "tepsi-tatlilari");
    const resolvedCatalog = resolveCatalogSnapshot({
      apiCategories: pasaliCategories,
      apiProducts: pasaliProducts.map((product) =>
        product._id === "mozaik-pasta" ? { ...product, category: tepsiTatliCategory } : product
      ),
      fallbackCategories: pasaliCategories,
      fallbackProducts: pasaliProducts
    });

    const mozaikPasta = resolvedCatalog.products.find((product) => product._id === "mozaik-pasta");

    expect(mozaikPasta?.category?.slug).toBe("petifur");
  });
});

describe("auth navigation", () => {
  it("preserves the products query during login redirect", () => {
    const loginLink = buildAuthRedirectLink("/login", "/products", "?category=Pastalar");

    expect(loginLink).toBe("/login?next=%2Fproducts%3Fcategory%3DPastalar");
    expect(resolveNextPath("/products?category=Pastalar")).toBe("/products?category=Pastalar");
  });

  it("keeps category query values in display format", () => {
    expect(buildCategoryQueryValue({ name: "Cup Tatlılar", slug: "cup-tatlilar" })).toBe("Cup Tatlılar");
  });
});
