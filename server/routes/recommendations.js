const express = require("express")

const { getCourseRecommendations } = require("../controllers/recommendations")
const { auth } = require("../middleware/auth")

const router = express.Router()

router.get("/courses", auth, getCourseRecommendations)

module.exports = router
