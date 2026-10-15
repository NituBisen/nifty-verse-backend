// const mongoose = require("mongoose");
// const Collection = require("../models/Collection");
// const NFT = require("../models/NFT");
// const User = require("../models/User");

// const imageIsValid = (value) =>
//   typeof value === "string" &&
//   value.length <= 6 * 1024 * 1024 &&
//   (/^https?:\/\/\S+$/i.test(value) ||
//     /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(value));

// const serializeCollection = (doc) => {
//   const item = doc.toObject ? doc.toObject() : doc;
//   const nfts = Array.isArray(item.nfts) ? item.nfts : [];
//   const creatorName =
//     item.createdBy?.username || item.artist || "Creator";

//   const nftImages = nfts.map((nft) => nft?.image).filter(Boolean);
//   const cover = item.image || nftImages[0] || "";

//   return {
//     ...item,
//     id: String(item._id),
//     artist: creatorName,
//     artistAvatar: item.createdBy?.profileImage || "",
//     primaryImage: cover,
//     secondaryImages: [
//       nftImages[0] || cover,
//       nftImages[1] || nftImages[0] || cover,
//     ],
//     nftCount: nfts.length,
//     additionalNFTs: String(nfts.length),
//     nftId: nfts[0]?._id ? String(nfts[0]._id) : null,
//   };
// };

// // Public: published collections for the marketplace.
// const getPublicCollections = async (req, res) => {
//   try {
//     const collections = await Collection.find({
//       status: "published",
//     })
//       .sort({ createdAt: -1 })
//       .limit(100)
//       .populate("createdBy", "username profileImage")
//       .populate({
//         path: "nfts",
//         match: { status: "published", isListed: true },
//         select: "name image price highestBid category status isListed createdAt createdBy collectionRef",
//         populate: {
//           path: "createdBy",
//           select: "username profileImage",
//         },
//       });
//     return res.json({
//       success: true,
//       collections: collections.map(serializeCollection),
//     });
//   } catch (error) {
//     console.error("Get public collections error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Unable to load collections.",
//     });
//   }
// };

// // Private: collections owned by the logged-in creator.
// const getMyCollections = async (req, res) => {
//   try {
//     const collections = await Collection.find({
//       createdBy: req.authUser.userId,
//     })
//       .sort({ createdAt: -1 })
//       .populate("createdBy", "username profileImage")
//       .populate({
//         path: "nfts",
//         select: "name image status createdAt",
//       });

//     return res.json({
//       success: true,
//       collections: collections.map(serializeCollection),
//     });
//   } catch (error) {
//     console.error("Get my collections error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Unable to load your collections.",
//     });
//   }
// };

// // Public: a single published collection.
// const getCollectionById = async (req, res) => {
//   try {
//     if (!mongoose.isValidObjectId(req.params.id)) {
//       return res.status(404).json({
//         success: false,
//         message: "Collection not found.",
//       });
//     }

//     const collection = await Collection.findOne({
//       _id: req.params.id,
//       status: "published",
//     })
//       .populate("createdBy", "username profileImage")
//       .populate({
//         path: "nfts",
//         match: { status: "published", isListed: true },
//         select: "name image status createdAt",
//       });

//     if (!collection) {
//       return res.status(404).json({
//         success: false,
//         message: "Collection not found.",
//       });
//     }

//     return res.json({
//       success: true,
//       collection: serializeCollection(collection),
//     });
//   } catch (error) {
//     console.error("Get collection details error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Unable to load collection details.",
//     });
//   }
// };

// // Private: create a collection for the logged-in user.
// const createCollection = async (req, res) => {
//   try {
//     const userId = req.authUser.userId;
//     const { name, description, image, category } = req.body;

//     if (typeof name !== "string" || !name.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Collection name is required.",
//       });
//     }

//     if (!imageIsValid(image)) {
//       return res.status(400).json({
//         success: false,
//         message: "Upload a valid collection image.",
//       });
//     }

//     const trimmedName = name.trim();
//     const nameKey = trimmedName.toLowerCase();

//     const duplicate = await Collection.findOne({
//       createdBy: userId,
//       nameKey,
//     });

//     if (duplicate) {
//       return res.status(409).json({
//         success: false,
//         message: "You already have a collection with this name.",
//       });
//     }

//     const user = await User.findById(userId).select("username");

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "User account not found. Please sign in again.",
//       });
//     }

//     const status = req.body.status === "draft" ? "draft" : "published";

