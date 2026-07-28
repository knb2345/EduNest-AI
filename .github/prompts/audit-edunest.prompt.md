---
name: audit-edunest
description: Audit the existing EduNest repository and create a verified implementation baseline.
agent: agent
---

Audit the current repository before implementing new product features.

Read:

- `../../PROJECT_OVERVIEW.md`
- `../../docs/AI_PRODUCT_SPEC.md`
- `../../docs/TARGET_ARCHITECTURE.md`
- `../../docs/IMPLEMENTATION_ROADMAP.md`
- `../../.github/copilot-instructions.md`

Do not modify application behavior during the audit.

Tasks:

- Map the actual frontend, Redux, API client, Express, MongoDB, authentication, authorization, course, payment, progress, email, upload, and configuration flows.
- Compare the repository against `PROJECT_OVERVIEW.md`.
- Find every JWT creation, return, storage, cookie, header, and verification location.
- Find every authentication use of `localStorage`.
- Inspect cookie, CORS, CSRF, route protection, role middleware, account ownership, enrollment, and payment verification.
- List package managers, runtime versions, package scripts, test frameworks, build commands, linting, type checking, and Docker configuration.
- Run safe install, test, lint, and build commands that are already defined.
- Do not perform real payments, send real email, call real LLMs, or destructively modify a database.
- Identify missing environment variables by name only.
- Identify duplicate, dead, insecure, or tutorial-placeholder functionality.
- Identify the safest seams for adding secure sessions, OIDC, document ingestion, a Python AI service, retrieval, and evaluation.

Create or replace:

- `docs/REPOSITORY_AUDIT.md`
- `docs/BUILD_STATUS.md`

`REPOSITORY_AUDIT.md` must contain confirmed file paths, commands, findings, risks, and a recommended implementation sequence.

`BUILD_STATUS.md` must contain a phase checklist with statuses: not started, in progress, complete, blocked, or unverified.

Do not claim a command passed unless you ran it and observed success.
