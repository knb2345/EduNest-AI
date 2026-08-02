# EduNest AI resume evidence

This ledger records only facts supported by the repository or the verified local demo. It intentionally contains no production-user, accuracy, latency, scalability, or OpenAI-performance claims.

## Verified implementation facts

| Fact | Evidence |
|---|---|
| One command starts the React client, Express API, and in-memory demo database | Root `package.json`: `npm run demo` |
| Demo runs on frontend port 3000 and backend port 4000 | React default and `server/devStart.js` |
| Three seeded roles are available | Instructor, enrolled student, and non-enrolled outsider in `server/devStart.js` |
| Two courses are seeded to demonstrate course isolation | `server/devStart.js` |
| Sample fixture contains one PDF page and creates one stored chunk | Demo fixture plus verified browser upload result |
| PDF provenance includes course, document, and page | `server/models/DocChunk.js` and upload controller |
| Duplicate files are detected with SHA-256 per course | `server/controllers/aiTutor.js` |
| Retrieval supports local lexical scoring and optional embeddings | `server/ai/retriever.js` and provider adapter |
| Tutor responses support citations, source preview, grounded LLM mode, and abstention | AI tutor controller and frontend mode handling |
| Quiz workflow supports draft generation, editing, saving, publishing, student access, and backend scoring | Practice Quiz routes, model, controller, and UI |
| Verified deterministic demo quiz scored 3/3 through the frontend | Local browser verification on 2026-08-02 |
| Outsider quiz access returns HTTP 403 | Local browser and direct API verification on 2026-08-02 |
| Normal frontend production build completes with inherited warnings | `npm run build`, verified on 2026-08-02 |

## Claims deliberately not made

- Number of production users or courses
- Retrieval accuracy, recall, MRR, or hallucination reduction
- Latency or throughput improvements
- Scale or availability guarantees
- Results from real OpenAI generation
- Production security certification

## Draft resume bullets — review before use

- Extended an existing MERN learning platform with a course-grounded AI Tutor and Practice Quiz workflow, integrating React state management, Express APIs, MongoDB models, JWT authorization, instructor review, publishing, and backend scoring.
- Built page-aware PDF ingestion with SHA-256 duplicate prevention, course-scoped chunk storage, local lexical retrieval, optional embeddings/grounded LLM answers, insufficient-evidence handling, and document/page citations.
- Delivered a one-command deterministic no-key demo with seeded instructor, enrolled-student, and outsider roles, including evidence-backed quiz generation and a browser-verified 3/3 submission with explanations and citations.
