import Category from "../models/Category.js";
import ContactInfo from "../models/ContactInfo.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { normalizeProductResponse } from "../utils/normalizeProductResponse.js";

const legacyCakeSizeNames = ["Tek Pasta", "0 No Pasta", "1 No Pasta", "2 No Pasta"];

export const getHomeData = asyncHandler(async (req, res) => {
  const [categories, featuredProducts, contactInfo] = await Promise.all([
    Category.find().sort({ isFeatured: -1, name: 1 }),
    Product.find({ featured: true, name: { $nin: legacyCakeSizeNames } }).populate("category", "name slug").limit(6),
    ContactInfo.findOne().sort({ createdAt: -1 })
  ]);

  res.json({
    hero: contactInfo
      ? {
          title: contactInfo.heroTitle,
          description: contactInfo.heroDescription
        }
      : {
          title: "Lezzetin ve ustalığın buluştuğu özel tatlar.",
          description: "Özenle hazırlanan tatlar, güvenle sunulan lezzetler."
        },
    categories,
    featuredProducts: featuredProducts.map(normalizeProductResponse),
    contactInfo
  });
});

export const getPublicContactInfo = asyncHandler(async (req, res) => {
  const contactInfo = await ContactInfo.findOne().sort({ createdAt: -1 });
  res.json(contactInfo);
});
