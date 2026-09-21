import React from "react";
import { UniversalContentRenderer } from "./UniversalContentRenderer";
import {
  CheckCircle2,
  Sparkles,
  BookOpen,
  Brain,
  GraduationCap,
  HelpCircle,
  FileText,
  ArrowRight,
  ListOrdered,
  Calendar,
  X,
} from "lucide-react";
import { StudyMaterial } from "../types";
import { useStudy, ActiveTab } from "../context/StudyContext";

interface ProcessingScreenProps {
  currentStage?: number; // 0 to 5
  material?: StudyMaterial | null;
  selectedGoal?: "note" | "memorise" | "lesson";
  onSelectAction: (tab: ActiveTab) => void;
  isVisible?: boolean;
  onClose?: () => void;
}

const processingStages = [
  "Uploading study file to Supabase Storage",
  "Reading material & analyzing structure",
  "Identifying key concepts & generating notes",
  "Formulating active recall flashcards",
  "Saving structured data to Supabase Database",
];

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({
  currentStage = 0,
  material = null,
  selectedGoal = "note",
  onSelectAction,
  isVisible = true,
  onClose,
}) => {
  if (!isVisible) return null;

  const isComplete = currentStage >= 5 && material !== null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative max-w-xl w-full bg-[#F8FAFC] border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 text-[#0F172A]">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-[#0F172A] hover:bg-slate-200/60 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {!isComplete ? (
          <div className="text-center py-4">
            {/* Animated Brain / Sparkle Icon */}
            <div className="relative w-18 h-18 mx-auto mb-5 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-[#6366F1]/20 animate-ping" />
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#6366F1] animate-spin" />
              <div className="w-13 h-13 rounded-2xl bg-[#6366F1] flex items-center justify-center shadow-lg shadow-[#6366F1]/30">
                <Sparkles className="w-6 h-6 text-white animate-pulse" />
              </div>
            </div>

            <h3 className="text-2xl font-black text-[#0F172A] tracking-tight mb-1.5">
              Transforming your material...
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
              Saving your document to Supabase Storage, running AI concept extraction, and generating structured notes & flashcards.
            </p>

            {/* Real Stages Progression */}
            <div className="space-y-2.5 max-w-md mx-auto text-left">
              {processingStages.map((stageText, idx) => {
                const isPast = currentStage > idx;
                const isCurrent = currentStage === idx;

                return (
                  <div
                    key={stageText}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-300 ${
                      isPast
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : isCurrent
                        ? "bg-white text-[#0F172A] border-[#6366F1] shadow-sm ring-1 ring-[#6366F1]/30"
                        : "bg-slate-100/60 text-slate-400 border-transparent"
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                    )}
                    <span className="text-xs sm:text-sm font-semibold truncate">{stageText}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Ready Screen */
          <div className="py-2">
            <div className="flex items-center gap-3 mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <h3 className="font-bold text-base text-[#0F172A]">Your study material is ready!</h3>
                <p className="text-xs text-emerald-800">
                  Saved to Supabase Storage & Database tables with notes, flashcards, and key concepts:
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-full">
                    {material.courseCode || material.subject}
                  </span>
                  <p className="text-xs font-bold text-[#0F172A] truncate">
                    <UniversalContentRenderer as="span" content={material.title} inline />
                  </p>
                </div>
              </div>
            </div>

            {/* AI Identified Insights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Main Topics</span>
                <span className="text-base font-extrabold text-[#6366F1]">{material.mainTopics?.length || 4}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Definitions</span>
                <span className="text-base font-extrabold text-[#6366F1]">{material.definitions?.length || 3}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Key Concepts</span>
                <span className="text-base font-extrabold text-emerald-600">{material.keyConcepts?.length || 3}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Exam Questions</span>
                <span className="text-base font-extrabold text-[#F59E0B]">{material.potentialExamQuestions?.length || 2}</span>
              </div>
            </div>

            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2.5">
              Choose your study mode:
            </h4>

            {/* Study Mode Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
              {/* 1. Note */}
              <button
                onClick={() => onSelectAction("library")}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition group cursor-pointer ${
                  selectedGoal === "note"
                    ? "bg-white border-[#6366F1] shadow-sm ring-1 ring-[#6366F1]/30"
                    : "bg-white hover:bg-slate-50 border-slate-200"
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#6366F1] flex items-center justify-center shrink-0 group-hover:bg-[#6366F1] group-hover:text-white transition">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#0F172A]">
                    <span>Study Notes</span>
                    {selectedGoal === "note" && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-[#6366F1] font-bold">
                        Requested
                      </span>
                    )}
                    <ArrowRight className="w-3 h-3 text-[#6366F1]" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Structured notes with definitions, key takeaways, and formulas.
                  </p>
                </div>
              </button>

              {/* 2. Memorise */}
              <button
                onClick={() => onSelectAction("memorise")}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition group cursor-pointer ${
                  selectedGoal === "memorise"
                    ? "bg-white border-[#6366F1] shadow-sm ring-1 ring-[#6366F1]/30"
                    : "bg-white hover:bg-slate-50 border-slate-200"
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#0F172A]">
                    <span>Memorise & Flashcards</span>
                    {selectedGoal === "memorise" && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold">
                        Requested
                      </span>
                    )}
                    <ArrowRight className="w-3 h-3 text-purple-600" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Active recall flashcards, mnemonics, and spaced repetition.
                  </p>
                </div>
              </button>

              {/* 3. Step-by-step lesson */}
              <button
                onClick={() => onSelectAction("learn")}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition group cursor-pointer ${
                  selectedGoal === "lesson"
                    ? "bg-white border-[#6366F1] shadow-sm ring-1 ring-[#6366F1]/30"
                    : "bg-white hover:bg-slate-50 border-slate-200"
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#0F172A]">
                    <span>Step-by-Step Lesson</span>
                    {selectedGoal === "lesson" && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-bold">
                        Requested
                      </span>
                    )}
                    <ArrowRight className="w-3 h-3 text-blue-600" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Guided interactive lesson breaking topics down progressively.
                  </p>
                </div>
              </button>

              {/* Diagnostic Quiz */}
              <button
                onClick={() => onSelectAction("quizzes")}
                className="flex items-start gap-3 p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center shrink-0 group-hover:bg-[#F59E0B] group-hover:text-white transition">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#0F172A]">
                    <span>Diagnostic Quiz</span>
                    <ArrowRight className="w-3 h-3 text-[#F59E0B]" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Diagnostic testing to isolate weak areas and test retention.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                onClick={() => onSelectAction("dashboard")}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-[#0F172A] hover:bg-slate-100 transition cursor-pointer"
              >
                Return to Dashboard
              </button>
              <button
                onClick={() =>
                  onSelectAction(
                    selectedGoal === "note"
                      ? "library"
                      : selectedGoal === "memorise"
                      ? "memorise"
                      : "learn"
                  )
                }
                className="px-5 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>
                  Open{" "}
                  {selectedGoal === "note"
                    ? "Study Notes"
                    : selectedGoal === "memorise"
                    ? "Memorise Deck"
                    : "Interactive Lesson"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
