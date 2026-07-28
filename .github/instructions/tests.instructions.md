---
applyTo: "**/*.test.js,**/*.test.jsx,**/*.test.ts,**/*.test.tsx,**/*.spec.js,**/*.spec.jsx,**/*.spec.ts,**/*.spec.tsx,ai-service/tests/**/*.py"
---

# Test instructions

- Tests must be deterministic and independent of real OAuth, payment, email, cloud storage, embedding, or LLM services.
- Cover happy paths, malformed input, unauthenticated access, unauthorized roles, ownership violations, and cross-course isolation.
- Add regression tests for every fixed security or data-leakage issue.
- Prefer behavior-level assertions over implementation-detail assertions.
- Clean up created database records and files.
- Do not weaken assertions merely to make a test pass.
