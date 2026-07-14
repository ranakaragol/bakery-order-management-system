import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { normalizeCatalogProduct } from "../../../shared/catalogProductRules.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureCatalogDataSynchronized } from "../utils/catalogSync.js";
import { normalizeProductResponse } from "../utils/normalizeProductResponse.js";
import { slugify } from "../utils/slugify.js";

const legacyCakeSizeNames = ["Tek Pasta", "0 No Pasta", "1 No Pasta", "2 No Pasta"];

const normalizeVariants = (variants = []) =>
  Array.isArray(variants)
    ? variants
        .filter((variant) => variant && (variant.id || variant.name || variant.price !== undefined))
        .map((variant) => ({
          id: String(variant.id || "").trim(),
          name: String(variant.name || "").trim(),
          rawPrice: variant.price,
          price: Number(variant.price)
        }))
        .filter(
          (variant) =>
            variant.id &&
            variant.name &&
            `${variant.rawPrice ?? ""}`.trim() !== "" &&
            Number.isFinite(variant.price)
        )
        .map(({ rawPrice, ...variant }) => variant)
    : [];

const buildDisplayPrice = (price, unit, variants = []) => {
  if (variants.length) {
    const prices = variants
      .map((variant) => Number(variant.price))
      .filter((value) => Number.isFinite(value))
      .sort((left, right) => left - right);

    if (prices.length) {
      const firstPrice = prices[0];
      const lastPrice = prices[prices.length - 1];

      return firstPrice === lastPrice ? `${firstPrice} TL` : `${firstPrice} TL - ${lastPrice} TL`;
    }
  }

  if (price !== null) {
    return `${price} TL${unit ? ` / ${unit}` : ""}`;
  }

  return "Fiyat sorunuz";
};

const normalizeProductPayload = (payload = {}, categoryName = "") => {
  const normalizedImage = payload.image || payload.imageUrl || "";
  const hasPriceValue = payload.price !== undefined && payload.price !== null && payload.price !== "";
  const normalizedPrice = hasPriceValue ? Number(payload.price) : null;
  const normalizedUnit = payload.unit || "";
  const normalizedVariants = normalizeVariants(payload.variants);
  const resolvedPrice = normalizedVariants.length ? null : normalizedPrice;
  const normalizedProduct = normalizeCatalogProduct(
    {
      ...payload,
      image: normalizedImage,
      imageUrl: normalizedImage,
      price: resolvedPrice,
      variants: normalizedVariants,
      stockQuantity:
        payload.stockQuantity !== undefined && payload.stockQuantity !== null && payload.stockQuantity !== ""
          ? Number(payload.stockQuantity)
          : 0,
      isActive: payload.isActive !== false
    },
    { categoryName }
  );

  return {
    ...normalizedProduct,
    displayPrice:
      payload.displayPrice ||
      buildDisplayPrice(resolvedPrice, normalizedUnit, normalizedVariants)
  };
};

export const getProducts = asyncHandler(async (req, res) => {
  await ensureCatalogDataSynchronized();
  const { category, search, featured, includeInactive } = req.query;
  const query = {
    name: {
      $nin: legacyCakeSizeNames
    }
  };

  if (includeInactive !== "true") {
    query.isActive = { $ne: false };
  }

  if (featured === "true") {
    query.featured = true;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }

  if (category) {
    const categoryFilters = [{ slug: category }];

    if (mongoose.isValidObjectId(category)) {
      categoryFilters.push({ _id: category });
    }

    const foundCategory = await Category.findOne({
      $or: categoryFilters
    });

    if (foundCategory) {
      query.category = foundCategory._id;
    }
  }

  const products = await Product.find(query)
    .populate("category", "name slug")
    .sort({ featured: -1, name: 1 });

  res.json(products.map(normalizeProductResponse));
});

export const getProductById = asyncHandler(async (req, res) => {
  await ensureCatalogDataSynchronized();
  const product = await Product.findById(req.params.id).populate("category", "name slug");

  if (!product || legacyCakeSizeNames.includes(product.name)) {
    return res.status(404).json({ message: "Ürün bulunamadı." });
  }

  res.json(normalizeProductResponse(product));
});

export const createProduct = asyncHandler(async (req, res) => {
  if (legacyCakeSizeNames.includes(req.body.name)) {
    return res.status(400).json({ message: "Pasta boy seçenekleri ayrı ürün olarak oluşturulamaz." });
  }

  const category = await Category.findById(req.body.category);

  if (!category) {
    return res.status(400).json({ message: "Seçilen kategori bulunamadı." });
  }

  const slug = req.body.slug ? slugify(req.body.slug) : slugify(req.body.name);
  const payload = normalizeProductPayload(req.body, category.name);

  const product = await Product.create({
    ...payload,
    slug
  });

  const populatedProduct = await Product.findById(product._id).populate("category", "name slug");

  res.status(201).json({
    message: "Ürün başarıyla oluşturuldu.",
    product: normalizeProductResponse(populatedProduct)
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Ürün bulunamadı." });
  }

  if (req.body.name && legacyCakeSizeNames.includes(req.body.name)) {
    return res.status(400).json({ message: "Pasta boy seçenekleri ayrı ürün olarak kaydedilemez." });
  }

  let resolvedCategory = null;

  if (req.body.category) {
    resolvedCategory = await Category.findById(req.body.category).select("name");

    if (!resolvedCategory) {
      return res.status(400).json({ message: "Seçilen kategori bulunamadı." });
    }
  }

  if (!resolvedCategory) {
    resolvedCategory = await Category.findById(product.category).select("name");
  }

  Object.assign(product, normalizeProductPayload(req.body, resolvedCategory?.name || ""));

  if (req.body.name || req.body.slug) {
    product.slug = slugify(req.body.slug || req.body.name);
  }

  await product.save();

  const populatedProduct = await Product.findById(product._id).populate("category", "name slug");

  res.json({
    message: "Ürün başarıyla güncellendi.",
    product: normalizeProductResponse(populatedProduct)
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Ürün bulunamadı." });
  }

  await product.deleteOne();

  res.json({
    message: "Ürün başarıyla silindi."
  });
});
