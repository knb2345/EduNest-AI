# EduNest AI target architecture

## Architecture principles

- Extend the existing application rather than replacing it.
- Keep the Node/Express backend as the product API and authorization authority.
- Use Python/FastAPI for document processing, retrieval, generation, and evaluation.
- Keep all external providers behind interfaces.
- Make local development runnable without paid services.
- Enforce authorization before retrieving evidence.
- Treat model output and uploaded documents as untrusted.
- Prefer one reliable workflow over artificial multi-agent complexity.

## Logical components

```text
React + Redux frontend
        |
        | credentialed HTTPS API
        v
Express product backend
  - application sessions
  - OIDC callback
  - RBAC and ownership
  - courses and enrollment
  - payments and progress
  - document metadata
  - AI tool authorization
  - audit events
        |
        +--------------------+
        |                    |
        v                    v
MongoDB                  Redis + BullMQ
application data         background jobs/cache
                             |
                             v
                       Node queue worker
                             |
                             | authenticated internal request
                             v
                       FastAPI AI service
                       - extraction
                       - chunking
                       - BM25
                       - embeddings
                       - hybrid retrieval
                       - reranking
                       - generation
                       - evaluation
                             |
              +--------------+--------------+
              |                             |
              v                             v
       Storage adapter                Vector-store adapter
       local dev / S3-like            local runnable implementation
```

## Authentication boundary

The browser does not hold reusable authentication tokens in `localStorage`.

Preferred application flow:

```text
Browser -> Express login/OIDC -> secure HttpOnly application session cookie
Browser -> Express protected API -> session + backend authorization
```

Google provider tokens remain backend-only and are not used as the application's browser session.

## Service trust

The Express backend is the source of authorization context.

The AI service must not accept a user-controlled `courseId` as proof of access.

Internal calls should include a short-lived signed service assertion or use a private authenticated channel. The exact mechanism may begin with a development-safe shared service credential but must be isolated behind middleware and documented for production replacement.

## Storage

- MongoDB remains the source of truth for users, profiles, courses, enrollments, document metadata, chunks or chunk references, assessments, progress, mastery, and interaction metadata.
- Original uploaded files use a storage adapter.
- Development may use a private local directory.
- Production should use S3-compatible or cloud object storage with private access and signed URLs when needed.
- Vector search uses an adapter so local development and future hosted storage can differ.

## Queueing

Use Redis and BullMQ for the first implementation because the existing product backend is Node-based.

The queue worker invokes the Python service for CPU/AI-oriented processing.

Job requirements:

- Stable job identifier
- Idempotency key
- Bounded retry count
- Exponential backoff with jitter where appropriate
- Terminal failure state
- Status persisted independently of transient queue state
- Safe reprocessing behavior
- Correlation ID propagated to logs

## Retrieval

The first retrieval strategies are:

- BM25 lexical baseline
- Dense retrieval
- Hybrid reciprocal-rank or normalized-score fusion
- Optional reranker

Retrieval is filtered by:

- Authenticated user
- Enrollment or instructor ownership
- Course
- Publication state
- Document visibility
- Current lecture/module where appropriate

Returned evidence preserves:

- Course ID
- Document ID and name
- Lecture/module
- Page or timestamp
- Section
- Chunk ID
- Retrieval strategy and score

## Controlled AI tools

The model may request narrowly defined operations such as:

- retrieve authorized course material
- read student course progress
- read concept mastery
- create a draft practice question
- save a flashcard
- recommend a next lesson

Every operation passes through backend authentication, authorization, validation, and audit logging.

The model cannot issue arbitrary database queries, filesystem commands, payment operations, role changes, or course publication actions.

## Observability

Propagate one correlation ID across:

- Browser request
- Express API
- Queue job
- AI service
- Retrieval
- Model provider

Track:

- Request count and error rate
- Queue delay and processing duration
- Retrieval latency
- Generation latency
- P50 and P95 end-to-end latency
- Token usage when available
- Cache hits
- Abstention rate
- Retrieval and citation evaluation metrics

Sensitive content, credentials, complete prompts, OTPs, session cookies, reset tokens, and payment secrets must not be logged.
