
const Category = require("../models/Category");

const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ createdAt: -1 }).lean();
        return res.status(200).json({ success: true, count: categories.length, categories });
    } catch (error) {
        console.error("Get admin categories error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch categories." });
    }
};

const createCategory = async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        const description = String(req.body.description || "").trim();
        const status = req.body.status || "active";

        if (!name) return res.status(400).json({ success: false, message: "Category name is required." });
        if (!["active", "inactive"].includes(status)) return res.status(400).json({ success: false, message: "Invalid category status." });

        const existing = await Category.findOne({ name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } });
        if (existing) return res.status(409).json({ success: false, message: "This category already exists." });

        const category = await Category.create({ name, description, status });
        return res.status(201).json({ success: true, message: "Category created successfully.", category });
    } catch (error) {
        console.error("Create category error:", error);
        return res.status(500).json({ success: false, message: "Failed to create category." });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = {};

        if (req.body.name !== undefined) {
            const name = String(req.body.name).trim();
            if (!name) return res.status(400).json({ success: false, message: "Category name is required." });
            updates.name = name;
        }

        if (req.body.description !== undefined) updates.description = String(req.body.description).trim();

        if (req.body.status !== undefined) {
            if (!["active", "inactive"].includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid category status." });
            updates.status = req.body.status;
        }

        const category = await Category.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!category) return res.status(404).json({ success: false, message: "Category not found." });

        return res.status(200).json({ success: true, message: "Category updated successfully.", category });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ success: false, message: "This category name already exists." });
        console.error("Update category error:", error);
        return res.status(500).json({ success: false, message: "Failed to update category." });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: "Category not found." });
        return res.status(200).json({ success: true, message: "Category deleted successfully." });
    } catch (error) {
        console.error("Delete category error:", error);
        return res.status(500).json({ success: false, message: "Failed to delete category." });
    }
};


const getActiveCategories = async (req, res) => {
    try {
        const categories = await Category.find({ status: "active" })
            .select("_id name description")
            .sort({ name: 1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });
    } catch (error) {
        console.error("Get active categories error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to load categories."
        });
    }
};

module.exports = { getCategories, getActiveCategories, createCategory, updateCategory, deleteCategory };
