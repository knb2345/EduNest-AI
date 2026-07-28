const mongoose = require("mongoose");

const DocChunkSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  docId: { type: String },
  docHash: { type: String },
  docName: { type: String },
  docVersion: { type: Number, default: 1 },
  pageNumber: { type: Number },
  text: { type: String },
  embedding: { type: [Number], default: [] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DocChunk", DocChunkSchema);
