
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 60, unique: true },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" }
}, { timestamps: true });

module.exports = mongoose.model("Category", categorySchema);
