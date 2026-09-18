import React, { useState, useRef, useEffect } from "react";
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
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export const AssistantDrawer: React.FC = () => {
  const { isAssistantOpen, setIsAssistantOpen, activeMaterial, user } = useStudy();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m1",
      role: "assistant",
      text: `Hello ${user.name}! I'm your StudyMate AI Tutor. I can explain difficult mechanisms, invent memorable mnemonics, solve practice scenarios, or break down any topic from your study materials. What would you like to explore?`,
      timestamp: "Just now",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/gemini/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          studyContext: activeMaterial
            ? `Active Material: "${activeMaterial.title}" (${activeMaterial.subject})\nSummary: ${activeMaterial.summary}\nKey Concepts: ${activeMaterial.keyConcepts?.map((k) => k.concept).join(", ")}`
            : "No active material selected.",
          history: messages.slice(-4).map((m) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.text }],
          })),
        }),
      });

      const data = await res.json();
      const replyText =
        data.reply ||
        "I'm here to help! Remember: focusing on active recall and testing yourself is the fastest route to long-term understanding.";

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "assistant",
          text: replyText,
          timestamp: "Just now",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "assistant",
          text: "I experienced a brief hiccup connecting to the server. Could you repeat your question?",
          timestamp: "Just now",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 text-white flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>StudyMate AI Assistant</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </h3>
              <p className="text-[10px] text-slate-400">
                {activeMaterial ? `Context: ${activeMaterial.title}` : "Ready to guide you"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAssistantOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggested Action Chips */}
        <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
          <button
            onClick={() => handleSendMessage("Explain this concept simply like I'm 12 years old.")}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition cursor-pointer flex items-center gap-1 border border-slate-700"
          >
            <Lightbulb className="w-3 h-3 text-amber-400" />
            <span>Explain simply</span>
          </button>
          <button
            onClick={() => handleSendMessage("Create a funny mnemonic to help me remember this sequence.")}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition cursor-pointer flex items-center gap-1 border border-slate-700"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Give Mnemonic</span>
          </button>
          <button
            onClick={() => handleSendMessage("Quiz me on a tricky edge-case scenario for this topic.")}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition cursor-pointer flex items-center gap-1 border border-slate-700"
          >
            <HelpCircle className="w-3 h-3 text-blue-400" />
            <span>Pop Quiz Me</span>
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex gap-3 text-xs ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    isUser ? "bg-blue-600" : "bg-gradient-to-tr from-indigo-600 to-purple-600"
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
                </div>

                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-line ${
                    isUser
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800/90 text-slate-200 border border-slate-700/60 shadow-sm"
                  }`}
                >
                  <p>{m.text}</p>
                  <span className="text-[9px] text-slate-400 block mt-1 text-right">{m.timestamp}</span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-800/50 text-slate-400 text-xs w-fit">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
              <span>StudyMate AI is thinking…</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-900">
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
              placeholder="Ask anything about your study materials..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white transition shadow cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
