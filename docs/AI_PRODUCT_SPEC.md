# EduNest AI product specification

## Product statement

EduNest AI is a secure adaptive learning and course-intelligence platform built on the existing EduNest/StudyNotion MERN application.

It is not a generic chatbot and not a replacement for instructors.

The system grounds tutoring, assessment, and recommendations in instructor-approved course material and measurable student learning signals.

## Users

### Student

A student can:

- Browse and purchase or enroll in courses through existing product flows
- Watch lectures and track progress
- Ask questions within an enrolled course
- Receive answers with document, lecture, page, section, or timestamp citations
- Request simpler explanations, examples, hints, and Socratic guidance
- Receive grounded practice questions
- View concept mastery and revision recommendations
- Open the cited source directly

### Instructor

An instructor can:

- Create and manage courses through existing product flows
- Upload course PDFs initially, with additional formats added later
- See document processing state
- Retry failed ingestion
- Preview retrieved evidence
- Review, edit, approve, or reject AI-generated quiz drafts
- See aggregated misconceptions, unanswered questions, weak concepts, and content-coverage gaps

### Administrator

An administrator can:

- Review security and processing audit events
- Inspect failed jobs and provider health
- Configure quotas and feature availability
- Revoke sessions or disable compromised content where supported

## Core differentiators

- Course-grounded answers rather than general chat
- Evidence provenance and clickable citations
- Explicit abstention when course evidence is insufficient
- Hybrid lexical and semantic retrieval
- Measured retrieval and generation behavior
- Secure user, course, enrollment, instructor, and publication boundaries
- Controlled AI tools rather than direct model database access
- Instructor approval for generated assessments
- Explainable adaptation based on learning history
- Operational metrics and regression evaluation

## Primary workflows

### Secure authentication

- Email/password and OTP flows remain supported.
- Authentication credentials are not stored in JavaScript-readable persistent storage.
- Google sign-in uses OpenID Connect Authorization Code flow with PKCE.
- The backend validates state, nonce, issuer, audience, expiration, and provider identity.
- The application creates its own session.
- Account linking requires safe re-authentication or verified proof.

### Course document ingestion

- An authenticated instructor selects a course they own.
- The instructor uploads a valid PDF.
- The backend validates authorization and file properties.
- The original file is stored through a storage adapter.
- A background job extracts page-aware text.
- The content is deterministically chunked.
- Provenance and publication metadata are retained.
- Lexical and dense indexes are updated.
- The UI displays queued, processing, indexed, failed, and retry states.

### Grounded tutoring

- An authenticated enrolled student asks a course question.
- The backend verifies enrollment and course visibility.
- Retrieval is constrained before evidence access.
- BM25, dense retrieval, hybrid fusion, or reranking returns evidence.
- The model receives evidence as untrusted context.
- The answer contains citations or explicitly abstains.
- The interaction records non-sensitive evaluation and operational metadata.

### Adaptive assessment

- The system retrieves approved course evidence.
- It generates a draft question, answer, explanation, concept, difficulty, and citations.
- Validation checks that the answer is supported.
- The instructor approves or edits the item.
- Student attempts update an explainable mastery model.
- Recommendations use actual history, not static labels.

### Instructor analytics

- Similar student questions are grouped.
- Low-mastery concepts and high-refusal topics are surfaced.
- The dashboard avoids exposing unnecessary individual student content.
- Analytics make clear when sample sizes are too small.

## Non-goals for the first release

- Open-domain general assistant
- Autonomous grading of high-stakes exams
- Direct model access to databases
- Automatic publication of generated assessments
- Multi-agent orchestration for its own sake
- Fine-tuning without a measured need
- Native mobile applications
- Blockchain credentials
- Replacing the existing payment system
- A complete rewrite of the MERN application
