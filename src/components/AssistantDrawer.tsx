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
} from "lucide-react";
import { CleanFormattedText } from "./CleanFormattedText";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export const AssistantDrawer: React.FC = () => {
  const { isAssistantOpen, setIsAssistantOpen, activeMaterial, setActiveMaterial, materials, user } = useStudy();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMatId, setSelectedMatId] = useState<string>(activeMaterial?.id || (materials[0]?.id || ""));
  
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
          text: `Hello ${user.name}! I am your dedicated StudyMate AI Tutor for **${mat.title}**${mat.courseCode ? ` (${mat.courseCode})` : ""}.\n\nI have analyzed your **${mat.subject}** study material and I am ready to:\n- Provide **step-by-step concept explanations**\n- Break down **governing mechanisms & formulas**\n- Quiz you with **diagnostic exam questions**\n- Generate **custom memory mnemonics**\n\nWhat would you like to explore from "${mat.title}"?`,
          timestamp: "Just now",
        },
      ];
    }
    return [
      {
        id: "m1",
        role: "assistant",
        text: `Hello ${user.name}! I am your dedicated StudyMate AI Tutor.\n\nUpload or select a study deck to receive personalized explanations, flashcard drills, and exam prep.`,
        timestamp: "Just now",
      },
    ];
  }, [messagesByMaterial, currentMaterialId, currentConnectedMaterial, user.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, loading]);

  if (!isAssistantOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: queryText,
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
Document Excerpt / Notes: ${(mat.rawText || mat.content || "").slice(0, 8000)}`
        : "No specific file uploaded.";

      console.log(`[AI CONTEXT]`, {
        fileId: mat?.id || "none",
        title: mat?.title || "none",
        contentExcerpt: (mat?.rawText || mat?.content || "").substring(0, 100),
        timestamp: new Date().toISOString(),
      });

      const res = await fetch("/api/gemini/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          studyContext: richContext,
          currentMaterial: mat ? { title: mat.title, subject: mat.subject, summary: mat.summary } : null,
          history: baseHistory.slice(-4).map((m) => ({
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

        {/* Quick Prompt Chips */}
        <div className="p-2.5 border-b border-slate-100 bg-white flex gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
          <button
            onClick={() =>
              handleSendMessage(
                `Please give me a detailed, step-by-step explanation of the most important concept in "${currentConnectedMaterial?.title || "this file"}" and how it works.`
              )
            }
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#0A1931] whitespace-nowrap transition cursor-pointer flex items-center gap-1 border border-slate-200 font-semibold shadow-2xs"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Deep Explanation</span>
          </button>
          <button
            onClick={() =>
              handleSendMessage(
                `Quiz me on a high-yield exam question from "${currentConnectedMaterial?.title || "my uploaded material"}".`
              )
            }
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#0A1931] whitespace-nowrap transition cursor-pointer flex items-center gap-1 border border-slate-200 font-semibold shadow-2xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Exam Practice Quiz</span>
          </button>
          <button
            onClick={() =>
              handleSendMessage(
                `Invent a memorable mnemonic to help me retain the key steps or terms in "${currentConnectedMaterial?.title || "this document"}".`
              )
            }
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#0A1931] whitespace-nowrap transition cursor-pointer flex items-center gap-1 border border-slate-200 font-semibold shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Memory Mnemonic</span>
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your uploaded file..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:border-[#0A1931] focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] disabled:opacity-40 text-white transition shadow-xs cursor-pointer flex items-center justify-center"
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
