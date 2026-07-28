const axios = require("axios");

const OPENAI_KEY = process.env.OPENAI_API_KEY;

async function generateEmbedding(text) {
  if (!OPENAI_KEY) return null;
  try {
    const resp = await axios.post(
      "https://api.openai.com/v1/embeddings",
      { input: text, model: process.env.EMBEDDING_MODEL || "text-embedding-3-small" },
      { headers: { Authorization: `Bearer ${OPENAI_KEY}` } }
    );
    return resp.data.data[0].embedding;
  } catch (err) {
    console.error("OpenAI embedding error:", err.message);
    return null;
  }
}

module.exports = { generateEmbedding };
