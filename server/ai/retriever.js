const DocChunk = require("../models/DocChunk");
const { generateEmbedding } = require("./providers/embeddingProvider");

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function buildIdf(chunksTokens) {
  const df = {};
  const N = chunksTokens.length;
  for (const tokens of chunksTokens) {
    const seen = new Set();
    for (const t of tokens) {
      if (!seen.has(t)) {
        df[t] = (df[t] || 0) + 1;
        seen.add(t);
      }
    }
  }
  const idf = {};
  for (const term in df) idf[term] = Math.log(1 + N / df[term]);
  return idf;
}

function lexicalScore(queryTokens, chunkTokens, idf) {
  // simple TF-IDF dot product between query and chunk
  const tfChunk = {};
  for (const t of chunkTokens) tfChunk[t] = (tfChunk[t] || 0) + 1;
  let score = 0;
  for (const t of queryTokens) {
    if (tfChunk[t]) score += (idf[t] || 0) * tfChunk[t];
  }
  // normalize by chunk length
  return score / Math.sqrt(chunkTokens.length || 1);
}

async function retrieve(courseId, question, topK = 5) {
  // load chunks for course
  const chunks = await DocChunk.find({ courseId }).lean();
  if (!chunks || chunks.length === 0) return [];

  // decide semantic or lexical
  const hasEmbeddings = chunks.some((c) => c.embedding && c.embedding.length > 0);
  if (hasEmbeddings) {
    // semantic retrieval
    const qEmb = await generateEmbedding(question);
    if (!qEmb) {
      // fallback to lexical
    } else {
      const scored = chunks.map((c) => ({
        chunk: c,
        score:
          c.embedding && c.embedding.length === qEmb.length
            ? cosineSim(qEmb, c.embedding)
            : 0,
      }));
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, topK).map((s) => ({ ...s.chunk, score: s.score }));
    }
  }

  // lexical retrieval
  const chunksTokens = chunks.map((c) => tokenize(c.text || ""));
  const idf = buildIdf(chunksTokens);
  const qTokens = tokenize(question);
  const scoredLex = chunks.map((c, idx) => ({
    chunk: c,
    score: lexicalScore(qTokens, chunksTokens[idx], idf),
  }));
  scoredLex.sort((a, b) => b.score - a.score);
  return scoredLex.slice(0, topK).map((s) => ({ ...s.chunk, score: s.score }));
}

function cosineSim(a, b) {
  const dot = a.reduce((s, v, i) => s + v * (b[i] || 0), 0);
  const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0)) || 1;
  const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0)) || 1;
  return dot / (na * nb);
}

module.exports = { retrieve };
