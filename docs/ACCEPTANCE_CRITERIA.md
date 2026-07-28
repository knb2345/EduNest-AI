# EduNest AI acceptance criteria

## Existing application

- Existing public pages render.
- Email signup, OTP verification, login, password reset, dashboards, course browsing, enrollment, progress, cart, and payment integrations are not silently removed.
- Any baseline defect discovered is separated from a regression introduced by new work.

## Authentication

- No reusable authentication credential is persisted in browser localStorage.
- Authenticated API requests work after a page reload through a secure session mechanism.
- Cookies are HttpOnly and use explicit SameSite behavior.
- Secure is enabled in production configuration.
- Logout invalidates access.
- State-changing cookie-authenticated endpoints have CSRF protection or a documented verified same-site design.
- Authentication failures do not reveal whether sensitive account state exists beyond intended product behavior.
- Passwords use a suitable adaptive hash.
- OTP and reset tokens are time-limited, single-use where applicable, and not logged.
- Rate limits exist for login, OTP, password reset, and OAuth initiation/callback abuse.

## OpenID Connect

- Uses Authorization Code flow with PKCE.
- State and nonce are generated and validated.
- Token exchange occurs only on the backend.
- Issuer, audience, expiry, nonce, and signature are validated through a maintained library.
- Provider tokens are not exposed to the browser.
- Provider subject identifier is stored.
- Unsafe email-only account linking is prevented.
- Invalid state, nonce, callback, duplicate identity, and linking cases are tested.

## Authorization

- Backend verifies role for instructor/admin routes.
- Backend verifies course ownership for instructor mutations.
- Backend verifies enrollment for student course AI access.
- Backend verifies publication and document visibility.
- Changing an ID in the request cannot expose another user's profile, course, document, progress, assessment, or AI conversation.
- Cross-course and cross-instructor isolation tests exist.

## Upload and ingestion

- Only authorized instructors can upload to courses they own.
- File content and signature are validated, not only extension.
- Size limits exist.
- Original filename is not trusted as a filesystem path.
- Local paths are not returned.
- Processing is asynchronous.
- Processing status is durable.
- Retries are bounded.
- Duplicate jobs do not create uncontrolled duplicate chunks.
- Chunk provenance includes course, document, page, and section or lecture where available.

## Retrieval

- BM25 baseline is reproducible.
- Dense retrieval is behind an adapter.
- Hybrid behavior is configurable and measured.
- Authorization and visibility filters apply before evidence is returned.
- Evidence contains stable provenance.
- Evaluation computes Recall@5, Recall@10, MRR, and nDCG@10.
- Result files identify strategy, configuration, dataset version, and timestamp.
- No claimed improvement is based only on anecdotal queries.

## Grounded tutor

- Only enrolled students or authorized instructors can use a course tutor.
- The model sees only permitted course evidence.
- Answers include citations tied to supplied chunks.
- The tutor explicitly abstains when evidence is insufficient.
- Retrieved documents cannot grant tools, alter system policy, or reveal other course content.
- Model output is safely rendered.
- Tests cover answerable, unanswerable, unauthorized, cross-course, and injection-like cases.
- External model calls are mocked in automated tests.

## Assessment and mastery

- Generated questions retain source evidence.
- Generated questions are drafts until instructor approval.
- Students cannot access unpublished questions.
- Mastery uses documented inputs and formula or model.
- Recommendations use actual student history.
- Instructor edits and approvals are auditable.

## Observability

- Correlation ID spans product API, queue, AI service, retrieval, and generation.
- Logs exclude passwords, tokens, cookies, OTPs, reset tokens, payment secrets, and raw provider credentials.
- Queue status and failures can be inspected.
- P50/P95 latency can be measured from actual data.
- Evaluation regressions are visible rather than averaged away.

## Documentation

- Setup works from documented steps or deviations are recorded.
- `.env.example` includes names and safe placeholders only.
- Architecture, security model, API changes, evaluation, and remaining limitations are documented.
- `docs/BUILD_STATUS.md` reflects reality.
- `docs/RESUME_METRICS.md` contains actual measured values only.
