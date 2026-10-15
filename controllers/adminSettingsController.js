
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

const getAdminSettings = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id).select("adminId email role createdAt updatedAt").lean();

        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found." });
        }

        return res.status(200).json({ success: true, admin });
    } catch (error) {
        console.error("Get admin settings error:", error);
        return res.status(500).json({ success: false, message: "Unable to load admin settings." });
    }
};

const updateAdminSettings = async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: "Enter a valid email address." });
        }

        const admin = await Admin.findById(req.admin.id);

        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found." });
        }

        const duplicateEmail = await Admin.findOne({
            email,
            _id: { $ne: admin._id }
        });

        if (duplicateEmail) {
            return res.status(409).json({ success: false, message: "This email is already in use." });
        }

        admin.email = email;
        await admin.save();

        return res.status(200).json({
            success: true,
            message: "Admin email updated successfully.",
            admin: {
                id: String(admin._id),
                adminId: admin.adminId,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "This email is already in use." });
        }

        console.error("Update admin settings error:", error);
        return res.status(500).json({ success: false, message: "Unable to update admin settings." });
    }
};

const changeAdminPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (
            typeof currentPassword !== "string" ||
            typeof newPassword !== "string" ||
            typeof confirmPassword !== "string" ||
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {
            return res.status(400).json({ success: false, message: "All password fields are required." });
        }

        if (newPassword.length < 8 || newPassword.length > 128) {
            return res.status(400).json({ success: false, message: "New password must be 8–128 characters long." });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: "New password and confirmation do not match." });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ success: false, message: "New password must differ from the current password." });
        }

        const admin = await Admin.findById(req.admin.id);

        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found." });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);

        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: "Current password is incorrect." });
        }

        admin.password = await bcrypt.hash(newPassword, 12);
        await admin.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully. Please sign in again."
        });
    } catch (error) {
        console.error("Change admin password error:", error);
        return res.status(500).json({ success: false, message: "Unable to change password." });
    }
};

module.exports = {
    getAdminSettings,
    updateAdminSettings,
    changeAdminPassword
};
