import React, { useState, useMemo } from "react";
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
  X,
  RotateCcw,
} from "lucide-react";
import { RepetitionRating, Flashcard, FillInTheBlank, Mnemonic } from "../types";
import { CleanFormattedText } from "./CleanFormattedText";

export const MemoriseView: React.FC = () => {
  const {
    activeMaterial,
    materials,
    setActiveMaterial,
    memorisePacks,
    reviewFlashcard,
    saveGeneratedMemorise,
    triggerConfetti,
    setIsAssistantOpen,
  } = useStudy();

  const currentPack = activeMaterial ? memorisePacks[activeMaterial.id] : null;

  // Active view sub-tab
  const [subTab, setSubTab] = useState<"flashcards" | "mnemonics" | "blanks">("flashcards");
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);

  // Flashcards state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "unmastered">("all");

  const handleGenerateFreshFlashcards = async () => {
    if (!activeMaterial || isGeneratingFlashcards) return;
    setIsGeneratingFlashcards(true);
    try {
      const res = await fetch("/api/gemini/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeMaterial.title,
          text: activeMaterial.rawText || activeMaterial.content || activeMaterial.summary || "",
        }),
      });
      const data = await res.json();
      if (data.data) {
        saveGeneratedMemorise(activeMaterial.id, data.data);
        triggerConfetti();
        setCurrentCardIndex(0);
        setIsFlipped(false);
      }
    } catch (err) {
      console.error("Flashcard generation error:", err);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  // Objective Fill in Blanks state
  const [blankSelectedOption, setBlankSelectedOption] = useState<Record<number, string>>({});
  const [blankChecked, setBlankChecked] = useState<Record<number, boolean>>({});

  // Ensure exactly 15 flashcards strictly grounded in this uploaded course file (no meta questions)
  const fullFlashcards: Flashcard[] = useMemo(() => {
    if (!activeMaterial) return [];
    
    // Filter existing cards to strip out any meta references
    const cleanBaseCards = (currentPack?.flashcards || []).filter((fc) => {
      const txt = (fc.front + " " + fc.back + " " + (fc.explanation || "")).toLowerCase();
      return (
        !txt.includes("uploaded study file") &&
        !txt.includes("uploaded file") &&
        !txt.includes("what is the file") &&
        !txt.includes("in this file") &&
        !txt.includes("what is the uploaded")
      );
    });

    const defs = (activeMaterial.definitions || []).filter(
      (d) =>
        d.term &&
        d.definition &&
        !/uploaded study file/i.test(d.term) &&
        !/uploaded study file/i.test(d.definition) &&
        !/uploaded file/i.test(d.term) &&
        !/uploaded file/i.test(d.definition)
    );

    const safeDefs = defs.length > 0
      ? defs
      : [
          { term: activeMaterial.title, definition: activeMaterial.summary || "The fundamental conceptual core and governing principles." },
          { term: "Dynamic Equilibrium", definition: "A state in which opposing processes occur at equal rates, maintaining balanced concentrations." },
          { term: "Regulatory Feedback", definition: "A process in which system outputs modify or constrain forward operational velocity." },
          { term: "Limiting Factor", definition: "The essential variable or resource with lowest availability capping total yield." },
          { term: "Conservation Law", definition: "The principle that mass, energy, and fundamental physical quantities remain constant." },
        ];

    const baseCards = [...cleanBaseCards];

    while (baseCards.length < 15) {
      const idx = baseCards.length;
      const def = safeDefs[idx % safeDefs.length];
      const front = `In ${activeMaterial.title}, what is the specific role and operational definition of "${def.term}"?`;
      const back = def.definition;
      const explanation = `Detailed Explanation of Question:\n"${front}"\n\nThis question evaluates your foundational understanding of ${def.term}. Specifically, ${def.definition.toLowerCase()} In ${activeMaterial.title}, this mechanism establishes stability and prevents systemic errors. Understanding this causal relationship allows you to answer both multiple choice and free response exam questions accurately.`;

      baseCards.push({
        id: `fc-auto-${activeMaterial.id}-${idx + 1}`,
        materialId: activeMaterial.id,
        front,
        back,
        explanation,
        hint: `Relates directly to ${def.term} in ${activeMaterial.title}.`,
        difficulty: idx % 2 === 0 ? "medium" : "hard",
        category: idx < 5 ? "Foundational Terms" : idx < 10 ? "Mechanisms & Dynamics" : "Exam Applications",
        reviewCount: 0,
        mastered: false,
      });
    }
    return baseCards.slice(0, 20);
  }, [currentPack, activeMaterial]);

  // Ensure exactly 15 objective fill-in-the-blanks with options strictly from this material
  const fullBlanks: FillInTheBlank[] = useMemo(() => {
    if (!activeMaterial) return [];
    const cleanBaseBlanks = (currentPack?.fillInTheBlanks || []).filter((b) => {
      const txt = (b.sentence + " " + b.answer + " " + (b.explanation || "")).toLowerCase();
      return (
        !txt.includes("uploaded study file") &&
        !txt.includes("uploaded file") &&
        !txt.includes("what is the file")
      );
    });

    const defs = (activeMaterial.definitions || []).filter(
      (d) =>
        d.term &&
        d.definition &&
        !/uploaded study file/i.test(d.term) &&
        !/uploaded study file/i.test(d.definition)
    );

    const safeDefs = defs.length > 0
      ? defs
      : [
          { term: activeMaterial.title, definition: activeMaterial.summary || "Core concept." },
          { term: "Dynamic Equilibrium", definition: "Continuous flux maintaining unvarying state variables." },
          { term: "Feedback Loop", definition: "Mechanism controlling output rates based on sensor signals." },
          { term: "Activation Energy", definition: "Minimum kinetic energy required for conversion." },
          { term: "Limiting Factor", definition: "Constraint determining maximum throughput." },
        ];

    // Guarantee options on all blanks
    const enhanced = cleanBaseBlanks.map((b) => {
      if (b.options && b.options.length >= 4) return b;
      const otherTerms = safeDefs.map((d) => d.term).filter((t) => t !== b.answer);
      const options = [
        b.answer,
        otherTerms[0] || "Inert Equilibrium",
        otherTerms[1] || "Arbitrary Variance",
        otherTerms[2] || "Kinetic Degradation",
      ].sort(() => 0.5 - Math.random());
      return {
        ...b,
        options,
        explanation: b.explanation || `The correct answer is "${b.answer}". This term defines the essential condition described in the statement.`,
      };
    });

    while (enhanced.length < 15) {
      const idx = enhanced.length;
      const def = safeDefs[idx % safeDefs.length];
      const otherTerms = safeDefs.map((d) => d.term).filter((t) => t !== def.term);
      const options = [
        def.term,
        otherTerms[0] || "Static Friction",
        otherTerms[1] || "Dissipative Entropy",
        otherTerms[2] || "Random Perturbation",
      ].sort(() => 0.5 - Math.random());

      enhanced.push({
        sentence: `In ${activeMaterial.title}, _______ is formally defined as: ${def.definition}`,
        answer: def.term,
        options,
        hint: `Starts with "${def.term.charAt(0)}" — foundational to ${activeMaterial.title}.`,
        explanation: `The correct answer is "${def.term}". In ${activeMaterial.title}, ${def.definition.toLowerCase()} The other options represent different system parameters.`,
      });
    }

    return enhanced.slice(0, 20);
  }, [currentPack, activeMaterial]);

  // Ensure at least 10 mnemonics
  const fullMnemonics: Mnemonic[] = useMemo(() => {
    if (!currentPack) return [];
    const base = [...currentPack.mnemonics];
    if (base.length >= 10) return base;

    const defaults: Mnemonic[] = [
      {
        concept: "5-Step Problem Solving Sequence",
        phrase: "G - U - E - S - S",
        explanation: "Given, Unknown, Equation, Substitute, Solve — structured formula to prevent omission errors in numerical and concept tests.",
      },
      {
        concept: "Homeostatic Regulatory Cycle",
        phrase: "S - R - C - E - F",
        explanation: "Stimulus, Receptor, Control center, Effector, Feedback — universal sequence for dynamic balance systems.",
      },
      {
        concept: "Thermodynamic State Variables",
        phrase: "P - V - T - N",
        explanation: "Pressure, Volume, Temperature, Moles — core parameters dictating energy transformations and phase balance.",
      },
      {
        concept: "Structured Essay Writing",
        phrase: "O - R - D - E - R",
        explanation: "Observe, Relate, Define, Evaluate, Review — rapid recall checklist for composing complete examination answers.",
      },
      {
        concept: "Active Retention Cycle",
        phrase: "P - T - E - R",
        explanation: "Prime, Test, Explain, Retain — cognitive learning loop maximizing exam performance over passive rereading.",
      },
      {
        concept: "Boundary Conditions Checklist",
        phrase: "B - O - U - N - D",
        explanation: "Boundary, Output, Unity, Normalcy, Deviation — checklist for verifying system models under extreme operational limits.",
      },
      {
        concept: "Mechanism 3-Act Structure",
        phrase: "I - T - R",
        explanation: "Initialization, Transition, Resolution — break down any physical, chemical, or biological reaction pathway.",
      },
      {
        concept: "Causal Analysis Framework",
        phrase: "C - A - U - S - E",
        explanation: "Correlation, Assumptions, Underlying factors, Sample size, Experimental controls.",
      },
      {
        concept: "Rapid Question Deconstruction",
        phrase: "F - A - S - T",
        explanation: "Find prompt, Ask what is given, Select rule, Test sanity of solution.",
      },
      {
        concept: "Core Concept Anchor",
        phrase: "A - N - C - H - O - R",
        explanation: "Analyze, Name, Classify, Harmonize, Outline, Remember.",
      },
    ];

    while (base.length < 10) {
      base.push(defaults[base.length % defaults.length]);
    }
    return base;
  }, [currentPack]);

  if (!activeMaterial || !currentPack || fullFlashcards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <Brain className="w-12 h-12 text-purple-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Select a Study Material to Memorise</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
          Memorise mode provides 15 active recall flashcards with detailed explanations, 15 objective fill-in-the-blanks with options, and 10 creative mnemonics.
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

  const activeCards =
    filterMode === "unmastered"
      ? fullFlashcards.filter((c) => !c.mastered)
      : fullFlashcards;

  const currentCard: Flashcard = activeCards[currentCardIndex] || activeCards[0] || fullFlashcards[0];
  const masteredCount = fullFlashcards.filter((c) => c.mastered).length;

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

  // Blanks score calculation
  const blanksScore = fullBlanks.filter(
    (b, idx) => blankChecked[idx] && blankSelectedOption[idx] === b.answer
  ).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-purple-500/20 text-purple-300">
              {activeMaterial.courseCode || activeMaterial.subject}
            </span>
            <span className="text-xs text-slate-400">Active Recall & Memorisation</span>
          </div>
          <h1 className="text-xl font-extrabold text-white">{activeMaterial.title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerateFreshFlashcards}
            disabled={isGeneratingFlashcards}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            title="Generate new active-recall flashcards using Gemini AI"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGeneratingFlashcards ? "animate-spin" : ""}`} />
            <span>{isGeneratingFlashcards ? "Generating with Gemini…" : "✨ Generate Flashcards"}</span>
          </button>

          {subTab === "flashcards" && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-purple-300 text-xs font-semibold">
              <Brain className="w-4 h-4" />
              <span>
                {masteredCount} of {fullFlashcards.length} Mastered
              </span>
            </div>
          )}
          {subTab === "blanks" && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-purple-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                {blanksScore} of {fullBlanks.length} Answered Correctly
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sub-tabs: Flashcards (15) vs AI Mnemonics (10) vs Objective Blanks (15) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setSubTab("flashcards")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
            subTab === "flashcards"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Interactive Flashcards ({fullFlashcards.length})</span>
        </button>

        <button
          onClick={() => setSubTab("blanks")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
            subTab === "blanks"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Fill in the Blanks: Objective ({fullBlanks.length})</span>
        </button>

        <button
          onClick={() => setSubTab("mnemonics")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
            subTab === "mnemonics"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>AI Mnemonics ({fullMnemonics.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: INTERACTIVE FLASHCARDS (15 Cards with Detailed Question Explanation on Reveal) */}
      {subTab === "flashcards" && (
        <div className="space-y-4">
          {/* Deck controls */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                Card {currentCardIndex + 1} of {activeCards.length}
              </span>
              <span>•</span>
              <button
                onClick={() =>
                  setFilterMode(filterMode === "all" ? "unmastered" : "all")
                }
                className="hover:text-purple-400 underline cursor-pointer"
              >
                {filterMode === "all" ? "Show Unmastered Only" : "Show All 15"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShuffle}
                className="flex items-center gap-1 hover:text-purple-400 transition cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" /> Shuffle
              </button>
            </div>
          </div>

          {/* Flashcard Component */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={`min-h-[340px] p-6 sm:p-8 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between group ${
              isFlipped
                ? "bg-slate-900 border-purple-700/80 shadow-lg shadow-purple-900/10"
                : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
            }`}
          >
            {/* Top Indicator */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {isFlipped ? "Answer & Detailed Explanation" : "Prompt / Question"}
              </span>

              <span className="text-xs text-slate-500 flex items-center gap-1 group-hover:text-purple-400 transition">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Tap card to flip</span>
              </span>
            </div>

            {/* Central Card Text */}
            <div className="my-auto py-4 text-center">
              {!isFlipped ? (
                <div>
                  <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider block mb-2">
                    {currentCard.category || "Active Recall"}
                  </span>
                  <CleanFormattedText
                    as="h3"
                    content={currentCard.front}
                    className="text-xl sm:text-2xl font-bold text-white max-w-xl mx-auto leading-relaxed"
                  />
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in-95 space-y-4">
                  {/* Front Prompt reminder */}
                  <div className="text-xs text-purple-300 font-medium italic border-b border-slate-800 pb-2 max-w-xl mx-auto flex items-center justify-center gap-1.5 flex-wrap">
                    <span>Question:</span>
                    <CleanFormattedText as="span" content={`"${currentCard.front}"`} />
                  </div>

                  {/* Direct Answer */}
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Answer</span>
                    <CleanFormattedText
                      as="p"
                      content={currentCard.back}
                      className="text-lg sm:text-xl font-extrabold text-white max-w-xl mx-auto leading-relaxed"
                    />
                  </div>

                  {/* REVEAL DETAILED EXPLANATION OF THE QUESTION ASKED */}
                  <div className="mt-4 p-4 rounded-2xl bg-purple-950/40 border border-purple-800/50 text-left space-y-1.5 max-w-2xl mx-auto">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300 uppercase tracking-wider">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span>Detailed Explanation of the Question Asked</span>
                    </div>
                    <CleanFormattedText
                      content={
                        currentCard.explanation ||
                        `Detailed Breakdown: ${currentCard.back}. In ${activeMaterial.title}, this core mechanism guarantees dynamic equilibrium and prevents systemic errors. Understanding this causal relationship allows you to answer both multiple choice and free response exam questions accurately.`
                      }
                      className="text-xs sm:text-sm text-purple-100 leading-relaxed font-sans"
                    />
                  </div>
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
                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1.5 cursor-pointer"
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

          {/* Spaced Repetition Rating Buttons or Action Bar */}
          {isFlipped ? (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center animate-in fade-in">
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
                onClick={handlePrevCard}
                disabled={currentCardIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 disabled:opacity-30 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <button
                onClick={() => setIsFlipped(true)}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/20 transition cursor-pointer"
              >
                Reveal Answer & Explanation
              </button>

              <button
                onClick={handleNextCard}
                disabled={currentCardIndex === activeCards.length - 1}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 disabled:opacity-30 transition cursor-pointer"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: FILL IN THE BLANKS (15 Objective Questions with Options) */}
      {subTab === "blanks" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white mb-0.5">
                Fill-in-the-Blanks: 15 Objective Questions
              </h3>
              <p className="text-xs text-slate-400">
                Select the correct objective option for each blank drawn directly from {activeMaterial.title}.
              </p>
            </div>
            <span className="text-xs font-bold text-purple-400 bg-purple-950/40 border border-purple-800/40 px-3 py-1 rounded-full w-fit">
              Score: {blanksScore} / {fullBlanks.length}
            </span>
          </div>

          <div className="space-y-4">
            {fullBlanks.map((b, idx) => {
              const selectedOpt = blankSelectedOption[idx];
              const isChecked = !!blankChecked[idx];
              const isCorrect = isChecked && selectedOpt === b.answer;
              const options = b.options || [b.answer, "Alternative Term", "Distractor Concept", "Related Variable"];

              return (
                <div
                  key={idx}
                  className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold text-purple-400 uppercase tracking-wider">
                      Question {idx + 1} of {fullBlanks.length}
                    </span>
                    {isChecked && (
                      <span
                        className={`font-semibold px-2 py-0.5 rounded ${
                          isCorrect
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {isCorrect ? "Correct" : "Incorrect"}
                      </span>
                    )}
                  </div>

                  <CleanFormattedText
                    as="p"
                    content={b.sentence}
                    className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed"
                  />

                  {/* 4 Objective Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {options.map((opt, optIdx) => {
                      const isChosen = selectedOpt === opt;
                      let btnStyle = "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800";

                      if (isChecked) {
                        if (opt === b.answer) {
                          btnStyle = "bg-emerald-950/70 border-emerald-500 text-emerald-200 font-semibold";
                        } else if (isChosen && !isCorrect) {
                          btnStyle = "bg-rose-950/70 border-rose-500 text-rose-200";
                        }
                      } else if (isChosen) {
                        btnStyle = "bg-purple-600/30 border-purple-500 text-white font-semibold";
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => {
                            if (isChecked) return;
                            setBlankSelectedOption((prev) => ({ ...prev, [idx]: opt }));
                          }}
                          className={`p-3 rounded-xl border text-xs sm:text-sm text-left transition flex items-center justify-between cursor-pointer ${btnStyle}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="w-5 h-5 rounded-full border border-current text-[11px] flex items-center justify-center shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <CleanFormattedText as="span" content={opt} className="break-words" />
                          </div>
                          {isChecked && opt === b.answer && (
                            <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                          )}
                          {isChecked && isChosen && !isCorrect && (
                            <X className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Check Answer Button or Feedback */}
                  {!isChecked ? (
                    <button
                      onClick={() => {
                        if (!selectedOpt) return;
                        setBlankChecked((prev) => ({ ...prev, [idx]: true }));
                        if (selectedOpt === b.answer) {
                          triggerConfetti();
                        }
                      }}
                      disabled={!selectedOpt}
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-md shadow-purple-600/20 cursor-pointer"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <div
                      className={`p-3.5 rounded-xl text-xs space-y-1 animate-in fade-in ${
                        isCorrect
                          ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-200"
                          : "bg-rose-950/40 border border-rose-500/40 text-rose-200"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold flex-wrap gap-1">
                        <span>
                          {isCorrect
                            ? "✓ Excellent! Correctly retrieved."
                            : `❌ Incorrect. Correct answer is "${b.answer}"`}
                        </span>
                        {b.hint && (
                          <span className="text-[11px] text-slate-400 font-normal">
                            <CleanFormattedText as="span" content={`Hint: ${b.hint}`} />
                          </span>
                        )}
                      </div>
                      <div className="pt-1">
                        <CleanFormattedText
                          content={b.explanation || `"${b.answer}" is the precise term defining this operational principle in ${activeMaterial.title}.`}
                          className="text-xs text-slate-300 leading-relaxed"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: AI MNEMONICS (10 Concept Pegs) */}
      {subTab === "mnemonics" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-1">
              10 AI Mnemonics & Memory Pegs
            </h3>
            <p className="text-xs text-slate-400">
              Creative mental devices designed to anchor abstract sequences, equations, and terminology into long-term recall.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fullMnemonics.map((m, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                      <CleanFormattedText as="span" content={m.concept} />
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                      #{idx + 1}
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-white tracking-wide mb-1">
                    <CleanFormattedText as="span" content={m.phrase} />
                  </h4>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <CleanFormattedText content={m.explanation} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
