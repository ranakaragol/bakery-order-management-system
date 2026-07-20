import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { categoryDefinitions, productDefinitions } from "../../../shared/pasaliCatalogData.js";
import { resolveCategorySortOrder } from "./categoryVisibility.js";
import { slugify } from "./slugify.js";

const catalogProducts = new Map();
const catalogCategories = new Map();

categoryDefinitions.forEach((category) => {
  catalogCategories.set(category.name, category);
  catalogCategories.set(category.slug, category);
  catalogCategories.set(slugify(category.name), category);
});

productDefinitions.forEach((product) => {
  catalogProducts.set(product.id, product);
  catalogProducts.set(slugify(product.id), product);
  catalogProducts.set(slugify(product.name), product);
});

export const findCatalogCategoryDefinition = (identifier = "") => {
  const normalizedValue = String(identifier || "").trim();

  if (!normalizedValue) {
    return null;
  }

  return catalogCategories.get(normalizedValue) || catalogCategories.get(slugify(normalizedValue)) || null;
};

export const findCatalogProductDefinition = (identifier = "") => {
  const normalizedValue = String(identifier || "").trim();

  if (!normalizedValue) {
    return null;
  }

  return catalogProducts.get(normalizedValue) || catalogProducts.get(slugify(normalizedValue)) || null;
};

export const ensureCatalogProduct = async (identifier = "") => {
  const normalizedValue = String(identifier || "").trim();

  if (!normalizedValue) {
    return null;
  }

  let existingProduct = null;

  if (mongoose.isValidObjectId(normalizedValue)) {
    existingProduct = await Product.findById(normalizedValue);
  } else {
    existingProduct =
      (await Product.findOne({ slug: normalizedValue })) ||
      (await Product.findOne({ slug: slugify(normalizedValue) }));
  }

  if (existingProduct) {
    return existingProduct;
  }

  const definition = findCatalogProductDefinition(normalizedValue);

  if (!definition) {
    return null;
  }

  const categoryDefinition = findCatalogCategoryDefinition(definition.category);
  const categoryName = categoryDefinition?.name || definition.category;
  const categorySlug = slugify(categoryDefinition?.slug || categoryName);
  const category = await Category.findOneAndUpdate(
    { slug: categorySlug },
    {
      $setOnInsert: {
        name: categoryName,
        slug: categorySlug,
        description: categoryDefinition?.description || "",
        imageUrl: categoryDefinition?.imageUrl || definition.image,
        isFeatured: Boolean(categoryDefinition?.isFeatured),
        sortOrder: resolveCategorySortOrder(categoryDefinition),
        isActive: true
      }
    },
    {
      new: true,
      upsert: true
    }
  );

  return Product.findOneAndUpdate(
    { slug: slugify(definition.name) },
    {
      $setOnInsert: {
        name: definition.name,
        slug: slugify(definition.name),
        description: definition.description,
        price: definition.price,
        displayPrice: definition.displayPrice,
        image: definition.image,
        imageUrl: definition.image,
        category: category._id,
        unit: definition.unit,
        weight: definition.weight,
        portion: definition.portion,
        variants: definition.variants || [],
        shelfLife: definition.shelfLife,
        storageCondition: definition.storageCondition,
        catalogPage: definition.catalogPage,
        stockStatus: definition.stockStatus,
        stockQuantity: definition.stockQuantity,
        featured: Boolean(definition.featured)
      }
    },
    {
      new: true,
      upsert: true
    }
  );
};
