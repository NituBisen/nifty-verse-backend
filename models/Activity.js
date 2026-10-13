
const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    nftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NFT",
      default: null,
    },
    type: {
      type: String,
      enum: [
        "NFT_CREATED",
        "NFT_LISTED",
        "NFT_UPDATED",
        "NFT_DELETED",
        "NFT_PURCHASED",
        "NFT_SOLD",
        "NFT_LIKED",
        "NFT_UNLIKED",
        "NFT_TRANSFERRED",
        "COLLECTION_CREATED",
        "PROFILE_UPDATED",
        "WALLET_CONNECTED",
        "OFFER_MADE",
        "BID_PLACED",
        "AUCTION_CREATED",
        "OTHER",
        "system",
      ],
      required: true,
      default: "OTHER",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    creatorName: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      default: null,
    },
    currency: {
      type: String,
      default: "ETH",
    },
    status: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);
