import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { slugify } from "../utils/slugify.js";

export const getProducts = asyncHandler(async (req, res) => {
  const { category, search, featured } = req.query;
  const query = {};

  if (featured === "true") {
    query.featured = true;
  }

  if (search) {
    query.name = { $regex: search, $options: "i" };
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
    .sort({ featured: -1, createdAt: -1 });

  res.json(products);
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category", "name slug");

  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  res.json(product);
});

export const createProduct = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.body.category);

  if (!category) {
    return res.status(400).json({ message: "Selected category could not be found." });
  }

  const slug = req.body.slug ? slugify(req.body.slug) : slugify(req.body.name);

  const product = await Product.create({
    ...req.body,
    slug
  });

  const populatedProduct = await Product.findById(product._id).populate("category", "name slug");

  res.status(201).json({
    message: "Product created successfully.",
    product: populatedProduct
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  if (req.body.category) {
    const category = await Category.findById(req.body.category);

    if (!category) {
      return res.status(400).json({ message: "Selected category could not be found." });
    }
  }

  Object.assign(product, req.body);

  if (req.body.name || req.body.slug) {
    product.slug = slugify(req.body.slug || req.body.name);
  }

  await product.save();

  const populatedProduct = await Product.findById(product._id).populate("category", "name slug");

  res.json({
    message: "Product updated successfully.",
    product: populatedProduct
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  await product.deleteOne();

  res.json({
    message: "Product deleted successfully."
  });
});
