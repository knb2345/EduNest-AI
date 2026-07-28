const express = require("express");
const router = express.Router();
const { uploadPdf, queryCourse } = require("../controllers/aiTutor");
const { auth } = require("../middleware/auth");

const { chunksCount } = require("../controllers/aiTutor");

router.post("/course/:courseId/uploadPdf", auth, uploadPdf);
router.post("/course/:courseId/query", auth, queryCourse);
router.get("/course/:courseId/chunksCount", auth, chunksCount);

module.exports = router;
