import { categoryDefinitions } from "../../../shared/pasaliCatalogData.js";
import { slugify } from "./slugify.js";

const defaultSortOrderBySlug = new Map(
  categoryDefinitions.map((category, index) => [slugify(category.slug || category.name), index])
);

const toCategoryObject = (category) =>
  typeof category?.toObject === "function" ? category.toObject() : { ...(category || {}) };

export const isCategoryActive = (category) => category?.isActive !== false;

export const resolveCategorySortOrder = (category) => {
  const normalizedSortOrder = Number(category?.sortOrder);

  if (Number.isFinite(normalizedSortOrder)) {
    return normalizedSortOrder;
  }

  const categorySlug = slugify(category?.slug || category?.name || "");

  if (defaultSortOrderBySlug.has(categorySlug)) {
    return defaultSortOrderBySlug.get(categorySlug);
  }

  return 9999;
};

export const normalizeCategoryResponse = (category) => {
  const categoryObject = toCategoryObject(category);

  return {
    ...categoryObject,
    isActive: isCategoryActive(categoryObject),
    sortOrder: resolveCategorySortOrder(categoryObject)
  };
};

export const sortCategories = (leftCategory, rightCategory) => {
  const sortOrderDifference = resolveCategorySortOrder(leftCategory) - resolveCategorySortOrder(rightCategory);

  if (sortOrderDifference !== 0) {
    return sortOrderDifference;
  }

  const featuredDifference = Number(Boolean(rightCategory?.isFeatured)) - Number(Boolean(leftCategory?.isFeatured));

  if (featuredDifference !== 0) {
    return featuredDifference;
  }

  return String(leftCategory?.name || "").localeCompare(String(rightCategory?.name || ""), "tr");
};
