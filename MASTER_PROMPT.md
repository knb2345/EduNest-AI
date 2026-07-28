# Master prompt for GitHub Copilot Agent mode

Paste the text below into the **EduNest Builder** agent, or run `/build-edunest-ai`.

---

You are extending the existing repository, not creating a new application.

Read `PROJECT_OVERVIEW.md`, `.github/copilot-instructions.md`, and every file under `docs/` before editing.

Audit the real repository and then transform it into EduNest AI through verified phases:

- reproducible baseline and tests
- secure cookie-based authentication with no auth token in localStorage
- backend authorization hardening
- Google OpenID Connect Authorization Code flow with PKCE, state, nonce, token validation, and safe account linking
- FastAPI AI service with typed provider adapters and deterministic tests
- instructor-authorized PDF upload
- Redis/BullMQ background ingestion
- page-aware deterministic chunking and provenance
- BM25, dense, and hybrid retrieval
- course, enrollment, ownership, publication, and document-visibility filtering before evidence access
- reproducible Recall@5, Recall@10, MRR, and nDCG@10 evaluation
- source-cited course tutor with explicit insufficient-evidence behavior
- safe model rendering and prompt-injection-like tests
- grounded draft quiz generation with instructor approval
- explainable concept mastery and revision recommendations
- instructor misconception and content-coverage analytics
- correlation IDs, structured logs, latency metrics, evaluation regression checks, and release review

Preserve existing course, payment, cart, dashboard, password reset, OTP, and progress functionality.

At each phase:

- inspect existing code
- make the smallest coherent vertical slice
- enforce backend authorization
- add tests
- run relevant tests, linting, type checks, and builds
- fix failures caused by your changes
- update `docs/BUILD_STATUS.md`
- record actual command outcomes

Continue autonomously when safe.

Do not stop because a real OAuth or LLM secret is missing. Create safe `.env.example` entries, configuration validation, provider interfaces, and deterministic mocks, then continue with local functionality.

Stop before destructive migrations, production deployment, real payments, real email, secret creation, or irreversible data changes.

Never invent benchmark values, successful integrations, or deployment status. Update `docs/RESUME_METRICS.md` only from reproducible measurements.

At the end, report completed and blocked phases, files changed, architecture decisions, tests, command results, security controls, measured metrics, manual configuration, and remaining production-readiness gaps.
