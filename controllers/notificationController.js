const mongoose = require("mongoose");
const Notification = require("../models/Notification");

// ======================================================
// HELPER: CREATE A NOTIFICATION FROM BACKEND EVENTS
// ======================================================

const createNotification = async ({
  recipient,
  actor = null,
  type = "system",
  title,
  message,
  link = "",
  relatedNFT = null,
  metadata = {},
}) => {
  if (!recipient || !title || !message) {
    throw new Error("Recipient, title and message are required.");
  }

  const notification = await Notification.create({
    recipient,
    actor,
    type,
    title,
    message,
    link,
    relatedNFT,
    metadata,
  });

  // DEBUG: Confirm notification was saved to MongoDB.
  console.log("[NOTIFICATIONS] Notification saved:", {
    notificationId: String(notification._id),
    recipient: String(notification.recipient),
    actor: notification.actor ? String(notification.actor) : null,
    type: notification.type,
    read: notification.read,
  });

  return notification;
};

// ======================================================
// GET MY NOTIFICATIONS
// GET /api/notifications/mine
// ======================================================

const getMyNotifications = async (req, res) => {
  try {
    const userId = req.authUser.userId;
    const normalizedUserId = String(userId);

    // DEBUG: Identify the account requesting notifications.
    console.log(
      "[NOTIFICATIONS] Fetch requested for user:",
      normalizedUserId
    );

    // DEBUG: Count notifications belonging to this account.
    const notificationCount = await Notification.countDocuments({
      recipient: userId,
    });

    console.log(
      "[NOTIFICATIONS] Database count for user:",
      normalizedUserId,
      "Count:",
      notificationCount
    );

    const notifications = await Notification.find({
      recipient: userId,
    })
      .populate("actor", "username profileImage")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const result = notifications.map((item) => ({
      ...item,
      id: String(item._id),
    }));

    // DEBUG: Verify how many records were returned.
    console.log(
      "[NOTIFICATIONS] Records returned:",
      result.length,
      "Unread:",
      result.filter((item) => !item.read).length
    );

    return res.json({
      success: true,
      notifications: result,
      unreadCount: result.filter((item) => !item.read).length,
      total: notificationCount,
    });
  } catch (error) {
    console.error("[NOTIFICATIONS] Get notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load notifications.",
    });
  }
};

// ======================================================
// MARK ONE NOTIFICATION AS READ
// PATCH /api/notifications/:id/read
// ======================================================

const markNotificationRead = async (req, res) => {
  try {
    const userId = req.authUser.userId;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        recipient: userId,
      },
      {
        $set: { read: true },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.json({
      success: true,
      message: "Notification marked as read.",
      notification: {
        id: String(notification._id),
        read: notification.read,
      },
    });
  } catch (error) {
    console.error("[NOTIFICATIONS] Mark as read error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update notification.",
    });
  }
};

// ======================================================
// MARK ALL AS READ
// PATCH /api/notifications/read-all
// ======================================================

const markAllNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        recipient: req.authUser.userId,
        read: false,
      },
      {
        $set: { read: true },
      }
    );

    return res.json({
      success: true,
      message: "All notifications marked as read.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("[NOTIFICATIONS] Mark all as read error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to mark all notifications as read.",
    });
  }
};

// ======================================================
// DELETE ONE NOTIFICATION
// DELETE /api/notifications/:id
// ======================================================

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const deleted = await Notification.findOneAndDelete({
      _id: id,
      recipient: req.authUser.userId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.json({
      success: true,
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    console.error("[NOTIFICATIONS] Delete error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete notification.",
    });
  }
};

// ======================================================
// CLEAR ALL MY NOTIFICATIONS
// DELETE /api/notifications/all
// ======================================================

const clearMyNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.authUser.userId,
    });

    return res.json({
      success: true,
      message: "All notifications cleared.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("[NOTIFICATIONS] Clear all error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to clear notifications.",
    });
  }
};

module.exports = {
  createNotification,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearMyNotifications,
};