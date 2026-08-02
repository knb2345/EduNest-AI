const {
  getCourseRecommendationsForUser,
} = require("../services/courseRecommendationService")

exports.getCourseRecommendations = async (req, res) => {
  try {
    const result = await getCourseRecommendationsForUser(req.user.id, req.query.limit)
    return res.status(200).json({
      success: true,
      ...result,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Could not rank course recommendations",
    })
  }
}
