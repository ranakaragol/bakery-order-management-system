import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { slugify } from "../utils/slugify.js";

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ isFeatured: -1, name: 1 });
  res.json(categories);
});

export const createCategory = asyncHandler(async (req, res) => {
  const slug = req.body.slug ? slugify(req.body.slug) : slugify(req.body.name);

  const category = await Category.create({
    ...req.body,
    slug
  });

  res.status(201).json({
    message: "Kategori başarıyla oluşturuldu.",
    category
  });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({ message: "Kategori bulunamadı." });
  }

  Object.assign(category, req.body);

  if (req.body.name || req.body.slug) {
    category.slug = slugify(req.body.slug || req.body.name);
  }

  await category.save();

  res.json({
    message: "Kategori başarıyla güncellendi.",
    category
  });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({ message: "Kategori bulunamadı." });
  }

  const linkedProducts = await Product.countDocuments({ category: category._id });

  if (linkedProducts > 0) {
    return res.status(400).json({
      message: "Bu kategoriye bağlı ürünler varken kategori silinemez."
    });
  }

  await category.deleteOne();

  res.json({
    message: "Kategori başarıyla silindi."
  });
});
