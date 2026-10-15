const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
module.exports = cors({ origin: "http://localhost:5173" });
dotenv.config();

const connectDB = require("./config/db");
const corsOptions = require("./config/cors");

const authRoutes = require("./routes/authRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const nftRoutes = require("./routes/nftRoutes");
const collectionRoutes = require("./routes/collectionRoutes");
const profileRoutes = require("./routes/profileRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const activityRoutes = require("./routes/activityRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();

app.use(
    cors(corsOptions)
);

app.use(
    express.json({ limit: "8mb" })
);

app.get(
    "/",
    (req, res) => {
        res.json({
            message: "Nifty Verse Backend is running",
        });
    }
);

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/admin/auth",
    adminAuthRoutes
);

app.use(
    "/api/admin",
    adminUserRoutes
);

app.use("/api/nfts", nftRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/admin", adminUserRoutes);
app.use("/api/categories", categoryRoutes);


const PORT =
    process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(
            PORT,
            () => {
                console.log(
                    `Server running on port ${PORT}`
                );
            }
        );
    })
    .catch((error) => {
        console.error(
            "Database connection failed:",
            error
        );

        process.exit(1);
    });