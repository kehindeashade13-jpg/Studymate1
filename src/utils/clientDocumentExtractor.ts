import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { cleanToNaturalEnglish } from "./studyTransformer";

// Set pdf.js worker to standard CDN
try {
  if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "4.10.38"}/pdf.worker.min.mjs`;
  }
} catch (_) {}

/**
 * Extract clean text directly in the browser from any uploaded File object
 * (PDF, DOCX, TXT, MD, CSV, JSON, HTML, etc.)
 */
export async function extractTextFromFileClient(file: File): Promise<string> {
  if (!file) return "";
  const fileName = file.name.toLowerCase();

  // 1. Plain text, markdown, CSV, JSON, HTML, code files
  if (
    file.type.startsWith("text/") ||
    file.type === "application/json" ||
    file.type === "application/xml" ||
    fileName.endsWith(".txt") ||
    fileName.endsWith(".md") ||
    fileName.endsWith(".csv") ||
    fileName.endsWith(".tsv") ||
    fileName.endsWith(".json") ||
    fileName.endsWith(".xml") ||
    fileName.endsWith(".html") ||
    fileName.endsWith(".rtf") ||
    fileName.endsWith(".py") ||
    fileName.endsWith(".js") ||
    fileName.endsWith(".ts")
  ) {
    try {
      const rawText = await file.text();
      const cleaned = cleanToNaturalEnglish(rawText);
      if (cleaned && cleaned.trim().length > 10) {
        return cleaned;
      }
    } catch (err) {
      console.warn("[Client Extractor] Plain text reading warning:", err);
    }
  }

  // 2. Microsoft Word documents (.docx)
  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (result && result.value && result.value.trim().length > 10) {
        return cleanToNaturalEnglish(result.value);
      }
    } catch (err) {
      console.warn("[Client Extractor] Mammoth docx extraction warning:", err);
    }
  }

  // 3. PDF documents (.pdf) via pdfjs-dist
  if (file.type === "application/pdf" || fileName.endsWith(".pdf")) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true,
      });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;
      const extractedPages: string[] = [];

      for (let pageNum = 1; pageNum <= Math.min(numPages, 40); pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageStrings = textContent.items
          .map((item: any) => item.str || "")
          .filter(Boolean);
        if (pageStrings.length > 0) {
          extractedPages.push(pageStrings.join(" "));
        }
      }

      const fullPdfText = extractedPages.join("\n\n");
      const cleaned = cleanToNaturalEnglish(fullPdfText);
      if (cleaned && cleaned.trim().length > 15) {
        return cleaned;
      }
    } catch (err) {
      console.warn("[Client Extractor] PDF.js extraction warning, trying raw stream fallback:", err);
      // Fallback: extract ASCII/UTF-8 streams from PDF arrayBuffer
      try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        let decoder = new TextDecoder("utf-8", { fatal: false });
        let rawStr = decoder.decode(uint8);
        // Find text within parentheses (text in PDF operators like (Hello) Tj)
        const matches = rawStr.match(/\(([^()]{2,150})\)\s*T[jJ]/g);
        if (matches && matches.length > 5) {
          const textPieces = matches.map((m) => m.replace(/^\(/, "").replace(/\)\s*T[jJ]$/, ""));
          const combined = textPieces.join(" ");
          const cleaned = cleanToNaturalEnglish(combined);
          if (cleaned.length > 20) return cleaned;
        }
      } catch (_) {}
    }
  }

  // Fallback: try file.text()
  try {
    const raw = await file.text();
    const cleaned = cleanToNaturalEnglish(raw);
    if (cleaned && cleaned.trim().length > 20) {
      return cleaned;
    }
  } catch (_) {}

  return "";
}
