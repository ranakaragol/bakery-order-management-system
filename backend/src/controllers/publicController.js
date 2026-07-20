import Category from "../models/Category.js";
import ContactInfo from "../models/ContactInfo.js";
import Product from "../models/Product.js";
import { pasaliContactInfo } from "../../../shared/pasaliCatalogData.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getVisibleCategoryIds } from "../utils/catalogProductVisibility.js";
import { normalizeCategoryResponse, sortCategories } from "../utils/categoryVisibility.js";
import { ensureCatalogDataSynchronized } from "../utils/catalogSync.js";
import { normalizeProductResponse } from "../utils/normalizeProductResponse.js";

const legacyCakeSizeNames = ["Tek Pasta", "0 No Pasta", "1 No Pasta", "2 No Pasta"];

export const getHomeData = asyncHandler(async (req, res) => {
  await ensureCatalogDataSynchronized();
  const visibleCategoryIds = await getVisibleCategoryIds();
  const [categories, featuredProducts, contactInfo] = await Promise.all([
    Category.find({ isActive: { $ne: false } }),
    Product.find({
      featured: true,
      isActive: { $ne: false },
      category: { $in: visibleCategoryIds },
      name: { $nin: legacyCakeSizeNames }
    })
      .populate("category", "name slug isActive")
      .limit(6),
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
    categories: categories.map(normalizeCategoryResponse).sort(sortCategories),
    featuredProducts: featuredProducts.map(normalizeProductResponse),
    contactInfo
  });
});

export const getPublicContactInfo = asyncHandler(async (req, res) => {
  const contactInfo = await ContactInfo.findOne().sort({ createdAt: -1 });
  res.json(contactInfo || pasaliContactInfo);
});
