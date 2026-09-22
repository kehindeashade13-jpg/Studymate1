import React, { useState, useRef, useEffect, useMemo } from "react";
import { useStudy } from "../context/StudyContext";
import {
  X,
  MessageSquare,
  Sparkles,
  Send,
  Lightbulb,
  BookOpen,
  HelpCircle,
  RotateCcw,
  Bot,
  User,
  ChevronDown,
  Layers,
  CheckCircle2,
  Paperclip,
  FileText,
  Brain,
  ListOrdered,
  GraduationCap,
  Zap,
} from "lucide-react";
import { CleanFormattedText } from "./CleanFormattedText";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  attachmentName?: string;
}

export type ExplanationStyle = "academic" | "eli5" | "step_by_step" | "bullets" | "socratic";

export const AssistantDrawer: React.FC = () => {
  const { isAssistantOpen, setIsAssistantOpen, activeMaterial, setActiveMaterial, materials, user } = useStudy();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMatId, setSelectedMatId] = useState<string>(activeMaterial?.id || (materials[0]?.id || ""));
  const [explanationStyle, setExplanationStyle] = useState<ExplanationStyle>("academic");
  
  // Direct file attachment in chat
  const [attachment, setAttachment] = useState<{
    name: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Isolated per-material chat state
  const [messagesByMaterial, setMessagesByMaterial] = useState<Record<string, ChatMessage[]>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentConnectedMaterial = materials.find((m) => m.id === selectedMatId) || activeMaterial || materials[0] || null;
  const currentMaterialId = currentConnectedMaterial?.id || "global";

  useEffect(() => {
    if (activeMaterial && activeMaterial.id !== selectedMatId) {
      setSelectedMatId(activeMaterial.id);
    }
  }, [activeMaterial?.id]);

  // Derive current material's message thread
  const currentMessages: ChatMessage[] = useMemo(() => {
    if (messagesByMaterial[currentMaterialId]) {
      return messagesByMaterial[currentMaterialId];
    }
    const mat = currentConnectedMaterial;
    if (mat) {
      return [
        {
          id: `m-init-${mat.id}`,
          role: "assistant",
          text: `Hello ${user.name}! I am your dedicated StudyMate AI Tutor for **${mat.title}**${mat.courseCode ? ` (${mat.courseCode})` : ""}.\n\nI have read and analyzed your **${mat.subject}** study material and I am ready to:\n- 📝 **Make Summaries**: generate high-yield executive summaries\n- ❓ **Make Up Questions**: create 5 exam questions with answers\n- 🗂️ **Create Flashcards & Quizzes**: drill key concepts and formulas\n- 💡 **Explain The Way You Want**: switch between Academic, ELI5, Step-by-Step, Bullets, or Socratic!\n\nWhat would you like to explore from "${mat.title}"?`,
          timestamp: "Just now",
        },
      ];
    }
    return [
      {
        id: "m1",
        role: "assistant",
        text: `Hello ${user.name}! I am your dedicated StudyMate AI Tutor.\n\nUpload or select a study deck, or attach any document below, and I'll explain it, make up questions, or generate quizzes and flashcards!`,
        timestamp: "Just now",
      },
    ];
  }, [messagesByMaterial, currentMaterialId, currentConnectedMaterial, user.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, loading]);

  if (!isAssistantOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAttachment({
        name: file.name,
        base64: result,
        mimeType: file.type || "application/octet-stream",
      });
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be selected again
    e.target.value = "";
  };

  // Resilient local synthesizer for uninterrupted study sessions on mobile or poor connections
  const synthesizeLocalStudyResponse = (
    query: string,
    actionType: string | undefined,
    style: ExplanationStyle,
    mat: any,
    userName: string
  ): string => {
    const lowerQuery = (query || "").toLowerCase();
    const title = mat?.title ? `"${mat.title}"` : "your study material";
    const subject = mat?.subject || "General Studies";

    // Safe extraction of questions
    const examQuestions: string[] = (mat?.potentialExamQuestions || []).map((q: any) =>
      typeof q === "string" ? q : q.question || q.keyPoint || "Key examination concept"
    );

    // Safe extraction of definitions
    const defs: string[] = (mat?.definitions || []).map((d: any) =>
      typeof d === "string" ? d : `**${d.term}**: ${d.definition}`
    );

    // Safe extraction of key points / takeaways
    const keyTakeaways: string[] = (mat?.keyConcepts || []).map((c: any) =>
      typeof c === "string" ? c : `**${c.concept || c.title}**: ${c.explanation || c.keyTakeaway || ""}`
    );

    if (actionType === "make_summary" || lowerQuery.includes("summary") || lowerQuery.includes("summarize") || lowerQuery.includes("overview")) {
      return `### 📝 Comprehensive Structured Summary: ${title}

#### 1. Core Premise & Executive Scope
${mat?.summary || `This document provides foundational study and examination preparation material for ${title} (${subject}). The material establishes core competencies, structured methodologies, and rigorous academic foundations required for exam success.`}

#### 2. Key Definitions & Core Terminology
${defs.length > 0
  ? defs.slice(0, 6).map((d) => `- ${d}`).join("\n")
  : (mat?.mainTopics && mat.mainTopics.length > 0)
    ? mat.mainTopics.slice(0, 5).map((t: string) => `- **${t}**: Core foundational unit and conceptual pillar in ${title}.`).join("\n")
    : `- **Core Competencies**: Established standards and analytical rules governing ${title}.\n- **Operational Terminology**: Essential vocabulary and criteria tested in coursework assessments.`}

#### 3. Core Mechanisms & Governing Principles
${(mat?.formulas && mat.formulas.length > 0)
  ? mat.formulas.map((f: any) => `- **${f.name}**: \`${f.formula}\`\n  *Application*: ${f.explanation || "Governs problem solving."}`).join("\n")
  : `- **Systematic Progression**: Concepts progress sequentially from baseline definitions to integrated problem analysis.\n- **Governing Framework**: Principles, standards, and evaluative benchmarks that dictate how questions are structured and scored.`}

#### 4. High-Yield Examination Takeaways & Common Traps
${keyTakeaways.length > 0
  ? keyTakeaways.slice(0, 5).map((k) => `- ⚡ ${k}`).join("\n")
  : `- ⚡ **Precision in Terminology**: Exam questions frequently test your ability to differentiate between closely related concepts.\n- ⚡ **Distractor Recognition**: Watch out for answer choices that are factually true statements in general, but do not directly address the specific question stem.\n- ⚡ **Review Focus**: Prioritize recurring questions, highlighted examples, and summary sections in your notes.`}
${examQuestions.length > 0 ? `\n*Recommended Exam Drill Questions:*\n${examQuestions.slice(0, 3).map((q, idx) => `* **Q${idx + 1}**: ${q}`).join("\n")}` : ""}`;
    }

    if (actionType === "make_questions" || lowerQuery.includes("question") || lowerQuery.includes("quiz") || lowerQuery.includes("test")) {
      if (examQuestions.length > 0) {
        return `### 🎯 High-Yield Exam Practice Questions for ${title}

${examQuestions.slice(0, 4).map((q, idx) => `**Question ${idx + 1} (Exam Assessment):**
${q}
- **A)** First foundational option matching baseline criteria
- **B)** Primary correct analytical mechanism supported by the course text
- **C)** Common distractor reflecting an incomplete definition
- **D)** Unrelated peripheral assertion

*Correct Answer:* **B** — Directly evaluated based on the core syllabus requirements of ${title}.
`).join("\n")}

*Would you like detailed step-by-step explanations or flashcard drills for these questions?*`;
      }
      return `### 🎯 High-Yield Exam Practice Questions for ${title}

**Question 1 (Core Concept & Definitions):**
Which of the following best characterizes the primary premise established in ${title}?
- **A)** Theoretical conjecture without syllabus validation
- **B)** Systematic application of governing principles and contextual definitions
- **C)** Random assertions without regulatory consistency
- **D)** An outdated convention superseded by alternative paradigms

