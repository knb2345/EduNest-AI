# EduNest AI Engineering Assistant Configuration

The `.github` directory contains workspace instructions, review profiles, and focused prompts for maintaining the complete EduNest AI product.

## Product references

Engineering work should begin with the current sources of truth:

- `README.md` for capabilities and setup
- `PROJECT_OVERVIEW.md` for architecture and end-to-end flows
- `docs/BUILD_STATUS.md` for verified and unverified behavior
- `docs/DEMO_GUIDE.md` for the deterministic product walkthrough
- `.env.example` for configuration names and provider boundaries

The running code is authoritative when documentation and implementation differ. Update both in the same change.

## Workspace prompts

- `/audit-edunest`: map the current product and verification baseline
- `/build-foundation`: maintain identity, sessions, and authorization
- `/build-ai-core`: maintain ingestion, retrieval, Tutor, and Practice Quiz behavior
- `/review-edunest`: perform a security and regression review
- `/build-edunest-ai`: execute a scoped, end-to-end product task

## Safety and evidence

- Never put real OAuth, payment, database, email, storage, or LLM secrets in prompts or tracked files.
- Keep optional-provider absence compatible with local startup and `npm run demo`.
- Use OpenID Connect terminology for Google authentication and OAuth 2.0 terminology for authorization-code exchange.
- Report live provider success only after a credential-backed test.
- Record reproducible command outcomes; do not invent metrics or deployment status.
- Preserve copyright, license, and package attribution.
