const { GoogleGenAI } = require("@google/genai");
const { Chunk } = require("../models/Chunk");
const { embedText } = require("./embeddings");

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenAI({ apiKey: apiKey || "", apiVersion: "v1" });
const modelName = process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash-lite";

const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (!normA || !normB) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const buildPrompt = (question, contextText, historyText) => `You are a helpful tutor. Use the context to answer the question.
If the context does not contain the answer, say you do not have enough information.

Conversation so far:
${historyText || "(no prior context)"}

Context:
${contextText}

Question:
${question}`;

const buildQueryText = (message, history) => {
  const trimmed = message?.trim() || "";
  if (!history?.length || trimmed.length >= 20) {
    return trimmed;
  }

  const previousUser = [...history]
    .reverse()
    .find((item) => item.role === "user" && item.content && item.content !== trimmed);

  if (!previousUser) {
    return trimmed;
  }

  return `${previousUser.content}\n\nFollow-up: ${trimmed}`;
};

const formatHistory = (history, limit = 6) => {
  if (!Array.isArray(history) || !history.length) {
    return "";
  }

  return history
    .slice(-limit)
    .map((item) => `${item.role === "user" ? "User" : "Assistant"}: ${item.content}`)
    .join("\n");
};

const fetchRelevantChunks = async (documentId, questionEmbedding, topK) => {
  const chunks = await Chunk.find({ documentId })
    .select("text embedding")
    .lean();

  if (!chunks.length) {
    return [];
  }

  const scored = chunks.map((chunk) => ({
    text: chunk.text,
    score: cosineSimilarity(questionEmbedding, chunk.embedding)
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((item) => item.text);
};

const chatWithTutor = async (message, options = {}) => {
  const { documentId, topK = 6, history = [] } = options;

  let prompt = message;

  if (documentId) {
    const queryText = buildQueryText(message, history);
    const questionEmbedding = await embedText(queryText || message);
    const contextChunks = await fetchRelevantChunks(documentId, questionEmbedding, topK);
    const contextText = contextChunks.join("\n\n");
    const historyText = formatHistory(history);
    prompt = buildPrompt(message, contextText, historyText);
  }

  const result = await genAI.models.generateContent({
    model: modelName,
    contents: prompt
  });

  const answer = result?.text || "";
  return { finalAnswer: answer };
};

module.exports = { chatWithTutor };
