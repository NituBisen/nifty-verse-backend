const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getMyFavorites,
  addFavorite,
  removeFavorite,
} = require("../controllers/favoriteController");

router.get("/mine", authMiddleware, getMyFavorites);
router.post("/:nftId", authMiddleware, addFavorite);
router.delete("/:nftId", authMiddleware, removeFavorite);

module.exports = router;