const User = require("../models/User");

const isValidProfileImage = (value) => {
  if (typeof value !== "string") return false;

  if (value === "") return true;

  if (value.length > 4 * 1024 * 1024) return false;

  return (
    /^https?:\/\/\S+$/i.test(value) ||
    /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(
      value
    )
  );
};

// GET /api/profile/me
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.authUser.userId).select(
      "username email profileImage createdAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage || "",
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your profile.",
    });
  }
};

// PATCH /api/profile/me
const updateMyProfile = async (req, res) => {
  try {
    const { profileImage } = req.body || {};

    if (!isValidProfileImage(profileImage)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid profile image. Use an image URL or a supported image file.",
      });
    }

    const user = await User.findById(req.authUser.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    user.profileImage = profileImage;
    await user.save();

    return res.json({
      success: true,
      message: "Profile image saved successfully.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage || "",
      },
    });
  } catch (error) {
    console.error("Update profile image error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save your profile image.",
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
};