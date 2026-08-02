import React, { useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"

import {
  askCourseTutor,
  fetchCourseQuiz,
  fetchCourseQuizzes,
  generateCourseQuiz,
  publishCourseQuiz,
  submitCourseQuiz,
  updateCourseQuiz,
  uploadCoursePdf,
} from "../services/operations/aiTutorAPI"

function CourseAI() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.profile)
  const { token } = useSelector((state) => state.auth)

  const isInstructor = user?.accountType === "Instructor"

  const [activeTab, setActiveTab] = useState("tutor")
  const [file, setFile] = useState(null)
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [asking, setAsking] = useState(false)
  const [status, setStatus] = useState({ type: "idle", text: "Upload a PDF and ask a course question." })
  const [lastMode, setLastMode] = useState(null)

  const [quizList, setQuizList] = useState([])
  const [loadingQuizzes, setLoadingQuizzes] = useState(false)
  const [selectedQuizId, setSelectedQuizId] = useState("")
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [draftQuiz, setDraftQuiz] = useState(null)
  const [loadingQuiz, setLoadingQuiz] = useState(false)
  const [generatingQuiz, setGeneratingQuiz] = useState(false)
  const [savingQuiz, setSavingQuiz] = useState(false)
  const [publishingQuiz, setPublishingQuiz] = useState(false)
  const [submittingQuiz, setSubmittingQuiz] = useState(false)
  const [quizMessage, setQuizMessage] = useState({ type: "idle", text: "Generate a draft quiz from the uploaded course material." })
  const [quizMode, setQuizMode] = useState("")
  const [quizConfig, setQuizConfig] = useState({
    questionCount: 3,
    difficulty: "mixed",
    includeMultipleChoice: true,
    includeShortAnswer: true,
  })
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizResult, setQuizResult] = useState(null)

  const tutorRef = useRef(null)
  const quizRef = useRef(null)
  const submissionInFlightRef = useRef(false)

  const statusClasses = {
    idle: "border-richblack-700 bg-richblack-800 text-richblack-300",
    info: "border-blue-600/40 bg-blue-600/10 text-blue-100",
    success: "border-green-600/40 bg-green-600/10 text-green-100",
    warning: "border-yellow-500/40 bg-yellow-500/10 text-yellow-100",
    error: "border-red-600/40 bg-red-600/10 text-red-100",
  }

  const quizStatusClasses = {
    idle: "border-richblack-700 bg-richblack-800 text-richblack-300",
    info: "border-blue-600/40 bg-blue-600/10 text-blue-100",
    success: "border-green-600/40 bg-green-600/10 text-green-100",
    warning: "border-yellow-500/40 bg-yellow-500/10 text-yellow-100",
    error: "border-red-600/40 bg-red-600/10 text-red-100",
  }

  const visibleQuiz = draftQuiz || selectedQuiz
  const canEditQuiz = isInstructor && draftQuiz?.status === "draft"
  const publishedQuizzes = quizList.filter((quiz) => quiz.status === "published")
  const draftQuizzes = quizList.filter((quiz) => quiz.status === "draft")
  const currentQuestionCount = visibleQuiz?.questions?.length || 0

  const answeredCount = visibleQuiz?.questions?.reduce((count, questionItem) => {
    const answer = quizAnswers[String(questionItem._id)]
    return answer !== undefined && String(answer).trim() !== "" ? count + 1 : count
  }, 0) || 0
  const allQuestionsAnswered = currentQuestionCount > 0 && answeredCount === currentQuestionCount

  const normalizeQuestionDraft = (questionItem, index) => ({
    _id: questionItem._id,
    type: questionItem.type || "short_answer",
    question: questionItem.question || "",
    options: Array.isArray(questionItem.options) ? questionItem.options : [],
    correctAnswer: questionItem.correctAnswer || "",
    explanation: questionItem.explanation || "",
    difficulty: questionItem.difficulty || quizConfig.difficulty,
    sourceChunkIds: Array.isArray(questionItem.sourceChunkIds) ? questionItem.sourceChunkIds : [],
    citations: Array.isArray(questionItem.citations) ? questionItem.citations : [],
    _localId: questionItem._localId || `${index}`,
  })

  const loadQuizzes = async () => {
    if (!token) return
    setLoadingQuizzes(true)
    try {
      const response = await fetchCourseQuizzes(courseId, token)
      const quizzes = response.data?.quizzes || []
      setQuizList(quizzes)
      if (!selectedQuizId && quizzes.length) {
        setSelectedQuizId(String(quizzes[0]._id))
      }
    } catch (err) {
      console.error(err)
      setQuizMessage({ type: "error", text: err?.response?.data?.message || "Could not load quizzes." })
    }
    setLoadingQuizzes(false)
  }

  useEffect(() => {
    loadQuizzes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, token])

  useEffect(() => {
    if (!selectedQuizId || !token) return

    let ignore = false

    const loadSelectedQuiz = async () => {
      setLoadingQuiz(true)
      try {
        const response = await fetchCourseQuiz(courseId, selectedQuizId, token)
        if (ignore) return
        const quiz = response.data.quiz
        setSelectedQuiz(quiz)
        setDraftQuiz(isInstructor && quiz.status === "draft" ? {
          ...quiz,
          questions: (quiz.questions || []).map((questionItem, index) => normalizeQuestionDraft(questionItem, index)),
        } : null)
        setQuizAnswers({})
        setQuizResult(null)
      } catch (err) {
        if (ignore) return
        console.error(err)
        setQuizMessage({ type: "error", text: err?.response?.data?.message || "Could not load the selected quiz." })
        setSelectedQuiz(null)
        setDraftQuiz(null)
      }
      if (!ignore) setLoadingQuiz(false)
    }

    loadSelectedQuiz()
    return () => {
      ignore = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, selectedQuizId, token, isInstructor])

  const selectQuiz = (quizId) => {
    setSelectedQuizId(quizId)
    setSelectedQuiz(null)
    setDraftQuiz(null)
    setQuizAnswers({})
    setQuizResult(null)
    setQuizMode("")
    setQuizMessage({
      type: "idle",
      text: quizId ? "Loading selected quiz..." : "Choose a quiz to begin.",
    })
  }

  const uploadPdf = async () => {
    if (!file) return
    setUploading(true)
    setStatus({ type: "info", text: `Uploading ${file.name}...` })
    try {
      const response = await uploadCoursePdf(courseId, file, token)
      setStatus({
        type: "success",
        text:
          response.data.created > 0
            ? `Upload successful. Indexed ${response.data.created} chunk${response.data.created === 1 ? "" : "s"}.`
            : response.data.message || "Document already uploaded.",
      })
      await loadQuizzes()
    } catch (err) {
      console.error(err)
      setStatus({ type: "error", text: err?.response?.data?.message || "Upload failed. Please use a PDF file." })
    }
    setUploading(false)
  }

  const askQuestion = async () => {
    if (!question.trim()) return
    setAsking(true)
    setStatus({ type: "info", text: "Searching course chunks..." })
    try {
      const response = await askCourseTutor(courseId, question, token)
      if (response.data.success) {
        setLastMode(response.data.mode)
        if (response.data.mode === "llm") {
          const answerText = response.data.answer?.text || response.data.answer || ""
          setMessages((current) => [...current, {
            role: "assistant",
            label: "AI answer grounded in course material",
            text: answerText,
            citations: response.data.citations,
          }])
          setStatus({ type: "success", text: "AI answer grounded in course material." })
        } else if (response.data.mode === "source_preview") {
          const previewText = (response.data.previews || [])
            .map((preview) => `(${preview.docName}:${preview.pageNumber}) ${preview.text}`)
            .join("\n---\n")
          setMessages((current) => [...current, {
            role: "assistant",
            label: response.data.fallback === "llm_error" ? "Source preview — AI request failed" : "Source preview — no AI key configured",
            text: previewText,
            citations: response.data.citations,
          }])
          setStatus({ type: "success", text: response.data.fallback === "llm_error" ? "LLM failed, showing source preview." : "Source preview from retrieved course chunks." })
        } else {
          setMessages((current) => [...current, {
            role: "assistant",
            label: "Insufficient evidence",
            text: "Insufficient evidence in course materials.",
            citations: [],
          }])
          setStatus({ type: "warning", text: "Insufficient evidence in the uploaded course material." })
        }
      }
    } catch (err) {
      console.error(err)
      setStatus({ type: "error", text: err?.response?.data?.message || "Query failed. Please try again." })
    }
    setAsking(false)
    setQuestion("")
  }

  const updateDraftOption = (questionIndex, optionIndex, value) => {
    setDraftQuiz((current) => {
      if (!current) return current
      const questions = current.questions.map((questionItem, index) => {
        if (index !== questionIndex) return questionItem
        const options = [...(questionItem.options || [])]
        options[optionIndex] = value
        return { ...questionItem, options }
      })
      return { ...current, questions }
    })
  }

  const deleteDraftQuestion = (questionIndex) => {
    setDraftQuiz((current) => {
      if (!current) return current
      return { ...current, questions: current.questions.filter((_, index) => index !== questionIndex) }
    })
  }

  const generateQuiz = async () => {
    if (!token) return
    const questionTypes = []
    if (quizConfig.includeMultipleChoice) questionTypes.push("multiple_choice")
    if (quizConfig.includeShortAnswer) questionTypes.push("short_answer")
    if (!questionTypes.length) {
      setQuizMessage({ type: "error", text: "Select at least one question type." })
      return
    }

    setGeneratingQuiz(true)
    setQuizMessage({ type: "info", text: "Generating a draft quiz from retrieved course evidence..." })
    try {
      const response = await generateCourseQuiz(courseId, {
        title: `${selectedQuiz?.title || "Practice Quiz"}`,
        questionCount: Number(quizConfig.questionCount),
        difficulty: quizConfig.difficulty,
        questionTypes,
      }, token)
      const quiz = response.data.quiz
      setQuizMode(response.data.mode === "llm" ? "LLM-generated draft" : "Locally generated fallback draft")
      setSelectedQuizId(String(quiz._id))
      setSelectedQuiz(quiz)
      setDraftQuiz({
        ...quiz,
        questions: (quiz.questions || []).map((questionItem, index) => normalizeQuestionDraft(questionItem, index)),
      })
      setQuizAnswers({})
      setQuizResult(null)
      setQuizMessage({
        type: "success",
        text: response.data.mode === "llm"
          ? "Draft quiz generated from retrieved course evidence. Review before publishing."
          : "Locally generated practice quiz created from clear factual sentences in the uploaded material.",
      })
      await loadQuizzes()
    } catch (err) {
      console.error(err)
      setQuizMessage({ type: "error", text: err?.response?.data?.message || "Quiz generation failed." })
    }
    setGeneratingQuiz(false)
  }

  const saveQuiz = async () => {
    if (!token || !draftQuiz || !selectedQuizId) return
    setSavingQuiz(true)
    setQuizMessage({ type: "info", text: "Saving quiz draft..." })
    try {
      const response = await updateCourseQuiz(courseId, selectedQuizId, {
        title: draftQuiz.title,
        questions: draftQuiz.questions,
      }, token)
      const quiz = response.data.quiz
      setSelectedQuiz(quiz)
      setDraftQuiz({
        ...quiz,
        questions: (quiz.questions || []).map((questionItem, index) => normalizeQuestionDraft(questionItem, index)),
      })
      setQuizMessage({ type: "success", text: "Draft quiz saved." })
      await loadQuizzes()
    } catch (err) {
      console.error(err)
      setQuizMessage({ type: "error", text: err?.response?.data?.message || "Quiz save failed." })
    }
    setSavingQuiz(false)
  }

  const publishQuiz = async () => {
    if (!token || !selectedQuizId) return
    setPublishingQuiz(true)
    setQuizMessage({ type: "info", text: "Publishing quiz..." })
    try {
      const response = await publishCourseQuiz(courseId, selectedQuizId, token)
      setSelectedQuiz(response.data.quiz)
      setDraftQuiz(null)
      setQuizMessage({ type: "success", text: "Quiz published and visible to enrolled students." })
      await loadQuizzes()
    } catch (err) {
      console.error(err)
      setQuizMessage({ type: "error", text: err?.response?.data?.message || "Quiz publish failed." })
    }
    setPublishingQuiz(false)
  }

  const submitQuiz = async () => {
    if (!token || !selectedQuizId || submissionInFlightRef.current || !allQuestionsAnswered) return
    submissionInFlightRef.current = true
    setSubmittingQuiz(true)
    setQuizMessage({ type: "info", text: "Submitting quiz..." })
    try {
      const response = await submitCourseQuiz(courseId, selectedQuizId, quizAnswers, token)
      setQuizResult(response.data)
      setQuizMessage({ type: "success", text: `Quiz submitted. Score: ${response.data.score}/${response.data.total}.` })
    } catch (err) {
      console.error(err)
      setQuizMessage({ type: "error", text: err?.response?.data?.message || "Quiz submission failed." })
    }
    submissionInFlightRef.current = false
    setSubmittingQuiz(false)
  }

  const tryQuizAgain = () => {
    setQuizAnswers({})
    setQuizResult(null)
    setQuizMessage({ type: "idle", text: "Answers cleared. Try the quiz again." })
  }

  const backToQuizzes = () => {
    selectQuiz("")
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 text-richblack-5 sm:py-8">
      <div className="mb-6 rounded-2xl border border-richblack-700 bg-richblack-800 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.25)] sm:p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-yellow-25">Course AI Tutor</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">Ask questions from course documents</h2>
            <p className="mt-2 max-w-2xl text-richblack-300">
              Upload a PDF for the course, then ask a question. Generate a course-grounded practice quiz from the same evidence.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-wrap">
            <button className={activeTab === "tutor" ? "yellowButton" : "blackButton"} onClick={() => setActiveTab("tutor")}>AI Tutor</button>
            <button className={activeTab === "quiz" ? "yellowButton" : "blackButton"} onClick={() => setActiveTab("quiz")}>Practice Quiz</button>
            <button className="blackButton col-span-2 sm:col-auto" onClick={() => navigate(`/courses/${courseId}`)}>Back to course</button>
          </div>
        </div>
      </div>

      <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${statusClasses[status.type]}`}>{status.text}</div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button className="blackButton" onClick={() => tutorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>Tutor section</button>
        <button className="blackButton" onClick={() => quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>Practice quiz section</button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section ref={tutorRef} className="min-w-0 scroll-mt-20 rounded-2xl border border-richblack-700 bg-richblack-900 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold">AI Tutor</h3>
              <p className="mt-2 text-sm text-richblack-300">Answers stay grounded in retrieved course chunks.</p>
            </div>
            <span className="rounded-full border border-richblack-600 px-3 py-1 text-xs text-richblack-200">{user?.accountType || "Guest"}</span>
          </div>

          {isInstructor ? (
            <div className="mt-5 rounded-lg border border-richblack-700 bg-richblack-800 p-4 text-sm text-richblack-300">
              Instructor-only upload. Add a PDF to index course-scoped evidence before quiz generation.
              <label className="mt-4 block text-sm font-medium text-richblack-200">Choose PDF</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="mt-2 block w-full rounded-lg border border-richblack-600 bg-richblack-700 px-3 py-2 text-sm text-richblack-5 file:mr-4 file:rounded-full file:border-0 file:bg-yellow-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-richblack-900"
              />
              {file ? <p className="mt-2 text-sm text-richblack-200">Selected: {file.name}</p> : null}
              <button onClick={uploadPdf} disabled={uploading || !file} className="mt-4 yellowButton w-full">
                {uploading ? "Uploading..." : file ? `Upload ${file.name}` : "Upload PDF"}
              </button>
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-richblack-700 bg-richblack-800 p-4 text-sm text-richblack-300">
              Students can query the indexed course material after enrollment. If no LLM key is configured, the tutor stays in source-preview mode.
            </div>
          )}

          <label className="mt-5 block text-sm font-medium text-richblack-200">Ask a question</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="When was EduNest AI launched?"
            className="mt-2 min-h-[140px] w-full rounded-lg border border-richblack-600 bg-richblack-700 px-3 py-3 text-sm text-richblack-5 outline-none placeholder:text-richblack-400 focus:border-yellow-25"
          />
          <button onClick={askQuestion} disabled={asking || !question.trim()} className="mt-4 yellowButton w-full">
            {asking ? "Asking..." : "Ask question"}
          </button>

          <div className="mt-6 space-y-4">
            {messages.length === 0 ? (
              <div className="rounded-lg border border-dashed border-richblack-700 p-4 text-sm text-richblack-300">Questions you ask will appear here with mode labels and citations.</div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className="rounded-xl border border-richblack-700 bg-richblack-800 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold uppercase tracking-[0.18em] text-yellow-25">{message.role}</span>
                    {message.label ? <span className="rounded-full border border-richblack-600 px-3 py-1 text-xs text-richblack-200">{message.label}</span> : null}
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-6 text-richblack-25">{message.text}</div>
                  {message.citations?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {message.citations.map((citation, citationIndex) => (
                        <span key={`${citation.docName}-${citation.pageNumber}-${citationIndex}`} className="rounded-full border border-yellow-25/30 bg-yellow-25/10 px-3 py-1 text-xs font-medium text-yellow-5">
                          {citation.docName} · page {citation.pageNumber}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>

          {lastMode ? <p className="mt-4 text-xs uppercase tracking-[0.2em] text-richblack-400">Last mode: {lastMode}</p> : null}
        </section>

        <section ref={quizRef} className="min-w-0 scroll-mt-20 rounded-2xl border border-richblack-700 bg-richblack-900 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold">Practice Quiz</h3>
              <p className="mt-2 text-sm text-richblack-300">
                {isInstructor ? "Generate a draft quiz, edit it, then publish after review." : "Open published quizzes, answer them, and submit for scoring."}
              </p>
            </div>
            <button className="blackButton" onClick={loadQuizzes} disabled={loadingQuizzes}>{loadingQuizzes ? "Refreshing..." : "Refresh quizzes"}</button>
          </div>

          <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${quizStatusClasses[quizMessage.type]}`}>{quizMessage.text}</div>

          {isInstructor ? (
            <div className="mt-5 grid gap-4 rounded-xl border border-richblack-700 bg-richblack-800 p-4 md:grid-cols-2">
              <label className="text-sm text-richblack-200">
                Number of questions
                <select value={quizConfig.questionCount} onChange={(e) => setQuizConfig((current) => ({ ...current, questionCount: Number(e.target.value) }))} className="mt-2 w-full rounded-lg border border-richblack-600 bg-richblack-700 px-3 py-2 text-sm">
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                </select>
              </label>
              <label className="text-sm text-richblack-200">
                Difficulty
                <select value={quizConfig.difficulty} onChange={(e) => setQuizConfig((current) => ({ ...current, difficulty: e.target.value }))} className="mt-2 w-full rounded-lg border border-richblack-600 bg-richblack-700 px-3 py-2 text-sm">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="mixed">Mixed</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-richblack-200">
                <input type="checkbox" checked={quizConfig.includeMultipleChoice} onChange={(e) => setQuizConfig((current) => ({ ...current, includeMultipleChoice: e.target.checked }))} />
                Multiple choice
              </label>
              <label className="flex items-center gap-2 text-sm text-richblack-200">
                <input type="checkbox" checked={quizConfig.includeShortAnswer} onChange={(e) => setQuizConfig((current) => ({ ...current, includeShortAnswer: e.target.checked }))} />
                Short answer
              </label>
              <button onClick={generateQuiz} disabled={generatingQuiz} className="yellowButton md:col-span-2">{generatingQuiz ? "Generating..." : "Generate Practice Quiz"}</button>
            </div>
          ) : null}

          <div className="mt-5">
            <label className="block text-sm font-medium text-richblack-200">Select a quiz</label>
            <select value={selectedQuizId} onChange={(e) => selectQuiz(e.target.value)} className="mt-2 w-full rounded-lg border border-richblack-600 bg-richblack-700 px-3 py-2 text-sm">
              <option value="">Choose a quiz</option>
              {(isInstructor ? quizList : publishedQuizzes).map((quiz) => (
                <option key={quiz._id} value={quiz._id}>{quiz.title} ({quiz.status})</option>
              ))}
            </select>
            {isInstructor && draftQuizzes.length ? <p className="mt-2 text-xs text-richblack-400">Draft quizzes stay hidden from students until published.</p> : null}
          </div>

          {loadingQuiz ? (
            <div className="mt-5 rounded-lg border border-dashed border-richblack-700 p-4 text-sm text-richblack-300">Loading quiz...</div>
          ) : visibleQuiz ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-richblack-700 bg-richblack-800 p-4">
                <label className="block text-sm font-medium text-richblack-200">Quiz title</label>
                <input value={draftQuiz?.title ?? visibleQuiz.title} disabled={!canEditQuiz} onChange={(e) => setDraftQuiz((current) => (current ? { ...current, title: e.target.value } : current))} className="mt-2 w-full rounded-lg border border-richblack-600 bg-richblack-700 px-3 py-2 text-sm disabled:opacity-70" />
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-richblack-300">
                  <span className="rounded-full border border-richblack-600 px-3 py-1">Status: {visibleQuiz.status}</span>
                  <span className="rounded-full border border-richblack-600 px-3 py-1">Questions: {currentQuestionCount}</span>
                  {quizMode ? <span className="rounded-full border border-richblack-600 px-3 py-1">Mode: {quizMode}</span> : null}
                </div>
              </div>

              {(draftQuiz && canEditQuiz ? draftQuiz.questions : visibleQuiz.questions || []).map((questionItem, index) => {
                const questionId = String(questionItem._id)
                const answerValue = quizAnswers[questionId] ?? ""
                const resultItem = quizResult?.results?.find((item) => item.questionId === questionId)
                return (
                  <div key={questionId} className="rounded-xl border border-richblack-700 bg-richblack-800 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="text-sm uppercase tracking-[0.18em] text-yellow-25">Question {index + 1}</div>
                      <div className="flex flex-wrap gap-2 text-xs text-richblack-300">
                        <span className="rounded-full border border-richblack-600 px-3 py-1">{questionItem.type}</span>
                        <span className="rounded-full border border-richblack-600 px-3 py-1">{questionItem.difficulty || quizConfig.difficulty}</span>
                      </div>
                    </div>

                    {canEditQuiz ? (
                      <>
                        <label className="mt-3 block text-sm text-richblack-200">Question</label>
                        <textarea value={questionItem.question} onChange={(e) => setDraftQuiz((current) => {
                          if (!current) return current
                          const questions = current.questions.map((item, qIndex) => qIndex === index ? { ...item, question: e.target.value } : item)
                          return { ...current, questions }
                        })} className="mt-2 min-h-[92px] w-full rounded-lg border border-richblack-600 bg-richblack-700 px-3 py-2 text-sm" />
                        <label className="mt-3 block text-sm text-richblack-200">Correct answer</label>
                        <input value={questionItem.correctAnswer} onChange={(e) => setDraftQuiz((current) => {
                          if (!current) return current
                          const questions = current.questions.map((item, qIndex) => qIndex === index ? { ...item, correctAnswer: e.target.value } : item)
                          return { ...current, questions }
                        })} className="mt-2 w-full rounded-lg border border-richblack-600 bg-richblack-700 px-3 py-2 text-sm" />
                        <label className="mt-3 block text-sm text-richblack-200">Explanation</label>
                        <textarea value={questionItem.explanation} onChange={(e) => setDraftQuiz((current) => {
                          if (!current) return current
                          const questions = current.questions.map((item, qIndex) => qIndex === index ? { ...item, explanation: e.target.value } : item)
                          return { ...current, questions }
                        })} className="mt-2 min-h-[92px] w-full rounded-lg border border-richblack-600 bg-richblack-700 px-3 py-2 text-sm" />
                        <label className="mt-3 block text-sm text-richblack-200">Difficulty</label>
                        <select value={questionItem.difficulty || quizConfig.difficulty} onChange={(e) => setDraftQuiz((current) => {
                          if (!current) return current
                          const questions = current.questions.map((item, qIndex) => qIndex === index ? { ...item, difficulty: e.target.value } : item)
                          return { ...current, questions }
                        })} className="mt-2 w-full rounded-lg border border-richblack-600 bg-richblack-700 px-3 py-2 text-sm">
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                          <option value="mixed">Mixed</option>
                        </select>
                        {questionItem.type === "multiple_choice" ? (
                          <div className="mt-3 space-y-2">
                            <div className="text-sm text-richblack-200">Options</div>
                            {(questionItem.options || []).map((option, optionIndex) => (
                              <input key={`${questionId}-option-${optionIndex}`} value={option} onChange={(e) => updateDraftOption(index, optionIndex, e.target.value)} className="w-full rounded-lg border border-richblack-600 bg-richblack-700 px-3 py-2 text-sm" />
                            ))}
                          </div>
                        ) : null}
                        <button className="mt-4 rounded-lg border border-pink-400/40 bg-pink-400/10 px-4 py-2 text-sm text-pink-100" onClick={() => deleteDraftQuestion(index)}>Delete question</button>
                      </>
                    ) : (
                      <>
                        <p className="mt-3 text-base text-richblack-5">{questionItem.question}</p>
                        {questionItem.type === "multiple_choice" ? (
                          <div className="mt-3 space-y-2">
                            {(questionItem.options || []).map((option, optionIndex) => (
                              <label key={`${questionId}-choice-${optionIndex}`} className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${answerValue === option ? "border-yellow-25 bg-yellow-25/10 text-yellow-5" : "border-richblack-700 bg-richblack-900 text-richblack-200"}`}>
                                <input type="radio" name={questionId} value={option} checked={answerValue === option} disabled={Boolean(quizResult) || submittingQuiz} onChange={(e) => setQuizAnswers((current) => ({ ...current, [questionId]: e.target.value }))} />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <textarea value={answerValue} disabled={Boolean(quizResult) || submittingQuiz} onChange={(e) => setQuizAnswers((current) => ({ ...current, [questionId]: e.target.value }))} className="mt-3 min-h-[100px] w-full rounded-lg border border-richblack-600 bg-richblack-700 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70" placeholder="Type your answer" />
                        )}
                      </>
                    )}

                    {quizResult ? (
                      <div className="mt-4 rounded-lg border border-richblack-700 bg-richblack-900 p-4 text-sm text-richblack-200">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`rounded-full px-3 py-1 text-xs ${resultItem?.isCorrect ? "border border-green-400/40 bg-green-400/10 text-green-100" : "border border-red-400/40 bg-red-400/10 text-red-100"}`}>
                            {resultItem?.isCorrect ? "Correct" : "Incorrect"}
                          </span>
                          <span className="rounded-full border border-richblack-600 px-3 py-1 text-xs">Your answer: {resultItem?.selectedAnswer || "No answer"}</span>
                          <span className="rounded-full border border-richblack-600 px-3 py-1 text-xs">Correct answer: {resultItem?.correctAnswer}</span>
                        </div>
                        <p className="mt-3 text-richblack-5">{resultItem?.explanation}</p>
                        {resultItem?.citations?.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {resultItem.citations.map((citation, citationIndex) => (
                              <span key={`${questionId}-citation-${citationIndex}`} className="rounded-full border border-yellow-25/30 bg-yellow-25/10 px-3 py-1 text-xs font-medium text-yellow-5">
                                {citation.docName} · page {citation.pageNumber}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )
              })}

              {isInstructor && draftQuiz ? (
                <div className="flex flex-wrap gap-3">
                  <button onClick={saveQuiz} disabled={savingQuiz} className="yellowButton">{savingQuiz ? "Saving..." : "Save draft"}</button>
                  <button onClick={publishQuiz} disabled={publishingQuiz} className="blackButton">{publishingQuiz ? "Publishing..." : "Publish quiz"}</button>
                </div>
              ) : null}

              {!isInstructor && visibleQuiz?.status === "published" && !quizResult ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-richblack-700 bg-richblack-800 p-4">
                  <div className="text-sm text-richblack-300">Progress: {answeredCount}/{currentQuestionCount} answered</div>
                  <button onClick={submitQuiz} disabled={submittingQuiz || !allQuestionsAnswered} className="yellowButton">{submittingQuiz ? "Submitting..." : "Submit quiz"}</button>
                </div>
              ) : null}

              {quizResult ? (
                <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-50">
                  <div>Score summary: {quizResult.score}/{quizResult.total} ({quizResult.percentage}%)</div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" onClick={tryQuizAgain} className="yellowButton">Try Again</button>
                    <button type="button" onClick={backToQuizzes} className="blackButton">Back to Quizzes</button>
                  </div>
                </div>
              ) : null}

              {!quizResult && !isInstructor && visibleQuiz?.status === "published" ? (
                <div className="rounded-xl border border-dashed border-richblack-700 p-4 text-sm text-richblack-300">
                  Correct answers stay hidden until you submit the quiz.
                </div>
              ) : null}
            </div>
          ) : loadingQuizzes ? (
            <div className="mt-5 rounded-lg border border-dashed border-richblack-700 p-4 text-sm text-richblack-300">Loading quizzes...</div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-richblack-700 p-4 text-sm text-richblack-300">
              {isInstructor
                ? "Generate a quiz to create the first draft."
                : publishedQuizzes.length
                  ? "Select a published quiz to begin."
                  : "No published quizzes are available for this course yet."}
            </div>
          )}

          <div className="mt-5 rounded-lg border border-richblack-700 bg-richblack-800 p-4 text-sm text-richblack-300">
            <div className="font-medium text-richblack-5">Published quizzes</div>
            <ul className="mt-2 space-y-2">
              {publishedQuizzes.length ? publishedQuizzes.map((quiz) => (
                <li key={quiz._id} className="flex items-center justify-between gap-3 rounded-lg border border-richblack-700 bg-richblack-900 px-3 py-2">
                  <span>{quiz.title}</span>
                  <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs text-green-100">Published</span>
                </li>
              )) : <li className="text-richblack-400">No published quizzes yet.</li>}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}

export default CourseAI
