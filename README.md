## EduNest AI

EduNest AI is a full-stack adaptive learning platform built by extending a MERN learning-management foundation with course-grounded AI tutoring, document ingestion, retrieval, citations, and adaptive assessments.

Quick start

1. Clone the repository:

	git clone https://github.com/AyushR97j/StudyNotion-EdTech.git

2. Install dependencies (root and server):

	npm install
	cd server && npm install

3. Start the development servers (root):

	npm start          # starts the React dev server
	npm run server     # starts the backend (or run server/devStart.js for in-memory dev)

4. Open the app at http://localhost:3000

Notes

- This repository is an extension of an existing MERN LMS baseline (StudyNotion). It adds an AI Tutor vertical slice for course-specific PDF ingestion, chunking, retrieval, and source-cited answers.
- Do not store production secrets in the repo; use `.env` and `.env.example`.

If you contributed or spotted an issue, open a PR or issue on the upstream repository.
