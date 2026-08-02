# EduNest AI interview guide

## 60-second project pitch

EduNest AI extends an existing MERN learning-management application with a course-grounded tutoring and assessment workflow. Instructors can upload a PDF they own; the Express backend extracts page-aware text, stores course-scoped chunks in MongoDB, prevents duplicate uploads, and retrieves relevant evidence with a local lexical scorer or optional OpenAI embeddings. Students and instructors can ask course questions and receive either cited source previews, a grounded optional LLM answer, or an explicit insufficient-evidence response. The same evidence can generate a Practice Quiz: deterministic short-answer generation works without a key, while an optional structured LLM path supports richer questions. Instructors review drafts before publishing, enrolled students submit answers, and the backend returns scores, explanations, and citations. A seeded `npm run demo` makes the complete no-key workflow reproducible locally.

## Existing LMS foundation versus my additions

The repository began with an existing MERN LMS foundation that already included authentication, roles, course management, enrollment, dashboards, progress, cart, and payment flows. I did not claim those baseline features as a from-scratch build.

My additions are the course AI page and entry points, PDF ingestion pipeline, `DocChunk` model, retrieval and provider abstractions, grounded tutor controller/routes, Practice Quiz model and generation/validation/scoring logic, instructor and student quiz UI, authorization checks around course AI data, the seeded in-memory demo, and portfolio documentation.

## Why retrieval grounding?

The goal is to answer from instructor-provided material rather than general model knowledge. Retrieval narrows the context to a small set of course chunks, preserves document/page provenance, and gives the application a principled abstention path. It also makes the feature useful without an LLM because retrieved excerpts and citations can be shown directly.

Grounding reduces the opportunity for unsupported answers, but it does not prove factual correctness. That is why the implementation avoids making measured hallucination or retrieval-accuracy claims.

## Lexical retrieval versus embeddings

The no-key path tokenizes the query and all chunks, computes inverse-document-frequency weights, scores query terms against chunk term frequency, normalizes by chunk length, and returns the top `K` course-scoped chunks. It is a compact TF-IDF-style scorer, not full BM25.

When stored chunks contain embeddings, the retriever requests a query embedding and ranks compatible vectors with cosine similarity. If the embedding request fails or is unavailable, it falls back to lexical retrieval. This trade-off keeps the demo deterministic while preserving an optional semantic path.

## Page-aware extraction and chunking

`pdfjs-dist` reads the PDF page by page. Text items are joined and normalized per page, then split into chunks of at most 1,200 characters. Each `DocChunk` stores `courseId`, document hash/name, page number, text, optional embedding, and creation time.

Chunking within each page ensures a chunk never silently crosses page boundaries, so a citation can point to the original document and page. The approach is intentionally simple; it does not yet split on semantic sections or sentence boundaries.

## Citation generation

Tutor citations are deduplicated from the retrieved chunks by `docName:pageNumber`. Quiz questions retain source chunk IDs and document/page citations. Before submission, the student-safe serializer removes correct answers and explanations. After backend scoring, the response includes those fields and the citations for each question.

## Insufficient-evidence logic

The tutor abstains in three cases:

1. The course has no retrieved chunks.
2. The best lexical or semantic score does not exceed its configured threshold.
3. Fewer than 60% of the meaningful query tokens appear in the retrieved evidence.

The API returns `mode: "insufficient_evidence"`, `answer: null`, and an empty citation list. This is heuristic, not a measured classifier.

## Duplicate PDF handling

The upload controller computes a SHA-256 hash of the PDF bytes and checks for an existing chunk with the same `courseId` and hash. A duplicate returns success with zero new chunks. If the filename matches an existing document but its bytes differ, the old course/name chunks are replaced before the new content is stored.

## Course isolation and authorization

Every AI endpoint uses JWT authentication. Upload, generation, draft editing, and publishing compare `req.user.id` with the course instructor. Tutor queries and quiz reads require either that ownership or enrollment in `studentsEnroled`. Student quiz lists include only `published` items, and quiz lookup includes both course and quiz IDs. The seeded outsider account verifies the denial path.

