// const  mongoose = require('mongoose');

// const userSchema = new mongoose.Schema(
//     {
//         username: {
//             type: String,
//             required: true,
//             trim: true,
//         },
//         email: {
//             type: String,
//             required: true,
//             unique: true,
//             lowercase: true,
//             trim: true,
//         },
//         password: {
//             type: String,
//             required: true,
//             minlength: 6,
//         },
//     },
//     {
//         timestamps: true,
//     }
// );


// module.exports = mongoose.model('User', userSchema);




const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
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
            enum: ["user", "admin"],
            default: "user",
        },

        lastLoginAt: {
            type: Date,
            default: null,
        },

        // Password Reset OTP Fields
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

module.exports = mongoose.model("User", userSchema);