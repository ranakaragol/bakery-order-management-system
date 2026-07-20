import Cart from "../models/Cart.js";
import Category from "../models/Category.js";
import InvoiceInfo from "../models/InvoiceInfo.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isProductCategoryVisible } from "../utils/catalogProductVisibility.js";
import { sendError } from "../utils/apiResponses.js";
import { normalizeProductResponse } from "../utils/normalizeProductResponse.js";
import {
  buildMissingBillingAddressMessage,
  formatDeliveryAddress,
  hasCompleteBillingAddress,
  mapBillingAddressToInvoiceInfo,
  mergeBillingAddressSources,
  mapInvoiceInfoToBillingAddress,
  normalizeDeliveryAddress
} from "../../../shared/profile.js";
import {
  calculateCartSubtotal,
  calculateDeliveryFee,
  calculateLineTotal,
  calculateOrderTotal,
  isValidQuantityForUnit,
  normalizeQuantity,
  normalizeUnit
} from "../../../shared/commerce.js";
import {
  MINIMUM_ORDER_WARNING_MESSAGE,
  getMinimumOrderRuleStatus
} from "../../../shared/deliveryZones.js";

const formatMoney = (value = 0) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY"
  }).format(Number(value || 0));

const buildOrderItemConflictResponse = (itemName, message, code) => ({
  message: `"${itemName}" için sipariş oluşturulamadı: ${message}`,
  code,
  itemName
});

