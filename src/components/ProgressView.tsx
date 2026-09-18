import React from "react";
import { useStudy } from "../context/StudyContext";
import {
  BarChart3,
  Flame,
  Zap,
  Clock,
  Award,
  CheckCircle2,
  TrendingUp,
  Brain,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
} from "lucide-react";

export const ProgressView: React.FC = () => {
  const {
    user,
    progress,
    achievements,
    setActiveTab,
    setIsWeakAreaMode,
  } = useStudy();

  const handleStudyWeakAreas = () => {
    setIsWeakAreaMode(true);
    setActiveTab("quizzes");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <span>Progress, Mastery & Achievements</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Track your learning momentum, spaced retention scores, and subject mastery.
        </p>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Current Streak</span>
            <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <div>
            <span className="text-3xl font-black text-white">{user.streakDays}</span>
            <span className="text-xs text-slate-400 ml-1">Days</span>
          </div>
          <p className="text-[11px] text-amber-400 mt-1 font-medium">Keep daily streak active</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Total XP Points</span>
            <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400" />
          </div>
          <div>
            <span className="text-3xl font-black text-white">{user.xp.toLocaleString()}</span>
            <span className="text-xs text-slate-400 ml-1">XP</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 font-medium">+15 XP per card review</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Cards Mastered</span>
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <span className="text-3xl font-black text-white">{progress.flashcardsMastered}</span>
            <span className="text-xs text-slate-400 ml-1">/ {progress.flashcardsReviewed}</span>
          </div>
          <p className="text-[11px] text-purple-400 mt-1 font-medium">
            {Math.round((progress.flashcardsMastered / Math.max(1, progress.flashcardsReviewed)) * 100)}% retention rate
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Avg Quiz Score</span>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <span className="text-3xl font-black text-white">{progress.averageQuizScore}</span>
            <span className="text-xs text-slate-400 ml-1">%</span>
          </div>
          <p className="text-[11px] text-blue-400 mt-1 font-medium">
            {progress.quizzesCompleted} diagnostic tests completed
          </p>
        </div>
      </div>

      {/* Two Column Grid: Subject Mastery & Weak Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Subject Mastery Bars (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>Subject Mastery Breakdown</span>
          </h2>
          <p className="text-xs text-slate-400">
            Calculated from completed lessons, spaced repetition card ratings, and diagnostic accuracy.
          </p>

          <div className="space-y-4 pt-2">
            {Object.entries(progress.subjectMastery)
              .filter(([_, score]) => (score as number) > 0)
              .map(([subj, score]) => (
                <div key={subj} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{subj}</span>
                    <span className="font-bold text-blue-400">{score}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Right: Weak Areas List & Remediation (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Identified Weak Areas</span>
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                {progress.weakAreas.length} Topics
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Concepts where questions were missed during active diagnostic checks.
            </p>

            <div className="space-y-2.5 mt-4">
              {progress.weakAreas.map((w, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-white block">{w.topic}</span>
                    <span className="text-[10px] text-amber-400/80">{w.subject}</span>
                  </div>
                  <span className="text-[11px] text-rose-400 font-bold">
                    Missed {w.missCount}x
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleStudyWeakAreas}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            <span>Launch Targeted Weak Areas Drill</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Achievements & Badges Grid */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Milestones & Academic Badges</span>
            </h2>
            <p className="text-xs text-slate-400">Unlock study badges by maintaining consistent learning habits.</p>
          </div>

          <span className="text-xs text-slate-400">
            {achievements.filter((a) => a.unlocked).length} of {achievements.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-4 rounded-xl border transition ${
                ach.unlocked
                  ? "bg-slate-800/60 border-amber-500/30 text-white"
                  : "bg-slate-900/40 border-slate-800/80 text-slate-500 opacity-60"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{ach.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">{ach.title}</h4>
                    {ach.unlocked && (
                      <span className="text-[10px] text-emerald-400 font-semibold">Unlocked</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {ach.description}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span>
                      Progress: {ach.progress} / {ach.maxProgress}
                    </span>
                    {ach.unlockedDate && <span>{ach.unlockedDate}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
