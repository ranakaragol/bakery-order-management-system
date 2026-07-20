import Category from "../models/Category.js";
import ContactInfo from "../models/ContactInfo.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { pasaliContactInfo } from "../../../shared/pasaliCatalogData.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendError } from "../utils/apiResponses.js";
import { ensureCatalogDataSynchronized } from "../utils/catalogSync.js";
import { sanitizeUser } from "../utils/sanitizeUser.js";

const legacyCakeSizeNames = ["Tek Pasta", "0 No Pasta", "1 No Pasta", "2 No Pasta"];

export const getDashboard = asyncHandler(async (req, res) => {
  await ensureCatalogDataSynchronized();
  const [
    productCount,
    categoryCount,
    customerCount,
    orderCount,
    bankTransferOrderCount,
    cashOnDeliveryOrderCount,
    recentOrders,
    recentBankTransferOrders,
    recentCashOrders
  ] = await Promise.all([
    Product.countDocuments({ name: { $nin: legacyCakeSizeNames } }),
    Category.countDocuments(),
    User.countDocuments({ role: "customer" }),
    Order.countDocuments(),
    Order.countDocuments({ paymentMethod: "bank_transfer" }),
    Order.countDocuments({ paymentMethod: "cash_on_delivery" }),
    Order.find()
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(5),
    Order.find({ paymentMethod: "bank_transfer" })
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(5),
    Order.find({ paymentMethod: "cash_on_delivery" })
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  res.json({
    metrics: {
      productCount,
      categoryCount,
      customerCount,
      orderCount,
      bankTransferOrderCount,
      cashOnDeliveryOrderCount
    },
    recentOrders,
    recentBankTransferOrders,
    recentCashOrders
  });
});

export const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("invoiceInfo")
    .populate("user", "firstName lastName email phone address")
    .sort({ createdAt: -1 });

  res.json(orders);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return sendError(res, 404, { message: "Sipariş bulunamadı." });
  }

  order.status = req.body.status;
  await order.save();

  res.json({
    message: "Sipariş durumu başarıyla güncellendi.",
    order
  });
});

export const getCustomers = asyncHandler(async (req, res) => {
  const customers = await User.find({ role: "customer" })
    .populate("invoiceInfo")
    .sort({ createdAt: -1 });

  res.json(customers.map(sanitizeUser));
});

export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await User.findOne({ _id: req.params.id, role: "customer" }).populate("invoiceInfo");

  if (!customer) {
    return sendError(res, 404, { message: "Müşteri bulunamadı." });
  }

  const orders = await Order.find({ user: customer._id }).sort({ createdAt: -1 });

  res.json({
    customer: sanitizeUser(customer),
    orders
  });
});

export const getContactInfo = asyncHandler(async (req, res) => {
  const contactInfo = await ContactInfo.findOne().sort({ createdAt: -1 });

  res.json(
    contactInfo || {
      heroTitle: pasaliContactInfo.heroTitle,
      heroDescription: pasaliContactInfo.heroDescription,
      phone: pasaliContactInfo.phone,
      email: pasaliContactInfo.email,
      address: pasaliContactInfo.address,
      mapUrl: "",
      workingHours: pasaliContactInfo.workingHours,
      aboutContent: {
        titleTr: pasaliContactInfo.aboutContent.titleTr,
        bodyTr: pasaliContactInfo.aboutContent.bodyTr,
        titleEn: pasaliContactInfo.aboutContent.titleEn,
        bodyEn: pasaliContactInfo.aboutContent.bodyEn
      },
      paymentDetails: {
        accountHolder: pasaliContactInfo.paymentDetails.accountHolder,
        iban: pasaliContactInfo.paymentDetails.iban,
        bankName: pasaliContactInfo.paymentDetails.bankName
      },
      socialLinks: {
        instagram: pasaliContactInfo.socialLinks.instagram,
        facebook: "",
        whatsapp: ""
      }
    }
  );
});

export const upsertContactInfo = asyncHandler(async (req, res) => {
  let contactInfo = await ContactInfo.findOne().sort({ createdAt: -1 });

  if (!contactInfo) {
    contactInfo = await ContactInfo.create(req.body);
  } else {
    Object.assign(contactInfo, req.body);
    await contactInfo.save();
  }

  res.json({
    message: "Site bilgileri başarıyla güncellendi.",
    contactInfo
  });
});
