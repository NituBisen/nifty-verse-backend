const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getPublicNFTs,
  getMyNFTs,
  getNFTById,
  createNFT,
  updateNFT,
  deleteNFT,
} = require("../controllers/nftController");

// Public marketplace
router.get("/", getPublicNFTs);

// Authenticated user's NFTs
router.get("/mine", authMiddleware, getMyNFTs);
router.post("/", authMiddleware, createNFT);
router.patch("/:id", authMiddleware, updateNFT);
router.delete("/:id", authMiddleware, deleteNFT);

// Public detail route; keep after /mine
router.get("/:id", getNFTById);

module.exports = router;