---
name: review-edunest
description: Perform a release-grade security, reliability, and AI evaluation review.
---

Review the current repository against:

- `../../.github/copilot-instructions.md`
- `../../docs/AI_PRODUCT_SPEC.md`
- `../../docs/TARGET_ARCHITECTURE.md`
- `../../docs/ACCEPTANCE_CRITERIA.md`
- `../../docs/BUILD_STATUS.md`

Do not make broad changes before reporting findings.

Inspect the current diff and implementation for:

- Broken existing user flows
- Token exposure or insecure browser storage
- Cookie, CORS, CSRF, OAuth, OTP, password-reset, and session flaws
- Frontend-only authorization
- IDOR and cross-course/cross-instructor data leakage
- Unsafe account linking
- File-upload validation and path traversal
- Queue duplication, retry storms, and non-idempotent jobs
- Prompt injection and tool authorization bypass
- Retrieval filters applied after rather than before evidence access
- Unsupported citations, hallucination, and missing abstention
- Evaluation leakage, unstable fixtures, and invented metrics
- Sensitive logging
- Unsanitized AI output
- Missing rate limits and resource quotas
- Missing indexes and unbounded database operations
- Missing environment documentation
- Tests that do not exercise real boundaries

Run safe available tests, linting, type checks, builds, and the AI evaluation command.

Create `docs/RELEASE_REVIEW.md` with findings grouped by Blocker, High, Medium, and Low severity. Include exact file locations, a concrete failure or exploit scenario, and a recommended fix.

Fix Blocker and High findings caused by the current implementation when the changes are localized and safely verifiable. Re-run verification and update `docs/BUILD_STATUS.md`.

Explicitly state everything that was not verified.
