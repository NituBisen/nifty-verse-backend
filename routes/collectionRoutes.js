const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getPublicCollections,
  getMyCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
} = require("../controllers/collectionController");

// Public collections
router.get("/", getPublicCollections);

// Private collections belonging to the signed-in user
router.get("/mine", authMiddleware, getMyCollections);
router.post("/", authMiddleware, createCollection);
router.patch("/:id", authMiddleware, updateCollection);
router.delete("/:id", authMiddleware, deleteCollection);

// Public collection detail
router.get("/:id", getCollectionById);

module.exports = router;