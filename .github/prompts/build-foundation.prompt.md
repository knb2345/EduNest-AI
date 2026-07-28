---
name: build-foundation
description: Build the secure application foundation before adding AI.
---

Read the repository audit, build status, product spec, target architecture, roadmap, acceptance criteria, and repository instructions.

Implement the **Foundation** milestone as small verified vertical slices.

Required scope:

- Establish reproducible local setup and safe `.env.example` files.
- Add or repair focused automated testing around current authentication and protected routes.
- Remove authentication-token persistence from `localStorage` and other JavaScript-readable persistent storage.
- Use a consistent secure cookie-based authentication/session design compatible with the existing stack.
- Add or repair a current-user/session restoration endpoint.
- Implement logout and server-side session invalidation where the chosen architecture supports it.
- Configure credentialed CORS safely for development and production.
- Add CSRF protection or a clearly justified same-site design for state-changing cookie-authenticated requests.
- Enforce role, ownership, enrollment, and publication authorization on the backend.
- Add rate limiting for login, OTP, password reset, uploads, and future AI endpoints.
- Add structured security audit events without sensitive values.
- Add Google OpenID Connect Authorization Code flow with PKCE, state, nonce, backend token exchange, ID-token validation, and safe account linking.
- If Google credentials are unavailable, complete the implementation with configuration validation and deterministic tests using mocks.
- Do not expose Google or application tokens to frontend JavaScript.
- Add Docker or Docker Compose support only where it improves reproducible local development.
- Preserve course, cart, payment, dashboard, and progress behavior.

Verification:

- Test email/password login.
- Test session restoration.
- Test logout.
- Test OTP signup behavior that can safely run locally.
- Test unauthenticated and unauthorized protected requests.
- Test invalid OAuth state and nonce.
- Test duplicate provider identity and unsafe account-linking prevention.
- Run relevant builds, lint, type checking, and tests.
- Update architecture documentation, environment documentation, and `docs/BUILD_STATUS.md`.

Do not begin the AI milestone until foundation acceptance criteria pass or are explicitly recorded as blocked.
