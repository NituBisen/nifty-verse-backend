// const mongoose = require("mongoose");
// const Favorite = require("../models/Favorite");
// const NFT = require("../models/NFT");
// const Notification = require("../models/Notification");
// const { createNotification } = require("./notificationController");
// const { recordActivity } = require("./activityController");

// // ======================================================
// // CREATE NOTIFICATION FOR NFT CREATOR
// // ======================================================

// const notifyNFTCreator = async (nft, userId) => {
//   try {
//     const creatorId = nft.createdBy
//       ? String(nft.createdBy)
//       : "";

//     // Do not notify the user about their own NFT.
//     if (!creatorId || creatorId === String(userId)) {
//       return;
//     }

//     await createNotification({
//       recipient: creatorId,
//       actor: userId,
//       type: "favorite",
//       title: "Your NFT was favorited",
//       message: `"${nft.name || "Your NFT"}" was added to someone's favorites.`,
//       link: `/nft/${nft._id}`,
//       relatedNFT: nft._id,
//       metadata: {
//         nftId: String(nft._id),
//         nftName: nft.name || "Untitled NFT",
//       },
//     });

//     console.log("Favorite notification created:", {
//       recipient: creatorId,
//       actor: String(userId),
//       nftId: String(nft._id),
//     });
//   } catch (error) {
//     // A notification error must not undo a successful favorite.
//     console.error("Create favorite notification error:", error);
//   }
// };

// // ======================================================
// // GET MY FAVORITES
// // GET /api/favorites/mine
// // ======================================================

// const getMyFavorites = async (req, res) => {
//   try {
//     const userId = req.authUser.userId;

//     const records = await Favorite.find({ user: userId })
//       .sort({ createdAt: -1 })
//       .populate({
//         path: "nft",
//         select:
//           "name description image creator price highestBid category status isListed createdAt createdBy collectionRef",
//         populate: [
//           {
//             path: "createdBy",
//             select: "username profileImage",
//           },
//           {
//             path: "collectionRef",
//             select: "name",
//           },
//         ],
//       });

//     const favorites = records
//       .filter(
//         (record) =>
//           record.nft &&
//           record.nft.status === "published" &&
//           record.nft.isListed === true
//       )
//       .map((record) => {
//         const nft = record.nft.toObject();
//         const collectionRef = nft.collectionRef;

//         const collectionId =
//           collectionRef && typeof collectionRef === "object"
//             ? collectionRef._id || null
//             : collectionRef || null;

//         return {
//           ...nft,
//           id: String(nft._id),
//           creator:
//             nft.creator || nft.createdBy?.username || "Creator",
//           creatorAvatar: nft.createdBy?.profileImage || "",
//           collectionId: collectionId ? String(collectionId) : null,
//           collectionName:
//             collectionRef && typeof collectionRef === "object"
//               ? collectionRef.name || ""
//               : "",
//           favoritedAt: record.createdAt,
//         };
//       });

//     return res.json({
//       success: true,
//       favorites,
//     });
//   } catch (error) {
//     console.error("Get favorites error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to load your favorites.",
//     });
//   }
// };

// // ======================================================
// // ADD FAVORITE
// // POST /api/favorites/:nftId
// // ======================================================

// const addFavorite = async (req, res) => {
//   try {
//     const userId = req.authUser.userId;
//     const { nftId } = req.params;

//     if (!mongoose.isValidObjectId(nftId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid NFT.",
//       });
//     }

//     const nft = await NFT.findOne({
//       _id: nftId,
//       status: "published",
//       isListed: true,
//     }).select("_id name createdBy");

//     if (!nft) {
//       return res.status(404).json({
//         success: false,
//         message: "NFT not found or is not available in the marketplace.",
//       });
//     }

//     const existing = await Favorite.findOne({
//       user: userId,
//       nft: nftId,
//     });

//     if (existing) {
//       const creatorId = nft.createdBy
//         ? String(nft.createdBy)
//         : "";

//       // Recover a missing notification for an older favorite.
//       // Only consider notifications created since this favorite record.
//       if (creatorId && creatorId !== String(userId)) {
//         try {
//           const notificationExists = await Notification.exists({
//             recipient: creatorId,
//             actor: userId,
//             type: "favorite",
//             relatedNFT: nft._id,
//             createdAt: {
//               $gte: existing.createdAt || new Date(0),
//             },
//           });

