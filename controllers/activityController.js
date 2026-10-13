// const mongoose = require("mongoose");
// const Activity = require("../models/Activity");

// // ======================================================
// // HELPER: RECORD AN ACTIVITY
// // ======================================================

// const recordActivity = async ({
//   user,
//   type = "system",
//   title,
//   message = "",
//   creatorName = "",
//   nftId = null,
//   price = null,
//   currency = "ETH",
//   status = "",
//   metadata = {},
// }) => {
//   if (!user || !title || !type) {
//     throw new Error("User, activity type and title are required.");
//   }

//   const activity = await Activity.create({
//     user,
//     type,
//     title,
//     message,
//     creatorName,
//     nftId,
//     price,
//     currency,
//     status,
//     metadata,
//   });

//   console.log("[ACTIVITY] Saved:", {
//     id: String(activity._id),
//     user: String(activity.user),
//     type: activity.type,
//     nftId: activity.nftId ? String(activity.nftId) : null,
//   });

//   return activity;
// };

// // ======================================================
// // GET MY ACTIVITIES
// // GET /api/activity/mine
// // ======================================================

// const getMyActivities = async (req, res) => {
//   try {
//     const userId = req.authUser.userId;

//     console.log("[ACTIVITY] Fetch requested for user:", String(userId));

//     const total = await Activity.countDocuments({
//       user: userId,
//     });

//     const activities = await Activity.find({
//       user: userId,
//     })
//       .sort({ createdAt: -1 })
//       .limit(200)
//       .lean();

//     const result = activities.map((item) => ({
//       ...item,
//       id: String(item._id),
//       nftId: item.nftId ? String(item.nftId) : null,
//     }));

//     console.log("[ACTIVITY] Records returned:", result.length);

//     return res.json({
//       success: true,
//       activities: result,
//       total,
//     });
//   } catch (error) {
//     console.error("[ACTIVITY] Get activities error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to load activity history.",
//     });
//   }
// };

// // ======================================================
// // CLEAR MY ACTIVITY HISTORY
// // DELETE /api/activity/all
// // ======================================================

// const clearMyActivities = async (req, res) => {
//   try {
//     const result = await Activity.deleteMany({
//       user: req.authUser.userId,
//     });

//     console.log("[ACTIVITY] History cleared:", {
//       user: String(req.authUser.userId),
//       deletedCount: result.deletedCount,
//     });

//     return res.json({
//       success: true,
//       message: "Activity history cleared successfully.",
//       deletedCount: result.deletedCount,
//     });
//   } catch (error) {
//     console.error("[ACTIVITY] Clear activities error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to clear activity history.",
//     });
//   }
// };

// module.exports = {
//   recordActivity,
//   getMyActivities,
//   clearMyActivities,
// };





//new code


const mongoose = require("mongoose");
const Activity = require("../models/Activity");

// SAVE ACTIVITY
const recordActivity = async ({
  user,
  type = "OTHER",
  title,
  message = "",
  creatorName = "",
  nftId = null,
  price = null,
  currency = "ETH",
  status = "",
  metadata = {},
}) => {
  if (!user || !mongoose.isValidObjectId(user)) {
    throw new Error("A valid user ID is required to record activity.");
  }

  if (!title || !String(title).trim()) {
    throw new Error("Activity title is required.");
  }

  const activity = await Activity.create({
    user,
    type,
    title: String(title).trim(),
    message,
    creatorName,
    nftId: nftId || null,
    price,
    currency,
    status,
    metadata,
  });

  console.log("[ACTIVITY] Saved successfully:", {
    id: String(activity._id),
    user: String(activity.user),
    type: activity.type,
    title: activity.title,
  });

  return activity;
};

// GET MY ACTIVITIES
// GET /api/activity/mine
const getMyActivities = async (req, res) => {
  try {
    const userId = req.authUser?.userId;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Valid authentication is required.",
      });
    }

    console.log("[ACTIVITY] Fetch requested for user:", String(userId));

    const activities = await Activity.find({
      user: new mongoose.Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const result = activities.map((item) => ({
      ...item,
      id: String(item._id),
      nftId: item.nftId ? String(item.nftId) : null,
    }));

    console.log("[ACTIVITY] Records returned:", result.length);

    return res.status(200).json({
      success: true,
      activities: result,
      total: result.length,
    });
  } catch (error) {
    console.error("[ACTIVITY] Get activities error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load activity history.",
    });
  }
};

// CLEAR MY ACTIVITY HISTORY
// DELETE /api/activity/all
const clearMyActivities = async (req, res) => {
  try {
    const userId = req.authUser?.userId;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Valid authentication is required.",
      });
    }

    const result = await Activity.deleteMany({
      user: new mongoose.Types.ObjectId(userId),
    });

    console.log("[ACTIVITY] History cleared:", {
      user: String(userId),
      deletedCount: result.deletedCount,
    });

    return res.status(200).json({
      success: true,
      message: "Activity history cleared successfully.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("[ACTIVITY] Clear activities error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to clear activity history.",
    });
  }
};

module.exports = {
  recordActivity,
  getMyActivities,
  clearMyActivities,
};
