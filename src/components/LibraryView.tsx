import React, { useState } from "react";
import { useStudy } from "../context/StudyContext";
import {
  FolderKanban,
  Search,
  BookOpen,
  Brain,
  GraduationCap,
  HelpCircle,
  Plus,
  Trash2,
  Share2,
  ExternalLink,
  Edit3,
  Check,
  Sparkles,
  AlertCircle,
  Layers,
  LayoutGrid,
  List,
  Play,
  ArrowUp,
  Camera,
  FileText,
  Maximize2,
  Minimize2,
  Copy,
} from "lucide-react";
import { StudySubject, StudyMaterial, StudyNotes } from "../types";
import { cleanTitle, isGarbledText } from "../utils/studyTransformer";
import { CleanFormattedText } from "./CleanFormattedText";

export const LibraryView: React.FC = () => {
  const {
    materials,
    activeMaterial,
    setActiveMaterial,
    deleteMaterial,
    setActiveTab,
    openAddMaterialModal,
    notes,
    updateNotes,
    studyGroups,
    sendGroupMessage,
    triggerConfetti,
  } = useStudy();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "detail">("grid");
  const [selectedMaterialForNotes, setSelectedMaterialForNotes] = useState<StudyMaterial | null>(
    activeMaterial || materials[0] || null
  );

  React.useEffect(() => {
    if (activeMaterial) {
      setSelectedMaterialForNotes(activeMaterial);
    }
  }, [activeMaterial?.id]);

  // Notes editing state
  const [isEditingPersonalNotes, setIsEditingPersonalNotes] = useState(false);
  const [personalNotesDraft, setPersonalNotesDraft] = useState("");

  const currentNotes: StudyNotes | undefined = selectedMaterialForNotes
    ? notes[selectedMaterialForNotes.id]
    : undefined;

  const filteredMaterials = materials.filter((m) => {
    const matchQuery =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchQuery;
  });

  const handleShareToGroup = (mat: StudyMaterial) => {
    if (studyGroups.length > 0) {
      const targetGroup = studyGroups[0];
      sendGroupMessage(
        targetGroup.id,
        `📚 **Shared Deck**: I just shared "${mat.title}" with our study group! Check out the flashcards and diagnostic quizzes.`,
        false
      );
      triggerConfetti();
      alert(`Shared "${mat.title}" with study group "${targetGroup.name}"!`);
    } else {
      alert(`Shared "${mat.title}" link copied to clipboard!`);
    }
  };

  const handleSavePersonalNotes = () => {
    if (selectedMaterialForNotes) {
      updateNotes(selectedMaterialForNotes.id, { personalNotes: personalNotesDraft });
      setIsEditingPersonalNotes(false);
    }
  };

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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24 px-2 sm:px-4">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Decks</h1>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-[#E5E2D9] text-slate-700">
              {materials.length} {materials.length === 1 ? "Deck" : "Decks"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            All your uploaded study decks, generated flashcards, and personalized notes.
          </p>
        </div>

        {/* Action Controls: Search, View Toggle, Add Deck */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your decks..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-[#DDD9CE] text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition"
            />
          </div>

          {/* Grid vs Detail View Toggle */}
          <div className="flex items-center bg-[#ECEAE4] border border-[#DDD9CE] p-1 rounded-xl shadow-2xs">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("detail")}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "detail" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Notes Detail View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Add New Deck */}
          <button
            onClick={() => openAddMaterialModal("upload")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Deck</span>
          </button>
        </div>
      </div>

      {/* No Decks State */}
      {filteredMaterials.length === 0 && (
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#DDD9CE] text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto">
            <FolderKanban className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {materials.length === 0 ? "No decks uploaded yet" : "No decks match this filter"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
              StudyMate works exclusively with whatever you upload. Create a new deck using any format below:
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => openAddMaterialModal("upload")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Upload Document</span>
            </button>
            <button
              onClick={() => openAddMaterialModal("photo")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera / Photo</span>
            </button>
            <button
              onClick={() => openAddMaterialModal("paste")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste Notes</span>
            </button>
          </div>
        </div>
      )}

      {/* Mode 1: GRID VIEW (Featured Deck Cards) */}
      {filteredMaterials.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((mat) => {
            const displayCode = mat.courseCode || mat.subject;
            const meta = getSubjectMeta(displayCode);
            const cardCount = mat.definitions?.length || 10;
            const quizCount = mat.potentialExamQuestions?.length || 5;

            return (
              <div
                key={mat.id}
                className="p-5 rounded-2xl bg-white border border-[#DDD9CE] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header: Subject & Options */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${meta.color}`}
                    >
                      <span>{meta.emoji}</span>
                      <span>{displayCode}</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5 rounded bg-slate-100">
                      {mat.sourceType}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleShareToGroup(mat)}
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 transition"
                      title="Share Deck"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete deck "${mat.title}"?`)) {
                          deleteMaterial(mat.id);
                        }
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-500 transition"
                      title="Delete Deck"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title & Summary */}
                <div className="space-y-1.5 flex-1">
                  <h3
                    onClick={() => {
                      setActiveMaterial(mat);
                      setActiveTab("learn");
                    }}
                    className="font-extrabold text-base text-slate-900 hover:text-blue-600 transition cursor-pointer line-clamp-1"
                  >
                    <CleanFormattedText as="span" content={mat.title} />
                  </h3>
                  <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    <CleanFormattedText
                      content={mat.summary || "Interactive study set with recall flashcards, quiz bank, and notes."}
                    />
                  </div>
                </div>

                {/* Metrics Pill */}
                <div className="p-2.5 bg-[#FAF9F5] rounded-xl border border-[#E8E5DD] flex items-center justify-between text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Brain className="w-3.5 h-3.5 text-blue-600" />
                      <strong>{cardCount}</strong> cards
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                      <strong>{quizCount}</strong> Qs
                    </span>
                  </div>
                  <div className="text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{mat.progressPercent}%</span>
                  </div>
                </div>

                {/* Direct Study Actions */}
                <div className="space-y-2 pt-1 border-t border-[#F2EFE8]">
                  <button
                    onClick={() => {
                      setActiveMaterial(mat);
                      setActiveTab("learn");
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Study Deck</span>
                  </button>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => {
                        setActiveMaterial(mat);
                        setActiveTab("memorise");
                      }}
                      className="py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Brain className="w-3 h-3 text-blue-600" />
                      <span>Cards</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveMaterial(mat);
                        setActiveTab("quizzes");
                      }}
                      className="py-1.5 px-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <HelpCircle className="w-3 h-3 text-purple-600" />
                      <span>Quiz</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMaterialForNotes(mat);
                        setActiveMaterial(mat);
                        setViewMode("detail");
                      }}
                      className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3 text-slate-600" />
                      <span>Notes</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mode 2: DETAIL VIEW (Side-by-side Decks list + Structured Notes Reader) */}
      {filteredMaterials.length > 0 && viewMode === "detail" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Deck Selection List */}
          <div className="lg:col-span-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1 uppercase tracking-wider">
              <span>Decks ({filteredMaterials.length})</span>
              <span>Select to view</span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredMaterials.map((mat) => {
                const isSelected = selectedMaterialForNotes?.id === mat.id;
                const displayCode = mat.courseCode || mat.subject;
                const meta = getSubjectMeta(displayCode);

                return (
                  <div
                    key={mat.id}
                    onClick={() => {
                      setSelectedMaterialForNotes(mat);
                      setActiveMaterial(mat);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? "bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                        : "bg-white/80 hover:bg-white border-[#DDD9CE]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.color}`}
                      >
                        {meta.emoji} {displayCode}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">{mat.sourceType}</span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 truncate mb-1">{mat.title}</h3>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-[#F0ECE1]">
                      <span>{mat.definitions?.length || 10} cards</span>
                      <span className="text-emerald-600 font-bold">{mat.progressPercent}% mastered</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Structured Notes Reader */}
          <div className="lg:col-span-8">
            {selectedMaterialForNotes ? (
              <div className="bg-white border border-[#DDD9CE] rounded-3xl p-6 space-y-6 shadow-xs">
                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE8E0]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        {selectedMaterialForNotes.courseCode || selectedMaterialForNotes.subject}
                      </span>
                      <span className="text-xs text-slate-400">
                        Imported {selectedMaterialForNotes.dateAdded}
                      </span>
                    </div>
                    <CleanFormattedText
                      as="h2"
                      content={selectedMaterialForNotes.title}
                      className="text-lg font-extrabold text-slate-900"
                    />
                  </div>

                  {/* Quick Mode Switches */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveMaterial(selectedMaterialForNotes);
                        setActiveTab("memorise");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Brain className="w-3.5 h-3.5 text-blue-600" />
                      <span>Flashcards</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveMaterial(selectedMaterialForNotes);
                        setActiveTab("quizzes");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                      <span>Quiz</span>
                    </button>
                  </div>
                </div>

                {/* Concept Overview */}
                <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E8E5DD] space-y-1.5">
                  <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Concept Overview</span>
                  </h4>
                  <div className="text-xs text-slate-700 leading-relaxed">
                    <CleanFormattedText content={currentNotes?.shortOverview || selectedMaterialForNotes.summary} />
                  </div>
                </div>

                {/* Subtopics & Granular Paragraph Points */}
                {currentNotes?.subtopicsWithNotes && currentNotes.subtopicsWithNotes.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Curriculum Subtopics & Key Concept Points</span>
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {currentNotes.subtopicsWithNotes.length} Subtopics Scanned
                      </span>
                    </div>

                    <div className="space-y-3">
                      {currentNotes.subtopicsWithNotes.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E8E5DD] space-y-2.5 hover:border-indigo-300 transition"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ECE7DC] pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                <CleanFormattedText content={item.subtopic} />
                              </h4>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-[#DDD9CE] text-slate-600">
                              {item.paragraphReference ? item.paragraphReference.replace(/paragraph[s]?/gi, "Section") : `Section ${idx + 1}`}
                            </span>
                          </div>

                          {/* Important Points from this paragraph */}
                          <div className="space-y-1.5 pl-1">
                            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                              Important Points:
                            </p>
                            <ul className="space-y-1.5">
                              {item.importantPoints.map((pt, ptIdx) => (
                                <li key={ptIdx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                  <div>
                                    <CleanFormattedText content={pt} />
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Key Takeaway */}
                          {item.keyTakeaway && (
                            <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                              <div className="leading-snug">
                                <span className="font-bold">Key Takeaway: </span>
                                <CleanFormattedText content={item.keyTakeaway} />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : selectedMaterialForNotes.subtopics && selectedMaterialForNotes.subtopics.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Document Subtopics</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMaterialForNotes.subtopics.map((sub, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2.5 py-1 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] text-xs font-medium text-slate-700"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Important Details Extracted from Document */}
                {currentNotes?.importantDetails && currentNotes.importantDetails.length > 0 && (
                  <div className="space-y-2.5 p-4 rounded-2xl bg-[#FAF9F5] border border-[#E8E5DD]">
                    <h3 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Key Extracted Rules, Formulas & Examination Points</span>
                    </h3>
                    <ul className="space-y-1.5">
                      {currentNotes.importantDetails.map((detail, dIdx) => (
                        <li key={dIdx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <div>
                            <CleanFormattedText content={detail} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Definitions & Terms strictly for this uploaded file */}
                {(currentNotes?.definitions?.length || selectedMaterialForNotes.definitions?.length) ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-purple-600" />
                        <span>Definitions & Flashcards for {selectedMaterialForNotes.title}</span>
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        Isolated to this course file ({selectedMaterialForNotes.courseCode || selectedMaterialForNotes.subject})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(currentNotes?.definitions || selectedMaterialForNotes.definitions || [])
                        .filter(
                          (def: any) =>
                            def?.term &&
                            def?.definition &&
                            !/uploaded study file/i.test(def.term) &&
                            !/uploaded study file/i.test(def.definition)
                        )
                        .map((def: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] space-y-1.5 hover:border-purple-300 transition"
                          >
                            <div className="flex items-center justify-between">
                              <CleanFormattedText
                                as="span"
                                content={def.term}
                                className="text-xs font-bold text-purple-700 block"
                              />
                              <span className="text-[9px] text-slate-400 font-semibold">Term #{idx + 1}</span>
                            </div>
                            <div className="text-xs text-slate-600 leading-relaxed">
                              <CleanFormattedText content={def.definition} />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : null}

                {/* Personal Notes */}
                <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E8E5DD] space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Personal Annotations</span>
                    </h3>
                    {!isEditingPersonalNotes ? (
                      <button
                        onClick={() => {
                          setPersonalNotesDraft(currentNotes?.personalNotes || "");
                          setIsEditingPersonalNotes(true);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                      >
                        Edit Notes
                      </button>
                    ) : (
                      <button
                        onClick={handleSavePersonalNotes}
                        className="text-xs text-emerald-600 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                    )}
                  </div>

                  {isEditingPersonalNotes ? (
                    <textarea
                      value={personalNotesDraft}
                      onChange={(e) => setPersonalNotesDraft(e.target.value)}
                      rows={3}
                      placeholder="Jot down personal exam reminders, questions or notes..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD9CE] text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-xs text-slate-600 italic">
                      <CleanFormattedText
                        content={currentNotes?.personalNotes || "No personal notes added yet. Click 'Edit Notes' to jot down remarks."}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-white border border-[#DDD9CE] text-center">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Select a deck on the left to read structured notes.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
