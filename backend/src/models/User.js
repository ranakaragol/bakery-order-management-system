import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import {
  billingAddressFields,
  createEmptyBillingAddress,
  createEmptyDeliveryAddress,
  deliveryAddressFields
} from "../../../shared/profile.js";

const billingAddressShape = billingAddressFields.reduce(
  (shape, field) => ({
    ...shape,
    [field]: {
      type: String,
      trim: true,
      default: ""
    }
  }),
  {}
);

const deliveryAddressShape = deliveryAddressFields.reduce(
  (shape, field) => ({
    ...shape,
    [field]: {
      type: String,
      trim: true,
      default: ""
    }
  }),
  {}
);

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      default: "",
      trim: true
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer"
    },
    invoiceInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InvoiceInfo"
    },
    billingAddress: {
      type: new mongoose.Schema(billingAddressShape, { _id: false }),
      default: createEmptyBillingAddress
    },
    deliveryAddress: {
      type: new mongoose.Schema(deliveryAddressShape, { _id: false }),
      default: createEmptyDeliveryAddress
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function savePassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
