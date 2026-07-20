import dotenv from "dotenv";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import InvoiceInfo from "../models/InvoiceInfo.js";
import User from "../models/User.js";
import { connectDB } from "../config/db.js";

dotenv.config();

const ADMIN_COMPANY_NAME = "Paşalı Patisserie";
const requiredSeedFieldLabels = {
  taxNumber: "ADMIN_SEED_TAX_NUMBER",
  taxOffice: "ADMIN_SEED_TAX_OFFICE"
};

const normalizeSeedValue = (value = "", fallback = "") => String(value || fallback).trim();

export const buildAdminProfile = (env = process.env) => ({
  firstName: normalizeSeedValue(env.ADMIN_SEED_FIRST_NAME, "Example"),
  lastName: normalizeSeedValue(env.ADMIN_SEED_LAST_NAME, "Admin"),
  email: normalizeSeedValue(env.ADMIN_SEED_EMAIL, "admin@example.com").toLowerCase(),
  password: normalizeSeedValue(env.ADMIN_SEED_PASSWORD, "ChangeMe123!"),
  phone: normalizeSeedValue(env.ADMIN_SEED_PHONE, "+90 555 000 00 00"),
  address: normalizeSeedValue(env.ADMIN_SEED_ADDRESS, "Example Address"),
  taxNumber: normalizeSeedValue(env.ADMIN_SEED_TAX_NUMBER),
  taxOffice: normalizeSeedValue(env.ADMIN_SEED_TAX_OFFICE)
});

export const validateAdminProfile = (adminProfile) => {
  const missingFields = Object.entries(requiredSeedFieldLabels)
    .filter(([field]) => !adminProfile[field])
    .map(([, label]) => label);

  if (missingFields.length) {
    throw new Error(
      `Eksik admin seed alanlari: ${missingFields.join(", ")}. Lütfen backend/.env dosyanizi güncelleyin.`
    );
  }
};

const buildInvoicePayload = (adminProfile, userId) => ({
  user: userId,
  fullName: `${adminProfile.firstName} ${adminProfile.lastName}`.trim(),
  billingAddress: adminProfile.address,
  email: adminProfile.email,
  phone: adminProfile.phone,
  companyName: ADMIN_COMPANY_NAME,
  taxNumber: adminProfile.taxNumber,
  taxOffice: adminProfile.taxOffice
});

export const upsertAdmin = async ({
  env = process.env,
  connect = connectDB,
  userModel = User,
  invoiceInfoModel = InvoiceInfo,
  logger = console
} = {}) => {
  const adminProfile = buildAdminProfile(env);
  validateAdminProfile(adminProfile);

  await connect();

  let createdNewUser = false;
  let user = await userModel.findOne({ email: adminProfile.email }).populate("invoiceInfo");

  if (!user) {
    createdNewUser = true;
    user = await userModel.create({
      firstName: adminProfile.firstName,
      lastName: adminProfile.lastName,
      email: adminProfile.email,
      password: adminProfile.password,
      phone: adminProfile.phone,
      address: adminProfile.address,
      role: "admin"
    });
  } else {
    user.firstName = adminProfile.firstName;
    user.lastName = adminProfile.lastName;
    user.phone = adminProfile.phone;
    user.address = adminProfile.address;
    user.role = "admin";
    user.password = adminProfile.password;
    await user.save();
  }

  let invoiceInfo = user.invoiceInfo
    ? await invoiceInfoModel.findById(user.invoiceInfo._id || user.invoiceInfo)
    : null;
  const invoicePayload = buildInvoicePayload(adminProfile, user._id);
  const createdNewInvoiceInfo = !invoiceInfo;

  try {
    if (!invoiceInfo) {
      invoiceInfo = await invoiceInfoModel.create(invoicePayload);
    } else {
      Object.assign(invoiceInfo, invoicePayload);
      await invoiceInfo.save();
    }
  } catch (error) {
    if (createdNewUser && typeof user.deleteOne === "function") {
      try {
        await user.deleteOne();
      } catch {
        // Keep the original invoice creation error; cleanup is best-effort only.
      }
    }

    throw error;
  }

  if (String(user.invoiceInfo?._id || user.invoiceInfo || "") !== String(invoiceInfo._id || "")) {
    user.invoiceInfo = invoiceInfo._id;
    await user.save();
  }

  logger.log(`Admin user is ready: ${adminProfile.email}`);

  return {
    user,
    invoiceInfo,
    createdNewUser,
    createdNewInvoiceInfo
  };
};

const isExecutedDirectly = () => {
  const entryFile = process.argv[1];

  if (!entryFile) {
    return false;
  }

  return import.meta.url === pathToFileURL(resolve(entryFile)).href;
};

if (isExecutedDirectly()) {
  upsertAdmin()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Admin upsert failed.", error);
      process.exit(1);
    });
}
