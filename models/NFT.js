const mongoose = require("mongoose");

const nftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
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
        message: "Please provide a supported image URL or image file.",
      },
    },
    creator: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    price: {
      type: Number,
      min: 0,
      default: 0,
    },
    highestBid: {
      type: Number,
      min: 0,
      default: 0,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "Art",
    },
    collectionRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collection",
    default: null,
    },
    status: {
      type: String,
      enum: ["published", "draft"],
      default: "published",
      index: true,
    },
    isListed: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

nftSchema.index({ status: 1, createdAt: -1 });
nftSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model("NFT", nftSchema);