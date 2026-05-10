const express = require("express");
const { chatWithTutor } = require("../services/chatWithTutor");

const router = express.Router();

router.post("/chat", async (req, res) => {
  const { message } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  try {
    const result = await chatWithTutor(message, req.body);
    const payload = {
      finalAnswer: result?.finalAnswer || result?.answer || result?.text
    };

    if (result?.providerUsed) {
      payload.providerUsed = result.providerUsed;
    }

    if (req.body?.provider) {
      payload.requestedProvider = req.body.provider;
    }

    if (result?.thoughts) {
      payload.thoughts = result.thoughts;
    }

    res.json(payload);
  } catch (error) {
    console.error("Chat error", error);
    res.status(error.status || 500).json({
      error: error.message || "AI service failed",
      providerUsed: error.providerUsed || null,
      requestedProvider: req.body?.provider || null
    });
  }
});

module.exports = router;