//     const collection = await Collection.create({
//       name: trimmedName,
//       nameKey,
//       description: String(description || "").trim(),
//       image,
//       category: String(category || "Art").trim(),
//       createdBy: user._id,
//       nfts: [],
//       status,
//     });

//     const savedCollection = await Collection.findById(collection._id)
//       .populate("createdBy", "username profileImage")
//       .populate("nfts", "name image status createdAt");

//     return res.status(201).json({
//       success: true,
//       message: status === "published"
//         ? "Collection created and published successfully."
//         : "Collection saved as a draft.",
//       collection: serializeCollection(savedCollection),
//     });
//   } catch (error) {
//     console.error("Create collection error:", error);

//     if (error.code === 11000) {
//       return res.status(409).json({
//         success: false,
//         message: "You already have a collection with this name.",
//       });
//     }

//     if (error.name === "ValidationError") {
//       return res.status(400).json({
//         success: false,
//         message: error.message,
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: "Unable to create collection.",
//     });
//   }
// };

// // Private: update only a collection created by this user.
// const updateCollection = async (req, res) => {
//   try {
//     const userId = req.authUser.userId;

//     if (!mongoose.isValidObjectId(req.params.id)) {
//       return res.status(404).json({
//         success: false,
//         message: "Collection not found.",
//       });
//     }

//     const collection = await Collection.findOne({
//       _id: req.params.id,
//       createdBy: userId,
//     });

//     if (!collection) {
//       return res.status(404).json({
//         success: false,
//         message: "Collection not found or you do not have permission to edit it.",
//       });
//     }

//     if (req.body.name !== undefined) {
//       if (typeof req.body.name !== "string" || !req.body.name.trim()) {
//         return res.status(400).json({
//           success: false,
//           message: "Collection name is required.",
//         });
//       }

//       const trimmedName = req.body.name.trim();
//       const nameKey = trimmedName.toLowerCase();

//       const duplicate = await Collection.findOne({
//         _id: { $ne: collection._id },
//         createdBy: userId,
//         nameKey,
//       });

//       if (duplicate) {
//         return res.status(409).json({
//           success: false,
//           message: "You already have a collection with this name.",
//         });
//       }

//       collection.name = trimmedName;
//       collection.nameKey = nameKey;
//     }

//     if (req.body.description !== undefined) {
//       collection.description = String(req.body.description).trim();
//     }

//     if (req.body.image !== undefined) {
//       if (!imageIsValid(req.body.image)) {
//         return res.status(400).json({
//           success: false,
//           message: "Please provide a supported collection image.",
//         });
//       }
//       collection.image = req.body.image;
//     }

//     if (req.body.category !== undefined) {
//       collection.category = String(req.body.category).trim();
//     }

//     if (req.body.status !== undefined) {
//       if (!["published", "draft"].includes(req.body.status)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid collection status.",
//         });
//       }
//       collection.status = req.body.status;
//     }

//     await collection.save();

//     const savedCollection = await Collection.findById(collection._id)
//       .populate("createdBy", "username profileImage")
//       .populate("nfts", "name image status createdAt");

//     return res.json({
//       success: true,
//       message: "Collection updated successfully.",
//       collection: serializeCollection(savedCollection),
//     });
//   } catch (error) {
//     console.error("Update collection error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Unable to update collection.",
//     });
//   }
// };

// // Private: delete the collection, but preserve its NFTs.
// const deleteCollection = async (req, res) => {
//   try {
//     const collection = await Collection.findOne({
//       _id: req.params.id,
//       createdBy: req.authUser.userId,
//     });

//     if (!collection) {
//       return res.status(404).json({
//         success: false,
//         message: "Collection not found or you do not have permission to delete it.",
//       });
//     }

//     await NFT.updateMany(
//     { collectionRef: collection._id },
//     { $set: { collectionRef: null } }
//     );

//     await collection.deleteOne();

//     return res.json({
//       success: true,
//       message: "Collection deleted. Its NFTs are preserved.",
//     });
//   } catch (error) {
//     console.error("Delete collection error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Unable to delete collection.",
//     });
//   }
// };

// module.exports = {
//   getPublicCollections,
//   getMyCollections,
//   getCollectionById,
//   createCollection,
//   updateCollection,
//   deleteCollection,
// };







const mongoose = require("mongoose");

const Collection = require("../models/Collection");
const NFT = require("../models/NFT");
const User = require("../models/User");

// ======================================================
// HELPERS
// ======================================================

