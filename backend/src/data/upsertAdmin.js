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
const userSeedFields = ["firstName", "lastName", "phone", "address", "role"];

const normalizeSeedValue = (value = "", fallback = "") => String(value || fallback).trim();
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

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

export const resolveAdminProfile = (env = process.env) => {
  const adminProfile = buildAdminProfile(env);
  validateAdminProfile(adminProfile);

  return adminProfile;
};

export const shouldApplyAdminPassword = (env = process.env) =>
  hasOwn(env, "ADMIN_SEED_PASSWORD") && normalizeSeedValue(env.ADMIN_SEED_PASSWORD).length > 0;

export const buildInvoicePayload = (adminProfile, userId) => ({
  user: userId,
  fullName: `${adminProfile.firstName} ${adminProfile.lastName}`.trim(),
  billingAddress: adminProfile.address,
  email: adminProfile.email,
  phone: adminProfile.phone,
  companyName: ADMIN_COMPANY_NAME,
  taxNumber: adminProfile.taxNumber,
  taxOffice: adminProfile.taxOffice
});

const buildUserPayload = (adminProfile, { includePassword = true } = {}) => {
  const payload = {
    firstName: adminProfile.firstName,
    lastName: adminProfile.lastName,
    email: adminProfile.email,
    phone: adminProfile.phone,
    address: adminProfile.address,
    role: "admin"
  };

  if (includePassword) {
    payload.password = adminProfile.password;
  }

  return payload;
};

const assignSeedUserFields = (user, adminProfile, { includePassword = false } = {}) => {
  Object.assign(user, buildUserPayload(adminProfile, { includePassword }));
};

const snapshotUserState = (user, { includePassword = false } = {}) => {
  const snapshot = userSeedFields.reduce(
    (state, field) => ({
      ...state,
      [field]: user[field]
    }),
    {}
  );

  if (includePassword && typeof user.password !== "undefined") {
    snapshot.password = user.password;
  }

  return snapshot;
};

const restoreUserState = async ({ userModel, user, snapshot }) => {
  if (!snapshot) {
    return;
  }

  if (typeof userModel.updateOne === "function") {
    await userModel.updateOne({ _id: user._id }, snapshot);
  } else if (typeof user.updateOne === "function") {
    await user.updateOne(snapshot);
  } else {
    throw new Error("Admin rollback could not be persisted.");
  }

  Object.assign(user, snapshot);
};

const createInvoiceDraft = (invoiceInfoModel, invoicePayload) => {
  if (typeof invoiceInfoModel === "function") {
    return new invoiceInfoModel(invoicePayload);
  }

  return null;
};

const validateInvoiceDraft = async (draft) => {
  if (!draft) {
    return;
  }

  if (typeof draft.validate === "function") {
    await draft.validate();
    return;
  }

  if (typeof draft.validateSync === "function") {
    const validationError = draft.validateSync();

    if (validationError) {
      throw validationError;
    }
  }
};

const logRollbackFailure = (logger) => {
  if (typeof logger?.error === "function") {
    logger.error("Admin rollback failed after invoice persistence error.");
  }
};

const removeInvoiceRecord = async (invoiceInfo) => {
  if (typeof invoiceInfo?.deleteOne === "function") {
    await invoiceInfo.deleteOne();
  }
};

export const upsertAdmin = async ({
  env = process.env,
  connect = connectDB,
  userModel = User,
  invoiceInfoModel = InvoiceInfo,
  logger = console,
  adminProfile = null
} = {}) => {
  const resolvedAdminProfile = adminProfile || buildAdminProfile(env);
  validateAdminProfile(resolvedAdminProfile);
  const shouldUpdatePassword = shouldApplyAdminPassword(env);

  await connect();

  let createdNewUser = false;
  let userQuery = userModel.findOne({ email: resolvedAdminProfile.email });

  if (shouldUpdatePassword && typeof userQuery?.select === "function") {
    userQuery = userQuery.select("+password");
  }

  if (typeof userQuery?.populate === "function") {
    userQuery = userQuery.populate("invoiceInfo");
  }

  let user = await userQuery;

  if (!user) {
    createdNewUser = true;
    user = await userModel.create(buildUserPayload(resolvedAdminProfile));
  }

  let invoiceInfo = user.invoiceInfo
    ? await invoiceInfoModel.findById(user.invoiceInfo._id || user.invoiceInfo)
    : null;
  const invoicePayload = buildInvoicePayload(resolvedAdminProfile, user._id);
  const createdNewInvoiceInfo = !invoiceInfo;
  const userSnapshot = createdNewUser
    ? null
    : snapshotUserState(user, { includePassword: shouldUpdatePassword && typeof user.password !== "undefined" });

  if (invoiceInfo) {
    Object.assign(invoiceInfo, invoicePayload);
    await validateInvoiceDraft(invoiceInfo);
  } else {
    await validateInvoiceDraft(createInvoiceDraft(invoiceInfoModel, invoicePayload));
  }

  if (!createdNewUser) {
    assignSeedUserFields(user, resolvedAdminProfile, { includePassword: shouldUpdatePassword });
    await user.save();
  }

  try {
    if (!invoiceInfo) {
      invoiceInfo = await invoiceInfoModel.create(invoicePayload);
    } else {
      await invoiceInfo.save();
    }
  } catch (error) {
    if (createdNewUser && typeof user.deleteOne === "function") {
      try {
        await user.deleteOne();
      } catch {
        // Keep the original invoice creation error; cleanup is best-effort only.
      }
    } else if (!createdNewUser) {
      try {
        await restoreUserState({ userModel, user, snapshot: userSnapshot });
      } catch {
        logRollbackFailure(logger);
      }
    }

    throw error;
  }

  if (String(user.invoiceInfo?._id || user.invoiceInfo || "") !== String(invoiceInfo._id || "")) {
    try {
      user.invoiceInfo = invoiceInfo._id;
      await user.save();
    } catch (error) {
      if (createdNewInvoiceInfo) {
        try {
          await removeInvoiceRecord(invoiceInfo);
        } catch {
          // Keep the original user save error; cleanup is best-effort only.
        }
      }

      if (createdNewUser && typeof user.deleteOne === "function") {
        try {
          await user.deleteOne();
        } catch {
          // Keep the original user save error; cleanup is best-effort only.
        }
      } else if (!createdNewUser) {
        try {
          await restoreUserState({ userModel, user, snapshot: userSnapshot });
        } catch {
          logRollbackFailure(logger);
        }
      }

      throw error;
    }
  }

  logger.log(`Admin user is ready: ${resolvedAdminProfile.email}`);

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
