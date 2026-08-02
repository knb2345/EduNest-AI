const assert = require("assert")

const { auth } = require("./middleware/auth")
const {
  RECOMMENDATION_CONFIG,
  rankCourseRecommendations,
  resolveLimit,
} = require("./services/courseRecommendationService")

function course(id, overrides = {}) {
  return {
    _id: id,
    courseName: "Course",
    courseDescription: "",
    category: { name: "General", description: "" },
    tag: [],
    ratingAndReviews: [],
    studentsEnroled: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

async function verifyUnauthenticatedRejection() {
  let statusCode = null
  let payload = null
  let calledNext = false
  await auth(
    { cookies: {}, body: {}, header: () => undefined },
    {
      status(code) {
        statusCode = code
        return this
      },
      json(value) {
        payload = value
        return value
      },
    },
    () => {
      calledNext = true
    }
  )
  assert.strictEqual(statusCode, 401)
  assert.strictEqual(payload.success, false)
  assert.strictEqual(calledNext, false)
}

async function run() {
  const enrolled = course("enrolled", {
    courseName: "Python Data Science",
    courseDescription: "Analyze datasets and train machine learning models with Python.",
    category: { name: "Data Science" },
    tag: ["python", "machine learning"],
  })
  const similar = course("similar", {
    courseName: "Applied Machine Learning",
    courseDescription: "Use Python to evaluate machine learning models and datasets.",
    category: { name: "Data Science" },
    tag: ["python", "machine learning"],
  })
  const unrelated = course("unrelated", {
    courseName: "Watercolor Illustration",
    courseDescription: "Mix pigments and paint landscapes on paper.",
    category: { name: "Art" },
    tag: ["painting"],
    ratingAndReviews: [{ rating: 5 }],
    studentsEnroled: ["one", "two", "three"],
  })

  const personalized = rankCourseRecommendations({
    enrolledCourses: [enrolled],
    candidateCourses: [unrelated, enrolled, similar],
    progressByCourse: { enrolled: 0.5 },
    limit: 6,
  })
  const personalizedIds = personalized.recommendations.map((item) => item.course._id)
  assert.ok(!personalizedIds.includes("enrolled"), "enrolled course must be excluded")
  assert.deepStrictEqual(personalizedIds, ["similar", "unrelated"])
  assert.match(personalized.recommendations[0].reason, /Data Science|currently learning/)

  const coldStart = rankCourseRecommendations({
    enrolledCourses: [],
    candidateCourses: [unrelated, similar],
    limit: 6,
  })
  assert.strictEqual(coldStart.coldStart, true)
  assert.ok(coldStart.recommendations.length > 0, "cold start must return courses")
  assert.match(coldStart.recommendations[0].reason, /new students/)

  const manyCandidates = Array.from({ length: 20 }, (_, index) =>
    course(`course-${String(index).padStart(2, "0")}`, {
      courseName: `Course ${String(index).padStart(2, "0")}`,
    })
  )
  const limited = rankCourseRecommendations({
    enrolledCourses: [],
    candidateCourses: manyCandidates,
    limit: 999,
  })
  assert.strictEqual(limited.recommendations.length, RECOMMENDATION_CONFIG.MAX_LIMIT)
  assert.strictEqual(resolveLimit(999), RECOMMENDATION_CONFIG.MAX_LIMIT)

  assert.doesNotThrow(() =>
    rankCourseRecommendations({
      enrolledCourses: [course("history", { courseName: null, tag: "invalid" })],
      candidateCourses: [
        {
          _id: "malformed",
          courseName: null,
          courseDescription: { unexpected: true },
          category: null,
          tag: [null, 42, { invalid: true }],
          ratingAndReviews: [{ rating: "not-a-number" }, null],
          studentsEnroled: "invalid",
          createdAt: "not-a-date",
        },
      ],
    })
  )

  await verifyUnauthenticatedRejection()

  console.log("Enrolled-course exclusion: verified")
  console.log("Similar-over-unrelated ranking: verified")
  console.log("Cold-start fallback: verified")
  console.log(`Maximum limit (${RECOMMENDATION_CONFIG.MAX_LIMIT}): verified`)
  console.log("Malformed metadata safety: verified")
  console.log("Unauthenticated rejection: verified")
}

run().catch((error) => {
  console.error("Recommendation verification failed:", error.message)
  process.exit(1)
})
