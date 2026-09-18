import React from "react";
import { useStudy } from "../context/StudyContext";
import { Brain, HelpCircle, Sparkles, X } from "lucide-react";

export const PracticeStationModal: React.FC = () => {
  const {
    isPracticeStationModalOpen,
    setIsPracticeStationModalOpen,
    setActiveTab,
  } = useStudy();

  if (!isPracticeStationModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 text-[#0A1931]">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#0A1931]">Practice Station</h3>
              <p className="text-[11px] text-slate-500 font-medium">Spaced recall & diagnostic drills</p>
            </div>
          </div>
          <button
            onClick={() => setIsPracticeStationModalOpen(false)}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#0A1931] flex items-center justify-center transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#1B2A4A]/70 leading-relaxed">
          Select a practice drill to train active recall and master your study decks:
        </p>

        <div className="space-y-2">
          <button
            onClick={() => {
              setIsPracticeStationModalOpen(false);
              setActiveTab("memorise");
            }}
            className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-[#0A1931] hover:bg-slate-50 flex items-center gap-3 transition text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-[#0A1931] group-hover:text-white transition">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0A1931]">Flashcards & Recall</p>
              <p className="text-[11px] text-[#1B2A4A]/60">Spaced repetition memory training</p>
            </div>
          </button>

          <button
            onClick={() => {
              setIsPracticeStationModalOpen(false);
              setActiveTab("quizzes");
            }}
            className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-[#0A1931] hover:bg-slate-50 flex items-center gap-3 transition text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-[#0A1931] group-hover:text-white transition">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0A1931]">Diagnostic Quizzes</p>
              <p className="text-[11px] text-[#1B2A4A]/60">Multiple choice & conceptual checks</p>
            </div>
          </button>

          <button
            onClick={() => {
              setIsPracticeStationModalOpen(false);
              setActiveTab("learn");
            }}
            className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-[#0A1931] hover:bg-slate-50 flex items-center gap-3 transition text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-[#0A1931] group-hover:text-white transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0A1931]">Step-by-Step Lessons</p>
              <p className="text-[11px] text-[#1B2A4A]/60">Guided breakdown of your material</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
