import { toast } from "react-hot-toast"

import { apiConnector } from "../apiConnector"
const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:4000/api/v1"

function buildCourseUrl(courseId, path) {
  return `${BASE_URL}/ai/course/${courseId}${path}`
}

function buildAuthHeaders(token, extraHeaders = {}) {
  const headers = { ...extraHeaders }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export async function uploadCoursePdf(courseId, file, token) {
  const form = new FormData()
  form.append("file", file)
  return apiConnector("POST", buildCourseUrl(courseId, "/uploadPdf"), form, buildAuthHeaders(token))
}

export async function askCourseTutor(courseId, question, token) {
  return apiConnector("POST", buildCourseUrl(courseId, "/query"), { question }, buildAuthHeaders(token))
}

export async function fetchCourseQuizzes(courseId, token) {
  return apiConnector("GET", buildCourseUrl(courseId, "/quizzes"), null, buildAuthHeaders(token))
}

export async function generateCourseQuiz(courseId, payload, token) {
  return apiConnector("POST", buildCourseUrl(courseId, "/quizzes/generate"), payload, buildAuthHeaders(token))
}

export async function updateCourseQuiz(courseId, quizId, payload, token) {
  return apiConnector("PUT", buildCourseUrl(courseId, `/quizzes/${quizId}`), payload, buildAuthHeaders(token))
}

export async function publishCourseQuiz(courseId, quizId, token) {
  return apiConnector("POST", buildCourseUrl(courseId, `/quizzes/${quizId}/publish`), {}, buildAuthHeaders(token))
}

export async function submitCourseQuiz(courseId, quizId, answers, token) {
  return apiConnector("POST", buildCourseUrl(courseId, `/quizzes/${quizId}/submit`), { answers }, buildAuthHeaders(token))
}

export async function fetchCourseQuiz(courseId, quizId, token) {
  return apiConnector("GET", buildCourseUrl(courseId, `/quizzes/${quizId}`), null, buildAuthHeaders(token))
}

export function toastApiError(error, fallbackMessage) {
  const message = error?.response?.data?.message || fallbackMessage
  toast.error(message)
  return message
}
