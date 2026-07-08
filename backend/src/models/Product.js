import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    _id: false
  }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      default: null,
      min: 0
    },
    displayPrice: {
      type: String,
      default: "Fiyat sorunuz",
      trim: true
    },
    image: {
      type: String,
      required: true,
      trim: true
    },
    imageUrl: {
      type: String,
      trim: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    unit: {
      type: String,
      required: true,
      trim: true
    },
    weight: {
      type: String,
      default: "",
      trim: true
    },
    portion: {
      type: String,
      default: "",
      trim: true
    },
    variants: {
      type: [productVariantSchema],
      default: []
    },
    shelfLife: {
      type: String,
      required: true,
      trim: true
    },
    storageCondition: {
      type: String,
      required: true,
      trim: true
    },
    catalogPage: {
      type: Number,
      default: null,
      min: 1
    },
    stockStatus: {
      type: String,
      enum: ["in_stock", "limited", "out_of_stock"],
      default: "in_stock"
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    featured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
