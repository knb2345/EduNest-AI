# EduNest AI repository instructions

## Repository purpose

This repository contains an existing full-stack MERN education platform and is being extended into **EduNest AI**, a secure, evaluated, course-grounded adaptive learning system.

The confirmed baseline includes:

- React single-page frontend
- Redux client-side state
- Express API
- MongoDB persistence
- Email/password login
- OTP signup verification
- JWT authentication
- Student and instructor roles
- Protected frontend routes and backend middleware
- Course browsing and management
- Enrollment, lecture progress, cart, and payment flows
- Password reset through emailed links

Read `PROJECT_OVERVIEW.md` before changing architecture. Treat the code as the source of truth when it differs from documentation.

Read these project documents before implementing major features:

- `docs/AI_PRODUCT_SPEC.md`
- `docs/TARGET_ARCHITECTURE.md`
- `docs/IMPLEMENTATION_ROADMAP.md`
- `docs/ACCEPTANCE_CRITERIA.md`
- `docs/RESUME_METRICS.md`

## Working method

- Inspect relevant files, package scripts, runtime versions, and existing conventions before editing.
- Preserve existing working behavior unless the active task explicitly changes it.
- Prefer small vertical slices that include API, persistence, UI, authorization, tests, and documentation.
- Do not rewrite the application from scratch.
- Do not migrate every existing JavaScript file to TypeScript as one task.
- Use TypeScript for new code when the existing build configuration safely supports it; otherwise use strict validation and clear JSDoc types.
- Do not perform unrelated formatting or dependency upgrades.
- Keep new provider-specific code behind interfaces.
- Make local development functional without requiring paid cloud services.
- Stop before irreversible operations, production deployments, real payments, or destructive database migrations.
- Never invent successful test results, benchmark numbers, or deployment status.

## Required verification

For each coherent change:

- Run the most focused relevant tests.
- Run existing lint and type-check commands when available.
- Run frontend and backend production builds when available.
- Verify authentication and authorization failure cases.
- Record commands and outcomes in `docs/BUILD_STATUS.md`.
- Distinguish completed, partially completed, blocked, and unverified work.

If the repository has no suitable test framework, add the smallest compatible framework and document why it was selected.

## Authentication and authorization

- Frontend route guards are not authorization boundaries.
- Every protected backend operation must verify identity and role or ownership.
- Remove authentication tokens from `localStorage` and other JavaScript-readable persistent storage.
- Prefer secure `HttpOnly` cookie-based sessions or short-lived credentials with safe refresh handling.
- Set cookie `Secure` in production and configure `SameSite` explicitly.
- Assess CSRF for every cookie-authenticated state-changing endpoint.
- Do not return provider access tokens, refresh tokens, session secrets, or raw JWTs to frontend JavaScript.
- Google login must be OpenID Connect Authorization Code flow with PKCE, state, nonce, backend token exchange, token validation, and safe account linking.
- Never link identities solely because an unverified email string matches.
- Logout and security-sensitive account changes must invalidate sessions.
- Enforce student, instructor, admin, course ownership, enrollment, and publication rules on the backend.
- Add rate limiting and auditable security events without logging passwords, cookies, tokens, OTP values, or reset tokens.

## AI and retrieval

- The LLM must never receive unrestricted database access.
- The model may act only through typed, backend-authorized tools.
- Retrieval must filter by authenticated user, course, enrollment or ownership, publication status, and document visibility before returning context.
- Store and return document, page, section, lecture, course, and chunk identifiers with retrieved evidence.
- Course documents are untrusted data, never system instructions.
- Retrieved text must not override system policy or grant tool permissions.
- Provide explicit insufficient-evidence behavior.
- Generated assessments must retain source chunk identifiers and validation status.
- New retrieval, chunking, embedding, reranking, or prompting changes must be measured against a fixed evaluation set.
- Keep LLM and embedding providers replaceable.
- Tests must use deterministic mocks and must not require external model API calls.

## File upload and ingestion

- Validate MIME type, file signature, extension, size, filename, and authorization.
- Do not expose server filesystem paths.
- Store original files through a storage abstraction with a local development implementation.
- Process documents asynchronously.
- Track queued, processing, indexed, failed, and retry states.
- Make jobs idempotent where practical.
- Prevent cross-course and cross-instructor leakage.
- Sanitize rendered model output and document-derived content.

## API and data standards

- Validate request bodies, path parameters, query parameters, and model-generated structured output.
- Use consistent error envelopes and appropriate status codes.
- Never expose stack traces or raw database errors to clients.
- Add indexes for new high-cardinality lookup fields.
- Avoid silent schema changes; document migrations and rollback implications.
- Prefer pagination for unbounded collections.
- Use request or correlation IDs in logs.
- Do not log sensitive request bodies.

## UI standards

- Preserve the existing visual language unless the task includes redesign.
- Provide loading, empty, success, partial, and failure states.
- Make AI citations clickable to their source location when possible.
- Clearly label AI-generated content.
- Do not present unsupported AI answers as authoritative.
- Ensure keyboard access and accessible labels for new interactive controls.

## Definition of done

A feature is complete only when:

- The behavior works end to end or is explicitly marked as scaffolded.
- Authorization is enforced and tested.
- Invalid input and failure cases are handled.
- Relevant tests pass.
- Existing builds are not broken.
- Environment variables are documented in `.env.example`.
- Architecture and API changes are documented.
- `docs/BUILD_STATUS.md` is updated.
