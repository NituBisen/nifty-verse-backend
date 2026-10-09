
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { sendOtpEmail } = require("../config/mailer");

const signup = async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            confirmPassword,
        } = req.body;

        if (
            !username ||
            !email ||
            !password ||
            !confirmPassword
        ) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match",
            });
        }

        const normalizedEmail = email
            .trim()
            .toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered",
            });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        const user = await User.create({
            username,
            email: normalizedEmail,
            password: hashedPassword,
        });

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt,
                lastLoginAt: user.lastLoginAt,
            },
        });
    } catch (error) {
        console.error("Signup error:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

const signin = async (req, res) => {
    try {
        const {
            email,
            password,
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const normalizedEmail = email
            .trim()
            .toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail,
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const isPasswordValid =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        user.lastLoginAt = new Date();

        await user.save();

        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt,
                lastLoginAt: user.lastLoginAt,
            },
        });
    } catch (error) {
        console.error("Signin error:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(
            req.authUser.userId
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found.",
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt,
                lastLoginAt: user.lastLoginAt,
            },
        });
    } catch (error) {
        console.error(
            "Get current user error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to fetch user profile.",
        });
    }
};

// Send Password Reset OTP
const sendPasswordResetOtp = async (req, res) => {
    const email = String(
        req.body.email || ""
    )
        .trim()
        .toLowerCase();

    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required.",
        });
    }

    try {
        const user = await User.findOne({
            email,
        });

        // Do not reveal whether an account exists.
        if (!user) {
            return res.status(200).json({
                success: true,
                message:
                    "If an account exists for this email, an OTP will be sent.",
            });
        }

        // Generate a secure six-digit OTP.
        const otp = String(
            crypto.randomInt(100000, 1000000)
        );

        // Store only the SHA-256 hash of the OTP.
        const otpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        user.passwordResetOtpHash = otpHash;

        user.passwordResetOtpExpiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        );

        user.passwordResetOtpVerified = false;
        user.passwordResetOtpAttempts = 0;

        await user.save();

        try {
            await sendOtpEmail(
                user.email,
                otp
            );
        } catch (emailError) {
            console.error(
                "Password reset email error:",
                emailError.message
            );

            // Clear the OTP if email delivery fails.
            user.passwordResetOtpHash = null;
            user.passwordResetOtpExpiresAt = null;
            user.passwordResetOtpVerified = false;
            user.passwordResetOtpAttempts = 0;

            await user.save();

            return res.status(500).json({
                success: false,
                message:
                    "Unable to send the OTP email. Please try again later.",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "If an account exists for this email, an OTP will be sent.",
        });
    } catch (error) {
        console.error(
            "Send password reset OTP error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Something went wrong. Please try again later.",
        });
    }
};


const verifyPasswordResetOtp = async (req, res) => {
    const email = String(
        req.body.email || ""
    )
        .trim()
        .toLowerCase();

    const otp = String(
        req.body.otp || ""
    ).trim();

    if (!email || !/^\d{6}$/.test(otp)) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid six-digit OTP.",
        });
    }

    try {
        const user = await User.findOne({
            email,
        });

        if (
            !user ||
            !user.passwordResetOtpHash ||
            !user.passwordResetOtpExpiresAt
        ) {
            return res.status(400).json({
                success: false,
                message: "OTP is invalid or expired.",
            });
        }

        if (
            user.passwordResetOtpExpiresAt.getTime() <=
            Date.now()
        ) {
            user.passwordResetOtpHash = null;
            user.passwordResetOtpExpiresAt = null;
            user.passwordResetOtpVerified = false;
            user.passwordResetOtpAttempts = 0;

            await user.save();

            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one.",
            });
        }

        if (user.passwordResetOtpAttempts >= 5) {
            return res.status(429).json({
                success: false,
                message: "Too many attempts. Please request a new OTP.",
            });
        }

        const submittedOtpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        const storedHash = Buffer.from(
            user.passwordResetOtpHash,
            "hex"
        );

        const submittedHash = Buffer.from(
            submittedOtpHash,
            "hex"
        );

        const isOtpValid =
            storedHash.length === submittedHash.length &&
            crypto.timingSafeEqual(
                storedHash,
                submittedHash
            );

        if (!isOtpValid) {
            user.passwordResetOtpAttempts += 1;

            if (user.passwordResetOtpAttempts >= 5) {
                user.passwordResetOtpHash = null;
                user.passwordResetOtpExpiresAt = null;
                user.passwordResetOtpVerified = false;
            }

            await user.save();

            return res.status(400).json({
                success: false,
                message:
                    user.passwordResetOtpAttempts >= 5
                        ? "Too many attempts. Please request a new OTP."
                        : "OTP is invalid or expired.",
            });
        }

        user.passwordResetOtpVerified = true;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully.",
        });
    } catch (error) {
        console.error(
            "Verify password reset OTP error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to verify OTP. Please try again.",
        });
    }
};


const resetPassword = async (req, res) => {
    const email = String(
        req.body.email || ""
    )
        .trim()
        .toLowerCase();

    const otp = String(
        req.body.otp || ""
    ).trim();

    const newPassword = req.body.newPassword;

    if (!email || !/^\d{6}$/.test(otp)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email or OTP.",
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
        const user = await User.findOne({
            email,
        });

        if (
            !user ||
            !user.passwordResetOtpHash ||
            !user.passwordResetOtpExpiresAt ||
            !user.passwordResetOtpVerified
        ) {
            return res.status(400).json({
                success: false,
                message: "Please verify a valid OTP first.",
            });
        }

        if (
            user.passwordResetOtpExpiresAt.getTime() <=
            Date.now()
        ) {
            user.passwordResetOtpHash = null;
            user.passwordResetOtpExpiresAt = null;
            user.passwordResetOtpVerified = false;
            user.passwordResetOtpAttempts = 0;

            await user.save();

            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new one.",
            });
        }

        const submittedOtpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        const storedHash = Buffer.from(
            user.passwordResetOtpHash,
            "hex"
        );

        const submittedHash = Buffer.from(
            submittedOtpHash,
            "hex"
        );

        const isOtpValid =
            storedHash.length === submittedHash.length &&
            crypto.timingSafeEqual(
                storedHash,
                submittedHash
            );

        if (!isOtpValid) {
            user.passwordResetOtpAttempts += 1;

            if (user.passwordResetOtpAttempts >= 5) {
                user.passwordResetOtpHash = null;
                user.passwordResetOtpExpiresAt = null;
                user.passwordResetOtpVerified = false;
                user.passwordResetOtpAttempts = 0;
            }

            await user.save();

            return res.status(400).json({
                success: false,
                message:
                    "OTP is invalid. Please verify it again or request a new OTP.",
            });
        }

        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        user.password = hashedPassword;

        // Consume the OTP after successful password reset.
        user.passwordResetOtpHash = null;
        user.passwordResetOtpExpiresAt = null;
        user.passwordResetOtpVerified = false;
        user.passwordResetOtpAttempts = 0;

        await user.save();

        return res.status(200).json({
            success: true,
            message:
                "Password reset successfully. Please sign in with your new password.",
        });
    } catch (error) {
        console.error(
            "Reset password error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to reset password. Please try again later.",
        });
    }
};


module.exports = {
    signup,
    signin,
    getMe,
    sendPasswordResetOtp,
    verifyPasswordResetOtp,
    resetPassword,
};
