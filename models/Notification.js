// const mongoose = require("mongoose");

// const notificationSchema = new mongoose.Schema(
//   {
//     recipient: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     actor: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },

//     type: {
//       type: String,
//       default: "system",
//       trim: true,
//     },

//     title: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 150,
//     },

//     message: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 1000,
//     },

//     link: {
//       type: String,
//       default: "",
//       trim: true,
//     },

//     read: {
//       type: Boolean,
//       default: false,
//     },

//     relatedNFT: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "NFT",
//       default: null,
//     },

//     metadata: {
//       type: mongoose.Schema.Types.Mixed,
//       default: {},
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// notificationSchema.index({ recipient: 1, createdAt: -1 });
// notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

// module.exports = mongoose.model("Notification", notificationSchema);






const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      default: "system",
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    link: {
      type: String,
      default: "",
    },

    relatedNFT: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NFT",
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);