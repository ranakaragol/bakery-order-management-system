import mongoose from "mongoose";

const invoiceInfoSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    fullName: {
      type: String,
      trim: true,
      required: true
    },
    companyName: {
      type: String,
      trim: true,
      default: ""
    },
    taxNumber: {
      type: String,
      trim: true,
      default: ""
    },
    taxOffice: {
      type: String,
      trim: true,
      default: ""
    },
    identityNumber: {
      type: String,
      trim: true,
      default: ""
    },
    billingAddress: {
      type: String,
      trim: true,
      required: true
    },
    phone: {
      type: String,
      trim: true,
      default: ""
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

const InvoiceInfo = mongoose.model("InvoiceInfo", invoiceInfoSchema);

export default InvoiceInfo;
