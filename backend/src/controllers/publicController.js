import Category from "../models/Category.js";
import ContactInfo from "../models/ContactInfo.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getHomeData = asyncHandler(async (req, res) => {
  const [categories, featuredProducts, contactInfo] = await Promise.all([
    Category.find().sort({ isFeatured: -1, name: 1 }),
    Product.find({ featured: true }).populate("category", "name slug").limit(6),
    ContactInfo.findOne().sort({ createdAt: -1 })
  ]);

  res.json({
    hero: contactInfo
      ? {
          title: contactInfo.heroTitle,
          description: contactInfo.heroDescription
        }
      : {
          title: "Tasarlanmis kutlama lezzetleri",
          description: "Kutlamalara, toplantilara ve gundelik keyiflere ozel pastacilik deneyimi."
        },
    categories,
    featuredProducts,
    contactInfo
  });
});

export const getPublicContactInfo = asyncHandler(async (req, res) => {
  const contactInfo = await ContactInfo.findOne().sort({ createdAt: -1 });
  res.json(contactInfo);
});
