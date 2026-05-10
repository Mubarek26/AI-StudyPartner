const express = require("express");
const multer = require("multer");
const { uploadPdfToCloudinary } = require("../services/cloudinary");
const { downloadPdfBuffer, extractPdfText } = require("../services/pdf");
const { chunkText } = require("../services/chunk");
const { embedText, listEmbeddingModels } = require("../services/embeddings");
const { Document } = require("../models/Document");
const { Chunk } = require("../models/Chunk");
const mongoose = require("mongoose");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

router.post("/ingest", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Missing PDF file" });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF files are supported" });
    }

    const uploadResult = await uploadPdfToCloudinary(req.file.buffer, req.file.originalname);
    const pdfBuffer = await downloadPdfBuffer(uploadResult.secure_url);
    const parsed = await extractPdfText(pdfBuffer);

    const cleanText = parsed.text.trim();
    if (!cleanText) {
      return res.status(422).json({ error: "No text extracted from PDF" });
    }

    const doc = await Document.create({
      filename: req.file.originalname,
      cloudinaryUrl: uploadResult.secure_url,
      pages: parsed.numpages,
      sizeBytes: req.file.size
    });

    const chunks = chunkText(cleanText, { chunkSize: 1200, chunkOverlap: 150 });

    const chunkDocs = [];
    for (let i = 0; i < chunks.length; i += 1) {
      const text = chunks[i];
      const embedding = await embedText(text);
      chunkDocs.push({
        documentId: doc._id,
        index: i,
        text,
        embedding
      });
    }

    await Chunk.insertMany(chunkDocs);

    res.json({
      documentId: doc._id,
      chunks: chunkDocs.length,
      cloudinaryUrl: uploadResult.secure_url
    });
  } catch (error) {
    console.error("Ingest error", error);
    res.status(500).json({ error: "Failed to ingest PDF" });
  }
});

router.get("/documents", async (req, res) => {
  try {
    const docs = await Document.find({})
      .sort({ createdAt: -1 })
      .lean();

    res.json({ documents: docs });
  } catch (error) {
    console.error("List documents error", error);
    res.status(500).json({ error: "Failed to list documents" });
  }
});

router.delete("/documents/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid document id" });
    }

    const deleted = await Document.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ error: "Document not found" });
    }

    await Chunk.deleteMany({ documentId: id });

    res.json({ deleted: true });
  } catch (error) {
    console.error("Delete document error", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

router.post("/ingest-url", async (req, res) => {
  try {
    const { url, filename } = req.body || {};
    if (!url) {
      return res.status(400).json({ error: "Missing url" });
    }

    const pdfBuffer = await downloadPdfBuffer(url);
    const parsed = await extractPdfText(pdfBuffer);

    const cleanText = parsed.text.trim();
    if (!cleanText) {
      return res.status(422).json({ error: "No text extracted from PDF" });
    }

    const doc = await Document.create({
      filename: filename || "uploaded.pdf",
      cloudinaryUrl: url,
      pages: parsed.numpages,
      sizeBytes: pdfBuffer.length
    });

    const chunks = chunkText(cleanText, { chunkSize: 1200, chunkOverlap: 150 });

    const chunkDocs = [];
    for (let i = 0; i < chunks.length; i += 1) {
      const text = chunks[i];
      const embedding = await embedText(text);
      chunkDocs.push({
        documentId: doc._id,
        index: i,
        text,
        embedding
      });
    }

    await Chunk.insertMany(chunkDocs);

    res.json({
      documentId: doc._id,
      chunks: chunkDocs.length,
      cloudinaryUrl: url
    });
  } catch (error) {
    console.error("Ingest URL error", error);
    res.status(500).json({ error: "Failed to ingest PDF" });
  }
});

router.get("/models", async (req, res) => {
  try {
    const models = await listEmbeddingModels();
    res.json({ models });
  } catch (error) {
    console.error("List models error", error);
    res.status(500).json({ error: "Failed to list models" });
  }
});

module.exports = router;
