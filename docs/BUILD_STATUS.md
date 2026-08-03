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
| All backend JavaScript syntax | Passed for 58 files in the 2026-08-03 Azure preparation pass |
| Clean root and server lockfile installs | Passed with isolated `npm ci` verification |
| Server dependency audit | Passed: 0 known vulnerabilities after production dependency updates |
| Recommendation deterministic regression | Passed: exclusion, relevance order, cold start, max limit, malformed metadata, unauthenticated rejection |
| Provider-independent authentication regression | Passed: disabled config, redirect config, user rules, JWT claims, cookie policies |
| Frontend production build | Passed with existing lint and bundle-size warnings; production bundle uses same-origin `/api/v1` |
| Production Express launch and health | Passed with an ephemeral MongoDB-compatible test database; safe `/api/health` response verified |
| React static serving and direct-route navigation | Passed through Express for `/dashboard/my-profile` |
| Unknown API behavior | Passed: `/api/v1/unknown-route` returned JSON 404 |
| Azure proxy and production cookies | Passed: one trusted proxy hop; Secure, HttpOnly, SameSite=Lax session cookie and reliable logout clearing |
| Missing production database configuration | Passed: clear startup failure without logging `MONGODB_URL` |
| Production demo auto-seeding protection | Passed: empty production database remained empty |
| Demo startup with Google credentials absent | Passed on alternate ports because pre-existing local processes occupied 3000/4000 |
| Email/password demo login | Passed for Instructor, enrolled Student, and outsider accounts |
| Tutor upload/retrieval/citations/abstention smoke | Passed in deterministic no-key source-preview mode |
| Practice Quiz regression | Passed: draft, publication, student-safe payload, 3/3 backend scoring, and isolation |
| Logout cookie clearing | Passed in demo and production cookie smoke checks |
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
- The root React/Create React App dependency tree reports 32 legacy low/moderate/high npm audit advisories and no critical advisories after updating the directly used Swiper package. The deployable Express server dependency tree reports zero known advisories; broad frontend toolchain migration was outside this production-configuration pass.
