function stripCodeFences(text) {
  if (!text) return "";
  return String(text)
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function normalizeForMatch(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/%/g, " percent ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(a|an|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function buildCitationList(chunks) {
  const seen = new Set();
  const citations = [];
  for (const chunk of chunks) {
    const key = `${chunk.docName}:${chunk.pageNumber}`;
    if (seen.has(key)) continue;
    seen.add(key);
    citations.push({ docName: chunk.docName, pageNumber: chunk.pageNumber });
  }
  return citations;
}

function questionDifficulty(index, requestedDifficulty) {
  if (requestedDifficulty && requestedDifficulty !== "mixed") {
    return requestedDifficulty;
  }
  const cycle = ["easy", "medium", "hard"];
  return cycle[index % cycle.length];
}

function sentenceQuestionPairs(sentence) {
  const pairs = [];
  const cleanSentence = sentence.replace(/\s+/g, " ").trim();

  let match = cleanSentence.match(/^(.*?)\s+(?:was|were|is|are)\s+launched\s+in\s+(\d{4})\.?$/i);
  if (match) {
    const subject = match[1].replace(/^(the|a|an)\s+/i, "").trim();
    pairs.push({
      question: `When was ${subject} launched?`,
      answer: match[2],
    });
  }

  match = cleanSentence.match(/^(.*?)\s+(?:contains|includes|has|covers)\s+([a-z0-9-]+)\s+(learning modules|modules|lessons|sections|pages|chapters)\.?$/i);
  if (match) {
    const subject = match[1].replace(/^(the|a|an)\s+/i, "").trim();
    const amount = match[2].trim();
    const unit = match[3].trim();
    pairs.push({
      question: `How many ${unit} does ${subject} contain?`,
      answer: amount,
    });
  }

  match = cleanSentence.match(/^(.*?)\s+requires\s+a\s+score\s+of\s+([0-9]+)\s*(percent|%)\.?$/i);
  if (match) {
    const subject = match[1].replace(/^(the|a|an)\s+/i, "").trim();
    pairs.push({
      question: `What score is required for ${subject}?`,
      answer: `${match[2]} percent`,
    });
  }

  match = cleanSentence.match(/\b(\d{4})\b/);
  if (match) {
    pairs.push({
      question: "What year is mentioned in the course material?",
      answer: match[1],
    });
  }

  return pairs;
}

function buildLocalPracticeQuizDraft({ course, chunks, count, difficulty }) {
  const candidates = [];
  const usedQuestions = new Set();

  for (const chunk of chunks) {
    const sentences = splitSentences(chunk.text);
    for (const sentence of sentences) {
      const pairs = sentenceQuestionPairs(sentence);
      for (const pair of pairs) {
        const normalizedQuestion = normalizeForMatch(pair.question);
        if (usedQuestions.has(normalizedQuestion)) continue;
        usedQuestions.add(normalizedQuestion);
        candidates.push({
          type: "short_answer",
          question: pair.question,
          options: [],
          correctAnswer: pair.answer,
          explanation: `This answer comes directly from ${chunk.docName} on page ${chunk.pageNumber}.`,
          difficulty: questionDifficulty(candidates.length, difficulty),
          sourceChunkIds: [String(chunk._id)],
          citations: [{ docName: chunk.docName, pageNumber: chunk.pageNumber }],
        });
        if (candidates.length >= count) {
          return {
            title: `${course.courseName} Practice Quiz`,
            questions: candidates,
          };
        }
      }
    }
  }

  return {
    title: `${course.courseName} Practice Quiz`,
    questions: candidates,
  };
}

function parseQuizJson(text) {
  const rawText = stripCodeFences(text);
  const firstBrace = rawText.indexOf("{");
  const lastBrace = rawText.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Quiz generation did not return valid JSON.");
  }
  return JSON.parse(rawText.slice(firstBrace, lastBrace + 1));
}

function validateAnswerSupport(question, evidenceText) {
  const normalizedAnswer = normalizeForMatch(question.correctAnswer);
  const normalizedEvidence = normalizeForMatch(evidenceText);
  if (!normalizedAnswer || !normalizedEvidence) return false;

  if (question.type === "multiple_choice") {
    const options = Array.isArray(question.options) ? question.options : [];
    if (options.length < 2) return false;
    if (!options.some((option) => normalizeForMatch(option) === normalizedAnswer)) return false;
  }

  if (normalizedEvidence.includes(normalizedAnswer)) {
    return true;
  }

  const answerTokens = normalizedAnswer.split(" ").filter(Boolean);
  if (answerTokens.length === 0) return false;

  return answerTokens.every((token) => normalizedEvidence.includes(token));
}

