const crypto = require("crypto");
const { generateEmbedding } = require("../ai/providers/embeddingProvider");
const { generateAnswer, generatePracticeQuizDraft } = require("../ai/providers/llmProvider");
const { retrieve } = require("../ai/retriever");
const DocChunk = require("../models/DocChunk");
const Course = require("../models/Course");
const PracticeQuiz = require("../models/PracticeQuiz");
const { extractPdfPages } = require("../ai/pdfParser");
const {
  buildLocalPracticeQuizDraft,
  parseQuizJson,
  sanitizeQuizForStudent,
  scorePracticeQuiz,
  validateQuizDraft,
} = require("../ai/practiceQuiz");

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

function parseAllowedQuestionTypes(rawTypes) {
  const allowedTypes = new Set(["multiple_choice", "short_answer"]);
  if (!rawTypes) return ["multiple_choice", "short_answer"];
  const requested = Array.isArray(rawTypes) ? rawTypes : [rawTypes];
  const cleaned = requested
    .map((type) => String(type || "").trim())
    .filter((type) => allowedTypes.has(type));
  return cleaned.length ? cleaned : ["multiple_choice", "short_answer"];
}

function parseQuestionCount(value) {
  const count = Number.parseInt(value, 10);
  if (![3, 5, 10].includes(count)) {
    throw new Error("Question count must be 3, 5, or 10.");
  }
  return count;
}

function parseDifficulty(value) {
  const difficulty = String(value || "mixed").trim();
  const allowed = new Set(["easy", "medium", "hard", "mixed"]);
  if (!allowed.has(difficulty)) {
    throw new Error("Difficulty must be easy, medium, hard, or mixed.");
  }
  return difficulty;
}

async function loadCourseOrThrow(courseId) {
  const course = await Course.findById(courseId);
  if (!course) {
    const error = new Error("Course not found");
    error.statusCode = 404;
    throw error;
  }
  return course;
}

async function loadQuizOrThrow(courseId, quizId) {
  const quiz = await PracticeQuiz.findOne({ _id: quizId, courseId });
  if (!quiz) {
    const error = new Error("Quiz not found");
    error.statusCode = 404;
    throw error;
  }
  return quiz;
}

function isInstructorForCourse(course, userId) {
  return course.instructor.toString() === userId;
}

function isEnrolledInCourse(course, userId) {
  return course.studentsEnroled.map((studentId) => studentId.toString()).includes(userId);
}

