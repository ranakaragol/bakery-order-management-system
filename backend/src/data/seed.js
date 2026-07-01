import dotenv from "dotenv";
import Category from "../models/Category.js";
import ContactInfo from "../models/ContactInfo.js";
import InvoiceInfo from "../models/InvoiceInfo.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { connectDB } from "../config/db.js";
import { slugify } from "../utils/slugify.js";

dotenv.config();

const adminProfile = {
  firstName: process.env.ADMIN_SEED_FIRST_NAME || "Atelier",
  lastName: process.env.ADMIN_SEED_LAST_NAME || "Admin",
  email: process.env.ADMIN_SEED_EMAIL || "admin@firinatelier.com",
  password: process.env.ADMIN_SEED_PASSWORD || "Admin123!",
  phone: process.env.ADMIN_SEED_PHONE || "+90 555 000 11 22",
  address:
    process.env.ADMIN_SEED_ADDRESS || "Tesvikiye Mah. Valikonagi Cad. No: 18 Sisli / Istanbul"
};

const categorySeeds = [
  {
    name: "Ekler",
    description: "Gunluk hazirlanan klasik, meyveli ve premium dolgu secenekli ekler urunleri.",
    imageUrl:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80",
    isFeatured: true
  },
  {
    name: "Magnolya Cesitleri",
    description: "Meyveli, cikolatali ve biskuvi katmanli magnolya bardaklari.",
    imageUrl:
      "https://images.unsplash.com/photo-1488477304112-4944851de03d?auto=format&fit=crop&w=1200&q=80",
    isFeatured: true
  },
  {
    name: "Tek Kisilik Pastalar",
    description: "Mono porsiyon sunumlu, vitrine uygun ve hafif yapili butik pasta secenekleri.",
    imageUrl:
      "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80",
    isFeatured: true
  },
  {
    name: "Tadimlik Lokmalik Tatlilar",
    description: "Mini kup, lokmalik tatli ve paylasimlik ufak porsiyon urunler.",
    imageUrl:
      "https://images.unsplash.com/photo-1464306076886-da185f6a9d05?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false
  }
];

const productSeeds = [
  {
    name: "Cikolatali Ekler",
    description: "Parlak cikolata kaplamali ve taze krema dolgulu gunluk ekler.",
    price: 110,
    imageUrl:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80",
    categoryName: "Ekler",
    stockStatus: "in_stock",
    stockQuantity: 24,
    featured: true
  },
  {
    name: "Frambuazli Ekler",
    description: "Meyve notasi yuksek, hafif kremali ve vitrine uygun ekler secimi.",
    price: 125,
    imageUrl:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=80",
    categoryName: "Ekler",
    stockStatus: "limited",
    stockQuantity: 12,
    featured: true
  },
  {
    name: "Cilekli Magnolya",
    description: "Cilek, biskuvi ve hafif krema katmanlariyla servis edilen magnolya bardagi.",
    price: 185,
    imageUrl:
      "https://images.unsplash.com/photo-1488477304112-4944851de03d?auto=format&fit=crop&w=1200&q=80",
    categoryName: "Magnolya Cesitleri",
    stockStatus: "in_stock",
    stockQuantity: 16,
    featured: true
  },
  {
    name: "Oreo Magnolya",
    description: "Kakaolu biskuvi ve krema dokusuyla daha yogun icimli magnolya secimi.",
    price: 195,
    imageUrl:
      "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80",
    categoryName: "Magnolya Cesitleri",
    stockStatus: "in_stock",
    stockQuantity: 16,
    featured: true
  },
  {
    name: "Frambuazli Tek Kisilik Pasta",
    description: "Mono porsiyon, hafif dokulu ve meyve aromasi dengeli butik pasta.",
    price: 245,
    imageUrl:
      "https://images.unsplash.com/photo-1559622214-8f4c0d6f2d4f?auto=format&fit=crop&w=1200&q=80",
    categoryName: "Tek Kisilik Pastalar",
    stockStatus: "in_stock",
    stockQuantity: 14,
    featured: false
  },
  {
    name: "Mini Tadimlik Tatli Kutusu",
    description: "Davet sunumlari icin lokmalik ve kolay servis edilebilen mini tatli secimi.",
    price: 390,
    imageUrl:
      "https://images.unsplash.com/photo-1464306076886-da185f6a9d05?auto=format&fit=crop&w=1200&q=80",
    categoryName: "Tadimlik Lokmalik Tatlilar",
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
    fullName: `${adminProfile.firstName} ${adminProfile.lastName}`,
    billingAddress: adminProfile.address,
    email: adminProfile.email,
    phone: adminProfile.phone,
    companyName: "Firin Atelier",
    taxNumber: "1234567890",
    taxOffice: "Sisli"
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
