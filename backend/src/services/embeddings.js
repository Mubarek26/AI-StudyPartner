const apiKey = process.env.GEMINI_API_KEY;
const primaryModelName = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";

let aiClient = null;

// Helper to initialize the client
async function getClient() {
  if (aiClient) return aiClient;
  
  // Dynamic import for 2026 package compatibility
  const { GoogleGenAI } = await import("@google/genai"); 
  
  // The 2026 client is initialized like this:
  aiClient = new GoogleGenAI({ 
    apiKey: apiKey,
  });
  
  return aiClient;
}

const embedText = async (text) => {
  try {
    const ai = await getClient();

    // The 2026 SDK uses the 'models' property directly
    const result = await ai.models.embedContent({
      model: primaryModelName,
      contents: [text],
    });

    // Returns the vector array
    return result.embeddings[0].values;
  } catch (error) {
    console.error("Embedding failed:", error.message);
    throw error;
  }
};

module.exports = { embedText };