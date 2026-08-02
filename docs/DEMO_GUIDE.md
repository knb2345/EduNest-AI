# EduNest AI demo guide

This walkthrough demonstrates the course-grounded AI Tutor and Practice Quiz features without a local MongoDB installation or an OpenAI key.

## Start the demo

From the repository root:

```bash
npm run demo
```

The command starts:

- React frontend: `http://localhost:3000`
- Express API: `http://localhost:4000/api/v1`
- An ephemeral MongoDB instance managed by `mongodb-memory-server`

The terminal prints a new **EduNest AI Demo Course ID** and **Course Isolation Demo ID** on each run. Keep the first ID for the walkthrough.

## Demo accounts

All accounts use password `Demo123!`.

| Role | Email |
|---|---|
| Instructor | `instructor@edunest.demo` |
| Enrolled student | `student@edunest.demo` |
| Non-enrolled outsider | `outsider@edunest.demo` |

## 1. Instructor PDF upload

1. Sign in as `instructor@edunest.demo`.
2. Open `http://localhost:3000/courses/<COURSE_ID>/ai` using the printed EduNest AI Demo Course ID.
3. In the AI Tutor panel, choose `sample/edunest_sample.pdf`.
4. Select **Upload edunest_sample.pdf**.
5. Expect an upload-success message reporting one indexed chunk.
6. Upload the same file again to demonstrate SHA-256 duplicate prevention. Expect **Document already uploaded** rather than a second set of chunks.

The fixture contains three facts on page 1:

- EduNest AI was launched in 2025.
- The demo course contains six learning modules.
- The final assessment requires a score of 70 percent.

## 2. AI Tutor checks

### Supported question

Ask:

```text
When was EduNest AI launched?
```

Without an OpenAI key, expect a source excerpt, an `edunest_sample.pdf · page 1` citation, and the UI label:

```text
Source preview — no AI key configured
```

The application deliberately presents this as retrieved evidence, not as a synthesized AI answer.

### Unsupported question

Ask:

```text
What is the capital of France?
```

Expect the insufficient-evidence state with no fabricated answer or citation.

### Other no-key labels

- `Source preview — no AI key configured`: retrieval found sufficiently relevant course evidence, but no provider key is configured.
- `Source preview — AI request failed`: an OpenAI key was present, but the provider request failed; retrieved evidence is shown instead.
- `Insufficient evidence`: no course chunks passed the relevance and token-coverage checks.

## 3. Generate, review, and publish a quiz

1. In **Practice Quiz**, leave the question count at `3` and difficulty at `Mixed`.
2. Keep **Short answer** enabled. The no-key generator supports deterministic short-answer questions.
3. Select **Generate Practice Quiz**.
4. Expect a locally generated draft with three questions derived from the sample facts.
5. Review the title, question text, correct answers, explanations, difficulty, and citations.
6. Edit a draft field if desired and select **Save draft**.
7. Select **Publish quiz**.
8. Confirm the status changes to `published`.

Published quizzes cannot be edited, and students cannot access drafts.

## 4. Student submission

1. Log out and sign in as `student@edunest.demo`.
2. Open the same `/courses/<COURSE_ID>/ai` URL.
3. Select the published quiz.
4. Confirm that correct answers and explanations are not visible.
5. Confirm that **Submit quiz** is disabled until all questions are answered.
6. For the default deterministic quiz, enter:
   - `2025`
   - `2025`
   - `six`
7. Submit through the frontend.

The expected result screen is:

- Score summary: `3/3 (100%)`
- Each question marked **Correct**
- The student's submitted answer
- The correct answer
- A short explanation
- `edunest_sample.pdf · page 1`

Use **Try Again** to clear answers while keeping the quiz open. Use **Back to Quizzes** to clear the selected quiz, answers, and result. Reopening the quiz must also start with blank answers.

## 5. Outsider authorization test

1. Log out and sign in as `outsider@edunest.demo`.
2. Open the same course AI URL.
3. Refresh or attempt to list quizzes.

Expect a `403` response displayed as:

```text
Not enrolled or instructor
```

The same user is also blocked from querying course evidence.

## Optional OpenAI mode

The deterministic demo is the default. To exercise the optional provider path, create `server/.env` and add:

```dotenv
OPENAI_API_KEY=your-key
EMBEDDING_MODEL=text-embedding-3-small
LLM_MODEL=gpt-4o-mini
```

Restart `npm run demo` and upload the PDF after the key is configured. In this mode, ingestion attempts embeddings, supported tutor questions request a grounded answer, and quiz generation requests structured JSON before validating every question against retrieved chunks.

Never commit `server/.env` or a real key.

## Stop the demo

Press `Ctrl+C` in the terminal running `npm run demo`. The `concurrently -k` script stops both frontend and backend, and the in-memory database is discarded.

