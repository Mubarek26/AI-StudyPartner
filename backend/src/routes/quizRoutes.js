const express = require("express");
const { generateQuiz, listQuizModels } = require("../services/quizService");

const router = express.Router();

router.post("/quiz", async (req, res) => {
  try {
    const { documentId, numQuestions, numChunks, provider } = req.body || {};
    const quiz = await generateQuiz({ documentId, numQuestions, numChunks, provider });
    res.json(quiz);
  } catch (error) {
    const status = error.status || 500;
    if (status === 500) {
      console.error("Quiz generation failed", error);
    }
    res.status(status).json({ error: error.message || "Failed to generate quiz" });
  }
});

router.get("/quiz-models", async (req, res) => {
  try {
    const models = await listQuizModels();
    res.json({ models });
  } catch (error) {
    console.error("Quiz model listing failed", error);
    res.status(500).json({ error: "Failed to list quiz models" });
  }
});

module.exports = router;
