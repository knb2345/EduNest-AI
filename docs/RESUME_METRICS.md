# EduNest AI resume metrics ledger

This file prevents unsupported resume claims.

Copilot must update it only with values produced by reproducible commands or clearly documented application data.

## Rules

- Do not replace placeholders with estimates.
- Record the exact command, dataset or database query, date, and configuration used.
- Distinguish local benchmark results from production behavior.
- Do not claim user impact without real users or a controlled study.
- Do not use words such as improved, reduced, accurate, scalable, or secure without a baseline or defined control.

## Build and scope metrics

| Metric | Value | Evidence command/source | Status |
|---|---:|---|---|
| Existing courses used for testing | — | — | Not measured |
| Test PDF documents | — | — | Not measured |
| Indexed pages | — | — | Not measured |
| Indexed chunks | — | — | Not measured |
| Concepts in mastery graph | — | — | Not measured |
| Automated tests | — | — | Not measured |

## Retrieval metrics

| Strategy | Recall@5 | Recall@10 | MRR | nDCG@10 | Dataset/version | Command |
|---|---:|---:|---:|---:|---|---|
| BM25 | — | — | — | — | — | — |
| Dense | — | — | — | — | — | — |
| Hybrid | — | — | — | — | — | — |
| Hybrid + reranker | — | — | — | — | — | — |

## Generation metrics

| Metric | Value | Evaluation definition | Dataset/version | Command |
|---|---:|---|---|---|
| Citation precision | — | — | — | — |
| Citation completeness | — | — | — | — |
| Abstention accuracy | — | — | — | — |
| Grounded-answer pass rate | — | — | — | — |
| Prompt-injection test pass rate | — | — | — | — |

## System metrics

| Metric | Value | Environment | Load/configuration | Command/source |
|---|---:|---|---|---|
| P50 end-to-end latency | — | — | — | — |
| P95 end-to-end latency | — | — | — | — |
| P95 retrieval latency | — | — | — | — |
| P95 ingestion time per page | — | — | — | — |
| Error rate | — | — | — | — |
| Cache hit rate | — | — | — | — |
| Mean tokens per grounded query | — | — | — | — |

## Candidate resume bullets

Do not use these until every bracketed field is measured.

- Built a secure adaptive learning platform using React, Express, MongoDB, Redis, and FastAPI, supporting role-based course management, background document ingestion, source-cited tutoring, and instructor-approved adaptive assessments.
- Developed hybrid BM25 and dense retrieval across **[documents/pages/chunks]**, improving Recall@5 from **[baseline]** to **[result]** and MRR from **[baseline]** to **[result]** on **[evaluation-set size]** verified questions.
- Implemented Google OpenID Connect using Authorization Code with PKCE, secure HttpOnly sessions, server-side RBAC, rate limiting, and auditable AI-tool execution.
- Built an evaluated course-grounded tutor achieving **[citation precision]** citation precision and **[abstention accuracy]** unanswerable-question accuracy with P95 latency of **[latency]**.
