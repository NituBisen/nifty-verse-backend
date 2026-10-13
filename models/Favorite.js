const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    nft: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NFT",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ek user ek NFT ko sirf ek baar favourite kar sake.
favoriteSchema.index({ user: 1, nft: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", favoriteSchema);