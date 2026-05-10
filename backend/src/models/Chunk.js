const mongoose = require("mongoose");

const ChunkSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
    index: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true }
  },
  { timestamps: true }
);

ChunkSchema.index({ documentId: 1, index: 1 }, { unique: true });

const Chunk = mongoose.model("Chunk", ChunkSchema);

module.exports = { Chunk };
