---
name: build-foundation
description: Maintain EduNest identity, sessions, configuration, and authorization.
---

Read the current architecture and build status, then implement the requested identity or authorization change as a verified vertical slice.

Maintain:

- OTP-verified email/password registration and password reset
- bcrypt password handling and EduNest JWT authorization
- Google OpenID Connect Authorization Code flow with state, nonce, S256 PKCE, backend code exchange, exact redirect URI use, validated ID-token claims, and verified email
- Student-only Google account creation and conflict behavior for unlinked matching emails
- HttpOnly cookie policy, credentialed exact-origin CORS, cleanup, session restoration, and logout
- Student, Instructor, Admin, ownership, enrollment, publication, and cross-course checks
- startup and password login when Google configuration is absent

Never expose client secrets, authorization codes, provider tokens, JWTs, credentials, OTPs, or reset tokens in logs or redirect URLs. Add deterministic no-credential checks and run email/password, protected-route, logout, frontend-build, and demo regressions proportionately. Update `.env.example`, architecture docs, and `docs/BUILD_STATUS.md` from observed results.
