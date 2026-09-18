import React, { useState } from "react";
import { useStudy, ActiveTab } from "../context/StudyContext";
import {
  LayoutDashboard,
  FolderKanban,
  GraduationCap,
  Brain,
  HelpCircle,
  Users2,
  UserPlus,
  CalendarDays,
  BarChart3,
  UserCircle,
  Sparkles,
  Plus,
  X,
  Trash2,
  Flame,
  Zap,
  BookOpen,
  ChevronRight,
  Layers,
  Crown,
  Settings,
  HelpCircle as SupportIcon,
  Clock,
  MessageSquare,
} from "lucide-react";
import { StudyMaterial } from "../types";

interface NavItem {
  tab: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isBoldUpper?: boolean;
}

const mainNavItems: NavItem[] = [
  { tab: "dashboard", label: "Home", icon: LayoutDashboard },
  { tab: "library", label: "All Decks", icon: FolderKanban },
  { tab: "memorise", label: "Flashcards", icon: Brain, badge: "Recall" },
  { tab: "quizzes", label: "Quizzes & Tests", icon: HelpCircle },
  { tab: "learn", label: "Step Lessons", icon: GraduationCap },
  { tab: "groups", label: "Study Groups", icon: Users2, badge: "Chat" },
  { tab: "friends", label: "Find Friends", icon: UserPlus },
  { tab: "plan", label: "Study Plan", icon: CalendarDays },
  { tab: "progress", label: "Progress & Stats", icon: BarChart3 },
  { tab: "profile", label: "Profile", icon: UserCircle },
  { tab: "history", label: "HISTORY", icon: Clock, isBoldUpper: true },
];

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    activeMaterial,
    setActiveMaterial,
    openAddMaterialModal,
    setIsAssistantOpen,
    isSidebarOpen,
    setIsSidebarOpen,
    clearAllCourses,
    materials,
    user,
    setIsPracticeStationModalOpen,
  } = useStudy();

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const handleSelectDeck = (mat: StudyMaterial, mode: ActiveTab = "learn") => {
    setActiveMaterial(mat);
    setActiveTab(mode);
    setIsSidebarOpen(false);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        "Are you sure you want to delete all uploaded courses? This will leave your library completely empty and ready for new materials."
      )
    ) {
      clearAllCourses();
      setIsSidebarOpen(false);
    }
  };

  // Helper for subject icon/color
  const getSubjectMeta = (subject: string) => {
    switch (subject.toLowerCase()) {
      case "biology":
        return { color: "text-emerald-600 bg-emerald-100", emoji: "🧬" };
      case "mathematics":
        return { color: "text-blue-600 bg-blue-100", emoji: "📐" };
      case "chemistry":
        return { color: "text-teal-600 bg-teal-100", emoji: "🧪" };
      case "physics":
        return { color: "text-cyan-600 bg-cyan-100", emoji: "⚛️" };
      case "history":
        return { color: "text-amber-600 bg-amber-100", emoji: "🏛️" };
      case "computer science":
        return { color: "text-indigo-600 bg-indigo-100", emoji: "💻" };
      case "english":
        return { color: "text-purple-600 bg-purple-100", emoji: "📖" };
      case "business":
        return { color: "text-rose-600 bg-rose-100", emoji: "📊" };
      case "psychology":
        return { color: "text-pink-600 bg-pink-100", emoji: "🧠" };
      default:
        return { color: "text-slate-600 bg-slate-100", emoji: "📚" };
    }
  };

  return (
    <>
      {/* Slide-out Menu Drawer (Triggered by hamburger ☰ button) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Drawer Panel */}
          <aside className="relative w-80 max-w-[88vw] bg-white h-full shadow-2xl flex flex-col z-10 border-r border-slate-200 text-[#0A1931] animate-in slide-in-from-left duration-200">
            {/* Top Brand Bar: Boldly written StudyMate */}
            <div className="px-5 py-4 bg-[#0A1931] text-white flex items-center justify-between">
              <div
                className="flex items-center gap-2.5 cursor-pointer select-none"
                onClick={() => {
                  setActiveTab("dashboard");
                  setIsSidebarOpen(false);
                }}
              >
                <img
                  src="/studymate_logo.jpg"
                  alt="StudyMate Logo"
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-xl object-cover border border-white/20 shadow-xs shrink-0"
                />
                <h2 className="text-2xl font-black tracking-tight text-white">
                  StudyMate
                </h2>
              </div>

              <button
                id="sidebar-close-btn"
                onClick={() => setIsSidebarOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                title="Close menu"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Profile & Account Information */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={user.avatar || "/studymate_logo.jpg"}
                    alt={user.name || "Learner Avatar"}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-xl object-cover border border-slate-300 shadow-2xs"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0A1931] leading-tight">
                    {user.name && user.name !== "Sarah Chen" ? user.name : "Student Learner"}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-semibold text-[#1B2A4A]/70">
                      {user.streakDays || 0} Day Streak
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] font-bold text-[#0A1931]">
                      {materials.length} {materials.length === 1 ? "Deck" : "Decks"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab("profile");
                  setIsSidebarOpen(false);
                }}
                className="text-xs font-bold text-[#0A1931] hover:underline cursor-pointer"
              >
                Profile
              </button>
            </div>

            {/* Streak Row (Only streak retained) */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-[#0A1931]">
              <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
                <span>{user.streakDays || 0} Day Streak</span>
              </div>
              <button
                onClick={() => handleSelectTab("progress")}
                className="text-[11px] font-bold text-[#0A1931] hover:underline cursor-pointer"
              >
                View Streak
              </button>
            </div>

            {/* Scrollable Body: Decks + Navigation */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {/* "MY DECKS" Section */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold tracking-wider text-[#0A1931] uppercase">
                    <Layers className="w-3.5 h-3.5 text-[#0A1931]" />
                    <span>My Decks ({materials.length})</span>
                  </div>
                  <button
                    onClick={() => {
                      openAddMaterialModal("upload");
                      setIsSidebarOpen(false);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#0A1931] bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-0.5 rounded-lg transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                    <span>New</span>
                  </button>
                </div>

                {materials.length > 0 ? (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {materials.map((mat) => {
                      const meta = getSubjectMeta(mat.subject);
                      const isSelected = activeMaterial?.id === mat.id;
                      const cardCount = mat.definitions?.length || 10;
                      return (
                        <div
                          key={mat.id}
                          onClick={() => handleSelectDeck(mat, "learn")}
                          className={`group w-full p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? "bg-slate-50 border-[#0A1931] shadow-xs ring-1 ring-[#0A1931]/30"
                              : "bg-white hover:bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="text-base shrink-0">{meta.emoji}</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-xs text-[#0A1931] truncate leading-snug">
                                {mat.title}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-[#1B2A4A]/70">
                                <span>{cardCount} cards</span>
                                <span>•</span>
                                <span className="text-emerald-700 font-semibold">
                                  {mat.progressPercent}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Fast Action Icons for Flashcards & Quiz */}
                          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                            <button
                              title="Study Flashcards"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectDeck(mat, "memorise");
                              }}
                              className="p-1 rounded-lg hover:bg-slate-100 text-[#0A1931] transition"
                            >
                              <Brain className="w-3.5 h-3.5" />
                            </button>
                            <button
                              title="Take Quiz"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectDeck(mat, "quizzes");
                              }}
                              className="p-1 rounded-lg hover:bg-slate-100 text-[#0A1931] transition"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-dashed border-slate-300 text-center space-y-2 text-[#0A1931]">
                    <p className="text-xs text-[#1B2A4A]/70">No decks uploaded yet</p>
                    <button
                      onClick={() => {
                        openAddMaterialModal("upload");
                        setIsSidebarOpen(false);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-[11px] font-bold transition shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                      <span>Create Your First Deck</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Main Navigation Menu Items */}
              <nav className="p-3 space-y-1">
                <div className="px-1 pb-1 text-[11px] font-bold text-[#0A1931] uppercase tracking-wider">
                  Menu
                </div>

                {/* Practice Station Drill Station Button */}
                <button
                  id="sidebar-nav-practice-station"
                  onClick={() => {
                    setIsPracticeStationModalOpen(true);
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-blue-50/80 hover:bg-blue-100/80 text-[#0A1931] border border-blue-200/80 transition text-left cursor-pointer mb-1"
                >
                  <div className="flex items-center gap-3">
                    <Brain className="w-4 h-4 text-blue-600 stroke-[2.2]" />
                    <span className="font-extrabold text-[#0A1931]">Practice Station</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
                    Drills
                  </span>
                </button>

                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.tab;
                  return (
                    <button
                      key={item.tab}
                      id={`sidebar-nav-${item.tab}`}
                      onClick={() => handleSelectTab(item.tab)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs sm:text-sm transition text-left cursor-pointer ${
                        isActive
                          ? "bg-[#0A1931] text-white font-bold shadow-xs"
                          : "hover:bg-slate-100 text-[#0A1931]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? "text-white stroke-[2.2]" : "text-[#0A1931] stroke-[1.8]"
                          }`}
                        />
                        <span className={item.isBoldUpper ? "font-black tracking-wider uppercase" : ""}>
                          {item.label}
                        </span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-[#0A1931] border border-slate-200"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-slate-200 space-y-2 bg-white">
              <button
                onClick={() => {
                  openAddMaterialModal("upload");
                  setIsSidebarOpen(false);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Import Material / New Deck</span>
              </button>

              <button
                onClick={() => {
                  setIsAssistantOpen(true);
                  setIsSidebarOpen(false);
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#0A1931] text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#0A1931]" />
                <span>Ask StudyMate AI Tutor</span>
              </button>

              {materials.length > 0 && (
                <button
                  onClick={handleResetData}
                  className="w-full py-2 px-3 rounded-xl hover:bg-red-50 text-red-600 text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Uploaded Courses</span>
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
