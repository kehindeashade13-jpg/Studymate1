import React, { useState, useEffect } from "react";
import { useStudy } from "../context/StudyContext";
import { UniversalContentRenderer } from "./UniversalContentRenderer";
import {
  Search,
  BookOpen,
  Brain,
  HelpCircle,
  GraduationCap,
  Users2,
  ArrowRight,
  X,
} from "lucide-react";

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    materials,
    setActiveMaterial,
    setActiveTab,
    studyGroups,
    setActiveGroup,
  } = useStudy();

  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const filteredMaterials = materials.filter(
    (m) =>
      m.title.toLowerCase().includes(query.toLowerCase()) ||
      m.subject.toLowerCase().includes(query.toLowerCase()) ||
      m.summary.toLowerCase().includes(query.toLowerCase())
  );

  const filteredGroups = studyGroups.filter(
    (g) =>
      g.name.toLowerCase().includes(query.toLowerCase()) ||
      g.subject.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 pt-20 animate-in fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, flashcards, step lessons, study groups..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Stream */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4 text-xs">
          {/* Materials Section */}
          {filteredMaterials.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                Study Materials & Notes
              </span>
              <div className="space-y-1">
                {filteredMaterials.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setActiveMaterial(m);
                      setActiveTab("library");
                      setIsSearchOpen(false);
                    }}
                    className="p-2.5 rounded-xl hover:bg-slate-800/80 flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="font-semibold text-white">
                          <UniversalContentRenderer as="span" content={m.title} inline />
                        </p>
                        <p className="text-[10px] text-slate-400">
                          <UniversalContentRenderer as="span" content={m.subject} inline />
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Study Groups Section */}
          {filteredGroups.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                Study Circles & Groups
              </span>
              <div className="space-y-1">
                {filteredGroups.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => {
                      setActiveGroup(g);
                      setActiveTab("groups");
                      setIsSearchOpen(false);
                    }}
                    className="p-2.5 rounded-xl hover:bg-slate-800/80 flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users2 className="w-4 h-4 text-purple-400" />
                      <div>
                        <p className="font-semibold text-white">{g.name}</p>
                        <p className="text-[10px] text-slate-400">{g.subject}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredMaterials.length === 0 && filteredGroups.length === 0 && (
            <div className="py-8 text-center text-slate-400">
              No results found for "{query}".
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Press ESC to close</span>
          <span>Tip: Use Cmd+K / Ctrl+K anywhere</span>
        </div>
      </div>
    </div>
  );
};
