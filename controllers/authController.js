// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// const signup = async (req, res) => {
//   try {
//     const { username, email, password, confirmPassword } = req.body;

//     if (!username || !email || !password || !confirmPassword) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     if (password !== confirmPassword) {
//       return res.status(400).json({ message: "Passwords do not match" });
//     }

//     const existingUser = await User.findOne({ email });

//     if (existingUser) {
//       return res.status(409).json({ message: "Email already registered" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       username,
//       email,
//       password: hashedPassword,
//     });

//     res.status(201).json({
//       message: "User registered successfully",
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };

// const signin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({
//         message: "Email and password are required",
//       });
//     }

//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(401).json({
//         message: "Invalid email or password",
//       });
//     }

//     const isPasswordValid = await bcrypt.compare(password, user.password);

//     if (!isPasswordValid) {
//       return res.status(401).json({
//         message: "Invalid email or password",
//       });
//     }

//     const token = jwt.sign(
//       {
//         userId: user._id,
//         email: user.email,
//       },
//       process.env.JWT_SECRET,
//       {
//         expiresIn: "7d",
//       }
//     );

//     res.status(200).json({
//       message: "Login successful",
//       token,
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };

// module.exports = {
//   signup,
//   signin,
// };







const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

        const existingUser = await User.findOne({
            email,
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
            email,
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

        const user = await User.findOne({
            email,
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

module.exports = {
    signup,
    signin,
};