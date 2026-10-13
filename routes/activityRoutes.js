// const express = require("express");
// const router = express.Router();

// const authMiddleware = require("../middleware/authMiddleware");

// const {
//   getMyActivities,
//   clearMyActivities,
// } = require("../controllers/activityController");

// router.get("/mine", authMiddleware, getMyActivities);
// router.delete("/all", authMiddleware, clearMyActivities);

// module.exports = router;





//new code


const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getMyActivities,
  clearMyActivities,
} = require("../controllers/activityController");

router.get("/mine", authMiddleware, getMyActivities);

router.delete("/all", authMiddleware, clearMyActivities);

module.exports = router;
