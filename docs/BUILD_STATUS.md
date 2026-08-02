# EduNest AI Build Status

Last completion pass: 2026-08-03

## Product scope present

- OTP-verified email/password registration, login, reset, JWT authorization, and logout
- Google Authorization Code + OpenID Connect login with state, nonce, PKCE, verified email, safe persistence, and EduNest JWT handoff
- Student, Instructor, and Admin roles with server-side role checks
- Course, section, lecture, enrollment, optional payment, progress, profile, and dashboard workflows
- Page-aware PDF ingestion, course/document/page chunk provenance, and duplicate prevention
- Lexical retrieval plus optional embeddings and grounded OpenAI generation
- Cited Tutor responses and insufficient-evidence safeguards
- Deterministic and optional structured Practice Quiz generation
- Instructor draft review/edit/delete/publish and student submission/backend scoring
- Course ownership, enrollment, and cross-course isolation
- Protected deterministic content-based course recommendations with cold-start fallback and signal-derived reasons
- One-command local demo

## Verification status

| Check | Result |
|---|---|
| Changed backend JavaScript syntax | Passed in the 2026-08-03 completion pass |
| Recommendation deterministic regression | Passed: exclusion, relevance order, cold start, max limit, malformed metadata, unauthenticated rejection |
| Provider-independent authentication regression | Passed: disabled config, redirect config, user rules, JWT claims, cookie policies |
| Frontend production build | Pending final completion-pass run |
| Demo startup with Google credentials absent | Pending final completion-pass run |
| Email/password demo login | Pending final completion-pass run |
| Tutor upload/retrieval/citations/abstention smoke | Pending final completion-pass run |
| Practice Quiz regression | Pending final completion-pass run |
| Browser verification of Google button/callback UI | Pending final completion-pass run |
| Browser verification of personalized/cold-start recommendations, navigation, and responsive dashboard | Pending final completion-pass run |
| Live Google authentication | Not tested; no credentials supplied |
| Live OpenAI generation | Not tested; no credentials supplied |

## OAuth-disabled behavior

Provider discovery is lazy. With Google variables blank, the server starts normally, `/auth/google/status` reports disabled, the frontend shows a disabled development-safe option, and email/password plus demo workflows remain available.

## Known constraints

- Demo data is ephemeral.
- Quiz attempts are not stored as history.
- No-key quiz generation supports bounded factual short-answer patterns.
- Retrieval quality and provider behavior have no benchmark claims.
- Recommendation relevance has no labelled benchmark, behavioral learning, or collaborative-filtering dataset.
- Live provider paths require developer-owned configuration.
- PDF validation relies on MIME/filename plus parser success rather than an independent file signature.
