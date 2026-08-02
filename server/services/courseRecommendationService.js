const Course = require("../models/Course")
const CourseProgress = require("../models/CourseProgress")
const User = require("../models/User")

const RECOMMENDATION_CONFIG = Object.freeze({
  DEFAULT_LIMIT: 6,
  MAX_LIMIT: 12,
  FIELD_WEIGHTS: Object.freeze({
    title: 3,
    category: 2.5,
    tags: 2,
    description: 1,
    learningOutcomes: 0.75,
    instructions: 0.5,
  }),
  PROFILE_PROGRESS_BOOST: 0.35,
  PERSONALIZED_WEIGHTS: Object.freeze({
    contentSimilarity: 0.93,
    rating: 0.04,
    popularity: 0.02,
    recency: 0.01,
  }),
  COLD_START_WEIGHTS: Object.freeze({
    rating: 0.65,
    popularity: 0.25,
    recency: 0.1,
  }),
})

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "with",
  "you",
  "your",
])

function safeText(value) {
  if (typeof value === "string") return value
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  if (Array.isArray(value)) return value.map(safeText).filter(Boolean).join(" ")
  return ""
}

function tokenize(value) {
  return safeText(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
}

function categoryName(course) {
  if (typeof course?.category === "string") return course.category
  return safeText(course?.category?.name)
}

function categoryText(course) {
  if (typeof course?.category === "string") return course.category
  return [course?.category?.name, course?.category?.description]
    .map(safeText)
    .filter(Boolean)
    .join(" ")
}

function addWeightedTokens(vector, value, weight) {
  for (const token of tokenize(value)) {
    vector[token] = (vector[token] || 0) + weight
  }
}

function buildTermFrequency(course) {
  const vector = {}
  const weights = RECOMMENDATION_CONFIG.FIELD_WEIGHTS
  addWeightedTokens(vector, course?.courseName, weights.title)
  addWeightedTokens(vector, categoryText(course), weights.category)
  addWeightedTokens(vector, course?.tag, weights.tags)
  addWeightedTokens(vector, course?.courseDescription, weights.description)
  addWeightedTokens(vector, course?.whatYouWillLearn, weights.learningOutcomes)
  addWeightedTokens(vector, course?.instructions, weights.instructions)
  return vector
}

function buildIdf(termFrequencies) {
  const documentCount = Math.max(termFrequencies.length, 1)
  const documentFrequency = {}

  for (const vector of termFrequencies) {
    for (const token of Object.keys(vector)) {
      documentFrequency[token] = (documentFrequency[token] || 0) + 1
    }
  }

  return Object.fromEntries(
    Object.entries(documentFrequency).map(([token, frequency]) => [
      token,
      Math.log((documentCount + 1) / (frequency + 1)) + 1,
    ])
  )
}

function applyIdf(termFrequency, idf) {
  return Object.fromEntries(
    Object.entries(termFrequency).map(([token, value]) => [
      token,
      value * (idf[token] || 1),
    ])
  )
}

function cosineSimilarity(left, right) {
  const leftEntries = Object.entries(left)
  if (!leftEntries.length || !Object.keys(right).length) return 0

  let dotProduct = 0
  let leftMagnitude = 0
  let rightMagnitude = 0

  for (const [token, value] of leftEntries) {
    dotProduct += value * (right[token] || 0)
    leftMagnitude += value * value
  }
  for (const value of Object.values(right)) rightMagnitude += value * value

  if (!leftMagnitude || !rightMagnitude) return 0
  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude))
}

function buildStudentProfile(enrolledCourses, vectors, progressByCourse = {}) {
  const profile = {}
  let totalWeight = 0

  for (const course of enrolledCourses) {
    const id = String(course?._id || "")
    const vector = vectors.get(id) || {}
    const progress = progressByCourse[id]
    const reliableProgress =
      Number.isFinite(progress) && progress >= 0 && progress <= 1 ? progress : 0
    const courseWeight = 1 + reliableProgress * RECOMMENDATION_CONFIG.PROFILE_PROGRESS_BOOST

    for (const [token, value] of Object.entries(vector)) {
      profile[token] = (profile[token] || 0) + value * courseWeight
    }
    totalWeight += courseWeight
  }

  if (totalWeight) {
    for (const token of Object.keys(profile)) profile[token] /= totalWeight
  }
  return profile
}

