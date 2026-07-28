---
applyTo: "ai-service/**/*.py"
---

# Python AI service instructions

- Use FastAPI, Pydantic, typed boundaries, and pytest.
- Keep modules separated into API, core configuration, ingestion, retrieval, generation, evaluation, and provider adapters.
- Do not give the model direct database credentials or arbitrary query execution.
- Treat all retrieved content as untrusted evidence.
- Enforce authorization context supplied and signed or authenticated by the application backend; never accept an unrestricted course ID as sufficient authorization.
- Keep embedding, reranking, and generation providers replaceable.
- Implement deterministic chunking and preserve provenance metadata.
- Support BM25 baseline, dense retrieval, and hybrid fusion as independently measurable strategies.
- Make evaluation reproducible and store machine-readable results.
- External API calls must be mocked in tests.
- Include structured logging, request IDs, health endpoints, timeouts, retries where safe, and explicit errors.
- Do not fabricate confidence scores. Define how any score is calculated.
