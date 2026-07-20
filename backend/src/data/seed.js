import dotenv from "dotenv";
import Category from "../models/Category.js";
import ContactInfo from "../models/ContactInfo.js";
import InvoiceInfo from "../models/InvoiceInfo.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { connectDB, disconnectDB } from "../config/db.js";
import { categorySeeds, contactSeed, productSeeds } from "./pasaliCatalog.js";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { resolveAdminProfile, upsertAdmin } from "./upsertAdmin.js";
import { slugify } from "../utils/slugify.js";

dotenv.config();

const createCategoryPayload = () =>
  categorySeeds.map((category) => ({
    ...category,
    slug: slugify(category.name)
  }));

const createProductPayload = (categoryMap) =>
  productSeeds.map((product) => ({
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
    variants: product.variants,
    shelfLife: product.shelfLife,
    storageCondition: product.storageCondition,
    catalogPage: product.catalogPage,
    stockStatus: product.stockStatus,
    stockQuantity: product.stockQuantity,
    featured: product.featured,
    isActive: product.isActive !== false
  }));

const logWithFallback = (logger, method, message, error) => {
  const target = typeof logger?.[method] === "function" ? logger[method] : logger?.log;

  if (typeof target !== "function") {
    return;
  }

  if (typeof error === "undefined") {
    target.call(logger, message);
    return;
  }

  target.call(logger, message, error);
};

const safelyDisconnect = async ({ disconnect, logger, primaryError }) => {
  try {
    await disconnect();
  } catch (disconnectError) {
    if (primaryError) {
      logWithFallback(logger, "error", "Seed database disconnect failed after a seed error.");
      return;
    }

    throw disconnectError;
  }
};

export const seedDatabase = async ({
  env = process.env,
  connect = connectDB,
  disconnect = disconnectDB,
  categoryModel = Category,
  contactInfoModel = ContactInfo,
  invoiceInfoModel = InvoiceInfo,
  productModel = Product,
  userModel = User,
  upsertAdminFn = upsertAdmin,
  logger = console
} = {}) => {
  const adminProfile = resolveAdminProfile(env);
  let connected = false;
  let primaryError = null;

  try {
    await connect();
    connected = true;
    logWithFallback(
      logger,
      "warn",
      "Seed veritabanini sifirlar: products, categories, contact info, invoice info ve users koleksiyonlari silinecek."
    );

    await Promise.all([
      productModel.deleteMany(),
      categoryModel.deleteMany(),
      contactInfoModel.deleteMany(),
      invoiceInfoModel.deleteMany(),
      userModel.deleteMany()
    ]);

    const categories = await categoryModel.insertMany(createCategoryPayload());
    const categoryMap = new Map(categories.map((category) => [category.name, category._id]));

    await productModel.insertMany(createProductPayload(categoryMap));
    await contactInfoModel.create(contactSeed);
    await upsertAdminFn({
      env,
      adminProfile,
      connect: async () => {},
      userModel,
      invoiceInfoModel,
      logger
    });

    logger.log("Seed completed successfully.");
  } catch (error) {
    primaryError = error;
    throw error;
  } finally {
    if (connected) {
      await safelyDisconnect({ disconnect, logger, primaryError });
    }
  }
};

export const runSeedCli = async ({
  seed = seedDatabase,
  logger = console,
  exit = process.exit
} = {}) => {
  try {
    await seed();
    exit(0);
  } catch (error) {
    logger.error("Seed failed.", error);
    exit(1);
  }
};

const isExecutedDirectly = () => {
  const entryFile = process.argv[1];

  if (!entryFile) {
    return false;
  }

  return import.meta.url === pathToFileURL(resolve(entryFile)).href;
};

if (isExecutedDirectly()) {
  runSeedCli();
}
