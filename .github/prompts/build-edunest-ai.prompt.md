---
name: build-edunest-ai
description: Execute the complete EduNest AI roadmap autonomously with phase gates.
---

Act as the principal engineer for this repository.

Read:

- `../../PROJECT_OVERVIEW.md`
- `../../.github/copilot-instructions.md`
- `../../docs/AI_PRODUCT_SPEC.md`
- `../../docs/TARGET_ARCHITECTURE.md`
- `../../docs/IMPLEMENTATION_ROADMAP.md`
- `../../docs/ACCEPTANCE_CRITERIA.md`
- `../../docs/RESUME_METRICS.md`

Your objective is to transform the existing MERN education platform into the secure, evaluated EduNest AI system described in these documents.

Operating rules:

- Begin by performing the full repository audit from the `/audit-edunest` workflow.
- Preserve the existing application and extend it; do not regenerate it.
- Work in ordered phases: baseline, secure foundation, ingestion, retrieval, grounded tutor, adaptive assessment, analytics, evaluation, and hardening.
- At the start of each phase, inspect the relevant existing code and write a short plan into `docs/BUILD_STATUS.md`.
- At the end of each phase, run focused tests plus available lint, type-check, and build commands.
- Fix failures introduced by your changes before proceeding.
- Record exact command outcomes.
- Continue autonomously through phases when safe.
- Do not stop merely because credentials are unavailable. Add interfaces, safe environment placeholders, configuration errors, and deterministic mocks, then continue with local functionality.
- Stop before irreversible production operations, real payment execution, real email delivery, destructive migrations, secret creation, or a decision that could corrupt user data.
- Never invent benchmark results, successful deployment, or working integrations.
- Keep all provider integrations replaceable.
- Keep local development runnable without paid services.
- Do not add multiple agents merely for marketing.
- Do not create a generic chatbot.
- Do not expose tokens to frontend JavaScript.
- Do not allow the LLM direct database or filesystem access.
- Do not accept a course ID alone as authorization.
- Treat uploaded documents as untrusted input.
- Enforce course, enrollment, ownership, role, publication, and document visibility boundaries.
- Add tests for cross-course leakage and prompt-injection-like content.
- Update documentation and `.env.example` continuously.

Product deliverables:

- Secure cookie-based application authentication with no auth token in localStorage
- Google OpenID Connect with Authorization Code + PKCE, state, nonce, backend validation, and safe linking
- Instructor PDF ingestion with authorization, validation, storage abstraction, queueing, processing states, retries, and provenance
- FastAPI AI service with typed provider interfaces and deterministic tests
- BM25, dense, and hybrid retrieval with course-scoped authorization filters
- Reproducible retrieval evaluation
- Source-cited course tutor with explicit abstention
- Typed, authorized learning tools
- Grounded draft quiz generation with instructor approval
- Explainable concept mastery and revision recommendations
- Instructor misconception and coverage analytics
- Structured logs, correlation IDs, metrics, regression evaluation, and security tests
- Updated architecture, setup, API, security, and evaluation documentation

At completion, provide a factual report containing:

- Completed phases
- Partially completed or blocked phases
- Files and major modules added
- Architecture decisions and deviations
- Commands run and results
- Security controls implemented
- Tests and evaluation results
- Required manual configuration
- Remaining production-readiness gaps
- Resume metrics that are supported by actual measurements
