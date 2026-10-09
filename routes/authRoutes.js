
const express = require("express");

const router = express.Router();

const {
    signup,
    signin,
    getMe,
    sendPasswordResetOtp,
    verifyPasswordResetOtp,
    resetPassword,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

// Signup
router.post(
    "/signup",
    signup
);

// Signin
router.post(
    "/signin",
    signin
);

// Get current logged-in user
router.get(
    "/me",
    authMiddleware,
    getMe
);

// Send password reset OTP
router.post(
    "/send-otp",
    sendPasswordResetOtp
);

// Verify password reset OTP
router.post(
    "/verify-otp",
    verifyPasswordResetOtp
);

// Reset password
router.post(
    "/reset-password",
    resetPassword
);

module.exports = router;
