import React, { useState } from "react";
import { useStudy } from "../context/StudyContext";
import {
  CalendarDays,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  Brain,
  HelpCircle,
  GraduationCap,
  Calendar,
  Layers,
} from "lucide-react";
import { StudySubject } from "../types";
import { callGeminiApi } from "../utils/geminiClient";

export const StudyPlanView: React.FC = () => {
  const {
    studyPlan,
    togglePlanTask,
    activeMaterial,
    saveGeneratedPlan,
    setActiveTab,
    triggerConfetti,
  } = useStudy();

  const [isGenerating, setIsGenerating] = useState(false);
  const [examDate, setExamDate] = useState("2026-05-20");
  const [dailyHours, setDailyHours] = useState(2);
  const [targetSubject, setTargetSubject] = useState<StudySubject>("Biology");

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const data = await callGeminiApi<any>("/api/gemini/generate-plan", {
        subject: targetSubject,
        examDate,
        dailyTargetHours: dailyHours,
        materialContent: activeMaterial?.rawText || "General curriculum preparation",
      });
      if (data) {
        saveGeneratedPlan(data);
        triggerConfetti();
      }
    } catch {
      console.warn("Could not generate plan with Gemini, using structured template.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLaunchTask = (mode: string) => {
    if (mode === "notes") setActiveTab("library");
    else if (mode === "lesson") setActiveTab("learn");
    else if (mode === "memorise") setActiveTab("memorise");
    else if (mode === "quiz") setActiveTab("quizzes");
    else setActiveTab("dashboard");
  };

  if (!studyPlan) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <div className="p-8 rounded-3xl bg-white border border-[#E8E6DE] text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <CalendarDays className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
            Automated Spaced Study Plan
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            StudyMate builds an optimized, spaced active recall study calendar mapped to your exam date and uploaded materials.
          </p>

          <div className="max-w-md mx-auto space-y-4 text-left p-6 rounded-2xl bg-[#F8F7F4] border border-[#EAE8E0]">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Subject / Course
              </label>
              <input
                type="text"
                value={targetSubject}
                onChange={(e) => setTargetSubject(e.target.value)}
                placeholder="e.g. Molecular Biology, AP Calculus, Organic Chemistry..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-500 font-medium">Quick suggestions:</span>
                {["Biology", "Mathematics", "Chemistry", "Physics", "Computer Science", "History", "Business"].map(
                  (s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTargetSubject(s)}
                      className={`text-[11px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                        targetSubject === s
                          ? "bg-blue-600 text-white border-blue-600 font-bold"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {s}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Exam Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hours / Day
                </label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? "Synthesizing Custom Plan..." : "Generate AI Study Schedule"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-500/20 text-blue-300">
              {studyPlan.subject}
            </span>
            <span className="text-xs text-slate-400">Target Exam: {studyPlan.examDate}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">{studyPlan.planTitle}</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">{studyPlan.strategySummary}</p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-xs text-slate-400">Plan Progress</p>
          <p className="text-xl font-black text-blue-400">{studyPlan.progressPercent}%</p>
          <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden mt-1.5 border border-slate-700">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all"
              style={{ width: `${studyPlan.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Days Timeline */}
      <div className="space-y-4">
        {studyPlan.days.map((day) => {
          return (
            <div
              key={day.dayNumber}
              className={`p-5 rounded-2xl border transition ${
                day.completed
                  ? "bg-slate-900/60 border-slate-800"
                  : "bg-slate-900 border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center ${
                      day.completed
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-blue-600/20 text-blue-300 border border-blue-500/40"
                    }`}
                  >
                    D{day.dayNumber}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{day.topic}</h3>
                    <p className="text-xs text-slate-400">{day.focus}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 font-medium">{day.dateLabel}</span>
                  {day.milestone && (
                    <span className="text-[10px] text-amber-400 block">★ {day.milestone}</span>
                  )}
                </div>
              </div>

              {/* Day Tasks Checklist */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                {day.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition ${
                      task.completed
                        ? "bg-slate-800/30 border-slate-800 text-slate-500 line-through"
                        : "bg-slate-800/60 border-slate-700/60 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => {
                          togglePlanTask(day.dayNumber, task.id);
                          if (!task.completed) triggerConfetti();
                        }}
                        className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-semibold">{task.title}</p>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {task.durationMinutes} mins
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleLaunchTask(task.mode)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                    >
                      <span>Study Now</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Plan Re-generator Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-800/40 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold text-white">Generate a Custom AI Study Plan</h3>
        </div>
        <p className="text-xs text-slate-300">
          Tell StudyMate AI your target exam date and daily study availability. The algorithm will space your lessons, active recall flashcards, and diagnostic checkpoints.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 font-semibold mb-1">
              Target Subject / Course
            </label>
            <input
              type="text"
              value={targetSubject}
              onChange={(e) => setTargetSubject(e.target.value)}
              placeholder="e.g. Molecular Biology"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-semibold mb-1">
              Exam Date
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-semibold mb-1">
              Daily Hours Target
            </label>
            <input
              type="number"
              min={1}
              max={8}
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
            />
          </div>
        </div>

        <button
          onClick={handleGeneratePlan}
          disabled={isGenerating}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
        >
          {isGenerating ? "Crafting Spaced Schedule..." : "Build Personalized AI Plan"}
        </button>
      </div>
    </div>
  );
};
