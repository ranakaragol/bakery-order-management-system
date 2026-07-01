import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const recalculateCart = (cart) => {
  cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.subtotal = Number(
    cart.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2)
  );
};

const populateCart = (cart) =>
  cart.populate({
    path: "items.product",
    select: "name slug price imageUrl stockStatus stockQuantity category",
    populate: {
      path: "category",
      select: "name slug"
    }
  });

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [],
      itemCount: 0,
      subtotal: 0
    });
  }

  return cart;
};

export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  await populateCart(cart);
  res.json(cart);
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  if (product.stockStatus === "out_of_stock") {
    return res.status(400).json({ message: "This product is currently out of stock." });
  }

  const cart = await getOrCreateCart(req.user._id);
  const existingItem = cart.items.find((item) => item.product.toString() === productId);

  if (existingItem) {
    existingItem.quantity += Number(quantity);
    existingItem.unitPrice = product.price;
  } else {
    cart.items.push({
      product: product._id,
      nameSnapshot: product.name,
      imageUrlSnapshot: product.imageUrl,
      quantity: Number(quantity),
      unitPrice: product.price
    });
  }

  recalculateCart(cart);
  await cart.save();
  await populateCart(cart);

  res.status(201).json({
    message: "Product added to cart.",
    cart
  });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);

  if (!item) {
    return res.status(404).json({ message: "Cart item not found." });
  }

  item.quantity = Number(req.body.quantity);
  recalculateCart(cart);
  await cart.save();
  await populateCart(cart);

  res.json({
    message: "Cart item updated.",
    cart
  });
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);

  if (!item) {
    return res.status(404).json({ message: "Cart item not found." });
  }

  item.deleteOne();
  recalculateCart(cart);
  await cart.save();
  await populateCart(cart);

  res.json({
    message: "Cart item removed.",
    cart
  });
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  recalculateCart(cart);
  await cart.save();

  res.json({
    message: "Cart cleared successfully.",
    cart
  });
});
