import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { apiConnector } from "../services/apiConnector";

const BASE_URL =
  process.env.REACT_APP_BASE_URL || "http://localhost:4000/api/v1";

function CourseAI() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.profile);
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [status, setStatus] = useState({ type: "idle", text: "Upload a PDF and ask a course question." });
  const [lastMode, setLastMode] = useState(null);

  const token = useMemo(() => {
    const rawToken = localStorage.getItem("token");
    return rawToken ? JSON.parse(rawToken) : null;
  }, []);

  const uploadPdf = async () => {
    if (!file) return;
    setUploading(true);
    setStatus({ type: "info", text: `Uploading ${file.name}...` });
    try {
      const form = new FormData();
      form.append("file", file);
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await apiConnector("POST", `${BASE_URL}/ai/course/${courseId}/uploadPdf`, form, headers);
      setStatus({
        type: "success",
        text:
          res.data.created > 0
            ? `Upload successful. Indexed ${res.data.created} chunk${res.data.created === 1 ? "" : "s"}.`
            : res.data.message || "Document already uploaded.",
      });
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.message || "Upload failed. Please use a PDF file.";
      setStatus({ type: "error", text: message });
    }
    setUploading(false);
  };

  const askQuestion = async () => {
    if (!question) return;
    setAsking(true);
    setStatus({ type: "info", text: "Searching course chunks..." });
    try {
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await apiConnector("POST", `${BASE_URL}/ai/course/${courseId}/query`, { question }, headers);
      if (res.data.success) {
        setLastMode(res.data.mode);
        if (res.data.mode === "llm") {
          const answerText = res.data.answer?.text || res.data.answer || "";
          setMessages((m) => [...m, { role: "assistant", kind: "answer", text: answerText, citations: res.data.citations }]);
          setStatus({ type: "success", text: "AI-generated answer returned from retrieved course chunks." });
        } else if (res.data.mode === "source_preview") {
          const previewText = (res.data.previews || [])
            .map((p) => `(${p.docName}:${p.pageNumber}) ${p.text}`)
            .join("\n---\n");
          setMessages((m) => [...m, { role: "assistant", kind: "preview", text: previewText, citations: res.data.citations }]);
          setStatus({
            type: "success",
            text: res.data.fallback === "llm_error" ? "LLM failed, showing source preview from course chunks." : "Source-preview mode from retrieved course chunks.",
          });
        } else {
          setMessages((m) => [...m, { role: "assistant", kind: "evidence", text: "Insufficient evidence in course materials.", citations: [] }]);
          setStatus({ type: "warning", text: "Insufficient evidence in the uploaded course material." });
        }
      }
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.message || "Query failed. Please try again.";
      setStatus({ type: "error", text: message });
    }
    setAsking(false);
    setQuestion("");
  };

  const statusClasses = {
    idle: "border-richblack-700 bg-richblack-800 text-richblack-300",
    info: "border-blue-600/40 bg-blue-600/10 text-blue-100",
    success: "border-green-600/40 bg-green-600/10 text-green-100",
    warning: "border-yellow-500/40 bg-yellow-500/10 text-yellow-100",
    error: "border-red-600/40 bg-red-600/10 text-red-100",
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 text-richblack-5">
      <div className="mb-6 rounded-2xl border border-richblack-700 bg-richblack-800 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
        <p className="text-sm uppercase tracking-[0.25em] text-yellow-25">Course AI Tutor</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold">Ask questions from course documents</h2>
            <p className="mt-2 max-w-2xl text-richblack-300">
              Upload a PDF for the course, then ask a question. Answers stay grounded in retrieved course chunks, with citations shown as document and page chips.
            </p>
          </div>
          <button className="blackButton" onClick={() => navigate(`/courses/${courseId}`)}>
            Back to course
          </button>
        </div>
      </div>

      <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${statusClasses[status.type]}`}>
        {status.text}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {user && user.accountType === "Instructor" ? (
          <section className="rounded-2xl border border-richblack-700 bg-richblack-900 p-6">
            <h3 className="text-xl font-semibold">Upload course PDF</h3>
            <p className="mt-2 text-sm text-richblack-300">Instructor-only. Upload a PDF to index it for course-scoped retrieval.</p>
            <label className="mt-5 block text-sm font-medium text-richblack-200">Choose PDF</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="mt-2 block w-full rounded-lg border border-richblack-600 bg-richblack-700 px-3 py-2 text-sm text-richblack-5 file:mr-4 file:rounded-full file:border-0 file:bg-yellow-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-richblack-900"
            />
            {file ? (
              <p className="mt-2 text-sm text-richblack-200">Selected: {file.name}</p>
            ) : null}
            <button onClick={uploadPdf} disabled={uploading || !file} className="mt-4 yellowButton w-full">
              {uploading ? "Uploading..." : file ? `Upload ${file.name}` : "Upload PDF"}
            </button>
            <div className="mt-4 rounded-lg border border-richblack-700 bg-richblack-800 p-4 text-sm text-richblack-300">
              <div className="font-medium text-richblack-5">Upload states</div>
              <ul className="mt-2 space-y-1">
                <li>Uploading: button shows progress text.</li>
                <li>Success: chunk count and document status appear above.</li>
                <li>Error: the status banner shows the failure reason.</li>
              </ul>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-richblack-700 bg-richblack-900 p-6">
            <h3 className="text-xl font-semibold">Ask the tutor</h3>
            <p className="mt-2 text-sm text-richblack-300">Students can query the indexed course material after enrollment.</p>
            <div className="mt-4 rounded-lg border border-richblack-700 bg-richblack-800 p-4 text-sm text-richblack-300">
              This page uses retrieved course chunks only. If no LLM key is configured, it stays in source-preview mode.
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-richblack-700 bg-richblack-900 p-6">
          <h3 className="text-xl font-semibold">Question and answer</h3>
          <label className="mt-4 block text-sm font-medium text-richblack-200">Ask a question</label>
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
              <div className="rounded-lg border border-dashed border-richblack-700 p-4 text-sm text-richblack-300">
                Questions you ask will appear here with mode labels and citations.
              </div>
            ) : (
              messages.map((m, idx) => (
                <div key={idx} className="rounded-xl border border-richblack-700 bg-richblack-800 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold uppercase tracking-[0.18em] text-yellow-25">{m.role}</span>
                    {m.kind && (
                      <span className="rounded-full border border-richblack-600 px-3 py-1 text-xs text-richblack-200">
                        {m.kind === "answer" ? "AI-generated answer" : m.kind === "preview" ? "Source preview" : "Insufficient evidence"}
                      </span>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-6 text-richblack-25">{m.text}</div>
                  {m.citations?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {m.citations.map((c, citationIndex) => (
                        <span
                          key={`${c.docName}-${c.pageNumber}-${citationIndex}`}
                          className="rounded-full border border-yellow-25/30 bg-yellow-25/10 px-3 py-1 text-xs font-medium text-yellow-5"
                        >
                          {c.docName} · page {c.pageNumber}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>

          {lastMode ? (
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-richblack-400">Last mode: {lastMode}</p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default CourseAI;
