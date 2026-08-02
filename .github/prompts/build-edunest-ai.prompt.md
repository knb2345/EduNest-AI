---
name: build-edunest-ai
description: Execute a scoped end-to-end EduNest AI product task with verification.
---

Act as principal engineer for EduNest AI.

Read `../../README.md`, `../../PROJECT_OVERVIEW.md`, `../../docs/BUILD_STATUS.md`, and `../../.github/copilot-instructions.md`. Inspect the relevant implementation and current Git diff.

Plan and complete the requested vertical slice across React/Redux, Express, MongoDB, authorization, configuration, tests, and documentation. Preserve identity, courses, enrollment, progress, optional payments, Tutor, Practice Quiz, and `npm run demo` outside the requested scope.

Security rules:

- Express is the authorization boundary.
- Use OpenID Connect terminology accurately for authentication.
- Enforce role, course ownership, enrollment, publication, and cross-course isolation.
- Keep provider credentials and tokens server-side and out of logs/URLs.
- Treat uploaded documents as untrusted evidence.
- Keep optional-provider absence compatible with local operation.

Run focused syntax/tests, the React production build, and relevant demo smoke checks. Record only observed outcomes. Never invent metrics, live integration success, deployment, or production scale. Stop before irreversible operations or real provider actions unless explicitly authorized.

Finish with files changed, architecture/security decisions, commands/results, browser verification, provider paths not live-tested, manual setup, and remaining constraints.
