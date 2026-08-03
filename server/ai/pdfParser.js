const path = require("path");

async function extractPdfPages(buffer) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(buffer);
  const standardFontDataUrl = `${path.join(__dirname, "../node_modules/pdfjs-dist/standard_fonts/").replace(/\\/g, "/")}/`;
  const loadingTask = pdfjsLib.getDocument({ data, useWorkerFetch: false, isEvalSupported: false, standardFontDataUrl });
  const pdfDocument = await loadingTask.promise;
  const pages = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent({ normalizeWhitespace: true });
      const text = textContent.items.map((item) => item.str).join(" ").replace(/\s+/g, " ").trim();
      pages.push({ pageNumber, text });
      page.cleanup();
    }
  } finally {
    if (typeof pdfDocument.destroy === "function") {
      await pdfDocument.destroy();
    } else if (typeof loadingTask.destroy === "function") {
      await loadingTask.destroy();
    }
  }

  return pages;
}

module.exports = { extractPdfPages };
