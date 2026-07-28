const fs = require("fs");
const path = require("path");
const axios = require("axios");

async function run() {
  const infoPath = path.join(__dirname, "ai_test_info.json");
  if (!fs.existsSync(infoPath)) {
    console.error("ai_test_info.json not found. Start devStart.js first.");
    process.exit(1);
  }
  const info = JSON.parse(fs.readFileSync(infoPath));
  const base = process.env.BASE_URL || "http://localhost:4000/api/v1";
  const pdfPath = info.samplePdf;
  console.log("Using base:", base);

  // Upload as instructor to course1
  const formData = new (require("form-data"))();
  const stream = fs.createReadStream(pdfPath);
  const opts = {};
  if (pdfPath.toLowerCase().endsWith('.txt')) {
    opts.filename = path.basename(pdfPath);
    opts.contentType = 'application/pdf';
  }
  formData.append("file", stream, opts);
  const uploadUrl = `${base}/ai/course/${info.courses.course1}/uploadPdf`;
  console.log("Uploading sample PDF to:", uploadUrl);
  try {
    const headers = { Authorization: `Bearer ${info.instructor.token}`, ...formData.getHeaders() };
    const getLength = () =>
      new Promise((resolve, reject) => {
        formData.getLength((err, length) => {
          if (err) return reject(err);
          resolve(length);
        });
      });
    try {
      const length = await getLength();
      headers["Content-Length"] = length;
    } catch (e) {
      // ignore length error
    }
    const res = await axios.post(uploadUrl, formData, { headers });
    console.log("Upload response:", res.data);
      // check chunk count
      try {
        const cnt = await axios.get(`${base}/ai/course/${info.courses.course1}/chunksCount`, { headers: { Authorization: `Bearer ${info.instructor.token}` } });
        console.log("Chunks count:", cnt.data);
      } catch (e) {
        console.error("Chunks count failed:", e.response ? e.response.data : e.message);
      }
  } catch (err) {
    console.error("Upload failed:", err.response ? err.response.data : err.message);
  }

  // Query question that exists
  const queryUrl = `${base}/ai/course/${info.courses.course1}/query`;
  try {
    const res = await axios.post(queryUrl, { question: "When was EduNest launched?" }, { headers: { Authorization: `Bearer ${info.student.token}` } });
    console.log("Query response (launched):", res.data);
  } catch (err) {
    console.error("Query failed:", err.response ? err.response.data : err.message);
  }

  // Query question that doesn't exist
  try {
    const res = await axios.post(queryUrl, { question: "Who is the CEO of EduNest?" }, { headers: { Authorization: `Bearer ${info.student.token}` } });
    console.log("Query response (CEO):", res.data);
  } catch (err) {
    console.error("Query failed:", err.response ? err.response.data : err.message);
  }

  // Try non-enrolled student querying
  try {
    const res = await axios.post(queryUrl, { question: "When was EduNest launched?" }, { headers: { Authorization: `Bearer ${info.nonStudent.token}` } });
    console.log("Non-enrolled query response:", res.data);
  } catch (err) {
    console.error("Non-enrolled query failed:", err.response ? err.response.data : err.message);
  }
}

run();