export const createOrder = asyncHandler(async (req, res) => {
  const paymentMethod = req.body.paymentMethod === "bank_transfer" ? "bank_transfer" : "cash_on_delivery";
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  const rawDeliveryAddress = req.body.deliveryAddress || {};
  const rawProvince = String(rawDeliveryAddress.province || "").trim();
  const rawDistrict = String(rawDeliveryAddress.district || "").trim();
  const rawNeighborhood = String(rawDeliveryAddress.neighborhood || rawDeliveryAddress.mahalle || "").trim();
  const rawStreetAddress = String(
    rawDeliveryAddress.streetAddress ||
      rawDeliveryAddress.openAddress ||
      rawDeliveryAddress.addressLine ||
      rawDeliveryAddress.address ||
      ""
  ).trim();

  if (!cart || cart.items.length === 0) {
    return sendError(res, 400, { message: "Sepetiniz boş." });
  }

  const orderItems = [];
  const categoryIds = [
    ...new Set(
      cart.items.map((item) => item.product?.category).filter(Boolean).map((categoryId) => String(categoryId))
    )
  ];
  const categories = categoryIds.length
    ? await Category.find({ _id: { $in: categoryIds } }).select("isActive")
    : [];
  const categoryMap = new Map(categories.map((category) => [String(category._id), category]));

  for (const item of cart.items) {
    const normalizedProduct = normalizeProductResponse(item.product);
    const orderItemName = item.nameSnapshot || normalizedProduct?.name || "Ürün";

    if (!normalizedProduct) {
      return sendError(
        res,
        409,
        buildOrderItemConflictResponse(
          orderItemName,
          "ürün artık mevcut değil. Sepetinizi güncelleyip tekrar deneyin.",
          "ORDER_ITEM_REMOVED"
        )
      );
    }

    if (normalizedProduct.isActive === false) {
      return sendError(
        res,
        409,
        buildOrderItemConflictResponse(
          orderItemName,
          "ürün şu anda satışa kapalı. Sepetinizi güncelleyip tekrar deneyin.",
          "ORDER_ITEM_INACTIVE"
        )
      );
    }

    const currentCategory = categoryMap.get(String(item.product?.category || ""));

    if (!isProductCategoryVisible(currentCategory)) {
      return sendError(
        res,
        409,
        buildOrderItemConflictResponse(
          orderItemName,
          "ürünün kategorisi şu anda satışa kapalı. Sepetinizi güncelleyip tekrar deneyin.",
          "ORDER_ITEM_CATEGORY_INACTIVE"
        )
      );
    }

    if (normalizedProduct.stockStatus === "out_of_stock") {
      return sendError(
        res,
        409,
        buildOrderItemConflictResponse(
          orderItemName,
          "ürün stokta yok. Sepetinizi güncelleyip tekrar deneyin.",
          "ORDER_ITEM_OUT_OF_STOCK"
        )
      );
    }

    const hasVariants = Array.isArray(normalizedProduct?.variants) && normalizedProduct.variants.length > 0;
    const selectedVariant = hasVariants
      ? normalizedProduct.variants.find((variant) => variant.id === (item.variantId || ""))
      : null;
    const currentUnit = normalizedProduct?.unit || "";
    const savedUnit = item.unitSnapshot || currentUnit;

    if (savedUnit && currentUnit && normalizeUnit(savedUnit) !== normalizeUnit(currentUnit)) {
      return sendError(
        res,
        409,
        buildOrderItemConflictResponse(
          orderItemName,
          "satış birimi değişti. Sepetinizi güncelleyip tekrar deneyin.",
          "ORDER_ITEM_UNIT_CHANGED"
        )
      );
    }

    if (!isValidQuantityForUnit(item.quantity, currentUnit)) {
      return sendError(
        res,
        409,
        buildOrderItemConflictResponse(
          orderItemName,
          "miktar güncel satış kurallarıyla uyumlu değil. Sepetinizi güncelleyip tekrar deneyin.",
          "ORDER_ITEM_INVALID_QUANTITY"
        )
      );
    }

    const resolvedQuantity = normalizeQuantity(item.quantity, currentUnit);

    if (hasVariants && !selectedVariant) {
      return sendError(
        res,
        409,
        buildOrderItemConflictResponse(
          orderItemName,
          "ürünün seçili boyutu artık geçerli değil. Sepetinizi güncelleyip tekrar deneyin.",
          "ORDER_ITEM_VARIANT_INVALID"
        )
      );
    }

    const resolvedUnitPrice = selectedVariant?.price ?? normalizedProduct?.price;

    if (!Number.isFinite(Number(resolvedUnitPrice))) {
      return sendError(
        res,
        409,
        buildOrderItemConflictResponse(
          orderItemName,
          "ürünün güncel fiyatı doğrulanamadı. Sepetinizi güncelleyip tekrar deneyin.",
          "ORDER_ITEM_PRICE_INVALID"
        )
      );
    }

    orderItems.push({
      product: item.product._id,
      name: orderItemName,
      imageUrl: item.imageUrlSnapshot,
      variantId: item.variantId || "",
      variantName: item.variantName || "",
      unit: currentUnit,
      quantity: resolvedQuantity,
      unitPrice: resolvedUnitPrice,
      lineTotal: calculateLineTotal(resolvedUnitPrice, resolvedQuantity)
    });
  }

  const subtotal = calculateCartSubtotal(orderItems);
  const normalizedDeliveryAddress = normalizeDeliveryAddress(req.body.deliveryAddress);

  if (!rawStreetAddress || !rawProvince || !rawDistrict || !rawNeighborhood) {
    return sendError(res, 400, {
      message: "Teslimat adresi için il, ilçe, mahalle ve açık adres bilgileri zorunludur."
    });
  }

  if (!normalizedDeliveryAddress.province || !normalizedDeliveryAddress.district) {
    return sendError(res, 400, {
      message: "Teslimat ili ve ilçesi geçersiz veya birbiriyle uyumsuz."
    });
  }

  const baseDeliveryFee = calculateDeliveryFee(subtotal);
  const deliveryRuleStatus = getMinimumOrderRuleStatus({
    province: normalizedDeliveryAddress.province,
    district: normalizedDeliveryAddress.district,
    subtotal,
    fallbackDeliveryFee: baseDeliveryFee
  });

  if (!deliveryRuleStatus.province || !deliveryRuleStatus.district || !deliveryRuleStatus.regionKey) {
    return sendError(res, 400, {
      message: "Teslimat ili ve ilçesi geçersiz veya birbiriyle uyumsuz."
    });
  }

  if (deliveryRuleStatus.isBlocked) {
    return sendError(res, 422, {
      message: `${MINIMUM_ORDER_WARNING_MESSAGE} Sipariş verebilmek için sepetinize ${formatMoney(
        deliveryRuleStatus.remainingAmount
      )} daha ürün eklemelisiniz.`,
      code: "DELIVERY_REGION_MINIMUM_ORDER",
      minimumOrderAmount: deliveryRuleStatus.minimumOrderAmount,
      remainingAmount: deliveryRuleStatus.remainingAmount,
      province: deliveryRuleStatus.province,
      district: deliveryRuleStatus.district,
      region: deliveryRuleStatus.regionKey
    });
  }

  const effectiveBillingAddress = mergeBillingAddressSources(
    req.user.billingAddress,
    mapInvoiceInfoToBillingAddress(req.user.invoiceInfo),
    mapInvoiceInfoToBillingAddress(req.body.invoiceInfo)
  );

  if (!hasCompleteBillingAddress(effectiveBillingAddress)) {
    return sendError(res, 400, {
      message: buildMissingBillingAddressMessage(effectiveBillingAddress)
    });
  }

  const invoicePayload = {
    ...mapBillingAddressToInvoiceInfo(effectiveBillingAddress, req.body.invoiceInfo),
    user: req.user._id
  };
  let invoiceInfo = req.user.invoiceInfo
    ? await InvoiceInfo.findById(req.user.invoiceInfo._id || req.user.invoiceInfo)
    : null;

  if (invoiceInfo) {
    Object.assign(invoiceInfo, invoicePayload);
    await invoiceInfo.save();
  } else {
    invoiceInfo = await InvoiceInfo.create(invoicePayload);
    await User.findByIdAndUpdate(req.user._id, { invoiceInfo: invoiceInfo._id });
  }

  req.user.billingAddress = effectiveBillingAddress;
  req.user.invoiceInfo = invoiceInfo._id;
  await req.user.save();

  const deliveryFee = deliveryRuleStatus.deliveryFee;
  const totalAmount = calculateOrderTotal(subtotal, deliveryFee);
  const formattedDeliveryAddress = formatDeliveryAddress(normalizedDeliveryAddress);

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    subtotal,
    deliveryFee,
    totalAmount,
    paymentMethod,
    paymentStatus: "unpaid",
    addressSnapshot: formattedDeliveryAddress,
    deliveryAddressSnapshot: {
      addressTitle: normalizedDeliveryAddress.addressTitle,
      province: deliveryRuleStatus.province,
      district: deliveryRuleStatus.district,
      neighborhood: normalizedDeliveryAddress.neighborhood,
      streetAddress: normalizedDeliveryAddress.streetAddress,
      postalCode: normalizedDeliveryAddress.postalCode,
      formattedAddress: formattedDeliveryAddress,
      region: deliveryRuleStatus.regionKey
    },
    notes: req.body.notes || "",
    invoiceInfo: invoiceInfo._id
  });

  cart.items = [];
  cart.itemCount = 0;
  cart.subtotal = 0;
  await cart.save();

  const populatedOrder = await Order.findById(order._id)
    .populate("invoiceInfo")
    .populate("user", "firstName lastName email phone");

  res.status(201).json({
    message:
      paymentMethod === "bank_transfer"
        ? "Sipariş başarıyla oluşturuldu. Havale ödemeniz onaylandığında siparişiniz işleme alınacaktır."
        : "Sipariş başarıyla oluşturuldu. Ödeme teslimatta nakit olarak alınacaktır.",
    order: populatedOrder
  });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate("invoiceInfo")
    .sort({ createdAt: -1 });

  res.json(orders);
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("invoiceInfo")
    .populate("user", "firstName lastName email phone");

  if (!order) {
    return sendError(res, 404, { message: "Sipariş bulunamadı." });
  }

  const isOwner = order.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return sendError(res, 403, { message: "Bu siparişi görüntüleme yetkiniz yok." });
  }

  res.json(order);
});
