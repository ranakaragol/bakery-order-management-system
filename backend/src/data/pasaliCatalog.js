import { categoryDefinitions, pasaliBrand, pasaliContactInfo, productDefinitions } from "../../../shared/pasaliCatalogData.js";

export const PASALI_BRAND = {
  name: pasaliBrand.name,
  logo: pasaliBrand.logo
};

export const categorySeeds = categoryDefinitions.map((category) => ({
  name: category.name,
  description: category.description,
  imageUrl: category.imageUrl,
  isFeatured: category.isFeatured
}));

export const productSeeds = productDefinitions.map((product) => ({
  name: product.name,
  description: product.description,
  price: product.price,
  displayPrice: product.displayPrice,
  image: product.image,
  categoryName: product.category,
  unit: product.unit,
  weight: product.weight,
  portion: product.portion,
  variants: product.variants,
  shelfLife: product.shelfLife,
  storageCondition: product.storageCondition,
  stockStatus: product.stockStatus,
  stockQuantity: product.stockQuantity,
  featured: product.featured,
  catalogPage: product.catalogPage,
  isActive: true
}));

export const contactSeed = {
  ...pasaliContactInfo
};
