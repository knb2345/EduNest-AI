# EduNest AI Demo Guide

This walkthrough presents EduNest AI as one product: identity, role-based course access, course-grounded tutoring, instructor-reviewed quizzes, student submission, and backend scoring.

## Start the product

From the repository root:

```bash
npm run demo
```

The command starts:

- React at `http://localhost:3000`
- Express at `http://localhost:4000/api/v1`
- an ephemeral in-memory MongoDB database
- three users, two isolated courses, and `sample/edunest_sample.pdf`

The terminal prints new course IDs on every run. Keep the main **EduNest AI Demo Course ID** available.

## Demo accounts

All accounts use `Demo123!`.

| Role | Email | Purpose |
|---|---|---|
| Instructor | `instructor@edunest.demo` | Course owner, document ingestion, quiz authoring |
| Enrolled Student | `student@edunest.demo` | Tutor access, published quiz submission |
| Non-enrolled Student | `outsider@edunest.demo` | Enrollment-denial demonstration |

## 1. Identity and dashboard

1. Open `/login` and point out both email/password and **Continue with Google**.
2. In the no-credential demo, Google is visibly disabled while password login remains operational.
3. Sign in as the instructor.
4. Show the authenticated profile and Instructor dashboard/course-management navigation.
5. Explain that login produced an EduNest JWT and that the backend resolves role and course ownership for protected operations.

OTP registration and password reset require configured mail delivery. Google login requires the Google Cloud settings documented in the README; do not claim a live provider check during the deterministic demo.

## 2. Course structure and instructor ownership

1. Open the instructor's course list.
2. Show that courses contain sections and lecture subsections and can be managed from instructor routes.
3. Open `/courses/<COURSE_ID>/ai` for the main demo course.
4. Note that document upload and quiz-draft actions are owner-only API operations.

## 3. PDF ingestion

1. Upload `sample/edunest_sample.pdf`.
2. Confirm the success response and stored-chunk count.
3. Explain that `pdfjs-dist` extracts text by page, chunks retain document/page provenance, and SHA-256 prevents the same content from being ingested twice in one course.
4. Upload the same file again to demonstrate duplicate prevention if desired.

The fixture states:

- EduNest AI was launched in 2025.
- The demo course contains six learning modules.
- The final assessment requires a score of 70 percent.

## 4. Course-grounded AI Tutor

Ask:

```text
When was EduNest AI launched?
```

Expected no-key behavior:

- mode: `source_preview`
- fallback: `no_api_key`
- evidence from the uploaded course document
- citation containing the document name and page number

Then ask:

```text
Who is the chief executive officer of Acme Robotics?
```

Expected behavior:

- mode: `insufficient_evidence`
- no unsupported answer
- no unrelated course material

Explain that lexical retrieval is always available. When OpenAI is configured, embeddings can drive retrieval and a grounded LLM can compose the answer; citations still come from persisted chunk provenance.

## 5. Instructor Practice Quiz lifecycle

1. Open the Practice Quiz panel.
2. Generate three questions from the uploaded material.
3. Show the draft state and citations.
4. Edit a prompt or explanation.
5. Delete a draft question if desired, then generate/save the intended set.
6. Publish the quiz.

In no-key mode, generation is deterministic and short-answer based. With OpenAI configured, the API can request structured short-answer and multiple-choice output, then validates it against retrieved evidence before persistence.

## 6. Student submission and backend scoring

1. Log out; confirm navigation returns home and local session state is cleared.
2. Sign in as `student@edunest.demo`.
3. Open the same course AI route.
4. Open the published quiz. Drafts and correct answers are not exposed.
5. Answer all questions and submit once.
6. Show the aggregate score and per-question submitted answer, correct answer, correctness, explanation, and document/page citation.
7. Use **Try Again** or **Back to Quizzes** to show clean answer-state reset.

Scoring happens on the API; the browser cannot decide which answers are correct.

## 7. Enrollment and cross-course isolation

1. Log out and sign in as `outsider@edunest.demo`.
2. Request the main course Tutor or quiz route.
3. Confirm the `403` authorization result.
4. Explain that every Tutor/quiz lookup is scoped to a course before evidence or draft data is returned.

The second seeded course exists to demonstrate that changing a course or quiz identifier does not cross the course boundary.

## 8. Optional commerce and provider paths

When Razorpay is configured, demonstrate payment capture, server verification, and enrollment. When OpenAI is configured, re-upload after restart to create embeddings, then show grounded responses or structured quiz generation. When Google is configured, use the exact local callback URI:

```text
http://localhost:4000/api/v1/auth/google/callback
```

Only claim these paths as live-tested when valid developer-owned credentials were actually exercised.

## Automated smoke verification

With the demo API running, execute from `server/`:

```bash
npm run demo:verify
```

The script checks password login, course seeding, ownership, enrollment, outsider isolation, PDF ingestion, a cited supported response, and insufficient-evidence behavior.

Run provider-independent authentication checks from the repository root:

```bash
node server/authRegressionTest.js
```

## Stop

Press `Ctrl+C` in the demo terminal. The database is intentionally discarded.