function averageRating(course) {
  const ratings = Array.isArray(course?.ratingAndReviews)
    ? course.ratingAndReviews
        .map((review) => Number(review?.rating ?? review))
        .filter((rating) => Number.isFinite(rating) && rating >= 0 && rating <= 5)
    : []
  if (!ratings.length) return 0
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
}

function enrollmentCount(course) {
  const students = course?.studentsEnroled || course?.studentsEnrolled
  return Array.isArray(students) ? students.length : 0
}

function timestamp(course) {
  const value = new Date(course?.createdAt || 0).getTime()
  return Number.isFinite(value) ? value : 0
}

function titleCase(value) {
  return safeText(value)
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function profileSignals(enrolledCourses) {
  return {
    categories: new Set(
      enrolledCourses.map(categoryName).map((value) => value.toLowerCase()).filter(Boolean)
    ),
    tags: new Set(
      enrolledCourses
        .flatMap((course) => (Array.isArray(course?.tag) ? course.tag : []))
        .map((value) => safeText(value).toLowerCase())
        .filter(Boolean)
    ),
  }
}

function personalizedReason(course, similarity, signals) {
  const category = categoryName(course)
  if (category && signals.categories.has(category.toLowerCase())) {
    return `Matches your interest in ${titleCase(category)}`
  }

  const matchingTag = (Array.isArray(course?.tag) ? course.tag : []).find((tag) =>
    signals.tags.has(safeText(tag).toLowerCase())
  )
  if (matchingTag) return `Matches your interest in ${titleCase(matchingTag)}`
  if (similarity > 0) return "Similar to courses you are currently learning"
  return "A well-rated course outside your current learning topics"
}

function coldStartReason(components) {
  if (components.rating >= components.popularity && components.rating > 0) {
    return "Highly rated course for new students"
  }
  if (components.popularity > 0) return "Popular course for new students"
  return "Recently added course for new students"
}

function resolveLimit(value) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return RECOMMENDATION_CONFIG.DEFAULT_LIMIT
  return Math.min(parsed, RECOMMENDATION_CONFIG.MAX_LIMIT)
}

function rankCourseRecommendations({
  enrolledCourses = [],
  candidateCourses = [],
  progressByCourse = {},
  limit = RECOMMENDATION_CONFIG.DEFAULT_LIMIT,
}) {
  const safeEnrolled = Array.isArray(enrolledCourses) ? enrolledCourses.filter(Boolean) : []
  const enrolledIds = new Set(safeEnrolled.map((course) => String(course?._id || "")))
  const safeCandidates = (Array.isArray(candidateCourses) ? candidateCourses : [])
    .filter(Boolean)
    .filter((course) => !enrolledIds.has(String(course?._id || "")))

  const corpusById = new Map()
  for (const course of [...safeEnrolled, ...safeCandidates]) {
    corpusById.set(String(course?._id || `missing-${corpusById.size}`), course)
  }
  const corpus = [...corpusById.values()]
  const termFrequencies = corpus.map(buildTermFrequency)
  const idf = buildIdf(termFrequencies)
  const vectors = new Map(
    corpus.map((course, index) => [
      String(course?._id || ""),
      applyIdf(termFrequencies[index], idf),
    ])
  )

  const hasHistory = safeEnrolled.length > 0
  const studentProfile = hasHistory
    ? buildStudentProfile(safeEnrolled, vectors, progressByCourse)
    : {}
  const signals = profileSignals(safeEnrolled)
  const maximumEnrollment = Math.max(0, ...safeCandidates.map(enrollmentCount))
  const timestamps = safeCandidates.map(timestamp)
  const oldestTimestamp = timestamps.length ? Math.min(...timestamps) : 0
  const newestTimestamp = timestamps.length ? Math.max(...timestamps) : 0
  const timestampRange = newestTimestamp - oldestTimestamp

  const scored = safeCandidates.map((course) => {
    const id = String(course?._id || "")
    const similarity = hasHistory
      ? Math.max(0, cosineSimilarity(studentProfile, vectors.get(id) || {}))
      : 0
    const rating = averageRating(course)
    const popularity = enrollmentCount(course)
    const normalizedRating = rating / 5
    const normalizedPopularity = maximumEnrollment
      ? Math.log1p(popularity) / Math.log1p(maximumEnrollment)
      : 0
    const normalizedRecency = timestampRange
      ? (timestamp(course) - oldestTimestamp) / timestampRange
      : 0
    const components = {
      contentSimilarity: similarity,
      rating: normalizedRating,
      popularity: normalizedPopularity,
      recency: normalizedRecency,
    }
    const weights = hasHistory
      ? RECOMMENDATION_CONFIG.PERSONALIZED_WEIGHTS
      : RECOMMENDATION_CONFIG.COLD_START_WEIGHTS
    const score = Object.entries(weights).reduce(
      (total, [component, weight]) => total + components[component] * weight,
      0
    )

    return {
      course,
      score,
      components,
      rating,
      popularity,
      reason: hasHistory
        ? personalizedReason(course, similarity, signals)
        : coldStartReason(components),
    }
  })

  scored.sort(
    (left, right) =>
      right.score - left.score ||
      safeText(left.course?.courseName).localeCompare(safeText(right.course?.courseName)) ||
      String(left.course?._id || "").localeCompare(String(right.course?._id || ""))
  )

  return {
    coldStart: !hasHistory,
    recommendations: scored.slice(0, resolveLimit(limit)),
  }
}

