---
name: audit-edunest
description: Audit the complete EduNest AI product and record a verified baseline.
agent: agent
---

Read `../../README.md`, `../../PROJECT_OVERVIEW.md`, `../../docs/BUILD_STATUS.md`, and `../../.github/copilot-instructions.md`.

Without changing application behavior:

- Map React routes, Redux state, Axios services, Express routes/controllers, Mongoose models, environment handling, and package scripts.
- Trace password/OTP/reset/JWT and Google OpenID Connect flows, including cookies, CORS, bearer tokens, callback handling, and logout.
- Trace roles, ownership, enrollment, publication, course isolation, payments, progress, PDF ingestion, retrieval, Tutor, and Practice Quiz behavior.
- Identify sensitive logging, unsafe browser trust, missing validation, dead code, duplicate behavior, dependency/runtime incompatibility, and undocumented configuration.
- Run safe defined syntax, test, smoke, and build commands without using real providers.
- Update `docs/BUILD_STATUS.md` with exact observed results and unverified paths.

Do not perform real payments, send email, call live identity/AI providers, change remotes, or destructively modify data. Do not claim a command passed unless its successful output was observed.
