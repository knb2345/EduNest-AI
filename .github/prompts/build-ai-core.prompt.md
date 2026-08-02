---
name: build-ai-core
description: Maintain EduNest PDF ingestion, retrieval, Tutor, and Practice Quiz behavior.
---

Read the repository instructions and current product documentation before editing.

Implement only the requested AI learning change within the Node/Express/MongoDB architecture:

- authorize Instructor ownership for upload and quiz authoring
- authorize ownership or enrollment for Tutor access
- validate PDFs, size, duplicate content, and course scope
- preserve page-aware `pdfjs-dist` extraction and DocChunk provenance
- keep lexical retrieval and deterministic quiz generation available without keys
- keep embeddings, grounded answers, and structured quiz generation optional through the OpenAI adapters
- return citations from stored document/page data and abstain on insufficient evidence
- retain instructor draft review/edit/delete/publish behavior
- hide answers from students until backend scoring
- bind course and quiz identifiers in every query

Add focused deterministic checks, run backend syntax and frontend build verification, exercise the demo when relevant, and update `docs/BUILD_STATUS.md`. Do not add a microservice, queue, vector database, analytics feature, or provider unless the task explicitly requires it.