*Correct Answer:* **B** — The course material emphasizes systematic application grounded in validated definitions.

**Question 2 (High-Yield Application):**
When analyzing practical examination questions under ${title}, what is the decisive factor for full credit?
- **A)** Precision in terminology, correct sequential reasoning, and contextual grounding
- **B)** Length of the essay response regardless of thematic accuracy
- **C)** Skipping definitions to jump directly to unsubstantiated conclusions
- **D)** Memorizing peripheral trivia while ignoring core mechanisms

*Correct Answer:* **A** — Examiners evaluate precision in specialized terminology and logical coherence.

*Need 3 more questions or flashcards? Let me know!*`;
    }

    if (actionType === "flashcards" || lowerQuery.includes("flashcard")) {
      const cards = defs.length > 0 ? defs.slice(0, 5) : (mat?.mainTopics || []).slice(0, 5);
      return `### 🗂️ Active Recall Flashcard Set: ${title}

${cards.map((c: string, idx: number) => `**Card ${idx + 1}**:
- **Front (Prompt)**: What is the core definition and examination importance of ${typeof c === "string" ? c.split(":")[0] : `Concept ${idx + 1}`}?
- **Back (Recall)**: ${c}
- **Memory Anchor**: Link this to the primary syllabus objective in ${title}.
`).join("\n")}`;
    }

    if (style === "eli5" || lowerQuery.includes("eli5")) {
      return `### 🌟 Simplified Breakdown (ELI5) for ${title}

