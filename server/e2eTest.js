const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const baseUrl = process.env.BASE_URL || "http://localhost:4001/api/v1";
const password = "Demo123!";
const emails = {
  instructor: "instructor@edunest.demo",
  student: "student@edunest.demo",
  outsider: "outsider@edunest.demo",
};

async function login(email) {
  const response = await axios.post(`${baseUrl}/auth/login`, {
    email,
    password,
  });
  if (!response.data.success || !response.data.token) {
    throw new Error(`Login failed for ${email}`);
  }
  return response.data;
}

async function run() {
  const tokenFile = path.join(__dirname, "ai_test_info.json");
  if (fs.existsSync(tokenFile)) {
    throw new Error("Forbidden token file exists: server/ai_test_info.json");
  }

  const oidcStatusResponse = await axios.get(`${baseUrl}/auth/google/status`);
  if (!oidcStatusResponse.data.success) {
    throw new Error("Google OIDC status route failed");
  }
  if (
    !process.env.GOOGLE_CLIENT_ID &&
    !process.env.GOOGLE_CLIENT_SECRET &&
    !process.env.GOOGLE_REDIRECT_URI &&
    oidcStatusResponse.data.enabled !== false
  ) {
    throw new Error("Google OIDC should be disabled when credentials are absent");
  }

  const instructorLogin = await login(emails.instructor);
  const studentLogin = await login(emails.student);
  const outsiderLogin = await login(emails.outsider);

  const coursesResponse = await axios.get(`${baseUrl}/course/getAllCourses`);
  const courses = coursesResponse.data.data || [];
  const first = courses.find((course) => course.courseName === "EduNest AI Demo Course");
  const second = courses.find((course) => course.courseName === "Course Isolation Demo");
  if (!first || !second) throw new Error("Expected demo courses were not seeded");

  const detailsResponse = await axios.post(`${baseUrl}/course/getCourseDetails`, {
    courseId: first._id,
  });
  const details = detailsResponse.data.data.courseDetails;
  const enrolledIds = details.studentsEnroled.map(String);

  if (String(details.instructor._id) !== String(instructorLogin.user._id)) {
    throw new Error("Instructor does not own the first course");
  }
  if (!enrolledIds.includes(String(studentLogin.user._id))) {
    throw new Error("Demo student is not enrolled in the first course");
  }
  if (enrolledIds.includes(String(outsiderLogin.user._id))) {
    throw new Error("Demo outsider must not be enrolled");
  }
  if (String(first._id) === String(second._id)) {
    throw new Error("Demo courses are not isolated records");
  }

  const form = new FormData();
  form.append(
    "file",
    fs.createReadStream(path.join(__dirname, "../sample/edunest_sample.pdf"))
  );
  const uploadResponse = await axios.post(
    `${baseUrl}/ai/course/${first._id}/uploadPdf`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${instructorLogin.token}`,
      },
    }
  );
  if (!uploadResponse.data.success) {
    throw new Error("Demo PDF upload failed");
  }

  const supportedResponse = await axios.post(
    `${baseUrl}/ai/course/${first._id}/query`,
    { question: "When was EduNest AI launched?" },
    { headers: { Authorization: `Bearer ${studentLogin.token}` } }
  );
  const supported = supportedResponse.data;
  if (process.env.OPENAI_API_KEY) {
    if (supported.mode !== "llm") {
      throw new Error(`Expected LLM mode, received ${supported.mode}`);
    }
  } else if (
    supported.mode !== "source_preview" ||
    supported.fallback !== "no_api_key"
  ) {
    throw new Error("Expected no-key source-preview mode");
  }
  if (!supported.citations?.length) {
    throw new Error("Supported answer did not include citations");
  }

  const unsupportedResponse = await axios.post(
    `${baseUrl}/ai/course/${first._id}/query`,
    { question: "Who is the chief executive officer of Acme Robotics?" },
    { headers: { Authorization: `Bearer ${studentLogin.token}` } }
  );
  if (unsupportedResponse.data.mode !== "insufficient_evidence") {
    throw new Error("Unsupported question did not return insufficient evidence");
  }

  const quizGenerateResponse = await axios.post(
    `${baseUrl}/ai/course/${first._id}/quizzes/generate`,
    {
      title: "Demo Evidence Quiz",
      questionCount: 3,
      difficulty: "easy",
      questionTypes: ["short_answer"],
    },
    { headers: { Authorization: `Bearer ${instructorLogin.token}` } }
  );
  const instructorQuiz = quizGenerateResponse.data.quiz;
  if (
    !quizGenerateResponse.data.success ||
    instructorQuiz.status !== "draft" ||
    instructorQuiz.questions.length !== 3
  ) {
    throw new Error("Instructor quiz draft generation failed");
  }

  const quizId = instructorQuiz._id;
  const publishResponse = await axios.post(
    `${baseUrl}/ai/course/${first._id}/quizzes/${quizId}/publish`,
    {},
    { headers: { Authorization: `Bearer ${instructorLogin.token}` } }
  );
  if (publishResponse.data.quiz.status !== "published") {
    throw new Error("Quiz publication failed");
  }

  const studentQuizResponse = await axios.get(
    `${baseUrl}/ai/course/${first._id}/quizzes/${quizId}`,
    { headers: { Authorization: `Bearer ${studentLogin.token}` } }
  );
  const studentQuiz = studentQuizResponse.data.quiz;
  if (
    studentQuiz.questions.some(
      (question) =>
        Object.prototype.hasOwnProperty.call(question, "correctAnswer") ||
        Object.prototype.hasOwnProperty.call(question, "explanation")
    )
  ) {
    throw new Error("Student quiz exposed answers before submission");
  }

  const answers = Object.fromEntries(
    instructorQuiz.questions.map((question) => [
      String(question._id),
      question.correctAnswer,
    ])
  );
  const submissionResponse = await axios.post(
    `${baseUrl}/ai/course/${first._id}/quizzes/${quizId}/submit`,
    { answers },
    { headers: { Authorization: `Bearer ${studentLogin.token}` } }
  );
  if (
    submissionResponse.data.score !== 3 ||
    submissionResponse.data.total !== 3 ||
    submissionResponse.data.results.some(
      (result) => !result.isCorrect || !result.explanation || !result.citations.length
    )
  ) {
    throw new Error("Backend quiz scoring, explanations, or citations failed");
  }

  try {
    await axios.get(`${baseUrl}/ai/course/${first._id}/quizzes`, {
      headers: { Authorization: `Bearer ${outsiderLogin.token}` },
    });
    throw new Error("Outsider quiz access unexpectedly succeeded");
  } catch (error) {
    if (error.response?.status !== 403) throw error;
  }

  try {
    await axios.get(`${baseUrl}/ai/course/${second._id}/quizzes/${quizId}`, {
      headers: { Authorization: `Bearer ${instructorLogin.token}` },
    });
    throw new Error("Cross-course quiz access unexpectedly succeeded");
  } catch (error) {
    if (error.response?.status !== 404) throw error;
  }

  const logoutResponse = await axios.post(`${baseUrl}/auth/logout`);
  const logoutCookies = logoutResponse.headers["set-cookie"] || [];
  if (!logoutResponse.data.success || !logoutCookies.some((cookie) => cookie.startsWith("token=;"))) {
    throw new Error("Logout did not clear the application session cookie");
  }

  console.log("Instructor login: verified");
  console.log("Student login: verified");
  console.log("Outsider login: verified");
  console.log("First course ownership and enrollment: verified");
  console.log("Outsider non-enrollment: verified");
  console.log("Second course separation: verified");
  console.log("Token/secret file absence: verified");
  console.log(
    process.env.OPENAI_API_KEY
      ? "Grounded LLM answer with citations: verified"
      : "No-key source preview with citations: verified"
  );
  console.log("Unsupported question abstention: verified");
  console.log("OIDC-disabled status route: verified");
  console.log("Instructor quiz draft and publication: verified");
  console.log("Student-safe quiz payload: verified");
  console.log("Backend 3/3 scoring with explanations and citations: verified");
  console.log("Outsider and cross-course quiz isolation: verified");
  console.log("Application session cookie logout: verified");
}

run().catch((error) => {
  console.error("Demo verification failed:", error.response?.data || error.message);
  process.exit(1);
});
