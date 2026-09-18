import React, { useState } from "react";
import { useStudy } from "../context/StudyContext";
import {
  BookOpen,
  Plus,
  Flame,
  Zap,
  Bell,
  Check,
  CheckCheck,
  Globe,
  User,
  Shield,
  LogOut,
  ChevronDown,
  Sparkles,
  ArrowLeft,
  Menu,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const {
    user,
    activeTab,
    setActiveTab,
    openAddMaterialModal,
    setIsAssistantOpen,
    setIsSidebarOpen,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    setIsAuthModalOpen,
  } = useStudy();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const tabLabels: Record<string, string> = {
    dashboard: "Home",
    library: "My Decks & Notes",
    learn: "Interactive Lesson",
    memorise: "Memorise & Flashcards",
    quizzes: "Quizzes & Practice",
    groups: "Study Groups",
    friends: "Find Friends",
    plan: "Study Plan",
    progress: "Progress & Badges",
    profile: "Student Profile",
    landing: "About StudyMate",
  };

  return (
    <header className="sticky top-0 z-30 bg-[#F8FAFC]/95 backdrop-blur-md border-b border-slate-200 text-[#0F172A]">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-6 h-15 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Home, Hamburger Menu, and Brand Logo & Name */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
          {activeTab !== "dashboard" && (
            <button
              id="navbar-back-home-btn"
              onClick={() => setActiveTab("dashboard")}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-[#0F172A] text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer shrink-0"
              title="Go to Home"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Home</span>
            </button>
          )}

          {/* Hamburger Menu Button */}
          <button
            id="hamburger-menu-btn"
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-[#0A1931] transition cursor-pointer shrink-0 shadow-2xs flex items-center justify-center active:scale-95"
            title="Open Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-[#0A1931]" />
          </button>

          {/* Website Logo & Website Name */}
          <div
            id="website-brand-header"
            className="flex items-center gap-2 cursor-pointer select-none shrink-0"
            onClick={() => setActiveTab("dashboard")}
            title="StudyMate Home"
          >
            <img
              src="/studymate_logo.jpg"
              alt="StudyMate Logo"
              referrerPolicy="no-referrer"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
            />
            <span className="text-base sm:text-xl font-black tracking-tight text-[#0A1931]">
              StudyMate
            </span>
          </div>

          {activeTab !== "dashboard" && tabLabels[activeTab] && (
            <div className="border-l border-slate-200 pl-2 hidden lg:block truncate max-w-[140px]">
              <h2 className="text-xs font-semibold text-slate-500 truncate">
                {tabLabels[activeTab]}
              </h2>
            </div>
          )}
        </div>

        {/* Right Actions: Import, Streak, Notification Bell, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Import Button */}
          <button
            onClick={() => openAddMaterialModal("upload")}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-bold shadow-2xs transition cursor-pointer shrink-0 active:scale-95"
            title="Import Study Material"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden md:inline">Import</span>
          </button>

          {/* Warm Amber Streak Counter */}
          <div
            onClick={() => setActiveTab("progress")}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[#0F172A] text-xs font-bold cursor-pointer hover:bg-amber-100/70 transition shadow-2xs shrink-0"
            title={`${user.streakDays} Day Study Streak`}
          >
            <Flame className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B] shrink-0" />
            <span className="text-[#0F172A] font-extrabold">{user.streakDays}d</span>
          </div>

          {/* Notification Bell (Guaranteed visibility with shrink-0) */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-[#0F172A] transition cursor-pointer shadow-2xs"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-[#0F172A]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#6366F1] text-[10px] font-bold text-white flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 text-[#0F172A]">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-xs text-[#0F172A] flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-[#6366F1]" /> Notifications
                  </h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[11px] text-[#6366F1] hover:underline font-semibold cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                          n.isRead
                            ? "bg-slate-50 border-slate-100 text-slate-500"
                            : "bg-indigo-50/50 border-indigo-100 text-[#0F172A]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-[#0F172A]">{n.title}</span>
                          <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <button
            onClick={() => setActiveTab("profile")}
            className="flex items-center p-0.5 rounded-xl hover:bg-slate-100 text-[#0F172A] transition cursor-pointer shrink-0"
            title="User Profile"
          >
            <img
              src={user.avatar || "/studymate_logo.jpg"}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover ring-2 ring-[#6366F1]/20 border border-slate-200 shadow-2xs"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