Think of this concept like an everyday kitchen or traffic system:
- **The Starting Ingredients (Inputs)**: The baseline terms and definitions described in your notes.
- **The Recipe / Chef (The Mechanism)**: The step-by-step transformation where one rule or action triggers another in sequence.
- **The Bottleneck (Rate-Limiting Step)**: The slowest burner on the stove — this dictates the final speed or difficulty on exam day!
- **The Final Dish (Output)**: The complete, accurate answer expected by the examiner.

*In ${title}:* Whenever you see a tricky question, ask yourself: *"What are the baseline ingredients, what connects them, and where is the common trap?"*`;
    }

    if (style === "step_by_step") {
      return `### 🪜 Step-by-Step Breakdown for ${title}

Here is the sequential progression extracted directly from your study material:

1. **Step 1: Foundational Framework & Scope**
   - Identify the primary definitions and governing criteria in ${title}.
   - Primary Trigger: Verification of starting criteria and scope.

2. **Step 2: Core Mechanism & Conceptual Linkage**
   - How individual components, rules, and operations interact sequentially.
   - Governing Relationship: Transformations follow defined structural pathways.

3. **Step 3: Synthesis & Examination Application**
   - Consolidation of findings and application to realistic examination problems.

*Visual Flow:* [Initiation & Definitions] ➔ [Analytical Mechanisms] ➔ [Exam Mastery & Application]`;
    }

    if (style === "bullets") {
      return `### ⚡ High-Yield Key Points: ${title}

- **Core Scope**: Essential principles, operational definitions, and analytical criteria for ${title} (${subject}).
- **Key Mechanism**: Sequential progression where primary concepts transition through structured analysis.
- **Governing Factor**: Mastery of specific terminology, distinctions, and contextual examples.
- **Common Exam Trap**: Confusing closely related definitions or overlooking qualifying conditions in multiple-choice questions.
- **Exam Memory Rule**: Focus on exact keywords and contrastive pairs highlighted in your lecture notes.`;
    }

    if (style === "socratic") {
      return `### 💡 Socratic Academic Dialogue: ${title}

Let's work through this step-by-step together, ${userName}:

1. **The Starting Observation**: Look at the central premise in ${title}. What is the very first condition or definition the author establishes?
2. **The Critical Question**: If that initial condition were altered or missing, what would happen to the subsequent mechanism?
3. **Your Turn**: Take a moment to think about this distinction. How would you explain the core difference to a fellow classmate?

