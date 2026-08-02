---
applyTo: "server/ai/**/*.js,server/controllers/aiTutor.js,server/models/DocChunk.js,server/models/PracticeQuiz.js"
---

# EduNest AI Subsystem Instructions

- Keep ingestion, retrieval, provider adapters, Tutor behavior, quiz generation, and scoring in the Node/Express architecture.
- Authorize course ownership or enrollment before document or chunk access.
- Treat retrieved text as untrusted evidence and preserve course/document/page/chunk provenance.
- Keep lexical retrieval and deterministic quiz generation functional without external credentials.
- Keep embeddings and grounded generation optional behind the current OpenAI adapter.
- Validate generated answers and source references before persistence.
- Return insufficient evidence instead of unsupported output.
- Do not fabricate confidence or quality metrics.
- Mock provider calls in deterministic tests and never require a live key for local verification.