const imageIsValid = (value) =>
  typeof value === "string" &&
  value.length <= 6 * 1024 * 1024 &&
  (/^https?:\/\/\S+$/i.test(value) ||
    /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(value));

// Populate NFT references and include the fields needed by collection cards.
const getNFTPopulateOptions = (publicOnly = false, previewOnly = false) => ({
  path: "nfts",
  ...(publicOnly
    ? {
        match: {
          status: "published",
          isListed: true,
        },
      }
    : {}),
  select:
    "name image creator price highestBid category status isListed createdAt createdBy collectionRef",
  ...(previewOnly ? { perDocumentLimit: 2 } : {}),
  populate: {
    path: "createdBy",
    select: "username profileImage",
  },
});

// ======================================================
// SERIALIZE COLLECTION + ITS NFT DATA
// ======================================================

const serializeCollection = (doc) => {
  if (!doc) return null;

  const item = doc.toObject ? doc.toObject() : doc;

  const rawNFTs = Array.isArray(item.nfts) ? item.nfts : [];

  const creatorName =
    item.createdBy?.username || item.artist || "Creator";

  const serializedNFTs = rawNFTs
    .map((nftDocument) => {
      const nft = nftDocument?.toObject
        ? nftDocument.toObject()
        : nftDocument;

      if (!nft || typeof nft !== "object") {
        return null;
      }

      const nftCreator =
        nft.createdBy && typeof nft.createdBy === "object"
          ? nft.createdBy
          : null;

      const collectionRef = nft.collectionRef;

      const collectionId =
        collectionRef && typeof collectionRef === "object"
          ? collectionRef._id || collectionRef.id || null
          : collectionRef || null;

      const collectionName =
        collectionRef && typeof collectionRef === "object"
          ? collectionRef.name || ""
          : "";

      return {
        ...nft,
        id: String(nft._id || nft.id || ""),
        creator:
          nft.creator ||
          nftCreator?.username ||
          "Creator",
        creatorAvatar: nftCreator?.profileImage || "",
        collectionId: collectionId ? String(collectionId) : null,
        collectionName,
      };
    })
    .filter(Boolean);

  const nftImages = serializedNFTs
    .map((nft) => nft.image)
    .filter(Boolean);

  const cover = item.image || nftImages[0] || "";

  return {
    ...item,
    id: String(item._id || item.id || ""),
    artist: creatorName,
    artistAvatar: item.createdBy?.profileImage || "",
    primaryImage: cover,
    secondaryImages: [
      nftImages[0] || cover,
      nftImages[1] || nftImages[0] || cover,
    ],
    nftCount: serializedNFTs.length,
    additionalNFTs: String(serializedNFTs.length),
    nftId: serializedNFTs[0]?.id || null,
    nfts: serializedNFTs,
  };
};

// ======================================================
// GET PUBLIC COLLECTIONS
// GET /api/collections
// ======================================================

const getPublicCollections = async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 100;

    const collections = await Collection.find({
      status: "published",
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("createdBy", "username profileImage")
      .populate(
        getNFTPopulateOptions(true, req.query.summary === "landing")
      );

    const serializedCollections = collections.map(serializeCollection);

    if (req.query.summary === "landing") {
      return res.json({
        success: true,
        collections: serializedCollections.map(
          ({ _id, id, name, category, description, artist, artistAvatar, primaryImage, secondaryImages, nftCount }) => ({
            _id,
            id,
            name,
            category,
            description,
            artist,
            artistAvatar,
            primaryImage,
            secondaryImages,
            nftCount,
          })
        ),
      });
    }

    return res.json({
      success: true,
      collections: serializedCollections,
    });
  } catch (error) {
    console.error("Get public collections error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load collections.",
    });
  }
};

// ======================================================
// GET MY COLLECTIONS
// GET /api/collections/mine
// ======================================================

const getMyCollections = async (req, res) => {
  try {
    const collections = await Collection.find({
      createdBy: req.authUser.userId,
    })
      .sort({ createdAt: -1 })
      .populate("createdBy", "username profileImage")
      .populate(getNFTPopulateOptions(false));

    return res.json({
      success: true,
      collections: collections.map(serializeCollection),
    });
  } catch (error) {
    console.error("Get my collections error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your collections.",
    });
  }
};

// ======================================================
// GET SINGLE PUBLIC COLLECTION
// GET /api/collections/:id
// ======================================================

