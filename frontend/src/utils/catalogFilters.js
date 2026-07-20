const turkishCharacterMap = {
  c: /[çÇ]/g,
  g: /[ğĞ]/g,
  i: /[ıİI]/g,
  o: /[öÖ]/g,
  s: /[şŞ]/g,
  u: /[üÜ]/g
};

export const safelyDecodeUriComponent = (value = "") => {
  const normalizedValue = String(value ?? "");

  try {
    return decodeURIComponent(normalizedValue);
  } catch {
    return normalizedValue;
  }
};

const foldTurkishCharacters = (value = "") =>
  Object.entries(turkishCharacterMap).reduce(
    (normalizedValue, [replacement, pattern]) => normalizedValue.replace(pattern, replacement),
    value
  );

export const normalizeCategoryValue = (value = "") => {
  const decodedValue = safelyDecodeUriComponent(value);

  return foldTurkishCharacters(
    decodedValue
      .trim()
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .toLocaleLowerCase("tr-TR")
  );
};

export const getCategoryMatchKeys = (category = {}) =>
  [category?.name, category?.slug].map((value) => normalizeCategoryValue(value)).filter(Boolean);

const normalizeProductValue = (value = "") =>
  safelyDecodeUriComponent(String(value ?? ""))
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("tr-TR");

export const getProductMatchKeys = (product = {}) =>
  [product?._id, product?.id, product?.slug, product?.name].map((value) => normalizeProductValue(value)).filter(Boolean);

export const buildCategoryQueryValue = (category = {}) =>
  safelyDecodeUriComponent(String(category?.name || category?.slug || "").trim());

export const findMatchingCategory = (categories = [], queryValue = "") => {
  const normalizedQuery = normalizeCategoryValue(queryValue);

  if (!normalizedQuery) {
    return null;
  }

  return categories.find((category) => getCategoryMatchKeys(category).includes(normalizedQuery)) || null;
};

export const areCategoriesEquivalent = (leftCategory, rightCategory) => {
  const leftKeys = getCategoryMatchKeys(leftCategory);
  const rightKeys = getCategoryMatchKeys(rightCategory);

  return leftKeys.some((key) => rightKeys.includes(key));
};

export const areProductsEquivalent = (leftProduct, rightProduct) => {
  const leftKeys = getProductMatchKeys(leftProduct);
  const rightKeys = getProductMatchKeys(rightProduct);

  return leftKeys.some((key) => rightKeys.includes(key));
};

export const matchesSearchFilter = (product, searchTerm = "") => {
  const normalizedSearchTerm = safelyDecodeUriComponent(searchTerm).trim();

  if (!normalizedSearchTerm) {
    return true;
  }

  const haystack = `${product?.name || ""} ${product?.description || ""}`.toLocaleLowerCase("tr-TR");

  return haystack.includes(normalizedSearchTerm.toLocaleLowerCase("tr-TR"));
};

export const filterCatalogProducts = (products = [], { category = null, search = "" } = {}) => {
  const selectedCategoryKeys = getCategoryMatchKeys(category);

  return products.filter((product) => {
    const matchesCategory =
      !selectedCategoryKeys.length ||
      getCategoryMatchKeys(product?.category).some((key) => selectedCategoryKeys.includes(key));

    return matchesCategory && matchesSearchFilter(product, search);
  });
};

export const resolveCatalogSnapshot = ({
  apiCategories,
  apiProducts,
  fallbackCategories = [],
  fallbackProducts = []
}) => {
  const mergeCatalogItems = (primaryItems = [], secondaryItems = [], isEquivalent) => {
    const mergedItems = [...primaryItems];

    secondaryItems.forEach((item) => {
      if (!mergedItems.some((existingItem) => isEquivalent(existingItem, item))) {
        mergedItems.push(item);
      }
    });

    return mergedItems;
  };

  const resolvedApiCategories = Array.isArray(apiCategories) ? apiCategories : [];
  const resolvedApiProducts = Array.isArray(apiProducts) ? apiProducts : [];
  const mergedCategories = resolvedApiCategories.length
    ? mergeCatalogItems(resolvedApiCategories, fallbackCategories, areCategoriesEquivalent)
    : fallbackCategories;
  const mergedProducts = resolvedApiProducts.length
    ? mergeCatalogItems(resolvedApiProducts, fallbackProducts, areProductsEquivalent)
    : fallbackProducts;

  const canonicalProducts = mergedProducts.map((product) => {
    const fallbackProduct = fallbackProducts.find((item) => areProductsEquivalent(item, product));
    const canonicalCategory =
      findMatchingCategory(
        mergedCategories,
        fallbackProduct?.category?.slug ||
          fallbackProduct?.category?.name ||
          product?.category?.slug ||
          product?.category?.name
      ) || product?.category || null;

    if (!fallbackProduct) {
      return {
        ...product,
        category: canonicalCategory
      };
    }

    return {
      ...fallbackProduct,
      ...product,
      image: fallbackProduct.image || product.image,
      imageUrl: fallbackProduct.imageUrl || product.imageUrl,
      category: canonicalCategory
    };
  });

  return {
    categories: mergedCategories,
    products: canonicalProducts
  };
};
