const mongoose = require("mongoose");

const NFT = require("../models/NFT");
const Collection = require("../models/Collection");
const User = require("../models/User");

// ======================================================
// HELPERS
// ======================================================

const imageIsValid = (value) =>
  typeof value === "string" &&
  value.length <= 6 * 1024 * 1024 &&
  (/^https?:\/\/\S+$/i.test(value) ||
    /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(
      value
    ));

const parseAmount = (value) => {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const amount = Number(value);

  return Number.isFinite(amount) && amount >= 0 ? amount : null;
};

// Populate hone aur na hone dono situations handle karta hai.
const serializeNFT = (doc) => {
  if (!doc) return null;

  const item = doc.toObject ? doc.toObject() : doc;

  const collectionRef = item.collectionRef;

  const collectionId =
    collectionRef && typeof collectionRef === "object"
      ? collectionRef._id || null
      : collectionRef || null;

  const collectionName =
    collectionRef &&
    typeof collectionRef === "object" &&
    !mongoose.isValidObjectId(collectionRef)
      ? collectionRef.name || ""
      : "";

  return {
    ...item,
    id: String(item._id),
    creator: item.creator || item.createdBy?.username || "Creator",
    creatorAvatar: item.createdBy?.profileImage || "",
    collectionName,
    collectionId: collectionId ? String(collectionId) : null,
  };
};

// Shared populate configuration.
// IMPORTANT: NFT schema field is collectionRef, not collection.
const populateNFT = (query) =>
  query
    .populate("createdBy", "username profileImage")
    .populate("collectionRef", "name");

// ======================================================
// GET PUBLIC NFTS
// GET /api/nfts
// ======================================================

const getPublicNFTs = async (req, res) => {
  try {
    const nfts = await populateNFT(
      NFT.find({
        status: "published",
        isListed: true,
      })
        .sort({ createdAt: -1 })
        .limit(100)
    );

    return res.json({
      success: true,
      nfts: nfts.map(serializeNFT),
    });
  } catch (error) {
    console.error("Get public NFTs error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load marketplace NFTs.",
    });
  }
};

// ======================================================
// GET MY NFTS
// GET /api/nfts/mine
// ======================================================

const getMyNFTs = async (req, res) => {
  try {
    const userId = req.authUser.userId;

    const nfts = await populateNFT(
      NFT.find({
        $or: [{ createdBy: userId }, { owner: userId }],
      }).sort({ createdAt: -1 })
    );

    return res.json({
      success: true,
      nfts: nfts.map(serializeNFT),
    });
  } catch (error) {
    console.error("Get my NFTs error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your NFTs.",
    });
  }
};

// ======================================================
// GET SINGLE PUBLIC NFT
// GET /api/nfts/:id
// ======================================================

const getNFTById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: "NFT not found.",
      });
    }

    const nft = await populateNFT(
      NFT.findOne({
        _id: id,
        status: "published",
        isListed: true,
      })
    );

    if (!nft) {
      return res.status(404).json({
        success: false,
        message: "NFT not found.",
      });
    }

    return res.json({
      success: true,
      nft: serializeNFT(nft),
    });
  } catch (error) {
    console.error("Get NFT details error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load NFT details.",
    });
  }
};

// ======================================================
// CREATE NFT
// POST /api/nfts
// ======================================================

const createNFT = async (req, res) => {
  try {
    const userId = req.authUser.userId;

    const {
      name,
      description,
      image,
      price,
      highestBid,
      category,
      collectionId,
    } = req.body || {};

    // Validate NFT name
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "NFT name is required.",
      });
    }

    // Validate image
    if (!imageIsValid(image)) {
      return res.status(400).json({
        success: false,
        message:
          "Upload a valid image URL or image file. Keep uploaded images under 2 MB.",
      });
    }

    // Validate price and highest bid
    const parsedPrice = parseAmount(price);
    const parsedBid = parseAmount(highestBid);

    if (
      parsedPrice === null ||
      parsedBid === null ||
      parsedPrice <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Price must be greater than zero, and highest bid must be a valid non-negative number.",
      });
    }

    // Get creator from authenticated database account.
    // Creator must not be trusted from the frontend request.
    const user = await User.findById(userId).select("username");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found. Please sign in again.",
      });
    }

    // Resolve the optional collection.
    let collection = null;

    if (collectionId) {
      if (!mongoose.isValidObjectId(collectionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid collection.",
        });
      }

      collection = await Collection.findOne({
        _id: collectionId,
        createdBy: userId,
      });

      if (!collection) {
        return res.status(403).json({
          success: false,
          message: "You can only add NFTs to your own collections.",
        });
      }
    }

    const status = req.body.status === "draft" ? "draft" : "published";

    // IMPORTANT: use collectionRef instead of collection.
    const nft = await NFT.create({
      name: name.trim(),
      description: String(description || "").trim(),
      image,
      creator: user.username,
      createdBy: user._id,
      owner: user._id,
      price: parsedPrice,
      highestBid: parsedBid,
      category: String(category || "Art").trim(),
      collectionRef: collection ? collection._id : null,
      status,
      isListed: status === "published",
    });

    // Update collection's NFT reference list.
    if (collection) {
      collection.nfts.addToSet(nft._id);
      await collection.save();
    }

    // Return newly saved and populated NFT.
    const savedNFT = await populateNFT(
      NFT.findById(nft._id)
    );

    return res.status(201).json({
      success: true,
      message:
        status === "published"
          ? "NFT created and published successfully."
          : "NFT saved as a draft.",
      nft: serializeNFT(savedNFT),
    });
  } catch (error) {
    console.error("Create NFT error:", error);

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
      message: "Unable to create NFT.",
    });
  }
};

