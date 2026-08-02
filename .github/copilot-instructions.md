# EduNest AI Repository Instructions

## Product scope

EduNest AI is a full-stack MERN learning platform. React and Redux implement the browser application; Express owns identity, authorization, course operations, retrieval, generation, and scoring; Mongoose persists data in MongoDB.

The product includes OTP-verified password identity, Google OpenID Connect, EduNest JWT sessions, Student/Instructor/Admin roles, courses and lectures, enrollment, progress, optional Razorpay payments, PDF-grounded tutoring, and instructor-reviewed Practice Quizzes.

Read `README.md`, `PROJECT_OVERVIEW.md`, `.env.example`, and the relevant files in `docs/` before major changes. Treat code as authoritative and update documentation when behavior changes.

## Working method

- Inspect runtime versions, package scripts, configuration, Git diff, and relevant end-to-end flows before editing.
- Prefer a small coherent vertical slice across API, persistence, UI, authorization, tests, and documentation.
- Preserve product behavior outside the requested scope.
- Do not add microservices, queues, databases, providers, analytics, or product features unless the task requires them.
- Keep local development functional without paid services.
- Record observed test/build results in `docs/BUILD_STATUS.md`.
- Never invent metrics, provider success, deployment status, or production readiness.

## Identity and authorization

- Frontend guards are navigation aids; Express is the authorization boundary.
- Verify JWT identity, role, ownership, enrollment, publication, and course binding before protected data access.
- Describe Google login as OpenID Connect over the OAuth 2.0 Authorization Code flow.
- Maintain state, nonce, PKCE, exact redirect URI use, issuer/audience/expiry validation, and verified-email handling.
- Keep client secrets and provider tokens server-side. Never log credentials, codes, tokens, cookies, OTPs, or reset tokens.
- Never link an identity solely because an email matches. Require an explicit secure linking flow.
- New Google users must be Students.
- Use `HttpOnly`, production `Secure`, explicit `SameSite`, bounded cookie lifetime, and cleanup for temporary OAuth state.

## AI, retrieval, and assessment

- Authorize course access before retrieving chunks.
- Treat PDF text as untrusted evidence, never as system instructions.
- Preserve course, document, page, and chunk provenance.
- Return explicit insufficient-evidence behavior for unsupported questions.
- Keep OpenAI optional; lexical retrieval, source preview, and deterministic quiz generation must work without it.
- Validate structured quiz output and evidence references before persistence.
- Require instructor review and publication before learner access.
- Hide correct answers until backend scoring completes.
- Never claim retrieval or model quality without a reproducible benchmark.

## API, upload, and UI quality

- Validate external inputs and use consistent, non-sensitive errors.
- Enforce upload size, supported PDF handling, ownership, duplicate prevention, and course isolation.
- Never expose filesystem paths, stack traces, secrets, or raw database errors.
- Centralize credentialed requests through the Axios client.
- Provide loading, disabled, empty, success, and failure states for asynchronous UI.
- Render model/document output safely and keep citations tied to trusted provenance.

## Definition of done

- Requested behavior works end to end or is explicitly marked unverified.
- Failure and authorization cases are covered proportionately.
- Relevant syntax checks, regression scripts, demo smoke checks, and frontend build pass.
- Configuration is represented with placeholders in `.env.example`.
- Architecture and status documentation match the code.
