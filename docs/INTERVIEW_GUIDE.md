# EduNest AI Interview Guide

## 60-second product pitch

EduNest AI is a MERN learning platform that covers identity, course authoring, enrollment, payments, content progress, grounded tutoring, and practice assessment. Instructors organize courses into sections and lectures, upload source PDFs, query course evidence, generate and review quiz drafts, and publish assessments. Enrolled students consume lessons, track progress, ask the course-grounded Tutor, submit published quizzes, and receive backend-scored explanations with page citations. The system works deterministically without AI credentials and can optionally use OpenAI embeddings and grounded generation. Security is enforced on the Express API through EduNest JWT sessions, roles, course ownership, enrollment checks, and cross-course query scoping. Identity supports OTP-verified passwords and Google OpenID Connect without unsafe account linking.

## Why a single full-stack product?

Identity, authorization, learning data, retrieved evidence, quiz publication, and scoring all depend on the same user/course boundary. Keeping those decisions in the Express API makes ownership and enrollment checks consistent before MongoDB records or provider calls are reached. React and Redux focus on interaction and state; they do not act as the authorization boundary.

## Authentication architecture

Email/password registration verifies an OTP, hashes the password, and creates a role-bearing user and profile. Login creates a 24-hour EduNest JWT. Password reset uses an expiring emailed token.

Google login uses the OAuth 2.0 Authorization Code flow for code exchange and OpenID Connect for authentication. The backend generates state, nonce, and an S256 PKCE pair; stores temporary values in HttpOnly cookies; uses the exact configured redirect URI; exchanges the code with the server-only secret; and relies on provider metadata and signing keys to validate signature, issuer, audience, expiration, and nonce. It then checks `email_verified`, resolves the provider subject, and issues the normal EduNest JWT.

Google tokens are not application bearer tokens and are not stored. The final redirect contains no JWT. A new Google account is always Student. A matching unlinked email stops with a conflict, preventing automatic-link account takeover.

## Why retrieval grounding?

An unconstrained model can answer from general knowledge and provide no provenance. EduNest first authorizes the caller, scopes chunks by course, ranks stored evidence, and either returns a cited result or abstains. Optional LLM generation receives only retrieved excerpts; citations are generated from trusted stored provenance.

## Page-aware extraction and chunks

`pdfjs-dist` extracts each page separately. Chunks retain course ID, document identity, content hash, filename, page number, chunk index, and text. Page boundaries make citations explainable and avoid inventing page numbers after generation.

Chunking is deterministic and compact. The trade-off is that fixed character windows are simpler than semantic segmentation, but they keep no-key demos reproducible and evidence storage auditable.

## Lexical versus embedding retrieval

Lexical retrieval tokenizes the query and chunks, computes inverse-document-frequency-style weights, and scores overlap. It is local, predictable, and always available. Optional embedding retrieval stores vectors on chunks and ranks with cosine similarity, improving paraphrase matching at the cost of provider dependency, ingestion work, and storage.

The retriever selects the embedding path only when compatible vectors exist; otherwise it uses lexical scoring. No retrieval-quality metric is claimed because there is no labelled benchmark.

## Citation and insufficient-evidence design

The Tutor returns citations built from the exact chunks used as evidence. Each citation contains document and page provenance. Before response generation, evidence score/coverage checks detect missing or weak support. Unsupported questions return `insufficient_evidence` rather than prompting a model to guess.

This safeguard reduces obvious unsupported output, but no hallucination-reduction percentage is claimed.

## Duplicate document behavior

Upload computes a SHA-256 hash and checks it within the course. The same bytes cannot be stored twice in one course. A changed document with the same name replaces that document's course-scoped chunks. The hash is a deduplication identity, not a malware or file-signature check.

## Practice Quiz lifecycle

Generation begins with the same course-scoped retrieval used by the Tutor. No-key mode recognizes supported factual patterns and creates deterministic short-answer questions. Optional LLM mode requests structured questions and validates answers and cited chunk IDs against retrieved evidence.

Generated quizzes remain drafts. The course owner reviews, edits, removes questions, saves, and explicitly publishes. Enrolled students receive only published student-safe fields. The backend accepts question-ID-keyed answers, scores them, and returns explanations and citations after submission.

The review gate separates machine-proposed content from learner-visible assessment.

## Authorization and isolation

- JWT middleware verifies the application session for local and Google identities.
- Role middleware resolves the current database user.
- Course owners alone can upload, generate, edit, or publish.
- Owners and enrolled students can query the Tutor.
- Enrolled students alone can open/submit published quizzes.
- Course and quiz IDs are bound in database queries.
- Correct answers are stripped before student submission.

Changing frontend state or URL parameters cannot grant access because the API repeats these checks.

## Payments and progress

When Razorpay is configured, the API creates and verifies payment state before enrollment. Course viewing records completed lectures in `CourseProgress`, and the dashboard derives completion percentage from course content and stored completions.

These provider-backed operations remain optional so the product can run locally without external credentials.

## Important engineering trade-offs

- JWT bearer compatibility is retained for password sessions, while Google handoff uses an HttpOnly JWT cookie and a non-secret Redux marker.
- The demo uses in-memory MongoDB for one-command reproducibility; normal development uses persistent MongoDB.
- Lexical retrieval and deterministic generation guarantee no-key behavior; their supported language patterns are intentionally bounded.
- Embeddings remain in MongoDB chunk records, which is adequate for this product scope but not a scale claim.
- Quiz attempts are scored but not persisted as attempt history.
- Provider discovery is lazy, so missing Google settings never break startup.

## Verification story

The product has three complementary checks:

1. Backend syntax checks for changed JavaScript.
2. `authRegressionTest.js` for disabled/configured OIDC settings, user-model rules, JWT claims, and cookie policy without provider credentials.
3. The seeded demo verification for password login, ownership/enrollment, PDF ingestion, citations, and abstention, plus the React production build for client integration.

Live Google or OpenAI success must be reported only after valid credentials are used. Code/configuration verification is not the same as a live provider authentication.

## Current constraints

- No persisted quiz-attempt history
- No labelled retrieval benchmark
- Bounded deterministic quiz grammar
- No live-provider guarantee without credentials
- MIME/extension plus parser PDF validation rather than independent signature inspection
- Local demo data resets on shutdown

## Sensible next engineering work

Without changing product scope, the strongest hardening opportunities are focused integration tests with a mock OIDC provider, durable quiz-attempt records, PDF signature validation, labelled retrieval fixtures, and CSP/CSRF review for the final deployment topology.