// ======================================================
// UPDATE NFT
// PATCH /api/nfts/:id
// ======================================================

const updateNFT = async (req, res) => {
  try {
    const userId = req.authUser.userId;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: "NFT not found.",
      });
    }

    // Only NFT creator can update it.
    const nft = await NFT.findOne({
      _id: id,
      createdBy: userId,
    });

    if (!nft) {
      return res.status(404).json({
        success: false,
        message: "NFT not found or you do not have permission to edit it.",
      });
    }

    const {
      name,
      description,
      image,
      price,
      highestBid,
      category,
      status,
    } = req.body || {};

    // Update name
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "NFT name is required.",
        });
      }

      nft.name = name.trim();
    }

    // Update description
    if (description !== undefined) {
      nft.description = String(description).trim();
    }

    // Update image
    if (image !== undefined) {
      if (!imageIsValid(image)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a supported image URL or image file.",
        });
      }

      nft.image = image;
    }

    // Update price
    if (price !== undefined) {
      const parsedPrice = parseAmount(price);

      if (parsedPrice === null || parsedPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be a valid number greater than zero.",
        });
      }

      nft.price = parsedPrice;
    }

    // Update highest bid
    if (highestBid !== undefined) {
      const parsedBid = parseAmount(highestBid);

      if (parsedBid === null) {
        return res.status(400).json({
          success: false,
          message: "Highest bid must be a valid non-negative number.",
        });
      }

      nft.highestBid = parsedBid;
    }

    // Update category
    if (category !== undefined) {
      nft.category = String(category).trim() || "Art";
    }

    // Update published/draft status
    if (status !== undefined) {
      if (!["published", "draft"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid NFT status.",
        });
      }

      nft.status = status;
      nft.isListed = status === "published";
    }

    // ================================================
    // UPDATE COLLECTION REFERENCE
    // ================================================

    if (req.body.collectionId !== undefined) {
      let nextCollection = null;

      if (req.body.collectionId) {
        if (!mongoose.isValidObjectId(req.body.collectionId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid collection.",
          });
        }

        nextCollection = await Collection.findOne({
          _id: req.body.collectionId,
          createdBy: userId,
        });

        if (!nextCollection) {
          return res.status(403).json({
            success: false,
            message: "You can only use your own collections.",
          });
        }
      }

      const oldCollectionId = nft.collectionRef
        ? nft.collectionRef.toString()
        : null;

      const nextCollectionId = nextCollection
        ? nextCollection._id.toString()
        : null;

      if (oldCollectionId !== nextCollectionId) {
        // Remove NFT from the previous collection.
        if (oldCollectionId) {
          await Collection.updateOne(
            {
              _id: oldCollectionId,
              createdBy: userId,
            },
            {
              $pull: { nfts: nft._id },
            }
          );
        }

        // Add NFT to the newly selected collection.
        if (nextCollection) {
          nextCollection.nfts.addToSet(nft._id);
          await nextCollection.save();
        }

        // IMPORTANT: update collectionRef, not collection.
        nft.collectionRef = nextCollection
          ? nextCollection._id
          : null;
      }
    }

    await nft.save();

    const savedNFT = await populateNFT(
      NFT.findById(nft._id)
    );

    return res.json({
      success: true,
      message: "NFT updated successfully.",
      nft: serializeNFT(savedNFT),
    });
  } catch (error) {
    console.error("Update NFT error:", error);

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
      message: "Unable to update NFT.",
    });
  }
};

// ======================================================
// DELETE NFT
// DELETE /api/nfts/:id
// ======================================================

const deleteNFT = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.authUser.userId;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: "NFT not found.",
      });
    }

    // Only the creator can delete this NFT.
    const nft = await NFT.findOne({
      _id: id,
      createdBy: userId,
    });

    if (!nft) {
      return res.status(404).json({
        success: false,
        message:
          "NFT not found or you do not have permission to delete it.",
      });
    }

    // Remove NFT reference from its collection.
    // IMPORTANT: read collectionRef, not collection.
    if (nft.collectionRef) {
      await Collection.updateOne(
        {
          _id: nft.collectionRef,
          createdBy: userId,
        },
        {
          $pull: { nfts: nft._id },
        }
      );
    }

    await nft.deleteOne();

    return res.json({
      success: true,
      message: "NFT deleted successfully.",
    });
  } catch (error) {
    console.error("Delete NFT error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete NFT.",
    });
  }
};

// ======================================================
// EXPORT CONTROLLERS
// ======================================================

module.exports = {
  getPublicNFTs,
  getMyNFTs,
  getNFTById,
  createNFT,
  updateNFT,
  deleteNFT,
};