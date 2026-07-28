# EduNest AI implementation roadmap

Each phase must update `docs/BUILD_STATUS.md`.

## Phase 0 — Repository baseline

Deliverables:

- Verified repository map
- Confirmed setup, run, test, lint, type-check, and build commands
- Safe `.env.example`
- Initial tests around authentication and protected routes
- Documented current security gaps
- Recoverable Git starting point

Exit gate:

- Existing frontend and backend can be started or built.
- Failures are recorded accurately.
- No application feature has been unintentionally changed.

## Phase 1 — Secure identity foundation

Deliverables:

- No authentication token in localStorage
- Secure cookie-based application session
- Current-user/session restoration
- Logout and session invalidation
- Credentialed CORS
- CSRF analysis and protection
- Backend role, ownership, enrollment, and publication checks
- Authentication and AI endpoint rate limits
- Security audit events
- Google OpenID Connect Authorization Code + PKCE
- Safe account linking
- Deterministic OAuth tests

Exit gate:

- Authentication and authorization acceptance criteria pass.
- Existing student, instructor, course, cart, progress, and payment flows remain operational or failures are explicitly documented.

## Phase 2 — AI service foundation

Deliverables:

- FastAPI service
- Typed settings
- Live and readiness endpoints
- Structured logs and request IDs
- Provider interfaces
- Deterministic tests
- Local development integration

Exit gate:

- Service starts locally.
- Health checks and tests pass without external AI credentials.

## Phase 3 — Document ingestion

Deliverables:

- Instructor-only course PDF upload
- Course ownership enforcement
- File validation
- Storage abstraction
- Document metadata and processing lifecycle
- Redis/BullMQ orchestration
- Page-aware extraction
- Deterministic chunking
- Provenance metadata
- Retry and terminal failure behavior
- Instructor processing UI

Exit gate:

- Authorized upload processes successfully.
- Unauthorized, invalid, duplicate, and failed-job paths are tested.
- Cross-course access is rejected.

## Phase 4 — Retrieval and evaluation

Deliverables:

- BM25 baseline
- Dense retrieval adapter
- Hybrid fusion
- Course and visibility filtering
- Labelled evaluation fixtures
- Recall@5, Recall@10, MRR, nDCG@10
- Machine-readable result files
- Latency measurement

Exit gate:

- Strategies can be compared reproducibly.
- Results are actual measurements.
- Cross-course retrieval tests pass.

## Phase 5 — Grounded tutor

Deliverables:

- Course tutor UI and API
- Authorized evidence retrieval
- Source-cited answers
- Clickable provenance
- Explicit abstention
- Streaming where compatible
- Safe output rendering
- Provider abstraction
- Mocked model tests
- Prompt-injection-like and data-isolation tests
- Operational metadata

Exit gate:

- Answerable and unanswerable evaluation cases behave correctly.
- Citations reference evidence actually supplied.
- Unauthorized evidence cannot be retrieved.

## Phase 6 — Adaptive assessment

Deliverables:

- Evidence-grounded draft quiz generation
- Source IDs and validation state
- Instructor approval workflow
- Student attempts
- Explainable mastery baseline
- Revision recommendation

Exit gate:

- Unapproved generated questions are not published.
- Recommendations change based on recorded student history.
- Mastery calculations are documented and testable.

## Phase 7 — Instructor intelligence

Deliverables:

- Frequently asked questions
- High-refusal topics
- Low-mastery concepts
- Misconception clustering
- Content-coverage gaps
- Privacy-aware aggregation

Exit gate:

- Analytics respect instructor ownership.
- Small-group privacy behavior is documented.
- Results can be traced to underlying non-sensitive aggregates.

## Phase 8 — Evaluation, observability, and hardening

Deliverables:

- Fixed evaluation suite
- Regression thresholds
- Correlation IDs
- Structured operational metrics
- Security and abuse tests
- Quotas and timeouts
- Dependency and secret scanning where available
- Release review
- Deployment documentation

Exit gate:

- Builds and tests pass.
- Evaluation results are reproducible.
- Blocker and High release findings are resolved or explicitly accepted.
- Resume metrics contain no placeholders presented as facts.
