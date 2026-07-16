import Cart from "../models/Cart.js";
import InvoiceInfo from "../models/InvoiceInfo.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { normalizeProductResponse } from "../utils/normalizeProductResponse.js";
import {
  formatDeliveryAddress,
  hasCompleteBillingAddress,
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
  normalizeQuantity
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
    return res.status(400).json({ message: "Sepetiniz boş." });
  }

  const orderItems = [];

  for (const item of cart.items) {
    const normalizedProduct = normalizeProductResponse(item.product);
    if (!normalizedProduct) {
      return res.status(400).json({ message: "Siparişteki ürünlerden biri doğrulanamadı." });
    }
    const hasVariants = Array.isArray(normalizedProduct?.variants) && normalizedProduct.variants.length > 0;
    const selectedVariant = hasVariants
      ? normalizedProduct.variants.find((variant) => variant.id === (item.variantId || ""))
      : null;
    const resolvedUnit = normalizedProduct?.unit || item.unitSnapshot || "";
    const resolvedQuantity = normalizeQuantity(item.quantity, resolvedUnit);

    if (!isValidQuantityForUnit(resolvedQuantity, resolvedUnit)) {
      return res.status(400).json({ message: "Siparişteki ürün miktarı geçersiz." });
    }

    if (hasVariants && !selectedVariant) {
      return res.status(400).json({ message: "Siparişteki pasta varyantı geçersiz." });
    }

    const resolvedUnitPrice = selectedVariant?.price ?? normalizedProduct?.price;

    if (!Number.isFinite(Number(resolvedUnitPrice))) {
      return res.status(400).json({ message: "Siparişteki ürün fiyatı doğrulanamadı." });
    }

    orderItems.push({
      product: item.product._id,
      name: item.nameSnapshot,
      imageUrl: item.imageUrlSnapshot,
      variantId: item.variantId || "",
      variantName: item.variantName || "",
      unit: resolvedUnit,
      quantity: resolvedQuantity,
      unitPrice: resolvedUnitPrice,
      lineTotal: calculateLineTotal(resolvedUnitPrice, resolvedQuantity)
    });
  }

  const subtotal = calculateCartSubtotal(orderItems);
  const normalizedDeliveryAddress = normalizeDeliveryAddress(req.body.deliveryAddress);

  if (!rawStreetAddress || !rawProvince || !rawDistrict || !rawNeighborhood) {
    return res.status(400).json({
      message: "Teslimat adresi için il, ilçe, mahalle ve açık adres bilgileri zorunludur."
    });
  }

  if (!normalizedDeliveryAddress.province || !normalizedDeliveryAddress.district) {
    return res.status(400).json({
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
    return res.status(400).json({
      message: "Teslimat ili ve ilçesi geçersiz veya birbiriyle uyumsuz."
    });
  }

  if (deliveryRuleStatus.isBlocked) {
    return res.status(422).json({
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

  let invoiceInfo;

  if (req.body.invoiceInfo && Object.keys(req.body.invoiceInfo).length > 0) {
    if (req.user.invoiceInfo) {
      invoiceInfo = await InvoiceInfo.findById(req.user.invoiceInfo._id || req.user.invoiceInfo);
      Object.assign(invoiceInfo, req.body.invoiceInfo);
      await invoiceInfo.save();
    } else {
      invoiceInfo = await InvoiceInfo.create({
        ...req.body.invoiceInfo,
        user: req.user._id,
        email: req.body.invoiceInfo.email || req.user.email,
        phone: req.body.invoiceInfo.phone || req.user.phone
      });

      await User.findByIdAndUpdate(req.user._id, { invoiceInfo: invoiceInfo._id });
    }
  } else {
    invoiceInfo = req.user.invoiceInfo
      ? await InvoiceInfo.findById(req.user.invoiceInfo._id || req.user.invoiceInfo)
      : null;
  }

  if (!invoiceInfo) {
    return res.status(400).json({ message: "Sipariş oluşturmak için fatura bilgileri gereklidir." });
  }

  const effectiveBillingAddress = mergeBillingAddressSources(
    req.user.billingAddress,
    mapInvoiceInfoToBillingAddress(req.user.invoiceInfo),
    mapInvoiceInfoToBillingAddress(invoiceInfo)
  );

  if (!hasCompleteBillingAddress(effectiveBillingAddress)) {
    return res.status(400).json({
      message: "Sipariş verebilmek için önce fatura adresinizi tamamlamanız gerekiyor."
    });
  }

  req.user.billingAddress = effectiveBillingAddress;
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
    return res.status(404).json({ message: "Sipariş bulunamadı." });
  }

  const isOwner = order.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "Bu siparişi görüntüleme yetkiniz yok." });
  }

  res.json(order);
});