Authorization happens before evidence retrieval, preventing the retrieval layer from becoming the security boundary.

## Deterministic no-key fallback

The local quiz generator scans retrieved sentences for explicit factual patterns such as launch years, counts, and required percentages. It creates short-answer questions with the originating chunk ID, page citation, explanation, and requested difficulty. This is narrow by design: it provides a reproducible demo without pretending to be a general natural-language question generator.

## Structured quiz generation

With an OpenAI key, the provider requests strict JSON containing the quiz title and questions. Each question includes type, text, options, answer, explanation, difficulty, source chunk IDs, and citations. Markdown fences are stripped before parsing, and invalid JSON fails validation rather than being saved blindly.

## Evidence validation

Validation requires every question to reference retrieved chunks from the same course. Required fields must be present, requested question types must match, multiple-choice answers must match an option, and the normalized answer tokens must occur in the referenced evidence. This is lexical support validation; it is intentionally conservative and is not equivalent to semantic fact checking.

## Draft versus publish workflow

Generated quizzes are created with `status: "draft"`. Instructors can edit and save only drafts. Students see only published quizzes and receive a sanitized representation. Publishing is an explicit instructor action and published quizzes cannot be edited through the current endpoint.

This separation makes the model an assistant to the instructor rather than an autonomous publisher.

## Backend scoring

The frontend sends an `answers` object keyed by question ID. The backend normalizes submitted and correct answers, performs exact normalized matching, counts correct responses, and returns score, total, percentage, and per-question results. The current short-answer scorer is deterministic and transparent; it does not award semantic partial credit.

## Frontend quiz state synchronization issue and fix

The original student flow cleared answers and old results only after an asynchronous quiz fetch completed. Rapid quiz changes could therefore display stale state, and an older request could overwrite a newer selection. Submission also lacked a complete-answer condition and an immediate duplicate-request guard.

The fix clears selected quiz data, answers, results, and mode synchronously when selection changes; ignores stale fetch completions through an effect cleanup flag; stores controlled answers by question ID; requires every answer before enabling submit; and uses a ref-based in-flight guard before React's loading state rerenders. Retry and back actions use the same reset behavior.

## Major design trade-offs

- **Single Express service:** appropriate for a personal project and keeps authorization close to data access, but long document operations run in the request path.
- **MongoDB chunk storage:** easy to inspect and course-filter, but not a dedicated search index.
- **Simple lexical baseline:** deterministic and no-key, but not evaluated BM25 or hybrid retrieval.
- **Page-boundary chunking:** reliable citations, but less semantically coherent than structure-aware chunking.
- **Exact normalized scoring:** defensible and predictable, but limited for free-form answers.
- **Instructor approval:** adds a step but prevents automatic publication of generated content.
- **In-memory demo:** reproducible and easy to present, but deliberately non-persistent.

## Current limitations

- No persisted quiz-attempt history.
- No measured retrieval-quality or latency benchmark.
- No-key quiz generation supports a small factual grammar and short answers only.
- Optional OpenAI behavior requires a real key and is separate from deterministic demo verification.
- PDF validation is not based on independent magic-byte inspection.
- Embeddings are stored in MongoDB arrays and ranked in application memory.
- Backend scoring treats missing answers as incorrect; the frontend prevents incomplete submissions.
- The inherited LMS contains lint warnings and broader technical debt outside this feature.

## What I would improve with more time

I would first add focused automated tests around ownership/enrollment, duplicate ingestion, abstention, quiz evidence validation, and React state transitions. Then I would persist attempts, create a small labelled retrieval fixture, compare the existing lexical scorer with BM25 and embeddings using measured metrics, improve structure-aware chunking, strengthen PDF signature validation, and add a richer deterministic multiple-choice fallback. I would make those changes only after establishing baselines rather than claiming unmeasured improvements.

