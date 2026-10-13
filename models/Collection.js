const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    nameKey: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },
    image: {
      type: String,
      required: true,
      validate: {
        validator(value) {
          return (
            typeof value === "string" &&
            value.length <= 6 * 1024 * 1024 &&
            (/^https?:\/\/\S+$/i.test(value) ||
              /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(value))
          );
        },
        message: "Please provide a supported collection image.",
      },
    },
    category: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "Art",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    nfts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NFT",
      },
    ],
    status: {
      type: String,
      enum: ["published", "draft"],
      default: "published",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

collectionSchema.index(
  { createdBy: 1, nameKey: 1 },
  { unique: true }
);

collectionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Collection", collectionSchema);