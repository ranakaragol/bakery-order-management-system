import User from "../models/User.js";
import InvoiceInfo from "../models/InvoiceInfo.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateToken } from "../utils/generateToken.js";
import { sendError } from "../utils/apiResponses.js";
import {
  applyAuthenticationCookies,
  clearAuthenticationCookies,
  ensureCsrfCookie
} from "../utils/authCookies.js";
import { sanitizeUser } from "../utils/sanitizeUser.js";
import {
  formatDeliveryAddress,
  hasCompleteBillingAddress,
  hasCompleteDeliveryAddress,
  mapBillingAddressToInvoiceInfo,
  normalizeBillingAddress,
  normalizeDeliveryAddress
} from "../../../shared/profile.js";

export const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;
  const rawDeliveryAddress = req.body.deliveryAddress || {};
  const rawProvince = String(rawDeliveryAddress.province || "").trim();
  const rawDistrict = String(rawDeliveryAddress.district || "").trim();
  const rawNeighborhood = String(rawDeliveryAddress.neighborhood || rawDeliveryAddress.mahalle || "").trim();
  const rawStreetAddress = String(
    rawDeliveryAddress.streetAddress ||
      rawDeliveryAddress.openAddress ||
      rawDeliveryAddress.addressLine ||
      rawDeliveryAddress.address ||
      req.body.address ||
      ""
  ).trim();
  const normalizedDeliveryAddress = normalizeDeliveryAddress(req.body.deliveryAddress, req.body.address);

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return sendError(res, 409, { message: "Bu e-posta adresiyle kayıtlı bir kullanıcı zaten var." });
  }

  if (!rawStreetAddress || !rawProvince || !rawDistrict || !rawNeighborhood) {
    return sendError(res, 400, {
      message: "Teslimat adresi için il, ilçe, mahalle ve açık adres bilgileri zorunludur."
    });
  }

  if (!hasCompleteDeliveryAddress(normalizedDeliveryAddress)) {
    return sendError(res, 400, {
      message: "Teslimat ili ve ilçesi geçersiz veya birbiriyle uyumsuz."
    });
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    address: formatDeliveryAddress(normalizedDeliveryAddress),
    deliveryAddress: normalizedDeliveryAddress,
    role: "customer"
  });

  const populatedUser = await User.findById(user._id).populate("invoiceInfo");
  const token = generateToken(user);

  applyAuthenticationCookies(req, res, token);

  res.status(201).json({
    message: "Kayıt işlemi başarıyla tamamlandı.",
    user: sanitizeUser(populatedUser)
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password").populate("invoiceInfo");

  if (!user || !(await user.comparePassword(password))) {
    return sendError(res, 401, { message: "E-posta veya şifre hatalı." });
  }

  const token = generateToken(user);

  applyAuthenticationCookies(req, res, token);

  res.json({
    message: "Giriş başarılı.",
    user: sanitizeUser(user)
  });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  ensureCsrfCookie(req, res);

  res.json({
    user: sanitizeUser(req.user)
  });
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthenticationCookies(res);

  res.json({
    message: "Çıkış başarılı."
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const fields = ["firstName", "lastName", "email", "phone"];
  const isCustomer = req.user.role === "customer";

  if (req.body.email && req.body.email !== req.user.email) {
    const existingUser = await User.findOne({ email: req.body.email });

    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return sendError(res, 409, { message: "Bu e-posta adresi zaten kullanımda." });
    }
  }

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      req.user[field] = req.body[field];
    }
  });

  if (!isCustomer && req.body.address !== undefined) {
    req.user.address = req.body.address;
  }

  if (req.body.deliveryAddress !== undefined || (isCustomer && req.body.address !== undefined)) {
    const rawDeliveryAddress = req.body.deliveryAddress || {};
    const rawProvince = String(rawDeliveryAddress.province || "").trim();
    const rawDistrict = String(rawDeliveryAddress.district || "").trim();
    const rawNeighborhood = String(rawDeliveryAddress.neighborhood || rawDeliveryAddress.mahalle || "").trim();
    const rawStreetAddress = String(
      rawDeliveryAddress.streetAddress ||
        rawDeliveryAddress.openAddress ||
        rawDeliveryAddress.addressLine ||
        rawDeliveryAddress.address ||
        req.body.address ||
        ""
    ).trim();
    const normalizedDeliveryAddress = normalizeDeliveryAddress(req.body.deliveryAddress, req.body.address);

    if (!rawStreetAddress || !rawProvince || !rawDistrict || !rawNeighborhood) {
      return sendError(res, 400, {
        message: "Teslimat adresi için il, ilçe, mahalle ve açık adres bilgileri zorunludur."
      });
    }

    if (!hasCompleteDeliveryAddress(normalizedDeliveryAddress)) {
      return sendError(res, 400, {
        message: "Teslimat ili ve ilçesi geçersiz veya birbiriyle uyumsuz."
      });
    }

    req.user.deliveryAddress = normalizedDeliveryAddress;
    req.user.address = formatDeliveryAddress(normalizedDeliveryAddress);
  }

  if (req.body.billingAddress) {
    const normalizedBillingAddress = normalizeBillingAddress(req.body.billingAddress);
    req.user.billingAddress = normalizedBillingAddress;

    if (hasCompleteBillingAddress(normalizedBillingAddress)) {
      if (req.user.invoiceInfo) {
        const existingInvoiceInfo = await InvoiceInfo.findById(req.user.invoiceInfo._id || req.user.invoiceInfo);

        if (existingInvoiceInfo) {
          Object.assign(
            existingInvoiceInfo,
            mapBillingAddressToInvoiceInfo(normalizedBillingAddress, existingInvoiceInfo.toObject())
          );
          await existingInvoiceInfo.save();
        } else {
          const invoiceInfo = await InvoiceInfo.create({
            ...mapBillingAddressToInvoiceInfo(normalizedBillingAddress),
            user: req.user._id
          });

          req.user.invoiceInfo = invoiceInfo._id;
        }
      } else {
        const invoiceInfo = await InvoiceInfo.create({
          ...mapBillingAddressToInvoiceInfo(normalizedBillingAddress),
          user: req.user._id
        });

        req.user.invoiceInfo = invoiceInfo._id;
      }
    }
  }

  await req.user.save();

  const updatedUser = await User.findById(req.user._id).populate("invoiceInfo");

  res.json({
    message: "Profil başarıyla güncellendi.",
    user: sanitizeUser(updatedUser)
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("invoiceInfo");

  res.json({
    user: sanitizeUser(user)
  });
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password").populate("invoiceInfo");

  if (!user || !(await user.comparePassword(currentPassword))) {
    return sendError(res, 400, { message: "Mevcut şifre hatalı." });
  }

  user.password = newPassword;
  await user.save();

  res.json({
    message: "Şifre başarıyla güncellendi."
  });
});
