const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");
const Admin = require("./models/Admin");

const createAdmin = async () => {
    try {
        await connectDB();

        const adminId = process.env.ADMIN_ID;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminId || !adminPassword) {
            console.log(
                "ADMIN_ID and ADMIN_PASSWORD are required"
            );

            process.exit(1);
        }

        const existingAdmin = await Admin.findOne({
            adminId: adminId.trim(),
        });

        if (existingAdmin) {
            console.log(
                "Admin already exists"
            );

            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(
            adminPassword,
            10
        );

        await Admin.create({
            adminId: adminId.trim(),
            password: hashedPassword,
            role: "admin",
        });

        console.log(
            "Admin created successfully"
        );

        process.exit(0);
    } catch (error) {
        console.error(
            "Admin creation error:",
            error
        );

        process.exit(1);
    }
};

createAdmin();