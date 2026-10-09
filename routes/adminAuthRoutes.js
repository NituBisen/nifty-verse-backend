const express = require("express");

const {
    signinAdmin,
    sendAdminPasswordResetOtp,
    verifyAdminPasswordResetOtp,
    resetAdminPassword,
} = require("../controllers/adminAuthController");

const router = express.Router();

// Admin Sign In
router.post(
    "/signin",
    signinAdmin
);

// Send password reset OTP to registered email
router.post(
    "/send-otp",
    sendAdminPasswordResetOtp
);

// Verify password reset OTP
router.post(
    "/verify-otp",
    verifyAdminPasswordResetOtp
);

// Reset admin password
router.post(
    "/reset-password",
    resetAdminPassword
);

module.exports = router;