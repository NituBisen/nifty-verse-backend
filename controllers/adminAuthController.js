const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Admin = require("../models/Admin");
const { sendOtpEmail } = require("../config/mailer");

const hashOtp = (otp) => {
    return crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");
};

const isOtpMatching = (storedHash, otp) => {
    if (!storedHash) {
        return false;
    }

    const storedBuffer = Buffer.from(
        storedHash,
        "hex"
    );

    const submittedBuffer = Buffer.from(
        hashOtp(otp),
        "hex"
    );

    return (
        storedBuffer.length === submittedBuffer.length &&
        crypto.timingSafeEqual(
            storedBuffer,
            submittedBuffer
        )
    );
};

const clearResetOtp = (admin) => {
    admin.passwordResetOtpHash = null;
    admin.passwordResetOtpExpiresAt = null;
    admin.passwordResetOtpVerified = false;
    admin.passwordResetOtpAttempts = 0;
};

// ==========================================
// ADMIN SIGN IN
// ==========================================

const signinAdmin = async (req, res) => {
    try {
        const {
            adminId,
            password,
        } = req.body;

        if (!adminId || !password) {
            return res.status(400).json({
                success: false,
                message: "Admin ID and password are required",
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing");

            return res.status(500).json({
                success: false,
                message: "Server configuration error",
            });
        }

        const admin = await Admin.findOne({
            adminId: adminId.trim(),
        });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin ID or password",
            });
        }

        const isPasswordMatch = await bcrypt.compare(
            password,
            admin.password
        );

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin ID or password",
            });
        }

        const token = jwt.sign(
            {
                id: admin._id,
                adminId: admin.adminId,
                role: "admin",
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        return res.status(200).json({
            success: true,
            message: "Admin signin successful",
            token,
            admin: {
                id: admin._id,
                adminId: admin.adminId,
                role: admin.role,
            },
        });
    } catch (error) {
        console.error(
            "Admin signin error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Admin signin failed",
        });
    }
};

// ==========================================
// SEND ADMIN PASSWORD RESET OTP
// ==========================================

const sendAdminPasswordResetOtp = async (req, res) => {
    const adminId = String(
        req.body.adminId || ""
    ).trim();

    const email = String(
        req.body.email || ""
    )
        .trim()
        .toLowerCase();

    if (!adminId || !email) {
        return res.status(400).json({
            success: false,
            message: "Admin ID and registered email are required.",
        });
    }

    try {
        const admin = await Admin.findOne({
            adminId,
            email,
        });

        // Debug: check whether the admin details match.
        console.log("Admin OTP lookup:", {
            adminId,
            adminFound: Boolean(admin),
        });

        const genericMessage =
            "If the Admin ID and email match an account, an OTP will be sent.";

        if (!admin) {
            return res.status(200).json({
                success: true,
                message: genericMessage,
            });
        }

        const otp = String(
            crypto.randomInt(100000, 1000000)
        );

        admin.passwordResetOtpHash = hashOtp(otp);

        admin.passwordResetOtpExpiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        );

        admin.passwordResetOtpVerified = false;
        admin.passwordResetOtpAttempts = 0;

        await admin.save();

        try {
            const mailResult = await sendOtpEmail(
                admin.email,
                otp
            );

            // Debug: check SMTP acceptance or rejection.
            console.log("Admin OTP email result:", {
                messageId: mailResult.messageId,
                accepted: mailResult.accepted,
                rejected: mailResult.rejected,
            });

            // A rejected recipient should not be reported as sent.
            if (
                Array.isArray(mailResult.rejected) &&
                mailResult.rejected.length > 0
            ) {
                throw new Error(
                    "SMTP rejected the recipient email address."
                );
            }
        } catch (emailError) {
            console.error(
                "Admin password reset email error:",
                emailError.message
            );

            clearResetOtp(admin);
            await admin.save();

            return res.status(500).json({
                success: false,
                message:
                    "Unable to send OTP email. Please try again later.",
            });
        }

        return res.status(200).json({
            success: true,
            message: genericMessage,
        });
    } catch (error) {
        console.error(
            "Send admin password reset OTP error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to send OTP. Please try again later.",
        });
    }
};

