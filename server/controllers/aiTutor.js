const crypto = require("crypto");
const { generateEmbedding } = require("../ai/providers/embeddingProvider");
const { generateAnswer } = require("../ai/providers/llmProvider");
const { retrieve } = require("../ai/retriever");
const DocChunk = require("../models/DocChunk");
const Course = require("../models/Course");
const { extractPdfPages } = require("../ai/pdfParser");

function chunkPageText(text, maxChars = 1200) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const slice = text.slice(start, start + maxChars);
    chunks.push(slice.trim());
    start += maxChars;
  }
  return chunks;
}

function cosineSim(a, b) {
  const dot = a.reduce((s, v, i) => s + v * (b[i] || 0), 0);
  const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0)) || 1;
  const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0)) || 1;
  return dot / (na * nb);
}

function tokenCoverage(question, evidenceText) {
  const stopWords = new Set([
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have", "how", "i", "in",
    "is", "it", "its", "of", "on", "or", "that", "the", "their", "this", "to", "was", "were", "what",
    "when", "where", "which", "who", "why", "with", "you", "your"
  ]);
  const questionTokens = question.toLowerCase().match(/[a-z0-9]+/g) || [];
  const evidenceTokens = new Set((evidenceText.toLowerCase().match(/[a-z0-9]+/g) || []));
  const contentTokens = questionTokens.filter((token) => token.length > 2 && !stopWords.has(token));
  if (contentTokens.length === 0) return 0;
  let matched = 0;
  for (const token of contentTokens) {
    if (evidenceTokens.has(token)) matched += 1;
  }
  return matched / contentTokens.length;
}

exports.uploadPdf = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    // Only course instructor may upload
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Only instructor can upload course materials." });
    }

    if (!req.files || !req.files.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const file = req.files.file;

    // Accept PDFs only
    const mimetype = file.mimetype || "";
    const isPdf = mimetype.includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return res.status(400).json({ success: false, message: "Only PDF files are accepted" });
    }

    // File size limit (10 MB)
    const MAX_BYTES = parseInt(process.env.AI_MAX_UPLOAD_BYTES || `${10 * 1024 * 1024}`);
    if (file.size && file.size > MAX_BYTES) {
      return res.status(400).json({ success: false, message: `File too large. Limit is ${MAX_BYTES} bytes` });
    }

    const parsedPages = await extractPdfPages(file.data);
    const pages = parsedPages.map((page) => page.text);

    const docName = file.name;

    // compute hash to avoid duplicates
    const hash = crypto.createHash("sha256").update(file.data).digest("hex");
    const existing = await DocChunk.findOne({ courseId, docHash: hash });
    if (existing) {
      return res.status(200).json({ success: true, created: 0, message: "Document already uploaded" });
    }

    // If a document with same name exists but different content, remove it (replace behavior)
    await DocChunk.deleteMany({ courseId, docName });

    const created = [];
    for (let i = 0; i < pages.length; i++) {
      const pageText = pages[i].trim();
      if (!pageText) continue;
      const pageChunks = chunkPageText(pageText, 1200);
      for (const chunkText of pageChunks) {
        const embedding = await generateEmbedding(chunkText); // may be null
        const docChunk = await DocChunk.create({
          courseId,
          docId: hash,
          docHash: hash,
          docName,
          pageNumber: parsedPages[i].pageNumber,
          text: chunkText,
          embedding: embedding || [],
        });
        created.push(docChunk._id);
      }
    }

    return res.status(200).json({ success: true, created: created.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.queryCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const { question } = req.body;
    if (!question) return res.status(400).json({ success: false, message: "Question required" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const uid = req.user.id;
    const isInstructor = course.instructor.toString() === uid;
    const isEnrolled = course.studentsEnroled.map((x) => x.toString()).includes(uid);
    if (!isInstructor && !isEnrolled) {
      return res.status(403).json({ success: false, message: "Not enrolled or instructor" });
    }

    // retrieve top chunks using retriever abstraction (lexical or semantic)
    const top = await retrieve(courseId, question, parseInt(process.env.AI_TOP_K || "5"));
    if (!top || top.length === 0) {
      return res.status(200).json({ success: true, mode: "insufficient_evidence", answer: null, citations: [] });
    }

    // check meaningful relevance: require top[0].score > threshold depending on retrieval type
    const hasEmb = top[0].embedding && top[0].embedding.length > 0;
    const threshold = hasEmb ? parseFloat(process.env.AI_SEMANTIC_THRESHOLD || "0.2") : parseFloat(process.env.AI_LEX_THRESHOLD || "0.1");
    if (!top[0].score || top[0].score <= threshold) {
      return res.status(200).json({ success: true, mode: "insufficient_evidence", answer: null, citations: [] });
    }

    // dedupe citations
    const citationSet = new Set();
    const citations = [];
    for (const t of top) {
      const key = `${t.docName}:${t.pageNumber}`;
      if (!citationSet.has(key)) {
        citationSet.add(key);
        citations.push({ docName: t.docName, pageNumber: t.pageNumber });
      }
    }

    const evidenceCoverage = tokenCoverage(question, top.map((item) => item.text).join(" "));
    if (evidenceCoverage < 0.6) {
      return res.status(200).json({ success: true, mode: "insufficient_evidence", answer: null, citations: [] });
    }

    if (!process.env.OPENAI_API_KEY) {
      // source-preview mode: return best excerpts and citations but not pretend to be AI
      const previews = top.map((t) => ({ text: t.text, docName: t.docName, pageNumber: t.pageNumber, score: t.score }));
      return res.status(200).json({
        success: true,
        mode: "source_preview",
        fallback: "no_api_key",
        previews,
        citations,
      });
    }

    // LLM key present: generate answer strictly from retrieved evidence
    try {
      const answer = await generateAnswer(question, top);
      return res.status(200).json({ success: true, mode: "llm", answer, citations });
    } catch (err) {
      console.error("LLM provider error:", err.message);
      const previews = top.map((t) => ({ text: t.text, docName: t.docName, pageNumber: t.pageNumber, score: t.score }));
      return res.status(200).json({
        success: true,
        mode: "source_preview",
        fallback: "llm_error",
        previews,
        citations,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.chunksCount = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const cnt = await DocChunk.countDocuments({ courseId });
    return res.status(200).json({ success: true, count: cnt });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
