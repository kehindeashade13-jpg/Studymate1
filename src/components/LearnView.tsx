import React, { useState, useEffect } from "react";
import { useStudy } from "../context/StudyContext";
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Lightbulb,
  Award,
  Check,
  X,
  Zap,
} from "lucide-react";
import { LessonStep, LessonQuestion } from "../types";
import { create5QuestionsForLesson } from "../utils/studyTransformer";

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

  // 5 Questions per lesson state
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<number, boolean>>({});
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, boolean>>({});

  // Reset question states when switching lessons
  useEffect(() => {
    setActiveQuestionIdx(0);
    setSelectedAnswers({});
    setSubmittedAnswers({});
    setCorrectAnswers({});
  }, [currentStepIdx, activeMaterial?.id]);

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

  // Guarantee exactly 5 questions for this lesson
  const questionsList: LessonQuestion[] =
    currentStep.questions && currentStep.questions.length >= 5
      ? currentStep.questions
      : create5QuestionsForLesson(currentStep.lessonNumber || currentStepIdx + 1, currentStep.title, activeMaterial.title);

  const currentQ = questionsList[activeQuestionIdx] || questionsList[0];
  const selectedAnswer = selectedAnswers[activeQuestionIdx] ?? null;
  const hasSubmittedAnswer = !!submittedAnswers[activeQuestionIdx];
  const isAnswerCorrect = !!correctAnswers[activeQuestionIdx];

  const masteredQuestionsCount = Object.values(correctAnswers).filter(Boolean).length;

  const handleSelectOption = (idx: number) => {
    if (hasSubmittedAnswer && isAnswerCorrect) return;
    setSelectedAnswers((prev) => ({ ...prev, [activeQuestionIdx]: idx }));
    setSubmittedAnswers((prev) => ({ ...prev, [activeQuestionIdx]: false }));
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === null) return;
    const isCorrect = selectedAnswer === currentQ.correctIndex;
    setCorrectAnswers((prev) => ({ ...prev, [activeQuestionIdx]: isCorrect }));
    setSubmittedAnswers((prev) => ({ ...prev, [activeQuestionIdx]: true }));

    if (isCorrect) {
      triggerConfetti();
      addXP(25);
      // If all 5 questions for this lesson mastered, mark step complete
      const newCorrectCount = masteredQuestionsCount + (correctAnswers[activeQuestionIdx] ? 0 : 1);
      if (newCorrectCount >= questionsList.length) {
        completeLessonStep(activeMaterial.id, currentStepIdx);
      }
    }
  };

  const handleNextStep = () => {
    if (currentStepIdx < totalSteps - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
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
              Lesson {currentStepIdx + 1} of {totalSteps}
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

      {/* Step Navigator Pill Track */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {currentLessonPack.lessons.map((step, idx) => {
          const isActive = idx === currentStepIdx;
          const isDone = step.completed || idx < currentStepIdx;

          return (
            <button
              key={step.lessonNumber || idx}
              onClick={() => setCurrentStepIdx(idx)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : isDone
                  ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/40"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-800"
              }`}
            >
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] border border-current">
                {isDone ? "✓" : idx + 1}
              </span>
              <span>Lesson {idx + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Main Lesson Stage */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        {/* Step Header */}
        <div className="border-b border-slate-800 pb-5">
          <div className="flex items-center justify-between text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1">
            <span>Lesson {currentStep.lessonNumber || currentStepIdx + 1} of {totalSteps}</span>
            <span>5 Interactive Questions Below</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">{currentStep.title}</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">{currentStep.subtitle}</p>
        </div>

        {/* Lesson Body Content */}
        <div className="text-xs sm:text-sm text-slate-200 leading-relaxed space-y-4 whitespace-pre-line font-sans">
          {currentStep.content}
        </div>

        {/* Intuitive Analogy Box */}
        {currentStep.analogy && (
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-300 shrink-0">
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

        {/* 5 PRACTICE QUESTIONS UNDER LESSON */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                5 Practice Questions for Lesson {currentStep.lessonNumber || currentStepIdx + 1}
              </h3>
            </div>
            <span className="text-xs font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-3 py-1 rounded-full w-fit">
              {masteredQuestionsCount} of 5 Answered Correctly (+25 XP each)
            </span>
          </div>

          {/* Question Selector Tabs (Q1, Q2, Q3, Q4, Q5) */}
          <div className="grid grid-cols-5 gap-2 pt-1">
            {questionsList.map((_, qIdx) => {
              const isCurrent = qIdx === activeQuestionIdx;
              const isDone = !!correctAnswers[qIdx];
              const isWrong = hasSubmittedAnswer && activeQuestionIdx === qIdx && !isAnswerCorrect;

              return (
                <button
                  key={qIdx}
                  onClick={() => setActiveQuestionIdx(qIdx)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                    isCurrent
                      ? "bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-600/20"
                      : isDone
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                      : isWrong
                      ? "bg-rose-950/40 border-rose-500/40 text-rose-300"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                  }`}
                >
                  <span>Q{qIdx + 1}</span>
                  {isDone && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              );
            })}
          </div>

          {/* Active Question Prompt */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-850 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-blue-400">
                Question {activeQuestionIdx + 1} of 5
              </span>
              <span>Select one answer</span>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
              {currentQ.question}
            </p>

            {/* 4 Objective Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedAnswer === idx;
                let btnClass = "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800";

                if (hasSubmittedAnswer) {
                  if (idx === currentQ.correctIndex) {
                    btnClass = "bg-emerald-950/70 border-emerald-500 text-emerald-200 font-semibold";
                  } else if (isSelected && !isAnswerCorrect) {
                    btnClass = "bg-rose-950/70 border-rose-500 text-rose-200";
                  }
                } else if (isSelected) {
                  btnClass = "bg-blue-600/30 border-blue-500 text-white font-semibold";
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
                    {hasSubmittedAnswer && idx === currentQ.correctIndex && (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    {hasSubmittedAnswer && isSelected && !isAnswerCorrect && (
                      <X className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Feedback & Detailed Explanation */}
            {hasSubmittedAnswer && (
              <div
                className={`p-4 rounded-xl border animate-in fade-in ${
                  isAnswerCorrect
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                    : "bg-amber-950/40 border-amber-500/40 text-amber-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 font-bold text-xs">
                  {isAnswerCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Brilliant! Question {activeQuestionIdx + 1} Understood (+25 XP)</span>
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span>Review Concept Explanation:</span>
                    </>
                  )}
                </div>
                <p className="text-xs leading-relaxed">
                  {isAnswerCorrect ? currentQ.reinforcement : currentQ.struggleExplanation}
                </p>
                {!isAnswerCorrect && (
                  <div className="mt-2.5 pt-2 border-t border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-2">
                    <span className="text-amber-300/80">Hint: {currentQ.hint}</span>
                    <button
                      onClick={() => setIsAssistantOpen(true)}
                      className="text-blue-400 font-semibold hover:underline self-start sm:self-auto cursor-pointer"
                    >
                      Ask AI Tutor for guidance →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons for Active Question */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              {!hasSubmittedAnswer ? (
                <button
                  onClick={handleCheckAnswer}
                  disabled={selectedAnswer === null}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
                >
                  Check Answer (Question {activeQuestionIdx + 1} of 5)
                </button>
              ) : isAnswerCorrect ? (
                <div className="w-full flex gap-2">
                  {activeQuestionIdx < questionsList.length - 1 ? (
                    <button
                      onClick={() => setActiveQuestionIdx((prev) => prev + 1)}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Next Question (Q{activeQuestionIdx + 2})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : currentStepIdx < totalSteps - 1 ? (
                    <button
                      onClick={handleNextStep}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Complete Lesson {currentStep.lessonNumber || currentStepIdx + 1} & Go to Lesson {currentStepIdx + 2}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="w-full p-3 rounded-xl bg-emerald-900/40 border border-emerald-500/40 text-center">
                      <Award className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                      <h4 className="text-xs font-bold text-white">All Lessons & Questions Mastered!</h4>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSubmittedAnswers((prev) => ({ ...prev, [activeQuestionIdx]: false }));
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                >
                  <RotateCcw className="w-4 h-4 text-slate-400" />
                  <span>Try Question Again</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer for Lessons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevStep}
          disabled={currentStepIdx === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Lesson</span>
        </button>

        <button
          onClick={handleNextStep}
          disabled={currentStepIdx === totalSteps - 1}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 transition cursor-pointer"
        >
          <span>Next Lesson</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
