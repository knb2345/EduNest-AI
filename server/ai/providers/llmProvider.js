const axios = require("axios");

const OPENAI_KEY = process.env.OPENAI_API_KEY;

async function generateAnswer(question, chunks) {
  // chunks: [{text, docName, pageNumber}]
  if (OPENAI_KEY) {
    const system = `You are an assistant that answers questions using ONLY the provided course documents. Cite sources as [document:page]. If the answer is not contained in the documents, say 'Insufficient evidence'.`;
    const context = chunks.map((c, i) => `[${c.docName}:${c.pageNumber}] ${c.text}`).join("\n---\n");
    const prompt = `${system}\n\nContext:\n${context}\n\nQuestion:\n${question}\n\nAnswer:`;
    try {
      const resp = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: process.env.LLM_MODEL || "gpt-4o-mini",
          messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
          max_tokens: 500,
        },
        { headers: { Authorization: `Bearer ${OPENAI_KEY}` } }
      );
      return { text: resp.data.choices[0].message.content };
    } catch (err) {
      console.error("OpenAI LLM error:", err.message);
      throw err;
    }
  }
  // When no LLM key, controller handles source-preview mode; do not synthesize here
  throw new Error("No LLM key available");
}

module.exports = { generateAnswer };
