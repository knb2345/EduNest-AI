---
applyTo: "server/**/*.js,server/**/*.ts"
---

# Express backend instructions

- Follow the current route, controller, middleware, model, and service structure.
- Controllers should remain thin; place reusable business logic in services when the repository has or can cleanly support that pattern.
- Validate every external input.
- Perform authentication, role checks, ownership checks, enrollment checks, and publication checks before data access or side effects.
- Never trust user IDs, roles, course IDs, prices, payment status, or file metadata supplied by the browser.
- Use secure cookies and credentialed CORS correctly.
- Do not expose tokens, OTPs, reset tokens, internal errors, stack traces, or local paths.
- Add rate limits to authentication, password reset, file upload, and AI query endpoints.
- Keep request work bounded; propose asynchronous processing only when a measured requirement justifies it.
- New external providers must be wrapped in an interface with deterministic mocks.
- Add focused API tests for happy path, unauthenticated access, unauthorized access, invalid input, and relevant failure cases.
