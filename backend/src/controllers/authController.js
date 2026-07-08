import InvoiceInfo from "../models/InvoiceInfo.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateToken } from "../utils/generateToken.js";
import { sanitizeUser } from "../utils/sanitizeUser.js";

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
  const fields = ["firstName", "lastName", "email", "phone", "address", "password"];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      req.user[field] = req.body[field];
    }
  });

  await req.user.save();

  const incomingInvoiceInfo = req.body.invoiceInfo || {};
  let invoiceInfo = req.user.invoiceInfo;

  if (invoiceInfo) {
    invoiceInfo = await InvoiceInfo.findById(invoiceInfo._id || invoiceInfo);
    Object.assign(invoiceInfo, incomingInvoiceInfo);
    await invoiceInfo.save();
  } else if (Object.keys(incomingInvoiceInfo).length > 0) {
    invoiceInfo = await InvoiceInfo.create({
      ...incomingInvoiceInfo,
      user: req.user._id,
      email: incomingInvoiceInfo.email || req.user.email,
      phone: incomingInvoiceInfo.phone || req.user.phone
    });
    req.user.invoiceInfo = invoiceInfo._id;
    await req.user.save();
  }

  const updatedUser = await User.findById(req.user._id).populate("invoiceInfo");

  res.json({
    message: "Profil başarıyla güncellendi.",
    user: sanitizeUser(updatedUser)
  });
});
