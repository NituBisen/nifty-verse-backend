const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
    {
        adminId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
        },

        role: {
            type: String,
            enum: ["admin"],
            default: "admin",
        },

        // Admin Password Reset OTP Fields
        passwordResetOtpHash: {
            type: String,
            default: null,
        },

        passwordResetOtpExpiresAt: {
            type: Date,
            default: null,
        },

        passwordResetOtpVerified: {
            type: Boolean,
            default: false,
        },

        passwordResetOtpAttempts: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Admin", adminSchema);