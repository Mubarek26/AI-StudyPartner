const { GoogleGenAI } = require("@google/genai");
const axios = require("axios");
const { Chunk } = require("../models/Chunk");

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenAI({ apiKey: apiKey || "", apiVersion: "v1" });
const modelName = process.env.GEMINI_QUIZ_MODEL || "gemini-1.5-flash";
let cachedQuizModels = null;

const quizSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string", enum: ["multiple_choice", "true_false", "short_answer"] },
          question: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          answer: { type: "string" },
          explanation: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
        },
        required: ["id", "type", "question", "answer", "explanation", "difficulty"]
      }
    }
  },
  required: ["title", "questions"]
};

const buildPrompt = (contextText, questionCount) => `
You are a tutor creating a quiz from study material.
Return only valid JSON. Do not include markdown or extra text.
The JSON must match this schema exactly:
${JSON.stringify(quizSchema, null, 2)}

Create ${questionCount} questions.
- Use multiple_choice for most questions, true_false for 1-2, and short_answer for 1-2.
- For multiple_choice, include 4 options and ensure the answer matches one option.
- Keep questions grounded in the context.

Context:
${contextText}
`;

const fetchContextChunks = async (documentId, limit) => {
  const chunks = await Chunk.find({ documentId })
    .sort({ index: 1 })
    .limit(limit)
    .select("text")
    .lean();

  return chunks.map((chunk) => chunk.text).join("\n\n");
};

const listQuizModels = async () => {
  if (cachedQuizModels) {
    return cachedQuizModels;
  }

  let models = [];

  if (genAI?.models?.list) {
    try {
      const result = await genAI.models.list();
      models = result?.models || [];
    } catch (error) {
      console.warn("SDK listModels failed, falling back to REST", error);
    }
  }

  if (!models.length && apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
    const response = await axios.get(url);
    models = response.data?.models || [];
  }

  cachedQuizModels = models
    .filter((model) => (model.supportedGenerationMethods || []).includes("generateContent"))
    .map((model) => model.name)
    .sort();

  return cachedQuizModels;
};

const extractJsonFromText = (rawText) => {
  if (!rawText || typeof rawText !== "string") {
    return null;
  }

  let text = rawText.trim();

  // Strip ```json / ``` fences if present.
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");

  // Try to locate the first JSON object/array if extra text slipped in.
  const objectMatch = text.match(/\{[\s\S]*\}/);
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  const candidate = objectMatch?.[0] || arrayMatch?.[0] || text;

  try {
    return JSON.parse(candidate);
  } catch (error) {
    return null;
  }
};

const generateQuiz = async ({ documentId, numQuestions = 8, numChunks = 6 }) => {
  if (!documentId) {
    const error = new Error("documentId is required");
    error.status = 400;
    throw error;
  }

  const contextText = await fetchContextChunks(documentId, numChunks);
  if (!contextText) {
    const error = new Error("No chunks found for document");
    error.status = 404;
    throw error;
  }

  const result = await genAI.models.generateContent({
    model: modelName,
    contents: buildPrompt(contextText, numQuestions)
  });

  const rawText = result?.text || "";
  const json = extractJsonFromText(rawText);

  if (!json) {
    const error = new Error("Quiz generation returned invalid JSON");
    error.status = 502;
    throw error;
  }

  return json;
};

module.exports = { generateQuiz, listQuizModels };
