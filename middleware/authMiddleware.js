const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (
        !authHeader ||
        !authHeader.startsWith("Bearer ")
    ) {
        return res.status(401).json({
            success: false,
            message: "Authentication token is required.",
        });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Authentication token is missing.",
        });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        return res.status(500).json({
            success: false,
            message: "Authentication configuration error.",
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            jwtSecret
        );

        if (!decoded.userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token.",
            });
        }

        req.authUser = {
            userId: decoded.userId,
            email: decoded.email,
        };

        next();
    } catch (error) {
        const message =
            error.name === "TokenExpiredError"
                ? "Session expired. Please sign in again."
                : "Invalid authentication token.";

        return res.status(401).json({
            success: false,
            message,
        });
    }
};

module.exports = authMiddleware;