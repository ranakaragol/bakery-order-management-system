import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    nameSnapshot: {
      type: String,
      required: true
    },
    imageUrlSnapshot: {
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
    unitSnapshot: {
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
      required: true,
      min: 0
    },
    lineTotal: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    _id: true
  }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    items: [cartItemSchema],
    itemCount: {
      type: Number,
      default: 0
    },
    subtotal: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
