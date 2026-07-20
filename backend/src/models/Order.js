import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    },
    name: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    variantId: {
      type: String,
      default: "",
      trim: true
    },
    variantName: {
      type: String,
      default: "",
      trim: true
    },
    unit: {
      type: String,
      default: "",
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    lineTotal: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    _id: false
  }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["Hazirlaniyor", "Teslimata Cikti", "Tamamlandi", "Iptal Edildi"],
      default: "Hazirlaniyor"
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "unpaid"],
      default: "unpaid"
    },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "cash_on_delivery"],
      required: true,
      default: "cash_on_delivery"
    },
    addressSnapshot: {
      type: String,
      required: true
    },
    deliveryAddressSnapshot: {
      addressTitle: {
        type: String,
        default: "",
        trim: true
      },
      province: {
        type: String,
        required: true,
        trim: true
      },
      district: {
        type: String,
        required: true,
        trim: true
      },
      neighborhood: {
        type: String,
        required: true,
        trim: true
      },
      streetAddress: {
        type: String,
        required: true,
        trim: true
      },
      postalCode: {
        type: String,
        default: "",
        trim: true
      },
      formattedAddress: {
        type: String,
        required: true,
        trim: true
      },
      region: {
        type: String,
        required: true,
        trim: true
      }
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    invoiceInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InvoiceInfo",
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