// ==========================================
// VERIFY ADMIN PASSWORD RESET OTP
// ==========================================

const verifyAdminPasswordResetOtp = async (req, res) => {
    const adminId = String(
        req.body.adminId || ""
    ).trim();

    const email = String(
        req.body.email || ""
    )
        .trim()
        .toLowerCase();

    const otp = String(
        req.body.otp || ""
    ).trim();

    if (
        !adminId ||
        !email ||
        !/^\d{6}$/.test(otp)
    ) {
        return res.status(400).json({
            success: false,
            message: "Enter your Admin ID, email and valid six-digit OTP.",
        });
    }

    try {
        const admin = await Admin.findOne({
            adminId,
            email,
        });

        if (
            !admin ||
            !admin.passwordResetOtpHash ||
            !admin.passwordResetOtpExpiresAt
        ) {
            return res.status(400).json({
                success: false,
                message: "OTP is invalid or expired.",
            });
        }

        if (
            admin.passwordResetOtpExpiresAt.getTime() <=
            Date.now()
        ) {
            clearResetOtp(admin);
            await admin.save();

            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new OTP.",
            });
        }

        if (admin.passwordResetOtpAttempts >= 5) {
            clearResetOtp(admin);
            await admin.save();

            return res.status(429).json({
                success: false,
                message: "Too many attempts. Please request a new OTP.",
            });
        }

        if (
            !isOtpMatching(
                admin.passwordResetOtpHash,
                otp
            )
        ) {
            admin.passwordResetOtpAttempts += 1;

            if (admin.passwordResetOtpAttempts >= 5) {
                clearResetOtp(admin);
            }

            await admin.save();

            return res.status(400).json({
                success: false,
                message: "OTP is invalid or expired.",
            });
        }

        admin.passwordResetOtpVerified = true;

        await admin.save();

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully.",
        });
    } catch (error) {
        console.error(
            "Verify admin OTP error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to verify OTP. Please try again.",
        });
    }
};

// ==========================================
// RESET ADMIN PASSWORD
// ==========================================

const resetAdminPassword = async (req, res) => {
    const adminId = String(
        req.body.adminId || ""
    ).trim();

    const email = String(
        req.body.email || ""
    )
        .trim()
        .toLowerCase();

    const otp = String(
        req.body.otp || ""
    ).trim();

    const newPassword = req.body.newPassword;

    if (
        !adminId ||
        !email ||
        !/^\d{6}$/.test(otp)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid Admin ID, email or OTP.",
        });
    }

    if (
        typeof newPassword !== "string" ||
        newPassword.length < 6 ||
        newPassword.length > 128
    ) {
        return res.status(400).json({
            success: false,
            message: "Password must be between 6 and 128 characters.",
        });
    }

    try {
        const admin = await Admin.findOne({
            adminId,
            email,
        });

        if (
            !admin ||
            !admin.passwordResetOtpHash ||
            !admin.passwordResetOtpExpiresAt ||
            !admin.passwordResetOtpVerified
        ) {
            return res.status(400).json({
                success: false,
                message: "Please verify a valid OTP first.",
            });
        }

        if (
            admin.passwordResetOtpExpiresAt.getTime() <=
            Date.now()
        ) {
            clearResetOtp(admin);
            await admin.save();

            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new OTP.",
            });
        }

        if (
            !isOtpMatching(
                admin.passwordResetOtpHash,
                otp
            )
        ) {
            admin.passwordResetOtpAttempts += 1;

            if (admin.passwordResetOtpAttempts >= 5) {
                clearResetOtp(admin);
            }

            await admin.save();

            return res.status(400).json({
                success: false,
                message: "OTP is invalid. Please request a new OTP if needed.",
            });
        }

        admin.password = await bcrypt.hash(
            newPassword,
            10
        );

        clearResetOtp(admin);

        await admin.save();

        return res.status(200).json({
            success: true,
            message:
                "Admin password reset successfully. Please sign in with your new password.",
        });
    } catch (error) {
        console.error(
            "Reset admin password error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to reset password. Please try again later.",
        });
    }
};

module.exports = {
    signinAdmin,
    sendAdminPasswordResetOtp,
    verifyAdminPasswordResetOtp,
    resetAdminPassword,
};