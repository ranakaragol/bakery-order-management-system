import dotenv from "dotenv";
import InvoiceInfo from "../models/InvoiceInfo.js";
import User from "../models/User.js";
import { connectDB } from "../config/db.js";

dotenv.config();

const adminProfile = {
  firstName: process.env.ADMIN_SEED_FIRST_NAME || "Paşalı",
  lastName: process.env.ADMIN_SEED_LAST_NAME || "Admin",
  email: process.env.ADMIN_SEED_EMAIL || "admin@pasalipatiserrie.com",
  password: process.env.ADMIN_SEED_PASSWORD || "Admin123!",
  phone: process.env.ADMIN_SEED_PHONE || "+90 555 000 11 22",
  address: process.env.ADMIN_SEED_ADDRESS || "Paşalı Patiserrie katalog yönetim hesabı"
};

const upsertAdmin = async () => {
  await connectDB();

  let user = await User.findOne({ email: adminProfile.email }).populate("invoiceInfo");

  if (!user) {
    user = await User.create({
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

  let invoiceInfo = user.invoiceInfo;

  if (!invoiceInfo) {
    invoiceInfo = await InvoiceInfo.create({
      user: user._id,
      fullName: `${adminProfile.firstName} ${adminProfile.lastName}`,
      billingAddress: adminProfile.address,
      email: adminProfile.email,
      phone: adminProfile.phone,
      companyName: "Paşalı Patiserrie"
    });
    user.invoiceInfo = invoiceInfo._id;
    await user.save();
  } else {
    invoiceInfo = await InvoiceInfo.findById(invoiceInfo._id || invoiceInfo);
    invoiceInfo.user = user._id;
    invoiceInfo.fullName = `${adminProfile.firstName} ${adminProfile.lastName}`;
    invoiceInfo.billingAddress = adminProfile.address;
    invoiceInfo.email = adminProfile.email;
    invoiceInfo.phone = adminProfile.phone;
    invoiceInfo.companyName = invoiceInfo.companyName || "Paşalı Patiserrie";
    await invoiceInfo.save();
  }

  console.log(`Admin user is ready: ${adminProfile.email}`);
  process.exit(0);
};

upsertAdmin().catch((error) => {
  console.error("Admin upsert failed.", error);
  process.exit(1);
});
