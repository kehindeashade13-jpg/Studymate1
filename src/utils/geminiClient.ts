import { GoogleGenAI } from "@google/genai";
import { safeFetchJson } from "./studyTransformer";

// Client-side Gemini fallback for Vercel/SPA deployments
function getClientGemini(): GoogleGenAI | null {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") return null;
  try {
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn("Could not init client GoogleGenAI:", err);
    return null;
  }
}

/**
 * Universal safe API call for Gemini endpoints:
 * 1. Tries the backend proxy (/api/gemini/...)
 * 2. If backend fails / 404 (e.g. on Vercel static hosting) and client key is present, calls Gemini directly in browser
 */
export async function callGeminiApi<T = any>(
  endpoint: string,
  payload: any,
  timeoutMs = 25000
): Promise<T | null> {
  // 1. Try server endpoint first
  try {
    const serverRes = await safeFetchJson<any>(endpoint, payload, timeoutMs);
    if (serverRes) {
      const data = serverRes.data || serverRes;
      if (data && typeof data === "object" && Object.keys(data).length > 0) {
        return data as T;
      }
    }
  } catch (err) {
    console.warn(`Server endpoint ${endpoint} failed, checking client Gemini...`, err);
  }

  // 2. Client Gemini direct fallback
  const ai = getClientGemini();
  if (!ai) return null;

  try {
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    let prompt = "";

    if (endpoint.includes("generate-notes")) {
      prompt = `Generate comprehensive, clear academic study notes for "${payload.title}".
Content to study:
${(payload.content || "").slice(0, 15000)}

Return a strict JSON object with:
{
  "topicTitle": "${payload.title}",
  "shortOverview": "...",
  "keyConcepts": [{"title": "...", "description": "...", "keyTakeaway": "..."}],
  "definitions": [{"term": "...", "definition": "...", "context": "..."}],
  "importantDetails": ["..."],
  "examples": [{"scenario": "...", "explanation": "..."}],
  "formulas": [],
  "commonMistakes": [{"mistake": "...", "correction": "...", "whyItHappens": "..."}],
  "quickRecap": ["..."],
  "feynmanPrompt": "..."
}`;
    } else if (endpoint.includes("generate-flashcards")) {
      prompt = `Generate 15-20 active-recall flashcards for "${payload.title}".
Content:
${(payload.content || "").slice(0, 15000)}

Return strict JSON:
{
  "flashcards": [
    {
      "id": "fc-1",
      "front": "...",
      "back": "...",
      "explanation": "...",
      "hint": "...",
      "difficulty": "medium",
      "category": "Core Concepts"
    }
  ],
  "mnemonics": [{"topic": "...", "phrase": "...", "expansion": "...", "explanation": "..."}],
  "fillInTheBlanks": [{"sentence": "...", "blank": "...", "hint": "..."}],
  "recallQuestions": [{"question": "...", "answer": "...", "focusConcept": "..."}]
}`;
    } else if (endpoint.includes("generate-quiz")) {
      prompt = `Generate 20 multiple choice questions for "${payload.title}".
Content:
${(payload.content || "").slice(0, 15000)}

Return strict JSON:
{
  "quizTitle": "${payload.title} Assessment",
  "questions": [
    {
      "id": "q-1",
      "type": "multiple_choice",
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "...",
      "topicTag": "Core Concept",
      "difficulty": "medium"
    }
  ]
}`;
    } else if (endpoint.includes("generate-lesson")) {
      prompt = `Generate a 6-step interactive lesson with 5 practice questions per lesson for "${payload.title}".
Content:
${(payload.content || "").slice(0, 15000)}

Return strict JSON with title, totalLessons: 6, and lessons array with lessonNumber, title, subtitle, content, analogy, keyTerms, questions: [{"question": "...", "options": ["..."], "correctAnswer": "...", "explanation": "..."}].`;
    } else {
      prompt = `Analyze this material "${payload.title}":\n${(payload.content || "").slice(0, 10000)}`;
    }

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          if (parsed) return parsed as T;
        }
      } catch (mErr) {
        console.warn(`Client model ${model} warning:`, mErr);
      }
    }
  } catch (clientErr) {
    console.warn("Client Gemini direct call error:", clientErr);
  }

  return null;
}
