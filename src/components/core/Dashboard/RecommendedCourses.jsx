import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { getCourseRecommendations } from "../../../services/operations/studentFeaturesAPI"

function RecommendationSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-richblack-700 bg-richblack-800">
      <div className="h-36 animate-pulse bg-richblack-700" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-richblack-700" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-richblack-700" />
        <div className="h-8 animate-pulse rounded bg-richblack-700" />
      </div>
    </div>
  )
}

function CourseThumbnail({ course }) {
  if (course.thumbnail) {
    return (
      <img
        src={course.thumbnail}
        alt={`${course.courseName} thumbnail`}
        className="h-36 w-full object-cover"
      />
    )
  }

  return (
    <div
      className="flex h-36 items-center justify-center bg-gradient-to-br from-blue-700 to-richblack-700 px-5 text-center text-lg font-semibold text-richblack-5"
      role="img"
      aria-label={`${course.courseName} thumbnail placeholder`}
    >
      {course.courseName}
    </div>
  )
}

export default function RecommendedCourses({ token }) {
  const [state, setState] = useState({
    loading: true,
    error: "",
    coldStart: false,
    courses: [],
  })

  const loadRecommendations = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }))
    try {
      const response = await getCourseRecommendations(token, 6)
      setState({
        loading: false,
        error: "",
        coldStart: Boolean(response.coldStart),
        courses: response.recommendations || [],
      })
    } catch (_error) {
      setState({
        loading: false,
        error: "Recommendations are temporarily unavailable.",
        coldStart: false,
        courses: [],
      })
    }
  }, [token])

  useEffect(() => {
    loadRecommendations()
  }, [loadRecommendations])

  return (
    <section className="mt-12" aria-labelledby="recommended-courses-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="recommended-courses-heading"
            className="text-3xl font-semibold text-richblack-5"
          >
            Recommended for You
          </h2>
          <p className="mt-1 text-sm text-richblack-300">
            Ranked from your course interests and available catalog signals.
          </p>
        </div>
        {state.coldStart && !state.loading && (
          <span className="rounded-full bg-blue-800 px-3 py-1 text-xs font-medium text-blue-100">
            New-student picks
          </span>
        )}
      </div>

      {state.loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <RecommendationSkeleton key={index} />
          ))}
        </div>
      ) : state.error ? (
        <div className="rounded-xl border border-pink-700 bg-richblack-800 p-5 text-richblack-100">
          <p>{state.error}</p>
          <button
            type="button"
            className="mt-3 rounded-md bg-yellow-50 px-4 py-2 text-sm font-semibold text-richblack-900"
            onClick={loadRecommendations}
          >
            Try again
          </button>
        </div>
      ) : !state.courses.length ? (
        <div className="rounded-xl border border-richblack-700 bg-richblack-800 p-6 text-richblack-200">
          No published courses are available to recommend yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {state.courses.map((course) => (
            <article
              key={course._id}
              className="flex overflow-hidden rounded-xl border border-richblack-700 bg-richblack-800 transition hover:-translate-y-0.5 hover:border-richblack-500"
            >
              <Link
                to={`/courses/${course._id}`}
                className="flex w-full flex-col focus:outline-none focus:ring-2 focus:ring-yellow-50"
                aria-label={`View ${course.courseName}`}
              >
                <CourseThumbnail course={course} />
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-yellow-50">
                    {course.category}
                  </p>
                  <h3 className="mt-1 line-clamp-2 text-lg font-semibold text-richblack-5">
                    {course.courseName}
                  </h3>
                  {course.instructor && (
                    <p className="mt-1 text-sm text-richblack-300">
                      {course.instructor.firstName} {course.instructor.lastName}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-2 text-sm text-richblack-100">
                    <span>
                      {course.ratingCount
                        ? `${course.averageRating.toFixed(1)} ★`
                        : "New course"}
                    </span>
                    {course.price !== null && (
                      <span className="font-semibold">
                        {course.price === 0 ? "Free" : `Rs. ${course.price}`}
                      </span>
                    )}
                  </div>
                  <p className="mt-4 border-t border-richblack-700 pt-3 text-sm text-blue-100">
                    {course.reason}
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
