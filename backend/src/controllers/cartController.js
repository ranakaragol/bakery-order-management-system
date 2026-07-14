import Cart from "../models/Cart.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureCatalogProduct } from "../utils/catalogResolver.js";
import { normalizeProductResponse } from "../utils/normalizeProductResponse.js";
import {
  calculateCartItemCount,
  calculateCartSubtotal,
  calculateLineTotal,
  isValidQuantityForUnit,
  normalizeQuantity
} from "../../../shared/commerce.js";

const recalculateCart = (cart) => {
  cart.items.forEach((item) => {
    item.quantity = item.unitSnapshot
      ? normalizeQuantity(item.quantity, item.unitSnapshot)
      : Number(item.quantity || 0);
    item.lineTotal = calculateLineTotal(item.unitPrice, item.quantity);
  });
  cart.itemCount = calculateCartItemCount(cart.items);
  cart.subtotal = calculateCartSubtotal(cart.items);
};

const populateCart = (cart) =>
  cart.populate({
    path: "items.product",
    select:
      "name slug price image imageUrl unit weight portion variants shelfLife storageCondition stockStatus stockQuantity category",
    populate: {
      path: "category",
      select: "name slug"
    }
  });

const normalizeCartResponse = (cart) => {
  const cartObject = typeof cart.toObject === "function" ? cart.toObject() : cart;

  return {
    ...cartObject,
    items: cartObject.items.map((item) => {
      const normalizedProduct = normalizeProductResponse(item.product);
      const normalizedNameSnapshot = item.variantName
        ? `${normalizedProduct.name} - ${item.variantName.replace(" Pasta", "")}`
        : normalizedProduct?.name || item.nameSnapshot;

      return {
        ...item,
        product: normalizedProduct,
        nameSnapshot: normalizedNameSnapshot,
        unitSnapshot: item.unitSnapshot || normalizedProduct.unit,
        lineTotal: item.lineTotal ?? calculateLineTotal(item.unitPrice, item.quantity)
      };
    })
  };
};

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
  recalculateCart(cart);
  await cart.save();
  await populateCart(cart);
  res.json(normalizeCartResponse(cart));
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, variantId = "" } = req.body;
  const product = await ensureCatalogProduct(productId);

  if (!product) {
    return res.status(404).json({ message: "Ürün bulunamadı." });
  }

  if (product.stockStatus === "out_of_stock") {
    return res.status(400).json({ message: "Bu ürün şu anda stokta yok." });
  }

  const normalizedProduct = normalizeProductResponse(product);
  const hasVariants = Array.isArray(normalizedProduct.variants) && normalizedProduct.variants.length > 0;
  const selectedVariant = hasVariants ? normalizedProduct.variants.find((variant) => variant.id === variantId) : null;

  if (hasVariants && !selectedVariant) {
    return res.status(400).json({ message: "Bu pasta için sepete eklemeden önce boy seçmelisiniz." });
  }

  if (!hasVariants && (normalizedProduct.price === null || normalizedProduct.price === undefined)) {
    return res.status(400).json({ message: "Bu ürün için sipariş öncesi fiyat teyidi gereklidir." });
  }

  const resolvedVariantId = selectedVariant?.id || "";
  const resolvedVariantName = selectedVariant?.name || "";
  const resolvedUnitPrice = selectedVariant?.price ?? normalizedProduct.price;
  const resolvedProductId = product._id.toString();
  const resolvedUnit = normalizedProduct.unit;
  const resolvedNameSnapshot = selectedVariant
    ? `${normalizedProduct.name} - ${selectedVariant.name.replace(" Pasta", "")}`
    : normalizedProduct.name;
  const resolvedQuantity = normalizeQuantity(quantity, resolvedUnit);

  if (!isValidQuantityForUnit(Number(quantity), resolvedUnit)) {
    return res.status(400).json({ message: "Bu ürün için miktar değeri geçersiz." });
  }

  const cart = await getOrCreateCart(req.user._id);
  const existingItem = cart.items.find(
    (item) => item.product.toString() === resolvedProductId && (item.variantId || "") === resolvedVariantId
  );

  if (existingItem) {
    existingItem.quantity = normalizeQuantity(existingItem.quantity + resolvedQuantity, resolvedUnit);
    existingItem.unitPrice = resolvedUnitPrice;
    existingItem.variantName = resolvedVariantName;
    existingItem.nameSnapshot = resolvedNameSnapshot;
    existingItem.unitSnapshot = resolvedUnit;
    existingItem.lineTotal = calculateLineTotal(resolvedUnitPrice, existingItem.quantity);
  } else {
    cart.items.push({
      product: product._id,
      nameSnapshot: resolvedNameSnapshot,
      imageUrlSnapshot: normalizedProduct.image || normalizedProduct.imageUrl,
      variantId: resolvedVariantId,
      variantName: resolvedVariantName,
      unitSnapshot: resolvedUnit,
      quantity: resolvedQuantity,
      unitPrice: resolvedUnitPrice,
      lineTotal: calculateLineTotal(resolvedUnitPrice, resolvedQuantity)
    });
  }

  recalculateCart(cart);
  await cart.save();
  await populateCart(cart);

  res.status(201).json({
    message: "Ürün sepete eklendi.",
    cart: normalizeCartResponse(cart)
  });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);

  if (!item) {
    return res.status(404).json({ message: "Sepet ürünü bulunamadı." });
  }

  const product = item.unitSnapshot ? null : await ensureCatalogProduct(item.product.toString());
  const resolvedUnit = item.unitSnapshot || product?.unit || "";

  if (!isValidQuantityForUnit(Number(req.body.quantity), resolvedUnit)) {
    return res.status(400).json({ message: "Bu ürün için miktar değeri geçersiz." });
  }

  item.unitSnapshot = resolvedUnit;
  item.quantity = normalizeQuantity(req.body.quantity, resolvedUnit);
  item.lineTotal = calculateLineTotal(item.unitPrice, item.quantity);
  recalculateCart(cart);
  await cart.save();
  await populateCart(cart);

  res.json({
    message: "Sepet ürünü güncellendi.",
    cart: normalizeCartResponse(cart)
  });
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);

  if (!item) {
    return res.status(404).json({ message: "Sepet ürünü bulunamadı." });
  }

  item.deleteOne();
  recalculateCart(cart);
  await cart.save();
  await populateCart(cart);

  res.json({
    message: "Ürün sepetten kaldırıldı.",
    cart: normalizeCartResponse(cart)
  });
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  recalculateCart(cart);
  await cart.save();

  res.json({
    message: "Sepet temizlendi.",
    cart
  });
});
