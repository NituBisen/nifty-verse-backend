const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearMyNotifications,
} = require("../controllers/notificationController");

router.get("/mine", authMiddleware, getMyNotifications);

// Isko /:id/read route se pehle rakhna.
router.patch("/read-all", authMiddleware, markAllNotificationsRead);

router.patch("/:id/read", authMiddleware, markNotificationRead);

router.delete("/all", authMiddleware, clearMyNotifications);

router.delete("/:id", authMiddleware, deleteNotification);

module.exports = router;