async function buildEvidenceMapFromSourceChunkIds(sourceChunkIds, courseId) {
  const uniqueIds = [...new Set((sourceChunkIds || []).map((id) => String(id)))];
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const chunks = await DocChunk.find({ _id: { $in: uniqueIds }, courseId }).lean();
  return new Map(chunks.map((chunk) => [String(chunk._id), chunk]));
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

exports.listPracticeQuizzes = async (req, res) => {
  try {
    const course = await loadCourseOrThrow(req.params.courseId);
    const uid = req.user.id;
    const instructor = isInstructorForCourse(course, uid);
    const enrolled = isEnrolledInCourse(course, uid);

    if (!instructor && !enrolled) {
      return res.status(403).json({ success: false, message: "Not enrolled or instructor" });
    }

    const filter = { courseId: course._id };
    if (!instructor) {
      filter.status = "published";
    }

    const quizzes = await PracticeQuiz.find(filter).sort({ createdAt: -1 }).lean();
    const data = quizzes.map((quiz) =>
      instructor
        ? {
            _id: String(quiz._id),
            courseId: String(quiz.courseId),
            instructorId: String(quiz.instructorId),
            title: quiz.title,
            status: quiz.status,
            createdAt: quiz.createdAt,
            updatedAt: quiz.updatedAt,
            questionCount: quiz.questions.length,
          }
        : sanitizeQuizForStudent(quiz)
    );

    return res.status(200).json({ success: true, quizzes: data });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

exports.getPracticeQuiz = async (req, res) => {
  try {
    const course = await loadCourseOrThrow(req.params.courseId);
    const quiz = await loadQuizOrThrow(req.params.courseId, req.params.quizId);
    const uid = req.user.id;
    const instructor = isInstructorForCourse(course, uid);
    const enrolled = isEnrolledInCourse(course, uid);

    if (!instructor && !enrolled) {
      return res.status(403).json({ success: false, message: "Not enrolled or instructor" });
    }

    if (quiz.status !== "published" && !instructor) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    if (instructor) {
      return res.status(200).json({ success: true, quiz });
    }

    return res.status(200).json({ success: true, quiz: sanitizeQuizForStudent(quiz.toObject()) });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

exports.generatePracticeQuiz = async (req, res) => {
  try {
    const course = await loadCourseOrThrow(req.params.courseId);
    if (!isInstructorForCourse(course, req.user.id)) {
      return res.status(403).json({ success: false, message: "Only instructor can generate quizzes." });
    }

    const questionCount = parseQuestionCount(req.body.questionCount);
    const difficulty = parseDifficulty(req.body.difficulty);
    const requestedTypes = parseAllowedQuestionTypes(req.body.questionTypes);
    const title = String(req.body.title || `${course.courseName} Practice Quiz`).trim();

    const evidenceChunks = await retrieve(course._id, `${course.courseName} practice quiz facts`, Math.max(questionCount * 4, 8));
    if (!evidenceChunks || evidenceChunks.length === 0) {
      return res.status(422).json({ success: false, message: "No course evidence found for quiz generation." });
    }

    const evidenceMap = new Map(evidenceChunks.map((chunk) => [String(chunk._id), chunk]));
    const canUseLLM = Boolean(process.env.OPENAI_API_KEY) && requestedTypes.length > 0;

    let quizDraft = null;
    let mode = "local_fallback";
    let fallback = "deterministic_extract";

    if (canUseLLM) {
      try {
        const rawQuiz = await generatePracticeQuizDraft({
          title,
          questionCount,
          difficulty,
          questionTypes: requestedTypes,
          courseName: course.courseName,
          chunks: evidenceChunks,
        });
        const parsedQuiz = parseQuizJson(rawQuiz);
        const validated = validateQuizDraft({
          quizDraft: parsedQuiz,
          evidenceMap,
          requestedTypes,
          requestedDifficulty: difficulty,
          requestedCount: questionCount,
        });
        if (validated.error) {
          throw new Error(validated.error);
        }
        quizDraft = validated.value;
        mode = "llm";
        fallback = null;
      } catch (error) {
        if (!requestedTypes.includes("short_answer")) {
          return res.status(422).json({ success: false, message: error.message });
        }
      }
    }

    if (!quizDraft) {
      if (!requestedTypes.includes("short_answer")) {
        return res.status(422).json({
          success: false,
          message: "Local fallback only generates short-answer questions without an LLM key.",
        });
      }

      const fallbackDraft = buildLocalPracticeQuizDraft({
        course,
        chunks: evidenceChunks,
        count: questionCount,
        difficulty,
      });
      if (!fallbackDraft.questions.length) {
        return res.status(422).json({ success: false, message: "Could not build enough factual short-answer questions from the uploaded course material." });
      }
      quizDraft = fallbackDraft;
    }

    const quiz = await PracticeQuiz.create({
      courseId: course._id,
      instructorId: req.user.id,
      title: String(req.body.title || quizDraft.title || `${course.courseName} Practice Quiz`).trim(),
      status: "draft",
      questions: quizDraft.questions.slice(0, questionCount),
    });

    return res.status(201).json({
      success: true,
      mode,
      fallback,
      quiz,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.savePracticeQuiz = async (req, res) => {
  try {
    const course = await loadCourseOrThrow(req.params.courseId);
    if (!isInstructorForCourse(course, req.user.id)) {
      return res.status(403).json({ success: false, message: "Only instructor can edit quizzes." });
    }

    const quiz = await loadQuizOrThrow(req.params.courseId, req.params.quizId);
    if (quiz.status !== "draft") {
      return res.status(400).json({ success: false, message: "Published quizzes cannot be edited." });
    }

    const requestedTitle = String(req.body.title || quiz.title).trim();
    const incomingQuestions = Array.isArray(req.body.questions) ? req.body.questions : [];
    if (!requestedTitle) {
      return res.status(400).json({ success: false, message: "Quiz title is required." });
    }
    if (!incomingQuestions.length) {
      return res.status(400).json({ success: false, message: "Quiz must include at least one question." });
    }

    const sourceChunkIds = [...new Set(incomingQuestions.flatMap((question) => (Array.isArray(question.sourceChunkIds) ? question.sourceChunkIds : []).map(String)))];
    const evidenceMap = await buildEvidenceMapFromSourceChunkIds(sourceChunkIds, course._id);
    if (!evidenceMap.size) {
      return res.status(400).json({ success: false, message: "Questions must keep their course evidence references." });
    }

    const normalizedQuestions = [];
    for (const question of incomingQuestions) {
      const sourceIds = Array.isArray(question.sourceChunkIds) ? question.sourceChunkIds.map(String) : [];
      const questionEvidenceMap = new Map();
      for (const sourceId of sourceIds) {
        const chunk = evidenceMap.get(String(sourceId));
        if (chunk) {
          questionEvidenceMap.set(String(sourceId), chunk);
        }
      }

      const validated = validateQuizDraft({
        quizDraft: {
          title: requestedTitle,
          questions: [question],
        },
        evidenceMap: questionEvidenceMap,
        requestedTypes: [],
        requestedDifficulty: question.difficulty || "easy",
        requestedCount: 1,
      });

      if (validated.error) {
        return res.status(400).json({ success: false, message: validated.error });
      }

      normalizedQuestions.push(validated.value.questions[0]);
    }

    quiz.title = requestedTitle;
    quiz.questions = normalizedQuestions;
    await quiz.save();

    return res.status(200).json({ success: true, quiz });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

exports.publishPracticeQuiz = async (req, res) => {
  try {
    const course = await loadCourseOrThrow(req.params.courseId);
    if (!isInstructorForCourse(course, req.user.id)) {
      return res.status(403).json({ success: false, message: "Only instructor can publish quizzes." });
    }

    const quiz = await loadQuizOrThrow(req.params.courseId, req.params.quizId);
    if (quiz.status !== "draft") {
      return res.status(400).json({ success: false, message: "Quiz is already published." });
    }
    if (!quiz.questions.length) {
      return res.status(400).json({ success: false, message: "Quiz must contain at least one question." });
    }

    quiz.status = "published";
    await quiz.save();

    return res.status(200).json({ success: true, quiz });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

exports.submitPracticeQuiz = async (req, res) => {
  try {
    const course = await loadCourseOrThrow(req.params.courseId);
    const quiz = await loadQuizOrThrow(req.params.courseId, req.params.quizId);
    const uid = req.user.id;
    if (!isInstructorForCourse(course, uid) && !isEnrolledInCourse(course, uid)) {
      return res.status(403).json({ success: false, message: "Not enrolled or instructor" });
    }
    if (quiz.status !== "published") {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    const scored = scorePracticeQuiz(quiz, req.body.answers || req.body.submissions || []);
    return res.status(200).json({
      success: true,
      quizId: String(quiz._id),
      title: quiz.title,
      status: quiz.status,
      score: scored.score,
      total: scored.total,
      percentage: scored.percentage,
      results: scored.results,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};
