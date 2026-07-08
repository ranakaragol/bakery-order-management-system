import { normalizeCatalogProduct } from "../../../shared/catalogProductRules.js";

export const normalizeProductResponse = (product) => {
  if (!product) {
    return product;
  }

  const productObject = typeof product.toObject === "function" ? product.toObject() : product;

  return normalizeCatalogProduct(productObject, {
    categoryName: productObject.category?.name
  });
};

