const express = require("express");
const router = express.Router();
const { getActiveCategories } = require("../controllers/adminCategoryController");

router.get("/active", getActiveCategories);

module.exports = router;
