const express = require("express");
const router = express.Router();
const {
	generatePracticeQuiz,
	getPracticeQuiz,
	listPracticeQuizzes,
	publishPracticeQuiz,
	queryCourse,
	savePracticeQuiz,
	submitPracticeQuiz,
	uploadPdf,
} = require("../controllers/aiTutor");
const { auth } = require("../middleware/auth");

const { chunksCount } = require("../controllers/aiTutor");

router.post("/course/:courseId/uploadPdf", auth, uploadPdf);
router.post("/course/:courseId/query", auth, queryCourse);
router.get("/course/:courseId/chunksCount", auth, chunksCount);
router.get("/course/:courseId/quizzes", auth, listPracticeQuizzes);
router.post("/course/:courseId/quizzes/generate", auth, generatePracticeQuiz);
router.get("/course/:courseId/quizzes/:quizId", auth, getPracticeQuiz);
router.put("/course/:courseId/quizzes/:quizId", auth, savePracticeQuiz);
router.post("/course/:courseId/quizzes/:quizId/publish", auth, publishPracticeQuiz);
router.post("/course/:courseId/quizzes/:quizId/submit", auth, submitPracticeQuiz);

module.exports = router;
