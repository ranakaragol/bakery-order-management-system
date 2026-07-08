import Cart from "../models/Cart.js";
import InvoiceInfo from "../models/InvoiceInfo.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const calculateDeliveryFee = (subtotal) => (subtotal >= 2500 ? 0 : 120);

export const createOrder = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: "Sepetiniz boş." });
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

  const subtotal = Number(cart.subtotal.toFixed(2));
  const deliveryFee = calculateDeliveryFee(subtotal);
  const totalAmount = Number((subtotal + deliveryFee).toFixed(2));

  const order = await Order.create({
    user: req.user._id,
    items: cart.items.map((item) => ({
      product: item.product._id,
      name: item.nameSnapshot,
      imageUrl: item.imageUrlSnapshot,
      variantId: item.variantId || "",
      variantName: item.variantName || "",
      quantity: item.quantity,
      unitPrice: item.unitPrice
    })),
    subtotal,
    deliveryFee,
    totalAmount,
    addressSnapshot: req.body.address,
    notes: req.body.notes || "",
    invoiceInfo: invoiceInfo._id,
    paymentStatus: "paid"
  });

  cart.items = [];
  cart.itemCount = 0;
  cart.subtotal = 0;
  await cart.save();

  const populatedOrder = await Order.findById(order._id)
    .populate("invoiceInfo")
    .populate("user", "firstName lastName email phone");

  res.status(201).json({
    message: "Sipariş başarıyla oluşturuldu.",
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
