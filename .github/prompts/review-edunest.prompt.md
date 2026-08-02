---
name: review-edunest
description: Review EduNest AI for release-level security and regression risk.
---

Review the current diff and product against `../../PROJECT_OVERVIEW.md`, `../../.github/copilot-instructions.md`, and `../../docs/BUILD_STATUS.md`.

Check:

- broken identity, course, payment, progress, Tutor, or quiz flows
- password, OTP, reset, JWT, cookie, CORS, OAuth 2.0, and OpenID Connect flaws
- unsafe account linking or Google role escalation
- frontend-only authorization, IDOR, and cross-course/instructor leakage
- sensitive values in logs, responses, cookies, browser storage, or URLs
- upload validation, duplicate ingestion, untrusted document handling, and unsafe output rendering
- evidence retrieved before authorization, unsupported citations, missing abstention, exposed quiz answers, or browser scoring
- missing configuration, runtime incompatibility, unbounded database work, and misleading documentation
- tests that do not exercise their claimed boundary

Run safe focused checks and the frontend build. Return findings ordered by severity with exact file locations, failure scenarios, concrete fixes, and an explicit list of unverified behavior. Do not make broad changes before reporting findings.
