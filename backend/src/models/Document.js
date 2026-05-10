const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },
    pages: { type: Number, default: 0 },
    sizeBytes: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const Document = mongoose.model("Document", DocumentSchema);

module.exports = { Document };
