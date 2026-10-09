const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");
const corsOptions = require("./config/cors");

const authRoutes = require("./routes/authRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");

const app = express();

app.use(
    cors(corsOptions)
);

app.use(
    express.json()
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