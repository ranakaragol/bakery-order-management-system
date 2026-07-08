import dotenv from "dotenv";
import Category from "../models/Category.js";
import ContactInfo from "../models/ContactInfo.js";
import InvoiceInfo from "../models/InvoiceInfo.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { connectDB } from "../config/db.js";
import { PASALI_BRAND, categorySeeds, contactSeed, productSeeds } from "./pasaliCatalog.js";
import { slugify } from "../utils/slugify.js";

dotenv.config();

const adminProfile = {
  firstName: process.env.ADMIN_SEED_FIRST_NAME || "Paşalı",
  lastName: process.env.ADMIN_SEED_LAST_NAME || "Admin",
  email: process.env.ADMIN_SEED_EMAIL || "admin@pasalipatiserrie.com",
  password: process.env.ADMIN_SEED_PASSWORD || "Admin123!",
  phone: process.env.ADMIN_SEED_PHONE || "+90 555 000 11 22",
  address: process.env.ADMIN_SEED_ADDRESS || "Paşalı Patiserrie katalog yönetim hesabı"
};

const seedDatabase = async () => {
  await connectDB();

  await Promise.all([
    Product.deleteMany(),
    Category.deleteMany(),
    ContactInfo.deleteMany(),
    InvoiceInfo.deleteMany(),
    User.deleteMany()
  ]);

  const categories = await Category.insertMany(
    categorySeeds.map((category) => ({
      ...category,
      slug: slugify(category.name)
    }))
  );

  const categoryMap = new Map(categories.map((category) => [category.name, category._id]));

  await Product.insertMany(
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
      featured: product.featured
    }))
  );

  await ContactInfo.create(contactSeed);

  const adminInvoice = await InvoiceInfo.create({
    fullName: `${adminProfile.firstName} ${adminProfile.lastName}`,
    billingAddress: adminProfile.address,
    email: adminProfile.email,
    phone: adminProfile.phone,
    companyName: PASALI_BRAND.name,
    taxNumber: "1234567890",
    taxOffice: "Istanbul"
  });

  const adminUser = await User.create({
    firstName: adminProfile.firstName,
    lastName: adminProfile.lastName,
    email: adminProfile.email,
    password: adminProfile.password,
    phone: adminProfile.phone,
    address: adminProfile.address,
    role: "admin",
    invoiceInfo: adminInvoice._id
  });

  adminInvoice.user = adminUser._id;
  await adminInvoice.save();

  console.log("Seed completed successfully.");
  process.exit(0);
};

seedDatabase().catch((error) => {
  console.error("Seed failed.", error);
  process.exit(1);
});