function progressRatios(enrolledCourses, progressDocuments) {
  const completedByCourse = new Map(
    progressDocuments.map((progress) => [
      String(progress.courseID || ""),
      Array.isArray(progress.completedVideos) ? progress.completedVideos.length : 0,
    ])
  )
  return Object.fromEntries(
    enrolledCourses
      .map((course) => {
        const totalVideos = (Array.isArray(course?.courseContent) ? course.courseContent : [])
          .flatMap((section) => (Array.isArray(section?.subSection) ? section.subSection : []))
          .length
        const completedVideos = completedByCourse.get(String(course?._id || ""))
        if (!totalVideos || completedVideos === undefined) return null
        return [String(course._id), Math.min(completedVideos / totalVideos, 1)]
      })
      .filter(Boolean)
  )
}

function publicRecommendation(item) {
  const course = item.course
  return {
    _id: course._id,
    courseName: safeText(course.courseName) || "Untitled course",
    courseDescription: safeText(course.courseDescription),
    thumbnail: safeText(course.thumbnail),
    price: Number.isFinite(Number(course.price)) ? Number(course.price) : null,
    category: categoryName(course) || "Uncategorized",
    instructor: course.instructor
      ? {
          firstName: safeText(course.instructor.firstName),
          lastName: safeText(course.instructor.lastName),
        }
      : null,
    averageRating: Number(item.rating.toFixed(1)),
    ratingCount: Array.isArray(course.ratingAndReviews)
      ? course.ratingAndReviews.length
      : 0,
    reason: item.reason,
    score: Number(item.score.toFixed(6)),
    signals: {
      contentSimilarity: Number(item.components.contentSimilarity.toFixed(6)),
      enrollmentCount: item.popularity,
    },
  }
}

async function getCourseRecommendationsForUser(userId, requestedLimit) {
  const user = await User.findById(userId)
    .select("courses")
    .populate({
      path: "courses",
      select:
        "courseName courseDescription whatYouWillLearn tag category instructions courseContent status",
      populate: [
        { path: "category", select: "name description" },
        {
          path: "courseContent",
          select: "subSection",
          populate: { path: "subSection", select: "_id" },
        },
      ],
    })
    .lean()

  if (!user) {
    const error = new Error("User not found")
    error.statusCode = 404
    throw error
  }

  const [courses, progressDocuments] = await Promise.all([
    Course.find({ status: "Published" })
      .select(
        "courseName courseDescription whatYouWillLearn tag category instructions thumbnail price instructor ratingAndReviews studentsEnroled createdAt"
      )
      .populate("category", "name description")
      .populate("instructor", "firstName lastName")
      .populate("ratingAndReviews", "rating")
      .lean(),
    CourseProgress.find({ userId }).select("courseID completedVideos").lean(),
  ])

  const enrolledCourses = (user.courses || []).filter(Boolean)
  const result = rankCourseRecommendations({
    enrolledCourses,
    candidateCourses: courses,
    progressByCourse: progressRatios(enrolledCourses, progressDocuments),
    limit: resolveLimit(requestedLimit),
  })

  return {
    coldStart: result.coldStart,
    limit: resolveLimit(requestedLimit),
    recommendations: result.recommendations.map(publicRecommendation),
  }
}

module.exports = {
  RECOMMENDATION_CONFIG,
  cosineSimilarity,
  getCourseRecommendationsForUser,
  rankCourseRecommendations,
  resolveLimit,
  tokenize,
}