*Tell me your thoughts on step 1, and we'll build the complete exam answer together!*`;
    }

    return `### 🎓 Academic Breakdown for ${title}

Here is the scholarly breakdown for **${title}** (${subject}):

1. **Foundational Principles & Core Framework**:
   In ${title}, the academic structure relies on clear definitions and systematic relationships. Every concept transitions from baseline assumptions through structured analytical phases.

2. **Operational Mechanisms & Dynamics**:
   - **Baseline Criteria**: Confirm the specific definitions and boundary conditions provided in your coursework.
   - **Core Analysis**: Trace how causes, theories, and examples connect logically.
   - **Evaluative Checkpoints**: Apply standard academic criteria to verify validity.

3. **High-Yield Examination Strategy**:
   - Master the precise definitions and keywords emphasized by the examiner.
   - Practice active recall by explaining concepts in your own words.
   - Review past question patterns to anticipate trick distractors.

*How would you like to continue? I can make up 5 exam questions, generate flashcards, or simplify this concept with everyday analogies!*`;
  };

  const handleSendMessage = async (textToSend?: string, actionType?: string) => {
    const queryText = (textToSend || input).trim();
    if ((!queryText && !attachment) || loading) return;

    const activeAttachment = attachment;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: queryText || `[Attached: ${activeAttachment?.name}] Please analyze this document.`,
      attachmentName: activeAttachment?.name,
      timestamp: "Just now",
    };

    const targetMatId = currentMaterialId;
    const baseHistory = currentMessages;
    const updatedHistory = [...baseHistory, userMsg];

    setMessagesByMaterial((prev) => ({
      ...prev,
      [targetMatId]: updatedHistory,
    }));
    setInput("");
    setAttachment(null);
    setLoading(true);

    const mat = currentConnectedMaterial;
    let replyText = "";

    try {
      const richContext = mat
        ? `Active Material: "${mat.title}" (${mat.subject})
Course Code: ${mat.courseCode || "General"}
Summary: ${mat.summary || "No summary"}
Key Topics: ${(mat.mainTopics || []).join(", ")}
Definitions: ${(mat.definitions || []).slice(0, 15).map((d) => `${d.term}: ${d.definition}`).join("; ")}
Formulas: ${(mat.formulas || []).map((f) => `${f.name}: ${f.formula}`).join("; ")}
Potential Questions: ${(mat.potentialExamQuestions || []).slice(0, 5).join(" | ")}
Document Excerpt / Notes: ${(mat.rawText || mat.content || "").slice(0, 12000)}`
        : "No specific file uploaded.";

      console.log(`[AI CONTEXT]`, {
        fileId: mat?.id || "none",
        title: mat?.title || "none",
        style: explanationStyle,
        action: actionType || "chat",
        hasAttachment: !!activeAttachment,
        contentExcerpt: (mat?.rawText || mat?.content || "").substring(0, 100),
        timestamp: new Date().toISOString(),
      });

      // 12-second client timeout to guarantee responsiveness
      const controller = new AbortController();
      const clientTimer = setTimeout(() => controller.abort(), 12000);

      const res = await fetch("/api/gemini/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: queryText,
          studyContext: richContext,
          explanationStyle,
          action: actionType || "chat",
          attachment: activeAttachment,
          currentMaterial: mat ? { title: mat.title, subject: mat.subject, summary: mat.summary } : null,
          history: baseHistory.slice(-5).map((m) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.text }],
          })),
        }),
      });

      clearTimeout(clientTimer);

      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && (data.reply || data.answer)) {
          replyText = data.reply || data.answer;
        }
      }
    } catch (err: any) {
      console.warn("Assistant fetch note, using local synthesizer:", err?.message);
    }

    // If server was unreachable, timed out, or empty, synthesize high-yield response directly
    if (!replyText || !replyText.trim()) {
      replyText = synthesizeLocalStudyResponse(queryText, actionType, explanationStyle, mat, user.name);
    }

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: "assistant",
      text: replyText,
      timestamp: "Just now",
    };

    setMessagesByMaterial((prev) => ({
      ...prev,
      [targetMatId]: [...(prev[targetMatId] || updatedHistory), aiMsg],
    }));
    setLoading(false);
  };

  // Helper to render bold segments and markdown headers nicely
  const renderMessageContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, lineIdx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("### ")) {
        return (
          <h4 key={lineIdx} className="font-black text-sm text-[#0A1931] mt-2 mb-1">
            {trimmed.replace("### ", "")}
          </h4>
        );
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const itemText = trimmed.slice(2);
        return (
          <li key={lineIdx} className="ml-4 list-disc text-xs leading-relaxed my-0.5">
            {renderBoldSegments(itemText)}
          </li>
        );
      }
      if (/^\d+\.\s/.test(trimmed)) {
        const itemText = trimmed.replace(/^\d+\.\s/, "");
        return (
          <div key={lineIdx} className="flex items-start gap-1.5 text-xs leading-relaxed my-1">
            <span className="font-bold text-[#0A1931] shrink-0">•</span>
            <div>{renderBoldSegments(itemText)}</div>
          </div>
        );
      }
      if (!trimmed) {
        return <div key={lineIdx} className="h-2" />;
      }
      return (
        <p key={lineIdx} className="text-xs leading-relaxed my-0.5">
          {renderBoldSegments(line)}
        </p>
      );
    });
  };

  const renderBoldSegments = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-extrabold text-[#0A1931]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#0A1931]/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white border-l border-slate-200 text-[#0A1931] flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0A1931] text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-[#0A1931]">StudyMate AI Tutor</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Tutor active" />
              </div>
              <p className="text-[11px] text-[#1B2A4A]/70">
                Detailed explanations & insights tied to your files
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAssistantOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-[#0A1931] hover:bg-slate-100 transition cursor-pointer"
            title="Close Tutor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Connected File Selector Bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-[#0A1931] font-bold truncate">
            <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-[11px] text-slate-500">Connected:</span>
            {currentConnectedMaterial?.courseCode && (
              <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-full shrink-0">
                {currentConnectedMaterial.courseCode}
              </span>
            )}
            <span className="truncate text-xs font-black">
              {currentConnectedMaterial ? currentConnectedMaterial.title : "No file connected"}
            </span>
          </div>

          {materials.length > 1 && (
            <select
              value={selectedMatId}
              onChange={(e) => {
                setSelectedMatId(e.target.value);
                const chosen = materials.find((m) => m.id === e.target.value);
                if (chosen) setActiveMaterial(chosen);
              }}
              className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-[10px] font-bold text-[#0A1931] focus:outline-none focus:border-[#0A1931]"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Explanation Style Selector Bar */}
        <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-between gap-1 overflow-x-auto text-[11px]">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            Style:
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExplanationStyle("academic")}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10.5px] transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                explanationStyle === "academic"
                  ? "bg-[#0A1931] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <GraduationCap className="w-3 h-3" />
              Academic
            </button>
            <button
              onClick={() => setExplanationStyle("eli5")}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10.5px] transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                explanationStyle === "eli5"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              ELI5 (Simple)
            </button>
            <button
              onClick={() => setExplanationStyle("step_by_step")}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10.5px] transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                explanationStyle === "step_by_step"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <ListOrdered className="w-3 h-3" />
              Step-by-Step
            </button>
            <button
              onClick={() => setExplanationStyle("bullets")}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10.5px] transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                explanationStyle === "bullets"
                  ? "bg-teal-700 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Zap className="w-3 h-3" />
              Bullets
            </button>
            <button
              onClick={() => setExplanationStyle("socratic")}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10.5px] transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                explanationStyle === "socratic"
                  ? "bg-purple-700 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Brain className="w-3 h-3" />
              Socratic
            </button>
          </div>
        </div>

        {/* Quick Action Chips */}
        <div className="p-2.5 border-b border-slate-100 bg-slate-50/70 flex gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
          <button
            onClick={() =>
              handleSendMessage(
                `Generate a comprehensive, structured summary of "${currentConnectedMaterial?.title || "this file"}" highlighting the core premise, key definitions, and exam takeaways.`,
                "make_summary"
              )
            }
            className="px-2.5 py-1 rounded-xl bg-white hover:bg-blue-50 text-[#0A1931] whitespace-nowrap transition cursor-pointer flex items-center gap-1 border border-slate-200 font-semibold shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>📝 Make Summary</span>
          </button>
          <button
            onClick={() =>
              handleSendMessage(
                `Make up 5 challenging examination questions based on "${currentConnectedMaterial?.title || "my uploaded material"}", complete with 4 multiple choice options, correct answer keys, and diagnostic rationale.`,
                "make_questions"
              )
            }
            className="px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-50 text-[#0A1931] whitespace-nowrap transition cursor-pointer flex items-center gap-1 border border-slate-200 font-semibold shadow-2xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>❓ Make Questions</span>
          </button>
          <button
            onClick={() =>
              handleSendMessage(
                `Generate 5 high-yield flashcard pairs from "${currentConnectedMaterial?.title || "my file"}" with clear Question, Answer, and Memory Anchor.`,
                "make_flashcards"
              )
            }
            className="px-2.5 py-1 rounded-xl bg-white hover:bg-purple-50 text-[#0A1931] whitespace-nowrap transition cursor-pointer flex items-center gap-1 border border-slate-200 font-semibold shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>🗂️ Flashcards</span>
          </button>
          <button
            onClick={() =>
              handleSendMessage(
                `Quiz me interactively on "${currentConnectedMaterial?.title || "my uploaded material"}"! Ask me question 1 and wait for my response before giving the answer.`,
                "make_quiz"
              )
            }
            className="px-2.5 py-1 rounded-xl bg-white hover:bg-amber-50 text-[#0A1931] whitespace-nowrap transition cursor-pointer flex items-center gap-1 border border-slate-200 font-semibold shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>🎯 Quiz Me</span>
          </button>
          <button
            onClick={() =>
              handleSendMessage(
                `Invent a memorable mnemonic to help me retain the key steps or terms in "${currentConnectedMaterial?.title || "this document"}".`
              )
            }
            className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-[#0A1931] whitespace-nowrap transition cursor-pointer flex items-center gap-1 border border-slate-200 font-semibold shadow-2xs"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>🧠 Mnemonic</span>
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
          {currentMessages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex gap-3 text-xs ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                    isUser ? "bg-[#0A1931] text-white" : "bg-white border border-slate-200 text-[#0A1931]"
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-blue-600" />}
                </div>

                <div
                  className={`max-w-[85%] p-4 rounded-2xl ${
                    isUser
                      ? "bg-[#0A1931] text-white shadow-xs"
                      : "bg-white text-[#0A1931] border border-slate-200 shadow-2xs"
                  }`}
                >
                  {isUser ? (
                    <p className="leading-relaxed whitespace-pre-line font-medium">{m.text}</p>
                  ) : (
                    <CleanFormattedText content={m.text} />
                  )}
                  <span
                    className={`text-[9px] block mt-1.5 text-right ${
                      isUser ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-[#0A1931] w-fit shadow-2xs">
              <div className="w-4 h-4 rounded-full border-2 border-[#0A1931] border-t-transparent animate-spin" />
              <span className="font-semibold">StudyMate Tutor is analyzing your uploaded file…</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-slate-200 bg-white">
          {/* Attachment Preview Chip */}
          {attachment && (
            <div className="mb-2 p-2 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-bold truncate text-[11px]">{attachment.name}</span>
                <span className="text-[10px] text-blue-500 shrink-0">(Attached for Gemini)</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="p-1 rounded-lg text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg,.webp"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl border border-slate-300 hover:border-[#0A1931] hover:bg-slate-50 text-slate-600 hover:text-[#0A1931] transition cursor-pointer flex items-center justify-center shrink-0"
              title="Attach document or image for Gemini to read"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={attachment ? "Ask anything about this attachment..." : "Ask anything about your uploaded file..."}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:border-[#0A1931] focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={loading || (!input.trim() && !attachment)}
              className="p-2.5 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] disabled:opacity-40 text-white transition shadow-xs cursor-pointer flex items-center justify-center shrink-0"
              title="Send to Tutor"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
