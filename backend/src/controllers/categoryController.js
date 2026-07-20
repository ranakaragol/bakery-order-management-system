import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureCatalogDataSynchronized } from "../utils/catalogSync.js";
import { normalizeCategoryResponse, sortCategories } from "../utils/categoryVisibility.js";
import { slugify } from "../utils/slugify.js";
import { sendError } from "../utils/apiResponses.js";

const normalizeCategoryPayload = (payload = {}) => {
  const normalizedPayload = { ...payload };

  if (payload.sortOrder !== undefined && payload.sortOrder !== null && `${payload.sortOrder}`.trim() !== "") {
    normalizedPayload.sortOrder = Number(payload.sortOrder);
  } else {
    delete normalizedPayload.sortOrder;
  }

  if (payload.isActive !== undefined) {
    normalizedPayload.isActive = payload.isActive !== false;
  }

  if (payload.isFeatured !== undefined) {
    normalizedPayload.isFeatured = Boolean(payload.isFeatured);
  }

  return normalizedPayload;
};

const listCategories = async ({ includeInactive = false } = {}) => {
  const query = includeInactive ? {} : { isActive: { $ne: false } };
  const categories = await Category.find(query);

  return categories.map(normalizeCategoryResponse).sort(sortCategories);
};

export const getCategories = asyncHandler(async (req, res) => {
  await ensureCatalogDataSynchronized();
  res.json(await listCategories());
});

export const getAdminCategories = asyncHandler(async (req, res) => {
  await ensureCatalogDataSynchronized();
  res.json(await listCategories({ includeInactive: true }));
});

export const createCategory = asyncHandler(async (req, res) => {
  const slug = req.body.slug ? slugify(req.body.slug) : slugify(req.body.name);

  const category = await Category.create({
    ...normalizeCategoryPayload(req.body),
    slug
  });

  res.status(201).json({
    message: "Kategori başarıyla oluşturuldu.",
    category: normalizeCategoryResponse(category)
  });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return sendError(res, 404, { message: "Kategori bulunamadı." });
  }

  Object.assign(category, normalizeCategoryPayload(req.body));

  if (req.body.name || req.body.slug) {
    category.slug = slugify(req.body.slug || req.body.name);
  }

  await category.save();

  res.json({
    message: "Kategori başarıyla güncellendi.",
    category: normalizeCategoryResponse(category)
  });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return sendError(res, 404, { message: "Kategori bulunamadı." });
  }

  const linkedProducts = await Product.countDocuments({ category: category._id });

  if (linkedProducts > 0) {
    return sendError(res, 409, {
      message: `Bu kategori silinemiyor. Önce kategoriye bağlı ${linkedProducts} ürünü kaldırın veya taşıyın.`,
      code: "CATEGORY_HAS_PRODUCTS",
      linkedProductCount: linkedProducts
    });
  }

  await category.deleteOne();

  res.json({
    message: "Kategori başarıyla silindi."
  });
});
