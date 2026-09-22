import React, { useState, useMemo, useEffect } from "react";
import { useStudy } from "../context/StudyContext";
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Award,
  ArrowRight,
  TrendingUp,
  Lightbulb,
  Check,
  X,
  Plus,
} from "lucide-react";
import { QuizQuestion } from "../types";
import { CleanFormattedText } from "./CleanFormattedText";
import { generateDiagnosticQuestions } from "../utils/studyTransformer";

export const QuizzesView: React.FC = () => {
  const {
    activeMaterial,
    materials,
    setActiveMaterial,
    quizzes,
    submitQuizAttempt,
    isWeakAreaMode,
    setIsWeakAreaMode,
    saveGeneratedQuiz,
    triggerConfetti,
    setIsAssistantOpen,
  } = useStudy();

  const currentQuiz = activeMaterial ? quizzes[activeMaterial.id] : null;

  // Quiz taking state
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongQuestions, setWrongQuestions] = useState<QuizQuestion[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Guarantee 20 distinct questions strictly grounded in the uploaded file
  const fullQuestions: QuizQuestion[] = useMemo(() => {
    if (!activeMaterial) return [];
    const baseQuestions = (currentQuiz?.questions || []).filter((q) => {
      const txt = (q.question + " " + q.options.join(" ")).toLowerCase();
      return (
        !txt.includes("uploaded study file") &&
        !txt.includes("uploaded file") &&
        !txt.includes("what is the file") &&
        !txt.includes("what is the uploaded")
      );
    });

    if (baseQuestions.length >= 20) {
      return baseQuestions.slice(0, 20);
    }

    // Generate full 20 diagnostic questions strictly grounded in this material
    const generated = generateDiagnosticQuestions(
      activeMaterial.id,
      activeMaterial.title,
      activeMaterial.subject,
      activeMaterial.rawText,
      activeMaterial.definitions || [],
      activeMaterial.summary || "",
      1
    );

    // Merge existing clean questions with generated to hit exactly 20 distinct questions
    const combined = [...baseQuestions];
    for (const gq of generated) {
      if (combined.length >= 20) break;
      if (!combined.some((q) => q.question.toLowerCase() === gq.question.toLowerCase())) {
        combined.push(gq);
      }
    }
    return combined.slice(0, 20);
  }, [currentQuiz, activeMaterial]);

  // Reset indices when changing active material
  useEffect(() => {
    setCurrentQuestionIdx(0);
    setSelectedAnswers({});
    setIsQuizSubmitted(false);
    setWrongQuestions([]);
  }, [activeMaterial?.id]);

  if (!activeMaterial || (!currentQuiz && fullQuestions.length === 0)) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <HelpCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Select a Study Material to Take Quizzes</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
          Diagnostic quizzes evaluate deep conceptual mastery with 20 distinct scenario and mechanism questions strictly grounded in your uploaded file.
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

  // If in "Study My Weak Areas" mode and wrong questions exist, filter
  const displayedQuestions =
    isWeakAreaMode && wrongQuestions.length > 0
      ? wrongQuestions
      : fullQuestions;

  const currentQ = displayedQuestions[currentQuestionIdx] || displayedQuestions[0];
  const totalQuestions = displayedQuestions.length;

  const handleSelectOption = (qId: string, answer: string) => {
    if (isQuizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: answer }));
  };

  const handleSubmitQuiz = () => {
    let calculatedScore = 0;
    const wrong: QuizQuestion[] = [];
    const weakTopics: string[] = [];

    displayedQuestions.forEach((q) => {
      const userAns = (selectedAnswers[q.id] || "").trim().toLowerCase();
      const correctAns = (q.correctAnswer || "").trim().toLowerCase();

      if (userAns === correctAns) {
        calculatedScore++;
      } else {
        wrong.push(q);
        if (q.topicTag && !weakTopics.includes(q.topicTag)) {
          weakTopics.push(q.topicTag);
        }
      }
    });

    setScore(calculatedScore);
    setWrongQuestions(wrong);
    setIsQuizSubmitted(true);

    if (activeMaterial) {
      submitQuizAttempt(
        activeMaterial.id,
        calculatedScore,
        totalQuestions,
        wrong.map((w) => w.id),
        weakTopics
      );
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setIsQuizSubmitted(false);
    setCurrentQuestionIdx(0);
    setIsWeakAreaMode(false);
  };

  const handleGenerateFreshQuiz = async () => {
    if (!activeMaterial) return;
    setIsGeneratingQuiz(true);
    try {
      const randomVariant = Math.floor(Math.random() * 5) + 1;
      const res = await fetch("/api/gemini/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeMaterial.title,
          content: activeMaterial.rawText || activeMaterial.content || activeMaterial.summary || "",
          questionCount: 20,
          variant: randomVariant,
        }),
      });
      const data = await res.json();
      if (data.data) {
        saveGeneratedQuiz(activeMaterial.id, data.data);
        handleRestart();
        triggerConfetti();
      }
    } catch {
      console.warn("Could not generate fresh quiz with Gemini, using generated diagnostic pool.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300">
              {activeMaterial.courseCode || activeMaterial.subject}
            </span>
            {isWeakAreaMode && (
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-rose-500/20 text-rose-300">
                Weak Area Drill Mode
              </span>
            )}
            <span className="text-xs text-slate-400">Diagnostic Assessment</span>
          </div>
          <h1 className="text-xl font-extrabold text-white">{currentQuiz.quizTitle}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateFreshQuiz}
            disabled={isGeneratingQuiz}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>{isGeneratingQuiz ? "Generating..." : "Generate New Questions"}</span>
          </button>
        </div>
      </div>

      {!isQuizSubmitted ? (
        /* ACTIVE QUIZ QUESTION STAGE */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 text-slate-100">
          {/* Progress Bar & Question Count */}
          <div className="flex items-center justify-between text-xs text-slate-400 pb-4 border-b border-slate-800">
            <span>
              Question {currentQuestionIdx + 1} of {totalQuestions}
            </span>
            <div className="flex items-center gap-2">
              <span className="capitalize">{currentQ.difficulty || "medium"} difficulty</span>
              {currentQ.topicTag && (
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                  {currentQ.topicTag}
                </span>
              )}
            </div>
          </div>

          {/* Question Text */}
          <div>
            <CleanFormattedText
              as="h3"
              content={currentQ.question}
              className="text-base sm:text-lg font-bold text-white leading-relaxed"
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedAnswers[currentQ.id] === opt;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(currentQ.id, opt)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-amber-500/20 border-amber-500 text-white shadow-sm"
                      : "bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className={`w-6 h-6 rounded-full border text-xs flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "border-amber-400 text-amber-300 font-bold"
                          : "border-slate-600 text-slate-400"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <CleanFormattedText as="span" content={opt} className="break-words" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Stepper Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
              disabled={currentQuestionIdx === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 transition"
            >
              Previous Question
            </button>

            {currentQuestionIdx < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentQuestionIdx((p) => Math.min(totalQuestions - 1, p + 1))}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20 transition cursor-pointer"
              >
                Submit Quiz & View Results
              </button>
            )}
          </div>
        </div>
      ) : (
        /* QUIZ SCORE REPORT & REMEDIATION SCREEN */
        <div className="space-y-6 animate-in fade-in">
          {/* Score Card */}
          <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">
                You Scored {score} out of {totalQuestions} (
                {Math.round((score / totalQuestions) * 100)}%)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {score === totalQuestions
                  ? "Flawless score! You have completely mastered this concept."
                  : "Great effort! Review your missed questions and weak area explanations below."}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {wrongQuestions.length > 0 && (
                <button
                  onClick={() => {
                    setIsWeakAreaMode(true);
                    setIsQuizSubmitted(false);
                    setCurrentQuestionIdx(0);
                    setSelectedAnswers({});
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Study My Weak Areas ({wrongQuestions.length} Questions)</span>
                </button>
              )}

              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Full Quiz</span>
              </button>
            </div>
          </div>

          {/* Detailed Question Review Breakdown */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Question by Question Breakdown</h3>

            {displayedQuestions.map((q, idx) => {
              const userAns = selectedAnswers[q.id];
              const isCorrect = userAns?.trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase();

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border ${
                    isCorrect
                      ? "bg-slate-900/60 border-emerald-500/30"
                      : "bg-slate-900/60 border-rose-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">Question {idx + 1}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                        isCorrect
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span>{isCorrect ? "Correct" : "Missed"}</span>
                    </span>
                  </div>

                  <CleanFormattedText as="h4" content={q.question} className="text-sm font-bold text-white mb-3" />

                  <div className="space-y-1.5 text-xs mb-3">
                    <div className="text-slate-300 flex items-center gap-1.5 flex-wrap">
                      <strong>Your Answer:</strong>{" "}
                      <CleanFormattedText
                        as="span"
                        content={userAns || "(No answer selected)"}
                        className={isCorrect ? "text-emerald-300 font-semibold" : "text-rose-300 font-semibold"}
                      />
                    </div>
                    {!isCorrect && (
                      <div className="text-emerald-300 flex items-center gap-1.5 flex-wrap">
                        <strong>Correct Answer:</strong>{" "}
                        <CleanFormattedText as="span" content={q.correctAnswer} className="text-emerald-300 font-medium" />
                      </div>
                    )}
                  </div>

                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
                      <strong className="text-blue-400 block mb-0.5">Why this matters:</strong>
                      <CleanFormattedText content={q.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
