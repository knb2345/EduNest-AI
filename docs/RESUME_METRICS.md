# EduNest AI Resume Evidence

This ledger limits resume language to repository-backed or reproducibly verified facts. It excludes invented adoption, latency, accuracy, learning-outcome, scale, and live-provider claims.

## Verifiable implementation facts

| Fact | Repository evidence |
|---|---|
| One command starts React, Express, and an in-memory demo database | Root `package.json` and `server/devStart.js` |
| Email/password identity includes OTP signup, JWT login, reset, and logout | Auth routes/controllers, OTP model, session utility |
| Google authentication implements Authorization Code + OpenID Connect with state, nonce, PKCE, verified email, and safe conflict behavior | Google OIDC configuration/controller and User model |
| New Google users are always Students | `findOrCreateGoogleUser` creation payload |
| Google tokens are not persisted or used for EduNest authorization | OIDC callback and EduNest JWT session utility |
| Student, Instructor, and Admin authorization is enforced by middleware | `server/middleware/auth.js` and protected routes |
| Courses support sections, lectures, enrollment, progress, and optional Razorpay payments | Course, Section, Subsection, CourseProgress, and Payment code |
| Demo seeds three identities and two courses for ownership/enrollment isolation | `server/devStart.js` |
| PDF chunks retain course, document, and page provenance | `DocChunk` model and Tutor controller |
| Duplicate course documents use SHA-256 detection | Tutor upload controller |
| Retrieval supports local lexical scoring and optional embeddings | Retriever and embedding provider |
| Tutor supports source preview, optional grounded generation, citations, and abstention | Tutor controller and frontend |
| Quiz workflow supports generation, draft review/edit/delete, publication, student-safe access, submission, and backend scoring | Practice Quiz model/routes/controller/UI |
| Authentication configuration and cookie/model/JWT rules have a no-credential regression script | `server/authRegressionTest.js` |
| Frontend and demo outcomes are recorded with commands rather than estimates | `docs/BUILD_STATUS.md` |

## Claims deliberately excluded

- Production user, course, or revenue counts
- Latency or throughput improvement
- Retrieval accuracy, recall, MRR, nDCG, or model accuracy
- Hallucination-reduction or learning-outcome percentages
- Production scale, availability, or security certification
- Live OpenAI, Google, Razorpay, email, or Cloudinary success without credential-backed verification

## Draft resume bullets

- Built EduNest AI, an end-to-end MERN learning platform spanning OTP-verified identity, JWT sessions, role-based course authoring and enrollment, lecture progress, optional payments, course-grounded tutoring, and instructor-reviewed practice assessments.
- Engineered Google login with the OAuth 2.0 Authorization Code flow and OpenID Connect, including state, nonce, S256 PKCE, verified ID-token claims, Student-only account creation, unsafe-linking conflict protection, and an HttpOnly EduNest session handoff.
- Built page-aware PDF ingestion with SHA-256 duplicate prevention, course-scoped MongoDB chunks, lexical and optional embedding retrieval, cited Tutor responses, and explicit insufficient-evidence behavior.
- Engineered an evidence-grounded Practice Quiz lifecycle with deterministic no-key or optional structured LLM generation, instructor draft editing and publication, student-safe delivery, backend scoring, explanations, and document/page citations.
- Delivered a one-command seeded demo with instructor, enrolled-student, and non-enrolled-student identities plus automated checks for authentication configuration, course isolation, PDF retrieval, citations, and abstention.

Before using a bullet, pair it with the latest command results in `docs/BUILD_STATUS.md`. Do not convert code-present provider paths into live-provider claims.
