import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { apiConnector } from "../services/apiConnector";

const BASE_URL = process.env.REACT_APP_BASE_URL || "";

function CourseAI() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.profile);
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const uploadPdf = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const token = localStorage.getItem("token") ? JSON.parse(localStorage.getItem("token")) : null;
      const headers = { "Content-Type": "multipart/form-data" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await apiConnector("POST", `${BASE_URL}/ai/course/${courseId}/uploadPdf`, form, headers);
      if (res.data.success) alert("Upload complete: " + res.data.created);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
    setLoading(false);
  };

  const askQuestion = async () => {
    if (!question) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token") ? JSON.parse(localStorage.getItem("token")) : null;
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await apiConnector("POST", `${BASE_URL}/ai/course/${courseId}/query`, { question }, headers);
      if (res.data.success) {
        if (res.data.mode === "llm") {
          setMessages((m) => [...m, { role: "assistant", text: res.data.answer.text || res.data.answer, citations: res.data.citations }]);
        } else if (res.data.mode === "source_preview") {
          const previewText = res.data.previews.map((p) => `(${p.docName}:${p.pageNumber}) ${p.text}`).join('\n---\n');
          setMessages((m) => [...m, { role: "assistant", text: previewText, citations: res.data.citations }]);
        } else {
          setMessages((m) => [...m, { role: "assistant", text: "Insufficient evidence in course materials.", citations: [] }]);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Query failed");
    }
    setLoading(false);
    setQuestion("");
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Course AI Tutor</h2>
      {user && user.accountType === "Instructor" && (
        <div className="mb-6">
          <label className="block mb-2">Upload course PDF (Instructors only)</label>
          <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} />
          <button onClick={uploadPdf} disabled={loading} className="ml-2 btn">
            Upload
          </button>
        </div>
      )}

      <div className="mb-4">
        <label className="block mb-2">Ask a question</label>
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} className="w-full p-2" />
        <button onClick={askQuestion} disabled={loading} className="mt-2 btn">
          Ask
        </button>
      </div>

      <div>
        <h3 className="text-xl mb-2">Messages</h3>
        {messages.map((m, idx) => (
          <div key={idx} className="mb-4 p-3 border rounded">
            <div className="font-semibold">{m.role}</div>
            <div className="whitespace-pre-wrap">{m.text}</div>
            {m.citations && (
              <div className="mt-2 text-sm text-gray-600">Citations: {m.citations.map((c) => `${c.docName}:${c.pageNumber}`).join(", ")}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CourseAI;