//           if (!notificationExists) {
//             await notifyNFTCreator(nft, userId);
//           }
//         } catch (notificationError) {
//           console.error(
//             "Check existing favorite notification error:",
//             notificationError
//           );
//         }
//       }

//       return res.json({
//         success: true,
//         message: "NFT is already in your favorites.",
//       });
//     }

//     // Save favorite.
//     await Favorite.create({
//       user: userId,
//       nft: nftId,
//     });

//     try {
//     await recordActivity({
//         user: userId,
//         type: "favorite",
//         title: nft.name || "NFT",
//         message: "You added an NFT to your favorites.",
//         nftId: nft._id,
//         status: "added",
//         metadata: {
//         nftId: String(nft._id),
//         nftName: nft.name || "Untitled NFT",
//         },
//     });
//     } catch (activityError) {
//     console.error("[ACTIVITY] Favorite activity error:", activityError);
//     }

//     // Notify the NFT creator.
//     await notifyNFTCreator(nft, userId);

//     return res.status(201).json({
//       success: true,
//       message: "NFT added to favorites.",
//     });
//   } catch (error) {
//     // Handles simultaneous requests for the same NFT.
//     if (error.code === 11000) {
//       return res.json({
//         success: true,
//         message: "NFT is already in your favorites.",
//       });
//     }

//     console.error("Add favorite error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to add NFT to favorites.",
//     });
//   }
// };

// // ======================================================
// // REMOVE FAVORITE
// // DELETE /api/favorites/:nftId
// // ======================================================

// const removeFavorite = async (req, res) => {
//   try {
//     const userId = req.authUser.userId;
//     const { nftId } = req.params;

//     if (!mongoose.isValidObjectId(nftId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid NFT.",
//       });
//     }

//     await Favorite.deleteOne({
//       user: userId,
//       nft: nftId,
//     });

//     return res.json({
//       success: true,
//       message: "NFT removed from favorites.",
//     });
//   } catch (error) {
//     console.error("Remove favorite error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to remove NFT from favorites.",
//     });
//   }
// };

// module.exports = {
//   getMyFavorites,
//   addFavorite,
//   removeFavorite,
// };




//new code


const mongoose = require("mongoose");
const Favorite = require("../models/Favorite");
const NFT = require("../models/NFT");
const Notification = require("../models/Notification");
const { createNotification } = require("./notificationController");
const { recordActivity } = require("./activityController");

// Notify NFT creator when another user favorites their NFT.
const notifyNFTCreator = async (nft, userId) => {
  try {
    const creatorId = nft.createdBy ? String(nft.createdBy) : "";

    if (!creatorId || creatorId === String(userId)) {
      return;
    }

    await createNotification({
      recipient: creatorId,
      actor: userId,
      type: "favorite",
      title: "Your NFT was favorited",
      message: `"${nft.name || "Your NFT"}" was added to someone's favorites.`,
      link: `/nft/${nft._id}`,
      relatedNFT: nft._id,
      metadata: {
        nftId: String(nft._id),
        nftName: nft.name || "Untitled NFT",
      },
    });

    console.log("[FAVORITES] Creator notification created:", {
      recipient: creatorId,
      actor: String(userId),
      nftId: String(nft._id),
    });
  } catch (error) {
    console.error("[FAVORITES] Notification error:", error);
  }
};

// Save activity without breaking the main favorite operation.
const saveFavoriteActivity = async (activityData) => {
  try {
    await recordActivity(activityData);
  } catch (error) {
    console.error("[ACTIVITY] Favorite activity error:", error);
  }
};