const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: "Collection not found.",
      });
    }

    const collection = await Collection.findOne({
      _id: id,
      status: "published",
    })
      .populate("createdBy", "username profileImage")
      .populate(getNFTPopulateOptions(true));

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found.",
      });
    }

    return res.json({
      success: true,
      collection: serializeCollection(collection),
    });
  } catch (error) {
    console.error("Get collection details error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load collection details.",
    });
  }
};

// ======================================================
// CREATE COLLECTION
// POST /api/collections
// ======================================================

const createCollection = async (req, res) => {
  try {
    const userId = req.authUser.userId;
    const { name, description, image, category } = req.body || {};

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Collection name is required.",
      });
    }

    if (!imageIsValid(image)) {
      return res.status(400).json({
        success: false,
        message: "Upload a valid collection image.",
      });
    }

    const trimmedName = name.trim();
    const nameKey = trimmedName.toLowerCase();

    const duplicate = await Collection.findOne({
      createdBy: userId,
      nameKey,
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "You already have a collection with this name.",
      });
    }

    const user = await User.findById(userId).select("username");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found. Please sign in again.",
      });
    }

    const status = req.body.status === "draft" ? "draft" : "published";

    const collection = await Collection.create({
      name: trimmedName,
      nameKey,
      description: String(description || "").trim(),
      image,
      category: String(category || "Art").trim(),
      createdBy: user._id,
      nfts: [],
      status,
    });

    const savedCollection = await Collection.findById(collection._id)
      .populate("createdBy", "username profileImage")
      .populate(getNFTPopulateOptions(false));

    return res.status(201).json({
      success: true,
      message:
        status === "published"
          ? "Collection created and published successfully."
          : "Collection saved as a draft.",
      collection: serializeCollection(savedCollection),
    });
  } catch (error) {
    console.error("Create collection error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You already have a collection with this name.",
      });
    }

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create collection.",
    });
  }
};

// ======================================================
// UPDATE COLLECTION
// PATCH /api/collections/:id
// ======================================================

const updateCollection = async (req, res) => {
  try {
    const userId = req.authUser.userId;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: "Collection not found.",
      });
    }

    const collection = await Collection.findOne({
      _id: id,
      createdBy: userId,
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message:
          "Collection not found or you do not have permission to edit it.",
      });
    }

    if (req.body.name !== undefined) {
      if (
        typeof req.body.name !== "string" ||
        !req.body.name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Collection name is required.",
        });
      }

      const trimmedName = req.body.name.trim();
      const nameKey = trimmedName.toLowerCase();

      const duplicate = await Collection.findOne({
        _id: { $ne: collection._id },
        createdBy: userId,
        nameKey,
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "You already have a collection with this name.",
        });
      }

      collection.name = trimmedName;
      collection.nameKey = nameKey;
    }

    if (req.body.description !== undefined) {
      collection.description = String(req.body.description).trim();
    }

    if (req.body.image !== undefined) {
      if (!imageIsValid(req.body.image)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a supported collection image.",
        });
      }

      collection.image = req.body.image;
    }

    if (req.body.category !== undefined) {
      collection.category = String(req.body.category).trim() || "Art";
    }

    if (req.body.status !== undefined) {
      if (!["published", "draft"].includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid collection status.",
        });
      }

      collection.status = req.body.status;
    }

    await collection.save();

    const savedCollection = await Collection.findById(collection._id)
      .populate("createdBy", "username profileImage")
      .populate(getNFTPopulateOptions(false));

    return res.json({
      success: true,
      message: "Collection updated successfully.",
      collection: serializeCollection(savedCollection),
    });
  } catch (error) {
    console.error("Update collection error:", error);

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update collection.",
    });
  }
};

// ======================================================
// DELETE COLLECTION
// DELETE /api/collections/:id
// Preserve NFTs; unlink them from the deleted collection.
// ======================================================

const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: "Collection not found.",
      });
    }

    const collection = await Collection.findOne({
      _id: id,
      createdBy: req.authUser.userId,
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message:
          "Collection not found or you do not have permission to delete it.",
      });
    }

    await NFT.updateMany(
      { collectionRef: collection._id },
      { $set: { collectionRef: null } }
    );

    await collection.deleteOne();

    return res.json({
      success: true,
      message: "Collection deleted. Its NFTs are preserved.",
    });
  } catch (error) {
    console.error("Delete collection error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete collection.",
    });
  }
};

// ======================================================
// EXPORT CONTROLLERS
// ======================================================

module.exports = {
  getPublicCollections,
  getMyCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
};