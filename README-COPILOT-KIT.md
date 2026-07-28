# EduNest AI Copilot Build Kit

This kit configures GitHub Copilot in VS Code to extend the existing EduNest/StudyNotion MERN repository into a secure, evaluated AI learning platform.

## Install

Copy the contents of this kit into the **root of the existing repository**, preserving the `.github` directory.

Expected result:

```text
your-repository/
├── .github/
│   ├── copilot-instructions.md
│   ├── agents/
│   ├── instructions/
│   └── prompts/
├── docs/
│   ├── AI_PRODUCT_SPEC.md
│   ├── TARGET_ARCHITECTURE.md
│   ├── IMPLEMENTATION_ROADMAP.md
│   ├── ACCEPTANCE_CRITERIA.md
│   └── RESUME_METRICS.md
├── PROJECT_OVERVIEW.md
└── existing application files...
```

Keep the repository's existing `PROJECT_OVERVIEW.md`. It describes the current React, Redux, Express, MongoDB, JWT, course, payment, and progress flows.

## Start in VS Code

- Commit or stash current work so the starting state is recoverable.
- Open the repository root as the VS Code workspace.
- Reload the VS Code window after copying this kit.
- Open **Chat → Configure Chat** and confirm that the prompt files and custom agents are discovered.
- Select the **EduNest Builder** custom agent.
- Run `/audit-edunest`.
- Review `docs/REPOSITORY_AUDIT.md` and `docs/BUILD_STATUS.md`.
- Run `/build-edunest-ai`.

The master prompt is intentionally phased. It should inspect the real package scripts and code before making architectural changes.

## Recommended execution

Run the prompts in this order when you want more control:

```text
/audit-edunest
/build-foundation
/build-ai-core
/review-edunest
```

Run `/build-edunest-ai` when you want Copilot to execute the complete roadmap autonomously while preserving phase gates.

## Important

- Do not provide real Google OAuth, payment, database, or LLM secrets in chat.
- Put secret names and safe placeholders in `.env.example`.
- OAuth can be implemented and tested with mocks before real credentials are configured.
- The agent must report rather than invent performance metrics.
- Review diffs before accepting destructive changes or dependency upgrades.
