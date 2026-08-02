const mongoose = require("mongoose");

const quizCitationSchema = new mongoose.Schema(
  {
    docName: { type: String, required: true },
    pageNumber: { type: Number, required: true },
  },
  { _id: false }
);

const quizQuestionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["multiple_choice", "short_answer"],
      required: true,
    },
    question: { type: String, required: true },
    options: { type: [String], default: [] },
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: "" },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "mixed"],
      default: "easy",
    },
    sourceChunkIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DocChunk",
      },
    ],
    citations: { type: [quizCitationSchema], default: [] },
  },
  { _id: true }
);

const practiceQuizSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Course",
    index: true,
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "user",
    index: true,
  },
  title: { type: String, required: true },
  status: {
    type: String,
    enum: ["draft", "published"],
    default: "draft",
    index: true,
  },
  questions: { type: [quizQuestionSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

practiceQuizSchema.pre("save", function updateTimestamp(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("PracticeQuiz", practiceQuizSchema);