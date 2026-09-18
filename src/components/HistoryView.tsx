import React, { useState } from "react";
import { useStudy } from "../context/StudyContext";
import {
  Clock,
  FileText,
  Upload,
  Calendar,
  Sparkles,
  BookOpen,
  Brain,
  HelpCircle,
  GraduationCap,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle,
} from "lucide-react";
import { StudyMaterial } from "../types";

export const HistoryView: React.FC = () => {
  const {
    materials,
    setActiveMaterial,
    setActiveTab,
    deleteMaterial,
    openAddMaterialModal,
    triggerConfetti,
  } = useStudy();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("All");

  const filteredMaterials = materials.filter((mat) => {
    const matchQuery =
      mat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mat.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mat.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSubject = selectedSubject === "All" || mat.subject === selectedSubject;
    return matchQuery && matchSubject;
  });

  const handleStudy = (mat: StudyMaterial, mode: "learn" | "memorise" | "quizzes" | "library") => {
    setActiveMaterial(mat);
    setActiveTab(mode);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from your upload history?`)) {
      deleteMaterial(id);
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case "photo":
        return "📷 Photo / Scan";
      case "youtube":
        return "▶️ YouTube";
      case "deck":
        return "📊 Slides / Deck";
      case "record":
        return "🎙️ Voice / Audio";
      case "quizlet":
        return "🗂️ Quizlet";
      default:
        return "📄 Document Upload";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 bg-white text-[#0A1931]">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-6 h-6 text-[#0A1931]" />
            <h1 className="text-2xl sm:text-3xl font-black text-[#0A1931] tracking-tight">
              <b>HISTORY</b>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#1B2A4A]/70">
            All documents, lecture notes, textbook scans, and materials you have uploaded so far.
          </p>
        </div>

        <button
          id="history-upload-btn"
          onClick={() => openAddMaterialModal("upload")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition shadow-xs shrink-0 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New Document</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search uploaded documents by title, keyword, or course..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:border-[#0A1931] shadow-2xs"
          />
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="w-full sm:w-48 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-[#0A1931] focus:outline-none focus:border-[#0A1931] cursor-pointer"
        >
          <option value="All">All Subjects</option>
          <option value="Biology">Biology</option>
          <option value="Mathematics">Mathematics</option>
          <option value="Chemistry">Chemistry</option>
          <option value="Physics">Physics</option>
          <option value="History">History</option>
          <option value="Computer Science">Computer Science</option>
          <option value="English">English</option>
          <option value="Business">Business</option>
          <option value="Psychology">Psychology</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Documents Uploaded History List */}
      {filteredMaterials.length === 0 ? (
        <div className="w-full min-h-[360px] flex items-center justify-center p-8 bg-white border border-dashed border-slate-300 rounded-3xl text-center">
          <div className="max-w-md space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-[#0A1931] flex items-center justify-center mx-auto border border-slate-200">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-[#0A1931]">No documents found</h3>
            <p className="text-xs text-[#1B2A4A]/70">
              {materials.length === 0
                ? "You haven't uploaded any documents or study materials yet. Import your first document to see its full history here."
                : "No uploaded documents match your current filter."}
            </p>
            <button
              onClick={() => openAddMaterialModal("upload")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition shadow-xs cursor-pointer mt-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#0A1931] uppercase tracking-wider">
              Uploaded Documents ({filteredMaterials.length})
            </span>
            <span className="text-xs text-[#1B2A4A]/60">Ordered by upload date</span>
          </div>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs">
            {filteredMaterials.map((mat) => {
              const cardCount = mat.definitions?.length || 10;
              const questionCount = mat.potentialExamQuestions?.length || 5;

              return (
                <div
                  key={mat.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/60 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left: Document Info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#0A1931] border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-[#0A1931] border border-slate-200">
                          {mat.subject}
                        </span>
                        <span className="text-[10px] font-semibold text-[#1B2A4A]/70 px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                          {getSourceIcon(mat.sourceType)}
                        </span>
                        <span className="text-[10px] text-[#1B2A4A]/60 flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3" />
                          <span>Uploaded: {mat.dateAdded || "Recent"}</span>
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-extrabold text-[#0A1931] truncate">
                        {mat.title}
                      </h3>

                      <p className="text-xs text-[#1B2A4A]/70 line-clamp-2 leading-relaxed">
                        {mat.summary || mat.rawText?.slice(0, 160) || "Uploaded document text ready for study."}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[#1B2A4A]/70">
                        <span className="font-semibold text-[#0A1931]">{cardCount} flashcards</span>
                        <span>•</span>
                        <span className="font-semibold text-[#0A1931]">{questionCount} quiz questions</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">
                          {mat.progressPercent}% mastered
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <button
                      onClick={() => handleStudy(mat, "learn")}
                      className="px-3 py-1.5 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Step Lessons"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Study</span>
                    </button>

                    <button
                      onClick={() => handleStudy(mat, "memorise")}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0A1931] text-xs font-bold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                      title="Flashcards"
                    >
                      <Brain className="w-3.5 h-3.5" />
                      <span>Flashcards</span>
                    </button>

                    <button
                      onClick={() => handleStudy(mat, "quizzes")}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0A1931] text-xs font-bold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                      title="Quiz"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Quiz</span>
                    </button>

                    <button
                      onClick={() => handleDelete(mat.id, mat.title)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Delete uploaded document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
