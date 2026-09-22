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

    try {
      const mat = currentConnectedMaterial;
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

      const res = await fetch("/api/gemini/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      const data = await res.json();
      const replyText =
        data.reply ||
        data.answer ||
        "I'm here to help you master this material! Tell me what concept or question you'd like to work through.";

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
    } catch {
      const errorMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        text: "I experienced a brief communication pause. Please feel free to ask again!",
        timestamp: "Just now",
      };
      setMessagesByMaterial((prev) => ({
        ...prev,
        [targetMatId]: [...(prev[targetMatId] || updatedHistory), errorMsg],
      }));
    } finally {
      setLoading(false);
    }
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
