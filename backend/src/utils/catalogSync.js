import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { categorySeeds, productSeeds } from "../data/pasaliCatalog.js";
import { slugify } from "./slugify.js";

let catalogSyncPromise = null;

const buildCategoryUpserts = () =>
  categorySeeds.map((category) => ({
    updateOne: {
      filter: { slug: slugify(category.name) },
      update: {
        $setOnInsert: {
          ...category,
          slug: slugify(category.name)
        }
      },
      upsert: true
    }
  }));

const buildProductUpserts = (categoryMap) =>
  productSeeds.map((product) => ({
    updateOne: {
      filter: { slug: slugify(product.name) },
      update: {
        $setOnInsert: {
          name: product.name,
          slug: slugify(product.name),
          description: product.description,
          price: product.price,
          displayPrice: product.displayPrice,
          image: product.image,
          imageUrl: product.image,
          category: categoryMap.get(product.categoryName),
          unit: product.unit,
          weight: product.weight,
          portion: product.portion,
          variants: product.variants || [],
          shelfLife: product.shelfLife,
          storageCondition: product.storageCondition,
          stockStatus: product.stockStatus,
          stockQuantity: product.stockQuantity,
          featured: Boolean(product.featured),
          catalogPage: product.catalogPage,
          isActive: true
        }
      },
      upsert: true
    }
  }));

export const syncCatalogData = async () => {
  if (buildCategoryUpserts().length) {
    await Category.bulkWrite(buildCategoryUpserts(), { ordered: false });
  }

  const categories = await Category.find({}, "name");
  const categoryMap = new Map(categories.map((category) => [category.name, category._id]));
  const productUpserts = buildProductUpserts(categoryMap).filter(
    (operation) => operation.updateOne.update.$setOnInsert.category
  );

  if (productUpserts.length) {
    await Product.bulkWrite(productUpserts, { ordered: false });
  }
};

export const ensureCatalogDataSynchronized = async () => {
  if (!catalogSyncPromise) {
    catalogSyncPromise = syncCatalogData().catch((error) => {
      catalogSyncPromise = null;
      throw error;
    });
  }

  return catalogSyncPromise;
};
