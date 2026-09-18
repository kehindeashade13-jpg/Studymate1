import React from "react";
import { useStudy } from "../context/StudyContext";
import {
  Sparkles,
  BookOpen,
  Brain,
  GraduationCap,
  Users2,
  HelpCircle,
  ArrowRight,
  Zap,
  CheckCircle2,
  Shield,
  Layers,
  Flame,
  FileText,
  Video,
  Mic,
  Camera,
} from "lucide-react";

export const LandingView: React.FC = () => {
  const { setActiveTab, setIsAddModalOpen } = useStudy();

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-20 pt-4">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI-Powered Learning Platform for Students</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          Turn your study materials into{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            understanding.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Import lecture slides, photos of textbook pages, audio recordings, or YouTube lectures. StudyMate transforms dense information into structured notes, step-by-step interactive lessons, spaced recall flashcards, and diagnostic quizzes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-xl shadow-blue-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Open Student Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition cursor-pointer"
          >
            Import Study Material
          </button>
        </div>
      </div>

      {/* Multi-source Ingestion Showcase */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            Flexible Ingestion
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Study whatever you have, wherever you learn
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Never waste hours manually typing or formatting your notes.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { icon: FileText, title: "PDF & Slides", desc: "Lecture decks & readings" },
            { icon: Camera, title: "Photo of Notes", desc: "Handwritten or textbooks" },
            { icon: Video, title: "YouTube Lectures", desc: "Full lecture video breakdown" },
            { icon: Mic, title: "Audio & Voice", desc: "Seminar and class recordings" },
            { icon: BookOpen, title: "Paste Text / URL", desc: "Articles and research papers" },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-850/60 border border-slate-800 text-center space-y-2"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-white">{item.title}</h3>
                <p className="text-[11px] text-slate-400 leading-tight">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* The 4 Learning Modalities */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
            The StudyMate Learning Suite
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            From Raw Content to True Mastery
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Every AI feature moves you closer to exam readiness.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveTab("library")}
            className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/60 transition cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Structured Notes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Clean visual summaries with core concepts, bullet points, real-world examples, and key takeaways.
              </p>
            </div>
            <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
              <span>View Notes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div
            onClick={() => setActiveTab("learn")}
            className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/60 transition cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Step-by-Step AI Tutor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Progressive micro-lessons that explain intuition and analogies, with instant understanding checks after each step.
              </p>
            </div>
            <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
              <span>Start Lessons</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div
            onClick={() => setActiveTab("memorise")}
            className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/60 transition cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Active Recall & Mnemonics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Spaced repetition flashcards with difficulty ratings, acrostic memory hooks, and fill-in-the-blank retrieval drills.
              </p>
            </div>
            <span className="text-xs text-purple-400 font-semibold flex items-center gap-1">
              <span>Memorise Deck</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div
            onClick={() => setActiveTab("quizzes")}
            className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/60 transition cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Diagnostic Quizzes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Comprehensive assessments with deep explanations and the "Study My Weak Areas" one-click drill generator.
              </p>
            </div>
            <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
              <span>Take Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Social & Collaboration Section */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-800/40 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold">
            <Users2 className="w-3.5 h-3.5" />
            <span>Social & Peer Learning</span>
          </div>
          <h2 className="text-2xl font-black text-white">Study Circles & Matchmaking</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Form study groups with classmates, challenge friends to flashcard battles, and collaborate with StudyMate AI directly in group chats.
          </p>
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setActiveTab("groups")}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow"
            >
              Explore Study Groups
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              Find Study Partners
            </button>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2.5 max-w-xs w-full">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="font-bold text-white">Organic Chemistry Circle</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Sarah: "Hey team, how do we distinguish SN1 vs SN2 reaction mechanisms?"
          </p>
          <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-800/40 text-[11px] text-purple-200">
            ✨ <strong>StudyMate AI:</strong> "Think solvent polarity and steric hindrance! Let's do a 2-minute practice drill."
          </div>
        </div>
      </div>
    </div>
  );
};
