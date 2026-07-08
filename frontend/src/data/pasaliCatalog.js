import { categoryDefinitions, pasaliBrand, pasaliContactInfo, productDefinitions } from "../../../shared/pasaliCatalogData.js";

export { pasaliBrand, pasaliContactInfo };

export const pasaliCategories = categoryDefinitions.map((category) => ({
  _id: `category-${category.id}`,
  ...category
}));

const categoryMap = Object.fromEntries(pasaliCategories.map((category) => [category.name, category]));

export const pasaliProducts = productDefinitions.map((product) => ({
  ...product,
  _id: product.id,
  imageUrl: product.image,
  category: categoryMap[product.category]
}));
