import User from "../models/User.js";
import InvoiceInfo from "../models/InvoiceInfo.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateToken } from "../utils/generateToken.js";
import { sanitizeUser } from "../utils/sanitizeUser.js";
import {
  hasCompleteBillingAddress,
  mapBillingAddressToInvoiceInfo,
  normalizeBillingAddress
} from "../../../shared/profile.js";

export const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, address } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(409).json({ message: "Bu e-posta adresiyle kayıtlı bir kullanıcı zaten var." });
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    address,
    role: "customer"
  });

  const populatedUser = await User.findById(user._id).populate("invoiceInfo");

  res.status(201).json({
    message: "Kayıt işlemi başarıyla tamamlandı.",
    token: generateToken(user),
    user: sanitizeUser(populatedUser)
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password").populate("invoiceInfo");

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "E-posta veya şifre hatalı." });
  }

  res.json({
    message: "Giriş başarılı.",
    token: generateToken(user),
    user: sanitizeUser(user)
  });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({
    user: sanitizeUser(req.user)
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const fields = ["firstName", "lastName", "email", "phone", "address"];

  if (req.body.email && req.body.email !== req.user.email) {
    const existingUser = await User.findOne({ email: req.body.email });

    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(409).json({ message: "Bu e-posta adresi zaten kullanımda." });
    }
  }

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      req.user[field] = req.body[field];
    }
  });

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
    return res.status(400).json({ message: "Mevcut şifre hatalı." });
  }

  user.password = newPassword;
  await user.save();

  res.json({
    message: "Şifre başarıyla güncellendi."
  });
});
