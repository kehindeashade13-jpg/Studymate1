import React, { useState } from "react";
import { useStudy } from "../context/StudyContext";
import {
  Brain,
  Sparkles,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Eye,
  Check,
  Award,
  Zap,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  ListOrdered,
  Layers,
} from "lucide-react";
import { RepetitionRating, Flashcard } from "../types";

export const MemoriseView: React.FC = () => {
  const {
    activeMaterial,
    materials,
    setActiveMaterial,
    memorisePacks,
    reviewFlashcard,
    triggerConfetti,
    setIsAssistantOpen,
  } = useStudy();

  const currentPack = activeMaterial ? memorisePacks[activeMaterial.id] : null;

  // Active view sub-tab
  const [subTab, setSubTab] = useState<"flashcards" | "mnemonics" | "blanks">("flashcards");

  // Flashcards state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "unmastered">("all");

  // Fill in blanks state
  const [blankAnswers, setBlankAnswers] = useState<Record<number, string>>({});
  const [checkedBlanks, setCheckedBlanks] = useState<Record<number, boolean>>({});

  if (!activeMaterial || !currentPack || currentPack.flashcards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <Brain className="w-12 h-12 text-purple-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Select a Study Material to Memorise</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
          Memorise mode provides active recall flashcards, spaced repetition difficulty ratings, and creative mnemonics.
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

  const flashcards = currentPack.flashcards;
  const activeCards =
    filterMode === "unmastered"
      ? flashcards.filter((c) => !c.mastered)
      : flashcards;

  const currentCard: Flashcard = activeCards[currentCardIndex] || activeCards[0] || flashcards[0];
  const masteredCount = flashcards.filter((c) => c.mastered).length;

  const handleRating = (rating: RepetitionRating) => {
    if (!activeMaterial) return;
    reviewFlashcard(activeMaterial.id, currentCard.id, rating);

    if (rating === "easy" || rating === "good") {
      triggerConfetti();
    }

    // Move to next card
    if (currentCardIndex < activeCards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      // Reached end of deck
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handleNextCard = () => {
    if (currentCardIndex < activeCards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handleShuffle = () => {
    setCurrentCardIndex(Math.floor(Math.random() * activeCards.length));
    setIsFlipped(false);
    setShowHint(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-purple-500/20 text-purple-300">
              {activeMaterial.subject}
            </span>
            <span className="text-xs text-slate-400">Active Recall & Memorisation</span>
          </div>
          <h1 className="text-xl font-extrabold text-white">{activeMaterial.title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-purple-300 text-xs font-semibold">
            <Brain className="w-4 h-4" />
            <span>
              {masteredCount} of {flashcards.length} Mastered
            </span>
          </div>
        </div>
      </div>

      {/* Sub-tabs: Flashcards vs Mnemonics vs Fill-in-Blanks */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setSubTab("flashcards")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            subTab === "flashcards"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Interactive Flashcards ({flashcards.length})</span>
        </button>

        <button
          onClick={() => setSubTab("mnemonics")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            subTab === "mnemonics"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>AI Mnemonics ({currentPack.mnemonics?.length || 0})</span>
        </button>

        <button
          onClick={() => setSubTab("blanks")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            subTab === "blanks"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Fill-in-the-Blanks ({currentPack.fillInTheBlanks?.length || 0})</span>
        </button>
      </div>

      {/* SUB-TAB 1: FLASHCARDS */}
      {subTab === "flashcards" && (
        <div className="space-y-6">
          {/* Card Tools Strip */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>Card {currentCardIndex + 1} of {activeCards.length}</span>
              <button
                onClick={handleShuffle}
                className="p-1 rounded hover:bg-slate-800 hover:text-white text-slate-400 transition"
                title="Shuffle Deck"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterMode(filterMode === "all" ? "unmastered" : "all")}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition ${
                  filterMode === "unmastered"
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                {filterMode === "unmastered" ? "Showing Needs Practice" : "Filter: All Cards"}
              </button>
            </div>
          </div>

          {/* Interactive Flip Card Stage */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[300px] sm:min-h-[340px] p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border-2 border-slate-700/80 hover:border-purple-500/60 shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between select-none relative group"
          >
            {/* Top Indicator */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {isFlipped ? "Answer / Explanation" : "Prompt / Question"}
              </span>

              <span className="text-xs text-slate-500 flex items-center gap-1 group-hover:text-purple-400 transition">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Tap card to flip</span>
              </span>
            </div>

            {/* Central Card Text */}
            <div className="my-auto py-6 text-center">
              {!isFlipped ? (
                <div>
                  <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider block mb-2">
                    {currentCard.category || "Active Recall"}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white max-w-xl mx-auto leading-relaxed">
                    {currentCard.front}
                  </h3>
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in-95">
                  <p className="text-lg sm:text-xl font-semibold text-purple-100 max-w-xl mx-auto leading-relaxed">
                    {currentCard.back}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Hint Toggle */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
              {currentCard.hint ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHint(!showHint);
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1.5"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>{showHint ? `Hint: ${currentCard.hint}` : "Show Hint"}</span>
                </button>
              ) : (
                <div />
              )}

              {currentCard.mastered && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mastered
                </span>
              )}
            </div>
          </div>

          {/* Spaced Repetition Rating Buttons (Visible when card is flipped) */}
          {isFlipped ? (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center animate-in fade-in">
              <p className="text-xs font-semibold text-slate-300 mb-3">
                How well did you recall this answer?
              </p>
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                <button
                  onClick={() => handleRating("again")}
                  className="py-2.5 px-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span>Again</span>
                  <span className="text-[10px] text-rose-400/80">&lt; 1 min</span>
                </button>

                <button
                  onClick={() => handleRating("hard")}
                  className="py-2.5 px-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span>Hard</span>
                  <span className="text-[10px] text-amber-400/80">10 mins</span>
                </button>

                <button
                  onClick={() => handleRating("good")}
                  className="py-2.5 px-2 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 border border-blue-800/60 text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span>Good</span>
                  <span className="text-[10px] text-blue-400/80">1 day</span>
                </button>

                <button
                  onClick={() => handleRating("easy")}
                  className="py-2.5 px-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span>Easy</span>
                  <span className="text-[10px] text-emerald-400/80">3 days</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevStep => handlePrevCard()}
                disabled={currentCardIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 disabled:opacity-30 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <button
                onClick={() => setIsFlipped(true)}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/20 transition cursor-pointer"
              >
                Reveal Answer
              </button>

              <button
                onClick={handleNextCard}
                disabled={currentCardIndex === activeCards.length - 1}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 disabled:opacity-30 transition"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: MNEMONICS & MEMORY HOOKS */}
      {subTab === "mnemonics" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-1">
              AI Mnemonics & Mental Pegs
            </h3>
            <p className="text-xs text-slate-400">
              Memory devices designed to anchor abstract sequences and terminology into long-term recall.
            </p>
          </div>

          {(currentPack.mnemonics || []).map((m, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  {m.concept}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                  Mnemonic
                </span>
              </div>
              <h4 className="text-lg font-extrabold text-white">{m.phrase}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{m.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 3: FILL IN THE BLANKS */}
      {subTab === "blanks" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-1">
              Fill-in-the-Blanks Active Recall
            </h3>
            <p className="text-xs text-slate-400">
              Type the exact keyword to test retrieval fluency without multiple-choice cues.
            </p>
          </div>

          {(currentPack.fillInTheBlanks || []).map((b, idx) => {
            const userAnswer = blankAnswers[idx] || "";
            const isChecked = checkedBlanks[idx];
            const isCorrect =
              isChecked &&
              userAnswer.trim().toLowerCase() === b.answer.trim().toLowerCase();

            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <p className="text-sm text-slate-200 font-medium">{b.sentence}</p>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => {
                      setBlankAnswers((prev) => ({ ...prev, [idx]: e.target.value }));
                      setCheckedBlanks((prev) => ({ ...prev, [idx]: false }));
                    }}
                    placeholder="Type your answer here..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                  />

                  <button
                    onClick={() => {
                      setCheckedBlanks((prev) => ({ ...prev, [idx]: true }));
                      if (userAnswer.trim().toLowerCase() === b.answer.trim().toLowerCase()) {
                        triggerConfetti();
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shrink-0 cursor-pointer"
                  >
                    Check
                  </button>
                </div>

                {isChecked && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center justify-between ${
                      isCorrect
                        ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-300"
                        : "bg-rose-950/40 border border-rose-500/40 text-rose-300"
                    }`}
                  >
                    <span>
                      {isCorrect
                        ? "✓ Spot on! Correct retrieval."
                        : `❌ Correct answer was: "${b.answer}"`}
                    </span>
                    {b.hint && (
                      <span className="text-[11px] text-slate-400">Hint: {b.hint}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
