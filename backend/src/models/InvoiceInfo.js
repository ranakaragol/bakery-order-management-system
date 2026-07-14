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
      required: true
    },
    taxNumber: {
      type: String,
      trim: true,
      required: true
    },
    taxOffice: {
      type: String,
      trim: true,
      required: true
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
      required: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const InvoiceInfo = mongoose.model("InvoiceInfo", invoiceInfoSchema);

export default InvoiceInfo;
