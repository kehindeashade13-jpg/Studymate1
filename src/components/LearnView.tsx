import React, { useState } from "react";
import { useStudy } from "../context/StudyContext";
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Lightbulb,
  Check,
  X,
  BookOpen,
  Award,
  Zap,
} from "lucide-react";
import { LessonStep } from "../types";

export const LearnView: React.FC = () => {
  const {
    activeMaterial,
    materials,
    setActiveMaterial,
    lessons,
    completeLessonStep,
    addXP,
    triggerConfetti,
    setIsAssistantOpen,
  } = useStudy();

  const currentLessonPack = activeMaterial ? lessons[activeMaterial.id] : null;

  const [currentStepIdx, setCurrentStepIdx] = useState<number>(
    currentLessonPack ? currentLessonPack.currentStepIndex || 0 : 0
  );

  // Question interaction state
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);

  if (!activeMaterial || !currentLessonPack || currentLessonPack.lessons.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <GraduationCap className="w-12 h-12 text-blue-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Select a Study Material to Start Lessons</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
          Step-by-Step AI Tutor breaks dense study materials into progressive, intuitive micro-lessons with analogies and interactive checks.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {materials.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMaterial(m)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition"
            >
              {m.title}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentStep: LessonStep = currentLessonPack.lessons[currentStepIdx] || currentLessonPack.lessons[0];
  const totalSteps = currentLessonPack.lessons.length;
  const progressPercent = Math.round(((currentStepIdx + (currentStep.completed ? 1 : 0)) / totalSteps) * 100);

  const handleSelectOption = (idx: number) => {
    if (hasSubmittedAnswer && isAnswerCorrect) return;
    setSelectedAnswer(idx);
    setHasSubmittedAnswer(false);
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === null) return;
    const isCorrect = selectedAnswer === currentStep.knowledgeCheck.correctIndex;
    setIsAnswerCorrect(isCorrect);
    setHasSubmittedAnswer(true);

    if (isCorrect) {
      completeLessonStep(activeMaterial.id, currentStepIdx);
      triggerConfetti();
    }
  };

  const handleNextStep = () => {
    if (currentStepIdx < totalSteps - 1) {
      setCurrentStepIdx((prev) => prev + 1);
      setSelectedAnswer(null);
      setHasSubmittedAnswer(false);
      setIsAnswerCorrect(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
      setSelectedAnswer(null);
      setHasSubmittedAnswer(false);
      setIsAnswerCorrect(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header with Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-500/20 text-blue-300">
              {activeMaterial.subject}
            </span>
            <span className="text-xs text-slate-400">Step-by-Step AI Tutor</span>
          </div>
          <h1 className="text-xl font-extrabold text-white">{activeMaterial.title}</h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[11px] text-slate-400">
              Step {currentStepIdx + 1} of {totalSteps}
            </p>
            <p className="text-sm font-bold text-blue-400">{progressPercent}% Mastered</p>
          </div>
          <div className="w-24 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Pills Navigator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {currentLessonPack.lessons.map((step, idx) => {
          const isCurr = idx === currentStepIdx;
          const isDone = step.completed;
          return (
            <button
              key={idx}
              onClick={() => {
                setCurrentStepIdx(idx);
                setSelectedAnswer(null);
                setHasSubmittedAnswer(false);
                setIsAnswerCorrect(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isCurr
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 border border-blue-500"
                  : isDone
                  ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/40"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[10px]">
                  {idx + 1}
                </span>
              )}
              <span>Lesson {idx + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Main Lesson Content Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-xs font-bold text-blue-400 tracking-wider uppercase">
            Lesson {currentStep.lessonNumber}
          </span>
          <h2 className="text-2xl font-black text-white mt-1">{currentStep.title}</h2>
          <p className="text-sm text-slate-400 mt-1">{currentStep.subtitle}</p>
        </div>

        {/* Content Paragraphs */}
        <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line space-y-4">
          {currentStep.content}
        </div>

        {/* Intuitive Analogy Box */}
        {currentStep.analogy && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-900 border border-indigo-500/30 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">
                Intuitive Mental Model & Analogy
              </h4>
              <p className="text-xs text-indigo-100/90 leading-relaxed">{currentStep.analogy}</p>
            </div>
          </div>
        )}

        {/* Key Terms Badges */}
        {currentStep.keyTerms && currentStep.keyTerms.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <span className="text-xs text-slate-400 font-semibold">Key Terms:</span>
            {currentStep.keyTerms.map((term) => (
              <span
                key={term}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700"
              >
                {term}
              </span>
            ))}
          </div>
        )}

        {/* Interactive Understanding Check */}
        <div className="pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Step Check: Confirm Your Understanding</span>
            </h3>
            <span className="text-[11px] text-amber-400 font-medium">+25 XP for Mastery</span>
          </div>

          <p className="text-xs sm:text-sm font-semibold text-slate-200 mb-4">
            {currentStep.knowledgeCheck.question}
          </p>

          <div className="space-y-2.5 mb-4">
            {currentStep.knowledgeCheck.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              let btnClass = "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800";

              if (hasSubmittedAnswer) {
                if (idx === currentStep.knowledgeCheck.correctIndex) {
                  btnClass = "bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold";
                } else if (isSelected && !isAnswerCorrect) {
                  btnClass = "bg-rose-950/60 border-rose-500 text-rose-200";
                }
              } else if (isSelected) {
                btnClass = "bg-blue-600/20 border-blue-500 text-white font-semibold";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${btnClass}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full border border-current text-[11px] flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                  {hasSubmittedAnswer && idx === currentStep.knowledgeCheck.correctIndex && (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  {hasSubmittedAnswer && isSelected && !isAnswerCorrect && (
                    <X className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback Explanations */}
          {hasSubmittedAnswer && (
            <div
              className={`p-4 rounded-xl border mb-4 animate-in fade-in ${
                isAnswerCorrect
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                  : "bg-amber-950/40 border-amber-500/40 text-amber-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-1 font-bold text-xs">
                {isAnswerCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Brilliant! Concept Understood (+25 XP)</span>
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span>Let's Re-frame This:</span>
                  </>
                )}
              </div>
              <p className="text-xs leading-relaxed">
                {isAnswerCorrect
                  ? currentStep.knowledgeCheck.reinforcement
                  : currentStep.knowledgeCheck.struggleExplanation}
              </p>
              {!isAnswerCorrect && (
                <div className="mt-2 pt-2 border-t border-amber-800/40 flex items-center justify-between text-[11px]">
                  <span className="text-amber-300/80">Hint: {currentStep.knowledgeCheck.hint}</span>
                  <button
                    onClick={() => setIsAssistantOpen(true)}
                    className="text-blue-400 font-semibold hover:underline"
                  >
                    Ask AI Tutor to explain simply →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action Check Button */}
          {!hasSubmittedAnswer ? (
            <button
              onClick={handleCheckAnswer}
              disabled={selectedAnswer === null}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              Check Answer
            </button>
          ) : isAnswerCorrect ? (
            <div className="flex gap-3">
              {currentStepIdx < totalSteps - 1 ? (
                <button
                  onClick={handleNextStep}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to Next Lesson</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-full p-4 rounded-xl bg-emerald-900/40 border border-emerald-500/40 text-center">
                  <Award className="w-8 h-8 text-emerald-400 mx-auto mb-1.5" />
                  <h4 className="text-sm font-bold text-white">All 6 Lessons Mastered!</h4>
                  <p className="text-xs text-emerald-300/80">
                    You have unlocked complete conceptual understanding of this topic.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                setHasSubmittedAnswer(false);
                setSelectedAnswer(null);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span>Try Again</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevStep}
          disabled={currentStepIdx === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Lesson</span>
        </button>

        <button
          onClick={handleNextStep}
          disabled={currentStepIdx === totalSteps - 1}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 transition"
        >
          <span>Next Lesson</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
