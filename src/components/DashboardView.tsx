import React, { useState } from "react";
import { useStudy } from "../context/StudyContext";
import {
  Menu,
  Star,
  Flame,
  Plus,
  ArrowUp,
  Camera,
  FolderPlus,
  Play,
  FileText,
  ChevronDown,
  Brain,
  Sparkles,
  HelpCircle,
  BookOpen,
  Radio,
  ExternalLink,
  CheckCircle2,
  Trash2,
  Layers,
  Share2,
  Clock,
  Image as ImageIcon,
  FileUp,
  Eye,
  X,
  Copy,
  Check,
  Video,
  Mic,
  Maximize2,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SourceType, StudyMaterial } from "../types";
import { cleanTitle, cleanToNaturalEnglish } from "../utils/studyTransformer";
import { CleanFormattedText } from "./CleanFormattedText";

export const DashboardView: React.FC = () => {
  const {
    user,
    materials,
    setActiveMaterial,
    setActiveTab,
    openAddMaterialModal,
    setIsSidebarOpen,
    clearAllCourses,
    deleteMaterial,
    setIsAssistantOpen,
    setIsSearchOpen,
    studyGroups,
    sendGroupMessage,
    triggerConfetti,
  } = useStudy();

  const [searchQuery, setSearchQuery] = useState("");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showQuickPracticeModal, setShowQuickPracticeModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deckToDelete, setDeckToDelete] = useState<StudyMaterial | null>(null);
  const [recentFilter, setRecentFilter] = useState<"all" | "files" | "photos" | "videos" | "notes">("all");
  const [previewingMaterial, setPreviewingMaterial] = useState<StudyMaterial | null>(null);
  const [copiedPreviewText, setCopiedPreviewText] = useState(false);

  // Helper for relative time formatting
  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return "Recently";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "Recently";
    }
  };

  // Helper for source type meta
  const getSourceTypeDisplay = (type: SourceType) => {
    switch (type) {
      case "photo":
        return { label: "Photo / Scan", icon: Camera, color: "bg-purple-100 text-purple-800 border-purple-200" };
      case "upload":
        return { label: "Uploaded File", icon: FileUp, color: "bg-blue-100 text-blue-800 border-blue-200" };
      case "youtube":
        return { label: "YouTube Video", icon: Video, color: "bg-red-100 text-red-800 border-red-200" };
      case "record":
        return { label: "Voice / Audio", icon: Mic, color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "deck":
        return { label: "Slide Deck", icon: Layers, color: "bg-amber-100 text-amber-800 border-amber-200" };
      case "paste":
        return { label: "Pasted Notes", icon: FileText, color: "bg-indigo-100 text-indigo-800 border-indigo-200" };
      case "quizlet":
        return { label: "Quizlet / Anki", icon: Brain, color: "bg-cyan-100 text-cyan-800 border-cyan-200" };
      default:
        return { label: "Study Material", icon: FileText, color: "bg-slate-100 text-slate-800 border-slate-200" };
    }
  };

  // Handle launching modal from query
  const handleLaunchSearch = () => {
    openAddMaterialModal("upload", searchQuery);
  };

  const handleOpenMaterialMode = (
    mat: StudyMaterial,
    mode: "learn" | "memorise" | "quizzes" | "library"
  ) => {
    setActiveMaterial(mat);
    setActiveTab(mode);
  };

  const handleShareDeck = (mat: StudyMaterial, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `Study deck "${mat.title}" on StudyMate: ${window.location.origin}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareText).catch(() => {});
    }
    if (studyGroups && studyGroups.length > 0) {
      sendGroupMessage(
        studyGroups[0].id,
        `📚 Shared deck "${mat.title}" with our study group! Practice flashcards & quizzes.`,
        false
      );
    }
    setToastMessage(`Shared "${mat.title}"! Link copied to clipboard.`);
    triggerConfetti();
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeleteDeck = (mat: StudyMaterial, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeckToDelete(mat);
  };

  const handleConfirmDelete = () => {
    if (deckToDelete) {
      deleteMaterial(deckToDelete.id);
      setToastMessage(`Deleted deck "${deckToDelete.title}".`);
      setDeckToDelete(null);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Helper for subject metadata
  const getSubjectMeta = (subjectOrCode: string) => {
    const s = (subjectOrCode || "").toLowerCase();
    if (s.includes("chem") || s.startsWith("chm") || s.includes("bch")) {
      return { color: "text-teal-700 bg-teal-100 border-teal-200", emoji: "🧪" };
    }
    if (s.includes("bio") || s.startsWith("mcb") || s.startsWith("zoo") || s.startsWith("bot")) {
      return { color: "text-emerald-700 bg-emerald-100 border-emerald-200", emoji: "🧬" };
    }
    if (s.includes("math") || s.startsWith("mth") || s.startsWith("mat") || s.startsWith("sta") || s.includes("calc")) {
      return { color: "text-blue-700 bg-blue-100 border-blue-200", emoji: "📐" };
    }
    if (s.includes("phys") || s.startsWith("phy")) {
      return { color: "text-cyan-700 bg-cyan-100 border-cyan-200", emoji: "⚛️" };
    }
    if (s.includes("hist") || s.startsWith("his") || s.startsWith("pol")) {
      return { color: "text-amber-700 bg-amber-100 border-amber-200", emoji: "🏛️" };
    }
    if (s.includes("comp") || s.startsWith("csc") || s.startsWith("cos") || s.startsWith("cs") || s.startsWith("swe")) {
      return { color: "text-indigo-700 bg-indigo-100 border-indigo-200", emoji: "💻" };
    }
    if (s.includes("eng") || s.startsWith("lit") || s.startsWith("gst")) {
      return { color: "text-purple-700 bg-purple-100 border-purple-200", emoji: "📖" };
    }
    if (s.includes("bus") || s.startsWith("eco") || s.startsWith("acc") || s.startsWith("fin")) {
      return { color: "text-rose-700 bg-rose-100 border-rose-200", emoji: "📊" };
    }
    if (s.includes("psyc") || s.startsWith("psy") || s.startsWith("soc")) {
      return { color: "text-violet-700 bg-violet-100 border-violet-200", emoji: "🧠" };
    }
    return { color: "text-slate-700 bg-slate-100 border-slate-200", emoji: "📚" };
  };

  // Sort materials by date descending (newest uploads first)
  const sortedRecentMaterials = [...materials].sort((a, b) => {
    const timeA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
    const timeB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
    return timeB - timeA;
  });

  // Filter based on selected recent category tab
  const filteredRecentMaterials = sortedRecentMaterials.filter((mat) => {
    if (recentFilter === "all") return true;
    if (recentFilter === "files") return mat.sourceType === "upload" || mat.sourceType === "deck";
    if (recentFilter === "photos") return mat.sourceType === "photo" || !!mat.fileUrl;
    if (recentFilter === "videos") return mat.sourceType === "youtube";
    if (recentFilter === "notes") return mat.sourceType === "paste" || mat.sourceType === "record" || mat.sourceType === "quizlet";
    return true;
  });

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-5 pb-24 px-2 sm:px-4 pt-2">
      {/* Hero Greeting with StudyMate Logo */}
      <section className="flex items-center gap-3.5 sm:gap-4 pt-1 sm:pt-2">
        {/* Floating StudyMate Logo */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
          className="relative shrink-0"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-white p-1 flex items-center justify-center">
            <img
              src="/studymate_logo.jpg"
              alt="StudyMate Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-xl shadow-2xs"
            />
          </div>
        </motion.div>

        {/* Text Greeting */}
        <div>
          <p className="text-slate-500 text-sm sm:text-base font-medium tracking-tight">
            What shall we
          </p>
          <h1 className="text-[#0F172A] text-3xl sm:text-4xl font-black tracking-tight leading-none mt-0.5">
            Study?
          </h1>
        </div>
      </section>

      {/* Study Input & Quick Action Box (White Container with Indigo Accent) */}
      <section className="rounded-2xl bg-white border border-slate-200 p-3.5 sm:p-4 space-y-3 shadow-xs">
        {/* Input Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id="dashboard-study-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLaunchSearch()}
              placeholder="Study any topic, paste notes, or ask..."
              className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] shadow-2xs transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0F172A] text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Plus / Action Button (Rich Indigo #6366F1) */}
          <button
            id="dashboard-search-action-btn"
            onClick={handleLaunchSearch}
            className="w-11 h-11 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white flex items-center justify-center transition shadow-xs cursor-pointer shrink-0 active:scale-95"
            title="Create study set"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* 4 Quick Upload Modality Buttons */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {/* Upload Button */}
          <button
            id="quick-action-upload-btn"
            onClick={() => openAddMaterialModal("upload")}
            className="py-2 px-1 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 flex flex-col items-center justify-center gap-1 transition shadow-2xs group cursor-pointer active:scale-95"
          >
            <div className="w-7 h-7 rounded-lg bg-white group-hover:bg-[#6366F1] group-hover:text-white flex items-center justify-center text-[#6366F1] transition shadow-2xs">
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-bold text-[#0F172A]">Upload</span>
          </button>

          {/* Photo Button */}
          <button
            id="quick-action-photo-btn"
            onClick={() => openAddMaterialModal("photo")}
            className="py-2 px-1 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 flex flex-col items-center justify-center gap-1 transition shadow-2xs group cursor-pointer active:scale-95"
          >
            <div className="w-7 h-7 rounded-lg bg-white group-hover:bg-[#6366F1] group-hover:text-white flex items-center justify-center text-[#6366F1] transition shadow-2xs">
              <Camera className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="text-[11px] font-bold text-[#0F172A]">Photo</span>
          </button>

          {/* YouTube Button */}
          <button
            id="quick-action-youtube-btn"
            onClick={() => openAddMaterialModal("youtube")}
            className="py-2 px-1 rounded-xl bg-slate-50 hover:bg-red-50/50 border border-slate-200 hover:border-red-200 flex flex-col items-center justify-center gap-1 transition shadow-2xs group cursor-pointer active:scale-95"
          >
            <div className="w-7 h-7 rounded-lg bg-white group-hover:bg-red-600 group-hover:text-white flex items-center justify-center text-red-600 transition shadow-2xs">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <span className="text-[11px] font-bold text-[#0F172A]">YouTube</span>
          </button>

          {/* Paste Button */}
          <button
            id="quick-action-paste-btn"
            onClick={() => openAddMaterialModal("paste")}
            className="py-2 px-1 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 flex flex-col items-center justify-center gap-1 transition shadow-2xs group cursor-pointer active:scale-95"
          >
            <div className="w-7 h-7 rounded-lg bg-white group-hover:bg-[#6366F1] group-hover:text-white flex items-center justify-center text-[#6366F1] transition shadow-2xs">
              <FileText className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="text-[11px] font-bold text-[#0F172A]">Paste</span>
          </button>
        </div>

        {/* Expandable "More" Options */}
        <div className="pt-1">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="w-full flex items-center justify-center gap-1 text-[#0A1931] hover:text-[#1B2A4A] text-xs font-semibold py-1 cursor-pointer transition"
          >
            <span>More import options</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                showMoreMenu ? "rotate-180" : ""
              }`}
            />
          </button>

          {showMoreMenu && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 mt-1 animate-in fade-in-50">
              <button
                onClick={() => openAddMaterialModal("record")}
                className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center gap-2 text-left transition cursor-pointer"
              >
                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[#0A1931] shrink-0">
                  <Radio className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#0A1931]">Voice Record</p>
                  <p className="text-[9px] text-[#1B2A4A]/60 truncate">Audio lecture notes</p>
                </div>
              </button>

              <button
                onClick={() => openAddMaterialModal("quizlet")}
                className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center gap-2 text-left transition cursor-pointer"
              >
                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[#0A1931] shrink-0">
                  <Brain className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#0A1931]">Quizlet / Anki</p>
                  <p className="text-[9px] text-[#1B2A4A]/60 truncate">Import existing sets</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* "My Decks / Jump back in" Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[#0A1931] font-extrabold text-lg">My Decks</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0A1931] border border-slate-200">
              {materials.length}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="home-search-button"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-[#0A1931] shadow-2xs transition active:scale-95 cursor-pointer"
              title="Search Decks, Notes & Files (⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Search</span>
              <kbd className="hidden sm:inline-block text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={() => setActiveTab("library")}
              className="text-[#0A1931] hover:underline text-xs sm:text-sm font-bold cursor-pointer transition"
            >
              View all ({materials.length})
            </button>
          </div>
        </div>

        {/* When user has uploaded materials */}
        {materials.length > 0 ? (
          <div className="space-y-3">
            {materials.map((mat) => {
              const displayCode = mat.courseCode || mat.subject;
              const meta = getSubjectMeta(displayCode);
              const cardCount = mat.definitions?.length || 10;
              const quizCount = mat.potentialExamQuestions?.length || 5;

              return (
                <div
                  key={mat.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3.5 text-[#0A1931]"
                >
                  {/* Top Row: Subject & Source Badges + Delete Action */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${meta.color}`}
                      >
                        <span>{meta.emoji}</span>
                        <span>{displayCode}</span>
                      </span>

                      <span className="text-[10px] font-semibold text-[#0A1931] uppercase px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {mat.sourceType}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleShareDeck(mat, e)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                        title="Share deck"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDeleteDeck(mat, e)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                        title="Delete deck"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Deck Title & Summary */}
                  <div>
                    <h3
                      onClick={() => handleOpenMaterialMode(mat, "learn")}
                      className="font-extrabold text-base text-[#0A1931] hover:text-blue-700 transition cursor-pointer leading-snug line-clamp-1"
                    >
                      {cleanTitle(mat.title)}
                    </h3>
                    <p className="text-xs text-[#1B2A4A]/80 mt-1 line-clamp-2 leading-relaxed">
                      {mat.summary || "Interactive study deck with key terms, quizzes, and structured notes."}
                    </p>
                  </div>

                  {/* Deck Metrics Bar: Flashcards, Quizzes, Mastery */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-semibold text-[#0A1931]">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[#0A1931]">
                        <Brain className="w-3.5 h-3.5 text-[#0A1931]" />
                        <strong>{cardCount}</strong> cards
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 text-[#0A1931]">
                        <HelpCircle className="w-3.5 h-3.5 text-[#0A1931]" />
                        <strong>{quizCount}</strong> questions
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{mat.progressPercent}% mastered</span>
                    </div>
                  </div>

                  {/* Study Actions Bar */}
                  <div className="flex items-center gap-2 pt-0.5">
                    {/* Primary Action Button */}
                    <button
                      onClick={() => handleOpenMaterialMode(mat, "learn")}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Study Deck</span>
                    </button>

                    {/* Quick Mode Chips */}
                    <button
                      onClick={() => handleOpenMaterialMode(mat, "memorise")}
                      className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-[#0A1931] border border-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Spaced repetition flashcards"
                    >
                      <Brain className="w-3.5 h-3.5 text-[#0A1931]" />
                      <span>Flashcards</span>
                    </button>

                    <button
                      onClick={() => handleOpenMaterialMode(mat, "quizzes")}
                      className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-[#0A1931] border border-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Quiz drill"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#0A1931]" />
                      <span>Quiz</span>
                    </button>

                    <button
                      onClick={() => handleOpenMaterialMode(mat, "library")}
                      className="py-2 px-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#0A1931] border border-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Detailed Notes"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#0A1931]" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* "+ New Deck" Card */}
            <button
              onClick={() => openAddMaterialModal("upload")}
              className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#0A1931] bg-white transition flex items-center justify-center gap-2 text-[#0A1931] font-bold text-xs cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Import Another Material / Add New Deck</span>
            </button>
          </div>
        ) : (
          /* Empty state: Clean white card */
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs text-center space-y-3.5 text-[#0A1931]">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center mx-auto text-slate-400">
              <FolderPlus className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#0A1931]">No study decks uploaded yet</h3>
              <p className="text-xs text-[#1B2A4A]/70 max-w-xs mx-auto mt-1 leading-relaxed">
                StudyMate builds interactive flashcard decks, quizzes, and lessons entirely from your
                uploaded files. Choose an option below to create your first deck:
              </p>
            </div>

            {/* Quick Upload Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                onClick={() => openAddMaterialModal("upload")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0A1931] text-xs font-bold transition border border-slate-200 cursor-pointer"
              >
                <ArrowUp className="w-3 h-3 stroke-[2.5]" />
                <span>Upload PDF</span>
              </button>

              <button
                onClick={() => openAddMaterialModal("photo")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0A1931] text-xs font-bold transition border border-slate-200 cursor-pointer"
              >
                <Camera className="w-3 h-3" />
                <span>Camera / Photo</span>
              </button>

              <button
                onClick={() => openAddMaterialModal("youtube")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0A1931] text-xs font-bold transition border border-slate-200 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-red-600" />
                <span>YouTube Video</span>
              </button>

              <button
                onClick={() => openAddMaterialModal("paste")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0A1931] text-xs font-bold transition border border-slate-200 cursor-pointer"
              >
                <FileText className="w-3 h-3" />
                <span>Paste Notes</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* "Recent" Section — Files, Photos & Uploaded Study Materials */}
      <section className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#6366F1]">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-[#0A1931] font-extrabold text-lg">Recent</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0A1931] border border-slate-200">
              {materials.length}
            </span>
          </div>

          {/* Filter Chips */}
          {materials.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: "all", label: "All" },
                { id: "files", label: "Files & Docs" },
                { id: "photos", label: "Photos & Scans" },
                { id: "videos", label: "Videos" },
                { id: "notes", label: "Notes & Audio" },
              ].map((filter) => {
                const isActive = recentFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setRecentFilter(filter.id as any)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-[#0A1931] text-white shadow-2xs"
                        : "bg-white text-[#0A1931] border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* List of Recent Items */}
        {sortedRecentMaterials.length > 0 ? (
          filteredRecentMaterials.length > 0 ? (
            <div className="space-y-3">
              {filteredRecentMaterials.map((mat) => {
                const meta = getSubjectMeta(mat.courseCode || mat.subject);
                const sourceMeta = getSourceTypeDisplay(mat.sourceType);
                const SourceIcon = sourceMeta.icon;
                const isPhoto = mat.sourceType === "photo" || !!mat.fileUrl;
                const timeAgo = formatRelativeTime(mat.dateAdded);

                return (
                  <div
                    key={`recent-${mat.id}`}
                    className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3 text-[#0A1931] group"
                  >
                    {/* Top row: Subject & Source Badges + Title & Meta Info */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Subject / Course Code Badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${meta.color}`}
                          >
                            <span>{meta.emoji}</span>
                            <span>{mat.courseCode || mat.subject}</span>
                          </span>

                          {/* Source Format Badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sourceMeta.color}`}
                          >
                            <SourceIcon className="w-3 h-3" />
                            <span>{sourceMeta.label}</span>
                          </span>
                        </div>

                        {/* Relative timestamp */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>{timeAgo}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => handleOpenMaterialMode(mat, "learn")}
                        className="font-extrabold text-sm sm:text-base text-[#0A1931] hover:text-[#6366F1] transition cursor-pointer leading-snug line-clamp-1 pt-0.5"
                      >
                        <CleanFormattedText as="span" content={mat.title} />
                      </h3>

                      {/* Excerpt / Summary */}
                      <div className="text-xs text-[#1B2A4A]/70 line-clamp-2 leading-relaxed">
                        <CleanFormattedText
                          content={mat.summary || (mat.rawText ? mat.rawText.slice(0, 160) : "Uploaded study material ready for active recall practice.")}
                        />
                      </div>

                      {/* Metrics Pills */}
                      <div className="flex items-center gap-2 pt-0.5 text-[11px] font-semibold text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 text-[#0A1931]">
                          <Brain className="w-3 h-3 text-[#6366F1]" />
                          <span>{mat.definitions?.length || 10} flashcards</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[#0A1931]">
                          <HelpCircle className="w-3 h-3 text-emerald-600" />
                          <span>{mat.potentialExamQuestions?.length || 5} questions</span>
                        </span>
                        {mat.chunks && mat.chunks.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{mat.chunks.length} sections</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Quick Study Actions */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 flex-wrap">
                      <button
                        onClick={() => handleOpenMaterialMode(mat, "learn")}
                        className="py-1.5 px-3 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Study</span>
                      </button>

                      <button
                        onClick={() => handleOpenMaterialMode(mat, "memorise")}
                        className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0A1931] text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Brain className="w-3 h-3" />
                        <span>Flashcards</span>
                      </button>

                      <button
                        onClick={() => handleOpenMaterialMode(mat, "quizzes")}
                        className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0A1931] text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>Quiz</span>
                      </button>

                      <button
                        onClick={() => handleOpenMaterialMode(mat, "library")}
                        className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0A1931] text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Notes</span>
                      </button>

                      {/* Preview Full Material / Photo Button */}
                      <button
                        onClick={() => setPreviewingMaterial(mat)}
                        className="py-1.5 px-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#6366F1] text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-indigo-100 ml-auto"
                        title="Preview file / photo & extracted content"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => handleDeleteDeck(mat, e)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                        title="Delete material"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* No items in current filter */
            <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
              <p className="text-xs font-bold text-[#0A1931]">
                No recent items found under "{recentFilter}".
              </p>
              <button
                onClick={() => setRecentFilter("all")}
                className="text-xs font-bold text-[#6366F1] hover:underline cursor-pointer"
              >
                Reset filter to show all ({materials.length})
              </button>
            </div>
          )
        ) : (
          /* Empty State for Recent */
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs text-center space-y-3 text-[#0A1931]">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-[#6366F1]">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#0A1931]">No recent uploads yet</h3>
              <p className="text-xs text-[#1B2A4A]/70 max-w-xs mx-auto mt-1 leading-relaxed">
                Files, scanned photos, YouTube lectures, and notes you upload will appear here in chronological order for fast review.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                onClick={() => openAddMaterialModal("upload")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-[#0A1931] hover:text-[#6366F1] text-xs font-bold transition border border-slate-200 cursor-pointer"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>
              <button
                onClick={() => openAddMaterialModal("photo")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-[#0A1931] hover:text-[#6366F1] text-xs font-bold transition border border-slate-200 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Take Photo</span>
              </button>
              <button
                onClick={() => openAddMaterialModal("youtube")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-[#0A1931] hover:text-red-600 text-xs font-bold transition border border-slate-200 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>YouTube</span>
              </button>
              <button
                onClick={() => openAddMaterialModal("paste")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-[#0A1931] hover:text-[#6366F1] text-xs font-bold transition border border-slate-200 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste Notes</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* File & Photo Preview Lightbox Modal */}
      {previewingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#0A1931]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/70">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#6366F1] shrink-0 shadow-2xs">
                  {previewingMaterial.sourceType === "photo" || previewingMaterial.fileUrl ? (
                    <Camera className="w-5 h-5" />
                  ) : previewingMaterial.sourceType === "upload" ? (
                    <FileUp className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm sm:text-base text-[#0A1931] truncate">
                    {cleanTitle(previewingMaterial.title)}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-[#1B2A4A]/70">
                    <span>{previewingMaterial.courseCode || previewingMaterial.subject}</span>
                    <span>•</span>
                    <span className="capitalize">{previewingMaterial.sourceType}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(previewingMaterial.dateAdded)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPreviewingMaterial(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-[#0A1931] transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* Photo Preview if image exists */}
              {previewingMaterial.fileUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center max-h-72 shadow-2xs">
                  <img
                    src={previewingMaterial.fileUrl}
                    alt={previewingMaterial.title}
                    referrerPolicy="no-referrer"
                    className="max-h-72 w-full object-contain"
                  />
                </div>
              )}

              {/* Summary Box */}
              {previewingMaterial.summary && (
                <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#6366F1]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Analysis Summary</span>
                  </div>
                  <div className="text-xs text-[#0A1931] leading-relaxed">
                    <CleanFormattedText content={previewingMaterial.summary} />
                  </div>
                </div>
              )}

              {/* Extracted Raw Content Preview written in pure English */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0A1931]">
                    Extracted Text & Notes
                  </span>
                  <button
                    onClick={() => {
                      const textToCopy = cleanToNaturalEnglish(previewingMaterial.rawText);
                      if (textToCopy && navigator?.clipboard?.writeText) {
                        navigator.clipboard.writeText(textToCopy);
                        setCopiedPreviewText(true);
                        setTimeout(() => setCopiedPreviewText(false), 2000);
                      }
                    }}
                    className="text-xs font-bold text-[#6366F1] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPreviewText ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans text-slate-800 max-h-56 overflow-y-auto leading-relaxed space-y-2">
                  <CleanFormattedText content={previewingMaterial.rawText} />
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              <button
                onClick={() => setPreviewingMaterial(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#0A1931] hover:bg-slate-100 transition cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const m = previewingMaterial;
                    setPreviewingMaterial(null);
                    handleOpenMaterialMode(m, "memorise");
                  }}
                  className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#0A1931] hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Brain className="w-3.5 h-3.5 text-[#6366F1]" />
                  <span>Flashcards</span>
                </button>

                <button
                  onClick={() => {
                    const m = previewingMaterial;
                    setPreviewingMaterial(null);
                    handleOpenMaterialMode(m, "learn");
                  }}
                  className="py-2.5 px-4 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Studying</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deckToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 text-[#0A1931]">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-[#0A1931]">Delete Study Deck?</h3>
              <p className="text-xs text-[#1B2A4A]/70">
                Are you sure you want to delete <span className="font-bold text-[#0A1931]">"{deckToDelete.title}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => setDeckToDelete(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-[#0A1931] hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Delete Deck
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#0A1931] text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
