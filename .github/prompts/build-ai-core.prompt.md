---
name: build-ai-core
description: Build ingestion, retrieval, grounded tutoring, evaluation, and observability.
---

Read all repository instructions and project documents. Confirm the Foundation phase status before editing.

Build the AI system in the following order. Complete and verify each vertical slice before continuing.

## AI service foundation

- Add `ai-service/` using FastAPI, Pydantic, pytest, structured logging, request IDs, configuration validation, and live/readiness health endpoints.
- Add provider interfaces for embeddings, reranking, and generation.
- Tests must use deterministic local mocks.
- Integrate local startup through the repository's development workflow.

## Instructor document ingestion

- Start with course-scoped PDF upload.
- Verify authenticated instructor role and course ownership.
- Validate MIME type, file signature, extension, size, and safe filename.
- Store the original through a storage abstraction with a local development implementation.
- Track document lifecycle: queued, processing, indexed, failed, and retrying.
- Use Redis and BullMQ in the existing Node application for initial background orchestration unless the repository audit proves a safer existing queue.
- Let the worker call the AI service for extraction, deterministic page-aware chunking, and indexing.
- Preserve course, instructor, document, page, section, lecture, and chunk metadata.
- Make jobs idempotent where practical.
- Add upload and processing-status UI for instructors.

## Retrieval baseline and evaluation

- Store chunks in the existing persistence layer where suitable.
- Implement BM25 as the first measurable retrieval baseline.
- Add dense retrieval through a replaceable vector-store adapter. Use a locally runnable option; do not require a paid service.
- Implement hybrid fusion and optional reranking behind configuration.
- Apply authorization and course/publication metadata filters before evidence reaches generation.
- Create a small labelled evaluation dataset with answerable and unanswerable questions.
- Calculate Recall@5, Recall@10, MRR, and nDCG@10.
- Save machine-readable and Markdown evaluation results.
- Never claim improvement without measured results.

## Course-grounded tutor

- Add an enrolled-student course tutor.
- Retrieve only authorized, published course evidence.
- Produce source-cited answers with document, page, section, and lecture metadata.
- Provide explicit insufficient-evidence responses.
- Treat document text as untrusted evidence, not instructions.
- Keep model tool use typed and backend-authorized.
- Never expose arbitrary database or filesystem access.
- Stream responses when compatible with the existing frontend.
- Sanitize rendered output.
- Record request ID, retrieval strategy, evidence IDs, model/provider version, latency, token usage when available, and failure status without storing secrets.
- Add deterministic mocked tests for answerable, unanswerable, injection-like, unauthorized, and cross-course cases.

## Adaptive assessment

- Generate draft quiz questions only from retrieved evidence.
- Store source chunk IDs, concept, difficulty, answer, explanation, generation metadata, and approval state.
- Require instructor approval before publishing generated assessments.
- Add an explainable concept-mastery baseline based on attempts, correctness, difficulty, hints, and recency.
- Add a next-revision recommendation endpoint.
- Do not describe the mastery system as AI or personalization without actual behavior using student history.

## Instructor analytics

- Show frequently asked questions, high-refusal topics, low-mastery concepts, and common misconceptions.
- Cluster semantically similar questions through a replaceable analytics service.
- Protect individual student data and apply minimum aggregation thresholds where appropriate.

## Observability and regression

- Add structured tracing across frontend request, Express API, queue job, AI service, retrieval, and model call.
- Track P50/P95 latency, retrieval latency, generation latency, failures, token use, and cache hits when available.
- Add an evaluation command suitable for CI.
- Add regression thresholds that fail clearly without hiding raw results.
- Update `docs/BUILD_STATUS.md` and `docs/RESUME_METRICS.md` with actual measurements only.

Preserve existing product functionality and avoid unrelated redesign.
