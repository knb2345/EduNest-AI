---
applyTo: "src/**/*.js,src/**/*.jsx,src/**/*.ts,src/**/*.tsx"
---

# Frontend instructions

- Inspect current React, Redux, router, service, and component conventions before adding code.
- Do not store authentication credentials in `localStorage`, Redux persistence, URL parameters, or readable cookies.
- Credentialed API requests should use the repository's centralized HTTP client.
- Redux may store user profile and UI state, but not reusable authentication secrets.
- Add explicit loading and error states for asynchronous workflows.
- AI responses must render through a safe Markdown or structured renderer; never inject raw model HTML.
- Citation UI must preserve source document, page, section, and lecture metadata.
- Check student/instructor visibility in the UI, while relying on backend authorization as the actual boundary.
- Avoid adding global state for server data when the current service abstraction is more appropriate.
- Write accessible controls, labels, focus states, and keyboard behavior.
- Add focused component or integration tests for important states.
