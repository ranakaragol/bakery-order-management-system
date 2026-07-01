import dotenv from "dotenv";
import Category from "../models/Category.js";
import ContactInfo from "../models/ContactInfo.js";
import InvoiceInfo from "../models/InvoiceInfo.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { connectDB } from "../config/db.js";
import { slugify } from "../utils/slugify.js";

dotenv.config();

const categorySeeds = [
  {
    name: "Dogum Gunu Pastalari",
    description: "Renkli kutlamalar icin ozel tasarlanmis dogum gunu pastalari.",
    imageUrl:
      "https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=1200&q=80",
    isFeatured: true
  },
  {
    name: "Soz ve Nisan Pastalari",
    description: "Zarif detaylarla hazirlanan ozel gun pastalari.",
    imageUrl:
      "https://images.unsplash.com/photo-1521302200778-33500795e128?auto=format&fit=crop&w=1200&q=80",
    isFeatured: true
  },
  {
    name: "Dugun Pastalari",
    description: "Katli ve imza niteliginde dugun pastalari.",
    imageUrl:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80",
    isFeatured: true
  },
  {
    name: "Gunluk Pastalar",
    description: "Her gun taze hazirlanan butik gunluk lezzetler.",
    imageUrl:
      "https://images.unsplash.com/photo-1464306076886-da185f6a9d05?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false
  },
  {
    name: "Tatlilar",
    description: "Mini porsiyonlardan paylasimlik tabaklara tatli secenekleri.",
    imageUrl:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false
  },
  {
    name: "Kurabiyeler",
    description: "Ozel gunlere ve kurumsal etkinliklere uygun butik kurabiyeler.",
    imageUrl:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false
  }
];

const productSeeds = [
  {
    name: "Monoline Kutlama Pastasi",
    description: "Modern yazili, mevsim cicekleriyle suslu kutlama pastasi.",
    price: 2350,
    imageUrl:
      "https://images.unsplash.com/photo-1559622214-8f4c0d6f2d4f?auto=format&fit=crop&w=1200&q=80",
    categoryName: "Dogum Gunu Pastalari",
    stockStatus: "in_stock",
    stockQuantity: 8,
    featured: true
  },
  {
    name: "Sampanya Tonlu Nisan Pastasi",
    description: "Soft dokulu, inci detayli nisan pastasi.",
    price: 3100,
    imageUrl:
      "https://images.unsplash.com/photo-1519654793197-5c8f11f59c44?auto=format&fit=crop&w=1200&q=80",
    categoryName: "Soz ve Nisan Pastalari",
    stockStatus: "limited",
    stockQuantity: 4,
    featured: true
  },
  {
    name: "Mimari Katli Dugun Pastasi",
    description: "Kalabalik davetler icin premium tasarim dugun pastasi.",
    price: 5800,
    imageUrl:
      "https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=1200&q=80",
    categoryName: "Dugun Pastalari",
    stockStatus: "in_stock",
    stockQuantity: 3,
    featured: true
  },
  {
    name: "Cilekli Mini Entremet",
    description: "Gunluk siparisler icin hafif ve ferah mini pasta.",
    price: 420,
    imageUrl:
      "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80",
    categoryName: "Gunluk Pastalar",
    stockStatus: "in_stock",
    stockQuantity: 16,
    featured: true
  },
  {
    name: "Trio Tatli Kutusu",
    description: "Makaron, tart ve cheesecake seckisiyle tatli kutusu.",
    price: 690,
    imageUrl:
      "https://images.unsplash.com/photo-1488477304112-4944851de03d?auto=format&fit=crop&w=1200&q=80",
    categoryName: "Tatlilar",
    stockStatus: "in_stock",
    stockQuantity: 10,
    featured: false
  },
  {
    name: "Bademli Imza Kurabiye",
    description: "Butik ambalajli, ozel mesajli kurabiye seti.",
    price: 320,
    imageUrl:
      "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=1200&q=80",
    categoryName: "Kurabiyeler",
    stockStatus: "limited",
    stockQuantity: 12,
    featured: false
  }
];

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
      imageUrl: product.imageUrl,
      category: categoryMap.get(product.categoryName),
      stockStatus: product.stockStatus,
      stockQuantity: product.stockQuantity,
      featured: product.featured
    }))
  );

  await ContactInfo.create({
    heroTitle: "Kutlamalari lezzetli bir sahneye donusturen butik pastacilik",
    heroDescription:
      "Ozgün tasarimlar, premium malzemeler ve teslimata hazir operasyon yapisi ile kutlamalariniza eslik ediyoruz.",
    phone: "+90 555 000 11 22",
    email: "hello@firinatelier.com",
    address: "Tesvikiye Mah. Valikonagi Cad. No: 18 Sisli / Istanbul",
    workingHours: "Her gun 09:00 - 20:00",
    socialLinks: {
      instagram: "https://instagram.com/firinatelier",
      facebook: "https://facebook.com/firinatelier",
      whatsapp: "https://wa.me/905550001122"
    }
  });

  const adminInvoice = await InvoiceInfo.create({
    fullName: "Atelier Admin",
    billingAddress: "Tesvikiye Mah. Valikonagi Cad. No: 18 Sisli / Istanbul",
    email: process.env.ADMIN_SEED_EMAIL || "admin@firinatelier.com",
    phone: "+90 555 000 11 22",
    companyName: "Firin Atelier",
    taxNumber: "1234567890",
    taxOffice: "Sisli"
  });

  const adminUser = await User.create({
    firstName: "Atelier",
    lastName: "Admin",
    email: process.env.ADMIN_SEED_EMAIL || "admin@firinatelier.com",
    password: process.env.ADMIN_SEED_PASSWORD || "Admin123!",
    phone: "+90 555 000 11 22",
    address: "Tesvikiye Mah. Valikonagi Cad. No: 18 Sisli / Istanbul",
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