function normalizeQuestion(question, evidenceMap, requestedTypes, requestedDifficulty) {
  const sourceChunkIds = Array.isArray(question.sourceChunkIds) ? question.sourceChunkIds.map(String) : [];
  const chunks = sourceChunkIds.map((id) => evidenceMap.get(String(id))).filter(Boolean);
  if (!chunks.length) {
    return { error: "Each question must reference at least one retrieved source chunk." };
  }

  const type = question.type === "multiple_choice" ? "multiple_choice" : "short_answer";
  if (requestedTypes.length && !requestedTypes.includes(type)) {
    return { error: "Generated question type does not match the requested quiz types." };
  }

  const normalizedQuestion = {
    type,
    question: String(question.question || "").trim(),
    options: Array.isArray(question.options) ? question.options.map((option) => String(option).trim()).filter(Boolean) : [],
    correctAnswer: String(question.correctAnswer || "").trim(),
    explanation: String(question.explanation || "").trim(),
    difficulty: ["easy", "medium", "hard", "mixed"].includes(question.difficulty)
      ? question.difficulty
      : requestedDifficulty,
    sourceChunkIds,
    citations: Array.isArray(question.citations)
      ? question.citations
          .map((citation) => ({
            docName: String(citation.docName || "").trim(),
            pageNumber: Number(citation.pageNumber),
          }))
          .filter((citation) => citation.docName && Number.isFinite(citation.pageNumber))
      : buildCitationList(chunks),
  };

  if (!normalizedQuestion.question || !normalizedQuestion.correctAnswer) {
    return { error: "Generated questions must include a question and a correct answer." };
  }

  if (normalizedQuestion.type === "multiple_choice") {
    if (normalizedQuestion.options.length < 2) {
      return { error: "Multiple-choice questions need at least two options." };
    }
    if (!normalizedQuestion.options.some((option) => normalizeForMatch(option) === normalizeForMatch(normalizedQuestion.correctAnswer))) {
      return { error: "Multiple-choice correct answer must match one of the options." };
    }
  }

  const evidenceText = chunks.map((chunk) => chunk.text || "").join("\n");
  if (!validateAnswerSupport(normalizedQuestion, evidenceText)) {
    return { error: "Question answer is not supported by the retrieved course evidence." };
  }

  return { value: normalizedQuestion };
}

function validateQuizDraft({ quizDraft, evidenceMap, requestedTypes, requestedDifficulty, requestedCount }) {
  if (!quizDraft || typeof quizDraft !== "object") {
    return { error: "Quiz generation did not return a quiz object." };
  }

  const title = String(quizDraft.title || "").trim();
  const questions = Array.isArray(quizDraft.questions) ? quizDraft.questions : [];
  if (!title) {
    return { error: "Quiz title is required." };
  }
  if (questions.length < requestedCount) {
    return { error: `Quiz generation returned ${questions.length} question(s), but ${requestedCount} were requested.` };
  }

  const normalizedQuestions = [];
  for (const question of questions) {
    const normalized = normalizeQuestion(question, evidenceMap, requestedTypes, requestedDifficulty);
    if (normalized.error) {
      return { error: normalized.error };
    }
    normalizedQuestions.push(normalized.value);
  }

  return {
    value: {
      title,
      questions: normalizedQuestions.slice(0, requestedCount),
    },
  };
}

function normalizeSubmittedAnswer(question, submittedAnswer) {
  if (question.type === "multiple_choice") {
    return normalizeForMatch(submittedAnswer);
  }
  return normalizeForMatch(submittedAnswer);
}

function scorePracticeQuiz(quiz, submissions) {
  const answersByQuestionId = new Map();

  if (Array.isArray(submissions)) {
    for (const item of submissions) {
      if (!item || !item.questionId) continue;
      answersByQuestionId.set(String(item.questionId), item.answer ?? item.selectedAnswer ?? "");
    }
  } else if (submissions && typeof submissions === "object") {
    for (const [questionId, answer] of Object.entries(submissions)) {
      answersByQuestionId.set(String(questionId), answer);
    }
  }

  let correctCount = 0;
  const results = quiz.questions.map((question) => {
    const submittedAnswer = answersByQuestionId.get(String(question._id)) ?? "";
    const normalizedSubmitted = normalizeSubmittedAnswer(question, submittedAnswer);
    const normalizedCorrect = normalizeForMatch(question.correctAnswer);
    const isCorrect = normalizedSubmitted === normalizedCorrect;

    if (isCorrect) {
      correctCount += 1;
    }

    return {
      questionId: String(question._id),
      type: question.type,
      question: question.question,
      options: question.options || [],
      selectedAnswer: submittedAnswer,
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      difficulty: question.difficulty,
      citations: question.citations || [],
      sourceChunkIds: (question.sourceChunkIds || []).map(String),
    };
  });

  return {
    score: correctCount,
    total: quiz.questions.length,
    percentage: quiz.questions.length ? Math.round((correctCount / quiz.questions.length) * 100) : 0,
    results,
  };
}

function sanitizeQuizForStudent(quiz) {
  return {
    _id: String(quiz._id),
    courseId: String(quiz.courseId),
    title: quiz.title,
    status: quiz.status,
    createdAt: quiz.createdAt,
    updatedAt: quiz.updatedAt,
    questionCount: quiz.questions.length,
    questions: quiz.questions.map((question) => ({
      _id: String(question._id),
      type: question.type,
      question: question.question,
      options: question.options || [],
      difficulty: question.difficulty,
      citations: question.citations || [],
    })),
  };
}

module.exports = {
  buildCitationList,
  buildLocalPracticeQuizDraft,
  normalizeForMatch,
  parseQuizJson,
  sanitizeQuizForStudent,
  scorePracticeQuiz,
  validateQuizDraft,
};