# EduNest AI build status

Last verified: 2026-08-02

## Complete portfolio scope

- Page-aware PDF ingestion and deterministic chunking
- Course-scoped MongoDB chunk storage and duplicate prevention
- Local lexical retrieval and optional embedding retrieval
- Source-preview, grounded-answer, citation, and insufficient-evidence modes
- Course-scoped instructor ownership and student enrollment checks
- Deterministic and optional structured LLM quiz generation paths
- Instructor draft/edit/save/publish workflow
- Student-safe published quiz access and backend scoring
- Per-question answers, explanations, and citations after submission
- One-command seeded local demo

## Verification status

- Normal frontend production build: passes with inherited ESLint and bundle-size warnings
- Backend AI/quiz JavaScript syntax checks: included in the documentation verification workflow
- No-key browser demo: instructor publish, enrolled-student 3/3 submission, retry/reopen reset, and outsider 403 verified
- Real OpenAI generation: not verified; optional provider path is code-present only

## Known limitations

- Demo data is ephemeral.
- Quiz attempts are not persisted.
- No-key quiz generation is limited to factual short-answer patterns.
- Retrieval quality and provider behavior have not been benchmarked.
- Existing LMS code has warnings and technical debt outside the AI feature.
