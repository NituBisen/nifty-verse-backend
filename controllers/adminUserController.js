const User = require("../models/User");

const getUsers = async (req, res) => {
    try {
        const users = await User.find({})
            .select(
                "_id username email lastLoginAt createdAt updatedAt"
            )
            .sort({
                createdAt: -1,
            });

        return res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error(
            "Get users error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch users",
            error: error.message,
        });
    }
};

module.exports = {
    getUsers,
};