const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true },
    description: String,
    quantity: { type: Number, default: 0 },
    categories: { type: Array, default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
