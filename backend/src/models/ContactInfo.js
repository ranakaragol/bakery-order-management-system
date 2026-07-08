import mongoose from "mongoose";

const contactInfoSchema = new mongoose.Schema(
  {
    heroTitle: {
      type: String,
      required: true,
      trim: true
    },
    heroDescription: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    workingHours: {
      type: String,
      required: true,
      trim: true
    },
    mapUrl: {
      type: String,
      trim: true,
      default: ""
    },
    socialLinks: {
      instagram: {
        type: String,
        trim: true,
        default: ""
      },
      facebook: {
        type: String,
        trim: true,
        default: ""
      },
      whatsapp: {
        type: String,
        trim: true,
        default: ""
      }
    }
  },
  {
    timestamps: true
  }
);

const ContactInfo = mongoose.model("ContactInfo", contactInfoSchema);

export default ContactInfo;