// GET /api/favorites/mine
const getMyFavorites = async (req, res) => {
  try {
    const userId = req.authUser.userId;

    const records = await Favorite.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "nft",
        select:
          "name description image creator price highestBid category status isListed createdAt createdBy collectionRef",
        populate: [
          {
            path: "createdBy",
            select: "username profileImage",
          },
          {
            path: "collectionRef",
            select: "name",
          },
        ],
      });

    const favorites = records
      .filter(
        (record) =>
          record.nft &&
          record.nft.status === "published" &&
          record.nft.isListed === true
      )
      .map((record) => {
        const nft = record.nft.toObject();
        const collectionRef = nft.collectionRef;

        const collectionId =
          collectionRef && typeof collectionRef === "object"
            ? collectionRef._id || null
            : collectionRef || null;

        return {
          ...nft,
          id: String(nft._id),
          creator: nft.creator || nft.createdBy?.username || "Creator",
          creatorAvatar: nft.createdBy?.profileImage || "",
          collectionId: collectionId ? String(collectionId) : null,
          collectionName:
            collectionRef && typeof collectionRef === "object"
              ? collectionRef.name || ""
              : "",
          favoritedAt: record.createdAt,
        };
      });

    return res.json({
      success: true,
      favorites,
    });
  } catch (error) {
    console.error("[FAVORITES] Get favorites error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your favorites.",
    });
  }
};

// POST /api/favorites/:nftId
const addFavorite = async (req, res) => {
  try {
    const userId = req.authUser.userId;
    const { nftId } = req.params;

    if (!mongoose.isValidObjectId(nftId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid NFT.",
      });
    }

    const nft = await NFT.findOne({
      _id: nftId,
      status: "published",
      isListed: true,
    }).select("_id name createdBy price");

    if (!nft) {
      return res.status(404).json({
        success: false,
        message: "NFT not found or is not available in the marketplace.",
      });
    }

    const existing = await Favorite.findOne({
      user: userId,
      nft: nftId,
    });

    if (existing) {
      const creatorId = nft.createdBy ? String(nft.createdBy) : "";

      if (creatorId && creatorId !== String(userId)) {
        try {
          const notificationExists = await Notification.exists({
            recipient: creatorId,
            actor: userId,
            type: "favorite",
            relatedNFT: nft._id,
            createdAt: {
              $gte: existing.createdAt || new Date(0),
            },
          });

          if (!notificationExists) {
            await notifyNFTCreator(nft, userId);
          }
        } catch (notificationError) {
          console.error(
            "[FAVORITES] Existing favorite notification check error:",
            notificationError
          );
        }
      }

      return res.json({
        success: true,
        message: "NFT is already in your favorites.",
      });
    }

    await Favorite.create({
      user: userId,
      nft: nftId,
    });

    await saveFavoriteActivity({
      user: userId,
      type: "NFT_LIKED",
      title: `Added to favorites: ${nft.name || "NFT"}`,
      message: "You added an NFT to your favorites.",
      nftId: nft._id,
      price: nft.price ?? null,
      status: "added",
      metadata: {
        nftId: String(nft._id),
        nftName: nft.name || "Untitled NFT",
      },
    });

    await notifyNFTCreator(nft, userId);

    return res.status(201).json({
      success: true,
      message: "NFT added to favorites.",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({
        success: true,
        message: "NFT is already in your favorites.",
      });
    }

    console.error("[FAVORITES] Add favorite error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add NFT to favorites.",
    });
  }
};

// DELETE /api/favorites/:nftId
const removeFavorite = async (req, res) => {
  try {
    const userId = req.authUser.userId;
    const { nftId } = req.params;

    if (!mongoose.isValidObjectId(nftId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid NFT.",
      });
    }

    const result = await Favorite.deleteOne({
      user: userId,
      nft: nftId,
    });

    if (result.deletedCount > 0) {
      const nft = await NFT.findById(nftId).select("_id name price");

      await saveFavoriteActivity({
        user: userId,
        type: "NFT_UNLIKED",
        title: `Removed from favorites: ${nft?.name || "NFT"}`,
        message: "You removed an NFT from your favorites.",
        nftId,
        price: nft?.price ?? null,
        status: "removed",
        metadata: {
          nftId: String(nftId),
          nftName: nft?.name || "NFT",
        },
      });
    }

    return res.json({
      success: true,
      message:
        result.deletedCount > 0
          ? "NFT removed from favorites."
          : "NFT was not in your favorites.",
    });
  } catch (error) {
    console.error("[FAVORITES] Remove favorite error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to remove NFT from favorites.",
    });
  }
};

module.exports = {
  getMyFavorites,
  addFavorite,
  removeFavorite,
};
